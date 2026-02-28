import os, smtplib, uuid
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from extensions import db
from models import WaterQuality, WeatherData, DiseaseCase, RiskLevel

reports_bp = Blueprint("reports", __name__)


# ─────────── helpers ────────────────────────────────────────────────────────────

def _water_status(wq):
    issues = []
    if wq["ph"] < 6.5 or wq["ph"] > 8.5:
        issues.append(f"pH {wq['ph']} (safe: 6.5–8.5)")
    if wq["turbidity"] > 4:
        issues.append(f"Turbidity {wq['turbidity']} NTU (safe: <1 NTU)")
    if wq["hardness"] > 300:
        issues.append(f"Hardness {wq['hardness']} mg/L (safe: <300 mg/L)")
    if wq["chloramines"] > 8:
        issues.append(f"Chloramines {wq['chloramines']} ppm (safe: <4 ppm)")
    if wq["trihalomethanes"] > 80:
        issues.append(f"Trihalomethanes {wq['trihalomethanes']} µg/L (safe: <80 µg/L)")
    return issues


def _risk_color(level: str) -> str:
    return {"Low": "green", "Medium": "orange", "High": "red", "Critical": "darkred"}.get(level, "gray")


def _build_report_payload(area_name: str):
    """Gather all DB data for a single area and return a structured report dict."""
    wq_row  = db.session.execute(
        select(WaterQuality).where(WaterQuality.area == area_name).order_by(WaterQuality.id.desc())
    ).scalars().first()
    wd_row  = db.session.execute(
        select(WeatherData).where(WeatherData.area == area_name).order_by(WeatherData.id.desc())
    ).scalars().first()
    dc_row  = db.session.execute(
        select(DiseaseCase).where(DiseaseCase.area == area_name).order_by(DiseaseCase.id.desc())
    ).scalars().first()
    rl_row  = db.session.execute(
        select(RiskLevel).where(RiskLevel.area == area_name).order_by(RiskLevel.id.desc())
    ).scalars().first()

    report = {
        "report_id":    f"JR-{uuid.uuid4().hex[:8].upper()}",
        "generated_at": datetime.utcnow().isoformat(),
        "area":         area_name,
        "risk": {
            "level": rl_row.level       if rl_row else "Unknown",
            "score": round(rl_row.score, 1) if rl_row else 0,
        },
        "water_quality": wq_row.to_dict() if wq_row else None,
        "weather":       wd_row.to_dict() if wd_row else None,
        "disease":       dc_row.to_dict() if dc_row else None,
        "water_issues": _water_status(wq_row.to_dict()) if wq_row else [],
        "flood_active": wd_row.flood_risk if wd_row else False,
    }
    return report


def _build_email_html(report: dict) -> str:
    """Render a full HTML email body for the area report."""
    area     = report["area"]
    level    = report["risk"]["level"]
    score    = report["risk"]["score"]
    color    = _risk_color(level)
    gen_at   = report["generated_at"][:19].replace("T", " ") + " UTC"
    rid      = report["report_id"]
    wq       = report.get("water_quality") or {}
    wd       = report.get("weather") or {}
    dc       = report.get("disease") or {}
    issues   = report.get("water_issues", [])

    issue_rows = "".join(f"<li style='color:#c0392b'>{i}</li>" for i in issues) if issues else "<li style='color:green'>All major parameters within safe range</li>"
    wq_table = ""
    if wq:
        params = [
            ("pH",             wq.get("ph","—"),            "6.5 – 8.5"),
            ("Turbidity (NTU)", wq.get("turbidity","—"),     "< 1 NTU"),
            ("Hardness (mg/L)", wq.get("hardness","—"),      "< 300 mg/L"),
            ("Chloramines (ppm)", wq.get("chloramines","—"), "< 4 ppm"),
            ("Trihalomethanes (µg/L)", wq.get("trihalomethanes","—"), "< 80 µg/L"),
            ("Conductivity",   wq.get("conductivity","—"),   "< 500 µS/cm"),
            ("Organic Carbon", wq.get("organic_carbon","—"), "< 2 mg/L"),
        ]
        wq_table = "<table style='width:100%;border-collapse:collapse;font-size:13px;'><tr style='background:#eaf0fb'><th style='padding:6px;border:1px solid #ccc;text-align:left'>Parameter</th><th style='padding:6px;border:1px solid #ccc'>Value</th><th style='padding:6px;border:1px solid #ccc'>Safe Range</th></tr>"
        for name, val, safe in params:
            wq_table += f"<tr><td style='padding:6px;border:1px solid #ccc'>{name}</td><td style='padding:6px;border:1px solid #ccc;text-align:center'>{val}</td><td style='padding:6px;border:1px solid #ccc;text-align:center;color:#555'>{safe}</td></tr>"
        wq_table += "</table>"

    disease_block = ""
    if dc:
        disease_block = f"""
        <h3 style='color:#6d28d9'>Disease Outbreak Data</h3>
        <table style='width:100%;border-collapse:collapse;font-size:13px;'>
          <tr style='background:#f3e8ff'>
            <td style='padding:6px;border:1px solid #ccc'>Disease</td><td style='padding:6px;border:1px solid #ccc'><b>{dc.get('disease','—')}</b></td>
          </tr>
          <tr><td style='padding:6px;border:1px solid #ccc'>Total Cases</td><td style='padding:6px;border:1px solid #ccc'>{dc.get('total_cases','—')}</td></tr>
          <tr style='background:#fef3c7'><td style='padding:6px;border:1px solid #ccc'>Active Cases</td><td style='padding:6px;border:1px solid #ccc;color:#b45309;font-weight:bold'>{dc.get('active_cases','—')}</td></tr>
          <tr><td style='padding:6px;border:1px solid #ccc'>Recovered</td><td style='padding:6px;border:1px solid #ccc;color:green'>{dc.get('recovered','—')}</td></tr>
          <tr style='background:#fee2e2'><td style='padding:6px;border:1px solid #ccc'>Deaths</td><td style='padding:6px;border:1px solid #ccc;color:#b91c1c;font-weight:bold'>{dc.get('deaths','—')}</td></tr>
        </table>"""

    climate_lines = []
    if wd:
        if wd.get("rainfall_mm", 0) > 50:
            climate_lines.append(f"Heavy rainfall ({wd['rainfall_mm']} mm) flushing surface contaminants")
        if wd.get("flood_risk"):
            climate_lines.append("Flood risk — sewage mixing with drinking water possible")
        if wd.get("humidity", 0) > 85:
            climate_lines.append(f"High humidity ({wd['humidity']}%) accelerating microbial growth")
        if wd.get("temperature", 0) > 30:
            climate_lines.append(f"High temperature ({wd['temperature']}°C) promoting bacterial growth")
    if not climate_lines:
        climate_lines.append("Seasonal weather changes affecting water source quality")

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset='utf-8'/></head>
<body style='font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#1a1a1a;'>
  <div style='background:linear-gradient(135deg,#1e3a5f,#0f2942);padding:24px 32px;border-radius:8px 8px 0 0;'>
    <h1 style='color:white;margin:0;font-size:22px;'>🌊 JalRaksha — Water Health Intelligence</h1>
    <p style='color:#7dd3fc;margin:4px 0 0;font-size:12px;'>Official Area Water Health Report</p>
  </div>

  <div style='background:#f0f4f8;padding:16px 32px;border-bottom:3px solid {color};'>
    <table style='width:100%;'>
      <tr>
        <td><h2 style='margin:0;color:#0f2942'>{area}</h2><p style='margin:4px 0 0;color:#555;font-size:12px;'>Report ID: {rid} &nbsp;|&nbsp; Generated: {gen_at}</p></td>
        <td style='text-align:right;'>
          <span style='background:{color};color:white;padding:6px 16px;border-radius:20px;font-weight:bold;font-size:15px;'>
            {level.upper()} RISK — {score}/100
          </span>
        </td>
      </tr>
    </table>
  </div>

  <div style='padding:24px 32px;background:white;'>
    <h3 style='color:#1e3a5f;border-bottom:2px solid #e2e8f0;padding-bottom:6px;'>1. Water Quality Analysis</h3>
    {wq_table if wq_table else "<p style='color:#888'>No water quality data available.</p>"}

    <h3 style='color:#dc2626;margin-top:24px;'>⚠ Parameter Violations</h3>
    <ul style='margin:8px 0;padding-left:20px;'>{issue_rows}</ul>
  </div>

  <div style='padding:0 32px 24px;background:white;'>
    <h3 style='color:#1e3a5f;border-bottom:2px solid #e2e8f0;padding-bottom:6px;'>2. Environmental / Weather Conditions</h3>
    {'<table style="font-size:13px;"><tr><td style="padding:4px 12px 4px 0;color:#555">Rainfall</td><td><b>' + str(wd.get('rainfall_mm','—')) + ' mm</b></td></tr><tr><td style="padding:4px 12px 4px 0;color:#555">Temperature</td><td><b>' + str(wd.get('temperature','—')) + ' °C</b></td></tr><tr><td style="padding:4px 12px 4px 0;color:#555">Humidity</td><td><b>' + str(wd.get('humidity','—')) + ' %</b></td></tr><tr><td style="padding:4px 12px 4px 0;color:#555">Flood Risk</td><td><b style="color:' + ('red' if wd.get('flood_risk') else 'green') + '">' + ('YES — ACTIVE' if wd.get('flood_risk') else 'No') + '</b></td></tr></table>' if wd else "<p style='color:#888'>No weather data.</p>"}

    <h4 style='color:#0369a1;margin-top:12px;'>Contributing Environmental Factors:</h4>
    <ul style='font-size:13px;'>{''.join(f"<li>{c}</li>" for c in climate_lines)}</ul>
  </div>

  <div style='padding:0 32px 24px;background:white;'>{disease_block}</div>

  <div style='padding:16px 32px 24px;background:#fffbeb;border-top:2px solid #fcd34d;'>
    <h3 style='color:#92400e;margin-top:0;'>3. Recommended Government Actions</h3>
    <ol style='font-size:13px;line-height:1.7;color:#1a1a1a;'>
      <li>Deploy mobile water testing units to {area} within <b>24 hours</b></li>
      <li>Issue a public advisory for residents to boil water before use</li>
      <li>Inspect and repair sewage infrastructure and open drains in the area</li>
      <li>Distribute ORS packets and water purification tablets at public centres</li>
      <li>Increase surveillance frequency for waterborne disease cases at local PHCs</li>
      <li>Coordinate with CMWSSB / TWAD Board for emergency water supply</li>
      <li>Activate rapid response teams if active disease cases exceed threshold</li>
    </ol>
  </div>

  <div style='padding:12px 32px;background:#1e3a5f;border-radius:0 0 8px 8px;text-align:center;'>
    <p style='color:#7dd3fc;font-size:11px;margin:0;'>
      🚨 Emergency: <b style='color:white'>108</b> &nbsp;|&nbsp;
      Disease Surveillance: <b style='color:white'>104</b> &nbsp;|&nbsp;
      Water Quality Helpline: <b style='color:white'>1800-180-5678</b>
    </p>
    <p style='color:#475569;font-size:10px;margin:4px 0 0;'>This report was auto-generated by JalRaksha Water Health Intelligence System</p>
  </div>
</body>
</html>"""
    return html


def _build_sms_text(report: dict) -> str:
    area   = report["area"]
    level  = report["risk"]["level"]
    score  = report["risk"]["score"]
    dc     = report.get("disease") or {}
    issues = report.get("water_issues", [])

    sms = (
        f"[JalRaksha ALERT] {area} — {level.upper()} RISK (Score: {score}/100)\n"
        f"Disease: {dc.get('disease','—')} | Active Cases: {dc.get('active_cases','—')}\n"
    )
    if issues:
        sms += f"Water Issues: {'; '.join(issues[:2])}\n"
    sms += (
        "PRECAUTIONS: Boil water before use. Wash hands with soap. Visit nearest PHC if unwell.\n"
        "Helpline: 1800-180-5678 | Emergency: 108"
    )
    return sms


# ─────────── routes ─────────────────────────────────────────────────────────────

@reports_bp.route("/area/<path:area_name>", methods=["GET"])
def get_area_report(area_name):
    report = _build_report_payload(area_name)
    return jsonify(report)


@reports_bp.route("/send-email", methods=["POST"])
def send_email():
    data      = request.get_json(force=True)
    area_name = data.get("area", "")
    recipients = data.get("recipients", [])   # list of email strings
    if not area_name or not recipients:
        return jsonify({"error": "area and recipients required"}), 400

    report    = _build_report_payload(area_name)
    html_body = _build_email_html(report)

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        # Return the report data so frontend can open email client as fallback
        return jsonify({
            "status": "smtp_not_configured",
            "message": "SMTP credentials not set. Use mailto fallback.",
            "subject": f"[JalRaksha] Water Health Report — {area_name} | {report['risk']['level']} Risk",
            "report": report,
            "html_preview": html_body[:500],
        }), 200

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[JalRaksha] Water Health Report — {area_name} | {report['risk']['level']} Risk"
        msg["From"]    = smtp_user
        msg["To"]      = ", ".join(recipients)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, recipients, msg.as_string())

        return jsonify({"status": "sent", "recipients": recipients, "report_id": report["report_id"]})
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500


@reports_bp.route("/send-sms", methods=["POST"])
def send_sms():
    data      = request.get_json(force=True)
    area_name = data.get("area", "")
    phones    = data.get("phones", [])   # list of E.164 strings e.g. +919876543210
    if not area_name:
        return jsonify({"error": "area required"}), 400

    report   = _build_report_payload(area_name)
    sms_text = _build_sms_text(report)

    account_sid  = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token   = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number  = os.getenv("TWILIO_FROM", "")

    if not account_sid or not auth_token or not from_number:
        return jsonify({
            "status": "twilio_not_configured",
            "message": "Twilio credentials not set in .env",
            "sms_preview": sms_text,
            "report_id": report["report_id"],
        }), 200

    try:
        from twilio.rest import Client
        client  = Client(account_sid, auth_token)
        results = []
        for phone in phones:
            msg = client.messages.create(body=sms_text, from_=from_number, to=phone)
            results.append({"phone": phone, "sid": msg.sid, "status": msg.status})
        return jsonify({"status": "sent", "results": results, "report_id": report["report_id"]})
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500


@reports_bp.route("/broadcast", methods=["POST"])
def broadcast():
    """Send both email + SMS in one call."""
    data        = request.get_json(force=True)
    area_name   = data.get("area", "")
    email_to    = data.get("email_to", [])
    sms_to      = data.get("sms_to", [])

    results = {}
    if email_to:
        with reports_bp.open_resource(""):  # noop — just use internal helpers
            pass
        try:
            import requests as req
            r = req.post(
                "http://127.0.0.1:5000/api/reports/send-email",
                json={"area": area_name, "recipients": email_to},
                timeout=15,
            )
            results["email"] = r.json()
        except Exception as e:
            results["email"] = {"error": str(e)}
    if sms_to:
        try:
            import requests as req
            r = req.post(
                "http://127.0.0.1:5000/api/reports/send-sms",
                json={"area": area_name, "phones": sms_to},
                timeout=15,
            )
            results["sms"] = r.json()
        except Exception as e:
            results["sms"] = {"error": str(e)}
    return jsonify(results)

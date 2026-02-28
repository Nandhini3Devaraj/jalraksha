from flask import Blueprint, jsonify, request
from models import DiseaseCase, RiskLevel, Alert, WaterQuality, WeatherData
from extensions import db
from sqlalchemy import func
from risk_engine import calculate_risk
from datetime import datetime

disease_bp = Blueprint("disease", __name__)


@disease_bp.route("/summary", methods=["GET"])
def summary():
    diseases = db.session.query(
        DiseaseCase.disease,
        func.sum(DiseaseCase.total_cases).label("total"),
        func.sum(DiseaseCase.active_cases).label("active"),
        func.sum(DiseaseCase.recovered).label("recovered"),
        func.sum(DiseaseCase.deaths).label("deaths"),
    ).group_by(DiseaseCase.disease).all()

    result = []
    for d in diseases:
        total = int(d.total or 0)
        active = int(d.active or 0)
        rec   = int(d.recovered or 0)
        det   = int(d.deaths or 0)
        result.append({
            "disease": d.disease,
            "total_cases":  total,
            "active_cases": active,
            "recovered":    rec,
            "deaths":       det,
            "recovery_rate": round((rec / total) * 100, 1) if total else 0,
        })
    return jsonify(result)


@disease_bp.route("/map", methods=["GET"])
def risk_map():
    areas = RiskLevel.query.order_by(RiskLevel.score.desc()).all()
    return jsonify([a.to_dict() for a in areas])


@disease_bp.route("/high-risk", methods=["GET"])
def high_risk():
    areas = (
        RiskLevel.query
        .filter(RiskLevel.level.in_(["High", "Critical"]))
        .order_by(RiskLevel.score.desc())
        .all()
    )
    result = []
    for area in areas:
        cases = DiseaseCase.query.filter_by(area=area.area).first()
        weather = WeatherData.query.filter_by(area=area.area).first()
        wq      = WaterQuality.query.filter_by(area=area.area).first()
        result.append({
            **area.to_dict(),
            "disease":      cases.disease     if cases   else "Unknown",
            "active_cases": cases.active_cases if cases  else 0,
            "rainfall_mm":  weather.rainfall_mm if weather else 0,
            "turbidity":    wq.turbidity       if wq      else 0,
        })
    return jsonify(result)


@disease_bp.route("/area/<string:area_name>", methods=["GET"])
def area_detail(area_name):
    wq      = WaterQuality.query.filter_by(area=area_name).first()
    weather = WeatherData.query.filter_by(area=area_name).first()
    cases   = DiseaseCase.query.filter_by(area=area_name).first()
    risk    = RiskLevel.query.filter_by(area=area_name).first()

    if not risk:
        return jsonify({"error": "Area not found"}), 404

    return jsonify({
        "area":         area_name,
        "risk":         risk.to_dict(),
        "water_quality": wq.to_dict()      if wq      else None,
        "weather":       weather.to_dict() if weather else None,
        "disease":       cases.to_dict()   if cases   else None,
    })


@disease_bp.route("/recalculate", methods=["POST"])
def recalculate():
    """Recalculate risk scores for all areas and generate alerts."""
    from models import Alert
    areas = RiskLevel.query.all()
    updated = []

    for area_risk in areas:
        wq      = WaterQuality.query.filter_by(area=area_risk.area).first()
        weather = WeatherData.query.filter_by(area=area_risk.area).first()
        cases   = DiseaseCase.query.filter_by(area=area_risk.area).first()

        if not (wq and weather and cases):
            continue

        risk_data = calculate_risk(
            water=wq.to_dict(),
            weather=weather.to_dict(),
            disease_summary={"active_cases": cases.active_cases, "total_cases": cases.total_cases},
        )
        area_risk.score      = risk_data["score"]
        area_risk.level      = risk_data["level"]
        area_risk.updated_at = datetime.utcnow()

        if risk_data["level"] in ("High", "Critical"):
            alert = Alert(
                area=area_risk.area,
                message=(
                    f"⚠️ {risk_data['level']} outbreak risk in {area_risk.area}. "
                    f"Score: {risk_data['score']}. Active cases: {cases.active_cases}."
                ),
                severity=risk_data["level"],
            )
            db.session.add(alert)

        updated.append({**area_risk.to_dict(), "breakdown": risk_data["breakdown"]})

    db.session.commit()
    return jsonify({"updated": len(updated), "areas": updated})


@disease_bp.route("/scheduler/send-now", methods=["POST"])
def send_alerts_now():
    """Manual trigger: send SMS for all unsent critical/high alerts via Twilio."""
    import os
    try:
        from twilio.rest import Client
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token  = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        to_number   = os.getenv("TWILIO_TO_NUMBER")

        if not all([account_sid, auth_token, from_number, to_number]):
            return jsonify({"error": "Twilio credentials not configured in .env"}), 400

        client = Client(account_sid, auth_token)
        unsent = Alert.query.filter_by(is_sent=False).filter(
            Alert.severity.in_(["High", "Critical"])
        ).all()

        sent_count = 0
        for alert in unsent:
            client.messages.create(
                body=alert.message,
                from_=from_number,
                to=to_number,
            )
            alert.is_sent = True
            sent_count += 1

        db.session.commit()
        return jsonify({"sent": sent_count})

    except ImportError:
        return jsonify({"error": "twilio package not installed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

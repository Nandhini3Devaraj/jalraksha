from flask import Blueprint, jsonify
from models import WaterQuality, WeatherData, DiseaseCase, RiskLevel, Alert
from extensions import db
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/summary", methods=["GET"])
def summary():
    total_cases   = db.session.query(func.sum(DiseaseCase.total_cases)).scalar() or 0
    active_cases  = db.session.query(func.sum(DiseaseCase.active_cases)).scalar() or 0
    recovered     = db.session.query(func.sum(DiseaseCase.recovered)).scalar() or 0
    deaths        = db.session.query(func.sum(DiseaseCase.deaths)).scalar() or 0
    monitored     = db.session.query(func.count(func.distinct(RiskLevel.area))).scalar() or 0

    recovery_rate = round((recovered / total_cases) * 100, 1) if total_cases else 0
    fatality_rate = round((deaths     / total_cases) * 100, 1) if total_cases else 0

    high_risk    = RiskLevel.query.filter(RiskLevel.level.in_(["High", "Critical"])).count()
    critical     = RiskLevel.query.filter_by(level="Critical").count()

    # Latest water quality (averaged)
    wq_avg = db.session.query(
        func.avg(WaterQuality.ph).label("ph"),
        func.avg(WaterQuality.turbidity).label("turbidity"),
        func.avg(WaterQuality.hardness).label("hardness"),
        func.avg(WaterQuality.chloramines).label("chloramines"),
    ).first()

    # Weather summary
    avg_rain = db.session.query(func.avg(WeatherData.rainfall_mm)).scalar() or 0
    flood_zones = WeatherData.query.filter_by(flood_risk=True).count()

    recent_alerts = (
        Alert.query.order_by(Alert.created_at.desc()).limit(5).all()
    )

    return jsonify({
        "statistics": {
            "total_cases":    int(total_cases),
            "active_cases":   int(active_cases),
            "recovered":      int(recovered),
            "deaths":         int(deaths),
            "recovery_rate":  recovery_rate,
            "fatality_rate":  fatality_rate,
            "monitored_areas": int(monitored),
            "high_risk_areas": int(high_risk),
            "critical_areas":  int(critical),
        },
        "water_quality": {
            "ph":           round(float(wq_avg.ph or 7), 2),
            "turbidity":    round(float(wq_avg.turbidity or 0), 2),
            "hardness":     round(float(wq_avg.hardness or 0), 2),
            "chloramines":  round(float(wq_avg.chloramines or 0), 2),
        },
        "weather": {
            "avg_rainfall_mm": round(float(avg_rain), 1),
            "flood_zones":     int(flood_zones),
        },
        "recent_alerts": [a.to_dict() for a in recent_alerts],
    })


@dashboard_bp.route("/water-quality", methods=["GET"])
def water_quality():
    records = WaterQuality.query.order_by(WaterQuality.recorded_at.desc()).all()
    return jsonify([r.to_dict() for r in records])


@dashboard_bp.route("/weather", methods=["GET"])
def weather():
    records = WeatherData.query.order_by(WeatherData.recorded_at.desc()).all()
    return jsonify([r.to_dict() for r in records])

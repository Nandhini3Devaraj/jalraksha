from extensions import db
from datetime import datetime


class WaterQuality(db.Model):
    __tablename__ = "water_quality"
    id            = db.Column(db.Integer, primary_key=True)
    area          = db.Column(db.String(100), nullable=False)
    ph            = db.Column(db.Float, nullable=False)
    turbidity     = db.Column(db.Float, nullable=False)   # NTU
    hardness      = db.Column(db.Float, nullable=False)   # mg/L
    chloramines   = db.Column(db.Float, nullable=False)   # ppm
    conductivity  = db.Column(db.Float, nullable=False)
    organic_carbon= db.Column(db.Float, nullable=False)
    trihalomethanes = db.Column(db.Float, nullable=False)
    recorded_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "area": self.area,
            "ph": self.ph, "turbidity": self.turbidity,
            "hardness": self.hardness, "chloramines": self.chloramines,
            "conductivity": self.conductivity,
            "organic_carbon": self.organic_carbon,
            "trihalomethanes": self.trihalomethanes,
            "recorded_at": self.recorded_at.isoformat(),
        }


class WeatherData(db.Model):
    __tablename__ = "weather_data"
    id            = db.Column(db.Integer, primary_key=True)
    area          = db.Column(db.String(100), nullable=False)
    rainfall_mm   = db.Column(db.Float, default=0.0)
    temperature   = db.Column(db.Float, default=25.0)   # °C
    humidity      = db.Column(db.Float, default=60.0)   # %
    flood_risk    = db.Column(db.Boolean, default=False)
    recorded_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "area": self.area,
            "rainfall_mm": self.rainfall_mm,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "flood_risk": self.flood_risk,
            "recorded_at": self.recorded_at.isoformat(),
        }


class DiseaseCase(db.Model):
    __tablename__ = "disease_cases"
    id            = db.Column(db.Integer, primary_key=True)
    disease       = db.Column(db.String(100), nullable=False)
    area          = db.Column(db.String(100), nullable=False)
    total_cases   = db.Column(db.Integer, default=0)
    active_cases  = db.Column(db.Integer, default=0)
    recovered     = db.Column(db.Integer, default=0)
    deaths        = db.Column(db.Integer, default=0)
    recorded_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "disease": self.disease, "area": self.area,
            "total_cases": self.total_cases, "active_cases": self.active_cases,
            "recovered": self.recovered, "deaths": self.deaths,
            "recorded_at": self.recorded_at.isoformat(),
        }


class RiskLevel(db.Model):
    __tablename__ = "risk_levels"
    id            = db.Column(db.Integer, primary_key=True)
    area          = db.Column(db.String(100), nullable=False, unique=True)
    score         = db.Column(db.Float, default=0.0)       # 0-100
    level         = db.Column(db.String(20), default="Low") # Low/Medium/High/Critical
    lat           = db.Column(db.Float, nullable=True)
    lng           = db.Column(db.Float, nullable=True)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "area": self.area,
            "score": round(self.score, 1), "level": self.level,
            "lat": self.lat, "lng": self.lng,
            "updated_at": self.updated_at.isoformat(),
        }


class Alert(db.Model):
    __tablename__ = "alerts"
    id            = db.Column(db.Integer, primary_key=True)
    area          = db.Column(db.String(100), nullable=False)
    message       = db.Column(db.Text, nullable=False)
    severity      = db.Column(db.String(20), default="Low")
    is_sent       = db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "area": self.area,
            "message": self.message, "severity": self.severity,
            "is_sent": self.is_sent,
            "created_at": self.created_at.isoformat(),
        }

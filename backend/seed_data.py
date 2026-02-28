from datetime import datetime
from models import WaterQuality, WeatherData, DiseaseCase, RiskLevel, Alert
from extensions import db
from risk_engine import calculate_risk

AREAS = [
    {"name": "North Chennai",   "lat": 13.1827, "lng": 80.2707},
    {"name": "South Chennai",   "lat": 12.9716, "lng": 80.1562},
    {"name": "Tambaram",        "lat": 12.9249, "lng": 80.1000},
    {"name": "Ambattur",        "lat": 13.1143, "lng": 80.1548},
    {"name": "Avadi",           "lat": 13.1067, "lng": 80.0972},
    {"name": "Poonamallee",     "lat": 13.0479, "lng": 80.0985},
    {"name": "Sholinganallur",  "lat": 12.9010, "lng": 80.2279},
    {"name": "Perambur",        "lat": 13.1162, "lng": 80.2350},
    {"name": "Adyar",           "lat": 13.0012, "lng": 80.2565},
    {"name": "Velachery",       "lat": 12.9815, "lng": 80.2180},
    {"name": "Anna Nagar",      "lat": 13.0850, "lng": 80.2101},
    {"name": "T Nagar",         "lat": 13.0418, "lng": 80.2341},
]

DISEASES = [
    "Cholera", "Typhoid", "Hepatitis A",
    "Dysentery", "Giardiasis", "Cryptosporidiosis",
    "Leptospirosis", "Gastroenteritis",
]

WATER_SAMPLES = [
    {"ph": 7.2, "turbidity": 1.2,  "hardness": 120, "chloramines": 6.5,  "conductivity": 380, "organic_carbon": 14, "trihalomethanes": 55},
    {"ph": 6.8, "turbidity": 3.5,  "hardness": 180, "chloramines": 7.2,  "conductivity": 420, "organic_carbon": 18, "trihalomethanes": 65},
    {"ph": 7.5, "turbidity": 0.8,  "hardness": 95,  "chloramines": 5.8,  "conductivity": 310, "organic_carbon": 11, "trihalomethanes": 44},
    {"ph": 6.3, "turbidity": 12.0, "hardness": 250, "chloramines": 9.1,  "conductivity": 580, "organic_carbon": 22, "trihalomethanes": 88},
    {"ph": 8.1, "turbidity": 5.8,  "hardness": 160, "chloramines": 6.9,  "conductivity": 445, "organic_carbon": 16, "trihalomethanes": 60},
    {"ph": 7.0, "turbidity": 2.1,  "hardness": 130, "chloramines": 6.2,  "conductivity": 390, "organic_carbon": 13, "trihalomethanes": 48},
    {"ph": 5.9, "turbidity": 18.5, "hardness": 290, "chloramines": 10.2, "conductivity": 620, "organic_carbon": 25, "trihalomethanes": 95},
    {"ph": 7.8, "turbidity": 1.5,  "hardness": 110, "chloramines": 5.5,  "conductivity": 350, "organic_carbon": 12, "trihalomethanes": 50},
    {"ph": 7.3, "turbidity": 4.2,  "hardness": 145, "chloramines": 7.0,  "conductivity": 410, "organic_carbon": 15, "trihalomethanes": 58},
    {"ph": 6.6, "turbidity": 8.9,  "hardness": 200, "chloramines": 8.3,  "conductivity": 500, "organic_carbon": 20, "trihalomethanes": 75},
    {"ph": 7.1, "turbidity": 1.0,  "hardness": 100, "chloramines": 6.0,  "conductivity": 370, "organic_carbon": 13, "trihalomethanes": 52},
    {"ph": 7.4, "turbidity": 2.8,  "hardness": 135, "chloramines": 6.7,  "conductivity": 400, "organic_carbon": 14, "trihalomethanes": 56},
]

WEATHER_SAMPLES = [
    {"rainfall_mm": 5,   "temperature": 28, "humidity": 65, "flood_risk": False},
    {"rainfall_mm": 45,  "temperature": 26, "humidity": 80, "flood_risk": False},
    {"rainfall_mm": 2,   "temperature": 30, "humidity": 60, "flood_risk": False},
    {"rainfall_mm": 120, "temperature": 24, "humidity": 92, "flood_risk": True},
    {"rainfall_mm": 70,  "temperature": 25, "humidity": 85, "flood_risk": True},
    {"rainfall_mm": 10,  "temperature": 29, "humidity": 68, "flood_risk": False},
    {"rainfall_mm": 150, "temperature": 23, "humidity": 95, "flood_risk": True},
    {"rainfall_mm": 0,   "temperature": 32, "humidity": 55, "flood_risk": False},
    {"rainfall_mm": 30,  "temperature": 27, "humidity": 75, "flood_risk": False},
    {"rainfall_mm": 85,  "temperature": 25, "humidity": 88, "flood_risk": True},
    {"rainfall_mm": 3,   "temperature": 31, "humidity": 58, "flood_risk": False},
    {"rainfall_mm": 20,  "temperature": 28, "humidity": 70, "flood_risk": False},
]

DISEASE_CASES = [
    {"total": 4200, "active": 620, "recovered": 3480, "deaths": 100},
    {"total": 6800, "active": 1500, "recovered": 5100, "deaths": 200},
    {"total": 2100, "active": 210, "recovered": 1860, "deaths": 30},
    {"total": 9500, "active": 4200, "recovered": 4900, "deaths": 400},
    {"total": 7200, "active": 3100, "recovered": 3800, "deaths": 300},
    {"total": 3100, "active": 500, "recovered": 2520, "deaths": 80},
    {"total": 11000, "active": 6000, "recovered": 4500, "deaths": 500},
    {"total": 1800, "active": 180, "recovered": 1590, "deaths": 30},
    {"total": 5400, "active": 900, "recovered": 4380, "deaths": 120},
    {"total": 8100, "active": 3500, "recovered": 4300, "deaths": 300},
    {"total": 2400, "active": 250, "recovered": 2110, "deaths": 40},
    {"total": 3600, "active": 600, "recovered": 2920, "deaths": 80},
]


def seed_if_empty():
    from extensions import db
    from sqlalchemy import select
    if db.session.execute(select(WaterQuality)).first() is not None:
        return

    import random
    random.seed(42)

    for i, area in enumerate(AREAS):
        ws = WATER_SAMPLES[i]
        wr = WEATHER_SAMPLES[i]
        dc = DISEASE_CASES[i]

        wq = WaterQuality(area=area["name"], **ws)
        db.session.add(wq)

        wd = WeatherData(area=area["name"], **wr)
        db.session.add(wd)

        disease = DISEASES[i % len(DISEASES)]
        dcase = DiseaseCase(
            disease=disease, area=area["name"],
            total_cases=dc["total"], active_cases=dc["active"],
            recovered=dc["recovered"], deaths=dc["deaths"],
        )
        db.session.add(dcase)

        risk_data = calculate_risk(
            water=ws,
            weather=wr,
            disease_summary={"active_cases": dc["active"], "total_cases": dc["total"]},
        )
        rl = RiskLevel(
            area=area["name"],
            score=risk_data["score"],
            level=risk_data["level"],
            lat=area["lat"],
            lng=area["lng"],
        )
        db.session.add(rl)

        if risk_data["level"] in ("High", "Critical"):
            alert = Alert(
                area=area["name"],
                message=(
                    f"⚠️ {risk_data['level']} outbreak risk detected in {area['name']}. "
                    f"Risk score: {risk_data['score']}. "
                    f"Active cases: {dc['active']}. Take immediate preventive action."
                ),
                severity=risk_data["level"],
            )
            db.session.add(alert)

    db.session.commit()
    print("✅ Seed data inserted.")

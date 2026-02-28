"""
Weighted Rule-Based Risk Scoring Engine
Score range: 0 – 100
Thresholds: Low <25 | Medium 25-50 | High 50-75 | Critical >75
"""

WEIGHTS = {
    "turbidity":   0.30,
    "ph":          0.20,
    "rainfall":    0.25,
    "cases_spike": 0.25,
}


def score_turbidity(ntu: float) -> float:
    if ntu <= 1:   return 0
    if ntu <= 4:   return 20
    if ntu <= 10:  return 50
    if ntu <= 25:  return 75
    return 100


def score_ph(ph: float) -> float:
    if 6.5 <= ph <= 8.5:  return 0
    if 6.0 <= ph < 6.5 or 8.5 < ph <= 9.0: return 30
    if 5.5 <= ph < 6.0 or 9.0 < ph <= 9.5: return 60
    return 100


def score_rainfall(mm: float) -> float:
    if mm == 0:    return 0
    if mm <= 10:   return 15
    if mm <= 50:   return 45
    if mm <= 100:  return 70
    return 100


def score_case_spike(active: int, total: int) -> float:
    if total == 0: return 0
    ratio = active / total
    if ratio < 0.1:  return 0
    if ratio < 0.2:  return 25
    if ratio < 0.35: return 50
    if ratio < 0.5:  return 75
    return 100


def calculate_risk(water: dict, weather: dict, disease_summary: dict) -> dict:
    t_score  = score_turbidity(water.get("turbidity", 1))
    ph_score = score_ph(water.get("ph", 7))
    r_score  = score_rainfall(weather.get("rainfall_mm", 0))
    c_score  = score_case_spike(
        disease_summary.get("active_cases", 0),
        disease_summary.get("total_cases", 1),
    )

    total = (
        WEIGHTS["turbidity"]   * t_score  +
        WEIGHTS["ph"]          * ph_score +
        WEIGHTS["rainfall"]    * r_score  +
        WEIGHTS["cases_spike"] * c_score
    )

    if total < 25:   level = "Low"
    elif total < 50: level = "Medium"
    elif total < 75: level = "High"
    else:            level = "Critical"

    return {
        "score": round(total, 1),
        "level": level,
        "breakdown": {
            "turbidity_score":  round(t_score, 1),
            "ph_score":         round(ph_score, 1),
            "rainfall_score":   round(r_score, 1),
            "case_spike_score": round(c_score, 1),
        },
    }

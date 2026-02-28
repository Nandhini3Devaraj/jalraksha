from flask import Blueprint, jsonify, request
import os

chatbot_bp = Blueprint("chatbot", __name__)

SYSTEM_CONTEXT = """You are JalRaksha AI, an expert assistant for water health monitoring and waterborne disease outbreak prevention.
You help users understand:
- Water quality parameters (pH, turbidity, chloramines, hardness)
- Waterborne diseases: Cholera, Typhoid, Hepatitis A, Dysentery, Giardiasis, Cryptosporidiosis, Leptospirosis, Gastroenteritis
- Risk levels: Low (<25), Medium (25-50), High (50-75), Critical (>75)
- Preventive measures and safe water practices
- What to do during different outbreak risk levels
Keep responses concise, helpful, and actionable. Use simple language.
"""

FALLBACK_RESPONSES = {
    "cholera":        "Cholera is caused by Vibrio cholerae bacteria from contaminated water. Symptoms include severe watery diarrhea and vomiting. Prevention: drink safe water, wash hands with soap. Treatment: oral rehydration salts.",
    "typhoid":        "Typhoid fever is caused by Salmonella typhi. Spread through contaminated food/water. Symptoms: high fever, weakness, stomach pain. Get vaccinated and always drink treated water.",
    "hepatitis":      "Hepatitis A spreads through contaminated water/food. Symptoms: fatigue, nausea, jaundice. Vaccination is available. Use clean water for drinking and cooking.",
    "dysentery":      "Dysentery causes bloody diarrhea from bacteria (Shigella) or parasites in contaminated water. Wash hands thoroughly, use purified water.",
    "turbidity":      "Turbidity measures water cloudiness. Safe level: <1 NTU. High turbidity (>4 NTU) indicates contamination. Use filtration and chlorination to reduce it.",
    "ph":             "Safe water pH is 6.5–8.5. Below 6.5 means acidic (may corrode pipes), above 8.5 means alkaline. Both extremes can harbor pathogens.",
    "chloramine":     "Chloramines are disinfectants added to water. Safe level: <4 mg/L. High chloramines cause taste/odor issues. Levels >10 mg/L indicate over-treatment.",
    "risk":           "Risk levels: Low (<25) - normal monitoring | Medium (25-50) - increased vigilance | High (50-75) - issue public advisory | Critical (>75) - immediate emergency response needed.",
    "critical":       "Critical risk means immediate action is needed! Boil all water before drinking, avoid contact with flood water, seek medical attention if symptoms appear, and follow health authority advisories.",
    "high":           "High risk alert: Avoid drinking untreated water, use bottled water, wash all fruits/vegetables with clean water, and watch for symptoms like diarrhea, fever, or vomiting.",
    "prevention":     "Key prevention steps: 1) Always boil or filter drinking water 2) Wash hands with soap for 20 seconds 3) Avoid open defecation 4) Properly dispose of waste 5) Use ORS during diarrhea.",
    "flood":          "During floods: Do not drink flood water. Avoid wading in floodwater. Boil all water. Watch for disease symptoms 1-2 weeks after flooding. Report unusual illness clusters to health authorities.",
    "safe water":     "Safe water tips: Boil water for 1 minute, use chlorine tablets (1 tablet per liter), use ceramic/biosand filters, maintain storage containers clean and covered.",
    "rainfall":       "Heavy rainfall (>50mm) increases contamination risk. Runoff carries pathogens into water sources. During heavy rain: use stored/boiled water, avoid using rainwater directly for drinking.",
    "leptospirosis":  "Leptospirosis spreads through water/soil contaminated with infected animal urine. Risk increases after floods. Wear protective footwear near floodwater. Symptoms: fever, headache, muscle pain.",
    "giardia":        "Giardiasis is caused by Giardia parasites in contaminated water. Symptoms: diarrhea, bloating, cramps. Use filters with 1-micron absolute pore size or boil water to prevent it.",
}


def get_fallback_response(message: str) -> str:
    msg_lower = message.lower()
    for keyword, response in FALLBACK_RESPONSES.items():
        if keyword in msg_lower:
            return response
    return (
        "I'm JalRaksha AI, your water health assistant. "
        "I can help with questions about water quality, waterborne diseases, "
        "outbreak risk levels, and preventive measures. "
        "Please ask about: cholera, typhoid, water pH, turbidity, risk levels, or prevention tips."
    )


@chatbot_bp.route("/message", methods=["POST"])
def message():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_message  = data["message"].strip()
    history       = data.get("history", [])
    api_key       = os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            chat_history = [
                {"role": "user",  "parts": [SYSTEM_CONTEXT]},
                {"role": "model", "parts": ["Understood. I am JalRaksha AI, ready to assist with water health monitoring queries."]},
            ]
            for h in history[-6:]:
                chat_history.append({"role": "user",  "parts": [h.get("user", "")]})
                chat_history.append({"role": "model", "parts": [h.get("bot",  "")]})

            chat    = model.start_chat(history=chat_history)
            resp    = chat.send_message(user_message)
            bot_reply = resp.text

        except Exception as e:
            bot_reply = get_fallback_response(user_message)
    else:
        bot_reply = get_fallback_response(user_message)

    return jsonify({"reply": bot_reply, "source": "gemini" if api_key else "fallback"})

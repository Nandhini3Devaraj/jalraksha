# 🌊 JalRaksha — Water Health Intelligence System

> **Real-time water quality monitoring, disease outbreak detection, and risk prediction for Chennai metropolitan areas.**

![JalRaksha Banner](https://img.shields.io/badge/JalRaksha-Water%20Health%20Intelligence-0ea5e9?style=for-the-badge&logo=water&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1-lightgrey?style=flat-square&logo=flask)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06b6d4?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📌 Overview

**JalRaksha** (जलरक्षा — *"water protection"*) is a full-stack web application that monitors water quality parameters, tracks waterborne disease outbreaks, and predicts contamination risk across 12 Chennai metropolitan areas.

The system aggregates water quality sensor data, weather conditions, and disease case records to compute a weighted risk score for each area. When risk levels are High or Critical, the platform provides:
- Disease-specific precautions and actions for residents
- Root-cause analysis (human/sanitation vs. climatic causes)
- Auto-generated official reports
- Email alerts to government authorities
- SMS broadcasts to residents

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Dashboard** | Real-time stats — active cases, risk areas, water quality averages, disease charts |
| 🗺️ **Risk Map** | Colour-coded area grid showing Low / Medium / High / Critical risk levels |
| ⚠️ **Advisory Modal** | Click any area to see precautions, what NOT to do, why it happens (human vs. climate), and immediate actions |
| 📄 **Report Generation** | Auto-generate a full PDF-printable official report per area |
| 📧 **Email to Government** | Send the HTML report directly to collector / health department emails |
| 📱 **SMS Broadcast** | Send waterborne disease alerts to residents via Twilio |
| 🤖 **AI Chatbot** | Gemini AI-powered assistant for water health queries (with keyword fallback) |
| 🔔 **Alerts System** | Severity-filtered alert feed with send / clear actions |
| 🔄 **Risk Engine** | Weighted scoring: Turbidity (30%) + pH (20%) + Rainfall (25%) + Case Spike (25%) |

---

## 🏗️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Flask | 3.1.3 | Web framework |
| Flask-SQLAlchemy | 3.1.1 | ORM |
| Flask-CORS | 6.0.2 | Cross-origin requests |
| python-dotenv | 1.2.1 | Environment config |
| google-generativeai | 0.3.2 | Gemini AI chatbot |
| twilio | 8.10.0 | SMS alerts |
| SQLite | — | Database |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool / dev server |
| TailwindCSS | 3.4 | Styling |
| Recharts | 2.10 | Charts and graphs |
| Axios | latest | HTTP client |
| Lucide React | latest | Icons |
| React Router DOM | 6 | Client-side routing |

---

## 📁 Project Structure

```
jalraksha/
├── backend/
│   ├── app.py                  # Flask app factory
│   ├── extensions.py           # SQLAlchemy singleton
│   ├── models.py               # DB models (5 tables)
│   ├── risk_engine.py          # Weighted risk scoring
│   ├── seed_data.py            # 12 Chennai area seed data
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── dashboard.py        # /api/dashboard/*
│       ├── disease.py          # /api/disease/*
│       ├── alerts.py           # /api/alerts/*
│       ├── chatbot.py          # /api/chatbot/*
│       └── reports.py          # /api/reports/*
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── types.ts
        ├── services/
        │   └── api.ts          # All API calls
        ├── components/
        │   ├── Navbar.tsx
        │   ├── StatCard.tsx
        │   ├── RiskBadge.tsx
        │   ├── AreaWarningPanel.tsx   # Advisory modal
        │   └── AreaReportModal.tsx    # Report + send modal
        └── pages/
            ├── Dashboard.tsx
            ├── DiseaseMap.tsx
            ├── AlertsPage.tsx
            └── ChatbotPage.tsx
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/jalraksha.git
cd jalraksha
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
SECRET_KEY=your-secret-key-here

# AI Chatbot (optional — keyword fallback works without this)
GEMINI_API_KEY=your-gemini-api-key

# Email Reports (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=your-app-password   # Use Gmail App Password

# SMS Alerts (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM=+1234567890
```

#### Run the Backend

```bash
python app.py
```

Backend starts at **http://127.0.0.1:5000**  
The database is auto-created and seeded with 12 Chennai area records on first run.

> **Windows note:** If you see import errors from an old venv, run `$env:PYTHONPATH = ""` before the python command.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

---

## 🔌 API Reference

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Overall stats (active cases, risk counts, etc.) |
| GET | `/api/dashboard/water-quality` | Aggregated water parameter averages |
| GET | `/api/dashboard/weather` | Latest weather data per area |

### Disease & Risk Map
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/disease/map` | All areas with risk level + water/weather/disease data |
| GET | `/api/disease/high-risk` | Areas with High or Critical risk |
| GET | `/api/disease/area/:name` | Detailed data for a single area |
| POST | `/api/disease/recalculate` | Re-run risk score engine for all areas |

### Reports
| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/reports/area/:name` | — | Generate structured report data for an area |
| POST | `/api/reports/send-email` | `{area, recipients[]}` | Email the HTML report to recipients |
| POST | `/api/reports/send-sms` | `{area, phones[]}` | SMS broadcast to phone numbers |

### Alerts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts/` | List all alerts (filterable by severity) |
| GET | `/api/alerts/unread-count` | Count of unsent alerts |
| PATCH | `/api/alerts/:id/mark-sent` | Mark alert as sent |
| DELETE | `/api/alerts/clear` | Clear all alerts |

### Chatbot
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/chatbot/message` | `{message, history[]}` | AI/keyword chatbot response |

---

## 🧮 Risk Scoring Model

Risk score (0–100) is computed from four weighted factors:

| Factor | Weight | Threshold |
|---|---|---|
| Turbidity | **30%** | > 4 NTU = max penalty |
| pH deviation | **20%** | < 6.5 or > 8.5 = penalty |
| Rainfall | **25%** | > 100 mm = max penalty |
| Disease case spike | **25%** | Active/total ratio |

| Score Range | Risk Level |
|---|---|
| 0 – 24 | 🟢 Low |
| 25 – 49 | 🟡 Medium |
| 50 – 74 | 🟠 High |
| 75 – 100 | 🔴 Critical |

---

## 🗺️ Covered Areas

12 Chennai metropolitan areas with real GPS coordinates:

North Chennai · South Chennai · Tambaram · Ambattur · Avadi · Poonamallee · Sholinganallur · Perambur · Adyar · Velachery · Anna Nagar · T Nagar

---

## 🗄️ Database Models

| Model | Table | Key Fields |
|---|---|---|
| `WaterQuality` | `water_quality` | ph, turbidity, hardness, chloramines, conductivity, organic_carbon, trihalomethanes |
| `WeatherData` | `weather_data` | rainfall_mm, temperature, humidity, flood_risk |
| `DiseaseCase` | `disease_cases` | disease, area, total_cases, active_cases, recovered, deaths |
| `RiskLevel` | `risk_levels` | area, level, score, breakdown (JSON) |
| `Alert` | `alerts` | area, message, severity, is_sent |

---

## 📊 Screenshots

> **Dashboard** — Live statistics, disease distribution charts, water quality indicators  
> **Risk Map** — Area grid with colour-coded risk levels; click any tile for the full advisory  
> **Advisory Panel** — Disease-specific precautions, causes (human vs. climate), and immediate actions  
> **Report Modal** — Printable official report with government action recommendations, email/SMS dispatch

---

## 🔧 Optional Integrations

### Gmail App Password (for email reports)
1. Enable 2FA on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Create a password for "Mail"
4. Use it as `SMTP_PASSWORD` in `.env`

### Twilio SMS
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get a trial phone number
3. Copy Account SID, Auth Token, and From number to `.env`

### Gemini AI Chatbot
1. Get an API key from [Google AI Studio](https://aistudio.google.com)
2. Add as `GEMINI_API_KEY` in `.env`

---

## 🛡️ Emergency Contacts (Built-in)

| Service | Number |
|---|---|
| Emergency (Ambulance) | **108** |
| Disease Surveillance Helpline | **104** |
| Water Quality Helpline | **1800-180-5678** |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built with ❤️ for public health and water safety in Tamil Nadu.

> *"Clean water is not a luxury — it's a right."*

---

<p align="center">
  <strong>JalRaksha</strong> · Water Health Intelligence · Chennai, Tamil Nadu, India
</p>

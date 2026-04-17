# ForecastIQ: AI-Powered Business Intelligence Platform 🚀

A full-stack, production-grade SaaS platform that transforms raw sales CSVs into rich forecasts, customer segments, inventory alerts, and AI-generated business insights — powered by **Google Gemini** and **Auto-ARIMA**.

---

## ✨ Features (v2.0)

| Module | Description |
|--------|-------------|
| 🔐 Auth | Secure login / signup gate (Supabase-ready) |
| 📤 Upload | CSV dataset upload with auto field detection |
| 📊 Analytics | Revenue charts, category breakdown, KPI cards |
| 🔮 Prediction | Auto-ARIMA 4-month forecasting with 95% CI |
| 👥 Segments | RFM-based customer segmentation (Champion→Lost) |
| 📦 Inventory | Safety stock & reorder point optimization |
| 🧠 AI Insights | Gemini 1.5 Flash NLP insights (with rule-based fallback) |
| 💬 Chat | Floating AI chatbot with dataset context |
| 📄 PDF Report | AI-written executive report download |

---

## 🛠️ Tech Stack

**Backend** → FastAPI · Python · Pandas · Scikit-learn · pmdarima · Google Generative AI · fpdf2  
**Frontend** → React 18 · Vite · Tailwind CSS · Recharts · Framer Motion · Lucide Icons  
**Auth/DB** → Supabase (Auth + Storage)

---

## 🚀 Quick Start

### 1. Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Setup your environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the server
uvicorn main:app --reload
```

### 2. Frontend
```powershell
cd frontend
npm install
npm run dev
```

### 3. Launch Both at Once
```powershell
.\launch.ps1
```

Open **http://localhost:5173** · Login (any credentials) · Upload CSV · Get Insights!

---

## 🔑 API Keys

| Key | Where to get |
|-----|-------------|
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — **Free** |
| `SUPABASE_URL` / `SUPABASE_KEY` | [supabase.com](https://supabase.com) — **Free tier** |

> ℹ️ The system works without any API keys — AI insights will use the built-in rule engine.

---

## 📁 Project Structure

```
sales-forecasting/
├── backend/
│   ├── main.py          # FastAPI — all 10 modules
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Full React dashboard
│   │   └── index.css    # Neural Stealth design system
│   ├── index.html
│   └── package.json
├── data/                # Sample CSVs
├── launch.ps1           # One-click launcher
└── check_system.py      # Environment diagnostics
```

---

## 📈 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload CSV, returns summary + sample |
| POST | `/forecast` | ARIMA 4-period forecast |
| POST | `/segmentation` | RFM customer segments |
| POST | `/inventory` | Safety stock + reorder points |
| POST | `/ai/insights` | Gemini NLP insights |
| POST | `/ai/chat` | Gemini chatbot with data context |
| POST | `/generate-report` | PDF executive report |

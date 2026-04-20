import os
import io
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from fpdf import FPDF

# ── OPTIONAL DEPS ──────────────────────────────────────────────────────────────
try:
    from pmdarima.arima import auto_arima
    ARIMA_AVAILABLE = True
except ImportError:
    ARIMA_AVAILABLE = False

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# ── Load Configuration ────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# ── APP SETUP ─────────────────────────────────────────────────────────────────
app = FastAPI(title="ForecastIQ API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI CLIENT (Google Gemini 1.5 Flash - Free) ────────────────────────────────
# Get your free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None
if GEMINI_API_KEY and GENAI_AVAILABLE:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        gemini_model = None

# ── DATA MODELS ───────────────────────────────────────────────────────────────
class ForecastRequest(BaseModel):
    data: List[dict]
    periods: int = 4

class SegmentRequest(BaseModel):
    data: List[dict]

class InventoryRequest(BaseModel):
    data: List[dict]

class ReportRequest(BaseModel):
    summary: dict
    insights: str
    forecast: Optional[List[dict]] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

# ── UTILS ─────────────────────────────────────────────────────────────────────
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    cols = df.columns.tolist()
    find = lambda keys: next(
        (c for c in cols if any(k in c.lower() for k in keys)), cols[0]
    )

    p_cat   = find(["cat", "product", "item"])
    p_price = find(["price", "sales", "amt", "revenue", "total"])
    p_date  = find(["date", "time", "order"])
    p_cust  = find(["cust", "client", "id"])

    df = df.copy()
    df["category"]    = df[p_cat].astype(str).str.strip()
    df["price"]       = pd.to_numeric(
        df[p_price].astype(str).str.replace(r"[$,\s]", "", regex=True),
        errors="coerce"
    ).fillna(0)
    df["date"]        = pd.to_datetime(df[p_date], errors="coerce", dayfirst=True).fillna(
        pd.Timestamp("today")
    )
    df["customer_id"] = df[p_cust].astype(str).str.strip()

    return df

# ── RULE-BASED INSIGHT ENGINE (always works, no API needed) ───────────────────
def rule_based_insights(summary: dict) -> str:
    rev     = summary.get("total_revenue", 0)
    avg     = summary.get("avg_transaction", 0)
    count   = summary.get("total_items", 0)
    cats    = summary.get("categories", {})

    top_cat  = max(cats, key=cats.get) if cats else "N/A"
    top_pct  = round((cats[top_cat] / count * 100), 1) if count and cats else 0
    num_cats = len(cats)

    lines = [
        f"🚀 Total revenue of **${rev:,.2f}** recorded across {count:,} transactions.",
        f"📊 **{top_cat}** is the dominant category, representing {top_pct}% of all sales volume.",
        f"💡 Average transaction value is **${avg:,.2f}** — consider upselling higher-margin items.",
        f"⚠️ {num_cats} active categories detected; focus marketing on top performers to maximise ROI.",
        f"📈 Maintaining a 45% gross margin assumption, estimated profit is **${rev * 0.45:,.2f}**.",
    ]
    return "\n".join(lines)

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {
        "status": "online",
        "engine": "ForecastIQ Neural API",
        "version": "2.0.0",
        "ai_active": gemini_model is not None,
        "arima_active": ARIMA_AVAILABLE,
    }

# Module 2: Data Upload
@app.post("/upload")
async def upload_data(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content), encoding="latin-1", on_bad_lines="skip")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    df = clean_data(df)
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)

    rev       = float(df["price"].sum())
    count     = int(len(df))
    # Handle NaN in mean if df is empty
    avg_trans = float(df["price"].mean()) if not df.empty else 0.0
    if np.isnan(rev): rev = 0.0
    if np.isnan(avg_trans): avg_trans = 0.0

    cats      = {str(k): int(v) for k, v in df["category"].value_counts().items()}

    # Convert dates to strings so JSON serializes properly
    sample = df.head(200).copy()
    if "date" in sample.columns:
        sample["date"] = pd.to_datetime(sample["date"]).dt.strftime("%Y-%m-%d")
    
    sample_data = sample.to_dict(orient="records")

    # Ultimate Data Scrubber (Ensures JSON Safety)
    def clean_json(obj):
        if isinstance(obj, dict):
            return {k: clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_json(v) for v in obj]
        elif isinstance(obj, float):
            if np.isnan(obj) or np.isinf(obj): return 0.0
            return obj
        return obj

    final_response = {
        "summary": {
            "total_revenue": rev,
            "total_items": count,
            "avg_transaction": avg_trans,
            "categories": cats,
        },
        "data": sample_data,
    }

    return clean_json(final_response)

# Module 5: Forecasting
@app.post("/forecast")
async def get_forecast(request: ForecastRequest):
    if not ARIMA_AVAILABLE:
        return {"error": "pmdarima not installed. Run: pip install pmdarima"}

    df = pd.DataFrame(request.data)
    # Robust date parsing
    df["date"]  = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]) # Remove rows with invalid dates
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)
    
    # Strictly sort and resample to ensure ARIMA compatibility
    ts = df.sort_values("date").set_index("date")["price"].resample("ME").sum().fillna(0)

    if len(ts) >= 3 and ARIMA_AVAILABLE:
        try:
            # Turbo-Mode: Simpler ARIMA parameters for instant results
            arima = auto_arima(ts, seasonal=False, stepwise=True, suppress_warnings=True, error_action="ignore", max_p=2, max_q=2)
            pred, conf = arima.predict(n_periods=request.periods, return_conf_int=True)
            fut_idx = pd.date_range(start=ts.index[-1], periods=request.periods + 1, freq="ME")[1:]
            return {
                "forecast": [
                    {
                        "date": fut_idx[i].strftime("%Y-%m-%d"),
                        "prediction": float(pred[i]),
                        "conf_low": float(conf[i][0]),
                        "conf_high": float(conf[i][1]),
                    }
                    for i in range(len(fut_idx))
                ]
            }
        except Exception:
            pass

    # Fallback: Linear Trend Projection (Works with any data size > 1)
    x = np.arange(len(ts))
    y = ts.values
    slope, intercept = np.polyfit(x, y, 1) if len(y) > 1 else (0, y[0] if len(y) > 0 else 0)
    
    forecast_results = []
    last_val = y[-1] if len(y) > 0 else 0
    fut_idx = pd.date_range(start=ts.index[-1] if not ts.empty else datetime.now(), periods=request.periods + 1, freq="ME")[1:]
    
    for i in range(1, request.periods + 1):
        pred_val = max(0, last_val + (slope * i))
        forecast_results.append({
            "date": fut_idx[i-1].strftime("%Y-%m-%d"),
            "prediction": float(pred_val),
            "conf_low": float(pred_val * 0.9),
            "conf_high": float(pred_val * 1.1)
        })
        
    return {"forecast": forecast_results}

# Module 6: Customer Segmentation (RFM)
@app.post("/segmentation")
async def get_segments(request: SegmentRequest):
    df = pd.DataFrame(request.data)
    if df.empty:
        return {"segments": []}

    df["date"]  = pd.to_datetime(df["date"])
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)

    max_date = df["date"].max()
    rfm = df.groupby("customer_id").agg(
        recency=("date",   lambda x: (max_date - x.max()).days),
        frequency=("date", "count"),
        monetary=("price", "sum"),
    ).reset_index()

    def safe_qcut(series, q, labels):
        try:
            return pd.qcut(series, q, labels=labels, duplicates="drop")
        except Exception:
            return pd.Series([labels[len(labels)//2]] * len(series), index=series.index)

    rfm["r_score"] = safe_qcut(rfm["recency"],   5, [5, 4, 3, 2, 1])
    rfm["f_score"] = safe_qcut(rfm["frequency"].rank(method="first"), 5, [1, 2, 3, 4, 5])
    rfm["m_score"] = safe_qcut(rfm["monetary"],  5, [1, 2, 3, 4, 5])
    rfm["rfm_score"] = rfm[["r_score","f_score","m_score"]].apply(
        lambda x: sum(int(v) for v in x), axis=1
    )

    def label(score):
        if score >= 12: return "Champion"
        if score >= 9:  return "Loyal"
        if score >= 6:  return "At Risk"
        return "Lost"

    rfm["segment"] = rfm["rfm_score"].apply(label)

    # Ensure JSON-serialisable dtypes
    for col in ["recency","frequency","monetary","rfm_score"]:
        rfm[col] = rfm[col].astype(float)

    return {"segments": rfm.to_dict(orient="records")}

# Module 7: Inventory Optimisation
@app.post("/inventory")
async def get_inventory_status(request: InventoryRequest):
    df = pd.DataFrame(request.data)
    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)

    grp = df.groupby("category")["price"].agg(["mean","std","count"]).reset_index()
    grp.columns = ["category","avg_demand","std_demand","total_sold"]
    grp["std_demand"] = grp["std_demand"].fillna(0)

    LEAD_TIME = 7
    Z = 1.65  # 95% service level

    results = []
    for _, row in grp.iterrows():
        safety_stock  = Z * row["std_demand"] * np.sqrt(LEAD_TIME)
        reorder_point = (row["avg_demand"] * LEAD_TIME) + safety_stock
        results.append({
            "category":         str(row["category"]),
            "avg_daily_demand": round(float(row["avg_demand"]), 2),
            "safety_stock":     round(float(safety_stock), 2),
            "reorder_point":    round(float(reorder_point), 2),
            "total_sold":       int(row["total_sold"]),
            "status":           "Healthy" if row["total_sold"] > 10 else "Low Data Risk",
        })

    return {"inventory": results}

# Module 8: NLP Insight Generation
@app.post("/ai/insights")
async def get_insights(data_summary: dict):
    if gemini_model:
        try:
            prompt = (
                "You are a senior Business Analyst. Analyze this sales data and provide "
                "exactly 4 professional, actionable insights as bullet points. "
                "Each bullet must start with an emoji and be 1-2 sentences. "
                f"Data: {data_summary}"
            )
            response = gemini_model.generate_content(prompt)
            return {"insights": response.text, "source": "gemini"}
        except Exception as e:
            pass  # fall through to rule engine

    return {"insights": rule_based_insights(data_summary), "source": "rule_engine"}

# Module 9: AI Chat Assistant
@app.post("/ai/chat")
async def chat_with_data(request: ChatRequest):
    context = request.context or "No specific data context."

    if gemini_model:
        try:
            prompt = (
                f"You are ForecastIQ, an expert AI Business Analyst.\n"
                f"Dataset context: {context}\n\n"
                f"Answer the user's question concisely and professionally. "
                f"Include specific numbers from the context when relevant.\n\n"
                f"User: {request.message}"
            )
            response = gemini_model.generate_content(prompt)
            return {"response": response.text, "source": "gemini"}
        except Exception:
            pass

    # Smart local fallback
    msg = request.message.lower()
    try:
        ctx = __import__("json").loads(request.context or "{}")
        rev  = ctx.get("total_revenue", 0)
        cats = ctx.get("categories", {})
        top  = max(cats, key=cats.get) if cats else "N/A"
        if any(w in msg for w in ["revenue","sales","total"]):
            return {"response": f"📊 Total revenue recorded is **${rev:,.2f}**.", "source": "local"}
        if any(w in msg for w in ["top","best","category","product"]):
            return {"response": f"🏆 The top-performing category is **{top}**.", "source": "local"}
    except Exception:
        pass

    return {
        "response": "I'm running in local mode. Add your GEMINI_API_KEY in backend/.env for full AI chat! 🚀",
        "source": "local"
    }

# Module 10: Smart PDF Report
@app.post("/generate-report")
async def generate_report(request: ReportRequest):
    try:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        def safe_text(text):
            if not text: return "N/A"
            # Stronger sanitization for PDF compatibility
            text = str(text).replace("**", "").replace("__", "").replace("`", "'")
            return "".join(i for i in text if ord(i) < 256) # Strict Latin-1 only

        # ── Header ──
        pdf.set_font("Helvetica", "B", 20)
        pdf.set_text_color(37, 99, 235)
        pdf.cell(0, 15, "ForecastIQ Executive Report", ln=True, align="C")
        pdf.ln(5)

        # ── KPIs ──
        s = request.summary
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(50, 50, 50)
        pdf.cell(0, 10, "1. CORE PERFORMANCE METRICS", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 8, f"   - Total Revenue: ${float(s.get('total_revenue', 0)):,.2f}", ln=True)
        pdf.cell(0, 8, f"   - Transaction Mass: {int(s.get('total_items', 0)):,}", ln=True)
        pdf.ln(5)

        # ── AI Insights ──
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, "2. NEURAL INSIGHTS", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, safe_text(request.insights))
        pdf.ln(5)

        # ── Forecast ──
        if request.forecast:
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(0, 10, "3. GROWTH PROJECTION", ln=True)
            pdf.set_font("Helvetica", "", 10)
            last = request.forecast[-1]
            f_text = f"Target: ${last['prediction']:,.2f} by {last['date']}"
            pdf.cell(0, 8, f"   - {f_text}", ln=True)

        pdf_bytes = pdf.output()
        if isinstance(pdf_bytes, (bytearray, bytes)):
            content = pdf_bytes
        else:
            content = str(pdf_bytes).encode('latin-1', 'ignore')

        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=ForecastIQ_Report.pdf"}
        )
    except Exception as e:
        print(f"❌ PDF ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from datetime import datetime
from io import BytesIO

# ── PAGE CONFIG ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="ForecastIQ",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── THEME (CLEAN DARK ELITE) ─────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');

/* Force full dark background */
html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
    background-color: #050505 !important;
    color: #f1f5f9 !important;
    font-family: 'Outfit', sans-serif !important;
}
.main .block-container {
    background-color: #050505 !important;
    padding-top: 2rem;
}

/* Sidebar */
[data-testid="stSidebar"], [data-testid="stSidebarContent"] {
    background-color: #000000 !important;
    border-right: 1px solid #1e293b !important;
}
[data-testid="stSidebar"] * { color: #e2e8f0 !important; }

/* All text white-ish */
h1, h2, h3, h4, h5, h6, p, label, span, div {
    color: #f1f5f9 !important;
}

/* Auth / Card glassmorphism */
.stMetric, .auth-glass, [data-testid="stExpander"], div[data-baseweb="tab-panel"], .hero-container {
    background: rgba(15, 23, 42, 0.8) !important;
    backdrop-filter: blur(10px);
    border: 1px solid #1e293b !important;
    border-radius: 16px !important;
    padding: 20px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* Metric specific */
[data-testid="stMetricValue"] { color: #00d2ff !important; font-size: 2rem !important; font-weight: 700 !important; }
[data-testid="stMetricLabel"] { color: #64748b !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: 1px; }

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #2563eb, #00d2ff) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0.6rem 1.5rem !important;
    width: 100%;
    transition: 0.3s;
}
.stButton > button:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 210, 255, 0.4); }

/* Tabs */
[data-baseweb="tab-list"] { background-color: transparent !important; }
[data-baseweb="tab"] { color: #64748b !important; font-weight: 600 !important; font-family: 'Space Grotesk', sans-serif !important; }
[aria-selected="true"][data-baseweb="tab"] { color: #00d2ff !important; border-bottom: 3px solid #00d2ff !important; }

/* HR divider */
hr { border-color: #1e293b !important; }
</style>
""", unsafe_allow_html=True)

# ── SUPABASE CONFIG ──
SUPABASE_URL = ""
SUPABASE_KEY = ""

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception: pass

# ── AUTHENTICATION 🧬 ────────────────────────────────────────────────────────
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.user = ""

if not st.session_state.logged_in:
    c1, center, c3 = st.columns([1, 1.3, 1])
    with center:
        st.markdown("<br><br><br>", unsafe_allow_html=True)
        st.markdown("<h1 style='text-align:center; font-size:4rem; color:#fff; text-shadow: 0 0 30px #2563eb;'>ForecastIQ</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align:center; color:#64748b; letter-spacing:5px;'>NEURAL SYSTEM LOGIN</p>", unsafe_allow_html=True)
        
        st.markdown("<div class='auth-glass'><p style='color:#333; font-family:monospace; font-size:0.7rem;'>[SYSTEM READY]<br>[VAULT: SECURE]<br>[WAITING FOR KEY...]</p></div>", unsafe_allow_html=True)
        
        tab_in, tab_up = st.tabs(["🔑 UNLOCK", "🚀 SIGN UP"])
        
        with tab_in:
            with st.form("signin"):
                email = st.text_input("Project User ID", placeholder="admin@forecast.iq")
                pw = st.text_input("Access Password", type="password")
                if st.form_submit_button("SYSTEM LOGIN"):
                    if supabase:
                        try:
                            supabase.auth.sign_in_with_password({"email": email, "password": pw})
                            st.session_state.logged_in = True; st.session_state.user = email; st.rerun()
                        except: st.error("❌ Authentication Failed.")
                    elif email and pw:
                        st.session_state.logged_in = True; st.session_state.user = email; st.rerun()
        
        with tab_up:
            with st.form("signup"):
                ne = st.text_input("New Email")
                np = st.text_input("New Password", type="password")
                if st.form_submit_button("CREATE ACCOUNT"):
                    if supabase:
                        try:
                            supabase.auth.sign_up({"email": ne, "password": np})
                            st.success("✅ Account Created! Please Sign In.")
                        except: st.error("❌ Registration Failed.")
                    else: st.info("ℹ️ Supabase not linked. Dev Bypass Active.")
    st.stop()

# ── SIDEBAR ⚙️ ─────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(f"<h2 style='color:#00d2ff;'>👤 {st.session_state.user}</h2>", unsafe_allow_html=True)
    if st.button("TERMINATE SESSION"):
        st.session_state.clear(); st.rerun()
    st.divider()
    st.markdown("#### 🧪 DATA INGESTION")
    files = st.file_uploader("Upload CSV", type=["csv"], accept_multiple_files=True, label_visibility="collapsed")

# ── DATA HUB ─────────────────────────────────────────────────────────────────
@st.cache_data(show_spinner=False)
def load_data(file_list):
    if not file_list: return None
    frames = []
    for f in file_list:
        for enc in ["utf-8", "latin-1", "cp1252"]:
            try:
                frames.append(pd.read_csv(f, encoding=enc, on_bad_lines="skip"))
                break
            except: continue
    return pd.concat(frames, ignore_index=True) if frames else None

df_raw = load_data(files)

if df_raw is not None:
    df = df_raw.copy()
    c_list = df.columns.tolist()
    find = lambda keys: next((c for c in c_list if any(k in c.lower() for k in keys)), c_list[0])
    p_cat, p_price, p_date, p_cust = find(['cat','product']), find(['price','sales','amt']), find(['date','time']), find(['cust','id'])
    
    df["category"] = df[p_cat].astype(str)
    df["price"] = pd.to_numeric(df[p_price].astype(str).str.replace(r"[$,\s]", "", regex=True), errors="coerce").fillna(0)
    df["date"] = pd.to_datetime(df[p_date], errors="coerce").fillna(pd.Timestamp("today"))
    df["customer_id"] = df[p_cust].astype(str)

    with st.sidebar:
        st.markdown("<br>#### 🔍 FILTERS", unsafe_allow_html=True)
        all_cats = sorted(df["category"].unique())
        sel_cats = st.multiselect("Categories", all_cats, default=all_cats)
        pmin, pmax = float(df["price"].min()), float(df["price"].max())
        sel_price = st.slider("Price Window ($)", pmin, pmax, (pmin, pmax))
        dmin, dmax = df["date"].min().date(), df["date"].max().date()
        sel_dates = st.date_input("Audit Period", value=(dmin, dmax))

    df = df[df["category"].isin(sel_cats)]
    df = df[(df["price"] >= sel_price[0]) & (df["price"] <= sel_price[1])]
    if len(sel_dates) == 2:
        df = df[(df["date"].dt.date >= sel_dates[0]) & (df["date"].dt.date <= sel_dates[1])]

    if df.empty:
        st.warning("⚠️ SYNC ALERT: No nodes match filters.")
        st.stop()

    rev, count, prof = df["price"].sum(), len(df), df["price"].sum() * 0.45

    # ── DASHBOARD UI ──
    st.markdown(f"""
        <div class="hero-container">
            <h1 style='margin:0; font-size: 2rem;'>NEURAL HUB: FORECAST-IQ</h1>
            <p style='color: #00d2ff; letter-spacing: 2px;'>SYSTEM STATUS: 🟢 OPTIMIZED • {count:,} NODES SYNCED</p>
        </div>
    """, unsafe_allow_html=True)
    
    k1, k2, k3, k4 = st.columns(4)
    k1.metric("TOTAL REVENUE", f"${rev:,.0f}")
    k2.metric("NEURAL PROFIT (45%)", f"${prof:,.0f}")
    k3.metric("ITEM VOLUMES", f"{count:,}")
    k4.metric("AVG TRANSACTION", f"${df['price'].mean():,.2f}")

    st.divider()

    tabs = st.tabs(["🚀 ANALYTICS", "🔬 DEEP EDA", "🔮 FORECAST AI", "💬 COGNITION", "📂 EXPORT"])

    with tabs[0]:
        col_l, col_r = st.columns(2)
        with col_l:
            st.markdown("##### Revenue Performance Flux")
            tdf = df.sort_values("date").set_index("date").resample("ME")["price"].sum().reset_index()
            fig = px.area(tdf, x="date", y="price", template="plotly_dark", color_discrete_sequence=["#2563eb"])
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", height=350)
            st.plotly_chart(fig, use_container_width=True)
        with col_r:
            st.markdown("##### Category Dominance")
            cdf = df.groupby("category")["price"].sum().reset_index().sort_values("price", ascending=False)
            fig_b = px.bar(cdf, x="category", y="price", template="plotly_dark", color_discrete_sequence=["#00d2ff"])
            fig_b.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", height=350)
            st.plotly_chart(fig_b, use_container_width=True)

    with tabs[1]:
        st.markdown("### 🔬 Advanced Exploratory Analysis")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("##### 🌋 Category Contribution (Sunburst)")
            fig_sun = px.sunburst(df, path=['category'], values='price', template='plotly_dark', color_discrete_sequence=px.colors.sequential.Ice)
            fig_sun.update_layout(paper_bgcolor="rgba(0,0,0,0)", height=450)
            st.plotly_chart(fig_sun, use_container_width=True)
        with col2:
            st.markdown("##### 🏆 Best Customer Portfolios")
            topcust = df.groupby("customer_id")["price"].sum().sort_values(ascending=False).head(10).reset_index()
            fig_c = px.bar(topcust, x="customer_id", y="price", template="plotly_dark", color_discrete_sequence=["#6366f1"])
            fig_c.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", height=450)
            st.plotly_chart(fig_c, use_container_width=True)

    with tabs[2]:
        st.markdown("### 🔮 Auto-ARIMA Growth Projection")
        try:
            from pmdarima.arima import auto_arima
            ts = df.sort_values("date").set_index("date").resample("ME")["price"].sum()
            if len(ts) >= 6:
                model = auto_arima(ts, seasonal=True, m=6, suppress_warnings=True)
                pred, conf = model.predict(n_periods=4, return_conf_int=True)
                fut_idx = pd.date_range(start=ts.index[-1], periods=5, freq="ME")[1:]
                fig_f = go.Figure()
                fig_f.add_trace(go.Scatter(x=ts.index, y=ts, name="History", line=dict(color="#00d2ff", width=4)))
                fig_f.add_trace(go.Scatter(x=list(fut_idx)+list(fut_idx)[::-1], y=list(conf[:,1])+list(conf[:,0])[::-1], fill='toself', fillcolor='rgba(37,99,235,0.1)', line=dict(color='rgba(0,0,0,0)'), name="95% Confidence"))
                fig_f.add_trace(go.Scatter(x=fut_idx, y=pred, name="AI Prediction", line=dict(dash='dash', color="#2563eb", width=4)))
                fig_f.update_layout(template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", height=500)
                st.plotly_chart(fig_f, use_container_width=True)
            else: st.info("ℹ️ Need at least 6 months of data for Neural Forecasting.")
        except: st.warning("AI Node Synapse Failure. Check pmdarima.")

    with tabs[3]:
        st.markdown("### 💬 Cognition Node (AI Assistant)")
        query = st.text_input("Ask a question about your sales (e.g. 'Who is the top client?')")
        if query:
            q = query.lower()
            if "top" in q or "best" in q:
                if "client" in q or "customer" in q:
                    b = df.groupby("customer_id")["price"].sum().idxmax()
                    st.success(f"🏆 Top Client Node: **{b}**")
                else:
                    b = df.groupby("category")["price"].sum().idxmax()
                    st.success(f"🏆 Best Performing Category: **{b}**")
            elif "total" in q:
                st.info(f"📊 Total Revenue Synced: **${rev:,.2f}**")
            else: st.info("Try: 'What is my total revenue?' or 'Which is the top category?'")

    with tabs[4]:
        st.markdown("### 📁 Executive Reporting Terminal")
        cld, clr = st.columns(2)
        with cld:
            csv = df.to_csv(index=False).encode('utf-8')
            st.download_button("📥 EXPORT PROCESSED CSV", csv, "ForecastIQ_Sync.csv", "text/csv")
        with clr:
            try:
                from fpdf import FPDF
                def make_pdf():
                    pdf = FPDF(); pdf.add_page(); pdf.set_font("helvetica", 'B', 16)
                    pdf.cell(0, 10, "FORECASTIQ EXECUTIVE REPORT", 0, 1, 'C'); pdf.ln(10)
                    pdf.set_font("helvetica", size=12)
                    pdf.cell(0, 10, f"Total Volume: ${rev:,.2f}", 0, 1)
                    pdf.cell(0, 10, f"Analysis Mass: {count:,} items", 0, 1)
                    return pdf.output()
                st.download_button("📊 GENERATE PDF SUMMARY", make_pdf(), "ForecastIQ_Summary.pdf", "application/pdf")
            except: st.info("PDF Engine Buffering...")

else:
    st.markdown("<br><br><br><h1 style='text-align:center; color:#fff; font-size:5rem;'>ForecastIQ</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align:center; color:#444; font-size:1.5rem;'>SYSTEM READY • UPLOAD RECORDS TO INITIALIZE</p>", unsafe_allow_html=True)

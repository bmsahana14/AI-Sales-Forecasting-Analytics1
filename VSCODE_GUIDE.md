# 📖 ForecastIQ: Developer Guide

This guide explains how to **Run** and **Update** the ForecastIQ AI Business Intelligence platform using VS Code.

---

## 🚀 1. How to RUN the Platform

There are two ways to start the system:

### Option A: The One-Click Launcher (Recommended)
Open your terminal in the main folder and run:
```powershell
powershell ./launch.ps1
```
Then select **[3] Both** to start the Backend and Frontend together.

### Option B: Manual Startup
If you want to run them in separate windows:

**Window 1: Backend (FastAPI)**
```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

**Window 2: Frontend (React)**
```powershell
cd frontend
npm run dev
```

---

## 📤 2. How to PUSH Updates to GitHub

Follow these 3 steps whenever you make changes to your code:

1.  **Stage your changes**:
    ```powershell
    git add .
    ```
2.  **Commit your work**:
    ```powershell
    git commit -m "Brief description of what you changed"
    ```
3.  **Push to GitHub**:
    ```powershell
    git push origin main
    ```

---

## 🛠️ 3. Common Fixes (Troubleshooting)

### "fatal: Unable to create index.lock"
If Git gets stuck, run this command to unlock it:
```powershell
rm -Force .git/index.lock
```

### "Port 8000 already in use"
If the backend won't start, a previous session might be stuck. Run this to kill it:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

---
*Maintained by the ForecastIQ Team (Lead: Sahana B M)* 🚀🤖✨

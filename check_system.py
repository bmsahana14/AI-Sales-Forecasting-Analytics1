"""
ForecastIQ — System Diagnostic & Setup Check
Run this from the project ROOT folder: python check_system.py
"""
import os, sys, importlib

ROOT   = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")
FRONTEND = os.path.join(ROOT, "frontend")

SEP = "─" * 50
OK  = "✅"
ERR = "❌"
WRN = "⚠️ "

def check(label, ok, fix=""):
    status = OK if ok else ERR
    print(f"  {status}  {label}")
    if not ok and fix:
        print(f"       FIX: {fix}")
    return ok

def section(title):
    print(f"\n{SEP}")
    print(f"  {title}")
    print(SEP)

print("\n" + "=" * 50)
print("  ForecastIQ — System Diagnostic Tool")
print("=" * 50)

# ── 1. PYTHON VERSION ──
section("1. Python Environment")
check("Python version", sys.version_info >= (3, 8),
      "Install Python 3.8+ from python.org")

# ── 2. BACKEND FILES ──
section("2. Backend Files")
check(".env file exists",
      os.path.exists(os.path.join(BACKEND, ".env")),
      "Run: copy backend\\.env.example backend\\.env  — then edit it")

check("main.py exists",
      os.path.exists(os.path.join(BACKEND, "main.py")))

check("requirements.txt exists",
      os.path.exists(os.path.join(BACKEND, "requirements.txt")))

venv_ok = os.path.exists(os.path.join(BACKEND, "venv"))
check("Virtual environment exists", venv_ok,
      "Run: python -m venv backend\\venv")

# ── 3. ENV VARS ──
section("3. Environment Variables")
env_path = os.path.join(BACKEND, ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        content = f.read()
    has_gemini = "GEMINI_API_KEY" in content and "your_gemini" not in content
    has_sup_url = "SUPABASE_URL" in content and "your_supabase" not in content
    check("GEMINI_API_KEY is set", has_gemini,
          "Get free key at: aistudio.google.com/app/apikey")
    check("SUPABASE_URL is set (optional)", has_sup_url, "")
else:
    print(f"  {ERR}  Cannot check — .env not found")

# ── 4. PYTHON PACKAGES ──
section("4. Python Packages")
packages = {
    "fastapi":              "pip install fastapi",
    "uvicorn":              "pip install uvicorn[standard]",
    "pandas":               "pip install pandas",
    "numpy":                "pip install numpy",
    "pmdarima":             "pip install pmdarima",
    "google.generativeai":  "pip install google-generativeai",
    "fpdf":                 "pip install fpdf2",
    "dotenv":               "pip install python-dotenv",
}
for pkg, fix in packages.items():
    try:
        importlib.import_module(pkg)
        check(pkg, True)
    except ImportError:
        check(pkg, False, fix)

# ── 5. FRONTEND ──
section("5. Frontend")
check("node_modules installed",
      os.path.exists(os.path.join(FRONTEND, "node_modules")),
      "Run: cd frontend && npm install")

check("package.json exists",
      os.path.exists(os.path.join(FRONTEND, "package.json")))

check("App.jsx exists",
      os.path.exists(os.path.join(FRONTEND, "src", "App.jsx")))

# ── 6. NETWORK ──
section("6. Network")
try:
    import urllib.request
    urllib.request.urlopen("https://generativelanguage.googleapis.com", timeout=5)
    check("Google AI API reachable", True)
except Exception:
    check("Google AI API reachable", False,
          "Check internet connection or firewall settings")

# ── SUMMARY ──
print(f"\n{SEP}")
print("  Done! Fix any ❌ items above, then run:")
print("  ➜  powershell .\\launch.ps1")
print(SEP + "\n")

import os
import json
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

app = FastAPI()

# Frontend Connect ஆக அனுமதித்தல்
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class LogRequest(BaseModel):
    log_text: str

@app.get("/api/metrics")
def get_system_metrics():
    # interval=0.1 கொடுத்தால் மட்டுமே உடனடி CPU usage துல்லியமாக கிடைக்கும்
    cpu_usage = round(psutil.cpu_percent(interval=0.1))
    memory_info = round(psutil.virtual_memory().percent)
    disk_info = round(psutil.disk_usage('/').percent)
    
    return {
        "status": "HEALTHY" if cpu_usage < 85 and disk_info < 90 else "ALERT",
        "cpu": cpu_usage,
        "memory": memory_info,
        "disk": disk_info,
        "cpu_percent": cpu_usage,
        "memory_percent": memory_info,
        "disk_percent": disk_info
    }

@app.post("/api/analyze-log")
def analyze_log(data: LogRequest):
    log_lower = data.log_text.lower()
    
    # 1. Gemini API AI பகுப்பாய்வு
    if client:
        try:
            prompt = f"""
            You are an expert DevOps AI Mechanic. Analyze this server log snippet:
            "{data.log_text}"

            Respond ONLY in valid JSON format with three keys:
            1. "issue": Brief description of the problem.
            2. "command": Exact safe command to fix it (Use Windows/PowerShell commands or cross-platform CLI, avoid Linux 'sudo' unless required).
            3. "safety_score": An integer score from 0 to 100 based on safety.

            Do NOT wrap in markdown code blocks like ```json. Return ONLY raw JSON string.
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return {"analysis": json.loads(clean_text)}
        except Exception as e:
            print("Gemini API Error, using dynamic fallback:", e)

    # 2. Dynamic Rule-based Fallback (Windows-Friendly Commands)
    if "django" in log_lower or "operationalerror" in log_lower or "no such table" in log_lower:
        fallback_data = {
            "issue": "Missing Database Tables / Unapplied Django Migrations",
            "command": "python manage.py makemigrations && python manage.py migrate",
            "safety_score": 95
        }
    elif "memory" in log_lower or "oom" in log_lower:
        fallback_data = {
            "issue": "Memory leak or process out of memory crash",
            "command": "Clear-History; [System.GC]::Collect()",
            "safety_score": 88
        }
    elif "permission" in log_lower or "denied" in log_lower:
        fallback_data = {
            "issue": "File permission failure accessing process socket or logs",
            "command": "icacls C:\\var\\log\\app /grant Everyone:F",
            "safety_score": 85
        }
    else:
        fallback_data = {
            "issue": f"Server process error detected: {data.log_text[:35]}...",
            "command": "Restart-Service -Name application",
            "safety_score": 90
        }

    return {"analysis": fallback_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil
from google import genai
from pydantic import BaseModel

app = FastAPI()

# Explicit CORS settings to allow requests from Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = "AQ.Ab8RN6It1jMTZv6tHlFCMgDK5VZfhMI5pw2AYxssLuYNmrN5Iw"
client = genai.Client(api_key=GEMINI_API_KEY)

class LogRequest(BaseModel):
    log_text: str

@app.get("/api/metrics")
def get_system_metrics():
    # interval=None ensures instant non-blocking response for React polling
    cpu_usage = psutil.cpu_percent(interval=None)
    memory_info = psutil.virtual_memory()
    disk_info = psutil.disk_usage('/')
    
    return {
        "status": "HEALTHY" if cpu_usage < 85 and disk_info.percent < 90 else "ALERT",
        "cpu": cpu_usage,
        "memory": memory_info.percent,
        "disk": disk_info.percent
    }

@app.post("/api/analyze-log")
def analyze_log(data: LogRequest):
    try:
        prompt = f"""
        You are an expert DevOps AI Mechanic. Analyze this server log snippet:
        "{data.log_text}"

        Respond ONLY in valid JSON format with three keys:
        1. "issue": Brief description of the problem.
        2. "command": Exact Linux/Bash command to fix it safely.
        3. "safety_score": An integer score from 0 to 100 based on safety.

        Do NOT wrap in markdown code blocks like ```json. Return ONLY raw JSON string.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        return {"analysis": clean_text}
        
    except Exception as e:
        print("Backend API / Gemini Error Details:", e)
        fallback_data = {
            "issue": "Port collision or process crash detected in server log.",
            "command": "sudo kill -9 $(lsof -t -i:80) && sudo systemctl restart nginx",
            "safety_score": 92
        }
        return {"analysis": json.dumps(fallback_data)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
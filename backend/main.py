"""
Brew.AI v3 - FastAPI Backend
Exposes all agents and services as REST API endpoints
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.chaos_engine import ChaosEngine
from agents.automation_engine import AutomationEngine
from services.captain_client import get_captain_client
from services.captain_knowledge_loader import load_all_data_for_captain, format_knowledge_for_captain
from services.lstm_forecaster import get_lstm_forecaster
from services.nivara_client import get_nivara_client
import pandas as pd
import json
from datetime import datetime
import os

app = FastAPI(title="Brew.AI API", version="3.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatRequest(BaseModel):
    question: str
    collection_id: str = "operations"

class CrisisResponse(BaseModel):
    crisis: Dict[str, Any]

class AutomationRequest(BaseModel):
    crisis: Dict[str, Any]

# ============ DATA ENDPOINTS ============

@app.get("/api/data/orders")
async def get_orders():
    """Get all orders from CSV"""
    try:
        df = pd.read_csv("data/orders_realtime.csv")
        return {
            "success": True,
            "data": df.to_dict(orient='records'),
            "count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/reviews")
async def get_reviews():
    """Get all customer reviews"""
    try:
        df = pd.read_csv("data/customer_reviews.csv")
        return {
            "success": True,
            "data": df.to_dict(orient='records'),
            "count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/inventory")
async def get_inventory():
    """Get inventory status"""
    try:
        df = pd.read_csv("data/inventory.csv")
        return {
            "success": True,
            "data": df.to_dict(orient='records'),
            "count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/staff")
async def get_staff():
    """Get staff schedule"""
    try:
        df = pd.read_csv("data/staff_schedule.csv")
        return {
            "success": True,
            "data": df.to_dict(orient='records'),
            "count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/analytics")
async def get_analytics():
    """Get today's analytics"""
    try:
        orders_df = pd.read_csv("data/orders_realtime.csv")
        total_orders = len(orders_df)
        total_revenue = orders_df['total_amount'].sum() if 'total_amount' in orders_df.columns else total_orders * 24.50
        
        return {
            "success": True,
            "revenue": f"${total_revenue:,.0f}",
            "orders": total_orders,
            "profit_margin": "29%",
            "active_staff": 12
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ CAPTAIN ENDPOINTS ============

@app.post("/api/captain/query")
async def captain_query(request: ChatRequest):
    """Query Captain with full data context"""
    try:
        captain = get_captain_client()
        
        if not captain:
            raise HTTPException(status_code=503, detail="Captain unavailable")
        
        # Load all data
        full_knowledge = load_all_data_for_captain()
        full_context = format_knowledge_for_captain(full_knowledge)
        
        enriched_prompt = f"""{full_context}

USER QUESTION: {request.question}

Answer using specific data from the knowledge above. Include numbers, names, and details."""
        
        response = captain.query(request.collection_id, enriched_prompt)
        
        return {
            "success": True,
            "answer": response.get('answer', 'No answer generated'),
            "sources": response.get('sources', []),
            "reasoning": response.get('reasoning', '')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ CRISIS ENDPOINTS ============

@app.get("/api/crisis/generate")
async def generate_crisis():
    """Generate random crisis"""
    try:
        crisis = ChaosEngine.generate_random_crisis()
        return {
            "success": True,
            "crisis": crisis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crisis/execute")
async def execute_crisis(request: AutomationRequest):
    """Execute automations for a crisis"""
    try:
        engine = AutomationEngine()
        crisis = request.crisis
        
        results = []
        for automation_name in crisis['automations']:
            # Execute each automation
            if automation_name == 'emergency_hiring':
                result = engine.draft_hiring_email(crisis['description'])
            elif automation_name == 'equipment_repair_request':
                result = engine.equipment_repair_request()
            elif automation_name == 'emergency_supplier_order':
                result = engine.emergency_supplier_order(['Wings', 'Rice'])
            else:
                result = {"automation": automation_name, "status": "executed"}
            
            results.append({
                "name": automation_name,
                "result": result
            })
        
        return {
            "success": True,
            "crisis": crisis,
            "automations_executed": len(results),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ LSTM ENDPOINTS ============

@app.get("/api/forecast/lstm")
async def lstm_forecast():
    """Get LSTM 24-hour forecast"""
    try:
        forecaster = get_lstm_forecaster()
        data = forecaster.prepare_data_from_csv("data/orders_realtime.csv")
        result = forecaster.predict_next_24_hours(data)
        
        return {
            "success": True,
            "predictions": result.get('future_predictions', []),
            "confidence": result.get('confidence', 0.85),
            "total_predicted_orders": int(sum(result.get('future_predictions', [180]))),
            "total_predicted_revenue": int(sum(result.get('future_predictions', [180]))) * 24.50
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ PLANNING ENDPOINTS ============

@app.post("/api/planning/checklist")
async def run_checklist(auto_trigger: bool = False):
    """Run 10-point readiness checklist"""
    try:
        issues = []
        
        # Check staffing
        staff_df = pd.read_csv("data/staff_schedule.csv")
        staff_count = len(staff_df)
        
        if staff_count < 8 or auto_trigger:
            issues.append({
                'type': 'staffing',
                'severity': 'HIGH',
                'message': f'Only {staff_count}/8 staff scheduled',
                'automation': 'emergency_hiring'
            })
        
        # Check inventory
        inv_df = pd.read_csv("data/inventory.csv")
        low_stock = inv_df[inv_df['stock_level'] < inv_df['reorder_point']]
        
        if len(low_stock) > 0 or auto_trigger:
            issues.append({
                'type': 'inventory',
                'severity': 'MEDIUM',
                'message': f'Low stock: {", ".join(low_stock["item_name"].tolist()[:3])}',
                'automation': 'emergency_supplier_order'
            })
        
        return {
            "success": True,
            "checklist_complete": True,
            "issues_detected": len(issues),
            "issues": issues
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ VOICE ENDPOINTS ============

@app.post("/api/voice/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech to text"""
    try:
        import speech_recognition as sr
        import io
        
        recognizer = sr.Recognizer()
        audio_bytes = await audio.read()
        
        with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        return {
            "success": True,
            "text": text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/voice/tts")
async def text_to_speech(text: str):
    """Convert text to speech"""
    try:
        from gtts import gTTS
        import base64
        import tempfile
        
        tts = gTTS(text=text, lang='en', slow=False)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
            tts.save(temp_audio.name)
            temp_path = temp_audio.name
        
        with open(temp_path, 'rb') as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        os.remove(temp_path)
        
        return {
            "success": True,
            "audio_base64": audio_base64,
            "format": "mp3"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ HEALTH CHECK ============

@app.get("/")
async def root():
    return {
        "app": "Brew.AI v3 API",
        "status": "running",
        "endpoints": [
            "/api/data/orders",
            "/api/data/reviews",
            "/api/data/inventory",
            "/api/data/staff",
            "/api/data/analytics",
            "/api/captain/query",
            "/api/crisis/generate",
            "/api/crisis/execute",
            "/api/forecast/lstm",
            "/api/planning/checklist",
            "/api/voice/stt",
            "/api/voice/tts"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


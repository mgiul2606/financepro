# backend/app/main.py - VERSIONE MINIMALE PER DEBUG
from fastapi import FastAPI
from datetime import datetime

app = FastAPI(
    title="FinancePro API",
    version="1.0.0",
    description="Financial Management API - DEBUG MODE"
)

@app.get("/")
async def root():
    return {
        "name": "FinancePro",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/test")
async def test():
    return {"message": "Backend is working!"}
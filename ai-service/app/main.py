from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DSS AI Purchase - AI Forecasting Service",
    description="Stateless Pure Compute Engine for Time-Series Demand Forecasting (Holt-Winters & Baseline SMA-7)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "UP",
        "service": "dss-ai-service",
        "mode": "stateless_pure_compute",
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "DSS AI Purchase Forecasting Engine is ready.",
        "docs_url": "/docs",
    }

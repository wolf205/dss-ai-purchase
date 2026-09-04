import os
import time
from typing import List
from pydantic import BaseModel, Field

class Settings(BaseModel):
    """
    Application settings loaded from environment variables with sensible defaults.
    Designed for Stateless Pure Compute AI Forecasting Service.
    """
    PROJECT_NAME: str = "DSS AI Purchase - AI Forecasting Service"
    DESCRIPTION: str = "Stateless Pure Compute Engine for Time-Series Demand Forecasting (Holt-Winters & Baseline SMA-7)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    LOG_LEVEL: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            origin.strip() 
            for origin in os.getenv("CORS_ORIGINS", "*").split(",") 
            if origin.strip()
        ]
    )

    # Business Rules Thresholds
    WAPE_FALLBACK_THRESHOLD: float = 40.0  # BR-007: Fallback to SMA-7 if WAPE > 40%
    MIN_DAYS_FOR_SMA7: int = 14            # BR-006: Tier 2 threshold
    MIN_DAYS_FOR_AI: int = 30              # BR-006: Tier 3 threshold
    DEFAULT_HORIZON_DAYS: int = 14         # Default horizon for forecasting (7, 14, 30)
    CONFIDENCE_INTERVAL_Z: float = 1.65    # Z-score multiplier for ~95% confidence interval

settings = Settings()
START_TIME = time.time()


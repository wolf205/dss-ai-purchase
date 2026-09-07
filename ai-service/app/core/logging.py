import logging
import sys
from app.core.config import settings

def setup_logger(name: str = "ai_service") -> logging.Logger:
    """
    Cấu hình structured logger tập trung cho AI Service.
    Đảm bảo định dạng nhất quán: Timestamp - LoggerName - Level - Message.
    """
    logger = logging.getLogger(name)
    
    # Tránh gắn handler nhiều lần nếu hàm được gọi lại
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)
    return logger

logger = setup_logger()

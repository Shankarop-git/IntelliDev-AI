"""
Backend environment configuration.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IntelliDev AI API"
    DEBUG: bool = False

    # CORS — in production restrict this to your Vercel domain
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Groq API
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

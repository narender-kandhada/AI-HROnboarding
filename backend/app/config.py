from pydantic_settings import BaseSettings
from pydantic import Extra, field_validator
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./novabot.db"

    # Render provides postgres:// but SQLAlchemy 2.0+ requires postgresql://
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_postgres_url(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # 🔥 MAKE AI KEYS OPTIONAL
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = Extra.allow 

settings = Settings()

from pydantic_settings import BaseSettings
from pydantic import Extra
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./novabot.db"
    OPENAI_API_KEY: str
    GEMINI_API_KEY: Optional[str]


    class Config:
        env_file = ".env"
        extra = Extra.allow 

settings = Settings()
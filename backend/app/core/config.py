import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Scott Chatbot"
    API_V1_STR: str = "/api/v1"
    
    # Mặc định dùng SQLite để test. Khi lên Docker ta sẽ đổi thành PostgreSQL qua biến môi trường này.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "thay-doi-chuoi-nay-thanh-bi-mat-nhe")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

settings = Settings()
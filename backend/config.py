import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load local .env for development
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Config:
    # =========================
    # Security
    # =========================
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "career-ai-super-secret-key"
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "career-ai-jwt-secret-key"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # =========================
    # Database
    # =========================
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'career_navigator.db')}"
    )

    # Render/Heroku compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql://",
            1
        )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =========================
    # Groq AI
    # =========================
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "llama-3.3-70b-versatile"
    )

    # =========================
    # Uploads
    # =========================
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

    ALLOWED_EXTENSIONS = {
        "pdf"
    }

    # =========================
    # CORS
    # =========================
    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    # =========================
    # Production Settings
    # =========================
    DEBUG = os.getenv(
        "FLASK_ENV",
        "development"
    ) == "development"
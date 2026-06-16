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

    # Render/Heroku/Neon compatibility: postgres:// -> postgresql://
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://",
            "postgresql://",
            1
        )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # -----------------------------------------------------------
    # Connection Pool Configuration
    # 
    # Neon serverless PostgreSQL aggressively kills idle SSL 
    # connections (~5 min). These settings ensure resilience:
    #
    # pool_pre_ping:  Test connection before each checkout.
    #                 If dead, discard and get a new one.
    # pool_recycle:   Proactively replace connections older than
    #                 this (seconds). 120s = well within Neon's
    #                 5-minute idle timeout.
    # pool_size:      Number of persistent connections in pool.
    # max_overflow:   Extra connections allowed beyond pool_size.
    # pool_timeout:   Seconds to wait for a connection from pool.
    # -----------------------------------------------------------
    IS_POSTGRES = (
        DATABASE_URL.startswith("postgresql://") or
        DATABASE_URL.startswith("postgres://")
    ) if DATABASE_URL else False

    if IS_POSTGRES:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_size": 10,
            "max_overflow": 20,
            "pool_timeout": 30,
            "connect_args": {
                "sslmode": "require",
                "connect_timeout": 10,
            }
        }
    else:
        # SQLite doesn't support pool_size/max_overflow/pool_timeout
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
        }

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


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret-key-123"
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "test_uploads")
    SQLALCHEMY_ENGINE_OPTIONS = {}
    IS_POSTGRES = False
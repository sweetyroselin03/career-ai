"""
WSGI entrypoint for Gunicorn on Render.

This is a dedicated production entrypoint that avoids the naming
collision between app.py and the app/ package directory.

Usage (Render Start Command):
    gunicorn wsgi:app

For local development, use run.py instead:
    python run.py
"""
from app import create_app

app = create_app()

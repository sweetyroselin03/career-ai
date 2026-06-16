from flask import Blueprint, jsonify
from app.models import db

health_bp = Blueprint('health', __name__)

@health_bp.route("/health", methods=["GET"])
def health():
    db_status = "connected"
    try:
        db.session.execute(db.text('SELECT 1'))
        db.session.commit()
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "message": "CareerAI Navigator API is online"
    }), 200

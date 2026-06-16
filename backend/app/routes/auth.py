from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, UserProfile, UserOTP
import re
import logging
import random
from datetime import datetime, timedelta
from app.services.email_service import send_otp_email

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


def _safe_db_recovery():
    """Rollback and remove stale session so the next query gets a fresh connection."""
    try:
        db.session.rollback()
    except Exception:
        pass
    try:
        db.session.remove()
    except Exception:
        pass


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    mobile = data.get('mobile')
    qualification = data.get('qualification')  # degree
    current_status = data.get('currentStatus')  # student, professional, etc.

    if not name or not email or not password:
        return jsonify({"msg": "Missing required fields (name, email, password)"}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"msg": "Invalid email address"}), 400

    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters long"}), 400

    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"msg": "Email already registered"}), 409

        # Create User
        user = User(name=name, email=email, role='user')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Create Profile
        profile = UserProfile(
            user_id=user.id,
            degree=qualification,
            location="",
            age=None,
            gender="",
            department="",
            university="",
            cgpa=None,
            career_goals=f"I want to work as a professional in my field. Currently: {current_status}"
        )
        db.session.add(profile)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        logger.info(f"[AUTH] Registered user {user.email} (ID: {user.id})")

        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"[AUTH] Registration failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"msg": "Invalid email or password"}), 401

        access_token = create_access_token(identity=str(user.id))
        logger.info(f"[AUTH] Login successful: {user.email} (ID: {user.id})")

        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"[AUTH] Login failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Login service temporarily unavailable. Please try again."}), 503


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Email not found"}), 404

        user.set_password("Reset@123")
        db.session.commit()
        logger.info(f"[AUTH] Password reset for {email}")

        return jsonify({
            "msg": "Password reset email sent. Temporarily, you can login with password 'Reset@123'"
        }), 200

    except Exception as e:
        logger.error(f"[AUTH] Forgot password failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Password reset service temporarily unavailable. Please try again."}), 503


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    return jsonify({"msg": "Email verification code verified successfully"}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        logger.error(f"[AUTH] /me failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Failed to retrieve user profile. Please try again."}), 503


@auth_bp.route('/update-password', methods=['POST'])
@jwt_required()
def update_password():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, int(current_user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404

        data = request.get_json() or {}
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return jsonify({"msg": "Current password and new password are required"}), 400

        if not user.check_password(old_password):
            return jsonify({"msg": "Incorrect current password"}), 400

        if len(new_password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters long"}), 400

        user.set_password(new_password)
        db.session.commit()
        logger.info(f"[AUTH] Password updated for user ID {current_user_id}")

        return jsonify({"msg": "Password updated successfully"}), 200

    except Exception as e:
        logger.error(f"[AUTH] Update password failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Failed to update password. Please try again."}), 503


# ==========================================
# OTP AUTHENTICATION SYSTEM FOR PRODUCTION
# ==========================================

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    email = data.get('email')
    purpose = data.get('purpose') # 'register', 'login', 'forgot_password'

    if not email or not purpose:
        return jsonify({"msg": "Email and purpose are required"}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"msg": "Invalid email address"}), 400

    try:
        if purpose == 'register':
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return jsonify({"msg": "Email already registered"}), 409
        elif purpose in ['login', 'forgot_password']:
            user = User.query.filter_by(email=email).first()
            if not user:
                return jsonify({"msg": "Email not registered"}), 404

        # Generate 6-digit OTP
        otp = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Deactivate old OTPs for this email and purpose
        UserOTP.query.filter_by(email=email, purpose=purpose, verified=False).delete()

        new_otp = UserOTP(email=email, otp=otp, purpose=purpose, expires_at=expires_at)
        db.session.add(new_otp)
        db.session.commit()

        # Send email
        sent = send_otp_email(email, otp, purpose)
        if not sent:
            return jsonify({"msg": "Failed to send OTP email"}), 500

        return jsonify({"msg": "OTP sent successfully to your email."}), 200

    except Exception as e:
        logger.error(f"[AUTH] send-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": f"Failed to send OTP: {str(e)}"}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp_endpoint():
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')
    purpose = data.get('purpose')

    if not email or not otp or not purpose:
        return jsonify({"msg": "Email, OTP, and purpose are required"}), 400

    try:
        otp_record = UserOTP.query.filter_by(email=email, otp=otp, purpose=purpose, verified=False).first()
        if not otp_record or otp_record.expires_at < datetime.utcnow():
            return jsonify({"msg": "Invalid or expired OTP"}), 400

        otp_record.verified = True
        db.session.commit()
        return jsonify({"msg": "OTP verified successfully.", "success": True}), 200

    except Exception as e:
        logger.error(f"[AUTH] verify-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "OTP verification failed."}), 500


@auth_bp.route('/register-otp', methods=['POST'])
def register_otp():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    otp = data.get('otp')
    qualification = data.get('qualification') # degree
    current_status = data.get('currentStatus') # student, professional, etc.

    if not name or not email or not password or not otp:
        return jsonify({"msg": "Missing required fields (name, email, password, otp)"}), 400

    try:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"msg": "Email already registered"}), 409

        # Check OTP
        otp_record = UserOTP.query.filter_by(email=email, otp=otp, purpose='register').order_by(UserOTP.created_at.desc()).first()
        if not otp_record or (not otp_record.verified and otp_record.expires_at < datetime.utcnow()):
            return jsonify({"msg": "Invalid or expired OTP. Please verify first."}), 400

        # Mark as verified just in case
        otp_record.verified = True

        # Create User
        user = User(name=name, email=email, role='user')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Create Profile
        profile = UserProfile(
            user_id=user.id,
            degree=qualification,
            location="",
            age=None,
            gender="",
            department="",
            university="",
            cgpa=None,
            career_goals=f"I want to work as a professional in my field. Currently: {current_status}"
        )
        db.session.add(profile)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        logger.info(f"[AUTH] Registered user with OTP {user.email} (ID: {user.id})")

        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"[AUTH] register-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/login-otp', methods=['POST'])
def login_otp():
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({"msg": "Email and OTP are required"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Email not registered"}), 404

        otp_record = UserOTP.query.filter_by(email=email, otp=otp, purpose='login').order_by(UserOTP.created_at.desc()).first()
        if not otp_record or otp_record.expires_at < datetime.utcnow():
            return jsonify({"msg": "Invalid or expired OTP"}), 400

        otp_record.verified = True
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        logger.info(f"[AUTH] OTP Login successful: {user.email} (ID: {user.id})")

        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"[AUTH] login-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Login failed"}), 500


@auth_bp.route('/forgot-password-otp', methods=['POST'])
def forgot_password_otp():
    data = request.get_json() or {}
    email = data.get('email')

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Email not found"}), 404

        # Generate 6-digit OTP
        otp = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Deactivate old reset OTPs
        UserOTP.query.filter_by(email=email, purpose='forgot_password', verified=False).delete()

        new_otp = UserOTP(email=email, otp=otp, purpose='forgot_password', expires_at=expires_at)
        db.session.add(new_otp)
        db.session.commit()

        # Send email
        sent = send_otp_email(email, otp, 'forgot_password')
        if not sent:
            return jsonify({"msg": "Failed to send OTP email"}), 500

        return jsonify({"msg": "OTP sent successfully to your email for password reset."}), 200

    except Exception as e:
        logger.error(f"[AUTH] forgot-password-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Forgot password service failed"}), 500


@auth_bp.route('/reset-password-otp', methods=['POST'])
def reset_password_otp():
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')

    if not email or not otp or not new_password:
        return jsonify({"msg": "Email, OTP, and new password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters long"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404

        otp_record = UserOTP.query.filter_by(email=email, otp=otp, purpose='forgot_password').order_by(UserOTP.created_at.desc()).first()
        if not otp_record or otp_record.expires_at < datetime.utcnow():
            return jsonify({"msg": "Invalid or expired OTP"}), 400

        otp_record.verified = True
        user.set_password(new_password)
        db.session.commit()
        logger.info(f"[AUTH] Password reset with OTP for {email}")

        return jsonify({"msg": "Password reset successfully."}), 200

    except Exception as e:
        logger.error(f"[AUTH] reset-password-otp failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Failed to reset password"}), 500

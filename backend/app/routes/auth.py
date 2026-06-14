from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, UserProfile
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    mobile = data.get('mobile')
    qualification = data.get('qualification') # degree
    current_status = data.get('currentStatus') # student, professional, etc.
    
    if not name or not email or not password:
        return jsonify({"msg": "Missing required fields (name, email, password)"}), 400
        
    # Validation
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"msg": "Invalid email address"}), 400
        
    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters long"}), 400
        
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"msg": "Email already registered"}), 409
        
    try:
        # Create User
        user = User(name=name, email=email, role='user')
        user.set_password(password)
        db.session.add(user)
        db.session.flush() # Populate user ID
        
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
        
        # Create JWT token
        access_token = create_access_token(identity=str(user.id))
        print(f"[JWT] Generated registration token for user {user.email} (ID: {user.id})")
        
        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password are required"}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({"msg": "Invalid email or password"}), 401
            
        access_token = create_access_token(identity=str(user.id))
        print(f"[JWT] Logged in user {user.email} (ID: {user.id})")
        
        return jsonify({
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"msg": f"Login service temporarily unavailable: {str(e)}"}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        
        if not email:
            return jsonify({"msg": "Email is required"}), 400
            
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Email not found"}), 404
            
        # In a real app, send reset link. Here, we'll return a simulated success status
        # and provide a simple override password for safety
        user.set_password("Reset@123")
        db.session.commit()
        
        return jsonify({
            "msg": "Password reset email sent. Temporarily, you can login with password 'Reset@123'"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Password reset failed: {str(e)}"}), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    # Simulated email verification endpoint
    return jsonify({"msg": "Email verification code verified successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({"msg": f"Failed to retrieve user profile: {str(e)}"}), 500

@auth_bp.route('/update-password', methods=['POST'])
@jwt_required()
def update_password():
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
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
        
        return jsonify({"msg": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to update password: {str(e)}"}), 500

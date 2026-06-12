from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, UserProfile, Skill, User
import json

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        # Auto-create profile if missing
        profile = UserProfile(user_id=current_user_id)
        db.session.add(profile)
        db.session.commit()
        
    return jsonify(profile.to_dict()), 200

@profile_bp.route('/', methods=['POST', 'PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user_id)
        db.session.add(profile)
        
    data = request.get_json() or {}
    
    # Update simple fields
    if 'age' in data:
        profile.age = data.get('age')
    if 'gender' in data:
        profile.gender = data.get('gender')
    if 'location' in data:
        profile.location = data.get('location')
    if 'degree' in data:
        profile.degree = data.get('degree')
    if 'department' in data:
        profile.department = data.get('department')
    if 'university' in data:
        profile.university = data.get('university')
    if 'cgpa' in data:
        profile.cgpa = data.get('cgpa')
    if 'career_goals' in data:
        profile.career_goals = data.get('career_goals')
        
    # Update JSON fields
    if 'skills' in data:
        # Expecting a dict, e.g. {"Python": 80, "SQL": 60}
        profile.set_skills(data.get('skills', {}))
    if 'interests' in data:
        # Expecting a list of strings
        profile.set_interests(data.get('interests', []))
        
    try:
        db.session.commit()
        return jsonify({
            "msg": "Profile updated successfully",
            "profile": profile.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to update profile: {str(e)}"}), 500

@profile_bp.route('/skills', methods=['GET'])
def get_skills():
    skills = Skill.query.all()
    return jsonify([s.to_dict() for s in skills]), 200

@profile_bp.route('/skills', methods=['POST'])
@jwt_required()
def create_skill():
    data = request.get_json() or {}
    name = data.get('name')
    category = data.get('category', 'technical')
    
    if not name:
        return jsonify({"msg": "Skill name is required"}), 400
        
    existing = Skill.query.filter_by(name=name).first()
    if existing:
        return jsonify({"msg": "Skill already exists", "skill": existing.to_dict()}), 409
        
    try:
        new_skill = Skill(name=name, category=category)
        db.session.add(new_skill)
        db.session.commit()
        return jsonify({
            "msg": "Skill created successfully",
            "skill": new_skill.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to create skill: {str(e)}"}), 500

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, UserProfile, Skill, User
import json
import logging
import re

logger = logging.getLogger(__name__)
profile_bp = Blueprint('profile', __name__)

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

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user_id = get_jwt_identity()
        profile = UserProfile.query.filter_by(user_id=current_user_id).first()

        if not profile:
            profile = UserProfile(user_id=current_user_id)
            db.session.add(profile)
            db.session.commit()

        return jsonify(profile.to_dict()), 200

    except Exception as e:
        logger.error(f"[PROFILE] GET failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": "Failed to load profile. Please try again."}), 503

@profile_bp.route('/', methods=['POST', 'PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        profile = UserProfile.query.filter_by(user_id=current_user_id).first()

        if not profile:
            profile = UserProfile(user_id=current_user_id)
            db.session.add(profile)

        data = request.get_json() or {}

        # URL validation helper
        def check_url_field(url, field_name):
            if not url:
                return None
            url_str = str(url).strip()
            if not url_str:
                return None
            if not (url_str.startswith('http://') or url_str.startswith('https://')):
                url_str = 'https://' + url_str
            if not re.match(r'^https?://[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(/\S*)?$', url_str):
                raise ValueError(f"Invalid URL format for {field_name}")
            return url_str

        # Validations
        if 'age' in data and data.get('age') is not None and data.get('age') != '':
            try:
                age_val = int(data.get('age'))
                if age_val < 15 or age_val > 100:
                    return jsonify({"msg": "Age must be between 15 and 100"}), 400
            except ValueError:
                return jsonify({"msg": "Age must be a valid integer"}), 400

        if 'cgpa' in data and data.get('cgpa') is not None and data.get('cgpa') != '':
            try:
                cgpa_val = float(data.get('cgpa'))
                if cgpa_val < 0.0 or cgpa_val > 10.0:
                    return jsonify({"msg": "CGPA must be between 0.0 and 10.0"}), 400
            except ValueError:
                return jsonify({"msg": "CGPA must be a valid decimal number"}), 400

        try:
            if 'github' in data:
                profile.github = check_url_field(data.get('github'), 'GitHub Link')
            if 'linkedin' in data:
                profile.linkedin = check_url_field(data.get('linkedin'), 'LinkedIn Link')
            if 'portfolio' in data:
                profile.portfolio = check_url_field(data.get('portfolio'), 'Portfolio Link')
        except ValueError as val_err:
            return jsonify({"msg": str(val_err)}), 400

        # Update simple fields
        if 'age' in data:
            profile.age = data.get('age') if data.get('age') != '' else None
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
            profile.cgpa = data.get('cgpa') if data.get('cgpa') != '' else None
        if 'career_goals' in data:
            profile.career_goals = data.get('career_goals')

        # Update JSON fields
        if 'skills' in data:
            profile.set_skills(data.get('skills', {}))
        if 'interests' in data:
            profile.set_interests(data.get('interests', []))
        if 'certifications' in data:
            profile.set_certifications(data.get('certifications', []))
        if 'projects' in data:
            profile.set_projects(data.get('projects', []))

        db.session.commit()
        logger.info(f"[PROFILE] Updated profile for user {current_user_id}")

        return jsonify({
            "msg": "Profile updated successfully",
            "profile": profile.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"[PROFILE] Update failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": f"Failed to update profile: {str(e)}"}), 503

@profile_bp.route('/skills', methods=['GET'])
def get_skills():
    try:
        skills = Skill.query.all()
        return jsonify([s.to_dict() for s in skills]), 200
    except Exception as e:
        logger.error(f"[SKILLS] GET /skills failed: {e}")
        _safe_db_recovery()
        return jsonify([]), 200

@profile_bp.route('/skills', methods=['POST'])
@jwt_required()
def create_skill():
    data = request.get_json() or {}
    name = data.get('name')
    category = data.get('category', 'technical')

    if not name:
        return jsonify({"msg": "Skill name is required"}), 400

    try:
        existing = Skill.query.filter_by(name=name).first()
        if existing:
            return jsonify({"msg": "Skill already exists", "skill": existing.to_dict()}), 409

        new_skill = Skill(name=name, category=category)
        db.session.add(new_skill)
        db.session.commit()
        logger.info(f"[SKILLS] Created skill: {name}")

        return jsonify({
            "msg": "Skill created successfully",
            "skill": new_skill.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"[SKILLS] Create failed: {e}")
        _safe_db_recovery()
        return jsonify({"msg": f"Failed to create skill: {str(e)}"}), 503

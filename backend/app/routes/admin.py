from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Career, Skill, Course, Recommendation, UserProfile
from sqlalchemy import func
import json

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    # Custom decorator or helper to verify admin role
    return fn

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user or user.role != 'admin':
        return jsonify({"msg": "Unauthorized. Admin privileges required."}), 403
        
    total_users = User.query.count()
    total_careers = Career.query.count()
    total_skills = Skill.query.count()
    total_courses = Course.query.count()
    
    # Active Users: Users who have filled out some skills in their profile
    active_users = UserProfile.query.filter(UserProfile.skills_json != '{}').count()
    
    # Top Recommended Careers
    top_recs_query = db.session.query(
        Career.name, func.count(Recommendation.id).label('count')
    ).join(Recommendation, Recommendation.career_id == Career.id)\
     .group_by(Career.name)\
     .order_by(func.count(Recommendation.id).desc())\
     .limit(5).all()
     
    top_careers = [{"name": name, "count": count} for name, count in top_recs_query]
    
    # Fallback default values if no recommendations exist yet
    if not top_careers:
        top_careers = [
            {"name": "Data Scientist", "count": 1},
            {"name": "Machine Learning Engineer", "count": 1},
            {"name": "Software Engineer", "count": 1}
        ]
        
    # Most Popular Skills chosen by users in user profiles
    profiles = UserProfile.query.all()
    skill_counts = {}
    for p in profiles:
        skills = p.get_skills()
        for s in skills:
            skill_counts[s] = skill_counts.get(s, 0) + 1
            
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    popular_skills = [{"name": name, "count": count} for name, count in sorted_skills]
    
    # Fallback popular skills
    if not popular_skills:
        popular_skills = [
            {"name": "Python", "count": 1},
            {"name": "SQL", "count": 1},
            {"name": "Web Development", "count": 1}
        ]
        
    return jsonify({
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "total_careers": total_careers,
            "total_skills": total_skills,
            "total_courses": total_courses,
            "top_careers": top_careers,
            "popular_skills": popular_skills
        }
    }), 200

# User Management APIs
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"msg": "User not found"}), 404
        
    data = request.get_json() or {}
    new_role = data.get('role')
    
    if new_role not in ['user', 'admin']:
        return jsonify({"msg": "Invalid role"}), 400
        
    target_user.role = new_role
    db.session.commit()
    return jsonify({"msg": "User role updated successfully", "user": target_user.to_dict()}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"msg": "User not found"}), 404
        
    db.session.delete(target_user)
    db.session.commit()
    return jsonify({"msg": "User deleted successfully"}), 200

# Career Management APIs
@admin_bp.route('/careers', methods=['GET'])
def list_careers():
    careers = Career.query.all()
    return jsonify([c.to_dict() for c in careers]), 200

@admin_bp.route('/careers', methods=['POST'])
@jwt_required()
def create_career():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    salary_range = data.get('salary_range')
    growth_rate = data.get('growth_rate')
    required_skills = data.get('required_skills') # comma separated
    
    if not name or not description or not salary_range or not growth_rate or not required_skills:
        return jsonify({"msg": "Missing required fields"}), 400
        
    career = Career(
        name=name,
        description=description,
        salary_range=salary_range,
        growth_rate=growth_rate,
        required_skills=required_skills
    )
    db.session.add(career)
    db.session.commit()
    
    # Retrain recommendations model to encompass new career data
    from train_model import train_and_save_recommendation_models
    train_and_save_recommendation_models()
    
    return jsonify({"msg": "Career created and recommendation engine retrained successfully", "career": career.to_dict()}), 201

@admin_bp.route('/careers/<int:career_id>', methods=['PUT'])
@jwt_required()
def update_career(career_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    career = db.session.get(Career, career_id)
    if not career:
        return jsonify({"msg": "Career not found"}), 404
        
    data = request.get_json() or {}
    if 'name' in data:
        career.name = data.get('name')
    if 'description' in data:
        career.description = data.get('description')
    if 'salary_range' in data:
        career.salary_range = data.get('salary_range')
    if 'growth_rate' in data:
        career.growth_rate = data.get('growth_rate')
    if 'required_skills' in data:
        career.required_skills = data.get('required_skills')
        
    db.session.commit()
    
    # Retrain recommendations model
    from train_model import train_and_save_recommendation_models
    train_and_save_recommendation_models()
    
    return jsonify({"msg": "Career updated and recommendation engine retrained successfully", "career": career.to_dict()}), 200

@admin_bp.route('/careers/<int:career_id>', methods=['DELETE'])
@jwt_required()
def delete_career(career_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    career = db.session.get(Career, career_id)
    if not career:
        return jsonify({"msg": "Career not found"}), 404
        
    db.session.delete(career)
    db.session.commit()
    
    # Retrain recommendations model
    from train_model import train_and_save_recommendation_models
    train_and_save_recommendation_models()
    
    return jsonify({"msg": "Career deleted and recommendation engine retrained"}), 200

# Course Management APIs
@admin_bp.route('/courses', methods=['GET'])
def list_courses():
    courses = Course.query.all()
    return jsonify([c.to_dict() for c in courses]), 200

@admin_bp.route('/courses', methods=['POST'])
@jwt_required()
def create_course():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    data = request.get_json() or {}
    name = data.get('name')
    provider = data.get('provider')
    url = data.get('url')
    category = data.get('category')
    
    if not name or not provider or not category:
        return jsonify({"msg": "Missing required fields (name, provider, category)"}), 400
        
    course = Course(name=name, provider=provider, url=url, category=category)
    db.session.add(course)
    db.session.commit()
    return jsonify({"msg": "Course created successfully", "course": course.to_dict()}), 201

@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404
        
    data = request.get_json() or {}
    if 'name' in data:
        course.name = data.get('name')
    if 'provider' in data:
        course.provider = data.get('provider')
    if 'url' in data:
        course.url = data.get('url')
    if 'category' in data:
        course.category = data.get('category')
        
    db.session.commit()
    return jsonify({"msg": "Course updated successfully", "course": course.to_dict()}), 200

@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"msg": "Course not found"}), 404
        
    db.session.delete(course)
    db.session.commit()
    return jsonify({"msg": "Course deleted successfully"}), 200

# Skill Management APIs
@admin_bp.route('/skills', methods=['GET'])
def list_skills_admin():
    skills = Skill.query.all()
    return jsonify([s.to_dict() for s in skills]), 200

@admin_bp.route('/skills', methods=['POST'])
@jwt_required()
def create_skill():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    data = request.get_json() or {}
    name = data.get('name')
    category = data.get('category') # 'technical' or 'soft'
    
    if not name or not category:
        return jsonify({"msg": "Missing required fields (name, category)"}), 400
        
    skill = Skill(name=name, category=category)
    db.session.add(skill)
    try:
        db.session.commit()
        return jsonify({"msg": "Skill created successfully", "skill": skill.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to create skill: {str(e)}"}), 500

@admin_bp.route('/skills/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(skill_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    skill = db.session.get(Skill, skill_id)
    if not skill:
        return jsonify({"msg": "Skill not found"}), 404
        
    data = request.get_json() or {}
    if 'name' in data:
        skill.name = data.get('name')
    if 'category' in data:
        skill.category = data.get('category')
        
    try:
        db.session.commit()
        return jsonify({"msg": "Skill updated successfully", "skill": skill.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Failed to update skill: {str(e)}"}), 500

@admin_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@jwt_required()
def delete_skill(skill_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user or user.role != 'admin':
        return jsonify({"msg": "Admin privileges required."}), 403
        
    skill = db.session.get(Skill, skill_id)
    if not skill:
        return jsonify({"msg": "Skill not found"}), 404
        
    db.session.delete(skill)
    db.session.commit()
    return jsonify({"msg": "Skill deleted successfully"}), 200


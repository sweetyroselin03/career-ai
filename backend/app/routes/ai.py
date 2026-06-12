from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.groq_service import GroqService
from app.models import db, UserProfile, User
import logging

logger = logging.getLogger(__name__)
ai_bp = Blueprint('ai', __name__)
groq_service = GroqService()

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({"success": False, "error": "Message is required"}), 400
        
    try:
        # Load user context if available to enrich the conversation
        user = db.session.get(User, int(current_user_id))
        profile = UserProfile.query.filter_by(user_id=int(current_user_id)).first()
        
        user_context = None
        if user:
            user_context = {
                "name": user.name,
                "email": user.email,
                "degree": profile.degree if profile else "",
                "department": profile.department if profile else "",
                "skills": profile.get_skills() if profile else {}
            }
            
        advice = groq_service.generate_career_advice(message, user_context)
        return jsonify({
            "success": True,
            "response": advice
        }), 200
    except Exception as e:
        logger.error(f"[ERROR] AI Chat failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ai_bp.route('/roadmap', methods=['POST'])
@jwt_required()
def ai_roadmap():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    target_career = data.get('target_career', '').strip()
    profile_data = data.get('profile')
    skills = data.get('skills')
    
    if not target_career:
        return jsonify({"success": False, "error": "target_career is required"}), 400
        
    try:
        # Fallback to DB if profile or skills aren't provided in the request
        if not profile_data or not skills:
            profile = UserProfile.query.filter_by(user_id=int(current_user_id)).first()
            if profile:
                if not profile_data:
                    profile_data = {
                        "degree": profile.degree,
                        "department": profile.department,
                        "university": profile.university,
                        "cgpa": profile.cgpa,
                        "career_goals": profile.career_goals
                    }
                if not skills:
                    skills = list(profile.get_skills().keys())
            else:
                profile_data = profile_data or {}
                skills = skills or []

        payload = {
            "profile": profile_data,
            "skills": skills
        }
        
        roadmap = groq_service.generate_learning_roadmap(payload, target_career)
        return jsonify({
            "success": True,
            "roadmap": roadmap
        }), 200
    except Exception as e:
        logger.error(f"[ERROR] AI Roadmap generation failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ai_bp.route('/resume-feedback', methods=['POST'])
@jwt_required()
def ai_resume_feedback():
    data = request.get_json() or {}
    resume_text = data.get('resume_text', '').strip()
    
    if not resume_text:
        return jsonify({"success": False, "error": "resume_text is required"}), 400
        
    try:
        feedback = groq_service.resume_feedback(resume_text)
        return jsonify({
            "success": True,
            "strengths": feedback.get("strengths", []),
            "weaknesses": feedback.get("weaknesses", []),
            "suggestions": feedback.get("suggestions", [])
        }), 200
    except Exception as e:
        logger.error(f"[ERROR] AI Resume Feedback failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ai_bp.route('/skill-gap', methods=['POST'])
@jwt_required()
def ai_skill_gap():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    target_career = data.get('target_career') or data.get('target_role')
    if target_career:
        target_career = target_career.strip()
        
    current_skills = data.get('current_skills') or data.get('skills')
    
    if not target_career:
        return jsonify({"success": False, "error": "target_career (or target_role) is required"}), 400
        
    try:
        # Fallback to profile skills if not provided
        if not current_skills:
            profile = UserProfile.query.filter_by(user_id=int(current_user_id)).first()
            if profile:
                current_skills = list(profile.get_skills().keys())
            else:
                current_skills = []
                
        gap_analysis = groq_service.analyze_skill_gap(current_skills, target_career)
        return jsonify({
            "success": True,
            "missing_skills": gap_analysis.get("missing_skills", []),
            "recommendations": gap_analysis.get("recommendations", [])
        }), 200
    except Exception as e:
        logger.error(f"[ERROR] AI Skill Gap Analysis failed: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

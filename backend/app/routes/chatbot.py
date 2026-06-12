from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, UserProfile, Career, User, Recommendation, LearningRoadmap, ResumeAnalysis
from app.services.groq_service import GroqService
import json

chatbot_bp = Blueprint('chatbot', __name__)
groq_service = GroqService()

# Global session chat history cache: user_id -> list of {"role": "user"/"assistant", "content": "..."}
session_history = {}

@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def chat_message():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not user:
        return jsonify({"response": "User session not found."}), 401
        
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({"response": "I didn't receive any message. How can I help you today?"}), 400
        
    # --- RAG CONTEXT ASSEMBLY ---
    user_name = user.name
    degree = profile.degree if profile else "Not completed"
    department = profile.department if profile else "Not completed"
    cgpa = profile.cgpa if profile else "Not completed"
    location = profile.location if profile else "Not specified"
    interests = profile.get_interests() if profile else []
    interests_str = ", ".join(interests) if interests else "None specified"
    career_goals = profile.career_goals if profile else "None specified"
    
    # User Skills
    user_skills = profile.get_skills() if profile else {}
    skills_str = ", ".join([f"{k} ({v}%)" for k, v in user_skills.items()]) if user_skills else "No skills rated yet."
    
    # Career Recommendations
    recs = Recommendation.query.filter_by(user_id=current_user_id).all()
    recs_list = []
    for r in recs:
        c = Career.query.get(r.career_id)
        if c:
            recs_list.append(f"{c.name} (Match Score: {r.match_score}%)")
    recommendations_str = ", ".join(recs_list) if recs_list else "No career matches calculated yet. Please rate skills first."
    
    # Learning Roadmaps
    roadmaps = LearningRoadmap.query.filter_by(user_id=current_user_id).all()
    roadmaps_list = []
    for rm in roadmaps:
        roadmaps_list.append(f"Roadmap for {rm.career_name}: {rm.title} (30-day: {rm.plan_30_title}, 60-day: {rm.plan_60_title}, 90-day: {rm.plan_90_title})")
    roadmaps_str = " | ".join(roadmaps_list) if roadmaps_list else "No roadmaps generated yet."
    
    # Latest Resume Analysis
    latest_resume = ResumeAnalysis.query.filter_by(user_id=current_user_id).order_by(ResumeAnalysis.analyzed_at.desc()).first()
    if latest_resume:
        resume_score = f"{latest_resume.ats_score}%"
        resume_skills = ", ".join(latest_resume.get_skills_found())
        resume_missing = ", ".join(latest_resume.get_missing_keywords())
        resume_suggestions = " ".join(latest_resume.get_suggestions())
    else:
        resume_score = "N/A"
        resume_skills = "None"
        resume_missing = "None"
        resume_suggestions = "No resume uploaded yet."

    # --- SESSION CONTEXT MEMORY ---
    if current_user_id not in session_history:
        session_history[current_user_id] = []
        
    # Append current user message to active history
    session_history[current_user_id].append({"role": "user", "content": message})
    
    # Keep only the last 12 messages for active window limit
    if len(session_history[current_user_id]) > 12:
        session_history[current_user_id] = session_history[current_user_id][-12:]
        
    # --- RAG SYSTEM PROMPT ---
    system_prompt = (
        "You are an expert AI Career Advisor for CareerAI Navigator.\n"
        "You guide the user on their professional path, recommend courses, review skills, analyze gaps, and optimize resumes.\n"
        "You must respond in clean, professional Markdown formatting: use headings, bold terms, list items, and tables for structured data.\n\n"
        "Here is the context memory of the logged-in user:\n"
        f"- Name: {user_name}\n"
        f"- Academic Details: Degree: {degree}, Department/Branch: {department}, CGPA: {cgpa}\n"
        f"- Location: {location}\n"
        f"- Core Interests: {interests_str}\n"
        f"- Personal Career Goals: {career_goals}\n"
        f"- Registered Profile Skills: {skills_str}\n"
        f"- Calculated Career Matches: {recommendations_str}\n"
        f"- Upskilling Roadmap Milestones: {roadmaps_str}\n"
        f"- Resume ATS Assessment: Score: {resume_score}, Extracted Skills: {resume_skills}, Missing Keywords: {resume_missing}, Suggestions: {resume_suggestions}\n\n"
        "Instructions:\n"
        "1. Address the user directly using their name when greetings/important advice is given.\n"
        "2. Refer to their registered skills, target recommendations, or resume score when discussing careers or skills.\n"
        "3. Provide answers in beautiful markdown format. Always highlight important concepts in bold.\n"
        "4. If they ask about courses or pathways, draw from their roadmap or output lists as clear tables with header columns: Course/Topic, Actionable Step, Expected Outcome.\n"
        "5. Be encouraging, professional, and precise."
    )
    
    # --- GROQ CALL ---
    try:
        reply = groq_service.generate_chat_response(system_prompt, session_history[current_user_id])
    except Exception as e:
        print(f"Error calling Groq service in chatbot: {e}")
        # Fallback to local heuristic rule replies if Groq fails or API key limits are reached
        reply = (
            f"Hello {user_name}! I encountered a slight issue contacting my Groq LLM brain, "
            f"but based on your profile, your registered skills are: **{skills_str}**.\n\n"
            f"Your latest resume ATS compatibility score is **{resume_score}**.\n"
            f"If you'd like to improve, I suggest: {resume_suggestions}"
        )
        
    # Append assistant response to history
    session_history[current_user_id].append({"role": "assistant", "content": reply})
    
    return jsonify({"response": reply}), 200

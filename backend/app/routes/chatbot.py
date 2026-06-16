from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, UserProfile, Career, User, Recommendation, LearningRoadmap, ResumeAnalysis, ChatSession, ChatMessage
from app.services.groq_service import GroqService
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
chatbot_bp = Blueprint('chatbot', __name__)
groq_service = GroqService()

def _safe_db_recovery():
    try:
        db.session.rollback()
    except Exception:
        pass
    try:
        db.session.remove()
    except Exception:
        pass

@chatbot_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    try:
        current_user_id = get_jwt_identity()
        sessions = ChatSession.query.filter_by(user_id=current_user_id).order_by(ChatSession.updated_at.desc()).all()
        return jsonify({
            "success": True,
            "message": "Chat sessions retrieved successfully.",
            "data": [s.to_dict() for s in sessions]
        }), 200
    except Exception as e:
        logger.error(f"[CHATBOT] GET sessions failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to load chat sessions. Please try again.",
            "data": []
        }), 503

@chatbot_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        title = data.get('title', 'New Chat').strip()
        
        session = ChatSession(user_id=current_user_id, title=title)
        db.session.add(session)
        db.session.commit()
        
        # Add welcome message from bot
        user = db.session.get(User, current_user_id)
        welcome_text = f"Hello {user.name if user else 'there'}! I am your AI Career Advisor. I can help you with ATS scores, career recommendations, skill-gap assessments, and learning roadmaps. How can I help you accelerate your career today?"
        
        welcome_msg = ChatMessage(session_id=session.id, role='assistant', content=welcome_text)
        db.session.add(welcome_msg)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Chat session created successfully.",
            "data": session.to_dict()
        }), 201
    except Exception as e:
        logger.error(f"[CHATBOT] CREATE session failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to create chat session. Please try again.",
            "data": None
        }), 500

@chatbot_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_details(session_id):
    try:
        current_user_id = get_jwt_identity()
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        if not session:
            return jsonify({
                "success": False,
                "message": "Chat session not found.",
                "data": None
            }), 404
            
        return jsonify({
            "success": True,
            "message": "Chat session details retrieved.",
            "data": session.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"[CHATBOT] GET session details failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to load chat details.",
            "data": None
        }), 503

@chatbot_bp.route('/sessions/<int:session_id>/rename', methods=['PUT'])
@jwt_required()
def rename_session(session_id):
    try:
        current_user_id = get_jwt_identity()
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        if not session:
            return jsonify({
                "success": False,
                "message": "Chat session not found.",
                "data": None
            }), 404
            
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        if not title:
            return jsonify({
                "success": False,
                "message": "Session title cannot be empty.",
                "data": None
            }), 400
            
        session.title = title
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Chat session renamed successfully.",
            "data": session.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"[CHATBOT] RENAME session failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to rename session.",
            "data": None
        }), 500

@chatbot_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    try:
        current_user_id = get_jwt_identity()
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        if not session:
            return jsonify({
                "success": False,
                "message": "Chat session not found.",
                "data": None
            }), 404
            
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Chat session deleted successfully.",
            "data": None
        }), 200
    except Exception as e:
        logger.error(f"[CHATBOT] DELETE session failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to delete chat session.",
            "data": None
        }), 500

@chatbot_bp.route('/sessions/<int:session_id>/messages', methods=['POST'])
@jwt_required()
def add_message(session_id):
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User session not found.",
            "data": None
        }), 401
        
    try:
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user_id).first()
        if not session:
            return jsonify({
                "success": False,
                "message": "Chat session not found.",
                "data": None
            }), 404
            
        data = request.get_json() or {}
        message_content = data.get('message', '').strip()
        
        if not message_content:
            return jsonify({
                "success": False,
                "message": "Message content cannot be empty.",
                "data": None
            }), 400
            
        # 1. Save user message to database
        user_message = ChatMessage(session_id=session.id, role='user', content=message_content)
        db.session.add(user_message)
        session.updated_at = datetime.utcnow()
        db.session.commit()
        
        # 2. Assemble RAG Context
        user_name = user.name
        degree = profile.degree if profile else "Not completed"
        department = profile.department if profile else "Not completed"
        cgpa = profile.cgpa if profile else "Not completed"
        location = profile.location if profile else "Not specified"
        
        github_link = profile.github if (profile and profile.github) else "Not specified"
        linkedin_link = profile.linkedin if (profile and profile.linkedin) else "Not specified"
        portfolio_link = profile.portfolio if (profile and profile.portfolio) else "Not specified"
        
        interests = profile.get_interests() if profile else []
        interests_str = ", ".join(interests) if interests else "None specified"
        career_goals = profile.career_goals if profile else "None specified"
        
        user_skills = profile.get_skills() if profile else {}
        skills_str = ", ".join([f"{k} ({v}%)" for k, v in user_skills.items()]) if user_skills else "No skills rated yet."
        
        certifications = profile.get_certifications() if profile else []
        certifications_str = ", ".join(certifications) if certifications else "None specified"
        
        projects = profile.get_projects() if profile else []
        projects_str = ", ".join(projects) if projects else "None specified"
        
        recs = Recommendation.query.filter_by(user_id=current_user_id).all()
        recs_list = []
        for r in recs:
            c = Career.query.get(r.career_id)
            if c:
                recs_list.append(f"{c.name} (Match Score: {r.match_score}%)")
        recommendations_str = ", ".join(recs_list) if recs_list else "No career matches calculated yet."
        
        roadmaps = LearningRoadmap.query.filter_by(user_id=current_user_id).all()
        roadmaps_list = []
        for rm in roadmaps:
            roadmaps_list.append(f"Roadmap for {rm.career_name}: {rm.title} (30-day: {rm.plan_30_title}, 60-day: {rm.plan_60_title}, 90-day: {rm.plan_90_title})")
        roadmaps_str = " | ".join(roadmaps_list) if roadmaps_list else "No roadmaps generated yet."
        
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

        # Fetch uploaded documents context
        from app.models import UploadedDocument
        uploaded_docs = UploadedDocument.query.filter_by(user_id=current_user_id).order_by(UploadedDocument.uploaded_at.desc()).limit(3).all()
        docs_context = ""
        if uploaded_docs:
            docs_context = "\n=== RECENTLY UPLOADED DOCUMENTS ===\n"
            for doc in uploaded_docs:
                snippet = doc.extracted_text[:4000] if doc.extracted_text else "Empty content"
                docs_context += f"Document: {doc.filename}\nContent:\n{snippet}\n===================================\n"
 
        # 3. Build AI system prompt
        system_prompt = (
            "You are an expert AI Career Advisor, ATS Expert, Recruiter, Hiring Manager, Resume Reviewer, "
            "Skill Gap Analyst, Learning Architect, and Industry Mentor.\n"
            "You guide the user on their professional path, recommend courses, review skills, analyze gaps, and optimize resumes.\n\n"
            "Here is the context memory of the logged-in user:\n"
            f"- Name: {user_name}\n"
            f"- Academic Details: Degree: {degree}, Department/Branch: {department}, CGPA: {cgpa}\n"
            f"- Location: {location}\n"
            f"- Social Links: GitHub: {github_link}, LinkedIn: {linkedin_link}, Portfolio: {portfolio_link}\n"
            f"- Core Interests: {interests_str}\n"
            f"- Personal Career Goals: {career_goals}\n"
            f"- Registered Profile Skills: {skills_str}\n"
            f"- Certifications: {certifications_str}\n"
            f"- Personal Projects: {projects_str}\n"
            f"- Calculated Career Matches: {recommendations_str}\n"
            f"- Upskilling Roadmap Milestones: {roadmaps_str}\n"
            f"- Resume ATS Assessment: Score: {resume_score}, Extracted Skills: {resume_skills}, Missing Keywords: {resume_missing}, Suggestions: {resume_suggestions}\n"
            f"{docs_context}\n"
            "Your responses must strictly follow this Markdown structure:\n\n"
            "# Executive Summary\n"
            "[A high-level summary of the user's inquiry, situation, or status, addressing them directly by name.]\n\n"
            "# Analysis\n"
            "[An analytical assessment of the topic, linking back to their skills, career goals, or portfolio/social presence.]\n\n"
            "# Findings\n"
            "[Key observations or gaps identified (e.g. missing skills, alignment of certifications). Use tables or structured lists here.]\n\n"
            "# Recommendations\n"
            "[Actionable recommendations based on your findings. Include specific resources, courses, or certifications.]\n\n"
            "# Action Plan\n"
            "[A clear timeline or step-by-step sequencing (e.g., Short-term, Medium-term, Long-term).]\n\n"
            "# Resources\n"
            "[Useful learning links, books, tools, or target titles. If suggesting courses/topics, present them in a table with columns: 'Course/Topic', 'Actionable Step', 'Expected Outcome'.]\n\n"
            "Instructions:\n"
            "1. Never give generic, boilerplate advice. Always personalize using the user's specific credentials and details.\n"
            "2. If the user asks general questions, frame your answers within their professional context.\n"
            "3. Keep a highly encouraging, professional, and precise tone."
        )
 
        # 4. Fetch last 10 messages from DB session history for LLM context
        db_messages = ChatMessage.query.filter_by(session_id=session.id).order_by(ChatMessage.created_at.desc()).limit(11).all()
        db_messages.reverse() # Sort in ascending order
        
        chat_history = [{"role": msg.role, "content": msg.content} for msg in db_messages[:-1]] # exclude the newly added user msg which is at the end
 
        try:
            # Append new user message to chat history for LLM
            chat_history.append({"role": "user", "content": message_content})
            reply = groq_service.generate_chat_response(system_prompt, chat_history)
        except Exception as e:
            logger.error(f"Error calling Groq service in chatbot: {e}")
            reply = (
                f"# Executive Summary\n"
                f"Hello {user_name}. I encountered a slight issue contacting my Groq LLM brain, "
                f"but based on your profile, your registered skills are: **{skills_str}**.\n\n"
                f"# Analysis\n"
                f"We currently see a temporary connection error to our primary LLM services.\n\n"
                f"# Findings\n"
                f"- Profile skills registered: {len(user_skills)} skills.\n"
                f"- Latest resume ATS score: {resume_score}.\n\n"
                f"# Recommendations\n"
                f"Please ensure the API keys are correct and try again.\n\n"
                f"# Action Plan\n"
                f"1. Wait 30 seconds.\n"
                f"2. Submit your question again.\n\n"
                f"# Resources\n"
                f"| Help Page | Description | Link |\n"
                f"| --- | --- | --- |\n"
                f"| System Support | Technical connection help | support@careerai.com |"
            )
            
        # Save assistant message to database
        bot_message = ChatMessage(session_id=session.id, role='assistant', content=reply)
        db.session.add(bot_message)
        session.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Message sent and response generated.",
            "data": {
                "user_message": user_message.to_dict(),
                "bot_message": bot_message.to_dict(),
                "session": session.to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"[CHATBOT] Message sending failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": "Failed to send message.",
            "data": None
        }), 500


@chatbot_bp.route('/sessions/<int:session_id>/upload-document', methods=['POST'])
@jwt_required()
def upload_document(session_id):
    current_user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(id=session_id, user_id=current_user_id).first()
    if not session:
        return jsonify({
            "success": False,
            "message": "Chat session not found.",
            "data": None
        }), 404

    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "message": "No file part in request",
            "data": None
        }), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({
            "success": False,
            "message": "No selected file",
            "data": None
        }), 400

    from app.routes.resume import allowed_file, extract_text_from_pdf, extract_text_from_docx, extract_text_from_txt

    if not (file and allowed_file(file.filename)):
        return jsonify({
            "success": False,
            "message": "Unsupported file format. Please upload PDF, DOCX, or TXT.",
            "data": None
        }), 400

    try:
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        filename = secure_filename(f"user_{current_user_id}_doc_{int(datetime.utcnow().timestamp())}.{file_ext}")
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        extracted_text = ""
        if file_ext == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_ext == 'docx':
            extracted_text = extract_text_from_docx(file_path)
        elif file_ext in ['txt', 'csv']:
            extracted_text = extract_text_from_txt(file_path)
        else:
            extracted_text = f"Non-text document content of: {file.filename}"

        from app.models import UploadedDocument
        doc = UploadedDocument(
            user_id=current_user_id,
            filename=file.filename,
            file_path=file_path,
            file_type=file_ext,
            file_size=os.path.getsize(file_path),
            extracted_text=extracted_text
        )
        db.session.add(doc)
        db.session.commit()

        # Add message history logs
        user_message_text = f"[Uploaded Document: {file.filename}]"
        bot_message_text = f"I've successfully received and analyzed your document: **{file.filename}** ({len(extracted_text)} characters extracted). You can now ask me questions referencing its contents!"
        
        user_msg = ChatMessage(session_id=session.id, role='user', content=user_message_text)
        bot_msg = ChatMessage(session_id=session.id, role='assistant', content=bot_message_text)
        
        db.session.add(user_msg)
        db.session.add(bot_msg)
        session.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Document uploaded and parsed successfully.",
            "data": {
                "document": doc.to_dict(),
                "user_message": user_msg.to_dict(),
                "bot_message": bot_msg.to_dict()
            }
        }), 201

    except Exception as e:
        logger.error(f"[CHATBOT] Document upload failed: {e}")
        _safe_db_recovery()
        return jsonify({
            "success": False,
            "message": f"Failed to upload document: {str(e)}",
            "data": None
        }), 500


@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def chatbot_message():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({"response": "Message cannot be empty."}), 400
    try:
        system_prompt = "You are a career advisory AI assistant."
        chat_history = [{"role": "user", "content": message}]
        reply = groq_service.generate_chat_response(system_prompt, chat_history)
        return jsonify({"response": reply}), 200
    except Exception as e:
        logger.error(f"[CHATBOT] general chatbot/message route failed: {e}")
        return jsonify({"response": f"Failed to get response: {str(e)}"}), 500



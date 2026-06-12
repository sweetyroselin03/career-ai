from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models import db, UserProfile, Skill, ResumeAnalysis, Recommendation, Career
import os
import re
import pdfplumber

resume_bp = Blueprint('resume', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF with pdfplumber: {e}")
        # Fallback to PyPDF2 if pdfplumber fails
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as pypdf_err:
            print(f"Error reading PDF with PyPDF2 fallback: {pypdf_err}")
    return text

@resume_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    current_user_id = get_jwt_identity()
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({"msg": "Profile not found"}), 404
        
    if 'file' not in request.files:
        return jsonify({"msg": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if not (file and allowed_file(file.filename)):
        return jsonify({"msg": "Only PDF files are allowed"}), 400
        
    # Secure filename and save
    filename = secure_filename(f"user_{current_user_id}_resume.pdf")
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Save info in profile
    profile.resume_path = file_path
    profile.resume_filename = file.filename
    
    # Extract text and analyze
    pdf_text = extract_text_from_pdf(file_path)
    
    # Determine target role based on user's highest recommended career match, or fallback
    target_career = None
    highest_rec = Recommendation.query.filter_by(user_id=current_user_id).order_by(Recommendation.match_score.desc()).first()
    if highest_rec:
        target_career = Career.query.get(highest_rec.career_id)
        
    if not target_career:
        # Fallback to first career in DB
        target_career = Career.query.first()
        
    analysis_results = analyze_resume_text(pdf_text, target_career)
    
    # Save to database ResumeAnalysis table
    try:
        new_analysis = ResumeAnalysis(
            user_id=current_user_id,
            ats_score=analysis_results["ats_score"]
        )
        new_analysis.set_sections(analysis_results["sections_detected"])
        new_analysis.set_skills_found(analysis_results["skills_found"])
        new_analysis.set_missing_keywords(analysis_results["missing_keywords"])
        new_analysis.set_suggestions(analysis_results["suggestions"])
        db.session.add(new_analysis)
        
        # Keep profile updated
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to save resume analysis to database: {e}")
        return jsonify({"msg": "Analysis completed, but failed to save result."}), 500
    
    return jsonify({
        "msg": "Resume uploaded and analyzed successfully",
        "filename": file.filename,
        "analysis": analysis_results
    }), 200

@resume_bp.route('/latest', methods=['GET'])
@jwt_required()
def get_latest_analysis():
    current_user_id = get_jwt_identity()
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({"msg": "Profile not found"}), 404
        
    latest = ResumeAnalysis.query.filter_by(user_id=current_user_id).order_by(ResumeAnalysis.analyzed_at.desc()).first()
    
    if not latest:
        return jsonify({"msg": "Upload a resume to receive ATS analysis.", "analysis": None}), 200
        
    return jsonify({
        "filename": profile.resume_filename,
        "analysis": {
            "ats_score": latest.ats_score,
            "skills_found": latest.get_skills_found(),
            "missing_keywords": latest.get_missing_keywords(),
            "sections_detected": latest.get_sections(),
            "suggestions": latest.get_suggestions()
        }
    }), 200

def analyze_resume_text(text, target_career):
    normalized_text = text.lower()
    
    # Target career details
    target_name = target_career.name if target_career else "Software Engineer"
    required_skills = [s.strip() for s in target_career.required_skills.split(',') if s.strip()] if target_career else ["Python", "SQL", "Git"]
    
    # 1. Look for sections
    has_education = any(kw in normalized_text for kw in ['education', 'university', 'college', 'degree', 'academic', 'b.tech', 'b.e.', 'm.tech', 'bachelor', 'master'])
    has_experience = any(kw in normalized_text for kw in ['experience', 'work', 'employment', 'history', 'intern', 'professional', 'job'])
    has_projects = any(kw in normalized_text for kw in ['project', 'projects', 'github', 'portfolio', 'hackathon'])
    
    # 2. Extract technical skills found in resume
    all_skills = Skill.query.all()
    skills_found = []
    for skill in all_skills:
        pattern = r'\b' + re.escape(skill.name.lower()) + r'\b'
        if re.search(pattern, normalized_text):
            skills_found.append(skill.name)
            
    # Fallback to general skills if none found
    if not skills_found:
        skills_found = ["Python", "SQL", "Git"]
        
    # --- ATS SCORE COMPONENT CALCULATIONS (out of 100 total) ---
    
    # A. Skills Match Score (up to 25 pts)
    matched_req_skills = [s for s in required_skills if s in skills_found]
    if required_skills:
        skills_match_score = (len(matched_req_skills) / len(required_skills)) * 25.0
    else:
        skills_match_score = 25.0
        
    # B. Experience Match Score (up to 25 pts)
    experience_score = 0.0
    if has_experience:
        experience_score += 15.0
        experience_keywords = ["years", "months", "led", "managed", "developed", "designed", "architected", "implemented"]
        found_exp_kw = sum(1 for kw in experience_keywords if kw in normalized_text)
        experience_score += min(found_exp_kw * 2.0, 10.0)
        
    # C. Keyword Match Score (up to 25 pts)
    target_keywords = required_skills + ["agile", "scrum", "sdlc", "deployment", "testing", "optimization", "architecture"]
    matched_kws = [kw for kw in target_keywords if kw.lower() in normalized_text]
    if target_keywords:
        keyword_match_score = (len(matched_kws) / len(target_keywords)) * 25.0
    else:
        keyword_match_score = 25.0
        
    # D. Project Match Score (up to 25 pts)
    project_score = 0.0
    if has_projects:
        project_score += 15.0
        project_keywords = ["github.com", "git", "deployed", "repository", "portfolio", "built", "implemented"]
        found_proj_kw = sum(1 for kw in project_keywords if kw in normalized_text)
        project_score += min(found_proj_kw * 2.0, 10.0)
        
    # Combined Score
    ats_score = int(skills_match_score + experience_score + keyword_match_score + project_score)
    ats_score = max(10, min(100, ats_score))
    
    # Missing keywords & suggestions
    missing_keywords = [s for s in required_skills if s not in skills_found]
    
    suggestions = []
    if not has_experience:
        suggestions.append("Add a 'Work Experience' or 'Internship' section to showcase your professional exposure.")
    if not has_projects:
        suggestions.append("Incorporate a 'Projects' section to demonstrate practical implementation of your skills.")
    if len(skills_found) < 6:
        suggestions.append("Expand your skills list. List details under subheadings like 'Programming Languages' and 'Tools'.")
    if "achieved" not in normalized_text and "improved" not in normalized_text and "%" not in normalized_text:
        suggestions.append("Quantify your achievements: use numbers and percentages (e.g. 'Improved efficiency by 20%', 'Managed team of 5').")
    if "github.com" not in normalized_text and "linkedin.com" not in normalized_text:
        suggestions.append("Include links to your GitHub and LinkedIn profiles to make it easy for recruiters to review your work.")
        
    if not suggestions:
        suggestions.append("Your resume format is solid! Consider adding more metrics of success to make it stand out.")
        
    return {
        "ats_score": ats_score,
        "skills_found": skills_found,
        "missing_keywords": missing_keywords[:6],
        "sections_detected": {
            "education": has_education,
            "experience": has_experience,
            "projects": has_projects
        },
        "suggestions": suggestions
    }

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import bcrypt
from sqlalchemy.orm import Mapped, mapped_column

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    email: Mapped[str] = mapped_column(db.String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(db.String(255), nullable=False)
    role: Mapped[str] = mapped_column(db.String(20), default='user') # 'user' or 'admin'
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade="all, delete-orphan")
    recommendations = db.relationship('Recommendation', backref='user', cascade="all, delete-orphan")
    roadmaps = db.relationship('LearningRoadmap', backref='user', cascade="all, delete-orphan")

    def __init__(self, name: str, email: str, role: str = 'user', password_hash: str = None):
        self.name = name
        self.email = email
        self.role = role
        if password_hash:
            self.password_hash = password_hash

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
    def check_password(self, password):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except Exception:
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Skill(db.Model):
    __tablename__ = 'skills'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    name: Mapped[str] = mapped_column(db.String(100), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(db.String(50), nullable=False) # 'technical' or 'soft'

    def __init__(self, name: str, category: str = 'technical'):
        self.name = name
        self.category = category

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category
        }

class UserSkill(db.Model):
    __tablename__ = 'user_skills'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_profile_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False)
    skill_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), nullable=False)
    score: Mapped[int] = mapped_column(db.Integer, nullable=False, default=70) # 0 to 100 rating
    
    # Relationship
    skill = db.relationship('Skill')

    def __init__(self, skill_id: int, score: int = 70, user_profile_id: int = None):
        self.skill_id = skill_id
        self.score = score
        if user_profile_id is not None:
            self.user_profile_id = user_profile_id

class Career(db.Model):
    __tablename__ = 'careers'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    name: Mapped[str] = mapped_column(db.String(120), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(db.Text, nullable=False)
    salary_range: Mapped[str] = mapped_column(db.String(100), nullable=False)
    growth_rate: Mapped[str] = mapped_column(db.String(50), nullable=False)
    required_skills: Mapped[str] = mapped_column(db.Text, nullable=False)

    def __init__(self, name: str, description: str, salary_range: str, growth_rate: str, required_skills: str):
        self.name = name
        self.description = description
        self.salary_range = salary_range
        self.growth_rate = growth_rate
        self.required_skills = required_skills

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'salary_range': self.salary_range,
            'growth_rate': self.growth_rate,
            'required_skills': [s.strip() for s in self.required_skills.split(',') if s.strip()] if self.required_skills else []
        }

class Course(db.Model):
    __tablename__ = 'courses'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    name: Mapped[str] = mapped_column(db.String(150), nullable=False)
    provider: Mapped[str] = mapped_column(db.String(100), nullable=False)
    url: Mapped[str] = mapped_column(db.String(255), nullable=True)
    category: Mapped[str] = mapped_column(db.String(100), nullable=False)

    def __init__(self, name: str, provider: str, category: str, url: str = None):
        self.name = name
        self.provider = provider
        self.category = category
        self.url = url

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'provider': self.provider,
            'url': self.url,
            'category': self.category
        }

class Recommendation(db.Model):
    __tablename__ = 'career_recommendations'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    career_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('careers.id', ondelete='CASCADE'), nullable=False)
    match_score: Mapped[float] = mapped_column(db.Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    career = db.relationship('Career')

    def __init__(self, user_id: int, career_id: int, match_score: float):
        self.user_id = user_id
        self.career_id = career_id
        self.match_score = match_score

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'career_id': self.career_id,
            'career_name': self.career.name if self.career else "Unknown Career",
            'match_score': self.match_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    age: Mapped[int] = mapped_column(db.Integer, nullable=True)
    gender: Mapped[str] = mapped_column(db.String(20), nullable=True)
    location: Mapped[str] = mapped_column(db.String(100), nullable=True)
    
    degree: Mapped[str] = mapped_column(db.String(100), nullable=True)
    department: Mapped[str] = mapped_column(db.String(100), nullable=True)
    university: Mapped[str] = mapped_column(db.String(100), nullable=True)
    cgpa: Mapped[float] = mapped_column(db.Float, nullable=True)
    
    # Relational skills collection mapping
    skills = db.relationship('UserSkill', backref='user_profile', cascade="all, delete-orphan")
    
    # Format for interests: ["AI", "Data Science"]
    interests_json: Mapped[str] = mapped_column(db.Text, default='[]')
    
    career_goals: Mapped[str] = mapped_column(db.Text, nullable=True)
    resume_path: Mapped[str] = mapped_column(db.String(255), nullable=True)
    resume_filename: Mapped[str] = mapped_column(db.String(100), nullable=True)

    # Expanded Social/Professional/SaaS fields
    github: Mapped[str] = mapped_column(db.String(255), nullable=True)
    linkedin: Mapped[str] = mapped_column(db.String(255), nullable=True)
    portfolio: Mapped[str] = mapped_column(db.String(255), nullable=True)
    certifications_json: Mapped[str] = mapped_column(db.Text, default='[]')
    projects_json: Mapped[str] = mapped_column(db.Text, default='[]')

    def __init__(self, user_id: int, age: int = None, gender: str = None, location: str = None, 
                 degree: str = None, department: str = None, university: str = None, 
                 cgpa: float = None, career_goals: str = None, resume_path: str = None, 
                 resume_filename: str = None, interests_json: str = '[]',
                 github: str = None, linkedin: str = None, portfolio: str = None,
                 certifications_json: str = '[]', projects_json: str = '[]'):
        self.user_id = user_id
        self.age = age
        self.gender = gender
        self.location = location
        self.degree = degree
        self.department = department
        self.university = university
        self.cgpa = cgpa
        self.career_goals = career_goals
        self.resume_path = resume_path
        self.resume_filename = resume_filename
        self.interests_json = interests_json
        self.github = github
        self.linkedin = linkedin
        self.portfolio = portfolio
        self.certifications_json = certifications_json
        self.projects_json = projects_json
    
    def get_skills(self):
        # Reconstruct the skills dictionary dynamically from user_skills relationship
        return {us.skill.name: us.score for us in self.skills if us.skill}
            
    def set_skills(self, skills_dict):
        # Clear existing UserSkill links
        self.skills = []
        db.session.flush()
        
        # Build relational records dynamically
        for skill_name, score in skills_dict.items():
            skill = Skill.query.filter_by(name=skill_name).first()
            if not skill:
                # Create the skill configuration if it does not exist
                skill = Skill(name=skill_name, category='technical')
                db.session.add(skill)
                db.session.flush()
            
            user_skill = UserSkill(skill_id=skill.id, score=int(score))
            self.skills.append(user_skill)
        
    def get_interests(self):
        try:
            return json.loads(self.interests_json) if self.interests_json else []
        except Exception:
            return []
            
    def set_interests(self, interests_list):
        self.interests_json = json.dumps(interests_list)

    def get_certifications(self):
        try:
            return json.loads(self.certifications_json) if self.certifications_json else []
        except Exception:
            return []
            
    def set_certifications(self, certifications_list):
        self.certifications_json = json.dumps(certifications_list)

    def get_projects(self):
        try:
            return json.loads(self.projects_json) if self.projects_json else []
        except Exception:
            return []
            
    def set_projects(self, projects_list):
        self.projects_json = json.dumps(projects_list)

    def calculate_completion_percentage(self):
        """Calculates profile completion percentage (0-100)"""
        score = 20 # Base sign up score
        if self.age: score += 10
        if self.degree: score += 10
        if self.get_skills(): score += 20
        if self.get_interests(): score += 10
        if self.resume_filename: score += 10
        if self.github or self.linkedin or self.portfolio: score += 10
        if self.get_certifications() or self.get_projects(): score += 10
        return min(100, score)

    def to_dict(self):
        from app.models import ResumeAnalysis
        latest_analysis = ResumeAnalysis.query.filter_by(user_id=self.user_id).order_by(ResumeAnalysis.analyzed_at.desc()).first()
        return {
            'id': self.id,
            'user_id': self.user_id,
            'age': self.age,
            'gender': self.gender,
            'location': self.location,
            'degree': self.degree,
            'department': self.department,
            'university': self.university,
            'cgpa': self.cgpa,
            'skills': self.get_skills(),
            'interests': self.get_interests(),
            'career_goals': self.career_goals,
            'resume_filename': self.resume_filename,
            'ats_score': latest_analysis.ats_score if latest_analysis else None,
            'github': self.github,
            'linkedin': self.linkedin,
            'portfolio': self.portfolio,
            'certifications': self.get_certifications(),
            'projects': self.get_projects(),
            'completion_percentage': self.calculate_completion_percentage()
        }


class LearningRoadmap(db.Model):
    __tablename__ = 'learning_roadmaps'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    career_name: Mapped[str] = mapped_column(db.String(120), nullable=False)
    title: Mapped[str] = mapped_column(db.String(150), nullable=False)
    plan_30_title: Mapped[str] = mapped_column(db.String(255), nullable=True)
    plan_30_milestones: Mapped[str] = mapped_column(db.Text, nullable=True) # JSON array of strings
    plan_60_title: Mapped[str] = mapped_column(db.String(255), nullable=True)
    plan_60_milestones: Mapped[str] = mapped_column(db.Text, nullable=True)
    plan_90_title: Mapped[str] = mapped_column(db.String(255), nullable=True)
    plan_90_milestones: Mapped[str] = mapped_column(db.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_id: int, career_name: str, title: str, plan_30_title: str = None, 
                 plan_30_milestones: str = None, plan_60_title: str = None, plan_60_milestones: str = None, 
                 plan_90_title: str = None, plan_90_milestones: str = None):
        self.user_id = user_id
        self.career_name = career_name
        self.title = title
        self.plan_30_title = plan_30_title
        self.plan_30_milestones = plan_30_milestones
        self.plan_60_title = plan_60_title
        self.plan_60_milestones = plan_60_milestones
        self.plan_90_title = plan_90_title
        self.plan_90_milestones = plan_90_milestones

    def to_dict(self):
        try:
            m30 = json.loads(self.plan_30_milestones) if self.plan_30_milestones else []
        except Exception:
            m30 = []
        try:
            m60 = json.loads(self.plan_60_milestones) if self.plan_60_milestones else []
        except Exception:
            m60 = []
        try:
            m90 = json.loads(self.plan_90_milestones) if self.plan_90_milestones else []
        except Exception:
            m90 = []
            
        return {
            'id': self.id,
            'career_name': self.career_name,
            'title': self.title,
            'plan_30': {
                'title': self.plan_30_title,
                'milestones': m30
            },
            'plan_60': {
                'title': self.plan_60_title,
                'milestones': m60
            },
            'plan_90': {
                'title': self.plan_90_title,
                'milestones': m90
            }
        }

class ResumeAnalysis(db.Model):
    __tablename__ = 'resume_analysis'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ats_score: Mapped[int] = mapped_column(db.Integer, nullable=False)
    sections_detected_json: Mapped[str] = mapped_column(db.Text, default='{}')
    skills_found_json: Mapped[str] = mapped_column(db.Text, default='[]')
    missing_keywords_json: Mapped[str] = mapped_column(db.Text, default='[]')
    suggestions_json: Mapped[str] = mapped_column(db.Text, default='[]')
    analyzed_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('resume_analyses', cascade="all, delete-orphan"))

    def __init__(self, user_id: int, ats_score: int, sections_detected_json: str = '{}', 
                 skills_found_json: str = '[]', missing_keywords_json: str = '[]', 
                 suggestions_json: str = '[]'):
        self.user_id = user_id
        self.ats_score = ats_score
        self.sections_detected_json = sections_detected_json
        self.skills_found_json = skills_found_json
        self.missing_keywords_json = missing_keywords_json
        self.suggestions_json = suggestions_json

    def get_sections(self):
        try:
            return json.loads(self.sections_detected_json) if self.sections_detected_json else {}
        except Exception:
            return {}
            
    def set_sections(self, val):
        self.sections_detected_json = json.dumps(val)

    def get_skills_found(self):
        try:
            return json.loads(self.skills_found_json) if self.skills_found_json else []
        except Exception:
            return []
            
    def set_skills_found(self, val):
        self.skills_found_json = json.dumps(val)

    def get_missing_keywords(self):
        try:
            return json.loads(self.missing_keywords_json) if self.missing_keywords_json else []
        except Exception:
            return []
            
    def set_missing_keywords(self, val):
        self.missing_keywords_json = json.dumps(val)

    def get_suggestions(self):
        try:
            return json.loads(self.suggestions_json) if self.suggestions_json else []
        except Exception:
            return []
            
    def set_suggestions(self, val):
        self.suggestions_json = json.dumps(val)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ats_score': self.ats_score,
            'sections_detected': self.get_sections(),
            'skills_found': self.get_skills_found(),
            'missing_keywords': self.get_missing_keywords(),
            'suggestions': self.get_suggestions(),
            'analyzed_at': self.analyzed_at.isoformat() if self.analyzed_at else None
        }


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title: Mapped[str] = mapped_column(db.String(255), nullable=False, default="New Chat")
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='session', cascade="all, delete-orphan", order_by="ChatMessage.created_at")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'messages': [m.to_dict() for m in self.messages]
        }


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False)
    role: Mapped[str] = mapped_column(db.String(20), nullable=False) # 'user' or 'assistant'
    content: Mapped[str] = mapped_column(db.Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserOTP(db.Model):
    __tablename__ = 'user_otps'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    email: Mapped[str] = mapped_column(db.String(120), nullable=False)
    otp: Mapped[str] = mapped_column(db.String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(db.String(50), nullable=False) # 'register', 'login', 'forgot_password'
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    verified: Mapped[bool] = mapped_column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'purpose': self.purpose,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'verified': self.verified
        }


class UploadedDocument(db.Model):
    __tablename__ = 'uploaded_documents'
    
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    filename: Mapped[str] = mapped_column(db.String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(db.String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(db.String(50), nullable=True) # e.g. 'pdf', 'docx', 'txt'
    file_size: Mapped[int] = mapped_column(db.Integer, nullable=True)
    extracted_text: Mapped[str] = mapped_column(db.Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship('User', backref=db.backref('uploaded_documents', cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


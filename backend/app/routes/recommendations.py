from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, UserProfile, Career, Course, Recommendation, LearningRoadmap, User
from app.services.ml_engine import CareerRecommender
import io
import json

rec_bp = Blueprint('recommendations', __name__)
recommendation_bp = rec_bp
recommender = CareerRecommender()

# Lookup mapping for dynamic upskilling resources
SKILL_RESOURCES = {
    "Python": {
        "fundamentals": "Python Fundamentals & Syntax",
        "project": "Build an Automated Web Scraper & CLI Data Tool",
        "cert": "PCEP - Certified Entry-Level Python Programmer"
    },
    "SQL": {
        "fundamentals": "SQL Queries, Joins & Database Design",
        "project": "Design a relational database system for an e-commerce backend",
        "cert": "PostgreSQL Associate Certification"
    },
    "Machine Learning": {
        "fundamentals": "Supervised & Unsupervised Learning models",
        "project": "Train and deploy a housing price prediction API using Scikit-Learn",
        "cert": "Stanford Machine Learning Certificate"
    },
    "Data Science": {
        "fundamentals": "Data Wrangling & Statistical Analysis",
        "project": "Conduct exploratory data analysis on a 1M row customer churn dataset",
        "cert": "IBM Data Science Professional Certificate"
    },
    "Deep Learning": {
        "fundamentals": "Neural Networks & Backpropagation basics",
        "project": "Train an Image Classification CNN on CIFAR-10",
        "cert": "DeepLearning.AI Specialization Certificate"
    },
    "TensorFlow": {
        "fundamentals": "Model Building with Keras & TensorFlow",
        "project": "Implement a sentiment analysis LSTM model on movie reviews",
        "cert": "TensorFlow Developer Certificate"
    },
    "Cloud Computing": {
        "fundamentals": "Cloud Architecture & Core Services",
        "project": "Deploy a multi-tier web application using autoscaling groups",
        "cert": "AWS Certified Solutions Architect"
    },
    "AWS": {
        "fundamentals": "AWS Infrastructure Management",
        "project": "Configure secure S3 static hosting with CloudFront and HTTPS",
        "cert": "AWS Cloud Practitioner"
    },
    "Docker": {
        "fundamentals": "Containerization & Multi-stage builds",
        "project": "Containerize a microservice backend and compose with database service",
        "cert": "Docker Certified Associate"
    },
    "Git": {
        "fundamentals": "Branching models, merge conflict resolution, and pull requests",
        "project": "Set up a git workflow with trunk-based development and auto-linting",
        "cert": "Git & GitHub Version Control Certificate"
    },
    "Statistics": {
        "fundamentals": "Probability distributions, hypothesis testing, and regression analysis",
        "project": "Run A/B testing statistical verification for web signup funnels",
        "cert": "Statistics for Data Science Certificate"
    },
    "Tableau": {
        "fundamentals": "Data visualization, joins, and custom dashboards",
        "project": "Build an executive sales performance dashboard with real-time filters",
        "cert": "Tableau Desktop Certified Associate"
    },
    "UI/UX Design": {
        "fundamentals": "User research, wireframing, and interactive design rules",
        "project": "Create high-fidelity interactive wireframes for a mobile wellness app",
        "cert": "Google UX Design Professional Certificate"
    },
    "Figma": {
        "fundamentals": "Auto-layout, components, styles, and advanced prototyping",
        "project": "Design a complete responsive design system for a SaaS dashboard",
        "cert": "Figma UX Design System Certificate"
    },
    "System Design": {
        "fundamentals": "Scalability, microservices, load balancing, and database indexing",
        "project": "Design the architecture diagrams and specs for a real-time messaging app",
        "cert": "System Design & Software Architecture Certificate"
    },
    "Web Development": {
        "fundamentals": "REST APIs, HTTP protocols, and server-side logic",
        "project": "Build a secure RESTful API with user authentication and database persistence",
        "cert": "Meta Back-End Developer Certificate"
    },
    "HTML/CSS": {
        "fundamentals": "Responsive layout design, flexbox, CSS Grid, and semantic HTML",
        "project": "Develop a pixel-perfect, responsive landing page using vanilla CSS",
        "cert": "Responsive Web Design Certification"
    },
    "JavaScript": {
        "fundamentals": "Asynchronous JS, Promises, Event Loop, and DOM manipulation",
        "project": "Build an interactive weather dashboard pulling live openweather APIs",
        "cert": "Certified JavaScript Developer"
    },
    "React": {
        "fundamentals": "React components, state hooks, context, and custom rendering hook systems",
        "project": "Develop a kanban task board with drag-and-drop state persistence",
        "cert": "Meta Front-End Developer Certificate"
    },
    "Cyber Security": {
        "fundamentals": "Network security, cryptography, vulnerability scans, and security audits",
        "project": "Perform a penetration test on a deliberately vulnerable local sandbox environment",
        "cert": "CompTIA Security+"
    },
    "Java": {
        "fundamentals": "Object-oriented programming, inheritance, multithreading, and collections",
        "project": "Build a multi-client chat server using Java socket programming",
        "cert": "Oracle Certified Associate, Java Programmer"
    },
    "C++": {
        "fundamentals": "Memory management, pointers, templates, and data structures",
        "project": "Create a high-performance routing library for pathfinding algorithms",
        "cert": "C++ Certified Associate Programmer"
    },
    "Communication": {
        "fundamentals": "Technical writing, presentations, active listening, and business reporting",
        "project": "Write a comprehensive technical specification proposal for a team migration",
        "cert": "Business Communication Specialist"
    },
    "Leadership": {
        "fundamentals": "Agile team coordination, sprint planning, and mentorship",
        "project": "Lead a mock Scrum sprint execution, assigning tasks and prioritizing backlog",
        "cert": "Certified ScrumMaster (CSM)"
    },
    "Teamwork": {
        "fundamentals": "Collaborative code reviews, peer programming, and conflict resolution",
        "project": "Participate in collaborative peer programming build and write retro summaries",
        "cert": "Collaborative Professional Skills Certificate"
    },
    "Problem Solving": {
        "fundamentals": "Data structures & algorithms optimization, troubleshooting, and debugging",
        "project": "Solve 50 complex algorithmic challenges, writing optimization walkthroughs",
        "cert": "Algorithmic Problem Solving Certificate"
    },
    "Creativity": {
        "fundamentals": "Design thinking, brainstorming methodologies, and creative prototyping",
        "project": "Generate three unique alternative product MVP features and prototype mockups",
        "cert": "Design Thinking Practitioner Certificate"
    }
}

@rec_bp.route('/', methods=['GET'])
@jwt_required()
def get_recommendations():
    current_user_id = get_jwt_identity()
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile or not profile.get_skills():
        return jsonify({
            "msg": "Please complete your profile and add at least one technical skill to get recommendations.",
            "recommendations": []
        }), 200
        
    user_skills = profile.get_skills()
    
    # Get top 5 recommendations from ML model
    ml_recs = recommender.recommend(user_skills, top_n=5)
    
    detailed_recs = []
    
    for rec in ml_recs:
        career_name = rec["career_name"]
        match_score = rec["match_score"]
        
        # Query database for career details
        career_db = Career.query.filter_by(name=career_name).first()
        if not career_db:
            continue
            
        req_skills_list = [s.strip() for s in career_db.required_skills.split(',') if s.strip()]
        
        # Skill Gap Analysis
        gap_report = recommender.perform_gap_analysis(user_skills, career_name, req_skills_list)
        available_skills = [g["skill_name"] for g in gap_report if g["status"] in ["strong", "weak"]]
        missing_skills = [g["skill_name"] for g in gap_report if g["status"] == "missing"]
        
        # Get Course Recommendations for missing skills
        recommended_courses = []
        for skill in missing_skills:
            # Query courses for this skill
            courses = Course.query.filter(Course.category.ilike(f"%{skill}%")).all()
            for c in courses:
                if c.to_dict() not in recommended_courses:
                    recommended_courses.append(c.to_dict())
                    
        # Fallback courses if database doesn't have exact skill matches
        if not recommended_courses:
            courses = Course.query.limit(3).all()
            recommended_courses = [c.to_dict() for c in courses]
            
        # Generate roadmap details (30, 60, 90 Day Plans)
        roadmap = generate_roadmap_plan(career_name, missing_skills, available_skills)
        
        # Save recommendations to database for records
        existing_rec = Recommendation.query.filter_by(user_id=current_user_id, career_id=career_db.id).first()
        if existing_rec:
            existing_rec.match_score = match_score
        else:
            new_rec = Recommendation(user_id=current_user_id, career_id=career_db.id, match_score=match_score)
            db.session.add(new_rec)
            
        # Save or update learning roadmap to database
        existing_roadmap = LearningRoadmap.query.filter_by(user_id=current_user_id, career_name=career_name).first()
        plan_30_milestones_json = json.dumps(roadmap["plan_30"]["milestones"])
        plan_60_milestones_json = json.dumps(roadmap["plan_60"]["milestones"])
        plan_90_milestones_json = json.dumps(roadmap["plan_90"]["milestones"])
        
        if existing_roadmap:
            existing_roadmap.title = roadmap["title"]
            existing_roadmap.plan_30_title = roadmap["plan_30"]["title"]
            existing_roadmap.plan_30_milestones = plan_30_milestones_json
            existing_roadmap.plan_60_title = roadmap["plan_60"]["title"]
            existing_roadmap.plan_60_milestones = plan_60_milestones_json
            existing_roadmap.plan_90_title = roadmap["plan_90"]["title"]
            existing_roadmap.plan_90_milestones = plan_90_milestones_json
        else:
            new_roadmap = LearningRoadmap(
                user_id=current_user_id,
                career_name=career_name,
                title=roadmap["title"],
                plan_30_title=roadmap["plan_30"]["title"],
                plan_30_milestones=plan_30_milestones_json,
                plan_60_title=roadmap["plan_60"]["title"],
                plan_60_milestones=plan_60_milestones_json,
                plan_90_title=roadmap["plan_90"]["title"],
                plan_90_milestones=plan_90_milestones_json
            )
            db.session.add(new_roadmap)
            
        detailed_recs.append({
            "career_id": career_db.id,
            "career_name": career_name,
            "description": career_db.description,
            "salary_range": career_db.salary_range,
            "growth_rate": career_db.growth_rate,
            "match_score": match_score,
            "gap_analysis": {
                "available": available_skills,
                "missing": missing_skills,
                "report": gap_report
            },
            "courses": recommended_courses[:4], # Limit to top 4 recommendations
            "roadmap": roadmap
        })
        
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": "Recommendations calculated successfully.",
        "data": {
            "recommendations": detailed_recs
        },
        "recommendations": detailed_recs
    }), 200

def get_skill_roadmap_details(skill):
    """Helper to get structured information for a skill, using a safe fallback."""
    details = SKILL_RESOURCES.get(skill)
    if not details:
        details = {
            "fundamentals": f"{skill} Advanced Concepts",
            "project": f"Build a production-ready application focusing on {skill}",
            "cert": f"{skill} Professional Certification"
        }
    return details

def generate_roadmap_plan(career_name, missing_skills, available_skills):
    """
    Generate customized 30, 60, 90 day roadmap depending on what skills are missing.
    Incorporate specific courses, practice projects, and certifications.
    """
    if not missing_skills:
        return {
            "title": f"Continuous Mastery & Advanced Placement Plan for {career_name}",
            "plan_30": {
                "title": "30-Day: Advanced Concepts & System Design",
                "milestones": [
                    "Complete deep dive into advanced design patterns matching current skill set.",
                    "Build a sandbox application focusing on performance and scalability.",
                    "Practice: Architect an end-to-end distributed system layout.",
                    "Certification: Start prep for an advanced specialization credential."
                ]
            },
            "plan_60": {
                "title": "60-Day: Leadership, Architecture & DevOps",
                "milestones": [
                    "Learn CI/CD automation pipelines and infrastructure deployment.",
                    "Optimize existing codebases for caching, security, and query tuning.",
                    "Practice: Implement secure authentication and rate-limiting microservices.",
                    "Write architectural specification sheets detailing design solutions."
                ]
            },
            "plan_90": {
                "title": "90-Day: Production Testing & Interview Readiness",
                "milestones": [
                    "Conduct peer reviews and focus on code structure optimization.",
                    "Build and deploy a comprehensive web portfolio showcasing key works.",
                    "Practice: Solve 30 complex algorithmic and debugging assignments.",
                    "Obtain final professional credentials and launch target role applications."
                ]
            }
        }
        
    # We have missing skills, let's distribute them
    skills_to_learn = missing_skills.copy()
    
    # Month 1 Focus
    skill_1 = skills_to_learn[0]
    det_1 = get_skill_roadmap_details(skill_1)
    
    # Month 2 Focus
    skill_2 = skills_to_learn[1] if len(skills_to_learn) > 1 else (available_skills[0] if available_skills else "Advanced Concepts")
    det_2 = get_skill_roadmap_details(skill_2)
    
    # Month 3 Focus
    skill_3 = skills_to_learn[2] if len(skills_to_learn) > 2 else "Project Integration"
    det_3 = get_skill_roadmap_details(skill_3)
    
    return {
        "title": f"AI-Powered Career Transition Roadmap: {career_name}",
        "plan_30": {
            "title": f"Day 1-30: Core Fundamentals ({skill_1})",
            "milestones": [
                f"Course Study: Focus on {det_1['fundamentals']}.",
                f"Practice Project: {det_1['project']}.",
                f"Certification Goal: Prepare for '{det_1['cert']}'.",
                "Milestone Assessment: Complete a coding sandbox validating core skills."
            ]
        },
        "plan_60": {
            "title": f"Day 31-60: Deep Dive & Expansion ({skill_2})",
            "milestones": [
                f"Course Study: Understand core elements of {det_2['fundamentals']}.",
                f"Practice Project: {det_2['project']}.",
                f"Certification Goal: Target '{det_2['cert']}' credentials.",
                f"Integration: Connect {skill_1} components to {skill_2} services."
            ]
        },
        "plan_90": {
            "title": f"Day 61-90: Advanced Mastery & Integration ({skill_3})",
            "milestones": [
                f"Course Study: Learn detailed elements of {det_3['fundamentals']}.",
                f"Practice Project: {det_3['project']}.",
                f"Certification Goal: Qualify for '{det_3['cert']}'.",
                "Production Prep: Perform automated test validation and update resume keyword details."
            ]
        }
    }

@rec_bp.route('/download-pdf', methods=['GET'])
@jwt_required()
def download_pdf():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    profile = UserProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({"msg": "Profile not found"}), 404
        
    user_skills = profile.get_skills()
    recs = recommender.recommend(user_skills, top_n=3)
    
    report_data = []
    report_data.append("================================================")
    report_data.append("       CAREERAI NAVIGATOR - CAREER REPORT       ")
    report_data.append("================================================")
    report_data.append(f"Name: {user.name}")
    report_data.append(f"Email: {user.email}")
    report_data.append(f"Academic Degree: {profile.degree or 'N/A'}")
    report_data.append(f"Department/Specialization: {profile.department or 'N/A'}")
    report_data.append(f"Your Skills: {', '.join([f'{k} ({v}%)' for k, v in user_skills.items()])}")
    report_data.append("\n================================================")
    report_data.append("        TOP RECOMMENDED CAREER PATHS            ")
    report_data.append("================================================")
    
    for i, rec in enumerate(recs):
        career_db = Career.query.filter_by(name=rec["career_name"]).first()
        if not career_db:
            continue
        report_data.append(f"\n{i+1}. {rec['career_name']}")
        report_data.append(f"   Match Score: {rec['match_score']}%")
        report_data.append(f"   Salary Range: {career_db.salary_range}")
        report_data.append(f"   Growth Rate: {career_db.growth_rate}")
        report_data.append(f"   Description: {career_db.description}")
        
        # Gap analysis
        req_skills = [s.strip() for s in career_db.required_skills.split(',') if s.strip()]
        gap = recommender.perform_gap_analysis(user_skills, rec['career_name'], req_skills)
        avail = [g["skill_name"] for g in gap if g["status"] in ["strong", "weak"]]
        miss = [g["skill_name"] for g in gap if g["status"] == "missing"]
        
        report_data.append(f"   Skills You Have: {', '.join(avail)}")
        report_data.append(f"   Skills To Learn: {', '.join(miss)}")
        
    report_data.append("\n================================================")
    report_data.append("              END OF REPORT                     ")
    report_data.append("================================================")
    
    file_content = "\n".join(report_data)
    
    mem_file = io.BytesIO()
    mem_file.write(file_content.encode('utf-8'))
    mem_file.seek(0)
    
    return send_file(
        mem_file,
        mimetype="text/plain",
        as_attachment=True,
        download_name=f"{user.name.replace(' ', '_')}_Career_Recommendation_Report.txt"
    )

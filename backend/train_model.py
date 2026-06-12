import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity
import joblib

# Add current dir to python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models import db, Skill, Career, Course, User

# Define skills to seed
SKILLS_SEED = [
    # Technical Skills
    {"name": "Python", "category": "technical"},
    {"name": "Java", "category": "technical"},
    {"name": "C++", "category": "technical"},
    {"name": "SQL", "category": "technical"},
    {"name": "Machine Learning", "category": "technical"},
    {"name": "Data Science", "category": "technical"},
    {"name": "Cloud Computing", "category": "technical"},
    {"name": "Cyber Security", "category": "technical"},
    {"name": "Web Development", "category": "technical"},
    {"name": "HTML/CSS", "category": "technical"},
    {"name": "JavaScript", "category": "technical"},
    {"name": "React", "category": "technical"},
    {"name": "Docker", "category": "technical"},
    {"name": "Git", "category": "technical"},
    {"name": "AWS", "category": "technical"},
    {"name": "Deep Learning", "category": "technical"},
    {"name": "TensorFlow", "category": "technical"},
    {"name": "Tableau", "category": "technical"},
    {"name": "UI/UX Design", "category": "technical"},
    {"name": "Figma", "category": "technical"},
    {"name": "System Design", "category": "technical"},
    {"name": "Statistics", "category": "technical"},
    
    # Soft Skills
    {"name": "Communication", "category": "soft"},
    {"name": "Leadership", "category": "soft"},
    {"name": "Teamwork", "category": "soft"},
    {"name": "Problem Solving", "category": "soft"},
    {"name": "Creativity", "category": "soft"}
]

# Define careers to seed
CAREERS_SEED = [
    {
        "name": "Data Scientist",
        "description": "Data Scientists analyze and interpret complex data to help organizations make better decisions. They combine statistics, programming, and domain knowledge to extract insights.",
        "salary_range": "₹8 LPA - ₹25 LPA",
        "growth_rate": "35% (Much faster than average)",
        "required_skills": "Python, SQL, Machine Learning, Data Science, Statistics, Communication, Problem Solving"
    },
    {
        "name": "Machine Learning Engineer",
        "description": "ML Engineers design, build, and deploy machine learning models and AI systems. They focus on scalability, performance, and writing clean production code.",
        "salary_range": "₹10 LPA - ₹30 LPA",
        "growth_rate": "40% (Explosive growth)",
        "required_skills": "Python, Machine Learning, Deep Learning, TensorFlow, Git, C++, Problem Solving, Teamwork"
    },
    {
        "name": "AI Engineer",
        "description": "AI Engineers build and integrate advanced AI systems like Generative AI, Large Language Models (LLMs), and computer vision applications into products.",
        "salary_range": "₹12 LPA - ₹35 LPA",
        "growth_rate": "45% (Hyper-growth)",
        "required_skills": "Python, Machine Learning, Deep Learning, TensorFlow, Cloud Computing, System Design, Creativity"
    },
    {
        "name": "Data Analyst",
        "description": "Data Analysts collect, clean, process, and analyze data to identify trends, create visual dashboards, and write reports to answer business questions.",
        "salary_range": "₹5 LPA - ₹15 LPA",
        "growth_rate": "25% (High demand)",
        "required_skills": "Python, SQL, Tableau, Statistics, Communication, Teamwork"
    },
    {
        "name": "Business Analyst",
        "description": "Business Analysts analyze business operations, systems, and models to recommend improvements and bridge the gap between business needs and technology solutions.",
        "salary_range": "₹6 LPA - ₹18 LPA",
        "growth_rate": "18% (Stable demand)",
        "required_skills": "SQL, Tableau, Communication, Leadership, Problem Solving, Teamwork"
    },
    {
        "name": "Software Engineer",
        "description": "Software Engineers design, write, test, and maintain computer software, apps, and operating systems, using engineering principles.",
        "salary_range": "₹6 LPA - ₹22 LPA",
        "growth_rate": "22% (Consistent growth)",
        "required_skills": "Java, C++, SQL, Git, Web Development, System Design, Problem Solving"
    },
    {
        "name": "Full Stack Developer",
        "description": "Full Stack Developers work on both the front-end (user interface) and back-end (database, logic) of web applications to deliver end-to-end features.",
        "salary_range": "₹6 LPA - ₹20 LPA",
        "growth_rate": "24% (Very high demand)",
        "required_skills": "JavaScript, React, HTML/CSS, SQL, Web Development, Git, Teamwork"
    },
    {
        "name": "Cloud Engineer",
        "description": "Cloud Engineers design, deploy, and maintain cloud infrastructure and virtual environments using platforms like AWS, GCP, or Azure.",
        "salary_range": "₹8 LPA - ₹22 LPA",
        "growth_rate": "28% (Strong demand)",
        "required_skills": "Cloud Computing, AWS, Docker, Git, System Design, Communication"
    },
    {
        "name": "DevOps Engineer",
        "description": "DevOps Engineers automate software delivery, deployment pipelines (CI/CD), and server administration, optimizing development speeds.",
        "salary_range": "₹9 LPA - ₹25 LPA",
        "growth_rate": "30% (High compensation)",
        "required_skills": "Cloud Computing, AWS, Docker, Git, Python, System Design, Teamwork"
    },
    {
        "name": "Cyber Security Analyst",
        "description": "Cyber Security Analysts monitor, prevent, and respond to security threats, protecting company networks, devices, and proprietary data.",
        "salary_range": "₹7 LPA - ₹20 LPA",
        "growth_rate": "32% (Critical demand)",
        "required_skills": "Cyber Security, Cloud Computing, SQL, System Design, Problem Solving, Leadership"
    },
    {
        "name": "UI/UX Designer",
        "description": "UI/UX Designers design the layout, interactive features, user flows, and aesthetic components of digital products to create amazing experiences.",
        "salary_range": "₹5 LPA - ₹16 LPA",
        "growth_rate": "20% (Consistent growth)",
        "required_skills": "UI/UX Design, Figma, HTML/CSS, Web Development, Creativity, Communication"
    },
    {
        "name": "Product Manager",
        "description": "Product Managers guide the strategy, roadmap, feature definition, and release planning of products, leading cross-functional teams.",
        "salary_range": "₹12 LPA - ₹30 LPA",
        "growth_rate": "15% (Leadership track)",
        "required_skills": "Leadership, Communication, Problem Solving, Teamwork, Creativity, System Design"
    }
]

# Define courses to seed
COURSES_SEED = [
    {"name": "Python for Everybody Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/python", "category": "Python"},
    {"name": "The Ultimate MySQL Bootcamp", "provider": "Udemy", "url": "https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/", "category": "SQL"},
    {"name": "Machine Learning Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "category": "Machine Learning"},
    {"name": "IBM Data Science Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/ibm-data-science", "category": "Data Science"},
    {"name": "Google Cyber Security Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity", "category": "Cyber Security"},
    {"name": "AWS Certified Cloud Practitioner", "provider": "Udemy", "url": "https://www.udemy.com/course/aws-certified-cloud-practitioner-new/", "category": "AWS"},
    {"name": "Docker and Kubernetes: The Complete Guide", "provider": "Udemy", "url": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/", "category": "Docker"},
    {"name": "Deep Learning Specialization", "provider": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "category": "Deep Learning"},
    {"name": "TensorFlow Developer Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "category": "TensorFlow"},
    {"name": "Google Data Analytics Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-data-analytics", "category": "Tableau"},
    {"name": "Google UX Design Professional Certificate", "provider": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-ux-design", "category": "UI/UX Design"},
    {"name": "Software Engineering & Agile", "provider": "edX", "url": "https://www.edx.org/course/software-engineering-introduction", "category": "System Design"},
    {"name": "Product Management First Steps", "provider": "LinkedIn Learning", "url": "https://www.linkedin.com/learning/product-management-first-steps", "category": "Leadership"},
    {"name": "The Complete React Developer", "provider": "Udemy", "url": "https://www.udemy.com/course/react-redux/", "category": "React"}
]

def train_and_save_recommendation_models():
    print("Building ML Skill Recommendation Matrices...")
    
    # 1. Compile list of skills and careers
    skills = [s["name"] for s in SKILLS_SEED]
    careers = CAREERS_SEED
    
    # 2. Build skill profiles for careers (1 = required/essential, 0.5 = secondary, 0 = not req)
    career_names = [c["name"] for c in careers]
    matrix = np.zeros((len(careers), len(skills)))
    
    for i, career in enumerate(careers):
        req_skills = [s.strip().lower() for s in career["required_skills"].split(",")]
        for j, skill in enumerate(skills):
            if skill.lower() in req_skills:
                # Core required skill gets full weight
                matrix[i, j] = 1.0
            # Some implicit secondary skills helper logic
            elif "data" in career["name"].lower() and skill.lower() in ["statistics", "sql"]:
                matrix[i, j] = 0.5
            elif "engineer" in career["name"].lower() and skill.lower() in ["git", "system design"]:
                matrix[i, j] = 0.5
                
    df_matrix = pd.DataFrame(matrix, index=career_names, columns=skills)
    
    # 3. Train KNN model on the career matrices
    # We will use cosine metric for distance calculation
    knn = NearestNeighbors(n_neighbors=5, metric='cosine', algorithm='brute')
    knn.fit(matrix)
    
    # Ensure directory exists
    model_dir = os.path.join(os.path.dirname(__file__), 'app', 'services', 'models_bin')
    os.makedirs(model_dir, exist_ok=True)
    
    # 4. Save models and configuration matrices using joblib
    joblib.dump(knn, os.path.join(model_dir, 'knn_model.joblib'))
    joblib.dump(df_matrix, os.path.join(model_dir, 'career_skills_matrix.joblib'))
    joblib.dump(skills, os.path.join(model_dir, 'skills_list.joblib'))
    joblib.dump(career_names, os.path.join(model_dir, 'careers_list.joblib'))
    
    print(f"Models successfully trained and saved to {model_dir}")

def seed_database(app):
    with app.app_context():
        # Automatic database creation logic for PostgreSQL
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        if db_url.startswith('postgresql'):
            import psycopg2
            from urllib.parse import urlparse
            
            result = urlparse(db_url)
            username = result.username
            password = result.password
            database = result.path[1:]
            hostname = result.hostname
            port = result.port or 5432
            
            try:
                # Try direct connection to target database
                conn = psycopg2.connect(
                    database=database,
                    user=username,
                    password=password,
                    host=hostname,
                    port=port
                )
                conn.close()
            except psycopg2.OperationalError as e:
                if "does not exist" in str(e) or "database" in str(e).lower() and "exist" in str(e).lower():
                    print(f"[INFO] Database '{database}' does not exist. Attempting to create it...")
                    try:
                        conn = psycopg2.connect(
                            database='postgres',
                            user=username,
                            password=password,
                            host=hostname,
                            port=port
                        )
                        conn.autocommit = True
                        cursor = conn.cursor()
                        cursor.execute(f'CREATE DATABASE "{database}"')
                        cursor.close()
                        conn.close()
                        print(f"[SUCCESS] Database '{database}' created successfully.")
                    except Exception as create_err:
                        print(f"[ERROR] Could not auto-create database: {create_err}")
                else:
                    print(f"[WARNING] Database connection check failed: {e}. Attempting anyway...")
                    
        # Create all tables
        try:
            db.create_all()
            print("[INFO] Database tables created successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to create database tables: {e}")
            return
            
        # Seed skills
        skills_added = 0
        for skill_data in SKILLS_SEED:
            existing = Skill.query.filter_by(name=skill_data["name"]).first()
            if not existing:
                skill = Skill(name=skill_data["name"], category=skill_data["category"])
                db.session.add(skill)
                skills_added += 1
        
        # Seed careers
        careers_added = 0
        for career_data in CAREERS_SEED:
            existing = Career.query.filter_by(name=career_data["name"]).first()
            if not existing:
                career = Career(
                    name=career_data["name"],
                    description=career_data["description"],
                    salary_range=career_data["salary_range"],
                    growth_rate=career_data["growth_rate"],
                    required_skills=career_data["required_skills"]
                )
                db.session.add(career)
                careers_added += 1
                
        # Seed courses
        courses_added = 0
        for course_data in COURSES_SEED:
            existing = Course.query.filter_by(name=course_data["name"]).first()
            if not existing:
                course = Course(
                    name=course_data["name"],
                    provider=course_data["provider"],
                    url=course_data["url"],
                    category=course_data["category"]
                )
                db.session.add(course)
                courses_added += 1
                
        # Seed an admin account automatically if it doesn't exist
        admin_user = User.query.filter_by(email="admin@careerai.com").first()
        if not admin_user:
            admin = User(name="System Administrator", email="admin@careerai.com", role="admin")
            admin.set_password("Admin@123")
            db.session.add(admin)
            print("[INFO] Default admin created: admin@careerai.com / Admin@123")

        db.session.commit()
        print(f"[SUCCESS] Seeded Database: {skills_added} skills, {careers_added} careers, and {courses_added} courses added.")

if __name__ == "__main__":
    app = create_app()
    seed_database(app)
    train_and_save_recommendation_models()
    print("Database seeding and training process completed successfully!")

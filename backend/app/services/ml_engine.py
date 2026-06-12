import os
import math
import numpy as np
from app.models import Career

# Predefined weights for seed careers to satisfy the rule-based layer (Σ(User Skill * Weight))
DEFAULT_WEIGHTS = {
    "Data Scientist": {"Python": 0.30, "Machine Learning": 0.30, "Statistics": 0.20, "SQL": 0.20},
    "Machine Learning Engineer": {"Python": 0.30, "Machine Learning": 0.30, "Deep Learning": 0.20, "TensorFlow": 0.10, "Git": 0.10},
    "AI Engineer": {"Python": 0.30, "Machine Learning": 0.25, "Deep Learning": 0.25, "TensorFlow": 0.10, "System Design": 0.10},
    "Data Analyst": {"Python": 0.25, "SQL": 0.30, "Tableau": 0.25, "Statistics": 0.20},
    "Business Analyst": {"SQL": 0.25, "Tableau": 0.25, "Communication": 0.20, "Problem Solving": 0.15, "Leadership": 0.15},
    "Software Engineer": {"Java": 0.20, "C++": 0.20, "SQL": 0.20, "Git": 0.15, "Web Development": 0.15, "System Design": 0.10},
    "Full Stack Developer": {"JavaScript": 0.25, "React": 0.25, "HTML/CSS": 0.20, "Web Development": 0.15, "SQL": 0.15},
    "Cloud Engineer": {"Cloud Computing": 0.30, "AWS": 0.30, "Docker": 0.15, "Git": 0.10, "System Design": 0.15},
    "DevOps Engineer": {"Docker": 0.25, "AWS": 0.25, "Cloud Computing": 0.20, "Git": 0.15, "Python": 0.15},
    "Cyber Security Analyst": {"Cyber Security": 0.35, "Cloud Computing": 0.25, "SQL": 0.15, "System Design": 0.15, "Problem Solving": 0.10},
    "UI/UX Designer": {"UI/UX Design": 0.35, "Figma": 0.35, "HTML/CSS": 0.15, "Web Development": 0.15},
    "Product Manager": {"Leadership": 0.30, "Communication": 0.30, "Problem Solving": 0.20, "Teamwork": 0.10, "Creativity": 0.10}
}

# Target required skill proficiency scores for the detailed gap analysis comparisons
CAREER_SKILL_REQUIREMENTS = {
    "Data Scientist": {"Python": 90, "SQL": 80, "Machine Learning": 90, "Data Science": 90, "Statistics": 85, "Communication": 75, "Problem Solving": 80},
    "Machine Learning Engineer": {"Python": 90, "Machine Learning": 95, "Deep Learning": 90, "TensorFlow": 85, "Git": 80, "C++": 75, "Problem Solving": 85, "Teamwork": 75},
    "AI Engineer": {"Python": 95, "Machine Learning": 90, "Deep Learning": 95, "TensorFlow": 90, "Cloud Computing": 80, "System Design": 85, "Creativity": 80},
    "Data Analyst": {"Python": 80, "SQL": 85, "Tableau": 85, "Statistics": 80, "Communication": 80, "Teamwork": 75},
    "Business Analyst": {"SQL": 80, "Tableau": 80, "Communication": 90, "Leadership": 85, "Problem Solving": 85, "Teamwork": 80},
    "Software Engineer": {"Java": 85, "C++": 85, "SQL": 80, "Git": 80, "Web Development": 80, "System Design": 85, "Problem Solving": 85},
    "Full Stack Developer": {"JavaScript": 90, "React": 90, "HTML/CSS": 85, "Web Development": 90, "SQL": 80, "Git": 80, "Teamwork": 80},
    "Cloud Engineer": {"Cloud Computing": 90, "AWS": 90, "Docker": 85, "Git": 80, "System Design": 85, "Communication": 75},
    "DevOps Engineer": {"Cloud Computing": 85, "AWS": 90, "Docker": 90, "Git": 85, "Python": 80, "System Design": 80, "Teamwork": 75},
    "Cyber Security Analyst": {"Cyber Security": 90, "Cloud Computing": 80, "SQL": 75, "System Design": 85, "Problem Solving": 85, "Leadership": 75},
    "UI/UX Designer": {"UI/UX Design": 90, "Figma": 95, "HTML/CSS": 75, "Web Development": 70, "Creativity": 90, "Communication": 80},
    "Product Manager": {"Leadership": 90, "Communication": 95, "Problem Solving": 90, "Teamwork": 85, "Creativity": 80, "System Design": 75}
}

class CareerRecommender:
    def __init__(self):
        # We maintain the structure, but all calculations run dynamically from the database
        pass

    def recommend(self, user_skills_dict, top_n=5):
        """
        Calculates recommendations using a dynamic Hybrid Approach:
        Rule-Based Layer (Σ(User Skill * Weight)) + ML Similarity Layer (TF-IDF & Cosine Similarity)
        """
        # Query active careers list from database
        try:
            careers = Career.query.all()
        except Exception as e:
            print(f"Error querying careers database: {e}")
            return []

        if not careers:
            return []

        # 1. Gather all unique skills across all database careers for TF-IDF building
        all_skills_set = set()
        career_skills_map = {}
        
        for career in careers:
            req_skills = [s.strip() for s in career.required_skills.split(',') if s.strip()]
            career_skills_map[career.name] = req_skills
            all_skills_set.update(req_skills)
            
        unique_skills_list = list(all_skills_set)
        N = len(careers)

        # 2. Calculate Document Frequency (DF) and Inverse Document Frequency (IDF) for all skills
        df_map = {skill: 0 for skill in unique_skills_list}
        for req_skills in career_skills_map.values():
            for skill in req_skills:
                df_map[skill] += 1
                
        idf_map = {}
        for skill, df in df_map.items():
            # Standard smoothed IDF calculation
            idf_map[skill] = math.log((1 + N) / (1 + df)) + 1.0

        # 3. Calculate similarity and rule-based weights for each career
        results = []
        for career in careers:
            career_name = career.name
            req_skills = career_skills_map[career_name]
            
            # --- LAYER A: Rule-Based Weight calculation ---
            weights = DEFAULT_WEIGHTS.get(career_name, {})
            if not weights:
                # Fallback: distribute weights equally among all required skills
                weights = {s: 1.0 / len(req_skills) for s in req_skills} if req_skills else {}
                
            rule_score = sum(user_skills_dict.get(skill, 0) * weight for skill, weight in weights.items())

            # --- LAYER B: TF-IDF & Cosine Similarity calculation ---
            # Construct Career TF-IDF Vector
            career_vector = np.zeros(len(unique_skills_list))
            for i, skill in enumerate(unique_skills_list):
                if skill in req_skills:
                    # Term frequency = 1.0
                    career_vector[i] = 1.0 * idf_map[skill]
                    
            # Construct User TF-IDF Vector
            user_vector = np.zeros(len(unique_skills_list))
            for i, skill in enumerate(unique_skills_list):
                score = user_skills_dict.get(skill, 0)
                # Normalize user skill rating (0-100) to (0.0-1.0)
                user_vector[i] = (float(score) / 100.0) * idf_map[skill]
                
            # Cosine Similarity calculation
            dot_product = np.dot(user_vector, career_vector)
            user_norm = np.linalg.norm(user_vector)
            career_norm = np.linalg.norm(career_vector)
            
            if user_norm > 0 and career_norm > 0:
                cosine_sim = dot_product / (user_norm * career_norm)
            else:
                cosine_sim = 0.0
                
            cosine_score = cosine_sim * 100.0

            # --- COMBINATION: Hybrid score ---
            # 50% Rule-Based, 50% Cosine Similarity
            match_score = int(0.5 * rule_score + 0.5 * cosine_score)
            match_score = max(0, min(100, match_score))
            
            results.append({
                "career_name": career_name,
                "match_score": match_score
            })

        # Sort recommendations by match score descending
        results = sorted(results, key=lambda x: x["match_score"], reverse=True)
        return results[:top_n]

    def perform_gap_analysis(self, user_skills_dict, career_name, career_required_skills):
        """
        Compares user skills against career required skills.
        Categorizes skills as strong, weak, or missing.
        Calculates gap priority (high, medium, low) using target requirements.
        """
        target_scores = CAREER_SKILL_REQUIREMENTS.get(career_name, {})
        gap_report = []
        
        for skill in career_required_skills:
            user_score = user_skills_dict.get(skill, 0)
            required_score = target_scores.get(skill, 80) # Default target proficiency is 80%
            
            gap = required_score - user_score
            
            # Status: strong, weak, missing
            if user_score >= required_score:
                status = "strong"
            elif user_score >= (required_score - 30):
                status = "weak"
            else:
                status = "missing"
                
            # Gap priority indicator: high, medium, low
            if gap > 25:
                priority = "high"
            elif gap > 5:
                priority = "medium"
            else:
                priority = "low"
                
            gap_report.append({
                "skill_name": skill,
                "user_score": user_score,
                "required_score": required_score,
                "gap": max(0, gap),
                "status": status,
                "priority": priority
            })
            
        return gap_report

import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Ensure backend root is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ml_engine import CareerRecommender

class MockCareer:
    def __init__(self, name, required_skills):
        self.name = name
        self.required_skills = required_skills

class TestCareerRecommender(unittest.TestCase):
    def setUp(self):
        self.recommender = CareerRecommender()
        self.mock_careers = [
            MockCareer("Data Scientist", "Python, SQL, Machine Learning, Data Science, Statistics"),
            MockCareer("Software Engineer", "Java, C++, SQL, Git, Web Development, System Design"),
            MockCareer("UI/UX Designer", "UI/UX Design, Figma, HTML/CSS, Web Development")
        ]

    @patch('app.services.ml_engine.Career')
    def test_recommend_direct_match(self, mock_career_class):
        # Setup mock db query
        mock_career_class.query.all.return_value = self.mock_careers

        # Direct Data Scientist match
        user_skills = {
            "Python": 90,
            "Machine Learning": 90,
            "Statistics": 85,
            "SQL": 80,
            "Data Science": 90
        }

        recs = self.recommender.recommend(user_skills, top_n=3)
        self.assertTrue(len(recs) > 0)
        # The top match should be Data Scientist
        self.assertEqual(recs[0]["career_name"], "Data Scientist")
        self.assertTrue(recs[0]["match_score"] > 70)

    @patch('app.services.ml_engine.Career')
    def test_recommend_empty_skills(self, mock_career_class):
        mock_career_class.query.all.return_value = self.mock_careers

        user_skills = {}
        recs = self.recommender.recommend(user_skills, top_n=3)
        self.assertEqual(len(recs), 3)
        # All scores should be low (0)
        for r in recs:
            self.assertEqual(r["match_score"], 0)

    @patch('app.services.ml_engine.Career')
    def test_recommend_ranking(self, mock_career_class):
        mock_career_class.query.all.return_value = self.mock_careers

        # Skills matching UI/UX design perfectly
        user_skills = {
            "UI/UX Design": 95,
            "Figma": 95,
            "HTML/CSS": 85,
            "Web Development": 80
        }

        recs = self.recommender.recommend(user_skills, top_n=2)
        self.assertEqual(recs[0]["career_name"], "UI/UX Designer")
        # First one should be UI/UX Designer, second should have much lower match score
        self.assertTrue(recs[0]["match_score"] > recs[1]["match_score"])

    def test_perform_gap_analysis(self):
        user_skills = {
            "Python": 95,
            "SQL": 50,
        }
        # Data Scientist requirements: Python: 90, SQL: 80, Machine Learning: 90
        career_required_skills = ["Python", "SQL", "Machine Learning"]
        
        report = self.recommender.perform_gap_analysis(
            user_skills, "Data Scientist", career_required_skills
        )
        
        # We expect 3 items in the report
        self.assertEqual(len(report), 3)
        
        # Map by skill name for easy checking
        report_map = {item["skill_name"]: item for item in report}
        
        # Python: user has 95, required is 90. Status should be strong, gap should be 0, priority low.
        self.assertEqual(report_map["Python"]["status"], "strong")
        self.assertEqual(report_map["Python"]["gap"], 0)
        self.assertEqual(report_map["Python"]["priority"], "low")
        
        # SQL: user has 50, required is 80. Gap = 30. Status should be weak, priority high.
        self.assertEqual(report_map["SQL"]["status"], "weak")
        self.assertEqual(report_map["SQL"]["gap"], 30)
        self.assertEqual(report_map["SQL"]["priority"], "high")
        
        # Machine Learning: user has 0, required is 90. Gap = 90. Status should be missing, priority high.
        self.assertEqual(report_map["Machine Learning"]["status"], "missing")
        self.assertEqual(report_map["Machine Learning"]["gap"], 90)
        self.assertEqual(report_map["Machine Learning"]["priority"], "high")

if __name__ == '__main__':
    unittest.main()

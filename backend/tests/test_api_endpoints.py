import unittest
from unittest.mock import patch, MagicMock
import json
import io
import sys
import os

# Ensure backend root is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, UserProfile, Skill, Career, Course, Recommendation

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        # Initialize Flask app in testing mode
        self.app = create_app('config.TestingConfig')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        # Recreate tables on clean in-memory SQLite database
        db.create_all()

        # Seed initial skills and career details for matches
        self.skill_python = Skill(name="Python", category="technical")
        self.skill_sql = Skill(name="SQL", category="technical")
        self.skill_git = Skill(name="Git", category="technical")
        db.session.add_all([self.skill_python, self.skill_sql, self.skill_git])

        self.career_se = Career(
            name="Software Engineer",
            description="Build and design software systems",
            salary_range="$80k - $120k",
            growth_rate="15%",
            required_skills="Python, SQL, Git"
        )
        db.session.add(self.career_se)

        self.course_py = Course(
            name="Complete Python Bootcamp",
            provider="Udemy",
            category="Python, Programming",
            url="http://example.com/python"
        )
        db.session.add(self.course_py)
        
        db.session.commit()

        # Keep track of tokens
        self.auth_token = None

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def register_test_user(self, name="Test User", email="test@example.com", password="password123"):
        response = self.client.post('/api/auth/register', json={
            "name": name,
            "email": email,
            "password": password,
            "mobile": "1234567890",
            "qualification": "Bachelor of Science",
            "currentStatus": "Student"
        })
        return response

    def get_auth_headers(self):
        if not self.auth_token:
            res = self.register_test_user()
            data = json.loads(res.data)
            self.auth_token = data.get("access_token")
        return {"Authorization": f"Bearer {self.auth_token}"}

    def test_registration_success(self):
        res = self.register_test_user("Alice Smith", "alice@example.com", "securepwd123")
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "alice@example.com")

    def test_registration_validation(self):
        # Missing password
        res = self.client.post('/api/auth/register', json={
            "name": "Invalid",
            "email": "invalid@example.com"
        })
        self.assertEqual(res.status_code, 400)
        
        # Invalid email
        res = self.client.post('/api/auth/register', json={
            "name": "Invalid",
            "email": "invalid-email",
            "password": "pwd"
        })
        self.assertEqual(res.status_code, 400)

    def test_login_success(self):
        # Register first
        self.register_test_user("Bob", "bob@example.com", "password123")
        
        # Login
        res = self.client.post('/api/auth/login', json={
            "email": "bob@example.com",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("access_token", data)

    def test_login_invalid_credentials(self):
        res = self.client.post('/api/auth/login', json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        self.assertEqual(res.status_code, 401)

    def test_get_and_update_profile(self):
        headers = self.get_auth_headers()
        
        # Get profile
        res = self.client.get('/api/profile/', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["degree"], "Bachelor of Science")

        # Update profile
        update_data = {
            "age": 22,
            "location": "New York",
            "cgpa": 9.2,
            "skills": {"Python": 80, "SQL": 70},
            "interests": ["Software Engineering", "Databases"]
        }
        res = self.client.post('/api/profile/', headers=headers, json=update_data)
        self.assertEqual(res.status_code, 200)
        
        # Verify changes
        res = self.client.get('/api/profile/', headers=headers)
        data = json.loads(res.data)
        self.assertEqual(data["age"], 22)
        self.assertEqual(data["location"], "New York")
        self.assertEqual(data["cgpa"], 9.2)
        self.assertIn("Python", data["skills"])
        self.assertIn("Software Engineering", data["interests"])

    def test_get_skills_list(self):
        res = self.client.get('/api/profile/skills')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(len(data) >= 3)
        names = [s["name"] for s in data]
        self.assertIn("Python", names)

    def test_create_skill(self):
        headers = self.get_auth_headers()
        res = self.client.post('/api/profile/skills', headers=headers, json={
            "name": "Docker",
            "category": "technical"
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data["skill"]["name"], "Docker")

    def test_get_recommendations(self):
        headers = self.get_auth_headers()
        
        # First update user profile skills so recommender has something to work with
        self.client.post('/api/profile/', headers=headers, json={
            "skills": {"Python": 90, "SQL": 80, "Git": 70}
        })

        res = self.client.get('/api/recommendations/', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("recommendations", data)
        self.assertTrue(len(data["recommendations"]) > 0)
        self.assertEqual(data["recommendations"][0]["career_name"], "Software Engineer")

    @patch('app.routes.chatbot.groq_service')
    def test_chatbot_message(self, mock_groq_service):
        mock_groq_service.generate_chat_response.return_value = "Hello! I recommend focusing on software patterns."
        
        headers = self.get_auth_headers()
        res = self.client.post('/api/chatbot/message', headers=headers, json={
            "message": "What should I learn next?"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["response"], "Hello! I recommend focusing on software patterns.")

    @patch('app.routes.resume.extract_text_from_pdf')
    def test_resume_upload(self, mock_extract_text):
        mock_extract_text.return_value = "Resume of Test User. Skills include Python, SQL, and Git."
        
        headers = self.get_auth_headers()
        
        # Construct dummy PDF bytes
        file_data = {
            'file': (io.BytesIO(b'%PDF-1.4 dummy contents'), 'resume.pdf')
        }
        
        res = self.client.post('/api/resume/upload', headers=headers, data=file_data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["filename"], "resume.pdf")
        self.assertIn("analysis", data)
        self.assertTrue(data["analysis"]["ats_score"] > 0)

    @patch('app.routes.ai.groq_service')
    def test_ai_chat_route(self, mock_groq_service):
        mock_groq_service.generate_career_advice.return_value = "Keep learning!"
        
        headers = self.get_auth_headers()
        res = self.client.post('/api/ai/chat', headers=headers, json={
            "message": "Hi advisor"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["response"], "Keep learning!")

    @patch('app.routes.ai.groq_service')
    def test_ai_roadmap_route(self, mock_groq_service):
        mock_groq_service.generate_learning_roadmap.return_value = {"day30": "basics", "day60": "advanced"}
        
        headers = self.get_auth_headers()
        res = self.client.post('/api/ai/roadmap', headers=headers, json={
            "target_career": "Software Engineer"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["roadmap"], {"day30": "basics", "day60": "advanced"})

    @patch('app.routes.ai.groq_service')
    def test_ai_resume_feedback_route(self, mock_groq_service):
        mock_groq_service.resume_feedback.return_value = {
            "strengths": ["Clear formatting"],
            "weaknesses": ["Lack of metrics"],
            "suggestions": ["Add metrics"]
        }
        
        headers = self.get_auth_headers()
        res = self.client.post('/api/ai/resume-feedback', headers=headers, json={
            "resume_text": "Experienced software developer"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["suggestions"], ["Add metrics"])

    @patch('app.routes.ai.groq_service')
    def test_ai_skill_gap_route(self, mock_groq_service):
        mock_groq_service.analyze_skill_gap.return_value = {
            "missing_skills": ["Rust"],
            "recommendations": ["Learn Rust fundamentals"]
        }
        
        headers = self.get_auth_headers()
        res = self.client.post('/api/ai/skill-gap', headers=headers, json={
            "target_career": "Systems Engineer"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["success"])
        self.assertEqual(data["missing_skills"], ["Rust"])

if __name__ == '__main__':
    unittest.main()

import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

class GroqService:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = GROQ_MODEL
        self._client = None

    @property
    def client(self):
        if not self._client:
            if not self.api_key:
                logger.error("[ERROR] Groq API Key is not set in environment.")
                raise ValueError("GROQ_API_KEY is missing from configuration.")
            self._client = Groq(api_key=self.api_key)
        return self._client

    def _call_groq(self, system_prompt: str, user_prompt: str, response_format=None) -> str:
        logger.info("[INFO] Groq request started")
        try:
            kwargs = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "model": self.model,
                "temperature": 0.7,
            }
            if response_format:
                kwargs["response_format"] = response_format

            chat_completion = self.client.chat.completions.create(**kwargs)
            response_text = chat_completion.choices[0].message.content
            
            if not response_text or not response_text.strip():
                logger.error("[ERROR] Groq request failed - Empty response received")
                raise ValueError("Received an empty response from Groq.")
                
            logger.info("[INFO] Groq response received")
            return response_text
        except Exception as e:
            logger.error(f"[ERROR] Groq request failed: {str(e)}")
            raise e

    def generate_career_advice(self, message: str, user_context: dict = None) -> str:
        system_prompt = (
            "You are an expert career advisory AI assistant for CareerAI Navigator. "
            "Give helpful, professional, motivating, and structured advice about careers, "
            "skill development, and professional upskilling."
        )
        user_prompt = f"User message: {message}\n"
        if user_context:
            user_prompt += f"User Profile Context:\n{json.dumps(user_context, indent=2)}"
        return self._call_groq(system_prompt, user_prompt)

    def generate_learning_roadmap(self, profile_data: dict, target_career: str) -> dict:
        system_prompt = (
            "You are a Career Roadmap Generator. You MUST return a valid JSON object ONLY. "
            "Do not include any extra introductory or concluding text, only return raw JSON. "
            "The JSON must have the following schema exactly:\n"
            "{\n"
            "  \"title\": \"Roadmap Title\",\n"
            "  \"plan_30\": {\n"
            "    \"title\": \"30-Day Plan Title\",\n"
            "    \"milestones\": [\"milestone 1\", \"milestone 2\", \"milestone 3\"]\n"
            "  },\n"
            "  \"plan_60\": {\n"
            "    \"title\": \"60-Day Plan Title\",\n"
            "    \"milestones\": [\"milestone 1\", \"milestone 2\", \"milestone 3\"]\n"
            "  },\n"
            "  \"plan_90\": {\n"
            "    \"title\": \"90-Day Plan Title\",\n"
            "    \"milestones\": [\"milestone 1\", \"milestone 2\", \"milestone 3\"]\n"
            "  }\n"
            "}"
        )
        user_prompt = (
            f"Generate a customized 30-60-90 day learning roadmap for the target career: '{target_career}'.\n"
            f"User Profile details:\n{json.dumps(profile_data, indent=2)}"
        )
        response_text = self._call_groq(system_prompt, user_prompt, response_format={"type": "json_object"})
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Parse fallback in case json format was slightly violated
            import re
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            # Default fallback structure
            return {
                "title": f"Upskilling Plan for {target_career}",
                "plan_30": {"title": "30-Day Setup", "milestones": ["Review fundamentals for target role."]},
                "plan_60": {"title": "60-Day Projects", "milestones": ["Build a small hands-on project."]},
                "plan_90": {"title": "90-Day Applications", "milestones": ["Apply for roles and test skills."]}
            }

    def analyze_skill_gap(self, current_skills: list, target_career: str) -> dict:
        system_prompt = (
            "You are a Career Skill Gap Analyzer. You MUST return a valid JSON object ONLY. "
            "Do not include any extra text. The JSON must match the following schema:\n"
            "{\n"
            "  \"missing_skills\": [\"skill 1\", \"skill 2\"],\n"
            "  \"recommendations\": [\"recommendation 1\", \"recommendation 2\"]\n"
            "}"
        )
        user_prompt = (
            f"Target Career: {target_career}\n"
            f"Current Skills: {json.dumps(current_skills)}"
        )
        response_text = self._call_groq(system_prompt, user_prompt, response_format={"type": "json_object"})
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            return {
                "missing_skills": [],
                "recommendations": ["Review target job description to identify missing skillsets."]
            }

    def resume_feedback(self, resume_text: str) -> dict:
        system_prompt = (
            "You are an expert Resume Reviewer and ATS Optimizer. You MUST return a valid JSON object ONLY. "
            "Do not include any extra text. The JSON must match the following schema:\n"
            "{\n"
            "  \"strengths\": [\"strength 1\", \"strength 2\"],\n"
            "  \"weaknesses\": [\"weakness 1\", \"weakness 2\"],\n"
            "  \"suggestions\": [\"suggestion 1\", \"suggestion 2\"]\n"
            "}"
        )
        user_prompt = f"Resume text:\n{resume_text}"
        response_text = self._call_groq(system_prompt, user_prompt, response_format={"type": "json_object"})
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            return {
                "strengths": ["Clear layout and readable sections."],
                "weaknesses": ["Lack of quantifiable metrics or data points."],
                "suggestions": ["Include percentages and numbers to demonstrate real impact."]
            }

    def generate_chat_response(self, system_prompt: str, chat_history: list) -> str:
        """
        Generates a chat response using conversation history and RAG system prompt.
        """
        logger.info("[INFO] Groq chat request started")
        try:
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(chat_history)
            
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.7,
            )
            response_text = chat_completion.choices[0].message.content
            logger.info("[INFO] Groq chat response received")
            return response_text
        except Exception as e:
            logger.error(f"[ERROR] Groq chat request failed: {str(e)}")
            raise e


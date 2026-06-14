import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';

export interface RoadmapResponse {
  title: string;
  plan_30: {
    title: string;
    milestones: string[];
  };
  plan_60: {
    title: string;
    milestones: string[];
  };
  plan_90: {
    title: string;
    milestones: string[];
  };
}

export interface SkillGapResponse {
  missing_skills: string[];
  recommendations: string[];
}

export interface ResumeFeedbackResponse {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export const aiService = {
  /**
   * Send a general message to the career assistant chatbot.
   */
  chat: async (message: string): Promise<string> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.response || data.error || 'Failed to get AI career advice.');
    }
    return data.response;
  },

  /**
   * Generate a 30-60-90 day roadmap for a target career role.
   */
  generateRoadmap: async (
    targetCareer: string,
    profile?: any,
    skills?: string[]
  ): Promise<RoadmapResponse> => {
    const response = await apiFetch(`${API_URL}/api/ai/roadmap`, {
      method: 'POST',
      body: JSON.stringify({
        target_career: targetCareer,
        profile,
        skills,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate learning roadmap.');
    }
    return data.roadmap;
  },

  /**
   * Analyze the skill gap for a target career path.
   */
  analyzeSkillGap: async (
    targetCareer: string,
    currentSkills?: string[]
  ): Promise<SkillGapResponse> => {
    const response = await apiFetch(`${API_URL}/api/ai/skill-gap`, {
      method: 'POST',
      body: JSON.stringify({
        target_career: targetCareer,
        current_skills: currentSkills,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze skill gap.');
    }
    return data;
  },

  /**
   * Get feedback, strengths, weaknesses, and ATS suggestions for a resume.
   */
  getResumeFeedback: async (resumeText: string): Promise<ResumeFeedbackResponse> => {
    const response = await apiFetch(`${API_URL}/api/ai/resume-feedback`, {
      method: 'POST',
      body: JSON.stringify({ resume_text: resumeText }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get resume feedback.');
    }
    return {
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      suggestions: data.suggestions || [],
    };
  },
};

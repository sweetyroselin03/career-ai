import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  content: string;
  created_at: string;
}

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
   * Get all persistent chat sessions for the current user.
   */
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch chat sessions.');
    }
    return data.data || [];
  },

  /**
   * Create a new chat session.
   */
  createSession: async (title: string): Promise<ChatSession> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create chat session.');
    }
    return data.data;
  },

  /**
   * Rename an existing chat session.
   */
  renameSession: async (sessionId: number, title: string): Promise<ChatSession> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/${sessionId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to rename chat session.');
    }
    return data.data;
  },

  /**
   * Delete a chat session.
   */
  deleteSession: async (sessionId: number): Promise<void> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete chat session.');
    }
  },

  /**
   * Get all messages for a specific session.
   */
  getSessionMessages: async (sessionId: number): Promise<ChatMessage[]> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/${sessionId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch session messages.');
    }
    const messages = data.data ? data.data.messages : [];
    return messages.map((m: any) => ({
      id: m.id,
      sender: m.role === 'assistant' ? 'bot' : 'user',
      content: m.content,
      created_at: m.created_at
    }));
  },

  /**
   * Send a message to the persistent chat session.
   */
  sendMessage: async (sessionId: number, message: string): Promise<ChatMessage> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message.');
    }
    const botMsg = data.data.bot_message;
    return {
      id: botMsg.id,
      sender: botMsg.role === 'assistant' ? 'bot' : 'user',
      content: botMsg.content,
      created_at: botMsg.created_at
    };
  },

  /**
   * Upload a document to the chat session context.
   */
  uploadDocument: async (
    sessionId: number,
    file: File
  ): Promise<{ document: any; user_message: ChatMessage; bot_message: ChatMessage }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/${sessionId}/upload-document`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload document.');
    }
    const userMsg = data.data.user_message;
    const botMsg = data.data.bot_message;
    return {
      document: data.data.document,
      user_message: {
        id: userMsg.id,
        sender: userMsg.role === 'assistant' ? 'bot' : 'user',
        content: userMsg.content,
        created_at: userMsg.created_at
      },
      bot_message: {
        id: botMsg.id,
        sender: botMsg.role === 'assistant' ? 'bot' : 'user',
        content: botMsg.content,
        created_at: botMsg.created_at
      }
    };
  },

  /**
   * Send a general message to the career assistant chatbot. (Legacy fallback)
   */
  chat: async (message: string): Promise<string> => {
    const response = await apiFetch(`${API_URL}/api/chatbot/sessions/1/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get AI career advice.');
    }
    return data.data ? data.data.bot_message.content : '';
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

// mockFetch.ts
// Global Fetch Interceptor and In-Memory Data Store for CareerAI Navigator Frontend Prototype

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Profile {
  age: number | '';
  gender: string;
  location: string;
  degree: string;
  department: string;
  university: string;
  cgpa: number | '';
  career_goals: string;
  skills: Record<string, number>;
  interests: string[];
  resume_filename?: string;
}

// ----------------------------------------------------
// In-Memory Database State
// ----------------------------------------------------

let currentUser: User = {
  id: 1,
  name: "Demo Administrator",
  email: "admin@careerai.com",
  role: "admin",
  created_at: new Date().toISOString()
};

let userProfile: Profile = {
  age: 24,
  gender: "Male",
  location: "Bangalore, India",
  degree: "B.Tech",
  department: "Computer Science",
  university: "Anna University",
  cgpa: 8.75,
  career_goals: "I want to become a Lead Machine Learning Engineer and build large scale AI products.",
  skills: {
    "Python": 90,
    "SQL": 80,
    "Machine Learning": 75,
    "Data Science": 70,
    "Communication": 85,
    "Problem Solving": 90
  },
  interests: ["AI", "Data Science", "Software Development"],
  resume_filename: "demo_resume.pdf"
};

let availableSkills = [
  { id: 1, name: "Python", category: "technical" },
  { id: 2, name: "Java", category: "technical" },
  { id: 3, name: "C++", category: "technical" },
  { id: 4, name: "SQL", category: "technical" },
  { id: 5, name: "Machine Learning", category: "technical" },
  { id: 6, name: "Data Science", category: "technical" },
  { id: 7, name: "Cloud Computing", category: "technical" },
  { id: 8, name: "Cyber Security", category: "technical" },
  { id: 9, name: "Web Development", category: "technical" },
  { id: 10, name: "HTML/CSS", category: "technical" },
  { id: 11, name: "JavaScript", category: "technical" },
  { id: 12, name: "React", category: "technical" },
  { id: 13, name: "Docker", category: "technical" },
  { id: 14, name: "Git", category: "technical" },
  { id: 15, name: "AWS", category: "technical" },
  { id: 16, name: "Deep Learning", category: "technical" },
  { id: 17, name: "TensorFlow", category: "technical" },
  { id: 18, name: "Tableau", category: "technical" },
  { id: 19, name: "UI/UX Design", category: "technical" },
  { id: 20, name: "Figma", category: "technical" },
  { id: 21, name: "System Design", category: "technical" },
  { id: 22, name: "Statistics", category: "technical" },
  { id: 23, name: "Communication", category: "soft" },
  { id: 24, name: "Leadership", category: "soft" },
  { id: 25, name: "Teamwork", category: "soft" },
  { id: 26, name: "Problem Solving", category: "soft" },
  { id: 27, name: "Creativity", category: "soft" }
];

let adminUsers: User[] = [
  { id: 1, name: "Demo Administrator", email: "admin@careerai.com", role: "admin", created_at: "2026-01-10T10:00:00Z" },
  { id: 2, name: "Jane Doe", email: "jane@example.com", role: "user", created_at: "2026-03-15T14:30:00Z" },
  { id: 3, name: "John Smith", email: "john@example.com", role: "user", created_at: "2026-04-01T09:15:00Z" }
];

let adminCareers = [
  { id: 1, name: "Data Scientist", description: "Formulate, design and build new machine learning models to solve complex business problems.", salary_range: "₹12 - ₹28 LPA", growth_rate: "36% (Very High)", required_skills: "Python, SQL, Machine Learning, Data Science, Statistics" },
  { id: 2, name: "Machine Learning Engineer", description: "Design, deploy and scale machine learning models in production systems.", salary_range: "₹15 - ₹35 LPA", growth_rate: "40% (Extreme)", required_skills: "Python, Machine Learning, Deep Learning, Docker, AWS" },
  { id: 3, name: "Full Stack Developer", description: "Construct both frontend user interfaces and backend database engines.", salary_range: "₹8 - ₹18 LPA", growth_rate: "24% (High)", required_skills: "JavaScript, React, SQL, Web Development" },
  { id: 4, name: "Cloud Solutions Architect", description: "Design and implement cloud infrastructure setups, networking, and security frameworks.", salary_range: "₹18 - ₹40 LPA", growth_rate: "30% (High)", required_skills: "Cloud Computing, AWS, System Design" }
];

let adminCourses = [
  { id: 1, name: "Machine Learning Specialization by Andrew Ng", provider: "Coursera", category: "Machine Learning", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
  { id: 2, name: "Applied Data Science with Python Specialization", provider: "Coursera", category: "Data Science", url: "https://www.coursera.org/specializations/data-science-python" },
  { id: 3, name: "Deep Learning Specialization by DeepLearning.AI", provider: "Coursera", category: "Deep Learning", url: "https://www.coursera.org/specializations/deep-learning" },
  { id: 4, name: "AWS Certified Solutions Architect - Associate", provider: "Udemy", category: "Cloud Computing", url: "https://www.udemy.com" },
  { id: 5, name: "Docker & Kubernetes: The Practical Guide", provider: "Udemy", category: "Docker", url: "https://www.udemy.com" },
  { id: 6, name: "Full Stack Open 2026", provider: "University of Helsinki", category: "Web Development", url: "https://fullstackopen.com" }
];

// Helper to generate dynamic career recommendations based on userProfile skills
function getRecommendations() {
  const userSkills = userProfile.skills || {};
  
  return adminCareers.map((career) => {
    // Parse required skills
    const reqList = career.required_skills.split(',').map(s => s.trim());
    
    // Calculate a dynamic match score based on user ratings of required skills
    let totalScore = 0;
    let count = 0;
    
    reqList.forEach(reqSkill => {
      const match = Object.keys(userSkills).find(us => us.toLowerCase() === reqSkill.toLowerCase());
      if (match) {
        totalScore += userSkills[match];
      } else {
        totalScore += 20; // default minimum score if skill not in profile
      }
      count++;
    });
    
    const calculatedScore = count > 0 ? Math.round(totalScore / count) : 60;
    const match_score = Math.max(50, Math.min(99, calculatedScore));
    
    // Construct gap analysis
    const gapReport = reqList.map(reqSkill => {
      const match = Object.keys(userSkills).find(us => us.toLowerCase() === reqSkill.toLowerCase());
      const user_score = match ? userSkills[match] : 0;
      return {
        skill_name: reqSkill,
        user_score: user_score,
        status: user_score >= 60 ? "available" : "missing"
      };
    });
    
    // Filter matching courses
    const matchingCourses = adminCourses.filter(course => 
      reqList.some(reqSkill => course.category.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(course.category.toLowerCase()))
    ).slice(0, 3);
    
    // Fallback courses if none matched
    const courses = matchingCourses.length > 0 ? matchingCourses : adminCourses.slice(0, 2);
    
    return {
      id: career.id,
      career_name: career.name,
      match_score,
      salary_range: career.salary_range,
      growth_rate: career.growth_rate,
      description: career.description,
      gap_analysis: {
        report: gapReport
      },
      courses: courses.map(c => ({
        name: c.name,
        provider: c.provider,
        category: c.category,
        url: c.url
      })),
      roadmap: {
        title: `${career.name} Upskilling & Certification Plan`,
        plan_30: {
          title: "Phase 1: Foundation Building (Day 1 - 30)",
          milestones: [
            `Study primary foundations of ${reqList.slice(0, 2).join(" & ") || "core topics"}.`,
            "Complete theoretical courses and syntax fundamentals.",
            "Complete 3 hands-on playground code exercises."
          ]
        },
        plan_60: {
          title: "Phase 2: Intermediate Application (Day 31 - 60)",
          milestones: [
            `Tackle intermediate concepts like ${reqList[2] || "design patterns"}.`,
            "Integrate databases and build basic pipelines.",
            "Publish first personal open source code repository."
          ]
        },
        plan_90: {
          title: "Phase 3: Deep Customization & Interview Prep (Day 61 - 90)",
          milestones: [
            `Focus on system deployment, scaling, and ${reqList[3] || "advanced MLOps"}.`,
            "Optimize resume and update LinkedIn / portfolio project showcase.",
            "Run 3 mock interview iterations and start applications."
          ]
        }
      }
    };
  }).sort((a, b) => b.match_score - a.match_score);
}

// ----------------------------------------------------
// Global Fetch Interception Setup
// ----------------------------------------------------

const originalFetch = window.fetch;

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = input.toString();

  // Only intercept requests directed to our backend endpoint
  if (urlString.includes('http://localhost:5000/api')) {
    // Extract path, e.g. /api/auth/me, /api/profile
    const path = urlString.split('http://localhost:5000/api')[1] || '';
    const cleanPath = path.split('?')[0]; // strip query parameters
    const method = init?.method?.toUpperCase() || 'GET';
    let bodyData: any = {};
    
    if (init?.body) {
      try {
        if (init.body instanceof FormData) {
          // Keep bodyData empty for FormData, handle separately
        } else {
          bodyData = JSON.parse(init.body as string);
        }
      } catch (e) {
        // Body was not JSON
      }
    }

    console.log(`[MockFetch Intercept] ${method} ${cleanPath}`, bodyData);

    // Simulate network delay of 50ms for smooth transitions
    await new Promise(resolve => setTimeout(resolve, 50));

    // --- 1. AUTH ROUTES ---
    if (cleanPath === '/auth/me') {
      return new Response(JSON.stringify(currentUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cleanPath === '/auth/login' || cleanPath === '/auth/register') {
      if (bodyData.email) {
        currentUser.email = bodyData.email;
        currentUser.name = bodyData.name || bodyData.email.split('@')[0];
        currentUser.role = bodyData.email.startsWith('admin') ? 'admin' : 'user';
      }
      return new Response(JSON.stringify({
        token: "mock-admin-token-xyz",
        user: currentUser
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cleanPath === '/auth/forgot-password') {
      return new Response(JSON.stringify({ msg: "Reset password link dispatched to email." }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- 2. PROFILE ROUTES ---
    if (cleanPath === '/profile/skills') {
      return new Response(JSON.stringify(availableSkills), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cleanPath === '/profile/') {
      if (method === 'GET') {
        return new Response(JSON.stringify(userProfile), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST' || method === 'PUT') {
        // Merge request body with in-memory profile
        userProfile = {
          ...userProfile,
          ...bodyData,
          skills: bodyData.skills ? { ...userProfile.skills, ...bodyData.skills } : userProfile.skills
        };
        return new Response(JSON.stringify({ msg: "Profile saved successfully.", profile: userProfile }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // --- 3. RECOMMENDATION ROUTES ---
    if (cleanPath === '/recommendations/') {
      const recs = getRecommendations();
      return new Response(JSON.stringify({ recommendations: recs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- 4. RESUME UPLOAD ---
    if (cleanPath === '/resume/upload') {
      userProfile.resume_filename = "uploaded_resume.pdf";
      return new Response(JSON.stringify({
        msg: "Resume uploaded successfully",
        analysis: {
          ats_score: 84,
          sections_detected: {
            education: true,
            experience: true,
            projects: true
          },
          skills_found: Object.keys(userProfile.skills),
          missing_keywords: ["Deep Learning", "Docker", "AWS Specialization", "Kubernetes", "System Design"],
          suggestions: [
            "Inject metrics into project descriptions (e.g. 'Improved dataset pipeline speeds by 40%').",
            "Embed more cloud-related terminology matching industry frameworks (AWS / Kubernetes).",
            "Format section titles clearly (Education, Professional Experience) without using custom visual tables."
          ]
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- 5. CHATBOT ASSISTANT ---
    if (cleanPath === '/chatbot/message') {
      const userMessage = bodyData.message?.toLowerCase() || '';
      let reply = "";
      
      if (userMessage.includes("career") || userMessage.includes("suit") || userMessage.includes("path")) {
        reply = `Based on your skill matrix, your top recommended career path is Data Scientist with a 92% match! Your scores in Python (90%) and Problem Solving (90%) are strong, but adding certifications in Cloud Computing could push you closer to a Machine Learning Engineer role.`;
      } else if (userMessage.includes("skill") || userMessage.includes("learn") || userMessage.includes("roadmap")) {
        reply = `To bridge your skill gaps effectively, I recommend focusing on containerization tools like Docker and orchestrators like Kubernetes. You can review your step-by-step 30-60-90 day learning roadmap directly in the dashboard menu!`;
      } else if (userMessage.includes("improve") || userMessage.includes("profile") || userMessage.includes("ats")) {
        reply = `You can improve your ATS score (currently 84%) by uploading your resume PDF to our Resume Analyzer, which checks for missing industry keywords and formatting compatibility. Make sure your Python and SQL experience highlights business impact!`;
      } else {
        reply = `That is a great question! As your CareerAI assistant, I'm here to guide your upskilling journey. Try assessing your skills via the Skill Assessment tab, or updating your targets on the Profile page to compute updated recommendations!`;
      }

      return new Response(JSON.stringify({ response: reply }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- 6. ADMIN DASHBOARD DATA ---
    if (cleanPath === '/admin/stats') {
      return new Response(JSON.stringify({
        stats: {
          total_users: adminUsers.length,
          total_careers: adminCareers.length,
          total_skills: availableSkills.length,
          total_courses: adminCourses.length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Admin Users CRUD
    if (cleanPath === '/admin/users') {
      return new Response(JSON.stringify(adminUsers), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (cleanPath.startsWith('/admin/users/')) {
      const parts = cleanPath.split('/');
      const userId = parseInt(parts[3] || '');
      
      if (parts[4] === 'role' && method === 'PUT') {
        const target = adminUsers.find(u => u.id === userId);
        if (target) {
          target.role = bodyData.role;
          if (currentUser.id === userId) {
            currentUser.role = bodyData.role;
          }
        }
        return new Response(JSON.stringify({ msg: "User role mutated successfully" }), { status: 200 });
      }
      
      if (method === 'DELETE') {
        adminUsers = adminUsers.filter(u => u.id !== userId);
        return new Response(JSON.stringify({ msg: "User deleted" }), { status: 200 });
      }
    }

    // Admin Careers CRUD
    if (cleanPath === '/admin/careers') {
      if (method === 'GET') {
        return new Response(JSON.stringify(adminCareers), { status: 200 });
      }
      if (method === 'POST') {
        const newCareer = {
          id: adminCareers.length + 1,
          ...bodyData
        };
        adminCareers.push(newCareer);
        return new Response(JSON.stringify(newCareer), { status: 201 });
      }
    }
    if (cleanPath.startsWith('/admin/careers/')) {
      const careerId = parseInt(cleanPath.split('/')[3] || '');
      if (method === 'PUT') {
        adminCareers = adminCareers.map(c => c.id === careerId ? { ...c, ...bodyData } : c);
        return new Response(JSON.stringify({ msg: "Career updated" }), { status: 200 });
      }
      if (method === 'DELETE') {
        adminCareers = adminCareers.filter(c => c.id !== careerId);
        return new Response(JSON.stringify({ msg: "Career deleted" }), { status: 200 });
      }
    }

    // Admin Skills CRUD
    if (cleanPath === '/admin/skills') {
      if (method === 'GET') {
        return new Response(JSON.stringify(availableSkills), { status: 200 });
      }
      if (method === 'POST') {
        const newSkill = {
          id: availableSkills.length + 1,
          ...bodyData
        };
        availableSkills.push(newSkill);
        return new Response(JSON.stringify(newSkill), { status: 201 });
      }
    }
    if (cleanPath.startsWith('/admin/skills/')) {
      const skillId = parseInt(cleanPath.split('/')[3] || '');
      if (method === 'PUT') {
        availableSkills = availableSkills.map(s => s.id === skillId ? { ...s, ...bodyData } : s);
        return new Response(JSON.stringify({ msg: "Skill updated" }), { status: 200 });
      }
      if (method === 'DELETE') {
        availableSkills = availableSkills.filter(s => s.id !== skillId);
        return new Response(JSON.stringify({ msg: "Skill deleted" }), { status: 200 });
      }
    }

    // Admin Courses CRUD
    if (cleanPath === '/admin/courses') {
      if (method === 'GET') {
        return new Response(JSON.stringify(adminCourses), { status: 200 });
      }
      if (method === 'POST') {
        const newCourse = {
          id: adminCourses.length + 1,
          ...bodyData
        };
        adminCourses.push(newCourse);
        return new Response(JSON.stringify(newCourse), { status: 201 });
      }
    }
    if (cleanPath.startsWith('/admin/courses/')) {
      const courseId = parseInt(cleanPath.split('/')[3] || '');
      if (method === 'PUT') {
        adminCourses = adminCourses.map(c => c.id === courseId ? { ...c, ...bodyData } : c);
        return new Response(JSON.stringify({ msg: "Course updated" }), { status: 200 });
      }
      if (method === 'DELETE') {
        adminCourses = adminCourses.filter(c => c.id !== courseId);
        return new Response(JSON.stringify({ msg: "Course deleted" }), { status: 200 });
      }
    }

    // Catch-all response for undefined mock api paths
    return new Response(JSON.stringify({ msg: "Endpoint matched as mock backend" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fallback to original fetch for all standard resources (assets, images, scripts)
  return originalFetch(input, init);
};

// ----------------------------------------------------
// Global window.open Overwrite for PDF downloads
// ----------------------------------------------------
const originalOpen = window.open;

window.open = function(url: string | URL | undefined, target?: string, features?: string): Window | null {
  if (url && url.toString().includes('/api/recommendations/download-pdf')) {
    // Generate a mock PDF download inside the browser using a Blob
    const content = `======================================================
CAREERAI NAVIGATOR - PROTOTYPE REPORT METRICS
======================================================
Generated On: ${new Date().toLocaleString()}
User: ${currentUser.name} (${currentUser.email})

PROFILE METADATA:
----------------------------------------
Degree: ${userProfile.degree}
Department: ${userProfile.department}
University: ${userProfile.university}
CGPA: ${userProfile.cgpa} / 10.0

CORE TECHNICAL & SOFT SKILLS:
----------------------------------------
${Object.entries(userProfile.skills).map(([name, rating]) => `- ${name}: ${rating}%`).join('\n')}

CAREER MATCH RECOMMENDATIONS PROJECTIONS:
----------------------------------------
${getRecommendations().map((rec, idx) => `Rank #${idx + 1}: ${rec.career_name} (${rec.match_score}% Match)
- Salary Range: ${rec.salary_range}
- Job Growth: ${rec.growth_rate}
- Description: ${rec.description}
- Target Skill Gaps identified:
  ${rec.gap_analysis.report.map(g => `* ${g.skill_name}: ${g.user_score}% (${g.status.toUpperCase()})`).join('\n  ')}
`).join('\n')}
======================================================
END OF PROTOTYPE REPORT
======================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const downloadURL = URL.createObjectURL(blob);
    
    // Trigger download instead of opening a blank page
    const link = document.createElement("a");
    link.href = downloadURL;
    link.download = `CareerAI_Navigator_Report_${currentUser.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return null;
  }
  
  return originalOpen(url, target, features);
};

export const updateMockRole = (role: 'admin' | 'user') => {
  currentUser.role = role;
  const target = adminUsers.find(u => u.id === currentUser.id);
  if (target) target.role = role;
};

export const getMockUser = () => currentUser;

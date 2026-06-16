import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { 
  User, 
  GraduationCap, 
  Code, 
  Heart, 
  Target, 
  Save, 
  Plus, 
  X, 
  Sparkles,
  Globe,
  Award,
  Briefcase
} from 'lucide-react';

const TECHNICAL_SKILLS = [
  "Python", "Java", "C++", "SQL", "Machine Learning", "Data Science", 
  "Cloud Computing", "Cyber Security", "Web Development", "HTML/CSS", 
  "JavaScript", "React", "Docker", "Git", "AWS", "Deep Learning", 
  "TensorFlow", "Tableau", "UI/UX Design", "Figma", "System Design", "Statistics"
];

const SOFT_SKILLS = [
  "Communication", "Leadership", "Teamwork", "Problem Solving", "Creativity"
];

const INTERESTS = [
  "AI", "Data Science", "Software Development", "Marketing", "Finance", 
  "Healthcare", "Design"
];

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA", "MBA", "Ph.D"];

interface Certification {
  name: string;
  authority: string;
  year: string;
}

interface Project {
  name: string;
  technologies: string;
  description: string;
}

const Profile: React.FC = () => {
  const { token } = useAuth();
  
  // Profile Fields State
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [university, setUniversity] = useState('');
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [careerGoals, setCareerGoals] = useState('');
  
  // Social/Professional Profiles State
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  
  // Certifications & Projects State
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Selected Skills State (Name to Score mapping)
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Dropdown options
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const [softDropdownOpen, setSoftDropdownOpen] = useState(false);
  
  // Dynamic item inputs
  const [newCert, setNewCert] = useState<Certification>({ name: '', authority: '', year: '' });
  const [newProj, setNewProj] = useState<Project>({ name: '', technologies: '', description: '' });
  
  // Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch current profile data
    const fetchProfile = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/profile/`);
        if (res.ok) {
          const data = await res.json();
          setAge(data.age || '');
          setGender(data.gender || '');
          setLocation(data.location || '');
          setDegree(data.degree || '');
          setDepartment(data.department || '');
          setUniversity(data.university || '');
          setCgpa(data.cgpa || '');
          setCareerGoals(data.career_goals || '');
          setSelectedSkills(data.skills || {});
          setSelectedInterests(data.interests || []);
          
          setGithub(data.github || '');
          setLinkedin(data.linkedin || '');
          setPortfolio(data.portfolio || '');
          
          // Safely parse JSON strings or arrays
          let parsedCerts: Certification[] = [];
          if (data.certifications_json) {
            parsedCerts = typeof data.certifications_json === 'string'
              ? JSON.parse(data.certifications_json)
              : data.certifications_json;
          }
          setCertifications(parsedCerts || []);
          
          let parsedProjs: Project[] = [];
          if (data.projects_json) {
            parsedProjs = typeof data.projects_json === 'string'
              ? JSON.parse(data.projects_json)
              : data.projects_json;
          }
          setProjects(parsedProjs || []);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleAddSkill = (skill: string) => {
    if (!(skill in selectedSkills)) {
      setSelectedSkills(prev => ({ ...prev, [skill]: 70 })); // Default score 70%
    }
    setTechDropdownOpen(false);
    setSoftDropdownOpen(false);
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = { ...selectedSkills };
    delete updated[skill];
    setSelectedSkills(updated);
  };

  const handleSkillScoreChange = (skill: string, score: number) => {
    setSelectedSkills(prev => ({ ...prev, [skill]: score }));
  };

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Certifications list manipulation
  const addCertification = () => {
    if (!newCert.name.trim() || !newCert.authority.trim()) {
      setAlert({ type: 'error', message: 'Certification Name and Authority are required.' });
      return;
    }
    setCertifications(prev => [...prev, newCert]);
    setNewCert({ name: '', authority: '', year: '' });
    setAlert(null);
  };

  const removeCertification = (idx: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx));
  };

  // Projects list manipulation
  const addProject = () => {
    if (!newProj.name.trim() || !newProj.description.trim()) {
      setAlert({ type: 'error', message: 'Project Name and Description are required.' });
      return;
    }
    setProjects(prev => [...prev, newProj]);
    setNewProj({ name: '', technologies: '', description: '' });
    setAlert(null);
  };

  const removeProject = (idx: number) => {
    setProjects(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert(null);

    // Hardened client-side validations
    if (age !== '') {
      const numAge = Number(age);
      if (isNaN(numAge) || numAge < 15 || numAge > 100) {
        setAlert({ type: 'error', message: 'Age must be a valid number between 15 and 100.' });
        setIsSaving(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (cgpa !== '') {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        setAlert({ type: 'error', message: 'CGPA must be a valid number between 0.0 and 10.0.' });
        setIsSaving(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Social URLs Validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (github && !urlPattern.test(github)) {
      setAlert({ type: 'error', message: 'GitHub link must be a valid URL (e.g. https://github.com/username).' });
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (linkedin && !urlPattern.test(linkedin)) {
      setAlert({ type: 'error', message: 'LinkedIn link must be a valid URL (e.g. https://linkedin.com/in/username).' });
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (portfolio && !urlPattern.test(portfolio)) {
      setAlert({ type: 'error', message: 'Portfolio link must be a valid URL.' });
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      age: age === '' ? null : Number(age),
      gender,
      location,
      degree,
      department,
      university,
      cgpa: cgpa === '' ? null : Number(cgpa),
      career_goals: careerGoals,
      skills: selectedSkills,
      interests: selectedInterests,
      github,
      linkedin,
      portfolio,
      certifications_json: certifications,
      projects_json: projects
    };

    try {
      const res = await apiFetch(`${API_URL}/api/profile/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.msg || 'Failed to save profile details.');
      }

      setAlert({ type: 'success', message: 'Your career profile and skill vector have been analyzed and updated!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Error occurred while saving profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Academic & Skill Profile</h1>
        <p className="text-sm text-slate-650 dark:text-slate-400 mt-1">
          Complete your profile details to seed our AI Career Recommendation models
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed border ${
          alert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Personal & Academic */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: Personal Info */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <User className="w-4.5 h-4.5 text-primary" />
              <span>Personal Details</span>
            </h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Age</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Location</label>
                <input
                  type="text"
                  placeholder="Bangalore, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <GraduationCap className="w-4.5 h-4.5 text-primary" />
              <span>Academic Details</span>
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Degree</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="">Select</option>
                    {DEGREES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">CGPA / GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="8.5"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Department / Major</label>
                <input
                  type="text"
                  placeholder="Computer Science Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">University</label>
                <input
                  type="text"
                  placeholder="Anna University / IIT"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2.5: Professional Linkages */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Globe className="w-4.5 h-4.5 text-primary" />
              <span>Professional Linkages</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase flex items-center space-x-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase flex items-center space-x-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                  <span>GitHub Link</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Portfolio website</span>
                </label>
                <input
                  type="text"
                  placeholder="https://myportfolio.com"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Skills & Interests & Career Goals */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 3: Skill Rating System */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200">
                <Code className="w-4.5 h-4.5 text-accent" />
                <span>Technical & Soft Skills Assessment</span>
              </h2>
              <div className="flex space-x-2">
                
                {/* Tech Dropdown Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setTechDropdownOpen(!techDropdownOpen);
                      setSoftDropdownOpen(false);
                    }}
                    className="btn-secondary text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tech Skill</span>
                  </button>
                  {techDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card shadow-2xl p-2 z-55 max-h-60 overflow-y-auto">
                      {TECHNICAL_SKILLS.filter(s => !(s in selectedSkills)).map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleAddSkill(skill)}
                          className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-750 dark:text-slate-350 transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Soft Dropdown Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSoftDropdownOpen(!softDropdownOpen);
                      setTechDropdownOpen(false);
                    }}
                    className="btn-secondary text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Soft Skill</span>
                  </button>
                  {softDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card shadow-2xl p-2 z-55 max-h-60 overflow-y-auto">
                      {SOFT_SKILLS.filter(s => !(s in selectedSkills)).map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleAddSkill(skill)}
                          className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-750 dark:text-slate-350 transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Selected Skills List */}
            {Object.keys(selectedSkills).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600 space-y-2 bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                <Sparkles className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
                <p>No skills added yet. Use the buttons above to select and score your skills.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedSkills).map(([skillName, score]) => {
                    const isSoft = SOFT_SKILLS.includes(skillName);
                    return (
                      <div key={skillName} className="p-3.5 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/80 rounded-xl space-y-2.5 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skillName)}
                          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center justify-between pr-6">
                          <span className="text-xs font-bold">{skillName}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isSoft 
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                              : 'bg-primary/10 text-primary dark:text-primary-light'
                          }`}>
                            {score}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={score}
                          onChange={(e) => handleSkillScoreChange(skillName, Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3.2: Certifications */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              <span>Certifications & Credentials</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Credential Name (e.g. AWS Solutions Architect)"
                value={newCert.name}
                onChange={(e) => setNewCert(prev => ({ ...prev, name: e.target.value }))}
                className="form-input text-xs py-2 px-3"
              />
              <input
                type="text"
                placeholder="Issuing Authority (e.g. Amazon Web Services)"
                value={newCert.authority}
                onChange={(e) => setNewCert(prev => ({ ...prev, authority: e.target.value }))}
                className="form-input text-xs py-2 px-3"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Year (e.g. 2025)"
                  value={newCert.year}
                  onChange={(e) => setNewCert(prev => ({ ...prev, year: e.target.value }))}
                  className="form-input text-xs py-2 px-3"
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="btn-primary py-2 px-4 rounded-xl flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {certifications.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-750 dark:text-slate-300 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-750 dark:text-slate-300 uppercase">Authority</th>
                      <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-750 dark:text-slate-300 uppercase">Year</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {certifications.map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="px-4 py-2.5 text-slate-650 dark:text-slate-350">{c.authority}</td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.year || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeCertification(i)}
                            className="text-rose-500 hover:text-rose-650"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3.4: Featured Projects */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Briefcase className="w-4.5 h-4.5 text-primary" />
              <span>Academic & Side Projects</span>
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Project Name (e.g. Distributed KV Store)"
                  value={newProj.name}
                  onChange={(e) => setNewProj(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs py-2 px-3"
                />
                <input
                  type="text"
                  placeholder="Technologies Used (e.g. Go, Raft, gRPC)"
                  value={newProj.technologies}
                  onChange={(e) => setNewProj(prev => ({ ...prev, technologies: e.target.value }))}
                  className="form-input text-xs py-2 px-3"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Short description of achievements and design decisions"
                  value={newProj.description}
                  onChange={(e) => setNewProj(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input text-xs py-2 px-3 flex-1"
                />
                <button
                  type="button"
                  onClick={addProject}
                  className="btn-primary py-2 px-4 rounded-xl flex items-center justify-center"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="mt-3 space-y-2">
                {projects.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                    <button
                      type="button"
                      onClick={() => removeProject(i)}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <h4 className="font-bold text-xs pr-6 text-slate-900 dark:text-white">{p.name}</h4>
                    <span className="inline-block text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300 mt-1">{p.technologies}</span>
                    <p className="text-[10px] text-slate-650 dark:text-slate-400 mt-1.5 leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Interests */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Heart className="w-4.5 h-4.5 text-rose-500" />
              <span>Interests & Domains</span>
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map(interest => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/15'
                        : 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Career Goals */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Target className="w-4.5 h-4.5 text-emerald-500" />
              <span>Career Goals & Aspirations</span>
            </h2>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase">Aspiration Statement</label>
              <textarea
                rows={4}
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                placeholder="Example: I want to become a Lead Data Scientist at a tech firm. I am passionate about artificial intelligence, data engineering, and optimizing neural networks."
                className="form-input text-xs resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center space-x-2 shadow-xl cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save & Analyze Profile'}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};

export default Profile;

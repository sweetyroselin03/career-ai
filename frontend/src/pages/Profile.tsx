import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { User, GraduationCap, Code, Heart, Target, Save, Plus, X, Sparkles } from 'lucide-react';

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
  
  // Selected Skills State (Name to Score mapping)
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Dropdown options
  // Dropdown options
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const [softDropdownOpen, setSoftDropdownOpen] = useState(false);
  
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert(null);

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
      interests: selectedInterests
    };

    try {
      const res = await apiFetch(`${API_URL}/api/profile/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to save profile.');
      }

      setAlert({ type: 'success', message: 'Profile and Skill Analysis successfully saved!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Error saving profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Academic & Skill Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              <User className="w-4.5 h-4.5 text-primary" />
              <span>Personal Details</span>
            </h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
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
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              <GraduationCap className="w-4.5 h-4.5 text-primary" />
              <span>Academic Details</span>
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Degree</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">CGPA / GPA</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Department / Major</label>
                <input
                  type="text"
                  placeholder="Computer Science Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">University</label>
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

        </div>

        {/* Right Side: Skills & Interests & Career Goals */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 3: Skill Rating System */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-700 dark:text-slate-350">
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
                          className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-750 dark:text-slate-300 transition-colors"
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
                          className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-750 dark:text-slate-300 transition-colors"
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
              <div className="text-center py-8 text-xs text-slate-400 space-y-2 bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
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

          {/* Section 4: Interests */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
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
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/15'
                        : 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-white dark:hover:bg-slate-900'
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
            <h2 className="flex items-center space-x-2 font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Target className="w-4.5 h-4.5 text-emerald-500" />
              <span>Career Goals & Aspirations</span>
            </h2>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Aspiration Statement</label>
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
              className="btn-primary flex items-center space-x-2 shadow-xl"
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

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  BookOpen, 
  School, 
  Percent, 
  Search, 
  Check, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Common/Toast';

const DEFAULT_SKILLS = [
  { name: 'Python', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'SQL', category: 'Database' },
  { name: 'Machine Learning', category: 'Data Science' },
  { name: 'Data Science', category: 'Analytics' },
  { name: 'React', category: 'Web Development' },
  { name: 'Node.js', category: 'Web Development' },
  { name: 'Cloud Computing', category: 'Infrastructure' },
  { name: 'Cyber Security', category: 'Security' }
];

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Multi-step index: 0, 1, 2, 3
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [currentStatus, setCurrentStatus] = useState('student');

  const [qualification, setQualification] = useState('B.Tech');
  const [degree, setDegree] = useState('');
  const [university, setUniversity] = useState('');
  const [cgpa, setCgpa] = useState('');

  const [searchSkillQuery, setSearchSkillQuery] = useState('');
  const [availableSkills, setAvailableSkills] = useState<any[]>(DEFAULT_SKILLS);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Styling utility constants to guarantee pixel-perfect spacing, heights, and padding
  const inputClass = "w-full h-[56px] px-[16px] pl-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px] bg-white text-slate-900";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider block";

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile/skills`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSkills(prev => {
            const merged = [...prev];
            data.forEach((skill: any) => {
              if (!merged.some(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
                merged.push({ name: skill.name, category: skill.category || 'General' });
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load skills:', err);
      }
    };
    fetchSkills();
  }, []);

  // Password Strength Calculations
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    if (!password) return { label: 'None', color: 'bg-slate-700' };
    if (score <= 1) return { label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { label: 'Medium', color: 'bg-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const strengthScore = getPasswordStrength();
  const strengthInfo = getStrengthLabel(strengthScore);

  // Handlers for validation
  const validateStep0 = () => {
    if (!name.trim()) return 'Name is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Enter a valid email address.';
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (mobile && !phoneRegex.test(mobile)) return 'Enter a valid phone number.';
    return null;
  };

  const validateStep1 = () => {
    if (!university.trim()) return 'University name is required.';
    if (cgpa) {
      const gpa = parseFloat(cgpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 10) return 'CGPA must be a decimal between 0 and 10.';
    }
    return null;
  };

  const validateStep2 = () => {
    if (selectedSkills.length === 0) return 'Select at least one skill.';
    return null;
  };

  const handleNext = () => {
    setToast(null);
    if (step === 0) {
      const err = validateStep0();
      if (err) { setToast({ message: err, type: 'error' }); return; }
    }
    if (step === 1) {
      const err = validateStep1();
      if (err) { setToast({ message: err, type: 'error' }); return; }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) { setToast({ message: err, type: 'error' }); return; }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setToast(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (strengthScore < 2) {
      setToast({ message: 'Password is too weak. Must include multiple character classes.', type: 'error' });
      return;
    }

    if (!agreeTerms) {
      setToast({ message: 'You must agree to the Terms of Service.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit Core User Registration
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          mobile,
          qualification,
          currentStatus
        })
      });

      if (!regRes.ok) {
        const errData = await regRes.json();
        throw new Error(errData.msg || 'Registration failed');
      }
      const regData = await regRes.json();

      // 2. Submit Additional Profile Details (Skills, Interests, Uni, CGPA)
      const skillsPayload: { [key: string]: number } = {};
      selectedSkills.forEach(s => {
        skillsPayload[s] = 60; // Initial default score
      });

      const profRes = await fetch(`${API_URL}/api/profile/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${regData.access_token}`
        },
        body: JSON.stringify({
          degree: qualification,
          department: degree,
          university,
          cgpa: cgpa ? parseFloat(cgpa) : null,
          skills: skillsPayload,
          interests: selectedInterests
        })
      });

      if (!profRes.ok) {
        const errData = await profRes.json();
        throw new Error(errData.msg || 'Failed to complete profile settings.');
      }

      setToast({ message: 'Account registered successfully!', type: 'success' });
      login(regData.access_token, regData.user);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err: any) {
      setToast({ message: err.message || 'Error occurred during registration.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;

    if (selectedSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSearchSkillQuery('');
      return;
    }

    const updated = [...selectedSkills, trimmed];
    setSelectedSkills(updated);

    if (!availableSkills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setAvailableSkills(prev => [...prev, { name: trimmed, category: 'Custom' }]);
    }

    setSearchSkillQuery('');
  };

  const handleRemoveSkill = (skillName: string) => {
    const updated = selectedSkills.filter(s => s !== skillName);
    setSelectedSkills(updated);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchSkillQuery.trim();
      if (!trimmed) return;

      const exactMatch = filteredSkills.find(
        s => s.name.toLowerCase() === trimmed.toLowerCase()
      );

      if (exactMatch) {
        handleAddSkill(exactMatch.name);
      } else if (filteredSkills.length > 0) {
        handleAddSkill(filteredSkills[0].name);
      } else {
        handleAddSkill(trimmed);
      }
    }
  };

  const addInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const removeInterest = (item: string) => {
    setSelectedInterests(prev => prev.filter(x => x !== item));
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchSkillQuery.toLowerCase()) &&
    !selectedSkills.some(s => s.toLowerCase() === skill.name.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans overflow-x-hidden">
      
      {/* Left Column: Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:flex-none lg:w-[45%] bg-slate-50 relative z-10 py-12 w-full">
        <div className="bg-mesh opacity-30 absolute inset-0"></div>

        <motion.div 
          layout
          className="w-full max-w-[560px] bg-white border border-slate-200/85 p-10 shadow-[0_20px_50px_rgba(37,99,235,0.12)] rounded-[24px] relative z-10"
        >
          {/* Step Indicator Header (display:flex; justify-content:space-between; align-items:center) */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-200/60 pb-4">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Step {step + 1} of 4</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {step === 0 && 'Personal Information'}
                {step === 1 && 'Academic Profile'}
                {step === 2 && 'Skills & Interests'}
                {step === 3 && 'Create Account'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((val) => (
                <div 
                  key={val} 
                  className={`w-3 h-3 rounded-full transition-all duration-350 ${
                    val === step ? 'bg-[#2563EB]' : 'bg-[#D1D5DB]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Wizard Form Wrapper */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Step 1: Personal Details */}
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Full Name</label>
                    <div className="relative w-full">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Email Address</label>
                    <div className="relative w-full">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="johndoe@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Mobile Number (Optional)</label>
                    <div className="relative w-full">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="+919876543210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Current Status</label>
                    <div className="relative w-full">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                      <select
                        value={currentStatus}
                        onChange={(e) => setCurrentStatus(e.target.value)}
                        className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                      >
                        <option value="student">Student / Aspirant</option>
                        <option value="professional">Working Professional</option>
                        <option value="unemployed">Career Switcher</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academic Info */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Highest Qualification</label>
                    <div className="relative w-full">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                      >
                        <option value="B.Tech">B.Tech / B.E.</option>
                        <option value="M.Tech">M.Tech / M.E.</option>
                        <option value="BCA">BCA</option>
                        <option value="MCA">MCA</option>
                        <option value="B.Sc">B.Sc / M.Sc</option>
                        <option value="Ph.D">Ph.D</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Branch / Specialization</label>
                    <div className="relative w-full">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Computer Science & Engineering"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>University / Institute</label>
                    <div className="relative w-full">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. IIT Delhi"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>CGPA / Percentage (10 Scale)</label>
                    <div className="relative w-full">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        placeholder="e.g. 8.5"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Skills & Interests */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3 relative">
                    <label className={labelClass}>Search & Add Skills</label>
                    <div className="relative w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Type Python, React, SQL..."
                        value={searchSkillQuery}
                        onChange={(e) => setSearchSkillQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className={inputClass}
                      />
                    </div>
                    
                    {/* Results list Dropdown */}
                    {searchSkillQuery.trim().length > 0 && (
                      <div className="absolute z-20 w-full max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-1 mt-1 shadow-lg text-slate-900 top-[85px]">
                        {filteredSkills.map(sk => (
                          <button
                            key={sk.name}
                            type="button"
                            onClick={() => handleAddSkill(sk.name)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-950 text-xs transition-colors flex items-center justify-between"
                          >
                            <span>{sk.name}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{sk.category}</span>
                          </button>
                        ))}
                        {filteredSkills.length === 0 && (
                          <button
                            type="button"
                            onClick={() => handleAddSkill(searchSkillQuery)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all flex items-center justify-between"
                          >
                            <span>Add "{searchSkillQuery.trim()}" as custom skill</span>
                            <span className="text-[10px] opacity-75">Press Enter</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline validation message */}
                    {selectedSkills.length === 0 && (
                      <p className="text-xs text-rose-500 font-medium">
                        ⚠️ Select at least one skill to continue.
                      </p>
                    )}
                  </div>

                  {/* Selected Skills */}
                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Selected Skills</label>
                    {selectedSkills.length === 0 ? (
                      <p className="text-xs text-slate-550 italic">No skills selected yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map(sk => (
                          <span key={sk} className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
                            <span>{sk}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSkill(sk)} 
                              className="hover:text-rose-550 font-extrabold text-sm ml-1.5 focus:outline-none"
                              title={`Remove ${sk}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Add Areas of Interest</label>
                    <div className="flex gap-3 w-full">
                      <input
                        type="text"
                        placeholder="e.g. AI Research, Web Dev, UI/UX"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                        className="flex-1 h-[56px] px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px] bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        className="h-[56px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center text-[16px]"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedInterests.map(item => (
                        <span key={item} className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold flex items-center space-x-1">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeInterest(item)} className="hover:text-rose-500 font-extrabold ml-1">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Password, strength meter, complete */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Password</label>
                    <div className="relative w-full">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    
                    {/* Strength Meter */}
                    {password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>Password Strength:</span>
                          <span className="text-slate-700">{strengthInfo.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-350 ${strengthInfo.color}`} 
                            style={{ width: `${(strengthScore / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative w-full">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start space-x-3 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary bg-white w-4 h-4 cursor-pointer mt-0.5"
                      />
                      <span>
                        I agree to the{' '}
                        <a href="#" className="text-primary hover:underline hover:text-primary-dark">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-primary hover:underline hover:text-primary-dark">Privacy Policy</a>.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Nav buttons (Button -> Previous Section: 32px) */}
              <div className="flex space-x-3 pt-6 border-t border-slate-200 mt-8">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 h-[56px] flex items-center justify-center gap-[10px] bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all active:scale-98 text-slate-700 font-semibold cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-[16px]">Back</span>
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 2 && selectedSkills.length === 0}
                    className="flex-1 h-[56px] flex items-center justify-center gap-[10px] bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-all active:scale-98 font-bold text-white shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="text-[16px]">Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-[56px] flex items-center justify-center gap-[10px] bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-all active:scale-98 font-bold text-white shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[16px]">Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[16px]">Submit & Finish</span>
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] font-bold hover:underline hover:text-blue-700 transition-colors">
              Log In
            </Link>
          </p>

        </motion.div>
      </div>

      {/* Right Column: Visual Marketing Side (Vertically centered, flex, justify-center, items-center, max-width 420px) */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-gradient-to-tr from-primary to-accent overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        
        <div className="relative z-10 max-w-[420px] w-full text-white text-center p-8 flex flex-col justify-center items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </motion.div>
          
          <div className="flex flex-col gap-3">
            <h2 className="text-[48px] font-bold leading-[1.15] tracking-tight">Map Academic Parameters Against Market Vectors</h2>
            <p className="text-white/80 text-[18px] leading-relaxed">
              Join thousands of students and professionals using vector metrics to compute exact career compatibility matches and address critical gaps in skills.
            </p>
          </div>
          
          <div className="w-full pt-6 border-t border-white/10 flex items-center justify-center gap-8 text-[16px] text-white/90">
            <div className="text-center">
              <p className="font-extrabold text-2xl">95%</p>
              <p className="text-white/70 text-xs mt-0.5">ATS Assessment Accuracy</p>
            </div>
            <div className="w-[1px] h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="font-extrabold text-2xl">12+</p>
              <p className="text-white/70 text-xs mt-0.5">Core Tech Pathways</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;

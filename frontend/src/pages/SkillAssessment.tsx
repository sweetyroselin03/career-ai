import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip
} from 'recharts';
import { 
  CheckCircle, 
  AlertCircle, 
  Save, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Common/Toast';

const SkillAssessment: React.FC = () => {
  const { token, theme } = useAuth();
  const isDark = theme === 'dark';
  
  const [profileSkills, setProfileSkills] = useState<{ [key: string]: number }>({});
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'technical' | 'soft'>('technical');
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Chart Theme settings
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : '#E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#475569';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipTextColor = isDark ? '#F1F5F9' : '#0F172A';

  // Fetch all available skills and user's profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all skills
        const skillsRes = await apiFetch(`${API_URL}/api/profile/skills`);
        let allSkills: any[] = [];
        if (skillsRes.ok) {
          allSkills = await skillsRes.json();
          setAvailableSkills(allSkills);
        }

        // Fetch user profile
        const profileRes = await apiFetch(`${API_URL}/api/profile/`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const userSkills = profileData.skills || {};
          
          // Seed missing skills with 0 so user can rate them
          const seededSkills: { [key: string]: number } = { ...userSkills };
          allSkills.forEach(s => {
            if (seededSkills[s.name] === undefined) {
              seededSkills[s.name] = 0;
            }
          });
          setProfileSkills(seededSkills);
        }
      } catch (err) {
        console.error("Error loading assessment data:", err);
      }
    };
    fetchData();
  }, [token]);

  const handleSliderChange = (skillName: string, value: number) => {
    setProfileSkills(prev => ({
      ...prev,
      [skillName]: value
    }));
  };

  const handleSaveAssessment = async () => {
    setIsSaving(true);
    setToast(null);
    try {
      // Filter out skills with 0 value if we want, or keep all to update vector
      const activeSkillsPayload: { [key: string]: number } = {};
      Object.keys(profileSkills).forEach(k => {
        if (profileSkills[k] > 0) {
          activeSkillsPayload[k] = profileSkills[k];
        }
      });

      const res = await apiFetch(`${API_URL}/api/profile/`, {
        method: 'POST',
        body: JSON.stringify({
          skills: activeSkillsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to save skills assessment.');
      }

      setToast({ message: 'Skill assessment updated and synced with recommendations!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error occurred.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter skills by category
  const categorizedSkills = availableSkills.filter(s => s.category === activeCategory);

  // Compute stats
  const ratedSkills = Object.entries(profileSkills).filter(([_, val]) => val > 0);
  const totalScore = ratedSkills.reduce((sum, [_, val]) => sum + val, 0);
  const averageSkillScore = ratedSkills.length > 0 ? Math.round(totalScore / ratedSkills.length) : 0;

  const strengths = ratedSkills
    .filter(([_, val]) => val >= 70)
    .map(([name]) => name);

  const improvements = ratedSkills
    .filter(([_, val]) => val > 0 && val < 50)
    .map(([name]) => name);

  // Recharts Radar Data: map skills that have > 0 rating
  const radarData = ratedSkills.map(([name, val]) => ({
    subject: name,
    value: val,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Interactive Skill Assessment</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Rate your technical and soft skill metrics to compile your professional profile radar web
          </p>
        </div>
        <button
          onClick={handleSaveAssessment}
          disabled={isSaving}
          className="btn-primary inline-flex items-center space-x-2 text-xs py-2.5 px-5 shadow-lg shadow-primary/25 self-start disabled:opacity-55"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Assessment...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Sync Assessment</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Assessment Sliders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 space-y-6">
            
            {/* Category tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1">
              <button
                onClick={() => setActiveCategory('technical')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${
                  activeCategory === 'technical'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Technical Capabilities
              </button>
              <button
                onClick={() => setActiveCategory('soft')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all ${
                  activeCategory === 'soft'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Soft Skills & Leadership
              </button>
            </div>

            {/* Sliders list */}
            <div className="space-y-5">
              {categorizedSkills.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">No skills registered in database.</p>
              ) : (
                categorizedSkills.map(sk => {
                  const val = profileSkills[sk.name] || 0;
                  return (
                    <div key={sk.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-300">{sk.name}</span>
                        <span className="text-xs font-extrabold text-primary">{val}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={val}
                        onChange={(e) => handleSliderChange(sk.name, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Charts & Analysis metrics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Skill Web visualization */}
          <div className="glass-card p-6 space-y-4 text-center">
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Profile Skill Web
            </h3>
            
            {radarData.length > 2 ? (
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke={gridColor} opacity={0.6} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: labelColor, fontSize: 9, fontWeight: 'semibold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: labelColor, fontSize: 8 }} />
                    <Radar
                      name="User"
                      dataKey="value"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.25}
                    />
                    <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', color: tooltipTextColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-4">
                <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-700 animate-pulse mb-2" />
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Rate at least 3 skills to render radar web analysis chart.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Average Skill Index</span>
              <span className="text-xl font-black text-primary">{averageSkillScore}%</span>
            </div>
          </div>

          {/* Strengths & Improvement panel */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-xs text-slate-750 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
              Capabilities Report
            </h3>

            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Strength Areas (≥70%)</span>
              </h4>
              {strengths.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {strengths.map(s => (
                    <span key={s} className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">None identified yet.</p>
              )}
            </div>

            {/* Improvements */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-500 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Improvement Areas (&lt;50%)</span>
              </h4>
              {improvements.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {improvements.map(s => (
                    <span key={s} className="px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">None identified yet.</p>
              )}
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

export default SkillAssessment;

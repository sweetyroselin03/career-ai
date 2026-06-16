import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  Trophy, 
  Award, 
  CheckSquare, 
  Activity, 
  Sparkles, 
  ArrowRight,
  Globe,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#64748B'];

const Dashboard: React.FC = () => {
  const { user, theme } = useAuth();
  const isDark = theme === 'dark';
  
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Chart Theme settings
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : '#E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#475569';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipTextColor = isDark ? '#F1F5F9' : '#0F172A';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await apiFetch(`${API_URL}/api/profile/`);
        
        let profileData = null;
        if (profileRes.ok) {
          profileData = await profileRes.json();
          setProfile(profileData);
        }
        
        // Fetch recommendations if profile has skills
        if (profileData && Object.keys(profileData.skills || {}).length > 0) {
          const recsRes = await apiFetch(`${API_URL}/api/recommendations/`);
          if (recsRes.ok) {
            const recsData = await recsRes.json();
            setRecommendations(recsData.recommendations || []);
          }
        }
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const userSkills = profile?.skills || {};
  const hasSkills = Object.keys(userSkills).length > 0;

  // Calculate statistics
  const profileCompletion = calculateCompletion(profile);
  const avgSkillScore = hasSkills 
    ? Math.round((Object.values(userSkills) as number[]).reduce((a, b) => a + b, 0) / Object.keys(userSkills).length)
    : 0;

  const topCareerMatch = recommendations.length > 0
    ? `${recommendations[0].career_name} (${recommendations[0].match_score}%)`
    : 'N/A';

  // Real charts data (empty if profile/skills are empty)
  const radarData = hasSkills
    ? Object.entries(userSkills).map(([name, value]) => ({ subject: name, A: value, fullMark: 100 }))
    : [];

  const barData = recommendations.length > 0
    ? recommendations.map(r => ({ name: r.career_name, score: r.match_score }))
    : [];

  const pieData = profile?.interests && profile.interests.length > 0
    ? profile.interests.map((interest: string, idx: number) => ({ name: interest, value: 30 - idx * 2 }))
    : [];

  // Learning progress roadmap (simulated progress steps)
  const lineData = recommendations.length > 0
    ? [
        { name: 'Day 1', progress: 5 },
        { name: 'Day 15', progress: 20 },
        { name: 'Day 30', progress: 45 },
        { name: 'Day 45', progress: 60 },
        { name: 'Day 60', progress: 75 },
        { name: 'Day 90', progress: 95 }
      ]
    : [];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Welcome back, {user?.name}. Here is your career acceleration tracker.
          </p>
        </div>
        {!hasSkills && (
          <Link 
            to="/profile" 
            className="btn-primary inline-flex items-center space-x-2 text-xs py-2 px-4 shadow-md self-start"
          >
            <Sparkles className="w-4 h-4" />
            <span>Assess Your Skills</span>
          </Link>
        )}
      </motion.div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Profile Completion */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Profile Status</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{profileCompletion}%</h3>
            <div className="w-28 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Avg Skill Score */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Skill Score</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{avgSkillScore}%</h3>
            <p className="text-[10px] text-slate-650 dark:text-slate-400 mt-1">Average rating across skills</p>
          </div>
        </div>

        {/* Career Matches */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">Top Career Match</p>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-[150px]">{topCareerMatch}</h3>
            <p className="text-[10px] text-slate-650 dark:text-slate-400 mt-1">Based on AI Recommendation</p>
          </div>
        </div>

        {/* ATS Score */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">ATS Score</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {profile?.ats_score !== null && profile?.ats_score !== undefined ? `${profile.ats_score}%` : 'N/A'}
            </h3>
            <p className="text-[10px] text-slate-650 dark:text-slate-400 mt-1 truncate max-w-[130px]">
              {profile?.resume_filename ? profile.resume_filename : 'No resume uploaded'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart: Skill Profile */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Skill Web Analysis</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
              Skill Profile
            </span>
          </div>
          
          <div className="h-72 w-full">
            {hasSkills ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke={gridColor} opacity={0.6} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: labelColor, fontSize: 10, fontWeight: 'semibold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: labelColor, fontSize: 9 }} />
                  <Radar name="Proficiency" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', color: tooltipTextColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500">
                  <Activity className="w-8 h-8 animate-pulse text-primary" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">No Skill Data Available</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Add your expertise skills in the profile tab to calculate your professional capability web.
                  </p>
                </div>
                <Link to="/profile" className="btn-primary py-2 px-4 text-[10px] inline-flex items-center space-x-1.5 shadow-sm">
                  <span>Go to Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Recommendations mini panel */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Career Matches</h3>
            <Link to="/recommendations" className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec, index) => (
                <div key={rec.career_name} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-200">{rec.career_name}</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{rec.salary_range}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    index === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                  }`}>
                    {rec.match_score}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 space-y-3">
                <Award className="w-10 h-10 text-slate-400 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-200">No Career Matches Yet</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 px-4 leading-normal">
                    Complete your skills and academic form to trigger career recommendation calculations.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/profile" className="btn-primary inline-block text-[10px] py-1.5 px-4">
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid 2: Bar & Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Career Match Distribution */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3">
            Match Percentage Analysis
          </h3>
          <div className="h-56 w-full">
            {recommendations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke={gridColor} opacity={0.6} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: labelColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: labelColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', color: tooltipTextColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="max-w-[180px] space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-900 dark:text-slate-200">No Career Matches</h4>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-normal">
                    Complete your skill assessment to display your career matches comparison chart.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart: Domain Interests */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3">
            Interest Domain Breakdown
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <div className="w-[60%] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                         data={pieData}
                         innerRadius={50}
                         outerRadius={70}
                         paddingAngle={3}
                         dataKey="value"
                      >
                        {pieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', color: tooltipTextColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-[40%] flex flex-col justify-center space-y-2.5">
                  {pieData.slice(0, 4).map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-[10px] font-semibold truncate max-w-[90px] text-slate-700 dark:text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="max-w-[180px] space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-900 dark:text-slate-200">No Interests Selected</h4>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-normal">
                    Specify interests in profile settings to visualize your domain breakdown.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Chart: Learning Progress */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3">
            Roadmap Progress
          </h3>
          <div className="h-56 w-full">
            {recommendations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid stroke={gridColor} opacity={0.6} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: labelColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: labelColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', color: tooltipTextColor, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Line type="monotone" dataKey="progress" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="max-w-[180px] space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-900 dark:text-slate-200">No Active Roadmap</h4>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-normal">
                    Generate recommendations and roadmaps to view upskilling milestone progress.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grid 3: Enterprise Portfolios & ATS Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LinkedIn, GitHub & Portfolio Status Widget */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Professional Portfolios</h3>
            <Link to="/profile" className="text-xs text-primary font-bold hover:underline">Manage Linkages</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* LinkedIn */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center text-center space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-[10px] text-slate-700 dark:text-slate-350 uppercase">LinkedIn</h5>
                {profile?.linkedin ? (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline font-extrabold block truncate max-w-[80px]">
                    Connected
                  </a>
                ) : (
                  <span className="text-xs text-rose-600 font-bold block">Not Linked</span>
                )}
              </div>
            </div>

            {/* GitHub */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center text-center space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900/10 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-[10px] text-slate-700 dark:text-slate-350 uppercase">GitHub</h5>
                {profile?.github ? (
                  <a href={profile.github} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline font-extrabold block truncate max-w-[80px]">
                    Connected
                  </a>
                ) : (
                  <span className="text-xs text-rose-600 font-bold block">Not Linked</span>
                )}
              </div>
            </div>

            {/* Portfolio */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center text-center space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-[10px] text-slate-700 dark:text-slate-350 uppercase">Portfolio</h5>
                {profile?.portfolio ? (
                  <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline font-extrabold block truncate max-w-[80px]">
                    Connected
                  </a>
                ) : (
                  <span className="text-xs text-rose-600 font-bold block">Not Linked</span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ATS Insights & Optimize Widget */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">ATS Resume Optimizer</h3>
            <Link to="/resume" className="text-xs text-primary font-bold hover:underline flex items-center space-x-1">
              <span>Go to Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {profile?.resume_filename ? (
            <div className="flex items-center space-x-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-200 truncate">{profile.resume_filename}</h4>
                <p className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5">ATS Scanner Score: <span className="font-extrabold text-primary">{profile.ats_score || 0}%</span></p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/20 dark:bg-slate-900/10">
              <FileText className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-700" />
              <p className="text-[11px] text-slate-700 dark:text-slate-450">No resume analyzed yet.</p>
              <Link to="/resume" className="btn-secondary py-1 px-3.5 text-[9px] rounded-lg inline-block">
                Upload Resume
              </Link>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

// Helper: Calculate profile completion based on fields
function calculateCompletion(profile: any): number {
  if (!profile) return 0;
  let score = 20; // Base sign up score
  if (profile.age) score += 10;
  if (profile.degree) score += 10;
  if (profile.skills && Object.keys(profile.skills).length > 0) score += 30;
  if (profile.interests && profile.interests.length > 0) score += 10;
  if (profile.resume_filename) score += 10;
  if (profile.github || profile.linkedin || profile.portfolio) score += 10;
  return score;
}

export default Dashboard;

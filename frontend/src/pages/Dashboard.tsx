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
  ArrowRight
} from 'lucide-react';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#64748B'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
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

  // Mock charts fallback if profile is empty
  const radarData = hasSkills
    ? Object.entries(userSkills).map(([name, value]) => ({ subject: name, A: value, fullMark: 100 }))
    : [
        { subject: 'Python', A: 85, fullMark: 100 },
        { subject: 'SQL', A: 70, fullMark: 100 },
        { subject: 'Statistics', A: 65, fullMark: 100 },
        { subject: 'Data Science', A: 75, fullMark: 100 },
        { subject: 'Teamwork', A: 80, fullMark: 100 },
        { subject: 'Communication', A: 90, fullMark: 100 }
      ];

  const barData = recommendations.length > 0
    ? recommendations.map(r => ({ name: r.career_name, score: r.match_score }))
    : [
        { name: 'Data Scientist', score: 88 },
        { name: 'ML Engineer', score: 82 },
        { name: 'Data Analyst', score: 75 },
        { name: 'Software Engineer', score: 70 },
        { name: 'Product Manager', score: 65 }
      ];

  const pieData = profile?.interests && profile.interests.length > 0
    ? profile.interests.map((interest: string, idx: number) => ({ name: interest, value: 30 - idx * 2 }))
    : [
        { name: 'AI & ML', value: 40 },
        { name: 'Software Dev', value: 30 },
        { name: 'Data Analytics', value: 20 },
        { name: 'Design', value: 10 }
      ];

  // Learning progress roadmap (simulated data based on 30-60-90 milestone dates)
  const lineData = [
    { name: 'Day 1', progress: 5 },
    { name: 'Day 15', progress: 20 },
    { name: 'Day 30', progress: 45 },
    { name: 'Day 45', progress: 60 },
    { name: 'Day 60', progress: 75 },
    { name: 'Day 90', progress: 95 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
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
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Profile Completion */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">Profile Status</p>
            <h3 className="text-2xl font-black text-slate-900">{profileCompletion}%</h3>
            <div className="w-28 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
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
            <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">Skill Score</p>
            <h3 className="text-2xl font-black text-slate-900">{avgSkillScore}%</h3>
            <p className="text-[10px] text-slate-500 mt-1">Average rating across skills</p>
          </div>
        </div>

        {/* Career Matches */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">Top Career Match</p>
            <h3 className="text-sm font-black text-slate-900 truncate max-w-[150px]">{topCareerMatch}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Based on AI Recommendation</p>
          </div>
        </div>

        {/* Certificates Earned */}
        <div className="glass-card p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">ATS Score</p>
            <h3 className="text-2xl font-black text-slate-900">
              {profile?.ats_score !== null && profile?.ats_score !== undefined ? `${profile.ats_score}%` : 'N/A'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              {profile?.resume_filename ? 'Resume Uploaded' : 'No resume uploaded'}
            </p>
          </div>
        </div>


      </div>

      {/* Main Grid: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart: Skill Profile */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">Skill Web Analysis</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase font-semibold">
              {hasSkills ? 'Live Data' : 'Demo Profile'}
            </span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" opacity={0.8} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'semibold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 9 }} />
                <Radar name="Proficiency" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recommendations mini panel */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">Career Matches</h3>
            <Link to="/recommendations" className="text-xs text-primary font-semibold hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec, index) => (
                <div key={rec.career_name} className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{rec.career_name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{rec.salary_range}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    index === 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {rec.match_score}%
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 space-y-3">
                <Award className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">No Career Matches Yet</p>
                  <p className="text-[10px] text-slate-400 px-4 leading-normal">
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
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
            Match Percentage Analysis
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="#E2E8F0" opacity={0.6} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {barData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Domain Interests */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
            Interest Domain Breakdown
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
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
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-[40%] flex flex-col justify-center space-y-2.5">
              {pieData.slice(0, 4).map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-[10px] font-semibold truncate max-w-[90px] text-slate-700">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart: Learning Progress */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">
            Roadmap Milestones Progress
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="#E2E8F0" opacity={0.6} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Line type="monotone" dataKey="progress" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
  if (profile.degree) score += 20;
  if (profile.skills && Object.keys(profile.skills).length > 0) score += 30;
  if (profile.interests && profile.interests.length > 0) score += 10;
  if (profile.resume_filename) score += 10;
  return score;
}

export default Dashboard;

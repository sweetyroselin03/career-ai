import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { Link } from 'react-router-dom';
import { 
  FileDown, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Brain,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, Legend } from 'recharts';

const SkillGap: React.FC = () => {
  const { token, user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/recommendations/`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error("Error loading recommendations for gap analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecs();
  }, [token]);

  const handleDownloadReport = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/recommendations/download-pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.name || 'User'}_SkillGap_Report.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download PDF report:", err);
    }
  };

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

  if (recommendations.length === 0) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-6">
        <Brain className="w-16 h-16 text-slate-350 mx-auto animate-pulse" />
        <h3 className="text-xl font-bold">Awaiting Skill Assessment</h3>
        <p className="text-sm text-slate-450 leading-relaxed">
          Please complete your profile and rate your skills so we can calculate career gaps.
        </p>
        <Link to="/profile" className="btn-primary py-3 px-6 inline-flex items-center space-x-2">
          <span>Go to Profile</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    );
  }

  const activeRec = recommendations[selectedIdx];
  const gapReport = activeRec.gap_analysis.report || [];

  // Group skills by status
  const strongSkills = gapReport.filter((item: any) => item.status === 'strong');
  const weakSkills = gapReport.filter((item: any) => item.status === 'weak');
  const missingSkills = gapReport.filter((item: any) => item.status === 'missing' || item.status === 'available' ? false : true).filter((item: any) => item.status !== 'strong' && item.status !== 'weak');

  // Format data for Recharts Bar Chart
  const barData = gapReport.map((item: any) => ({
    name: item.skill_name,
    Score: item.user_score,
    Required: item.required_score || 80,
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Skill Gap Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare your core capability parameters directly against industry career matrices
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="btn-primary inline-flex items-center space-x-2 text-xs py-2.5 px-4 shadow-md self-start"
        >
          <FileDown className="w-4 h-4" />
          <span>Download PDF Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Selector & Comparative metrics */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Select Target Career
            </h3>
            
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <button
                  key={rec.career_name}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between ${
                    idx === selectedIdx
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'hover:bg-slate-900/40 border-slate-850 text-slate-400'
                  }`}
                >
                  <span>{rec.career_name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                    idx === selectedIdx ? 'bg-primary/20 text-primary' : 'bg-slate-800'
                  }`}>
                    {rec.match_score}%
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right 2 columns: Comparative Gap Analysis & visual chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Comparison Matrix Cards */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Gap Matrix for {activeRec.career_name}
            </h3>
            
            <div className="space-y-6">
              
              {/* Strong Skills */}
              {strongSkills.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Strong Skills (Meeting Target)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {strongSkills.map((item: any) => (
                      <div key={item.skill_name} className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-slate-200">{item.skill_name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Your Level: {item.user_score}% (Required: {item.required_score}%)</p>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[8px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase">Strong</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Skills */}
              {weakSkills.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Weak Skills (Needs Improvement)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {weakSkills.map((item: any) => (
                      <div key={item.skill_name} className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-slate-200">{item.skill_name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Your Level: {item.user_score}% (Required: {item.required_score}%)</p>
                          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Gap: {item.gap}%</p>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                            item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {item.priority} Priority
                          </span>
                          <span className="text-[8px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase">Weak</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {missingSkills.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Missing Skills (Critical Gaps)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {missingSkills.map((item: any) => (
                      <div key={item.skill_name} className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-slate-200">{item.skill_name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">Your Level: {item.user_score}% (Required: {item.required_score}%)</p>
                          <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">Gap: {item.gap}%</p>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                            item.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {item.priority} Priority
                          </span>
                          <span className="text-[8px] font-bold bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded uppercase">Missing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bar Chart comparing current vs required */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Skill Score Comparison Chart (%)
            </h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Score" fill="#2563EB" radius={[4, 4, 0, 0]} name="Your Level" />
                  <Bar dataKey="Required" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Required Level" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SkillGap;

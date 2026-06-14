import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { Link } from 'react-router-dom';
import { 
  Award, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  FileDown, 
  ChevronRight,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const Recommendations: React.FC = () => {
  const { token, user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRecIndex, setSelectedRecIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/recommendations/`);
        
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
          if (data.msg) setMsg(data.msg);
        }
      } catch (err) {
        console.error("Error loading recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [token]);

  const handleDownloadReport = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/recommendations/download-pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.name || 'User'}_Career_Recommendation_Report.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download report:", res.status);
      }
    } catch (err) {
      console.error("Error downloading report:", err);
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

  const activeRec = recommendations[selectedRecIndex];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Career Recommendations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Machine Learning algorithms matching your skill profile vectors against career data matrices
          </p>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={handleDownloadReport}
            className="btn-primary inline-flex items-center space-x-2 text-xs py-2 px-4 shadow-md self-start"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-6">
          <Award className="w-16 h-16 text-slate-350 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Awaiting Skills Assessment</h3>
            <p className="text-sm text-slate-450 leading-relaxed">
              {msg || "We need at least one skill registered to analyze matches and calculate career alignment rankings. Please visit the profile page first."}
            </p>
          </div>
          <div className="pt-2">
            <Link to="/profile" className="btn-primary inline-flex items-center space-x-2 py-3 px-6">
              <span>Complete Profile & Add Skills</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Career Matches Rank List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Matches</h3>
            <div className="space-y-2.5">
              {recommendations.map((rec, index) => {
                const isActive = index === selectedRecIndex;
                return (
                  <button
                    key={rec.career_name}
                    onClick={() => setSelectedRecIndex(index)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border flex items-center justify-between ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary text-slate-800 dark:text-slate-100 font-bold shadow-lg shadow-primary/5'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold leading-tight">{rec.career_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-primary/20 text-primary dark:text-primary-light' : 'bg-slate-100 dark:bg-slate-850 text-slate-500'
                      }`}>
                        {rec.match_score}%
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Selected Career Details, Gaps, Roadmap, Courses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header info card */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary tracking-wide">Rank #{selectedRecIndex + 1} Recommendation</span>
                  <h2 className="text-2xl font-black mt-0.5">{activeRec.career_name}</h2>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{activeRec.match_score}%</span>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Match Accuracy</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-3">
                {activeRec.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Salary Range</p>
                    <p className="text-xs font-bold">{activeRec.salary_range}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Job Growth</p>
                    <p className="text-xs font-bold">{activeRec.growth_rate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap Analysis */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
                Skill Gap Report
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRec.gap_analysis.report.map((item: any) => {
                  const isAvail = item.status === 'strong' || item.status === 'weak';
                  return (
                    <div key={item.skill_name} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/70 rounded-xl">
                      <span className="text-xs font-semibold">{item.skill_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">Score: {item.user_score}%</span>
                        {isAvail ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4.5 h-4.5 text-rose-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Recommendations */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
                Recommended Upskilling Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRec.courses.map((course: any) => (
                  <div key={course.name} className="p-4 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/80 rounded-xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-primary/10 text-primary dark:text-primary-light rounded-md">
                          {course.provider}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs mt-2 leading-tight">{course.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Focus Skill: {course.category}</p>
                    </div>
                    {course.url && (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:text-primary-dark font-bold inline-flex items-center space-x-1 hover:underline self-start"
                      >
                        <span>Go to Course</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customized 30-60-90 Day Roadmap */}
            <div className="glass-card p-6 space-y-6">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
                {activeRec.roadmap.title}
              </h3>
              
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                
                {/* 30 Day */}
                <div className="relative pl-8 space-y-1.5">
                  <div className="absolute left-[5px] top-[5px] w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-950"></div>
                  <h4 className="font-bold text-xs text-primary">{activeRec.roadmap.plan_30.title}</h4>
                  <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc pl-4 leading-normal">
                    {activeRec.roadmap.plan_30.milestones.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* 60 Day */}
                <div className="relative pl-8 space-y-1.5">
                  <div className="absolute left-[5px] top-[5px] w-4 h-4 rounded-full bg-accent border-4 border-white dark:border-slate-950"></div>
                  <h4 className="font-bold text-xs text-accent">{activeRec.roadmap.plan_60.title}</h4>
                  <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc pl-4 leading-normal">
                    {activeRec.roadmap.plan_60.milestones.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>

                {/* 90 Day */}
                <div className="relative pl-8 space-y-1.5">
                  <div className="absolute left-[5px] top-[5px] w-4 h-4 rounded-full bg-secondary border-4 border-white dark:border-slate-950"></div>
                  <h4 className="font-bold text-xs text-secondary">{activeRec.roadmap.plan_90.title}</h4>
                  <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc pl-4 leading-normal">
                    {activeRec.roadmap.plan_90.milestones.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Recommendations;

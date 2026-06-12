import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Square, 
  ExternalLink, 
  Map, 
  ArrowRight,
  Award
} from 'lucide-react';

const Roadmap: React.FC = () => {
  const { token } = useAuth();
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track checked milestones in state/localStorage
  const [completedMilestones, setCompletedMilestones] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await apiFetch('http://localhost:5000/api/recommendations/');
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error("Error loading recommendations for roadmap:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecs();
  }, [token]);

  // Load completed milestones from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('completed_milestones');
    if (saved) {
      setCompletedMilestones(JSON.parse(saved));
    }
  }, []);

  const toggleMilestone = (key: string) => {
    const next = {
      ...completedMilestones,
      [key]: !completedMilestones[key]
    };
    setCompletedMilestones(next);
    localStorage.setItem('completed_milestones', JSON.stringify(next));
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
        <Map className="w-16 h-16 text-slate-350 mx-auto animate-pulse" />
        <h3 className="text-xl font-bold">No Active Recommendation Path</h3>
        <p className="text-sm text-slate-455 leading-relaxed">
          Please add skills and assess your profile to generate upskilling roadmap timelines.
        </p>
        <Link to="/profile" className="btn-primary py-3 px-6 inline-flex items-center space-x-2">
          <span>Complete Profile</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    );
  }

  const activeRec = recommendations[selectedIdx];
  const roadmap = activeRec.roadmap;

  // Compile milestones list to calculate progress
  const allMilestones = [
    ...roadmap.plan_30.milestones.map((m: string) => `30-${m}`),
    ...roadmap.plan_60.milestones.map((m: string) => `60-${m}`),
    ...roadmap.plan_90.milestones.map((m: string) => `90-${m}`)
  ];

  const completedCount = allMilestones.filter(k => completedMilestones[k]).length;
  const progressPercent = allMilestones.length > 0 ? Math.round((completedCount / allMilestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Upskilling Learning Roadmap</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your 30-60-90 day timeline milestones alongside curated Coursera and Udemy courses
          </p>
        </div>
        
        {/* Target selector */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <label className="text-xs font-bold text-slate-400 whitespace-nowrap">Target Career:</label>
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(parseInt(e.target.value))}
            className="form-input text-xs py-1.5 px-3 bg-slate-900 border border-slate-800 text-slate-200 cursor-pointer"
          >
            {recommendations.map((rec, idx) => (
              <option key={rec.career_name} value={idx}>{rec.career_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar widget */}
      <div className="glass-card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Progress</span>
            <span className="text-xs font-black text-primary">{progressPercent}%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{completedCount} of {allMilestones.length} Milestones Achieved</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-550 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6 relative before:absolute before:left-7 before:top-8 before:bottom-8 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
            
            {/* 30 Day Plan */}
            <div className="relative pl-12 space-y-4">
              <div className="absolute left-[18px] top-1.5 w-5 h-5 rounded-full bg-primary border-4 border-white dark:border-slate-950 flex items-center justify-center"></div>
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary rounded-md">Day 1 - 30</span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">{roadmap.plan_30.title}</h3>
              </div>
              
              <div className="space-y-2.5">
                {roadmap.plan_30.milestones.map((m: string) => {
                  const key = `30-${m}`;
                  const isDone = !!completedMilestones[key];
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMilestone(key)}
                      className={`w-full text-left p-3 rounded-xl border flex items-start space-x-3 transition-colors ${
                        isDone 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                          : 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-850/60 text-slate-700 dark:text-slate-350 hover:border-slate-200 dark:hover:border-slate-750'
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-xs leading-normal ${isDone ? 'line-through' : ''}`}>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 60 Day Plan */}
            <div className="relative pl-12 space-y-4">
              <div className="absolute left-[18px] top-1.5 w-5 h-5 rounded-full bg-accent border-4 border-white dark:border-slate-950 flex items-center justify-center"></div>
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-accent/10 text-accent rounded-md">Day 31 - 60</span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">{roadmap.plan_60.title}</h3>
              </div>
              
              <div className="space-y-2.5">
                {roadmap.plan_60.milestones.map((m: string) => {
                  const key = `60-${m}`;
                  const isDone = !!completedMilestones[key];
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMilestone(key)}
                      className={`w-full text-left p-3 rounded-xl border flex items-start space-x-3 transition-colors ${
                        isDone 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                          : 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-850/60 text-slate-700 dark:text-slate-350 hover:border-slate-200 dark:hover:border-slate-750'
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-xs leading-normal ${isDone ? 'line-through' : ''}`}>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 90 Day Plan */}
            <div className="relative pl-12 space-y-4">
              <div className="absolute left-[18px] top-1.5 w-5 h-5 rounded-full bg-secondary border-4 border-white dark:border-slate-950 flex items-center justify-center"></div>
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-secondary/10 text-secondary rounded-md">Day 61 - 90</span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">{roadmap.plan_90.title}</h3>
              </div>
              
              <div className="space-y-2.5">
                {roadmap.plan_90.milestones.map((m: string) => {
                  const key = `90-${m}`;
                  const isDone = !!completedMilestones[key];
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMilestone(key)}
                      className={`w-full text-left p-3 rounded-xl border flex items-start space-x-3 transition-colors ${
                        isDone 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' 
                          : 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-850/60 text-slate-700 dark:text-slate-350 hover:border-slate-200 dark:hover:border-slate-750'
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-xs leading-normal ${isDone ? 'line-through' : ''}`}>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Recommended Online Courses (Right 1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center space-x-1.5">
              <Award className="w-4.5 h-4.5 text-accent" />
              <span>Upskilling Courses</span>
            </h3>
            
            <div className="space-y-3">
              {activeRec.courses.map((course: any) => (
                <div key={course.name} className="p-4 bg-slate-55/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                    {course.provider}
                  </span>
                  <h5 className="font-bold text-xs leading-tight">{course.name}</h5>
                  <p className="text-[9px] text-slate-400">Category Focus: {course.category}</p>
                  {course.url && (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-[10px] py-1 px-3 rounded-lg cursor-pointer inline-flex items-center space-x-1 hover:underline"
                    >
                      <span>Start Course</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Roadmap;

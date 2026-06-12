import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  Award, 
  ExternalLink,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line,
  AreaChart,
  Area
} from 'recharts';

const CareerDetails: React.FC = () => {
  const id = useParams<{ id: string }>().id;
  
  const [career, setCareer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [demandData, setDemandData] = useState<any[]>([]);

  useEffect(() => {
    const fetchCareerDetail = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/recommendations/`);
        
        if (res.ok) {
          const data = await res.json();
          const found = data.recommendations?.find((r: any) => r.career_id.toString() === id);
          if (found) {
            setCareer(found);
            
            // Parse salary range and generate trend data
            const salStr = found.salary_range || "₹6 LPA - ₹18 LPA";
            const matches = salStr.match(/(\d+)/g);
            const low = matches ? parseInt(matches[0]) : 6;
            const high = matches && matches[1] ? parseInt(matches[1]) : 18;
            const stepVal = (high - low) / 5;
            
            setSalaryData([
              { year: '2022', base: low, senior: high - 3 },
              { year: '2023', base: low + stepVal, senior: high - 2 },
              { year: '2024', base: low + stepVal * 2, senior: high - 1 },
              { year: '2025', base: low + stepVal * 3, senior: high },
              { year: '2026', base: low + stepVal * 4, senior: high + 3 },
            ]);

            // Generate demand data based on growth rate
            const growthPercent = parseInt(found.growth_rate) || 20;
            setDemandData([
              { year: '2022', jobPostings: 1200 },
              { year: '2023', jobPostings: Math.round(1200 * (1 + growthPercent/100)) },
              { year: '2024', jobPostings: Math.round(1500 * (1 + growthPercent/100)) },
              { year: '2025', jobPostings: Math.round(1900 * (1 + growthPercent/100)) },
              { year: '2026', jobPostings: Math.round(2400 * (1 + growthPercent/100)) },
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading career details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareerDetail();
  }, [id]);

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

  if (!career) {
    return (
      <div className="glass-card p-12 text-center max-w-md mx-auto space-y-4">
        <h3 className="font-bold text-lg">Career Path Not Found</h3>
        <p className="text-xs text-slate-400">We couldn't locate this recommendation in your active profile matrix.</p>
        <Link to="/recommendations" className="btn-primary py-2 px-4 inline-block text-xs">
          Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <Link to="/recommendations" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Career Recommendations</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{career.career_name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              AI-compiled market research and job-readiness projections
            </p>
          </div>
          <div className="text-right self-start sm:self-center">
            <span className="text-2xl font-black text-primary">{career.match_score}% Match</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Charts & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overview info */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Career Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {career.description}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-455">Avg Salary</span>
                  <p className="text-xs font-bold">{career.salary_range}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-455">Market Growth</span>
                  <p className="text-xs font-bold">{career.growth_rate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphs panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Salary Trends LineChart */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-bold text-xs text-slate-500 dark:text-slate-455 uppercase tracking-wider">
                Salary Growth Forecast (₹ LPA)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salaryData}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="base" stroke="#2563EB" strokeWidth={2} name="Entry Level" />
                    <Line type="monotone" dataKey="senior" stroke="#8B5CF6" strokeWidth={2} name="Lead / Architect" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Projections AreaChart */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-bold text-xs text-slate-500 dark:text-slate-455 uppercase tracking-wider">
                Active Industry Demand (Job Openings)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demandData}>
                    <defs>
                      <linearGradient id="colorPostings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Area type="monotone" dataKey="jobPostings" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPostings)" name="Job Openings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Roadmap Summary */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Learning Roadmap Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">Day 1 - 30</span>
                <h5 className="font-bold text-xs">{career.roadmap.plan_30.title}</h5>
                <p className="text-[10px] text-slate-400 line-clamp-3">{career.roadmap.plan_30.milestones[0]}</p>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-md">Day 31 - 60</span>
                <h5 className="font-bold text-xs">{career.roadmap.plan_60.title}</h5>
                <p className="text-[10px] text-slate-400 line-clamp-3">{career.roadmap.plan_60.milestones[0]}</p>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-md">Day 61 - 90</span>
                <h5 className="font-bold text-xs">{career.roadmap.plan_90.title}</h5>
                <p className="text-[10px] text-slate-400 line-clamp-3">{career.roadmap.plan_90.milestones[0]}</p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/roadmap" className="btn-secondary text-xs py-2 px-4 rounded-xl cursor-pointer inline-flex items-center space-x-1.5">
                <span>View Full Step-by-Step Learning Timeline</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Job Listings & Certifications */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Job Openings */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Active Job Postings
            </h3>
            
            <div className="space-y-3">
              {[
                { title: `Junior ${career.career_name}`, company: "Wipro Tech", location: "Bangalore", salary: "₹6.5 - ₹9 LPA" },
                { title: `${career.career_name} Specialist`, company: "Oracle India", location: "Hyderabad", salary: "₹12 - ₹18 LPA" },
                { title: `Lead ${career.career_name}`, company: "TCS Innovations", location: "Remote / Pune", salary: "₹18 - ₹25 LPA" },
              ].map((job, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs leading-tight">{job.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{job.company}</p>
                    </div>
                    <Bookmark className="w-3.5 h-3.5 text-slate-500 hover:text-primary cursor-pointer" />
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{job.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{job.salary}</span>
                    </span>
                  </div>

                  <button className="w-full text-center py-1.5 bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] rounded-lg hover:bg-primary hover:text-white transition-all duration-200">
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Certification credentials link */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center space-x-1.5">
              <Award className="w-4.5 h-4.5 text-accent" />
              <span>Upskilling Courses</span>
            </h3>
            
            <div className="space-y-3">
              {career.courses.map((course: any) => (
                <div key={course.name} className="p-3 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1.5">
                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                    {course.provider}
                  </span>
                  <h5 className="font-bold text-xs leading-tight">{course.name}</h5>
                  {course.url && (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>Enroll in Course</span>
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

export default CareerDetails;

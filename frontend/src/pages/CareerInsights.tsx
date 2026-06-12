import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area 
} from 'recharts';
import { 
  Flame, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';

const MARKET_DEMAND_DATA = [
  { year: '2021', AI: 35, Cloud: 55, Cyber: 40 },
  { year: '2022', AI: 45, Cloud: 65, Cyber: 50 },
  { year: '2023', AI: 65, Cloud: 70, Cyber: 55 },
  { year: '2024', AI: 85, Cloud: 80, Cyber: 68 },
  { year: '2025', AI: 110, Cloud: 92, Cyber: 82 },
  { year: '2026', AI: 140, Cloud: 105, Cyber: 98 }
];

const EMERGING_TECH = [
  { name: "Generative AI", description: "Integration of LLMs, agentic systems, and retrieval pipelines (RAG).", demand: "+180% YoY" },
  { name: "Prompt Engineering", description: "Structuring input instructions to maximize LLM response accuracy.", demand: "+95% YoY" },
  { name: "Data Analytics", description: "Transforming big data into actionable strategic corporate decisions.", demand: "+45% YoY" },
  { name: "Cloud Engineering", description: "Infrastructure as Code, hybrid deployments, and serverless compute.", demand: "+60% YoY" }
];

const CareerInsights: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Market Career Insights</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Stay ahead of the curve with real-time job market trends, high-demand skills, and emerging engineering tech
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Industry Demand Graph */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350">Industry Demand Projections (2021-2026)</h3>
            <div className="flex space-x-3 text-[10px] font-bold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>AI Engineer</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>Cloud/DevOps</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                <span>Cybersecurity</span>
              </span>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MARKET_DEMAND_DATA}>
                <defs>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCyber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="AI" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAI)" />
                <Area type="monotone" dataKey="Cloud" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCloud)" />
                <Area type="monotone" dataKey="Cyber" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCyber)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel: Hottest Skill Roles */}
        <div className="lg:col-span-1 glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Top Trending Careers</span>
          </h3>

          <div className="space-y-3">
            {[
              { title: "Generative AI Engineer", growth: "+140% Growth Rate", salary: "₹15 LPA - ₹40 LPA" },
              { title: "Cloud Platform Specialist", growth: "+88% Growth Rate", salary: "₹12 LPA - ₹30 LPA" },
              { title: "Cyber Security Architect", growth: "+76% Growth Rate", salary: "₹10 LPA - ₹28 LPA" },
              { title: "Full Stack Web Architect", growth: "+55% Growth Rate", salary: "₹8 LPA - ₹24 LPA" }
            ].map(job => (
              <div key={job.title} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs">{job.title}</h4>
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary opacity-60" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{job.growth}</span>
                  <span className="font-semibold text-slate-500">{job.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Emerging Technologies Cards */}
      <div className="space-y-4">
        <h3 className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>Emerging Technology & Industry Demand</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMERGING_TECH.map(tech => (
            <div key={tech.name} className="glass-card p-5 space-y-2 glass-card-hover flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs">{tech.name}</h4>
                  <span className="text-[10px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-md">
                    {tech.demand}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  {tech.description}
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Industry Priority: Critical</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CareerInsights;

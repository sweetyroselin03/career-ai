import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LineChart, 
  Map, 
  Brain, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
      <div className="bg-mesh"></div>

      {/* Navigation header */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              C
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              CareerAI Navigator
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-500">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#stats" className="hover:text-primary transition-colors">Statistics</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-primary px-4 py-2 hover:bg-slate-100 rounded-xl transition-all">
              Log In
            </Link>
            <Link to="/register" className="btn-primary text-xs font-bold px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-3xl"
        >
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Brain className="w-3.5 h-3.5" />
            <span>AI-Driven Career Guidance Platform</span>
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-slate-900">
            Navigate Your Career with Vector Precision
          </h1>
          <p className="text-sm sm:text-lg text-slate-650 leading-relaxed max-w-2xl mx-auto">
            Map your academic qualification parameters against dynamic job market vectors. Find matching career categories, address skill gaps, and explore 30-60-90 day upskilling timelines.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto btn-primary flex items-center justify-center space-x-2 py-3 px-8">
              <span>Get Started Free</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3 px-8 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all font-bold text-xs text-slate-700 shadow-xs">
              <span>Sign In</span>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard preview placeholder container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 w-full max-w-4xl p-2 rounded-3xl bg-white border border-slate-200 shadow-2xl relative"
        >
          <div className="w-full h-48 sm:h-96 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center p-8 border border-slate-100 overflow-hidden">
            <div className="bg-mesh opacity-20 absolute inset-0"></div>
            <Brain className="w-16 h-16 text-primary animate-pulse mb-4" />
            <h3 className="text-xl font-extrabold text-slate-950">Interactive Dynamic Assessment</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Visualize your skills in real-time. Calculate compatibility matrices and bridge the career gaps.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12 border-t border-slate-200">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900">Powered by Career Intellect</h2>
          <p className="text-xs text-slate-500">
            A comprehensive stack of automated modules built to analyze and structure your professional profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-primary/40 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold mt-4 text-slate-900">AI Career Assistant</h4>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Interact with a conversational LLM agent to obtain real-time interview prep, resume advice, and tech stack directions.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-secondary/40 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <LineChart className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold mt-4 text-slate-900">ATS Resume Audit</h4>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Upload PDF resumes to compute ATS score algorithms, missing structural sections, and high-frequency industry keywords.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-accent/40 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Map className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold mt-4 text-slate-900">Upskilling Timelines</h4>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Track custom 30-60-90 day milestones integrated with external courses from Coursera, Udemy, and NPTEL.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-3xl sm:text-5xl font-black text-primary">12+</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Core Tech Careers</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-5xl font-black text-secondary">95%</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ATS Accuracy</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-5xl font-black text-accent">50k+</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Upskilling Paths</p>
          </div>
          <div>
            <h3 className="text-3xl sm:text-5xl font-black text-slate-900">2.5M+</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Vector Comparisons</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900">Loved by Career Switchers</h2>
          <p className="text-xs text-slate-500">See how graduates and software developers reached their targets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <p className="text-xs text-slate-650 italic leading-relaxed">
              "The gap analysis feature pointed out exactly what SQL and Cloud skills I was missing. I completed the Udemy courses, updated my resume, and landed a DevOps role in 3 months."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">SM</div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Siddharth Mehta</h5>
                <p className="text-[10px] text-slate-550">DevOps Engineer at Tata</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <p className="text-xs text-slate-650 italic leading-relaxed">
              "The 30-60-90 roadmap was my daily dashboard checklist. Being able to track progress on edX courses alongside my skill score improvements kept me focused on what mattered."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">AK</div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Apurva Kulkarni</h5>
                <p className="text-[10px] text-slate-550">ML Architect at Infosys</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-[10px] text-slate-500">
        <p>© 2026 CareerAI Navigator. Built with Google Gemini Agentic Refactoring.</p>
      </footer>
    </div>
  );
};

export default Landing;;

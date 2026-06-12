import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  Brain, 
  Sparkles, 
  Target, 
  GraduationCap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Common/Toast';

const floatCardVariants = {
  animate: (i: number) => ({
    y: [0, -12, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: i * 1.5,
    }
  })
};

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered email on startup
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log("[DEBUG] Login response received:", { status: res.status, hasToken: !!data.access_token, hasUser: !!data.user });
      
      if (!res.ok) {
        throw new Error(data.msg || 'Invalid email or password.');
      }

      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Save JWT token and user object via AuthContext
      console.log("[DEBUG] Calling login() to store token and user...");
      login(data.access_token, data.user);
      console.log("[DEBUG] Token stored. User authenticated.");

      // Immediately navigate to dashboard — do NOT wait for /api/auth/me
      console.log("[DEBUG] Navigation triggered: /login → /dashboard");
      navigate('/dashboard');
    } catch (err: any) {
      console.error("[DEBUG] Login failed:", err);
      setToast({ message: err.message || 'Network error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    setToast({ message: `${platform} Login simulation triggered.`, type: 'success' });
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-[#0F172A]">
      
      {/* Left Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:flex-none lg:w-[45%] relative z-10 py-12">
        <div className="bg-mesh opacity-20 absolute inset-0"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-[460px] bg-white border border-[#0f172a]/05 p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[24px] relative z-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <Link to="/" className="inline-block mb-6">
              {/* Premium Circular Glassmorphism Sapphire Logo with 72px size */}
              <div className="relative w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] p-[1.5px] shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] blur-md opacity-50"></div>
                <div className="w-full h-full rounded-2xl bg-slate-900/90 backdrop-blur-xl flex items-center justify-center border border-white/10 relative z-10">
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="url(#sapphire-logo-grad)" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M12 6L18 10V14L12 18L6 14V10L12 6Z" fill="url(#sapphire-logo-grad)" fillOpacity="0.3" stroke="url(#sapphire-logo-grad)" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2" fill="#FFFFFF" className="animate-pulse" />
                    <defs>
                      <linearGradient id="sapphire-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </Link>
            
            <h2 className="text-[48px] font-extrabold tracking-tight text-[#0F172A] leading-tight font-sans">
              Welcome Back
            </h2>
            <p className="text-[16px] text-[#64748B] mt-2.5 font-medium max-w-sm">
              Log in to navigate your career path
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">Email Address</label>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-[20px] h-[20px] text-[#64748B]" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[56px] bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 rounded-[14px] pl-12 pr-4 text-base text-slate-900 placeholder-[#64748B]/50 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#2563EB] font-semibold hover:underline hover:text-[#3B82F6] transition-colors flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Forgot password?</span>
                </Link>
              </div>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-[20px] h-[20px] text-[#64748B]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[56px] bg-white border border-[#D1D5DB] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15 rounded-[14px] pl-12 pr-12 text-base text-slate-900 placeholder-[#64748B]/50 transition-all duration-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#2563EB] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center py-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 focus:outline-none ${
                  rememberMe 
                    ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm' 
                    : 'bg-white border-[#D1D5DB] hover:border-[#2563EB]'
                }`}
              >
                {rememberMe && (
                  <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span 
                onClick={() => setRememberMe(!rememberMe)} 
                className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] ml-2.5 cursor-pointer select-none transition-colors"
              >
                Remember Me
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[56px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold rounded-[14px] shadow-[0_12px_30px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_16px_36px_rgba(37,99,235,0.35)] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]"></div>
            </div>
            <span className="relative px-3 bg-white text-[11px] uppercase font-bold text-[#64748B] tracking-widest">
              Or Sign In With
            </span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="flex items-center justify-center space-x-2.5 h-[56px] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[14px] transition-all duration-200 active:scale-95 font-semibold text-sm cursor-pointer text-[#334155] shadow-xs hover:shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.7 14.95 1 12 1 7.37 1 3.44 3.73 1.63 7.72l3.75 2.91C6.27 7.55 8.92 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.73-4.94 3.73-8.58z"/>
                <path fill="#FBBC05" d="M5.38 10.63c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.63 3.14C.59 5.2 0 7.53 0 10c0 2.47.59 4.8 1.63 6.86l3.75-2.91c-.24-.72-.38-1.49-.38-2.29z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-3.08 0-5.73-2.51-6.62-5.59L1.63 15.63C3.44 19.62 7.37 23 12 23z"/>
              </svg>
              <span className="font-semibold text-slate-700">Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('GitHub')}
              className="flex items-center justify-center space-x-2.5 h-[56px] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[14px] transition-all duration-200 active:scale-95 font-semibold text-sm cursor-pointer text-[#334155] shadow-xs hover:shadow-sm"
            >
              <svg className="w-5 h-5 fill-[#0F172A] shrink-0" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span className="font-semibold text-slate-700">GitHub</span>
            </button>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-10">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2563EB] font-bold hover:underline hover:text-[#3B82F6] transition-colors">
              Sign up free
            </Link>
          </p>

        </motion.div>
      </div>

      {/* Right Column: Premium Visual Marketing Side */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] overflow-hidden p-16">
        <div className="absolute inset-0 bg-mesh opacity-15"></div>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative z-10 w-full max-w-2xl space-y-12">
          
          <div className="space-y-5 text-white">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider"
            >
              <GraduationCap className="w-4 h-4 text-white stroke-[2]" />
              <span>Enterprise Career Platform</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[40px] md:text-[50px] font-extrabold tracking-tight leading-[1.15] text-white"
            >
              Map Academic Parameters <br />
              Against Market Vectors
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/85 text-[16px] md:text-[18px] max-w-xl leading-relaxed font-normal"
            >
              Leverage multi-dimensional vector models to align your skills, projects, and academic background with real-time enterprise demand.
            </motion.p>
          </div>
          
          {/* Custom Interactive Floating Glassmorphism Cards & SVG Animation */}
          <div className="relative h-[360px] w-full mt-6 select-none">
            {/* Background floating AI illustration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="w-[380px] h-[380px] opacity-15"
              >
                <svg className="w-full h-full text-white" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="80" strokeDasharray="4,4" strokeWidth="1" />
                  <circle cx="100" cy="100" r="52" strokeDasharray="3,3" strokeWidth="1" />
                  <circle cx="100" cy="100" r="24" strokeWidth="1.5" />
                  <path d="M100 20 L100 180" strokeWidth="0.5" />
                  <path d="M20 100 L180 100" strokeWidth="0.5" />
                  <path d="M43.4 43.4 L156.6 156.6" strokeWidth="0.5" />
                  <path d="M43.4 156.6 L156.6 43.4" strokeWidth="0.5" />
                  
                  <circle cx="100" cy="20" r="4" fill="currentColor" />
                  <circle cx="100" cy="180" r="4" fill="currentColor" />
                  <circle cx="20" cy="100" r="4" fill="currentColor" />
                  <circle cx="180" cy="100" r="4" fill="currentColor" />
                  <circle cx="43.4" cy="43.4" r="4" fill="currentColor" />
                  <circle cx="156.6" cy="156.6" r="4" fill="currentColor" />
                  <circle cx="43.4" cy="156.6" r="4" fill="currentColor" />
                  <circle cx="156.6" cy="43.4" r="4" fill="currentColor" />
                </svg>
              </motion.div>
            </div>
            
            {/* ATS Analysis Card */}
            <motion.div
              variants={floatCardVariants}
              animate="animate"
              custom={0}
              whileHover={{ scale: 1.03, zIndex: 50, transition: { duration: 0.2 } }}
              className="absolute top-2 left-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-[20px] p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[260px] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-[#60A5FA]" />
                  </div>
                  <span className="text-xs font-bold tracking-wide uppercase text-white/90">ATS Score</span>
                </div>
                <span className="text-xs font-extrabold text-[#60A5FA] bg-[#60A5FA]/15 px-2.5 py-0.5 rounded-full border border-[#60A5FA]/20">94%</span>
              </div>
              <p className="text-[12px] text-white/80 leading-normal">
                Keyword matching density and profile strength optimized.
              </p>
              <div className="w-full bg-white/15 h-[6px] rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] h-full rounded-full" 
                />
              </div>
            </motion.div>

            {/* Career Roadmap Card */}
            <motion.div
              variants={floatCardVariants}
              animate="animate"
              custom={1}
              whileHover={{ scale: 1.03, zIndex: 50, transition: { duration: 0.2 } }}
              className="absolute bottom-4 left-16 bg-white/10 backdrop-blur-lg border border-white/20 rounded-[20px] p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[280px] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Target className="w-4.5 h-4.5 text-[#60A5FA]" />
                </div>
                <span className="text-xs font-bold tracking-wide uppercase text-white/90">Career Roadmap</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/60">Target Pathway</span>
                  <span className="font-extrabold text-[#60A5FA]">DevOps Architect</span>
                </div>
                <div className="flex justify-between items-center text-[11px] bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg">
                  <span className="text-white/90 font-medium">Next: Terraform & AWS</span>
                  <span className="text-white/50">80%</span>
                </div>
              </div>
            </motion.div>

            {/* Skill Assessment Card */}
            <motion.div
              variants={floatCardVariants}
              animate="animate"
              custom={2}
              whileHover={{ scale: 1.03, zIndex: 50, transition: { duration: 0.2 } }}
              className="absolute top-1/4 right-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-[20px] p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[240px] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-[#60A5FA]" />
                </div>
                <span className="text-xs font-bold tracking-wide uppercase text-white/90">Skill Vectors</span>
              </div>
              <div className="space-y-3.5 text-[11px]">
                <div>
                  <div className="flex justify-between mb-1 text-white/80">
                    <span>Core Python</span>
                    <span className="font-bold">95%</span>
                  </div>
                  <div className="w-full bg-white/15 h-[4px] rounded-full overflow-hidden">
                    <div className="bg-[#60A5FA] h-full w-[95%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-white/80">
                    <span>System Design</span>
                    <span className="font-bold">88%</span>
                  </div>
                  <div className="w-full bg-white/15 h-[4px] rounded-full overflow-hidden">
                    <div className="bg-[#60A5FA] h-full w-[88%]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Statistics Bar with high visual hierarchy */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="pt-10 border-t border-white/10 flex items-center space-x-12"
          >
            <div className="space-y-1">
              <p className="font-extrabold text-[42px] leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
                95%
              </p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider leading-relaxed">
                ATS Assessment Accuracy
              </p>
            </div>
            
            <div className="w-[1px] h-12 bg-white/10 shrink-0"></div>
            
            <div className="space-y-1">
              <p className="font-extrabold text-[42px] leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
                12+
              </p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider leading-relaxed">
                Core Tech Pathways
              </p>
            </div>

            <div className="w-[1px] h-12 bg-white/10 shrink-0"></div>
            
            <div className="space-y-1">
              <p className="font-extrabold text-[42px] leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
                Instant
              </p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider leading-relaxed">
                Vector Matching
              </p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Toast Alert */}
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

export default Login;


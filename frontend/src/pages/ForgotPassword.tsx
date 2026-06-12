import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to submit request.');
      }

      setSuccessMsg(data.msg);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Background blobs */}
      <div className="bg-mesh"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 shadow-2xl relative z-10"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-550 hover:text-primary transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-450 dark:text-slate-450 mt-1.5">
            Enter your email to retrieve recovery options
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-450 rounded-2xl text-center space-y-3"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm">Reset Request Sent</h3>
            <p className="text-xs leading-relaxed">
              {successMsg}
            </p>
            <div className="pt-2">
              <Link to="/login" className="btn-primary inline-block text-xs py-2 px-5">
                Proceed to Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-455">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting request...</span>
                </>
              ) : (
                <span>Send Reset Options</span>
              )}
            </button>
          </form>
        )}

      </motion.div>
    </div>
  );
};

export default ForgotPassword;

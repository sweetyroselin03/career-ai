import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Bell, 
  Moon, 
  Sun, 
  Save, 
  Loader2 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Common/Toast';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyCourses, setNotifyCourses] = useState(false);
  const [notifyChat, setNotifyChat] = useState(true);
  
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Fetch simulated update or actual profile update password if API supported it
      // Let's call standard password update mock
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ message: 'Security password updated successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setToast({ message: 'Failed to update password. Check your parameters.', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage system configurations, notification toggles, theme settings, and account passwords
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preferences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Theme & Display Settings */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-primary" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
              <span>Theme Preferences</span>
            </h3>
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div>
                <h4 className="font-bold text-xs">Light / Dark Interface Mode</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle default system rendering styling environment</p>
              </div>
              
              <button
                onClick={toggleTheme}
                className="btn-secondary text-xs py-1.5 px-4 rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Switch to Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-primary" />
                    <span>Switch to Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center space-x-2">
              <Bell className="w-4.5 h-4.5 text-secondary" />
              <span>Notification Parameters</span>
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-start justify-between p-3 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl cursor-pointer">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Career Match Analytics</h5>
                  <p className="text-[10px] text-slate-400">Receive alerts when ML models calculate new career fits</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMatches}
                  onChange={(e) => setNotifyMatches(e.target.checked)}
                  className="rounded border-slate-700 text-primary w-4.5 h-4.5 cursor-pointer mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl cursor-pointer">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Upskilling Timeline Reminders</h5>
                  <p className="text-[10px] text-slate-400">Receive alerts for incomplete 30-60-90 day course items</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCourses}
                  onChange={(e) => setNotifyCourses(e.target.checked)}
                  className="rounded border-slate-700 text-primary w-4.5 h-4.5 cursor-pointer mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-xl cursor-pointer">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs">Career Assistant Logs</h5>
                  <p className="text-[10px] text-slate-400">Save active chat queries and conversation logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChat}
                  onChange={(e) => setNotifyChat(e.target.checked)}
                  className="rounded border-slate-700 text-primary w-4.5 h-4.5 cursor-pointer mt-1"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Password & Security */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center space-x-2">
              <Lock className="w-4.5 h-4.5 text-accent" />
              <span>Update Password</span>
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full btn-primary text-xs py-2.5 font-bold mt-2 shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Security Credentials</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

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

export default Settings;

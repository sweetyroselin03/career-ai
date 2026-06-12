import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, text: "Resume analysis ATS score calculated: 82%", time: "10 mins ago" },
    { id: 2, text: "Recommended 3 new courses for Python skills", time: "2 hours ago" },
    { id: 3, text: "System Administrator updated emerging technology trends", time: "Yesterday" }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full px-6 py-4 bg-white border-b border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-md shadow-primary/20">
              C
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              CareerAI Navigator
            </span>
          </Link>
        </div>

        {/* Right Side: Quick Settings & User Menu */}
        <div className="flex items-center space-x-3">
          
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-primary transition-all duration-300"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 glass-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <button className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="text-xs p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <p className="font-medium text-slate-800">{n.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

          {/* User Profile Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/25 flex items-center justify-center text-accent font-bold text-sm">
                  {user.name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs text-slate-700">
                  <p className="font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-48 glass-card p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link 
                    to="/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center space-x-2 text-xs px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 text-xs px-3 py-2.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;

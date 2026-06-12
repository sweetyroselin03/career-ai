import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutGrid, 
  User, 
  Award, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  ShieldAlert, 
  LogOut,
  GraduationCap,
  Settings,
  Compass,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { name: 'Profile Form', path: '/profile', icon: User },
    { name: 'Skill Assessment', path: '/skill-assessment', icon: CheckCircle2 },
    { name: 'Career Matcher', path: '/career-recommendations', icon: Award },
    { name: 'Gap Analysis', path: '/skill-gap-analysis', icon: Compass },
    { name: 'Learning Roadmap', path: '/learning-roadmap', icon: GraduationCap },
    { name: 'Resume Analyzer', path: '/resume-analyzer', icon: FileText },
    { name: 'Career Insights', path: '/insights', icon: TrendingUp },
    { name: 'Certificates', path: '/certificates', icon: Award },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Chatbot Assistant', path: '/career-assistant', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarClasses = `
    fixed md:sticky top-[73px] left-0 z-35 h-[calc(100vh-73px)] w-64
    bg-white border-r border-slate-200/80
    p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-xs md:hidden"
        ></div>
      )}

      <aside className={sidebarClasses}>
        <div className="space-y-6">
          
          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
                  ${isActive 
                    ? 'bg-primary/5 text-primary border-l-4 border-primary font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-slate-200/50">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Tools</p>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
                  ${isActive 
                    ? 'bg-rose-500/5 text-rose-500 border-l-4 border-rose-500 font-bold' 
                    : 'text-slate-600 hover:bg-rose-500/5 hover:text-rose-500'
                  }
                `}
              >
                <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
                <span>Admin Panel</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200/50 mt-4">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all duration-300"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

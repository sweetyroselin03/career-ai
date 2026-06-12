import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trash2, 
  PlusCircle, 
  UserCheck, 
  Plus, 
  Edit, 
  Save, 
  X,
  Users as UsersIcon,
  Briefcase,
  Award,
  BookOpen
} from 'lucide-react';
import Toast from '../components/Common/Toast';

const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();
  
  // Navigation Tabs: 'users' | 'careers' | 'skills' | 'courses'
  const [activeTab, setActiveTab] = useState<'users' | 'careers' | 'skills' | 'courses'>('users');
  
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Entities State
  const [users, setUsers] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Edit / Modals State
  const [editingEntity, setEditingEntity] = useState<any | null>(null);

  // Form Fields State
  const [careerForm, setCareerForm] = useState({ name: '', description: '', salary_range: '', growth_rate: '', required_skills: '' });
  const [skillForm, setSkillForm] = useState({ name: '', category: '' });
  const [courseForm, setCourseForm] = useState({ name: '', provider: '', category: '', url: '' });

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // 2. Fetch Users
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      // 3. Fetch Careers
      const careersRes = await fetch('http://localhost:5000/api/admin/careers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (careersRes.ok) {
        setCareers(await careersRes.json());
      }

      // 4. Fetch Skills
      const skillsRes = await fetch('http://localhost:5000/api/admin/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (skillsRes.ok) {
        setSkills(await skillsRes.json());
      }

      // 5. Fetch Courses
      const coursesRes = await fetch('http://localhost:5000/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesRes.ok) {
        setCourses(await coursesRes.json());
      }

    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // --- Users CRUD ---
  const handleUpdateRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        setToast({ message: "User privileges mutated successfully.", type: 'success' });
        fetchAdminData();
      }
    } catch (err) {
      setToast({ message: "Failed to update role.", type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setToast({ message: "User deleted successfully.", type: 'success' });
        fetchAdminData();
      }
    } catch (err) {
      setToast({ message: "Failed to delete user.", type: 'error' });
    }
  };

  // --- Careers CRUD ---
  const handleCreateCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/careers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(careerForm)
      });
      if (!res.ok) throw new Error('Failed to create career profile.');
      
      setToast({ message: "Career profile added and recommendation models updated!", type: 'success' });
      setCareerForm({ name: '', description: '', salary_range: '', growth_rate: '', required_skills: '' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/careers/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingEntity)
      });
      if (!res.ok) throw new Error('Failed to update career profile.');
      
      setToast({ message: "Career profile updated and models retrained!", type: 'success' });
      setEditingEntity(null);
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteCareer = async (careerId: number) => {
    if (!window.confirm("Delete this career profile?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/careers/${careerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete career profile.');
      
      setToast({ message: "Career deleted successfully.", type: 'success' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  // --- Skills CRUD ---
  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillForm)
      });
      if (!res.ok) throw new Error('Failed to add skill.');
      
      setToast({ message: "New Skill dataset added successfully!", type: 'success' });
      setSkillForm({ name: '', category: 'technical' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/skills/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingEntity)
      });
      if (!res.ok) throw new Error('Failed to update skill.');
      
      setToast({ message: "Skill dataset updated successfully!", type: 'success' });
      setEditingEntity(null);
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    if (!window.confirm("Delete this skill from the dataset?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/skills/${skillId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete skill.');
      
      setToast({ message: "Skill removed successfully.", type: 'success' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  // --- Courses CRUD ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      if (!res.ok) throw new Error('Failed to add course.');
      
      setToast({ message: "Upskilling Course recommendation item added!", type: 'success' });
      setCourseForm({ name: '', provider: '', category: '', url: '' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingEntity)
      });
      if (!res.ok) throw new Error('Failed to update course.');
      
      setToast({ message: "Course details updated successfully!", type: 'success' });
      setEditingEntity(null);
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("Delete this course recommendation?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete course.');
      
      setToast({ message: "Course removed successfully.", type: 'success' });
      fetchAdminData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete CRUD interface for users, careers, skill items, and course datasets
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
              <h3 className="text-2xl font-black mt-1">{stats.total_users}</h3>
            </div>
            <UsersIcon className="w-8 h-8 text-primary opacity-60" />
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Careers Library</p>
              <h3 className="text-2xl font-black mt-1">{stats.total_careers}</h3>
            </div>
            <Briefcase className="w-8 h-8 text-secondary opacity-60" />
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Skills</p>
              <h3 className="text-2xl font-black mt-1">{stats.total_skills || skills.length}</h3>
            </div>
            <Award className="w-8 h-8 text-accent opacity-60" />
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Courses Catalog</p>
              <h3 className="text-2xl font-black mt-1">{stats.total_courses}</h3>
            </div>
            <BookOpen className="w-8 h-8 text-emerald-500 opacity-60" />
          </div>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 space-x-4">
        {[
          { key: 'users', label: 'User Accounts', icon: UsersIcon },
          { key: 'careers', label: 'Careers Matrix', icon: Briefcase },
          { key: 'skills', label: 'Skills Dataset', icon: Award },
          { key: 'courses', label: 'Course Recommendations', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setEditingEntity(null); }}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Management Table (Left) + Forms/Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Management Tables */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm border-b border-slate-800 pb-2">Active Accounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-450 uppercase text-[9px] font-bold border-b border-slate-800">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Role</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="py-3 font-bold">{u.name}</td>
                        <td className="py-3 text-slate-400">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-450'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => handleUpdateRole(u.id, u.role)}
                            disabled={u.id === user?.id}
                            className="p-1 text-slate-400 hover:text-primary disabled:opacity-30"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'careers' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm border-b border-slate-800 pb-2">Careers Matrix List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-450 uppercase text-[9px] font-bold border-b border-slate-800">
                      <th className="py-2">Career Name</th>
                      <th className="py-2">Salary</th>
                      <th className="py-2">Growth</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {careers.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 font-bold">{c.name}</td>
                        <td className="py-3 text-slate-400">{c.salary_range}</td>
                        <td className="py-3 text-slate-400">{c.growth_rate}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingEntity({ id: c.id, name: c.name, description: c.description, salary_range: c.salary_range, growth_rate: c.growth_rate, required_skills: c.required_skills })}
                            className="p-1 text-slate-400 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCareer(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm border-b border-slate-800 pb-2">Skill Dataset list</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-450 uppercase text-[9px] font-bold border-b border-slate-800">
                      <th className="py-2">Skill Name</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {skills.map(s => (
                      <tr key={s.id}>
                        <td className="py-3 font-bold">{s.name}</td>
                        <td className="py-3 text-slate-400 capitalize">{s.category}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingEntity({ id: s.id, name: s.name, category: s.category })}
                            className="p-1 text-slate-400 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSkill(s.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm border-b border-slate-800 pb-2">Courses Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-450 uppercase text-[9px] font-bold border-b border-slate-800">
                      <th className="py-2">Course Name</th>
                      <th className="py-2">Provider</th>
                      <th className="py-2">Category Focus</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {courses.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 font-bold truncate max-w-[120px]">{c.name}</td>
                        <td className="py-3 text-slate-400">{c.provider}</td>
                        <td className="py-3 text-slate-400 truncate max-w-[100px]">{c.category}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingEntity({ id: c.id, name: c.name, provider: c.provider, category: c.category, url: c.url })}
                            className="p-1 text-slate-400 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Forms / Editor Panels */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Edit Mode Panel (Generic Editor) */}
          {editingEntity ? (
            <div className="glass-card p-6 space-y-4 border-2 border-primary/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary">Edit Entity Details</h3>
                <button onClick={() => setEditingEntity(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Career */}
              {activeTab === 'careers' && (
                <form onSubmit={handleUpdateCareer} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Career Name</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.name}
                      onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={editingEntity.description}
                      onChange={(e) => setEditingEntity({ ...editingEntity, description: e.target.value })}
                      className="form-input text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Salary Range</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.salary_range}
                      onChange={(e) => setEditingEntity({ ...editingEntity, salary_range: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Growth Rate</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.growth_rate}
                      onChange={(e) => setEditingEntity({ ...editingEntity, growth_rate: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Required Skills</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.required_skills}
                      onChange={(e) => setEditingEntity({ ...editingEntity, required_skills: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1.5 font-bold cursor-pointer">
                    <Save className="w-4 h-4" />
                    <span>Save & Retrain</span>
                  </button>
                </form>
              )}

              {/* Edit Skill */}
              {activeTab === 'skills' && (
                <form onSubmit={handleUpdateSkill} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Skill Name</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.name}
                      onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Category</label>
                    <select
                      value={editingEntity.category}
                      onChange={(e) => setEditingEntity({ ...editingEntity, category: e.target.value })}
                      className="form-input text-xs bg-slate-950"
                    >
                      <option value="technical">Technical</option>
                      <option value="soft">Soft Skill / Leadership</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1.5 font-bold cursor-pointer">
                    <Save className="w-4 h-4" />
                    <span>Save Skill Details</span>
                  </button>
                </form>
              )}

              {/* Edit Course */}
              {activeTab === 'courses' && (
                <form onSubmit={handleUpdateCourse} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Course Name</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.name}
                      onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Provider</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.provider}
                      onChange={(e) => setEditingEntity({ ...editingEntity, provider: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Category Focus</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.category}
                      onChange={(e) => setEditingEntity({ ...editingEntity, category: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Course URL</label>
                    <input
                      type="url"
                      required
                      value={editingEntity.url}
                      onChange={(e) => setEditingEntity({ ...editingEntity, url: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1.5 font-bold cursor-pointer">
                    <Save className="w-4 h-4" />
                    <span>Save Course Details</span>
                  </button>
                </form>
              )}

            </div>
          ) : (
            /* Creation Forms (Default) */
            <div className="glass-card p-6 space-y-4">
              
              {activeTab === 'users' && (
                <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                  <h3 className="font-bold border-b border-slate-800 pb-2 text-slate-200">Account Rules</h3>
                  <p>Administrators hold access rights to dataset additions and system models retraining.</p>
                  <p>Mutating permissions toggles admin and user privilege scopes directly.</p>
                </div>
              )}

              {activeTab === 'careers' && (
                <form onSubmit={handleCreateCareer} className="space-y-3 text-left">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-primary border-b border-slate-800 pb-2 flex items-center space-x-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Create Career profile</span>
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Career Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Cloud Systems Engineer"
                      value={careerForm.name}
                      onChange={(e) => setCareerForm({ ...careerForm, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Handles orchestrations, container security..."
                      value={careerForm.description}
                      onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
                      className="form-input text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Salary Range</label>
                    <input
                      type="text"
                      required
                      placeholder="₹8 - ₹24 LPA"
                      value={careerForm.salary_range}
                      onChange={(e) => setCareerForm({ ...careerForm, salary_range: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Growth Rate</label>
                    <input
                      type="text"
                      required
                      placeholder="28% (High)"
                      value={careerForm.growth_rate}
                      onChange={(e) => setCareerForm({ ...careerForm, growth_rate: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Required Skills</label>
                    <input
                      type="text"
                      required
                      placeholder="Python, AWS, SQL, Docker"
                      value={careerForm.required_skills}
                      onChange={(e) => setCareerForm({ ...careerForm, required_skills: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1 font-bold cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    <span>Create & Retrain</span>
                  </button>
                </form>
              )}

              {activeTab === 'skills' && (
                <form onSubmit={handleCreateSkill} className="space-y-3 text-left">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-primary border-b border-slate-800 pb-2 flex items-center space-x-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Add Skill Dataset</span>
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Skill Name</label>
                    <input
                      type="text"
                      required
                      placeholder="TensorFlow"
                      value={skillForm.name}
                      onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Category</label>
                    <select
                      value={skillForm.category}
                      onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                      className="form-input text-xs bg-slate-950"
                    >
                      <option value="technical">Technical</option>
                      <option value="soft">Soft Skill / Leadership</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1 font-bold cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Skill</span>
                  </button>
                </form>
              )}

              {activeTab === 'courses' && (
                <form onSubmit={handleCreateCourse} className="space-y-3 text-left">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-primary border-b border-slate-800 pb-2 flex items-center space-x-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Add Course Item</span>
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Course Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Introduction to Docker Containers"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Provider</label>
                    <input
                      type="text"
                      required
                      placeholder="Udemy / Coursera"
                      value={courseForm.provider}
                      onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-455 uppercase">Category / Skill Tag</label>
                    <input
                      type="text"
                      required
                      placeholder="Docker"
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase">Course URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.udemy.com/..."
                      value={courseForm.url}
                      onChange={(e) => setCourseForm({ ...courseForm, url: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2 text-xs flex items-center justify-center space-x-1 font-bold cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Course</span>
                  </button>
                </form>
              )}

            </div>
          )}

        </div>

      </div>

      <Toast
        message={toast ? toast.message : ''}
        type={toast ? toast.type : 'success'}
        onClose={() => setToast(null)}
        duration={3500}
      />

    </div>
  );
};

export default AdminDashboard;

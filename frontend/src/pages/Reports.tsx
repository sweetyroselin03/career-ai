import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { API_URL } from '../config/api';
import { 
  FileText, 
  Download, 
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Reports: React.FC = () => {
  const { token, user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recRes = await apiFetch(`${API_URL}/api/recommendations/`);
        if (recRes.ok) {
          const data = await recRes.json();
          setRecommendations(data.recommendations || []);
        }

        const profRes = await apiFetch(`${API_URL}/api/profile/`);
        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfile(profData);
        }
      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleDownloadPDF = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/recommendations/download-pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.name || 'User'}_Report.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  const handleExportCSV = () => {
    if (!userProfile) return;
    
    // Compile CSV string
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CareerAI Navigator Report\n";
    csvContent += `Generated On,${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "User Profile Data\n";
    csvContent += `Name,${user?.name || ''}\n`;
    csvContent += `Email,${user?.email || ''}\n`;
    csvContent += `Degree,${userProfile.degree || ''}\n`;
    csvContent += `Department,${userProfile.department || ''}\n`;
    csvContent += `University,${userProfile.university || ''}\n`;
    csvContent += `CGPA,${userProfile.cgpa || ''}\n\n`;
    
    csvContent += "Skills Vector Assessment\n";
    csvContent += "Skill Name,Rating (%)\n";
    Object.entries(userProfile.skills || {}).forEach(([name, val]) => {
      csvContent += `${name},${val}\n`;
    });
    csvContent += "\n";
    
    csvContent += "Top Recommended Career Matches\n";
    csvContent += "Career Name,Match (%),Salary Range,Growth Rate\n";
    recommendations.forEach(rec => {
      csvContent += `"${rec.career_name}",${rec.match_score},"${rec.salary_range}","${rec.growth_rate}"\n`;
    });
    
    // Download Blob trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareerAI_Navigator_Report_${user?.name?.replace(/\s+/g, '_') || 'Profile'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-850"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-6">
        <FileText className="w-16 h-16 text-slate-350 mx-auto animate-pulse" />
        <h3 className="text-xl font-bold">No Generated Reports</h3>
        <p className="text-sm text-slate-455 leading-relaxed">
          Please complete your profile and assessment questions to compile reports data metrics.
        </p>
        <Link to="/profile" className="btn-primary py-3 px-6 inline-flex items-center space-x-2">
          <span>Go to Profile</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    );
  }

  const skillsList = Object.entries(userProfile?.skills || {});

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reports & Exports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidate your academic profiles, skill vectors, and career matches into document formats
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex space-x-3 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            className="btn-secondary inline-flex items-center space-x-2 text-xs py-2.5 px-4 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (CSV)</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-primary inline-flex items-center space-x-2 text-xs py-2.5 px-4 shadow-lg shadow-primary/25 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Summaries (Left 1 Column) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Parameters Summary */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Profile Metadata
            </h3>
            
            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold">{user?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-bold">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span className="text-slate-400">Academic Degree:</span>
                <span className="font-bold">{userProfile?.degree || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span className="text-slate-400">Branch Specialization:</span>
                <span className="font-bold">{userProfile?.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span className="text-slate-400">University:</span>
                <span className="font-bold">{userProfile?.university || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current CGPA:</span>
                <span className="font-bold text-primary">{userProfile?.cgpa || 'N/A'} / 10.0</span>
              </div>
            </div>
          </div>

          {/* User Skills Summary */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center justify-between">
              <span>Skills Rating Summary</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                {skillsList.length} Skills
              </span>
            </h3>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {skillsList.map(([name, val]: any) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{name}</span>
                    <span className="text-primary">{val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Top Matches & Roadmap summaries (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Matches List */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Top Career Match Projections
            </h3>

            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={rec.career_name} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="w-5.5 h-5.5 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="font-extrabold text-xs">{rec.career_name}</h4>
                    </div>
                    <span className="text-xs font-black text-primary">{rec.match_score}% Match</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed">{rec.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-slate-150/40 dark:border-slate-800/40">
                    <span>Salary: {rec.salary_range}</span>
                    <span>Growth: {rec.growth_rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Reports;

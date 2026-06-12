import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  CheckSquare, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await apiFetch('http://localhost:5000/api/resume/latest');
        if (res.ok) {
          const data = await res.json();
          if (data.analysis) {
            setAnalysis(data.analysis);
          }
        }
      } catch (err) {
        console.error("Failed to load latest resume analysis:", err);
      }
    };
    fetchLatest();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {

    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only PDF resumes are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only PDF resumes are supported.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    setAnalysis(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await apiFetch('http://localhost:5000/api/resume/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Upload failed');
      }
      
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Resume ATS Analyzer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload your resume in PDF format to compute ATS scoring metrics and find keyword improvements
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload Area */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Upload PDF
            </h3>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-slate-400 animate-bounce" />
              <div>
                <p className="text-xs font-bold">Drag and drop your resume</p>
                <p className="text-[10px] text-slate-400 mt-1">Supported format: PDF only (Max 16MB)</p>
              </div>
              <label className="btn-secondary text-[10px] py-1.5 px-4 rounded-lg cursor-pointer">
                <span>Browse File</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected File Card */}
            {file && (
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="truncate text-left">
                    <p className="text-xs font-semibold truncate leading-tight">{file.name}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Resume...</span>
                </>
              ) : (
                <span>Analyze ATS Score</span>
              )}
            </button>
          </div>

        </div>

        {/* Right Side: Analysis Results */}
        <div className="lg:col-span-2">
          
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                
                {/* Score panel */}
                <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* ATS Rating gauge */}
                  <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-850/80">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="46" stroke="#e2e8f0" strokeWidth="8" fill="transparent" className="dark:stroke-slate-800" />
                        <circle cx="56" cy="56" r="46" stroke="#2563EB" strokeWidth="8" fill="transparent" strokeDasharray="289" strokeDashoffset={289 - (289 * analysis.ats_score) / 100} className="transition-all duration-1000 ease-out" />
                      </svg>
                      <span className="absolute text-2xl font-black">{analysis.ats_score}%</span>
                    </div>
                    <h4 className="font-bold text-xs mt-3">ATS Compatibility</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Calculated score weighting</p>
                  </div>

                  {/* Section checks */}
                  <div className="md:col-span-2 space-y-4 p-2">
                    <h4 className="font-bold text-xs text-slate-500 dark:text-slate-455">Resume Section Analysis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                        {analysis.sections_detected.education ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <span className="text-xs font-semibold">Education</span>
                      </div>
                      <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                        {analysis.sections_detected.experience ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <span className="text-xs font-semibold">Experience</span>
                      </div>
                      <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                        {analysis.sections_detected.projects ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <span className="text-xs font-semibold">Projects</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Extracted skills & Missing keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Found skills */}
                  <div className="glass-card p-6 space-y-3">
                    <h4 className="font-bold text-xs text-slate-500 dark:text-slate-455">Skills Extracted</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skills_found.map((skill: string) => (
                        <span key={skill} className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing keywords */}
                  <div className="glass-card p-6 space-y-3">
                    <h4 className="font-bold text-xs text-slate-500 dark:text-slate-455">Missing Core Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing_keywords.map((skill: string) => (
                        <span key={skill} className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ATS Improvement Suggestions */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
                    Actionable Optimization Suggestions
                  </h3>
                  <div className="space-y-2.5">
                    {analysis.suggestions.map((sug: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60 rounded-xl">
                        <CheckSquare className="w-4.5 h-4.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center h-full flex flex-col items-center justify-center space-y-4 bg-slate-50/20 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850">
                <FileText className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Awaiting Resume Upload</h3>
                  <p className="text-xs text-slate-400 px-6 max-w-sm leading-normal">
                    Submit your resume to assess ATS scoring guidelines and receive keyword optimization advice.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
};

export default ResumeAnalyzer;

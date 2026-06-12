import React, { useState, useEffect } from 'react';
import { Award, Calendar, FileText, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../components/Common/Toast';

const Certificates: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('user_certs');
    if (saved) {
      setCerts(JSON.parse(saved));
    } else {
      // Mock initial certs
      const initial = [
        { id: '1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2025-11-12', credentialId: 'AWS-CCP-8798', url: 'https://aws.amazon.com/verification' },
        { id: '2', name: 'Google UX Design Specialization', issuer: 'Coursera', date: '2025-06-20', credentialId: 'COURSERA-UXD-3344', url: 'https://coursera.org/verification' },
      ];
      setCerts(initial);
      localStorage.setItem('user_certs', JSON.stringify(initial));
    }
  }, []);

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!name || !issuer || !issueDate) {
      setToast({ message: 'Please enter Name, Issuer, and Issue Date.', type: 'error' });
      return;
    }

    const newCert = {
      id: Date.now().toString(),
      name,
      issuer,
      date: issueDate,
      credentialId,
      url: verificationUrl
    };

    const updated = [newCert, ...certs];
    setCerts(updated);
    localStorage.setItem('user_certs', JSON.stringify(updated));

    // Reset fields
    setName('');
    setIssuer('');
    setIssueDate('');
    setCredentialId('');
    setVerificationUrl('');
    setShowAddForm(false);
    setToast({ message: 'Certification credential added successfully!', type: 'success' });
  };

  const handleDeleteCert = (id: string) => {
    const updated = certs.filter(c => c.id !== id);
    setCerts(updated);
    localStorage.setItem('user_certs', JSON.stringify(updated));
    setToast({ message: 'Certification removed.', type: 'success' });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Certifications & Credentials</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store, audit, and showcase your professional credentials and verification indexes
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary inline-flex items-center space-x-2 text-xs py-2.5 px-4 shadow-lg shadow-primary/25 self-start cursor-pointer"
        >
          {showAddForm ? <span>Cancel</span> : (
            <>
              <Plus className="w-4.5 h-4.5" />
              <span>Add Credential</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Add/Upload Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              className="lg:col-span-1 space-y-4"
            >
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
                  New Certification Credential
                </h3>
                
                <form onSubmit={handleAddCert} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Certification Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Docker Certified Associate"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Issuing Organization</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Docker / Coursera"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="form-input text-xs text-slate-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Credential ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. DOC-987-XYZ"
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Verification URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://verify.docker.com/..."
                      value={verificationUrl}
                      onChange={(e) => setVerificationUrl(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary text-xs py-2.5 font-bold mt-2 shadow-md shadow-primary/25 cursor-pointer"
                  >
                    Save Certification
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right column: List of Certifications */}
        <div className={showAddForm ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350 border-b border-slate-100 dark:border-slate-850 pb-2">
              Verified Credential Repository
            </h3>
            
            {certs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
                <Award className="w-12 h-12 text-slate-500 mx-auto animate-pulse mb-3" />
                <h4 className="font-bold text-xs text-slate-400">No Credentials Stored</h4>
                <p className="text-[10px] text-slate-500 mt-1">Add details of your courses and licenses above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certs.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/65 rounded-xl flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs leading-snug">{c.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{c.issuer}</p>
                        <div className="flex items-center space-x-2 text-[9px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Issued: {c.date}</span>
                          </span>
                          {c.credentialId && (
                            <span>• ID: {c.credentialId}</span>
                          )}
                        </div>
                        {c.url && (
                          <a 
                            href={c.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9.5px] text-primary hover:underline font-bold inline-flex items-center space-x-0.5 mt-1"
                          >
                            <span>Verify Credential</span>
                            <FileText className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCert(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors hover:bg-rose-500/5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

export default Certificates;

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Menu,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { aiService } from '../services/aiService';
import type { ChatSession, ChatMessage } from '../services/aiService';

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  
  // State variables
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Rename state
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch sessions on load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsSessionsLoading(true);
        const fetched = await aiService.getSessions();
        setSessions(fetched);
        
        // If there is a session, select the first one
        if (fetched.length > 0) {
          setActiveSessionId(fetched[0].id);
        } else {
          // If no session, create a default one
          handleCreateNewSession("Career Discovery Session");
        }
      } catch (err) {
        console.error("Error loading chat sessions:", err);
      } finally {
        setIsSessionsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // 2. Fetch messages whenever activeSessionId changes
  useEffect(() => {
    if (activeSessionId === null) return;
    
    const fetchMessages = async () => {
      try {
        setIsMessagesLoading(true);
        const fetchedMessages = await aiService.getSessionMessages(activeSessionId);
        setMessages(fetchedMessages);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  // 3. Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Create new session handler
  const handleCreateNewSession = async (title = "New Career Chat") => {
    try {
      const newSession = await aiService.createSession(title);
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setSidebarOpen(false);
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  // Delete session handler
  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat session?")) return;
    
    try {
      await aiService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      
      // If deleted active, switch to next available
      if (activeSessionId === id) {
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Start renaming session
  const startRenameSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // Save renamed session
  const saveRenameSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      const updated = await aiService.renameSession(id, editingTitle);
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
      setEditingSessionId(null);
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  // Cancel renaming
  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // Send message handler
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || activeSessionId === null) return;

    // A. Add user message locally
    const userMsg: ChatMessage = {
      id: Date.now(), // Temp local ID
      sender: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // B. Send message to persistent backend
      const botResponse = await aiService.sendMessage(activeSessionId, textToSend);
      setMessages(prev => [...prev, botResponse]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        content: "I encountered an error connecting to my AI core. Please check that the backend service and database are online.",
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Document file upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeSessionId === null) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds the 5MB limit.");
      return;
    }

    setIsUploading(true);
    setIsTyping(true);

    try {
      const result = await aiService.uploadDocument(activeSessionId, file);
      // Append returned messages to local history log
      setMessages(prev => [...prev, result.user_message, result.bot_message]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload document context.");
    } finally {
      setIsUploading(false);
      setIsTyping(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickQueries = [
    "Which career matches my skills?",
    "Identify my skill gaps for AI Engineer",
    "How do I boost my resume ATS score?",
    "Recommend courses for Cloud Computing"
  ];

  // Custom Inline Markdown Renderer
  const inlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] text-accent">$1</code>');
  };

  // Custom Full Markdown & Table Renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split by code block regex
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // It's a code block
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <div key={index} className="my-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-950 text-slate-100 font-mono text-[11px] shadow-lg">
            <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-405 select-none">
              <span>{lang || 'code'}</span>
              <button 
                type="button"
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto whitespace-pre">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }
      
      const lines = part.split('\n');
      const elements: React.ReactNode[] = [];
      let listItems: string[] = [];

      const flushList = (key: string) => {
        if (listItems.length > 0) {
          elements.push(
            <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-350">
              {listItems.map((item, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
              ))}
            </ul>
          );
          listItems = [];
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Headers
        if (line.startsWith('# ')) {
          flushList(`list-before-h1-${index}-${i}`);
          elements.push(<h1 key={`h1-${index}-${i}`} className="text-sm font-black text-slate-900 dark:text-white mt-4 mb-2" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} />);
        } else if (line.startsWith('## ')) {
          flushList(`list-before-h2-${index}-${i}`);
          elements.push(<h2 key={`h2-${index}-${i}`} className="text-xs font-black text-slate-900 dark:text-white mt-3 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(3)) }} />);
        } else if (line.startsWith('### ')) {
          flushList(`list-before-h3-${index}-${i}`);
          elements.push(<h3 key={`h3-${index}-${i}`} className="text-[11px] font-extrabold text-slate-950 dark:text-slate-200 mt-2.5 mb-1" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(4)) }} />);
        }
        // Lists
        else if (line.startsWith('- ') || line.startsWith('* ')) {
          listItems.push(line.slice(2));
        } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
          listItems.push(line.slice(3));
        } 
        // Table matching: starts and ends with |
        else if (line.startsWith('|') && i < lines.length - 1 && lines[i+1].includes('-|-')) {
          flushList(`list-before-table-${index}-${i}`);
          const headers = line.split('|').map(h => h.trim()).filter(h => h);
          i++; // Skip delimiter line
          const rows: string[][] = [];
          while (i + 1 < lines.length && lines[i+1].startsWith('|')) {
            i++;
            const cells = lines[i].split('|').map(c => c.trim()).filter((_, idx) => idx > 0 && idx < lines[i].split('|').length - 1);
            rows.push(cells);
          }
          elements.push(
            <div key={`table-${index}-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-55 dark:bg-slate-900/60">
                  <tr>
                    {headers.map((h, idx) => (
                      <th key={idx} className="px-4 py-2 text-left text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/20">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2 text-[11px] text-slate-800 dark:text-slate-350 font-medium" dangerouslySetInnerHTML={{ __html: inlineMarkdown(cell) }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // Regular Text Paragraphs
        else if (line.length > 0) {
          flushList(`list-before-p-${index}-${i}`);
          elements.push(<p key={`p-${index}-${i}`} className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 my-1.5 font-medium" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />);
        } else {
          flushList(`list-before-br-${index}-${i}`);
        }
      }
      
      flushList(`list-end-${index}`);
      return <div key={index}>{elements}</div>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden glass-card shadow-2xl relative">
      
      {/* 1. Sidebar Pane */}
      <div className={`absolute lg:relative inset-y-0 left-0 z-40 w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col space-y-3 bg-white/40 dark:bg-slate-950/20">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center space-x-2 text-slate-900 dark:text-white">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              <span>Career Sessions</span>
            </h3>
            <button 
              onClick={() => handleCreateNewSession()}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 hover:text-primary transition-colors cursor-pointer"
              title="New Session"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {isSessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              No chat sessions found.
            </div>
          ) : (
            filteredSessions.map(session => {
              const isActive = activeSessionId === session.id;
              const isEditing = editingSessionId === session.id;
              
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveSessionId(session.id);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between group p-3 rounded-xl cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-primary/10 border-primary/20 text-primary dark:text-primary-light font-bold' 
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-350'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-950 border border-primary text-xs py-0.5 px-1.5 rounded w-full focus:outline-none text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <span className="text-xs truncate">{session.title}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0 ml-1.5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveRenameSession(session.id, e)}
                          className="p-1 hover:text-emerald-500 rounded transition-colors text-slate-700 dark:text-slate-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => cancelRename(e)}
                          className="p-1 hover:text-rose-500 rounded transition-colors text-slate-700 dark:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRenameSession(session, e)}
                          className="p-1 hover:text-primary rounded opacity-0 group-hover:opacity-100 lg:opacity-50 transition-opacity text-slate-605 dark:text-slate-400"
                          title="Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 lg:opacity-50 transition-opacity text-slate-605 dark:text-slate-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-955/20">
          User: <span className="font-bold text-slate-900 dark:text-slate-200">{user?.name || 'Developer'}</span>
        </div>

      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 bg-slate-950/40 z-35 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950/10 min-w-0">
        
        {/* Chat Area Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
          <div className="flex items-center space-x-3 min-w-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-855 rounded-lg lg:hidden text-slate-600 cursor-pointer"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-md">
              AI
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                {activeSessionId 
                  ? sessions.find(s => s.id === activeSessionId)?.title || "CareerAI Chat" 
                  : "Select a Session"}
              </h4>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-500 font-bold flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active RAG Context</span>
              </span>
            </div>
          </div>
        </div>

        {/* Messages Log Panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/10 dark:bg-slate-950/5">
          {isMessagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Loading conversation history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Welcome to CareerAI Navigator!</h3>
              <p className="text-[11px] text-slate-655 dark:text-slate-400 leading-relaxed">
                Ask questions about technical skill roadmaps, missing skills, certification requirements, or tips to format your resume.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    
                    {/* Icon */}
                    <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isBot 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-accent/15 text-accent border border-accent/20'
                    }`}>
                      {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat bubble */}
                    <div className={`p-4 rounded-2xl text-xs leading-normal shadow-sm border ${
                      isBot 
                        ? 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm' 
                        : 'bg-primary border-primary/20 text-white rounded-tr-sm'
                    }`}>
                      
                      {/* Dynamic Markdown & Table parser content */}
                      {isBot ? renderMarkdown(msg.content) : <p className="whitespace-pre-line">{msg.content}</p>}
                      
                      <span className={`text-[8px] mt-2 block text-right font-semibold opacity-60 ${isBot ? 'text-slate-600 dark:text-slate-400' : 'text-slate-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* Bot Typing message state */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-8.5 h-8.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-sm flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Contextual AI reasoning...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Queries Chips */}
        {messages.length < 5 && (
          <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800/60 flex flex-wrap gap-2 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto select-none">
            {quickQueries.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary dark:hover:border-primary-light hover:text-primary transition-all duration-300 whitespace-nowrap cursor-pointer shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-3 bg-white/40 dark:bg-slate-955/20 backdrop-blur-md w-full"
        >
          {/* File Input and Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt"
          />
          <button
            type="button"
            disabled={activeSessionId === null || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Attach Document (PDF, DOCX, TXT)"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            placeholder={activeSessionId ? "Ask AI Navigator or type questions referencing your uploaded documents..." : "Select a session from the sidebar to chat"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={activeSessionId === null || isUploading}
            className="form-input text-xs flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || activeSessionId === null || isUploading}
            className="btn-primary p-3 rounded-xl flex items-center justify-center shadow-lg hover:shadow-primary/30 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};

export default ChatbotPage;

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { motion } from 'framer-motion';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: Date;
}

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'there'}! I am your CareerAI Navigator assistant. I can recommend career pathways based on your skill vector, identify skill gaps, and suggest certifications. Ask me something or click a helper chip below!`,
      time: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await aiService.chat(textToSend);

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: botResponse,
        time: new Date()
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "I encountered an error connecting to my AI core. Please ensure your backend server is running.",
        time: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQueries = [
    "Which career suits me?",
    "What skills should I learn?",
    "How can I improve my profile?"
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Career Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Chat with our contextual AI engine for resume tips, learning paths, and suitability results
        </p>
      </div>

      <div className="glass-card flex flex-col h-[650px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800/40">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center space-x-3 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            AI
          </div>
          <div>
            <h4 className="font-extrabold text-xs">Navigator Bot</h4>
            <span className="text-[9px] text-emerald-500 font-bold flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online & Contextual</span>
            </span>
          </div>
        </div>

        {/* Message Logs Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
          {messages.map((msg, idx) => {
            const isBot = msg.sender === 'bot';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start space-x-2.5 max-w-[80%] ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  
                  {/* Bubble icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isBot 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-accent/15 text-accent'
                  }`}>
                    {isBot ? <Sparkles className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* Message Bubble Text */}
                  <div className={`p-3.5 rounded-2xl text-xs leading-normal shadow-sm ${
                    isBot 
                      ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-750 dark:text-slate-200 rounded-tl-sm' 
                      : 'bg-primary text-white rounded-tr-sm'
                  }`}>
                    {/* Preserve linebreaks formatting */}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`text-[8px] mt-1.5 block text-right opacity-50 ${isBot ? 'text-slate-400' : 'text-slate-100'}`}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2.5 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-tl-sm flex items-center space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-[10px] text-slate-400">Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick query chips */}
        <div className="px-6 py-2.5 border-t border-slate-100 dark:border-slate-850/60 flex flex-wrap gap-2 bg-white/20 dark:bg-slate-950/10">
          {quickQueries.map(q => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary dark:hover:border-primary-light hover:text-primary transition-all duration-300"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center space-x-3 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md"
        >
          <input
            type="text"
            placeholder="Type your question here (e.g. Which career suits me?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="form-input text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary p-3 rounded-xl flex items-center justify-center shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>

    </div>
  );
};

export default ChatbotPage;

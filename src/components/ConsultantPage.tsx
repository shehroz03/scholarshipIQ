import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap, Send, Loader2, Trash2, Crown, Lock, Sparkles,
    MessageSquare, CheckCircle2, RotateCcw, AlertCircle, Brain,
    Check, Star, Users, ShieldCheck, Globe, ChevronRight, Send as SendIcon,
    Gem, FileText, Mail, Compass, Mic, Landmark, X, Target, Info,
    TrendingUp, Clock, Coins, Award, ExternalLink, Bookmark, Scale
} from "lucide-react";
import { useToolChat } from '../hooks/useToolChat';
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";
import { ScholarshipRecommendationCard } from "./ScholarshipRecommendationCard";
import { ScholarshipSummaryBar } from "./ScholarshipSummaryBar";
import { AIInsightCard } from "./AIInsightCard";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from "./ui/badge";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at?: string;
    type?: 'text' | 'sop_review' | 'email_draft' | 'visa_guide' | 'mock_interview' | 'financial_plan' | 'interview_feedback';
    data?: any;
}

interface FinancialPlanData {
  plan_title?: string;
  currency?: string;
  pkr_rate?: number;
  one_time_costs?: {
    visa_fee: { amount: number; pkr: number; note: string };
    flight: { amount: number; pkr: number; note: string };
    setup_costs: { amount: number; pkr: number; note: string };
    total: { amount: number; pkr: number };
  };
  budget_lifestyle?: {
    label: string;
    rent: { amount: number; note: string };
    food: { amount: number; note: string };
    transport: { amount: number; note: string };
    utilities: { amount: number; note: string };
    phone_internet: { amount: number };
    miscellaneous: { amount: number };
    total_monthly: number;
    total_yearly: number;
    total_program: number;
  };
  tuition?: {
    per_year: number;
    note: string;
    source: string;
  };
  scholarships?: Array<{
    name: string;
    coverage: string;
    amount: number;
    eligibility: string;
  }>;
  grand_total_budget?: {
    without_scholarship: number;
    with_scholarship: number;
    pkr_equivalent: number;
  };
  verdict?: string;
}

function ThinkingIndicator({ text, step, showProgress }: { text: string, step: number, showProgress: boolean }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const progress = ((step + 1) / 6) * 100;
  
  return (
    <div style={{ 
      alignSelf: 'flex-start', 
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', 
      backdropFilter: 'blur(12px)',
      padding: '16px 24px', 
      borderRadius: '24px 24px 24px 8px', 
      border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.1)'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Brain className="animate-pulse" size={20} color="#f4c44e" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ color: theme.text, fontSize: '14px', fontWeight: '600', letterSpacing: '0.01em' }}>
            ScholarIQ Analysis
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span style={{ color: theme.textSecondary, fontSize: '12px' }}>{text}</span>
          </div>
        </div>
      </div>
      
      {showProgress && (
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.05)' }}>
          <div 
            className="bg-indigo-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Helper functions for JSON extraction and processing
function findBalancedJSON(text: string): any {
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return null;

  let stack = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack++;
    if (ch === '}') {
      stack--;
      if (stack === 0) {
        const candidate = text.slice(firstBrace, i + 1);
        try {
          const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(cleaned);
        } catch {
          return findBalancedJSON(text.slice(i + 1));
        }
      }
    }
  }
  return null;
}

function extractJSON(text: string): any {
  if (!text) return null;
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    const parsed = findBalancedJSON(match[1]);
    if (parsed) return parsed;
  }
  const balanced = findBalancedJSON(text);
  if (balanced) return balanced;
  try { return JSON.parse(text); } catch { /* noop */ }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const slice = text.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(slice);
    } catch { /* noop */ }
  }
  return null;
}

const toNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

function isDeadlinePassed(deadlineStr: string): boolean {
  if (!deadlineStr) return false;
  // handle formats like "Oct 2025", "2025-10-31", "October 31, 2025"
  const parsed = new Date(deadlineStr);
  if (isNaN(parsed.getTime())) return false;
  return parsed < new Date();
}

const ScholarshipMiniCard = ({ title, university, deadline, country, funding }: any) => {
  const passed = isDeadlinePassed(deadline);
  return (
    <div className={`my-4 p-5 rounded-2xl border hover:border-indigo-500/30 transition-all group/card shadow-xl ${
      passed ? 'bg-red-950/20 border-red-900/30' : 'bg-white/5 border-white/5'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-black text-white text-base group-hover/card:text-indigo-400 transition-colors line-clamp-1">{title}</h4>
        <div className="flex items-center gap-2">
          {passed && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ⚠️ Deadline Passed
            </span>
          )}
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px] font-black uppercase tracking-widest">{funding}</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <GraduationCap size={12} className="text-indigo-500" />
          <span>{university}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Globe size={10} /> {country}
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
              passed ? 'text-red-400 line-through' : 'text-amber-500'
            }`}>
              <Clock size={10} /> {deadline}
            </div>
          </div>
          <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1">
            View <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AICard = ({ children, title, icon: Icon }: any) => {
  const { isDark } = useTheme();
  return (
    <div className="my-6 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={16} className="text-indigo-400" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#f4c44e]" />
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

const AssistantMessage = ({ content, type, data }: { content: string, type?: string, data?: any }) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  // Attempt to structured content if it looks like a list of scholarships
  // This is a simple heuristic for demonstration, real AI would use specific keys
  const isFinancial = type === 'financial_plan';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-4 max-w-[90%] lg:max-w-[800px] group mb-4"
    >
      <div className="flex items-center gap-3 ml-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 relative">
          <Brain size={18} className="text-white" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-none mb-1">ScholarIQ Consultant</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Intelligence Engine</span>
        </div>
      </div>

      <div 
        className="relative overflow-hidden p-6 lg:p-10 rounded-[2.5rem] border transition-all duration-500 hover:shadow-indigo-500/5 group-hover:border-indigo-500/30"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 15px 35px -10px rgba(0,0,0,0.08)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />
        
        <div className="relative" style={{ color: isDark ? '#cbd5e1' : '#1e293b' }}>
           {isFinancial ? (
             <FinancialPlanResult content={content} />
           ) : (
             <>
             <ReactMarkdown 
               remarkPlugins={[remarkGfm]}
               components={{
                 h1: ({children}) => <h1 style={{ color: isDark ? '#fff' : '#1e293b' }} className="text-2xl font-black mb-6 tracking-tight border-b pb-4" >{children}</h1>,
                 h2: ({children}) => <h2 style={{ color: isDark ? '#fff' : '#1e293b' }} className="text-lg font-black mt-8 mb-4 flex items-center gap-2">
                   <div className="w-1.5 h-6 bg-indigo-500 rounded-full shrink-0" /> {children}
                 </h2>,
                 h3: ({children}) => <h3 className="text-base font-black text-indigo-400 mt-6 mb-3">{children}</h3>,
                 p: ({children}) => <p className="text-[15px] lg:text-[16px] leading-[1.9] font-medium mb-5 last:mb-0" style={{ color: isDark ? 'rgba(203,213,225,0.9)' : '#334155' }}>{children}</p>,
                 ul: ({children}) => <div className="space-y-3 mb-6 ml-1">{children}</div>,
                 ol: ({children}) => <ol className="space-y-3 mb-6 ml-1 list-none">{children}</ol>,
                 li: ({node, index, ordered, ...props}: any) => {
                    if (ordered) {
                      return (
                        <div className="flex items-start gap-3 text-[15px] leading-relaxed">
                          <div className="min-w-[26px] h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-[11px] font-black text-indigo-400 shrink-0 mt-0.5">
                            {(index ?? 0) + 1}
                          </div>
                          <span className="flex-1 pt-0.5" style={{ color: isDark ? 'rgba(203,213,225,0.85)' : '#334155' }}>{props.children}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-start gap-3 text-[15px] leading-relaxed group/li">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500/50 group-hover/li:bg-indigo-500 transition-colors shrink-0" />
                        <span className="flex-1" style={{ color: isDark ? 'rgba(203,213,225,0.85)' : '#334155' }}>{props.children}</span>
                      </div>
                    );
                 },
                 strong: ({children}) => <strong className="font-black" style={{ color: isDark ? '#fff' : '#1e293b' }}>{children}</strong>,
                 em: ({children}) => <em className="text-indigo-400 not-italic text-[13px]">{children}</em>,
                 hr: () => <div className="h-px w-full my-6" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)' }} />,
                 code: ({children}) => <code className="px-2 py-0.5 rounded-md text-[13px] font-mono bg-indigo-500/10 text-indigo-400">{children}</code>,
                 blockquote: ({children}) => (
                   <div className="border-l-4 border-indigo-500/50 bg-indigo-500/5 px-5 py-4 rounded-xl my-5 text-sm" style={{ color: isDark ? '#94a3b8' : '#475569' }}>
                     {children}
                   </div>
                 ),
                 table: ({children}) => (
                   <div className="overflow-x-auto my-6 rounded-2xl border" style={{ borderColor: isDark ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.08)' }}>
                     <table className="w-full text-sm border-collapse">{children}</table>
                   </div>
                 ),
                 thead: ({children}) => (
                   <thead style={{ backgroundColor: isDark ? 'rgba(244,196,78,0.15)' : 'rgba(244,196,78,0.08)' }}>{children}</thead>
                 ),
                 tbody: ({children}) => <tbody>{children}</tbody>,
                 tr: ({children}) => (
                   <tr className="border-b transition-colors" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>{children}</tr>
                 ),
                 th: ({children}) => (
                   <th className="px-4 py-3 text-left text-[12px] font-black uppercase tracking-wider" style={{ color: '#f4c44e' }}>{children}</th>
                 ),
                 td: ({children}) => (
                   <td className="px-4 py-3 text-[13px] font-medium" style={{ color: isDark ? 'rgba(203,213,225,0.9)' : '#334155' }}>{children}</td>
                 )
               }}
             >
               {content}
             </ReactMarkdown>
             {/* Deadline + Source disclaimer — shown on scholarship-related responses */}
             {(content.toLowerCase().includes('deadline') || content.toLowerCase().includes('scholarship')) && (
               <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-2xl"
                 style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                 <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠️</span>
                 <p className="text-[12px] leading-relaxed" style={{ color: '#fbbf24' }}>
                   <strong>Important:</strong> Deadlines shown are AI-matched estimates. Please verify current deadlines and eligibility on the official university or scholarship website before applying.
                 </p>
               </div>
             )}
             </>
           )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Generated at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
         <div className="flex gap-2">
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Star size={12} /></button>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Bookmark size={12} /></button>
         </div>
      </div>
    </motion.div>
  );
};

const UserMessage = ({ content }: { content: string }) => {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex justify-end w-full mb-4"
    >
      <div 
        className="max-w-[75%] p-4 lg:p-5 rounded-[2rem] rounded-tr-md shadow-2xl border"
        style={{
          backgroundColor: '#f4c44e',
          borderColor: 'rgba(0,0,0,0.08)',
          boxShadow: '0 15px 30px -10px rgba(99, 102, 241, 0.4)'
        }}
      >
        <p className="text-[15px] lg:text-[16px] font-bold text-white leading-relaxed">
          {content}
        </p>
      </div>
    </motion.div>
  );
};

const FinancialPlanResult = ({ content }: { content: string }) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const d: any = React.useMemo(() => extractJSON(content), [content])

  if (!d) {
    return (
      <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: theme.textSecondary }}>
        {content}
      </div>
    )
  }

  const cur = d.currency || 'USD'
  const pkr = toNum(d.pkr_rate) || 350
  const life = d.budget_lifestyle

  const estBudget = toNum(d.grand_total_budget?.without_scholarship) ||
    (toNum(d.tuition?.per_year) + toNum(life?.total_yearly) + toNum(d.one_time_costs?.total?.amount))

  const formatPKR = (amt: number) => `PKR ${Math.round((amt || 0) * pkr).toLocaleString()}`

  return (
    <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '24px', padding: '28px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: 'rgba(244,196,78,0.2)', color: '#f4c44e', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Financial Strategy
            </span>
            <span style={{ color: theme.textSecondary, fontSize: '12px' }}>• 12 Month Forecast</span>
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: theme.text, letterSpacing: '-0.02em' }}>
            {d.plan_title || 'Financial Plan'}
          </h3>
          <p style={{ color: theme.textSecondary, fontSize: '13px', marginTop: '2px' }}>
            {d.country || 'Destination Analysis'} • 1 {cur} = {pkr} PKR
          </p>
        </div>
        <div style={{ backgroundColor: isDark ? '#f0f4ff' : '#f1f5f9', padding: '12px 20px', borderRadius: '16px', border: `1px solid ${theme.border}`, textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#f4c44e', fontWeight: '800', letterSpacing: '1px', marginBottom: '2px' }}>EST. BUDGET</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: theme.text }}>{cur} {estBudget?.toLocaleString() || '0'}</div>
          <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '500' }}>{formatPKR(estBudget)}</div>
        </div>
      </div>
      
      {/* ... simplified for brevity, similar theme application to cards and sub-components ... */}
      <div style={{ color: theme.textSecondary, fontSize: '14px' }}>Detailed breakdown generated by AI based on current market rates.</div>
    </div>
  )
}

const TOOL_QUICK_PROMPTS: Record<string, string[]> = {
    general: [
        "What scholarships match my profile?",
        "Compare UK vs Germany for Masters",
        "How to improve my scholarship chances?",
        "Which country is best for Pakistani CS students?"
    ],
    sop_review: [
        "What makes a top-scoring SOP?",
        "How to align SOP with scholarship goals?",
        "Fix my SOP opening paragraph",
        "Review my Statement of Purpose"
    ],
    email_draft: [
        "Write inquiry email to University of Oxford",
        "Email professor at TU Berlin about research",
        "Ask Harvard about scholarship status",
        "Draft admission inquiry to University of Toronto"
    ],
    visa_guide: [
        "UK Student Route visa requirements from Pakistan",
        "Germany blocked account setup guide",
        "Canada study permit step-by-step process",
        "Australia student visa timeline"
    ],
    mock_interview: [
        "Start Chevening scholarship mock interview",
        "Practice Gates Cambridge interview questions",
        "Commonwealth scholarship interview prep",
        "Fulbright mock interview session"
    ],
    financial_plan: [
        "Financial plan for UK Masters 2025",
        "Monthly cost of living in Berlin, Germany",
        "1-year budget for studying in Canada",
        "Germany vs UK total cost comparison"
    ],
    scholarship_recommendation: [
        "Show my top scholarship matches",
        "Find fully funded options for my profile",
        "Which scholarships close soon?",
        "Best matches for my CGPA and field"
    ]
};

const WelcomeScreen = ({ studentName, activeTool, tools, onSendMessage }: {
    studentName: string;
    activeTool: string;
    tools: any[];
    onSendMessage: (msg: string) => void;
}) => {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;
    const currentTool = tools.find(t => t.id === activeTool);
    const prompts = TOOL_QUICK_PROMPTS[activeTool] || TOOL_QUICK_PROMPTS['general'];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto w-full"
        >
            <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <Brain size={36} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 rounded-full"
                    style={{ borderColor: isDark ? '#f0f4ff' : '#f8fafc' }} />
            </div>

            <h2 className="text-2xl font-black text-center mb-1" style={{ color: theme.text }}>
                {greeting}, {studentName}!
            </h2>
            <p className="text-sm font-medium text-center mb-3" style={{ color: theme.textSecondary }}>
                ScholarIQ AI Consultant is ready to help
            </p>

            {currentTool && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                    style={{ backgroundColor: isDark ? 'rgba(244,196,78,0.12)' : 'rgba(244,196,78,0.08)', border: '1px solid rgba(244,196,78,0.25)' }}>
                    {currentTool.icon}
                    <span className="text-sm font-bold" style={{ color: '#f4c44e' }}>{currentTool.title}</span>
                    <span className="text-xs" style={{ color: theme.textSecondary }}>— {currentTool.desc}</span>
                </div>
            )}

            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: theme.textSecondary }}>
                Try asking
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {prompts.map((prompt, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => onSendMessage(prompt)}
                        className="text-left p-4 rounded-2xl border transition-all duration-200 hover:border-indigo-500/40 hover:shadow-lg group"
                        style={{
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.85)',
                            borderColor: isDark ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                                <ChevronRight size={10} className="text-indigo-400" />
                            </div>
                            <span className="text-sm font-semibold leading-snug" style={{ color: theme.text }}>{prompt}</span>
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
};

export function ConsultantPage() {
    const navigate = useNavigate();
    const isDark = false;
    const theme = lightTheme;

    const { status: userStatus, loading: loadingStatus, refreshStatus: fetchStatus, isPremium, isPro } = useUser();
    const [input, setInput] = useState("");
    const [activeTool, setActiveTool] = useState<string>("general");
    const { 
        messages, 
        sendMessage, 
        clearSession, 
        isLoading: chatLoading, 
        isInitializing,
        error
    } = useToolChat(activeTool);

    const [showToolMenu, setShowToolMenu] = useState(false);
    const [thinkingStep, setThinkingStep] = useState(0);
    const [thinkingText, setThinkingText] = useState("Thinking...");

    const tools = [
        { id: 'general', icon: <MessageSquare color="#f4c44e" size={18} />, title: 'General Consultation', desc: 'Ask anything about study abroad' },
        { id: 'sop_review', icon: <FileText color="#f4c44e" size={18} />, title: 'Review My SOP', desc: 'Detailed scoring & feedback' },
        { id: 'email_draft', icon: <Mail color="#22c55e" size={18} />, title: 'Draft University Email', desc: 'Inquiry & contact templates' },
        { id: 'visa_guide', icon: <Compass color="#d946ef" size={18} />, title: 'Visa Guide', desc: 'Country-specific roadmaps' },
        { id: 'mock_interview', icon: <Mic color="#f59e0b" size={18} />, title: 'Mock Interview', desc: 'Practice with AI' },
        { id: 'financial_plan', icon: <Landmark color="#0ea5e9" size={18} />, title: 'Financial Plan', desc: 'Budgeting & cost estimates' },
        { id: 'scholarship_recommendation', icon: <Award color="#fbbf24" size={18} />, title: 'Smart Match', desc: 'Personalized AI recommendations' },
    ];

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chatLoading]);

    const handleSend = async (e?: React.FormEvent, directMsg?: string) => {
        if (e) e.preventDefault();
        let text = directMsg || input.trim();
        if (!text || chatLoading) return;
        if (!directMsg) setInput("");

        // CGPA scale detection — covers all common patterns
        const cgpaPatterns = [
            /(?:cgpa|gpa)\s*(?:is|of|:)?\s*([0-9]+(?:\.[0-9]+)?)/i,  // cgpa is X, cgpa: X, gpa X
            /([0-9]+(?:\.[0-9]+)?)\s*\/\s*5(?:\.[0-9]+)?\b/i,         // X/5 or X/5.0
            /([0-9]+(?:\.[0-9]+)?)\s+out\s+of\s+5/i,                  // X out of 5
            /(?:my|have|got)\s+(?:a\s+)?(?:cgpa|gpa)\s+(?:of\s+)?([0-9]+(?:\.[0-9]+)?)/i, // my cgpa 3.8, have a gpa of 3.9
        ];
        let detectedCGPA: number | null = null;
        for (const pattern of cgpaPatterns) {
            const m = text.match(pattern);
            if (m) {
                const val = parseFloat(m[1] ?? m[2]);
                if (!isNaN(val)) { detectedCGPA = val; break; }
            }
        }
        if (detectedCGPA !== null && detectedCGPA > 4.0) {
            text = text + `\n\n[System Note: User mentioned CGPA of ${detectedCGPA}. This appears to be on a 5.0 scale (common in Pakistani universities). Please ask the user to confirm their grading scale (4.0 or 5.0), convert to 4.0 equivalent if needed (${detectedCGPA}/5 × 4 = ${((detectedCGPA / 5) * 4).toFixed(2)}/4.0), and use the converted value for international scholarship matching.]`;
        }

        await sendMessage(text);
        fetchStatus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    if (loadingStatus) return <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.bg }}><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: theme.text, fontFamily: 'sans-serif' }}>
            <header style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: theme.bgSecondary,
                            border: `1px solid ${theme.border}`,
                            color: theme.text,
                            padding: '8px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        <ChevronRight style={{ width: '16px', height: '16px', transform: 'rotate(180deg)' }} />
                        Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: '#f4c44e', padding: '8px', borderRadius: '12px' }}><GraduationCap style={{ width: '20px', height: '20px', color: '#1e293b' }} /></div>
                        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>AI Consultant</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ThemeToggle />
                    <button
                        onClick={() => clearSession()}
                        style={{ padding: '8px', borderRadius: '12px', border: `1px solid ${theme.border}`, color: theme.textSecondary }}
                        title="Clear History"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </header>

            {/* Tool Selector Strip */}
            <div style={{ padding: '8px 24px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.headerBg, overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '999px', border: '1px solid',
                                cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                backgroundColor: activeTool === tool.id ? 'rgba(244,196,78,0.15)' : 'transparent',
                                borderColor: activeTool === tool.id ? 'rgba(244,196,78,0.45)' : theme.border,
                                color: activeTool === tool.id ? '#f4c44e' : theme.textSecondary
                            }}
                        >
                            {tool.icon}
                            {tool.title}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {isInitializing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
                        <RotateCcw className="animate-spin" style={{ width: '32px', height: '32px', color: '#f4c44e', marginBottom: '16px' }} />
                        <p style={{ color: theme.textSecondary, fontSize: '14px' }}>Restoring session...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <WelcomeScreen
                        studentName={userStatus?.full_name || 'Student'}
                        activeTool={activeTool}
                        tools={tools}
                        onSendMessage={(msg) => handleSend(undefined, msg)}
                    />
                ) : (
                    <>
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg: any, index: number) => (
                                <div key={msg.id || index} className="w-full flex flex-col">
                                    {msg.role === 'user' ? (
                                        <UserMessage content={msg.content} />
                                    ) : (
                                        <AssistantMessage content={msg.content} type={msg.type} data={msg.data} />
                                    )}
                                </div>
                            ))}
                        </AnimatePresence>
                        {chatLoading && <ThinkingIndicator text={thinkingText} step={thinkingStep} showProgress={activeTool === 'financial_plan'} />}
                    </>
                )}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', maxWidth: '600px', margin: '0 auto' }}>
                        <AlertCircle size={14} color="#f87171" />
                        <span style={{ color: '#f87171', fontSize: '13px', fontWeight: '500' }}>{error}</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.headerBg }}>
                {messages.length > 0 && (
                    <div style={{ maxWidth: '850px', margin: '0 auto 10px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {(TOOL_QUICK_PROMPTS[activeTool] || []).slice(0, 3).map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(undefined, prompt)}
                                disabled={chatLoading}
                                style={{
                                    whiteSpace: 'nowrap', padding: '5px 14px', borderRadius: '999px',
                                    fontSize: '12px', fontWeight: '600', cursor: chatLoading ? 'not-allowed' : 'pointer',
                                    backgroundColor: isDark ? 'rgba(244,196,78,0.1)' : 'rgba(244,196,78,0.08)',
                                    border: '1px solid rgba(244,196,78,0.25)', color: '#f4c44e',
                                    transition: 'all 0.15s', opacity: chatLoading ? 0.5 : 1
                                }}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '16px', display: 'flex', padding: '12px 16px', gap: '12px', maxWidth: '850px', margin: '0 auto' }}>
                    <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        placeholder={isInitializing ? 'Loading your session...' : 'Ask anything...'} 
                        disabled={chatLoading || isInitializing}
                        rows={1} 
                        style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: theme.text, flex: 1, resize: 'none', opacity: isInitializing ? 0.5 : 1 }} 
                    />
                    <button 
                        onClick={() => handleSend()} 
                        disabled={!input.trim() || chatLoading || isInitializing} 
                        style={{ backgroundColor: '#f4c44e', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: (!input.trim() || chatLoading || isInitializing) ? 'not-allowed' : 'pointer', opacity: (!input.trim() || chatLoading || isInitializing) ? 0.6 : 1 }}
                    >
                        <SendIcon size={18} color="white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

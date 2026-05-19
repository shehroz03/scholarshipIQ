import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  Search,
  MessageSquare,
  Clock,
  ChevronRight,
  Printer
} from 'lucide-react';
import { api } from '../../api';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Sidebar } from '../Sidebar';

interface ChecklistItem {
  id: number;
  document_key: string;
  title: string;
  status: 'ready' | 'missing' | 'optional' | 'verify';
  reason: string;
  action_hint: string;
}

interface ChecklistData {
  id: number;
  readiness_score: number;
  status_summary: string;
  generated_at: string;
  items: ChecklistItem[];
}

const VisaChecklistResultPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: loadingUser } = useUser();
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const history = await api.request('/visa/plans/history');
        const current = history.find((c: any) => c.id === parseInt(id || '0'));
        if (current) setData(current);
        else throw new Error('Checklist not found');
      } catch (error) {
        toast.error('Failed to load checklist');
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [id]);

  const glassCardStyle = { 
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(30px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'ready': return <CheckCircle2 className="text-emerald-400" size={20} />;
      case 'missing': return <XCircle className="text-red-400" size={20} />;
      case 'verify': return <AlertTriangle className="text-amber-400" size={20} />;
      default: return <Info className="text-slate-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'missing': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'verify': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-white/10';
    }
  };

  if (loadingUser || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Analyzing Strategy</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen flex w-full overflow-hidden bg-[#020617] text-white">
      {/* Sidebar Wrapper */}
      <div className="hidden lg:block shrink-0 relative z-50" style={{ width: '260px' }}>
        <Sidebar onNavigate={(p) => navigate(`/${p}`)} currentPage="visa" />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Elite Header */}
        <header className="h-20 border-b flex items-center justify-between px-10 backdrop-blur-2xl shrink-0 z-40" style={{ 
          backgroundColor: 'rgba(2, 6, 23, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.08)' 
        }}>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/visa')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-0.5">
              <h2 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
                AI <span className="text-indigo-500">Strategy</span> Report
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Report ID: {data.id}</span>
                <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                <span className="text-[8px] font-black text-indigo-500/50 uppercase tracking-[0.4em]">Verified</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" onClick={() => window.print()} className="rounded-2xl border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-widest px-6 hover:bg-white/10 gap-2">
               <Printer size={14} /> Print Report
             </Button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 relative">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -z-10" />
          
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Score Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <Card className="lg:col-span-2 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-12 border-none relative overflow-hidden" style={glassCardStyle}>
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Sparkles size={120} className="text-indigo-400" />
                 </div>
                 <div className="relative w-44 h-44 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <motion.circle 
                        initial={{ strokeDashoffset: 502 }}
                        animate={{ strokeDashoffset: 502 - (502 * data.readiness_score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="88" cy="88" r="80" fill="none" 
                        stroke="url(#scoreGradient)" strokeWidth="12" 
                        strokeDasharray="502" strokeLinecap="round" 
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white italic leading-none">{data.readiness_score}%</span>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Ready</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                     AI Insights Active
                   </div>
                   <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
                     Readiness <span className="text-indigo-500">Analysis</span>
                   </h1>
                   <p className="text-slate-400 font-bold text-lg leading-relaxed max-w-md">
                     {data.status_summary}
                   </p>
                 </div>
              </Card>

              <Card className="rounded-[3rem] p-10 border-none flex flex-col justify-between relative overflow-hidden" style={glassCardStyle}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Clock className="text-indigo-400" size={24} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Deadline</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-white">45 Days</p>
                    <p className="text-xs font-bold text-slate-400">Estimated submission window</p>
                  </div>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                  <Calendar size={16} /> Add to Calendar
                </Button>
              </Card>
            </motion.div>

            {/* Document Checklist */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-400" size={24} />
                  <h3 className="text-xl font-black uppercase tracking-widest text-white italic">Strategic Checklist</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sort by Status</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {data.items.sort((a, b) => a.status === 'missing' ? -1 : 1).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-[2rem] p-8 border-none flex flex-col md:flex-row items-start md:items-center gap-8 group hover:bg-white/[0.05] transition-all" style={glassCardStyle}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                           <h4 className="text-lg font-black text-white">{item.title}</h4>
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                             {item.status}
                           </span>
                        </div>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed italic">
                          "{item.reason}"
                        </p>
                        {item.action_hint && (
                          <div className="flex items-center gap-2 pt-1">
                            <Sparkles size={12} className="text-indigo-400" />
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">AI Tip: {item.action_hint}</span>
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" className="h-12 px-6 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 font-black uppercase text-[10px] tracking-widest gap-2">
                         Fix Issue <ChevronRight size={14} />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Assistant CTA */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-12 rounded-[4rem] bg-gradient-to-br from-indigo-600 to-blue-800 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl shadow-indigo-900/40 relative overflow-hidden group"
            >
               <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:scale-110 transition-transform duration-1000">
                  <ShieldCheck size={300} className="text-white" />
               </div>
               <div className="space-y-4 text-center lg:text-left relative">
                 <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Need Expert <span className="text-indigo-200">Refinement?</span></h2>
                 <p className="text-white/80 font-bold max-w-md text-lg">
                   Connect with our senior consultants or use the AI chat to draft cover letters and SOPs for this specific country.
                 </p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 relative">
                 <Button className="h-16 px-10 rounded-2xl bg-white text-indigo-600 hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest gap-2">
                    <MessageSquare size={16} /> Open Visa AI Chat
                 </Button>
                 <Button className="h-16 px-10 rounded-2xl bg-indigo-500/20 border border-white/20 hover:bg-indigo-500/40 text-white font-black uppercase text-[10px] tracking-widest gap-2 backdrop-blur-xl">
                    <Download size={16} /> Download Bundle
                 </Button>
               </div>
            </motion.div>

          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default VisaChecklistResultPage;

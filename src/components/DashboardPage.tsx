import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Search, 
  Bookmark, 
  TrendingUp, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Zap, 
  Banknote, 
  Sparkles, 
  Lock, 
  ListTodo, 
  Plane, 
  ArrowUpRight, 
  Trophy, 
  Activity, 
  History, 
  Target,
  Loader2,
  CheckCircle2,
  Star,
  Map,
  FileText,
  Bot
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";
import { NotificationBell } from "./NotificationBell";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { Sidebar } from "./Sidebar";
import { SyncingRadar } from "./SyncingRadar";
import { AIScholarshipButton } from "./AIScholarshipButton";

interface Scholarship {
  id: number;
  title: string;
  university_name: string;
  country: string;
  funding_type: string;
  amount: string;
  deadline: string;
  description: string;
  degree_level: string;
  match_score?: number;
  ai_insight?: string;
}

interface SummaryData {
  total_saved: number;
  total_recommended: number;
  profile_completion: number;
  user_name: string;
}

export function DashboardPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const { status: userStatus } = useUser();
  const { isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recommendations, setRecommendations] = useState<Scholarship[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const startTime = Date.now();
      try {
        const [sumData, appsData, recData] = await Promise.all([
          api.dashboard.getSummary().catch(e => { console.error("Summary error", e); return null; }),
          api.applications.list().catch(e => { console.error("Apps error", e); return []; }),
          api.recommendations.list({ limit: 5 }).catch(e => { console.error("Recs error", e); return { top_scholarships: [] }; })
        ]);
        if (sumData) setSummary(sumData);
        
        const savedIds = new Set<number>(appsData.map((a: any) => a.scholarship_id));
        setSavedScholarships(savedIds);
        
        const recs = (recData.top_scholarships || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          university_name: item.university_name || "Unknown University",
          country: item.country || "Global",
          funding_type: item.funding_type || "Funding Varies",
          amount: item.amount || item.funding_type || "Varies",
          deadline: item.deadline || null,
          description: item.short_reason || "Scholarship opportunity identified by AI",
          degree_level: item.degree_level || "Graduate",
          match_score: item.fit_score || 0,
          ai_insight: item.short_reason || "Matching your academic profile perfectly."
        }));
        setRecommendations(recs);
      } catch (err) {
        console.error("Dashboard data fetch failed", err);
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2500 - elapsed);
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };
    fetchInitialData();
  }, []);

  const toggleSave = async (scholarshipId: number) => {
    if (savingIds.has(scholarshipId)) return;

    setSavingIds(prev => new Set(prev).add(scholarshipId));
    const isCurrentlySaved = savedScholarships.has(scholarshipId);
    
    try {
      if (isCurrentlySaved) {
        const apps = await api.applications.list();
        const appToDelete = apps.find((a: any) => a.scholarship_id === scholarshipId);
        if (appToDelete) await api.applications.delete(appToDelete.id);
        setSavedScholarships(prev => {
          const next = new Set(prev);
          next.delete(scholarshipId);
          return next;
        });
      } else {
        await api.applications.save(scholarshipId, "Saved");
        setSavedScholarships(prev => new Set(prev).add(scholarshipId));
      }
    } catch (err) {
      console.error("Toggle save failed", err);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(scholarshipId);
        return next;
      });
    }
  };

  if (isLoading) {
    return <SyncingRadar />;
  }

  const stats = [
    { label: "Pipeline", value: savedScholarships.size, icon: <Target size={22} />, color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
    { label: "Matches", value: summary?.total_recommended || 10, icon: <Star size={22} />, color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
    { label: "Readiness", value: `${summary?.profile_completion || 45}%`, icon: <Zap size={22} />, color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
    { label: "Scholarships", value: summary?.total_recommended || 10, icon: <Trophy size={22} />, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  ];

  const tools = [
    { icon: <Bot size={18} />, label: 'AI Consultant', path: 'consultant', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { icon: <Plane size={18} />, label: 'Visa Guidance', path: 'visa', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { icon: <Map size={18} />, label: 'Uni Matcher', path: 'matcher', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { icon: <FileText size={18} />, label: 'Doc Roadmap', path: 'checklist', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#0f172a',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ width: '260px', flexShrink: 0 }}>
        <Sidebar onNavigate={onNavigate} currentPage="dashboard" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 40
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Dashboard</h1>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Intelligence Hub
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <NotificationBell onNavigate={onNavigate} />
            <CurrencySelector variant="dark" />
            <button 
              onClick={() => onNavigate('search')}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(37,99,235,0.3)'
              }}
            >
              <Search size={16} /> Global Search
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="custom-scrollbar">
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <section style={{
                position: 'relative', overflow: 'hidden', borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '60px 40px', textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
              }}>
                {/* Background ambient glows */}
                <div style={{ position: 'absolute', left: '-10%', top: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
                
                <div style={{ position: 'relative', zIndex: 10 }}>
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', 
                    borderRadius: '100px', padding: '6px 16px', marginBottom: '24px',
                    fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#818cf8',
                    boxShadow: '0 0 20px rgba(99,102,241,0.2)'
                  }}>
                    <Sparkles size={14} color="#818cf8" />
                    WELCOME BACK, {summary?.user_name || 'ATTA'}
                  </div>
                  
                  <h2 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', color: '#fff', letterSpacing: '-0.03em' }}>
                    Your Future <br />
                    <span style={{ 
                      background: 'linear-gradient(to right, #818cf8, #c084fc, #818cf8)', 
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text', color: 'transparent',
                      backgroundSize: '200% auto',
                      animation: 'gradient-shift 4s linear infinite'
                    }}>Architected</span>
                  </h2>
                  <style>{`
                    @keyframes gradient-shift {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                  `}</style>
                  
                  <p style={{ color: 'rgba(165,180,252,0.8)', fontSize: '16px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 40px', fontWeight: 500 }}>
                    Our neural network has identified <strong style={{ color: '#fff', fontWeight: 800 }}>{summary?.total_recommended || 10} high-fidelity matches</strong> based on your latest academic profile telemetry.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <button 
                      onClick={() => onNavigate('search')} 
                      style={{ 
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                        border: 'none', borderRadius: '16px', padding: '16px 32px', 
                        color: '#fff', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', 
                        boxShadow: '0 10px 30px -10px rgba(99,102,241,0.6)', transition: 'all 0.3s' 
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(99,102,241,0.8)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(99,102,241,0.6)'; }}
                    >
                      START HUNTING
                      <ArrowUpRight size={18} />
                    </button>
                    <button 
                      onClick={() => onNavigate('settings')} 
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 32px', 
                        color: '#fff', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', 
                        cursor: 'pointer', transition: 'all 0.3s' 
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                      REFINE PROFILE
                    </button>
                  </div>
                </div>
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {stats.map((stat, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.07]" style={{ boxShadow: `0 10px 40px -10px ${stat.glow}` }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: stat.color, opacity: 0.05, borderRadius: '50%', filter: 'blur(30px)' }} className="transition-opacity group-hover:opacity-15" />
                    <div style={{ width: '48px', height: '48px', background: `${stat.color}15`, color: stat.color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }} className="transition-transform duration-300 group-hover:scale-110">
                      {stat.icon}
                    </div>
                    <p style={{ color: 'white', fontSize: '36px', fontWeight: '800', lineHeight: '1.1' }}>{stat.value}</p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '6px' }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} color="white" /></div>
                    <div>
                      <p style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>AI Curated Picks</p>
                      <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>PERSONALIZED INTELLIGENCE</p>
                    </div>
                  </div>
                  <button onClick={() => onNavigate('search')} style={{ color: '#6366f1', fontSize: '12px', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {recommendations.map((s) => {
                    const isSaved = savedScholarships.has(s.id);
                    const isSaving = savingIds.has(s.id);

                    // Deadline urgency — guard against null/invalid dates
                    const rawDeadline = s.deadline ? new Date(s.deadline) : null;
                    const deadlineDate = rawDeadline && !isNaN(rawDeadline.getTime()) ? rawDeadline : null;
                    const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                    const isExpired = daysLeft !== null && daysLeft < 0;
                    const deadlineUrgency = isExpired ? 'expired' : daysLeft !== null && daysLeft <= 30 ? 'urgent' : daysLeft !== null && daysLeft <= 60 ? 'soon' : 'safe';
                    const deadlineColors = {
                      expired: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', icon: '#f87171', label: 'Expired' },
                      urgent:  { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', text: '#f87171', icon: '#f87171', label: `${daysLeft}d left` },
                      soon:    { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24', icon: '#fbbf24', label: `${daysLeft}d left` },
                      safe:    { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  text: '#34d399', icon: '#34d399', label: daysLeft !== null ? `${daysLeft}d left` : 'Upcoming' },
                    };
                    const dc = deadlineColors[deadlineUrgency];
                    const formattedDeadline = deadlineDate
                      ? deadlineDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Not specified';

                    // Match score color
                    const score = s.match_score ?? 0;
                    const matchColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#6366f1';
                    const matchBg   = score >= 80 ? 'linear-gradient(135deg,#059669,#10b981)' : score >= 60 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#4f46e5,#6366f1)';

                    return (
                      <div key={s.id} className="group" style={{
                        background: isSaved
                          ? 'linear-gradient(160deg, rgba(5,46,22,0.7) 0%, rgba(15,23,42,0.98) 100%)'
                          : 'linear-gradient(160deg, rgba(30,27,75,0.65) 0%, rgba(15,23,42,0.98) 100%)',
                        border: isSaved ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '22px',
                        overflow: 'hidden',
                        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: isSaved
                          ? '0 8px 32px -8px rgba(16,185,129,0.2)'
                          : '0 8px 32px -8px rgba(0,0,0,0.4)',
                      }}>

                        {/* ── Top accent bar ── */}
                        <div style={{ height: '3px', background: isSaved ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#6366f1,#818cf8,#3b82f6)' }} />

                        {/* ── Card Header ── */}
                        <div style={{
                          padding: '16px 20px 14px',
                          background: isSaved
                            ? 'linear-gradient(180deg, rgba(16,185,129,0.07) 0%, transparent 100%)'
                            : 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
                          borderBottom: isSaved ? '1px solid rgba(16,185,129,0.1)' : '1px solid rgba(99,102,241,0.08)',
                        }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {isSaved && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                                  <CheckCircle2 size={9} fill="currentColor" /> Saved
                                </span>
                              )}
                              <h3 className="text-white font-bold leading-snug" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>{s.title}</h3>
                            </div>
                            {/* Match badge with glow */}
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              <span style={{
                                background: matchBg,
                                color: 'white',
                                borderRadius: '10px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: '900',
                                letterSpacing: '0.5px',
                                boxShadow: score >= 80 ? '0 0 16px rgba(16,185,129,0.4)' : score >= 60 ? '0 0 16px rgba(245,158,11,0.4)' : '0 0 16px rgba(99,102,241,0.4)',
                              }}>
                                {score}%
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: matchColor }}>MATCH</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '14px 20px' }}>

                          {/* ── Row 2: Meta chips ── */}
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            <span className="inline-flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-medium">
                              <GraduationCap size={12} className="text-indigo-400 shrink-0" />
                              <span className="truncate max-w-[120px]">{s.university_name}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-medium">
                              <MapPin size={11} className="text-rose-400 shrink-0" />
                              {s.country}
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/25 rounded-lg px-2.5 py-1 text-[11px] text-indigo-300 font-bold">
                              {s.degree_level}
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 rounded-lg px-2.5 py-1 text-[11px] text-violet-300 font-bold">
                              {s.funding_type}
                            </span>
                          </div>

                          {/* ── Row 3: AI Insight ── */}
                          <div className="relative rounded-xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.07) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'linear-gradient(180deg,#6366f1,#3b82f6)' }} />
                            <div className="px-4 py-3">
                              <p className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
                                <Sparkles size={11} className="text-indigo-400" /> AI Insight
                              </p>
                              <p className="text-slate-300 text-[12px] leading-relaxed line-clamp-2">
                                {s.ai_insight || s.description}
                              </p>
                            </div>
                          </div>

                          {/* ── AI Action Guide button ── */}
                          <div className="mb-4">
                            <AIScholarshipButton
                              scholarship={{
                                id: s.id,
                                title: s.title,
                                university_name: s.university_name,
                                country: s.country,
                                amount: s.amount,
                                deadline: s.deadline ?? undefined,
                                degree_level: s.degree_level,
                                funding_type: s.funding_type,
                              }}
                              variant="dark"
                            />
                          </div>

                          {/* ── Row 4: Funding + Deadline pills ── */}
                          <div className="flex items-center gap-3 flex-wrap mb-4">
                            {/* Funding Amount */}
                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex-1 min-w-[130px]">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Banknote size={13} className="text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">Funding</p>
                                <p className="text-white text-[12px] font-bold leading-tight">{convertAndFormat(s.amount) || 'Varies'}</p>
                              </div>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[130px]" style={{ background: dc.bg, border: `1px solid ${dc.border}` }}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${dc.bg}` }}>
                                <Clock size={13} style={{ color: dc.icon }} />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: dc.text }}>
                                  Deadline · {dc.label}
                                </p>
                                <p className="text-white text-[12px] font-bold leading-tight">{formattedDeadline}</p>
                              </div>
                            </div>
                          </div>

                          {/* ── Row 5: Action buttons ── */}
                          <div className="flex gap-2.5 items-center">
                            {/* Save / Saved button */}
                            <button
                              onClick={() => toggleSave(s.id)}
                              disabled={isSaving}
                              className="flex items-center gap-2 rounded-xl font-bold transition-all"
                              style={{
                                flexShrink: 0,
                                height: '42px',
                                padding: '0 16px',
                                fontSize: '12px',
                                background: isSaving
                                  ? 'rgba(255,255,255,0.05)'
                                  : isSaved
                                    ? 'linear-gradient(135deg,#059669,#10b981)'
                                    : 'rgba(255,255,255,0.06)',
                                border: isSaved ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                color: isSaved ? 'white' : '#94a3b8',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.6 : 1,
                                letterSpacing: '0.4px',
                              }}
                              title={isSaved ? "Remove from Saved" : "Save Scholarship"}
                            >
                              {isSaving ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : isSaved ? (
                                <><Bookmark size={15} fill="white" /><span>Saved</span></>
                              ) : (
                                <><Bookmark size={15} /><span>Save</span></>
                              )}
                            </button>

                            {/* Access Portal */}
                            <button
                              onClick={() => onNavigate('detail', { id: s.id })}
                              className="flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-[13px] text-white transition-all hover:brightness-110 active:scale-[0.98]"
                              style={{
                                height: '42px',
                                background: 'linear-gradient(135deg,#6366f1,#3b82f6)',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                letterSpacing: '0.3px',
                              }}
                            >
                              Access Portal <ArrowUpRight size={14} />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '24px', padding: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}><Zap size={20} color="white" /></div>
                  <div>
                    <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.02em' }}>Professional Suite</p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>HIGH-IMPACT TOOLS</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tools.map((tool, i) => (
                    <button 
                      key={i} 
                      onClick={() => onNavigate(tool.path as any)} 
                      className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 w-full text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <div style={{ background: tool.bg, color: tool.color }} className="p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110">
                          {tool.icon}
                        </div>
                        <span className="text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">{tool.label}</span>
                      </span>
                      <ChevronRight size={16} className="text-white/30 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse" />
                    <span className="text-emerald-500 text-[11px] font-bold tracking-wider">SYSTEM ONLINE</span>
                  </div>
                  <Trophy size={16} className="text-amber-500 opacity-60" />
                </div>
                <p className="text-white text-4xl font-black mb-1 tracking-tight">{summary?.profile_completion || 45}%</p>
                <p className="text-slate-400 text-[11px] tracking-widest uppercase mb-4 font-bold">Profile Completion</p>
                <div className="bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${summary?.profile_completion || 45}%` }} />
                </div>
                <button onClick={() => onNavigate('settings')} className="w-full p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all rounded-xl text-indigo-300 text-[12px] font-bold tracking-wide uppercase">
                  REFINE IDENTITY CORE
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <History size={14} />
                  <span className="text-[11px] font-bold tracking-widest uppercase">ACTIVITY LOG</span>
                </div>
                <div className="flex flex-col gap-3">
                   {[{ text: 'Profile updated', time: '2h ago' }, { text: 'Radar scan complete', time: '5h ago' }].map((item, i) => (
                     <div key={i} className="flex justify-between text-[11px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
                       <span className="text-slate-300 font-medium">{item.text}</span>
                       <span className="text-slate-500">{item.time}</span>
                     </div>
                   ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

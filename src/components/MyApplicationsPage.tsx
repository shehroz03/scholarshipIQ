import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  MapPin, 
  Trash2, 
  Loader2, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Banknote, 
  Calendar, 
  Lock, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Bookmark, 
  Pencil, 
  Mic, 
  LayoutGrid, 
  ChevronRight, 
  Activity, 
  Zap, 
  Target 
} from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { useCurrency } from "../context/CurrencyContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { CurrencySelector } from "./CurrencySelector";
import { ThemeToggle } from "./ThemeToggle";

const STATUS_CONFIG = {
  All: { label: "All Hubs", icon: LayoutGrid, color: "#64748b" },
  Saved: { label: "Saved", icon: Bookmark, color: "#f4c44e" },
  Applied: { label: "Applied", icon: Pencil, color: "#f59e0b" },
  Interview: { label: "Interview", icon: Mic, color: "#a855f7" },
  Accepted: { label: "Accepted", icon: CheckCircle2, color: "#10b981" },
  Rejected: { label: "Rejected", icon: XCircle, color: "#ef4444" },
};

export function MyApplicationsPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const { isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const { status: userStatus } = useUser();
  const userPlan = userStatus?.plan || "free";

  const isFreeUser = userPlan === "free";
  const FREE_TRACKER_LIMIT = 3;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await api.applications.list();
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
      toast.error("Pipeline synchronization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: newStatus } : app
      ));
      await api.applications.update(appId, { status: newStatus });
      toast.success(`Pipeline state updated: ${newStatus}`);
    } catch (err) {
      toast.error("State transition failed");
      fetchApplications();
    }
  };

  const handleDelete = async (appId: number) => {
    if (!window.confirm("Purge this tracker from your active pipeline?")) return;
    try {
      await api.applications.delete(appId);
      setApplications(prev => prev.filter(app => app.id !== appId));
      toast.success("Tracker purged successfully");
    } catch (err) {
      toast.error("Purge operation failed");
    }
  };

  const filteredApps = filter === "All"
    ? applications
    : applications.filter(app => app.status === filter);

  const kpis = [
    { label: "Active Applications", value: applications.filter(a => a.status === 'Applied').length, icon: Pencil, color: "#f4c44e", glow: "rgba(99, 102, 241, 0.2)" },
    { label: "Interviews", value: applications.filter(a => a.status === 'Interview').length, icon: Mic, color: "#a855f7", glow: "rgba(168, 85, 247, 0.2)" },
    { label: "Accepted", value: applications.filter(a => a.status === 'Accepted').length, icon: CheckCircle2, color: "#10b981", glow: "rgba(16, 185, 129, 0.2)" },
    { label: "Upcoming Deadlines", value: applications.filter(a => new Date(a.scholarship?.deadline) > new Date()).length, icon: Clock, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.2)" },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0f4ff',
      color: '#1e293b',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Sidebar */}
      <div style={{ width: '260px', flexShrink: 0 }}>
        <Sidebar onNavigate={onNavigate} currentPage="tracker" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.03)',
          zIndex: 40
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Application Pipeline</h1>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#f4c44e', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Mission Control
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ThemeToggle />
            <CurrencySelector variant="dark" />
            <NotificationBell onNavigate={onNavigate} />
            <button 
              onClick={() => onNavigate('dashboard')}
              style={{
                background: '#2563eb',
                color: '#1e293b',
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
              <Target size={16} /> Operations Hub
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="custom-scrollbar">
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* KPI Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {kpis.map((kpi, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: '20px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 10px 30px -10px ${kpi.glow}`
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: `${kpi.color}15`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <kpi.icon size={22} color={kpi.color} />
                  </div>
                  <p style={{ color: '#1e293b', fontSize: '32px', fontWeight: '800', lineHeight: '1' }}>{kpi.value}</p>
                  <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '6px' }}>
                    {kpi.label}
                  </p>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: kpi.color, opacity: 0.03, borderRadius: '50%', filter: 'blur(40px)' }} />
                </div>
              ))}
            </div>

            {/* Status Tabs (Segmented Control) */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(0,0,0,0.03)',
              borderRadius: '16px',
              padding: '6px',
              display: 'flex',
              gap: '4px',
              overflowX: 'auto'
            }} className="no-scrollbar">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const isActive = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#a5b4fc' : '#64748b',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none'
                    }}
                  >
                    <config.icon size={16} />
                    {config.label}
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div style={{ minHeight: '400px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '16px' }}>
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', letterSpacing: '2px' }}>SYNCING PIPELINE...</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div style={{
                  padding: '100px 40px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px dashed rgba(0,0,0,0.08)',
                  borderRadius: '32px'
                }}>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(244,196,78,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Target size={32} color="#f4c44e" opacity={0.4} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Pipeline Empty</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 32px' }}>
                    Start tracking your applications to see them here. Explore scholarships to add to your pipeline.
                  </p>
                  <button 
                    onClick={() => onNavigate('search')}
                    style={{ background: '#2563eb', color: '#1e293b', border: 'none', padding: '14px 32px', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Find Scholarships
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '24px'
                }}>
                  <AnimatePresence>
                    {(isFreeUser ? filteredApps.slice(0, FREE_TRACKER_LIMIT) : filteredApps).map((app) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          borderRadius: '24px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                          position: 'relative'
                        }}
                      >
                        {/* Header Part */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '4px', lineHeight: '1.3' }}>
                              {app.scholarship?.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                               <p style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <GraduationCap size={14} color="#f4c44e" /> {app.scholarship?.university_name}
                               </p>
                               <p style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <MapPin size={14} color="#ef4444" /> {app.scholarship?.country}
                               </p>
                            </div>
                          </div>
                          <div style={{
                            padding: '6px 14px',
                            background: `${STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.color}20`,
                            border: `1px solid ${STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.color}40`,
                            borderRadius: '999px',
                            color: STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.color,
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>
                            {app.status}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '12px',
                          padding: '16px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div>
                            <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Funding</p>
                            <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '800' }}>
                              {convertAndFormat(app.scholarship?.amount) || 'Full Funding'}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Target Date</p>
                            <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '800' }}>
                              {app.scholarship?.deadline ? new Date(app.scholarship.deadline).toLocaleDateString() : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {/* Status Timeline Visualization */}
                        <div style={{ display: 'flex', gap: '4px', height: '6px', width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                           {['Saved', 'Applied', 'Interview', 'Accepted'].map((step, idx) => {
                             const stepsOrder = ['Saved', 'Applied', 'Interview', 'Accepted', 'Rejected'];
                             const currentIdx = stepsOrder.indexOf(app.status);
                             const stepIdx = stepsOrder.indexOf(step);
                             const isPast = stepIdx <= currentIdx;
                             return (
                               <div key={step} style={{
                                 flex: 1,
                                 background: isPast ? '#f4c44e' : 'transparent',
                                 opacity: isPast ? 1 : 0.2
                               }} />
                             );
                           })}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              style={{
                                width: '100%',
                                height: '42px',
                                background: 'rgba(0,0,0,0.03)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '10px',
                                color: '#1e293b',
                                padding: '0 12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                appearance: 'none'
                              }}
                            >
                              <option value="Saved" style={{ background: '#1e293b', color: '#1e293b' }}>Saved</option>
                              <option value="Applied" style={{ background: '#1e293b', color: '#1e293b' }}>Applied</option>
                              <option value="Interview" style={{ background: '#1e293b', color: '#1e293b' }}>Interview</option>
                              <option value="Accepted" style={{ background: '#1e293b', color: '#1e293b' }}>Accepted</option>
                              <option value="Rejected" style={{ background: '#1e293b', color: '#1e293b' }}>Rejected</option>
                            </select>
                            <ChevronRight size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', opacity: 0.5 }} />
                          </div>
                          <button 
                            onClick={() => onNavigate('detail', { id: app.scholarship_id })}
                            style={{ padding: '0 20px', background: '#f4c44e', color: '#1e293b', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                          >
                            View Intel
                          </button>
                          <button 
                            onClick={() => handleDelete(app.id)}
                            style={{ width: '42px', height: '42px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Upgrade Gate */}
              {isFreeUser && filteredApps.length > FREE_TRACKER_LIMIT && (
                <div style={{
                  marginTop: '40px',
                  padding: '40px',
                  background: 'linear-gradient(135deg, #163065, #0f172a)',
                  borderRadius: '32px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(244,196,78,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Lock size={28} color="#f4c44e" />
                  </div>
                  <h4 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Pipeline Capacity Limited</h4>
                  <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px' }}>
                    Free accounts can track up to 3 applications simultaneously. Upgrade to Professional for unlimited lifecycle management.
                  </p>
                  <button 
                    onClick={() => onNavigate('pricing')}
                    style={{ background: 'linear-gradient(135deg, #f4c44e, #3b82f6)', color: '#1e293b', border: 'none', padding: '14px 36px', borderRadius: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' }}
                  >
                    <Crown size={20} /> Upgrade to Professional
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

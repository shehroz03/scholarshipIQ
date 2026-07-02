import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Globe, 
  Calendar, 
  GraduationCap, 
  Trophy, 
  IdCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  ShieldCheck,
  PlaneTakeoff,
  Clock,
  ArrowRight,
  Check
} from 'lucide-react';
import { api } from '../../api';
import { useUser } from '../../context/UserContext';
import { Sidebar } from '../Sidebar';
import { darkTheme, lightTheme } from '../../styles/theme';
import { ThemeToggle } from '../ThemeToggle';

const VisaProfileFormPage: React.FC = () => {
  const { country } = useParams();
  const navigate = useNavigate();
  const { status: userStatus, loading: loadingUser } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const isDark = false;
  const theme = lightTheme;

  const getInitialIntake = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    if (month >= 7) return `Spring ${year + 1}`;
    return `Fall ${year}`;
  };

  const [formData, setFormData] = useState({
    target_country: country || 'au',
    intake_term: getInitialIntake(),
    passport_status: 'valid',
    admission_status: 'no_offer',
    scholarship_status: 'none',
    funding_source: 'self',
    bank_statement_available: false,
    language_test_type: 'None',
    language_test_score: '',
    tuberculosis_test_status: 'not_done',
    health_insurance_status: 'not_done',
    previous_visa_refusal: false,
    notes: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.request('/visa/profile', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const checklist = await api.request('/visa/checklist/generate', {
        method: 'POST'
      });
      toast.success('AI Visa Strategy Generated Successfully!');
      navigate(`/visa/checklist/${checklist.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) return null;

  const countryDisplay = (country || 'au').toUpperCase();

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <div className="hidden lg:block shrink-0 relative z-50" style={{ width: '260px' }}>
        <Sidebar onNavigate={(p) => navigate(`/${p}`)} currentPage="visa" />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b flex items-center justify-between px-8 shrink-0 z-40" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f4c44e, #e8b43a)", boxShadow: "0 4px 12px rgba(244,196,78,0.4)" }}>
              <PlaneTakeoff className="w-6 h-6" style={{ color: '#1e293b' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-none">Visa Architect</h2>
              <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{ color: "#e8b43a" }}>AI Strategy Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/visa')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '14px',
                backgroundColor: 'rgba(0,0,0,0.04)',
                border: `1px solid ${theme.border}`,
                color: theme.text,
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244,196,78,0.08)'; e.currentTarget.style.borderColor = '#f4c44e'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = theme.border; }}
            >
              <ChevronLeft size={18} /> Exit Architect
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '40px 20px' }}>
          <div className="max-w-4xl mx-auto">
            
            {/* Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1e3a7a 0%, #162f6a 100%)',
              border: '1px solid rgba(244,196,78,0.3)',
              borderRadius: '28px',
              padding: '40px',
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(30,58,122,0.15)'
            }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/20 mb-6 backdrop-blur-md shadow-inner">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">Target Destination: {countryDisplay}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  <span className="text-xs font-bold text-emerald-400">AI Co-Pilot Active</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-none">
                  Build Your <span style={{ background: 'linear-gradient(135deg, #f4c44e 0%, #e8b43a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Visa Strategy</span>
                </h1>
                <p className="text-blue-100 text-base font-medium max-w-xl line-clamp-2 leading-relaxed">
                  Complete these 4 rapid strategic steps. Our AI engine will run a comprehensive immigration rules check to formulate your bulletproof success plan.
                </p>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div style={{
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '24px',
              padding: '24px 32px',
              marginBottom: '40px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
            }}>
              <div className="flex items-center justify-between gap-2">
                {[
                  { n: 1, label: 'Timeline',  icon: Calendar },
                  { n: 2, label: 'Academic',  icon: GraduationCap },
                  { n: 3, label: 'Finance',   icon: IdCard },
                  { n: 4, label: 'Strategy',  icon: Sparkles },
                ].map(({ n, label, icon: Icon }, i, arr) => (
                  <React.Fragment key={n}>
                    <div 
                      onClick={() => n <= step && setStep(n)} 
                      className="flex flex-col items-center gap-2 flex-1 cursor-pointer group"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                        n < step ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20' :
                        n === step ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30' :
                        'bg-white/5 border-white/10 text-slate-500 group-hover:border-white/20'
                      }`}>
                        {n < step
                          ? <Check className="w-6 h-6 text-emerald-400" />
                          : <Icon className={`w-5 h-5 ${n === step ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`} />
                        }
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${n === step ? 'text-white' : n < step ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-1 flex-1 rounded-full mb-6 transition-all duration-300" style={{ background: n < step ? '#10b981' : 'rgba(0,0,0,0.04)' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form Steps Container */}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                <div style={{
                  backgroundColor: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '32px',
                  padding: '40px',
                  marginBottom: '32px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>

                  {/* STEP 1 — INTAKE TIMELINE */}
                  {step === 1 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                        <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-indigo-500/40 flex items-center justify-center text-amber-500 shadow-xl shadow-indigo-500/10">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-1">Step 1 of 4</p>
                          <h3 className="text-2xl font-black text-white">Intake Timeline & Window</h3>
                          <p className="text-sm text-slate-400 font-medium mt-1">Select your prospective enrollment intake to align visa buffer days.</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#f4c44e' }}>Select Proposed Intake Window</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027'].map(term => {
                            const isFall = term.startsWith('Fall');
                            const selected = formData.intake_term === term;
                            return (
                              <button 
                                key={term} 
                                onClick={() => handleInputChange('intake_term', term)}
                                style={{
                                  padding: '24px',
                                  borderRadius: '20px',
                                  backgroundColor: selected ? 'rgba(244,196,78,0.08)' : '#ffffff',
                                  border: `2px solid ${selected ? '#f4c44e' : theme.border}`,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  boxShadow: selected ? '0 4px 16px rgba(244,196,78,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
                                }}
                                onMouseOver={(e) => !selected && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                                onMouseOut={(e) => !selected && (e.currentTarget.style.borderColor = theme.border)}
                              >
                                <div className="text-3xl mb-4">{isFall ? '🍂' : '🌸'}</div>
                                <div className="text-lg font-black mb-1" style={{ color: '#1e293b' }}>{term}</div>
                                <div className="text-xs font-bold" style={{ color: selected ? '#f4c44e' : '#64748b' }}>{isFall ? 'Aug – Dec Departure' : 'Jan – May Departure'}</div>
                                {selected && (
                                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#f4c44e' }}>
                                    <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-5 p-6 rounded-2xl border border-white/10" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                          <Globe className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Locked Destination</p>
                          <p className="text-lg font-black text-white mt-0.5">{countryDisplay}</p>
                        </div>
                        <div className="ml-auto px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-inner">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Embassy Rulebase Active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — ACADEMIC STATUS */}
                  {step === 2 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                        <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-purple-400 mb-1">Step 2 of 4</p>
                          <h3 className="text-2xl font-black text-white">Admission & Scholarship Profile</h3>
                          <p className="text-sm text-slate-400 font-medium mt-1">Specify your official university acceptance status and funding support.</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">University Offer Status</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { v: 'no_offer',      label: 'No Offer Yet',        icon: '⏳', desc: 'Preparing applications / Waiting' },
                            { v: 'conditional',   label: 'Conditional Offer',   icon: '📋', desc: 'Pending final degree / IELTS' },
                            { v: 'unconditional', label: 'Unconditional Offer', icon: '✅', desc: 'Full academic confirmation' },
                            { v: 'cas_issued',    label: 'CAS / CoE Issued',    icon: '🎓', desc: 'Immediate visa lodgement ready' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.admission_status === v;
                            return (
                              <button 
                                key={v} 
                                onClick={() => handleInputChange('admission_status', v)}
                                style={{
                                  padding: '24px',
                                  borderRadius: '20px',
                                  backgroundColor: sel ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0,0,0,0.03)',
                                  border: `2px solid ${sel ? '#a855f7' : theme.border}`,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  boxShadow: sel ? '0 10px 25px rgba(168, 85, 247, 0.25)' : 'none'
                                }}
                                onMouseOver={(e) => !sel && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                                onMouseOut={(e) => !sel && (e.currentTarget.style.borderColor = theme.border)}
                              >
                                <div className="text-3xl mb-4">{icon}</div>
                                <div className={`text-lg font-black mb-1 ${sel ? 'text-white' : 'text-slate-300'}`}>{label}</div>
                                <div className={`text-xs font-semibold ${sel ? 'text-purple-300' : 'text-slate-500'}`}>{desc}</div>
                                {sel && (
                                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                                    <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Scholarship Status</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { v: 'none',    label: 'Self Funded',       icon: '💳', desc: 'Full fee payment' },
                            { v: 'applied', label: 'Applied / Pending', icon: '📨', desc: 'Decision awaited' },
                            { v: 'awarded', label: 'Awarded',           icon: '🏆', desc: 'Partial / Full fee waiver' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.scholarship_status === v;
                            return (
                              <button 
                                key={v} 
                                onClick={() => handleInputChange('scholarship_status', v)}
                                style={{
                                  padding: '24px',
                                  borderRadius: '20px',
                                  backgroundColor: sel ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.03)',
                                  border: `2px solid ${sel ? '#f4c44e' : theme.border}`,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  boxShadow: sel ? '0 10px 25px rgba(99, 102, 241, 0.25)' : 'none'
                                }}
                                onMouseOver={(e) => !sel && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                                onMouseOut={(e) => !sel && (e.currentTarget.style.borderColor = theme.border)}
                              >
                                <div className="text-3xl mb-4">{icon}</div>
                                <div className={`text-lg font-black mb-1 ${sel ? 'text-white' : 'text-slate-300'}`}>{label}</div>
                                <div className={`text-xs font-semibold ${sel ? 'text-amber-400' : 'text-slate-500'}`}>{desc}</div>
                                {sel && (
                                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                                    <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 — TRAVEL & FINANCE */}
                  {step === 3 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
                          <IdCard className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Step 3 of 4</p>
                          <h3 className="text-2xl font-black text-white">Travel Documents & Financial Proof</h3>
                          <p className="text-sm text-slate-400 font-medium mt-1">Embassy evaluation depends strictly on valid passports and bank statement readiness.</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Passport Verification Status</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { v: 'valid',   label: 'Valid Passport',   icon: '🛂', desc: '6+ months validity' },
                            { v: 'expired', label: 'Expired',          icon: '⚠️', desc: 'Needs urgent renewal' },
                            { v: 'applied', label: 'Recently Applied', icon: '📭', desc: 'Waiting for issuance' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.passport_status === v;
                            return (
                              <button 
                                key={v} 
                                onClick={() => handleInputChange('passport_status', v)}
                                style={{
                                  padding: '24px',
                                  borderRadius: '20px',
                                  backgroundColor: sel ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.03)',
                                  border: `2px solid ${sel ? '#3b82f6' : theme.border}`,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  boxShadow: sel ? '0 10px 25px rgba(59, 130, 246, 0.25)' : 'none'
                                }}
                                onMouseOver={(e) => !sel && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                                onMouseOut={(e) => !sel && (e.currentTarget.style.borderColor = theme.border)}
                              >
                                <div className="text-3xl mb-4">{icon}</div>
                                <div className={`text-lg font-black mb-1 ${sel ? 'text-white' : 'text-slate-300'}`}>{label}</div>
                                <div className={`text-xs font-semibold ${sel ? 'text-blue-300' : 'text-slate-500'}`}>{desc}</div>
                                {sel && (
                                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                                    <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Primary Source of Living Expense</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { v: 'self',        label: 'Self Funded',    icon: '💰', desc: 'Personal savings / liquid assets' },
                            { v: 'family',      label: 'Family Sponsor', icon: '👨‍👩‍👧', desc: 'Parents / blood relative statement' },
                            { v: 'scholarship', label: 'Scholarship',    icon: '🎓', desc: 'Official government/university award' },
                            { v: 'loan',        label: 'Bank Loan',      icon: '🏦', desc: 'Approved educational bank loan' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.funding_source === v;
                            return (
                              <button 
                                key={v} 
                                onClick={() => handleInputChange('funding_source', v)}
                                style={{
                                  padding: '24px',
                                  borderRadius: '20px',
                                  backgroundColor: sel ? 'rgba(6, 182, 212, 0.15)' : 'rgba(0,0,0,0.03)',
                                  border: `2px solid ${sel ? '#06b6d4' : theme.border}`,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  boxShadow: sel ? '0 10px 25px rgba(6, 182, 212, 0.25)' : 'none'
                                }}
                                onMouseOver={(e) => !sel && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
                                onMouseOut={(e) => !sel && (e.currentTarget.style.borderColor = theme.border)}
                              >
                                <div className="text-3xl mb-4">{icon}</div>
                                <div className={`text-lg font-black mb-1 ${sel ? 'text-white' : 'text-slate-300'}`}>{label}</div>
                                <div className={`text-xs font-semibold ${sel ? 'text-cyan-300' : 'text-slate-500'}`}>{desc}</div>
                                {sel && (
                                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center shadow-md">
                                    <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleInputChange('bank_statement_available', !formData.bank_statement_available)}
                        style={{
                          width: '100%',
                          padding: '28px',
                          borderRadius: '24px',
                          backgroundColor: formData.bank_statement_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.03)',
                          border: `2px solid ${formData.bank_statement_available ? '#10b981' : theme.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: formData.bank_statement_available ? '0 15px 30px rgba(16, 185, 129, 0.25)' : 'none'
                        }}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${formData.bank_statement_available ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-slate-400'}`}>
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-xl font-black mb-1 ${formData.bank_statement_available ? 'text-white' : 'text-slate-300'}`}>Bank Statement Proof Available</p>
                          <p className={`text-xs font-bold ${formData.bank_statement_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {formData.bank_statement_available ? '✓ Required living balance is confirmed and ready for embassy lodgement' : 'Click to confirm you hold the mandatory living expenses balance in your bank account'}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${formData.bank_statement_available ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                          {formData.bank_statement_available && <Check className="w-5 h-5 text-white" />}
                        </div>
                      </button>
                    </div>
                  )}

                  {/* STEP 4 — FINAL CHECKS & SCAN */}
                  {step === 4 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Step 4 of 4</p>
                          <h3 className="text-2xl font-black text-white">Refusal History & Final Scan</h3>
                          <p className="text-sm text-slate-400 font-medium mt-1">Accurate refusal declarations ensure our AI tailors a bulletproof Letter of Intent.</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">Any Previous Visa Refusals?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleInputChange('previous_visa_refusal', true)}
                            style={{
                              padding: '24px',
                              borderRadius: '20px',
                              backgroundColor: formData.previous_visa_refusal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.03)',
                              border: `2px solid ${formData.previous_visa_refusal ? '#ef4444' : theme.border}`,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                              boxShadow: formData.previous_visa_refusal ? '0 10px 25px rgba(239, 68, 68, 0.25)' : 'none'
                            }}
                          >
                            <div className="text-3xl mb-4">⛔</div>
                            <div className={`text-lg font-black mb-1 ${formData.previous_visa_refusal ? 'text-white' : 'text-slate-300'}`}>Yes, I Have a Refusal</div>
                            <div className={`text-xs font-semibold ${formData.previous_visa_refusal ? 'text-red-300' : 'text-slate-500'}`}>Our AI will build a strong mitigation strategy</div>
                            {formData.previous_visa_refusal && (
                              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                                <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                              </div>
                            )}
                          </button>

                          <button 
                            onClick={() => handleInputChange('previous_visa_refusal', false)}
                            style={{
                              padding: '24px',
                              borderRadius: '20px',
                              backgroundColor: !formData.previous_visa_refusal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.03)',
                              border: `2px solid ${!formData.previous_visa_refusal ? '#10b981' : theme.border}`,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                              boxShadow: !formData.previous_visa_refusal ? '0 10px 25px rgba(16, 185, 129, 0.25)' : 'none'
                            }}
                          >
                            <div className="text-3xl mb-4">✅</div>
                            <div className={`text-lg font-black mb-1 ${!formData.previous_visa_refusal ? 'text-white' : 'text-slate-300'}`}>No, Never Refused</div>
                            <div className={`text-xs font-semibold ${!formData.previous_visa_refusal ? 'text-emerald-300' : 'text-slate-500'}`}>Clean global immigration record</div>
                            {!formData.previous_visa_refusal && (
                              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shadow-md">
                                <Check className="w-4 h-4" style={{ color: "#1e3a7a" }} />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Additional Application Notes <span className="text-slate-500 normal-case font-normal">(Optional)</span></p>
                        <textarea 
                          value={formData.notes} 
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Study gaps, previous travels, specific embassy appointment concerns..."
                          rows={4}
                          style={{
                            width: '100%',
                            borderRadius: '20px',
                            backgroundColor: '#f8fafc',
                            border: `1px solid ${theme.border}`,
                            padding: '20px',
                            color: '#1e293b',
                            fontSize: '15px',
                            outline: 'none',
                            resize: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#f4c44e'}
                          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                        />
                      </div>

                      <div className="p-6 rounded-3xl border border-indigo-500/30" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-amber-500">AI Pre-Flight Scan Summary</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="text-slate-600">🎯 Target: <div className="text-slate-900 font-black text-base mt-1">{countryDisplay}</div></div>
                          <div className="text-slate-600">📅 Intake: <div className="text-slate-900 font-black text-base mt-1">{formData.intake_term}</div></div>
                          <div className="text-slate-600">🎓 Admission: <div className="text-slate-900 font-black text-base mt-1 capitalize">{formData.admission_status.replace('_', ' ')}</div></div>
                          <div className="text-slate-600">💰 Funding: <div className="text-slate-900 font-black text-base mt-1 capitalize">{formData.funding_source}</div></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Footer */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <button 
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/visa')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px 32px',
                      borderRadius: '18px',
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      fontWeight: '800',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#1e293b'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = theme.border; }}
                  >
                    <ChevronLeft size={18} /> {step === 1 ? 'Exit Form' : 'Previous Step'}
                  </button>

                  {step < 4 ? (
                    <button 
                      onClick={() => setStep(step + 1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '16px 40px',
                        borderRadius: '18px',
                        backgroundColor: '#f4c44e',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(244,196,78,0.4)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      Next Step <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 48px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'none')}
                    >
                      {loading ? (
                        <><Clock className="w-5 h-5 animate-spin" /> Compiling AI Strategy...</>
                      ) : (
                        <>Generate AI Checklist & Strategy <ArrowRight size={18} /></>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-12 flex items-center justify-center gap-2 text-slate-500">
              <ShieldCheck size={16} className="text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-widest">End-to-End Encrypted & Secure</span>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
};

export default VisaProfileFormPage;


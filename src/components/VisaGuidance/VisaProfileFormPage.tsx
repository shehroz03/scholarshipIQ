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
  Stethoscope,
  PlaneTakeoff,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Sidebar } from '../Sidebar';

const VisaProfileFormPage: React.FC = () => {
  const { country } = useParams();
  const navigate = useNavigate();
  const { status: userStatus, loading: loadingUser } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
      toast.success('AI Visa Strategy Generated!');
      navigate(`/visa/checklist/${checklist.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const glassCardStyle = { 
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(30px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
  };

  if (loadingUser) return null;

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Sidebar */}
      <div className="hidden lg:block shrink-0 relative z-50" style={{ width: '260px' }}>
        <Sidebar onNavigate={(p) => navigate(`/${p}`)} currentPage="visa" />
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-8 shrink-0 z-40 bg-white" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <PlaneTakeoff className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 leading-none">Visa Architect</h2>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-widest">AI-Powered Strategy</p>
            </div>
          </div>
          <button onClick={() => navigate('/visa')} className="px-5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 font-semibold text-xs transition-all">
            ← Back
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hero Banner */}
          <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative max-w-3xl mx-auto px-6 lg:px-10 py-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 mb-4">
                <Globe className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Target: {country?.toUpperCase() || 'AU'}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-200">AI Ready</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                Build Your Visa Strategy
              </h1>
              <p className="mt-2 text-indigo-100 text-sm font-medium max-w-lg">
                Answer 4 quick steps — our AI generates a personalised document checklist and visa success plan.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 lg:px-10 py-8">

            {/* Stepper */}
            <div className="flex items-center gap-0 mb-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              {[
                { n: 1, label: 'Timeline',  icon: Calendar },
                { n: 2, label: 'Academic',  icon: GraduationCap },
                { n: 3, label: 'Documents', icon: IdCard },
                { n: 4, label: 'Final',     icon: Sparkles },
              ].map(({ n, label, icon: Icon }, i, arr) => (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                      n < step  ? 'bg-indigo-600 border-indigo-600 shadow-md' :
                      n === step ? 'bg-indigo-50 border-indigo-500' :
                                   'bg-slate-50 border-slate-200'
                    }`}>
                      {n < step
                        ? <CheckCircle2 className="w-5 h-5 text-white" />
                        : <Icon className={`w-4.5 h-4.5 ${n === step ? 'text-indigo-600' : 'text-slate-400'}`} />
                      }
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${n === step ? 'text-indigo-600' : n < step ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="h-px w-8 mb-4 shrink-0" style={{ background: n < step ? '#6366f1' : '#e2e8f0' }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Form Card */}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-5">

                  {/* Step 1 — Intake Timeline */}
                  {step === 1 && (
                    <div className="space-y-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <Calendar className="text-indigo-600 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Step 1 of 4</p>
                          <h3 className="text-xl font-black text-slate-800">Intake Timeline</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">When do you plan to start your studies?</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Select Your Planned Intake</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027'].map(term => {
                            const isFall = term.startsWith('Fall');
                            const selected = formData.intake_term === term;
                            return (
                              <button key={term} onClick={() => handleInputChange('intake_term', term)}
                                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                  selected ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50'
                                }`}
                              >
                                <div className="text-2xl mb-2">{isFall ? '🍂' : '🌸'}</div>
                                <div className={`text-sm font-black ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>{term}</div>
                                <div className={`text-[10px] font-semibold mt-0.5 ${selected ? 'text-indigo-400' : 'text-slate-400'}`}>{isFall ? 'Aug – Dec' : 'Jan – May'}</div>
                                {selected && (
                                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{country?.toUpperCase() || 'AU'}</p>
                        </div>
                        <div className="ml-auto px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Confirmed</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Academic Status */}
                  {step === 2 && (
                    <div className="space-y-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                          <GraduationCap className="text-violet-600 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-0.5">Step 2 of 4</p>
                          <h3 className="text-xl font-black text-slate-800">Academic Status</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Your offer letter and scholarship situation</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Admission Status</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { v: 'no_offer',      label: 'No Offer Yet',        icon: '⏳', desc: 'Still applying' },
                            { v: 'conditional',   label: 'Conditional Offer',   icon: '📋', desc: 'Conditions pending' },
                            { v: 'unconditional', label: 'Unconditional Offer', icon: '✅', desc: 'Fully accepted' },
                            { v: 'cas_issued',    label: 'CAS / CoE Issued',    icon: '🎓', desc: 'Ready for visa' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.admission_status === v;
                            return (
                              <button key={v} onClick={() => handleInputChange('admission_status', v)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${sel ? 'border-violet-400 bg-violet-50 shadow-sm shadow-violet-100' : 'border-slate-100 bg-slate-50 hover:border-violet-200'}`}
                              >
                                <div className="text-xl mb-2">{icon}</div>
                                <div className={`text-xs font-black ${sel ? 'text-violet-700' : 'text-slate-700'}`}>{label}</div>
                                <div className={`text-[10px] mt-0.5 font-medium ${sel ? 'text-violet-400' : 'text-slate-400'}`}>{desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Scholarship Status</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { v: 'none',    label: 'Self Funded',      icon: '💳' },
                            { v: 'applied', label: 'Applied / Pending', icon: '📨' },
                            { v: 'awarded', label: 'Awarded',          icon: '🏆' },
                          ].map(({ v, label, icon }) => {
                            const sel = formData.scholarship_status === v;
                            return (
                              <button key={v} onClick={() => handleInputChange('scholarship_status', v)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${sel ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}
                              >
                                <div className="text-xl mb-2">{icon}</div>
                                <div className={`text-xs font-black ${sel ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Travel & Finance */}
                  {step === 3 && (
                    <div className="space-y-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <IdCard className="text-blue-600 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">Step 3 of 4</p>
                          <h3 className="text-xl font-black text-slate-800">Travel & Finance</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Passport, funding and bank statement</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Passport Status</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { v: 'valid',   label: 'Valid',    icon: '🛂', desc: 'Ready' },
                            { v: 'expired', label: 'Expired',  icon: '⚠️', desc: 'Renewal needed' },
                            { v: 'applied', label: 'Applied',  icon: '📭', desc: 'Pending' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.passport_status === v;
                            return (
                              <button key={v} onClick={() => handleInputChange('passport_status', v)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${sel ? 'border-blue-400 bg-blue-50 shadow-sm shadow-blue-100' : 'border-slate-100 bg-slate-50 hover:border-blue-200'}`}
                              >
                                <div className="text-xl mb-2">{icon}</div>
                                <div className={`text-xs font-black ${sel ? 'text-blue-700' : 'text-slate-700'}`}>{label}</div>
                                <div className={`text-[10px] mt-0.5 font-medium ${sel ? 'text-blue-400' : 'text-slate-400'}`}>{desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Primary Funding</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { v: 'self',        label: 'Self Funded',    icon: '💰', desc: 'Personal savings' },
                            { v: 'family',      label: 'Family Sponsor', icon: '👨‍👩‍👧', desc: 'Sponsored' },
                            { v: 'scholarship', label: 'Scholarship',    icon: '🎓', desc: 'Full award' },
                            { v: 'loan',        label: 'Bank Loan',      icon: '🏦', desc: 'Education loan' },
                          ].map(({ v, label, icon, desc }) => {
                            const sel = formData.funding_source === v;
                            return (
                              <button key={v} onClick={() => handleInputChange('funding_source', v)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${sel ? 'border-cyan-400 bg-cyan-50 shadow-sm shadow-cyan-100' : 'border-slate-100 bg-slate-50 hover:border-cyan-200'}`}
                              >
                                <div className="text-xl mb-2">{icon}</div>
                                <div className={`text-xs font-black ${sel ? 'text-cyan-700' : 'text-slate-700'}`}>{label}</div>
                                <div className={`text-[10px] mt-0.5 font-medium ${sel ? 'text-cyan-500' : 'text-slate-400'}`}>{desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => handleInputChange('bank_statement_available', !formData.bank_statement_available)}
                        className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${formData.bank_statement_available ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-slate-100 bg-slate-50 hover:border-emerald-200'}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${formData.bank_statement_available ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                          <ShieldCheck className={`w-5 h-5 ${formData.bank_statement_available ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-black ${formData.bank_statement_available ? 'text-emerald-700' : 'text-slate-600'}`}>Bank Statement Ready</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Minimum required bank balance proof available</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${formData.bank_statement_available ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                          {formData.bank_statement_available && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Step 4 — Final Checks */}
                  {step === 4 && (
                    <div className="space-y-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <Sparkles className="text-emerald-600 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Step 4 of 4</p>
                          <h3 className="text-xl font-black text-slate-800">Final Checks</h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Last details for your AI visa strategy</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Previous Visa Refusals?</p>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleInputChange('previous_visa_refusal', true)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${formData.previous_visa_refusal ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-slate-100 bg-slate-50 hover:border-red-200'}`}
                          >
                            <div className="text-2xl mb-2">⛔</div>
                            <div className={`text-sm font-black ${formData.previous_visa_refusal ? 'text-red-700' : 'text-slate-600'}`}>Yes, I Have</div>
                            <div className={`text-[10px] mt-1 font-medium ${formData.previous_visa_refusal ? 'text-red-400' : 'text-slate-400'}`}>Refusal on record</div>
                          </button>
                          <button onClick={() => handleInputChange('previous_visa_refusal', false)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${!formData.previous_visa_refusal ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-slate-100 bg-slate-50 hover:border-emerald-200'}`}
                          >
                            <div className="text-2xl mb-2">✅</div>
                            <div className={`text-sm font-black ${!formData.previous_visa_refusal ? 'text-emerald-700' : 'text-slate-600'}`}>No, Never</div>
                            <div className={`text-[10px] mt-1 font-medium ${!formData.previous_visa_refusal ? 'text-emerald-400' : 'text-slate-400'}`}>Clean history</div>
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Additional Notes <span className="text-slate-300 normal-case font-normal">(Optional)</span></p>
                        <textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Study gaps, previous travels, specific concerns..."
                          rows={4}
                          className="w-full rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-300 outline-none p-4 text-slate-700 text-sm font-medium transition-all resize-none placeholder:text-slate-300"
                        />
                      </div>
                      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AI Scan Summary</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-slate-500">🎯 Target: <span className="text-slate-800 font-bold">{country?.toUpperCase()}</span></div>
                          <div className="text-slate-500">📅 Intake: <span className="text-slate-800 font-bold">{formData.intake_term}</span></div>
                          <div className="text-slate-500">🎓 Admission: <span className="text-slate-800 font-bold capitalize">{formData.admission_status.replace('_', ' ')}</span></div>
                          <div className="text-slate-500">💰 Funding: <span className="text-slate-800 font-bold capitalize">{formData.funding_source}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/visa')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    <ChevronLeft size={15} /> {step === 1 ? 'Back' : 'Previous'}
                  </button>
                  {step < 4 ? (
                    <button onClick={() => setStep(step + 1)}
                      className="flex items-center gap-2 px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                    >
                      Next Step <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={loading}
                      className="flex items-center gap-2 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      {loading ? <><Clock className="w-4 h-4 animate-spin" /> Processing</> : <>Generate AI Checklist <ArrowRight size={15} /></>}
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-center gap-2 text-slate-300">
              <ShieldCheck size={13} />
              <span className="text-[9px] font-semibold uppercase tracking-widest">Encrypted & secure</span>
            </div>
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
      `}</style>
    </div>
  );
};

export default VisaProfileFormPage;

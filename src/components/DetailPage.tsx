import { useState, useEffect } from "react";
import ApplyButton from "./ApplyButton";
import { Scholarship } from "../types/scholarship";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  GraduationCap,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertTriangle,
  Loader2,
  Banknote,
  CheckCircle,
  TrendingUp,
  Globe,
  Users,
  BookOpen,
  FileText,
  Clock,
  BadgeCheck,
  CircleAlert,
  Calculator,
  ShieldCheck,
  Link2,
  MessageSquare,
  ClipboardList,
  Crown,
  Lock,
  Zap
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

export function DetailPage({ onNavigate, scholarshipId }: { onNavigate: (page: string, params?: any) => void, scholarshipId: number }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const { convertAndFormat } = useCurrency();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { status: userStatus, isPremium, isPro } = useUser();
  const isFreePlan = !userStatus || userStatus.plan === "free";

  const [isTracking, setIsTracking] = useState(false);
  const [appRecord, setAppRecord] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [scholarshipId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [scholarshipData, apps] = await Promise.all([
          api.scholarships.get(scholarshipId),
          api.applications.list()
        ]);
        setScholarship(scholarshipData);
        const app = apps.find((a: any) => a.scholarship_id === Number(scholarshipId));
        if (app) {
          setIsTracking(true);
          setAppRecord(app);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (scholarshipId) {
      fetchData();
    }
  }, [scholarshipId]);

  const handleToggleTracking = async () => {
    try {
      if (isTracking && appRecord) {
        await api.applications.delete(appRecord.id);
        setIsTracking(false);
        setAppRecord(null);
        toast.info("Scholarship removed from tracker");
      } else {
        const newApp = await api.applications.save(Number(scholarshipId));
        setIsTracking(true);
        setAppRecord(newApp);
        toast.success("Added to your Application Tracker! 🚀");
      }
    } catch (err) {
      toast.error("Failed to update tracking status");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}><Loader2 className="animate-spin w-8 h-8 text-[#1e3a8a]" /></div>;
  }

  if (!scholarship) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>Scholarship not found.</div>;
  }

  const daysLeft = scholarship?.deadline ? Math.ceil((new Date(scholarship.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text, position: 'relative', isolation: 'isolate' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 9999, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.headerBg, padding: '16px 32px' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <div className="p-2 bg-[#1e3a8a] rounded-xl text-white shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: theme.text }}>ScholarIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <CurrencySelector />
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              style={{ borderColor: theme.border, color: theme.textSecondary }}
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 relative" style={{ scrollMarginTop: '80px' }}>
        <div className="flex items-center gap-2 text-sm mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ color: theme.textSecondary }}>
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition-colors">Home</button>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <button onClick={() => onNavigate('search')} className="hover:text-blue-600 transition-colors">Scholarships</button>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="font-bold truncate" style={{ color: theme.text }}>{scholarship.title}</span>
        </div>

        {scholarship.is_suspicious && (
          <div className="mb-8 border p-6 rounded-3xl flex items-start gap-4 shadow-sm" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="p-3 rounded-2xl" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : '#fee2e2' }}><AlertTriangle className="w-8 h-8 text-red-500 shrink-0" /></div>
            <div>
              <p className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>Security Alert</p>
              <p className="font-bold text-lg mb-1" style={{ color: isDark ? '#f87171' : '#b91c1c' }}>Potentially Fraudulent Opportunity</p>
              <p className="text-sm leading-relaxed" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>This scholarship request unusual upfront payments. Our AI model has flagged this entry. <strong>Do not share banking details.</strong></p>
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="space-y-4 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', color: isDark ? '#93c5fd' : '#1e3a8a', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}` }}>✓ Verified Opportunity</span>
                {scholarship.funding_type === 'Full' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#f0fdf4', color: isDark ? '#6ee7b7' : '#065f46', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}` }}>Fully Funded</span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: theme.bgSecondary, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>{scholarship.degree_level}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {scholarship.university?.logo_url && (
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl border p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden" style={{ borderColor: theme.border }}>
                    <img src={scholarship.university.logo_url} alt={scholarship.university_name} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight" style={{ color: theme.text }}>
                  {scholarship.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-semibold text-base" style={{ color: theme.textSecondary }}>
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-red-400" /> {scholarship.university_name}, {scholarship.country}</span>
              </div>
            </div>
            <div className="hidden lg:block min-w-[280px]">
              <ApplyButton scholarship={scholarship} variant="detail" className="!mb-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {[
              { label: "Financial Aid", val: convertAndFormat(scholarship.funding_amount), icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Deadline", val: new Date(scholarship.deadline).toLocaleDateString('en-GB'), icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Field", val: scholarship.field_of_study || "All", icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { label: "Remaining", val: `${daysLeft} Days`, icon: Clock, color: daysLeft <= 15 ? "text-red-500" : "text-emerald-500", bg: daysLeft <= 15 ? "bg-red-500/10" : "bg-emerald-500/10" },
              { label: "Match Score", val: isFreePlan ? "Locked" : `${scholarship.match_score || '85'}%`, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", isPill: true }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-3xl border shadow-sm transition-all" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textSecondary }}>{stat.label}</p>
                <p className={`text-xl font-black ${stat.isPill && isFreePlan ? 'blur-[2px]' : ''}`} style={{ color: theme.text }}>{stat.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
              <div className="p-8 md:p-10">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe' }}><BookOpen className="w-4 h-4" style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }} /></div>
                    <h3 className="text-xl font-black" style={{ color: theme.text }}>Program Overview</h3>
                  </div>
                  {scholarship.description && scholarship.description.includes('|') ? (
                    <div className="rounded-r-2xl border-l-4 pl-5 py-4" style={{ borderColor: '#3b82f6', backgroundColor: isDark ? 'rgba(59,130,246,0.07)' : '#f8fafc' }}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: isDark ? '#93c5fd' : '#1e3a8a' }}>Application Steps</p>
                      <ol className="space-y-2">
                        {scholarship.description.split('|').filter(s => s.trim()).map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium" style={{ color: theme.textSecondary }}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e3a8a' }}>{i + 1}</span>
                            {step.replace(/^\d+\./, '').trim()}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="leading-relaxed text-base font-medium italic border-l-4 pl-5 py-4 rounded-r-2xl" style={{ color: theme.textSecondary, borderColor: '#3b82f6', backgroundColor: isDark ? 'rgba(59,130,246,0.07)' : '#f8fafc' }}>
                      "{scholarship.description || "No description provided."}"
                    </p>
                  )}
                </div>
                
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 p-1.5 rounded-2xl h-14 border mb-6" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                      <TabsTrigger value="overview" className="rounded-xl font-black text-xs uppercase" style={{ color: theme.textSecondary }}>Overview</TabsTrigger>
                      <TabsTrigger value="eligibility" className="rounded-xl font-black text-xs uppercase" style={{ color: theme.textSecondary }}>Requirements</TabsTrigger>
                      <TabsTrigger value="benefits" className="rounded-xl font-black text-xs uppercase" style={{ color: theme.textSecondary }}>Benefits</TabsTrigger>
                      <TabsTrigger value="application" className="rounded-xl font-black text-xs uppercase" style={{ color: theme.textSecondary }}>Process</TabsTrigger>
                    </TabsList>

                    {/* ── OVERVIEW TAB ── */}
                    <TabsContent value="overview">
                      <div className="space-y-6">
                        {/* 2-col info grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-5 rounded-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Target Audience</p>
                            <p className="text-sm font-semibold" style={{ color: theme.text }}>
                              This program is specifically designed for students pursuing <strong>{scholarship.degree_level}</strong> studies in <strong>{scholarship.field_of_study || 'All Fields'}</strong>.
                            </p>
                          </div>
                          <div className="p-5 rounded-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: theme.textSecondary }}>Selection Criteria</p>
                            <p className="text-sm font-semibold" style={{ color: theme.text }}>
                              Winners are selected based on academic excellence (Min {scholarship.university?.min_cgpa || '3.0'} CGPA) and leadership potential.
                            </p>
                          </div>
                        </div>

                        {scholarship.scholarship_url && (
                          <a href={scholarship.scholarship_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-4 rounded-2xl border font-bold text-sm hover:opacity-80 transition-opacity"
                            style={{ borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#eff6ff' }}>
                            <Link2 className="w-4 h-4" /> Official Scholarship Page <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                          </a>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── REQUIREMENTS TAB ── */}
                    <TabsContent value="eligibility">
                      <div className="space-y-5">
                        {/* Header */}
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="px-5 py-4 border-b" style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#f5f3ff', borderColor: theme.border }}>
                            <p className="font-black text-sm" style={{ color: theme.text }}>Admission Requirements</p>
                            <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                              University-specific criteria for {scholarship.university_name} ({scholarship.degree_level}, international)
                            </p>
                          </div>

                          <div className="p-5 space-y-5" style={{ backgroundColor: theme.bgSecondary }}>
                            {/* Academic Performance */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>Academic Performance</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.07)' : '#f0fdf4', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0' }}>
                                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: isDark ? '#6ee7b7' : '#059669' }}>Minimum CGPA</p>
                                  <p className="text-2xl font-black" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                                    {scholarship.university?.min_cgpa ? `${scholarship.university.min_cgpa}/4.0` : 'N/A'}
                                  </p>
                                  <p className="text-[10px] mt-1" style={{ color: theme.textSecondary }}>Or equivalent in your grading system</p>
                                </div>
                                <div className="p-4 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.07)' : '#eff6ff', borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }}>
                                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Percentage Equivalent</p>
                                  <p className="text-2xl font-black" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                                    {scholarship.university?.min_cgpa ? `${Math.round(scholarship.university.min_cgpa / 4 * 100)}%+` : 'N/A'}
                                  </p>
                                  <p className="text-[10px] mt-1" style={{ color: theme.textSecondary }}>For international applicants</p>
                                </div>
                              </div>
                            </div>

                            {/* English Language */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>English Language Requirements</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { label: 'IELTS Academic', val: scholarship.university?.min_ielts, color: 'text-rose-500', note: 'Overall band; check course for section minimums' },
                                  { label: 'TOEFL iBT', val: scholarship.university?.min_toefl, color: 'text-blue-500', note: 'Total score; check course for sub-scores' },
                                  { label: 'PTE Academic', val: scholarship.university?.min_pte, color: 'text-violet-500', note: 'Overall; check course for skill minimums' },
                                ].map(({ label, val, color, note }) => (
                                  <div key={label} className="p-4 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border }}>
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textSecondary }}>{label}</p>
                                    <p className={`text-3xl font-black ${color}`}>{val || '—'}</p>
                                    <p className="text-[10px] mt-1 leading-tight" style={{ color: theme.textSecondary }}>{note}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Note */}
                            {(scholarship.university?.min_ielts || scholarship.university?.min_toefl) && (
                              <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-200" style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.07)' : '#fffbeb' }}>
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium" style={{ color: theme.textSecondary }}>Note: Test scores must be less than 2 years old at the time of application</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Required Documents */}
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#f5f3ff', borderColor: theme.border }}>
                            <FileText className="w-4 h-4" style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }} />
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>Required Documents</span>
                          </div>
                          <div className="p-5" style={{ backgroundColor: theme.bgSecondary }}>
                            {scholarship.university?.required_documents ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {scholarship.university.required_documents.split(/[,|\n]/).filter(d => d.trim()).map((doc, i) => (
                                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-medium" style={{ color: theme.text }}>{doc.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {['Statement of Purpose (1000-1500 words)', 'Two Academic Reference Letters', 'Updated CV/Resume', 'Academic Transcripts (Certified)', 'Passport Copy', 'Research Proposal (for PhD)'].map((doc, i) => (
                                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-medium" style={{ color: theme.text }}>{doc}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── BENEFITS TAB ── */}
                    <TabsContent value="benefits">
                      <div className="space-y-5">
                        {/* Header */}
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', borderColor: theme.border }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: isDark ? '#059669' : '#10b981' }}>
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-black text-sm" style={{ color: theme.text }}>Scholarship Benefits</p>
                              <p className="text-xs" style={{ color: theme.textSecondary }}>What's covered in this opportunity</p>
                            </div>
                          </div>
                          <div className="p-5" style={{ backgroundColor: theme.bgSecondary }}>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {[
                                { icon: Banknote, label: 'Tuition Fees', desc: 'Full coverage of program tuition', light: 'bg-blue-100 text-blue-600', dark: 'rgba(59,130,246,0.15)', darkText: '#93c5fd' },
                                { icon: Users, label: 'Living Allowance', desc: 'Monthly stipend for accommodation & food', light: 'bg-emerald-100 text-emerald-600', dark: 'rgba(16,185,129,0.15)', darkText: '#6ee7b7' },
                                { icon: Globe, label: 'Travel Grant', desc: 'Return airfare to home country', light: 'bg-violet-100 text-violet-600', dark: 'rgba(139,92,246,0.15)', darkText: '#c4b5fd' },
                                { icon: ShieldCheck, label: 'Health Insurance', desc: 'Comprehensive medical coverage', light: 'bg-rose-100 text-rose-600', dark: 'rgba(239,68,68,0.15)', darkText: '#fca5a5' },
                                { icon: TrendingUp, label: 'Research Funding', desc: 'Additional grants for research projects', light: 'bg-amber-100 text-amber-600', dark: 'rgba(245,158,11,0.15)', darkText: '#fcd34d' },
                                { icon: Award, label: 'Conference Support', desc: 'Funding for academic conferences', light: 'bg-indigo-100 text-indigo-600', dark: 'rgba(99,102,241,0.15)', darkText: '#a5b4fc' },
                              ].map(({ icon: Icon, label, desc, light, dark, darkText }) => (
                                <div key={label} className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border }}>
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isDark ? dark : undefined }} >
                                    {isDark
                                      ? <Icon className="w-4 h-4" style={{ color: darkText }} />
                                      : <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${light}`}><Icon className="w-4 h-4" /></div>
                                    }
                                  </div>
                                  <div>
                                    <p className="text-xs font-black" style={{ color: theme.text }}>{label}</p>
                                    <p className="text-[11px]" style={{ color: theme.textSecondary }}>{desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Total Value */}
                            <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textSecondary }}>Total Value</p>
                              <p className="text-3xl font-black" style={{ color: theme.text }}>
                                {convertAndFormat(scholarship.funding_amount || scholarship.amount || '0')}
                              </p>
                              <p className="text-[11px] mt-1" style={{ color: theme.textSecondary }}>Estimated total scholarship value per year</p>
                            </div>
                          </div>
                        </div>

                        {scholarship.verification_notes && (
                          <div className="p-4 rounded-2xl border border-emerald-200" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : '#f0fdf4' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-600">Verification Notes</p>
                            <p className="text-sm font-medium" style={{ color: theme.text }}>{scholarship.verification_notes}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── PROCESS TAB ── */}
                    <TabsContent value="application">
                      <div className="space-y-5">
                        {/* Header */}
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
                          <div className="px-5 py-4 border-b" style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#f5f3ff', borderColor: theme.border }}>
                            <p className="font-black text-sm" style={{ color: theme.text }}>Application Process</p>
                            <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>Step-by-step guide to apply</p>
                          </div>
                          <div className="p-5 space-y-3" style={{ backgroundColor: theme.bgSecondary }}>
                            {(() => {
                              const defaultSteps = [
                                { title: 'Create Account', desc: "Register on the university's application portal", time: '5 mins' },
                                { title: 'Complete Profile', desc: 'Fill in personal and academic information', time: '20 mins' },
                                { title: 'Upload Documents', desc: 'Submit all required documents and certificates', time: '30 mins' },
                                { title: 'Write Essays', desc: 'Complete Statement of Purpose and other essays', time: '2-3 days' },
                                { title: 'Submit Application', desc: 'Review everything and submit before the deadline', time: '10 mins' },
                              ];
                              const dbSteps = scholarship.university?.admission_process
                                ? scholarship.university.admission_process.split(/[|\n]/).filter(s => s.trim()).map((s, i) => ({
                                    title: `Step ${i + 1}`,
                                    desc: s.replace(/^\d+\./, '').trim(),
                                    time: '',
                                  }))
                                : null;
                              const steps = dbSteps || defaultSteps;
                              return steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border }}>
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm" style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', color: isDark ? '#fcd34d' : '#b45309', border: `2px solid ${isDark ? 'rgba(245,158,11,0.4)' : '#fcd34d'}` }}>{i + 1}</div>
                                  <div className="flex-1">
                                    <p className="font-black text-sm" style={{ color: theme.text }}>{step.title}</p>
                                    <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>{step.desc}</p>
                                  </div>
                                  {step.time && <span className="text-xs font-bold text-amber-500 shrink-0">{step.time}</span>}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Important Dates */}
                        <div className="p-5 rounded-2xl border" style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.07)' : '#fffbeb', borderColor: isDark ? 'rgba(245,158,11,0.25)' : '#fde68a' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4" style={{ color: isDark ? '#fcd34d' : '#d97706' }} />
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? '#fcd34d' : '#b45309' }}>Important Dates</span>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textSecondary }}>Application Opens</p>
                              <p className="font-black text-sm" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {scholarship.deadline ? new Date(new Date(scholarship.deadline).setMonth(new Date(scholarship.deadline).getMonth() - 3)).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Check website'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: theme.textSecondary }}>Application Deadline</p>
                              <p className="font-black text-sm text-red-500">
                                {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {scholarship.university?.admission_notes && (
                          <div className="p-4 rounded-2xl border border-amber-200" style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Important Notes</p>
                            <p className="text-sm font-medium" style={{ color: theme.text }}>{scholarship.university.admission_notes}</p>
                          </div>
                        )}

                        {scholarship.scholarship_url && (
                          <a href={scholarship.scholarship_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }}>
                            Apply on Official Website <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="p-6 rounded-[2rem] border shadow-xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
              <h4 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</h4>
              <div className="space-y-3">
                <Button
                  onClick={handleToggleTracking}
                  className="w-full h-12 rounded-2xl font-black text-sm shadow-lg"
                  style={{ backgroundColor: isTracking ? '#ef4444' : '#1e3a8a', color: 'white' }}
                >
                  {isTracking ? <Trash2 className="w-4 h-4 mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                  {isTracking ? "Remove from Tracker" : "Track Scholarship"}
                </Button>
                <ApplyButton scholarship={scholarship} variant="detail" />
              </div>
            </div>

            {/* Funding Summary */}
            <div className="p-6 rounded-[2rem] border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
              <h4 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}><Banknote className="w-4 h-4 text-emerald-500" /> Funding Summary</h4>
              <div className="space-y-3">
                {[
                  { label: "Total Award", val: convertAndFormat(scholarship.funding_amount || scholarship.amount || "0") },
                  { label: "Funding Type", val: scholarship.funding_type || "Not specified" },
                  { label: "Currency", val: scholarship.currency || "USD" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: theme.border }}>
                    <span className="text-xs font-bold" style={{ color: theme.textSecondary }}>{label}</span>
                    <span className="text-sm font-black" style={{ color: theme.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* University Info */}
            {scholarship.university && (
              <div className="p-6 rounded-[2rem] border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                <h4 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}><Users className="w-4 h-4 text-blue-500" /> University Info</h4>
                <div className="space-y-3">
                  {[
                    { label: "Institution", val: scholarship.university_name },
                    { label: "City", val: scholarship.university.city || scholarship.city },
                    { label: "Country", val: scholarship.country },
                    { label: "QS Ranking", val: scholarship.university.qs_ranking ? `#${scholarship.university.qs_ranking}` : "Not listed" },
                    { label: "Est.", val: scholarship.university.established_year || "N/A" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: theme.border }}>
                      <span className="text-xs font-bold" style={{ color: theme.textSecondary }}>{label}</span>
                      <span className="text-sm font-black truncate max-w-[140px] text-right" style={{ color: theme.text }}>{val || "N/A"}</span>
                    </div>
                  ))}
                  {scholarship.university.website_url && (
                    <a href={scholarship.university.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 text-xs font-bold hover:underline mt-1">
                      <Globe className="w-3.5 h-3.5" /> Visit University Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Fraud Badge */}
            {scholarship.fraud_badge && (
              <div className="p-6 rounded-[2rem] border" style={{ backgroundColor: theme.bgSecondary, borderColor: scholarship.fraud_badge.is_safe ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
                <h4 className="text-base font-black mb-3 flex items-center gap-2" style={{ color: theme.text }}>
                  <ShieldCheck className={`w-4 h-4 ${scholarship.fraud_badge.is_safe ? 'text-emerald-500' : 'text-red-500'}`} />
                  Security Status
                </h4>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black ${scholarship.fraud_badge.is_safe ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                  {scholarship.fraud_badge.is_safe ? <BadgeCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {scholarship.fraud_badge.badge_text}
                </div>
                <p className="text-xs mt-2 font-medium" style={{ color: theme.textSecondary }}>
                  Risk Level: {scholarship.fraud_badge.risk_level} · Score: {scholarship.fraud_badge.risk_score}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

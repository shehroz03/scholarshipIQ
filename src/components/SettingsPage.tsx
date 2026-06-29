import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  GraduationCap, User, BookOpen, Bell, Save, Loader2, Globe, Phone,
  MapPin, Calculator, Calendar, BookCheck, Microscope, History,
  Target, Briefcase, Wallet, FileText, ShieldCheck, Award,
  FilePlus, Landmark, Languages, DollarSign, PenTool, CheckCircle2, ChevronLeft, Settings
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

export function SettingsPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const isDark = false;
  const theme = lightTheme;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "", email: "", nationality: "Pakistan", phone_number: "",
    cgpa: 0, cgpa_scale: "4.0", current_university: "", current_degree: "Bachelors",
    major: "", graduation_year: 2025, english_test_type: "None", ielts_overall: 0,
    ielts_listening: 0, ielts_reading: 0, ielts_writing: 0, ielts_speaking: 0,
    toefl_score: 0, toefl_reading: 0, toefl_listening: 0, toefl_writing: 0, toefl_speaking: 0,
    pte_score: 0, duolingo_score: 0, target_degree: "Masters",
    target_field: "", target_country: "United Kingdom", target_start_year: 2025,
    study_mode: "Full-time", monthly_family_income: "Below $500", can_afford_partial: false,
    max_budget_gbp: 0, scholarship_type_pref: "Any", work_experience_years: "0",
    work_experience_type: "Industry", research_experience: false, has_publications: false,
    leadership_activities: "", passport_valid: false, transcripts_ready: false,
    sop_ready: "No", references_count: 0, cv_ready: false, email_notifications: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // IELTS & TOEFL Auto-Calculators
  useEffect(() => {
    if (profile.english_test_type === "IELTS") {
      const { ielts_listening, ielts_reading, ielts_writing, ielts_speaking } = profile;
      const average = (ielts_listening + ielts_reading + ielts_writing + ielts_speaking) / 4;
      // Round to nearest 0.5 (e.g., 6.25 -> 6.5, 6.75 -> 7.0)
      const rounded = Math.round(average * 2) / 2;
      if (rounded !== profile.ielts_overall) {
        setProfile(prev => ({ ...prev, ielts_overall: rounded }));
      }
    } else if (profile.english_test_type === "TOEFL") {
      const { toefl_reading, toefl_listening, toefl_writing, toefl_speaking } = profile;
      const total = (toefl_reading || 0) + (toefl_listening || 0) + (toefl_writing || 0) + (toefl_speaking || 0);
      if (total !== profile.toefl_score) {
        setProfile(prev => ({ ...prev, toefl_score: total }));
      }
    }
  }, [
    profile.ielts_listening, profile.ielts_reading, profile.ielts_writing, profile.ielts_speaking,
    profile.toefl_reading, profile.toefl_listening, profile.toefl_writing, profile.toefl_speaking,
    profile.english_test_type
  ]);

  const fetchProfile = async () => {
    try {
      const data = await api.users.getMe();
      setProfile(prev => ({ ...prev, ...data }));
    } catch (err) {
      toast.error("Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.users.updateProfile(profile);
      toast.success("Profile Updated Successfully! ✅");
      setTimeout(() => onNavigate('dashboard'), 1500);
    } catch (err) {
      toast.error("Error updating profile ❌");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <header className="backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50 transition-all duration-300" style={{ 
          backgroundColor: isDark ? 'rgba(6,8,24,0.6)' : 'rgba(255,255,255,0.8)', 
          borderColor: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(226,232,240,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0" style={{
              background: 'linear-gradient(135deg, #f4c44e, #8b5cf6)',
              boxShadow: '0 0 20px rgba(244,196,78,0.4)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ color: theme.text, fontWeight: 900, fontSize: 16, letterSpacing: "0.02em" }}>Neural Engine</div>
              <div style={{ color: "rgba(232,180,58,0.9)", fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>Settings Protocol</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => onNavigate('dashboard')} 
              style={{ 
                background: 'transparent', border: `1px solid ${isDark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.1)'}`, 
                color: theme.text, padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.02)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4" style={{
            background: isDark ? 'rgba(244,196,78,0.1)' : 'rgba(244,196,78,0.05)',
            borderColor: isDark ? 'rgba(244,196,78,0.2)' : 'rgba(244,196,78,0.1)',
            color: isDark ? '#a5b4fc' : '#e8b43a'
          }}>
            <Settings className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Configuration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight" style={{ color: theme.text }}>Profile Settings</h1>
          <p className="text-lg font-medium" style={{ color: theme.textSecondary }}>Complete your profile to unlock <span className="text-indigo-500 font-bold">100% matched</span> recommendations.</p>
        </div>

        <div className="space-y-8">
          {/* 1. Personal Information */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>1. Personal Information</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Your basic contact and identity details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Full Name</Label>
                  <Input
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Email Address</Label>
                  <Input
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Nationality</Label>
                  <Input
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.nationality}
                    onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Phone Number</Label>
                  <Input
                    className="h-12 rounded-xl"
                    placeholder="+92 300 1234567"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.phone_number}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Academic Background */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.05)' : '#f5f3ff', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>2. Academic Background</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Details about your current/previous education</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-2 space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>University / College</Label>
                  <Input
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.current_university}
                    onChange={(e) => setProfile({ ...profile, current_university: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Degree Level</Label>
                  <Select value={profile.current_degree} onValueChange={(v) => setProfile({ ...profile, current_degree: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="High School">High School</SelectItem>
                      <SelectItem value="Bachelors">Bachelors</SelectItem>
                      <SelectItem value="Masters">Masters</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Major / Field of Study</Label>
                  <Input
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>CGPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.cgpa}
                    onChange={(e) => setProfile({ ...profile, cgpa: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>CGPA Scale</Label>
                  <Select value={profile.cgpa_scale} onValueChange={(v) => setProfile({ ...profile, cgpa_scale: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="4.0">4.0 Scale</SelectItem>
                      <SelectItem value="5.0">5.0 Scale</SelectItem>
                      <SelectItem value="10.0">10.0 Scale</SelectItem>
                      <SelectItem value="100%">100% Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Graduation Year</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.graduation_year}
                    onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. English Proficiency */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#f0fdf4', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>3. English Proficiency</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Your language test scores (IELTS, TOEFL, etc.)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="max-w-md space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Test Type</Label>
                <Select value={profile.english_test_type} onValueChange={(v) => setProfile({ ...profile, english_test_type: v })}>
                  <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                    <SelectItem value="None">None / Not Taken</SelectItem>
                    <SelectItem value="IELTS">IELTS</SelectItem>
                    <SelectItem value="TOEFL">TOEFL iBT</SelectItem>
                    <SelectItem value="PTE">PTE Academic</SelectItem>
                    <SelectItem value="Duolingo">Duolingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profile.english_test_type === "IELTS" && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 rounded-2xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-emerald-500 uppercase">Overall Band</Label>
                    <div className="h-10 rounded-lg flex items-center justify-center font-black text-xl border-2 border-emerald-500/30 bg-emerald-500/10" style={{ color: theme.text }}>
                      {profile.ielts_overall}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Listening</Label>
                    <Input type="number" step="0.5" className="h-10 rounded-lg" value={profile.ielts_listening} onChange={(e) => setProfile({ ...profile, ielts_listening: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Reading</Label>
                    <Input type="number" step="0.5" className="h-10 rounded-lg" value={profile.ielts_reading} onChange={(e) => setProfile({ ...profile, ielts_reading: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Writing</Label>
                    <Input type="number" step="0.5" className="h-10 rounded-lg" value={profile.ielts_writing} onChange={(e) => setProfile({ ...profile, ielts_writing: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Speaking</Label>
                    <Input type="number" step="0.5" className="h-10 rounded-lg" value={profile.ielts_speaking} onChange={(e) => setProfile({ ...profile, ielts_speaking: parseFloat(e.target.value) })} />
                  </div>
                </div>
              )}

              {profile.english_test_type === "TOEFL" && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 rounded-2xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-blue-500 uppercase">Total Score</Label>
                    <div className="h-10 rounded-lg flex items-center justify-center font-black text-xl border-2 border-blue-500/30 bg-blue-500/10" style={{ color: theme.text }}>
                      {profile.toefl_score}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Reading</Label>
                    <Input type="number" max="30" className="h-10 rounded-lg" value={profile.toefl_reading} onChange={(e) => setProfile({ ...profile, toefl_reading: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Listening</Label>
                    <Input type="number" max="30" className="h-10 rounded-lg" value={profile.toefl_listening} onChange={(e) => setProfile({ ...profile, toefl_listening: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Writing</Label>
                    <Input type="number" max="30" className="h-10 rounded-lg" value={profile.toefl_writing} onChange={(e) => setProfile({ ...profile, toefl_writing: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Speaking</Label>
                    <Input type="number" max="30" className="h-10 rounded-lg" value={profile.toefl_speaking} onChange={(e) => setProfile({ ...profile, toefl_speaking: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              )}

              {(profile.english_test_type === "PTE" || profile.english_test_type === "Duolingo") && (
                <div className="max-w-xs space-y-2">
                  <Label className="text-xs font-bold" style={{ color: '#64748b' }}>Total Score</Label>
                  <Input type="number" className="h-12 rounded-xl" value={profile.english_test_type === "PTE" ? profile.pte_score : profile.duolingo_score} onChange={(e) => setProfile({ ...profile, [profile.english_test_type === "PTE" ? "pte_score" : "duolingo_score"]: parseInt(e.target.value) })} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Target Study Plans */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : '#fffbeb', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>4. Target Study Plans</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Where and what do you want to study next?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Target Degree</Label>
                  <Select value={profile.target_degree} onValueChange={(v) => setProfile({ ...profile, target_degree: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="Bachelors">Bachelors</SelectItem>
                      <SelectItem value="Masters">Masters</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Diploma">Postgraduate Diploma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Preferred Field of Study</Label>
                  <Input
                    className="h-12 rounded-xl"
                    placeholder="e.g. Artificial Intelligence, Public Health"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.target_field}
                    onChange={(e) => setProfile({ ...profile, target_field: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Target Country</Label>
                  <Select value={profile.target_country} onValueChange={(v) => setProfile({ ...profile, target_country: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Europe">Other Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Target Intake Year</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    value={profile.target_start_year}
                    onChange={(e) => setProfile({ ...profile, target_start_year: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Study Mode</Label>
                  <Select value={profile.study_mode} onValueChange={(v) => setProfile({ ...profile, study_mode: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Distance Learning">Online / Distance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Financial Profile */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.05)' : '#f5f3ff', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>5. Financial Profile</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Understanding your budget helps us find realistic options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Monthly Family Income</Label>
                  <Select value={profile.monthly_family_income} onValueChange={(v) => setProfile({ ...profile, monthly_family_income: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="Below $500">Below $500</SelectItem>
                      <SelectItem value="$500 - $1,500">$500 - $1,500</SelectItem>
                      <SelectItem value="$1,500 - $3,000">$1,500 - $3,000</SelectItem>
                      <SelectItem value="Above $3,000">Above $3,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Personal Budget (Total Savings/Support)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <Input
                      type="number"
                      className="h-12 rounded-xl pl-10"
                      placeholder="Enter amount in USD"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      value={profile.max_budget_gbp}
                      onChange={(e) => setProfile({ ...profile, max_budget_gbp: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 rounded-2xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Can afford partial tuition?</Label>
                    <p className="text-xs opacity-60">Are you open to 50% or 70% scholarships?</p>
                  </div>
                  <Switch checked={profile.can_afford_partial} onCheckedChange={(v) => setProfile({ ...profile, can_afford_partial: v })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Scholarship Preference</Label>
                  <Select value={profile.scholarship_type_pref} onValueChange={(v) => setProfile({ ...profile, scholarship_type_pref: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="Full">Full Scholarships Only</SelectItem>
                      <SelectItem value="Partial">Partial / Tuition Fee Waivers</SelectItem>
                      <SelectItem value="Any">Show All Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Experience & Research */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(236, 72, 153, 0.05)' : '#fdf2f8', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-600/20">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>6. Experience & Research</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Boost your profile with professional background</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Work Experience (Years)</Label>
                  <Select value={profile.work_experience_years} onValueChange={(v) => setProfile({ ...profile, work_experience_years: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="0">Fresh / No Experience</SelectItem>
                      <SelectItem value="1-2">1 - 2 Years</SelectItem>
                      <SelectItem value="3-5">3 - 5 Years</SelectItem>
                      <SelectItem value="5+">5+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Industry Type</Label>
                  <Select value={profile.work_experience_type} onValueChange={(v) => setProfile({ ...profile, work_experience_type: v })}>
                    <SelectTrigger className="h-12 rounded-xl" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                      <SelectItem value="Industry">Industry / Corporate</SelectItem>
                      <SelectItem value="Teaching">Teaching / Academia</SelectItem>
                      <SelectItem value="Public">Public Sector / NGO</SelectItem>
                      <SelectItem value="Freelance">Self-employed / Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: theme.border }}>
                  <Label className="text-sm font-bold">Research Experience</Label>
                  <Switch checked={profile.research_experience} onCheckedChange={(v) => setProfile({ ...profile, research_experience: v })} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: theme.border }}>
                  <Label className="text-sm font-bold">Publications</Label>
                  <Switch checked={profile.has_publications} onCheckedChange={(v) => setProfile({ ...profile, has_publications: v })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider" style={{ color: '#64748b' }}>Leadership & Extracurriculars</Label>
                <Textarea
                  className="rounded-2xl min-h-[100px]"
                  placeholder="Tell us about your leadership roles, volunteer work, or clubs..."
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  value={profile.leadership_activities}
                  onChange={(e) => setProfile({ ...profile, leadership_activities: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. Document Readiness */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.05)' : '#f0fdf4', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-600/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>7. Document Readiness</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Are you ready to apply today?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: theme.border }}>
                    <Switch checked={profile.passport_valid} onCheckedChange={(v) => setProfile({...profile, passport_valid: v})} />
                    <Label className="text-sm font-bold">Valid Passport</Label>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: theme.border }}>
                    <Switch checked={profile.transcripts_ready} onCheckedChange={(v) => setProfile({...profile, transcripts_ready: v})} />
                    <Label className="text-sm font-bold">Official Transcripts</Label>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: theme.border }}>
                    <Switch checked={profile.cv_ready} onCheckedChange={(v) => setProfile({...profile, cv_ready: v})} />
                    <Label className="text-sm font-bold">Modern CV / Resume</Label>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold opacity-60">SOP Status</Label>
                    <Select value={profile.sop_ready} onValueChange={(v) => setProfile({...profile, sop_ready: v})}>
                        <SelectTrigger className="h-10 rounded-lg" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                            <SelectItem value="No">Not Started</SelectItem>
                            <SelectItem value="Draft">Draft Ready</SelectItem>
                            <SelectItem value="Yes">Finalized</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold opacity-60">Reference Letters</Label>
                    <Input type="number" className="h-10 rounded-lg" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} value={profile.references_count} onChange={(e) => setProfile({...profile, references_count: parseInt(e.target.value)})} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8. Preferences */}
          <Card className="border-none rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group" style={{ 
            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' : '#ffffff',
            border: isDark ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: isDark ? 'blur(24px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
            boxShadow: isDark ? '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(0,0,0,0.03)' : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            <CardHeader className="p-8 border-b" style={{ backgroundColor: isDark ? 'rgba(75, 85, 99, 0.05)' : '#f9fafb', borderColor: theme.border }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-600/20">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black" style={{ color: theme.text }}>8. Preferences</CardTitle>
                  <CardDescription style={{ color: theme.textSecondary }}>Manage your experience and notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed" style={{ borderColor: theme.border }}>
                  <div className="space-y-1">
                    <Label className="text-sm font-bold">Email Notifications</Label>
                    <p className="text-xs opacity-60">Receive alerts for deadlines and new matches.</p>
                  </div>
                  <Switch checked={profile.email_notifications} onCheckedChange={(v) => setProfile({ ...profile, email_notifications: v })} />
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-6 pt-32 pb-16 relative mt-8">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[150px] bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center gap-5 w-full max-w-lg relative z-10">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group relative w-full overflow-hidden rounded-[32px] p-[2px] transition-all duration-300 cursor-pointer"
              style={{
                background: isSaving ? 'rgba(100,116,139,0.2)' : 'linear-gradient(135deg, rgba(165,180,252,0.6), rgba(216,180,254,0.6))',
                boxShadow: isSaving ? 'none' : '0 20px 40px -10px rgba(244,196,78,0.5)',
                transform: 'translateY(0)',
              }}
              onMouseOver={e => { if(!isSaving) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(244,196,78,0.8)'; } }}
              onMouseOut={e => { if(!isSaving) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(244,196,78,0.5)'; } }}
            >
              {/* Inner wrapper for gradient border effect */}
              <div 
                className="relative flex items-center justify-center gap-4 w-full h-[76px] rounded-[30px] transition-all duration-300 overflow-hidden"
                style={{
                  background: isSaving ? (isDark ? 'rgba(30,41,59,0.8)' : '#f1f5f9') : 'linear-gradient(135deg, #e8b43a, #d4a017)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Shine animation container */}
                <div className="absolute top-0 bottom-0 w-[50%] -translate-x-[300%] group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none">
                  <div 
                    className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      transform: 'skewX(-25deg)',
                    }}
                  />
                </div>
                
                {isSaving ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
                    <span className="text-lg font-black tracking-widest uppercase text-slate-400">Syncing Profile...</span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                      <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                    <span className="text-lg md:text-xl font-black tracking-widest uppercase text-white drop-shadow-md">
                      Commit Changes
                    </span>
                  </>
                )}
              </div>
            </button>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm shadow-sm mt-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> 
              <span className="text-sm md:text-base font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 drop-shadow-sm">
                End-to-End Encrypted Telemetry
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

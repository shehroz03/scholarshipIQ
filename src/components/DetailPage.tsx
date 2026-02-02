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
  ClipboardList
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "sonner";

// --- Types ---
// Interface imported from ../types/scholarship.ts
// We use the comprehensive type defined in src/types/scholarship.ts

export function DetailPage({ onNavigate, scholarshipId }: { onNavigate: (page: string, params?: any) => void, scholarshipId: number }) {
  const { convertAndFormat } = useCurrency();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScholarship = async () => {
      console.log("Fetching scholarship ID:", scholarshipId);
      setIsLoading(true);
      try {
        const data = await api.scholarships.get(scholarshipId);
        console.log("Scholarship data received:", data);
        setScholarship(data);
      } catch (err) {
        console.error("Failed to fetch scholarship details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchTracking = async () => {
      try {
        const apps = await api.applications.list();
        const app = apps.find((a: any) => a.scholarship_id === Number(scholarshipId));
        if (app) {
          setIsTracking(true);
          setAppRecord(app);
        }
      } catch (err) {
        console.error("Failed to fetch tracking status:", err);
      }
    };

    if (scholarshipId) {
      fetchScholarship();
      fetchTracking();
    }
  }, [scholarshipId]);

  const [isTracking, setIsTracking] = useState(false);
  const [appRecord, setAppRecord] = useState<any>(null);

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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-8 h-8 text-[#1e3a8a]" /></div>;
  }

  if (!scholarship) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Scholarship not found.</div>;
  }

  const getDaysRemaining = (deadline: string) => {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return 0;
    const diff = d.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeft = scholarship?.deadline ? getDaysRemaining(scholarship.deadline) : 0;

  const mapQuery = (scholarship?.latitude && scholarship?.longitude)
    ? `${scholarship.latitude},${scholarship.longitude}`
    : `${scholarship?.university_name || 'University'}, ${scholarship?.city || ''}, ${scholarship?.country || ''}`;

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-blue-100 selection:text-blue-900">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-4 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <div className="p-2 bg-[#1e3a8a] rounded-xl text-white shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">ScholarIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <CurrencySelector />
            <Button
              variant="outline"
              className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
              onClick={() => onNavigate('search')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 relative">
        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition-colors">Home</button>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <button onClick={() => onNavigate('search')} className="hover:text-blue-600 transition-colors">Scholarships</button>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-slate-900 font-bold truncate">{scholarship.title}</span>
        </div>

        {scholarship.is_suspicious && (
          <div className="mb-8 bg-red-50 border border-red-200 p-6 rounded-3xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="p-3 bg-red-100 rounded-2xl"><AlertTriangle className="w-8 h-8 text-red-600 shrink-0" /></div>
            <div>
              <p className="font-black text-red-900 uppercase tracking-widest text-xs mb-1">Security Alert</p>
              <p className="font-bold text-red-800 text-lg mb-1">Potentially Fraudulent Opportunity</p>
              <p className="text-sm text-red-700 leading-relaxed">This scholarship request unusual upfront payments or sensitive personal data. Our AI model has flagged this entry for manual review. <strong>Do not share banking details.</strong></p>
            </div>
          </div>
        )}

        {/* Scholarship HERO Header Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="space-y-4 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-50 text-[#1e3a8a] border-blue-100 font-bold px-3 py-1 rounded-lg">Verified Opportunity</Badge>
                {scholarship.funding_type === 'Full' && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-lg">Fully Funded</Badge>
                )}
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-lg">{scholarship.degree_level}</Badge>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {scholarship.university?.logo_url && (
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <img
                      src={scholarship.university.logo_url}
                      alt={scholarship.university_name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  {scholarship.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 font-semibold text-lg">
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> {scholarship.university_name}, {scholarship.country}</span>
              </div>
            </div>
            <div className="hidden lg:block min-w-[280px]">
              <ApplyButton scholarship={scholarship} variant="detail" className="!mb-0" />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Financial Aid", val: convertAndFormat(scholarship.funding_amount), icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Application Deadline", val: new Date(scholarship.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Field of Study", val: scholarship.field_of_study || "All Disciplines", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Days Remaining", val: `${daysLeft} Days`, icon: Clock, color: daysLeft <= 15 ? "text-red-600" : "text-slate-600", bg: daysLeft <= 15 ? "bg-red-50" : "bg-slate-50" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400/50 hover:bg-blue-50/20 transition-all group">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color === 'text-red-600' ? 'text-red-600' : 'text-slate-900'}`}>{stat.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Application Route Info Box */}
        {scholarship.application_type && (
          <div className={`mb-12 p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8 ${scholarship.application_type === 'direct_form' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
            scholarship.application_type === 'portal_application' ? 'bg-blue-50 border-blue-100 text-blue-900' :
              'bg-orange-50 border-orange-100 text-orange-900'
            }`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${scholarship.application_type === 'direct_form' ? 'bg-emerald-600' :
              scholarship.application_type === 'portal_application' ? 'bg-blue-600' :
                'bg-orange-600'
              }`}>
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black mb-1">
                {scholarship.application_type === 'direct_form' ? 'Direct Application' :
                  scholarship.application_type === 'portal_application' ? 'Online Portal Steps' :
                    'Automatically Considered'}
              </h3>
              <p className="font-medium opacity-80 max-w-2xl leading-relaxed">
                {scholarship.user_note || (scholarship.application_type === 'auto_considered' ? 'This scholarship is automatically awarded based on your admission application. No separate form is required.' : 'Our verified route for this opportunity. Please follow the instructions provided by the university.')}
              </p>
            </div>
            <div className="w-full md:w-auto lg:hidden">
              <ApplyButton scholarship={scholarship} variant="detail" className="!mb-0" />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden">
              <CardContent className="p-8 md:p-12">
                {/* Content Section */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><BookOpen className="w-4 h-4 text-[#1e3a8a]" /></div>
                    <h3 className="text-2xl font-black text-slate-900">Program Overview</h3>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed text-lg font-medium italic border-l-4 border-blue-200 pl-6 bg-slate-50/50 py-6 rounded-r-2xl">
                      "{scholarship.description || "No description provided."}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {/* INFO CARD 1: University */}
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Institution</p>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{scholarship.university_name}</h4>
                    <p className="text-sm text-slate-500 font-medium mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {scholarship.city}, {scholarship.country}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {scholarship.university?.established_year && (
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200">Est. {scholarship.university.established_year}</Badge>
                      )}
                      {scholarship.university?.qs_ranking && (
                        <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50/50">Ranking: {scholarship.university.qs_ranking}</Badge>
                      )}
                    </div>
                    {scholarship.university?.website_url && (
                      <Button asChild variant="secondary" className="w-full bg-white hover:bg-slate-100 border-slate-200 text-slate-900 font-bold h-12 rounded-xl border">
                        <a href={scholarship.university.website_url} target="_blank" rel="noopener noreferrer">Official Website <ExternalLink className="w-4 h-4 ml-2" /></a>
                      </Button>
                    )}
                  </div>

                  {/* INFO CARD 2: Action */}
                  <div className="bg-[#1e3a8a] p-8 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">Management</p>
                    <h4 className="text-xl font-black mb-4">Save for Later</h4>
                    <p className="text-sm text-blue-100/70 font-medium mb-8 leading-relaxed">Add this scholarship to your personal tracking dashboard to get deadline alerts.</p>
                    <Button
                      onClick={async () => {
                        try { await api.dashboard.save(scholarship.id); alert("Saved!"); }
                        catch (e) { alert("Already saved."); }
                      }}
                      className="w-full bg-white hover:bg-blue-50 text-[#1e3a8a] font-bold h-12 rounded-xl"
                    >
                      <Bookmark className="w-4 h-4 mr-2" /> Track Scholarship
                    </Button>
                  </div>
                </div>

                {/* ============================================ */}
                {/* NET COST CALCULATOR - VERIFIED FINANCIAL DATA */}
                {/* ============================================ */}
                {(scholarship.tuition_fee_per_year || scholarship.scholarship_amount_value || scholarship.net_cost_per_year) && (
                  <div className="mb-10 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 p-8 rounded-[2.5rem] shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Calculator className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Net Cost Calculator</h3>
                        <p className="text-sm text-gray-600 font-medium">Verified tuition & scholarship breakdown</p>
                      </div>
                      {scholarship.tuition_verified === "verified" && scholarship.scholarship_verified === "verified" && (
                        <Badge className="ml-auto bg-green-100 text-green-800 border-green-300 py-2 px-4 rounded-full font-bold flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Fully Verified
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Annual Tuition Fee */}
                      <div className="bg-white p-6 rounded-2xl border-2 border-red-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-5 h-5 text-red-600" />
                            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Annual Tuition</p>
                            {scholarship.tuition_verified === "verified" && (
                              <BadgeCheck className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                            {scholarship.tuition_verified === "approximate" && (
                              <CircleAlert className="w-4 h-4 text-amber-500 ml-auto" />
                            )}
                          </div>
                          <p className="text-3xl font-black text-gray-900 mb-2">
                            {scholarship.tuition_fee_per_year || "Not Available"}
                          </p>
                          {scholarship.tuition_source_url && (
                            <a href={scholarship.tuition_source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> View Source
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Scholarship Amount */}
                      <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-green-600" />
                            <p className="text-xs font-black text-green-700 uppercase tracking-widest">Scholarship</p>
                            {scholarship.scholarship_verified === "verified" && (
                              <BadgeCheck className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                            {scholarship.scholarship_verified === "approximate" && (
                              <CircleAlert className="w-4 h-4 text-amber-500 ml-auto" />
                            )}
                          </div>
                          <p className="text-3xl font-black text-green-700 mb-2">
                            -{scholarship.scholarship_amount_value || scholarship.funding_amount || "Not Available"}
                          </p>
                          {scholarship.scholarship_type && (
                            <Badge className="bg-green-100 text-green-800 border-none text-xs">
                              {scholarship.scholarship_type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {scholarship.scholarship_source_url && (
                            <a href={scholarship.scholarship_source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2">
                              <Link2 className="w-3 h-3" /> View Source
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Net Cost */}
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <Banknote className="w-5 h-5 text-blue-200" />
                            <p className="text-xs font-black text-blue-200 uppercase tracking-widest">You Pay (Approx)</p>
                          </div>
                          <p className="text-3xl font-black mb-2">
                            {scholarship.net_cost_per_year || "Calculate Below"}
                          </p>
                          <p className="text-xs text-blue-200 leading-relaxed">
                            {scholarship.net_cost_assumptions || "Based on official university data"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Info */}
                    {scholarship.verification_notes && (
                      <div className="mt-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <CircleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Verification Notes</p>
                            <p className="text-sm text-gray-700">{scholarship.verification_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Last Verified */}
                    {scholarship.verified_at && (
                      <p className="mt-4 text-xs text-gray-500 text-center">
                        Last verified: {new Date(scholarship.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-10">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-50 p-1.5 rounded-3xl h-16 border border-gray-100 mb-8">
                      <TabsTrigger value="overview" className="rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-lg hover:text-[#1e3a8a] hover:bg-white/50 transition-all">Overview</TabsTrigger>
                      <TabsTrigger value="eligibility" className="rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-lg hover:text-[#1e3a8a] hover:bg-white/50 transition-all">Requirements</TabsTrigger>
                      <TabsTrigger value="benefits" className="rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-lg hover:text-[#1e3a8a] hover:bg-white/50 transition-all">Benefits</TabsTrigger>
                      <TabsTrigger value="application" className="rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-lg hover:text-[#1e3a8a] hover:bg-white/50 transition-all">Process</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in duration-500">
                      <div className="bg-white p-2 rounded-3xl">
                        <div className="prose prose-blue max-w-none">
                          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-blue-600" /> Program Insight
                          </h3>
                          <p className="text-gray-600 leading-relaxed text-lg italic bg-blue-50/30 p-8 rounded-[2.5rem] border border-dashed border-blue-100 shadow-inner">
                            "{scholarship.description || "No description provided."}"
                          </p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-[2rem] border-2 border-indigo-100 group hover:border-indigo-300 transition-all">
                            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Target Audience</h4>
                            <p className="text-gray-700 font-medium leading-relaxed">
                              This program is specifically designed for students pursuing <strong>{scholarship.degree_level}</strong> studies in <strong>{scholarship.field_of_study || 'All Disciplines'}</strong>.
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-[2rem] border-2 border-emerald-100 group hover:border-emerald-300 transition-all">
                            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Selection Criteria</h4>
                            <p className="text-gray-700 font-medium leading-relaxed">
                              Winners are selected based on academic excellence (Min {scholarship.university?.min_cgpa || '3.0'} CGPA) and leadership potential.
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <div className="px-5 py-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2 shadow-sm">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-gray-700">{scholarship.duration_text || 'Multi-year'}</span>
                          </div>
                          <div className="px-5 py-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2 shadow-sm">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-bold text-gray-700">{scholarship.country}</span>
                          </div>
                          <div className="px-5 py-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-2 shadow-sm">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-bold text-gray-700">International Students</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="eligibility" className="mt-8 space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-3xl border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">Admission Requirements</h3>
                            <p className="text-sm text-gray-600 font-medium">University-specific criteria for {scholarship.university_name} (Masters, international)</p>
                          </div>
                        </div>

                        {/* Academic: curated minimum_cgpa_or_grade or fallback */}
                        <div className="space-y-4">
                          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <TrendingUp className="w-5 h-5 text-purple-600" />
                              <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Academic Performance</h4>
                            </div>
                            {scholarship.university?.minimum_cgpa_or_grade ? (
                              <p className="text-gray-700 font-medium leading-relaxed">{scholarship.university.minimum_cgpa_or_grade}</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200">
                                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Minimum CGPA</p>
                                  <p className="text-3xl font-black text-green-900">{scholarship.university?.min_cgpa || "3.0"}/4.0</p>
                                  <p className="text-xs text-green-600 mt-2 font-medium">Or equivalent in your grading system</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border-2 border-blue-200">
                                  <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Percentage Equivalent</p>
                                  <p className="text-3xl font-black text-blue-900">{((scholarship.university?.min_cgpa || 3.0) * 20 + 20).toFixed(0)}%+</p>
                                  <p className="text-xs text-blue-600 mt-2 font-medium">For international applicants</p>
                                </div>
                              </div>
                            )}
                            {scholarship.university?.other_academic_requirements && (
                              <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2">Other academic requirements</p>
                                <p className="text-sm text-gray-700">{scholarship.university.other_academic_requirements}</p>
                              </div>
                            )}
                          </div>

                          {/* English: curated JSON or fallback to min_ielts/min_toefl/min_pte */}
                          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <Globe className="w-5 h-5 text-purple-600" />
                              <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">English Language Requirements</h4>
                            </div>
                            {(() => {
                              try {
                                const eng = scholarship.university?.english_language_requirements
                                  ? JSON.parse(scholarship.university.english_language_requirements) as Record<string, string>
                                  : null;
                                if (eng && (eng.ielts || eng.toefl_ibt || eng.pte)) {
                                  return (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {eng.ielts && (
                                          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-2xl border-2 border-red-200">
                                            <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">IELTS Academic</p>
                                            <p className="text-sm font-bold text-red-900">{eng.ielts}</p>
                                          </div>
                                        )}
                                        {eng.toefl_ibt && (
                                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-200">
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">TOEFL iBT</p>
                                            <p className="text-sm font-bold text-blue-900">{eng.toefl_ibt}</p>
                                          </div>
                                        )}
                                        {eng.pte && (
                                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200">
                                            <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2">PTE Academic</p>
                                            <p className="text-sm font-bold text-purple-900">{eng.pte}</p>
                                          </div>
                                        )}
                                      </div>
                                      {eng.notes && (
                                        <p className="text-xs text-gray-600 font-medium">{eng.notes}</p>
                                      )}
                                    </div>
                                  );
                                }
                              } catch (_) { }
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-2xl border-2 border-red-200">
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-3">IELTS Academic</p>
                                    <p className="text-4xl font-black text-red-900 mb-2">{scholarship.university?.min_ielts || "6.5"}</p>
                                    <p className="text-xs text-red-700 font-medium">Overall band; check course for section minimums</p>
                                  </div>
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border-2 border-blue-200">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">TOEFL iBT</p>
                                    <p className="text-4xl font-black text-blue-900 mb-2">{scholarship.university?.min_toefl || "90"}</p>
                                    <p className="text-xs text-blue-700 font-medium">Total score; check course for sub-scores</p>
                                  </div>
                                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-purple-200">
                                    <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-3">PTE Academic</p>
                                    <p className="text-4xl font-black text-purple-900 mb-2">{scholarship.university?.min_pte || "60"}</p>
                                    <p className="text-xs text-purple-700 font-medium">Overall; check course for skill minimums</p>
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl">
                              <p className="text-xs text-yellow-800 font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Note: Test scores must be less than 2 years old at the time of application
                              </p>
                            </div>
                          </div>

                          {/* Required Documents: curated list or default */}
                          <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="w-5 h-5 text-purple-600" />
                              <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Required Documents</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(() => {
                                let docs: string[] = [];
                                try {
                                  if (scholarship.university?.required_documents) {
                                    const parsed = JSON.parse(scholarship.university.required_documents);
                                    docs = Array.isArray(parsed) ? parsed : [];
                                  }
                                } catch (_) { }
                                if (docs.length === 0) {
                                  docs = [
                                    "Statement of Purpose (1000-1500 words)",
                                    "Two Academic Reference Letters",
                                    "Updated CV/Resume",
                                    "Academic Transcripts (Certified)",
                                    "Passport Copy",
                                    "Research Proposal (for PhD)"
                                  ];
                                }
                                return docs.map((req, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                    <p className="text-sm text-gray-700 font-medium">{req}</p>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          {scholarship.university?.admission_notes && (
                            <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl">
                              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Note</p>
                              <p className="text-sm text-gray-700">{scholarship.university.admission_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="benefits" className="mt-8 space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">Scholarship Benefits</h3>
                            <p className="text-sm text-gray-600 font-medium">What's covered in this opportunity</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Tuition Fees */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Tuition Fees</h4>
                                <p className="text-xs text-gray-600 font-medium">Full coverage of program tuition</p>
                              </div>
                            </div>
                          </div>

                          {/* Living Allowance */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-green-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                <Banknote className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Living Allowance</h4>
                                <p className="text-xs text-gray-600 font-medium">Monthly stipend for accommodation & food</p>
                              </div>
                            </div>
                          </div>

                          {/* Travel Grant */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Travel Grant</h4>
                                <p className="text-xs text-gray-600 font-medium">Return airfare to home country</p>
                              </div>
                            </div>
                          </div>

                          {/* Health Insurance */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-red-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Health Insurance</h4>
                                <p className="text-xs text-gray-600 font-medium">Comprehensive medical coverage</p>
                              </div>
                            </div>
                          </div>

                          {/* Research Funding */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Research Funding</h4>
                                <p className="text-xs text-gray-600 font-medium">Additional grants for research projects</p>
                              </div>
                            </div>
                          </div>

                          {/* Conference Support */}
                          <div className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Conference Support</h4>
                                <p className="text-xs text-gray-600 font-medium">Funding for academic conferences</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 bg-white p-6 rounded-2xl border-2 border-green-300">
                          <div className="flex items-center gap-3 mb-3">
                            <Banknote className="w-6 h-6 text-green-600" />
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Total Value</h4>
                          </div>
                          <p className="text-4xl font-black text-green-900 mb-2">{convertAndFormat(scholarship.funding_amount)}</p>
                          <p className="text-sm text-gray-600 font-medium">Estimated total scholarship value per year</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="application" className="mt-8 space-y-6">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-3xl border-2 border-orange-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">Application Process</h3>
                            <p className="text-sm text-gray-600 font-medium">Step-by-step guide to apply</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {scholarship.university?.admission_process ? (
                            scholarship.university.admission_process.split('\n').map((step: string, idx: number) => (
                              <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-400 to-orange-600 group-hover:w-3 transition-all" />
                                <div className="flex items-start gap-4 ml-4">
                                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-orange-900 text-xl">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-lg font-bold text-gray-900 mb-1">{step.replace(/^\d+\.\s*/, '')}</p>
                                    <p className="text-sm text-gray-600 font-medium">Required step for {scholarship.university_name}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            [
                              { step: 1, title: "Create Account", desc: "Register on the university's application portal", time: "5 mins" },
                              { step: 2, title: "Complete Profile", desc: "Fill in personal and academic information", time: "20 mins" },
                              { step: 3, title: "Upload Documents", desc: "Submit all required documents and certificates", time: "30 mins" },
                              { step: 4, title: "Write Essays", desc: "Complete Statement of Purpose and other essays", time: "2-3 days" }
                            ].map((item, idx) => (
                              <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-400 to-orange-600 group-hover:w-3 transition-all" />
                                <div className="flex items-start gap-4 ml-4">
                                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-orange-900 text-xl">
                                    {item.step}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{item.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">{item.desc}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-6 bg-white p-6 rounded-2xl border-2 border-orange-300">
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar className="w-6 h-6 text-orange-600" />
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Important Dates</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Application Opens</p>
                              <p className="text-lg font-black text-gray-900">01 September 2025</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Application Deadline</p>
                              <p className="text-lg font-black text-red-600">{new Date(scholarship.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-10">
            {/* Action Card / Stats Block */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white/80 backdrop-blur-xl sticky top-32 overflow-hidden border border-white/50">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 font-bold uppercase tracking-[0.2em]">Quick Metrics</h3>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>

                <div className="mb-8">
                  <Button
                    onClick={handleToggleTracking}
                    className={`w-full h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl ${isTracking
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                      : "bg-slate-900 text-white hover:bg-[#1e3a8a] shadow-slate-900/20"
                      }`}
                  >
                    {isTracking ? (
                      <span className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> In My Tracker</span>
                    ) : (
                      <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Track Progress</span>
                    )}
                  </Button>
                  {isTracking && (
                    <p className="text-[10px] text-center mt-3 font-black text-emerald-600 uppercase tracking-widest">
                      Pipeline Status: {appRecord?.status} 🎯
                    </p>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Metric 1 */}
                  <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:border-[#1e3a8a]/20 transition-all duration-300">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-[#1e3a8a]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Eligibility</p>
                      <p className="font-extrabold text-slate-900">{scholarship.degree_level}</p>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all duration-300 ${daysLeft <= 15 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100 group hover:bg-white hover:border-red-200"
                    }`}>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                      <Calendar className={`w-6 h-6 ${daysLeft <= 15 ? "text-red-500" : "text-blue-500"}`} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${daysLeft <= 15 ? "text-red-600" : "text-slate-400"}`}>
                        Final Window
                      </p>
                      <p className={`font-extrabold ${daysLeft <= 15 ? "text-red-600" : "text-slate-900"}`}>
                        {new Date(scholarship.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:border-emerald-200 transition-all duration-300">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                      <Banknote className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Verified Aid</p>
                      <p className="font-extrabold text-slate-900">{convertAndFormat(scholarship.funding_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Map Block */}
                <div className="mt-10 pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Provider Location</h4>
                  </div>

                  <div className="relative rounded-[2rem] overflow-hidden bg-slate-100 aspect-square group/map">
                    {/* Placeholder for Map Visual Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 mix-blend-multiply" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/20 backdrop-blur-[2px] border-2 border-white/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-4 group-hover/map:scale-110 transition-transform">
                        <MapPin className="w-10 h-10 text-red-500 animate-bounce" />
                      </div>
                      <h5 className="font-black text-slate-900 mb-1 leading-tight">{scholarship.university_name}</h5>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 leading-relaxed">
                        {scholarship.university?.address || `${scholarship.city}, ${scholarship.country}`}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#1e3a8a] transition-all shadow-xl active:scale-95"
                      >
                        Launch Map ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Verification Footer */}
                <div className="mt-10 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Status Verified</p>
                    <p className="text-[10px] text-emerald-600 font-bold">Data current for Winter 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Apply Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <ApplyButton scholarship={scholarship} variant="detail" className="!mb-0 shadow-2xl" />
      </div>
    </div>
  );
}

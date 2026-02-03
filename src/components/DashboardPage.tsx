import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  GraduationCap,
  Search,
  Bookmark,
  TrendingUp,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  ChevronRight,
  Zap,
  Settings,
  LayoutDashboard,
  LogOut,
  Banknote,
  MessageSquare
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { useCurrency } from "../context/CurrencyContext";
import { Recommendations } from "./Recommendations";
import { NotificationBell } from "./NotificationBell";

function BookmarkCheckedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      <path d="m9 10 2 2 4-4" />
    </svg>
  );
}

interface Scholarship {
  id: number;
  title: string;
  university_name: string;
  university?: any;
  country: string;
  funding_type: string;
  amount: string;
  deadline: string;
  description: string;
  degree_level: string;
  is_suspicious?: boolean;
  match_score?: number;
}

interface SummaryData {
  total_saved: number;
  total_recommended: number;
  profile_completion: number;
  user_name: string;
}

const ScholarshipDashboardCard = ({
  scholarship,
  highlight,
  onNavigate,
  toggleSave,
  savedScholarshipIds,
  convertAndFormat
}: {
  scholarship: Scholarship,
  highlight: boolean,
  onNavigate: any,
  toggleSave: any,
  savedScholarshipIds: number[],
  convertAndFormat: any
}) => (
  <Card className={`border-none shadow-sm hover:shadow-lg transition-all bg-white rounded-3xl group border-2 border-transparent ${highlight ? 'hover:border-emerald-100 bg-emerald-50/10' : 'hover:border-blue-100'}`}>
    <CardContent className="p-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#1e3a8a] transition-colors">{scholarship.title}</h3>
            {scholarship.is_suspicious && <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">Suspicious</Badge>}
            {typeof scholarship.match_score === 'number' && scholarship.match_score > 0 && (
              <Badge className={`border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${scholarship.match_score >= 80 ? "bg-green-500 text-white" :
                scholarship.match_score >= 50 ? "bg-amber-100 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                {scholarship.match_score}% Match ⚡
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-[#1e3a8a]" /> {scholarship.university_name}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#1e3a8a]" /> {scholarship.country}</span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-bold">{scholarship.degree_level}</Badge>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 italic">"{scholarship.description}"</p>
          <div className="flex items-center gap-6 pt-2">
            <span className="px-4 py-2 bg-green-50 text-green-700 rounded-2xl text-xs font-black uppercase tracking-widest">{scholarship.funding_type}</span>
            <span className="flex items-center gap-1 text-gray-900 font-bold">
              <Banknote className="w-4 h-4 text-green-600" /> {convertAndFormat(scholarship.amount)}
            </span>
            <span className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              Ends {new Date(scholarship.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button
            size="lg"
            className="bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-2xl font-black px-8 shadow-lg shadow-blue-900/10 h-14 group/btn flex-1 sm:flex-none"
            onClick={() => onNavigate('detail', { id: scholarship.id })}
          >
            Explore Now
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleSave(scholarship.id)}
            className={`rounded-2xl w-14 h-14 transition-all duration-300 shadow-sm border-2 ${savedScholarshipIds.includes(scholarship.id)
              ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
              : "bg-white text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 border-gray-100"
              }`}
            title={savedScholarshipIds.includes(scholarship.id) ? "Saved" : "Save Scholarship"}
          >
            {savedScholarshipIds.includes(scholarship.id) ? <BookmarkCheckedIcon className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function DashboardPage({ onNavigate, initialParams = {} }: { onNavigate: (page: string, params?: any) => void; initialParams?: any }) {
  const { convertAndFormat } = useCurrency();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recommendations, setRecommendations] = useState<Scholarship[]>([]);
  const [savedScholarshipIds, setSavedScholarshipIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recPage, setRecPage] = useState(0);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const PAGE_SIZE = 25;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sumData, appsData] = await Promise.all([
          api.dashboard.getSummary(),
          api.applications.list()
        ]);
        setSummary(sumData);
        setSavedScholarshipIds(appsData.map((a: any) => a.scholarship_id));
      } catch (err) {
        console.error("Failed to fetch dashboard summary", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchRecs = async () => {
      setIsRecLoading(true);
      try {
        const params = (initialParams?.autoSearch && !hasAutoSearched)
          ? { ...initialParams.filters, limit: PAGE_SIZE, skip: recPage * PAGE_SIZE }
          : { limit: PAGE_SIZE, skip: recPage * PAGE_SIZE };

        const recData = await api.recommendations.list(params);
        // Extract the scholarships array from the response object
        const scholarships = recData.top_scholarships || [];

        // Map the API response to match the Scholarship interface
        const mappedScholarships = scholarships.map((item: any) => ({
          id: item.id,
          title: item.title,
          university_name: item.university_name || "Unknown University",
          country: item.country || "Global",
          funding_type: "Scholarship",
          amount: "Varies",
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Default 90 days from now
          description: item.short_reason || "Scholarship opportunity",
          degree_level: item.degree_level || "Graduate",
          is_suspicious: false,
          match_score: item.fit_score || 0
        }));

        setRecommendations(mappedScholarships);
        if (initialParams?.autoSearch) setHasAutoSearched(true);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setRecommendations([]);
      } finally {
        setIsRecLoading(false);
      }
    };
    fetchRecs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [recPage, initialParams]);

  const toggleSave = async (id: number) => {
    try {
      if (savedScholarshipIds.includes(id)) {
        const apps = await api.applications.list();
        const appToDelete = apps.find((a: any) => a.scholarship_id === id);
        if (appToDelete) {
          await api.applications.delete(appToDelete.id);
          setSavedScholarshipIds(savedScholarshipIds.filter((sid: number) => sid !== id));
        }
      } else {
        await api.applications.save(id, "Saved");
        setSavedScholarshipIds([...savedScholarshipIds, id]);
      }
    } catch (err) {
      alert("Failed to update tracker status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onNavigate('landing');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", active: true, page: 'dashboard' },
    { icon: Search, label: "Find Scholarships", active: false, page: 'search' },
    { icon: MapPin, label: "University Matcher", active: false, page: 'matcher' },
    { icon: MessageSquare, label: "Application Tracker", active: false, page: 'applications' },
    { icon: Settings, label: "Profile Settings", active: false, page: 'settings' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]" />
          <GraduationCap className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1e3a8a]" />
        </div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Building your dashboard...</p>
      </div>
    );
  }

  const stats = [
    { label: "Bookmarked", value: savedScholarshipIds.length, icon: Bookmark, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Matches Found", value: summary?.total_recommended || "0", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Profile Score", value: `${summary?.profile_completion || 0}%`, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Pipeline", value: savedScholarshipIds.length, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e3a8a] hidden lg:flex flex-col border-r border-white/10 shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => onNavigate('landing')}>
            <div className="bg-white p-2 rounded-xl text-[#1e3a8a] transition-transform group-hover:scale-110">
              <GraduationCap className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">ScholarIQ</span>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group ${item.active
                  ? "bg-white text-[#1e3a8a] shadow-lg shadow-black/10"
                  : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? "text-[#1e3a8a]" : "group-hover:scale-110 transition-transform"}`} />
                <span className="font-bold">{item.label}</span>
                {item.active && <div className="ml-auto w-1.5 h-1.5 bg-[#1e3a8a] rounded-full" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <Card className="bg-white/10 border-white/10 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-400 overflow-hidden border-2 border-white/20">
                <Avatar>
                  <AvatarFallback className="bg-blue-400 text-white font-bold">{summary?.user_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-white truncate">{summary?.user_name || "Scholar User"}</p>
                <p className="text-xs text-blue-200/60 truncate">Premium Member</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-xl gap-2 p-0 h-auto"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" /> <span className="text-xs font-bold">Secure Logout</span>
            </Button>
          </Card>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back!</h1>
              <p className="text-gray-500 font-medium">Monitoring {summary?.total_recommended || 0} active scholarships for your profile.</p>
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector />
              <NotificationBell onNavigate={onNavigate} />
              <Button onClick={() => onNavigate('search')} className="bg-[#1e3a8a] hover:bg-blue-800 rounded-xl px-6 font-bold shadow-lg shadow-blue-900/10">
                <Search className="w-4 h-4 mr-2" />
                Find New
              </Button>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group rounded-[2rem] bg-white group hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-4xl font-extrabold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-14 h-14 ${stat.bg} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <stat.icon className={`w-7 h-7 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Recommendations Section */}
            <Recommendations onNavigate={onNavigate} />

            <div className="grid lg:grid-cols-3 gap-10">
              {/* Recommended Scholarships Feed */}
              <div className="lg:col-span-2 space-y-10">

                {/* 1. TOP MATCHES SECTION */}
                {recommendations.filter(s => (s.match_score || 0) >= 70).length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Zap className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recommended For You</h2>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">High Probability Matches ✨</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {recommendations
                        .filter(s => (s.match_score || 0) >= 70)
                        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
                        .map((scholarship) => (
                          <ScholarshipDashboardCard
                            key={scholarship.id}
                            scholarship={scholarship}
                            highlight={true}
                            onNavigate={onNavigate}
                            toggleSave={toggleSave}
                            savedScholarshipIds={savedScholarshipIds}
                            convertAndFormat={convertAndFormat}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. EXPLORE MORE SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Explore More</h2>
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Personalized Discovery Feed</p>
                      </div>
                    </div>
                    <Button variant="link" className="text-[#1e3a8a] font-bold" onClick={() => onNavigate('search')}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {recommendations.filter(s => (s.match_score || 0) < 70).length > 0 ? (
                      recommendations
                        .filter(s => (s.match_score || 0) < 70)
                        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
                        .map((scholarship) => (
                          <ScholarshipDashboardCard
                            key={scholarship.id}
                            scholarship={scholarship}
                            highlight={false}
                            onNavigate={onNavigate}
                            toggleSave={toggleSave}
                            savedScholarshipIds={savedScholarshipIds}
                            convertAndFormat={convertAndFormat}
                          />
                        ))
                    ) : (
                      recommendations.filter(s => (s.match_score || 0) >= 70).length === 0 && (
                        <Card className="border-dashed border-2 py-16 bg-white/50 rounded-[3rem]">
                          <CardContent className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                              <Zap className="w-8 h-8 text-[#1e3a8a]" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Boost Your Profile</h3>
                              <p className="text-gray-500 max-w-xs mx-auto mb-6">Complete your academic profile to unlock personalized recommendations from our AI engine.</p>
                              <Button onClick={() => onNavigate('settings')} className="bg-[#1e3a8a] rounded-xl px-10">Enhance Profile</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </div>

                {/* Pagination */}
                {recommendations.length > 0 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={() => setRecPage(prev => Math.max(0, prev - 1))}
                      disabled={recPage === 0 || isRecLoading}
                      className="text-gray-500 hover:text-[#1e3a8a] font-bold"
                    >
                      <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Previous
                    </Button>
                    <span className="text-sm font-bold text-gray-400">Page {recPage + 1}</span>
                    <Button
                      variant="ghost"
                      onClick={() => setRecPage(prev => prev + 1)}
                      disabled={recommendations.length < PAGE_SIZE || isRecLoading}
                      className="text-[#1e3a8a] font-bold"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-8">
                <Card className="border-none shadow-xl bg-[#1e3a8a] text-white rounded-[2.5rem] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-8 relative z-10">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" /> Quick Actions
                    </h2>
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-between bg-white/20 hover:bg-white text-white hover:text-[#1e3a8a] rounded-2xl font-bold h-14 border border-white/20"
                        onClick={() => onNavigate('applications')}
                      >
                        <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Tracker List</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-between bg-white/20 hover:bg-white text-white hover:text-[#1e3a8a] rounded-2xl font-bold h-14 border border-white/20"
                        onClick={() => onNavigate('travel-guide')}
                      >
                        <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Travel Guide</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-between bg-white/20 hover:bg-white text-white hover:text-[#1e3a8a] rounded-2xl font-bold h-14 border border-white/20"
                        onClick={() => onNavigate('settings')}
                      >
                        <span className="flex items-center gap-2"><Settings className="w-5 h-5" /> System Prefs</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-green-50/50 rounded-[2.5rem] border border-green-100">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Profile Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm mb-1 font-bold">
                        <span className="text-gray-500">Completion</span>
                        <span className="text-green-600">{summary?.profile_completion || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${summary?.profile_completion || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">Add your GRE/TOEFL scores to reach 100% and unlock high-premium matches.</p>
                      <Button variant="outline" className="w-full rounded-xl border-green-200 text-green-700 hover:bg-green-100" onClick={() => onNavigate('settings')}>Add Scores</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

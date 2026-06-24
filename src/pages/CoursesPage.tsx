import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import { BookOpen, Search, Clock, Users, Star, ChevronRight, Play, CheckCircle, Zap, Award, GraduationCap, Briefcase, User, ArrowRight, DollarSign, X, Loader2, CreditCard, Smartphone, Building2, Filter } from "lucide-react";

const TEST_TYPES = ["All", "IELTS", "TOEFL", "GRE", "GMAT", "PTE", "TestDaF", "Duolingo", "SAT"];
const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#1e293b",
  Duolingo: "#65a30d", SAT: "#0891b2", All: "#4f46e5"
};
const TEST_INFO: Record<string, string> = {
  All: "Explore all available test preparation courses",
  IELTS: "UK, Australia, Canada, Germany", 
  TOEFL: "USA universities",
  GRE: "USA Masters (Science/Engineering)", 
  GMAT: "MBA worldwide",
  PTE: "Australia & UK visa", 
  TestDaF: "Germany language test",
  Duolingo: "Alternative English test", 
  SAT: "USA undergraduate"
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [myProgress, setMyProgress] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "teachers">("courses");

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"JazzCash" | "Easypaisa" | "Bank">("JazzCash");
  const [paymentReference, setPaymentReference] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);

  const coursesRef = useRef<HTMLDivElement>(null);
  const enrolledRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle course enrollment
  const handleEnroll = async (course: any) => {
    if (course.enrolled) {
      navigate(`/courses/${course.id}`);
      return;
    }

    setEnrollingCourseId(course.id);
    try {
      const result = await api.courses.enrollInCourse(course.id);
      
      if (result.payment_status === "pending" || result.fee_required > 0) {
        // Show payment modal for paid courses
        setSelectedCourse(course);
        setPaymentModalOpen(true);
        toast.info(`Please submit payment of PKR ${course.price?.toLocaleString()} to unlock this course`);
      } else {
        // Free course - enrolled successfully
        toast.success(result.message || "Enrolled successfully!");
        // Refresh courses list
        const updated = await api.request("/courses");
        setCourses(updated);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Handle payment submission
  const handleSubmitPayment = async () => {
    if (!selectedCourse || !paymentReference.trim()) {
      toast.error("Please enter payment reference number");
      return;
    }

    setSubmittingPayment(true);
    try {
      await api.courses.submitPayment(selectedCourse.id, {
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        amount_paid: selectedCourse.price
      });

      toast.success("Payment submitted! Teacher will verify and unlock your access.");
      setPaymentModalOpen(false);
      setPaymentReference("");
      setPaymentMethod("JazzCash");
      
      // Refresh courses list
      const updated = await api.request("/courses");
      setCourses(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, t] = await Promise.all([
          api.request("/courses"),
          api.request("/courses/my/progress"),
          api.getApprovedTeachers(),
        ]);
        setCourses(c);
        setMyProgress(p);
        setTeachers(t || []);
      } catch { toast.error("Failed to load courses"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Filter teachers by test type
  const filteredTeachers = teachers.filter(t => {
    if (filter === "All") return true;
    return t.courses?.some((c: any) => c.test_type === filter);
  });

  const filtered = courses.filter(c => {
    if (filter !== "All" && c.test_type !== filter) return false;
    if (freeOnly && !c.is_free) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.test_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const enrolled = courses.filter(c => c.enrolled);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <div className="text-gray-600 font-bold text-base">Loading Premium Portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans" style={{ backgroundColor: "#f8fafc" }}>

      {/* ── STUNNING, ULTRA-PREMIUM HERO SECTION ──────────────────────────────────────────── */}
      <div
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}
        className="text-white pt-10 pb-32 px-6 md:px-12 shadow-2xl relative overflow-hidden"
      >
        {/* Background ambient decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Top Elegant Navigation Bar */}
          <div className="flex items-center justify-between mb-16">
            <button
              onClick={() => {
                const role = localStorage.getItem("userRole");
                navigate(role === "teacher" ? "/teacher" : "/dashboard");
              }}
              className="inline-flex items-center gap-2.5 text-indigo-100 hover:text-white font-bold text-sm px-5 py-3 rounded-2xl backdrop-blur-md transition-all border shadow-md cursor-pointer hover:scale-105 active:scale-95"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.15)" }}
            >
              <span className="text-lg leading-none">←</span> Back to Dashboard
            </button>

            <div 
              className="text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderColor: "rgba(255, 255, 255, 0.15)", color: "#e0e7ff" }}
            >
              Student Portal
            </div>
          </div>

          {/* Hero Main Content */}
          <div className="max-w-3xl">
            {/* Glowing Premium Badge */}
            <div 
              className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-2.5 text-xs font-extrabold mb-8 shadow-lg backdrop-blur-md uppercase tracking-wider"
              style={{ backgroundColor: "rgba(250, 204, 21, 0.15)", border: "1px solid rgba(250, 204, 21, 0.3)", color: "#facc15" }}
            >
              <Zap size={15} fill="currentColor" /> Expert-Certified Test Prep Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-8">
              Ace Your Test Prep <br />
              <span style={{ color: "#facc15" }}>with Global Experts</span>
            </h1>

            <p className="text-indigo-100 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl font-normal">
              Master IELTS, TOEFL, GRE, GMAT, and more. Access certified top-tier instructors, structured practice quizzes, and interactive live sessions all in one unified portal.
            </p>

            {/* Quick Action Chips (Generously spaced) */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: <BookOpen size={18} className="text-yellow-300" />, label: "Structured Lessons", action: () => { setFilter("All"); setSearch(""); setTimeout(() => scrollTo(coursesRef), 100); } },
                { icon: <Zap size={18} className="text-yellow-300" />, label: "Practice Quizzes", action: () => { setSearch("quiz"); setTimeout(() => scrollTo(coursesRef), 100); } },
                { icon: <Play size={18} className="text-yellow-300" />, label: "Live Classes", action: () => {
                  const liveFiltered = courses.filter(c => c.upcoming_live_classes > 0);
                  if (liveFiltered.length > 0) { setSearch(""); setFilter("All"); }
                  setTimeout(() => scrollTo(coursesRef), 100);
                  toast.info(`${liveFiltered.length} course(s) have upcoming live classes`);
                }},
                { icon: <CheckCircle size={18} className="text-yellow-300" />, label: "Progress Tracking", action: () => {
                  if (enrolledRef.current) { scrollTo(enrolledRef); }
                  else { toast.info("Enroll in a course to track your progress!"); }
                }},
              ].map((f, i) => (
                <button
                  key={i}
                  onClick={f.action}
                  className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-xl cursor-pointer hover:scale-105 active:scale-95"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)" }}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING PLATFORM STATS BAR (Properly overlapping with huge breathing room) ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          <div className="flex items-center gap-5 border-r border-gray-100 pr-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-gray-900">{courses.length || 0}</p>
              <p className="text-sm font-bold text-gray-500 mt-1">Active Courses</p>
            </div>
          </div>

          <div className="flex items-center gap-5 md:border-r border-gray-100 pr-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: "#f3e8ff", color: "#9333ea" }}>
              <GraduationCap size={28} />
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-gray-900">{teachers.length || 0}</p>
              <p className="text-sm font-bold text-gray-500 mt-1">Expert Teachers</p>
            </div>
          </div>

          <div className="flex items-center gap-5 border-r border-gray-100 pr-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
              <Award size={28} />
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-gray-900">8</p>
              <p className="text-sm font-bold text-gray-500 mt-1">Test Types</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-gray-900">{myProgress ? `${myProgress.overall_avg}%` : "100%"}</p>
              <p className="text-sm font-bold text-gray-500 mt-1">{myProgress ? "Your Avg Score" : "Verified Success"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (Flawless Spacing & Padding) ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-28 space-y-16">

        {/* ── MY ENROLLED COURSES ──────────────────────────── */}
        {enrolled.length > 0 && (
          <div ref={enrolledRef} className="bg-white rounded-3xl shadow-xl border border-gray-200 p-9 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                  <BookOpen size={24} />
                </div>
                My Enrolled Courses
                <span className="bg-indigo-600 text-white text-sm font-black px-3.5 py-1 rounded-full shadow-sm">{enrolled.length}</span>
              </h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">In Progress</span>
            </div>
            <div className="grid md:grid-cols-2 gap-7">
              {enrolled.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  className="flex gap-6 p-7 rounded-3xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-400 hover:shadow-xl cursor-pointer transition-all group"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-lg transform group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}
                  >
                    {c.test_type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-gray-900 truncate text-lg group-hover:text-indigo-600 transition-colors">{c.title}</div>
                    <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                      <User size={13} className="text-gray-400" /> {c.teacher_name}
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700">{c.progress}% Complete</span>
                        <span className="text-xs text-indigo-600 font-black group-hover:translate-x-1 transition-transform">Continue Learning →</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden p-0.5">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN TOGGLE TABS (COURSES vs TEACHERS) (Beautifully spaced from stats bar above) ────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-2.5 flex gap-2.5">
            <button
              onClick={() => setActiveTab("courses")}
              className="flex-1 py-4 px-6 rounded-2xl text-base font-black transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95"
              style={{
                backgroundColor: activeTab === "courses" ? "#4f46e5" : "#f1f5f9",
                color: activeTab === "courses" ? "#ffffff" : "#475569",
              }}
            >
              <BookOpen size={20} />
              Browse Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className="flex-1 py-4 px-6 rounded-2xl text-base font-black transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95"
              style={{
                backgroundColor: activeTab === "teachers" ? "#7c3aed" : "#f1f5f9",
                color: activeTab === "teachers" ? "#ffffff" : "#475569",
              }}
            >
              <GraduationCap size={20} />
              Expert Teachers ({teachers.length})
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE FILTER & SEARCH HUB ───────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 border-b border-gray-100 pb-8">
            <div>
              <h3 className="font-black text-gray-900 text-2xl flex items-center gap-3">
                <Filter size={24} className="text-indigo-600" />
                Filter by Test Category & Keyword
              </h3>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">
                {activeTab === "courses" 
                  ? "Select a test type or search by keyword to find the perfect prep course." 
                  : "Select a test type to view verified specialist teachers in that domain."}
              </p>
            </div>

            {/* Search Input & Free Toggle */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search size={20} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className="w-full pl-13 pr-4 py-4 border border-gray-200 rounded-2xl text-sm font-bold placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-gray-50 focus:bg-white transition-all shadow-inner"
                  placeholder={activeTab === "courses" ? "Search courses, topics..." : "Search teachers..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>

              {activeTab === "courses" && (
                <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 hover:bg-indigo-50 transition-all shrink-0 font-black select-none w-full sm:w-auto justify-center shadow-sm">
                  <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="accent-indigo-600 w-4 h-4 rounded" />
                  Free Courses Only
                </label>
              )}
            </div>
          </div>

          {/* Test Type Interactive Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {TEST_TYPES.map((test) => {
              const isSelected = filter === test;
              const color = TEST_COLORS[test] || "#6366f1";
              const info = TEST_INFO[test] || "Preparation course";

              return (
                <button
                  key={test}
                  onClick={() => setFilter(test)}
                  className={`p-6 rounded-2xl text-left transition-all duration-200 border-2 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected 
                      ? "shadow-lg scale-[1.03]" 
                      : "hover:bg-gray-50 hover:border-gray-300 bg-white"
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${color}15` : "#ffffff",
                    borderColor: isSelected ? color : "#e5e7eb",
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full shadow-md" style={{ backgroundColor: color }} />
                  )}
                  <div className="text-xl font-black tracking-tight" style={{ color: color }}>
                    {test}
                  </div>
                  <div className="text-xs text-gray-500 mt-3 leading-snug font-medium line-clamp-2">
                    {info}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── APPROVED TEACHERS SECTION ─────────────────────── */}
        {activeTab === "teachers" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Expert Test Prep Teachers</h2>
                <p className="text-base text-gray-500 mt-1">Learn directly from highly rated, certified instructors</p>
              </div>
              {filter !== "All" && (
                <span className="px-5 py-2 rounded-full text-sm font-black shadow-sm" style={{ backgroundColor: `${TEST_COLORS[filter]}15`, color: TEST_COLORS[filter] }}>
                  {filter} Specialists
                </span>
              )}
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 shadow-xl">
                <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-100 shadow-sm">
                  <GraduationCap className="text-purple-600" size={40} />
                </div>
                <h3 className="text-gray-900 font-black text-2xl mb-2">No expert teachers found</h3>
                <p className="text-gray-500 text-base max-w-md mx-auto mb-8 font-medium">
                  {filter !== "All" ? `No approved teachers currently specializing in ${filter}. Try selecting 'All'.` : "Teachers will appear here once verified by admin."}
                </p>
                {filter !== "All" && (
                  <button 
                    onClick={() => setFilter("All")} 
                    className="px-8 py-4 text-white font-black text-sm rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    Show All Teachers
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-9">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.teacher_id}
                    className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col group"
                    onClick={() => navigate(`/teachers/${teacher.teacher_id}`)}
                  >
                    {/* Header gradient banner */}
                    <div className="h-36 relative p-6 flex justify-end" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" }}>
                      {teacher.is_verified && (
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md h-fit">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-xs font-black text-green-800">Verified Expert</span>
                        </div>
                      )}
                    </div>

                    {/* Avatar & Content */}
                    <div className="px-9 pb-9 pt-0 flex-1 flex flex-col">
                      <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl -mt-14 border-4 border-white overflow-hidden mb-6 bg-purple-600">
                        {teacher.profile_picture_url ? (
                          <img 
                            src={`http://localhost:8000${teacher.profile_picture_url}`} 
                            alt={teacher.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          teacher.name?.charAt(0).toUpperCase() || "T"
                        )}
                      </div>

                      <h3 className="font-black text-gray-900 text-3xl group-hover:text-purple-600 transition-colors mb-3">{teacher.name}</h3>

                      {/* Specializations */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {teacher.specializations?.split(",").map((spec: string, i: number) => {
                          const cleanSpec = spec.trim();
                          const specColor = TEST_COLORS[cleanSpec] || "#6366f1";
                          return (
                            <span
                              key={i}
                              className="px-4 py-1.5 rounded-xl text-xs font-black shadow-sm"
                              style={{
                                backgroundColor: `${specColor}15`,
                                color: specColor,
                                border: `1px solid ${specColor}30`
                              }}
                            >
                              {cleanSpec}
                            </span>
                          );
                        })}
                      </div>

                      {/* Bio */}
                      <p className="text-base text-gray-600 line-clamp-3 mb-8 flex-1 leading-relaxed font-normal">
                        {teacher.bio || `${teacher.name} is a highly dedicated test preparation expert helping ambitious students secure top percentiles globally.`}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-gray-600 mb-8 text-center shadow-inner">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1"><Briefcase size={14} /> Exp</span>
                          <span className="text-base font-black text-gray-800">{teacher.experience_years || 1}+ Years</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-gray-200">
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1"><BookOpen size={14} /> Courses</span>
                          <span className="text-base font-black text-gray-800">{teacher.total_courses || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1"><Users size={14} /> Students</span>
                          <span className="text-base font-black text-gray-800">{teacher.total_students || 0}</span>
                        </div>
                      </div>

                      {/* Qualification */}
                      {teacher.qualification && (
                        <div className="flex items-center gap-4 mb-8 bg-yellow-50 border border-yellow-200 p-5 rounded-2xl shadow-inner">
                          <Award size={24} className="text-yellow-600 shrink-0" />
                          <span className="text-sm font-black text-yellow-900 truncate">{teacher.qualification}</span>
                        </div>
                      )}

                      {/* Courses preview */}
                      {teacher.courses?.length > 0 && (
                        <div className="border-t border-gray-100 pt-6 mb-3">
                          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Teaches Courses In:</p>
                          <div className="flex flex-wrap gap-2.5">
                            {teacher.courses.slice(0, 3).map((c: any) => (
                              <span
                                key={c.id}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-gray-100 text-gray-800 border border-gray-200 shadow-sm"
                              >
                                {c.test_type}
                              </span>
                            ))}
                            {teacher.courses.length > 3 && (
                              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-500">
                                +{teacher.courses.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* View Profile CTA Button */}
                      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">View complete profile & schedule</span>
                        <span className="flex items-center gap-2 bg-purple-50 text-purple-700 px-6 py-3 rounded-2xl text-sm font-black transition-all group-hover:bg-purple-100 shadow-md group-hover:shadow-lg">
                          Profile <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COURSES SECTION ───────────────────────────────── */}
        {activeTab === "courses" && (
          <div className="space-y-8">
            {/* Results Count Header */}
            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-bold text-gray-700">
                <span className="text-indigo-600 font-black text-2xl">{filtered.length}</span> course{filtered.length !== 1 ? "s" : ""} found
                {filter !== "All" && <span className="ml-2 text-base text-gray-500 font-medium">for <strong className="text-gray-900">{filter}</strong></span>}
                {freeOnly && <span className="ml-2 text-base text-green-600 font-black">(Free Only)</span>}
              </p>
            </div>

            {/* Course Grid */}
            <div ref={coursesRef} />
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-200 shadow-xl text-center px-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
                  <BookOpen className="text-indigo-500" size={40} />
                </div>
                <h3 className="text-gray-900 font-black text-2xl mb-2">No matching courses found</h3>
                <p className="text-gray-500 text-base max-w-md mb-8 font-medium">
                  {search 
                    ? `We couldn't find any courses matching "${search}". Try adjusting your keywords.` 
                    : "No courses available under this filter combination right now."}
                </p>
                {(filter !== "All" || search || freeOnly) && (
                  <button
                    onClick={() => { setFilter("All"); setSearch(""); setFreeOnly(false); }}
                    className="px-8 py-4 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer hover:scale-105"
                    style={{ backgroundColor: "#4f46e5" }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-9">
                {filtered.map(c => {
                  const testColor = TEST_COLORS[c.test_type] || "#6366f1";
                  
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/courses/${c.id}`)}
                      className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 group flex flex-col"
                    >
                      {/* Top elegant accent strip */}
                      <div className="h-3" style={{ backgroundColor: testColor }} />
                      
                      <div className="p-9 flex flex-col flex-1">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-6">
                          <span
                            className="text-xs font-black px-4.5 py-2 rounded-2xl text-white tracking-wide shadow-md"
                            style={{ backgroundColor: testColor }}
                          >
                            {c.test_type}
                          </span>
                          <span className={`text-xs font-black px-4.5 py-2 rounded-2xl shadow-md ${
                            c.is_free ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}>
                            {c.is_free ? "✓ FREE" : `PKR ${c.price?.toLocaleString()}`}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-black text-gray-900 text-2xl mb-4 group-hover:text-indigo-600 transition-colors leading-snug">
                          {c.title}
                        </h3>

                        {/* Description */}
                        <p className="text-base text-gray-600 mb-8 line-clamp-3 leading-relaxed flex-1 font-normal">
                          {c.description || `${c.test_type} high-impact preparation course by ${c.teacher_name}`}
                        </p>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-600 mb-8 font-black text-center shadow-inner">
                          <div className="flex flex-col items-center py-1">
                            <BookOpen size={15} className="text-gray-400 mb-1.5" />
                            <span>{c.total_lessons} Lessons</span>
                          </div>
                          <div className="flex flex-col items-center py-1 border-x border-gray-200">
                            <Zap size={15} className="text-gray-400 mb-1.5" />
                            <span>{c.total_quizzes} Quizzes</span>
                          </div>
                          <div className="flex flex-col items-center py-1">
                            <Users size={15} className="text-gray-400 mb-1.5" />
                            <span>{c.total_students} Enrolled</span>
                          </div>
                        </div>

                        {c.upcoming_live_classes > 0 && (
                          <div className="flex items-center justify-center gap-2.5 text-green-700 font-bold bg-green-50 border border-green-100 px-5 py-3 rounded-2xl text-xs mb-8 shadow-sm">
                            <Play size={14} fill="currentColor" className="text-green-600" />
                            <span>{c.upcoming_live_classes} Upcoming Live Classes</span>
                          </div>
                        )}

                        {/* Footer & CTA Button */}
                        <div className="flex items-center justify-between pt-7 border-t border-gray-100">
                          <div className="text-xs text-gray-500 flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm shadow-sm">
                              {c.teacher_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-gray-800 truncate max-w-[120px] text-sm">{c.teacher_name}</span>
                          </div>

                          {c.enrolled ? (
                            <span className="flex items-center gap-2 text-green-700 text-xs font-black bg-green-50 border border-green-200 px-5 py-2.5 rounded-2xl shadow-sm">
                              <CheckCircle size={15} /> Enrolled
                            </span>
                          ) : enrollingCourseId === c.id ? (
                            <span className="flex items-center gap-2 text-indigo-600 text-xs font-bold px-5 py-2.5">
                              <Loader2 size={15} className="animate-spin" /> Enrolling...
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnroll(c);
                              }}
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white transition-all shadow-lg hover:shadow-xl cursor-pointer hover:scale-105 active:scale-95"
                              style={{ backgroundColor: c.is_free ? "#10b981" : "#4f46e5" }}
                            >
                              {c.price > 0 ? (
                                <><DollarSign size={15} /> Buy Now</>
                              ) : (
                                <><CheckCircle size={15} /> Enroll Free</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BECOME A TEACHER CTA BANNER ────────────────────────────── */}
        <div 
          className="rounded-3xl p-14 text-white text-center shadow-2xl relative overflow-hidden mt-20"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border shadow-inner" style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}>
              <Star size={40} className="text-yellow-300" fill="currentColor" />
            </div>
            <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Want to Become an Expert Teacher?</h3>
            <p className="mb-10 text-lg leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: "#e0e7ff" }}>
              Are you an expert in IELTS, TOEFL, GRE, or GMAT? Join our platform to create premium courses, mentor ambitious global students, and earn handsomely!
            </p>
            <button
              onClick={() => navigate("/teacher")}
              className="font-black px-12 py-5 rounded-2xl transition-all shadow-2xl cursor-pointer text-lg inline-flex items-center gap-3 hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#facc15", color: "#111827" }}
            >
              Become a Teacher Today <ArrowRight size={20} />
            </button>
          </div>
        </div>

      </div>

      {/* ── PAYMENT MODAL ───────────────────────────────────── */}
      {paymentModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="p-8 text-white relative" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black">Complete Payment</h3>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-2 rounded-2xl transition-colors cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mt-3 text-sm font-medium" style={{ color: "#e0e7ff" }}>
                Unlocking Course: <strong className="text-white">{selectedCourse.title}</strong>
              </p>
              <div className="mt-6 flex items-center gap-2 p-5 rounded-2xl border shadow-inner" style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}>
                <span className="text-3xl font-black tracking-tight">PKR {selectedCourse.price?.toLocaleString()}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-base font-black text-gray-900 mb-4">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "JazzCash", icon: Smartphone, label: "JazzCash", color: "#dc2626" },
                    { id: "Easypaisa", icon: CreditCard, label: "Easypaisa", color: "#059669" },
                    { id: "Bank", icon: Building2, label: "Bank", color: "#2563eb" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? "border-indigo-600 bg-indigo-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <method.icon size={28} style={{ color: method.color }} />
                      <span className="text-xs font-black text-gray-900">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-inner">
                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2.5 text-base">
                  <Zap size={20} className="text-yellow-500" />
                  Step-by-Step Instructions
                </h4>
                <ol className="text-sm text-gray-600 space-y-3 list-decimal list-inside font-medium leading-relaxed">
                  {paymentMethod === "JazzCash" && (
                    <>
                      <li>Open your <strong>JazzCash App</strong></li>
                      <li>Transfer the exact fee to the teacher's JazzCash account</li>
                      <li>Copy and paste the transaction reference number below</li>
                    </>
                  )}
                  {paymentMethod === "Easypaisa" && (
                    <>
                      <li>Open your <strong>Easypaisa App</strong></li>
                      <li>Transfer the exact fee to the teacher's Easypaisa account</li>
                      <li>Copy and paste the transaction reference number below</li>
                    </>
                  )}
                  {paymentMethod === "Bank" && (
                    <>
                      <li>Perform a direct online bank transfer to the teacher</li>
                      <li>Capture a screenshot of your successful receipt</li>
                      <li>Enter the official transaction reference number below</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Reference Number Input */}
              <div>
                <label className="block text-base font-black text-gray-900 mb-3">
                  Payment Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., 1234567890 or ABC123XYZ"
                  className="w-full px-5 py-4.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold shadow-inner bg-gray-50 focus:bg-white"
                />
                <p className="text-xs text-gray-500 mt-2.5 font-medium leading-relaxed">
                  This secure transaction ID enables the teacher to instantly verify your payment.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-100 flex gap-5 bg-gray-50 rounded-b-3xl">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 px-6 py-4.5 border border-gray-300 text-gray-700 font-black rounded-2xl hover:bg-gray-100 transition-colors text-base shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!paymentReference.trim() || submittingPayment}
                className="flex-1 px-6 py-4.5 text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#4f46e5" }}
              >
                {submittingPayment ? (
                  <><Loader2 size={20} className="animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Payment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

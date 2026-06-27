import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import {
  BookOpen, Search, Users, Star, Play, CheckCircle, Zap, Award,
  GraduationCap, Briefcase, ArrowRight, DollarSign, X,
  Loader2, CreditCard, Smartphone, Building2, ChevronLeft,
  TrendingUp, Shield, Sparkles, Target
} from "lucide-react";

const TEST_TYPES = ["All", "IELTS", "TOEFL", "GRE", "GMAT", "PTE", "TestDaF", "Duolingo", "SAT"];

const TEST_CONFIG: Record<string, { color: string; bg: string; border: string; emoji: string; info: string }> = {
  All:      { color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", emoji: "🌐", info: "All courses" },
  IELTS:    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", emoji: "🇬🇧", info: "UK · Australia · Canada" },
  TOEFL:    { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", emoji: "🇺🇸", info: "USA universities" },
  GRE:      { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", emoji: "📐", info: "Masters · Science" },
  GMAT:     { color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "💼", info: "MBA worldwide" },
  PTE:      { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "🇦🇺", info: "Australia · UK visa" },
  TestDaF:  { color: "#1e293b", bg: "#f8fafc", border: "#cbd5e1", emoji: "🇩🇪", info: "German language" },
  Duolingo: { color: "#65a30d", bg: "#f7fee7", border: "#bbf7d0", emoji: "🦉", info: "English alternative" },
  SAT:      { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", emoji: "🎓", info: "USA undergraduate" },
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"JazzCash" | "Easypaisa" | "Bank">("JazzCash");
  const [paymentReference, setPaymentReference] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [reviewsModal, setReviewsModal] = useState<{ teacher: any; reviews: any[]; stats: any; loading: boolean } | null>(null);

  const coursesRef = useRef<HTMLDivElement>(null);
  const enrolledRef = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleEnroll = async (course: any) => {
    if (course.enrolled) { navigate(`/courses/${course.id}`); return; }
    setEnrollingCourseId(course.id);
    try {
      const result = await api.courses.enrollInCourse(course.id);
      if (result.payment_status === "pending" || result.fee_required > 0) {
        setSelectedCourse(course); setPaymentModalOpen(true);
        toast.info(`Submit payment of PKR ${course.price?.toLocaleString()} to unlock`);
      } else {
        toast.success(result.message || "Enrolled successfully!");
        const updated = await api.request("/courses"); setCourses(updated);
      }
    } catch (err: any) { toast.error(err.message || "Failed to enroll"); }
    finally { setEnrollingCourseId(null); }
  };

  const handleSubmitPayment = async () => {
    if (!selectedCourse || !paymentReference.trim()) { toast.error("Enter payment reference"); return; }
    setSubmittingPayment(true);
    try {
      await api.courses.submitPayment(selectedCourse.id, {
        payment_method: paymentMethod, payment_reference: paymentReference.trim(), amount_paid: selectedCourse.price
      });
      toast.success("Payment submitted! Teacher will verify and unlock access.");
      setPaymentModalOpen(false); setPaymentReference(""); setPaymentMethod("JazzCash");
      const updated = await api.request("/courses"); setCourses(updated);
    } catch (err: any) { toast.error(err.message || "Failed to submit payment"); }
    finally { setSubmittingPayment(false); }
  };

  const openReviews = async (teacher: any) => {
    setReviewsModal({ teacher, reviews: [], stats: null, loading: true });
    try {
      const data = await api.teacherReviews.getTeacherReviews(teacher.teacher_id);
      console.log("[openReviews] raw:", data);
      const reviews = data.reviews ?? data.items ?? data.data ?? (Array.isArray(data) ? data : []);
      const avg = data.average_rating ?? data.avg_rating ?? 0;
      const total = data.total_reviews ?? data.total ?? reviews.length;
      const dist = data.rating_distribution ?? data.distribution ?? { 1:0,2:0,3:0,4:0,5:0 };
      setReviewsModal({ teacher, reviews, stats: { ...data, average_rating: avg, total_reviews: total, rating_distribution: dist }, loading: false });
    } catch {
      setReviewsModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, t] = await Promise.all([
          api.request("/courses"), api.request("/courses/my/progress"), api.getApprovedTeachers(),
        ]);
        setCourses(c); setMyProgress(p); setTeachers(t || []);
      } catch { toast.error("Failed to load courses"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filteredTeachers = teachers.filter(t =>
    filter === "All" ? true : t.courses?.some((c: any) => c.test_type === filter)
  );
  const filtered = courses.filter(c => {
    if (filter !== "All" && c.test_type !== filter) return false;
    if (freeOnly && !c.is_free) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.test_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const enrolled = courses.filter(c => c.enrolled);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", animation: "spin 0.9s linear infinite" }} />
      <p style={{ color: "#a5b4fc", marginTop: 20, fontWeight: 700, letterSpacing: "0.1em", fontSize: 13 }}>LOADING PORTAL...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const cfg = (type: string) => TEST_CONFIG[type] || TEST_CONFIG["All"];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "sans-serif" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 55%,#1e1b4b 100%)", position: "relative", overflow: "hidden", paddingBottom: 80 }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "40%", width: 2, height: 2, borderRadius: "50%", boxShadow: "0 0 60px 30px rgba(99,102,241,0.08)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          {/* Nav bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 0 60px" }}>
            <button
              onClick={() => navigate(localStorage.getItem("userRole") === "teacher" ? "/teacher" : "/dashboard")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "10px 20px", color: "#c7d2fe", fontSize: 13, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.25)", borderRadius: 14, padding: "8px 18px", fontSize: 11, fontWeight: 800, color: "#fde68a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              <Zap size={13} fill="currentColor" /> Expert Test Prep Platform
            </div>
          </div>

          {/* Hero content */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 24, letterSpacing: "0.08em" }}>
                <Sparkles size={12} /> Certified by Global Experts
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
                Ace Your<br />
                <span style={{ background: "linear-gradient(90deg,#facc15,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Test Prep</span>
              </h1>
              <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 440 }}>
                Master IELTS, TOEFL, GRE, GMAT & more with certified top-tier instructors, structured quizzes, and interactive live sessions.
              </p>

              {/* Feature pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { icon: <BookOpen size={15} />, label: "Structured Lessons", action: () => { setFilter("All"); setTimeout(() => scrollTo(coursesRef), 100); } },
                  { icon: <Target size={15} />, label: "Practice Quizzes", action: () => { setSearch("quiz"); setTimeout(() => scrollTo(coursesRef), 100); } },
                  { icon: <Play size={15} />, label: "Live Classes", action: () => setTimeout(() => scrollTo(coursesRef), 100) },
                  { icon: <TrendingUp size={15} />, label: "Progress Tracking", action: () => enrolledRef.current ? scrollTo(enrolledRef) : toast.info("Enroll in a course first!") },
                ].map((f, i) => (
                  <button key={i} onClick={f.action}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 18px", color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                  >
                    <span style={{ color: "#facc15" }}>{f.icon}</span> {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: floating stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { icon: <BookOpen size={22} />, value: courses.length, label: "Active Courses", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
                { icon: <GraduationCap size={22} />, value: teachers.length, label: "Expert Teachers", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
                { icon: <Award size={22} />, value: 8, label: "Test Types", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
                { icon: <CheckCircle size={22} />, value: myProgress ? `${myProgress.overall_avg}%` : "100%", label: myProgress ? "Your Avg Score" : "Success Rate", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "24px 20px", backdropFilter: "blur(12px)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: 14 }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Enrolled Courses */}
        {enrolled.length > 0 && (
          <div ref={enrolledRef} style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 32, marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                  <BookOpen size={20} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>My Enrolled Courses</h2>
                <span style={{ background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 100 }}>{enrolled.length}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "6px 14px", borderRadius: 100 }}>In Progress</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {enrolled.map(c => (
                <div key={c.id} onClick={() => navigate(`/courses/${c.id}`)}
                  style={{ display: "flex", gap: 16, padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s", background: "#f8fafc" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg(c.test_type).color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                    {c.test_type}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{c.teacher_name}</div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: 100, width: `${c.progress}%`, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, marginTop: 6 }}>{c.progress}% Complete</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 6, maxWidth: 480, margin: "0 auto 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          {([
            { key: "courses", icon: <BookOpen size={18} />, label: `Browse Courses (${courses.length})` },
            { key: "teachers", icon: <GraduationCap size={18} />, label: `Expert Teachers (${teachers.length})` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", border: "none", transition: "all 0.2s",
                background: activeTab === tab.key ? (tab.key === "courses" ? "#6366f1" : "#7c3aed") : "transparent",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                boxShadow: activeTab === tab.key ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Filter bar */}
        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: "28px 32px", marginBottom: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          {/* Search row */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={activeTab === "courses" ? "Search courses or test types..." : "Search teachers..."}
                style={{ width: "100%", paddingLeft: 48, paddingRight: search ? 44 : 16, paddingTop: 13, paddingBottom: 13, border: "1.5px solid #e2e8f0", borderRadius: 14, fontSize: 14, fontWeight: 500, color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "#e2e8f0", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                  <X size={13} />
                </button>
              )}
            </div>
            {activeTab === "courses" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, background: freeOnly ? "#f0fdf4" : "#f8fafc", border: `1.5px solid ${freeOnly ? "#86efac" : "#e2e8f0"}`, borderRadius: 14, padding: "12px 18px", fontSize: 13, fontWeight: 700, color: freeOnly ? "#166534" : "#64748b", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} style={{ accentColor: "#16a34a", width: 15, height: 15 }} />
                Free Only
              </label>
            )}
          </div>

          {/* Test type grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10 }}>
            {TEST_TYPES.map(test => {
              const c = cfg(test);
              const active = filter === test;
              return (
                <button key={test} onClick={() => setFilter(test)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "14px 14px 12px", borderRadius: 14, border: `2px solid ${active ? c.color : "#e2e8f0"}`, background: active ? c.bg : "#fafafa", cursor: "pointer", transition: "all 0.18s", transform: active ? "scale(1.03)" : "scale(1)", boxShadow: active ? `0 4px 16px ${c.color}20` : "none" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = c.color + "80"; e.currentTarget.style.background = c.bg; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafafa"; } }}
                >
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: active ? c.color : "#1e293b" }}>{test}</span>
                  <span style={{ fontSize: 10, color: active ? c.color + "bb" : "#94a3b8", fontWeight: 500, lineHeight: 1.3 }}>{c.info}</span>
                  {active && <div style={{ width: "100%", height: 3, borderRadius: 100, background: c.color, marginTop: 2 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── COURSES TAB ─────────────────────────────────────── */}
        {activeTab === "courses" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <p style={{ fontSize: 15, color: "#64748b", fontWeight: 600, margin: 0 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#6366f1" }}>{filtered.length}</span>
                {" "}course{filtered.length !== 1 ? "s" : ""} found
                {filter !== "All" && <> for <strong style={{ color: "#0f172a" }}>{filter}</strong></>}
                {freeOnly && <span style={{ color: "#16a34a", fontWeight: 800 }}> · Free Only</span>}
              </p>
            </div>

            <div ref={coursesRef} />
            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, background: "#eef2ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <BookOpen size={34} color="#6366f1" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>No courses found</h3>
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 340, margin: "0 0 24px" }}>
                  {search ? `No results for "${search}". Try adjusting keywords.` : "No courses match your current filters."}
                </p>
                <button onClick={() => { setFilter("All"); setSearch(""); setFreeOnly(false); }}
                  style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
                {filtered.map(c => {
                  const tc = cfg(c.test_type);
                  return (
                    <div key={c.id} onClick={() => navigate(`/courses/${c.id}`)}
                      style={{ background: "#fff", borderRadius: 22, border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", transition: "all 0.22s", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = tc.color + "60"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    >
                      {/* Top accent + header */}
                      <div style={{ height: 6, background: `linear-gradient(90deg,${tc.color},${tc.color}88)` }} />
                      <div style={{ padding: "22px 24px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                          <span style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 100, letterSpacing: "0.04em" }}>
                            {c.test_type}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, padding: "5px 12px", borderRadius: 100, background: c.is_free ? "#f0fdf4" : "#fafafa", color: c.is_free ? "#16a34a" : "#374151", border: c.is_free ? "1px solid #bbf7d0" : "1px solid #e5e7eb" }}>
                            {c.is_free ? "✓ FREE" : `PKR ${c.price?.toLocaleString()}`}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.3 }}>{c.title}</h3>
                        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {c.description || `${c.test_type} high-impact preparation by ${c.teacher_name}`}
                        </p>
                      </div>

                      {/* Stats strip */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", margin: "0 24px 20px", background: "#f8fafc", borderRadius: 14, border: "1px solid #f1f5f9", padding: "12px 0" }}>
                        {[
                          { icon: <BookOpen size={14} />, val: c.total_lessons, label: "Lessons" },
                          { icon: <Zap size={14} />, val: c.total_quizzes, label: "Quizzes" },
                          { icon: <Users size={14} />, val: c.total_students, label: "Students" },
                        ].map((s, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRight: i < 2 ? "1px solid #e2e8f0" : "none" }}>
                            <span style={{ color: "#94a3b8" }}>{s.icon}</span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>{s.val}</span>
                            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{s.label}</span>
                          </div>
                        ))}
                      </div>

                      {c.upcoming_live_classes > 0 && (
                        <div style={{ margin: "0 24px 16px", display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
                          <Play size={12} fill="currentColor" /> {c.upcoming_live_classes} Upcoming Live Class{c.upcoming_live_classes > 1 ? "es" : ""}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #f1f5f9", marginTop: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: tc.bg, color: tc.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>
                            {c.teacher_name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.teacher_name}</span>
                        </div>
                        {c.enrolled ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "7px 14px", borderRadius: 100 }}>
                            <CheckCircle size={14} /> Enrolled
                          </span>
                        ) : enrollingCourseId === c.id ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6366f1" }}>
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Enrolling...
                          </span>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); handleEnroll(c); }}
                            style={{ display: "flex", alignItems: "center", gap: 6, background: c.is_free ? "#16a34a" : "#6366f1", color: "#fff", border: "none", borderRadius: 100, padding: "8px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          >
                            {c.price > 0 ? <><DollarSign size={14} /> Buy Now</> : <><CheckCircle size={14} /> Enroll Free</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TEACHERS TAB ─────────────────────────────────────── */}
        {activeTab === "teachers" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>Expert Teachers</h2>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Learn from certified, highly rated instructors</p>
              </div>
              {filter !== "All" && (
                <span style={{ background: cfg(filter).bg, color: cfg(filter).color, border: `1px solid ${cfg(filter).border}`, fontSize: 13, fontWeight: 800, padding: "6px 16px", borderRadius: 100 }}>
                  {filter} Specialists
                </span>
              )}
            </div>

            {filteredTeachers.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, background: "#f5f3ff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <GraduationCap size={34} color="#7c3aed" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>No teachers found</h3>
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 340, margin: "0 0 24px" }}>
                  {filter !== "All" ? `No approved ${filter} teachers yet. Try "All".` : "Teachers appear here once verified by admin."}
                </p>
                {filter !== "All" && (
                  <button onClick={() => setFilter("All")}
                    style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                    Show All Teachers
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredTeachers.map(teacher => {
                  const firstSpec = teacher.specializations?.split(",")[0]?.trim() || "";
                  const specCfg = cfg(firstSpec);
                  return (
                    <div key={teacher.teacher_id} onClick={() => navigate(`/teachers/${teacher.teacher_id}`)}
                      style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "stretch", transition: "all 0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = "#7c3aed40"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    >
                      {/* Left accent strip */}
                      <div style={{ width: 5, background: `linear-gradient(180deg,#7c3aed,#6366f1)`, flexShrink: 0 }} />

                      {/* Avatar */}
                      <div style={{ padding: "20px 20px 20px 20px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg,${specCfg.color || "#7c3aed"},#6366f1)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 900, boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}>
                          {teacher.profile_picture_url
                            ? <img src={`http://localhost:8000${teacher.profile_picture_url}`} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : teacher.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                      </div>

                      {/* Main info */}
                      <div style={{ flex: 1, padding: "18px 0", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>{teacher.name}</h3>
                          {teacher.is_verified && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 100, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#16a34a", flexShrink: 0 }}>
                              <Shield size={9} /> Verified
                            </span>
                          )}
                        </div>

                        {/* Specs */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                          {teacher.specializations?.split(",").slice(0, 3).map((spec: string, i: number) => {
                            const s = spec.trim(); const sc = cfg(s);
                            return <span key={i} style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 100 }}>{s}</span>;
                          })}
                        </div>

                        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "95%" }}>
                          {teacher.bio || `Test prep expert helping students achieve top scores globally.`}
                        </p>

                        {/* Inline stats */}
                        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {[
                            { val: `${teacher.experience_years || 1}yr`, label: "Exp" },
                            { val: teacher.total_courses || 0, label: "Courses" },
                            { val: teacher.total_students || 0, label: "Students" },
                          ].map((s, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>{s.val}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</span>
                            </div>
                          ))}
                          {/* Clickable rating badge */}
                          <button
                            onClick={e => { e.stopPropagation(); openReviews(teacher); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: teacher.average_rating > 0 ? "#fffbeb" : "#f8fafc", border: `1px solid ${teacher.average_rating > 0 ? "#fde68a" : "#e2e8f0"}`, borderRadius: 100, padding: "3px 10px", cursor: "pointer", transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#fef3c7"; e.currentTarget.style.borderColor = "#f59e0b"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = teacher.average_rating > 0 ? "#fffbeb" : "#f8fafc"; e.currentTarget.style.borderColor = teacher.average_rating > 0 ? "#fde68a" : "#e2e8f0"; }}
                          >
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={11} fill={s <= Math.round(teacher.average_rating || 0) ? "#f59e0b" : "#e5e7eb"} color={s <= Math.round(teacher.average_rating || 0) ? "#f59e0b" : "#e5e7eb"} />
                            ))}
                            <span style={{ fontSize: 11, fontWeight: 800, color: teacher.average_rating > 0 ? "#92400e" : "#94a3b8", marginLeft: 2 }}>
                              {teacher.average_rating > 0 ? `${Number(teacher.average_rating).toFixed(1)} · ${teacher.total_reviews || 0} reviews` : "No reviews yet"}
                            </span>
                          </button>
                        </div>

                        {teacher.qualification && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <Award size={12} color="#d97706" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{teacher.qualification}</span>
                          </div>
                        )}
                      </div>

                      {/* Right CTA */}
                      <div style={{ display: "flex", alignItems: "center", padding: "0 20px 0 12px", flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 14, padding: "12px 16px", transition: "all 0.2s" }}>
                          <ArrowRight size={18} color="#7c3aed" />
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", whiteSpace: "nowrap" }}>View Profile</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Student Success Banner ── */}
        <div style={{ marginTop: 60, borderRadius: 28, background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#312e81 100%)", padding: "52px 48px", position: "relative", overflow: "hidden" }}>
          {/* decorative orbs */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.18),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: "20%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.12),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "40%", left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(251,191,36,0.08),transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>

            {/* Left: headline + CTAs */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
                <Star size={13} color="#facc15" fill="#facc15" />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#facc15", letterSpacing: "0.05em" }}>BUILT FOR STUDENTS LIKE YOU</span>
              </div>
              <h3 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.18, letterSpacing: "-0.02em" }}>
                Ace Your Test.<br />
                <span style={{ background: "linear-gradient(90deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Win the Scholarship.</span>
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, margin: "0 0 30px", maxWidth: 440 }}>
                Our expert-led courses are designed to boost your IELTS, TOEFL, GRE &amp; GMAT scores — and turn that score into a fully funded scholarship offer.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => navigate("/search")}
                  style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 28px rgba(99,102,241,0.4)", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(99,102,241,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.4)"; }}
                >
                  <Sparkles size={15} /> Find Scholarships
                </button>
                <button onClick={() => { setActiveTab("courses"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  <BookOpen size={15} /> Browse Courses
                </button>
              </div>
            </div>

            {/* Right: floating achievement cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0, minWidth: 240 }}>
              {[
                { emoji: "🎯", title: "Score Improvement", sub: "Avg. +1.5 band in IELTS", accent: "#6366f1" },
                { emoji: "🏅", title: "Scholarships Won", sub: "Students got funded abroad", accent: "#f59e0b" },
                { emoji: "📚", title: "Practice Quizzes", sub: "Real exam-style questions", accent: "#10b981" },
                { emoji: "🎓", title: "Live Classes", sub: "Daily sessions with experts", accent: "#8b5cf6" },
              ].map((card, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 18px", backdropFilter: "blur(8px)", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = `${card.accent}40`; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${card.accent}20`, border: `1px solid ${card.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {card.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT MODAL ─────────────────────────────────────── */}
      {paymentModalOpen && selectedCourse && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16, backdropFilter: "blur(6px)" }}>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", maxWidth: 460, width: "100%", maxHeight: "92vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", padding: "28px 28px 24px", borderRadius: "24px 24px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>Complete Payment</h3>
                <button onClick={() => setPaymentModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ color: "#c7d2fe", fontSize: 13, margin: "0 0 16px" }}>Unlocking: <strong style={{ color: "#fff" }}>{selectedCourse.title}</strong></p>
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "14px 20px", display: "inline-block" }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>PKR {selectedCourse.price?.toLocaleString()}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Payment method */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>Select Payment Method</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { id: "JazzCash", icon: <Smartphone size={24} />, label: "JazzCash", color: "#dc2626" },
                    { id: "Easypaisa", icon: <CreditCard size={24} />, label: "Easypaisa", color: "#059669" },
                    { id: "Bank", icon: <Building2 size={24} />, label: "Bank", color: "#2563eb" },
                  ].map(m => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px", borderRadius: 14, border: `2px solid ${paymentMethod === m.id ? "#6366f1" : "#e2e8f0"}`, background: paymentMethod === m.id ? "#eef2ff" : "#fafafa", cursor: "pointer", transition: "all 0.18s" }}>
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={16} color="#f59e0b" /> Instructions
                </p>
                <ol style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
                  {paymentMethod === "JazzCash" && <><li>Open your JazzCash App</li><li>Transfer the exact fee to teacher's account</li><li>Copy the transaction reference below</li></>}
                  {paymentMethod === "Easypaisa" && <><li>Open your Easypaisa App</li><li>Transfer the exact fee to teacher's account</li><li>Copy the transaction reference below</li></>}
                  {paymentMethod === "Bank" && <><li>Do a direct bank transfer to the teacher</li><li>Screenshot your receipt</li><li>Enter the transaction reference below</li></>}
                </ol>
              </div>

              {/* Reference input */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Transaction Reference / ID</p>
                <input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g. 1234567890 or ABC123XYZ"
                  style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                  onFocus={e => (e.target.style.borderColor = "#6366f1")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 12, padding: "0 28px 28px" }}>
              <button onClick={() => setPaymentModalOpen(false)}
                style={{ flex: 1, padding: "13px", border: "1.5px solid #e2e8f0", borderRadius: 12, background: "#fff", fontWeight: 800, fontSize: 14, color: "#374151", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmitPayment} disabled={!paymentReference.trim() || submittingPayment}
                style={{ flex: 1, padding: "13px", border: "none", borderRadius: 12, background: "#6366f1", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (!paymentReference.trim() || submittingPayment) ? 0.5 : 1, transition: "opacity 0.2s" }}>
                {submittingPayment ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEWS MODAL ─────────────────────────────────────── */}
      {reviewsModal && (
        <div onClick={() => setReviewsModal(null)}
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16, backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", width: "100%", maxWidth: 520, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#6366f1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 18 }}>
                  {reviewsModal.teacher.profile_picture_url
                    ? <img src={`http://localhost:8000${reviewsModal.teacher.profile_picture_url}`} alt={reviewsModal.teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : reviewsModal.teacher.name?.charAt(0).toUpperCase() || "T"}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{reviewsModal.teacher.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} fill={s <= Math.round(reviewsModal.stats?.average_rating || 0) ? "#f59e0b" : "#374151"} color={s <= Math.round(reviewsModal.stats?.average_rating || 0) ? "#f59e0b" : "#374151"} />
                    ))}
                    {reviewsModal.stats?.average_rating > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>{Number(reviewsModal.stats.average_rating).toFixed(1)}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>· {reviewsModal.stats?.total_reviews || 0} reviews</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setReviewsModal(null)}
                style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            {/* Rating summary bar */}
            {!reviewsModal.loading && reviewsModal.stats?.total_reviews > 0 && (
              <div style={{ padding: "16px 24px", background: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{Number(reviewsModal.stats.average_rating).toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, marginTop: 4 }}>out of 5</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5,4,3,2,1].map(r => {
                    const count = (reviewsModal.stats?.rating_distribution as any)?.[r] || 0;
                    const pct = reviewsModal.stats?.total_reviews > 0 ? (count / reviewsModal.stats.total_reviews) * 100 : 0;
                    return (
                      <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r > 1 ? 4 : 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", width: 10 }}>{r}</span>
                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                        <div style={{ flex: 1, height: 6, background: "#fde68a", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#f59e0b", width: `${pct}%`, borderRadius: 100 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#92400e", fontWeight: 700, width: 16, textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {reviewsModal.loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f1f5f9", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 13, background: "#f1f5f9", borderRadius: 6, width: "35%", marginBottom: 8 }} />
                        <div style={{ height: 11, background: "#f1f5f9", borderRadius: 6, width: "80%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <Star size={24} color="#cbd5e1" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No reviews yet</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>Be the first to enroll and share your experience</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {reviewsModal.reviews.map((review: any) => (
                    <div key={review.id} style={{ background: "#f8fafc", borderRadius: 16, padding: "16px 18px", border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#6366f1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 16, flexShrink: 0 }}>
                          {review.student_profile_picture
                            ? <img src={`http://localhost:8000${review.student_profile_picture}`} alt={review.student_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : review.student_name?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{review.student_name}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>{new Date(review.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                          <div style={{ display: "flex", gap: 2, marginBottom: review.review_text ? 8 : 0 }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={13} fill={s <= review.rating ? "#f59e0b" : "#e5e7eb"} color={s <= review.rating ? "#f59e0b" : "#e5e7eb"} />
                            ))}
                          </div>
                          {review.review_text && (
                            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{review.review_text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — go to full profile */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
              <button onClick={() => { setReviewsModal(null); navigate(`/teachers/${reviewsModal.teacher.teacher_id}`); }}
                style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                View Full Profile <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

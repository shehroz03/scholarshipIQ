import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import { BookOpen, Search, Clock, Users, Star, ChevronRight, Play, CheckCircle, Zap } from "lucide-react";

const TEST_TYPES = ["All", "IELTS", "TOEFL", "GRE", "GMAT", "PTE", "TestDaF", "Duolingo", "SAT"];
const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#1e293b",
  Duolingo: "#65a30d", SAT: "#0891b2", All: "#6366f1"
};
const TEST_INFO: Record<string, string> = {
  IELTS: "UK, Australia, Canada, Germany", TOEFL: "USA universities",
  GRE: "USA Masters (Science/Engineering)", GMAT: "MBA worldwide",
  PTE: "Australia & UK visa", TestDaF: "Germany language test",
  Duolingo: "Alternative English test", SAT: "USA undergraduate"
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [myProgress, setMyProgress] = useState<any>(null);

  const coursesRef = useRef<HTMLDivElement>(null);
  const enrolledRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p] = await Promise.all([
          api.request("/courses"),
          api.request("/courses/my/progress"),
        ]);
        setCourses(c);
        setMyProgress(p);
      } catch { toast.error("Failed to load courses"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = courses.filter(c => {
    if (filter !== "All" && c.test_type !== filter) return false;
    if (freeOnly && !c.is_free) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.test_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const enrolled = courses.filter(c => c.enrolled);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400 text-lg">Loading courses...</div></div>;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── HERO ──────────────────────────────────────────── */}
      <div
        style={{ background: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #5b21b6 100%)" }}
        className="text-white relative overflow-hidden"
      >
        {/* Soft glow blobs only — no grid */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", transform: "translate(25%, -25%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", transform: "translate(-25%, 25%)" }} />

        <div className="max-w-6xl mx-auto px-6 pt-7 pb-20 relative">
          {/* Back */}
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span> Back to Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* LEFT — text */}
            <div className="lg:max-w-[55%]">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3.5 py-1 text-[11px] font-semibold text-violet-200 mb-5">
                <Zap size={10} fill="currentColor" className="text-yellow-400" /> Expert-Certified Test Prep Platform
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
                <span className="block text-white">Ace Your</span>
                <span
                  className="block bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, #fcd34d, #f59e0b)" }}
                >
                  Test Preparation
                </span>
                <span className="block text-white/85 text-2xl md:text-3xl font-bold mt-0.5">with Expert Teachers</span>
              </h1>

              <p className="text-violet-200 text-sm leading-relaxed mb-6 max-w-md">
                Master IELTS, TOEFL, GRE, GMAT and more. Certified instructors, practice quizzes, and live sessions — all in one place.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    icon: <BookOpen size={11} />,
                    label: "Structured Lessons",
                    action: () => { setFilter("All"); setSearch(""); setTimeout(() => scrollTo(coursesRef), 100); }
                  },
                  {
                    icon: <Zap size={11} />,
                    label: "Practice Quizzes",
                    action: () => { setSearch("quiz"); setTimeout(() => scrollTo(coursesRef), 100); }
                  },
                  {
                    icon: <Play size={11} />,
                    label: "Live Classes",
                    action: () => {
                      const liveFiltered = courses.filter(c => c.upcoming_live_classes > 0);
                      if (liveFiltered.length > 0) { setSearch(""); setFilter("All"); }
                      setTimeout(() => scrollTo(coursesRef), 100);
                      toast.info(`${liveFiltered.length} course(s) have upcoming live classes`);
                    }
                  },
                  {
                    icon: <CheckCircle size={11} />,
                    label: "Progress Tracking",
                    action: () => {
                      if (enrolledRef.current) { scrollTo(enrolledRef); }
                      else { toast.info("Enroll in a course to track your progress!"); }
                    }
                  },
                ].map((f, i) => (
                  <button
                    key={i}
                    onClick={f.action}
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-full px-3 py-1 text-[11px] font-medium text-white/80 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="text-yellow-300">{f.icon}</span>{f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT — stats / progress card */}
            <div className="lg:w-[280px] shrink-0">
              {myProgress && myProgress.total_attempts > 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-center">
                  <p className="text-[10px] text-violet-300 font-semibold uppercase tracking-widest mb-2">My Overall Progress</p>
                  <p className="text-5xl font-black text-white">{myProgress.overall_avg}<span className="text-xl text-violet-300">%</span></p>
                  <p className="text-violet-300 text-xs mt-1">{myProgress.total_attempts} quiz attempts</p>
                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${myProgress.overall_avg}%` }} />
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center border border-yellow-400/30 shrink-0">
                      <Star size={20} className="text-yellow-400" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Ready to Start?</p>
                      <p className="text-[11px] text-violet-300">Pick a course below</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { val: `${courses.length || "—"}`, label: "Courses" },
                      { val: "8",    label: "Test Types" },
                      { val: "Live", label: "Sessions" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-xl py-2.5">
                        <p className="text-base font-black text-white">{s.val}</p>
                        <p className="text-[10px] text-violet-300 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" className="w-full block" style={{ marginBottom: "-2px" }}>
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f5f6fa" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-16 space-y-8">

        {/* ── MY ENROLLED COURSES ──────────────────────────── */}
        {enrolled.length > 0 && (
          <div ref={enrolledRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> My Courses
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{enrolled.length}</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {enrolled.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}
                  >{c.test_type}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate text-sm group-hover:text-indigo-700 transition-colors">{c.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.teacher_name}</div>
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-400">{c.progress}% complete</span>
                        <span className="text-[11px] text-indigo-600 font-bold">Continue →</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEST TYPE GUIDE ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
            🌍 Which Test Do You Need?
            <span className="text-xs text-gray-400 font-normal">Click to filter</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(TEST_INFO).map(([test, info]) => (
              <button
                key={test}
                onClick={() => setFilter(test === filter ? "All" : test)}
                className="p-3 rounded-xl text-left transition-all hover:scale-[1.02] border-2"
                style={{
                  backgroundColor: `${TEST_COLORS[test]}12`,
                  borderColor: filter === test ? TEST_COLORS[test] : `${TEST_COLORS[test]}30`,
                  outline: filter === test ? `2px solid ${TEST_COLORS[test]}` : "none",
                  outlineOffset: "2px",
                }}
              >
                <div className="text-sm font-black" style={{ color: TEST_COLORS[test] }}>{test}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{info}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── SEARCH + FILTER BAR ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-400 placeholder:font-normal focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-gray-50 focus:bg-white transition-all"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Free only */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shrink-0 font-medium">
              <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
              Free only
            </label>
          </div>
          {/* Filter tabs — scrollable */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {TEST_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 border"
                style={
                  filter === t
                    ? {
                        backgroundColor: TEST_COLORS[t] || "#6366f1",
                        borderColor: TEST_COLORS[t] || "#6366f1",
                        color: "#ffffff",
                        boxShadow: `0 2px 8px ${TEST_COLORS[t] || "#6366f1"}55`,
                      }
                    : {
                        backgroundColor: "#f3f4f6",
                        borderColor: "#e5e7eb",
                        color: "#6b7280",
                      }
                }
              >{t}</button>
            ))}
          </div>
        </div>

        {/* ── RESULTS COUNT ─────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500">
              <strong className="text-gray-900">{filtered.length}</strong> course{filtered.length !== 1 ? "s" : ""} found
              {filter !== "All" && <span className="ml-2 text-xs text-indigo-600 font-semibold">· {filter}</span>}
            </p>
          </div>
        )}

        {/* ── COURSE GRID ───────────────────────────────────── */}
        <div ref={coursesRef} />
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="text-indigo-300" size={32} />
            </div>
            <h3 className="text-gray-700 font-bold mb-1">No courses found</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              {search ? `No results for "${search}" — try a different keyword` : "Teachers are adding courses soon!"}
            </p>
            {(filter !== "All" || search) && (
              <button
                onClick={() => { setFilter("All"); setSearch(""); }}
                className="mt-4 text-sm text-indigo-600 font-semibold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/courses/${c.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col"
              >
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }} />
                <div className="p-5 flex flex-col flex-1">
                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-black px-2.5 py-1 rounded-lg text-white tracking-wide"
                      style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}
                    >{c.test_type}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      c.is_free ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.is_free ? "✓ FREE" : `PKR ${c.price?.toLocaleString()}`}
                    </span>
                  </div>
                  {/* Title */}
                  <h3 className="font-black text-gray-900 text-[15px] mb-1.5 group-hover:text-indigo-700 transition-colors leading-snug">{c.title}</h3>
                  {/* Description */}
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                    {c.description || `${c.test_type} preparation course by ${c.teacher_name}`}
                  </p>
                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen size={11} />{c.total_lessons} lessons</span>
                    <span className="flex items-center gap-1"><Zap size={11} />{c.total_quizzes} quizzes</span>
                    <span className="flex items-center gap-1"><Users size={11} />{c.total_students} students</span>
                    {c.upcoming_live_classes > 0 && (
                      <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-md">
                        <Play size={10} fill="currentColor" />{c.upcoming_live_classes} live
                      </span>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      by <span className="font-semibold text-gray-700">{c.teacher_name}</span>
                    </div>
                    {c.enrolled ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle size={11} />Enrolled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-indigo-500 text-xs font-bold group-hover:gap-2 transition-all">
                        View <ChevronRight size={13} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BECOME TEACHER CTA ────────────────────────────── */}
        <div
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
          className="rounded-2xl p-8 text-white text-center shadow-lg"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={24} className="text-yellow-300" fill="currentColor" />
          </div>
          <h3 className="text-2xl font-black mb-2">Want to Become a Teacher?</h3>
          <p className="text-indigo-200 mb-6 text-sm max-w-md mx-auto">
            Expert in IELTS, TOEFL or GRE? Help students achieve their goals and earn while doing it!
          </p>
          <button
            onClick={() => navigate("/teacher")}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black px-8 py-3 rounded-xl transition-colors shadow-lg"
          >
            Become a Teacher →
          </button>
        </div>

      </div>
    </div>
  );
}

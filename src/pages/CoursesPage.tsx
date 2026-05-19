import { useState, useEffect } from "react";
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
  IELTS: "UK, AU, CA, DE ke liye", TOEFL: "USA universities ke liye",
  GRE: "USA Masters (Science/Engineering)", GMAT: "MBA worldwide",
  PTE: "Australia, UK ke liye", TestDaF: "Germany German test",
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
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate("/dashboard")} className="text-indigo-200 hover:text-white text-sm font-medium mb-6 flex items-center gap-1">← Dashboard</button>
          <h1 className="text-4xl font-black mb-3">Test Preparation Courses</h1>
          <p className="text-indigo-200 text-lg mb-6">IELTS, TOEFL, GRE, GMAT aur ziada — expert teachers se tayari karo</p>
          {myProgress && myProgress.total_attempts > 0 && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 w-fit">
              <div className="text-sm text-indigo-200 mb-1">Meri Overall Progress</div>
              <div className="text-3xl font-black">{myProgress.overall_avg}% avg score</div>
              <div className="text-indigo-200 text-sm">{myProgress.total_attempts} quiz attempts</div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* MY ENROLLED */}
        {enrolled.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-900 mb-4">📖 My Courses ({enrolled.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {enrolled.map(c => (
                <div key={c.id} onClick={() => navigate(`/courses/${c.id}`)} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}>{c.test_type}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{c.title}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{c.teacher_name}</div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{c.progress}% complete</span>
                        <span className="text-xs text-indigo-600 font-bold">Continue →</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEST TYPE QUICK GUIDE */}
        <div className="bg-white rounded-2xl border p-5 mb-8">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">🌍 Kaunsa Test Kahan Chahiye?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(TEST_INFO).map(([test, info]) => (
              <div key={test} onClick={() => setFilter(test)} className="p-3 rounded-xl cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: `${TEST_COLORS[test]}15`, border: `1px solid ${TEST_COLORS[test]}30` }}>
                <div className="text-sm font-black" style={{ color: TEST_COLORS[test] }}>{test}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{info}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TEST_TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white border rounded-xl px-3 py-2.5">
            <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="accent-indigo-600" />Free only
          </label>
        </div>

        {/* COURSE GRID */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border">
            <BookOpen className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400">No courses found. Teachers abhi courses add kar rahe hain!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => (
              <div key={c.id} onClick={() => navigate(`/courses/${c.id}`)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className="h-2" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-black px-2 py-1 rounded-lg text-white" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}>{c.test_type}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.is_free ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{c.is_free ? "FREE" : `PKR ${c.price}`}</span>
                  </div>
                  <h3 className="font-black text-gray-900 text-base mb-1 group-hover:text-indigo-700 transition-colors">{c.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description || `${c.test_type} preparation course`}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><BookOpen size={11} />{c.total_lessons} lessons</span>
                    <span className="flex items-center gap-1"><Zap size={11} />{c.total_quizzes} quizzes</span>
                    <span className="flex items-center gap-1"><Users size={11} />{c.total_students}</span>
                    {c.upcoming_live_classes > 0 && <span className="flex items-center gap-1 text-green-600 font-bold"><Play size={11} />{c.upcoming_live_classes} live</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">by <span className="font-semibold text-gray-700">{c.teacher_name}</span></div>
                    {c.enrolled ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={12} />Enrolled</span>
                    ) : (
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BECOME TEACHER CTA */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-black mb-2">Aap Teacher Banna Chahte Ho?</h3>
          <p className="text-indigo-200 mb-5">IELTS, TOEFL ya GRE mein expert ho? Students ki help karo aur earn karo!</p>
          <button onClick={() => navigate("/teacher")} className="bg-white text-indigo-700 font-black px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">Become a Teacher →</button>
        </div>
      </div>
    </div>
  );
}

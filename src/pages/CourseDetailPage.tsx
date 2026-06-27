import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import {
  BookOpen, Play, CheckCircle, Clock, Zap, Calendar, Users,
  ChevronDown, ChevronUp, ExternalLink, ArrowLeft, Lock, Star,
  Award, BarChart2, Timer
} from "lucide-react";

const TEST_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  IELTS:    { from: "#1d4ed8", to: "#3b82f6", accent: "#2563eb" },
  TOEFL:    { from: "#6d28d9", to: "#8b5cf6", accent: "#7c3aed" },
  GRE:      { from: "#065f46", to: "#10b981", accent: "#059669" },
  GMAT:     { from: "#92400e", to: "#f59e0b", accent: "#d97706" },
  PTE:      { from: "#991b1b", to: "#ef4444", accent: "#dc2626" },
  TestDaF:  { from: "#0f172a", to: "#334155", accent: "#1e293b" },
  Duolingo: { from: "#3f6212", to: "#84cc16", accent: "#65a30d" },
  SAT:      { from: "#0c4a6e", to: "#0ea5e9", accent: "#0891b2" },
};

function getYouTubeEmbed(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "JazzCash", payment_reference: "", amount_paid: 0 });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const load = async () => {
    try {
      const c = await api.request(`/courses/${id}`);
      setCourse(c);
    } catch { toast.error("Course not found"); navigate("/courses"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!activeQuiz || quizResult) return;
    const t = setInterval(() => setQuizTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [activeQuiz, quizResult]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await api.request(`/courses/${id}/enroll`, { method: "POST" });
      toast.success(res.message || "Enrolled!");
      if (res.fee_required) setPaymentForm(p => ({ ...p, amount_paid: res.fee_required }));
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setEnrolling(false); }
  };

  const handleSubmitPayment = async () => {
    if (!paymentForm.payment_reference.trim()) { toast.error("Transaction ID required"); return; }
    setSubmittingPayment(true);
    try {
      await api.request(`/courses/${id}/submit-payment`, {
        method: "POST",
        body: JSON.stringify(paymentForm),
      });
      toast.success("Payment submitted! Teacher will verify soon.");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmittingPayment(false); }
  };

  const markComplete = async (lessonId: number) => {
    await api.request(`/courses/${id}/lessons/${lessonId}/complete`, { method: "POST" });
    load();
  };

  const openQuiz = async (quizId: number) => {
    setQuizLoading(true); setQuizResult(null); setQuizAnswers({}); setQuizTimer(0);
    try {
      const q = await api.request(`/courses/quizzes/${quizId}`);
      setQuizData(q); setActiveQuiz(quizId); setActiveLesson(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setQuizLoading(false); }
  };

  const submitQuiz = async () => {
    if (!quizData) return;
    if (Object.keys(quizAnswers).length < quizData.questions.length) {
      toast.warning("Sab questions ka jawab do pehle!"); return;
    }
    setSubmitting(true);
    try {
      const res = await api.request(`/courses/quizzes/${activeQuiz}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: quizAnswers, time_taken_seconds: quizTimer })
      });
      setQuizResult(res); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>Loading course...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!course) return null;

  const tc = TEST_COLORS[course.test_type] || { from: "#4f46e5", to: "#6366f1", accent: "#6366f1" };
  const accent = tc.accent;
  const completedCount = course.lessons?.filter((l: any) => l.completed).length || 0;
  const totalLessons = course.lessons?.length || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .cd-fade{animation:fadeUp 0.4s ease both}
        .lesson-row:hover{background:#f8fafc!important}
        .opt-label:hover{background:#f5f3ff!important;border-color:#c4b5fd!important}
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(135deg, ${tc.from} 0%, ${tc.to} 60%, #0f172a 100%)`, position: "relative", overflow: "hidden", paddingBottom: 40 }}>
        {/* ambient orbs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 0" }}>
          {/* back */}
          <button onClick={() => navigate("/courses")} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "7px 16px", cursor: "pointer", marginBottom: 28, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <ArrowLeft size={14} /> All Courses
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
            {/* Left info */}
            <div style={{ flex: 1, minWidth: 260 }} className="cd-fade">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 11, fontWeight: 900, padding: "5px 14px", borderRadius: 100, letterSpacing: "0.05em" }}>{course.test_type}</span>
                <span style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 100 }}>{course.level}</span>
                {course.is_free && <span style={{ background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 900, padding: "5px 12px", borderRadius: 100 }}>FREE</span>}
              </div>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.2, textTransform: "capitalize" }}>{course.title}</h1>
              {course.description && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 560 }}>{course.description}</p>}

              {/* stat chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  { icon: <BookOpen size={13} />, val: `${totalLessons} Lessons` },
                  { icon: <Zap size={13} />, val: `${course.total_quizzes} Quizzes` },
                  { icon: <Calendar size={13} />, val: `${course.upcoming_live_classes} Live Classes` },
                  { icon: <Users size={13} />, val: `${course.total_students} Students` },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 100, padding: "6px 14px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700 }}>
                    {s.icon} {s.val}
                  </div>
                ))}
              </div>
            </div>

            {/* Enrollment card */}
            <div style={{ width: 300, flexShrink: 0, background: "#fff", borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden" }} className="cd-fade">
              {/* price header */}
              <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: accent, marginBottom: 6 }}>
                  {course.is_free ? "FREE" : `PKR ${course.price?.toLocaleString()}`}
                </div>
                {/* teacher row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}20`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: accent, fontSize: 15 }}>
                    {course.teacher_profile_picture_url
                      ? <img src={`http://localhost:8000${course.teacher_profile_picture_url}`} alt={course.teacher_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : course.teacher_name?.charAt(0).toUpperCase() || "T"}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Instructor</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{course.teacher_name}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px 24px 22px" }}>
                {course.enrolled ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <CheckCircle size={16} color="#10b981" fill="#10b981" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>Enrolled</span>
                    </div>
                    {/* progress bar */}
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Progress</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{course.progress}%</span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: `linear-gradient(90deg,${tc.from},${tc.to})`, borderRadius: 100, width: `${course.progress}%`, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{completedCount}/{totalLessons} lessons done</div>
                    </div>

                    {!course.has_access && !course.is_free && (
                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 12 }}>
                        {course.payment_status === "submitted" ? (
                          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400e", fontWeight: 700, textAlign: "center" }}>
                            ⏳ Payment under review
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Submit Payment</div>
                            <select style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#374151", fontWeight: 600, outline: "none", background: "#f8fafc" }}
                              value={paymentForm.payment_method} onChange={e => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}>
                              {["JazzCash", "Easypaisa", "Bank Transfer"].map(m => <option key={m}>{m}</option>)}
                            </select>
                            <input style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#374151", outline: "none", boxSizing: "border-box" }}
                              placeholder="Transaction ID *" value={paymentForm.payment_reference} onChange={e => setPaymentForm(p => ({ ...p, payment_reference: e.target.value }))} />
                            <button onClick={handleSubmitPayment} disabled={submittingPayment}
                              style={{ width: "100%", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", opacity: submittingPayment ? 0.6 : 1 }}>
                              {submittingPayment ? "Submitting..." : "Submit Payment →"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling}
                    style={{ width: "100%", background: `linear-gradient(135deg,${tc.from},${tc.to})`, color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", opacity: enrolling ? 0.7 : 1, transition: "all 0.2s", boxShadow: `0 6px 20px ${accent}40` }}>
                    {enrolling ? "Enrolling..." : course.is_free ? "Enroll Free →" : "Enroll & Pay →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>

        {/* ── MAIN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* LESSONS */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color={accent} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Course Lessons</h2>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{completedCount} of {totalLessons} completed</div>
              </div>
            </div>
            <div>
              {course.lessons?.map((l: any, i: number) => (
                <div key={l.id} style={{ borderBottom: i < course.lessons.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div className="lesson-row" onClick={() => setActiveLesson(activeLesson?.id === l.id ? null : l)}
                    style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: "#fff", transition: "background 0.15s" }}>
                    {/* number / check */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: l.completed ? "#f0fdf4" : `${accent}10`, border: `2px solid ${l.completed ? "#86efac" : `${accent}25`}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {l.completed
                        ? <CheckCircle size={16} color="#16a34a" fill="#16a34a" />
                        : <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{l.title}</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {l.duration_minutes > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                            <Clock size={10} /> {l.duration_minutes} min
                          </span>
                        )}
                        {l.has_video && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#3b82f6", fontWeight: 700 }}>
                            <Play size={10} fill="#3b82f6" /> Video
                          </span>
                        )}
                        {l.is_free_preview && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", background: "#f0fdf4", border: "1px solid #86efac", padding: "1px 8px", borderRadius: 100 }}>Free Preview</span>
                        )}
                        {!course.enrolled && !l.is_free_preview && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>
                            <Lock size={10} /> Enroll to unlock
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ color: "#94a3b8", flexShrink: 0 }}>
                      {activeLesson?.id === l.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {activeLesson?.id === l.id && (l.content || l.video_url) && (
                    <div style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9", padding: "20px 24px" }}>
                      {l.video_url && getYouTubeEmbed(l.video_url) && (
                        <div style={{ aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                          <iframe src={getYouTubeEmbed(l.video_url)!} style={{ width: "100%", height: "100%" }} allowFullScreen title={l.title} />
                        </div>
                      )}
                      {l.video_url && !getYouTubeEmbed(l.video_url) && (
                        <a href={l.video_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#3b82f6", fontWeight: 700, fontSize: 13, marginBottom: 12, textDecoration: "none" }}>
                          <ExternalLink size={14} /> Watch Video
                        </a>
                      )}
                      {l.content && <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{l.content}</div>}
                      {course.enrolled && !l.completed && (
                        <button onClick={() => markComplete(l.id)}
                          style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontWeight: 800, fontSize: 12, padding: "9px 18px", borderRadius: 12, cursor: "pointer" }}>
                          <CheckCircle size={14} /> Mark as Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* QUIZ TAKING */}
          {quizData && !quizResult && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg,${tc.from}08,${tc.to}08)` }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>{quizData.title}</h2>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{quizData.section} · {quizData.questions.length} questions · {quizData.time_limit_minutes} min</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 16px" }}>
                  <Timer size={14} color={accent} />
                  <span style={{ fontSize: 15, fontWeight: 900, fontFamily: "monospace", color: "#0f172a" }}>{Math.floor(quizTimer / 60)}:{String(quizTimer % 60).padStart(2, "0")}</span>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {quizData.questions.map((q: any, qi: number) => (
                    <div key={q.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.5 }}><span style={{ color: accent, fontWeight: 900 }}>{qi + 1}.</span> {q.question}</div>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 100, flexShrink: 0,
                          background: q.difficulty === "Hard" ? "#fef2f2" : q.difficulty === "Medium" ? "#fffbeb" : "#f0fdf4",
                          color: q.difficulty === "Hard" ? "#dc2626" : q.difficulty === "Medium" ? "#d97706" : "#16a34a",
                          border: `1px solid ${q.difficulty === "Hard" ? "#fecaca" : q.difficulty === "Medium" ? "#fde68a" : "#86efac"}` }}>
                          {q.difficulty}
                        </span>
                      </div>
                      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.options.map((opt: string, oi: number) => {
                          const letter = ["A", "B", "C", "D"][oi];
                          const selected = quizAnswers[String(q.id)] === letter;
                          return (
                            <label key={letter} className="opt-label" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s", border: selected ? `2px solid ${accent}` : "2px solid #f1f5f9", background: selected ? `${accent}08` : "#fff" }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${selected ? accent : "#e2e8f0"}`, background: selected ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: selected ? "#fff" : "#94a3b8", flexShrink: 0, transition: "all 0.15s" }}>{letter}</div>
                              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{opt}</span>
                              <input type="radio" style={{ display: "none" }} name={`q_${q.id}`} value={letter} checked={selected} onChange={() => setQuizAnswers(p => ({ ...p, [q.id]: letter }))} />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={submitQuiz} disabled={submitting}
                  style={{ width: "100%", marginTop: 24, background: `linear-gradient(135deg,${tc.from},${tc.to})`, color: "#fff", border: "none", borderRadius: 14, padding: "16px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", opacity: submitting ? 0.6 : 1, boxShadow: `0 6px 20px ${accent}35`, transition: "opacity 0.2s" }}>
                  {submitting ? "Submitting..." : "Submit Quiz →"}
                </button>
              </div>
            </div>
          )}

          {/* QUIZ RESULT */}
          {quizResult && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "32px 24px", textAlign: "center", background: quizResult.passed ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#fef2f2,#fee2e2)", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: quizResult.passed ? "#16a34a" : "#dc2626", marginBottom: 8 }}>{quizResult.score}%</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: quizResult.passed ? "#15803d" : "#b91c1c", marginBottom: 8 }}>{quizResult.passed ? "🎉 Passed!" : "Keep Practicing!"}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                  <span><BarChart2 size={12} style={{ display: "inline", marginRight: 4 }} />{quizResult.correct}/{quizResult.total} correct</span>
                  <span><Timer size={12} style={{ display: "inline", marginRight: 4 }} />{Math.floor(quizResult.time_taken_seconds / 60)}m {quizResult.time_taken_seconds % 60}s</span>
                </div>
                <button onClick={() => { setQuizResult(null); setQuizData(null); setActiveQuiz(null); }}
                  style={{ marginTop: 18, background: quizResult.passed ? "#16a34a" : "#6366f1", color: "#fff", border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  Close
                </button>
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 14 }}>Answer Review</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {quizResult.result_detail.map((r: any, i: number) => (
                    <div key={i} style={{ padding: "14px 18px", borderRadius: 14, border: `1px solid ${r.is_correct ? "#86efac" : "#fca5a5"}`, background: r.is_correct ? "#f0fdf4" : "#fef2f2" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{i + 1}. {r.question}</div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 600, flexWrap: "wrap" }}>
                        <span style={{ color: "#64748b" }}>Your: <strong style={{ color: r.is_correct ? "#16a34a" : "#dc2626" }}>{r.selected || "—"}</strong></span>
                        {!r.is_correct && <span style={{ color: "#64748b" }}>Correct: <strong style={{ color: "#16a34a" }}>{r.correct_answer}</strong></span>}
                      </div>
                      {r.explanation && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontStyle: "italic", lineHeight: 1.6 }}>{r.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* QUIZZES */}
          {course.quizzes?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={14} color={accent} fill={accent} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Practice Quizzes</h3>
              </div>
              <div>
                {course.quizzes.map((q: any, qi: number) => {
                  const isScheduled = q.scheduled_at && new Date(q.scheduled_at) > new Date();
                  const scheduleDate = q.scheduled_at ? new Date(q.scheduled_at) : null;
                  const passed = q.best_score !== null && q.best_score >= q.pass_score;
                  return (
                    <div key={q.id} style={{ padding: "16px 20px", borderBottom: qi < course.quizzes.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>{q.title}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{q.section} · {q.question_count} Qs · {q.time_limit_minutes}min</div>
                          {isScheduled && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d97706", fontWeight: 700, marginTop: 4 }}>
                              <Clock size={10} /> {scheduleDate?.toLocaleDateString()} {scheduleDate?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </div>
                        {q.best_score !== null && (
                          <span style={{ fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 100, background: passed ? "#f0fdf4" : "#fff7ed", color: passed ? "#16a34a" : "#ea580c", border: `1px solid ${passed ? "#86efac" : "#fed7aa"}` }}>
                            {q.best_score}%
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (!course.enrolled) { toast.warning("Enroll first!"); return; }
                          if (!course.has_access) { toast.warning("Pay fee and get teacher approval first!"); return; }
                          if (isScheduled) { toast.warning(`Quiz available on ${scheduleDate?.toLocaleString()}`); return; }
                          openQuiz(q.id);
                        }}
                        disabled={quizLoading && activeQuiz === q.id}
                        style={{ width: "100%", background: isScheduled ? "#f8fafc" : `linear-gradient(135deg,${tc.from},${tc.to})`, color: isScheduled ? "#94a3b8" : "#fff", border: isScheduled ? "1px solid #e2e8f0" : "none", borderRadius: 12, padding: "10px 0", fontSize: 12, fontWeight: 900, cursor: isScheduled ? "not-allowed" : "pointer", opacity: (quizLoading && activeQuiz === q.id) ? 0.6 : 1, transition: "opacity 0.2s" }}>
                        {quizLoading && activeQuiz === q.id ? "Loading..." : isScheduled ? "🔒 Scheduled" : q.best_score !== null ? "Retry Quiz" : "Start Quiz"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* UPCOMING LIVE CLASSES */}
          {course.upcoming_live_classes_detail?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={14} color="#16a34a" />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Live Classes</h3>
              </div>
              <div>
                {course.upcoming_live_classes_detail.map((lc: any, li: number) => (
                  <div key={lc.id} style={{ padding: "14px 20px", borderBottom: li < course.upcoming_live_classes_detail.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{lc.title}</div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} />{new Date(lc.scheduled_at).toLocaleString("en-PK")}</span>
                      <span>{lc.platform} · {lc.duration_minutes} min</span>
                    </div>
                    {lc.meet_link && course.has_access ? (
                      <a href={lc.meet_link} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontSize: 12, fontWeight: 800, padding: "9px 0", borderRadius: 10, textDecoration: "none", boxSizing: "border-box" }}>
                        <ExternalLink size={12} /> Join Class
                      </a>
                    ) : (
                      <div style={{ fontSize: 11, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 4 }}><Lock size={10} /> Enroll to see link</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAILY MEETING LINKS — enrolled & paid */}
          {course.has_access && course.meeting_links?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${accent}30`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${accent}15`, background: `${accent}08`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ExternalLink size={14} color={accent} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Daily Class Links</h3>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, background: `${accent}15`, color: accent, border: `1px solid ${accent}30`, padding: "3px 10px", borderRadius: 100 }}>Paid Access</span>
              </div>
              <div>
                {course.meeting_links.map((ml: any, mi: number) => (
                  <div key={ml.id} style={{ padding: "14px 20px", borderBottom: mi < course.meeting_links.length - 1 ? `1px solid #f8fafc` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{new Date(ml.date).toLocaleDateString()}</span>
                      {ml.time && <span style={{ fontSize: 11, fontWeight: 800, color: accent, background: `${accent}10`, padding: "2px 8px", borderRadius: 6 }}>{ml.time}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: ml.description ? 4 : 10 }}>{ml.platform}</div>
                    {ml.description && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{ml.description}</div>}
                    <a href={ml.link} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: `linear-gradient(135deg,${tc.from},${tc.to})`, color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 0", borderRadius: 10, textDecoration: "none", boxSizing: "border-box" }}>
                      <ExternalLink size={12} /> Join Class
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAILY LINKS PREVIEW — not enrolled */}
          {!course.enrolled && course.meeting_links?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} className="cd-fade">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ExternalLink size={14} color="#94a3b8" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Daily Class Links</h3>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Enroll & pay to access</div>
                </div>
              </div>
              <div style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Lock size={22} color="#cbd5e1" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>{course.meeting_links.length} class links available</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Enroll to unlock</div>
              </div>
            </div>
          )}

          {/* course highlights */}
          <div style={{ background: `linear-gradient(135deg,${tc.from}08,${tc.to}08)`, borderRadius: 20, border: `1px solid ${accent}20`, padding: "20px" }} className="cd-fade">
            <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" /> This Course Includes
            </h3>
            {[
              { icon: <BookOpen size={13} color={accent} />, text: `${totalLessons} in-depth lessons` },
              { icon: <Zap size={13} color={accent} />, text: `${course.total_quizzes} practice quizzes` },
              { icon: <Calendar size={13} color={accent} />, text: `${course.upcoming_live_classes} live sessions` },
              { icon: <Award size={13} color={accent} />, text: "Certificate on completion" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

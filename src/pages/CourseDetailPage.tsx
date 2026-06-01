import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import { BookOpen, Play, CheckCircle, Clock, Zap, Calendar, Users, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#1e293b",
  Duolingo: "#65a30d", SAT: "#0891b2"
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400">Loading course...</div></div>;
  if (!course) return null;

  const accent = TEST_COLORS[course.test_type] || "#6366f1";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="text-white px-6 py-10" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate("/courses")} className="text-white/70 hover:text-white text-sm mb-5 flex items-center gap-1">← All Courses</button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full mb-3 inline-block">{course.test_type} · {course.level}</span>
              <h1 className="text-3xl font-black mb-2">{course.title}</h1>
              <p className="text-white/80 mb-4">{course.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/70">
                <span className="flex items-center gap-1"><BookOpen size={14} />{course.total_lessons} lessons</span>
                <span className="flex items-center gap-1"><Zap size={14} />{course.total_quizzes} quizzes</span>
                <span className="flex items-center gap-1"><Calendar size={14} />{course.upcoming_live_classes} upcoming classes</span>
                <span className="flex items-center gap-1"><Users size={14} />{course.total_students} students</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-gray-900 min-w-52 shadow-xl">
              <div className="text-2xl font-black mb-1" style={{ color: accent }}>{course.is_free ? "FREE" : `PKR ${course.price}`}</div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 overflow-hidden shrink-0">
                  {course.teacher_profile_picture_url ? (
                    <img 
                      src={`http://localhost:8000${course.teacher_profile_picture_url}`} 
                      alt={course.teacher_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    course.teacher_name?.charAt(0).toUpperCase() || "T"
                  )}
                </div>
                <div className="text-sm text-gray-500">by <span className="font-semibold text-gray-700">{course.teacher_name}</span></div>
              </div>

              {course.enrolled ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm"><CheckCircle size={16} />Enrolled</div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.progress}%` }} /></div>
                  <p className="text-xs text-gray-400">{course.progress}% complete</p>
                  {!course.has_access && !course.is_free && (
                    <div className="space-y-2 border-t pt-2 mt-2">
                      {course.payment_status === "submitted" ? (
                        <p className="text-xs text-amber-600">Payment under review</p>
                      ) : (
                        <>
                          <select className="w-full border rounded p-2 text-xs" value={paymentForm.payment_method} onChange={e => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}>
                            {["JazzCash", "Easypaisa", "Bank Transfer"].map(m => <option key={m}>{m}</option>)}
                          </select>
                          <input className="w-full border rounded p-2 text-xs" placeholder="Txn ID*" value={paymentForm.payment_reference} onChange={e => setPaymentForm(p => ({ ...p, payment_reference: e.target.value }))} />
                          <button onClick={handleSubmitPayment} disabled={submittingPayment} className="w-full bg-amber-500 text-white text-xs font-bold py-2 rounded-lg">Submit Payment</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="w-full text-white font-black py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: accent }}>
                  {enrolling ? "Enrolling..." : course.is_free ? "Enroll Free →" : "Enroll & Pay →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* LESSONS */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <BookOpen size={18} style={{ color: accent }} />
              <h2 className="font-black text-gray-900">Lessons ({course.lessons?.length})</h2>
            </div>
            <div className="divide-y">
              {course.lessons?.map((l: any, i: number) => (
                <div key={l.id}>
                  <div className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveLesson(activeLesson?.id === l.id ? null : l)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${l.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                      {l.completed ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{l.title}</div>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        {l.duration_minutes > 0 && <span><Clock size={10} className="inline mr-0.5" />{l.duration_minutes} min</span>}
                        {l.has_video && <span className="text-blue-500"><Play size={10} className="inline mr-0.5" />Video</span>}
                        {l.is_free_preview && <span className="text-green-600 font-bold">Free Preview</span>}
                        {!course.enrolled && !l.is_free_preview && <span className="text-gray-300">🔒 Enroll to unlock</span>}
                      </div>
                    </div>
                    {activeLesson?.id === l.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                  {activeLesson?.id === l.id && (l.content || l.video_url) && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      {l.video_url && getYouTubeEmbed(l.video_url) && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-4 mt-3">
                          <iframe src={getYouTubeEmbed(l.video_url)!} className="w-full h-full" allowFullScreen title={l.title} />
                        </div>
                      )}
                      {l.video_url && !getYouTubeEmbed(l.video_url) && (
                        <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3 hover:underline"><ExternalLink size={14} />Watch Video</a>
                      )}
                      {l.content && <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{l.content}</div>}
                      {course.enrolled && !l.completed && (
                        <button onClick={() => markComplete(l.id)} className="mt-3 text-xs bg-green-100 text-green-700 font-bold px-4 py-2 rounded-xl hover:bg-green-200 flex items-center gap-1"><CheckCircle size={12} />Mark as Complete</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* QUIZ SECTION */}
          {quizData && !quizResult && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-black text-gray-900">{quizData.title}</h2>
                  <div className="text-sm text-gray-400 mt-0.5">{quizData.section} · {quizData.questions.length} questions · {quizData.time_limit_minutes} min</div>
                </div>
                <div className="text-sm font-mono text-gray-500">{Math.floor(quizTimer / 60)}:{String(quizTimer % 60).padStart(2, "0")}</div>
              </div>
              <div className="p-5 space-y-6">
                {quizData.questions.map((q: any, qi: number) => (
                  <div key={q.id} className="border rounded-xl p-4">
                    <div className="font-semibold text-gray-900 mb-3 text-sm">{qi + 1}. {q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => {
                        const letter = ["A", "B", "C", "D"][oi];
                        const selected = quizAnswers[String(q.id)] === letter;
                        return (
                          <label key={letter} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selected ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300 text-gray-400"}`}>{letter}</div>
                            <span className="text-sm text-gray-700">{opt}</span>
                            <input type="radio" className="hidden" name={`q_${q.id}`} value={letter} checked={selected} onChange={() => setQuizAnswers(p => ({ ...p, [q.id]: letter }))} />
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-1 text-right text-xs" style={{ color: q.difficulty === "Hard" ? "#dc2626" : q.difficulty === "Medium" ? "#d97706" : "#059669" }}>{q.difficulty}</div>
                  </div>
                ))}
                <button onClick={submitQuiz} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-colors">
                  {submitting ? "Submitting..." : "Submit Quiz →"}
                </button>
              </div>
            </div>
          )}

          {/* QUIZ RESULT */}
          {quizResult && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className={`p-6 text-center ${quizResult.passed ? "bg-green-50" : "bg-red-50"}`}>
                <div className={`text-5xl font-black mb-2 ${quizResult.passed ? "text-green-600" : "text-red-500"}`}>{quizResult.score}%</div>
                <div className={`text-xl font-bold mb-1 ${quizResult.passed ? "text-green-700" : "text-red-600"}`}>{quizResult.passed ? "🎉 Passed!" : "Try Again"}</div>
                <div className="text-sm text-gray-500">{quizResult.correct}/{quizResult.total} correct · {Math.floor(quizResult.time_taken_seconds / 60)}m {quizResult.time_taken_seconds % 60}s</div>
                <button onClick={() => { setQuizResult(null); setQuizData(null); setActiveQuiz(null); }} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700">Close</button>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-black text-gray-900 text-sm mb-3">Answers Review:</h3>
                {quizResult.result_detail.map((r: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border text-sm ${r.is_correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="font-semibold text-gray-800 mb-1">{i + 1}. {r.question}</div>
                    <div className="flex gap-4 flex-wrap text-xs">
                      <span>Your answer: <strong className={r.is_correct ? "text-green-700" : "text-red-600"}>{r.selected || "—"}</strong></span>
                      {!r.is_correct && <span>Correct: <strong className="text-green-700">{r.correct_answer}</strong></span>}
                    </div>
                    {r.explanation && <div className="text-gray-500 mt-1 italic">{r.explanation}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-5">
          {/* QUIZZES */}
          {course.quizzes?.length > 0 && (
            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-4 border-b flex items-center gap-2">
                <Zap size={16} style={{ color: accent }} />
                <h3 className="font-black text-gray-900 text-sm">Practice Quizzes</h3>
              </div>
              <div className="divide-y">
                {course.quizzes.map((q: any) => {
                  const isScheduled = q.scheduled_at && new Date(q.scheduled_at) > new Date();
                  const scheduleDate = q.scheduled_at ? new Date(q.scheduled_at) : null;
                  return (
                    <div key={q.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{q.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{q.section} · {q.question_count} Qs · {q.time_limit_minutes}min</div>
                          {isScheduled && (
                            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              Scheduled: {scheduleDate?.toLocaleDateString()} at {scheduleDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                        {q.best_score !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.best_score >= q.pass_score ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{q.best_score}%</span>
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
                        className="w-full text-white text-xs font-bold py-2 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: accent }}
                      >
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
            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-4 border-b flex items-center gap-2">
                <Calendar size={16} className="text-green-600" />
                <h3 className="font-black text-gray-900 text-sm">Live Classes</h3>
              </div>
              <div className="divide-y">
                {course.upcoming_live_classes_detail.map((lc: any) => (
                  <div key={lc.id} className="p-4">
                    <div className="font-semibold text-gray-900 text-sm">{lc.title}</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar size={10} />{new Date(lc.scheduled_at).toLocaleString("en-PK")}</div>
                    <div className="text-xs text-gray-400">{lc.platform} · {lc.duration_minutes} min</div>
                    {lc.meet_link && course.has_access && (
                      <a href={lc.meet_link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-green-600 font-bold hover:underline"><ExternalLink size={12} />Join Class</a>
                    )}
                    {!course.enrolled && <div className="text-xs text-gray-300 mt-1">🔒 Enroll to see link</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAILY MEETING LINKS - Enrolled Students Only */}
          {course.has_access && course.meeting_links?.length > 0 && (
            <div className="bg-white rounded-2xl border shadow-sm border-indigo-200">
              <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="text-indigo-600" />
                  <h3 className="font-black text-gray-900 text-sm">Daily Class Links</h3>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Paid</span>
              </div>
              <div className="divide-y">
                {course.meeting_links.map((ml: any) => (
                  <div key={ml.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{new Date(ml.date).toLocaleDateString()}</span>
                      {ml.time && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{ml.time}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span>{ml.platform}</span>
                    </div>
                    {ml.description && <div className="text-xs text-gray-500 mb-2">{ml.description}</div>}
                    <a
                      href={ml.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Join Class
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEETING LINKS PREVIEW (Not Enrolled) */}
          {!course.enrolled && course.meeting_links?.length > 0 && (
            <div className="bg-gray-50 rounded-2xl border shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-black text-gray-700 text-sm">🔗 Daily Class Links</h3>
                <p className="text-xs text-gray-500 mt-1">Enroll & pay to access daily live class links</p>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-sm text-gray-400">{course.meeting_links.length} class links available</p>
                <p className="text-xs text-gray-300 mt-1">Enroll to unlock</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

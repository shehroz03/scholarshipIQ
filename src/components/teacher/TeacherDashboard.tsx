import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { toast } from "sonner";
import { BookOpen, Users, Video, Plus, Play, Trash2, Eye, EyeOff, Calendar, Zap, LayoutDashboard, GraduationCap, Star, Clock, LogOut, TrendingUp, Award, DollarSign, CheckCircle, XCircle, X, HelpCircle, Settings, ArrowRight, User, Target, FileText, Tag } from "lucide-react";
import { TeacherReviewManagement } from "./TeacherReviewManagement";

const TEST_TYPES = ["IELTS", "TOEFL", "GRE", "GMAT", "PTE", "TestDaF", "Duolingo", "SAT"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const PLATFORMS = ["Google Meet", "Zoom", "Microsoft Teams"];

const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#000",
  Duolingo: "#65a30d", SAT: "#0891b2"
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "courses" | "students" | "create" | "meetings" | "quizzes" | "fees">(() => {
    const savedTab = localStorage.getItem("teacherDashboardTab");
    return (savedTab as any) || "overview";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [registerForm, setRegisterForm] = useState({ bio: "", specializations: "IELTS", experience_years: 1, qualification: "" });
  const [courseForm, setCourseForm] = useState<{ title: string, subject: string, description: string, test_type: string, level: string, price: number | string }>({ title: "", subject: "", description: "", test_type: "IELTS", level: "Beginner", price: "" });
  const [meetingForm, setMeetingForm] = useState({ date: "", time: "", link: "", platform: "Google Meet", description: "" });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(() => {
    const saved = localStorage.getItem("teacherSelectedCourse");
    return saved ? JSON.parse(saved) : null;
  });
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", video_url: "", duration_minutes: 30, is_free_preview: false });
  const [liveForm, setLiveForm] = useState({ title: "", description: "", meet_link: "", platform: "Google Meet", scheduled_at: "", duration_minutes: 60, max_students: 30 });
  const [quizForm, setQuizForm] = useState({ title: "", section: "Reading", time_limit_minutes: 30, pass_score: 60, scheduled_at: "" });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [questionForm, setQuestionForm] = useState({
    question: "", options: ["", "", "", ""], correct_answer: "A", explanation: "", difficulty: "Medium"
  });
  const [showAiGenerator, setShowAiGenerator] = useState<number | null>(null);
  const [manageTab, setManageTab] = useState<"lessons" | "meetings" | "classes" | "quizzes">("lessons");
  const [aiNotes, setAiNotes] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [aiApproved, setAiApproved] = useState<boolean[]>([]);

  const fetchAll = async () => {
    try {
      const p = await api.teacher.getProfile();
      setProfile(p); setIsTeacher(true); setIsStudent(false);
      const [a, c, s, pending] = await Promise.all([
        api.teacher.getAnalytics().catch(() => ({ total_courses: 0, total_students: 0, total_quiz_attempts: 0, average_score: 0, pass_rate: 0, pending_payments: 0 })),
        api.teacher.getCourses(),
        api.teacher.getStudents(),
        api.teacher.getPendingPayments(),
      ]);
      setAnalytics(a); setCourses(c); setStudents(s); setPendingPayments(pending);
      
      // Restore selected course from localStorage with fresh data
      const savedCourseId = localStorage.getItem("teacherSelectedCourseId");
      if (savedCourseId && c && c.length > 0) {
        const found = c.find((course: any) => course.id === parseInt(savedCourseId));
        if (found) {
          setSelectedCourse(found);
        }
      }
    } catch {
      // Not a teacher, check if student
      try {
        const user = await api.users.getMe();
        if (user.role === "student" || !user.is_teacher) {
          setIsStudent(true);
          setIsTeacher(false);
          // Fetch student's enrolled courses with full details
          const enrolled = await api.request("/courses/my/enrolled");
          // Fetch full details for each course to get meeting links
          const fullCourses = await Promise.all(
            enrolled.map(async (e: any) => {
              try {
                const details = await api.request(`/courses/${e.id}`);
                return { ...e, ...details, enrolled: true };
              } catch {
                return { ...e, enrolled: true };
              }
            })
          );
          setStudentCourses(fullCourses);
        }
      } catch {
        setIsStudent(false);
        setIsTeacher(false);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    localStorage.setItem("teacherDashboardTab", tab);
  }, [tab]);

  // Persist selected course ID
  useEffect(() => {
    if (selectedCourse?.id) {
      localStorage.setItem("teacherSelectedCourseId", selectedCourse.id.toString());
    }
  }, [selectedCourse]);

  const handleRegister = async () => {
    try {
      await api.teacher.register(registerForm);
      toast.success("Teacher account created!"); fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreateCourse = async () => {
    try {
      await api.teacher.createCourse(courseForm);
      toast.success("Course created!"); setCourseForm({ title: "", subject: "", description: "", test_type: "IELTS", level: "Beginner", price: "" });
      fetchAll(); setTab("overview");
    } catch (e: any) { toast.error(e.message); }
  };

  const togglePublish = async (courseId: number, current: boolean) => {
    await api.teacher.updateCourse(courseId, { is_published: !current });
    toast.success(!current ? "Course published!" : "Course unpublished"); fetchAll();
  };

  const addLesson = async (courseId: number) => {
    try {
      await api.teacher.addLesson(courseId, lessonForm);
      toast.success("Lesson added!"); setShowLessonForm(false); setLessonForm({ title: "", content: "", video_url: "", duration_minutes: 30, is_free_preview: false });
      const updated = await api.teacher.getCourses(); setCourses(updated);
    } catch (e: any) { toast.error(e.message); }
  };

  const scheduleLive = async (courseId: number) => {
    try {
      await api.teacher.scheduleLiveClass(courseId, liveForm);
      toast.success("Live class scheduled!"); setShowLiveForm(false); fetchAll();
    } catch (e: any) { toast.error(e.message || "Invalid data"); }
  };

  const createQuiz = async (courseId: number) => {
    try {
      await api.teacher.createQuiz(courseId, quizForm);
      toast.success("Quiz created!");
      setShowQuizForm(false);
      setQuizForm({ title: "", section: "Reading", time_limit_minutes: 30, pass_score: 60, scheduled_at: "" });
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const loadQuizQuestions = async (quizId: number) => {
    try {
      const data = await api.teacher.getQuizQuestions(quizId);
      setQuizQuestions(data.questions || []);
      setExpandedQuizId(quizId);
    } catch (e: any) { toast.error(e.message); }
  };

  const addQuizQuestion = async (quizId: number) => {
    const opts = questionForm.options.filter(o => o.trim());
    if (!questionForm.question.trim() || opts.length < 2) {
      toast.error("Question and at least 2 options required");
      return;
    }
    try {
      await api.teacher.addQuizQuestion(quizId, {
        question: questionForm.question,
        options: opts,
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation,
        difficulty: questionForm.difficulty,
      });
      toast.success("Question added!");
      setQuestionForm({ question: "", options: ["", "", "", ""], correct_answer: "A", explanation: "", difficulty: "Medium" });
      loadQuizQuestions(quizId);
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const generateAiQuiz = async () => {
    if (!aiNotes.trim()) { toast.error("Please write your notes or topic first"); return; }
    setAiLoading(true);
    setAiGeneratedQuestions([]);
    try {
      const prompt = `You are a professional test-prep quiz creator. Generate exactly ${aiQuestionCount} MCQ questions based on the following notes/topic. Return ONLY a valid JSON array, no extra text, no markdown code blocks. Format:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"A","explanation":"...","difficulty":"Medium"}]

Notes/Topic: ${aiNotes}`;
      const res = await api.chatbot.sendTeacherMessage(prompt);
      const text = res?.response || res?.message || res?.reply || res?.content || "";
      console.log("AI Response:", text);
      
      if (!text || text.trim().length < 10) {
        toast.error("AI returned empty response. Please try again.");
        return;
      }
      
      // Try to extract JSON - look for array pattern or code blocks
      let jsonText = text;
      let parsed: any[] = [];
      
      try {
        // Remove markdown code blocks if present
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim();
        }
        
        // Remove any text before [ and after ]
        const startIdx = jsonText.indexOf('[');
        const endIdx = jsonText.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonText = jsonText.substring(startIdx, endIdx + 1);
        }
        
        // Clean up common JSON issues
        jsonText = jsonText
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}');
        
        // Parse JSON
        parsed = JSON.parse(jsonText);
      } catch (parseError: any) {
        console.error("AI JSON Parse Error:", parseError.message, "Text:", jsonText);
        toast.error("AI could not generate valid questions. Try with simpler notes or fewer questions.");
        return;
      }
      
      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error("AI returned empty questions. Please try again.");
        return;
      }
      
      // Validate each question has required fields
      const validQuestions = parsed.filter((q: any) => 
        q.question && Array.isArray(q.options) && q.options.length === 4 && q.correct_answer
      );
      
      if (validQuestions.length === 0) {
        toast.error("AI generated invalid question format. Please try again.");
        return;
      }
      
      setAiGeneratedQuestions(validQuestions);
      setAiApproved(validQuestions.map(() => true));
      toast.success(`${validQuestions.length} questions generated!`);
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      toast.error(e?.message || "AI generation failed. Check console for details.");
    } finally { setAiLoading(false); }
  };

  const addApprovedAiQuestions = async (quizId: number) => {
    const approved = aiGeneratedQuestions.filter((_, i) => aiApproved[i]);
    if (approved.length === 0) { toast.error("Please approve at least 1 question"); return; }
    
    // Validate questions have required fields
    const validQuestions = approved.filter(q => 
      q.question && q.question.trim() && 
      Array.isArray(q.options) && q.options.length === 4 &&
      q.correct_answer && ["A","B","C","D"].includes(q.correct_answer)
    );
    
    const invalidCount = approved.length - validQuestions.length;
    if (invalidCount > 0) {
      toast.warning(`${invalidCount} questions have invalid format and will be skipped`);
    }
    
    if (validQuestions.length === 0) {
      toast.error("No valid questions to add. Each question needs: question text, 4 options, and correct answer (A/B/C/D)");
      return;
    }
    
    let added = 0;
    let failed = 0;
    for (const q of validQuestions) {
      try {
        const opts = (q.options || []).map((o: string) => o.replace(/^[A-D]\.\s*/, ""));
        await api.teacher.addQuizQuestion(quizId, {
          question: q.question,
          options: opts,
          correct_answer: q.correct_answer,
          explanation: q.explanation || "",
          difficulty: q.difficulty || "Medium",
        });
        added++;
      } catch (e: any) {
        console.error("Failed to add question:", q, "Error:", e);
        failed++;
      }
    }
    if (failed > 0) {
      toast.warning(`${added} questions added, ${failed} failed. Check console for details.`);
    } else {
      toast.success(`${added} questions added to quiz!`);
    }
    setShowAiGenerator(null);
    setAiNotes(""); setAiGeneratedQuestions([]); setAiApproved([]);
    loadQuizQuestions(quizId);
    fetchAll();
  };

  const approvePayment = async (enrollmentId: number) => {
    try {
      await api.teacher.approvePayment(enrollmentId);
      toast.success("Payment approved — student can access classes!");
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const rejectPayment = async (enrollmentId: number, reason: string = "Payment not verified") => {
    try {
      await api.teacher.rejectPayment(enrollmentId, reason);
      toast.warning("Payment rejected");
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-800 text-lg font-semibold">Loading...</div></div>;

  // STUDENT VIEW - Show enrolled courses with meeting links and scheduled quizzes
  if (isStudent && !isTeacher) {
    const totalMeetingLinks = studentCourses.reduce((acc, c) => acc + (c.meeting_links?.length || 0), 0);
    const upcomingQuizzes = studentCourses.flatMap(c =>
      (c.quizzes || []).filter((q: any) => q.scheduled_at && new Date(q.scheduled_at) > new Date())
        .map((q: any) => ({ ...q, courseTitle: c.title }))
    );

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">My Classes & Test Prep</h1>
              <p className="text-sm text-gray-500 mt-1">Enrolled courses — pay fee to unlock meeting links, live classes & quizzes</p>
            </div>
            <button onClick={() => navigate("/courses")} className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700">
              Browse More Courses
            </button>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-3xl font-black text-indigo-600">{studentCourses.length}</div>
              <div className="text-sm text-gray-500">Enrolled Courses</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-3xl font-black text-green-600">{totalMeetingLinks}</div>
              <div className="text-sm text-gray-500">Daily Class Links</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-3xl font-black text-amber-600">{upcomingQuizzes.length}</div>
              <div className="text-sm text-gray-500">Upcoming Quizzes</div>
            </div>
          </div>

          {/* Enrolled Courses with Meeting Links */}
          {studentCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="text-gray-400" size={40} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
              <p className="text-gray-500 mb-4">Enroll in courses to see live class links and quizzes here</p>
              <button onClick={() => navigate("/courses")} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700">
                Browse Courses
              </button>
            </div>
          ) : (
            studentCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Course Header */}
                <div className="p-5 border-b bg-gradient-to-r from-indigo-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: TEST_COLORS[course.test_type] || "#6366f1" }}>
                        {course.test_type?.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.subject} · {course.teacher_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {course.has_access === false && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Fee pending</span>}
                      {course.has_access && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Paid</span>}
                      <button onClick={() => navigate(`/courses/${course.id}`)} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-200">
                        Open Course →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-5">
                  {/* Meeting Links */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <Video size={14} className="text-indigo-600" />
                      Daily Class Links ({course.meeting_links?.length || 0})
                    </h4>
                    {course.meeting_links?.length > 0 ? (
                      <div className="space-y-2">
                        {course.meeting_links.map((link: any) => (
                          <div key={link.id} className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-gray-900">{new Date(link.date).toLocaleDateString()}</span>
                              {link.time && <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded">{link.time}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{link.platform} · {link.description || "Daily Class"}</p>
                            {link.link && course.has_access !== false ? (
                              <a href={link.link} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700">
                                Join Class
                              </a>
                            ) : (
                              <span className="block text-center text-xs text-amber-600 py-2">Pay fee to unlock</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No meeting links yet</p>
                    )}
                  </div>

                  {/* Quizzes */}
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-purple-600" />
                      Scheduled Quizzes ({course.quizzes?.length || 0})
                    </h4>
                    {course.quizzes?.length > 0 ? (
                      <div className="space-y-2">
                        {course.quizzes.map((quiz: any) => {
                          const isScheduled = quiz.scheduled_at && new Date(quiz.scheduled_at) > new Date();
                          return (
                            <div key={quiz.id} className={`rounded-xl p-3 border ${isScheduled ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-100'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-gray-900">{quiz.title}</span>
                                {quiz.best_score !== null && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${quiz.best_score >= quiz.pass_score ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {quiz.best_score}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{quiz.section} · {quiz.time_limit_minutes}min · {quiz.question_count || 0} Qs</p>
                              {isScheduled ? (
                                <p className="text-xs text-amber-600 mt-1">
                                  ⏰ {new Date(quiz.scheduled_at).toLocaleString()}
                                </p>
                              ) : (
                                <button onClick={() => navigate(`/courses/${course.id}`)} className="mt-2 w-full text-center text-xs bg-purple-600 text-white py-1.5 rounded-lg hover:bg-purple-700">
                                  Take Quiz
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No quizzes yet</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Teacher Registration Form (for non-teachers, non-students)
  if (!isTeacher && !isStudent) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-indigo-600" size={40} /></div>
          <h1 className="text-3xl font-black text-gray-900">Become a Teacher</h1>
          <p className="text-gray-500 mt-2">Students ki IELTS, TOEFL, GRE tayari mein help karo</p>
        </div>
        <div className="space-y-4">
          <div><label className="text-sm font-semibold text-gray-700 block mb-1">Bio / Introduction</label>
            <textarea className="w-full border rounded-xl p-3 text-sm resize-none h-20 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Apne baare mein batao..." value={registerForm.bio} onChange={e => setRegisterForm(p => ({ ...p, bio: e.target.value }))} /></div>
          <div><label className="text-sm font-semibold text-gray-700 block mb-1">Specialization</label>
            <select className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={registerForm.specializations} onChange={e => setRegisterForm(p => ({ ...p, specializations: e.target.value }))}>
              {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold text-gray-700 block mb-1">Experience (years)</label>
              <input type="number" min="0" className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={registerForm.experience_years} onChange={e => setRegisterForm(p => ({ ...p, experience_years: +e.target.value }))} /></div>
            <div><label className="text-sm font-semibold text-gray-700 block mb-1">Qualification</label>
              <input className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. M.Ed, CELTA" value={registerForm.qualification} onChange={e => setRegisterForm(p => ({ ...p, qualification: e.target.value }))} /></div>
          </div>
          <button onClick={handleRegister} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-base transition-colors">Register as Teacher →</button>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, color: "#6366f1" },
    { id: "profile", label: "My Profile", icon: User, color: "#f43f5e" },
    { id: "courses", label: "My Courses", icon: BookOpen, color: "#2563eb" },
    { id: "meetings", label: "Classes & Links", icon: Video, color: "#0891b2" },
    { id: "quizzes", label: "Quizzes", icon: Zap, color: "#7c3aed" },
    { id: "fees", label: "Fee Payments", icon: DollarSign, color: "#059669" },
    { id: "students", label: "Students", icon: Users, color: "#d97706" },
    { id: "create", label: "Create Course", icon: Plus, color: "#6366f1" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* SIDEBAR */}
      <aside style={{ width: "256px", minWidth: "256px", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)", overflowY: "auto" }}>
        {/* Logo */}
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <GraduationCap size={22} style={{ color: "#a5b4fc" }} />
            </div>
            <div>
              <p className="font-black text-white text-sm">ScholarIQ</p>
              <p className="text-xs" style={{ color: "#a5b4fc" }}>Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Teacher Profile */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Profile Picture Upload */}
            <div className="relative group">
              <input
                type="file"
                id="profile-picture-input"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Validate file size (5MB max)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File too large. Max 5MB allowed.");
                    return;
                  }
                  
                  try {
                    toast.loading("Uploading profile picture...");
                    const result = await api.teacher.uploadProfilePicture(file);
                    toast.dismiss();
                    toast.success("Profile picture uploaded!");
                    setProfile({ ...profile, profile_picture_url: result.profile_picture_url });
                  } catch (err: any) {
                    toast.dismiss();
                    toast.error(err.message || "Failed to upload picture");
                  }
                }}
              />
              <label
                htmlFor="profile-picture-input"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-white/50"
                style={{ 
                  background: profile?.profile_picture_url ? "transparent" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {profile?.profile_picture_url ? (
                  <img 
                    src={`http://localhost:8000${profile.profile_picture_url}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "T"
                )}
              </label>
              {/* Hover overlay */}
              <label 
                htmlFor="profile-picture-input"
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <span className="text-[10px] text-white font-bold text-center leading-tight">Change<br/>Photo</span>
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{profile?.name || "Teacher"}</p>
              <p className="text-xs truncate" style={{ color: "#c7d2fe" }}>{profile?.specializations}</p>
            </div>
          </div>
          {profile?.is_verified && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.2)" }}>
              <Award size={12} style={{ color: "#6ee7b7" }} />
              <span className="text-xs font-bold" style={{ color: "#6ee7b7" }}>Verified Teacher</span>
            </div>
          )}
          {profile?.profile_picture_url && (
            <button
              onClick={async () => {
                try {
                  await api.teacher.removeProfilePicture();
                  toast.success("Profile picture removed");
                  setProfile({ ...profile, profile_picture_url: null });
                } catch (err: any) {
                  toast.error(err.message || "Failed to remove picture");
                }
              }}
              className="mt-2 text-xs text-violet-300 hover:text-white transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              style={tab === id ? {
                width: "100%", display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                transition: "all 0.15s", cursor: "pointer", border: "none",
                backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", borderLeft: `3px solid ${color}`, paddingLeft: "11px"
              } : {
                width: "100%", display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
                transition: "all 0.15s", cursor: "pointer", border: "none",
                backgroundColor: "transparent", color: "#c7d2fe", borderLeft: "3px solid transparent"
              }}
            >
              <Icon size={18} style={{ color: tab === id ? color : "#a5b4fc", flexShrink: 0 }} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={() => navigate("/courses")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#c7d2fe", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
          >
            <Eye size={16} style={{ color: "#a5b4fc", flexShrink: 0 }} />
            <span>View as Student</span>
          </button>
          <button
            onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("userRole"); navigate("/teacher-login"); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#fca5a5", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
          >
            <LogOut size={16} style={{ color: "#fca5a5", flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", minWidth: 0 }}>
        {/* Top Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 rounded-full" style={{ background: navItems.find(n => n.id === tab)?.color || "#6366f1" }} />
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">
                {navItems.find(n => n.id === tab)?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                {tab === "overview" && "Your teaching summary and quick actions"}
                {tab === "profile" && "Manage your public profile and details"}
                {tab === "courses" && "Manage courses, lessons, meetings, and quizzes"}
                {tab === "meetings" && "All meeting links and live classes"}
                {tab === "quizzes" && "Manage quizzes and questions"}
                {tab === "fees" && "Approve student fee payments"}
                {tab === "students" && "View enrolled students and progress"}
                {tab === "create" && "Create a new test-prep course with fee"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>{profile?.name?.charAt(0)?.toUpperCase() || "T"}</div>
              <span className="text-sm font-semibold text-gray-700">{profile?.name?.split(" ")[0]}</span>
            </div>
            <button
              onClick={() => setTab("create")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Plus size={15} /> New Course
            </button>
          </div>
        </div>

        <div className="p-6">

        {/* PROFILE */}
        {tab === "profile" && profile && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <User size={24} className="text-indigo-600" /> Public Profile Info
              </h2>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name (User Model) */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Full Name</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.name || ""}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Specializations (comma separated)</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.specializations?.join(", ") || ""}
                      onChange={e => setProfile({ ...profile, specializations: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="e.g. IELTS, TOEFL"
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Experience (Years)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.experience_years || 0}
                      onChange={e => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  {/* Qualification/Certifications */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Certifications</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.qualification || ""}
                      onChange={e => setProfile({ ...profile, qualification: e.target.value })}
                      placeholder="e.g. CELTA, TEFL"
                    />
                  </div>

                  {/* Degree */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Degree</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.degree || ""}
                      onChange={e => setProfile({ ...profile, degree: e.target.value })}
                      placeholder="e.g. MA English Literature"
                    />
                  </div>

                  {/* Institution */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">Institution</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.institution || ""}
                      onChange={e => setProfile({ ...profile, institution: e.target.value })}
                      placeholder="e.g. Oxford University"
                    />
                  </div>

                  {/* CV/LinkedIn URL */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">LinkedIn / CV URL</label>
                    <input
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50"
                      value={profile.cv_url || ""}
                      onChange={e => setProfile({ ...profile, cv_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  {/* Bio */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">About Me (Bio)</label>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-gray-50 resize-none"
                      value={profile.bio || ""}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Write a brief introduction about yourself and your teaching style..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        toast.loading("Updating profile...");
                        await api.teacher.updateProfile({
                          name: profile.name,
                          bio: profile.bio,
                          specializations: profile.specializations.join(","),
                          experience_years: profile.experience_years,
                          qualification: profile.qualification,
                          degree: profile.degree,
                          institution: profile.institution,
                          cv_url: profile.cv_url,
                        });
                        toast.dismiss();
                        toast.success("Profile updated successfully!");
                        fetchAll(); // Refresh data
                      } catch (err: any) {
                        toast.dismiss();
                        toast.error(err.message || "Failed to update profile");
                      }
                    }}
                    className="text-white font-bold py-3 px-8 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 hover:shadow-md hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}
                  >
                    Save Changes <CheckCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {tab === "overview" && analytics && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Courses", value: analytics.total_courses, icon: BookOpen, grad: "linear-gradient(135deg,#6366f1,#818cf8)", light: "#eef2ff" },
                { label: "Total Students", value: analytics.total_students, icon: Users, grad: "linear-gradient(135deg,#2563eb,#60a5fa)", light: "#eff6ff" },
                { label: "Pending Fees", value: analytics.pending_payments ?? 0, icon: DollarSign, grad: "linear-gradient(135deg,#d97706,#fbbf24)", light: "#fffbeb" },
                { label: "Quiz Attempts", value: analytics.total_quiz_attempts, icon: Zap, grad: "linear-gradient(135deg,#7c3aed,#a78bfa)", light: "#f5f3ff" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: s.grad }}>
                      <s.icon size={22} color="white" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Total</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500 font-semibold">{s.label}</div>
                  <div className="mt-3 h-1 rounded-full" style={{ background: s.light }}>
                    <div className="h-full rounded-full w-3/4" style={{ background: s.grad }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pass Rate + Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{ background: "#059669", transform: "translate(30%,-30%)" }} />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#059669,#34d399)" }}>
                    <TrendingUp size={18} color="white" />
                  </div>
                  <h3 className="font-black text-gray-900">Student Pass Rate</h3>
                </div>
                <div className="text-6xl font-black mb-3" style={{ color: "#059669" }}>{analytics.pass_rate}<span className="text-3xl">%</span></div>
                <div className="h-3 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${analytics.pass_rate}%`, background: "linear-gradient(90deg,#059669,#34d399)" }} />
                </div>
                <p className="text-xs text-gray-400 mt-3 font-medium">{analytics.total_quiz_attempts} total quiz attempts · avg score {analytics.average_score}%</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Create New Course", icon: Plus, bg: "#eef2ff", color: "#6366f1", tab: "create" },
                    { label: "Manage Courses", icon: BookOpen, bg: "#eff6ff", color: "#2563eb", tab: "courses" },
                    { label: "View All Students", icon: Users, bg: "#f0fdf4", color: "#059669", tab: "students" },
                  ].map(a => (
                    <button key={a.tab} onClick={() => setTab(a.tab as any)} className="w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01]" style={{ backgroundColor: a.bg, color: a.color }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: a.color, opacity: 0.15 }}></div>
                      <a.icon size={16} style={{ marginLeft: -28 }} />
                      <span style={{ marginLeft: 4 }}>{a.label}</span>
                      <ArrowRight size={14} className="ml-auto opacity-40" />
                    </button>
                  ))}
                  {(analytics.pending_payments ?? 0) > 0 && (
                    <button onClick={() => setTab("fees")} className="w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
                      <DollarSign size={16} /> {analytics.pending_payments} Pending Payment(s)
                      <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">Action needed</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Courses */}
            {courses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} style={{ color: "#6366f1" }} />
                    <h3 className="font-black text-gray-900">Recent Courses</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{courses.length}</span>
                  </div>
                  <button onClick={() => setTab("courses")} className="text-sm font-bold flex items-center gap-1" style={{ color: "#6366f1" }}>View All <ArrowRight size={14} /></button>
                </div>
                <div className="divide-y divide-gray-50">
                  {courses.slice(0, 3).map(c => (
                    <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-sm" style={{ background: `linear-gradient(135deg, ${TEST_COLORS[c.test_type] || "#6366f1"}, ${TEST_COLORS[c.test_type] || "#8b5cf6"}99)` }}>{c.test_type}</div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.level} · <strong className="text-gray-600">{c.enrolled_students}</strong> students · {c.total_lessons} lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={c.is_published ? { backgroundColor: "#d1fae5", color: "#065f46" } : { backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                          {c.is_published ? "● Live" : "○ Draft"}
                        </span>
                        <button onClick={() => setTab("courses")} className="text-xs text-indigo-600 font-bold px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100">Manage</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY COURSES */}
        {tab === "courses" && (
          <div className="space-y-6">
            {/* Header Section */}
            <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", padding: "32px" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h1 style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, margin: 0 }}>My Courses</h1>
                  <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>Manage your courses, lessons, and student engagement</p>
                </div>
                <button onClick={() => setTab("create")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff", padding: "12px 24px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={18} /> New Course
                </button>
              </div>
              {/* Stats Row */}
              <div style={{ position: "relative", display: "flex", gap: "24px", marginTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={20} color="#818cf8" />
                  </div>
                  <div>
                    <p style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{courses.length}</p>
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Total Courses</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={20} color="#34d399" />
                  </div>
                  <div>
                    <p style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{courses.reduce((acc, c) => acc + (c.enrolled_students || 0), 0)}</p>
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Total Students</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={20} color="#fbbf24" />
                  </div>
                  <div>
                    <p style={{ color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{courses.reduce((acc, c) => acc + (c.total_live_classes || 0), 0)}</p>
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Live Classes</p>
                  </div>
                </div>
              </div>
            </div>

            {courses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px", background: "#ffffff", borderRadius: "24px", border: "2px dashed #e2e8f0" }}>
                <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <BookOpen size={40} color="#6366f1" />
                </div>
                <h3 style={{ color: "#1e293b", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No courses yet</h3>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Create your first course to start teaching students</p>
                <button onClick={() => setTab("create")} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff", padding: "14px 28px", borderRadius: "14px", fontWeight: 700, fontSize: "15px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)" }}>+ Create First Course</button>
              </div>
            ) : courses.map(c => (
              <div key={c.id} style={{ background: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" }}>
                {/* Course Card Header */}
                <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", borderBottom: selectedCourse?.id === c.id ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                    {/* Course Icon */}
                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#ffffff", flexShrink: 0, background: `linear-gradient(135deg, ${TEST_COLORS[c.test_type] || "#6366f1"}, ${TEST_COLORS[c.test_type] || "#8b5cf6"}cc)`, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)" }}>
                      {c.test_type}
                    </div>
                    {/* Course Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                        <h3 style={{ color: "#1e293b", fontSize: "18px", fontWeight: 700, margin: 0 }}>{c.title}</h3>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: c.is_published ? "#dcfce7" : "#fef3c7", color: c.is_published ? "#166534" : "#92400e", display: "flex", alignItems: "center", gap: "4px" }}>
                          {c.is_published ? <><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }}></span> Live</> : <><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }}></span> Draft</>}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontWeight: 600, color: "#475569" }}>{c.level}</span>
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Users size={14} /> {c.enrolled_students || 0} students
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <BookOpen size={14} /> {c.total_lessons || 0} lessons
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Target size={14} /> {c.total_quizzes || 0} quizzes
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: c.price > 0 ? "#059669" : "#64748b" }}>
                          {c.price > 0 ? `PKR ${c.price.toLocaleString()}` : "Free"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => togglePublish(c.id, c.is_published)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={c.is_published ? "Unpublish" : "Publish"}>
                      {c.is_published ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#6366f1" />}
                    </button>
                    <button onClick={() => setSelectedCourse(selectedCourse?.id === c.id ? null : c)} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: selectedCourse?.id === c.id ? "#6366f1" : "#f1f5f9", color: selectedCourse?.id === c.id ? "#ffffff" : "#475569", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      {selectedCourse?.id === c.id ? <><X size={16} /> Close</> : <><Settings size={16} /> Manage</>}
                    </button>
                    <button onClick={async () => {
                      if (!confirm(`Delete "${c.title}" permanently?\n\nThis will delete all lessons, quizzes, meeting links and live classes.`)) return;
                      try { await api.teacher.deleteCourse(c.id); toast.success("Course deleted!"); fetchAll(); } catch (e: any) { toast.error(e.message || "Failed to delete course"); }
                    }} style={{ padding: "10px", borderRadius: "10px", border: "none", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete Course">
                      <Trash2 size={18} color="#dc2626" />
                    </button>
                  </div>
                </div>

                {selectedCourse?.id === c.id && (
                  <div style={{ background: "#f8fafc", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* ADD LESSON */}
                    <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={18} color="#ffffff" />
                          </div>
                          <h4 style={{ color: "#1e293b", fontSize: "15px", fontWeight: 700, margin: 0 }}>Lessons ({c.total_lessons || 0})</h4>
                        </div>
                        <button onClick={() => setShowLessonForm(!showLessonForm)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: showLessonForm ? "#f1f5f9" : "#6366f1", color: showLessonForm ? "#475569" : "#ffffff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Plus size={14} /> {showLessonForm ? "Cancel" : "Add Lesson"}
                        </button>
                      </div>

                      {/* Existing Lessons List */}
                      {c.lessons?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                          {c.lessons.map((lesson: any) => (
                            <div key={lesson.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Play size={16} color="#6366f1" />
                                </div>
                                <div>
                                  <p style={{ color: "#1e293b", fontSize: "14px", fontWeight: 600, margin: 0 }}>{lesson.title}</p>
                                  <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>
                                    {lesson.duration_minutes} min · {lesson.is_free_preview ? <span style={{ color: "#059669" }}>Free Preview</span> : <span>Paid</span>}
                                    {lesson.video_url && " · Has Video"}
                                  </p>
                                </div>
                              </div>
                              <button onClick={async () => { if (!confirm(`Delete lesson "${lesson.title}"?`)) return; try { await api.teacher.deleteLesson(lesson.id); toast.success("Lesson deleted!"); fetchAll(); } catch (e: any) { toast.error(e.message || "Failed to delete lesson"); } }} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#fef2f2", cursor: "pointer" }} title="Delete Lesson">
                                <Trash2 size={16} color="#dc2626" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showLessonForm && (
                        <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                          <input style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px" }} placeholder="Lesson title *" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} />
                          <textarea style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", minHeight: "80px", resize: "none", marginBottom: "12px" }} placeholder="Lesson content / notes..." value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} />
                          <input style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px" }} placeholder="YouTube video URL (optional)" value={lessonForm.video_url} onChange={e => setLessonForm(p => ({ ...p, video_url: e.target.value }))} />
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <input type="number" style={{ width: "120px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="Duration (min)" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#475569", cursor: "pointer" }}>
                              <input type="checkbox" checked={lessonForm.is_free_preview} onChange={e => setLessonForm(p => ({ ...p, is_free_preview: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                              <span>Free preview</span>
                            </label>
                            <button onClick={() => addLesson(c.id)} style={{ marginLeft: "auto", padding: "10px 20px", borderRadius: "8px", border: "none", background: "#6366f1", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Save Lesson</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DAILY MEETING LINKS - For Paid Students */}
                    <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #f59e0b, #fbbf24)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Video size={18} color="#ffffff" />
                          </div>
                          <div>
                            <h4 style={{ color: "#1e293b", fontSize: "15px", fontWeight: 700, margin: 0 }}>Daily Meeting Links ({c.meeting_links?.length || 0})</h4>
                            <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>Only visible to paid students</p>
                          </div>
                        </div>
                        <button onClick={() => setShowMeetingForm(!showMeetingForm)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: showMeetingForm ? "#f1f5f9" : "#f59e0b", color: showMeetingForm ? "#475569" : "#ffffff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Plus size={14} /> {showMeetingForm ? "Cancel" : "Add Link"}
                        </button>
                      </div>

                      {/* Existing Meeting Links */}
                      {c.meeting_links?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                          {c.meeting_links.map((link: any, idx: number) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #fef3c7, #fde68a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Video size={16} color="#f59e0b" />
                                </div>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <p style={{ color: "#1e293b", fontSize: "14px", fontWeight: 600, margin: 0 }}>{new Date(link.date).toLocaleDateString()}</p>
                                    {link.time && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#e0e7ff", color: "#4338ca" }}>{link.time}</span>}
                                  </div>
                                  <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>{link.platform} · {link.description || "Daily Class"}</p>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <a href={link.link} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", background: "#f59e0b", color: "#ffffff", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>Join</a>
                                <button onClick={async () => { if (!confirm("Delete this meeting link?")) return; try { await api.teacher.deleteMeetingLink(link.id); toast.success("Meeting link deleted!"); fetchAll(); } catch (e: any) { toast.error(e.message); } }} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#fef2f2", cursor: "pointer" }} title="Delete">
                                  <Trash2 size={16} color="#dc2626" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Meeting Link Form */}
                      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Date *</label>
                            <input type="date" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} min={new Date().toISOString().split('T')[0]} value={meetingForm.date} onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Time</label>
                            <input type="time" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} value={meetingForm.time} onChange={e => setMeetingForm(p => ({ ...p, time: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Platform *</label>
                            <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} value={meetingForm.platform} onChange={e => setMeetingForm(p => ({ ...p, platform: e.target.value }))}>
                              {PLATFORMS.map(pl => <option key={pl}>{pl}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Meeting Link *</label>
                          <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="https://meet.google.com/... or https://zoom.us/j/..." value={meetingForm.link} onChange={e => setMeetingForm(p => ({ ...p, link: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Description</label>
                          <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="e.g. Speaking Practice Session" value={meetingForm.description} onChange={e => setMeetingForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <button onClick={async () => { if (!meetingForm.date || !meetingForm.link) { toast.error("Date and link are required"); return; } try { await api.teacher.addMeetingLink(c.id, meetingForm); toast.success("Meeting link added!"); setMeetingForm({ date: "", time: "", link: "", platform: "Google Meet", description: "" }); fetchAll(); } catch (e: any) { toast.error(e.message); } }} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Add Meeting Link</button>
                      </div>
                    </div>

                    {/* SCHEDULE LIVE CLASS */}
                    <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981, #34d399)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Calendar size={18} color="#ffffff" />
                          </div>
                          <h4 style={{ color: "#1e293b", fontSize: "15px", fontWeight: 700, margin: 0 }}>Scheduled Live Classes ({c.total_live_classes || 0})</h4>
                        </div>
                        <button onClick={() => setShowLiveForm(!showLiveForm)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: showLiveForm ? "#f1f5f9" : "#10b981", color: showLiveForm ? "#475569" : "#ffffff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Plus size={14} /> {showLiveForm ? "Cancel" : "Schedule Class"}
                        </button>
                      </div>

                      {/* Existing Live Classes List */}
                      {c.live_classes?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                          {c.live_classes.map((lc: any) => (
                            <div key={lc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Calendar size={16} color="#10b981" />
                                </div>
                                <div>
                                  <p style={{ color: "#1e293b", fontSize: "14px", fontWeight: 600, margin: 0 }}>{lc.title}</p>
                                  <p style={{ color: "#64748b", fontSize: "12px", margin: "2px 0 0" }}>
                                    {new Date(lc.scheduled_at).toLocaleString()} · {lc.platform} · {lc.duration_minutes} min
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <a href={lc.meet_link} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", background: "#10b981", color: "#ffffff", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>Join</a>
                                <button onClick={async () => { if (!confirm("Cancel this live class?")) return; try { await api.teacher.deleteLiveClass(lc.id); toast.success("Live class cancelled!"); fetchAll(); } catch (e: any) { toast.error(e.message); } }} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#fef2f2", cursor: "pointer" }} title="Cancel Class">
                                  <Trash2 size={16} color="#dc2626" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showLiveForm && (
                        <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                          <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px" }} placeholder="Class title *" value={liveForm.title} onChange={e => setLiveForm(p => ({ ...p, title: e.target.value }))} />
                          <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", marginBottom: "12px" }} placeholder="Zoom / Google Meet link *" value={liveForm.meet_link} onChange={e => setLiveForm(p => ({ ...p, meet_link: e.target.value }))} />
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "12px" }}>
                            <select style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} value={liveForm.platform} onChange={e => setLiveForm(p => ({ ...p, platform: e.target.value }))}>
                              {PLATFORMS.map(pl => <option key={pl}>{pl}</option>)}
                            </select>
                            <input type="datetime-local" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={liveForm.scheduled_at} onChange={e => setLiveForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <input type="number" style={{ width: "100px", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="Duration (min)" value={liveForm.duration_minutes} onChange={e => setLiveForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                            <input type="number" style={{ width: "100px", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="Max students" value={liveForm.max_students} onChange={e => setLiveForm(p => ({ ...p, max_students: +e.target.value }))} />
                            <button onClick={() => scheduleLive(c.id)} style={{ marginLeft: "auto", padding: "10px 20px", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Schedule Class</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CREATE QUIZ */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">📝 Quizzes ({c.total_quizzes})</h4>
                        <button onClick={() => setShowQuizForm(!showQuizForm)} className="text-xs bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-xl hover:bg-purple-200"><Plus size={12} className="inline mr-1" />Create Quiz</button>
                      </div>

                      {/* Create Quiz Form */}
                      {showQuizForm && (
                        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                            <span className="font-bold text-sm text-purple-800">Step 1: Quiz Settings</span>
                          </div>
                          <input className="w-full border-2 border-purple-300 rounded-lg p-3 text-sm bg-white text-gray-800 font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all" placeholder="Quiz title* e.g. IELTS Reading Practice Test" value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }} />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Section</label>
                              <select className="w-full border border-purple-200 rounded-lg p-2.5 text-sm bg-white" value={quizForm.section} onChange={e => setQuizForm(p => ({ ...p, section: e.target.value }))}>
                                {["Reading", "Listening", "Writing", "Speaking", "Vocabulary", "Quantitative", "Verbal", "General"].map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Schedule Date & Time</label>
                              <input type="datetime-local" className="w-full border border-purple-200 rounded-lg p-2.5 text-sm bg-white" min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={quizForm.scheduled_at} onChange={e => setQuizForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Time Limit (minutes)</label>
                              <input type="number" className="w-full border border-purple-200 rounded-lg p-2.5 text-sm bg-white" placeholder="e.g. 30" value={quizForm.time_limit_minutes} onChange={e => setQuizForm(p => ({ ...p, time_limit_minutes: +e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Passing Score (%)</label>
                              <input type="number" className="w-full border border-purple-200 rounded-lg p-2.5 text-sm bg-white" placeholder="e.g. 60" value={quizForm.pass_score} onChange={e => setQuizForm(p => ({ ...p, pass_score: +e.target.value }))} />
                            </div>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                            💡 <strong>After creating the quiz</strong>, you will add MCQ questions with 4 options (A, B, C, D) and mark the correct answer.
                          </div>
                          <button onClick={() => createQuiz(c.id)} className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700">Create Quiz & Add Questions →</button>
                        </div>
                      )}

                      {/* Existing Quizzes */}
                      {c.quizzes?.length > 0 && (
                        <div className="space-y-3 mb-2">
                          {c.quizzes.map((q: any) => (
                            <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              {/* Quiz Header */}
                              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div>
                                    <p className="font-bold text-sm text-gray-900">📝 {q.title || "Untitled Quiz"}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{q.section}</span>
                                      <span className="text-xs text-gray-500">⏱ {q.time_limit_minutes}min</span>
                                      <span className="text-xs text-gray-500">✅ Pass: {q.pass_score}%</span>
                                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{q.question_count ?? 0} MCQs</span>
                                    </div>
                                    {q.scheduled_at && (
                                      <p className="text-xs text-amber-600 mt-1">📅 {new Date(q.scheduled_at).toLocaleString()}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Delete this quiz permanently?")) return;
                                      try {
                                        await api.teacher.deleteQuiz(q.id);
                                        toast.success("Quiz deleted!");
                                        fetchAll();
                                      } catch (e: any) { toast.error(e.message); }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 border border-red-100 flex-shrink-0"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                {/* Action Buttons - clearly visible */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => loadQuizQuestions(q.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                                    style={expandedQuizId === q.id
                                      ? { background: "#6366f1", color: "#fff", borderColor: "#6366f1" }
                                      : { background: "#fff", color: "#6366f1", borderColor: "#6366f1" }}
                                  >
                                    <Plus size={13} /> {expandedQuizId === q.id ? "Close Questions" : "Add MCQ Questions"}
                                  </button>
                                  <button
                                    onClick={() => { loadQuizQuestions(q.id); setShowAiGenerator(q.id); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border-2 transition-all"
                                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", borderColor: "transparent" }}
                                  >
                                    <span>✨</span> Generate with AI
                                  </button>
                                </div>
                              </div>

                              {/* MCQ Question Editor */}
                              {expandedQuizId === q.id && (
                                <div className="p-4 space-y-4">

                                  {/* AI QUIZ GENERATOR */}
                                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl overflow-hidden">
                                    <button
                                      onClick={() => setShowAiGenerator(showAiGenerator === q.id ? null : q.id)}
                                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-100 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">AI</div>
                                        <span className="font-bold text-sm text-violet-800">✨ Generate MCQs with AI</span>
                                        <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-semibold">New</span>
                                      </div>
                                      <span className="text-violet-500 text-xs font-bold">{showAiGenerator === q.id ? "▲ Close" : "▼ Open"}</span>
                                    </button>

                                    {showAiGenerator === q.id && (
                                      <div className="px-4 pb-4 space-y-4 border-t border-violet-200">
                                        <p className="text-xs text-violet-600 pt-3">📝 Apne notes, topic ya idea likhein — AI automatically MCQ questions generate karega</p>

                                        {/* Notes Input */}
                                        <div>
                                          <label className="text-xs font-bold text-gray-700 mb-1 block">Your Notes / Topic / Idea *</label>
                                          <textarea
                                            className="w-full border border-violet-200 rounded-xl p-3 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                                            rows={4}
                                            placeholder={"e.g.\n- IELTS Reading: True/False/Not Given questions\n- Students should identify writer's claims\n- Focus on skimming and scanning techniques\n\nYa simply: TOEFL Listening comprehension practice"}
                                            value={aiNotes}
                                            onChange={e => setAiNotes(e.target.value)}
                                          />
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Questions Count</label>
                                            <input
                                              type="number"
                                              min={1}
                                              max={50}
                                              className="w-24 border border-violet-200 rounded-lg p-2 text-sm bg-white"
                                              value={aiQuestionCount}
                                              onChange={e => setAiQuestionCount(Math.min(50, Math.max(1, +e.target.value || 1)))}
                                              placeholder="5"
                                            />
                                          </div>
                                          <button
                                            onClick={generateAiQuiz}
                                            disabled={aiLoading || !aiNotes.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: aiLoading ? "#a78bfa" : "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                                          >
                                            {aiLoading ? (
                                              <><span className="animate-spin">⟳</span> AI Generating...</>
                                            ) : (
                                              <>✨ Generate Questions</>
                                            )}
                                          </button>
                                        </div>

                                        {/* AI Generated Questions Review */}
                                        {aiGeneratedQuestions.length > 0 && (
                                          <div className="space-y-3">
                                            {/* BIG SAVE BUTTON AT TOP */}
                                            <div style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "16px", padding: "16px", textAlign: "center", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)" }}>
                                              <p style={{ color: "white", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                                                🎉 {aiGeneratedQuestions.length} AI Questions Generated!
                                              </p>
                                              <button
                                                onClick={() => addApprovedAiQuestions(q.id)}
                                                disabled={aiApproved.filter(Boolean).length === 0}
                                                className="w-full py-3 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50"
                                                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid white" }}
                                              >
                                                💾 SAVE ALL {aiApproved.filter(Boolean).length} QUESTIONS TO QUIZ
                                              </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <p className="text-sm font-bold text-gray-800">📋 Review & Approve/Reject</p>
                                              <div className="flex gap-2">
                                                <button onClick={() => setAiApproved(aiApproved.map(() => true))} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-lg font-bold">Approve All</button>
                                                <button onClick={() => setAiApproved(aiApproved.map(() => false))} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-lg font-bold">Reject All</button>
                                              </div>
                                            </div>

                                            {aiGeneratedQuestions.map((aq, idx) => (
                                              <div key={idx} className={`border-2 rounded-xl p-3 transition-all ${aiApproved[idx] ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50 opacity-60"}`}>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                  <p className="text-sm font-semibold text-gray-800 flex-1">Q{idx + 1}. {aq.question}</p>
                                                  <button
                                                    onClick={() => { const a = [...aiApproved]; a[idx] = !a[idx]; setAiApproved(a); }}
                                                    className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${aiApproved[idx] ? "bg-green-500 text-white border-green-500" : "bg-white text-red-500 border-red-300"}`}
                                                  >
                                                    {aiApproved[idx] ? "✓ Approved" : "✗ Rejected"}
                                                  </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 mb-1">
                                                  {(aq.options || []).map((opt: string, oi: number) => (
                                                    <p key={oi} className={`text-xs px-2 py-1 rounded-lg ${aq.correct_answer === ["A","B","C","D"][oi] ? "bg-green-200 text-green-800 font-bold" : "bg-white text-gray-600"}`}>
                                                      {opt} {aq.correct_answer === ["A","B","C","D"][oi] && "✓"}
                                                    </p>
                                                  ))}
                                                </div>
                                                {aq.explanation && <p className="text-xs text-blue-600 italic mt-1">💡 {aq.explanation}</p>}
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${aq.difficulty === "Hard" ? "bg-red-100 text-red-600" : aq.difficulty === "Easy" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-700"}`}>{aq.difficulty}</span>
                                              </div>
                                            ))}

                                            <button
                                              onClick={() => addApprovedAiQuestions(q.id)}
                                              className="w-full py-3 rounded-xl text-sm font-bold text-white"
                                              style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                                            >
                                              ✅ Add {aiApproved.filter(Boolean).length} Approved Questions to Quiz
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Existing Questions Preview */}
                                  {quizQuestions.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Existing Questions ({quizQuestions.length})</p>
                                      {quizQuestions.map((qq: any, qi: number) => (
                                        <div key={qq.id} className="bg-gray-50 border rounded-lg p-3">
                                          <p className="text-sm font-semibold text-gray-800">Q{qi + 1}. {qq.question}</p>
                                          <div className="grid grid-cols-2 gap-1 mt-2">
                                            {(qq.options || []).map((opt: string, oi: number) => (
                                              <p key={oi} className={`text-xs px-2 py-1 rounded ${qq.correct_answer === ["A","B","C","D"][oi] ? "bg-green-100 text-green-700 font-bold" : "text-gray-500"}`}>
                                                {["A","B","C","D"][oi]}. {opt} {qq.correct_answer === ["A","B","C","D"][oi] && "✓"}
                                              </p>
                                            ))}
                                          </div>
                                          {qq.explanation && <p className="text-xs text-blue-600 mt-1 italic">💡 {qq.explanation}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Divider when AI questions exist */}
                                  {aiGeneratedQuestions.length > 0 && (
                                    <div style={{ borderTop: "2px dashed #e9d5ff", margin: "24px 0", paddingTop: "16px" }}>
                                      <p style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", fontWeight: 500 }}>⬆️ Save AI questions above OR add manually below ⬇️</p>
                                    </div>
                                  )}

                                  {/* Add New MCQ Question - Manual Entry */}
                                  <div style={{ background: "linear-gradient(135deg, #fefce8, #fef9c3)", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "2px solid #facc15" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #fde047" }}>
                                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #eab308, #facc15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Plus size={18} color="#ffffff" />
                                      </div>
                                      <div>
                                        <h4 style={{ color: "#1e293b", fontSize: "16px", fontWeight: 700, margin: 0 }}>Add Question Manually</h4>
                                        <p style={{ color: "#854d0e", fontSize: "12px", margin: "2px 0 0 0" }}>Fill form below to add one question at a time</p>
                                      </div>
                                    </div>

                                    {/* Question Field */}
                                    <div style={{ marginBottom: "20px" }}>
                                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Question *</label>
                                      <textarea style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", minHeight: "70px", resize: "vertical", background: "#ffffff" }} placeholder="e.g. According to the passage, what is the main reason for...?" value={questionForm.question} onChange={e => setQuestionForm(p => ({ ...p, question: e.target.value }))} />
                                    </div>

                                    {/* Answer Options */}
                                    <div style={{ marginBottom: "20px" }}>
                                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "12px" }}>Answer Options (4 options)</label>
                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                                        {questionForm.options.map((opt, i) => {
                                          const letter = ["A","B","C","D"][i];
                                          const isCorrect = questionForm.correct_answer === letter;
                                          return (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: isCorrect ? "#f0fdf4" : "#f8fafc", borderRadius: "10px", border: isCorrect ? "1px solid #86efac" : "1px solid #e2e8f0" }}>
                                              <span style={{ width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, flexShrink: 0, background: isCorrect ? "#22c55e" : "#e2e8f0", color: isCorrect ? "#ffffff" : "#64748b" }}>{letter}</span>
                                              <input style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", padding: "4px 0", outline: "none" }} placeholder={`Option ${letter} *`} value={opt} onChange={e => { const o = [...questionForm.options]; o[i] = e.target.value; setQuestionForm(p => ({ ...p, options: o })); }} />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Correct Answer & Difficulty */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "20px" }}>
                                      <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Correct Answer *</label>
                                        <select style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#ffffff", color: "#16a34a", fontWeight: 600 }} value={questionForm.correct_answer} onChange={e => setQuestionForm(p => ({ ...p, correct_answer: e.target.value }))}>
                                          {["A","B","C","D"].map(x => <option key={x} value={x}>Option {x} is correct</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Difficulty Level</label>
                                        <select style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", background: "#ffffff" }} value={questionForm.difficulty} onChange={e => setQuestionForm(p => ({ ...p, difficulty: e.target.value }))}>
                                          <option value="Easy">🟢 Easy</option>
                                          <option value="Medium">🟡 Medium</option>
                                          <option value="Hard">🔴 Hard</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Explanation */}
                                    <div style={{ marginBottom: "20px" }}>
                                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Explanation <span style={{ fontWeight: 400, color: "#94a3b8" }}>(shown after student answers)</span></label>
                                      <input style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px" }} placeholder="e.g. The answer is A because the passage states..." value={questionForm.explanation} onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} />
                                    </div>

                                    {/* Save Button */}
                                    <button onClick={() => addQuizQuestion(q.id)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", color: "#ffffff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)" }}>
                                      💾 Save Question
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MEETINGS - all courses */}
        {tab === "meetings" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Manage daily meeting links and live classes per course in <button className="text-indigo-600 font-bold" onClick={() => setTab("courses")}>My Courses → Manage</button>, or overview below.</p>
            {courses.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-xs" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}>{c.test_type}</div>
                  <div>
                    <h3 className="font-black text-gray-900">{c.title}</h3>
                    <p className="text-xs text-gray-500">PKR {c.price || "Free"} · {c.meeting_links?.length || 0} links · {c.live_classes?.length || 0} live classes</p>
                  </div>
                  <button onClick={() => { setTab("courses"); setSelectedCourse(c); }} className="ml-auto text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">Manage</button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(c.meeting_links || []).map((link: any) => (
                    <div key={link.id} className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <p className="font-semibold text-sm">{new Date(link.date).toLocaleDateString()} {link.time && `· ${link.time}`}</p>
                      <p className="text-xs text-gray-500">{link.platform}</p>
                      <a href={link.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold mt-1 inline-block">Open link →</a>
                    </div>
                  ))}
                  {(c.live_classes || []).map((lc: any) => (
                    <div key={lc.id} className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="font-semibold text-sm">{lc.title}</p>
                      <p className="text-xs text-gray-500">{new Date(lc.scheduled_at).toLocaleString()}</p>
                      <a href={lc.meet_link} target="_blank" rel="noreferrer" className="text-xs text-green-700 font-bold mt-1 inline-block">Join →</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUIZZES - all courses */}
        {tab === "quizzes" && (
          <div className="space-y-4">
            {courses.every(c => !(c.quizzes?.length)) ? (
              <div className="text-center py-16 bg-white rounded-2xl border text-gray-400">No quizzes yet. Create from My Courses.</div>
            ) : courses.map(c => (c.quizzes || []).map((q: any) => (
              <div key={q.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-gray-900">{q.title}</p>
                  <p className="text-xs text-gray-500">{c.title} · {q.section} · {q.question_count ?? 0} questions</p>
                </div>
                <button onClick={() => { setTab("courses"); setSelectedCourse(c); loadQuizQuestions(q.id); }} className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold">Manage</button>
              </div>
            )))}
          </div>
        )}

        {/* FEES */}
        {tab === "fees" && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-black text-gray-900">Pending Fee Payments ({pendingPayments.length})</h3>
              <p className="text-sm text-gray-500 mt-1">Students submit JazzCash / Easypaisa / Bank transfer — you approve to unlock classes</p>
            </div>
            {pendingPayments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No pending payments</div>
            ) : (
              <div className="divide-y">
                {pendingPayments.map((p: any) => (
                  <div key={p.enrollment_id} className="p-5 flex flex-wrap items-center gap-4 justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{p.student_name}</p>
                      <p className="text-sm text-gray-500">{p.course_title} · {p.test_type}</p>
                      <p className="text-xs text-gray-400 mt-1">Fee: PKR {p.course_price} · Status: <span className="font-bold text-amber-600">{p.payment_status}</span></p>
                      {p.payment_reference && <p className="text-xs mt-1">Ref: {p.payment_method} — {p.payment_reference}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approvePayment(p.enrollment_id)} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => rejectPayment(p.enrollment_id)} className="flex items-center gap-1 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-200">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS */}
        {tab === "students" && (
          <div className="space-y-6">
            {/* Header Section */}
            <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", padding: "32px" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h1 style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, margin: 0 }}>My Students</h1>
                  <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>View enrolled students, their progress, and payment status</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", background: "rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                  <Users size={20} color="#ffffff" />
                  <span style={{ color: "#ffffff", fontSize: "18px", fontWeight: 700 }}>{students.length}</span>
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>enrolled</span>
                </div>
              </div>
            </div>

            {/* Students List */}
            {students.length === 0 ? (
              <div style={{ background: "#ffffff", borderRadius: "20px", padding: "60px 40px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Users size={40} color="#6366f1" />
                </div>
                <h3 style={{ color: "#1e293b", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>No Students Enrolled Yet</h3>
                <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>Students will appear here once they enroll in your courses and complete payment.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {students.map((s, i) => (
                  <div key={i} style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    {/* Student Avatar */}
                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={28} color="#ffffff" />
                    </div>

                    {/* Student Info */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <h4 style={{ color: "#1e293b", fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>{s.student_name}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>{s.course_title}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "6px", background: TEST_COLORS[s.test_type] || "#6366f1", color: "#ffffff", fontSize: "11px", fontWeight: 700 }}>{s.test_type}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ minWidth: "140px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>Progress</span>
                        <span style={{ color: "#1e293b", fontSize: "13px", fontWeight: 700 }}>{s.progress || 0}%</span>
                      </div>
                      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.progress || 0}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "3px" }} />
                      </div>
                    </div>

                    {/* Average Score */}
                    <div style={{ minWidth: "80px", textAlign: "center" }}>
                      <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "2px" }}>Avg Score</div>
                      <div style={{ color: "#7c3aed", fontSize: "20px", fontWeight: 800 }}>{s.avg_score || 0}%</div>
                    </div>

                    {/* Payment Status */}
                    <div style={{ minWidth: "100px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", background: s.payment_status === "approved" ? "#dcfce7" : s.payment_status === "submitted" ? "#fef3c7" : "#f1f5f9", color: s.payment_status === "approved" ? "#166534" : s.payment_status === "submitted" ? "#92400e" : "#64748b", fontSize: "12px", fontWeight: 700 }}>
                        {s.payment_status === "approved" ? <CheckCircle size={14} /> : s.payment_status === "submitted" ? <Clock size={14} /> : <DollarSign size={14} />}
                        {s.payment_status || "Free"}
                      </div>
                    </div>

                    {/* Actions */}
                    {s.payment_status === "submitted" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => approvePayment(s.enrollment_id)} style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#22c55e", color: "#ffffff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => rejectPayment(s.enrollment_id, "Payment verification failed")} style={{ padding: "10px", borderRadius: "10px", border: "none", background: "#fef2f2", cursor: "pointer" }}>
                          <X size={16} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE COURSE */}
        {tab === "create" && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            {/* ── Hero Section ── */}
            <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", marginBottom: "32px", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #6366f1 100%)", boxShadow: "0 25px 50px -12px rgba(30,27,75,0.4)" }}>
              {/* Grid pattern overlay */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", pointerEvents: "none" }} />
              {/* Gradient orbs */}
              <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-80px", left: "20%", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: "20px", left: "60%", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative", padding: "40px 40px 36px" }}>
                {/* Top row: Icon + Title + Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                    <Plus size={26} color="#a5b4fc" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ color: "#ffffff", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0, lineHeight: 1.2 }}>Create Your Course</h1>
                    <p style={{ color: "rgba(165,180,252,0.9)", fontSize: "15px", marginTop: "4px", fontWeight: 500 }}>Design, publish & share your expertise with students worldwide</p>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.5)" }} />
                    <span style={{ color: "#d1fae5", fontSize: "12px", fontWeight: 700 }}>Step 1 of 4</span>
                  </div>
                </div>

                {/* Stepper - Glass Card */}
                <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", padding: "20px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {[
                      { step: 1, label: "Course Details", icon: "📝", active: true },
                      { step: 2, label: "Add Lessons", icon: "📚", active: false },
                      { step: 3, label: "Add Quizzes", icon: "✍️", active: false },
                      { step: 4, label: "Publish", icon: "🚀", active: false }
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                        {/* Step circle + label */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={item.active ? {
                            width: "44px", height: "44px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "15px", fontWeight: 800, background: "#ffffff", color: "#4f46e5", boxShadow: "0 4px 20px rgba(255,255,255,0.3)"
                          } : {
                            width: "44px", height: "44px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "15px", fontWeight: 800, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)"
                          }}>
                            {item.active ? item.icon : item.step}
                          </div>
                          <div>
                            <p style={{ color: item.active ? "#ffffff" : "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 700, margin: 0 }}>{item.label}</p>
                            <p style={{ color: item.active ? "rgba(165,180,252,0.9)" : "rgba(255,255,255,0.3)", fontSize: "11px", fontWeight: 500, margin: "2px 0 0" }}>
                              {item.active ? "In progress" : "Upcoming"}
                            </p>
                          </div>
                        </div>
                        {/* Connector line */}
                        {i < 3 && (
                          <div style={{ flex: 1, height: "2px", margin: "0 16px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
                            {item.active && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "30%", borderRadius: "2px", background: "linear-gradient(90deg, rgba(165,180,252,0.8), rgba(165,180,252,0.2))" }} />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Main Content ── */}
            <div className="grid lg:grid-cols-[1fr,380px] gap-8 items-start">

              {/* ── FORM SECTION ── */}
              <div className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                        <p className="text-sm text-gray-600">Essential details about your course</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Title & Subject Row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                          placeholder="e.g. IELTS Band 7+ Complete Course"
                          value={courseForm.title}
                          onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                          placeholder="e.g. English, Reading, Writing"
                          value={courseForm.subject}
                          onChange={e => setCourseForm(p => ({ ...p, subject: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Course Description</label>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base resize-none h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all leading-relaxed"
                        placeholder="Describe what students will learn in this course..."
                        value={courseForm.description}
                        onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Course Settings Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <Settings size={20} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Course Settings</h2>
                        <p className="text-sm text-gray-600">Configure test type, level, and pricing</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Test Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                          value={courseForm.test_type}
                          onChange={e => setCourseForm(p => ({ ...p, test_type: e.target.value }))}
                        >
                          {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Difficulty Level</label>
                        <select
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                          value={courseForm.level}
                          onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}
                        >
                          {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Course Fee <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₨</span>
                          <input
                            type="number" min="0"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                            placeholder="e.g. 5000"
                            value={courseForm.price}
                            onChange={e => setCourseForm(p => ({ ...p, price: e.target.value === "" ? "" : +e.target.value }))}
                          />
                        </div>
                        {(!courseForm.price || courseForm.price === 0) && (
                          <div className="flex items-center gap-2 mt-2 text-green-600">
                            <CheckCircle size={14} />
                            <span className="text-sm font-medium">This course will be free for students</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleCreateCourse}
                  disabled={!courseForm.title || !courseForm.subject}
                  className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.98]"
                  style={
                    courseForm.title && courseForm.subject
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", boxShadow: "0 8px 30px rgba(99,102,241,0.4)" }
                      : { background: "#e5e7eb", color: "#9ca3af" }
                  }
                >
                  {courseForm.title && courseForm.subject ? (
                    <>
                      <Plus size={20} />
                      Create Course
                      <ArrowRight size={20} />
                    </>
                  ) : (
                    <>Fill required fields to continue</>
                  )}
                </button>
              </div>

              {/* ── SIDEBAR ── */}
              <div className="space-y-6 lg:sticky lg:top-6">
                {/* Live Preview */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-gray-700">Live Preview</span>
                    </div>
                    <Eye size={16} className="text-gray-400" />
                  </div>
                  
                  <div className="relative">
                    <div className="h-3 transition-all duration-300" style={{ backgroundColor: TEST_COLORS[courseForm.test_type] || "#6366f1" }} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-white shadow-sm" style={{ backgroundColor: TEST_COLORS[courseForm.test_type] || "#6366f1" }}>
                          {courseForm.test_type || "Select Type"}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm ${
                          (!courseForm.price || courseForm.price === 0) 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}>
                          {(!courseForm.price || courseForm.price === 0) ? "FREE" : `₨${Number(courseForm.price).toLocaleString()}`}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight min-h-[2.5rem]">
                        {courseForm.title || <span className="text-gray-300 font-normal italic">Your course title will appear here...</span>}
                      </h3>
                      
                      <p className="text-sm text-gray-500 mb-3 line-clamp-3 min-h-[3rem] leading-relaxed">
                        {courseForm.description || <span className="text-gray-300 italic">Course description preview...</span>}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        {courseForm.subject && (
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
                            {courseForm.subject}
                          </span>
                        )}
                        <span className="bg-gray-50 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md border border-gray-200">
                          {courseForm.level}
                        </span>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={12} className="text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{profile?.name || "You"}</span>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                          Draft
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Checklist */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-indigo-600" />
                    Completion Checklist
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    {[
                      { label: "Course Title", done: !!courseForm.title, icon: BookOpen },
                      { label: "Subject", done: !!courseForm.subject, icon: Target },
                      { label: "Description", done: !!courseForm.description, icon: FileText },
                      { label: "Test Type", done: !!courseForm.test_type, icon: Tag },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          item.done 
                            ? "bg-green-500 shadow-md shadow-green-200" 
                            : "bg-gray-100 border border-gray-200"
                        }`}>
                          {item.done ? (
                            <CheckCircle size={14} className="text-white" />
                          ) : (
                            <item.icon size={12} className="text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-all ${
                          item.done ? "text-gray-900" : "text-gray-400"
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-bold text-indigo-600">
                        {[courseForm.title, courseForm.subject, courseForm.description, courseForm.test_type].filter(Boolean).length}/4
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${([courseForm.title, courseForm.subject, courseForm.description, courseForm.test_type].filter(Boolean).length / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 p-5">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <Star size={18} className="text-amber-500" fill="currentColor" />
                    Pro Tips
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-800 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Use specific test names in titles (e.g. "IELTS Writing Task 2")</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Include target band/score in description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>Free courses attract more initial students</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

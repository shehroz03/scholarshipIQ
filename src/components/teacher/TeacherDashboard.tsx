import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { toast } from "sonner";
import { BookOpen, Users, Video, BarChart2, Plus, ChevronRight, Clock, Star, Play, Trash2, Eye, EyeOff, Calendar, Zap, LayoutDashboard, GraduationCap, VideoIcon, FileText, HelpCircle, Link2, DollarSign, Settings, LogOut, Menu, X } from "lucide-react";

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
  const [tab, setTab] = useState<"overview" | "courses" | "students" | "create" | "my-classes" | "meeting-links" | "live-classes" | "quizzes">("overview");
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
  const [courseForm, setCourseForm] = useState({ title: "", subject: "", description: "", test_type: "IELTS", level: "Beginner", price: 0 });
  const [meetingForm, setMeetingForm] = useState({ date: "", time: "", link: "", platform: "Google Meet", description: "" });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", content: "", video_url: "", duration_minutes: 30, is_free_preview: false });
  const [liveForm, setLiveForm] = useState({ title: "", description: "", meet_link: "", platform: "Google Meet", scheduled_at: "", duration_minutes: 60, max_students: 30 });
  const [quizForm, setQuizForm] = useState({ title: "", section: "Reading", time_limit_minutes: 30, pass_score: 60, scheduled_at: "" });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);

  const fetchAll = async () => {
    try {
      const p = await api.request("/teacher/profile");
      setProfile(p); setIsTeacher(true); setIsStudent(false);
      const [a, c, s] = await Promise.all([
        api.request("/teacher/analytics"),
        api.request("/teacher/courses"),
        api.request("/teacher/students"),
      ]);
      setAnalytics(a); setCourses(c); setStudents(s);
    } catch {
      // Not a teacher, check if student
      try {
        const user = await api.request("/users/me");
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

  const handleRegister = async () => {
    try {
      await api.request("/teacher/register", { method: "POST", body: JSON.stringify(registerForm) });
      toast.success("Teacher account created!"); fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreateCourse = async () => {
    try {
      await api.request("/teacher/courses", { method: "POST", body: JSON.stringify(courseForm) });
      toast.success("Course created!"); setCourseForm({ title: "", subject: "", description: "", test_type: "IELTS", level: "Beginner", price: 0 });
      fetchAll(); setTab("courses");
    } catch (e: any) { toast.error(e.message); }
  };

  const togglePublish = async (courseId: number, current: boolean) => {
    await api.request(`/teacher/courses/${courseId}`, { method: "PUT", body: JSON.stringify({ is_published: !current }) });
    toast.success(!current ? "Course published!" : "Course unpublished"); fetchAll();
  };

  const addLesson = async (courseId: number) => {
    try {
      await api.request(`/teacher/courses/${courseId}/lessons`, { method: "POST", body: JSON.stringify(lessonForm) });
      toast.success("Lesson added!"); setShowLessonForm(false); setLessonForm({ title: "", content: "", video_url: "", duration_minutes: 30, is_free_preview: false });
      const updated = await api.request(`/teacher/courses`); setCourses(updated);
    } catch (e: any) { toast.error(e.message); }
  };

  const scheduleLive = async (courseId: number) => {
    try {
      await api.request(`/teacher/courses/${courseId}/live-classes`, { method: "POST", body: JSON.stringify(liveForm) });
      toast.success("Live class scheduled!"); setShowLiveForm(false); fetchAll();
    } catch (e: any) { toast.error(e.message || "Invalid data"); }
  };

  const createQuiz = async (courseId: number) => {
    try {
      await api.request(`/teacher/courses/${courseId}/quizzes`, { method: "POST", body: JSON.stringify(quizForm) });
      toast.success("Quiz created!");
      setShowQuizForm(false);
      setQuizForm({ title: "", section: "Reading", time_limit_minutes: 30, pass_score: 60, scheduled_at: "" });
      fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-500 text-lg">Loading...</div></div>;

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
              <h1 className="text-2xl font-black text-gray-900">My Live Classes</h1>
              <p className="text-sm text-gray-500 mt-1">Your enrolled courses, meeting links & scheduled quizzes</p>
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
                    <button onClick={() => navigate(`/courses/${course.id}`)} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-200">
                      Open Course →
                    </button>
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
                            {link.link ? (
                              <a href={link.link} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700">
                                Join Class
                              </a>
                            ) : (
                              <span className="block text-center text-xs text-gray-400 py-2">Link hidden</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</button>
          <span className="text-gray-200">|</span>
          <span className="font-black text-xl text-gray-900">Teacher Dashboard</span>
          {profile?.is_verified && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✓ Verified</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Welcome, {profile?.name?.split(" ")[0]}</span>
          <button onClick={() => navigate("/courses")} className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700">View as Student</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* SIDEBAR NAVIGATION */}
        <div className="flex gap-2 bg-gray-100/80 rounded-2xl p-2 mb-8 w-fit overflow-x-auto">
          {[
            ["overview", "Overview", LayoutDashboard],
            ["courses", "My Courses", BookOpen],
            ["students", "Students", Users],
            ["create", "Create Course", Plus],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                tab === id
                  ? "bg-white shadow-md text-indigo-700 ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && analytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Courses", value: analytics.total_courses, icon: BookOpen, color: "indigo" },
                { label: "Total Students", value: analytics.total_students, icon: Users, color: "blue" },
                { label: "Quiz Attempts", value: analytics.total_quiz_attempts, icon: Zap, color: "purple" },
                { label: "Avg Score", value: `${analytics.average_score}%`, icon: Star, color: "yellow" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center mb-3`}>
                    <s.icon size={20} className={`text-${s.color}-600`} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-1">Pass Rate</h3>
                <div className="text-4xl font-black text-green-600">{analytics.pass_rate}%</div>
                <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${analytics.pass_rate}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{analytics.total_quiz_attempts} total attempts</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setTab("create")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-colors"><Plus size={16} /> Create New Course</button>
                  <button onClick={() => setTab("students")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors"><Users size={16} /> View All Students</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY COURSES */}
        {tab === "courses" && (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-semibold">No courses yet.</p>
                <button onClick={() => setTab("create")} className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Create First Course</button>
              </div>
            ) : courses.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: TEST_COLORS[c.test_type] || "#6366f1" }}>{c.test_type}</div>
                    <div>
                      <div className="font-black text-gray-900">{c.title}</div>
                      <div className="text-sm text-gray-400">{c.level} · {c.enrolled_students} students · {c.total_lessons} lessons · {c.total_quizzes} quizzes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.is_published ? "Published" : "Draft"}</span>
                    <button onClick={() => togglePublish(c.id, c.is_published)} className="p-2 rounded-xl hover:bg-gray-100" title={c.is_published ? "Unpublish" : "Publish"}>
                      {c.is_published ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-indigo-500" />}
                    </button>
                    <button onClick={() => setSelectedCourse(selectedCourse?.id === c.id ? null : c)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedCourse?.id === c.id ? "bg-indigo-600 text-white" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}>
                      {selectedCourse?.id === c.id ? "Close" : "Manage"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${c.title}" permanently?\n\nThis will delete all lessons, quizzes, meeting links and live classes.`)) return;
                        try {
                          console.log("Deleting course:", c.id);
                          await api.request(`/teacher/courses/${c.id}`, { method: "DELETE" });
                          toast.success("Course deleted!");
                          fetchAll();
                        } catch (e: any) {
                          console.error("Delete course error:", e);
                          toast.error(e.message || "Failed to delete course");
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500"
                      title="Delete Course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {selectedCourse?.id === c.id && (
                  <div className="border-t bg-gray-50 p-5 space-y-5">
                    {/* ADD LESSON */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">📚 Lessons ({c.total_lessons})</h4>
                        <button onClick={() => setShowLessonForm(!showLessonForm)} className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-200"><Plus size={12} className="inline mr-1" />Add Lesson</button>
                      </div>

                      {/* Existing Lessons List */}
                      {c.lessons?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {c.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  <Play size={14} className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{lesson.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {lesson.duration_minutes}min · {lesson.is_free_preview ? "Free Preview" : "Paid"}
                                    {lesson.video_url && " · Has Video"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
                                  try {
                                    console.log("Deleting lesson:", lesson.id);
                                    await api.request(`/teacher/lessons/${lesson.id}`, { method: "DELETE" });
                                    toast.success("Lesson deleted!");
                                    fetchAll();
                                  } catch (e: any) {
                                    console.error("Delete lesson error:", e);
                                    toast.error(e.message || "Failed to delete lesson");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                title="Delete Lesson"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showLessonForm && (
                        <div className="bg-white rounded-xl border p-4 space-y-3 mb-3">
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Lesson title*" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} />
                          <textarea className="w-full border rounded-lg p-2.5 text-sm resize-none h-20" placeholder="Lesson content / notes..." value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} />
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="YouTube video URL (optional)" value={lessonForm.video_url} onChange={e => setLessonForm(p => ({ ...p, video_url: e.target.value }))} />
                          <div className="flex gap-3">
                            <input type="number" className="w-32 border rounded-lg p-2.5 text-sm" placeholder="Duration (min)" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"><input type="checkbox" checked={lessonForm.is_free_preview} onChange={e => setLessonForm(p => ({ ...p, is_free_preview: e.target.checked }))} /><span>Free preview</span></label>
                            <button onClick={() => addLesson(c.id)} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save Lesson</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DAILY MEETING LINKS - For Paid Students */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">🔗 Daily Meeting Links ({c.meeting_links?.length || 0})</h4>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Paid Students Only</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Daily class links for enrolled students who paid. These links are only visible to paid students.</p>

                      {/* Existing Meeting Links */}
                      {c.meeting_links?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {c.meeting_links.map((link: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                  <Video size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-gray-900">{new Date(link.date).toLocaleDateString()}</p>
                                    {link.time && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{link.time}</span>}
                                  </div>
                                  <p className="text-xs text-gray-500">{link.platform} · {link.description || "Daily Class"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a href={link.link} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Join Link</a>
                                <button
                                  onClick={async () => {
                                    if (!confirm("Delete this meeting link?")) return;
                                    try {
                                      await api.request(`/teacher/meeting-links/${link.id}`, { method: "DELETE" });
                                      toast.success("Meeting link deleted!");
                                      fetchAll();
                                    } catch (e: any) { toast.error(e.message); }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Meeting Link Form */}
                      <div className="bg-white rounded-xl border p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Plus size={16} className="text-indigo-600" />
                          <span className="font-semibold text-sm text-gray-800">Add New Meeting Link</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Date *</label>
                            <input type="date" className="w-full border rounded-lg p-2 text-sm" value={meetingForm.date} onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Time</label>
                            <input type="time" className="w-full border rounded-lg p-2 text-sm" value={meetingForm.time} onChange={e => setMeetingForm(p => ({ ...p, time: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Platform *</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={meetingForm.platform} onChange={e => setMeetingForm(p => ({ ...p, platform: e.target.value }))}>
                              {PLATFORMS.map(pl => <option key={pl}>{pl}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Meeting Link *</label>
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="https://meet.google.com/... or https://zoom.us/j/..." value={meetingForm.link} onChange={e => setMeetingForm(p => ({ ...p, link: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="e.g. Speaking Practice Session, Reading Test Discussion" value={meetingForm.description} onChange={e => setMeetingForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <button onClick={async () => {
                          if (!meetingForm.date || !meetingForm.link) { toast.error("Date and link are required"); return; }
                          try {
                            await api.request(`/teacher/courses/${c.id}/meeting-links`, { method: "POST", body: JSON.stringify(meetingForm) });
                            toast.success("Meeting link added!");
                            setMeetingForm({ date: "", time: "", link: "", platform: "Google Meet", description: "" });
                            fetchAll();
                          } catch (e: any) { toast.error(e.message); }
                        }} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">Add Meeting Link</button>
                      </div>
                    </div>

                    {/* SCHEDULE LIVE CLASS */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">📹 Scheduled Live Classes ({c.total_live_classes})</h4>
                        <button onClick={() => setShowLiveForm(!showLiveForm)} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-xl hover:bg-green-200"><Calendar size={12} className="inline mr-1" />Schedule Class</button>
                      </div>

                      {/* Existing Live Classes List */}
                      {c.live_classes?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {c.live_classes.map((lc: any) => (
                            <div key={lc.id} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Calendar size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{lc.title}</p>
                                  <p className="text-xs text-gray-500">
                                    📅 {new Date(lc.scheduled_at).toLocaleString()} · {lc.platform} · {lc.duration_minutes}min
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a href={lc.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Join</a>
                                <button
                                  onClick={async () => {
                                    if (!confirm("Cancel this live class?")) return;
                                    try {
                                      await api.request(`/teacher/live-classes/${lc.id}`, { method: "DELETE" });
                                      toast.success("Live class cancelled!");
                                      fetchAll();
                                    } catch (e: any) { toast.error(e.message); }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                  title="Cancel Class"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {showLiveForm && (
                        <div className="bg-white rounded-xl border p-4 space-y-3 mb-3">
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Class title*" value={liveForm.title} onChange={e => setLiveForm(p => ({ ...p, title: e.target.value }))} />
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Zoom / Google Meet link*" value={liveForm.meet_link} onChange={e => setLiveForm(p => ({ ...p, meet_link: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <select className="border rounded-lg p-2.5 text-sm" value={liveForm.platform} onChange={e => setLiveForm(p => ({ ...p, platform: e.target.value }))}>
                              {PLATFORMS.map(pl => <option key={pl}>{pl}</option>)}
                            </select>
                            <input type="datetime-local" className="border rounded-lg p-2.5 text-sm" value={liveForm.scheduled_at} onChange={e => setLiveForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                          </div>
                          <div className="flex gap-3 items-center">
                            <input type="number" className="w-32 border rounded-lg p-2.5 text-sm" placeholder="Duration (min)" value={liveForm.duration_minutes} onChange={e => setLiveForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                            <input type="number" className="w-32 border rounded-lg p-2.5 text-sm" placeholder="Max students" value={liveForm.max_students} onChange={e => setLiveForm(p => ({ ...p, max_students: +e.target.value }))} />
                            <button onClick={() => scheduleLive(c.id)} className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Schedule</button>
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

                      {/* Existing Quizzes with Schedule */}
                      {c.quizzes?.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {c.quizzes.map((q: any) => (
                            <div key={q.id} className="bg-white rounded-lg border p-3 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{q.title}</p>
                                <p className="text-xs text-gray-500">{q.section} · {q.time_limit_minutes}min · Pass: {q.pass_score}%</p>
                                {q.scheduled_at && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    📅 Scheduled: {new Date(q.scheduled_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this quiz permanently?")) return;
                                  try {
                                    await api.request(`/teacher/quizzes/${q.id}`, { method: "DELETE" });
                                    toast.success("Quiz deleted!");
                                    fetchAll();
                                  } catch (e: any) { toast.error(e.message); }
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                title="Delete Quiz"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showQuizForm && (
                        <div className="bg-white rounded-xl border p-4 space-y-3">
                          <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Quiz title*" value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <select className="border rounded-lg p-2.5 text-sm" value={quizForm.section} onChange={e => setQuizForm(p => ({ ...p, section: e.target.value }))}>
                              {["Reading", "Listening", "Writing", "Speaking", "Vocabulary", "Quantitative", "Verbal", "General"].map(s => <option key={s}>{s}</option>)}
                            </select>
                            <input type="datetime-local" className="border rounded-lg p-2.5 text-sm" value={quizForm.scheduled_at} onChange={e => setQuizForm(p => ({ ...p, scheduled_at: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="number" className="border rounded-lg p-2.5 text-sm" placeholder="Time limit (min)" value={quizForm.time_limit_minutes} onChange={e => setQuizForm(p => ({ ...p, time_limit_minutes: +e.target.value }))} />
                            <input type="number" className="border rounded-lg p-2.5 text-sm" placeholder="Pass score %" value={quizForm.pass_score} onChange={e => setQuizForm(p => ({ ...p, pass_score: +e.target.value }))} />
                          </div>
                          <button onClick={() => createQuiz(c.id)} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Create Quiz</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STUDENTS */}
        {tab === "students" && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-black text-gray-900">Enrolled Students ({students.length})</h3>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No students enrolled yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>{["Student", "Course", "Test", "Progress", "Avg Score", "Attempts", "Enrolled"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{s.student_name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.course_title}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: TEST_COLORS[s.test_type] || "#6366f1" }}>{s.test_type}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.progress}%` }} /></div>
                            <span className="text-xs text-gray-500">{s.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600">{s.avg_score}%</td>
                        <td className="px-4 py-3 text-gray-500">{s.quiz_attempts}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(s.enrolled_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CREATE COURSE */}
        {tab === "create" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border shadow-sm p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6">Create New Course</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Course Title *</label>
                    <input className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. IELTS Band 7+ Complete Course" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Subject *</label>
                    <input className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. English, Math, Science" value={courseForm.subject} onChange={e => setCourseForm(p => ({ ...p, subject: e.target.value }))} /></div>
                </div>
                <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Description</label>
                  <textarea className="w-full border rounded-xl p-3 resize-none h-24 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Is course mein kya sikhaya jaye ga..." value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Test Type *</label>
                    <select className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={courseForm.test_type} onChange={e => setCourseForm(p => ({ ...p, test_type: e.target.value }))}>
                      {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select></div>
                  <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Level</label>
                    <select className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select></div>
                  <div><label className="text-sm font-bold text-gray-700 block mb-1.5">Fee (PKR) *</label>
                    <input type="number" min="0" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 5000" value={courseForm.price} onChange={e => setCourseForm(p => ({ ...p, price: +e.target.value }))} /></div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <strong>Next steps after creating:</strong> Add lessons (text + YouTube), schedule live classes, create practice quizzes.
                </div>
                <button
                  onClick={handleCreateCourse}
                  disabled={!courseForm.title || !courseForm.subject}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-lg transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {courseForm.title && courseForm.subject ? "➕ Create Course →" : "⚠️ Fill Title & Subject First"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

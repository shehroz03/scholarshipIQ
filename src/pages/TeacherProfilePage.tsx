import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import { TeacherReviews } from "../components/teacher/TeacherReviews";
import {
  BookOpen, Users, Star, CheckCircle, Award, Briefcase,
  GraduationCap, Zap, Play, ChevronRight, Shield, ArrowLeft
} from "lucide-react";

const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#1e293b",
  Duolingo: "#65a30d", SAT: "#0891b2"
};
const TEST_BG: Record<string, string> = {
  IELTS: "#eff6ff", TOEFL: "#f5f3ff", GRE: "#ecfdf5",
  GMAT: "#fffbeb", PTE: "#fef2f2", TestDaF: "#f8fafc",
  Duolingo: "#f7fee7", SAT: "#ecfeff"
};

export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const id = Number(teacherId);

  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always fetch fresh — ensures new reviews show up after refresh
    setLoading(true);
    const load = async () => {
      try {
        const t = await api.getTeacherDetail(id);
        setTeacher(t);
      } catch {
        toast.error("Failed to load teacher profile");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return <TeacherSkeleton />;
  if (!teacher) return null;

  const specs = teacher.specializations?.split(",").map((s: string) => s.trim()) || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "sans-serif" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4338ca 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0", position: "relative" }}>
          {/* Back button */}
          <button onClick={() => navigate("/courses")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#c7d2fe", fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "9px 18px", cursor: "pointer", marginBottom: 32, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <ArrowLeft size={15} /> Back to Courses
          </button>

          {/* Profile row */}
          <div style={{ display: "flex", gap: 28, alignItems: "flex-end", paddingBottom: 40 }}>
            {/* Avatar */}
            <div style={{ width: 96, height: 96, borderRadius: 24, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "3px solid rgba(255,255,255,0.25)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 36, fontWeight: 900, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              {teacher.profile_picture_url
                ? <img src={`http://localhost:8000${teacher.profile_picture_url}`} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : teacher.name?.charAt(0).toUpperCase() || "T"}
            </div>

            <div style={{ flex: 1 }}>
              {/* Name + verified */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{teacher.name}</h1>
                {teacher.is_verified && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 100, padding: "4px 12px" }}>
                    <Shield size={13} color="#34d399" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#34d399" }}>Verified</span>
                  </div>
                )}
              </div>

              {/* Specializations */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {specs.map((spec: string, i: number) => (
                  <span key={i} style={{ background: `${TEST_COLORS[spec] || "#6366f1"}25`, border: `1px solid ${TEST_COLORS[spec] || "#6366f1"}50`, color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 100 }}>
                    {spec}
                  </span>
                ))}
              </div>

              {/* Quick stats */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {[
                  { icon: <Briefcase size={14} />, val: `${teacher.experience_years || 1}+ yrs`, label: "Experience" },
                  { icon: <BookOpen size={14} />, val: teacher.total_courses || 0, label: "Courses" },
                  { icon: <Users size={14} />, val: teacher.total_students || 0, label: "Students" },
                  ...(teacher.average_rating > 0 ? [{ icon: <Star size={14} />, val: teacher.average_rating?.toFixed(1), label: `${teacher.total_reviews || 0} reviews` }] : []),
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#e0e7ff", fontSize: 13 }}>
                    <span style={{ color: "#a78bfa" }}>{s.icon}</span>
                    <span style={{ fontWeight: 800, color: "#fff" }}>{s.val}</span>
                    <span style={{ color: "#a5b4fc" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 44" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block", marginBottom: -2 }}>
          <path d="M0,22 C360,44 1080,0 1440,22 L1440,44 L0,44 Z" fill="#f1f5f9" />
        </svg>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 72px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* About */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "28px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={20} color="#7c3aed" /> About {teacher.name}
          </h2>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.75, margin: 0 }}>
            {teacher.bio || `${teacher.name} is an experienced test prep instructor specializing in ${teacher.specializations || "various tests"}. With ${teacher.experience_years || 1}+ years of teaching, they have helped ${teacher.total_students || "many"} students achieve top scores.`}
          </p>

          {/* Qualifications */}
          {(teacher.qualification || teacher.degree || teacher.institution) && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#64748b", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={15} color="#f59e0b" /> Qualifications
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {teacher.qualification && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#92400e", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Certification</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#78350f", margin: 0 }}>{teacher.qualification}</p>
                  </div>
                )}
                {teacher.degree && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Degree</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#1e3a8a", margin: 0 }}>{teacher.degree}</p>
                  </div>
                )}
                {teacher.institution && (
                  <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#6d28d9", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Institution</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#4c1d95", margin: 0 }}>{teacher.institution}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Courses */}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={20} color="#7c3aed" /> Available Courses
            <span style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: 13, fontWeight: 800, padding: "2px 10px", borderRadius: 100 }}>{teacher.courses?.length || 0}</span>
          </h2>

          {!teacher.courses?.length ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", textAlign: "center" }}>
              <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>No courses available yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
              {teacher.courses.map((course: any) => {
                const color = TEST_COLORS[course.test_type] || "#6366f1";
                const bg = TEST_BG[course.test_type] || "#eef2ff";
                return (
                  <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)}
                    style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", transition: "all 0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.1)`; e.currentTarget.style.borderColor = color + "60"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <div style={{ height: 5, background: `linear-gradient(90deg,${color},${color}88)` }} />
                    <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ background: bg, color, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 100 }}>{course.test_type}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: course.is_free ? "#16a34a" : "#374151", background: course.is_free ? "#f0fdf4" : "#f8fafc", border: course.is_free ? "1px solid #bbf7d0" : "1px solid #e5e7eb", padding: "3px 10px", borderRadius: 100 }}>
                          {course.is_free ? "FREE" : `PKR ${course.price?.toLocaleString()}`}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.3 }}>{course.title}</h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {course.description || `${course.test_type} preparation course`}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={12} />{course.total_lessons} lessons</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Zap size={12} />{course.total_quizzes} quizzes</span>
                        {course.upcoming_live_classes > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "2px 8px", borderRadius: 100 }}>
                            <Play size={10} fill="currentColor" />{course.upcoming_live_classes} live
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                        {course.enrolled
                          ? <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#16a34a", fontSize: 12, fontWeight: 700 }}><CheckCircle size={13} /> Enrolled</span>
                          : <span style={{ fontSize: 12, color: "#94a3b8" }}>Click to view details</span>}
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#7c3aed", fontSize: 12, fontWeight: 700 }}>View <ChevronRight size={14} /></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STUDENT REVIEWS (always at bottom) ─────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <Star size={20} color="#f59e0b" fill="#f59e0b" />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Student Reviews</h2>
            {teacher.average_rating > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", padding: "2px 10px", borderRadius: 100 }}>
                ★ {teacher.average_rating?.toFixed(1)} · {teacher.total_reviews || 0} reviews
              </span>
            )}
          </div>
          <div style={{ padding: "0 0 0" }}>
            <TeacherReviews
              teacherId={teacher.teacher_id ?? id}
              isEnrolled={true}
              canReview={
                localStorage.getItem("userRole") === "student" ||
                (localStorage.getItem("userRole") !== "teacher" && !!localStorage.getItem("token"))
              }
            />
          </div>
        </div>

      </div>
    </div>
  );
}

/* Skeleton loader — shows structure immediately while data loads */
function TeacherSkeleton() {
  const bar = (w: string, h = 14, r = 8) => (
    <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
  );
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", padding: "28px 24px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ width: 130, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", marginBottom: 32 }} />
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ width: 96, height: 96, borderRadius: 24, background: "rgba(255,255,255,0.15)" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ width: "45%", height: 28, borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
              <div style={{ width: "30%", height: 18, borderRadius: 8, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ width: "60%", height: 14, borderRadius: 8, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "-20px auto 0", padding: "0 24px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            {bar("40%", 18)} {bar("90%", 13)} {bar("75%", 13)} {bar("55%", 13)}
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

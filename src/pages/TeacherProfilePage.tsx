import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { toast } from "sonner";
import { BookOpen, Users, Star, CheckCircle, ArrowLeft, Award, Briefcase, GraduationCap, Zap, Play, ChevronRight } from "lucide-react";

const TEST_COLORS: Record<string, string> = {
  IELTS: "#2563eb", TOEFL: "#7c3aed", GRE: "#059669",
  GMAT: "#d97706", PTE: "#dc2626", TestDaF: "#1e293b",
  Duolingo: "#65a30d", SAT: "#0891b2"
};

export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await api.getTeacherDetail(Number(teacherId));
        setTeacher(t);
      } catch (e: any) {
        toast.error("Failed to load teacher profile");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-lg">Loading teacher profile...</div>
      </div>
    );
  }

  if (!teacher) return null;

  const specializations = teacher.specializations?.split(",").map((s: string) => s.trim()) || [];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Header */}
      <div
        style={{ background: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #5b21b6 100%)" }}
        className="text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", transform: "translate(25%, -25%)" }} />

        <div className="max-w-6xl mx-auto px-6 py-8 relative">
          <button
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-1.5 text-violet-300 hover:text-white text-sm font-medium mb-6 transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span> Back to Courses
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white/20 shrink-0 overflow-hidden">
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

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black">{teacher.name}</h1>
                {teacher.is_verified && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm font-bold text-green-300">Verified</span>
                  </div>
                )}
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-2 mb-4">
                {specializations.map((spec: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${TEST_COLORS[spec] || "#6366f1"}30`,
                      color: "#ffffff",
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Briefcase size={16} className="text-violet-300" />
                  <span className="font-bold">{teacher.experience_years || 1}+</span> years exp.
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen size={16} className="text-violet-300" />
                  <span className="font-bold">{teacher.total_courses || 0}</span> courses
                </span>
                <span className="flex items-center gap-2">
                  <Users size={16} className="text-violet-300" />
                  <span className="font-bold">{teacher.total_students || 0}</span> students
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" className="w-full block" style={{ marginBottom: "-2px" }}>
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f5f6fa" />
        </svg>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-violet-500" />
            About {teacher.name}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {teacher.bio || `${teacher.name} is an experienced test prep instructor with expertise in ${teacher.specializations || "various tests"}. With ${teacher.experience_years || 1}+ years of teaching experience, ${teacher.name} has helped ${teacher.total_students || "many"} students achieve their dream scores.`}
          </p>

          {/* Qualifications */}
          {(teacher.qualification || teacher.degree || teacher.institution) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Qualifications
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {teacher.qualification && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Certification</p>
                    <p className="text-sm font-bold text-gray-800">{teacher.qualification}</p>
                  </div>
                )}
                {teacher.degree && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Degree</p>
                    <p className="text-sm font-bold text-gray-800">{teacher.degree}</p>
                  </div>
                )}
                {teacher.institution && (
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Institution</p>
                    <p className="text-sm font-bold text-gray-800">{teacher.institution}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-violet-500" />
            Available Courses ({teacher.courses?.length || 0})
          </h2>

          {teacher.courses?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <BookOpen className="text-gray-300 mx-auto mb-3" size={40} />
              <p className="text-gray-500">No courses available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {teacher.courses.map((course: any) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  {/* Color bar */}
                  <div className="h-1.5" style={{ backgroundColor: TEST_COLORS[course.test_type] || "#6366f1" }} />

                  <div className="p-5">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                        style={{ backgroundColor: TEST_COLORS[course.test_type] || "#6366f1" }}
                      >
                        {course.test_type}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${course.is_free ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {course.is_free ? "FREE" : `PKR ${course.price?.toLocaleString()}`}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-violet-700 transition-colors">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {course.description || `${course.test_type} preparation course`}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><BookOpen size={11} />{course.total_lessons} lessons</span>
                      <span className="flex items-center gap-1"><Zap size={11} />{course.total_quizzes} quizzes</span>
                      {course.upcoming_live_classes > 0 && (
                        <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                          <Play size={10} fill="currentColor" />{course.upcoming_live_classes} live
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {course.enrolled ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          <CheckCircle size={12} /> Enrolled
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Click to view details</span>
                      )}
                      <span className="flex items-center gap-1 text-violet-600 text-xs font-bold group-hover:gap-2 transition-all">
                        View <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

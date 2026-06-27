import { useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, Navigate, useParams } from "react-router-dom";

// Eager — first-paint public pages, route guard, and global UI
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { TeacherLoginPage } from "./components/TeacherLoginPage";
import { SignupPage } from "./components/SignupPage";
import { AuthRequiredPage } from "./components/AuthRequiredPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";

import { CurrencyProvider } from "./context/CurrencyContext";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";

// Lazy — heavy / authenticated pages are code-split so each one is downloaded
// only when its route is first visited. This keeps the initial bundle small
// and makes the whole app load far faster.
const DashboardPage = lazy(() => import("./components/DashboardPage").then(m => ({ default: m.DashboardPage })));
const SearchPage = lazy(() => import("./components/SearchPage").then(m => ({ default: m.SearchPage })));
const DetailPage = lazy(() => import("./components/DetailPage").then(m => ({ default: m.DetailPage })));
const SavedPage = lazy(() => import("./components/SavedPage").then(m => ({ default: m.SavedPage })));
const MyApplicationsPage = lazy(() => import("./components/MyApplicationsPage").then(m => ({ default: m.MyApplicationsPage })));
const TravelGuidePage = lazy(() => import("./components/TravelGuidePage").then(m => ({ default: m.TravelGuidePage })));
const SettingsPage = lazy(() => import("./components/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ConsultantPage = lazy(() => import("./components/ConsultantPage").then(m => ({ default: m.ConsultantPage })));
const Chatbot = lazy(() => import("./components/Chatbot").then(m => ({ default: m.Chatbot })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const UniversityMatcher = lazy(() => import("./pages/UniversityMatcher").then(m => ({ default: m.UniversityMatcher })));
const DocumentChecklistPage = lazy(() => import("./components/DocumentChecklistPage").then(m => ({ default: m.DocumentChecklistPage })));
const ApplicationTimeline = lazy(() => import("./pages/ApplicationTimeline").then(m => ({ default: m.ApplicationTimeline })));
const VisaGuidanceLandingPage = lazy(() => import("./components/VisaGuidance/VisaGuidanceLandingPage"));
const TeacherDashboard = lazy(() => import("./components/teacher/TeacherDashboard"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const TeacherProfilePage = lazy(() => import("./pages/TeacherProfilePage"));
const VisaProfileFormPage = lazy(() => import("./components/VisaGuidance/VisaProfileFormPage"));
const VisaChecklistResultPage = lazy(() => import("./components/VisaGuidance/VisaChecklistResultPage"));

// Lightweight fallback shown only while a route's chunk is being fetched.
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#060818",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Wrapper for DetailPage to extract ID from URL without modifying the component itself
const DetailPageWrapper = ({ onNavigate }: { onNavigate: any }) => {
  const { id } = useParams();
  return <DetailPage onNavigate={onNavigate} scholarshipId={parseInt(id || "1")} />;
};

export default function App() {
  const navigate = useNavigate();
  const isLoggedIn = () => !!localStorage.getItem("token");

  const [searchParams, setSearchParams] = useState<any>({});

  const handleNavigate = (page: string, params?: any) => {
    if ((page === "login" || page === "signup") && isLoggedIn()) {
      const role = localStorage.getItem("userRole");
      navigate(role === "teacher" ? "/teacher" : "/dashboard");
      return;
    }

    if (page === 'teacher-dashboard' || page === 'my-classes') {
      navigate('/teacher');
      return;
    }
    if (page === 'courses' || page === 'test-prep') {
      navigate('/courses');
      return;
    }

    if (page === 'teacher-login') {
      navigate('/teacher-login');
      return;
    }

    if (page === 'detail' && params?.id) {
      navigate(`/detail/${params.id}`);
      return;
    }

    if (page === 'search' && params) {
      setSearchParams(params);
      navigate("/search");
      return;
    }

    const route = page === "landing" ? "/" : `/${page}`;
    navigate(route);
    window.scrollTo(0, 0);
  };

  return (
    <ThemeProvider>
      <UserProvider>
        <CurrencyProvider>
        <div className="animate-in fade-in duration-500">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />
          <Route path="/login" element={isLoggedIn() ? <Navigate to={localStorage.getItem("userRole") === "teacher" ? "/teacher" : "/dashboard"} /> : <LoginPage onNavigate={handleNavigate} />} />
          <Route path="/teacher-login" element={<TeacherLoginPage onNavigate={handleNavigate} />} />
          <Route path="/signup" element={isLoggedIn() ? <Navigate to={localStorage.getItem("userRole") === "teacher" ? "/teacher" : "/dashboard"} /> : <SignupPage onNavigate={handleNavigate} />} />
          <Route path="/auth-required" element={<AuthRequiredPage onNavigate={handleNavigate} />} />
          <Route path="/admin" element={<AdminDashboard onNavigate={handleNavigate} />} />
          <Route path="/pricing" element={<Navigate to={localStorage.getItem("userRole") === "teacher" ? "/teacher" : "/dashboard"} />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/search" element={<SearchPage onNavigate={handleNavigate} initialFilters={searchParams} />} />
            <Route path="/detail/:id" element={<DetailPageWrapper onNavigate={handleNavigate} />} />
            <Route path="/saved" element={<SavedPage onNavigate={handleNavigate} />} />
            <Route path="/applications" element={<MyApplicationsPage onNavigate={handleNavigate} />} />
            <Route path="/settings" element={<SettingsPage onNavigate={handleNavigate} />} />
            <Route path="/matcher" element={<UniversityMatcher onNavigate={handleNavigate} />} />
            <Route path="/travel-guide" element={<TravelGuidePage onNavigate={handleNavigate} />} />
            <Route path="/consultant" element={<ConsultantPage />} />



            <Route path="/checklist" element={<DocumentChecklistPage onNavigate={handleNavigate} />} />
            <Route path="/timeline" element={<ApplicationTimeline onNavigate={handleNavigate} />} />
            
            {/* Teacher & Courses Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/teachers/:teacherId" element={<TeacherProfilePage />} />

            {/* Visa Guidance AI Routes */}
            <Route path="/visa" element={<VisaGuidanceLandingPage />} />
            <Route path="/visa/plan/:country" element={<VisaProfileFormPage />} />
            <Route path="/visa/checklist/:id" element={<VisaChecklistResultPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
      </div>
      {isLoggedIn() && <Suspense fallback={null}><Chatbot /></Suspense>}
      <Toaster position="top-right" richColors />
      <HotToaster position="top-right" toastOptions={{ duration: 3000 }} />
      </CurrencyProvider>
    </UserProvider>
    </ThemeProvider>
  );
}
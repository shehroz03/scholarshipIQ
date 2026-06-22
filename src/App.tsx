import { useState } from "react";
import { Routes, Route, useNavigate, Navigate, useParams } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { TeacherLoginPage } from "./components/TeacherLoginPage";
import { SignupPage } from "./components/SignupPage";
import { AuthRequiredPage } from "./components/AuthRequiredPage";
import { DashboardPage } from "./components/DashboardPage";
import { SearchPage } from "./components/SearchPage";
import { DetailPage } from "./components/DetailPage";
import { SavedPage } from "./components/SavedPage";
import { MyApplicationsPage } from "./components/MyApplicationsPage";
import { TravelGuidePage } from "./components/TravelGuidePage";
import { SettingsPage } from "./components/SettingsPage";
import { ConsultantPage } from "./components/ConsultantPage";
import { PricingPage } from "./components/PricingPage";

import { Chatbot } from "./components/Chatbot";
import AdminDashboard from "./components/AdminDashboard";
import { UniversityMatcher } from "./pages/UniversityMatcher";
import { Toaster } from "./components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { ProtectedRoute } from "./components/ProtectedRoute";


import { DocumentChecklistPage } from "./components/DocumentChecklistPage";
import { ApplicationTimeline } from "./pages/ApplicationTimeline";
import VisaGuidanceLandingPage from './components/VisaGuidance/VisaGuidanceLandingPage';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import VisaProfileFormPage from "./components/VisaGuidance/VisaProfileFormPage";
import VisaChecklistResultPage from "./components/VisaGuidance/VisaChecklistResultPage";

import { CurrencyProvider } from "./context/CurrencyContext";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";

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
      </div>
      {isLoggedIn() && <Chatbot />}
      <Toaster position="top-right" richColors />
      <HotToaster position="top-right" toastOptions={{ duration: 3000 }} />
      </CurrencyProvider>
    </UserProvider>
    </ThemeProvider>
  );
}
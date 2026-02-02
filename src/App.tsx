import { useState, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { AuthRequiredPage } from "./components/AuthRequiredPage";
import { DashboardPage } from "./components/DashboardPage";
import { SearchPage } from "./components/SearchPage";
import { DetailPage } from "./components/DetailPage";
import { SavedPage } from "./components/SavedPage";
import { MyApplicationsPage } from "./components/MyApplicationsPage";
import { SettingsPage } from "./components/SettingsPage";
import { Chatbot } from "./components/Chatbot";
import AdminDashboard from "./components/AdminDashboard";
import { UniversityMatcher } from "./pages/UniversityMatcher";
import { Toaster } from "./components/ui/sonner";

import { CurrencyProvider } from "./context/CurrencyContext";

export default function App() {
  const isLoggedIn = () => !!localStorage.getItem("token");

  const publicPages = ["landing", "login", "signup", "admin", "auth-required"];
  const protectedPages = ["dashboard", "saved", "applications", "settings", "detail", "matcher", "search"];

  const getInitialPage = () => {
    const hash = window.location.hash.replace("#", "").split("?")[0];
    if (hash) {
      if (protectedPages.includes(hash) && !isLoggedIn()) {
        return "auth-required";
      }
      if (!publicPages.includes(hash) && !protectedPages.includes(hash)) {
        return hash || "landing";
      }
      return hash;
    }
    return localStorage.getItem("currentPage") || "landing";
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<number | null>(() => {
    const savedId = localStorage.getItem("selectedScholarshipId");
    return savedId ? parseInt(savedId) : null;
  });

  const [searchParams, setSearchParams] = useState<any>({});

  // Sync state with URL hash and localStorage
  useEffect(() => {
    window.location.hash = currentPage;
    localStorage.setItem("currentPage", currentPage);
    if (selectedScholarshipId) {
      localStorage.setItem("selectedScholarshipId", selectedScholarshipId.toString());
    } else {
      localStorage.removeItem("selectedScholarshipId");
    }
  }, [currentPage, selectedScholarshipId]);

  // Handle back/forward browser buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").split("?")[0];
      if (hash && hash !== currentPage) {
        if (protectedPages.includes(hash) && !isLoggedIn()) {
          setCurrentPage("auth-required");
        } else {
          setCurrentPage(hash);
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentPage]);

  const handleNavigate = (page: string, params?: any) => {
    if ((page === "login" || page === "signup") && isLoggedIn()) {
      setCurrentPage("dashboard");
      return;
    }

    if (protectedPages.includes(page) && !isLoggedIn()) {
      setCurrentPage("auth-required");
      return;
    }

    if (page === 'detail' && params?.id) {
      setSelectedScholarshipId(params.id);
    }

    // Store params for search page
    if (page === 'search') {
      setSearchParams(params || {});
    }

    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on navigation
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "signup":
        return <SignupPage onNavigate={handleNavigate} />;
      case "auth-required":
        return <AuthRequiredPage onNavigate={handleNavigate} />;
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "search":
        return <SearchPage onNavigate={handleNavigate} initialFilters={searchParams} />;
      case "detail":
        return <DetailPage onNavigate={handleNavigate} scholarshipId={selectedScholarshipId || 1} />;
      case "saved":
        return <SavedPage onNavigate={handleNavigate} />;
      case "applications":
        return <MyApplicationsPage onNavigate={handleNavigate} />;
      case "settings":
        return <SettingsPage onNavigate={handleNavigate} />;
      case "admin":
        return <AdminDashboard onNavigate={handleNavigate} />;
      case "matcher":
        return <UniversityMatcher onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showChatbot = ["dashboard", "search", "detail", "saved", "settings", "matcher"].includes(currentPage) && isLoggedIn();

  return (
    <CurrencyProvider>
      <div className="animate-in fade-in duration-500">
        {renderPage()}
      </div>
      {showChatbot && <Chatbot />}
      <Toaster position="top-right" richColors />
    </CurrencyProvider>
  );
}
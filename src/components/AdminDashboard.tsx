import { useState, useEffect } from "react";
import { AdminLogin } from "./admin/AdminLogin";
import { DashboardHome } from "./admin/DashboardHome";
import { UserManagement } from "./admin/UserManagement";
import { ScholarshipManagement } from "./admin/ScholarshipManagement";
import { FraudManager } from "./admin/FraudManager";
import { DataPipeline } from "./admin/DataPipeline";
import { TeacherApprovals } from "./admin/TeacherApprovals";
import { AutoVerifyDashboard } from "./admin/AutoVerifyDashboard";
import { StagedReviewQueue } from "./admin/StagedReviewQueue";
import { AdminAIChat } from "./admin/AdminAIChat";
import { BotStats } from "./admin/BotStats";
import { PipelineReport } from "./admin/PipelineReport";
import { AdminReviewManagement } from "./admin/AdminReviewManagement";
import { LayoutDashboard, Users, BookOpen, ShieldAlert, ShieldCheck, Sparkles, FileBarChart2, LogOut, RefreshCw, GraduationCap, AlertTriangle, Bot, Star } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";
import { api } from "../api";

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { isDark: _isDark } = useTheme();
  const isDark = false; // Admin panel uses light theme
  const theme = lightTheme;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount - just check localStorage
  // API calls will validate token when made and redirect to login if 401
  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminFlag = localStorage.getItem("admin_logged_in");
    
    if (token && adminFlag === "true") {
      setIsLoggedIn(true);
    } else {
      // Clear any stale data
      if (!token || adminFlag !== "true") {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_logged_in");
      }
      setIsLoggedIn(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      localStorage.removeItem("token");
      localStorage.removeItem("admin_logged_in");
    };
    window.addEventListener("admin_session_expired", handleUnauthorized);
    return () => window.removeEventListener("admin_session_expired", handleUnauthorized);
  }, []);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("admin_active_tab") || "dashboard");
  const [isReady, setIsReady] = useState(false);

  // Delay rendering content to ensure auth state is settled
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isLoggedIn, isLoading]);

  // Show loading while validating session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => {
      localStorage.setItem("admin_logged_in", "true");
      setIsLoggedIn(true);
    }} />;
  }

  // Show loading while preparing dashboard
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardHome />;
      case "users": return <UserManagement />;
      case "scholarships": return <ScholarshipManagement />;
      case "fraud": return <FraudManager />;
      case "pipeline": return <DataPipeline />;
      case "autoverify": return <AutoVerifyDashboard />;
      case "stagedreview": return <StagedReviewQueue />;
      case "aichat": return <AdminAIChat />;
      case "reports": return <PipelineReport />;
      case "botstats": return <BotStats />;
      case "teachers": return <TeacherApprovals />;
      case "teacher-reviews": return <AdminReviewManagement />;
      default: return <DashboardHome />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "scholarships", label: "Scholarships", icon: BookOpen },
    { id: "pipeline", label: "Data Pipeline", icon: RefreshCw },
    { id: "fraud", label: "Fraud Security", icon: ShieldAlert },
    { id: "teachers", label: "Teacher Approvals", icon: GraduationCap },
    { id: "teacher-reviews", label: "Teacher Reviews", icon: Star },
    { id: "autoverify", label: "Auto-Verify & Update", icon: ShieldCheck },
    { id: "stagedreview", label: "Review Queue", icon: AlertTriangle },
    { id: "reports", label: "Pipeline Reports", icon: FileBarChart2 },
    { id: "botstats", label: "Bot Stats", icon: Bot },
    { id: "aichat", label: "Admin AI", icon: Sparkles },
  ];

  return (
    <div className="flex h-screen font-sans" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
        <div className="p-6 border-b" style={{ borderColor: theme.border }}>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            ScholarIQ Admin
          </h1>
          <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>System Control Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  localStorage.setItem("admin_active_tab", item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "hover:bg-gray-100"
                  }`}
                style={{ color: activeTab === item.id ? 'white' : theme.textSecondary }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: theme.border }}>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.removeItem("token");
              localStorage.removeItem("admin_logged_in");
              localStorage.removeItem("admin_active_tab");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: theme.bg }}>
        <header className="h-16 border-b sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm" style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}>
          <h2 className="text-lg font-semibold capitalize" style={{ color: theme.text }}>
            {activeTab.replace("-", " ")} Overview
          </h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-100">
              A
            </div>
          </div>
        </header>
        <div className={activeTab === "aichat" ? "p-4 h-[calc(100vh-64px)]" : "p-8"}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

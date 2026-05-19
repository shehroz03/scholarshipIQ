import { useState, useEffect } from "react";
import { AdminLogin } from "./admin/AdminLogin";
import { DashboardHome } from "./admin/DashboardHome";
import { UserManagement } from "./admin/UserManagement";
import { ScholarshipManagement } from "./admin/ScholarshipManagement";
import { ApiHealth } from "./admin/ApiHealth";
import { AdminAnalytics } from "./admin/Analytics";
import { DatabaseViewer } from "./admin/DatabaseViewer";
import { FraudManager } from "./admin/FraudManager";
import { DataPipeline } from "./admin/DataPipeline";
import { AutoUpdater } from "./admin/AutoUpdater";
import { TeacherApprovals } from "./admin/TeacherApprovals";
import { LayoutDashboard, Users, BookOpen, Activity, BarChart2, Database, ShieldAlert, LogOut, Settings, RefreshCw, Zap, GraduationCap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub === "admin";
    } catch (e) {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("admin_active_tab") || "dashboard");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token && isLoggedIn) {
        setIsLoggedIn(false);
        return;
      }
      if (token && isLoggedIn) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub !== "admin") setIsLoggedIn(false);
        } catch (e) {
          setIsLoggedIn(false);
        }
      }
    };
    const interval = setInterval(checkAuth, 1000);
    window.addEventListener('storage', checkAuth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAuth);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardHome />;
      case "users": return <UserManagement />;
      case "scholarships": return <ScholarshipManagement />;
      case "health": return <ApiHealth />;
      case "analytics": return <AdminAnalytics />;
      case "database": return <DatabaseViewer />;
      case "fraud": return <FraudManager />;
      case "pipeline": return <DataPipeline />;
      case "autoupdate": return <AutoUpdater />;
      case "teachers": return <TeacherApprovals />;
      default: return <DashboardHome />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "scholarships", label: "Scholarships", icon: BookOpen },
    { id: "health", label: "API Status", icon: Activity },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "database", label: "Database", icon: Database },
    { id: "pipeline", label: "Data Pipeline", icon: RefreshCw },
    { id: "fraud", label: "Fraud Security", icon: ShieldAlert },
    { id: "teachers", label: "Teacher Approvals", icon: GraduationCap },
    { id: "autoupdate", label: "Auto-Update AI", icon: Zap },
  ];

  return (
    <div className="flex h-screen font-sans" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col" style={{ backgroundColor: isDark ? theme.bgSecondary : '#0f172a', borderColor: theme.border }}>
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
                  : "hover:bg-white/5"
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#bbf7d0' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-100">
              A
            </div>
          </div>
        </header>
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

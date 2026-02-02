import { useState } from "react";
import { AdminLogin } from "./admin/AdminLogin";
import { DashboardHome } from "./admin/DashboardHome";
import { UserManagement } from "./admin/UserManagement";
import { ScholarshipManagement } from "./admin/ScholarshipManagement";
import { ApiHealth } from "./admin/ApiHealth";
import { AdminAnalytics } from "./admin/Analytics";
import { DatabaseViewer } from "./admin/DatabaseViewer";
import { FraudManager } from "./admin/FraudManager";
import { LayoutDashboard, Users, BookOpen, Activity, BarChart2, Database, ShieldAlert, LogOut, Settings } from "lucide-react";

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("admin_active_tab") || "dashboard");

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
    { id: "fraud", label: "Fraud Security", icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            ScholarIQ Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1">System Control Panel</p>
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
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
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
      <main className="flex-1 overflow-auto bg-gray-50">
        <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {activeTab.replace("-", " ")} Overview
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">System Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-gray-100 text-white">
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

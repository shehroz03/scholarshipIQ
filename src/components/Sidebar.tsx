import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  Globe, 
  CheckSquare, 
  Settings, 
  GraduationCap, 
  LogOut, 
  Crown,
  Clock,
  Zap,
  School
} from 'lucide-react';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage }) => {
  const { status: userStatus } = useUser();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', page: 'dashboard' },
    { icon: Search, label: 'Find Scholarships', page: 'search' },
    { icon: MapPin, label: 'University Matcher', page: 'matcher' },
    { icon: BookOpen, label: 'Application Tracker', page: 'applications' },
    { icon: Clock, label: 'Application Timeline', page: 'timeline' },
    { icon: Sparkles, label: 'AI Consultant', page: 'consultant' },
    { icon: Globe, label: 'Visa Guidance', page: 'visa' },
    { icon: Zap, label: 'Test Prep Courses', page: 'courses' },
    { icon: CheckSquare, label: 'Document Checklist', page: 'checklist' },
    { icon: Settings, label: 'Profile Settings', page: 'settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    onNavigate('landing');
  };

  return (
    <aside style={{
      width: '260px',
      height: '100vh', // Changed from minHeight to height to force viewport constraint
      background: 'linear-gradient(180deg, #1e3a8a 0%, #1e1b4b 50%, #0f172a 100%)',
      borderRight: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'fixed',
      left: 0,
      top: 0,
      boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      zIndex: 100,
      overflow: 'hidden' // Prevent the sidebar itself from scrolling
    }}>
      {/* Logo Section */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        flexShrink: 0 // Prevent logo from shrinking
      }} onClick={() => onNavigate('landing')}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
        }}>
          <GraduationCap color="white" size={24} />
        </div>
        <span style={{
          color: 'white',
          fontWeight: '700',
          fontSize: '18px',
          letterSpacing: '-0.5px'
        }}>
          ScholarIQ
        </span>
      </div>

      {/* Main Menu Label */}
      <div style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        padding: '24px 20px 8px',
        flexShrink: 0 // Prevent label from shrinking
      }}>
        Main Menu
      </div>

      {/* Navigation items - Scrollable but hidden scrollbar */}
      <style>{`
        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }
        .sidebar-nav {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      
      <nav className="sidebar-nav" style={{ 
        flex: 1, 
        padding: '0 0 20px 0',
        overflowY: 'auto' // Let flex: 1 handle the height constraint
      }}>
        {menuItems.map((item) => {
          const isActive = currentPage === item.page;
          const isHovered = hoveredItem === item.page;
          const isApplicationTracker = item.page === 'applications';

          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              onMouseEnter={() => setHoveredItem(item.page)}
              onMouseLeave={() => setHoveredItem(null)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                margin: '4px 12px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isActive || isHovered ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: isActive ? '700' : '500',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.2))' 
                  : isHovered 
                    ? 'rgba(255,255,255,0.08)' 
                    : 'transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                width: 'calc(100% - 24px)',
                textAlign: 'left',
                boxShadow: isActive ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                background: isActive 
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                  : 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 4px 10px rgba(37, 99, 235, 0.4)' : 'none',
                flexShrink: 0
              }}>
                <item.icon size={16} color={isActive ? 'white' : (isHovered ? 'white' : 'rgba(255,255,255,0.6)')} />
              </div>
              <span style={{ flex: 1 }}>{item.label}</span>
              
              {isApplicationTracker && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid #1e3a8a',
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  boxShadow: '0 0 10px #ef4444'
                }} />
              )}

              {isActive && (
                <div style={{
                  width: '6px',
                  height: '20px',
                  background: '#3b82f6',
                  borderRadius: '10px',
                  position: 'absolute',
                  right: '-12px',
                  boxShadow: '0 0 12px #3b82f6'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{
        marginTop: 'auto',
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '14px',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(99,102,241,0.3)'
          }}>
            {userStatus?.full_name?.charAt(0) || "U"}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {userStatus?.full_name || "Scholar User"}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              fontWeight: '500',
              marginTop: '2px'
            }}>
              Scholar Account
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={16} /> 
          <span>Secure Logout</span>
        </button>
      </div>
    </aside>
  );
};

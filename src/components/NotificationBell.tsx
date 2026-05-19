import { useState, useEffect, useRef } from "react";
import { Bell, Clock, ChevronRight, Sparkles } from "lucide-react";
import { api } from "../api";
import { Button } from "./ui/button";
import { useTheme } from "../context/ThemeContext";

export function NotificationBell({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const { isDark } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifs = async () => {
        try {
            const data = await api.notifications.list();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifs();
        // Auto-fetch every 2 minutes
        const interval = setInterval(fetchNotifs, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleNotificationClick = async (notif: any) => {
        if (!notif.is_read) {
            try {
                await api.notifications.markRead(notif.id);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }
        setShowDropdown(false);
        if (notif.action_url) {
            // Handle internal navigation if needed
            window.location.href = notif.action_url;
        } else if (notif.scholarship_id) {
            onNavigate('detail', { id: notif.scholarship_id });
        }
    };

    const handleTestAlert = async () => {
        try {
            await api.notifications.testAlert();
            fetchNotifs();
        } catch (err) {
            console.error("Test alert failed", err);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-3 rounded-2xl transition-all duration-300 ${showDropdown ? isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600' : isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'}`}
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 && !showDropdown ? "animate-[swing_2s_ease-in-out_infinite]" : ""}`} />

                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div
                    className="absolute right-0 mt-4 w-96 rounded-[2.5rem] border z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
                    style={{
                        background: isDark ? '#1e293b' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                        boxShadow: isDark ? '0 20px 50px -15px rgba(0,0,0,0.5)' : '0 20px 50px -15px rgba(0,0,0,0.15)'
                    }}
                >
                    <div
                        className="p-6 border-b flex justify-between items-center"
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.5)' }}
                    >
                        <div>
                            <h3 className="font-black tracking-tight" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>Notification Center</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">ScholarIQ Intelligence</p>
                        </div>
                        <button
                            onClick={handleTestAlert}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-indigo-500"
                            style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                        >
                            <Sparkles className="w-3 h-3" /> Test Alert
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                                    <Clock className="w-8 h-8" style={{ color: isDark ? '#334155' : '#e2e8f0' }} />
                                </div>
                                <p className="font-bold text-sm uppercase tracking-widest" style={{ color: isDark ? '#475569' : '#94a3b8' }}>No alerts yet ✨</p>
                            </div>
                        ) : (
                            <div style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-6 cursor-pointer flex gap-4 items-start transition-all group border-b"
                                        style={{
                                            backgroundColor: !notif.is_read
                                                ? isDark ? 'rgba(99,102,241,0.08)' : 'rgba(238,242,255,0.5)'
                                                : 'transparent',
                                            borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = !notif.is_read ? (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(238,242,255,0.5)') : 'transparent'; }}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: !notif.is_read ? '#4f46e5' : isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', boxShadow: !notif.is_read ? '0 4px 12px rgba(99,102,241,0.35)' : 'none' }}>
                                            <Clock className="w-6 h-6" style={{ color: !notif.is_read ? '#fff' : isDark ? '#64748b' : '#94a3b8' }} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black mb-0.5" style={{ color: !notif.is_read ? (isDark ? '#a5b4fc' : '#3730a3') : (isDark ? '#e2e8f0' : '#475569') }}>
                                                {notif.title || "Notification"}
                                            </h4>
                                            <p className="text-xs font-semibold leading-relaxed line-clamp-2" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{notif.message}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {!notif.is_read && (
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">New Alert</span>
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>
                                                    {new Date(notif.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: isDark ? '#334155' : '#cbd5e1' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.3)' }}>
                        <Button
                            variant="ghost"
                            className="w-full rounded-2xl font-black text-[11px] uppercase tracking-widest h-12"
                            style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                            onClick={() => {
                                setShowDropdown(false);
                                onNavigate('applications');
                            }}
                        >
                            View All Activity
                        </Button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
                    20%, 40%, 60%, 80% { transform: rotate(-10deg); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, ChevronRight } from "lucide-react";
import { api } from "../api";
import { Button } from "./ui/button";

export function NotificationBell({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const data = await api.applications.getNotifications();
                setNotifications(data);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        fetchNotifs();

        // Auto-fetch every 5 minutes
        const interval = setInterval(fetchNotifs, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

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
                className={`relative p-3 rounded-2xl transition-all duration-300 ${showDropdown ? "bg-blue-50 text-[#1e3a8a]" : "text-gray-400 hover:bg-gray-100"
                    }`}
            >
                <Bell className={`w-6 h-6 ${notifications.length > 0 && !showDropdown ? "animate-[swing_2s_ease-in-out_infinite]" : ""}`} />

                {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                        {notifications.length}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-4 w-96 bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-black text-gray-900 tracking-tight">Real-time Alerts</h3>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ScholarIQ Intelligence</p>
                        </div>
                        {notifications.length > 0 && (
                            <button className="text-xs font-bold text-gray-400 hover:text-[#1e3a8a]">Clear all</button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Everything is up to date ✨</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-6 hover:bg-blue-50/30 cursor-pointer flex gap-4 items-start transition-all group"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onNavigate('detail', { id: notif.scholarship_id });
                                        }}
                                    >
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <Clock className="w-6 h-6 text-[#1e3a8a]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-800 leading-snug group-hover:text-[#1e3a8a] transition-colors">{notif.message}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Priority High</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Just Now</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                        <Button
                            variant="ghost"
                            className="w-full rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-[#1e3a8a]"
                            onClick={() => {
                                setShowDropdown(false);
                                onNavigate('applications');
                            }}
                        >
                            View Full Tracker Pipeline
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

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
    GraduationCap,
    MapPin,
    Trash2,
    Loader2,
    Trophy,
    Filter,
    CheckCircle2,
    Clock,
    MessageSquare,
    XCircle,
    MoreVertical,
    Banknote,
    Calendar
} from "lucide-react";
import { api } from "../api";
import { toast } from "sonner";
import { useCurrency } from "../context/CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";

const STATUS_CONFIG = {
    All: { label: "All", color: "bg-gray-100 text-gray-700", icon: Filter },
    Saved: { label: "Saved", color: "bg-gray-100 text-gray-700", icon: Clock },
    Applied: { label: "Applied", color: "bg-blue-100 text-blue-700", icon: MessageSquare },
    Interview: { label: "Interview", color: "bg-yellow-100 text-yellow-700", icon: Trophy },
    Accepted: { label: "Accepted", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    Rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
};

export function MyApplicationsPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const { convertAndFormat } = useCurrency();
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const data = await api.applications.list();
            setApplications(data);
        } catch (err) {
            console.error("Failed to fetch applications", err);
            toast.error("Failed to load applications");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (appId: number, newStatus: string) => {
        try {
            // Optimistic update
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));

            await api.applications.update(appId, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
            fetchApplications();
        }
    };

    const handleDelete = async (appId: number) => {
        if (!window.confirm("Are you sure you want to stop tracking this scholarship?")) return;

        try {
            await api.applications.delete(appId);
            setApplications(prev => prev.filter(app => app.id !== appId));
            toast.success("Scholarship removed from tracking");
        } catch (err) {
            toast.error("Failed to delete application record");
        }
    };

    const filteredApps = filter === "All"
        ? applications
        : applications.filter(app => app.status === filter);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
                    <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black text-[#1e3a8a] tracking-tight">ScholarIQ</span>
                </div>

                <div className="flex items-center gap-4">
                    <CurrencySelector />
                    <Button
                        variant="ghost"
                        className="font-bold text-gray-500 hover:text-[#1e3a8a] rounded-xl"
                        onClick={() => onNavigate('dashboard')}
                    >
                        Dashboard
                    </Button>
                    <div className="w-px h-6 bg-gray-200" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="font-black text-[#1e3a8a] text-lg">{applications.length}</span>
                        <span className="text-[#1e3a8a] text-[10px] font-black uppercase tracking-widest">Global Leads</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                            My Scholarship <span className="text-blue-600">Trackers</span> 🗂️
                        </h1>
                        <p className="text-gray-500 font-medium text-lg mt-2">Manage your journey to elite global universities.</p>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
                        {Object.keys(STATUS_CONFIG).map((statusKey) => {
                            const { label, icon: Icon } = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG];
                            const isActive = filter === statusKey;
                            return (
                                <button
                                    key={statusKey}
                                    onClick={() => setFilter(statusKey)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${isActive
                                        ? "bg-[#1e3a8a] text-white shadow-lg shadow-blue-200"
                                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-300"}`} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-gray-100">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-50 rounded-full" />
                            <Loader2 className="w-16 h-16 animate-spin text-[#1e3a8a] absolute top-0 left-0" />
                        </div>
                        <p className="text-gray-400 font-bold mt-6 uppercase tracking-widest text-sm">Syncing with Cloud Database...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-inner">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No Trackers Found</h3>
                        <p className="text-gray-400 font-medium max-w-sm mx-auto mb-8">
                            Aap ne abhi tak koi scholarship is category mein save nahi ki. Start exploring to find the best matches.
                        </p>
                        <Button
                            onClick={() => onNavigate('search')}
                            className="bg-[#1e3a8a] text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-blue-900/10 hover:scale-105 transition-transform"
                        >
                            Explore Now 🎯
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {filteredApps.map((app) => (
                            <Card key={app.id} className="group border-none bg-white rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                                <div className={`h-2 bg-gradient-to-r ${app.status === 'Accepted' ? 'from-green-400 to-emerald-600' :
                                    app.status === 'Rejected' ? 'from-red-400 to-rose-600' :
                                        app.status === 'Interview' ? 'from-orange-400 to-amber-600' :
                                            app.status === 'Applied' ? 'from-blue-400 to-indigo-600' :
                                                'from-gray-300 to-gray-500'
                                    }`} />
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <Badge className={`rounded-xl border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 ${STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.color || "bg-gray-100 text-gray-700"
                                            }`}>
                                            {app.status}
                                        </Badge>
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            className="p-3 text-gray-300 hover:text-red-500 lg:opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h3 className="font-black text-xl text-gray-900 leading-tight mb-2 group-hover:text-[#1e3a8a] transition-colors line-clamp-2">
                                        {app.scholarship?.title}
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                            <GraduationCap className="w-4 h-4 text-gray-300 shrink-0" />
                                            <span className="line-clamp-1">{app.scholarship?.university_name || 'Global University'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                                            <MapPin className="w-4 h-4 text-gray-300 shrink-0" />
                                            <span>{app.scholarship?.country}</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-3xl mb-8 space-y-3">
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                                            <span>Valuation</span>
                                            <span>Next Phase</span>
                                        </div>
                                        <div className="flex justify-between items-center font-black">
                                            <span className="text-emerald-600 flex items-center gap-1">
                                                <Banknote className="w-5 h-5" />
                                                {convertAndFormat(app.scholarship?.amount || "Varies")}
                                            </span>
                                            <span className="text-gray-900 flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {app.scholarship?.deadline ? new Date(app.scholarship.deadline).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">Pipeline Status</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                className="w-full h-12 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-bold px-4 focus:ring-2 focus:ring-[#1e3a8a] outline-none appearance-none cursor-pointer hover:border-blue-200 transition-colors"
                                            >
                                                <option value="Saved">📌 Saved</option>
                                                <option value="Applied">📝 Applied</option>
                                                <option value="Interview">🎤 Interview</option>
                                                <option value="Accepted">🎉 Accepted</option>
                                                <option value="Rejected">❌ Rejected</option>
                                            </select>
                                            <Button
                                                variant="outline"
                                                className="h-12 rounded-xl border-gray-100 font-bold text-gray-600 hover:bg-gray-50"
                                                onClick={() => onNavigate('detail', { id: app.scholarship_id })}
                                            >
                                                View Case
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

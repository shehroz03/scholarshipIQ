import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
    GraduationCap,
    MapPin,
    ChevronRight,
    Zap,
    Loader2,
    AlertCircle,
    Check,
    Flame,
    Star,
    Crown,
    Clock,
    Banknote
} from "lucide-react";
import { api, AIRecommendationResponse } from "../api";

interface RecommendationsProps {
    onNavigate: (page: string, params?: any) => void;
}

export function Recommendations({ onNavigate }: RecommendationsProps) {
    const [data, setData] = useState<AIRecommendationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>("free");
    const [isSyncing, setIsSyncing] = useState(false);

    const isFreeUser = userPlan === "free";

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const s = await api.consultant.getStatus();
                setUserPlan(s.plan || "free");
            } catch {
                setUserPlan("free");
            }
        };

        const fetchRecommendations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.recommendations.list();
                setData(response);
            } catch (err: any) {
                console.error("Error fetching AI recommendations:", err);
                setError("Failed to load AI recommendations.");
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-gray-100 rounded-xl" />
                        <div className="h-4 w-96 bg-gray-50 rounded-lg" />
                    </div>
                    <div className="h-24 w-full md:w-96 bg-gray-50 rounded-[2.5rem]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[500px] bg-gray-50 rounded-[3rem]" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-none shadow-sm bg-red-50/50 rounded-[3rem] p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Recommendation Error</h3>
                <p className="text-red-700 mb-6 font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                    Try Again
                </Button>
            </Card>
        );
    }

    if (!data || data.top_scholarships.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No Matches Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Complete your profile or explore more programs to help our AI understand your preferences.</p>
                <Button onClick={() => onNavigate('settings')} className="bg-[#1e3a8a] rounded-2xl h-14 px-10 font-black">Refine Profile</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-[#1e3a8a] fill-[#1e3a8a]" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Recommended For You</h2>
                    </div>
                    <p className="text-gray-500 font-semibold pl-1">Based on your background, these are your highest-probability matches.</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    {/* AI Model Status Indicator for PRO users */}
                    {!isFreeUser && data?.ml_active && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <div className={`w-2 h-2 bg-emerald-500 rounded-full ${isSyncing ? 'animate-ping' : 'animate-pulse'} shadow-[0_0_8px_rgba(16,185,129,0.6)]`} />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                {isSyncing ? "Model: Training in Progress..." : "AI Model: Trained & Active"}
                            </span>
                        </div>
                    )}
                    
                    {!isFreeUser && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isSyncing}
                            onClick={async () => {
                                setIsSyncing(true);
                                // Simulate training delay
                                await new Promise(r => setTimeout(r, 2000));
                                const response = await api.recommendations.list();
                                setData(response);
                                setIsSyncing(false);
                            }}
                            className="rounded-xl border-blue-100 text-[#1e3a8a] font-bold text-xs h-10 px-4 hover:bg-blue-50"
                        >
                            <Zap className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
                            {isSyncing ? "Syncing Profile..." : "Sync AI Model"}
                        </Button>
                    )}
                </div>

                <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-900/10 flex items-center gap-4 border border-white/10 max-w-lg">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Expert Advice</p>
                        <p className="text-sm font-bold leading-tight">Focus on <span className="text-orange-300">{data.recommended_next_degree}</span> programs next. {data.reason_next_degree}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...data.top_scholarships]
                    .sort((a, b) => b.fit_score - a.fit_score)
                    .map((s) => (
                        <Card
                            key={s.id}
                            className="group relative border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[3rem] overflow-hidden flex flex-col h-full hover:-translate-y-2 border border-transparent hover:border-blue-100"
                        >
                            {/* Match Badge Header */}
                            <div className="flex flex-col">
                                    <div className="p-5 flex justify-between items-center bg-[#0f172a] rounded-t-[2.5rem] border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-amber-400/10 p-1.5 rounded-lg">
                                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200">Match Score</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="bg-white px-4 py-2 rounded-2xl border-2 border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-2">
                                                {isFreeUser && <Crown className="w-4 h-4 text-amber-500" />}
                                                <span className="text-2xl font-black text-[#0f172a] tabular-nums">
                                                    {s.fit_score || 0}%
                                                </span>
                                            </div>
                                            {s.match_label && !isFreeUser && (
                                                <span className="text-[9px] font-black text-blue-100 uppercase mt-1.5 tracking-widest px-2 py-0.5 rounded-md bg-blue-500/20 border border-white/5">
                                                    {s.match_label}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                {/* Countdown Timer moved here (Circle Area) */}
                                {s.deadline && (
                                    <div className="px-5 py-2 flex items-center justify-between bg-gray-50/80 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                                <Clock className="w-3 h-3 text-red-600 animate-pulse" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Reminder</span>
                                        </div>
                                        <span className="text-xs font-black text-red-600 tabular-nums">
                                            {(() => {
                                                const deadlineDate = new Date(s.deadline);
                                                const now = new Date();
                                                const diff = deadlineDate.getTime() - now.getTime();
                                                if (diff <= 0) return "EXPIRED";
                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                return `${days}d ${hours}h until close`;
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-8 flex-1 flex flex-col">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Badge className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${s.fit_score >= 80 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                            {s.fit_score >= 80 ? 'Perfect Fit 🟢' : 'High Potential 🔵'}
                                        </Badge>

                                        {/* Price Information moved here (Old timer position) */}
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                                            <Banknote className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="text-[10px] font-black text-amber-700 uppercase">
                                                {s.amount && s.amount !== "Varies" && s.amount !== "Funding Varies" ? s.amount :
                                                    s.after_fee !== undefined && s.after_fee === 0 ? "Fully Funded" :
                                                        s.after_fee !== undefined ? `GBP ${Math.round(s.after_fee).toLocaleString()} remaining` :
                                                            "Funding Varies"}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-[#1e3a8a] transition-colors leading-tight line-clamp-2 min-h-[3.5rem]">
                                        {s.title}
                                    </h3>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4 text-[#1e3a8a]" />
                                        </div>
                                        <span className="truncate">{s.university_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-red-400" />
                                        </div>
                                        <span className="truncate">{s.country} • {s.degree_level}</span>
                                    </div>
                                </div>

                                {/* AI Reasoning */}
                                <div className={`bg-slate-50 border border-slate-100 p-5 rounded-3xl mb-8 flex-1 relative overflow-hidden ${isFreeUser ? 'cursor-pointer group/lock' : ''}`}
                                    onClick={isFreeUser ? () => onNavigate('pricing') : undefined}>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Check className="w-3 h-3 text-green-500" /> AI Insights
                                    </p>
                                    <p className={`text-sm font-bold text-slate-600 leading-snug ${isFreeUser ? 'blur-[4px] select-none' : ''}`}>
                                        {isFreeUser ? "This scholarship is a great fit for your background because of your academic achievements and..." : s.short_reason}
                                    </p>
                                    {isFreeUser && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/20 opacity-0 group-hover/lock:opacity-100 transition-opacity">
                                            <div className="bg-white/90 shadow-lg px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-amber-500" />
                                                <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest">Unlock with Premium</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => onNavigate('detail', { id: s.id })}
                                    className={`w-full h-14 rounded-2xl font-black text-base shadow-lg transition-all duration-300 group/btn ${s.is_strong_match
                                        ? 'bg-[#1e3a8a] hover:bg-blue-800 text-white shadow-blue-900/10'
                                        : 'bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50 shadow-none'
                                        }`}
                                >
                                    Explore Program
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </div>
    );
}

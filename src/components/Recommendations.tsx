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
    Star
} from "lucide-react";
import { api, AIRecommendationResponse } from "../api";

interface RecommendationsProps {
    onNavigate: (page: string, params?: any) => void;
}

export function Recommendations({ onNavigate }: RecommendationsProps) {
    const [data, setData] = useState<AIRecommendationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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

        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                <div className="relative mb-6">
                    <Loader2 className="w-16 h-16 animate-spin text-[#1e3a8a] opacity-20" />
                    <Zap className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1e3a8a] animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">🤖 AI is Analyzing...</h3>
                <p className="text-gray-500 font-medium">Processing your profile and 37,000+ scholarships...</p>
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
                {data.top_scholarships.map((s) => (
                    <Card
                        key={s.id}
                        className="group relative border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[3rem] overflow-hidden flex flex-col h-full hover:-translate-y-2 border border-transparent hover:border-blue-100"
                    >
                        {/* Match Badge Header */}
                        <div className={`p-4 flex justify-between items-center ${s.is_strong_match ? 'bg-blue-600' : 'bg-slate-800'} text-white transition-colors duration-500`}>
                            <div className="flex items-center gap-2">
                                <Zap className={`w-4 h-4 ${s.is_strong_match ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Match Score</span>
                            </div>
                            <span className="text-xl font-black bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md">
                                {s.fit_score}%
                            </span>
                        </div>

                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="mb-6">
                                <Badge className={`mb-3 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${s.fit_score >= 80 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    {s.fit_score >= 80 ? 'Perfect Fit 🟢' : 'High Potential 🔵'}
                                </Badge>
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
                            <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl mb-8 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Check className="w-3 h-3 text-green-500" /> AI Insights
                                </p>
                                <p className="text-sm font-bold text-slate-600 leading-snug">
                                    {s.short_reason}
                                </p>
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

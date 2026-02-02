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
    Lightbulb,
    Check
} from "lucide-react";
import { api, RecommendationResponse, ScholarshipRecommendation } from "../api";

interface BestMatchesSectionProps {
    onNavigate: (page: string, params?: any) => void;
}

export function BestMatchesSection({ onNavigate }: BestMatchesSectionProps) {
    const [data, setData] = useState<RecommendationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.recommendations.getProfileRecommendations();
                setData(response);
            } catch (err: any) {
                console.error("Failed to fetch profile recommendations", err);
                setError("We couldn't load your recommendations right now. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const getEligibilityColor = (eligibility: ScholarshipRecommendation["eligibility"]) => {
        switch (eligibility) {
            case "eligible":
                return "bg-green-50 text-green-700 border-green-100";
            case "borderline":
                return "bg-amber-50 text-amber-700 border-amber-100";
            case "not_eligible":
                return "bg-red-50 text-red-700 border-red-100";
            default:
                return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    const getScoreBadge = (score: number) => {
        if (score >= 85) return { label: "High Match 🟢", color: "bg-green-50 text-green-700 border-green-100" };
        if (score >= 65) return { label: "Good Match 🟡", color: "bg-amber-50 text-amber-700 border-amber-100" };
        return { label: "Stretch 🔴", color: "bg-red-50 text-red-700 border-red-100" };
    };

    if (loading) {
        return (
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
                        <p className="text-gray-500 font-bold animate-pulse text-sm">Building AI-powered matches for you...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-none shadow-sm bg-red-50/30 rounded-3xl border border-red-100/50">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => window.location.reload()}
                        >
                            Retry Load
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.items || data.items.length === 0) {
        return (
            <Card className="border-dashed border-2 py-16 bg-white/50 rounded-[3rem] border-gray-200">
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <Zap className="w-8 h-8 text-[#1e3a8a]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">We don't have enough data yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-6 font-medium">Try updating your profile or exploring scholarships manually so our AI can learn your preferences.</p>
                        <Button onClick={() => onNavigate('settings')} className="bg-[#1e3a8a] hover:bg-blue-800 rounded-xl px-10 font-bold shadow-lg shadow-blue-900/10 h-12">
                            Update Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-none px-2 py-0 text-[10px] uppercase font-black tracking-widest">
                            AI Powered
                        </Badge>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Based on your activity</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Best Matches For You</h2>
                </div>
                <div className="bg-[#1e3a8a] text-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row items-start md:items-center gap-3 shadow-xl shadow-blue-900/10 max-w-xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white/20 p-2 rounded-xl shrink-0">
                        <Lightbulb className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-0.5">Recommended Next Step: <span className="text-white">{data.recommended_next_degree}</span></p>
                        <p className="text-xs font-medium text-white/90 leading-tight line-clamp-2 md:line-clamp-none">{data.reason_next_degree}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.slice(0, 10).map((item, idx) => {
                    const badge = getScoreBadge(item.fit_score);
                    return (
                        <Card key={idx} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-[2.5rem] flex flex-col h-full border-t-4 border-transparent hover:border-blue-500 overflow-hidden translate-y-0 hover:-translate-y-2">
                            <CardContent className="p-8 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <Badge className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${badge.color}`}>
                                            {badge.label}
                                        </Badge>
                                    </div>
                                    <div className="bg-blue-50 text-[#1e3a8a] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-blue-100">
                                        <Zap className="w-3.5 h-3.5 fill-blue-600" />
                                        <span className="text-xs font-black">{Math.round(item.fit_score)}%</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <h3 className="text-lg font-black text-gray-900 group-hover:text-[#1e3a8a] transition-colors leading-tight line-clamp-2">
                                        {item.title}
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <GraduationCap className="w-4 h-4 text-[#1e3a8a]" />
                                            <span className="truncate">{item.university_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{item.country} • {item.degree_level}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 mt-4 h-24">
                                        <ul className="space-y-1.5">
                                            {item.reasons.slice(0, 2).map((reason, ridx) => (
                                                <li key={ridx} className="flex items-start gap-2 text-[11px] font-medium text-gray-500 leading-tight">
                                                    <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                                    <span>{reason}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-2xl font-bold h-12 shadow-lg shadow-blue-900/5 group/btn"
                                        onClick={() => onNavigate('detail', { id: item.id })}
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
    GraduationCap,
    MapPin,
    ChevronDown,
    ChevronUp,
    Zap,
    Loader2,
    AlertCircle,
    ExternalLink,
    Calendar,
    DollarSign,
    BookOpen,
    Lock,
    Crown,
} from "lucide-react";
import { api, RecommendationItem, ProfileRecommendationResponse } from "../api";

interface BestMatchesSectionProps {
    onNavigate: (page: string, params?: any) => void;
}

const MATCH_STYLES: Record<
    string,
    { badge: string; bar: string; icon: string }
> = {
    green: {
        badge: "bg-green-50 text-green-700 border-green-200",
        bar: "bg-green-500",
        icon: "🟢",
    },
    yellow: {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        icon: "🟡",
    },
    red: {
        badge: "bg-red-50 text-red-700 border-red-200",
        bar: "bg-red-400",
        icon: "🔴",
    },
};

function ScoreBar({ score }: { score: number }) {
    return (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${score >= 80
                    ? "bg-green-500"
                    : score >= 65
                        ? "bg-amber-500"
                        : "bg-red-400"
                    }`}
                style={{ width: `${Math.min(score, 100)}%` }}
            />
        </div>
    );
}
function MatchCard({
    item,
    onNavigate,
    isFreeUser,
}: {
    item: RecommendationItem;
    onNavigate: (page: string, params?: any) => void;
    isFreeUser: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const styles = MATCH_STYLES[item.match_color] ?? MATCH_STYLES.red;

    const handleApply = () => {
        // Record feedback
        api.recommendations
            .submitFeedback(item.scholarship_id, "apply")
            .catch(() => { });
        if (item.scholarship_link) {
            window.open(item.scholarship_link, "_blank", "noopener,noreferrer");
        }
    };

    const handleCardClick = () => {
        api.recommendations
            .submitFeedback(item.scholarship_id, "view")
            .catch(() => { });
        onNavigate("detail", { id: item.scholarship_id });
    };

    const feeDisplay =
        item.after_fee > 0
            ? `£${item.after_fee.toLocaleString()} / yr`
            : "Full funding";

    const deadlineDisplay = item.deadline
        ? new Date(item.deadline).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "Open";

    return (
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer group">
            <CardContent className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge
                                className={`text-xs font-semibold border ${isFreeUser ? "bg-slate-100 text-slate-400 blur-[0.5px]" : styles.badge}`}
                            >
                                {isFreeUser ? <Lock className="w-3 h-3 mr-1" /> : styles.icon} {isFreeUser ? "Match Locked" : item.match_label}
                            </Badge>
                            <span className={`text-xs font-mono ${isFreeUser ? "text-slate-300 blur-[1px]" : "text-gray-400"}`}>
                                {isFreeUser ? "00.0%" : `${item.fit_score.toFixed(1)}%`}
                            </span>
                        </div>
                        <h3
                            className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors"
                            onClick={handleCardClick}
                        >
                            {item.scholarship_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {item.uni_name}
                        </p>
                    </div>
                </div>

                {/* Score bar */}
                <div className={`mb-3 ${isFreeUser ? "opacity-30 grayscale blur-[1px]" : ""}`}>
                    <ScoreBar score={isFreeUser ? 0 : item.fit_score} />
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.city ? `${item.city}, ${item.country}` : item.country}
                    </span>
                    {item.cgpa_min > 0 && (
                        <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            Min CGPA {item.cgpa_min.toFixed(1)}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {feeDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {deadlineDisplay}
                    </span>
                </div>

                {/* Reasons (collapsible) */}
                {item.reasons.length > 0 && (
                    <div className="mb-3">
                        <button
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setExpanded((e) => !e)}
                        >
                            <BookOpen className="w-3 h-3" />
                            {expanded ? "Hide reasons" : "Why this match?"}
                            {expanded ? (
                                <ChevronUp className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                        {expanded && (
                            <ul className="mt-2 space-y-1">
                                {item.reasons.map((r, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700"
                        onClick={handleApply}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Apply Now
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-3"
                        onClick={handleCardClick}
                    >
                        Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function BestMatchesSection({ onNavigate }: BestMatchesSectionProps) {
    const [data, setData] = useState<ProfileRecommendationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>("free");

    useEffect(() => {
        api.get("/consultant/status")
            .then((s: any) => setUserPlan(s?.plan || "free"))
            .catch(() => setUserPlan("free"));
    }, []);

    const isFreeUser = userPlan === "free";
    const FREE_RECS_LIMIT = 3;

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.recommendations.getProfile();
            console.log("[BestMatchesSection] Raw API response:", response);
            console.log("[BestMatchesSection] Items count:", response?.items?.length ?? 0);
            setData(response);
        } catch (err: any) {
            console.error("[BestMatchesSection] Failed to fetch profile recommendations", err);
            setError("Could not load recommendations. Please complete your profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                <p className="text-sm">Finding your best matches…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <p className="text-sm text-gray-500 text-center max-w-xs">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchRecommendations}>
                    Retry
                </Button>
            </div>
        );
    }

    const items = data?.items ?? [];
    const visibleItems = isFreeUser ? items.slice(0, FREE_RECS_LIMIT) : items;
    const hiddenCount = isFreeUser ? Math.max(0, items.length - FREE_RECS_LIMIT) : 0;

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <GraduationCap className="w-10 h-10 text-blue-200" />
                <p className="text-sm font-medium text-gray-700">
                    Complete your profile to get personalised matches
                </p>
                <p className="text-xs text-gray-400 max-w-xs">
                    Add your CGPA, target degree, preferred country and major to unlock
                    AI-powered recommendations.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate("settings")}
                >
                    Update Profile
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <h2 className="font-semibold text-gray-900 text-sm">
                        Top {items.length} Matches
                    </h2>
                    {data?.ml_active && (
                        <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            AI Hybrid
                        </Badge>
                    )}
                </div>
                <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={fetchRecommendations}
                >
                    Refresh
                </button>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleItems.map((item) => (
                    <MatchCard
                        key={item.scholarship_id}
                        item={item}
                        onNavigate={onNavigate}
                        isFreeUser={isFreeUser}
                    />
                ))}
            </div>

            {/* Free user gate */}
            {isFreeUser && hiddenCount > 0 && (
                <div className="relative">
                    {/* Blurred preview */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 rounded-2xl pointer-events-none" />
                    <div className="filter blur-sm grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-32 overflow-hidden pointer-events-none">
                        {items.slice(FREE_RECS_LIMIT, FREE_RECS_LIMIT + 2).map((item) => (
                            <div key={item.scholarship_id} className="bg-white rounded-2xl p-4 border border-gray-100">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                    {/* Upgrade CTA */}
                    <div className="relative z-20 text-center pt-4">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full mb-3">
                            <Lock className="w-3 h-3" /> {hiddenCount} more matches hidden
                        </div>
                        <div className="block">
                            <button
                                onClick={() => onNavigate("pricing")}
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 mx-auto"
                            >
                                <Crown className="w-3 h-3" /> Upgrade for All Matches
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BestMatchesSection;

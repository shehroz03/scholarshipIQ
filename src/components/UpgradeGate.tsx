import { useNavigate } from "react-router-dom";
import {
    Lock, Crown, CheckCircle2, Sparkles, Gem,
    Layout, Download, Infinity, ShieldCheck,
    Trophy, GraduationCap, Users
} from "lucide-react";

interface UpgradeGateProps {
    feature: string;
    requiredPlan?: "premium" | "pro";
    description?: string;
    benefits?: string[];
    compact?: boolean;
}

const PLAN_COLORS = {
    premium: {
        badge: "bg-indigo-600",
        button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        gradient: "from-indigo-600 to-blue-600",
        icon: Crown,
        label: "Premium",
        emoji: "👑",
        accent: "#f4c44e"
    },
    pro: {
        badge: "bg-gradient-to-r from-amber-500 to-yellow-500",
        button: "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-blue-200",
        gradient: "from-teal-500 to-blue-600",
        icon: Gem,
        label: "Pro",
        emoji: "💎",
        accent: "#10b981"
    },
};

export function UpgradeGate({
    feature,
    requiredPlan = "premium",
    description,
    benefits,
    compact = false,
}: UpgradeGateProps) {
    const navigate = useNavigate();
    const plan = PLAN_COLORS[requiredPlan];
    const PlanIcon = plan.icon;

    const featureIcons = [
        { icon: Layout, label: "Premium Templates" },
        { icon: Sparkles, label: "AI Enhancement" },
        { icon: Download, label: "PDF Download" },
        { icon: Infinity, label: "Unlimited Revisions" }
    ];

    if (compact) {
        return (
            <div className="relative rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5 text-center transition-all hover:border-indigo-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700">{plan.emoji} {plan.label} Feature</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{description || `Upgrade to access ${feature}`}</p>
                <button
                    onClick={() => navigate("/pricing")}
                    className={`text-white text-xs font-bold px-4 py-2 rounded-xl ${plan.button} transition-all shadow-lg active:scale-95`}
                >
                    🚀 Upgrade Now
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-6 px-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
                {/* Glowing Background Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-100/50 rounded-full blur-3xl" />

                <div className="p-8 md:p-10 text-center relative z-10">
                    {/* Animated Premium Badge / Trophy */}
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all duration-500 animate-pulse" />
                        <div className="w-24 h-24 bg-gradient-to-br from-white to-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white relative z-10 transition-transform hover:scale-110 duration-300">
                            <Trophy className="w-12 h-12 text-blue-500" />
                            {/* Inner glow */}
                            <div className="absolute inset-0 rounded-[2rem] border-2 border-blue-100 opacity-50 pulse-border" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter shadow-blue-500/30">
                            PRO ACCESS
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{feature}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {description || "Unlock the full potential of our AI-powered scholarship tools."}
                        </p>
                    </div>

                    {/* Feature Grid Layout */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {featureIcons.map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all group">
                                <item.icon className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Block */}
                    <div className="mb-8 space-y-1">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 text-lg font-bold">PKR</span>
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">1,500</span>
                            <span className="text-slate-400 text-sm font-bold uppercase">/month</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-green-600 font-bold uppercase tracking-wider">
                            <ShieldCheck size={12} />
                            Money-back guarantee • Cancel Anytime
                        </div>
                    </div>

                    {/* Enhanced CTA Button */}
                    <button
                        id={`upgrade-gate-${feature.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => navigate("/pricing")}
                        className={`w-full text-white font-extrabold py-5 rounded-2xl transition-all shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] text-base active:scale-[0.98] bg-gradient-to-r ${plan.gradient} hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.5)]`}
                    >
                        Unlock Pro Access Now
                    </button>

                    {/* Social Proof */}
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center overflow-hidden">
                                        <Users className="w-3 h-3 text-slate-400" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Trusted by 500+ Students
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* University Logos (Placeholder Icons) */}
                            <div className="flex flex-col items-center gap-1">
                                <GraduationCap size={16} />
                                <span className="text-[8px] font-black">NUST</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <GraduationCap size={16} />
                                <span className="text-[8px] font-black">FAST</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <GraduationCap size={16} />
                                <span className="text-[8px] font-black">LUMS</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <GraduationCap size={16} />
                                <span className="text-[8px] font-black">COMSATS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-border {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.2; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
                .pulse-border {
                    animation: pulse-border 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}

export default UpgradeGate;

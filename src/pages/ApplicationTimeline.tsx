import { useState, useEffect } from "react";
import { 
    User, 
    Mail, 
    FileText, 
    Send, 
    Bell, 
    Globe, 
    Plane, 
    Check,
    Trophy,
    ChevronRight,
    Clock
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { darkTheme } from "../styles/theme";

interface TimelineStep {
    id: string;
    title: string;
    description: string;
    timeframe: string;
    order: number;
    icon: React.FC<any>;
}

interface TimelineStepEx extends TimelineStep {
    color: string;
    lightBg: string;
    darkBg: string;
}

const TIMELINE_STEPS: TimelineStepEx[] = [
    {
        id: "1",
        title: "Gather Personal Documents",
        timeframe: "4–6 weeks before deadline",
        description: "Collect passport, CNIC, photos, transcripts, and other core identity documents.",
        order: 1,
        icon: User,
        color: "#6366f1",
        lightBg: "#eef2ff",
        darkBg: "rgba(99,102,241,0.15)"
    },
    {
        id: "2",
        title: "Request Recommendation Letters",
        timeframe: "6–8 weeks before deadline",
        description: "Email professors or supervisors early and give them clear guidance and deadlines.",
        order: 2,
        icon: Mail,
        color: "#0891b2",
        lightBg: "#ecfeff",
        darkBg: "rgba(8,145,178,0.15)"
    },
    {
        id: "3",
        title: "Write SOP / Personal Statement",
        timeframe: "4 weeks before deadline",
        description: "Draft, review, and refine your main application essay.",
        order: 3,
        icon: FileText,
        color: "#7c3aed",
        lightBg: "#f5f3ff",
        darkBg: "rgba(124,58,237,0.15)"
    },
    {
        id: "4",
        title: "Submit Scholarship Applications",
        timeframe: "On or before deadline",
        description: "Complete online forms, upload documents, and double‑check everything before submitting.",
        order: 4,
        icon: Send,
        color: "#d97706",
        lightBg: "#fffbeb",
        darkBg: "rgba(217,119,6,0.15)"
    },
    {
        id: "5",
        title: "Wait for Offer Letters",
        timeframe: "4–12 weeks after submission",
        description: "Monitor email and portals for interview calls and scholarship decisions.",
        order: 5,
        icon: Bell,
        color: "#dc2626",
        lightBg: "#fef2f2",
        darkBg: "rgba(220,38,38,0.15)"
    },
    {
        id: "6",
        title: "Apply for Student Visa",
        timeframe: "8–12 weeks before course start",
        description: "Use your offer letter to book biometrics, pay visa fee, and upload required visa documents.",
        order: 6,
        icon: Globe,
        color: "#059669",
        lightBg: "#f0fdf4",
        darkBg: "rgba(5,150,105,0.15)"
    },
    {
        id: "7",
        title: "Pre‑Departure & Travel Prep",
        timeframe: "2–4 weeks before travel",
        description: "Arrange accommodation, book flights, and attend any pre‑departure briefings.",
        order: 7,
        icon: Plane,
        color: "#2563eb",
        lightBg: "#eff6ff",
        darkBg: "rgba(37,99,235,0.15)"
    }
];

export function ApplicationTimeline({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const isDark = true;
    const theme = darkTheme;

    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem("scholariq_timeline_steps");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem("scholariq_timeline_steps", JSON.stringify(completedSteps));
    }, [completedSteps]);

    const toggleStep = (id: string) => {
        setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / TIMELINE_STEPS.length) * 100);
    const firstIncomplete = TIMELINE_STEPS.find(step => !completedSteps[step.id]);
    const currentStepId = firstIncomplete ? firstIncomplete.id : null;

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <div className="hidden lg:block">
                <Sidebar onNavigate={onNavigate} currentPage="timeline" />
            </div>
            <div className="hidden lg:block shrink-0 w-64 min-w-64" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="px-8 py-5 flex items-center justify-between border-b" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                <Clock size={18} style={{ color: "#fff" }} />
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: theme.text }}>Application Timeline</h1>
                        </div>
                        <p className="text-sm ml-12" style={{ color: theme.textSecondary }}>Track your scholarship journey from documents to visa</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Button
                            onClick={() => onNavigate('dashboard')}
                            className="rounded-xl font-bold text-white border-none"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            ← Back to Dashboard
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-10" style={{ backgroundColor: theme.bg }}>
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Progress Card */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-semibold mb-0.5" style={{ color: theme.textSecondary }}>Overall Progress</p>
                                    <p className="text-2xl font-black" style={{ color: theme.text }}>{completedCount} of {TIMELINE_STEPS.length} steps complete</p>
                                </div>
                                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ background: `conic-gradient(#6366f1 ${progressPercent * 3.6}deg, ${isDark ? "#374151" : "#e5e7eb"} 0deg)` }}>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: theme.bgSecondary, color: "#6366f1" }}>
                                        {progressPercent}%
                                    </div>
                                </div>
                            </div>
                            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "#374151" : "#e5e7eb" }}>
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }}
                                />
                            </div>
                            {progressPercent === 100 && (
                                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                                    <Trophy size={18} />
                                    <span className="font-bold text-sm">🎉 Congratulations! All steps completed!</span>
                                </div>
                            )}
                        </div>

                        {/* Steps */}
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-[27px] top-10 bottom-10 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg, #6366f1, #8b5cf6, #06b6d4)" }} />

                            <div className="space-y-4">
                                {TIMELINE_STEPS.map((step) => {
                                    const isCompleted = !!completedSteps[step.id];
                                    const isCurrent = step.id === currentStepId;
                                    const StepIcon = step.icon;

                                    return (
                                        <div key={step.id} className="flex items-start gap-5">
                                            {/* Circle */}
                                            <div
                                                onClick={() => toggleStep(step.id)}
                                                className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 z-10 relative"
                                                style={isCompleted
                                                    ? { backgroundColor: "#10b981", boxShadow: "0 4px 15px rgba(16,185,129,0.4)" }
                                                    : isCurrent
                                                        ? { backgroundColor: step.color, boxShadow: `0 4px 20px ${step.color}55` }
                                                        : { backgroundColor: isDark ? "#1f2937" : "#f3f4f6", border: `2px solid ${isDark ? "#374151" : "#e5e7eb"}` }
                                                }
                                            >
                                                {isCompleted
                                                    ? <Check size={24} style={{ color: "#fff", strokeWidth: 3 }} />
                                                    : <StepIcon size={22} style={{ color: isCurrent ? "#fff" : isDark ? "#6b7280" : "#9ca3af" }} />
                                                }
                                            </div>

                                            {/* Card */}
                                            <div
                                                onClick={() => toggleStep(step.id)}
                                                className="flex-1 rounded-2xl p-5 cursor-pointer transition-all duration-300"
                                                style={isCompleted
                                                    ? { backgroundColor: isDark ? "rgba(16,185,129,0.1)" : "#f0fdf4", border: "2px solid #10b981" }
                                                    : isCurrent
                                                        ? { backgroundColor: isDark ? step.darkBg : step.lightBg, border: `2px solid ${step.color}`, boxShadow: `0 4px 20px ${step.color}22` }
                                                        : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }
                                                }
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center text-white" style={{ backgroundColor: isCompleted ? "#10b981" : isCurrent ? step.color : isDark ? "#4b5563" : "#d1d5db" }}>
                                                                {step.order}
                                                            </span>
                                                            <h3 className="font-black text-base" style={{ color: isCompleted ? "#059669" : isCurrent ? step.color : theme.text }}>
                                                                {step.title}
                                                            </h3>
                                                            {isCompleted && <Check size={16} style={{ color: "#10b981" }} />}
                                                        </div>
                                                        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>{step.description}</p>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                                        <span className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                                            style={isCompleted
                                                                ? { backgroundColor: "#d1fae5", color: "#065f46" }
                                                                : isCurrent
                                                                    ? { backgroundColor: isDark ? step.darkBg : step.lightBg, color: step.color, border: `1px solid ${step.color}44` }
                                                                    : { backgroundColor: isDark ? "#1f2937" : "#f3f4f6", color: theme.textSecondary }
                                                            }
                                                        >
                                                            <Clock size={11} />
                                                            {step.timeframe}
                                                        </span>
                                                        {!isCompleted && (
                                                            <button className="text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-lg" style={{ backgroundColor: isCompleted ? "#d1fae5" : isDark ? "#1f2937" : "#f3f4f6", color: isCurrent ? step.color : theme.textSecondary }}>
                                                                {isCurrent ? "Mark Done" : "Complete"} <ChevronRight size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom note */}
                        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: isDark ? "#1f2937" : "#f0f9ff", border: `1px solid ${isDark ? "#374151" : "#bae6fd"}` }}>
                            <p className="text-sm font-medium" style={{ color: isDark ? "#93c5fd" : "#0369a1" }}>
                                💡 <strong>Tip:</strong> Click on any step to mark it complete. Your progress is saved automatically.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ApplicationTimeline;

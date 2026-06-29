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
    Clock,
    Calendar,
    Zap,
    Sparkles,
    Copy,
    CheckCircle2,
    X,
    ExternalLink,
    MessageSquare,
    BookOpen
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { darkTheme } from "../styles/theme";

interface TimelineStepEx {
    id: string;
    title: string;
    description: string;
    order: number;
    icon: React.FC<any>;
    color: string;
    lightBg: string;
    darkBg: string;
    actionLabel: string;
    actionType: 'navigate' | 'modal';
    target: string;
    timeframes: {
        fall: string;
        spring: string;
        summer: string;
    };
}

const TIMELINE_STEPS: TimelineStepEx[] = [
    {
        id: "1",
        title: "Gather Personal & Academic Documents",
        description: "Collect passport, CNIC, transcripts, and certificates. Run them through the AI Secure Vault for deep vector analysis.",
        order: 1,
        icon: User,
        color: "#6366f1",
        lightBg: "#eef2ff",
        darkBg: "rgba(99,102,241,0.15)",
        actionLabel: "🔍 Open AI Document Vault",
        actionType: "navigate",
        target: "checklist",
        timeframes: {
            fall: "March – April (5 months prior)",
            spring: "July – August (5 months prior)",
            summer: "November – December (5 months prior)"
        }
    },
    {
        id: "2",
        title: "Request Recommendation Letters (LOR)",
        description: "Email professors or supervisors early. Give them clear guidance, bullet points of your achievements, and deadlines.",
        order: 2,
        icon: Mail,
        color: "#0891b2",
        lightBg: "#ecfeff",
        darkBg: "rgba(8,145,178,0.15)",
        actionLabel: "✉️ Generate LOR Email Request Template",
        actionType: "modal",
        target: "lor",
        timeframes: {
            fall: "April – May (4 months prior)",
            spring: "August – September (4 months prior)",
            summer: "December – January (4 months prior)"
        }
    },
    {
        id: "3",
        title: "Write SOP / Personal Statement",
        description: "Draft, review, and refine your main application essay using AI co-pilot tools for maximum global alignment.",
        order: 3,
        icon: FileText,
        color: "#7c3aed",
        lightBg: "#f5f3ff",
        darkBg: "rgba(124,58,237,0.15)",
        actionLabel: "✍️ Launch AI SOP Co-Pilot",
        actionType: "navigate",
        target: "sop-writer",
        timeframes: {
            fall: "May – June (3 months prior)",
            spring: "September – October (3 months prior)",
            summer: "January – February (3 months prior)"
        }
    },
    {
        id: "4",
        title: "Submit Scholarship Applications",
        description: "Complete online university forms, upload verified documents, and track all live application statuses in one portal.",
        order: 4,
        icon: Send,
        color: "#d97706",
        lightBg: "#fffbeb",
        darkBg: "rgba(217,119,6,0.15)",
        actionLabel: "🚀 Track My Active Applications",
        actionType: "navigate",
        target: "applications",
        timeframes: {
            fall: "June – July (Deadline Window)",
            spring: "October – November (Deadline Window)",
            summer: "February – March (Deadline Window)"
        }
    },
    {
        id: "5",
        title: "Wait for Offer Letters & Interviews",
        description: "Monitor email and university portals. Prepare rigorously for academic and scholarship panel interviews.",
        order: 5,
        icon: Bell,
        color: "#dc2626",
        lightBg: "#fef2f2",
        darkBg: "rgba(220,38,38,0.15)",
        actionLabel: "🎤 View Top 5 AI Interview Questions",
        actionType: "modal",
        target: "interview",
        timeframes: {
            fall: "July – August (Decision Window)",
            spring: "November – December (Decision Window)",
            summer: "March – April (Decision Window)"
        }
    },
    {
        id: "6",
        title: "Apply for Student Visa",
        description: "Use your official unconditional offer letter to book biometrics, pay fees, and submit proof of finances.",
        order: 6,
        icon: Globe,
        color: "#059669",
        lightBg: "#f0fdf4",
        darkBg: "rgba(5,150,105,0.15)",
        actionLabel: "🛂 View AI Visa Success Guide",
        actionType: "navigate",
        target: "visa",
        timeframes: {
            fall: "July – August (Urgent Processing)",
            spring: "November – December (Urgent Processing)",
            summer: "March – April (Urgent Processing)"
        }
    },
    {
        id: "7",
        title: "Pre‑Departure & Travel Prep",
        description: "Arrange student accommodation, book budget flights, pack essentials, and attend pre‑departure orientation briefings.",
        order: 7,
        icon: Plane,
        color: "#2563eb",
        lightBg: "#eff6ff",
        darkBg: "rgba(37,99,235,0.15)",
        actionLabel: "✈️ Unlock AI Pre-Departure Checklist",
        actionType: "modal",
        target: "departure",
        timeframes: {
            fall: "August – September (Boarding)",
            spring: "December – January (Boarding)",
            summer: "April – May (Boarding)"
        }
    }
];

export function ApplicationTimeline({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const isDark = true;
    const theme = darkTheme;

    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem("scholariq_timeline_steps");
        return saved ? JSON.parse(saved) : {};
    });

    const [selectedIntake, setSelectedIntake] = useState<'fall' | 'spring' | 'summer'>('fall');
    const [isSyncActive, setIsSyncActive] = useState(() => {
        return localStorage.getItem("scholariq_timeline_sync") === "true";
    });
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        localStorage.setItem("scholariq_timeline_steps", JSON.stringify(completedSteps));
    }, [completedSteps]);

    useEffect(() => {
        localStorage.setItem("scholariq_timeline_sync", isSyncActive.toString());
    }, [isSyncActive]);

    const toggleStep = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleActionClick = (step: TimelineStepEx, e: React.MouseEvent) => {
        e.stopPropagation();
        if (step.actionType === 'navigate') {
            onNavigate(step.target);
        } else {
            setActiveModal(step.target);
            setCopied(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / TIMELINE_STEPS.length) * 100);
    const firstIncomplete = TIMELINE_STEPS.find(step => !completedSteps[step.id]);
    const currentStepId = firstIncomplete ? firstIncomplete.id : null;

    // Modal Content Templates
    const LOR_TEMPLATE = `Subject: Formal Request for Recommendation Letter - [Your Name]

Dear Professor [Last Name],

I hope this email finds you well. I am preparing to apply for the [Scholarship/Master's Program Name] at [University Name] for the upcoming intake, and I am reaching out to ask if you would be willing to provide a strong letter of recommendation on my behalf.

Having taken your course in [Course Name] where I secured [Grade/GPA], and having greatly benefited from your mentorship during [Project/Thesis Name], your endorsement would be immensely valuable for my application.

To make the writing process as seamless as possible, I have attached my updated CV, my academic transcripts, and a bulleted list of my key academic achievements and projects under your supervision.

The submission deadline is [Date]. Please let me know if you are able to support my application, and I would be delighted to provide any additional information or meet during your office hours.

Sincerely,
[Your Name]
[Student ID]
[Contact Info]`;

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: "'Inter', sans-serif" }}>
            <div className="hidden lg:block">
                <Sidebar onNavigate={onNavigate} currentPage="timeline" />
            </div>
            <div className="hidden lg:block shrink-0 w-64 min-w-64" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="px-8 py-5 flex items-center justify-between border-b" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border, zIndex: 30 }}>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)" }}>
                                <Calendar size={22} style={{ color: "#fff" }} />
                            </div>
                            <h1 className="text-2xl font-black" style={{ color: theme.text, letterSpacing: '-0.02em' }}>AI Dynamic Scholarship Chrono-Engine</h1>
                        </div>
                        <p className="text-sm ml-13" style={{ color: theme.textSecondary }}>Live intake tracking, automated reminder sync, and actionable milestone co-pilots</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button
                            onClick={() => onNavigate('dashboard')}
                            className="rounded-xl font-bold text-white border-none shadow-lg hover:opacity-90 transition-opacity"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            ← Back to Dashboard
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar" style={{ backgroundColor: theme.bg }}>
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* ================= DYNAMIC INTAKE SELECTOR & AI CHRONO-SYNC BANNER ================= */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8))',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '28px',
                            padding: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px',
                            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <Sparkles size={16} /> Dynamic Target Calibrator
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', background: isSyncActive ? '#10b981' : '#f59e0b', borderRadius: '50%', boxShadow: isSyncActive ? '0 0 10px #10b981' : '0 0 10px #f59e0b' }} />
                                        <span style={{ fontSize: '11px', fontWeight: '800', color: isSyncActive ? '#10b981' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {isSyncActive ? 'AI Auto-Notify Active' : 'Auto-Notify Standby'}
                                        </span>
                                    </div>
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                    Select Your Global Intake Target
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                                    Switching your intake dynamically re-aligns every milestone deadline in real-time. Activate AI sync to receive prompt notifications 48 hours before critical cutoffs.
                                </p>
                            </div>

                            {/* Intake Tabs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {[
                                    { id: 'fall', name: '🍁 Fall Intake (Sept)', desc: 'Primary global intake window' },
                                    { id: 'spring', name: '🌸 Spring Intake (Jan)', desc: 'Secondary intake window' },
                                    { id: 'summer', name: '☀️ Summer Intake (May)', desc: 'Specialized & research programs' }
                                ].map((intake) => {
                                    const isSelected = selectedIntake === intake.id;
                                    return (
                                        <div
                                            key={intake.id}
                                            onClick={() => setSelectedIntake(intake.id as any)}
                                            style={{
                                                background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))' : 'rgba(255,255,255,0.02)',
                                                border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '20px',
                                                padding: '20px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                transition: 'all 0.2s',
                                                boxShadow: isSelected ? '0 10px 25px -5px rgba(99, 102, 241, 0.3)' : 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <h4 style={{ fontSize: '16px', fontWeight: '800', color: isSelected ? '#white' : '#cbd5e1', margin: 0 }}>
                                                    {intake.name}
                                                </h4>
                                                {isSelected && <CheckCircle2 size={18} color="#818cf8" />}
                                            </div>
                                            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{intake.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sync Engine Box */}
                            <div style={{
                                background: isSyncActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                border: isSyncActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '22px',
                                padding: '24px 30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '24px',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        padding: '14px',
                                        background: isSyncActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                        borderRadius: '18px',
                                        color: isSyncActive ? '#10b981' : '#94a3b8'
                                    }}>
                                        <Zap size={26} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: isSyncActive ? '#10b981' : 'white', margin: '0 0 6px 0' }}>
                                            {isSyncActive ? 'AI Smart Synchronization is Active' : 'Enable AI Chrono-Notification Sync'}
                                        </h4>
                                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                                            {isSyncActive 
                                                ? 'Your timeline is securely hooked to our backend scheduler. Prompt alerts will automatically trigger 48 hours prior to each deadline.'
                                                : 'Securely hook your scholarship timeline to our automated task engine for seamless email alerts 48 hours before key milestones.'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsSyncActive(!isSyncActive)}
                                    style={{
                                        background: isSyncActive ? '#ef4444' : 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '14px',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        boxShadow: isSyncActive ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(16, 185, 129, 0.4)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isSyncActive ? 'Disconnect Sync' : '⚡ Sync AI Alerts'}
                                </button>
                            </div>
                        </div>

                        {/* Progress Card */}
                        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-semibold mb-0.5" style={{ color: theme.textSecondary }}>Timeline Progress</p>
                                    <p className="text-2xl font-black" style={{ color: theme.text }}>{completedCount} of {TIMELINE_STEPS.length} milestones complete</p>
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
                                    <span className="font-bold text-sm">🎉 Excellent! You have successfully mastered your entire application timeline!</span>
                                </div>
                            )}
                        </div>

                        {/* Steps */}
                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-[27px] top-10 bottom-10 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg, #6366f1, #8b5cf6, #06b6d4)" }} />

                            <div className="space-y-6">
                                {TIMELINE_STEPS.map((step) => {
                                    const isCompleted = !!completedSteps[step.id];
                                    const isCurrent = step.id === currentStepId;
                                    const StepIcon = step.icon;
                                    const currentTimeframe = step.timeframes[selectedIntake];

                                    return (
                                        <div key={step.id} className="flex items-start gap-5">
                                            {/* Circle */}
                                            <div
                                                onClick={(e) => toggleStep(step.id, e)}
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
                                                className="flex-1 rounded-3xl p-6 transition-all duration-300"
                                                style={isCompleted
                                                    ? { backgroundColor: isDark ? "rgba(16,185,129,0.05)" : "#f0fdf4", border: "2px solid #10b981" }
                                                    : isCurrent
                                                        ? { backgroundColor: isDark ? step.darkBg : step.lightBg, border: `2px solid ${step.color}`, boxShadow: `0 4px 25px ${step.color}22` }
                                                        : { backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }
                                                }
                                            >
                                                <div className="flex flex-col gap-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="w-7 h-7 rounded-full text-xs font-black flex items-center justify-center text-white" style={{ backgroundColor: isCompleted ? "#10b981" : isCurrent ? step.color : isDark ? "#4b5563" : "#d1d5db" }}>
                                                                    {step.order}
                                                                </span>
                                                                <h3 className="font-black text-xl" style={{ color: isCompleted ? "#10b981" : isCurrent ? step.color : theme.text, letterSpacing: '-0.01em' }}>
                                                                    {step.title}
                                                                </h3>
                                                                {isCompleted && <CheckCircle2 size={18} style={{ color: "#10b981" }} />}
                                                            </div>
                                                            <p className="text-base leading-relaxed" style={{ color: theme.textSecondary }}>{step.description}</p>
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                                            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                                                                style={isCompleted
                                                                    ? { backgroundColor: "#d1fae5", color: "#065f46" }
                                                                    : isCurrent
                                                                        ? { backgroundColor: isDark ? step.darkBg : step.lightBg, color: step.color, border: `1px solid ${step.color}55` }
                                                                        : { backgroundColor: isDark ? "#1f2937" : "#f3f4f6", color: theme.textSecondary }
                                                                }
                                                            >
                                                                <Clock size={12} />
                                                                {currentTimeframe}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => toggleStep(step.id, e)}
                                                                className="text-xs font-bold flex items-center gap-1 px-3.5 py-1.5 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" 
                                                                style={{ backgroundColor: isCompleted ? "#d1fae5" : isDark ? "#1f2937" : "#f3f4f6", color: isCompleted ? "#065f46" : isCurrent ? step.color : theme.textSecondary }}
                                                            >
                                                                {isCompleted ? "Completed (Click to Revert)" : isCurrent ? "Mark Complete" : "Complete"} <ChevronRight size={12} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* AI Interactive Widget Button */}
                                                    <div style={{
                                                        paddingTop: '16px',
                                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between'
                                                    }}>
                                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '700' }}>
                                                            {step.actionType === 'navigate' ? '🔗 Integrated Feature Link' : '💡 AI Assist Co-Pilot'}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => handleActionClick(step, e)}
                                                            style={{
                                                                background: isCurrent ? `linear-gradient(135deg, ${step.color}, #4f46e5)` : 'rgba(255,255,255,0.05)',
                                                                color: isCurrent ? 'white' : '#cbd5e1',
                                                                border: isCurrent ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                                padding: '10px 20px',
                                                                borderRadius: '14px',
                                                                fontWeight: '800',
                                                                fontSize: '13px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                boxShadow: isCurrent ? `0 4px 15px ${step.color}44` : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!isCurrent) {
                                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                                                    e.currentTarget.style.color = 'white';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!isCurrent) {
                                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                                    e.currentTarget.style.color = '#cbd5e1';
                                                                }
                                                            }}
                                                        >
                                                            {step.actionLabel}
                                                            <ExternalLink size={15} />
                                                        </button>
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
                                💡 <strong>Tip:</strong> Use the AI Co-Pilot widgets in each milestone to automatically generate emails, practice interviews, and track live documents.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            {/* ================= INTERACTIVE AI POPUP MODALS ================= */}
            {activeModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '28px',
                        width: '100%',
                        maxWidth: '680px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '24px 32px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', color: '#818cf8' }}>
                                    {activeModal === 'lor' ? <Mail size={24} /> : activeModal === 'interview' ? <MessageSquare size={24} /> : <BookOpen size={24} />}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>
                                    {activeModal === 'lor' && 'AI LOR Request Template'}
                                    {activeModal === 'interview' && 'Top 5 Scholarship Interview Questions'}
                                    {activeModal === 'departure' && 'AI Pre-Departure & Travel Success Blueprint'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setActiveModal(null)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '36px', height: '36px', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {activeModal === 'lor' && (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                                        Copy this professionally formatted AI template to request a letter of recommendation from your academic professors or supervisors. Be sure to replace the bracketed information.
                                    </p>
                                    <div style={{ position: 'relative' }}>
                                        <pre style={{
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '20px',
                                            padding: '24px',
                                            color: '#cbd5e1',
                                            fontSize: '13px',
                                            lineHeight: '1.7',
                                            overflowX: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: "'Inter', sans-serif"
                                        }}>
                                            {LOR_TEMPLATE}
                                        </pre>
                                        <button 
                                            onClick={() => copyToClipboard(LOR_TEMPLATE)}
                                            style={{
                                                position: 'absolute',
                                                top: '16px',
                                                right: '16px',
                                                background: copied ? '#10b981' : '#4f46e5',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <Copy size={14} /> {copied ? 'Copied!' : 'Copy Template'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {activeModal === 'interview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                                        These are the top 5 high-frequency questions calibrated by our AI engine from over 10,000 global scholarship interviews, complete with expert answering strategies.
                                    </p>
                                    {[
                                        { q: "1. Tell us about yourself and your passion for this field.", a: "Focus on your academic trajectory, a defining moment that sparked your interest, and how your future goals align with the scholarship's mission." },
                                        { q: "2. Why did you choose this specific university and country?", a: "Mention specific research labs, prominent faculty members, specialized curriculum, and the cultural or academic edge the destination provides." },
                                        { q: "3. How will you contribute to your home country upon return?", a: "Scholarship committees want impact. Describe a tangible problem in your home country and how the skills you acquire will help solve it." },
                                        { q: "4. Describe a challenge you overcame and what you learned.", a: "Use the STAR method (Situation, Task, Action, Result). Highlight resilience, leadership, and adaptability." },
                                        { q: "5. Why are you the most deserving candidate for this scholarship?", a: "Synthesize your academic excellence, unique leadership experiences, and clear future vision. Show them you are an investment, not an expense." }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#818cf8', margin: 0 }}>{item.q}</h4>
                                            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>💡 <b>AI Strategy:</b> {item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeModal === 'departure' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                                        Ensure a smooth, stress-free relocation to your university destination by strictly adhering to this pre-departure checklist.
                                    </p>
                                    {[
                                        { title: "🛂 Core Travel Documents", items: ["Valid Passport with Student Visa attached", "Original Unconditional Offer Letter", "Proof of Funding / Bank Statements", "Accommodation Confirmation Letter"] },
                                        { title: "💳 Financial Preparation", items: ["Sufficient local currency (approx. $500-$1000 cash)", "International Multi-currency Debit/Credit Card", "Understand how to open a local student bank account upon arrival"] },
                                        { title: "🎒 Academic & Electronics", items: ["Laptop with universal charging adapters", "Copies of all original academic degrees and transcripts", "Essential prescription medicines with doctor's prescription note"] }
                                    ].map((block, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', margin: 0 }}>{block.title}</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {block.items.map((it, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '13px' }}>
                                                        <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} /> {it}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setActiveModal(null)}
                                style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApplicationTimeline;

import { useState, useEffect } from "react";
import { 
    User, 
    Mail, 
    FileText, 
    Send, 
    Bell, 
    Globe, 
    Plane, 
    Check
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";

interface TimelineStep {
    id: string;
    title: string;
    description: string;
    timeframe: string;
    order: number;
    icon: React.FC<any>;
}

const TIMELINE_STEPS: TimelineStep[] = [
    {
        id: "1",
        title: "Gather Personal Documents",
        timeframe: "4–6 weeks before deadline",
        description: "Collect passport, CNIC, photos, transcripts, and other core identity documents.",
        order: 1,
        icon: User
    },
    {
        id: "2",
        title: "Request Recommendation Letters",
        timeframe: "6–8 weeks before deadline",
        description: "Email professors or supervisors early and give them clear guidance and deadlines.",
        order: 2,
        icon: Mail
    },
    {
        id: "3",
        title: "Write SOP / Personal Statement",
        timeframe: "4 weeks before deadline",
        description: "Draft, review, and refine your main application essay.",
        order: 3,
        icon: FileText
    },
    {
        id: "4",
        title: "Submit Scholarship Applications",
        timeframe: "On or before deadline",
        description: "Complete online forms, upload documents, and double‑check everything before submitting.",
        order: 4,
        icon: Send
    },
    {
        id: "5",
        title: "Wait for Offer Letters",
        timeframe: "4–12 weeks after submission",
        description: "Monitor email and portals for interview calls and scholarship decisions.",
        order: 5,
        icon: Bell
    },
    {
        id: "6",
        title: "Apply for Student Visa",
        timeframe: "8–12 weeks before course start",
        description: "Use your offer letter to book biometrics, pay visa fee, and upload required visa documents.",
        order: 6,
        icon: Globe
    },
    {
        id: "7",
        title: "Pre‑Departure & Travel Prep",
        timeframe: "2–4 weeks before travel",
        description: "Arrange accommodation, book flights, and attend any pre‑departure briefings.",
        order: 7,
        icon: Plane
    }
];

export function ApplicationTimeline({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem("scholariq_timeline_steps");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem("scholariq_timeline_steps", JSON.stringify(completedSteps));
    }, [completedSteps]);

    const toggleStep = (id: string) => {
        setCompletedSteps(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const progressPercent = Math.round((completedCount / TIMELINE_STEPS.length) * 100);

    const firstIncomplete = TIMELINE_STEPS.find(step => !completedSteps[step.id]);
    const currentStepId = firstIncomplete ? firstIncomplete.id : null;

    return (
        <div className="min-h-screen flex font-sans timeline-bg">
            <div className="hidden lg:block no-print">
                <Sidebar onNavigate={onNavigate} currentPage="timeline" />
            </div>
            <div className="hidden lg:block shrink-0 no-print w-64 min-w-64" />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="no-print px-8 py-4 flex items-center justify-between z-10 timeline-header-bg">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">Application Timeline</h1>
                        <p className="text-sm font-medium text-slate-400">
                            Track your scholarship journey from documents to visa.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button 
                            onClick={() => onNavigate('dashboard')}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold border-none px-5 py-2"
                        >
                            Operations Hub
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Progress Panel */}
                        <div className="p-6 rounded-3xl timeline-panel shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black px-3.5 py-1.5 rounded-full border tracking-wide uppercase timeline-pill">
                                    {completedCount} of 7 steps complete
                                </span>
                                <span className="text-xl font-black text-blue-400">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full overflow-hidden timeline-progress-track">
                                <div className="h-full timeline-progress-bar transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>

                        {/* Roadmap Steps */}
                        <div className="relative pl-12 sm:pl-16 space-y-6">
                            {/* High contrast vertical progress indicator */}
                            <div className="absolute left-6 sm:left-8 top-4 bottom-4 w-1 rounded-full timeline-vertical-line" />

                            {TIMELINE_STEPS.map((step) => {
                                const isCompleted = !!completedSteps[step.id];
                                const isCurrent = step.id === currentStepId;

                                return (
                                    <div key={step.id} className="relative flex flex-col md:flex-row md:items-start gap-4 group">
                                        {/* Left Side Status Indicator */}
                                        <div 
                                            onClick={() => toggleStep(step.id)}
                                            className={`absolute -left-12 sm:-left-16 top-1 w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 z-10 ${
                                                isCompleted 
                                                    ? 'timeline-circle-completed scale-105' 
                                                    : isCurrent 
                                                        ? 'timeline-circle-current scale-110 ring-4 ring-blue-500/25 animate-pulse' 
                                                        : 'timeline-circle-remaining'
                                            }`}
                                        >
                                            {isCompleted ? <Check size={20} className="stroke-[3px]" /> : <span className="text-sm font-black">{step.order}</span>}
                                        </div>

                                        {/* Right Side Content Card */}
                                        <div 
                                            onClick={() => toggleStep(step.id)}
                                            className={`flex-1 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                                isCompleted 
                                                    ? 'timeline-card-completed' 
                                                    : isCurrent 
                                                        ? 'timeline-card-current scale-[1.01]' 
                                                        : 'timeline-card-remaining'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <step.icon size={18} className={isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-slate-500'} />
                                                        <h3 className={`font-black text-base ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-400'}`}>
                                                            {step.title}
                                                        </h3>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed ${isCompleted ? 'text-slate-300' : isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>{step.description}</p>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-full self-start sm:self-center border ${
                                                    isCompleted 
                                                        ? 'timeline-badge-completed' 
                                                        : isCurrent 
                                                            ? 'timeline-badge-current' 
                                                            : 'timeline-badge-remaining'
                                                }`}>
                                                    {step.timeframe}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
            <style>{`
                .timeline-bg {
                    background-color: #0f172a !important;
                    color: #ffffff !important;
                }
                .timeline-header-bg {
                    background-color: rgba(15, 23, 42, 0.8) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(12px) !important;
                }
                .timeline-panel {
                    background-color: rgba(30, 41, 59, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(12px) !important;
                }
                .timeline-pill {
                    background-color: rgba(59, 130, 246, 0.1) !important;
                    color: #60a5fa !important;
                    border: 1px solid rgba(59, 130, 246, 0.3) !important;
                }
                .timeline-progress-track {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                .timeline-progress-bar {
                    background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%) !important;
                }
                .timeline-vertical-line {
                    background: linear-gradient(180deg, #3b82f6 0%, #6366f1 50%, rgba(255, 255, 255, 0.1) 100%) !important;
                    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4) !important;
                }

                /* Card States */
                .timeline-card-completed {
                    background-color: rgba(16, 185, 129, 0.08) !important;
                    border: 1px solid rgba(16, 185, 129, 0.25) !important;
                    border-left: 4px solid #10b981 !important;
                    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05) !important;
                }
                .timeline-card-completed:hover {
                    background-color: rgba(16, 185, 129, 0.12) !important;
                }
                .timeline-card-current {
                    background-color: rgba(30, 41, 59, 0.9) !important;
                    border: 2px solid #3b82f6 !important;
                    box-shadow: 0 0 25px rgba(59, 130, 246, 0.25) !important;
                }
                .timeline-card-current:hover {
                    background-color: rgba(30, 41, 59, 1) !important;
                }
                .timeline-card-remaining {
                    background-color: rgba(30, 41, 59, 0.3) !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .timeline-card-remaining:hover {
                    background-color: rgba(30, 41, 59, 0.5) !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }

                /* Circle States */
                .timeline-circle-completed {
                    background-color: #10b981 !important;
                    border-color: #10b981 !important;
                    color: #ffffff !important;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4) !important;
                }
                .timeline-circle-current {
                    background-color: #3b82f6 !important;
                    border-color: #3b82f6 !important;
                    color: #ffffff !important;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5) !important;
                }
                .timeline-circle-remaining {
                    background-color: #1e293b !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    color: #64748b !important;
                }
                .timeline-circle-remaining:hover {
                    border-color: rgba(255, 255, 255, 0.2) !important;
                    color: #94a3b8 !important;
                }

                /* Badge States */
                .timeline-badge-completed {
                    background-color: rgba(16, 185, 129, 0.15) !important;
                    color: #34d399 !important;
                    border: 1px solid rgba(16, 185, 129, 0.3) !important;
                }
                .timeline-badge-current {
                    background-color: rgba(59, 130, 246, 0.2) !important;
                    color: #93c5fd !important;
                    border: 1px solid rgba(59, 130, 246, 0.4) !important;
                }
                .timeline-badge-remaining {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    color: #94a3b8 !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                }

                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
            `}</style>
        </div>
    );
}

export default ApplicationTimeline;

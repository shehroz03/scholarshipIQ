import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap, Loader2, Circle, Sparkles,
    Search as SearchIcon, User, MessageSquare, Wallet, FileText, Check
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { ThemeToggle } from "./ThemeToggle";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";

interface DocumentItem {
    id: string;
    name: string;
    whyNeeded: string;
    prepTime: string;
}

interface DocumentCategory {
    id: string;
    title: string;
    icon: React.FC<any>;
    items: DocumentItem[];
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
    {
        id: "personal",
        title: "Personal Documents",
        icon: User,
        items: [
            { id: "passport", name: "Passport (Valid for 6+ months)", whyNeeded: "Required for all visa applications", prepTime: "1-2 weeks" },
            { id: "cnic", name: "National ID Card / CNIC", whyNeeded: "Identity verification", prepTime: "1 day" },
            { id: "photos", name: "4x Passport Photos (white background)", whyNeeded: "Visa and university requirements", prepTime: "1 day" }
        ]
    },
    {
        id: "academic",
        title: "Academic Documents",
        icon: GraduationCap,
        items: [
            { id: "intermediate", name: "Intermediate / A-Level Transcripts", whyNeeded: "Academic eligibility proof", prepTime: "1-2 weeks" },
            { id: "bachelor", name: "Bachelor Degree Certificate", whyNeeded: "Proof of highest qualification", prepTime: "1-2 weeks" },
            { id: "transcripts", name: "Official Transcripts (all semesters)", whyNeeded: "Required by most universities", prepTime: "1-2 weeks" },
            { id: "cv", name: "CV / Resume", whyNeeded: "Shows academic and professional background", prepTime: "3-5 days" }
        ]
    },
    {
        id: "language",
        title: "Language Proficiency",
        icon: MessageSquare,
        items: [
            { id: "ielts", name: "IELTS / TOEFL Certificate (6.0+)", whyNeeded: "English proficiency requirement", prepTime: "2-3 months" },
            { id: "language_waiver", name: "Language Waiver (if applicable)", whyNeeded: "Some universities accept alternatives", prepTime: "1 week" }
        ]
    },
    {
        id: "financial",
        title: "Financial Documents",
        icon: Wallet,
        items: [
            { id: "bank_statement", name: "Bank Statement (last 6 months)", whyNeeded: "Proof of funds for visa", prepTime: "1 week" },
            { id: "scholarship_award", name: "Scholarship Award Letter (if any)", whyNeeded: "Reduces financial burden proof", prepTime: "depends on scholarship" },
            { id: "affidavit", name: "Affidavit of Support (if sponsored)", whyNeeded: "Proves financial sponsor exists", prepTime: "3-5 days" }
        ]
    },
    {
        id: "essays",
        title: "Application Essays",
        icon: FileText,
        items: [
            { id: "sop", name: "Statement of Purpose (SOP)", whyNeeded: "Core application essay, most important", prepTime: "3-4 weeks" },
            { id: "personal_statement", name: "Personal Statement", whyNeeded: "Required by many UK and EU universities", prepTime: "2-3 weeks" },
            { id: "lor", name: "2x Recommendation Letters (LOR)", whyNeeded: "Academic references required", prepTime: "4-6 weeks (request early)" }
        ]
    }
];

export function DocumentChecklistPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const navigate = useNavigate();
    const { status: userStatus, loading: loadingUser } = useUser();
    const isDark = true;

    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem("scholariq_doc_checklist");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem("scholariq_doc_checklist", JSON.stringify(checkedItems));
    }, [checkedItems]);

    if (loadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    const handleExport = () => {
        window.print();
    };

    const toggleItem = (id: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const totalDocuments = DOCUMENT_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedDocuments = Object.values(checkedItems).filter(Boolean).length;
    const progressPercent = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

    let progressColor = "text-blue-500";
    let progressBg = "bg-blue-500";
    let progressHex = "#3b82f6";
    if (progressPercent >= 100) {
        progressColor = "text-emerald-500";
        progressBg = "bg-emerald-500";
        progressHex = "#10b981";
    } else if (progressPercent >= 50) {
        progressColor = "text-amber-500";
        progressBg = "bg-amber-500";
        progressHex = "#f59e0b";
    }

    const isAllComplete = progressPercent === 100;

    return (
        <div className={`min-h-screen flex font-sans ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="hidden lg:block no-print">
                <Sidebar onNavigate={onNavigate} currentPage="checklist" />
            </div>
            <div className="hidden lg:block shrink-0 no-print" style={{ width: '260px', minWidth: '260px' }} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className={`no-print px-8 py-4 flex items-center justify-between border-b z-10 backdrop-blur-md ${isDark ? 'bg-gray-900 bg-opacity-80 border-gray-800' : 'bg-white bg-opacity-80 border-gray-200'}`}>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Smart Document Tracker</h1>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Interactive application document roadmap.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${isDark ? 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-20' : 'bg-green-50 border-green-200'}`}>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">AI Active</span>
                        </div>
                        <Button 
                            onClick={() => onNavigate('search')} 
                            className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold border-none px-5 py-2 hidden sm:flex items-center gap-2"
                        >
                            <SearchIcon size={16} />
                            Find New
                        </Button>
                        <Button 
                            onClick={handleExport}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold border-none px-5 py-2"
                        >
                            Export PDF
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center gap-6 sm:gap-8 ${isDark ? 'bg-gray-800 border-gray-700 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]' : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                            <div className="relative w-32 h-32 shrink-0">
                                <svg viewBox="0 0 36 36" className="w-32 h-32 drop-shadow-md">
                                    <circle cx="18" cy="18" r="16" fill="none" style={{ stroke: isDark ? '#1f2937' : '#f3f4f6' }} strokeWidth="3" />
                                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" 
                                        strokeDasharray={2 * Math.PI * 16} 
                                        strokeDashoffset={(2 * Math.PI * 16) * (1 - progressPercent / 100)} 
                                        strokeLinecap="round" transform="rotate(-90 18 18)" 
                                        style={{ stroke: progressHex, transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-3xl font-black leading-none">{progressPercent}%</div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${progressColor}`}>Ready</div>
                                </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-2xl font-black mb-2 tracking-tight">Application Readiness</h2>
                                <p className={`font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {completedDocuments} of {totalDocuments} documents ready. Check off items as you prepare them. Your progress is saved automatically.
                                </p>
                                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className={`h-full ${progressBg} transition-all duration-500 ease-out`} style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                        </div>

                        {isAllComplete && (
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-green-500 to-green-600 text-white flex flex-col items-center justify-center text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white/20 p-3 rounded-full mb-4">
                                    <Sparkles size={32} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black mb-2">You're application-ready! 🎉</h2>
                                <p className="font-medium text-emerald-50">All required documents have been prepared. You are ready to submit your applications.</p>
                            </div>
                        )}

                        <div className="space-y-8">
                            {DOCUMENT_CATEGORIES.map(category => {
                                const catCompleted = category.items.filter(item => checkedItems[item.id]).length;
                                const isCatComplete = catCompleted === category.items.length;
                                
                                return (
                                    <div key={category.id} className="space-y-4">
                                        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-gray-900 bg-opacity-90 border-gray-800' : 'bg-white bg-opacity-90 border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500 bg-opacity-10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                    <category.icon size={20} />
                                                </div>
                                                <h3 className="text-lg font-bold">{category.title}</h3>
                                            </div>
                                            <div className={`text-xs font-bold px-3 py-1 rounded-full border ${isCatComplete ? 'bg-green-500 bg-opacity-10 text-green-500 border-green-500 border-opacity-20' : isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {catCompleted} / {category.items.length} complete
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {category.items.map(item => {
                                                const isChecked = checkedItems[item.id] || false;
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => toggleItem(item.id)}
                                                        className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} ${isChecked ? (isDark ? 'border-l-4 border-l-green-500 bg-green-500 bg-opacity-5' : 'border-l-4 border-l-green-500 bg-green-50') : 'border-l-4 border-l-transparent'}`}
                                                    >
                                                        <div className="shrink-0 flex items-center justify-center transition-colors">
                                                            {isChecked ? (
                                                                <div className="bg-green-500 rounded-full p-1 shadow-md">
                                                                    <Check size={20} className="text-white" />
                                                                </div>
                                                            ) : (
                                                                <Circle size={28} className={isDark ? 'text-gray-600 group-hover:text-gray-500' : 'text-gray-300 group-hover:text-gray-400'} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                <h4 className={`font-bold truncate ${isChecked ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                                                                    {item.name}
                                                                </h4>
                                                                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full w-fit ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {item.prepTime}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm mt-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {item.whyNeeded}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default DocumentChecklistPage;

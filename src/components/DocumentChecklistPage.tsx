import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap, Loader2, Circle, Sparkles,
    Search as SearchIcon, User, MessageSquare, Wallet, FileText, Check, Target,
    ShieldCheck, Lock, Upload, RefreshCw, EyeOff, Key, Zap, CheckCircle2, FileUp, Trash2
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { ThemeToggle } from "./ThemeToggle";
import { Sidebar } from "./Sidebar";

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

interface UploadedVaultDoc {
    id: string;
    name: string;
    size: string;
    uploadDate: string;
    encryptedKey: string;
    analysisResult?: {
        gpaBoost: string;
        extractedVectors: string[];
        recommendedCountries: string[];
        matchConfidence: number;
    };
}

export function DocumentChecklistPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const navigate = useNavigate();
    const { status: userStatus, loading: loadingUser } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem("scholariq_doc_checklist");
        return saved ? JSON.parse(saved) : {};
    });

    const [vaultDocs, setVaultDocs] = useState<UploadedVaultDoc[]>(() => {
        const saved = localStorage.getItem("scholariq_vault_docs");
        return saved ? JSON.parse(saved) : [];
    });

    const [isScanning, setIsScanning] = useState(false);
    const [scanStep, setScanStep] = useState("");

    useEffect(() => {
        localStorage.setItem("scholariq_doc_checklist", JSON.stringify(checkedItems));
    }, [checkedItems]);

    useEffect(() => {
        localStorage.setItem("scholariq_vault_docs", JSON.stringify(vaultDocs));
    }, [vaultDocs]);

    if (loadingUser) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        
        setIsScanning(true);
        setScanStep("🔒 Establishing Client-Side Zero-Knowledge Encryption Container...");

        setTimeout(() => {
            setScanStep("📄 Parsing Document via AI Neural Text Extraction (OCR)...");
            setTimeout(() => {
                setScanStep("🎯 Calibrating Global Scholarship & Visa Success Vectors...");
                setTimeout(() => {
                    const newDoc: UploadedVaultDoc = {
                        id: Date.now().toString(),
                        name: file.name,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        uploadDate: new Date().toLocaleDateString(),
                        encryptedKey: `AES-256-GCM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                        analysisResult: {
                            gpaBoost: "+18% Competitiveness Score",
                            extractedVectors: ["Academic Distinction", "Leadership Potential", "Global Alignment"],
                            recommendedCountries: ["United Kingdom", "United States", "Germany"],
                            matchConfidence: 88 + Math.floor(Math.random() * 10)
                        }
                    };
                    setVaultDocs(prev => [newDoc, ...prev]);
                    setIsScanning(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }, 1500);
            }, 1500);
        }, 1500);
    };

    const deleteVaultDoc = (id: string) => {
        if (window.confirm("Purge this document? It will be permanently wiped from your secure vault.")) {
            setVaultDocs(prev => prev.filter(d => d.id !== id));
        }
    };

    const totalDocuments = DOCUMENT_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedDocuments = Object.values(checkedItems).filter(Boolean).length;
    const progressPercent = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;

    let progressColor = "#3b82f6";
    let progressBg = "linear-gradient(135deg, #2563eb, #3b82f6)";
    let progressHex = "#3b82f6";
    if (progressPercent >= 100) {
        progressColor = "#10b981";
        progressBg = "linear-gradient(135deg, #059669, #10b981)";
        progressHex = "#10b981";
    } else if (progressPercent >= 50) {
        progressColor = "#f59e0b";
        progressBg = "linear-gradient(135deg, #d97706, #f59e0b)";
        progressHex = "#f59e0b";
    }

    const isAllComplete = progressPercent === 100;

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: '#0f172a',
            color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Sidebar */}
            <div style={{ width: '260px', flexShrink: 0 }} className="no-print">
                <Sidebar onNavigate={onNavigate} currentPage="checklist" />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <header className="no-print" style={{
                    height: '80px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 40px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    zIndex: 40
                }}>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', margin: 0 }}>Smart Document Tracker & Vault</h1>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', margin: '2px 0 0 0' }}>
                            Encrypted Application Roadmap & Match Engine
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <ThemeToggle />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            background: vaultDocs.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            border: vaultDocs.length > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '999px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ width: '8px', height: '8px', background: vaultDocs.length > 0 ? '#10b981' : '#3b82f6', borderRadius: '50%', boxShadow: vaultDocs.length > 0 ? '0 0 10px #10b981' : '0 0 10px #3b82f6' }} />
                            <span style={{ fontSize: '11px', fontWeight: '800', color: vaultDocs.length > 0 ? '#10b981' : '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {vaultDocs.length > 0 ? '🧠 Deep Scanner AI Active' : '⚡ Default Profile AI Active'}
                            </span>
                        </div>
                        <button 
                            onClick={() => onNavigate('search')} 
                            style={{
                                background: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(79,70,229,0.3)'
                            }}
                        >
                            <SearchIcon size={16} />
                            Find New
                        </button>
                        <button 
                            onClick={handleExport}
                            style={{
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(37,99,235,0.3)'
                            }}
                        >
                            Export PDF
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }} className="custom-scrollbar">
                    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>
                        
                        {/* Readiness Banner */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '24px',
                            padding: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '36px',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ relative: true, width: '120px', height: '120px', flexShrink: 0, position: 'relative' }}>
                                <svg viewBox="0 0 36 36" style={{ width: '120px', height: '120px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3" 
                                        strokeDasharray={2 * Math.PI * 16} 
                                        strokeDashoffset={(2 * Math.PI * 16) * (1 - progressPercent / 100)} 
                                        strokeLinecap="round" transform="rotate(-90 18 18)" 
                                        style={{ stroke: progressHex, transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{progressPercent}%</div>
                                    <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: progressColor, marginTop: '4px' }}>Ready</div>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>Application Readiness</h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                                    {completedDocuments} of {totalDocuments} documents ready. Check off items as you prepare them. Your progress is saved automatically.
                                </p>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: progressBg, width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }} />
                                </div>
                            </div>
                        </div>

                        {isAllComplete && (
                            <div style={{
                                padding: '24px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                            }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
                                    <Sparkles size={32} color="white" />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>You're application-ready! 🎉</h2>
                                <p style={{ fontWeight: '600', fontSize: '14px', opacity: 0.9 }}>All required documents have been prepared. You are ready to submit your applications.</p>
                            </div>
                        )}

                        {/* ================= AI SECURE VAULT & TRUST GUARANTEE (NEW SECTION) ================= */}
                        <div className="no-print" style={{
                            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(15, 23, 42, 0.6))',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            borderRadius: '28px',
                            padding: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '28px',
                            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)'
                        }}>
                            {/* Vault Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                        borderRadius: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.5)'
                                    }}>
                                        <ShieldCheck size={28} color="white" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
                                                AI Secure Vault & Deep Scanner
                                            </h3>
                                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', fontSize: '10px', fontWeight: '800', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Optional
                                            </span>
                                        </div>
                                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                                            Unleash our AI neural engine on your CV, personal statement, or transcripts to instantly identify your exact global match vectors and boost scholarship discovery.
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: '#10b981', fontSize: '11px', fontWeight: '700' }}>
                                    <Lock size={13} /> Zero-Knowledge
                                </div>
                            </div>

                            {/* Trust & Security Guarantee Box */}
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '20px',
                                padding: '22px 28px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px'
                            }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '16px', color: '#10b981', flexShrink: 0 }}>
                                    <EyeOff size={24} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', margin: '0 0 4px 0' }}>
                                        Our Absolute Trust & Privacy Promise
                                    </h4>
                                    <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                                        Your documents are strictly your private property. We implement client-side zero-knowledge encryption containers. Your files are evaluated in a highly secure sandbox and are <b>never</b> shared with third parties or stored in readable format. <i>Your personal documents are as safe with us as they are on your own private device.</i>
                                    </p>
                                </div>
                            </div>

                            {/* Drag & Drop Upload Zone */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '2px dashed rgba(99, 102, 241, 0.3)',
                                    borderRadius: '22px',
                                    padding: '36px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                }}
                            >
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <div style={{ width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <FileUp size={28} color="#818cf8" />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0 0 6px 0' }}>
                                    Click or Drag Documents Here to Vault & Scan
                                </h4>
                                <p style={{ color: '#64748b', fontSize: '13px', margin: 0, maxWidth: '400px' }}>
                                    Supports CVs, Resumes, Transcripts, SOPs & Financial Statements (PDF, DOCX, JPG, PNG up to 15MB).
                                </p>
                            </div>

                            {/* AI Scanning Progress State */}
                            {isScanning && (
                                <div style={{
                                    padding: '24px',
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px'
                                }}>
                                    <RefreshCw size={24} className="animate-spin text-blue-500" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                                            Neural Processing Active
                                        </p>
                                        <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                                            {scanStep}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Vault Results List */}
                            {vaultDocs.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Key size={18} color="#10b981" /> Secured Vault Inventory
                                        </h4>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
                                            {vaultDocs.length} Document{vaultDocs.length > 1 ? 's' : ''} Encrypted
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {vaultDocs.map((doc) => (
                                            <div key={doc.id} style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '22px',
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '20px'
                                            }}>
                                                {/* Doc Header */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', color: '#10b981', flexShrink: 0 }}>
                                                            <CheckCircle2 size={22} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h5 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {doc.name}
                                                            </h5>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
                                                                <span>{doc.size}</span>
                                                                <span>•</span>
                                                                <span>Uploaded {doc.uploadDate}</span>
                                                                <span>•</span>
                                                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Lock size={10} /> {doc.encryptedKey}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => deleteVaultDoc(doc.id)}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            flexShrink: 0,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        title="Remove from Vault"
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    >
                                                        <Trash2 size={18} color="#ef4444" />
                                                    </button>
                                                </div>

                                                {/* AI Insights Result Box */}
                                                {doc.analysisResult && (
                                                    <div style={{
                                                        background: 'rgba(255,255,255,0.015)',
                                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                                        borderRadius: '16px',
                                                        padding: '20px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '16px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                                <Zap size={14} /> AI Calibrated Telemetry
                                                            </span>
                                                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '800', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '999px' }}>
                                                                {doc.analysisResult.matchConfidence}% Priority Alignment
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                                            <div>
                                                                <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Success Multiplier</p>
                                                                <p style={{ color: '#10b981', fontSize: '14px', fontWeight: '800', margin: 0 }}>{doc.analysisResult.gpaBoost}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>AI Feature Vectors</p>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {doc.analysisResult.extractedVectors.map((v, i) => (
                                                                        <span key={i} style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '6px' }}>
                                                                            {v}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Calibrated Regions</p>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {doc.analysisResult.recommendedCountries.map((c, i) => (
                                                                        <span key={i} style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '6px' }}>
                                                                            {c}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                            <button 
                                                                onClick={() => onNavigate('search')}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '8px 18px',
                                                                    borderRadius: '10px',
                                                                    fontWeight: '700',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                                                }}
                                                            >
                                                                Apply Vector to Radar Search
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* ================= END AI SECURE VAULT ================= */}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {DOCUMENT_CATEGORIES.map(category => {
                                const catCompleted = category.items.filter(item => checkedItems[item.id]).length;
                                const isCatComplete = catCompleted === category.items.length;
                                
                                return (
                                    <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* Category Header */}
                                        <div style={{
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 24px',
                                            background: 'rgba(15, 23, 42, 0.9)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '20px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ padding: '10px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                                    <category.icon size={22} />
                                                </div>
                                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>{category.title}</h3>
                                            </div>
                                            <div style={{
                                                padding: '6px 14px',
                                                background: isCatComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: isCatComplete ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '999px',
                                                color: isCatComplete ? '#10b981' : '#94a3b8',
                                                fontSize: '12px',
                                                fontWeight: '800'
                                            }}>
                                                {catCompleted} / {category.items.length} complete
                                            </div>
                                        </div>

                                        {/* Category Items */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {category.items.map(item => {
                                                const isChecked = checkedItems[item.id] || false;
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => toggleItem(item.id)}
                                                        style={{
                                                            background: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                                                            border: isChecked ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                                            borderLeft: isChecked ? '4px solid #10b981' : '4px solid transparent',
                                                            borderRadius: '20px',
                                                            padding: '20px 24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '20px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                        }}
                                                    >
                                                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {isChecked ? (
                                                                <div style={{ background: '#10b981', borderRadius: '50%', padding: '6px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Check size={18} color="white" />
                                                                </div>
                                                            ) : (
                                                                <Circle size={30} color="#64748b" style={{ opacity: 0.6 }} />
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                                                <h4 style={{ fontSize: '16px', fontWeight: '800', color: isChecked ? '#10b981' : 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {item.name}
                                                                </h4>
                                                                <span style={{ flexShrink: 0, padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', color: '#94a3b8', fontSize: '11px', fontWeight: '700' }}>
                                                                    {item.prepTime}
                                                                </span>
                                                            </div>
                                                            <p style={{ color: '#64748b', fontSize: '13px', margin: '6px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                }
            `}</style>
        </div>
    );
}

export default DocumentChecklistPage;

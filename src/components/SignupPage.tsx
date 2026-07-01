import { useState, useEffect, useRef } from "react";
import { Check, Loader2, AlertCircle, LogOut, Eye, EyeOff, GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { api } from "../api";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

export function SignupPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        nationality: "",
        currentDegree: "",
        major: "",
        specialization: "",
        target_country: "",
        target_degree: ""
    });
    // Teacher-specific fields
    const [teacherData, setTeacherData] = useState({
        bio: "",
        specializations: "IELTS",
        experience_years: 1,
        qualification: "",
        degree: "",
        institution: "",
        cv_url: "",
        cv_file_url: "",
        cv_filename: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [showTeacherPending, setShowTeacherPending] = useState(false);
    const [pendingRole, setPendingRole] = useState<"student" | "teacher">("student");
    const [otpValue, setOtpValue] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [pendingEmail, setPendingEmail] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setIsMounted(true);
        setUserLoggedIn(!!localStorage.getItem("token"));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUserLoggedIn(false);
        toast.success("Logged out");
        onNavigate('landing');
    };

    const features = [
        {
            title: 'AI-Powered Matching',
            description: 'Get personalized scholarship matches based on your background and target degree.',
        },
        {
            title: 'Verified Opportunities',
            description: 'Access only vetted, legitimate opportunities from trusted universities.',
        },
        {
            title: 'Track Everything',
            description: 'Save and track your applications and deadlines in one dashboard.',
        },
        {
            title: '24/7 AI Assistant',
            description: 'Get instant answers to your scholarship questions',
        },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            if (role === "teacher" && !teacherData.cv_url && !teacherData.cv_file_url) {
                setError("Please provide either a LinkedIn Profile URL or upload your CV — at least one is required.");
                setIsLoading(false);
                return;
            }
            // Register with role and teacher data if applicable
            await api.auth.register({
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                nationality: formData.nationality,
                current_degree: formData.currentDegree,
                major: formData.major,
                specialization: formData.specialization,
                target_country: formData.target_country,
                target_degree: formData.target_degree
            }, role, role === "teacher" ? teacherData : undefined);

            // Both teacher and student: show OTP screen to verify email
            setPendingEmail(formData.email);
            setPendingRole(role);
            setShowOtp(true);
            if (role === "teacher") {
                toast.success("Application submitted! Check your email for a 6-digit OTP to verify your email.");
            } else {
                toast.success("Account created! Check your email for the 6-digit OTP.");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const code = otpDigits.join("");
        if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }
        setOtpLoading(true);
        try {
            const res = await api.auth.verifyOtp(pendingEmail, code);
            if (res.requires_admin_approval) {
                // Teacher email verified but needs admin approval before login
                setShowOtp(false);
                setShowTeacherPending(true);
                toast.success("Email verified! Your application is now under review.");
                return;
            }
            localStorage.setItem("token", res.access_token);
            toast.success("Email verified! Welcome to ScholarIQ 🎉");
            onNavigate('dashboard', { autoSearch: true, filters: { level: formData.target_degree, country: formData.target_country, field: formData.major } });
        } catch (err: any) {
            toast.error(err.message || "Invalid OTP");
            setOtpDigits(["", "", "", "", "", ""]);
            otpRefs.current[0]?.focus();
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            await api.auth.resendOtp(pendingEmail);
            toast.success("New OTP sent to your email!");
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || "Failed to resend OTP");
        }
    };

    const handleOtpDigit = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const digit = value.slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        setOtpValue(next.join(""));
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!otpDigits[index] && index > 0) {
                const next = [...otpDigits]; next[index - 1] = "";
                setOtpDigits(next); otpRefs.current[index - 1]?.focus();
            } else {
                const next = [...otpDigits]; next[index] = "";
                setOtpDigits(next);
            }
        } else if (e.key === "Enter") { handleVerifyOtp(); }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtpDigits(pasted.split(""));
            setOtpValue(pasted);
            otpRefs.current[5]?.focus();
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (field === "currentDegree") {
                if (value === "Bachelors" && next.target_degree === "Bachelors") {
                    next.target_degree = "";
                } else if ((value === "Masters" || value === "PhD") && (next.target_degree === "Bachelors" || next.target_degree === "Masters")) {
                    next.target_degree = "";
                }
            }
            return next;
        });
    };

    // Teacher Pending Approval Screen
    if (showTeacherPending) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div style={{ width: "100%", maxWidth: 500, textAlign: "center" }}>
                    {/* Logo */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #065f46, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <GraduationCap size={24} color="#fff" />
                        </div>
                        <span style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>ScholarIQ</span>
                    </div>

                    <div style={{ backgroundColor: theme.bgSecondary, borderRadius: 24, padding: "44px 40px", border: `1px solid ${theme.border}`, boxShadow: isDark ? "0 25px 50px rgba(0,0,0,0.4)" : "0 25px 50px rgba(0,0,0,0.08)" }}>
                        {/* Success icon */}
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: isDark ? "rgba(16,185,129,0.15)" : "#ecfdf5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "2px solid #10b981" }}>
                            <Check size={38} color="#10b981" strokeWidth={2.5} />
                        </div>

                        <h2 style={{ fontSize: 26, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", margin: "0 0 12px" }}>
                            Email Verified!
                        </h2>
                        <p style={{ color: theme.textSecondary, fontSize: 15, margin: "0 0 20px", lineHeight: 1.6 }}>
                            Your email <strong style={{ color: "#10b981" }}>{pendingEmail}</strong> has been verified.
                        </p>

                        {/* Status card */}
                        <div style={{ background: isDark ? "rgba(245,158,11,0.1)" : "#fffbeb", border: "1px solid #f59e0b", borderRadius: 14, padding: "18px 20px", marginBottom: 28, textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>⏳</div>
                                <div>
                                    <p style={{ fontWeight: 700, color: isDark ? "#fcd34d" : "#92400e", fontSize: 15, margin: "0 0 4px" }}>
                                        Pending Admin Approval
                                    </p>
                                    <p style={{ color: isDark ? "#fde68a" : "#78350f", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                                        Your teacher application is under review. Admin will approve or reject your application, and you will receive an email notification at <strong>{pendingEmail}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What happens next */}
                        <div style={{ textAlign: "left", marginBottom: 28 }}>
                            <p style={{ fontWeight: 700, color: isDark ? "#94a3b8" : "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>What happens next?</p>
                            {[
                                { icon: "📧", text: "Admin reviews your application and CV" },
                                { icon: "✅", text: "You receive an approval or rejection email" },
                                { icon: "🔑", text: "If approved, login via Teacher Login" },
                            ].map((step, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <span style={{ fontSize: 18 }}>{step.icon}</span>
                                    <span style={{ color: theme.textSecondary, fontSize: 14 }}>{step.text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => onNavigate("teacher-login")}
                            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15, background: "linear-gradient(135deg, #065f46, #059669)", color: "#fff", cursor: "pointer", boxShadow: "0 8px 20px rgba(5,150,105,0.3)" }}
                        >
                            Go to Teacher Login →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // OTP Verification Screen
    if (showOtp) {
        const otpComplete = otpDigits.every(d => d !== "");
        return (
            <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div style={{ width: "100%", maxWidth: 480 }}>
                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <GraduationCap size={24} color="#fff" />
                            </div>
                            <span style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>ScholarIQ</span>
                        </div>
                    </div>

                    {/* Card */}
                    <div style={{ backgroundColor: theme.bgSecondary, borderRadius: 24, padding: "40px 36px", border: `1px solid ${theme.border}`, boxShadow: isDark ? "0 25px 50px rgba(0,0,0,0.4)" : "0 25px 50px rgba(0,0,0,0.08)" }}>

                        {/* Icon */}
                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: `2px solid ${isDark ? "rgba(59,130,246,0.3)" : "#bfdbfe"}` }}>
                                <Mail size={32} color="#3b82f6" />
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", margin: "0 0 8px" }}>
                                {pendingRole === "teacher" ? "Verify Your Email" : "Check your inbox"}
                            </h2>
                            <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
                                {pendingRole === "teacher"
                                    ? "Enter the 6-digit code sent to your email to verify your identity before admin review."
                                    : "We sent a 6-digit verification code to"}
                            </p>
                            <p style={{ color: "#3b82f6", fontSize: 14, fontWeight: 700, margin: "4px 0 0" }}>{pendingEmail}</p>
                        </div>

                        {/* OTP Digit Boxes */}
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }} onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpDigit(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                    style={{
                                        width: 52, height: 60, textAlign: "center", fontSize: 26, fontWeight: 800,
                                        borderRadius: 12, border: `2px solid ${digit ? "#3b82f6" : theme.border}`,
                                        backgroundColor: digit ? (isDark ? "rgba(59,130,246,0.12)" : "#eff6ff") : theme.bg,
                                        color: isDark ? "#f1f5f9" : "#0f172a",
                                        outline: "none", transition: "all 0.15s",
                                        boxShadow: digit ? "0 0 0 3px rgba(59,130,246,0.15)" : "none"
                                    }}
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <button
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || !otpComplete}
                            style={{
                                width: "100%", padding: "15px", borderRadius: 14, border: "none", fontWeight: 700, fontSize: 16,
                                background: otpComplete ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : (isDark ? "#1e293b" : "#e2e8f0"),
                                color: otpComplete ? "#fff" : (isDark ? "#475569" : "#94a3b8"),
                                cursor: otpComplete ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: otpComplete ? "0 8px 20px rgba(59,130,246,0.3)" : "none",
                                transition: "all 0.2s", marginBottom: 20
                            }}
                        >
                            {otpLoading ? (
                                <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Verifying...</>
                            ) : pendingRole === "teacher" ? (
                                <><ShieldCheck size={18} /> Verify Email & Submit Application</>
                            ) : (
                                <><ShieldCheck size={18} /> Verify & Continue</>
                            )}
                        </button>

                        {/* Divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                            <span style={{ color: theme.textSecondary, fontSize: 12 }}>Didn't receive it?</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                        </div>

                        {/* Resend */}
                        <div style={{ textAlign: "center" }}>
                            <button
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0}
                                style={{
                                    background: "none", border: `1px solid ${resendCooldown > 0 ? theme.border : "#3b82f6"}`,
                                    borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14,
                                    color: resendCooldown > 0 ? theme.textSecondary : "#3b82f6",
                                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer", transition: "all 0.2s"
                                }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                            </button>
                        </div>

                        <p style={{ color: theme.textSecondary, fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
                            Code expires in <strong>15 minutes</strong>. If not in inbox, check your spam folder.
                        </p>
                    </div>

                    {/* Back link */}
                    <div style={{ textAlign: "center", marginTop: 20 }}>
                        <button onClick={() => setShowOtp(false)} style={{ background: "none", border: "none", color: theme.textSecondary, fontSize: 13, cursor: "pointer" }}>
                            ← Back to signup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'} relative`} style={{ backgroundColor: theme.bg, color: theme.text }}>
            {userLoggedIn && (
                <div className="absolute top-4 right-4 z-50">
                    <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:bg-red-50 font-bold border border-red-100 bg-white/80 backdrop-blur-sm shadow-sm">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>
            )}
            <div className="absolute top-4 left-4 z-50 lg:hidden">
                <ThemeToggle />
            </div>
            
            <div className="container mx-auto px-4 py-8 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
                    {/* Left Column */}
                    <div className="space-y-8 pt-12 text-left">
                        <div className="space-y-4">
                            <div className="hidden lg:block mb-8">
                                <ThemeToggle />
                            </div>
                            <h1 className="text-5xl font-bold leading-tight" style={{ color: theme.text }}>
                                Create Your Account
                            </h1>
                            <p className="text-lg" style={{ color: theme.textSecondary }}>
                                Tell us about your current education so we can match you to the right scholarships.
                            </p>
                        </div>

                        <div className="space-y-6 pt-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1" style={{ color: theme.text }}>
                                            {feature.title}
                                        </h3>
                                        <p className="leading-relaxed" style={{ color: theme.textSecondary }}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 rounded-r border-l-4" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderColor: '#3b82f6' }}>
                            <p className="leading-relaxed" style={{ color: theme.text }}>
                                <span className="font-semibold">Free Forever.</span> No credit card required. Start discovering scholarships in minutes.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="rounded-[2rem] p-8 lg:p-14 text-left shadow-2xl border" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>
                                Registration Details
                            </h2>
                            <p style={{ color: theme.textSecondary }}>
                                Please fill in your information to get started
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection */}
                            <div className="flex gap-2 p-1 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                <button
                                    type="button"
                                    onClick={() => setRole("student")}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                                        role === "student"
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25"
                                            : "hover:bg-black/5 dark:hover:bg-white/5"
                                    }`}
                                    style={role !== "student" ? { color: theme.textSecondary } : undefined}
                                >
                                    📚 Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("teacher")}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                                        role === "teacher"
                                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                                            : "hover:bg-black/5 dark:hover:bg-white/5"
                                    }`}
                                    style={role !== "teacher" ? { color: theme.textSecondary } : undefined}
                                >
                                    🎓 Teacher
                                </button>
                            </div>

                            {/* Teacher Approval Notice */}
                            {role === "teacher" && (
                                <div className="p-4 rounded-xl border-l-4 bg-amber-50 border-amber-400">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-amber-800 text-sm">Admin Approval Required</p>
                                            <p className="text-amber-700 text-xs mt-1">
                                                Teacher accounts require verification of your degree, qualifications, and CV.
                                                You'll receive an email once approved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive" className="rounded-xl">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="font-bold">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="fullName" style={{ color: theme.text }}>
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                    className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" style={{ color: theme.text }}>
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                        className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" style={{ color: theme.text }}>
                                        Password <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                            className="h-[52px] rounded-xl px-4 pr-12 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {role !== "teacher" && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country" style={{ color: theme.text }}>
                                        Country <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.nationality} onValueChange={(value: string) => handleChange('nationality', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                            <SelectValue placeholder="Select your country" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                            {["Pakistan", "India", "USA", "UK", "Canada", "Germany", "Others"].map(c => (
                                                <SelectItem key={c} value={c} className="rounded-lg py-2.5" style={{ color: theme.text }}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="degree" style={{ color: theme.text }}>
                                        Highest completed degree <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.currentDegree} onValueChange={(value: string) => handleChange('currentDegree', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                            <SelectValue placeholder="Select degree" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                            <SelectItem value="High School" style={{ color: theme.text }} className="rounded-lg py-2.5">High School</SelectItem>
                                            <SelectItem value="Bachelors" style={{ color: theme.text }} className="rounded-lg py-2.5">Bachelor's Degree</SelectItem>
                                            <SelectItem value="Masters" style={{ color: theme.text }} className="rounded-lg py-2.5">Master's Degree</SelectItem>
                                            <SelectItem value="PhD" style={{ color: theme.text }} className="rounded-lg py-2.5">PhD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            )}

                            {role !== "teacher" && (
                            <>
                            <div className="border-t pt-6 space-y-4" style={{ borderColor: theme.border }}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">🎯 Your Study Goals</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="target_country" style={{ color: theme.text }}>
                                        Target Country <span className="text-blue-600">*</span>
                                    </Label>
                                    <Select value={formData.target_country} onValueChange={(value: string) => handleChange('target_country', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                            <SelectValue placeholder="Where to study?" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                            {["USA", "UK", "Canada", "Germany", "Australia", "Europe", "Others"].map(c => (
                                                <SelectItem key={c} value={c} className="rounded-lg py-2.5" style={{ color: theme.text }}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_degree" style={{ color: theme.text }}>
                                        Target Degree <span className="text-blue-600">*</span>
                                    </Label>
                                    <Select value={formData.target_degree} onValueChange={(value: string) => handleChange('target_degree', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                            <SelectValue placeholder="What to study?" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                            {formData.currentDegree !== "Bachelors" && formData.currentDegree !== "Masters" && formData.currentDegree !== "PhD" && (
                                                <SelectItem value="Bachelors" style={{ color: theme.text }} className="rounded-lg py-2.5">Bachelors (UG)</SelectItem>
                                            )}
                                            {formData.currentDegree !== "Masters" && formData.currentDegree !== "PhD" && (
                                                <SelectItem value="Masters" style={{ color: theme.text }} className="rounded-lg py-2.5">Masters (PG)</SelectItem>
                                            )}
                                            <SelectItem value="PhD" style={{ color: theme.text }} className="rounded-lg py-2.5">PhD (Doctorate)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fieldOfStudy" style={{ color: theme.text }}>
                                    Field of Study <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.major} onValueChange={(value: string) => handleChange('major', value)} required>
                                    <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                        <SelectValue placeholder="e.g. Computer Science, Business, Medicine" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                        <SelectItem value="Computer Science" style={{ color: theme.text }} className="rounded-lg py-2.5">Computer Science</SelectItem>
                                        <SelectItem value="Business" style={{ color: theme.text }} className="rounded-lg py-2.5">Business</SelectItem>
                                        <SelectItem value="Medicine" style={{ color: theme.text }} className="rounded-lg py-2.5">Medicine</SelectItem>
                                        <SelectItem value="Engineering" style={{ color: theme.text }} className="rounded-lg py-2.5">Engineering</SelectItem>
                                        <SelectItem value="Arts & Humanities" style={{ color: theme.text }} className="rounded-lg py-2.5">Arts & Humanities</SelectItem>
                                        <SelectItem value="Law" style={{ color: theme.text }} className="rounded-lg py-2.5">Law</SelectItem>
                                        <SelectItem value="Social Sciences" style={{ color: theme.text }} className="rounded-lg py-2.5">Social Sciences</SelectItem>
                                        <SelectItem value="Natural Sciences" style={{ color: theme.text }} className="rounded-lg py-2.5">Natural Sciences</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>
                            </>
                            )}

                            {/* Teacher-Specific Fields */}
                            {role === "teacher" && (
                                <div className="space-y-6 border-t-2 border-emerald-200 pt-6 mt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Teacher Profile</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="specialization" style={{ color: theme.text }}>
                                            Teaching Specialization <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={teacherData.specializations}
                                            onValueChange={(v) => setTeacherData(prev => ({ ...prev, specializations: v }))}
                                            required={role === "teacher"}
                                        >
                                            <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm">
                                                <SelectValue placeholder="What test do you teach?" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-2xl" style={{ backgroundColor: theme.bgSecondary, borderColor: theme.border }}>
                                                <SelectItem value="IELTS" style={{ color: theme.text }} className="rounded-lg py-2.5">IELTS</SelectItem>
                                                <SelectItem value="TOEFL" style={{ color: theme.text }} className="rounded-lg py-2.5">TOEFL</SelectItem>
                                                <SelectItem value="GRE" style={{ color: theme.text }} className="rounded-lg py-2.5">GRE</SelectItem>
                                                <SelectItem value="GMAT" style={{ color: theme.text }} className="rounded-lg py-2.5">GMAT</SelectItem>
                                                <SelectItem value="SAT" style={{ color: theme.text }} className="rounded-lg py-2.5">SAT</SelectItem>
                                                <SelectItem value="Multiple" style={{ color: theme.text }} className="rounded-lg py-2.5">Multiple Tests</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="experience" style={{ color: theme.text }}>
                                                Experience (Years) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="experience"
                                                type="number"
                                                min={0}
                                                max={50}
                                                value={teacherData.experience_years}
                                                onChange={(e) => setTeacherData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                                                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                                className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                                required={role === "teacher"}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qualification" style={{ color: theme.text }}>
                                                Professional Qualification
                                            </Label>
                                            <Input
                                                id="qualification"
                                                placeholder="e.g. CELTA, TEFL"
                                                value={teacherData.qualification}
                                                onChange={(e) => setTeacherData(prev => ({ ...prev, qualification: e.target.value }))}
                                                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                                className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="degree" style={{ color: theme.text }}>
                                                Academic Degree <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="degree"
                                                placeholder="e.g. M.Ed, B.Ed, MA English"
                                                value={teacherData.degree}
                                                onChange={(e) => setTeacherData(prev => ({ ...prev, degree: e.target.value }))}
                                                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                                className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                                required={role === "teacher"}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="institution" style={{ color: theme.text }}>
                                                Institution <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="institution"
                                                placeholder="University/Institution name"
                                                value={teacherData.institution}
                                                onChange={(e) => setTeacherData(prev => ({ ...prev, institution: e.target.value }))}
                                                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                                className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                                required={role === "teacher"}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="linkedinUrl" style={{ color: theme.text }}>
                                            LinkedIn Profile URL <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="linkedinUrl"
                                            type="url"
                                            placeholder="https://linkedin.com/in/yourprofile"
                                            value={teacherData.cv_url}
                                            onChange={(e) => setTeacherData(prev => ({ ...prev, cv_url: e.target.value }))}
                                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                            className="h-[52px] rounded-xl px-4 border-2 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all font-medium shadow-sm"
                                        />
                                        <p className="text-xs text-gray-500">Provide LinkedIn URL or upload CV — at least one is required</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cvFile" style={{ color: theme.text }}>
                                            Upload CV / Resume <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <input
                                                id="cvFile"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        alert("File size must be less than 5MB");
                                                        return;
                                                    }
                                                    const formData = new FormData();
                                                    formData.append("file", file);
                                                    try {
                                                        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
                                                        const res = await fetch(`${API_BASE}/auth/upload-cv`, {
                                                            method: "POST",
                                                            body: formData,
                                                        });
                                                        if (!res.ok) {
                                                            const err = await res.json();
                                                            alert(err.detail || "Upload failed");
                                                            return;
                                                        }
                                                        const data = await res.json();
                                                        setTeacherData(prev => ({ ...prev, cv_file_url: data.cv_url, cv_filename: data.filename }));
                                                    } catch {
                                                        alert("CV upload failed. Please try again.");
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="cvFile"
                                                className="flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-xl p-4 hover:border-blue-400 transition-all"
                                                style={{ borderColor: teacherData.cv_filename ? '#10b981' : theme.border, backgroundColor: theme.bg }}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${teacherData.cv_filename ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                                                    <span className="text-xl">{teacherData.cv_filename ? '✅' : '📄'}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm" style={{ color: theme.text }}>
                                                        {teacherData.cv_filename || "Click to upload CV (PDF, DOC, DOCX)"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Max 5MB</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio" style={{ color: theme.text }}>
                                            Professional Bio
                                        </Label>
                                        <textarea
                                            id="bio"
                                            rows={3}
                                            placeholder="Briefly describe your teaching experience and expertise..."
                                            value={teacherData.bio}
                                            onChange={(e) => setTeacherData(prev => ({ ...prev, bio: e.target.value }))}
                                            style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                            className="w-full rounded-xl px-4 py-3 focus:ring-2 transition-all font-medium border"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{role === "teacher" ? "Submitting Application..." : "Creating Account..."}</span>
                                    </div>
                                ) : (
                                    role === "teacher" ? "🎓 Submit Teacher Application" : "Create Account"
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <p className="font-bold" style={{ color: theme.textSecondary }}>
                                    Already part of the network? {" "}
                                    <button
                                        type="button"
                                        onClick={() => onNavigate('login')}
                                        className="text-blue-600 hover:underline underline-offset-4 decoration-2"
                                    >
                                        Log In
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle, LogOut } from "lucide-react";
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

            if (role === "teacher") {
                // Teachers need admin approval - don't auto-login
                toast.success("Teacher application submitted! 🎓\nAdmin approval required. You'll receive an email when approved.");
                onNavigate('login');
            } else {
                // Students auto-login
                const loginFormData = new FormData();
                loginFormData.append('username', formData.email);
                loginFormData.append('password', formData.password);
                await api.auth.login(loginFormData);
                toast.success("Account created successfully!");
                onNavigate('dashboard', {
                    autoSearch: true,
                    filters: {
                        level: formData.target_degree,
                        country: formData.target_country,
                        field: formData.major
                    }
                });
            }
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setIsLoading(false);
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
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    📚 Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("teacher")}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                                        role === "teacher"
                                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
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
                                    className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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
                                        className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" style={{ color: theme.text }}>
                                        Password <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                                        className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {role !== "teacher" && (
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country" style={{ color: theme.text }}>
                                        Country <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.nationality} onValueChange={(value: string) => handleChange('nationality', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                            <div className="grid md:grid-cols-2 gap-4 border-t pt-6" style={{ borderColor: theme.border }}>
                                <div className="space-y-2">
                                    <Label htmlFor="target_country" style={{ color: theme.text }}>
                                        Target Country <span className="text-blue-600">*</span>
                                    </Label>
                                    <Select value={formData.target_country} onValueChange={(value: string) => handleChange('target_country', value)} required>
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                                        <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                                    <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                                            <SelectTrigger style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="h-[52px] rounded-xl px-4 transition-all font-medium">
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
                                                className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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
                                                className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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
                                                className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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
                                                className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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
                                            className="h-[52px] rounded-xl px-4 focus:ring-2 transition-all font-medium"
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

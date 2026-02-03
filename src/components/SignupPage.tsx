import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
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

export function SignupPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            // First, register the user
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
            });

            // Then, automatically log them in
            const loginFormData = new FormData();
            loginFormData.append('username', formData.email);
            loginFormData.append('password', formData.password);
            await api.auth.login(loginFormData);

            toast.success("Account created successfully!");
            // Pass the registration data to the dashboard to show personalized scholarships immediately
            onNavigate('dashboard', {
                autoSearch: true,
                filters: {
                    level: formData.target_degree,
                    country: formData.target_country,
                    field: formData.major
                }
            });
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={`min-h-screen bg-white transition-opacity duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="container mx-auto px-4 py-8 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
                    {/* Left Column */}
                    <div className="space-y-8 pt-12 text-left">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                                Create Your Account
                            </h1>
                            <p className="text-lg text-gray-600">
                                Tell us about your current education so we can match you to the right scholarships.
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-6 pt-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r">
                            <p className="text-gray-700 leading-relaxed">
                                <span className="font-semibold">Free Forever.</span> No credit card required. Start discovering scholarships in minutes.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="bg-gray-50 rounded-[2rem] p-8 lg:p-14 text-left shadow-sm border border-slate-100">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Registration Details
                            </h2>
                            <p className="text-gray-600">
                                Please fill in your information to get started
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="rounded-xl bg-red-50 border-red-100">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="font-bold">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-gray-700 font-bold ml-1">
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    className="bg-white border-gray-200 h-[52px] rounded-xl px-4 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                    required
                                />
                            </div>

                            {/* Email & Password Row */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-bold ml-1">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="bg-white border-gray-200 h-[52px] rounded-xl px-4 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700 font-bold ml-1">
                                        Password <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="bg-white border-gray-200 h-[52px] rounded-xl px-4 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Country & Degree Row */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-gray-700 font-bold ml-1">
                                        Country <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.nationality} onValueChange={(value: string) => handleChange('nationality', value)} required>
                                        <SelectTrigger className="bg-white border-gray-200 h-[52px] rounded-xl px-4 text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                            <SelectValue placeholder="Select your country" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            {["Pakistan", "India", "USA", "UK", "Canada", "Germany", "Others"].map(c => (
                                                <SelectItem key={c} value={c} className="rounded-lg py-2.5">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="degree" className="text-gray-700 font-bold ml-1">
                                        Highest completed degree <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={formData.currentDegree} onValueChange={(value: string) => handleChange('currentDegree', value)} required>
                                        <SelectTrigger className="bg-white border-gray-200 h-[52px] rounded-xl px-4 text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                            <SelectValue placeholder="Select degree" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="High School" className="rounded-lg py-2.5">High School</SelectItem>
                                            <SelectItem value="Bachelors" className="rounded-lg py-2.5">Bachelor's Degree</SelectItem>
                                            <SelectItem value="Masters" className="rounded-lg py-2.5">Master's Degree</SelectItem>
                                            <SelectItem value="PhD" className="rounded-lg py-2.5">PhD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Helper Text */}
                            <p className="text-sm text-gray-500 -mt-2 px-1">
                                Example: If you finished a Bachelor's and want to study a Master's abroad, select "Bachelor's" here.
                            </p>

                            {/* Target Goals Row */}
                            <div className="grid md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="target_country" className="text-gray-700 font-bold ml-1">
                                        Target Country <span className="text-blue-600">*</span>
                                    </Label>
                                    <Select value={formData.target_country} onValueChange={(value: string) => handleChange('target_country', value)} required>
                                        <SelectTrigger className="bg-white border-gray-200 h-[52px] rounded-xl px-4 text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                            <SelectValue placeholder="Where to study?" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            {["USA", "UK", "Canada", "Germany", "Australia", "Europe", "Others"].map(c => (
                                                <SelectItem key={c} value={c} className="rounded-lg py-2.5">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="target_degree" className="text-gray-700 font-bold ml-1">
                                        Target Degree <span className="text-blue-600">*</span>
                                    </Label>
                                    <Select value={formData.target_degree} onValueChange={(value: string) => handleChange('target_degree', value)} required>
                                        <SelectTrigger className="bg-white border-gray-200 h-[52px] rounded-xl px-4 text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                            <SelectValue placeholder="What to study?" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="Bachelors" className="rounded-lg py-2.5">Bachelors (UG)</SelectItem>
                                            <SelectItem value="Masters" className="rounded-lg py-2.5">Masters (PG)</SelectItem>
                                            <SelectItem value="PhD" className="rounded-lg py-2.5">PhD (Doctorate)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Field of Study */}
                            <div className="space-y-2">
                                <Label htmlFor="fieldOfStudy" className="text-gray-700 font-bold ml-1">
                                    Field of Study <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.major} onValueChange={(value: string) => handleChange('major', value)} required>
                                    <SelectTrigger className="bg-white border-gray-200 h-[52px] rounded-xl px-4 text-slate-600 focus:ring-2 focus:ring-blue-100 transition-all font-medium">
                                        <SelectValue placeholder="e.g. Computer Science, Business, Medicine" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                        <SelectItem value="Computer Science" className="rounded-lg py-2.5">Computer Science</SelectItem>
                                        <SelectItem value="Business" className="rounded-lg py-2.5">Business</SelectItem>
                                        <SelectItem value="Medicine" className="rounded-lg py-2.5">Medicine</SelectItem>
                                        <SelectItem value="Engineering" className="rounded-lg py-2.5">Engineering</SelectItem>
                                        <SelectItem value="Arts & Humanities" className="rounded-lg py-2.5">Arts & Humanities</SelectItem>
                                        <SelectItem value="Law" className="rounded-lg py-2.5">Law</SelectItem>
                                        <SelectItem value="Social Sciences" className="rounded-lg py-2.5">Social Sciences</SelectItem>
                                        <SelectItem value="Natural Sciences" className="rounded-lg py-2.5">Natural Sciences</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Specialization */}
                            <div className="space-y-2">
                                <Label htmlFor="specialization" className="text-gray-700 font-bold ml-1">
                                    Specialization
                                </Label>
                                <Input
                                    id="specialization"
                                    type="text"
                                    placeholder="e.g. AI, Mechanical, Finance"
                                    value={formData.specialization}
                                    onChange={(e) => handleChange('specialization', e.target.value)}
                                    className="bg-white border-gray-200 h-[52px] rounded-xl px-4 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                                />
                            </div>

                            {/* Terms */}
                            <p className="text-sm text-gray-600 leading-relaxed px-1">
                                By creating an account, you agree to our{' '}
                                <button type="button" className="text-blue-600 font-bold hover:underline">
                                    Terms of Service
                                </button>{' '}
                                and{' '}
                                <button type="button" className="text-blue-600 font-bold hover:underline">
                                    Privacy Policy
                                </button>
                                .
                            </p>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <p className="font-bold text-slate-400">
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

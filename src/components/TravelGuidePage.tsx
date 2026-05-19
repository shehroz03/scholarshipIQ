import { useState } from "react";
import {
    ChevronLeft,
    MapPin,
    Globe,
    Plane,
    Clock,
    Banknote,
    ShieldCheck,
    GraduationCap,
    ArrowRight,
    Info,
    BadgeCheck,
    Building2,
    Users
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";

interface CountryGuide {
    id: string;
    name: string;
    flag: string;
    image: string;
    description: string;
    livingCost: string;
    visaType: string;
    visaDuration: string;
    workRights: string;
    visaSuccess: string;
    topUniversities: string[];
    intakeMonths: string[];
}

const DESTINATIONS: CountryGuide[] = [
    {
        id: "uk",
        name: "United Kingdom",
        flag: "🇬🇧",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000&auto=format&fit=crop",
        description: "The UK offers a world-class education system with centuries-old universities and a diverse, multicultural society.",
        livingCost: "£1,000 - £1,500 / month",
        visaType: "Student Visa (Subclass Tier 4)",
        visaDuration: "Course Duration + 4 Months",
        workRights: "20 hours/week during term",
        visaSuccess: "96.5%",
        topUniversities: ["Oxford", "Cambridge", "Imperial College", "UCL"],
        intakeMonths: ["September", "January"]
    },
    {
        id: "australia",
        name: "Australia",
        flag: "🇦🇺",
        image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1000&auto=format&fit=crop",
        description: "Known for its high quality of life and stunning natural beauty, Australia is a top choice for international students.",
        livingCost: "A$1,800 - A$2,500 / month",
        visaType: "Student Visa (Subclass 500)",
        visaDuration: "Up to 5 Years",
        workRights: "48 hours/fortnight",
        visaSuccess: "92.0%",
        topUniversities: ["Melbourne", "Sydney", "ANU", "UNSW"],
        intakeMonths: ["February", "July"]
    },
    {
        id: "canada",
        name: "Canada",
        flag: "🇨🇦",
        image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1000&auto=format&fit=crop",
        description: "With a welcoming immigration policy and excellent postgraduate work options, Canada is extremely popular.",
        livingCost: "C$1,200 - C$2,000 / month",
        visaType: "Study Permit",
        visaDuration: "Validation of Study + 90 Days",
        workRights: "20 hours/week (off-campus)",
        visaSuccess: "88.5%",
        topUniversities: ["Toronto", "UBC", "McGill", "Montreal"],
        intakeMonths: ["September", "January", "May"]
    },
    {
        id: "germany",
        name: "Germany",
        flag: "🇩🇪",
        image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1000&auto=format&fit=crop",
        description: "Free or low-cost education in one of Europe's strongest economies makes Germany an academic powerhouse.",
        livingCost: "€850 - €1,100 / month",
        visaType: "National Visa (D)",
        visaDuration: "Duration of Course",
        workRights: "120 full days per year",
        visaSuccess: "94.0%",
        topUniversities: ["TUM", "LMU Munich", "Heidelberg", "Berlin"],
        intakeMonths: ["October", "April"]
    }
];

export function TravelGuidePage({ onNavigate }: { onNavigate: (page: string) => void }) {
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;
    const [selectedCountry, setSelectedCountry] = useState<CountryGuide>(DESTINATIONS[0]);

    return (
        <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                    <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tight" style={{ color: theme.text }}>ScholarIQ</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button variant="ghost" onClick={() => onNavigate('dashboard')} style={{ color: theme.textSecondary }}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> Dashboard
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-black mb-2" style={{ color: theme.text }}>Global Study Destinations 🌏</h1>
                    <p style={{ color: theme.textSecondary }}>Expert guides on living costs, visas, and university life.</p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest px-2" style={{ color: theme.textSecondary }}>Select Destination</p>
                        {DESTINATIONS.map((dest) => (
                            <button
                                key={dest.id}
                                onClick={() => setSelectedCountry(dest)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 font-bold ${selectedCountry.id === dest.id ? 'border-blue-500 shadow-lg shadow-blue-500/10' : ''}`}
                                style={{
                                    backgroundColor: selectedCountry.id === dest.id ? (isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff') : theme.bgSecondary,
                                    borderColor: selectedCountry.id === dest.id ? '#3b82f6' : theme.border,
                                    color: selectedCountry.id === dest.id ? '#3b82f6' : theme.text
                                }}
                            >
                                <span className="text-2xl">{dest.flag}</span>
                                <span>{dest.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-3">
                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden" style={{ backgroundColor: theme.bgSecondary }}>
                            <div className="h-64 relative">
                                <img src={selectedCountry.image} alt={selectedCountry.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                                    <h2 className="text-4xl font-black text-white flex items-center gap-3">
                                        {selectedCountry.flag} {selectedCountry.name}
                                    </h2>
                                </div>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-8">
                                        <div>
                                            <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Info className="w-5 h-5 text-blue-500" /> About the Country
                                            </h3>
                                            <p className="text-lg leading-relaxed" style={{ color: theme.textSecondary }}>{selectedCountry.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Banknote className="w-5 h-5 text-emerald-500" />
                                                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: theme.textSecondary }}>Living Cost</span>
                                                </div>
                                                <p className="text-xl font-black" style={{ color: theme.text }}>{selectedCountry.livingCost}</p>
                                            </div>
                                            <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                                                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: theme.textSecondary }}>Visa Success</span>
                                                </div>
                                                <p className="text-xl font-black" style={{ color: theme.text }}>{selectedCountry.visaSuccess}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Building2 className="w-5 h-5 text-indigo-500" /> Top Universities
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedCountry.topUniversities.map((uni) => (
                                                    <div key={uni} className="p-3 rounded-xl border flex items-center gap-2 font-bold" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}>
                                                        <GraduationCap className="w-4 h-4 text-slate-400" /> {uni}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-3xl border border-blue-500/20" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : '#eff6ff' }}>
                                            <h4 className="font-black mb-4 text-blue-600 flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5" /> Visa Essentials
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                                                    <p className="font-bold" style={{ color: theme.text }}>{selectedCountry.visaType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Work Rights</p>
                                                    <p className="font-bold" style={{ color: theme.text }}>{selectedCountry.workRights}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                                            <h4 className="font-black mb-4 flex items-center gap-2" style={{ color: theme.text }}>
                                                <Clock className="w-5 h-5 text-orange-500" /> Intake Periods
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCountry.intakeMonths.map((m) => (
                                                    <Badge key={m} className="bg-orange-500/10 text-orange-500 border-orange-500/20">{m}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

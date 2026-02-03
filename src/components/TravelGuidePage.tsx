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
    const [selectedCountry, setSelectedCountry] = useState<CountryGuide>(DESTINATIONS[0]);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 sm:px-8 py-4 sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
                        <div className="p-2 bg-[#1e3a8a] rounded-xl text-white shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">ScholarIQ</span>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                        onClick={() => onNavigate('dashboard')}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
                <div className="mb-12">
                    <Badge className="bg-blue-50 text-[#1e3a8a] border-blue-100 font-bold px-3 py-1 rounded-lg mb-4">Study Abroad 2024</Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                        Destination Travel Guide
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl">
                        Everything you need to know about your dream study destination, from visa requirements to living costs.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Country Selection Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Top Destinations</h3>
                        {DESTINATIONS.map((country) => (
                            <button
                                key={country.id}
                                onClick={() => setSelectedCountry(country)}
                                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all border-2 text-left group
                  ${selectedCountry.id === country.id
                                        ? "bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-xl shadow-blue-900/10"
                                        : "bg-white border-transparent hover:border-blue-100 text-slate-600 hover:bg-blue-50/50"}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white/10
                  ${selectedCountry.id === country.id ? "text-white" : "bg-slate-50 text-slate-900"}`}>
                                    {country.flag}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-lg">{country.name}</p>
                                    <p className={`text-xs ${selectedCountry.id === country.id ? "text-blue-200" : "text-slate-400"}`}>
                                        {country.visaSuccess} Visa Success
                                    </p>
                                </div>
                                <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedCountry.id === country.id ? "text-white" : "text-slate-300"}`} />
                            </button>
                        ))}

                        <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] border-none text-white p-8 mt-10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <Info className="w-10 h-10 text-white/30 mb-6" />
                            <h4 className="text-xl font-bold mb-2">Need a custom plan?</h4>
                            <p className="text-blue-100/80 text-sm mb-6 font-medium leading-relaxed">Our AI can build a personalized pre-travel checklist for your specific background.</p>
                            <Button className="w-full bg-white text-indigo-600 hover:bg-blue-50 font-bold rounded-xl h-12">Talk to Advisor</Button>
                        </Card>
                    </div>

                    {/* Guide Content */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
                            {/* Feature Image */}
                            <div className="h-64 relative overflow-hidden">
                                <img
                                    src={selectedCountry.image}
                                    alt={selectedCountry.name}
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-4xl">{selectedCountry.flag}</span>
                                        <h2 className="text-3xl font-black text-white">{selectedCountry.name}</h2>
                                    </div>
                                    <p className="text-white/80 font-medium">Official Student Destination Guide</p>
                                </div>
                            </div>

                            <div className="p-8 md:p-12">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-slate-50 p-1.5 rounded-2xl h-14 border border-slate-100 mb-10">
                                        <TabsTrigger value="overview" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm">Overview</TabsTrigger>
                                        <TabsTrigger value="visa" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm">Visa & Travel</TabsTrigger>
                                        <TabsTrigger value="academics" className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm">Academics</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-slate-600 leading-relaxed text-lg font-medium">
                                                {selectedCountry.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl group hover:border-blue-400 transition-all">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-[#1e3a8a]">
                                                    <Banknote className="w-5 h-5" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Cost of Living</p>
                                                <p className="text-xl font-black text-slate-900">{selectedCountry.livingCost}</p>
                                            </div>
                                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl group hover:border-emerald-400 transition-all">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Visa Success Rate</p>
                                                <p className="text-xl font-black text-emerald-900">{selectedCountry.visaSuccess}</p>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
                                            <div className="flex items-center gap-3 mb-6 font-black text-amber-900">
                                                <Plane className="w-5 h-5" /> Quick Checklist
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    "Valid Passport (6 months+)",
                                                    "Financial Proof (Maintenance)",
                                                    "Health Insurance / IHS",
                                                    "TB Screening (If applicable)",
                                                    "Biometric Enrollment",
                                                    "CAS / Acceptance Letter"
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-amber-800 font-medium text-sm">
                                                        <BadgeCheck className="w-5 h-5 text-amber-600 shrink-0" /> {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="visa" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 text-blue-600">
                                                    <Plane className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 mb-1">Visa Category</h4>
                                                    <p className="text-slate-500 font-medium mb-2">{selectedCountry.visaType}</p>
                                                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 font-bold">Duration: {selectedCountry.visaDuration}</Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-5 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0 text-purple-600">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 mb-1">Part-time Work Rights</h4>
                                                    <p className="text-slate-500 font-medium leading-relaxed">{selectedCountry.workRights}</p>
                                                    <p className="text-xs text-purple-600 mt-2 font-bold uppercase tracking-tighter">*Restrictions apply during vacation periods</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <Globe className="w-5 h-5 text-blue-400" /> Pre-Departure Guide
                                            </h4>
                                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Download our comprehensive PDF guide covering currency exchange, sim cards, and airport pickup.</p>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold border-none h-12 px-8 shadow-lg shadow-blue-500/20">
                                                Download PDF Guide
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="academics" className="mt-0 space-y-8 animate-in fade-in duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-indigo-600" /> Top Universities
                                                </h4>
                                                <div className="space-y-3">
                                                    {selectedCountry.topUniversities.map((uni, i) => (
                                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-200 transition-all group">
                                                            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-700">{i + 1}</span>
                                                            <span className="font-bold text-slate-700 group-hover:text-indigo-900">{uni}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-emerald-600" /> Intake Periods
                                                </h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {selectedCountry.intakeMonths.map((month, i) => (
                                                        <div key={i} className="px-6 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-[1.5rem] text-emerald-900 font-bold flex flex-col items-center">
                                                            <span className="text-2xl mb-1">{month === 'September' ? '🍂' : month === 'January' ? '❄️' : '🌸'}</span>
                                                            {month}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium mt-6 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl">
                                                    <strong>Note:</strong> Applications usually close 6-8 months before the intake starts. Early application is recommended.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { GraduationCap, User, BookOpen, Bell, Save, Loader2, Globe, Phone, MapPin, Calculator, Calendar, BookCheck, Microscope, History, Target } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { Checkbox } from "./ui/checkbox";

export function SettingsPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    nationality: "",
    phone_number: "",
    // Academic History
    current_university: "",
    current_degree: "",
    major: "",
    cgpa: 0,
    graduation_year: new Date().getFullYear(),
    // Future Goals
    target_country: "",
    target_degree: "",
    english_proficiency: "None",
    research_experience: false,
    email_notifications: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.users.getMe();
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        nationality: data.nationality || "Pakistan",
        phone_number: data.phone_number || "",
        current_university: data.current_university || "",
        current_degree: data.current_degree || "Bachelors",
        major: data.major || "",
        cgpa: isNaN(parseFloat(data.cgpa)) ? 0 : parseFloat(data.cgpa),
        graduation_year: data.graduation_year || new Date().getFullYear(),
        target_country: data.target_country || "United Kingdom",
        target_degree: data.target_degree || "Masters",
        english_proficiency: data.english_proficiency || "None",
        research_experience: !!data.research_experience,
        email_notifications: data.email_notifications ?? true
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.users.updateProfile(profile);
      toast.success("Profile Updated Successfully! ✅");
      // Optional: onNavigate("dashboard");
    } catch (err) {
      toast.error("Error updating profile ❌");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a]" />
          <p className="text-sm font-bold text-gray-400 animate-pulse tracking-widest uppercase">Initializing Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-[#1e3a8a] tracking-tight">ScholarIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="font-bold text-slate-600 hover:text-[#1e3a8a]">Dashboard</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-xl px-6 font-bold shadow-lg shadow-blue-900/10">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Complete Your Profile 🎓</h1>
          <p className="text-slate-500 font-medium">Help us find the most relevant scholarships for your background and goals.</p>
        </div>

        <div className="space-y-8">
          {/* --- SECTION 1: Personal Info --- */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-b border-blue-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">1. Personal Information</CardTitle>
                  <CardDescription className="text-blue-700/60 font-medium">Basic identity and contact details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Email Address</Label>
                  <Input value={profile.email} disabled className="h-12 bg-slate-100 border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Nationality</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10" />
                    <Select value={profile.nationality} onValueChange={(v: string) => setProfile({ ...profile, nationality: v })}>
                      <SelectTrigger className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl font-medium">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        {["Pakistan", "India", "Bangladesh", "USA", "UK", "Canada", "Germany", "Other"].map(country => (
                          <SelectItem key={country} value={country} className="rounded-lg">{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      placeholder="+92 300 1234567"
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 2: Academic Background --- */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50/30 border-b border-emerald-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900">2. Academic Background (Past Education)</CardTitle>
                  <CardDescription className="text-emerald-700/60 font-medium">Your most recent or completed degree details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">University / Institution Name</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      placeholder="e.g. NUST, UOL, FAST"
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                      value={profile.current_university}
                      onChange={(e) => setProfile({ ...profile, current_university: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Degree Completed / Current</Label>
                  <Select value={profile.current_degree} onValueChange={(v: string) => setProfile({ ...profile, current_degree: v })}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium">
                      <SelectValue placeholder="Select Degree" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="High School">High School</SelectItem>
                      <SelectItem value="Bachelors">Bachelors (4 Years)</SelectItem>
                      <SelectItem value="Masters">Masters (2 Years)</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Major / Field of Study</Label>
                  <div className="relative">
                    <BookCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                      placeholder="e.g. Computer Science, Mechanical Eng."
                      className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                      value={profile.major}
                      onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">CGPA / Grade</Label>
                    <div className="relative">
                      <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input
                        type="number" step="0.1"
                        placeholder="3.5"
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                        value={isNaN(profile.cgpa) ? "" : profile.cgpa}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setProfile({ ...profile, cgpa: isNaN(val) ? 0 : val });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Graduation Year</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input
                        type="number"
                        placeholder="2025"
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-medium"
                        value={profile.graduation_year}
                        onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 3: Future Study Goals --- */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50/30 border-b border-amber-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-amber-900">3. Future Study Goals</CardTitle>
                  <CardDescription className="text-amber-700/60 font-medium">Where do you want to go next?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Target Country</Label>
                  <Select value={profile.target_country} onValueChange={(v: string) => setProfile({ ...profile, target_country: v })}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="Any">Anywhere (Top Matches)</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Turkey">Turkey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Desired Degree Level</Label>
                  <Select value={profile.target_degree} onValueChange={(v: string) => setProfile({ ...profile, target_degree: v })}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="Bachelors">Bachelors</SelectItem>
                      <SelectItem value="Masters">Masters</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Short Course">Short Course / Diploma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-400">English Proficiency Test</Label>
                  <Select value={profile.english_proficiency} onValueChange={(v: string) => setProfile({ ...profile, english_proficiency: v })}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium">
                      <SelectValue placeholder="Test Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="None">Not Taken Yet</SelectItem>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="TOEFL">TOEFL</SelectItem>
                      <SelectItem value="PTE">PTE</SelectItem>
                      <SelectItem value="Duolingo">Duolingo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 self-end h-12">
                  <Checkbox
                    id="research"
                    checked={profile.research_experience}
                    onCheckedChange={(checked: boolean) => setProfile({ ...profile, research_experience: !!checked })}
                    className="w-5 h-5 rounded-md border-slate-300"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="research" className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                      <Microscope className="w-4 h-4 text-amber-500" />
                      Research Experience?
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 4: Notifications --- */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Communication & Alerts</CardTitle>
                  <CardDescription className="text-slate-400 font-medium">Stay updated with matching scholarships</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Email Notifications</h4>
                  <p className="text-sm text-slate-500">Receive matched scholarships and deadline alerts</p>
                </div>
                <Button
                  variant={profile.email_notifications ? "default" : "outline"}
                  className={`rounded-xl px-8 h-12 font-bold transition-all ${profile.email_notifications ? 'bg-[#1e3a8a] shadow-lg shadow-blue-900/20' : 'border-slate-300'}`}
                  onClick={() => setProfile({ ...profile, email_notifications: !profile.email_notifications })}
                >
                  {profile.email_notifications ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 h-14 rounded-2xl px-12 text-lg font-black shadow-2xl shadow-blue-900/20 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <><Save className="w-5 h-5 mr-3" /> Save My Profile</>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

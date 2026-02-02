import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { GraduationCap, CheckCircle, AlertCircle, Loader2, Zap } from "lucide-react";
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
    targetCountry: "",
    targetDegree: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.auth.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        nationality: formData.nationality,
        current_degree: formData.currentDegree,
        major: formData.major,
        target_country: formData.targetCountry,
        target_degree: formData.targetDegree
      });

      // Show success toast and redirect to login
      toast.success("Registration successful! Please login.");
      onNavigate('login');
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
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a]/5 via-white to-[#10b981]/5">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <GraduationCap className="w-8 h-8 text-[#1e3a8a]" />
            <span className="text-xl font-black text-[#1e3a8a] tracking-tight">ScholarIQ</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left side - Benefits */}
          <div className="lg:col-span-2 space-y-8 pr-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Join the Elite <span className="text-[#10b981]">1%</span> of Scholars</h1>
              <p className="text-gray-600 text-lg font-medium leading-relaxed">Tell us about your background so our AI can match you to the highest-premium scholarships.</p>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">AI-Powered Precision</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">98% accuracy in matching your profile with global university requirements.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-[#1e3a8a]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Direct Admission</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">We connect you directly to university admission heads in UK, USA, and EU.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1e3a8a] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <p className="text-lg font-bold relative z-10 leading-tight">
                "ScholarIQ helped me land a full-ride Masters in Oxford. The matching engine is pure magic."
              </p>
              <div className="mt-4 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm font-black">Sarah Ahmed</p>
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Oxford '25 Scholar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#1e3a8a] to-[#10b981]" />
              <CardHeader className="px-10 pt-10 pb-6 text-center lg:text-left">
                <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Personal Details</CardTitle>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Start your global journey</p>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                {error && (
                  <Alert variant="destructive" className="mb-6 rounded-2xl bg-red-50 border-red-100 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-bold">{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-black uppercase text-gray-400 tracking-widest">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold px-6 shadow-sm"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase text-gray-400 tracking-widest">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold px-6 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-black uppercase text-gray-400 tracking-widest">Secret Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold px-6 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Academic Background */}
                  <div className="pt-4 border-t border-gray-50">
                    <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-4">Academic Background</Label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nationality" className="text-xs font-bold text-gray-500">Living In</Label>
                        <Select
                          value={formData.nationality}
                          onValueChange={(value: string) => handleChange('nationality', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="nationality" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold px-6">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="Pakistan">Pakistan 🇵🇰</SelectItem>
                            <SelectItem value="India">India 🇮🇳</SelectItem>
                            <SelectItem value="United States">United States 🇺🇸</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom 🇬🇧</SelectItem>
                            <SelectItem value="Canada">Canada 🇨🇦</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentDegree" className="text-xs font-bold text-gray-500">Latest Degree</Label>
                        <Select
                          value={formData.currentDegree}
                          onValueChange={(value: string) => handleChange('currentDegree', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="currentDegree" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold px-6">
                            <SelectValue placeholder="Latest completed degree" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="High School">High School</SelectItem>
                            <SelectItem value="Bachelors">Bachelors (BS/BA)</SelectItem>
                            <SelectItem value="Masters">Masters (MS/MA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="major" className="text-xs font-bold text-gray-500">Major Field of Study</Label>
                      <Input
                        id="major"
                        placeholder="e.g. Computer Science, Mechanical Eng."
                        value={formData.major}
                        onChange={(e) => handleChange('major', e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold px-6 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Future Aspirations */}
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white fill-white" />
                      </div>
                      <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Future Career Mapping</Label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="targetCountry" className="text-xs font-bold text-gray-500">Destination Hub</Label>
                        <Select
                          value={formData.targetCountry}
                          onValueChange={(value: string) => handleChange('targetCountry', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="targetCountry" className="h-12 rounded-xl border-blue-100 bg-white font-bold px-4">
                            <SelectValue placeholder="Where to study?" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="United Kingdom">United Kingdom 🇬🇧</SelectItem>
                            <SelectItem value="USA">United States 🇺🇸</SelectItem>
                            <SelectItem value="Germany">Germany 🇩🇪</SelectItem>
                            <SelectItem value="Australia">Australia 🇦🇺</SelectItem>
                            <SelectItem value="Any">Any Country 🌍</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetDegree" className="text-xs font-bold text-gray-500">Goal Degree</Label>
                        <Select
                          value={formData.targetDegree}
                          onValueChange={(value: string) => handleChange('targetDegree', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="targetDegree" className="h-12 rounded-xl border-blue-100 bg-white font-bold px-4">
                            <SelectValue placeholder="Desired degree level" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Bachelors">Bachelors</SelectItem>
                            <SelectItem value="Masters">Masters</SelectItem>
                            <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 bg-[#1e3a8a] hover:bg-blue-800 rounded-[1.25rem] text-lg font-black shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Generating Profile...
                      </>
                    ) : (
                      "Sign Up & Find Scholarships 🎯"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500 font-bold">Already part of the network? </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('login')}
                      className="text-sm text-[#1e3a8a] hover:underline font-black uppercase tracking-widest"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

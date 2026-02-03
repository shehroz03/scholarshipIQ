import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  GraduationCap,
  Search,
  Brain,
  Shield,
  MessageCircle,
  Award,
  BookOpen,
  Users,
  Sprout,
  Palette,
  Code,
  Wrench,
  Utensils,
  Newspaper,
  Stethoscope,
  UsersRound,
  Atom,
  Briefcase,
  GraduationCapIcon,
  Globe,
  Scale,
  Microscope,
  ChevronRight,
  Sparkles,
  Banknote,
  Clock,
  Zap,
  Calendar,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { api } from "../api";
import { CurrencySelector } from "./CurrencySelector";
import { toast } from "sonner";

const isLoggedIn = () => !!localStorage.getItem("token");

// Fallback data when API fails or returns empty (so sections always show)
// Full image URLs so cards always show (Picsum = reliable, no auth)
const FALLBACK_FIELDS = [
  { title: "Computer Science", scholarships: "—", icon: Code, image: "https://picsum.photos/seed/cs/400/300", color: "bg-blue-500" },
  { title: "Engineering", scholarships: "—", icon: Wrench, image: "https://picsum.photos/seed/eng/400/300", color: "bg-blue-500" },
  { title: "Business", scholarships: "—", icon: Briefcase, image: "https://picsum.photos/seed/biz/400/300", color: "bg-blue-500" },
  { title: "Medicine", scholarships: "—", icon: Stethoscope, image: "https://picsum.photos/seed/med/400/300", color: "bg-blue-500" },
  { title: "Social Sciences", scholarships: "—", icon: UsersRound, image: "https://picsum.photos/seed/soc/400/300", color: "bg-blue-500" },
];
const FALLBACK_COUNTRIES = [
  { name: "United Kingdom", scholarships: "—", image: "https://picsum.photos/seed/uk/400/300" },
  { name: "Germany", scholarships: "—", image: "https://picsum.photos/seed/de/400/300" },
  { name: "Australia", scholarships: "—", image: "https://picsum.photos/seed/au/400/300" },
  { name: "Canada", scholarships: "—", image: "https://picsum.photos/seed/ca/400/300" },
];

export function LandingPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [fieldOfStudy, setFieldOfStudy] = useState("");

  const [statsData, setStatsData] = useState<any>(null);
  const [dbCountries, setDbCountries] = useState<any[]>([]);
  const [dbFields, setDbFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use Picsum for reliable images (no auth, always loads). Seed from keyword for consistent per-card image.
  const getImageUrl = (keyword: string, type: 'field' | 'country') => {
    const seed = keyword.replace(/\s+/g, "").slice(0, 8) || (type === "field" ? "field" : "country");
    return `https://picsum.photos/seed/${seed}/400/300`;
  };

  const [popularFilters, setPopularFilters] = useState<any[]>([
    { name: "Master's Degree", count: "Loading...", link: "master", params: { level: "Masters" } },
    { name: "Fully Funded", count: "Loading...", link: "full", params: { funding_type: "Fully Funded" } },
    { name: "PhD / Research", count: "Loading...", link: "phd", params: { level: "PhD" } },
    { name: "Bachelor's", count: "Loading...", link: "bachelor", params: { level: "Bachelors" } }
  ]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const data = await api.scholarships.getStats();
        setStatsData(data);

        // Update popular filters with real data
        if (data.breakdown) {
          setPopularFilters([
            { name: "Master's Degree", count: `${data.breakdown.masters}+`, link: "master", params: { level: "Masters" } },
            { name: "Fully Funded", count: `${data.breakdown.fully_funded}+`, link: "full", params: { funding_type: "Fully Funded" } },
            { name: "PhD / Research", count: `${data.breakdown.phd}+`, link: "phd", params: { level: "PhD" } },
            { name: "Bachelor's", count: `${data.breakdown.bachelors}+`, link: "bachelor", params: { level: "Bachelors" } }
          ]);
        }

        // Map disciplines with icons
        const fieldIcons: Record<string, any> = {
          "Engineering": Wrench,
          "Medicine": Stethoscope,
          "Computer Science": Code,
          "Social Sciences": UsersRound,
          "Arts": Palette,
          "Business": Briefcase,
          "Education": GraduationCapIcon,
          "Natural Sciences": Microscope,
          "Law": Scale,
          "Humanities": BookOpen
        };

        const rawFields = (data.fields || []).filter((f: any) => f && f.name);
        const mappedFields = rawFields.map((f: any) => ({
          title: f.name,
          scholarships: (f.count ?? 0).toLocaleString(),
          icon: fieldIcons[f.name] || Atom,
          image: getImageUrl(f.name, 'field'),
          color: "bg-blue-500"
        }));
        setDbFields(mappedFields.length > 0 ? mappedFields : FALLBACK_FIELDS);

        const rawCountries = (data.countries || []).filter((c: any) => c && c.name);
        const mappedCountries = rawCountries.map((c: any) => ({
          name: c.name,
          scholarships: (c.count ?? 0).toLocaleString(),
          image: getImageUrl(c.name, 'country')
        }));
        setDbCountries(mappedCountries.length > 0 ? mappedCountries : FALLBACK_COUNTRIES);
      } catch (err) {
        console.error("Failed to fetch landing stats", err);
        setDbFields(FALLBACK_FIELDS);
        setDbCountries(FALLBACK_COUNTRIES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const totalScholarshipsCount = statsData?.total_scholarships?.toLocaleString() || "0";

  // When guest clicks on disciplines, countries, filters, or search → ask to sign up. When logged in → go to search.
  const handleExploreClick = (action: () => void) => {
    if (!isLoggedIn()) {
      toast.info("Please sign up for this website to explore scholarships.", { duration: 4000 });
      onNavigate("auth-required");
      return;
    }
    action();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-[#1e3a8a]" />
              <span className="text-xl font-semibold text-[#1e3a8a]">ScholarIQ</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#programs" className="text-gray-700 hover:text-[#1e3a8a] transition-colors">Programs</a>
              <button onClick={() => handleExploreClick(() => onNavigate('matcher'))} className="text-gray-700 hover:text-[#1e3a8a] transition-colors">
                Find Universities
              </button>
              <a href="#filters" className="text-gray-700 hover:text-[#1e3a8a] transition-colors">Popular Filters</a>
              <a href="#countries" className="text-gray-700 hover:text-[#1e3a8a] transition-colors">Countries</a>
              <CurrencySelector />
              <Button variant="ghost" onClick={() => onNavigate('login')}>Sign In</Button>
              <Button onClick={() => onNavigate('signup')} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Updated Design */}
      <section className="relative bg-gradient-to-br from-[#0f1f4a] via-[#1e3a8a] to-[#2563eb] text-white overflow-hidden min-h-[600px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1758521541622-d1e6be8c39bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaGVhZHBob25lcyUyMHN0dWR5aW5nJTIwaGFwcHl8ZW58MXx8fHwxNzY2MzQxNTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Student studying with headphones"
            className="w-full h-full object-cover opacity-40"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f4a]/95 via-[#1e3a8a]/80 to-transparent" />

          {/* Decorative Orange Accent */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Find Your Perfect<br />
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Master's Degree
                  </span>
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Explore and compare Master's programmes worldwide. Search by university, subject, location, or scholarships.
                </p>
              </div>

              {/* Search Box */}
              <div className="bg-[#1e3a8a] rounded-2xl p-6 shadow-2xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-white font-semibold mb-4">Search for a Master's degree</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="What do you want to study?"
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 h-12 text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        handleExploreClick(() => onNavigate('search', val ? { keyword: val } : undefined));
                      }
                    }}
                    id="hero-search-input"
                  />
                  <Button
                    className="bg-[#ff6b00] hover:bg-[#ff8533] h-12 px-8 font-bold text-white shadow-lg border border-white/10"
                    onClick={() => {
                      const val = (document.getElementById('hero-search-input') as HTMLInputElement)?.value;
                      handleExploreClick(() => onNavigate('search', val ? { keyword: val } : undefined));
                    }}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{statsData?.total_scholarships?.toLocaleString() || "0"}</div>
                  <div className="text-sm text-blue-200">Total Scholarships</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{statsData?.total_countries || "0"}</div>
                  <div className="text-sm text-blue-200">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{statsData?.total_universities || "0"}</div>
                  <div className="text-sm text-blue-200">Universities</div>
                </div>
              </div>
            </div>

            {/* Right Side - Image space (image is in background) */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* Popular Filters Section */}
      <section id="filters" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore by Program Type</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Quickly find scholarships that match your specific degree level or funding needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularFilters.map((filter, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-6 cursor-pointer border-2 border-gray-100 hover:border-orange-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => handleExploreClick(() => onNavigate('search', filter.params))}
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform ${i === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  i === 1 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    i === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      'bg-gradient-to-br from-orange-500 to-red-600'
                  }`}>
                  {i === 0 && <GraduationCap className="w-7 h-7 text-white" />}
                  {i === 1 && <Banknote className="w-7 h-7 text-white" />}
                  {i === 2 && <Microscope className="w-7 h-7 text-white" />}
                  {i === 3 && <BookOpen className="w-7 h-7 text-white" />}
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#1e3a8a] transition-colors">{filter.name}</h3>
                  <p className="text-gray-500 text-sm font-medium">{filter.count} Scholarships</p>
                </div>

                {/* Arrow */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Disciplines */}
      <section id="programs" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Master By Discipline</h2>
              <p className="text-gray-600">Explore scholarships across real academic disciplines in our database</p>
            </div>
            <Button variant="ghost" className="text-[#1e3a8a] hover:bg-blue-50" onClick={() => handleExploreClick(() => onNavigate('search'))}>
              View all Master Programmes <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {dbFields.map((field, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                onClick={() => handleExploreClick(() => onNavigate('search', { query: field.title }))}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img
                  src={field.image}
                  alt={field.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://picsum.photos/400/300?random=" + i;
                  }}
                />
                <div className="absolute top-4 left-4 z-20">
                  <div className={`p-2 rounded-lg ${field.color} text-white shadow-lg`}>
                    <field.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 p-4 z-20 w-full">
                  <h3 className="font-bold text-white mb-1 group-hover:text-blue-200 transition-colors">{field.title}</h3>
                  <p className="text-gray-300 text-sm">{field.scholarships} scholarships</p>
                </div>
              </div>
            ))}
            {isLoading && Array(5).fill(0).map((_, i) => (
              <div key={`loading-${i}`} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Discover Scholarships by Country</h2>
            <p className="text-gray-600">Find scholarships in available countries within our database</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dbCountries.map((country, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden cursor-pointer h-40 shadow-sm hover:shadow-xl transition-all duration-300"
                onClick={() => handleExploreClick(() => onNavigate('search', { country: country.name }))}
              >
                <img
                  src={country.image}
                  alt={country.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://picsum.photos/400/300?random=" + (i + 10);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 group-hover:to-blue-900/90 transition-colors" />
                <div className="absolute top-0 left-0 p-4">
                  <span className="flex items-center gap-2 text-white font-bold drop-shadow-md">
                    <img
                      src={`https://flagcdn.com/${getFlagCode(country.name)}.svg`}
                      className="w-6 h-4 object-cover rounded shadow-sm"
                      alt="flag"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                    {country.name}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <h3 className="text-white font-bold text-lg mb-1 translate-y-2 group-hover:translate-y-0 transition-transform">{country.name}</h3>
                  <p className="text-blue-200 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">{country.scholarships} scholarships</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Banner */}
      <section className="bg-[#1e3a8a] py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Join our Scholarship Newsletter</h2>
              <p className="text-blue-100">Get the latest scholarships and opportunities delivered to your inbox</p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="bg-white text-[#1e3a8a] hover:bg-gray-100 border-white font-bold px-8 shadow-lg hover:shadow-xl transition-all"
              onClick={() => onNavigate('signup')}
            >
              Subscribe Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600">Four simple steps to find and win your scholarship</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Search,
                title: "Explore",
                description: "Browse 37,000+ verified scholarships from 180+ countries worldwide"
              },
              {
                icon: Users,
                title: "Compare",
                description: "Compare scholarships side by side based on funding, requirements, and deadlines"
              },
              {
                icon: Brain,
                title: "Decide",
                description: "Get AI-powered recommendations matched to your profile and goals"
              },
              {
                icon: Award,
                title: "Apply",
                description: "Track applications and deadlines all in one organized dashboard"
              }
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] border-t-2 border-dashed border-gray-300" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Banner */}
      <section className="bg-[#1e3a8a] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white">Need personalized guidance? Chat with our AI assistant 24/7</p>
            <Button
              variant="outline"
              className="bg-white text-[#1e3a8a] hover:bg-gray-100 border-white"
              onClick={() => onNavigate('signup')}
            >
              Try AI Assistant
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-[#1e3a8a]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
              <p className="text-sm text-gray-600">
                Our intelligent algorithm analyzes your profile to recommend scholarships you're most likely to win.
              </p>
            </Card>
            <Card className="border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">100% Verified</h3>
              <p className="text-sm text-gray-600">
                Every scholarship is verified by our team to ensure legitimacy and protect you from scams.
              </p>
            </Card>
            <Card className="border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-[#1e3a8a]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">
                Get instant answers to your questions with our AI chatbot assistant available anytime.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#dc5635] to-[#e67356] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e3a8a] rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-8 h-8" />
                <span className="text-xl font-semibold">ScholarIQ</span>
              </div>
              <p className="text-sm text-white/90">
                AI-powered scholarship discovery platform helping students worldwide find funding opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li><button onClick={() => handleExploreClick(() => onNavigate('search'))} className="hover:text-white transition-colors text-left">Browse Scholarships</button></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li><a href="#" className="hover:text-white transition-colors">Application Tips</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Study Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Admin Dashboard
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/90">&copy; 2025 ScholarIQ. All rights reserved.</p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => onNavigate('signup')}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper for Flags
function getFlagCode(countryName: string) {
  const map: Record<string, string> = {
    "United Kingdom": "gb",
    "Germany": "de",
    "Canada": "ca",
    "Turkey": "tr",
    "Australia": "au",
    "Malaysia": "my",
    "Saudi Arabia": "sa",
    "UAE": "ae",
    "United States": "us",
    "Pakistan": "pk",
    "India": "in",
    "China": "cn",
    "France": "fr",
    "Netherlands": "nl",
    "Global": "un",
  };
  return map[countryName] || "un";
}
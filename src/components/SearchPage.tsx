import { useState, useEffect, useCallback } from "react";
import { Scholarship } from "../types/scholarship";
import { getDemoScholarships } from "../data/demoScholarships";
import {
  Search,
  GraduationCap,
  Bookmark,
  MapPin,
  Calendar,
  Banknote,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  LayoutGrid,
  List,
  Heart,
  Info,
  Tag,
  Clock,
  Filter,
  Globe,
  ArrowRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";

import { api } from "../api";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { Footer } from "./Footer";
import { AIScholarshipButton } from "./AIScholarshipButton";
import { ThemeToggle } from "./ThemeToggle";
import { Sidebar } from "./Sidebar";
import { useCurrency } from "../context/CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";


const POPULAR_SEARCHES = [
  "UK Masters CS",
  "Australia MBA",
  "Canada PhD",
  "USA Undergrad Engineering",
  "Germany Masters AI"
];

const FIELDS_OF_STUDY = [
  "All Fields",
  "Computer Science",
  "Business & Management",
  "Engineering",
  "Medicine & Health",
  "Arts & Humanities",
  "Natural Sciences",
  "Social Sciences",
  "Law",
  "Architecture"
];

interface FilterState {
  targetCountry: string;
  targetCity: string;
  degreeLevel: string;
  minCGPA: string;
  fieldOfStudy: string;
}

export function SearchPage({ 
  onNavigate = () => { }, 
  initialFilters = {} 
}: { 
  onNavigate?: (page: string, params?: any) => void; 
  initialFilters?: any 
}) {
  const { isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const theme = isDark ? darkTheme : lightTheme;
  
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState<FilterState>({
    targetCountry: "all",
    targetCity: "all",
    degreeLevel: "all",
    minCGPA: "",
    fieldOfStudy: "all"
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [isDemoData, setIsDemoData] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.3 + 0.1,
    }));
    setParticles(ps);
  }, []);

  // Safe Date Formatter
  const formatDeadline = (dateString: string | null | undefined): string => {
    if (!dateString) return "Ongoing / TBA";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Deadline: See Website";
      return `Ends ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch (e) {
      return "Deadline: See Website";
    }
  };

  const fetchScholarships = useCallback(async (page: number, currentQuery: string, currentFilters: FilterState) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = {
        page: page,
        page_size: pageSize,
        keyword: currentQuery || undefined,
        country: currentFilters.targetCountry === "all" ? undefined : currentFilters.targetCountry,
        city: currentFilters.targetCity === "all" ? undefined : currentFilters.targetCity,
        level: currentFilters.degreeLevel === "all" ? undefined : currentFilters.degreeLevel,
        min_cgpa: currentFilters.minCGPA || undefined
      };

      const data = await api.scholarships.list(params);

      // Local sorting by match score for the current page
      const results = data.results || [];
      const sortedResults = [...results].sort((a: Scholarship, b: Scholarship) => 
        (b.match_score || 0) - (a.match_score || 0)
      );

      if (sortedResults.length === 0) {
        const demo = getDemoScholarships(
          currentFilters.targetCountry,
          currentFilters.degreeLevel,
          currentFilters.fieldOfStudy
        );
        setScholarships(demo);
        setTotalResults(demo.length);
        setTotalPages(1);
        setCurrentPage(1);
        setIsDemoData(demo.length > 0);
      } else {
        setScholarships(sortedResults);
        setTotalResults(data.total || 0);
        setTotalPages(data.total_pages || 0);
        setCurrentPage(data.page || 1);
        setIsDemoData(false);
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      const demo = getDemoScholarships(
        currentFilters.targetCountry,
        currentFilters.degreeLevel,
        currentFilters.fieldOfStudy
      );
      if (demo.length > 0) {
        setScholarships(demo);
        setTotalResults(demo.length);
        setTotalPages(1);
        setCurrentPage(1);
        setIsDemoData(true);
        setError(null);
      } else {
        setError("We encountered an issue while searching. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Initial Data Load
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      const newQuery = initialFilters.query || "";
      const newFilters: FilterState = {
        targetCountry: initialFilters.country || initialFilters.targetCountry || "all",
        targetCity: initialFilters.city || initialFilters.targetCity || "all",
        degreeLevel: initialFilters.level || initialFilters.degreeLevel || "all",
        minCGPA: (initialFilters.min_cgpa || initialFilters.minCGPA)?.toString() || "",
        fieldOfStudy: initialFilters.field_of_study || initialFilters.fieldOfStudy || "all"
      };

      setQuery(newQuery);
      setFilters(newFilters);
      fetchScholarships(1, newQuery, newFilters);
    } else {
      // Default: Load latest scholarships on mount even if no filters provided
      fetchScholarships(1, "", filters);
    }
  }, [initialFilters, fetchScholarships]);

  // Auto-search when filters change
  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters.targetCountry, filters.targetCity, filters.degreeLevel, filters.minCGPA]);

  const handleSearch = () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) { 
        p = 100; 
        clearInterval(iv); 
        setTimeout(() => setScanning(false), 400); 
      }
      setScanProgress(Math.min(p, 100));
    }, 120);

    setCurrentPage(1);
    fetchScholarships(1, query, filters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchScholarships(newPage, query, filters);
    const mainArea = document.getElementById('search-main-content');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (id: number) => {
    if (savedIds.has(id)) return;
    setSavingId(id);
    try {
      await api.dashboard.save(id);
      setSavedIds(prev => new Set(Array.from(prev).concat(id)));
    } catch (err) {
      console.error("Failed to save scholarship", err);
    } finally {
      setSavingId(null);
    }
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Elite Glass-morphism UI Constants (Maximum Polish)
  const glassCardStyle = { 
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(30px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
  };

  return (
    <div className="min-h-screen flex w-full overflow-hidden selection:bg-blue-500/30" style={{ 
      backgroundColor: '#020617', // Deeper midnight for more contrast
      color: '#ffffff' 
    }}>
      {/* Sidebar Desktop Wrapper */}
      <div className="hidden lg:block shrink-0 relative z-50" style={{ width: '260px' }}>
        <Sidebar onNavigate={onNavigate} currentPage="search" />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <style>{`
          @keyframes quantum-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
        `}</style>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: "1px solid rgba(129,140,248,0.08)",
          backdropFilter: "blur(12px)",
          background: "rgba(6,8,24,0.6)",
          position: "relative", zIndex: 40,
        }}>

          {/* Logo + Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(99,102,241,0.45)",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", lineHeight: 1.2 }}>
                NEURAL ENGINE
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ color: "rgba(129,140,248,0.7)", fontSize: 11, letterSpacing: "0.12em" }}>
                  QUANTUM MATCH V4.0
                </span>
                <span style={{
                  padding: "1px 8px",
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 100, fontSize: 10,
                  color: "#4ade80", letterSpacing: "0.1em", fontWeight: 600,
                }}>
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

            {/* Real-time badge */}
            <div className="hidden md:flex" style={{
              alignItems: "center", gap: 8,
              padding: "7px 14px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 100,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                animation: "quantum-pulse 2s infinite",
                flexShrink: 0,
              }} />
              <span style={{ color: "rgba(134,239,172,0.85)", fontSize: 11, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                REAL-TIME DATA ACTIVE
              </span>
            </div>

            <ThemeToggle />
            <CurrencySelector variant="dark" />

            {/* Back to Portal button */}
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                padding: "8px 18px",
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 8, color: "#a5b4fc", fontSize: 12,
                cursor: "pointer", letterSpacing: "0.06em",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              BACK TO PORTAL
            </button>
          </div>

        </header>

        {/* Scrollable Main Content */}
        <main id="search-main-content" className="flex-1 overflow-y-auto custom-scrollbar" style={{
          background: "linear-gradient(135deg, #060818 0%, #0a0f2e 40%, #050d1f 100%)",
          fontFamily: "'Syne', 'Space Grotesk', sans-serif",
          position: "relative",
          overflowX: "hidden"
        }}>
          {/* Ambient glow orbs */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-10%", left: "20%", width: 600, height: 600, background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "5%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", top: "30%", right: "25%", width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
            {/* Grid lines */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
              <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#818cf8" strokeWidth="0.5" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* Floating particles */}
            {particles.map((p: any) => (
              <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: "50%", background: "#818cf8", opacity: p.opacity }} />
            ))}
          </div>

          <section style={{ maxWidth: 900, margin: "0 auto", padding: "70px 40px 60px", position: "relative", zIndex: 5 }}>
            {/* Badge */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 100, fontSize: 11, letterSpacing: "0.14em", color: "#a5b4fc" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                AI-POWERED INTELLIGENT SEARCH
              </span>
            </div>

            {/* Hero text */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, margin: 0, background: "linear-gradient(135deg, #fff 0%, #c7d2fe 50%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                FIND YOUR<br />
                <span style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>PERFECT MATCH</span>
              </h1>
            </div>

            <p style={{ textAlign: "center", color: "rgba(165,180,252,0.6)", fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 50px" }}>
              Scan through 10,000+ verified opportunities across 50 countries.
              Our neural matching engine finds the perfect fit for your ambition.
            </p>

            {/* Stats row */}
            <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 50 }}>
              {[
                { value: "98%", label: "Match Accuracy" },
                { value: "2.4s", label: "Search Latency" },
                { value: "50+", label: "Global Clusters" },
              ].map((s, i, arr) => (
                <div key={i} style={{ textAlign: "center", padding: "0 40px", borderRight: i < arr.length - 1 ? "1px solid rgba(99,102,241,0.2)" : "none", flex: 1 }}>
                  <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, background: "linear-gradient(135deg, #fff, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ color: "rgba(129,140,248,0.5)", fontSize: 11, letterSpacing: "0.12em", marginTop: 4 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Search card */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "32px", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              {/* Search bar */}
              <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px", position: "relative", display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: 16, color: "rgba(129,140,248,0.4)", display: "flex", alignItems: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearch();
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Enter program, university, or keywords..."
                    style={{ width: "100%", padding: "16px 16px 16px 46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                    onFocusCapture={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                    onBlurCapture={e => {
                      e.target.style.borderColor = "rgba(99,102,241,0.25)";
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  {showSuggestions && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, marginTop: "12px",
                      zIndex: 100,
                      background: "rgba(10, 15, 46, 0.98)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "24px",
                      padding: "24px",
                      boxShadow: "0 40px 100px rgba(0,0,0,0.8)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                           <Sparkles size={16} color="#818cf8" />
                           <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#fff" }}>Recommended Scans</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {POPULAR_SEARCHES.map(s => (
                          <button 
                            key={s} 
                            onClick={() => { setQuery(s); handleSearch(); setShowSuggestions(false); }}
                            style={{
                              padding: "12px 24px",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "16px",
                              fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                              color: "#fff", cursor: "pointer", transition: "all 0.2s"
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(79,70,229,0.3)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={scanning || loading}
                  style={{
                    padding: "16px 28px",
                    background: (scanning || loading) ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.06em", transition: "all 0.3s", boxShadow: (scanning || loading) ? "none" : "0 0 30px rgba(99,102,241,0.4)", display: "flex", alignItems: "center", gap: 8,
                    flex: "1 1 auto", justifyContent: "center"
                  }}
                >
                  {(scanning || loading) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                      </svg>
                      SCANNING...
                    </>
                  ) : (
                    <>
                      START INTELLIGENT SCAN
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              {(scanning || loading) && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(129,140,248,0.6)", letterSpacing: "0.1em" }}>NEURAL SCAN IN PROGRESS</span>
                    <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600 }}>{Math.round(scanProgress)}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(99,102,241,0.15)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 100, background: "linear-gradient(90deg, #6366f1, #a78bfa)", width: `${scanProgress}%`, transition: "width 0.1s", boxShadow: "0 0 10px rgba(99,102,241,0.6)" }} />
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div style={{ color: "rgba(129,140,248,0.5)", fontSize: 10, letterSpacing: "0.14em", marginBottom: 8 }}>LOCATION</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={filters.targetCountry}
                      onChange={e => updateFilter('targetCountry', e.target.value)}
                      style={{ width: "100%", padding: "12px 36px 12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, appearance: "none", cursor: "pointer", outline: "none" }}
                    >
                      <option value="all" style={{ background: "#0a0f2e" }}>🌍 Global (All)</option>
                      <option value="United States" style={{ background: "#0a0f2e" }}>�� United States</option>
                      <option value="United Kingdom" style={{ background: "#0a0f2e" }}>�� United Kingdom</option>
                      <option value="Canada" style={{ background: "#0a0f2e" }}>�� Canada</option>
                      <option value="Australia" style={{ background: "#0a0f2e" }}>�� Australia</option>
                      <option value="Germany" style={{ background: "#0a0f2e" }}>� Germany</option>
                    </select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(129,140,248,0.5)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ color: "rgba(129,140,248,0.5)", fontSize: 10, letterSpacing: "0.14em", marginBottom: 8 }}>FIELD OF STUDY</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={filters.fieldOfStudy}
                      onChange={e => updateFilter('fieldOfStudy', e.target.value)}
                      style={{ width: "100%", padding: "12px 36px 12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, appearance: "none", cursor: "pointer", outline: "none" }}
                    >
                      {FIELDS_OF_STUDY.map(f => <option key={f} value={f === "All Fields" ? "all" : f} style={{ background: "#0a0f2e" }}>{f}</option>)}
                    </select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(129,140,248,0.5)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ color: "rgba(129,140,248,0.5)", fontSize: 10, letterSpacing: "0.14em", marginBottom: 8 }}>DEGREE LEVEL</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={filters.degreeLevel}
                      onChange={e => updateFilter('degreeLevel', e.target.value)}
                      style={{ width: "100%", padding: "12px 36px 12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, appearance: "none", cursor: "pointer", outline: "none" }}
                    >
                      <option value="all" style={{ background: "#0a0f2e" }}>Any Degree</option>
                      <option value="Undergraduate" style={{ background: "#0a0f2e" }}>Undergraduate</option>
                      <option value="Masters" style={{ background: "#0a0f2e" }}>Masters</option>
                      <option value="PhD" style={{ background: "#0a0f2e" }}>PhD / Doctorate</option>
                    </select>
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(129,140,248,0.5)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ color: "rgba(129,140,248,0.5)", fontSize: 10, letterSpacing: "0.14em", marginBottom: 8 }}>MIN GPA</div>
                  <input
                    type="number"
                    value={filters.minCGPA}
                    onChange={e => updateFilter('minCGPA', e.target.value)}
                    min="0" max="4" step="0.1"
                    placeholder="3.5"
                    style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocusCapture={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlurCapture={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={handleSearch}
                disabled={scanning || loading}
                style={{
                  width: "100%", padding: "20px",
                  background: (scanning || loading) ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  border: (scanning || loading) ? "1px solid rgba(99,102,241,0.4)" : "none",
                  borderRadius: 16, color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transition: "all 0.3s", boxShadow: (scanning || loading) ? "none" : "0 4px 40px rgba(99,102,241,0.35)",
                }}
              >
                {(scanning || loading) ? "SCANNING NEURAL CLUSTERS..." : "FIND MATCHES NOW"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>

            {/* Bottom hint */}
            <p style={{ textAlign: "center", color: "rgba(99,102,241,0.35)", fontSize: 12, marginTop: 20, letterSpacing: "0.06em" }}>
              10,000+ verified opportunities · 50 countries · Updated daily
            </p>
          </section>

          {/* AI Active Indicator Chips */}
          <div className="flex flex-wrap gap-3 mt-10 px-8 max-w-6xl mx-auto relative z-10">
            {Object.entries(filters).map(([key, value]) => {
              if (value === "all" || value === "") return null;
              return (
                <div key={key} className="flex items-center gap-3 px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-left duration-500">
                  <span className="opacity-40">{key === "minCGPA" ? "GPA" : key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-white">{value}</span>
                  <button onClick={() => updateFilter(key as any, key === "minCGPA" ? "" : "all")} className="hover:text-red-400 transition-colors ml-1">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Results Header & Status Bar */}
          <div className="px-8 mt-16 mb-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-4">
                  {scholarships.length > 0 && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full pulse-dot shadow-[0_0_15px_#3b82f6]" />
                  )}
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    {scholarships.length > 0 
                      ? `${totalResults} Global Opportunities Found` 
                      : "Refine filters to discover matches"}
                  </span>
               </div>
               {scholarships.length > 0 && (
                 <>
                   <div className="hidden lg:block h-5 w-px bg-white/10" />
                   <span className="hidden lg:block text-[11px] font-black uppercase tracking-widest text-slate-400">
                     Intelligence Scan Complete
                   </span>
                 </>
               )}
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:bg-white/10'}`}
               >
                 <LayoutGrid size={20} />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:bg-white/10'}`}
               >
                 <List size={20} />
               </button>
            </div>
          </div>

          <div className="px-8 pb-32 max-w-7xl mx-auto">
            {isDemoData && !loading && scholarships.length > 0 && (
              <div className="mb-6 flex items-center gap-3 px-5 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs font-black uppercase tracking-widest text-amber-400">Sample Results</p>
                <span className="text-xs text-slate-400 font-medium normal-case tracking-normal">— Showing representative scholarships. Connect to backend for live data.</span>
              </div>
            )}
            {loading ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-8"}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-72 rounded-[2.5rem] skeleton-shimmer border border-white/10" />
                ))}
              </div>
            ) : error ? (
              <div className="py-24 text-center bg-red-500/5 rounded-[3rem] border border-red-500/20 max-w-3xl mx-auto">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <AlertCircle className="text-red-500 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-white">System Error</h3>
                <p className="text-slate-400 max-w-md mx-auto font-medium">{error}</p>
                <Button variant="outline" className="mt-8 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 h-12 px-8" onClick={handleSearch}>Retry Scan</Button>
              </div>
            ) : scholarships.length === 0 ? (
              <div style={{
                position: "relative", overflow: "hidden", 
                background: "rgba(255,255,255,0.02)", 
                border: "1px solid rgba(99,102,241,0.15)", 
                borderRadius: "32px", padding: "80px 40px", 
                textAlign: "center", maxWidth: 700, margin: "0 auto", 
                boxShadow: "0 0 80px rgba(99,102,241,0.05)"
              }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                
                <div style={{ width: 80, height: 80, margin: "0 auto 32px", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(99,102,241,0.3)", position: "relative" }}>
                   <div style={{ position: "absolute", inset: -2, borderRadius: "26px", border: "1px solid rgba(99,102,241,0.3)", opacity: 0.5, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                   <Search size={32} color="#818cf8" style={{ filter: "drop-shadow(0 0 10px rgba(129,140,248,0.5))" }} />
                </div>
                
                <h3 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 16px 0", color: "#fff", letterSpacing: "-0.02em" }}>No Neural Matches Found</h3>
                
                <p style={{ color: "rgba(165,180,252,0.6)", fontSize: 15, lineHeight: 1.6, maxWidth: 440, margin: "0 auto 40px" }}>
                  The engine couldn't locate scholarships for these exact parameters in our global cluster. Try widening your scan to discover more opportunities.
                </p>
                
                <button
                  onClick={() => {
                    setFilters({ targetCountry: "all", targetCity: "all", degreeLevel: "all", minCGPA: "", fieldOfStudy: "all" });
                    setQuery("");
                  }}
                  style={{ 
                    background: "rgba(99,102,241,0.1)", 
                    border: "1px solid rgba(99,102,241,0.3)", 
                    borderRadius: "16px", padding: "16px 32px", 
                    color: "#a5b4fc", fontSize: 12, fontWeight: 800, 
                    textTransform: "uppercase", letterSpacing: "0.15em", 
                    cursor: "pointer", transition: "all 0.3s", 
                    display: "inline-flex", alignItems: "center", gap: 12 
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.color = "#a5b4fc"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                >
                  <X size={16} /> CLEAR ALL PARAMETERS
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>

                {scholarships.map((s) => {
                  const score = s.match_score ?? 0;
                  const matchColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#6366f1';
                  const matchBg = score >= 80 ? 'linear-gradient(135deg,#059669,#10b981)' : score >= 60 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#4f46e5,#6366f1)';
                  const isSaved = savedIds.has(s.id);

                  const rawDL = s.deadline ? new Date(s.deadline) : null;
                  const dlDate = rawDL && !isNaN(rawDL.getTime()) ? rawDL : null;
                  const daysLeft = dlDate ? Math.ceil((dlDate.getTime() - Date.now()) / 86400000) : null;
                  const dlExpired = daysLeft !== null && daysLeft < 0;
                  const dlUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                  const dlWarn   = daysLeft !== null && daysLeft > 30 && daysLeft <= 60;
                  const dlColor  = dlExpired ? '#ef4444' : dlUrgent ? '#f97316' : dlWarn ? '#f59e0b' : '#10b981';
                  const dlBg     = dlExpired ? 'rgba(239,68,68,0.12)' : dlUrgent ? 'rgba(249,115,22,0.12)' : dlWarn ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
                  const dlBorder = dlExpired ? 'rgba(239,68,68,0.3)' : dlUrgent ? 'rgba(249,115,22,0.3)' : dlWarn ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)';
                  const dlLabel  = dlExpired ? 'EXPIRED' : daysLeft !== null ? `${daysLeft}D LEFT` : 'NO DATE';
                  const dlFormatted = dlDate ? dlDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified';

                  return (
                  <div
                    key={s.id}
                    style={{
                      background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
                      border: isSaved ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: isSaved ? '0 8px 32px rgba(16,185,129,0.15)' : '0 8px 32px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Top accent bar */}
                    <div style={{ height: 3, background: isSaved ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#4f46e5,#6366f1,#818cf8)' }} />

                    {/* Card Header */}
                    <div style={{ padding: '16px 20px 14px', background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 6 }}>
                          {s.title}
                        </h3>
                        {/* Meta chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {s.university_name && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                              <GraduationCap size={10} /> {s.university_name}
                            </span>
                          )}
                          {s.country && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                              🌍 {s.country}
                            </span>
                          )}
                          {s.degree_level && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>
                              {s.degree_level}
                            </span>
                          )}
                          {s.funding_type && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#c4b5fd' }}>
                              {s.funding_type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match badge + Save */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {score > 0 && (
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: matchBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${matchColor}55` }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}%</span>
                            <span style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>MATCH</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSave(s.id); }}
                          style={{ background: isSaved ? 'rgba(16,185,129,0.15)' : 'rgba(30,41,59,0.8)', border: isSaved ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', color: isSaved ? '#10b981' : '#94a3b8', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                        >
                          <Heart size={12} fill={isSaved ? '#10b981' : 'none'} />
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Match progress bar */}
                    {score > 0 && (
                      <div style={{ padding: '10px 20px 4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Eligibility Match</span>
                          <span style={{ fontSize: 9, fontWeight: 800, color: matchColor }}>{score}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(30,41,59,0.8)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: matchBg, borderRadius: 99, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* Funding + Deadline pills */}
                    <div style={{ padding: '12px 20px', display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Banknote size={10} /> FUNDING
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
                          {s.scholarship_amount_value
                            ? s.scholarship_amount_value
                            : s.scholarship_amount_numeric && s.scholarship_amount_numeric > 0
                            ? convertAndFormat(String(s.scholarship_amount_numeric))
                            : s.funding_amount && s.funding_amount !== '0'
                            ? s.funding_amount
                            : s.funding_type === 'Fully Funded'
                            ? 'Full Coverage'
                            : 'See Details'}
                        </div>
                      </div>

                      <div style={{ flex: 1, background: dlBg, border: `1px solid ${dlBorder}`, borderRadius: 12, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: dlColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> DEADLINE · {dlLabel}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{dlFormatted}</div>
                      </div>
                    </div>

                    {/* AI Action Guide */}
                    <div style={{ padding: '0 20px 12px' }}>
                      <AIScholarshipButton
                        scholarship={{
                          id: s.id,
                          title: s.title,
                          university_name: s.university_name,
                          country: s.country,
                          amount: s.scholarship_amount_value || s.funding_amount || s.amount,
                          deadline: s.deadline,
                          degree_level: s.degree_level,
                          funding_type: s.funding_type,
                        }}
                        variant="dark"
                      />
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '12px 20px', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {s.degree_level || 'Graduate'}
                        </span>
                        <span style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 9, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          ✓ Verified
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigate('detail', { id: s.id })}
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        EXPLORE <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  );
                })}
                
                {/* Pagination Protocol */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-4 mt-20 pb-12">
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1 || loading} 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="rounded-2xl h-14 px-8 font-black border-white/10 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" /> Prev
                    </Button>
                    
                    <div className="flex items-center gap-2 px-8 py-4 bg-white/5 rounded-2xl font-black border border-white/10 backdrop-blur-md">
                       <span className="opacity-40 text-xs">PAGE</span>
                       <span className="text-blue-500">{currentPage}</span>
                       <span className="opacity-20 mx-1">/</span>
                       <span>{totalPages}</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      disabled={currentPage === totalPages || loading} 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="rounded-2xl h-14 px-8 font-black border-white/10 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                    >
                      Next <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Footer onNavigate={onNavigate} />
        </main>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #3b82f6, #6366f1, #9333ea, #3b82f6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .card-lift {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -12px rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.3);
        }

        @keyframes skeleton-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
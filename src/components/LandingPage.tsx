import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { 
  GraduationCap, 
  Search, 
  UserPlus, 
  FileEdit, 
  Trophy, 
  ArrowRight, 
  Menu,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mail,
  Zap
} from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";
import { toast } from "sonner";
import { Footer } from "./Footer";
import { HeroSlider } from "./landing/HeroSlider";

const isLoggedIn = () => !!localStorage.getItem("token");

const countries = [
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    count: "600+ scholarships",
    img: "/uk_country.png",
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    count: "800+ scholarships",
    img: "/australia_country.png",
  },
  {
    name: "Germany",
    flag: "🇩🇪",
    count: "1200+ scholarships",
    img: "/germany_country.png",
  },
  {
    name: "Canada",
    flag: "🇨🇦",
    count: "600+ scholarships",
    img: "/canada_country.png",
  },
];

const steps = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    title: "Create Your Profile",
    desc: "Create your profile and tell us about your scholarships",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: "Find Scholarships",
    desc: "Find latest scholarships and find scholarships",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
        <polyline points="9,9 10,9 11,9" />
      </svg>
    ),
    title: "Apply Online",
    desc: "Apply online to stay on your planning.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <polyline points="6,9 12,15 18,9" />
        <path d="M12 3L4.5 7.5v9L12 21l7.5-4.5v-9L12 3z" />
      </svg>
    ),
    title: "Win Your Future",
    desc: "Success the second to build your scholarship.",
  },
];

export function LandingPage({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setUserLoggedIn(!!localStorage.getItem("token"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserLoggedIn(false);
    toast.success("Logged out successfully");
  };

  const calculateDaysRemaining = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const featuredScholarships = [
    { 
      title: "Hamburg International Excellence Award", 
      uni: "University of Hamburg", 
      logo: "/hamburg_logo.png", 
      image: "/hamburg_campus.png",
      amount: "Full Funding", 
      deadline: "2026-08-31" 
    },
    { 
      title: "Ankara Graduate Excellence Award", 
      uni: "Ankara University", 
      logo: "/ankara_logo.png", 
      image: "/ankara_campus.png",
      amount: "€12,000 / year", 
      deadline: "2026-08-31" 
    },
    { 
      title: "Hacettepe International Masters Scholarship", 
      uni: "Hacettepe University", 
      logo: "/hacettepe_logo.png", 
      image: "/hacettepe_campus.png",
      amount: "Tuition + Stipend", 
      deadline: "2026-08-31" 
    }
  ];

  const handleExploreClick = (action: () => void) => {
    if (!userLoggedIn) {
      toast.info("Please sign up to explore scholarships.");
      onNavigate("signup");
      return;
    }
    action();
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');

        .nav-link {
          color: #1a2250;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          display: flex; align-items: center; gap: 4px;
        }
        .nav-link:hover { color: #f4c44e; }

        .btn-login {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.35);
          color: #fff;
          padding: 7px 18px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-login:hover { background: rgba(255,255,255,0.1); }

        .btn-signup {
          background: #f4c44e;
          border: none;
          color: #1a1f3a;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-signup:hover { background: #e8b43a; transform: translateY(-1px); }

        .cat-card {
          background: #fff;
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          flex: 1;
          min-width: 120px;
          box-shadow: 0 4px 16px rgba(45,53,97,0.08);
          transition: all 0.25s;
          cursor: pointer;
          border: 1.5px solid transparent;
        }
        .cat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(45,53,97,0.15);
          border-color: #f4c44e;
        }

        .scholarship-card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: all 0.3s;
          flex: 1;
          min-width: 280px;
          position: relative;
        }
        .scholarship-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }
        .days-badge {
          background: linear-gradient(135deg, #f4c44e 0%, #c8a63a 100%);
          color: #1a1f3a;
          padding: 8px 12px;
          border-radius: 12px;
          text-align: center;
          min-width: 70px;
          box-shadow: 0 4px 10px rgba(244,196,78,0.3);
        }

        .country-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          flex: 1;
          min-width: 180px;
          box-shadow: 0 4px 16px rgba(45,53,97,0.08);
          transition: all 0.25s;
          cursor: pointer;
        }
        .country-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(45,53,97,0.18);
        }
        .country-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }

        .step-item {
          text-align: center;
          flex: 1;
          padding: 0 16px;
          transition: transform 0.2s;
        }
        .step-item:hover { transform: translateY(-4px); }

        .step-icon {
          width: 64px; height: 64px;
          background: #f4f6fb;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          color: #2d3561;
          transition: all 0.2s;
        }
        .step-item:hover .step-icon {
          background: #f4c44e;
          color: #1a1f3a;
        }

        .subscribe-input {
          flex: 1;
          padding: 13px 18px;
          border-radius: 8px 0 0 8px;
          border: none;
          font-size: 14px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .subscribe-btn {
          background: #f4c44e;
          border: none;
          padding: 13px 22px;
          border-radius: 0 8px 8px 0;
          font-weight: 700;
          font-size: 14px;
          color: #1a1f3a;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .subscribe-btn:hover { background: #e8b43a; }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        background: "#ffffff",
        padding: "0 40px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        borderBottom: "1px solid #f0f0f0"
      }}>
        {/* Logo */}
        <div 
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <GraduationCap size={28} color="#1a2250" />
          <span style={{ color: "#1a2250", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.5px" }}>
            Scholar<span style={{ color: "#1a2250" }}>IQ</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="nav-links" style={{ display: "flex", gap: "28px" }}>
          <span className="nav-link" onClick={() => onNavigate("search")}>Programs</span>
          <span className="nav-link" onClick={() => onNavigate("matcher")}>Find Universities</span>
          <span className="nav-link" onClick={() => onNavigate("search")}>Popular Filters</span>
          <span className="nav-link" onClick={() => {
            const el = document.getElementById('countries-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>Countries</span>
        </div>

        {/* Auth Buttons */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {userLoggedIn ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Button 
                onClick={() => onNavigate("dashboard")}
                className="bg-[#1a2250] hover:bg-[#2d3561] text-white rounded-lg px-6 h-10 text-sm font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
                style={{ backgroundColor: '#1a2250', color: '#ffffff' }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="text-[#1a2250] hover:bg-red-50 hover:text-red-600 h-10 px-4 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button 
                onClick={() => onNavigate("login")}
                style={{ 
                  background: "none", border: "none", color: "#1a2250", 
                  fontWeight: 600, fontSize: "14px", cursor: "pointer" 
                }}
              >
                Sign In
              </button>
              <Button 
                onClick={() => onNavigate("signup")}
                className="bg-[#1a2250] hover:bg-[#2d3561] text-white rounded-lg px-6 h-10 text-sm font-semibold"
              >
                Get Started
              </Button>
            </div>
          )}
          <CurrencySelector />
        </div>
      </nav>

      <HeroSlider onSearch={(q) => onNavigate("search", { keyword: q })} onCta={() => {}} />

      {/* ─── CATEGORY CARDS (overlapping hero) ─── */}
      <div style={{ maxWidth: "900px", margin: "-50px auto 0", padding: "0 32px", position: "relative", zIndex: 10 }}>
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          {[
            { icon: "🎓", label: "Degrees", action: () => onNavigate("search", { type: "Master's" }) },
            { icon: "📖", label: "Universities", action: () => onNavigate("search") },
            { icon: "📍", label: "Countries", action: () => onNavigate("search") },
            { icon: "💼", label: "Scholarships", action: () => onNavigate("search", { hasScholarship: true }) },
          ].map(card => (
            <div key={card.label} className="cat-card" onClick={card.action}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{card.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#2d3561" }}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── DISCOVER BY COUNTRY ─── */}
      <section id="countries-section" style={{ maxWidth: "1000px", margin: "64px auto 0", padding: "0 32px" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "26px", fontWeight: 700, color: "#1a2250", marginBottom: "24px" }}>
          Discover Scholarships by Country
        </h2>
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          {countries.map(c => (
            <div key={c.name} className="country-card" onClick={() => handleExploreClick(() => onNavigate("search", { country: c.name }))}>
              <img src={c.img} alt={c.name} className="country-img" />
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "18px" }}>{c.flag}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a2250" }}>{c.name}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#8892b0", fontWeight: 500 }}>{c.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED SCHOLARSHIPS ─── */}
      <section style={{ maxWidth: "1000px", margin: "64px auto 0", padding: "0 32px" }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "26px", fontWeight: 700, color: "#1a2250", marginBottom: "28px" }}>
          Featured Scholarships
        </h2>
        <div className="flex flex-wrap md:flex-nowrap gap-6">
          {featuredScholarships.map((s, i) => (
            <div key={i} className="scholarship-card">
              {/* University Image */}
              <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                <img src={s.image} alt={s.uni} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(to bottom, transparent 60%, rgba(255,255,255,1) 100%)"
                }} />
              </div>

              <div style={{ padding: "0 24px 24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a2250", marginBottom: "20px", height: "40px" }}>{s.title}</h3>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={s.logo} alt={s.uni} style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "8px" }} onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.uni)}&background=f4c44e&color=1a1f3a&bold=true`;
                    }} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#2d3561" }}>{s.uni}</div>
                      <div style={{ fontSize: "12px", color: "#8892b0" }}>{s.amount}</div>
                    </div>
                  </div>
                
                <div className="days-badge">
                  <div style={{ fontSize: "18px", fontWeight: 800 }}>{calculateDaysRemaining(s.deadline)}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Days Left</div>
                </div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate("search")}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "20px",
                  background: "linear-gradient(90deg, #1a2250 0%, #2d3561 100%)",
                  color: "#fff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TRUSTED BY UNIVERSITIES ─── */}
      <section style={{ background: "#edf2f9", padding: "64px 40px", margin: "64px 0 0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "24px", fontWeight: 700, color: "#1a2250", marginBottom: "40px" }}>
            Trusted by Universities
          </h2>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "48px", 
            flexWrap: "wrap",
            opacity: 0.6
          }}>
            {[
              "/cambridge_logo.png",
              "/harvard_logo.png",
              "/mit_logo.png",
              "/stanford_logo.png",
              "/toronto_logo.png",
              "/imperial_logo.png"
            ].map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt="University" 
                style={{ 
                  height: "80px", 
                  width: "auto",
                  filter: "grayscale(100%)", 
                  opacity: 0.7,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  margin: "0 20px"
                }} 
                onMouseEnter={e => {
                  e.currentTarget.style.filter = "grayscale(0%)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1.15)";
                }}
                onMouseLeave={e => {
          e.currentTarget.style.filter = "grayscale(100%)";
                  e.currentTarget.style.opacity = "0.7";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER SECTION (Elite Glassmorphism) ─── */}
      <section style={{ maxWidth: "1100px", margin: "80px auto", padding: "0 32px" }}>
        <div style={{
          background: "linear-gradient(145deg, rgba(26, 34, 80, 0.95), rgba(10, 15, 45, 0.98))",
          backdropFilter: "blur(24px)",
          borderRadius: "40px",
          padding: "80px 60px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Animated Background Elements */}
          <div style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(244, 196, 78, 0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
            animation: "pulse 10s infinite alternate"
          }} />
          <div style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(78, 120, 244, 0.05) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none"
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "72px",
                height: "72px",
                background: "rgba(244, 196, 78, 0.12)",
                borderRadius: "24px",
                marginBottom: "32px",
                color: "#f4c44e",
                boxShadow: "0 10px 30px rgba(244, 196, 78, 0.15)",
                border: "1px solid rgba(244, 196, 78, 0.2)"
              }}
            >
              <Mail size={32} strokeWidth={1.5} />
            </motion.div>

            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              color: "#fff",
              fontSize: "40px",
              fontWeight: 800,
              marginBottom: "16px",
              letterSpacing: "-1.5px",
              lineHeight: 1.1
            }}>
              Master Your <span style={{ 
                background: "linear-gradient(90deg, #f4c44e, #fff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800
              }}>Scholarship Journey</span>
            </h2>
            <p style={{ 
              color: "rgba(255, 255, 255, 0.6)", 
              fontSize: "18px", 
              marginBottom: "48px", 
              maxWidth: "600px", 
              marginInline: "auto", 
              fontWeight: 400,
              lineHeight: 1.6
            }}>
              Join 50,000+ students receiving weekly curated lists of fully-funded <br/> opportunities and elite application strategies.
            </p>

            <div style={{ 
              display: "flex", 
              alignItems: "center",
              maxWidth: "600px", 
              margin: "0 auto", 
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "28px",
              padding: "6px",
              backdropFilter: "blur(20px)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              position: "relative",
              zIndex: 10
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(244, 196, 78, 0.4)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            >
              <div style={{ paddingLeft: "24px", color: "rgba(255,255,255,0.3)" }}>
                <Mail size={20} />
              </div>
              <input
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  padding: "0 16px",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 500,
                  outline: "none",
                  height: "60px"
                }}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 12px 30px rgba(244, 196, 78, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: "linear-gradient(135deg, #f4c44e 0%, #d4a017 100%)",
                  color: "#1a1f3a",
                  border: "none",
                  borderRadius: "22px",
                  padding: "0 32px",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 20px rgba(244, 196, 78, 0.3)",
                  whiteSpace: "nowrap",
                  height: "56px",
                  margin: "2px"
                }}
                onClick={() => {
                  if(!email) return toast.error("Please enter your email");
                  toast.success("Welcome to the inner circle! Check your inbox.");
                  setEmail("");
                }}
              >
                Get Elite Access
              </motion.button>
            </div>
            
            <div style={{ 
              marginTop: "24px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "12px",
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "13px",
              fontWeight: 500
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%" }} />
                Weekly Updates
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.1)" }}>|</span>
              <span>No Spam, Ever</span>
              <span style={{ color: "rgba(255, 255, 255, 0.1)" }}>|</span>
              <span>Unsubscribe Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS STEPS ─── */}
      <section style={{ maxWidth: "1200px", margin: "80px auto 0", padding: "0 32px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#1a2250", marginBottom: "16px" }}>
            How ScholarIQ <span style={{ color: "#6366f1" }}>Works</span>
          </h2>
          <p style={{ color: "#64748b", maxWidth: "600px", margin: "0 auto" }}>
            Four simple steps to find, match, and apply for your dream scholarship with AI-powered precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { ...steps[0], action: () => onNavigate(userLoggedIn ? "dashboard" : "signup") },
            { ...steps[1], action: () => onNavigate("search") },
            { ...steps[2], action: () => onNavigate("search") },
            { ...steps[3], action: () => onNavigate(userLoggedIn ? "dashboard" : "signup") },
          ].map((step, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -10, borderColor: "rgba(99, 102, 241, 0.5)" }}
              onClick={step.action}
              style={{
                cursor: "pointer",
                background: "#ffffff",
                border: "1px solid #e8eaf3",
                borderRadius: "24px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                boxShadow: "0 4px 20px rgba(26, 34, 80, 0.06)",
                transition: "all 0.4s ease"
              }}
            >
              <div style={{ 
                width: "56px", 
                height: "56px", 
                borderRadius: "16px", 
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6366f1",
                boxShadow: "0 8px 16px rgba(99, 102, 241, 0.1)"
              }}>
                {step.icon}
              </div>
              
              <div>
                <div style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#1a2250",
                  marginBottom: "10px"
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: 1.6,
                  fontWeight: 500
                }}>
                  {step.desc}
                </div>
              </div>

              <div style={{ 
                marginTop: "auto",
                fontSize: "12px",
                fontWeight: 700,
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                Get Started <Zap size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section style={{ maxWidth: "1000px", margin: "48px auto 64px", padding: "0 32px" }}>
        <div style={{
          background: "linear-gradient(90deg, #c8a63a 0%, #f4c44e 50%, #c8a63a 100%)",
          borderRadius: "16px",
          padding: "22px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: "18px", fontWeight: 700, color: "#1a1f3a" }}>
            Ready to Get Started?
          </span>
          <button style={{
            background: "#1a2250",
            color: "#f4c44e",
            border: "none",
            borderRadius: "10px",
            padding: "12px 26px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            transition: "all 0.2s"
          }}
            onClick={() => onNavigate("signup")}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Get Started Free →
          </button>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

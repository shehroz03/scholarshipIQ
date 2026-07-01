import { GraduationCap, Target, Shield, Users, Zap, Globe } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { Footer } from "./Footer";

export function AboutPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  const values = [
    { icon: <Target size={24} />, title: "Mission", desc: "To make world-class education accessible to every student by connecting them with the right scholarships and opportunities." },
    { icon: <Shield size={24} />, title: "Trust", desc: "Every scholarship on ScholarIQ is verified for legitimacy. Our fraud detection system ensures only real opportunities reach students." },
    { icon: <Zap size={24} />, title: "AI-Powered", desc: "Our intelligent matching engine analyzes your profile, goals, and background to surface the most relevant scholarships for you." },
    { icon: <Globe size={24} />, title: "Global Reach", desc: "We cover scholarships across 50+ countries including USA, UK, Canada, Germany, Australia and more." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, color: theme.text }}>
      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => onNavigate("landing")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>Scholar<span style={{ color: "#f4c44e" }}>IQ</span></span>
        </button>
        <button onClick={() => onNavigate("signup")} style={{ background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Get Started Free
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", padding: "80px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
            <Users size={14} color="#f4c44e" />
            <span style={{ color: "#f4c44e", fontSize: 13, fontWeight: 600 }}>About ScholarIQ</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1.2 }}>
            Empowering Students to<br />Reach Their Full Potential
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, lineHeight: 1.7, margin: 0 }}>
            ScholarIQ is an AI-powered scholarship discovery platform built to help students worldwide find, track, and apply for the best educational opportunities that match their profile.
          </p>
        </div>
      </div>

      {/* Story */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "72px 40px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, color: theme.text }}>Our Story</h2>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.textSecondary, marginBottom: 20 }}>
          ScholarIQ was founded with a simple belief: every talented student deserves access to higher education, regardless of their financial background. We saw how thousands of students missed out on scholarships simply because they didn't know they existed or didn't know how to apply.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.textSecondary, marginBottom: 20 }}>
          We built ScholarIQ to solve this problem — an intelligent platform that understands each student's unique background, goals, and strengths, then matches them with the most relevant scholarships from over 50 countries.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: theme.textSecondary }}>
          Today, ScholarIQ helps students from Pakistan, India, and around the world discover verified scholarship opportunities at top universities across the USA, UK, Canada, Germany, Australia, and more.
        </p>
      </div>

      {/* Values */}
      <div style={{ backgroundColor: isDark ? theme.bgSecondary : "#f8faff", padding: "72px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 12, color: theme.text }}>What We Stand For</h2>
          <p style={{ textAlign: "center", color: theme.textSecondary, marginBottom: 48, fontSize: 16 }}>Our core values guide everything we build</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {values.map((v, i) => (
              <div key={i} style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 28, border: `1px solid ${theme.border}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 16 }}>
                  {v.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: theme.text }}>{v.title}</h3>
                <p style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "72px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: theme.text }}>Ready to Find Your Scholarship?</h2>
        <p style={{ color: theme.textSecondary, marginBottom: 28, fontSize: 16 }}>Join thousands of students already using ScholarIQ</p>
        <button onClick={() => onNavigate("signup")} style={{ background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 24px rgba(30,58,138,0.3)" }}>
          Create Free Account →
        </button>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

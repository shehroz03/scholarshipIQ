import { GraduationCap, Shield } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { Footer } from "./Footer";

export function PrivacyPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide when creating an account (name, email, nationality, academic background, target degree). We also collect usage data to improve our services and match you with relevant scholarships."
    },
    {
      title: "2. How We Use Your Information",
      content: "Your information is used to: personalize scholarship recommendations, send relevant notifications about deadlines and new matches, improve our AI matching algorithm, and communicate important updates about ScholarIQ."
    },
    {
      title: "3. Data Security",
      content: "We take security seriously. Your password is stored as a secure hash (bcrypt). We use HTTPS encryption for all data transmission. We never sell your personal data to third parties."
    },
    {
      title: "4. Email Communications",
      content: "By creating an account, you may receive emails about scholarship deadlines, new matches, and platform updates. You can turn off email notifications at any time from your account settings."
    },
    {
      title: "5. Third-Party Services",
      content: "ScholarIQ uses trusted third-party services for hosting (AWS), email delivery (Gmail), and AI features (OpenAI). These providers have their own privacy policies and we only share the minimum data necessary."
    },
    {
      title: "6. Your Rights",
      content: "You have the right to access, update, or delete your personal data at any time. To request deletion of your account and data, contact us at scholariqplatform@gmail.com."
    },
    {
      title: "7. Cookies",
      content: "We use minimal session-based authentication. We do not use tracking cookies or advertising cookies."
    },
    {
      title: "8. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. We will notify users of significant changes via email or an in-app notice."
    },
    {
      title: "9. Contact",
      content: "For any privacy-related questions, email us at scholariqplatform@gmail.com or call 0321-4261477."
    },
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
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", padding: "56px 40px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Shield size={28} color="#f4c44e" />
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, margin: "0 0 12px" }}>Privacy Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, margin: 0 }}>Last updated: July 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 40px" }}>
        <div style={{ backgroundColor: isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", borderRadius: 14, padding: 20, marginBottom: 40, border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}` }}>
          <p style={{ color: isDark ? "#93c5fd" : "#1e40af", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            <strong>Summary:</strong> ScholarIQ collects only what's needed to match you with scholarships. We never sell your data. You can delete your account anytime.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 12 }}>{s.title}</h2>
              <p style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 1.8, margin: 0 }}>{s.content}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: 24, backgroundColor: theme.bgSecondary, borderRadius: 14, border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <p style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Questions? Contact us at{" "}
            <a href="mailto:scholariqplatform@gmail.com" style={{ color: "#3b82f6", fontWeight: 600 }}>scholariqplatform@gmail.com</a>
            {" "}or{" "}
            <button onClick={() => onNavigate("contact")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 14 }}>
              visit our contact page
            </button>
          </p>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

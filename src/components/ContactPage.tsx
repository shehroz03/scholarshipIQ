import { GraduationCap, Phone, Mail, MessageCircle, Clock, Send } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { Footer } from "./Footer";
import { useState } from "react";

export function ContactPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactInfo = [
    {
      icon: <Phone size={22} />,
      label: "Phone / WhatsApp",
      value: "0321-4261477",
      sub: "Available Mon–Sat, 10AM – 8PM (PKT)",
      href: "https://wa.me/923214261477",
      color: "#10b981",
      bg: isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    },
    {
      icon: <Mail size={22} />,
      label: "Email",
      value: "scholariqplatform@gmail.com",
      sub: "We reply within 24 hours",
      href: "mailto:scholariqplatform@gmail.com",
      color: "#3b82f6",
      bg: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    },
    {
      icon: <Clock size={22} />,
      label: "Support Hours",
      value: "Mon – Sat",
      sub: "10:00 AM – 8:00 PM (Pakistan Time)",
      href: null,
      color: "#8b5cf6",
      bg: isDark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
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
        <button onClick={() => onNavigate("signup")} style={{ background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          Get Started Free
        </button>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", padding: "64px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
          <MessageCircle size={14} color="#f4c44e" />
          <span style={{ color: "#f4c44e", fontSize: 13, fontWeight: 600 }}>Contact Us</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, margin: "0 0 14px" }}>We're Here to Help</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 17, margin: 0 }}>
          Got a question? Reach out — we'd love to hear from you.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>

          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: theme.text }}>Get in Touch</h2>
            <p style={{ color: theme.textSecondary, fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              Whether you have a question about scholarships, need help with your account, or want to partner with us — we're happy to help.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {contactInfo.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, backgroundColor: theme.bgSecondary, borderRadius: 14, padding: 20, border: `1px solid ${theme.border}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <p style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{c.label}</p>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: c.color, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>{c.value}</a>
                    ) : (
                      <p style={{ color: theme.text, fontWeight: 700, fontSize: 15, margin: 0 }}>{c.value}</p>
                    )}
                    <p style={{ color: theme.textSecondary, fontSize: 13, margin: "4px 0 0" }}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/923214261477" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#10b981", color: "#fff", borderRadius: 12, padding: "14px 24px", fontWeight: 700, fontSize: 15, textDecoration: "none", marginTop: 24, boxShadow: "0 6px 20px rgba(16,185,129,0.3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.528 5.858L.057 23.867a.5.5 0 0 0 .609.61l6.102-1.434A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.938 9.938 0 0 1-5.073-1.384l-.364-.216-3.768.885.921-3.666-.237-.378A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Contact Form */}
          <div style={{ backgroundColor: theme.bgSecondary, borderRadius: 20, padding: 32, border: `1px solid ${theme.border}` }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Send size={28} color="#fff" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 10 }}>Message Sent!</h3>
                <p style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 1.6 }}>
                  Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button onClick={() => setSubmitted(false)} style={{ marginTop: 24, background: "none", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 20px", color: theme.textSecondary, fontSize: 14, cursor: "pointer" }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: theme.text }}>Send a Message</h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Your Name", key: "name", type: "text", placeholder: "Muhammad Ali" },
                    { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com" },
                    { label: "Subject", key: "subject", type: "text", placeholder: "Question about scholarships..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        required
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, display: "block", marginBottom: 6 }}>Message</label>
                    <textarea
                      rows={4}
                      placeholder="Tell us how we can help..."
                      required
                      value={form.message}
                      onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <button type="submit" style={{ background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 20px rgba(30,58,138,0.25)" }}>
                    <Send size={16} /> Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

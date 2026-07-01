import { useState } from "react";
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function ForgotPasswordPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Something went wrong");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => onNavigate("login")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>Scholar<span style={{ color: "#f4c44e" }}>IQ</span></span>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {success ? (
            /* Success State */
            <div style={{ textAlign: "center", backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "48px 40px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <CheckCircle size={30} color="#fff" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 12 }}>Check Your Email</h2>
              <p style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
                We've sent a password reset link to
              </p>
              <p style={{ color: "#3b82f6", fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>
              <p style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
                The link expires in <strong>30 minutes</strong>. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => onNavigate("login")}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            /* Form State */
            <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "40px 36px" }}>
              <button
                onClick={() => onNavigate("login")}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: theme.textSecondary, fontSize: 13, fontWeight: 600, marginBottom: 28 }}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>

              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Mail size={24} color="#fff" />
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 900, color: theme.text, marginBottom: 8 }}>Forgot Password?</h1>
              <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 20, color: "#dc2626", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, display: "block", marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10,
                      border: `1px solid ${theme.border}`, backgroundColor: theme.bg,
                      color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%", padding: "13px",
                    background: isLoading ? "#94a3b8" : "linear-gradient(135deg,#1e3a8a,#3b82f6)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: isLoading ? "none" : "0 6px 20px rgba(30,58,138,0.25)"
                  }}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: theme.textSecondary }}>
                Remembered it?{" "}
                <button onClick={() => onNavigate("login")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  Login
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

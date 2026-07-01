import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function ResetPasswordPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "48px 40px", maxWidth: 400 }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: theme.text, marginBottom: 12 }}>Invalid Reset Link</h2>
          <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 24 }}>
            This reset link is missing or invalid. Please request a new one.
          </p>
          <button
            onClick={() => onNavigate("forgot-password")}
            style={{ padding: "12px 24px", background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center" }}>
        <button onClick={() => onNavigate("landing")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
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
            <div style={{ textAlign: "center", backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "48px 40px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <CheckCircle size={30} color="#fff" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 12 }}>Password Reset!</h2>
              <p style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                Your password has been updated successfully. You can now login with your new password.
              </p>
              <button
                onClick={() => onNavigate("login")}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              >
                Login Now
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 20, padding: "40px 36px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#1e3a8a,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Lock size={24} color="#fff" />
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 900, color: theme.text, marginBottom: 8 }}>Create New Password</h1>
              <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Choose a strong password with at least 8 characters including letters and numbers.
              </p>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 20, color: "#dc2626", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* New Password */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, display: "block", marginBottom: 6 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      style={{
                        width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                        border: `1px solid ${theme.border}`, backgroundColor: theme.bg,
                        color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box"
                      }}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: theme.textSecondary }}>
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary, display: "block", marginBottom: 6 }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      style={{
                        width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                        border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? "#ef4444" : theme.border}`,
                        backgroundColor: theme.bg, color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box"
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: theme.textSecondary }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%", padding: "13px",
                    background: isLoading ? "#94a3b8" : "linear-gradient(135deg,#1e3a8a,#3b82f6)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: isLoading ? "none" : "0 6px 20px rgba(30,58,138,0.25)", marginTop: 4
                  }}
                >
                  {isLoading ? "Updating Password..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

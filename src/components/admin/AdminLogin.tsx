import { useState } from "react";
import { Lock, Loader2, Shield, AlertCircle, User, Eye, EyeOff } from "lucide-react";
import { api } from "../../api";

interface AdminLoginProps {
    onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    const doLogin = async (u: string, p: string) => {
        setIsLoading(true);
        setError("");
        localStorage.removeItem("token");
        try {
            await api.admin.login({ username: u, password: p });
            onLogin();
        } catch (err: any) {
            setError(err.message || "Invalid admin credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password.");
            return;
        }
        await doLogin(username.trim(), password);
    };

    // Inline styles guarantee the dark theme + visible input text regardless of CSS context
    const inputWrap = (id: string): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#1e3a7a",
        border: `1.5px solid ${focused === id ? "#f4c44e" : "#334155"}`,
        borderRadius: "12px",
        padding: "0 14px",
        height: "52px",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: focused === id ? "0 0 0 4px rgba(244,196,78,0.15)" : "none",
    });

    const inputStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#ffffff",          // <-- visible text (was the bug)
        fontSize: "15px",
        fontWeight: 500,
        height: "100%",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "radial-gradient(1200px 600px at 50% -10%, #163065 0%, #0f172a 45%, #020617 100%)",
            }}
        >
            <div style={{ width: "100%", maxWidth: "420px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div
                        style={{
                            width: "72px",
                            height: "72px",
                            margin: "0 auto 18px",
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, #f4c44e 0%, #8b5cf6 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 12px 30px rgba(244,196,78,0.35)",
                        }}
                    >
                        <Shield style={{ width: "34px", height: "34px", color: "#fff" }} />
                    </div>
                    <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>
                        Administrator Portal
                    </h1>
                    <p style={{ color: "#94a3b8", margin: "0 0 14px", fontSize: "15px" }}>
                        ScholarIQ Management Console
                    </p>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.35)",
                            borderRadius: "999px",
                            padding: "5px 14px",
                        }}
                    >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} className="animate-pulse" />
                        <span style={{ color: "#fca5a5", fontSize: "13px", fontWeight: 600 }}>Restricted Area</span>
                    </div>
                </div>

                {/* Login Card */}
                <div
                    style={{
                        background: "rgba(30,41,59,0.6)",
                        backdropFilter: "blur(18px)",
                        border: "1px solid #334155",
                        borderRadius: "20px",
                        padding: "30px",
                        boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "rgba(245,158,11,0.18)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Lock style={{ width: "20px", height: "20px", color: "#fbbf24" }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Secure Login</h2>
                            <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>Authorized access only</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        {error && (
                            <div
                                style={{
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    borderRadius: "12px",
                                    padding: "12px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <AlertCircle style={{ width: "18px", height: "18px", color: "#f87171", flexShrink: 0 }} />
                                <p style={{ color: "#fca5a5", fontSize: "13px", margin: 0 }}>{error}</p>
                            </div>
                        )}

                        {/* Username */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>Username</label>
                            <div style={inputWrap("username")}>
                                <User style={{ width: "18px", height: "18px", color: "#64748b", flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => setFocused("username")}
                                    onBlur={() => setFocused(null)}
                                    style={inputStyle}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>Password</label>
                            <div style={inputWrap("password")}>
                                <Lock style={{ width: "18px", height: "18px", color: "#64748b", flexShrink: 0 }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused(null)}
                                    style={inputStyle}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 0 }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff style={{ width: "18px", height: "18px" }} /> : <Eye style={{ width: "18px", height: "18px" }} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: "4px",
                                width: "100%",
                                height: "52px",
                                border: "none",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #f4c44e 0%, #8b5cf6 100%)",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                boxShadow: "0 12px 24px rgba(244,196,78,0.3)",
                                transition: "transform 0.15s ease, box-shadow 0.2s ease",
                            }}
                            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            {isLoading ? <Loader2 style={{ width: "20px", height: "20px" }} className="animate-spin" /> : <Lock style={{ width: "18px", height: "18px" }} />}
                            {isLoading ? "Authenticating..." : "Secure Sign In"}
                        </button>

                        {/* Security note */}
                        <div
                            style={{
                                background: "rgba(15,23,42,0.5)",
                                borderRadius: "10px",
                                padding: "11px 13px",
                                border: "1px solid rgba(51,65,85,0.6)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Shield style={{ width: "15px", height: "15px", color: "#fbbf24", flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                System access is restricted to authorized administrators only
                            </span>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ marginTop: "26px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#64748b", fontSize: "13px", marginBottom: "6px" }}>
                        <Shield style={{ width: "15px", height: "15px" }} />
                        <span>All activities are logged and monitored</span>
                    </div>
                    <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>
                        © {new Date().getFullYear()} ScholarIQ. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

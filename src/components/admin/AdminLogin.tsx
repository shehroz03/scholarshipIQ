import { useState } from "react";
import { Lock, Loader2, Shield, AlertCircle, User, Eye, EyeOff, Sparkles } from "lucide-react";
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

    const inputWrap = (id: string): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: focused === id ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.6)",
        border: `1.5px solid ${focused === id ? "#818cf8" : "rgba(99,102,241,0.2)"}`,
        borderRadius: "14px",
        padding: "0 16px",
        height: "54px",
        transition: "all 0.25s ease",
        boxShadow: focused === id ? "0 0 0 4px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
    });

    const inputStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#e2e8f0",
        fontSize: "15px",
        fontWeight: 500,
        height: "100%",
    };

    return (
        <>
            <style>{`
                @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-30px) scale(1.08); } 66% { transform: translate(-20px,20px) scale(0.95); } }
                @keyframes float2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-50px,20px) scale(1.05); } 66% { transform: translate(30px,-40px) scale(0.92); } }
                @keyframes float3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,30px) scale(1.1); } }
                @keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(60px); } }
                @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
                @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scanLine { 0% { top: -4px; } 100% { top: 100%; } }
                .admin-login-card { animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
                .login-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 20px 40px rgba(99,102,241,0.45) !important; }
                .login-btn:active:not(:disabled) { transform: translateY(0px) !important; }
                .input-animate::placeholder { color: rgba(148,163,184,0.45); }
            `}</style>

            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: "#020817",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Animated background orbs */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                    <div style={{
                        position: "absolute", top: "-15%", left: "-10%",
                        width: "600px", height: "600px",
                        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "float1 18s ease-in-out infinite",
                    }} />
                    <div style={{
                        position: "absolute", bottom: "-20%", right: "-10%",
                        width: "700px", height: "700px",
                        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "float2 22s ease-in-out infinite",
                    }} />
                    <div style={{
                        position: "absolute", top: "40%", right: "20%",
                        width: "350px", height: "350px",
                        background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                        borderRadius: "50%",
                        animation: "float3 14s ease-in-out infinite",
                    }} />

                    {/* Grid pattern */}
                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#818cf8" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Top gradient line */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        height: "2px",
                        background: "linear-gradient(90deg, transparent 0%, #6366f1 30%, #8b5cf6 50%, #6366f1 70%, transparent 100%)",
                        opacity: 0.8,
                    }} />
                </div>

                <div className="admin-login-card" style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        {/* Icon with pulse rings */}
                        <div style={{ position: "relative", display: "inline-block", marginBottom: "20px" }}>
                            <div style={{
                                position: "absolute", inset: "-8px",
                                borderRadius: "50%",
                                border: "1px solid rgba(99,102,241,0.35)",
                                animation: "pulse-ring 2.5s ease-out infinite",
                            }} />
                            <div style={{
                                position: "absolute", inset: "-16px",
                                borderRadius: "50%",
                                border: "1px solid rgba(99,102,241,0.2)",
                                animation: "pulse-ring 2.5s ease-out infinite 0.8s",
                            }} />
                            <div style={{
                                width: "80px", height: "80px",
                                borderRadius: "24px",
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 0 40px rgba(99,102,241,0.5), 0 16px 32px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                                position: "relative",
                            }}>
                                {/* Scan line effect */}
                                <div style={{
                                    position: "absolute", left: 0, right: 0, height: "2px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                                    animation: "scanLine 3s linear infinite",
                                    borderRadius: "24px",
                                }} />
                                <Shield style={{ width: "36px", height: "36px", color: "#fff" }} />
                            </div>
                        </div>

                        <h1 style={{
                            fontSize: "28px", fontWeight: 800, margin: "0 0 6px",
                            background: "linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #c7d2fe 100%)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            letterSpacing: "-0.5px",
                        }}>
                            Administrator Portal
                        </h1>
                        <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: "14px", fontWeight: 500 }}>
                            ScholarIQ Management Console
                        </p>

                        {/* Restricted badge */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: "999px", padding: "6px 16px",
                        }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} className="animate-pulse" />
                            <span style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>RESTRICTED AREA</span>
                        </div>
                    </div>

                    {/* Card */}
                    <div style={{
                        background: "rgba(15,23,42,0.75)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: "24px",
                        padding: "32px",
                        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Card inner glow */}
                        <div style={{
                            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                            width: "80%", height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
                        }} />

                        {/* Card header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
                            <div style={{
                                width: "44px", height: "44px", borderRadius: "12px",
                                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                                border: "1px solid rgba(99,102,241,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Lock style={{ width: "20px", height: "20px", color: "#818cf8" }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Secure Login</h2>
                                <p style={{ color: "#475569", fontSize: "13px", margin: 0 }}>Authorized access only</p>
                            </div>
                            <div style={{ marginLeft: "auto" }}>
                                <Sparkles style={{ width: "18px", height: "18px", color: "#6366f1", opacity: 0.6 }} />
                            </div>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {error && (
                                <div style={{
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.25)",
                                    borderRadius: "12px", padding: "12px 14px",
                                    display: "flex", alignItems: "center", gap: "10px",
                                }}>
                                    <AlertCircle style={{ width: "17px", height: "17px", color: "#f87171", flexShrink: 0 }} />
                                    <p style={{ color: "#fca5a5", fontSize: "13px", margin: 0 }}>{error}</p>
                                </div>
                            )}

                            {/* Username */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Username
                                </label>
                                <div style={inputWrap("username")}>
                                    <User style={{ width: "17px", height: "17px", color: focused === "username" ? "#818cf8" : "#475569", flexShrink: 0, transition: "color 0.2s" }} />
                                    <input
                                        className="input-animate"
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
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Password
                                </label>
                                <div style={inputWrap("password")}>
                                    <Lock style={{ width: "17px", height: "17px", color: focused === "password" ? "#818cf8" : "#475569", flexShrink: 0, transition: "color 0.2s" }} />
                                    <input
                                        className="input-animate"
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
                                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: 0, transition: "color 0.2s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff style={{ width: "17px", height: "17px" }} /> : <Eye style={{ width: "17px", height: "17px" }} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-btn"
                                style={{
                                    marginTop: "4px",
                                    width: "100%", height: "54px",
                                    border: "none", borderRadius: "14px",
                                    background: isLoading
                                        ? "rgba(99,102,241,0.5)"
                                        : "linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #7c3aed 100%)",
                                    color: "#ffffff",
                                    fontWeight: 700, fontSize: "15px",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                    boxShadow: isLoading ? "none" : "0 12px 28px rgba(99,102,241,0.35)",
                                    transition: "all 0.25s ease",
                                    letterSpacing: "0.02em",
                                    position: "relative", overflow: "hidden",
                                }}
                            >
                                {/* Button shine */}
                                {!isLoading && (
                                    <div style={{
                                        position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                                        animation: "shimmer 3s ease-in-out infinite",
                                    }} />
                                )}
                                {isLoading
                                    ? <Loader2 style={{ width: "20px", height: "20px" }} className="animate-spin" />
                                    : <Lock style={{ width: "18px", height: "18px" }} />
                                }
                                {isLoading ? "Authenticating..." : "Secure Sign In"}
                            </button>

                            {/* Security note */}
                            <div style={{
                                background: "rgba(5,10,24,0.5)",
                                borderRadius: "12px", padding: "12px 14px",
                                border: "1px solid rgba(99,102,241,0.1)",
                                display: "flex", alignItems: "center", gap: "10px",
                            }}>
                                <Shield style={{ width: "15px", height: "15px", color: "#6366f1", flexShrink: 0 }} />
                                <span style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                                    System access is restricted to authorized administrators only
                                </span>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: "24px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#334155", fontSize: "12px", marginBottom: "6px" }}>
                            <Shield style={{ width: "13px", height: "13px" }} />
                            <span>All activities are logged and monitored</span>
                        </div>
                        <p style={{ color: "#1e293b", fontSize: "12px", margin: 0 }}>
                            © {new Date().getFullYear()} ScholarIQ. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

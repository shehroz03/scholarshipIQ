import { useEffect, useState } from "react";

export function SyncingRadar() {
  const [dots, setDots] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => (d + 1) % 4);
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        // Adjusting so that it hits 100% in approx 2.5 seconds.
        // 50ms interval, ~2500ms total -> needs 50 steps.
        // Math.random() * 2 + 1 gives average 2.
        return p + (Math.random() * 2 + 1);
      });
    }, 50);

    return () => { clearInterval(dotInterval); clearInterval(progressInterval); };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #060818 0%, #0a0f2e 50%, #050d1f 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Background grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#818cf8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Radar SVG */}
      <div style={{ position: "relative", width: 280, height: 280, marginBottom: 40 }}>
        <svg width="280" height="280" viewBox="0 0 280 280">
          {/* Outer static rings */}
          <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
          <circle cx="140" cy="140" r="95"  fill="none" stroke="rgba(99,102,241,0.10)" strokeWidth="1" />
          <circle cx="140" cy="140" r="70"  fill="none" stroke="rgba(99,102,241,0.13)" strokeWidth="1" />
          <circle cx="140" cy="140" r="45"  fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="1" />

          {/* Cross hairs */}
          <line x1="140" y1="20" x2="140" y2="260" stroke="rgba(99,102,241,0.06)" strokeWidth="0.5" />
          <line x1="20"  y1="140" x2="260" y2="140" stroke="rgba(99,102,241,0.06)" strokeWidth="0.5" />

          {/* Spinning arc - outer */}
          <circle
            cx="140" cy="140" r="120"
            fill="none"
            stroke="url(#arcGrad1)"
            strokeWidth="2.5"
            strokeDasharray="160 596"
            strokeLinecap="round"
            style={{ animation: "spin 2.5s linear infinite", transformOrigin: "140px 140px" }}
          />

          {/* Spinning arc - middle */}
          <circle
            cx="140" cy="140" r="95"
            fill="none"
            stroke="url(#arcGrad2)"
            strokeWidth="2"
            strokeDasharray="100 497"
            strokeLinecap="round"
            style={{ animation: "spinReverse 3.5s linear infinite", transformOrigin: "140px 140px" }}
          />

          {/* Spinning arc - inner */}
          <circle
            cx="140" cy="140" r="70"
            fill="none"
            stroke="rgba(139,92,246,0.6)"
            strokeWidth="1.5"
            strokeDasharray="60 380"
            strokeLinecap="round"
            style={{ animation: "spin 2s linear infinite", transformOrigin: "140px 140px" }}
          />

          {/* Gradient defs */}
          <defs>
            <linearGradient id="arcGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="arcGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center icon */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>

        {/* Radar sweep dot */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 6, height: 6, borderRadius: "50%",
          background: "#a78bfa",
          boxShadow: "0 0 10px #a78bfa",
          transform: "translate(-50%, -50%) translateY(-95px)",
          animation: "orbit 2.5s linear infinite",
          transformOrigin: "center 95px",
        }} />
      </div>

      {/* Progress bar */}
      <div style={{ width: 200, marginBottom: 32 }}>
        <div style={{
          height: 2, background: "rgba(99,102,241,0.15)",
          borderRadius: 100, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #6366f1, #a78bfa)",
            width: `${Math.min(progress, 100)}%`,
            transition: "width 0.15s ease",
            boxShadow: "0 0 8px rgba(99,102,241,0.8)",
            borderRadius: 100,
          }} />
        </div>
      </div>

      {/* Text */}
      <div style={{
        fontSize: 20, fontWeight: 800, letterSpacing: "0.2em",
        color: "#fff", marginBottom: 14,
      }}>
        SYNCING RADAR
      </div>

      {/* Animated dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: dots > i ? "#6366f1" : "rgba(99,102,241,0.25)",
            boxShadow: dots > i ? "0 0 8px #6366f1" : "none",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 11, letterSpacing: "0.18em",
        color: "rgba(129,140,248,0.5)",
      }}>
        PROCESSING SCHOLARSHIP INTELLIGENCE
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg) translateY(-95px); }
          to   { transform: translate(-50%, -50%) rotate(360deg) translateY(-95px); }
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}

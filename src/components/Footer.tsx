import React from 'react';

const footerLinks = {
  "For Students": ["Browse Scholarships", "How it Works"],
  Resources: ["Application Tips", "Study Guides"],
  Company: ["About Us", "Contact"],
};

export function Footer({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <footer style={{
      background: "#1a2250",
      padding: "64px 40px 32px"
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Logo col */}
          <div style={{ minWidth: "160px" }}>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}
              onClick={() => onNavigate?.('landing')}
            >
              <div style={{
                width: 28, height: 28, background: "#f4c44e",
                borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px"
              }}>🎓</div>
              <span style={{ color: "#fff", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "16px" }}>
                Scholar<span style={{ color: "#f4c44e" }}>IQ</span>
              </span>
            </div>
            <p style={{ color: "#8892b0", fontSize: "12.5px", lineHeight: 1.6 }}>
              Find your perfect degree and scholarship worldwide through our AI-powered platform.
            </p>
          </div>

          {/* Link cols */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px", marginBottom: "20px" }}>{section}</div>
              <div className="flex flex-col gap-3">
                {links.map(link => (
                  <button 
                    key={link} 
                    onClick={() => {
                      if (link === "Browse Scholarships") onNavigate?.('search');
                      else if (link === "How it Works") onNavigate?.('landing');
                      else if (link === "Contact") onNavigate?.('contact');
                    }}
                    style={{ 
                      color: "#8892b0", 
                      fontSize: "13.5px", 
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f4c44e"}
                    onMouseLeave={e => e.currentTarget.style.color = "#8892b0"}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid #2d3561",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <span style={{ color: "#4a5580", fontSize: "12.5px" }}>© 2025 ScholarIQ. All rights reserved.</span>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#" style={{ color: "#4a5580", fontSize: "12.5px", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#" style={{ color: "#4a5580", fontSize: "12.5px", textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

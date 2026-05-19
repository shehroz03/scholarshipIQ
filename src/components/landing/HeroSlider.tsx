import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

type HeroSliderProps = {
  onSearch: (query: string) => void;
  onCta: (id: string) => void;
};

export function HeroSlider({ onSearch, onCta }: HeroSliderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section style={{
      background: "#1a2250",
      position: "relative",
      overflow: "hidden",
      minHeight: "600px",
      display: "flex",
      alignItems: "center"
    }}>
      {/* Background Image with Gradient Overlay */}
      <div style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 1
      }}>
        <img 
          src="/hero_students.png" 
          alt="Students" 
          style={{ 
            width: "100%", height: "100%", 
            objectFit: "cover",
            objectPosition: "center 20%"
          }} 
        />
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to right, rgba(26, 34, 80, 0.9) 20%, rgba(26, 34, 80, 0.4) 50%, rgba(26, 34, 80, 0.2) 100%)"
        }} />
      </div>

      <div style={{
        maxWidth: "1240px",
        margin: "0 auto",
        width: "100%",
        padding: "0 40px",
        display: "flex",
        alignItems: "center",
        position: "relative",
        zIndex: 2
      }}>
        {/* Left Column: Content */}
        <div style={{ flex: 1.2, maxWidth: "600px", textAlign: "left", padding: "80px 0" }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 64px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.05,
              marginBottom: "24px",
              letterSpacing: "-1px"
            }}>
              Find Your Perfect<br />
              <span style={{ 
                background: "linear-gradient(90deg, #f4c44e 0%, #c8a63a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Master's Degree</span>
            </h1>
            
            <p style={{ color: "#a8b4d4", fontSize: "17px", lineHeight: 1.6, marginBottom: "44px", maxWidth: "480px", fontWeight: 500 }}>
              Explore and compare Master's programmes worldwide.<br />
              Search by university, subject, location, or scholarships.
            </p>

            {/* Glassmorphism Search Bar */}
            <div style={{ 
              position: "relative", 
              maxWidth: "560px", 
              marginBottom: "56px",
              padding: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(25px)",
              WebkitBackdropFilter: "blur(25px)",
              borderRadius: "60px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}>
              <input
                style={{
                  width: "100%",
                  padding: "16px 160px 16px 32px",
                  borderRadius: "60px",
                  border: "none",
                  fontSize: "17px",
                  outline: "none",
                  color: "#fff",
                  background: "transparent",
                  fontFamily: "'DM Sans', sans-serif"
                }}
                placeholder="Search for a Master's Degree"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
              />
              <button 
                style={{
                  position: "absolute",
                  right: "8px", top: "8px", bottom: "8px",
                  background: "linear-gradient(90deg, #f4c44e 0%, #c8a63a 100%)",
                  border: "none",
                  borderRadius: "50px",
                  padding: "0 36px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1a1f3a",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 15px rgba(244,196,78,0.4)"
                }}
                onClick={() => onSearch(searchQuery)}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <Search size={20} strokeWidth={3} />
                Search
              </button>
            </div>

            {/* Social Proof */}
            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <div style={{ display: "flex" }}>
                {[
                  "https://i.pravatar.cc/150?u=11",
                  "https://i.pravatar.cc/150?u=22",
                  "https://i.pravatar.cc/150?u=33"
                ].map((url, i) => (
                  <img key={i} src={url} alt="student" style={{
                    width: 42, height: 42,
                    borderRadius: "50%",
                    border: "2px solid #1a2250",
                    marginLeft: i > 0 ? "-14px" : 0,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                  }} />
                ))}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>10K+ Students</div>
                <div style={{ color: "#8892b0", fontSize: "13px", fontWeight: 500 }}>Already found their dream degree</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Floating Badge */}
        <div style={{ flex: 0.8, position: "relative", height: "100%", display: "flex", justifyContent: "flex-end", paddingRight: "40px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              padding: "28px 36px",
              borderRadius: "32px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginTop: "-60px"
            }}
          >
            <div style={{
              width: 64, height: 64,
              background: "linear-gradient(135deg, #f4c44e 0%, #c8a63a 100%)",
              borderRadius: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#1a1f3a",
              fontSize: "32px",
              boxShadow: "0 10px 25px rgba(244,196,78,0.4)"
            }}>🎓</div>
            <div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#fff", marginBottom: "2px", lineHeight: 1 }}>50,000+</div>
              <div style={{ fontSize: "14px", color: "#a8b4d4", fontWeight: 700, letterSpacing: "0.5px" }}>Active Scholarships</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

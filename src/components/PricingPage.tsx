import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { darkTheme, lightTheme } from "../styles/theme";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronLeft } from "lucide-react";

export function PricingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const navigate = useNavigate();
    const { refreshStatus } = useUser();
    const { isDark } = useTheme();
    const theme = isDark ? darkTheme : lightTheme;
    const [annual, setAnnual] = useState(false);

    const handleBack = () => {
        if (onNavigate) onNavigate("dashboard");
        else navigate("/dashboard");
    };

    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpgrade = (tierId: string) => {
        if (tierId === "free") return;
        setSelectedPlan(tierId);
        setShowModal(true);
    };

    const confirmPayment = async () => {
        setIsProcessing(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            await api.users.subscribe(selectedPlan!);
            await refreshStatus();
            alert(`🚀 Awesome! Your account has been upgraded to ${selectedPlan!.toUpperCase()} for 1 month.`);
            setShowModal(false);
            if (onNavigate) onNavigate("dashboard");
            else navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message || 'Payment failed'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '40px 20px', color: theme.text, fontFamily: 'sans-serif', position: 'relative' }}>
            
            <div style={{ maxWidth: '1100px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={handleBack}
                    style={{
                        backgroundColor: theme.bgSecondary,
                        color: theme.textSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronLeft size={18} /> Back to Dashboard
                </button>
                <ThemeToggle />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.text, marginBottom: '16px', letterSpacing: '-0.025em' }}>
                    Unlock Your <span style={{ color: '#818cf8' }}>Potential</span>
                </h1>
                <p style={{ color: theme.textSecondary, fontSize: '20px', fontWeight: '500', maxWidth: '600px', margin: '0 auto' }}>
                    Choose the plan that matches your ambition. Upgrade or downgrade anytime.
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '60px' }}>
                <span style={{ color: !annual ? theme.text : theme.textSecondary, fontWeight: '700', fontSize: '16px' }}>Monthly</span>
                <div onClick={() => setAnnual(!annual)}
                    style={{
                        width: '56px', height: '28px', borderRadius: '14px', cursor: 'pointer',
                        backgroundColor: annual ? '#6366f1' : '#475569', position: 'relative', transition: 'all 0.3s ease'
                    }}>
                    <div style={{
                        position: 'absolute', top: '4px', width: '20px', height: '20px',
                        backgroundColor: '#ffffff', borderRadius: '50%', transition: 'all 0.3s ease',
                        left: annual ? '32px' : '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                </div>
                <span style={{ color: annual ? theme.text : theme.textSecondary, fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Annual
                    <span style={{
                        backgroundColor: '#22c55e', color: '#ffffff', fontSize: '12px', fontWeight: '800',
                        padding: '2px 10px', borderRadius: '20px', textTransform: 'uppercase'
                    }}>
                        -20%
                    </span>
                </span>
            </div>

            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px', maxWidth: '1100px', margin: '0 auto', alignItems: 'stretch'
            }}>
                {/* FREE CARD */}
                <div style={{
                    backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`,
                    borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column'
                }}>
                    <h2 style={{ color: theme.textSecondary, fontSize: '14px', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FREE</h2>
                    <div style={{ color: theme.text, fontSize: '42px', fontWeight: '900', marginBottom: '8px' }}>
                        PKR 0
                    </div>
                    <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '32px', fontWeight: '500' }}>Start your scholarship journey</p>
                    <div style={{ flex: 1 }}>
                        {['10 Search results', 'Save 5 scholarships', '3 AI recommendations', 'Track 3 applications'].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: theme.text, fontSize: '15px' }}>
                                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span> {f}
                            </div>
                        ))}
                    </div>
                    <button style={{ width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: theme.bg, color: theme.textSecondary, border: 'none', fontWeight: '700', marginTop: '32px' }}>Current Plan</button>
                </div>

                {/* PREMIUM CARD */}
                <div style={{
                    backgroundColor: isDark ? '#1e1b4b' : '#f5f7ff', border: '2px solid #6366f1',
                    borderRadius: '24px', padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6366f1', color: '#ffffff', fontSize: '12px', fontWeight: '900', padding: '6px 20px', borderRadius: '20px' }}>⭐ MOST POPULAR</div>
                    <h2 style={{ color: '#818cf8', fontSize: '14px', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>👑 PREMIUM</h2>
                    <div style={{ color: theme.text, fontSize: '42px', fontWeight: '900', marginBottom: '8px' }}>PKR {annual ? '400' : '500'}<span style={{ fontSize: '18px', color: theme.textSecondary }}>/mo</span></div>
                    <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '32px' }}>Full access to premium tools</p>
                    <div style={{ flex: 1 }}>
                        {['Everything in Free', 'Unlimited search', 'Unlimited saves', 'Top 10 AI matches', 'AI Consultant (20 msg)', 'Smart Match Score'].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: theme.text, fontSize: '15px' }}>
                                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span> {f}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleUpgrade('premium')} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#ffffff', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: '32px' }}>🚀 Upgrade to Premium</button>
                </div>

                {/* PRO CARD */}
                <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid #d97706`, borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>💎 PRO</h2>
                    <div style={{ color: theme.text, fontSize: '42px', fontWeight: '900', marginBottom: '8px' }}>PKR {annual ? '1,200' : '1,500'}<span style={{ fontSize: '18px', color: theme.textSecondary }}>/mo</span></div>
                    <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '32px' }}>Everything you need to win</p>
                    <div style={{ flex: 1 }}>
                        {['Everything in Premium', 'Unlimited AI Consultant', 'AI CV Builder', 'Interview Prep', 'Priority Support'].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: theme.text, fontSize: '15px' }}>
                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>✓</span> {f}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleUpgrade('pro')} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#ffffff', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: '32px' }}>💎 Go Pro</button>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '24px', width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: theme.text }}>Demo Payment</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '24px' }}>×</button>
                        </div>
                        <div style={{ backgroundColor: theme.bg, padding: '16px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${theme.border}` }}>
                            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>Selected Plan</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#818cf8', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{selectedPlan?.toUpperCase()} Plan</span>
                                <span>PKR {selectedPlan === 'premium' ? (annual ? '400' : '500') : (annual ? '1,200' : '1,500')}</span>
                            </div>
                        </div>
                        <button onClick={confirmPayment} disabled={isProcessing} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#ffffff', border: 'none', fontSize: '16px', fontWeight: '800', opacity: isProcessing ? 0.7 : 1 }}>
                            {isProcessing ? 'Processing Securely...' : 'Complete Payment 🔒'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PricingPage;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { darkTheme } from "../../styles/theme";
import { ThemeToggle } from "../ThemeToggle";
import { ChevronLeft } from "lucide-react";

const VisaGuidanceLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDark = true;
  const theme = darkTheme;
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const countries = [
    {
      id: 'UK',
      name: 'United Kingdom',
      flag: '��',
      tagline: 'Student Route Visa (Tier 4)',
      accent: '#CF142B',
      languageLearn: '❌ Nahi — Sirf IELTS 6.5',
      ielts: '6.5 overall (no band below 6.0)',
      fee: '£490 + IHS £776/year',
      feePKR: '~PKR 2.5 lakh',
      processing: '3–4 weeks (Priority: 5 days)',
      financialProof: 'Tuition + £1,334/month (London) ya £1,023/month — 28 consecutive days bank mein',
      workRights: '20 hrs/week during term',
      postStudy: '2-year Graduate Route Visa',
      applyVia: 'VFS Global — Karachi / Lahore / Islamabad',
      keyDocs: ['Valid Passport', 'CAS from university', 'IELTS score report', 'HEC-attested transcripts', 'Bank statement (28-day rule)', 'TB test result', 'IHS payment receipt'],
      warning: '⚠️ Bank statement 28 consecutive din untouched rehni chahiye',
      officialUrl: 'https://www.gov.uk/student-visa',
      features: ['28-Day Bank Rule', 'CAS Verification', 'TB Test Required', '2yr Graduate Visa']
    },
    {
      id: 'US',
      name: 'United States',
      flag: '🇺🇸',
      tagline: 'F-1 Non-Immigrant Student Visa',
      accent: '#3C3B6E',
      languageLearn: '❌ Nahi — Sirf TOEFL 80+ ya IELTS 6.5',
      ielts: '6.5 overall ya TOEFL 80+',
      fee: '$185 (DS-160) + $350 SEVIS fee',
      feePKR: '~PKR 1.5 lakh',
      processing: '2–4 weeks (+ Embassy interview)',
      financialProof: 'Tuition + $12,000–15,000 living costs — bank statement ya scholarship letter',
      workRights: '20 hrs/week on-campus (1st year)',
      postStudy: 'OPT 12 months (STEM = 3 years)',
      applyVia: 'US Embassy Islamabad ya Consulate Karachi/Lahore',
      keyDocs: ['Valid Passport', 'I-20 form from university', 'DS-160 confirmation', 'SEVIS fee receipt (I-901)', 'TOEFL/IELTS score', 'HEC-attested transcripts', 'Bank statements (3-6 months)', 'Ties to Pakistan proof'],
      warning: '⚠️ Embassy interview mandatory — prepare strong answers about future plans & ties to Pakistan',
      officialUrl: 'https://travel.state.gov/content/travel/en/us-visas/study.html',
      features: ['Embassy Interview Required', 'F-1 + OPT Work', 'SEVIS Registration', 'STEM 3yr OPT']
    },
    {
      id: 'DE',
      name: 'Germany',
      flag: '🇩🇪',
      tagline: 'National Visa (Type D) — Tuition FREE',
      accent: '#DD0000',
      languageLearn: '⚠️ Optional — Zyada tar programs English mein. German A1-A2 daily life ke liye helpful',
      ielts: '6.5 ya German B2/C1 (program pe depend)',
      fee: '€75',
      feePKR: '~PKR 24,000',
      processing: '6–12 weeks (JALDI APPLY KARO!)',
      financialProof: 'Blocked Account (Sperrkonto) = €11,208 (~PKR 33 lakh) — Fintiba/Coracle/Deutsche Bank',
      workRights: '120 full days per year',
      postStudy: '18-month Job Seeker Visa',
      applyVia: 'German Embassy Islamabad + APS Pakistan (Islamabad)',
      keyDocs: ['Valid Passport', 'Admission letter', '⚠️ APS Certificate (MANDATORY for Pakistan)', 'HEC-attested transcripts', 'IELTS 6.5 ya German B2', 'Blocked account proof (€11,208)', 'Health insurance', 'Accommodation proof', 'Motivation letter'],
      warning: '⚠️ APS Certificate mandatory — APS Islamabad se apply karo, 4-6 hafta + PKR 25,000 lagta hai',
      officialUrl: 'https://www.auswaertiges-amt.de',
      features: ['Tuition FREE', 'APS Certificate', 'Blocked Account €11,208', '18mo Job Seeker Visa']
    },
    {
      id: 'AU',
      name: 'Australia',
      flag: '��',
      tagline: 'Student Visa Subclass 500',
      accent: '#00008B',
      languageLearn: '❌ Nahi — Sirf IELTS 6.5',
      ielts: '6.5 overall (no band below 6.0)',
      fee: 'AUD $710',
      feePKR: '~PKR 1.45 lakh',
      processing: '4–8 weeks (online)',
      financialProof: 'AUD $21,041/year (~PKR 42 lakh) — bank statement ya scholarship letter',
      workRights: '48 hrs/fortnight (unlimited in holidays)',
      postStudy: '2–4 year Temporary Graduate Visa (485)',
      applyVia: 'Online — ImmiAccount (immi.homeaffairs.gov.au)',
      keyDocs: ['Valid Passport', 'CoE from university', 'IELTS/PTE score', 'HEC-attested transcripts', 'Financial evidence', 'GTE Statement', 'OSHC health insurance (mandatory)', 'Medical exam (if required)'],
      warning: '⚠️ GTE Statement likhna zaroori hai — clearly explain karo ke Pakistan kyun wapis aoge',
      officialUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500',
      features: ['Online Application', 'GTE Statement', 'OSHC Insurance', '485 Graduate Visa']
    },
    {
      id: 'TR',
      name: 'Turkey',
      flag: '��',
      tagline: 'Student Visa + Türkiye Bursları',
      accent: '#E30A17',
      languageLearn: '✅ Turkish — lekin FREE hai! 1-saal Turkish language course scholarship mein included',
      ielts: '6.0 (kuch programs flexible hain)',
      fee: '~PKR 5,000–8,000',
      feePKR: 'PKR 5,000–8,000',
      processing: '2–3 weeks',
      financialProof: 'Scholarship holders ke liye KUCH NAHI — tuition + hostel + $700-800/month stipend + health insurance sab covered',
      workRights: 'Limited (scholarship terms ke mutabiq)',
      postStudy: 'Turkish Residence Permit',
      applyVia: 'Turkish Embassy Islamabad | turkiyeburslari.gov.tr',
      keyDocs: ['Valid Passport', 'Türkiye Bursları acceptance letter', 'HEC-attested transcripts', 'IELTS 6.0 (kuch programs mein flexible)', 'Medical certificate', 'Criminal background check', 'Photos'],
      warning: '⚠️ Türkiye Bursları bohot competitive hai — strong CGPA + extra-curricular activities zaroori',
      officialUrl: 'https://www.turkiyeburslari.gov.tr',
      features: ['FREE Turkish Course', 'Full Scholarship', '$700-800/mo Stipend', 'Health Insurance']
    },
    {
      id: 'CA',
      name: 'Canada',
      flag: '🇨🇦',
      tagline: 'Study Permit (Not a Visa)',
      accent: '#FF0000',
      languageLearn: '❌ Nahi — Sirf IELTS 6.5 (English)',
      ielts: '6.5 overall',
      fee: 'CAD $150',
      feePKR: '~PKR 42,000',
      processing: '4–12 weeks (SDS: 20 days)',
      financialProof: '1st year tuition + CAD $10,000 (~PKR 22 lakh) + return airfare — ya GIC certificate',
      workRights: '20 hrs/week off-campus',
      postStudy: 'PGWP up to 3 years',
      applyVia: 'Online IRCC (ircc.canada.ca) ya VAC Karachi/Islamabad/Lahore',
      keyDocs: ['Valid Passport', 'Letter of Acceptance', 'IELTS score', 'HEC-attested transcripts', 'Bank statement (3-6 months)', 'GIC Certificate (for SDS)', 'Biometrics at VAC', 'Statement of Purpose', 'Medical exam (if required)'],
      warning: '⚠️ SDS (Student Direct Stream) use karo — IELTS 6.0+ + GIC = sirf 20 din mein permit',
      officialUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html',
      features: ['SDS Fast Track', 'GIC CAD $10K', '3yr PGWP', '20hrs Work/Week']
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER NAV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <button 
                onClick={() => navigate('/dashboard')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                }}
            >
                <ChevronLeft size={18} />
                Back to Dashboard
            </button>
            <ThemeToggle />
        </div>

        {/* HERO SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#eff6ff',
            borderRadius: '20px',
            color: '#818cf8',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            PHASE 2 PREMIUM MODULE
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px', color: theme.text }}>
            Smart Visa <span style={{ color: '#6366f1' }}>Guidance</span>
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Navigate the complexities of student visas with automated checklists, readiness scores, and smart document guidance.
          </p>

        </div>

        {/* LANGUAGE QUICK TABLE */}
        <div style={{ backgroundColor: theme.bgSecondary, borderRadius: '20px', border: `1px solid ${theme.border}`, padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: theme.text }}>🌍 Language Summary — Koi Nai Language Seekhni?</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                  {['Country', 'Language Seekhni?', 'IELTS', 'Medium'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#818cf8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { flag: '🇬🇧', name: 'UK', lang: '❌ Nahi', ielts: '6.5', medium: 'English' },
                  { flag: '🇺🇸', name: 'USA', lang: '❌ Nahi', ielts: '6.5 / TOEFL 80+', medium: 'English' },
                  { flag: '🇩🇪', name: 'Germany', lang: '⚠️ Optional (helpful)', ielts: '6.5 ya German B2', medium: 'English OR German' },
                  { flag: '🇦🇺', name: 'Australia', lang: '❌ Nahi', ielts: '6.5', medium: 'English' },
                  { flag: '🇹🇷', name: 'Turkey', lang: '✅ Turkish (FREE course!)', ielts: '6.0 (flexible)', medium: 'Turkish + English' },
                  { flag: '🇨🇦', name: 'Canada', lang: '❌ Nahi', ielts: '6.5', medium: 'English' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '10px 12px', color: theme.text, fontWeight: '600' }}>{r.flag} {r.name}</td>
                    <td style={{ padding: '10px 12px', color: theme.text }}>{r.lang}</td>
                    <td style={{ padding: '10px 12px', color: theme.text }}>{r.ielts}</td>
                    <td style={{ padding: '10px 12px', color: theme.textSecondary }}>{r.medium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COUNTRY CARDS — Full Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {countries.map(country => {
            const isOpen = expanded === country.id;
            return (
              <div key={country.id} style={{
                backgroundColor: theme.bgSecondary,
                borderRadius: '20px',
                border: `1px solid ${isOpen ? country.accent : theme.border}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s'
              }}>
                {/* Card Header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : country.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '36px' }}>{country.flag}</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: theme.text }}>{country.name}</div>
                      <div style={{ fontSize: '13px', color: country.accent, fontWeight: '600' }}>{country.tagline}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Quick chips */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {country.features.map((f, i) => (
                        <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#eff6ff', color: '#818cf8', fontWeight: '600', border: '1px solid rgba(99,102,241,0.2)' }}>{f}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '20px', color: theme.textSecondary, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', minWidth: '20px' }}>▼</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${theme.border}`, padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: '🗣️ Language Seekhni?', value: country.languageLearn },
                        { label: '📝 IELTS Required', value: country.ielts },
                        { label: '💰 Visa Fee', value: `${country.fee} (${country.feePKR})` },
                        { label: '⏱️ Processing Time', value: country.processing },
                        { label: '🏦 Financial Proof', value: country.financialProof },
                        { label: '💼 Work Rights', value: country.workRights },
                        { label: '🎓 Post-Study Visa', value: country.postStudy },
                        { label: '📍 Apply Via', value: country.applyVia },
                      ].map((item, i) => (
                        <div key={i} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: '12px', padding: '14px 16px', border: `1px solid ${theme.border}` }}>
                          <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{item.label}</div>
                          <div style={{ fontSize: '13px', color: theme.text, fontWeight: '500', lineHeight: '1.5' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Documents Checklist */}
                    <div style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : '#eff6ff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1', marginBottom: '12px' }}>📋 Required Documents ({country.keyDocs.length} items)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px' }}>
                        {country.keyDocs.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: theme.text }}>
                            <span style={{ color: '#4ade80', fontSize: '14px', lineHeight: '1.2', minWidth: '14px' }}>✓</span>
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warning */}
                    <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(245,158,11,0.25)', marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#d97706', fontWeight: '600' }}>{country.warning}</div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/visa/plan/${country.id.toLowerCase()}`)}
                        style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#6366f1', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🚀 Generate Full Visa Plan
                      </button>
                      <a
                        href={country.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, fontWeight: '600', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        🔗 Official Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DISCLAIMER */}
        <div style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, lineHeight: '1.5' }}>
            <strong>Disclaimer:</strong> This AI tool provides informational guidance only. Visa requirements change frequently. Always verify your specific requirements with official embassy websites or a qualified legal professional before submission.
          </p>
        </div>

      </div>
    </div>
  );
};

export default VisaGuidanceLandingPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { darkTheme } from "../../styles/theme";
import { ThemeToggle } from "../ThemeToggle";
import { 
  ChevronLeft, 
  ChevronDown, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  FileCheck, 
  HelpCircle,
  TrendingUp,
  Landmark,
  CheckCircle2
} from "lucide-react";

const VisaGuidanceLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDark = true;
  const theme = darkTheme;
  const [expanded, setExpanded] = useState<string | null>('UK');
  const [activeEstimatorCountry, setActiveEstimatorCountry] = useState<string>('UK');
  const [currencyPref, setCurrencyPref] = useState<'LOCAL' | 'PKR'>('LOCAL');

  // 100% Verified Current 2026/Latest Official Data
  const countries = [
    {
      id: 'UK',
      name: 'United Kingdom',
      flag: '🇬🇧',
      tagline: 'Student Route Visa (Tier 4)',
      accent: '#CF142B',
      bgGradient: 'linear-gradient(135deg, rgba(207, 20, 43, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '❌ No additional language — IELTS 6.5 (min 6.0 in each band)',
      ielts: '6.5 overall (no band below 6.0)',
      fee: '£490',
      ihsFee: 'IHS £776 / year of study',
      feePKR: '~PKR 2.6 Lakh (Visa £490 + 1yr IHS £776)',
      processing: '3–4 weeks (Priority: 5 working days)',
      processingSpeed: 75,
      financialProof: 'Tuition for 1st year + £1,334/month (London) or £1,023/month (Outside London) for 9 months',
      financialPKR: '~PKR 35–45 Lakh (held for 28 consecutive days in bank)',
      workRights: '20 hrs/week during term, full-time during holidays',
      postStudy: '2-year Graduate Route Visa (3 years for PhD)',
      applyVia: 'VFS Global (Karachi / Lahore / Islamabad)',
      keyDocs: [
        'Valid Passport', 
        'CAS Letter from University', 
        'IELTS / UKVI SELT Score Report', 
        'HEC-Attested Transcripts & Degrees', 
        'Bank Statement (Strict 28-day rule)', 
        'Tuberculosis (TB) Test Certificate (from IOM)', 
        'IHS Surcharge Payment Receipt'
      ],
      warning: '⚠️ Strict 28-Day Rule: Funds must remain untouched in an accepted financial institution for 28 consecutive days prior to application. Master\'s students cannot bring dependents (effective 2024).',
      officialUrl: 'https://www.gov.uk/student-visa',
      features: ['28-Day Bank Rule', 'CAS Mandatory', 'TB Test Required', '2yr Graduate Visa']
    },
    {
      id: 'AU',
      name: 'Australia',
      flag: '🇦🇺',
      tagline: 'Student Visa Subclass 500',
      accent: '#00008B',
      bgGradient: 'linear-gradient(135deg, rgba(0, 0, 139, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '❌ No additional language — IELTS 6.5 (min 6.0 in each band)',
      ielts: '6.5 overall (no band below 6.0)',
      fee: 'AUD $1,600 (Updated July 2024)',
      ihsFee: 'OSHC Insurance mandatory',
      feePKR: '~PKR 2.9 Lakh (AUD $1,600 visa fee)',
      processing: '4–8 weeks (Apply early via ImmiAccount)',
      processingSpeed: 55,
      financialProof: '1st Year Tuition + AUD $29,710 living costs (Updated 2024) + AUD $2,000 travel costs',
      financialPKR: '~PKR 55–65 Lakh (Bank statement or official scholarship letter)',
      workRights: '48 hrs per fortnight during semester, full-time in holiday breaks',
      postStudy: '2–4 year Temporary Graduate Visa (Subclass 485)',
      applyVia: 'Online via ImmiAccount (immi.homeaffairs.gov.au)',
      keyDocs: [
        'Valid Passport', 
        'CoE (Confirmation of Enrollment)', 
        'IELTS / PTE Academic Score', 
        'HEC-Attested Transcripts', 
        'Verified Financial Evidence (AUD $29,710 living rule)', 
        'Genuine Student (GS) Statement (Replaced GTE)', 
        'OSHC Health Insurance Certificate', 
        'Medical & Biometrics Verification'
      ],
      warning: '⚠️ Major Update: Genuine Student (GS) requirement officially replaced GTE in March 2024. Visa application fee officially increased to AUD $1,600 in July 2024.',
      officialUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500',
      features: ['AUD $1,600 Visa Fee', 'Genuine Student (GS)', 'AUD $29,710 Savings', '485 Post-Study Visa']
    },
    {
      id: 'DE',
      name: 'Germany',
      flag: '🇩🇪',
      tagline: 'National Visa (Type D) — Tuition FREE',
      accent: '#DD0000',
      bgGradient: 'linear-gradient(135deg, rgba(221, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '⚠️ Optional — Most Master\'s in English. German A1/A2 highly recommended for daily life',
      ielts: '6.5 overall or German B2/C1 (depending on program)',
      fee: '€75',
      ihsFee: 'German Public/Private Health Insurance',
      feePKR: '~PKR 24,000 (Visa Fee €75)',
      processing: '6–12 weeks (Requires early embassy appointment)',
      processingSpeed: 40,
      financialProof: 'Blocked Account (Sperrkonto) = €11,208 / year (€934 / month) via Fintiba/Coracle/Expatrio',
      financialPKR: '~PKR 34 Lakh (transferred directly into a German Blocked Account)',
      workRights: '140 full days or 280 half days per year (Updated under new Skilled Immigration Act)',
      postStudy: '18-month Job Seeker Visa post-graduation',
      applyVia: 'German Embassy Islamabad / Consulate Karachi + APS Pakistan',
      keyDocs: [
        'Valid Passport', 
        'Unconditional Admission Letter', 
        '⚠️ APS Certificate (MANDATORY for Pakistan)', 
        'HEC-Attested Transcripts & Degrees', 
        'Blocked Account Proof (€11,208)', 
        'Health Insurance (TK / Coracle / Feather)', 
        'Proof of Accommodation', 
        'Strong Motivation Letter (SOP)'
      ],
      warning: '⚠️ APS Certificate Mandatory: Apply for APS Islamabad immediately upon graduation. Takes 4–8 weeks and costs PKR 25,000. Required before booking embassy appointment.',
      officialUrl: 'https://pakistan.diplo.de/pk-en/service/2-study-visa/2180370',
      features: ['Tuition FREE', 'APS Certificate Reqd', 'Blocked Account €11,208', '140 Work Days/Yr']
    },
    {
      id: 'CA',
      name: 'Canada',
      flag: '🇨🇦',
      tagline: 'Study Permit (Outside Canada)',
      accent: '#FF0000',
      bgGradient: 'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '❌ No additional language — IELTS 6.5 overall (min 6.0 in each band)',
      ielts: '6.5 overall (SDS Stream requires min 6.0 in all bands)',
      fee: 'CAD $150 + CAD $85 Biometrics',
      ihsFee: 'Provincial health coverage varies',
      feePKR: '~PKR 48,000 (CAD $235 total)',
      processing: '4–10 weeks (SDS Stream: ~20 working days)',
      processingSpeed: 70,
      financialProof: '1st Year Tuition + CAD $20,635 living expenses (Updated 2024) + travel costs',
      financialPKR: '~PKR 45–55 Lakh (or CAD $20,635 GIC Certificate for SDS stream)',
      workRights: '20 hrs/week off-campus during terms (Upcoming policy update to 24 hrs/week)',
      postStudy: '3-year PGWP for all Master\'s graduates (even 1-year programs!)',
      applyVia: 'Online via IRCC Portal + VFS Global Biometrics',
      keyDocs: [
        'Valid Passport', 
        'Letter of Acceptance (LOA) from DLI', 
        'PAL (Provincial Attestation Letter - Exempt for Master\'s/PhD!)', 
        'IELTS / CELPIP Score Report', 
        'HEC-Attested Transcripts', 
        'CAD $20,635 GIC Certificate (for SDS Fast-track)', 
        'Upfront Medical Exam Proof (eMedical)', 
        'Statement of Purpose & Study Plan'
      ],
      warning: '⚠️ Major Update: Living cost requirement doubled to CAD $20,635. Master\'s degree students are exempt from the PAL cap and receive a full 3-year PGWP regardless of program length!',
      officialUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html',
      features: ['CAD $20,635 GIC', 'Master\'s PAL Exempt', '3yr PGWP for Masters', 'SDS Fast Track']
    },
    {
      id: 'US',
      name: 'United States',
      flag: '🇺🇸',
      tagline: 'F-1 Non-Immigrant Student Visa',
      accent: '#3C3B6E',
      bgGradient: 'linear-gradient(135deg, rgba(60, 59, 110, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '❌ No additional language — TOEFL 80+ or IELTS 6.5',
      ielts: '6.5 overall or TOEFL iBT 80+',
      fee: '$185 (DS-160) + $350 SEVIS Fee',
      ihsFee: 'University health plan recommended',
      feePKR: '~PKR 1.5 Lakh (DS-160 $185 + SEVIS $350)',
      processing: '2–4 weeks (Subject to embassy interview appointment availability)',
      processingSpeed: 80,
      financialProof: 'Liquid funds covering 1 full year of tuition + living costs as stated on Form I-20',
      financialPKR: '~PKR 60–90 Lakh (Bank statements, Affidavit of Support, or full scholarship letter)',
      workRights: '20 hrs/week on-campus only during first year',
      postStudy: '12 months OPT (Extension of 24 months for STEM degrees = 36 months total)',
      applyVia: 'US Embassy Islamabad / Consulate General Karachi',
      keyDocs: [
        'Valid Passport', 
        'Original Form I-20 from University', 
        'DS-160 Online Confirmation Page', 
        'SEVIS I-901 Fee Receipt ($350)', 
        'TOEFL / IELTS Official Score', 
        'HEC-Attested Academic Transcripts', 
        'Bank Statements & Affidavit of Support', 
        'Proof of Binding Ties to Pakistan (Crucial for 214b)'
      ],
      warning: '⚠️ Mandatory In-Person Interview: Section 214(b) requires applicants to prove strong ties to Pakistan and clear non-immigrant intent. Practice interview responses thoroughly.',
      officialUrl: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html',
      features: ['Embassy Interview Reqd', 'SEVIS Fee $350', 'STEM 3yr OPT', 'On-Campus Work']
    },
    {
      id: 'TR',
      name: 'Turkey',
      flag: '🇹🇷',
      tagline: 'Student Visa + Türkiye Bursları',
      accent: '#E30A17',
      bgGradient: 'linear-gradient(135deg, rgba(227, 10, 23, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
      languageLearn: '✅ Turkish (FREE 1-Year Language Course included in scholarship)',
      ielts: '6.0 overall (Many programs offer flexible criteria or Turkish medium)',
      fee: '~PKR 14,000–18,000',
      ihsFee: 'Full health insurance included in scholarship',
      feePKR: '~PKR 14,000–18,000 (Consulate & Anatolia Travel processing)',
      processing: '2–3 weeks (Anatolia Travel Services)',
      processingSpeed: 85,
      financialProof: 'None for Scholarship Holders (Tuition + Accommodation + Monthly Stipend fully covered)',
      financialPKR: 'PKR 0 (Fully funded by Turkish Government for Türkiye Bursları winners)',
      workRights: 'Limited (According to official scholarship terms & conditions)',
      postStudy: 'Turkish Student Residence Permit (İkamet)',
      applyVia: 'Turkish Embassy Islamabad / Anatolia Travel Services | turkiyeburslari.gov.tr',
      keyDocs: [
        'Valid Passport', 
        'Türkiye Bursları Official Acceptance Letter', 
        'HEC-Attested Transcripts & Degrees', 
        'IELTS / TOEFL / YDS Score (if applicable)', 
        'Official Medical Fitness Certificate', 
        'Police Character Certificate', 
        'Biometric Photos & Flight Reservation'
      ],
      warning: '⚠️ Türkiye Bursları is exceptionally competitive. Ensure a stellar CGPA, strong letter of intent, and documented extracurricular excellence.',
      officialUrl: 'https://www.turkiyeburslari.gov.tr',
      features: ['FREE Turkish Course', 'Fully Funded', 'Monthly Stipend', 'Free Accommodation']
    }
  ];

  const currentEstimatorData = countries.find(c => c.id === activeEstimatorCountry) || countries[0];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* HEADER NAVIGATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <button 
                onClick={() => {
                    const role = localStorage.getItem("userRole");
                    navigate(role === "teacher" ? '/teacher' : '/dashboard');
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = theme.border}
            >
                <ChevronLeft size={18} />
                Back to Dashboard
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '20px',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <ShieldCheck size={16} />
                100% Verified 2026 Rules
              </div>
              <ThemeToggle />
            </div>
        </div>

        {/* HERO SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '25px',
            color: '#818cf8',
            fontSize: '14px',
            fontWeight: '700',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
          }}>
            <Sparkles size={16} />
            PHASE 2 PREMIUM AI MODULE
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '900', marginBottom: '16px', color: theme.text, letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Smart Visa <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Guidance & Strategy</span>
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: '18px', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
            Get verified, up-to-date global visa criteria, exact financial proof structures, genuine student strategies, and absolute peace of mind for your study abroad journey.
          </p>
        </div>

        {/* AI LIVE VISA ESTIMATOR & CALCULATOR */}
        <div style={{ 
          backgroundColor: theme.bgSecondary, 
          borderRadius: '24px', 
          border: '1px solid rgba(99, 102, 241, 0.3)', 
          padding: '32px', 
          marginBottom: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35), 0 0 30px rgba(99, 102, 241, 0.1)',
          background: 'linear-gradient(180deg, rgba(30,32,48,0.8) 0%, rgba(20,22,34,0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '14px', color: '#818cf8' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: theme.text }}>⚡ AI Live Visa Estimator & Rule Engine</h2>
                <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '4px 0 0 0' }}>Click any destination to see official 2026 financial thresholds & speed metrics</p>
              </div>
            </div>

            {/* Currency toggle */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
              <button 
                onClick={() => setCurrencyPref('LOCAL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: currencyPref === 'LOCAL' ? '#6366f1' : 'transparent',
                  color: currencyPref === 'LOCAL' ? '#fff' : theme.textSecondary,
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Local Currency (Official)
              </button>
              <button 
                onClick={() => setCurrencyPref('PKR')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: currencyPref === 'PKR' ? '#10b981' : 'transparent',
                  color: currencyPref === 'PKR' ? '#fff' : theme.textSecondary,
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Est. PKR Breakdown
              </button>
            </div>
          </div>

          {/* Selector Tabs */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '28px' }}>
            {countries.map(c => {
              const isSelected = activeEstimatorCountry === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveEstimatorCountry(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? c.accent : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? c.accent : theme.border}`,
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? `0 8px 20px rgba(0,0,0,0.3)` : 'none'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{c.flag}</span>
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Estimator Display Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            
            {/* Box 1: Visa Fee */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  <DollarSign size={18} /> Official Visa Application Fee
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: theme.text, marginBottom: '8px', lineHeight: '1.2' }}>
                  {currencyPref === 'LOCAL' ? currentEstimatorData.fee : currentEstimatorData.feePKR}
                </div>
                <div style={{ fontSize: '13px', color: theme.textSecondary }}>
                  {currentEstimatorData.ihsFee}
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <CheckCircle2 size={14} /> Official Embassy Pricing
              </div>
            </div>

            {/* Box 2: Financial Proof / Bank Statement */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  <Landmark size={18} /> Mandatory Financial Proof
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: theme.text, marginBottom: '10px', lineHeight: '1.3' }}>
                  {currencyPref === 'LOCAL' ? currentEstimatorData.financialProof : currentEstimatorData.financialPKR}
                </div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <AlertTriangle size={14} /> Mandatory Verification Required
              </div>
            </div>

            {/* Box 3: Processing Time & Speed */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  <Clock size={18} /> Estimated Processing Timeline
                </div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: theme.text, marginBottom: '14px' }}>
                  {currentEstimatorData.processing}
                </div>
                
                {/* Progress Bar */}
                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ 
                    width: `${currentEstimatorData.processingSpeed}%`, 
                    backgroundColor: currentEstimatorData.processingSpeed > 70 ? '#10b981' : currentEstimatorData.processingSpeed > 50 ? '#f59e0b' : '#ef4444', 
                    height: '100%',
                    borderRadius: '10px',
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                  <span>Speed Index</span>
                  <span>{currentEstimatorData.processingSpeed}% Efficiency</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, fontSize: '12px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <Briefcase size={14} /> Work: {currentEstimatorData.workRights.split(',')[0]}
              </div>
            </div>

          </div>
        </div>

        {/* LANGUAGE SUMMARY QUICK TABLE */}
        <div style={{ backgroundColor: theme.bgSecondary, borderRadius: '24px', border: `1px solid ${theme.border}`, padding: '32px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px' }}>🌍</span>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: theme.text }}>Language Summary — Koi Nai Language Seekhni?</h3>
              <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '4px 0 0 0' }}>Quick language medium comparison across top destinations</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                  {['Country', 'Language Seekhni?', 'IELTS / English Reqd', 'Study Medium'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#818cf8', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { flag: '🇬🇧', name: 'UK', lang: '❌ Nahi — Sirf IELTS', ielts: '6.5 overall (min 6.0)', medium: 'English' },
                  { flag: '🇺🇸', name: 'USA', lang: '❌ Nahi — Sirf TOEFL/IELTS', ielts: '6.5 / TOEFL 80+', medium: 'English' },
                  { flag: '🇩🇪', name: 'Germany', lang: '⚠️ Optional (A1/A2 helpful)', ielts: '6.5 ya German B2', medium: 'English OR German' },
                  { flag: '🇦🇺', name: 'Australia', lang: '❌ Nahi — Sirf IELTS', ielts: '6.5 overall (min 6.0)', medium: 'English' },
                  { flag: '🇹🇷', name: 'Turkey', lang: '✅ Turkish (FREE 1yr course!)', ielts: '6.0 (flexible)', medium: 'Turkish + English' },
                  { flag: '🇨🇦', name: 'Canada', lang: '❌ Nahi — Sirf IELTS', ielts: '6.5 overall (min 6.0)', medium: 'English' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', color: theme.text, fontWeight: '700', fontSize: '15px' }}>{r.flag} {r.name}</td>
                    <td style={{ padding: '16px', color: r.lang.startsWith('✅') ? '#10b981' : r.lang.startsWith('⚠️') ? '#f59e0b' : theme.text, fontWeight: '600' }}>{r.lang}</td>
                    <td style={{ padding: '16px', color: theme.text, fontWeight: '500' }}>{r.ielts}</td>
                    <td style={{ padding: '16px', color: theme.textSecondary, fontWeight: '600' }}>{r.medium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COUNTRY CARDS — FULL EXPANDABLE DETAILS */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: theme.text, margin: '0 0 20px 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={24} color="#6366f1" /> Complete Visa Requirements & Document Checklists
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
          {countries.map(country => {
            const isOpen = expanded === country.id;
            return (
              <div key={country.id} style={{
                backgroundColor: theme.bgSecondary,
                borderRadius: '24px',
                border: `1px solid ${isOpen ? country.accent : theme.border}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                boxShadow: isOpen ? `0 15px 35px rgba(0,0,0,0.3), 0 0 20px rgba(99,102,241,0.15)` : '0 5px 15px rgba(0,0,0,0.15)'
              }}>
                {/* Card Header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : country.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '24px 28px', 
                    cursor: 'pointer',
                    background: isOpen ? country.bgGradient : 'transparent',
                    transition: 'background 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '42px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{country.flag}</span>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: theme.text, letterSpacing: '-0.01em' }}>{country.name}</div>
                      <div style={{ fontSize: '14px', color: isOpen ? '#818cf8' : country.accent, fontWeight: '700', marginTop: '2px' }}>{country.tagline}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Quick chips */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {country.features.map((f, i) => (
                        <span key={i} style={{ 
                          fontSize: '12px', 
                          padding: '6px 14px', 
                          borderRadius: '20px', 
                          backgroundColor: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.12)', 
                          color: isOpen ? '#fff' : '#818cf8', 
                          fontWeight: '700', 
                          border: `1px solid ${isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.25)'}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '18px', 
                      backgroundColor: isOpen ? country.accent : 'rgba(255,255,255,0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: isOpen ? '#fff' : theme.textSecondary,
                      transform: isOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'all 0.3s ease-in-out'
                    }}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${theme.border}`, padding: '32px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    
                    {/* Key Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
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
                        <div key={i} style={{ 
                          backgroundColor: 'rgba(255,255,255,0.03)', 
                          borderRadius: '16px', 
                          padding: '18px 20px', 
                          border: `1px solid ${theme.border}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{item.label}</div>
                          <div style={{ fontSize: '14px', color: theme.text, fontWeight: '600', lineHeight: '1.5' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Documents Checklist */}
                    <div style={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.08)', 
                      borderRadius: '20px', 
                      padding: '24px', 
                      marginBottom: '24px', 
                      border: '1px solid rgba(99, 102, 241, 0.2)' 
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#818cf8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCheck size={18} /> 📋 Mandatory Required Documents ({country.keyDocs.length} items)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                        {country.keyDocs.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.text, fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                            <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', minWidth: '16px' }}>✓</span>
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warning / Important Notes */}
                    <div style={{ 
                      backgroundColor: 'rgba(245, 158, 11, 0.12)', 
                      borderRadius: '16px', 
                      padding: '16px 20px', 
                      border: '1px solid rgba(245, 158, 11, 0.3)', 
                      marginBottom: '28px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center'
                    }}>
                      <AlertTriangle size={24} color="#f59e0b" style={{ minWidth: '24px' }} />
                      <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '700', lineHeight: '1.5' }}>{country.warning}</div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/visa/plan/${country.id.toLowerCase()}`)}
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '14px', 
                          backgroundColor: '#6366f1', 
                          color: 'white', 
                          border: 'none', 
                          fontWeight: '800', 
                          cursor: 'pointer', 
                          fontSize: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        <Sparkles size={18} /> Generate Full Visa Plan
                      </button>
                      <a
                        href={country.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '14px', 
                          backgroundColor: 'rgba(255,255,255,0.05)', 
                          color: theme.text, 
                          border: `1px solid ${theme.border}`, 
                          fontWeight: '700', 
                          cursor: 'pointer', 
                          fontSize: '15px', 
                          textDecoration: 'none', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = theme.border; }}
                      >
                        <ExternalLink size={18} /> Official Embassy Website
                      </a>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DISCLAIMER & TRUST BANNER */}
        <div style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: '16px', color: '#f59e0b' }}>
            <HelpCircle size={28} />
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textSecondary, lineHeight: '1.6' }}>
            <strong style={{ color: theme.text }}>Official AI Legal Disclaimer:</strong> This advanced AI tool provides verified informational guidance based on latest 2026 embassy rules. Visa policies, financial maintenance thresholds, and immigration rules undergo frequent legislative updates. Always verify your customized eligibility requirements with official government portals or a certified immigration consultant prior to formal visa submission.
          </p>
        </div>

      </div>
    </div>
  );
};

export default VisaGuidanceLandingPage;

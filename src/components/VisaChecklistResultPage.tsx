import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ChecklistItem {
  id: number;
  document_key: string;
  title: string;
  status: 'ready' | 'missing' | 'optional' | 'verify';
  reason: string;
  action_hint: string;
}

interface ChecklistData {
  id: number;
  readiness_score: number;
  status_summary: string;
  generated_at: string;
  items: ChecklistItem[];
}

const VisaChecklistResultPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecklist = async () => {
      const token = localStorage.getItem('token');
      const API_BASE = "http://localhost:8000";

      try {
        const res = await fetch(`${API_BASE}/visa/plans/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();
        // Find the current checklist by ID
        const current = history.find((c: any) => c.id === parseInt(id || '0'));
        if (current) setData(current);
        else throw new Error('Checklist not found');
      } catch (error) {
        toast.error('Failed to load checklist');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [id]);

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading your plan...</div>;
  if (!data) return <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Plan not found</div>;

  const scoreColor = data.readiness_score > 70 ? '#10b981' : data.readiness_score > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <button onClick={() => navigate('/visa')} style={{ color: '#818cf8', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px' }}>← Back to Dashboard</button>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Generated on {new Date(data.generated_at).toLocaleDateString()}</div>
        </div>

        {/* HERO SCORE SECTION */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          borderRadius: '24px', 
          padding: '40px', 
          border: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
          marginBottom: '32px'
        }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#334155" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * data.readiness_score) / 100} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', fontSize: '28px', fontWeight: '800' }}>{data.readiness_score}%</div>
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Readiness Score</h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.5' }}>{data.status_summary}</p>
          </div>
        </div>

        {/* CHECKLIST GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {data.items.sort((a, b) => a.status === 'missing' ? -1 : 1).map(item => (
            <div key={item.id} style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{item.title}</h3>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    backgroundColor: item.status === 'ready' ? '#065f46' : item.status === 'missing' ? '#991b1b' : '#92400e',
                    color: item.status === 'ready' ? '#34d399' : item.status === 'missing' ? '#f87171' : '#fbbf24'
                  }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>{item.reason}</p>
                {item.action_hint && (
                  <div style={{ fontSize: '13px', color: '#818cf8', fontWeight: '500' }}>💡 Tip: {item.action_hint}</div>
                )}
              </div>
              <button style={{ 
                backgroundColor: item.status === 'ready' ? '#334155' : '#6366f1', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                {item.status === 'ready' ? 'View Details' : 'How to Prepare'}
              </button>
            </div>
          ))}
        </div>

        {/* AI PANEL CTA */}
        <div style={{
          marginTop: '40px',
          padding: '32px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>Have more questions?</h2>
          <p style={{ marginBottom: '24px', opacity: 0.9 }}>Ask our AI about specific document formats or embassy requirements.</p>
          <button style={{ 
            backgroundColor: 'white', 
            color: '#4f46e5', 
            border: 'none', 
            padding: '12px 32px', 
            borderRadius: '12px', 
            fontWeight: '700', 
            cursor: 'pointer' 
          }}>
            Ask Visa AI ✨
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisaChecklistResultPage;

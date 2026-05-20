import { useEffect, useState } from "react";
import { api } from "../../api";
import { toast } from "sonner";
import {
  ExternalLink, CheckCircle2, XCircle, Loader2, RefreshCw,
  ShieldAlert, ShieldCheck, Clock, AlertTriangle, GraduationCap,
  MapPin, Banknote, BookOpen, Globe, ChevronDown, ChevronUp
} from "lucide-react";

interface StagedScholarship {
  id: number;
  title: string;
  university: string;
  country: string;
  city: string;
  degree_level: string;
  funding_type: string;
  scholarship_amount_value: string;
  scholarship_amount_numeric: number;
  tuition_fee_per_year: string;
  min_cgpa: number;
  min_ielts: number;
  min_toefl: number;
  eligibility: string;
  duration_text: string;
  description: string;
  scholarship_url: string;
  website_url: string;
  fraud_risk_score: number;
  fraud_risk_level: string;
  fraud_reasons: string[];
  review_status: "pending" | "rejected";
  scraped_at: string;
}

const RISK_CONFIG = {
  SAFE:     { color: "bg-green-100 text-green-700 border-green-200",  badge: "bg-green-500",  label: "SAFE" },
  MEDIUM:   { color: "bg-yellow-100 text-yellow-700 border-yellow-200", badge: "bg-yellow-500", label: "MEDIUM" },
  HIGH:     { color: "bg-red-100 text-red-700 border-red-100",        badge: "bg-red-500",    label: "HIGH" },
  CRITICAL: { color: "bg-red-200 text-red-800 border-red-200",        badge: "bg-red-700",    label: "CRITICAL" },
};

export function StagedReviewQueue() {
  const [items, setItems] = useState<StagedScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [overriding, setOverriding] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "rejected">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStagedPending();
      setItems(data);
    } catch {
      toast.error("Failed to load staged scholarships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setOverriding(id);
    try {
      const result = await api.admin.overrideStagedDecision(id, action);
      toast.success(result.message);
      setItems(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setOverriding(null);
    }
  };

  const filtered = items.filter(s =>
    filter === "all" ? true : s.review_status === filter
  );

  const pendingCount  = items.filter(s => s.review_status === "pending").length;
  const rejectedCount = items.filter(s => s.review_status === "rejected").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🔍 Staged Review Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            MEDIUM risk scholarships need your verification. Click the URL to check on the official site, then approve or reject.
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "All", value: "all", count: items.length, color: "bg-gray-100 text-gray-700" },
          { label: "Pending Review", value: "pending", count: pendingCount, color: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
          { label: "Bot Rejected", value: "rejected", count: rejectedCount, color: "bg-red-50 text-red-700 border border-red-200" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${f.color} ${filter === f.value ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
          >
            {f.label} <span className="ml-1 opacity-75">({f.count})</span>
          </button>
        ))}
      </div>

      {/* How it works banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-blue-700 font-semibold"><ShieldCheck size={16} className="text-green-600" /> Score 0-29 → Auto Approved (no action needed)</div>
        <div className="flex items-center gap-2 text-blue-700 font-semibold"><AlertTriangle size={16} className="text-yellow-500" /> Score 30-49 → Shown here for admin review</div>
        <div className="flex items-center gap-2 text-blue-700 font-semibold"><ShieldAlert size={16} className="text-red-500" /> Score 50+ → Auto Rejected (you can still override)</div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400">
          <ShieldCheck size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-semibold text-gray-600">All clear!</p>
          <p className="text-sm mt-1">No scholarships pending review right now.</p>
        </div>
      )}

      {/* Scholarship cards */}
      <div className="space-y-4">
        {filtered.map(s => {
          const risk = RISK_CONFIG[s.fraud_risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.MEDIUM;
          const isExpanded = expanded === s.id;
          const isActing = overriding === s.id;

          return (
            <div key={s.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${s.review_status === "pending" ? "border-yellow-200 bg-yellow-50/30" : "border-red-200 bg-red-50/20"}`}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${risk.color}`}>
                    ⚠️ Score {s.fraud_risk_score} — {risk.label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.review_status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {s.review_status === "pending" ? "🕐 Pending Review" : "❌ Bot Rejected"}
                  </span>
                  {s.scraped_at && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {new Date(s.scraped_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button onClick={() => setExpanded(isExpanded ? null : s.id)} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Main content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{s.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><GraduationCap size={13} /> {s.university}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {s.city}, {s.country}</span>
                      <span className="flex items-center gap-1"><BookOpen size={13} /> {s.degree_level}</span>
                    </div>

                    {/* Key stats row */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-1.5">
                        <Banknote size={13} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">{s.scholarship_amount_value || "N/A"}</span>
                      </div>
                      <div className="text-xs bg-gray-100 rounded-xl px-3 py-1.5 font-semibold text-gray-600">
                        CGPA {s.min_cgpa}+ · IELTS {s.min_ielts}+ · TOEFL {s.min_toefl}+
                      </div>
                      <div className="text-xs bg-blue-50 rounded-xl px-3 py-1.5 font-semibold text-blue-700 border border-blue-100">
                        {s.funding_type} · {s.duration_text}
                      </div>
                    </div>

                    {/* Fraud reasons */}
                    {s.fraud_reasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.fraud_reasons.map((r, i) => (
                          <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-lg px-2 py-0.5">
                            ⚠️ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Verify URL button */}
                    {(s.scholarship_url || s.website_url) && (
                      <a
                        href={s.scholarship_url || s.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm shadow-blue-200"
                      >
                        <Globe size={14} /> Verify on Website
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(s.id, "approve")}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(s.id, "reject")}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {s.eligibility && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Eligibility</p>
                        <p className="text-sm text-gray-700">{s.eligibility}</p>
                      </div>
                    )}
                    {s.description && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</p>
                        <p className="text-sm text-gray-700">{s.description}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {s.tuition_fee_per_year && (
                        <div><span className="font-bold text-gray-600">Tuition: </span><span className="text-gray-700">{s.tuition_fee_per_year}</span></div>
                      )}
                      {s.scholarship_url && (
                        <div><span className="font-bold text-gray-600">Scholarship URL: </span>
                          <a href={s.scholarship_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                            {s.scholarship_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

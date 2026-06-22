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
            <div key={s.id} className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${s.review_status === "pending" ? "border-l-4 border-l-yellow-400 border-y-gray-200 border-r-gray-200" : "border-l-4 border-l-red-500 border-y-gray-200 border-r-gray-200"}`}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${risk.color}`}>
                    <ShieldAlert size={14} /> Score {s.fraud_risk_score} — {risk.label}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${s.review_status === "pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                    {s.review_status === "pending" ? <Clock size={14} /> : <XCircle size={14} />}
                    {s.review_status === "pending" ? "Pending Review" : "Bot Rejected"}
                  </div>
                  {s.scraped_at && (
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1 ml-1">
                      <Clock size={13} /> Scraped: {new Date(s.scraped_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button onClick={() => setExpanded(isExpanded ? null : s.id)} className="text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm rounded-full p-1.5 transition-colors">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Main content */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{s.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5"><GraduationCap size={16} className="text-gray-400"/> {s.university}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400"/> {s.city}, {s.country}</span>
                      <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-gray-400"/> {s.degree_level}</span>
                    </div>

                    {/* Key stats row */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Banknote size={15} className="text-green-600" />
                        <span className="text-sm font-bold text-green-700">{s.scholarship_amount_value || "Amount N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-semibold text-gray-700 shadow-sm">
                        CGPA {s.min_cgpa}+ <span className="text-gray-300">|</span> IELTS {s.min_ielts}+ <span className="text-gray-300">|</span> TOEFL {s.min_toefl}+
                      </div>
                      <div className="flex items-center gap-1.5 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 font-semibold text-blue-700 shadow-sm">
                        {s.funding_type} <span className="text-blue-200">|</span> {s.duration_text}
                      </div>
                    </div>

                    {/* Fraud reasons */}
                    {s.fraud_reasons.length > 0 && (
                      <div className="mt-4 flex flex-col gap-1.5">
                        {s.fraud_reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="font-medium">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full lg:w-48 mt-2 lg:mt-0">
                    {/* Verify URL button */}
                    {(s.scholarship_url || s.website_url) && (
                      <a
                        href={s.scholarship_url || s.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 text-sm font-bold transition-all shadow-sm w-full"
                      >
                        <Globe size={16} className="text-blue-500"/> Verify on Website
                        <ExternalLink size={14} className="text-gray-400" />
                      </a>
                    )}
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleAction(s.id, "approve")}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(s.id, "reject")}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl border-t-slate-100 shadow-inner">
                    <div className="space-y-4">
                      {s.eligibility && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ShieldCheck size={14}/> Eligibility Criteria</p>
                          <p className="text-sm text-gray-700 leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">{s.eligibility}</p>
                        </div>
                      )}
                      {s.tuition_fee_per_year && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Banknote size={14}/> Tuition Fee</p>
                          <p className="text-sm text-gray-700 font-medium bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">{s.tuition_fee_per_year}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {s.description && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BookOpen size={14}/> Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">{s.description}</p>
                        </div>
                      )}
                      {s.scholarship_url && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Globe size={14}/> Official Source</p>
                          <a href={s.scholarship_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium break-all bg-blue-50/50 hover:bg-blue-50 p-3.5 rounded-xl border border-blue-100 shadow-sm flex items-start gap-2 transition-colors">
                            <ExternalLink size={16} className="shrink-0 mt-0.5 text-blue-500"/>
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

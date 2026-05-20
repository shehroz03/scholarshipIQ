import { useEffect, useState } from "react";
import { api } from "../../api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Play, RefreshCw, ShieldCheck, AlertTriangle, Ban, Clock, Zap, KeyRound, BarChart2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface VerifyStats {
    total_staged: number;
    pending_review: number;
    auto_approved: number;
    auto_rejected: number;
    blocked_critical: number;
}

interface LogEntry {
    staged_id: number;
    title: string;
    university: string;
    country: string;
    fraud_score: number;
    fraud_level: string;
    decision: "approved" | "rejected";
    confidence: string;
    reasons: string[];
    decided_at: string;
    decided_by: string;
    action: string;
}

export function AutoVerifyDashboard() {
    const [stats, setStats] = useState<VerifyStats | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [overriding, setOverriding] = useState<number | null>(null);

    // Auto-Update state
    const [updateStatus, setUpdateStatus] = useState<any>(null);
    const [updateLog, setUpdateLog] = useState<any[]>([]);
    const [updateRunning, setUpdateRunning] = useState(false);
    const [lastUpdateResult, setLastUpdateResult] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [statsData, logData, updateStatusData, updateLogData] = await Promise.all([
                api.admin.getAutoVerifyStats(),
                api.admin.getAutoVerifyLog(50),
                api.admin.getAutoUpdateStatus(),
                api.admin.getAutoUpdateLog(),
            ]);
            setStats(statsData);
            setLog(logData.log || []);
            setUpdateStatus(updateStatusData);
            setUpdateLog(updateLogData.log || []);
        } catch (err: any) {
            toast.error("Failed to load pipeline data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRunVerify = async () => {
        setRunning(true);
        try {
            const result = await api.admin.runAutoVerify();
            toast.success(`✅ Auto-Verify Done: ${result.approved} approved, ${result.rejected} rejected`);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Auto-verify failed");
        } finally {
            setRunning(false);
        }
    };

    const handleRunUpdate = async () => {
        setUpdateRunning(true);
        toast.info("AI scan started... may take 1-2 minutes.");
        try {
            const result = await api.admin.triggerAutoUpdate(6);
            setLastUpdateResult(result);
            toast.success(`Scan done! Checked: ${result.checked} | Updated: ${result.updated}`);
            fetchData();
        } catch {
            toast.error("Auto-update failed. Check backend logs.");
        } finally {
            setUpdateRunning(false);
        }
    };

    const handleOverride = async (stagedId: number, action: "approve" | "reject") => {
        setOverriding(stagedId);
        try {
            const result = await api.admin.overrideStagedDecision(stagedId, action);
            toast.success(result.message);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Override failed");
        } finally {
            setOverriding(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">🤖 Auto-Verify Pipeline</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Bot automatically approves/rejects staged scholarships. Admin can override anytime.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-all"
                    >
                        <RefreshCw size={15} /> Refresh
                    </button>
                    <button
                        onClick={handleRunVerify}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60"
                    >
                        {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                        Run Auto-Verify Now
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                        { label: "Total Staged", value: stats.total_staged, icon: Clock, color: "bg-gray-100 text-gray-700" },
                        { label: "Pending", value: stats.pending_review, icon: AlertTriangle, color: "bg-yellow-50 text-yellow-700" },
                        { label: "Auto-Approved", value: stats.auto_approved, icon: CheckCircle2, color: "bg-green-50 text-green-700" },
                        { label: "Auto-Rejected", value: stats.auto_rejected, icon: XCircle, color: "bg-red-50 text-red-700" },
                        { label: "Blocked (Critical)", value: stats.blocked_critical, icon: Ban, color: "bg-orange-50 text-orange-700" },
                    ].map((card) => (
                        <div key={card.label} className={`rounded-2xl p-4 border border-gray-100 ${card.color} bg-white shadow-sm`}>
                            <div className="flex items-center gap-2 mb-1">
                                <card.icon size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wide">{card.label}</span>
                            </div>
                            <div className="text-3xl font-black">{card.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Flow Diagram */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">🔄 Auto Pipeline Flow</p>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {[
                        { label: "Scholarship Found", color: "bg-gray-200 text-gray-700" },
                        { label: "→" , color: "text-gray-400" },
                        { label: "Fraud Check (AI)", color: "bg-purple-100 text-purple-700" },
                        { label: "→", color: "text-gray-400" },
                        { label: "SAFE → Auto Approved ✅", color: "bg-green-100 text-green-700" },
                        { label: "MEDIUM → Secondary Check 🔍", color: "bg-yellow-100 text-yellow-700" },
                        { label: "HIGH/CRITICAL → Auto Rejected ❌", color: "bg-red-100 text-red-700" },
                        { label: "→", color: "text-gray-400" },
                        { label: "Users See Only Approved ✅", color: "bg-blue-100 text-blue-700" },
                    ].map((item, i) => (
                        <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold ${item.color}`}>
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Decision Log */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">📋 Bot Decision Log</h3>
                {log.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                        No auto-verify decisions yet. Run the pipeline to process staged scholarships.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {log.map((entry, i) => (
                            <div key={i} className={`rounded-2xl border p-4 ${entry.decision === "approved" ? "border-green-100 bg-green-50/50" : "border-red-100 bg-red-50/50"}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        {entry.decision === "approved"
                                            ? <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
                                            : <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />}
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{entry.title}</p>
                                            <p className="text-xs text-gray-500">{entry.university} · {entry.country}</p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${entry.fraud_score <= 39 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    Score: {entry.fraud_score} ({entry.fraud_level})
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    Confidence: {entry.confidence}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(entry.decided_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {entry.reasons.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">⚠️ {entry.reasons.slice(0, 2).join(" · ")}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Admin Override Buttons */}
                                    <div className="flex gap-2 shrink-0">
                                        {entry.decision === "rejected" && (
                                            <button
                                                onClick={() => handleOverride(entry.staged_id, "approve")}
                                                disabled={overriding === entry.staged_id}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50"
                                            >
                                                {overriding === entry.staged_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Approve
                                            </button>
                                        )}
                                        {entry.decision === "approved" && (
                                            <button
                                                onClick={() => handleOverride(entry.staged_id, "reject")}
                                                disabled={overriding === entry.staged_id}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50"
                                            >
                                                {overriding === entry.staged_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── AI AUTO-UPDATE SECTION (merged) ─────────────────────────── */}
            <div className="border-t border-gray-200 pt-6 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Zap size={18} className="text-indigo-500" /> AI Auto-Update System
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Uses Serper + GPT-4o to detect scholarship changes every 4 days
                        </p>
                    </div>
                    <button
                        onClick={handleRunUpdate}
                        disabled={updateRunning}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={updateRunning ? "animate-spin" : ""} />
                        {updateRunning ? "Scanning..." : "Run Now (6 Scholarships)"}
                    </button>
                </div>

                {/* Update stats */}
                {updateStatus && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Total Live", value: updateStatus.total_approved, icon: BarChart2, color: "text-indigo-600" },
                            { label: "Never Checked", value: updateStatus.never_checked, icon: AlertTriangle, color: "text-yellow-600" },
                            { label: "Checked (4d)", value: updateStatus.checked_in_last_4_days ?? 0, icon: CheckCircle2, color: "text-green-600" },
                            { label: "Schedule", value: "4 Days", icon: Clock, color: "text-blue-600" },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <stat.icon size={14} className={stat.color} />
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</span>
                                </div>
                                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Coverage bar */}
                {updateStatus && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Coverage Progress</span>
                            <span className="text-xs font-bold text-indigo-600">
                                {Math.round((updateStatus.total_checked_ever / Math.max(updateStatus.total_approved, 1)) * 100)}% ever checked
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                                style={{ width: `${Math.round((updateStatus.total_checked_ever / Math.max(updateStatus.total_approved, 1)) * 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                            Schedule: <strong>{updateStatus.schedule}</strong> · Batch: <strong>{updateStatus.next_batch_size}</strong>
                            {!updateStatus.api_keys_ok
                                ? <span className="text-red-500 font-semibold flex items-center gap-1"><XCircle size={11} /> API Keys missing!</span>
                                : <span className="text-green-600 font-semibold flex items-center gap-1"><KeyRound size={11} /> API Keys OK</span>
                            }
                        </p>
                    </div>
                )}

                {/* Last update result */}
                {lastUpdateResult && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <p className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={15} /> Last Run Result</p>
                        <div className="flex gap-6 text-sm">
                            <div><span className="text-gray-500">Checked:</span> <strong>{lastUpdateResult.checked}</strong></div>
                            <div><span className="text-gray-500">Updated:</span> <strong className="text-green-700">{lastUpdateResult.updated}</strong></div>
                            <div><span className="text-gray-500">Errors:</span> <strong className="text-red-600">{lastUpdateResult.errors}</strong></div>
                        </div>
                    </div>
                )}

                {/* Change log */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h4 className="text-sm font-bold text-gray-800">Change Log (Most Recent)</h4>
                    </div>
                    {updateLog.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No changes recorded yet. Run a scan to detect scholarship updates.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                            {updateLog.slice(0, 30).map((entry: any, i: number) => (
                                <div key={i} className="px-4 py-3 hover:bg-gray-50">
                                    <div className="flex justify-between gap-2">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{entry.title}</div>
                                            <div className="text-xs text-gray-400">{entry.university}</div>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{new Date(entry.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(entry.changes || []).map((c: string, j: number) => (
                                            <Badge key={j} className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-normal">{c}</Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

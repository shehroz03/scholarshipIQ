import { useEffect, useState } from "react";
import { api } from "../../api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Play, RefreshCw, ShieldCheck, AlertTriangle, Ban, Clock, Zap, KeyRound, BarChart2, CalendarX, Trash2, Archive } from "lucide-react";
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
    const [updateBatchSize, setUpdateBatchSize] = useState<number>(6);

    // Expired Bot state
    const [expiredCount, setExpiredCount] = useState<number | null>(null);
    const [cleanupLog, setCleanupLog] = useState<any[]>([]);
    const [cleanupStats, setCleanupStats] = useState<any>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set());
    const [showAllUpdates, setShowAllUpdates] = useState(false);

    const toggleExpand = (i: number) => {
        setExpandedRuns(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const fetchData = async () => {
        try {
            const [statsData, logData, updateStatusData, updateLogData, expiredData, cleanupData, archivedData] = await Promise.all([
                api.admin.getAutoVerifyStats(),
                api.admin.getAutoVerifyLog(50),
                api.admin.getAutoUpdateStatus(),
                api.admin.getAutoUpdateLog(),
                api.admin.getExpiredScholarshipCount(),
                api.admin.getExpiredCleanupLog(),
                api.admin.getArchivedScholarships(0, 500),
            ]);
            setStats(statsData);
            setLog(logData.log || []);
            setUpdateStatus(updateStatusData);
            setExpiredCount(expiredData.expired_count ?? 0);

            // Build URL lookup map from DB by title (works for both archived + active)
            const urlByTitle: Record<string, string> = {};
            const urlById: Record<number, string> = {};
            (archivedData || []).forEach((s: any) => {
                if (s.id) urlById[s.id] = s.scholarship_url || s.website_url || "";
                if (s.title) urlByTitle[s.title] = s.scholarship_url || s.website_url || "";
            });

            // Enrich cleanup log entries with URLs from DB
            const enrichedLog = (cleanupData.log || []).map((run: any) => ({
                ...run,
                scholarships: (run.scholarships || []).map((s: any) => ({
                    ...s,
                    scholarship_url: s.scholarship_url || urlById[s.id] || urlByTitle[s.title] || ""
                }))
            }));
            setCleanupLog(enrichedLog);
            setCleanupStats({ total_runs: cleanupData.total_runs, total_archived_all_time: cleanupData.total_archived_all_time });

            // Enrich update log entries with URLs from DB (by title match)
            const enrichedUpdateLog = (updateLogData.log || []).map((entry: any) => ({
                ...entry,
                scholarship_url: entry.scholarship_url || urlByTitle[entry.title] || urlById[entry.scholarship_id] || ""
            }));
            setUpdateLog(enrichedUpdateLog);
        } catch (err: any) {
            toast.error("Failed to load pipeline data");
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveExpired = async () => {
        if (!window.confirm(`Archive ${expiredCount} expired scholarships? They will be hidden from users and AI recommendations.`)) return;
        setIsArchiving(true);
        try {
            const result = await api.admin.archiveExpiredScholarships();
            setExpiredCount(0);
            toast.success(`✅ Done! ${result.archived_count} expired scholarships archived.`);
            fetchData();
        } catch {
            toast.error("Failed to archive expired scholarships.");
        } finally {
            setIsArchiving(false);
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
            const result = await api.admin.triggerAutoUpdate(updateBatchSize);
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

            {/* ─── EXPIRED BOT SECTION ─────────────────────────── */}
            <div className="rounded-2xl border-2 p-5 space-y-4 bg-white shadow-sm" style={{ borderColor: expiredCount && expiredCount > 0 ? '#fecaca' : '#bbf7d0' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <CalendarX size={18} className="text-red-500" /> 🤖 Expired Scholarship Bot
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Runs daily at 4:10 AM — auto-archives all past-deadline scholarships from DB
                        </p>
                    </div>
                    <button
                        onClick={handleArchiveExpired}
                        disabled={isArchiving || expiredCount === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 ${
                            expiredCount && expiredCount > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Trash2 size={14} className={isArchiving ? 'animate-pulse' : ''} />
                        {isArchiving ? 'Archiving...' : expiredCount === 0 ? '✅ DB Clean' : `Archive ${expiredCount} Expired Now`}
                    </button>
                </div>

                {/* Status banner */}
                <div className={`rounded-xl border p-3 flex items-center gap-3 ${
                    expiredCount && expiredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                    <CalendarX size={18} className={expiredCount && expiredCount > 0 ? 'text-red-500 shrink-0' : 'text-green-600 shrink-0'} />
                    <div className="flex-1">
                        <p className={`font-bold text-sm ${ expiredCount && expiredCount > 0 ? 'text-red-800' : 'text-green-800' }`}>
                            {expiredCount === null ? 'Checking...' : expiredCount === 0
                                ? '✅ No expired scholarships — DB is clean!'
                                : `⚠️ ${expiredCount} scholarships with passed deadlines still active in DB`
                            }
                        </p>
                        {cleanupStats && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                Bot runs: <strong>{cleanupStats.total_runs}</strong> &nbsp;|&nbsp;
                                Total archived all time: <strong className="text-red-600">{cleanupStats.total_archived_all_time}</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Bot Activity Log */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                            <Archive size={12} className="text-red-400" /> Bot Activity Log
                        </h4>
                        <span className="text-xs text-gray-400">Last 100 runs</span>
                    </div>
                    {cleanupLog.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-xs">
                            No runs yet — bot runs automatically tonight at 4:10 AM.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                            {cleanupLog.map((run: any, i: number) => (
                                <div key={i} className="px-4 py-2.5 hover:bg-white transition-colors">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                run.triggered_by === 'admin_manual'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                            }`}>
                                                {run.triggered_by === 'admin_manual' ? '👤 Manual' : '🤖 Auto Bot'}
                                            </span>
                                            <span className="text-xs font-black text-red-600">{run.archived_count} removed</span>
                                        </div>
                                        <span className="text-[11px] text-gray-400">{new Date(run.run_at).toLocaleString()}</span>
                                    </div>
                                    {run.scholarships?.length > 0 && (() => {
                                        const isExpanded = expandedRuns.has(i);
                                        const visible = isExpanded ? run.scholarships : run.scholarships.slice(0, 5);
                                        const hidden = run.scholarships.length - 5;
                                        return (
                                            <div className="mt-1.5 space-y-0.5">
                                                {visible.map((s: any, j: number) => (
                                                    <div key={j} className="flex items-center justify-between gap-2 py-0.5 px-2 rounded-lg hover:bg-white transition-colors">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {s.scholarship_url ? (
                                                                <a
                                                                    href={s.scholarship_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline truncate font-medium flex items-center gap-0.5"
                                                                    title={s.scholarship_url}
                                                                >
                                                                    {s.title} <span className="text-[9px]">↗</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-600 truncate font-medium">{s.title}</span>
                                                            )}
                                                            {s.university && (
                                                                <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">· {s.university}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-red-400 shrink-0 font-semibold">{s.deadline}</span>
                                                    </div>
                                                ))}
                                                {hidden > 0 && (
                                                    <button
                                                        onClick={() => toggleExpand(i)}
                                                        className="mt-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                                                    >
                                                        {isExpanded
                                                            ? `− Show less`
                                                            : `+ Show ${hidden} more removed scholarships`
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}
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
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-500 font-semibold">
                                Batch: <span className="text-indigo-600 font-black">{updateBatchSize}</span>
                            </span>
                            <div className="flex gap-1">
                                {[6, 10, 25, 50].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setUpdateBatchSize(n)}
                                        disabled={updateRunning}
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border transition-all ${
                                            updateBatchSize === n
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleRunUpdate}
                            disabled={updateRunning}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-60 shrink-0"
                        >
                            <RefreshCw size={14} className={updateRunning ? "animate-spin" : ""} />
                            {updateRunning ? "Scanning..." : `Run Now (${updateBatchSize} Scholarships)`}
                        </button>
                    </div>
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
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <RefreshCw size={14} className="text-indigo-500" /> AI Update Activity Log
                        </h4>
                        <span className="text-xs text-gray-400 font-medium">{updateLog.length} total changes</span>
                    </div>
                    {updateLog.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No changes recorded yet. Run a scan to detect scholarship updates.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {(showAllUpdates ? updateLog : updateLog.slice(0, 5)).map((entry: any, i: number) => (
                                <div key={i} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                    {/* Row 1: Title + timestamp */}
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                        <div className="min-w-0 flex-1">
                                            {entry.scholarship_url ? (
                                                <a
                                                    href={entry.scholarship_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                                    title={entry.scholarship_url}
                                                >
                                                    {entry.title}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                </a>
                                            ) : (
                                                <span className="text-sm font-bold text-gray-900">{entry.title}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                                            {new Date(entry.updated_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Row 2: University · Country · Deadline */}
                                    <div className="text-xs text-gray-500 mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        {entry.university && <span className="font-medium">{entry.university}</span>}
                                        {entry.country && <span className="text-gray-400">· {entry.country}</span>}
                                        {entry.deadline && (
                                            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                                📅 Deadline: {entry.deadline}
                                            </span>
                                        )}
                                    </div>
                                    {/* Row 3: Change badges */}
                                    {(entry.changes || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                                            {(entry.changes || []).map((c: string, j: number) => (
                                                <span key={j} className="inline-block text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium px-2 py-0.5 rounded-full">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Row 4: AI Notes */}
                                    {entry.ai_notes && (
                                        <p className="text-xs text-gray-400 italic mt-1 leading-relaxed">
                                            💡 {entry.ai_notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {updateLog.length > 5 && (
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowAllUpdates(p => !p)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 hover:underline transition-colors"
                                    >
                                        {showAllUpdates
                                            ? `▲ Show less`
                                            : `▼ Show ${updateLog.length - 5} more updated scholarships`
                                        }
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

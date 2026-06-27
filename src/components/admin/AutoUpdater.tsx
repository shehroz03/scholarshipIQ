import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Zap, RefreshCw, CheckCircle, AlertTriangle, Clock, BarChart2, KeyRound, XCircle, Trash2, CalendarX } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

export function AutoUpdater() {
    const [status, setStatus] = useState<any>(null);
    const [log, setLog] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expiredCount, setExpiredCount] = useState<number | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [archiveResult, setArchiveResult] = useState<any>(null);
    const [cleanupLog, setCleanupLog] = useState<any[]>([]);
    const [cleanupStats, setCleanupStats] = useState<any>(null);
    const [batchSize, setBatchSize] = useState<number>(6);

    const fetchData = async () => {
        try {
            const [s, l, expired, cleanup] = await Promise.all([
                api.admin.getAutoUpdateStatus(),
                api.admin.getAutoUpdateLog(),
                api.admin.getExpiredScholarshipCount(),
                api.admin.getExpiredCleanupLog()
            ]);
            setStatus(s);
            setLog(l.log || []);
            setExpiredCount(expired.expired_count ?? 0);
            setCleanupLog(cleanup.log || []);
            setCleanupStats({ total_runs: cleanup.total_runs, total_archived_all_time: cleanup.total_archived_all_time });
        } catch (e) {
            console.error("Failed to load auto-update data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveExpired = async () => {
        if (!window.confirm(`Archive ${expiredCount} expired scholarships? They will be hidden from users and AI recommendations.`)) return;
        setIsArchiving(true);
        try {
            const result = await api.admin.archiveExpiredScholarships();
            setArchiveResult(result);
            setExpiredCount(0);
            toast.success(`Done! ${result.archived_count} expired scholarships archived.`);
        } catch (e) {
            toast.error("Failed to archive expired scholarships.");
        } finally {
            setIsArchiving(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRun = async () => {
        setIsRunning(true);
        toast.info("AI Auto-Update scan started... This may take 1-2 minutes.");
        try {
            const result = await api.admin.triggerAutoUpdate(batchSize);
            setLastResult(result);
            toast.success(`Scan complete! Checked: ${result.checked} | Updated: ${result.updated}`);
            fetchData();
        } catch (e) {
            toast.error("Auto-update failed. Check backend logs.");
        } finally {
            setIsRunning(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-400 text-center">Loading...</div>;

    const coveragePercent = status ? Math.round((status.total_checked_ever / Math.max(status.total_approved, 1)) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Zap className="text-indigo-500" size={24} />
                        AI Auto-Update System
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Uses Serper (Google) + GPT-4o to detect scholarship changes automatically every 4 days
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Batch size control */}
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                                Batch Size: <span className="text-indigo-600 font-black">{batchSize}</span>
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={50}
                                value={batchSize}
                                onChange={e => setBatchSize(Number(e.target.value))}
                                disabled={isRunning}
                                className="w-28 accent-indigo-600"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[6, 10, 25, 50].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setBatchSize(n)}
                                    disabled={isRunning}
                                    className={`text-[11px] px-2 py-0.5 rounded font-bold border transition-all ${
                                        batchSize === n
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
                        {isRunning ? "Running Scan..." : `Run Now (${batchSize} Scholarships)`}
                    </Button>
                </div>
            </div>

            {/* Status Cards */}
            {status && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Live", value: status.total_approved, icon: BarChart2, color: "text-indigo-600" },
                        { label: "Never Checked", value: status.never_checked, icon: AlertTriangle, color: "text-yellow-600" },
                        { label: "Checked (4d)", value: status.checked_in_last_4_days ?? 0, icon: CheckCircle, color: "text-green-600" },
                        { label: "Schedule", value: "4 Days", icon: Clock, color: "text-blue-600" },
                    ].map((stat) => (
                        <Card key={stat.label} className="bg-white border-gray-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</span>
                                </div>
                                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Coverage Bar */}
            {status && (
                <Card className="bg-white border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Coverage Progress</span>
                            <span className="text-sm font-bold text-indigo-600">{coveragePercent}% scholarships ever checked</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                                style={{ width: `${coveragePercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Schedule: <strong>{status.schedule}</strong> · Batch size: <strong>{status.next_batch_size}</strong> scholarships per run
                        {!status.api_keys_ok && (
                            <span className="ml-3 inline-flex items-center gap-1 text-red-500 font-semibold">
                                <XCircle size={13} /> API Keys missing — auto-update will skip!
                            </span>
                        )}
                        {status.api_keys_ok && (
                            <span className="ml-3 inline-flex items-center gap-1 text-green-600 font-semibold">
                                <KeyRound size={13} /> API Keys OK
                            </span>
                        )}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Last Run Result */}
            {lastResult && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                            <CheckCircle size={16} /> Last Run Result
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500">Checked:</span> <strong>{lastResult.checked}</strong></div>
                            <div><span className="text-gray-500">Updated:</span> <strong className="text-green-700">{lastResult.updated}</strong></div>
                            <div><span className="text-gray-500">Errors:</span> <strong className="text-red-600">{lastResult.errors}</strong></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Update Log */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-gray-800">Change Log (Most Recent)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {log.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No changes recorded yet. Run a scan to detect scholarship updates.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {log.slice(0, 50).map((entry: any, i: number) => (
                                <div key={i} className="px-4 py-3 hover:bg-gray-50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{entry.title}</div>
                                            <div className="text-xs text-gray-400">{entry.university}</div>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">
                                            {new Date(entry.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(entry.changes || []).map((c: string, j: number) => (
                                            <Badge key={j} className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-normal">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                    {entry.ai_notes && (
                                        <p className="text-xs text-gray-400 mt-1 italic">{entry.ai_notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expired Scholarship Cleanup */}
            <Card className={`border-2 ${
                expiredCount && expiredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
                <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                expiredCount && expiredCount > 0 ? 'bg-red-100' : 'bg-green-100'
                            }`}>
                                <CalendarX className={expiredCount && expiredCount > 0 ? 'text-red-500' : 'text-green-500'} size={20} />
                            </div>
                            <div>
                                <h3 className={`font-black text-base ${
                                    expiredCount && expiredCount > 0 ? 'text-red-800' : 'text-green-800'
                                }`}>
                                    Expired Scholarship Cleanup
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {expiredCount === null
                                        ? "Checking..."
                                        : expiredCount === 0
                                        ? "✅ No expired scholarships found — DB is clean!"
                                        : `⚠️ ${expiredCount} scholarships have passed deadlines and are still visible to users`
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleArchiveExpired}
                            disabled={isArchiving || !expiredCount || expiredCount === 0}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold shrink-0 disabled:opacity-40"
                        >
                            <Trash2 className={`w-4 h-4 mr-2 ${isArchiving ? 'animate-pulse' : ''}`} />
                            {isArchiving ? "Archiving..." : `Archive ${expiredCount ?? 0} Expired`}
                        </Button>
                    </div>
                    {archiveResult && (
                        <div className="mt-4 p-3 bg-white rounded-xl border border-green-200">
                            <p className="text-sm font-bold text-green-700 mb-2">✅ {archiveResult.archived_count} scholarships archived successfully</p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {archiveResult.scholarships?.slice(0, 10).map((s: any, i: number) => (
                                    <div key={i} className="text-xs text-gray-500 flex justify-between">
                                        <span className="truncate mr-2">{s.title}</span>
                                        <span className="text-red-400 shrink-0">{s.deadline}</span>
                                    </div>
                                ))}
                                {archiveResult.scholarships?.length > 10 && (
                                    <p className="text-xs text-gray-400">...and {archiveResult.scholarships.length - 10} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bot Activity Log */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <CalendarX size={16} className="text-red-500" />
                            Expired Bot Activity Log
                        </CardTitle>
                        {cleanupStats && (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-400">Runs: <strong className="text-gray-700">{cleanupStats.total_runs}</strong></span>
                                <span className="text-gray-400">Total Archived: <strong className="text-red-600">{cleanupStats.total_archived_all_time}</strong></span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {cleanupLog.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No bot runs yet — bot runs daily at 4:10 AM automatically.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                            {cleanupLog.map((run: any, i: number) => (
                                <div key={i} className="px-4 py-3 hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-xs font-bold ${
                                                run.triggered_by === 'admin_manual'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                            }`}>
                                                {run.triggered_by === 'admin_manual' ? '👤 Manual' : '🤖 Auto Bot'}
                                            </Badge>
                                            <span className="text-xs font-bold text-red-600">
                                                {run.archived_count} archived
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(run.run_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {run.scholarships?.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {run.scholarships.slice(0, 3).map((s: any, j: number) => (
                                                <div key={j} className="flex justify-between text-[11px] text-gray-500">
                                                    <span className="truncate mr-2">{s.title}</span>
                                                    <span className="text-red-400 shrink-0">{s.deadline}</span>
                                                </div>
                                            ))}
                                            {run.scholarships.length > 3 && (
                                                <p className="text-[11px] text-gray-400">+{run.scholarships.length - 3} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                    <h3 className="font-bold text-indigo-800 mb-3">⚡ How This System Works</h3>
                    <div className="grid md:grid-cols-5 gap-3 text-sm">
                        {[
                            { step: "1", title: "Every 4 Days", desc: "Scheduler picks 6 scholarships not checked recently" },
                            { step: "2", title: "Google Search", desc: "Serper API searches for latest info on each scholarship" },
                            { step: "3", title: "GPT-4o Analysis", desc: "AI compares old data vs new search results" },
                            { step: "4", title: "Auto-Update DB", desc: "Changed deadlines, amounts, or status updated automatically" },
                            { step: "5", title: "Daily @ 4:10 AM", desc: "🤖 Expired Bot archives all past-deadline scholarships from DB" },
                        ].map((item) => (
                            <div key={item.step} className="bg-white rounded-xl p-3 border border-indigo-100">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center mb-2">{item.step}</div>
                                <div className="font-semibold text-indigo-800 text-xs">{item.title}</div>
                                <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

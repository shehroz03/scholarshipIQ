import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Zap, RefreshCw, CheckCircle, AlertTriangle, Clock, BarChart2 } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

export function AutoUpdater() {
    const [status, setStatus] = useState<any>(null);
    const [log, setLog] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [s, l] = await Promise.all([
                api.admin.getAutoUpdateStatus(),
                api.admin.getAutoUpdateLog()
            ]);
            setStatus(s);
            setLog(l.log || []);
        } catch (e) {
            console.error("Failed to load auto-update data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRun = async () => {
        setIsRunning(true);
        toast.info("AI Auto-Update scan started... This may take 1-2 minutes.");
        try {
            const result = await api.admin.triggerAutoUpdate(15);
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
                        Uses Serper (Google) + GPT-4o to detect scholarship changes automatically every 3 days
                    </p>
                </div>
                <Button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
                    {isRunning ? "Running Scan..." : "Run Now (15 Scholarships)"}
                </Button>
            </div>

            {/* Status Cards */}
            {status && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Live", value: status.total_approved, icon: BarChart2, color: "text-indigo-600" },
                        { label: "Never Checked", value: status.never_checked, icon: AlertTriangle, color: "text-yellow-600" },
                        { label: "Checked (3d)", value: status.checked_in_last_3_days, icon: CheckCircle, color: "text-green-600" },
                        { label: "Schedule", value: "3 Days", icon: Clock, color: "text-blue-600" },
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

            {/* How It Works */}
            <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                    <h3 className="font-bold text-indigo-800 mb-3">⚡ How This System Works</h3>
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                        {[
                            { step: "1", title: "Every 3 Days", desc: "Scheduler picks 15 scholarships not checked recently" },
                            { step: "2", title: "Google Search", desc: "Serper API searches for latest info on each scholarship" },
                            { step: "3", title: "GPT-4o Analysis", desc: "AI compares old data vs new search results" },
                            { step: "4", title: "Auto-Update DB", desc: "Changed deadlines, amounts, or status updated automatically" },
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

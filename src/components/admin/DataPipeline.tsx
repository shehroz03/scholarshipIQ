import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
    Database, RefreshCcw, Search, Globe,
    CheckCircle2, AlertTriangle, Play, Pause, ChevronRight
} from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

export function DataPipeline() {
    const [status, setStatus] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentRunResults, setCurrentRunResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statusData = await api.admin.getPipelineStatus();
            const logsData = await api.admin.getPipelineLogs(1, 10);
            setStatus(statusData);
            setLogs(logsData.items);
        } catch (e) {
            toast.error("Failed to fetch pipeline data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const inv = setInterval(fetchData, 60000);
        return () => clearInterval(inv);
    }, []);

    const handleRunPipeline = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setCurrentRunResults(null);
        toast.info("Pipeline started. This may take a few minutes...");

        try {
            const results = await api.admin.runPipeline();
            setCurrentRunResults(results);
            toast.success("Pipeline sync completed successfully!");
            fetchData();
        } catch (e) {
            toast.error("Pipeline run failed");
        } finally {
            setIsRunning(false);
        }
    };

    const formatDate = (ds: string) => {
        if (!ds) return "Never";
        return new Date(ds).toLocaleString();
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading pipeline data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-600" />
                        Data Pipeline
                    </h2>
                    <p className="text-slate-500 font-bold">Automated Scraping & Sync Service</p>
                </div>

                <Button
                    onClick={handleRunPipeline}
                    disabled={isRunning}
                    size="lg"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200"
                >
                    {isRunning ? (
                        <RefreshCcw className="w-5 h-5 mr-3 animate-spin" />
                    ) : (
                        <Play className="w-5 h-5 mr-3" />
                    )}
                    {isRunning ? "Scraping in progress..." : "Run Pipeline Now"}
                </Button>
            </div>

            {isRunning && (
                <Card className="rounded-[2rem] border-blue-200 bg-blue-50/50 shadow-md overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <RefreshCcw className="w-6 h-6 text-blue-600 animate-spin" />
                            <h3 className="text-xl font-black text-blue-900">Pipeline is actively scraping...</h3>
                        </div>
                        <Progress value={undefined} className="h-3 bg-blue-100" />
                        <p className="text-sm font-bold text-blue-600 mt-4">
                            Connecting to University of Oxford, Cambridge, Toronto, Melbourne, and more...
                        </p>
                    </CardContent>
                </Card>
            )}

            {currentRunResults && !isRunning && (
                <Card className="rounded-[2rem] border-green-200 bg-green-50/30 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 /> Sync Complete!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-6 divide-x divide-green-200">
                            <div className="pl-0">
                                <p className="text-xs uppercase font-black text-green-600">Found</p>
                                <p className="text-2xl font-black text-green-900">{currentRunResults.total_found}</p>
                            </div>
                            <div className="pl-6">
                                <p className="text-xs uppercase font-black text-blue-600">Inserted (Safe)</p>
                                <p className="text-2xl font-black text-blue-900">{currentRunResults.inserted}</p>
                            </div>
                            <div className="pl-6">
                                <p className="text-xs uppercase font-black text-orange-600">Duplicates Skipped</p>
                                <p className="text-2xl font-black text-orange-900">{currentRunResults.skipped_duplicate}</p>
                            </div>
                            <div className="pl-6">
                                <p className="text-xs uppercase font-black text-red-600">Fraud Blocked</p>
                                <p className="text-2xl font-black text-red-900">{currentRunResults.skipped_fraud}</p>
                            </div>
                        </div>

                        {currentRunResults.new_scholarships?.length > 0 && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-green-100">
                                <p className="font-bold text-sm text-slate-800 mb-2">New Scholarships Added:</p>
                                <ul className="list-disc pl-5 text-sm text-slate-600">
                                    {currentRunResults.new_scholarships.map((s: string, idx: number) => (
                                        <li key={idx}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {currentRunResults.errors?.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="font-bold text-sm text-red-800 mb-2">Errors Encountered:</p>
                                <ul className="list-disc pl-5 text-sm text-red-600">
                                    {currentRunResults.errors.map((e: string, idx: number) => (
                                        <li key={idx}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-sm bg-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black uppercase text-indigo-600 tracking-wider">Total in DB</p>
                            <Database className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-3xl font-black text-indigo-900 mt-2">{status?.total_scholarships || 0}</p>
                        <div className="mt-4 space-y-1">
                            {status?.countries?.map((c: any) => (
                                <div key={c.name} className="flex justify-between text-xs font-bold text-indigo-700">
                                    <span>{c.name}</span>
                                    <span>{c.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-slate-50">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Last Sync</p>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-slate-800 mt-2">
                            {formatDate(status?.last_run?.timestamp)}
                        </p>
                        <p className="text-sm font-bold text-slate-500 mt-1">
                            Triggered by: {status?.last_run?.triggered_by || 'Unknown'}
                        </p>
                        {status?.last_run && (
                            <div className="mt-4 text-xs font-bold text-slate-600 flex gap-2">
                                <Badge variant="outline" className="bg-white">
                                    +{status.last_run.inserted} Added
                                </Badge>
                                <Badge variant="outline" className="text-red-600 bg-red-50">
                                    {status.last_run.skipped_fraud} Blocked
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-sm bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-black uppercase text-blue-600 tracking-wider">Next Auto-Run</p>
                            <RefreshCcw className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-lg font-black text-blue-900 mt-2">
                            {formatDate(status?.next_run)}
                        </p>
                        <p className="text-sm font-bold text-blue-600 mt-1">
                            Daily Schedule (03:00 AM)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800">Pipeline History</CardTitle>
                            <CardDescription className="font-bold">Recent auto and manual runs</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={(log.status || "unknown") === "success" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}>
                                            {(log.status || "UNKNOWN").toUpperCase()}
                                        </Badge>
                                        <span className="font-black text-slate-800">{formatDate(log.timestamp)}</span>
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Trigger: {(log.triggered_by || "SYSTEM").toUpperCase()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-black text-slate-400">Found</p>
                                        <p className="font-black text-slate-700">{log.total_found}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-black text-blue-500">Inserted</p>
                                        <p className="font-black text-blue-700">{log.inserted}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-black text-red-500">Fraud</p>
                                        <p className="font-black text-red-700">{log.skipped_fraud}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="p-12 text-center text-slate-500 font-bold">
                                No pipeline history found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

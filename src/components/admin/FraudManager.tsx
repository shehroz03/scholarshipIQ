import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
    ShieldAlert, ShieldCheck, AlertTriangle, Bug,
    Trash2, EyeOff, CheckCircle, RefreshCcw,
    Search, ExternalLink, Info, Filter
} from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

interface FraudStats {
    total_checked: number;
    total_safe: number;
    total_flagged: number;
    critical_count: number;
    high_count: number;
    recent_flagged: any[];
}

export function FraudManager() {
    const [stats, setStats] = useState<FraudStats | null>(null);
    const [flaggedList, setFlaggedList] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const dashboard = await api.admin.getFraudDashboard();
            const flagged = await api.admin.getFlaggedScholarships();
            setStats(dashboard);
            setFlaggedList(flagged);
        } catch (e) {
            toast.error("Failed to fetch fraud data");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const res = await api.admin.triggerFraudScan();
            toast.success(res.message);
            fetchData();
        } catch (e) {
            toast.error("Scan failed");
        } finally {
            setIsScanning(false);
        }
    };

    const handleReview = async (id: number, action: "approve" | "remove" | "ignore") => {
        try {
            await api.admin.reviewFraud(id, action);
            toast.success(`Scholarship ${action === "remove" ? "deleted" : action + "d"}`);
            fetchData();
        } catch (e) {
            toast.error("Action failed");
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "CRITICAL": return "text-red-500 bg-red-50 border-red-200 animate-pulse";
            case "HIGH": return "text-orange-500 bg-orange-50 border-orange-200";
            case "MEDIUM": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            default: return "text-emerald-500 bg-emerald-50 border-emerald-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                        Fraud Detection Center
                    </h2>
                    <p className="text-slate-500 font-bold">Automated AI Guardian for ScholarIQ</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="rounded-xl border-slate-200 font-bold"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="rounded-xl bg-slate-900 hover:bg-black font-black shadow-lg"
                    >
                        {isScanning ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Scan Now
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-3xl border-none shadow-sm bg-blue-50">
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase text-blue-600 tracking-wider">Total Scanned</p>
                        <p className="text-3xl font-black text-blue-900 mt-1">{stats?.total_checked || 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-none shadow-sm bg-emerald-50">
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase text-emerald-600 tracking-wider">Safe</p>
                        <p className="text-3xl font-black text-emerald-900 mt-1">{stats?.total_safe || 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-none shadow-sm bg-orange-50">
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase text-orange-600 tracking-wider">High Risk</p>
                        <p className="text-3xl font-black text-orange-900 mt-1">{stats?.high_count || 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-none shadow-sm bg-red-50">
                    <CardContent className="p-6 text-red-600">
                        <p className="text-xs font-black uppercase tracking-wider">Critical Fail</p>
                        <p className="text-3xl font-black mt-1">{stats?.critical_count || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Flagged List */}
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800">Flagged Scholarships</CardTitle>
                            <CardDescription className="font-bold">Items requiring immediate administrative review</CardDescription>
                        </div>
                        <Badge className="bg-red-100 text-red-600 rounded-lg px-3 py-1 font-black">
                            {flaggedList.length} PENDING REVIEW
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {flaggedList.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">System is Clean</h3>
                            <p className="text-slate-500 font-bold">No suspicious scholarships detected.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {flaggedList.map((s) => (
                                <div key={s.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {s.title}
                                                    </h4>
                                                    <p className="text-slate-500 font-bold text-sm flex items-center gap-2 mt-1">
                                                        <Filter className="w-3 h-3" /> {s.university_name} • {s.country}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={`${getRiskColor(s.fraud_risk_level)} px-3 py-1 font-black rounded-lg border`}>
                                                        {s.fraud_risk_level} Risk
                                                    </Badge>
                                                    <div className="mt-2 w-32 ml-auto">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1">
                                                            <span>Risk Score</span>
                                                            <span>{Math.round(s.fraud_risk_score)}%</span>
                                                        </div>
                                                        <Progress value={s.fraud_risk_score} className="h-2" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {JSON.parse(s.fraud_reasons || '[]').map((reason: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100/50">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {reason}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-6 pt-2">
                                                <a href={s.scholarship_url} target="_blank" className="text-blue-600 font-black text-xs flex items-center gap-1 hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> View Source URL
                                                </a>
                                                <span className="text-slate-300 text-xs font-black">
                                                    Last Check: {s.last_fraud_check ? new Date(s.last_fraud_check).toLocaleString() : 'Never'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col gap-3 lg:w-48">
                                            <Button
                                                size="sm"
                                                onClick={() => handleReview(s.id, "approve")}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl w-full"
                                            >
                                                <ShieldCheck className="w-4 h-4 mr-2" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReview(s.id, "ignore")}
                                                className="border-slate-200 text-slate-600 font-black rounded-xl w-full"
                                            >
                                                <EyeOff className="w-4 h-4 mr-2" /> Ignore
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleReview(s.id, "remove")}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-black rounded-xl w-full"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

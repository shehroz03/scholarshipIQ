import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { CheckCircle, XCircle, Search, Clock, AlertTriangle } from "lucide-react";
import { api } from "../../api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending:  { label: "Pending",  color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: Clock },
    checking: { label: "Checking", color: "bg-blue-50 text-blue-700 border-blue-200",        icon: Search },
    approved: { label: "Approved", color: "bg-green-50 text-green-700 border-green-200",     icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200",           icon: XCircle },
};

async function reviewScholarship(id: number, action: string) {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    await fetch(`${API_BASE}/admin/scholarships/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
    });
}

export function ScholarshipManagement() {
    const [scholarships, setScholarships] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>("all");
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
            const url = filter === "all"
                ? `${API_BASE}/admin/scholarships?limit=100`
                : `${API_BASE}/admin/scholarships?approval_status=${filter}&limit=100`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setScholarships(Array.isArray(data) ? data : []);

            const pc = await fetch(`${API_BASE}/admin/scholarships/pending-count`, { headers: { Authorization: `Bearer ${token}` } });
            const pcData = await pc.json();
            setPendingCount(pcData.pending || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filter]);

    const handleAction = async (id: number, action: string) => {
        await reviewScholarship(id, action);
        load();
    };

    const filters = [
        { key: "all",      label: "All" },
        { key: "pending",  label: `Pending ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
        { key: "checking", label: "Checking" },
        { key: "approved", label: "Approved" },
        { key: "rejected", label: "Rejected" },
    ];

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                            filter === f.key
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                        } ${f.key === "pending" && pendingCount > 0 ? "ring-2 ring-yellow-400 ring-offset-1" : ""}`}
                    >
                        {f.key === "pending" && pendingCount > 0 && (
                            <AlertTriangle className="inline w-3 h-3 mr-1 text-yellow-500" />
                        )}
                        {f.label}
                    </button>
                ))}
            </div>

            <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : scholarships.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No scholarships found for this filter.</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow className="border-gray-200 hover:bg-transparent">
                                    <TableHead className="text-gray-500 font-semibold">ID</TableHead>
                                    <TableHead className="text-gray-500 font-semibold">Title & University</TableHead>
                                    <TableHead className="text-gray-500 font-semibold">Country</TableHead>
                                    <TableHead className="text-gray-500 font-semibold">Fraud Risk</TableHead>
                                    <TableHead className="text-gray-500 font-semibold">Approval Status</TableHead>
                                    <TableHead className="text-right text-gray-500 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scholarships.map((s: any) => {
                                    const status = s.approval_status || "pending";
                                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                                    const Icon = cfg.icon;
                                    return (
                                        <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                                            <TableCell className="text-gray-400 font-mono text-xs">#{s.id}</TableCell>
                                            <TableCell>
                                                <div className="font-semibold text-gray-900 max-w-[220px] truncate">{s.title}</div>
                                                <div className="text-xs text-gray-400">{s.university_name || "—"}</div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{s.country || "—"}</TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    s.fraud_risk_level === "SAFE" ? "bg-green-50 text-green-700" :
                                                    s.fraud_risk_level === "HIGH" || s.fraud_risk_level === "CRITICAL" ? "bg-red-50 text-red-700" :
                                                    "bg-yellow-50 text-yellow-700"
                                                }`}>
                                                    {s.fraud_risk_level || "SAFE"} {s.fraud_risk_score ? `(${Math.round(s.fraud_risk_score)}%)` : ""}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`border text-xs font-semibold ${cfg.color}`}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {cfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end flex-wrap">
                                                    {status !== "approved" && (
                                                        <Button size="sm" variant="ghost"
                                                            className="text-green-600 hover:bg-green-50 text-xs h-7"
                                                            onClick={() => handleAction(s.id, "approved")}>
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                                        </Button>
                                                    )}
                                                    {status !== "checking" && (
                                                        <Button size="sm" variant="ghost"
                                                            className="text-blue-600 hover:bg-blue-50 text-xs h-7"
                                                            onClick={() => handleAction(s.id, "checking")}>
                                                            <Search className="w-3 h-3 mr-1" /> Checking
                                                        </Button>
                                                    )}
                                                    {status !== "rejected" && (
                                                        <Button size="sm" variant="ghost"
                                                            className="text-red-600 hover:bg-red-50 text-xs h-7"
                                                            onClick={() => handleAction(s.id, "rejected")}>
                                                            <XCircle className="w-3 h-3 mr-1" /> Reject
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

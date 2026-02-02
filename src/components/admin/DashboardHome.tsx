import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { RefreshCw, CheckCircle, Clock } from "lucide-react";
import { api } from "../../api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog"

const frDetails: Record<string, string> = {
    fr01: "Allows new users to register with email and password. Includes validation for email format and existing user checks. Verification confirms that users are successfully stored in the database.",
    fr02: "Secure login using JWT tokens. Supports session persistence and secure password hashing with bcrypt. Verified by successful token generation and access to protected routes.",
    fr03: "Advanced filtering system allowing users to search by country, degree, and field of study. Verified by checking filter parameters in API requests.",
    fr04: "Matches users with universities based on their profile data and preferences. Integration with Google Maps and algorithm checks are active.",
    fr05: "Provides a detailed view of scholarship opportunities, including funding and application deadlines. Verifies that all data fields are correctly fetched and displayed.",
    fr06: "Enables users to save scholarships to their profile for later viewing. Verified by checking the 'saved_scholarships' table relation.",
    fr07: "Real-time dashboard statistics reflecting user activity and system status. Syncs with database counts for users, scholarships, and logs.",
    fr08: "Automated fraud detection system marking suspicious scholarships based on keywords and patterns (e.g., 'guaranteed', 'fee'). Flags are persisted in DB.",
    fr09: "AI-powered chatbot assistant to help users finding scholarships and answering queries. Verifies NLP model response generation.",
    fr10: "Smart recommendation engine suggesting scholarships based on user profile and history. Matches user attributes to scholarship criteria."
};

export function DashboardHome() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeFR, setActiveFR] = useState<string | null>(null);

    const fetchStats = async () => {
        if (!stats) setLoading(true);
        try {
            const data = await api.admin.getDashboard();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return <div className="p-8 text-gray-800">Loading Dashboard...</div>;

    const frs = stats?.fr_status || {};

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h2>
                <Button onClick={fetchStats} variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats?.metrics.map((m: any, i: number) => (
                    <Card key={i} className="bg-white border-gray-200 text-gray-900 shadow-sm">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500">{m.label}</p>
                            <p className="text-3xl font-bold mt-2 text-gray-900">{m.value}</p>
                            <p className="text-xs text-green-600 mt-1 font-mono font-medium">{m.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mt-12 mb-6 flex items-center gap-2">
                <CheckCircle className="text-green-600 w-6 h-6" /> Functional Requirements Validation
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(frs).map(([key, val]: [string, any]) => (
                    <Card key={key} className="bg-white border-gray-200 text-gray-900 hover:border-blue-400 transition-colors shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{key.toUpperCase()}</p>
                                    <CardTitle className="text-lg font-bold text-gray-800">{val.name}</CardTitle>
                                </div>
                                <Badge className={val.status === 'WORKING' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                                    {val.status === 'WORKING' ? '✅ WORKING' : '❌ FAILED'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">{val.details}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Last check: {val.last_test}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => {
                                        console.log("View Details clicked for:", key);
                                        setActiveFR(key);
                                    }}
                                >
                                    View Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!activeFR} onOpenChange={(open: boolean) => !open && setActiveFR(null)}>
                <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {activeFR ? frs[activeFR]?.name : ''}
                            <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">WORKING</Badge>
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-mono text-xs">
                            Requirement ID: {activeFR?.toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-2">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Current Status</p>
                            <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                {activeFR ? frs[activeFR]?.details : ''}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> System Check: {activeFR ? frs[activeFR]?.last_test : ''}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-900 mb-2">Technical Description</p>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {activeFR ? frDetails[activeFR] || "Detailed technical specifications available in main documentation." : ''}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Button variant="outline" className="w-full text-xs h-8" onClick={() => setActiveFR(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

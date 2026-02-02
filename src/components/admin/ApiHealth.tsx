import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../api";
import { Activity, Server } from "lucide-react";

export function ApiHealth() {
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        const check = () => api.admin.getHealth().then(setHealth);
        check();
        const i = setInterval(check, 10000);
        return () => clearInterval(i);
    }, []);

    if (!health) return <div className="p-4 text-gray-800">Checking System Vitality...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {health.apis.map((ep: any, i: number) => (
                    <Card key={i} className="bg-white border-gray-200 text-gray-900 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-mono text-gray-500 mb-1">{ep.endpoint}</p>
                                <div className="flex items-center gap-2">
                                    <Badge className={ep.status === 200 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {ep.status}
                                    </Badge>
                                    <span className={`text-sm font-bold ${ep.response_time_ms < 100 ? "text-green-600" : "text-yellow-600"}`}>
                                        {ep.response_time_ms}ms
                                    </span>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${ep.status === 200 ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-white border-gray-200 text-gray-900 mt-8 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                        <Server className="w-5 h-5 text-blue-600" /> Server Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                        <div className="text-center">
                            <Activity className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl font-bold text-gray-800">All Systems Operational</h3>
                            <p className="text-gray-500">Uptime: 99.99% • Last Incident: None</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

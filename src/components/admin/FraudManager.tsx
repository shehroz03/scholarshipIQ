import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ShieldAlert, Check } from "lucide-react";
import { api } from "../../api";

export function FraudManager() {
    const [suspiciousList, setSuspiciousList] = useState([]);

    const fetch = () => api.admin.getFraud().then(setSuspiciousList);
    useEffect(() => { fetch(); }, []);

    const verify = async (id: number) => {
        await api.admin.toggleSuspicious(id);
        fetch();
    };

    return (
        <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-red-600 flex items-center gap-2">
                    <ShieldAlert /> Suspicious Activity & Fraud Detection
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {suspiciousList.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>No suspicious scholarships detected. System is clean.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {suspiciousList.map((s: any) => (
                            <div key={s.id} className="flex items-start justify-between bg-red-50 border border-red-100 p-4 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-red-900">{s.title}</h4>
                                    <p className="text-sm text-red-700">{s.university_name}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-white">Potential Scam</Badge>
                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-white">User Flagged</Badge>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => verify(s.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                    Mark Verified
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

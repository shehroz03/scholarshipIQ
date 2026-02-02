import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { AlertTriangle, Flag } from "lucide-react";
import { api } from "../../api";

export function ScholarshipManagement() {
    const [scholarships, setScholarships] = useState([]);

    const fetch = () => api.admin.getScholarships().then(setScholarships);
    useEffect(() => { fetch(); }, []);

    const toggleFlag = async (id: number) => {
        await api.admin.toggleSuspicious(id);
        fetch();
    };

    return (
        <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow className="border-gray-200 hover:bg-transparent">
                            <TableHead className="text-gray-500 font-semibold">ID</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Title & University</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Funding</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Deadline</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Risk Status</TableHead>
                            <TableHead className="text-right text-gray-500 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scholarships.map((s: any) => (
                            <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                                <TableCell className="text-gray-500 font-mono text-xs">#{s.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium text-gray-900">{s.title}</div>
                                    <div className="text-xs text-gray-500">{s.university_name}, {s.country}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">{s.funding_type}</Badge>
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm">{new Date(s.deadline).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {s.is_suspicious ? (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> Suspicious
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                            Verified
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={s.is_suspicious ? "text-green-600 hover:text-green-800 hover:bg-green-50" : "text-red-600 hover:text-red-800 hover:bg-red-50"}
                                        onClick={() => toggleFlag(s.id)}
                                    >
                                        <Flag className="w-4 h-4 mr-1" />
                                        {s.is_suspicious ? "Verify" : "Flag"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

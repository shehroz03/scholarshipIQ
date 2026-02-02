import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { api } from "../../api";
import { Database } from "lucide-react";

export function DatabaseViewer() {
    const [dbData, setDbData] = useState<any>(null);

    useEffect(() => {
        api.admin.getDatabase().then(setDbData);
    }, []);

    if (!dbData) return <div className="text-gray-800">Connecting to Database...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dbData.counts).map(([table, count]: [string, any]) => (
                    <Card key={table} className="bg-white border-gray-200 text-gray-900 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">{table}</p>
                                <p className="text-2xl font-bold">{count}</p>
                            </div>
                            <Database className="w-8 h-8 text-gray-300" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-800">Live Data Inspector</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="users">
                        <TabsList className="bg-gray-100">
                            {Object.keys(dbData.samples).map(k => (
                                <TabsTrigger key={k} value={k} className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600">
                                    {k.charAt(0).toUpperCase() + k.slice(1)}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {Object.entries(dbData.samples).map(([key, rows]: [string, any]) => (
                            <TabsContent key={key} value={key} className="mt-4">
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow className="border-gray-200">
                                                {rows.length > 0 && Object.keys(rows[0]).slice(0, 5).map(h => (
                                                    <TableHead key={h} className="text-gray-500 font-semibold">{h}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-white">
                                            {rows.map((row: any, i: number) => (
                                                <TableRow key={i} className="border-gray-100 hover:bg-gray-50">
                                                    {Object.values(row).slice(0, 5).map((v: any, j) => (
                                                        <TableCell key={j} className="text-gray-600 font-mono text-xs">
                                                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

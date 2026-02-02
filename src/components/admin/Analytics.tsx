import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { api } from "../../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export function AdminAnalytics() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.admin.getAnalytics().then(setData);
    }, []);

    if (!data) return <div className="text-gray-800">Loading Analytics...</div>;

    const chartData = data.searches_trend.map((val: number, i: number) => ({
        day: `Day ${i + 1}`,
        searches: val,
        saves: data.saves_trend[i]
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">User Acquisition & Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="day" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2937', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#1F2937' }} />
                                <Line type="monotone" dataKey="searches" stroke="#3B82F6" strokeWidth={2} />
                                <Line type="monotone" dataKey="saves" stroke="#10B981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Top Scholarship Fields</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.top_fields.map((f: string, i: number) => ({ name: f, count: [45, 32, 28, 15][i] }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2937', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#F3F4F6' }} itemStyle={{ color: '#1F2937' }} />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

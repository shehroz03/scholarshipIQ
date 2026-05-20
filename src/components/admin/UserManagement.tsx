import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Trash2, Loader2 } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

function formatDate(d: string | null | undefined) {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

export function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        api.admin.getUsers().then(setUsers).catch(console.error);
    }, []);

    const handleDelete = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${userName}"?\nThis action cannot be undone.`)) return;
        setDeletingId(userId);
        try {
            await api.admin.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success(`User "${userName}" deleted.`);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete user.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="bg-white border-gray-200 text-gray-900 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow className="border-gray-200 hover:bg-transparent">
                            <TableHead className="text-gray-500 font-semibold">User</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Email</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Country</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Degree</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Field</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Specialization</TableHead>
                            <TableHead className="text-gray-500 font-semibold">CGPA</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Joined</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Status</TableHead>
                            <TableHead className="text-gray-500 font-semibold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u: any) => (
                            <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 border border-gray-200">
                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                                {u.full_name?.substring(0, 2).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="whitespace-nowrap">{u.full_name || "—"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm">{u.email}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{u.nationality || "—"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs bg-gray-50">
                                        {u.degree_level || "—"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm max-w-[120px] truncate" title={u.field_of_interest || ""}>
                                    {u.field_of_interest || "—"}
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm max-w-[100px] truncate" title={u.specialization || ""}>
                                    {u.specialization || "—"}
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm font-mono">{u.cgpa != null ? u.cgpa : "—"}</TableCell>
                                <TableCell className="text-gray-500 text-xs">{formatDate(u.created_at)}</TableCell>
                                <TableCell>
                                    <Badge className={u.is_active
                                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                                        : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"}>
                                        {u.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleDelete(u.id, u.full_name || u.email)}
                                        disabled={deletingId === u.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                        style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                                    >
                                        {deletingId === u.id
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Trash2 size={13} />}
                                        Delete
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

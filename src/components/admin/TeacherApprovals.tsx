import { useEffect, useState } from "react";
import { CheckCircle, XCircle, UserCheck, UserX, GraduationCap, ExternalLink, Clock, Search, Users, Building2, Award, FileText } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface Teacher {
    id: number;
    user_id: number;
    name: string;
    email: string;
    specializations: string;
    experience_years: number;
    qualification?: string;
    degree?: string;
    institution?: string;
    cv_url?: string;
    bio?: string;
    approval_status: string;
    rejection_reason?: string;
    approved_at?: string;
    applied_at: string;
}

export function TeacherApprovals() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectingId, setRejectingId] = useState<number | null>(null);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const status = filter === "all" ? undefined : filter;
            const data = await api.admin.getTeachers(status);
            setTeachers(data);
        } catch (err: any) {
            toast.error("Failed to load teachers: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.admin.getTeacherStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats", err);
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchStats();
    }, [filter]);

    const handleApprove = async (teacherId: number) => {
        setLoading(true);
        try {
            await api.admin.approveTeacher(teacherId);
            toast.success("Teacher approved successfully!");
            fetchTeachers();
            fetchStats();
        } catch (err: any) {
            toast.error("Failed to approve: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (teacherId: number) => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        setLoading(true);
        try {
            await api.admin.rejectTeacher(teacherId, rejectionReason);
            toast.success("Teacher application rejected");
            setRejectingId(null);
            setRejectionReason("");
            fetchTeachers();
            fetchStats();
        } catch (err: any) {
            toast.error("Failed to reject: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.degree?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12}/> Pending</span>;
            case "approved":
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12}/> Approved</span>;
            case "rejected":
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12}/> Rejected</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Users size={20} />
                        <span className="text-sm font-medium">Total Applications</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <Clock size={20} />
                        <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                        <UserCheck size={20} />
                        <span className="text-sm font-medium">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <UserX size={20} />
                        <span className="text-sm font-medium">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {["all", "pending", "approved", "rejected"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                                filter === f
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Teacher List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No teachers found</h3>
                    <p className="text-gray-500">No teacher applications in this category.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTeachers.map((teacher) => (
                        <div key={teacher.id} className="bg-white border rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left: Teacher Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                                            <p className="text-sm text-gray-500">{teacher.email}</p>
                                        </div>
                                        {getStatusBadge(teacher.approval_status)}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Award className="text-blue-500" size={16} />
                                            <span><strong>Specialization:</strong> {teacher.specializations}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="text-green-500" size={16} />
                                            <span><strong>Experience:</strong> {teacher.experience_years} years</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <GraduationCap className="text-purple-500" size={16} />
                                            <span><strong>Degree:</strong> {teacher.degree || "N/A"}</span>
                                        </div>
                                        {teacher.institution && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building2 className="text-orange-500" size={16} />
                                                <span><strong>Institution:</strong> {teacher.institution}</span>
                                            </div>
                                        )}
                                        {teacher.qualification && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <FileText className="text-teal-500" size={16} />
                                                <span><strong>Qualification:</strong> {teacher.qualification}</span>
                                            </div>
                                        )}
                                    </div>

                                    {teacher.bio && (
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            <p className="text-sm text-gray-600"><strong>Bio:</strong> {teacher.bio}</p>
                                        </div>
                                    )}

                                    {teacher.cv_url && (
                                        <a
                                            href={teacher.cv_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            <ExternalLink size={16} />
                                            View CV/LinkedIn Profile
                                        </a>
                                    )}

                                    {teacher.approval_status === "rejected" && teacher.rejection_reason && (
                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {teacher.rejection_reason}</p>
                                        </div>
                                    )}

                                    {teacher.approval_status === "approved" && teacher.approved_at && (
                                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-sm text-green-700"><strong>Approved at:</strong> {new Date(teacher.approved_at).toLocaleString()}</p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-4">Applied: {new Date(teacher.applied_at).toLocaleDateString()}</p>
                                </div>

                                {/* Right: Actions */}
                                {teacher.approval_status === "pending" && (
                                    <div className="md:w-64 flex flex-col gap-3">
                                        {rejectingId === teacher.id ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    placeholder="Enter rejection reason..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    className="w-full p-3 border rounded-lg text-sm"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setRejectingId(null);
                                                            setRejectionReason("");
                                                        }}
                                                        className="flex-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleReject(teacher.id)}
                                                        disabled={loading}
                                                        className="flex-1"
                                                    >
                                                        Confirm Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Button
                                                    onClick={() => handleApprove(teacher.id)}
                                                    disabled={loading}
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                >
                                                    <UserCheck size={18} className="mr-2" />
                                                    Approve Teacher
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setRejectingId(teacher.id)}
                                                    disabled={loading}
                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    <UserX size={18} className="mr-2" />
                                                    Reject Application
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {teacher.approval_status === "approved" && (
                                    <div className="md:w-64 flex items-center justify-center">
                                        <div className="text-center p-4 bg-green-50 rounded-xl">
                                            <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
                                            <p className="text-sm font-medium text-green-700">Approved</p>
                                            <p className="text-xs text-green-600 mt-1">Teacher can now login</p>
                                        </div>
                                    </div>
                                )}

                                {teacher.approval_status === "rejected" && (
                                    <div className="md:w-64 flex items-center justify-center">
                                        <div className="text-center p-4 bg-red-50 rounded-xl">
                                            <XCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
                                            <p className="text-sm font-medium text-red-700">Rejected</p>
                                            <p className="text-xs text-red-600 mt-1">Application declined</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { Star, Flag, EyeOff, CheckCircle, XCircle, AlertTriangle, User, Calendar, MessageSquare } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

interface Review {
  id: number;
  teacher_id: number;
  teacher_name: string;
  student_id: number;
  student_name: string;
  rating: number;
  review_text: string;
  report_reason?: string;
  reported_at?: string;
  admin_review_status: string;
  admin_notes?: string;
  is_visible: boolean;
  is_removed: boolean;
  created_at: string;
}

export function AdminReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reportedReviews, setReportedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "reported">("reported");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"remove" | "dismiss">("remove");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAllReviews = async () => {
    try {
      const data = await api.teacherReviews.adminGetAllReviews(1, 100);
      setReviews(data.reviews || []);
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error);
      toast.error(error.message || "Failed to load reviews");
    }
  };

  const fetchReportedReviews = async () => {
    try {
      const data = await api.teacherReviews.adminGetReportedReviews();
      setReportedReviews(data.reviews || []);
    } catch (error: any) {
      console.error("Failed to fetch reported reviews:", error);
      toast.error(error.message || "Failed to load reported reviews");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAllReviews(), fetchReportedReviews()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async () => {
    if (!selectedReview) return;
    
    setSubmitting(true);
    try {
      if (actionType === "remove") {
        await api.teacherReviews.adminRemoveReview(selectedReview.id, adminNotes || "Inappropriate content");
        toast.success("Review removed successfully");
      } else {
        await api.teacherReviews.adminDismissReport(selectedReview.id, adminNotes);
        toast.success("Report dismissed successfully");
      }
      
      setActionModalOpen(false);
      setAdminNotes("");
      setSelectedReview(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (review: Review, action: "remove" | "dismiss") => {
    setSelectedReview(review);
    setActionType(action);
    setActionModalOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const displayReviews = activeTab === "reported" ? reportedReviews : reviews;
  const stats = {
    total: reviews.length,
    reported: reportedReviews.length,
    removed: reviews.filter(r => r.is_removed).length,
    pending: reportedReviews.filter(r => r.admin_review_status === "pending").length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.reported}</p>
              <p className="text-sm text-gray-600">Reported</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.removed}</p>
              <p className="text-sm text-gray-600">Removed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("reported")}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === "reported"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Flag className="w-4 h-4" />
          Reported Reviews
          {stats.pending > 0 && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {stats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "all"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All Reviews
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Review</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                {activeTab === "reported" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Report Reason</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayReviews.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "reported" ? 6 : 5} className="px-4 py-12 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No reviews found
                  </td>
                </tr>
              ) : (
                displayReviews.map((review) => (
                  <tr key={review.id} className={review.is_removed ? "bg-red-50" : ""}>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="font-bold text-gray-900">{review.rating}/5</span>
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                            {review.review_text}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{review.teacher_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{review.student_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {review.is_removed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          <XCircle className="w-3 h-3" />
                          Removed
                        </span>
                      ) : review.is_visible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </td>
                    {activeTab === "reported" && (
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-amber-600">{review.report_reason}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Reported: {review.reported_at && new Date(review.reported_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {!review.is_removed && review.is_reported && (
                          <>
                            <button
                              onClick={() => openActionModal(review, "remove")}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => openActionModal(review, "dismiss")}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        {!review.is_reported && !review.is_removed && (
                          <button
                            onClick={() => openActionModal(review, "remove")}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {actionType === "remove" ? (
                <>
                  <EyeOff className="w-5 h-5 text-red-500" />
                  Remove Review
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Dismiss Report
                </>
              )}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Review by:</span> {selectedReview.student_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">For teacher:</span> {selectedReview.teacher_name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Rating:</span> {selectedReview.rating}/5
              </p>
              {selectedReview.review_text && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  "{selectedReview.review_text.substring(0, 100)}..."
                </p>
              )}
            </div>
            
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={actionType === "remove" 
                ? "Reason for removing this review (optional)..." 
                : "Notes for dismissing this report (optional)..."}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModalOpen(false);
                  setAdminNotes("");
                  setSelectedReview(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  actionType === "remove"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting ? "Processing..." : actionType === "remove" ? "Remove Review" : "Dismiss Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviewManagement;

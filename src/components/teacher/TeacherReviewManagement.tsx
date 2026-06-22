import { useState, useEffect } from "react";
import { Star, AlertTriangle, MessageSquare, Flag, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

interface Review {
  id: number;
  rating: number;
  review_text: string;
  student_name: string;
  created_at: string;
  is_reported: boolean;
  report_reason?: string;
  admin_review_status: string;
  admin_notes?: string;
  is_removed: boolean;
}

export function TeacherReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    reported_reviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "reported">("all");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Get teacher profile to get teacher ID
      const profile = await api.teacher.getProfile();
      
      // Get all reviews for this teacher
      const data = await api.teacherReviews.getTeacherReviews(profile.id, 1, 100);
      
      // Get reported reviews
      const reportedData = await api.teacherReviews.getMyReportedReviews();
      
      const allReviews = data.reviews || [];
      const reportedReviews = reportedData.reviews || [];
      
      // Merge reported status into all reviews
      const mergedReviews = allReviews.map((r: Review) => {
        const reported = reportedReviews.find((rep: Review) => rep.id === r.id);
        return {
          ...r,
          is_reported: !!reported,
          report_reason: reported?.report_reason,
          admin_review_status: reported?.admin_review_status || "pending",
          admin_notes: reported?.admin_notes,
          is_removed: reported?.is_removed || false
        };
      });
      
      setReviews(mergedReviews);
      setStats({
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
        reported_reviews: reportedReviews.length
      });
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error);
      toast.error(error.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReport = async () => {
    if (!selectedReview || !reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.teacherReviews.reportReview(selectedReview.id, reportReason);
      toast.success("Review reported successfully. Admin will review it.");
      setReportModalOpen(false);
      setReportReason("");
      setSelectedReview(null);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to report review");
    } finally {
      setSubmitting(false);
    }
  };

  const openReportModal = (review: Review) => {
    setSelectedReview(review);
    setReportModalOpen(true);
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

  const filteredReviews = activeTab === "reported" 
    ? reviews.filter(r => r.is_reported)
    : reviews;

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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_reviews}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.reported_reviews}</p>
              <p className="text-sm text-gray-600">Reported Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
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
        <button
          onClick={() => setActiveTab("reported")}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === "reported"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Reported
          {stats.reported_reviews > 0 && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {stats.reported_reviews}
            </span>
          )}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === "reported" 
                ? "No reported reviews yet" 
                : "No reviews yet"}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div 
              key={review.id} 
              className={`bg-white rounded-xl p-5 border ${
                review.is_removed 
                  ? "border-red-200 bg-red-50" 
                  : review.is_reported 
                    ? "border-amber-200 bg-amber-50" 
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {review.student_name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.student_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-lg font-bold text-gray-900 ml-2">{review.rating}/5</span>
                </div>
              </div>
              
              {review.review_text && (
                <p className="mt-4 text-gray-700 leading-relaxed">
                  {review.review_text}
                </p>
              )}
              
              {/* Status Badges */}
              <div className="mt-4 flex items-center gap-2">
                {review.is_removed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <XCircle className="w-4 h-4" />
                    Removed by Admin
                  </span>
                ) : review.is_reported ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                    <Flag className="w-4 h-4" />
                    Reported - {review.admin_review_status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Visible
                  </span>
                )}
              </div>
              
              {/* Admin Notes */}
              {review.admin_notes && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Admin Note:</span> {review.admin_notes}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              {!review.is_reported && !review.is_removed && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => openReportModal(review)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Flag className="w-4 h-4" />
                    Report Review
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report Review
            </h3>
            
            <p className="text-gray-600 mb-4">
              You are reporting a review from <span className="font-semibold">{selectedReview.student_name}</span>. 
              Please provide a reason for the admin to review.
            </p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., This review contains inappropriate language..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReportModalOpen(false);
                  setReportReason("");
                  setSelectedReview(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={submitting || !reportReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Reporting..." : "Report to Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherReviewManagement;

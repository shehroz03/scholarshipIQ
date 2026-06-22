import { useState, useEffect } from "react";
import { Star, ThumbsUp, AlertTriangle, MessageSquare, User } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

interface Review {
  id: number;
  rating: number;
  review_text: string;
  student_name: string;
  student_profile_picture: string | null;
  created_at: string;
}

interface TeacherReviewsProps {
  teacherId: number;
  isEnrolled?: boolean;
  canReview?: boolean;
}

export function TeacherReviews({ teacherId, isEnrolled = false, canReview = false }: TeacherReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await api.teacherReviews.getTeacherReviews(teacherId);
      setReviews(data.reviews || []);
      setStats({
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
        rating_distribution: data.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [teacherId]);

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.teacherReviews.submitReview(teacherId, newRating, newReviewText);
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setNewRating(0);
      setNewReviewText("");
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900">Student Reviews</h3>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {stats.total_reviews} reviews
          </span>
        </div>
        
        {canReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            {showReviewForm ? "Cancel" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {stats.total_reviews > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(stats.average_rating))}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.total_reviews} reviews
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = (stats.rating_distribution as Record<number, number>)[rating] || 0;
                const percentage = stats.total_reviews > 0 
                  ? (count / stats.total_reviews) * 100 
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-3">{rating}</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">Rate your experience</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {renderStars(newRating, true, setNewRating)}
              <span className="ml-2 text-lg font-medium text-gray-900">
                {newRating > 0 ? `${newRating}/5` : "Select rating"}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              placeholder="Share your experience with this teacher..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || newRating === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet</p>
            {canReview && (
              <p className="text-gray-400 text-sm mt-1">
                Be the first to write a review!
              </p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {review.student_profile_picture ? (
                    <img
                      src={`http://localhost:8000${review.student_profile_picture}`}
                      alt={review.student_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    review.student_name?.charAt(0).toUpperCase() || "S"
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {review.student_name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    {renderStars(review.rating)}
                  </div>
                  
                  {review.review_text && (
                    <p className="text-gray-700 leading-relaxed">
                      {review.review_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TeacherReviews;

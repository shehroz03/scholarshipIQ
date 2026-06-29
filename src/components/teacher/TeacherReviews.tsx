import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, X, Trash2, ShieldAlert } from "lucide-react";
import { api } from "../../api";
import { toast } from "sonner";

interface Review {
  id: number;
  rating: number;
  review_text: string;
  student_name: string;
  student_id: number;
  student_profile_picture: string | null;
  created_at: string;
}

interface TeacherReviewsProps {
  teacherId: number;
  isEnrolled?: boolean;
  canReview?: boolean;
  currentUserId?: number | null;
  userRole?: string;
}

export function TeacherReviews({
  teacherId,
  isEnrolled = false,
  canReview = false,
  currentUserId = null,
  userRole = "student",
}: TeacherReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isAdmin = userRole === "admin";

  const fetchReviews = async () => {
    try {
      const data = await api.teacherReviews.getTeacherReviews(teacherId);
      const reviewsList: Review[] =
        data.reviews ?? data.items ?? data.data ?? (Array.isArray(data) ? data : []);
      const avg: number = data.average_rating ?? data.avg_rating ?? 0;
      const total: number = data.total_reviews ?? data.total ?? reviewsList.length;
      const dist = data.rating_distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      setReviews(reviewsList);
      setStats({ average_rating: avg, total_reviews: total, rating_distribution: dist });
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [teacherId]);

  const handleSubmit = async () => {
    if (newRating === 0) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      await api.teacherReviews.submitReview(teacherId, newRating, newText);
      toast.success("Review submitted!");
      const studentName = localStorage.getItem("userName") || localStorage.getItem("name") || "You";
      const optimistic: Review = {
        id: Date.now(),
        rating: newRating,
        review_text: newText,
        student_name: studentName,
        student_id: currentUserId ?? -1,
        student_profile_picture: null,
        created_at: new Date().toISOString(),
      };
      setReviews(prev => [optimistic, ...prev]);
      setStats(prev => {
        const newTotal = prev.total_reviews + 1;
        const newAvg = ((prev.average_rating * prev.total_reviews) + newRating) / newTotal;
        const newDist = { ...prev.rating_distribution, [newRating]: ((prev.rating_distribution as any)[newRating] || 0) + 1 };
        return { average_rating: newAvg, total_reviews: newTotal, rating_distribution: newDist };
      });
      setShowForm(false);
      setNewRating(0);
      setHoverRating(0);
      setNewText("");
      setTimeout(() => fetchReviews(), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number, isOwnReview: boolean) => {
    setDeletingId(reviewId);
    try {
      if (isAdmin) {
        await api.teacherReviews.adminDeleteReview(reviewId);
      } else {
        await api.teacherReviews.deleteMyReview(reviewId);
      }
      toast.success("Review deleted");
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => {
        const deleted = reviews.find(r => r.id === reviewId);
        if (!deleted) return prev;
        const newTotal = Math.max(0, prev.total_reviews - 1);
        const newAvg = newTotal === 0 ? 0 : ((prev.average_rating * prev.total_reviews) - deleted.rating) / newTotal;
        const newDist = { ...prev.rating_distribution, [deleted.rating]: Math.max(0, ((prev.rating_distribution as any)[deleted.rating] || 1) - 1) };
        return { average_rating: newAvg, total_reviews: newTotal, rating_distribution: newDist };
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const canDeleteReview = (review: Review) =>
    isAdmin || (currentUserId != null && review.student_id === currentUserId);

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  if (loading) return (
    <div style={{ padding: 24 }}>
      {[1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, borderRadius: 8, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 8, width: "40%" }} />
            <div style={{ height: 12, borderRadius: 8, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: "80%" }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Write a Review CTA (enrolled paid students only) ── */}
      {canReview && !showForm && (
        <div style={{ margin: "0 20px 20px", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, animation: "slideDown 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#f4c44e,#e8b43a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={18} color="#1e293b" fill="#1e293b" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>Share your experience</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>You're enrolled — your review helps other students</div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ background: "linear-gradient(135deg,#f4c44e,#e8b43a)", color: "#1e293b", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 12px rgba(244,196,78,0.35)" }}>
            Write Review
          </button>
        </div>
      )}

      {/* Not enrolled message */}
      {!canReview && userRole === "student" && (
        <div style={{ margin: "0 20px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquare size={16} color="#94a3b8" />
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Enroll in a paid course to leave a review</span>
        </div>
      )}

      {/* ── Review Form ── */}
      {showForm && (
        <div style={{ margin: "0 20px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", animation: "slideDown 0.3s ease" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#1e293b" }}>Rate Your Experience</div>
            <button onClick={() => { setShowForm(false); setNewRating(0); setHoverRating(0); setNewText(""); }}
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#64748b" />
            </button>
          </div>
          <div style={{ padding: "24px 20px" }}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Your Rating <span style={{ color: "#ef4444" }}>*</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewRating(star)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, transition: "transform 0.1s" }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1.15)")}
                  >
                    <Star size={32} fill={star <= (hoverRating || newRating) ? "#f59e0b" : "#e5e7eb"} color={star <= (hoverRating || newRating) ? "#f59e0b" : "#e5e7eb"} style={{ transition: "all 0.15s" }} />
                  </button>
                ))}
                {(hoverRating || newRating) > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", marginLeft: 8 }}>
                    {ratingLabels[hoverRating || newRating]} · {hoverRating || newRating}/5
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Your Review <span style={{ color: "#94a3b8", fontWeight: 500 }}>(optional)</span></div>
              <textarea value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="What did you like about this teacher? How was the teaching style? Did it help you improve?"
                rows={4}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#374151", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#f8fafc" }}
                onFocus={e => (e.target.style.borderColor = "#f4c44e")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{newText.length}/500</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowForm(false); setNewRating(0); setHoverRating(0); setNewText(""); }}
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting || newRating === 0}
                style={{ flex: 2, background: newRating === 0 ? "#e2e8f0" : "linear-gradient(135deg,#f4c44e,#e8b43a)", color: newRating === 0 ? "#94a3b8" : "#1e293b", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 900, cursor: newRating === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                <Send size={14} /> {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rating Summary ── */}
      {stats.total_reviews > 0 && (
        <div style={{ margin: "0 20px 20px", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a", borderRadius: 18, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#1e3a7a", lineHeight: 1 }}>{stats.average_rating.toFixed(1)}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 3, margin: "6px 0" }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} fill={s <= Math.round(stats.average_rating) ? "#f59e0b" : "#e5e7eb"} color={s <= Math.round(stats.average_rating) ? "#f59e0b" : "#e5e7eb"} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 700 }}>{stats.total_reviews} reviews</div>
            </div>
            <div style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map(r => {
                const count = (stats.rating_distribution as any)[r] || 0;
                const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r > 1 ? 6 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", width: 10, textAlign: "right" }}>{r}</span>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <div style={{ flex: 1, height: 7, background: "#fde68a", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#f59e0b", width: `${pct}%`, borderRadius: 100, transition: "width 0.6s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#92400e", fontWeight: 700, width: 18, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews List ── */}
      <div style={{ padding: "0 20px 20px" }}>
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <MessageSquare size={24} color="#cbd5e1" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No reviews yet</div>
            {canReview && <div style={{ fontSize: 13, color: "#94a3b8" }}>Be the first to share your experience!</div>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map(review => {
              const isOwn = currentUserId != null && review.student_id === currentUserId;
              const canDelete = isAdmin || isOwn;
              const isConfirming = confirmDeleteId === review.id;
              const isDeleting = deletingId === review.id;

              return (
                <div key={review.id} style={{ background: "#f8fafc", borderRadius: 16, padding: "18px 20px", border: "1px solid #f1f5f9", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#f4c44e,#e8b43a)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#1e293b", fontSize: 18, flexShrink: 0 }}>
                      {review.student_profile_picture
                        ? <img src={`http://localhost:8000${review.student_profile_picture}`} alt={review.student_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : review.student_name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#1e3a7a" }}>{review.student_name}</span>
                          {isOwn && <span style={{ fontSize: 10, fontWeight: 800, color: "#1e3a7a", background: "rgba(244,196,78,0.15)", border: "1px solid rgba(244,196,78,0.4)", padding: "2px 8px", borderRadius: 100 }}>Your Review</span>}
                          {isAdmin && !isOwn && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 100 }}>Student</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                          {canDelete && !isConfirming && (
                            <button
                              onClick={() => setConfirmDeleteId(review.id)}
                              title={isAdmin ? "Admin: Delete review" : "Delete your review"}
                              style={{ width: 28, height: 28, borderRadius: 8, background: isAdmin ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                              onMouseOver={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                              onMouseOut={e => (e.currentTarget.style.background = isAdmin ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.05)")}
                            >
                              {isAdmin && !isOwn ? <ShieldAlert size={13} color="#ef4444" /> : <Trash2 size={13} color="#ef4444" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 3, marginBottom: review.review_text ? 10 : 0 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= review.rating ? "#f59e0b" : "#e5e7eb"} color={s <= review.rating ? "#f59e0b" : "#e5e7eb"} />
                        ))}
                      </div>
                      {review.review_text && (
                        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>{review.review_text}</p>
                      )}
                    </div>
                  </div>

                  {/* Confirm delete panel */}
                  {isConfirming && (
                    <div style={{ marginTop: 14, padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, animation: "slideDown 0.2s ease" }}>
                      <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700 }}>
                        {isAdmin && !isOwn ? "⚠️ Remove this review as admin?" : "Delete your review permanently?"}
                      </span>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{ padding: "6px 14px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(review.id, isOwn)}
                          disabled={isDeleting}
                          style={{ padding: "6px 14px", borderRadius: 8, background: "#ef4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.7 : 1 }}>
                          {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherReviews;

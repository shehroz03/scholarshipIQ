import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, X } from "lucide-react";
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
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await api.teacherReviews.getTeacherReviews(teacherId);
      console.log("[TeacherReviews] raw response:", data);

      // Handle various backend response shapes
      const reviewsList: Review[] =
        data.reviews ?? data.items ?? data.data ?? (Array.isArray(data) ? data : []);
      const avg: number = data.average_rating ?? data.avg_rating ?? data.avgRating ?? 0;
      const total: number = data.total_reviews ?? data.total ?? data.count ?? reviewsList.length;
      const dist = data.rating_distribution ?? data.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

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

      // Optimistic update — show review immediately without waiting for GET
      const studentName = localStorage.getItem("userName") || localStorage.getItem("name") || "You";
      const optimistic: Review = {
        id: Date.now(),
        rating: newRating,
        review_text: newText,
        student_name: studentName,
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

      // Also refetch in background to get server-confirmed data
      setTimeout(() => fetchReviews(), 1200);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

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
        .rev-star:hover~.rev-star svg{fill:#e5e7eb!important;color:#e5e7eb!important}
      `}</style>

      {/* ── Write a Review CTA ── */}
      {canReview && !showForm && (
        <div style={{ margin: "0 20px 20px", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #c4b5fd", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, animation: "slideDown 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={18} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#4c1d95" }}>Share your experience</div>
              <div style={{ fontSize: 12, color: "#6d28d9", fontWeight: 600 }}>You're enrolled — your review helps other students</div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            Write Review
          </button>
        </div>
      )}

      {!canReview && (
        <div style={{ margin: "0 20px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquare size={16} color="#94a3b8" />
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Enroll in a course to leave a review</span>
        </div>
      )}

      {/* ── Review Form ── */}
      {showForm && (
        <div style={{ margin: "0 20px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", animation: "slideDown 0.3s ease" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#4c1d95" }}>Rate Your Experience</div>
            <button onClick={() => { setShowForm(false); setNewRating(0); setHoverRating(0); setNewText(""); }}
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(124,58,237,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#7c3aed" />
            </button>
          </div>

          <div style={{ padding: "24px 20px" }}>
            {/* Star selector */}
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
                    <Star size={32}
                      fill={star <= (hoverRating || newRating) ? "#f59e0b" : "#e5e7eb"}
                      color={star <= (hoverRating || newRating) ? "#f59e0b" : "#e5e7eb"}
                      style={{ transition: "all 0.15s" }}
                    />
                  </button>
                ))}
                {(hoverRating || newRating) > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", marginLeft: 8 }}>
                    {ratingLabels[hoverRating || newRating]} · {hoverRating || newRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Text */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Your Review <span style={{ color: "#94a3b8", fontWeight: 500 }}>(optional)</span></div>
              <textarea value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="What did you like about this teacher? How was the teaching style? Did it help you improve?"
                rows={4}
                style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#374151", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#f8fafc" }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{newText.length}/500</div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowForm(false); setNewRating(0); setHoverRating(0); setNewText(""); }}
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting || newRating === 0}
                style={{ flex: 2, background: newRating === 0 ? "#e2e8f0" : "linear-gradient(135deg,#7c3aed,#6366f1)", color: newRating === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 13, fontWeight: 900, cursor: newRating === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
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
              <div style={{ fontSize: 44, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{stats.average_rating.toFixed(1)}</div>
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
            {reviews.map(review => (
              <div key={review.id} style={{ background: "#f8fafc", borderRadius: 16, padding: "18px 20px", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#6366f1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 18, flexShrink: 0 }}>
                    {review.student_profile_picture
                      ? <img src={`http://localhost:8000${review.student_profile_picture}`} alt={review.student_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : review.student_name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{review.student_name}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{new Date(review.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    {/* stars */}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherReviews;

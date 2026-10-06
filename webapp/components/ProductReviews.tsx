"use client";

import { useEffect, useState } from "react";
import { starString } from "@/lib/stars";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((data: Review[]) => setReviews(data))
      .catch(() => setReviews([]));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating < 1) {
      setStatus("error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName: name, authorEmail: email || undefined, rating, comment }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setName("");
      setEmail("");
      setRating(0);
      setComment("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  const shownRating = hoverRating || rating;

  return (
    <>
      {reviews === null ? (
        <p className="rating-total">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rating-total">No reviews yet.</p>
      ) : (
        <div className="reviews-list" role="list" aria-label="Customer reviews">
          {reviews.map((r) => (
            <article className="review-card" role="listitem" key={r.id}>
              <header className="review-header">
                <strong className="reviewer-name">{r.authorName}</strong>
                <div className="review-stars" aria-label={`${r.rating} stars`}>{starString(r.rating)}</div>
              </header>
              {r.title && <p style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</p>}
              <p className="review-text">&ldquo;{r.comment}&rdquo;</p>
              <time className="review-date" dateTime={r.createdAt}>
                {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </time>
            </article>
          ))}
        </div>
      )}

      <div style={{ marginTop: "var(--space-6)" }}>
        {!showForm ? (
          <button className="btn btn-outline" onClick={() => setShowForm(true)}>
            Write a Review
          </button>
        ) : status === "success" ? (
          <div className="form-success" role="status">
            Thank you! Your review has been submitted and will appear once approved.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-group" style={{ maxWidth: 480 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="review-name">Your Name *</label>
                <input id="review-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="review-email">Email <span className="optional-label">(optional, not shown)</span></label>
                <input id="review-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
            </div>
            <fieldset className="form-group star-input-group">
              <legend className="form-label">Your Rating *</legend>
              <div className="star-input" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n !== 1 ? "s" : ""} — ${ratingLabels[n]}`}
                    className={`star-input-btn ${n <= shownRating ? "is-on" : ""}`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onFocus={() => setHoverRating(n)}
                    onBlur={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                ))}
                <span className="star-input-label" aria-live="polite">
                  {shownRating ? ratingLabels[shownRating] : "Tap a star to rate"}
                </span>
              </div>
            </fieldset>
            <div className="form-group">
              <label className="form-label" htmlFor="review-comment">Your Review *</label>
              <textarea id="review-comment" className="form-input form-textarea" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Share your experience with this product…" />
            </div>
            {status === "error" && (
              <p className="form-error" role="alert">
                {rating < 1 || !name.trim() || !comment.trim() ? "Please choose a star rating and fill in your name and review." : "Could not submit your review. Please try again."}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Submitting…" : "Submit Review"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

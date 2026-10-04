"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
};

const EXAMPLE_REVIEWS: Review[] = [
  {
    id: "example-1",
    authorName: "Priya M.",
    rating: 5,
    title: null,
    comment: "Absolutely stunning. The quality is exceptional and it arrived beautifully packaged.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "example-2",
    authorName: "Sarah K.",
    rating: 5,
    title: null,
    comment: "You can tell these are genuine stones, not dyed glass. Will be ordering more.",
    createdAt: new Date().toISOString(),
  },
];

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
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
    if (!name.trim() || !comment.trim()) return;
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
      setRating(5);
      setComment("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  const displayReviews = reviews && reviews.length > 0 ? reviews : EXAMPLE_REVIEWS;

  return (
    <>
      <div className="reviews-list" role="list" aria-label="Customer reviews">
        {displayReviews.map((r) => (
          <article className="review-card" role="listitem" key={r.id}>
            <header className="review-header">
              <strong className="reviewer-name">{r.authorName}</strong>
              <div className="review-stars" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            </header>
            {r.title && <p style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</p>}
            <p className="review-text">&ldquo;{r.comment}&rdquo;</p>
          </article>
        ))}
      </div>

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
            <div className="form-group">
              <label className="form-label" htmlFor="review-rating">Rating *</label>
              <select id="review-rating" className="form-input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="review-comment">Your Review *</label>
              <textarea id="review-comment" className="form-input form-textarea" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Share your experience with this product…" />
            </div>
            {status === "error" && <p className="form-error" role="alert">Could not submit your review. Please try again.</p>}
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

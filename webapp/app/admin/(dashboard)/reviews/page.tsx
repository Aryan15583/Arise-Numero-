"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { AdminPagination } from "@/components/admin/AdminPagination";

type Review = {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  verified: boolean;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (statusFilter) params.set("status", statusFilter);
    adminFetchJson<{ items: Review[]; total: number }>(`/api/admin/reviews?${params}`)
      .then((d) => {
        setReviews(d.items);
        setTotal(d.total);
      })
      .catch(() => {});
  }

  useEffect(load, [page, statusFilter]);

  async function setStatus(r: Review, status: string) {
    try {
      await adminFetchJson(`/api/admin/reviews/${r.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      showToast(`Review ${status}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update review.", "error");
    }
  }

  async function handleDelete(r: Review) {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await adminFetchJson(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
      showToast("Review deleted.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete review.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Reviews</div>
          <div className="page-subtitle">Moderate customer reviews before they appear on product pages</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Reviews</span>
          <select
            className="form-input"
            style={{ width: "auto", padding: "8px 12px" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Author</th><th>Rating</th><th>Comment</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">⭐</div><div className="empty-title">No reviews found</div></div></td></tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productName}</td>
                    <td>{r.authorName}{r.verified && <><br /><span className="badge badge-active" title="Email matches an order for this product">✓ Verified buyer</span></>}</td>
                    <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                    <td style={{ maxWidth: 280 }}>{r.title && <strong>{r.title}<br /></strong>}{r.comment}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${r.status === "approved" ? "badge-active" : r.status === "rejected" ? "badge-out" : "badge-gold"}`}>{r.status}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.status !== "approved" && <button className="btn btn-sm btn-success" onClick={() => setStatus(r, "approved")}>Approve</button>}
                        {r.status !== "rejected" && <button className="btn btn-sm btn-ghost" onClick={() => setStatus(r, "rejected")}>Reject</button>}
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {ToastEl}
    </>
  );
}

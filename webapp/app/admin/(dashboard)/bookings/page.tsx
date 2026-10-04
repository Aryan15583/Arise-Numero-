"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { BookingDTO } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AdminBookingsPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState<BookingDTO | null>(null);

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (statusFilter) params.set("status", statusFilter);
    adminFetchJson<{ items: BookingDTO[]; total: number }>(`/api/admin/bookings?${params}`)
      .then((d) => {
        setBookings(d.items);
        setTotal(d.total);
      })
      .catch(() => {});
  }

  useEffect(load, [page, statusFilter]);

  async function updateStatus(b: BookingDTO, status: string) {
    try {
      await adminFetchJson(`/api/admin/bookings/${b.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      showToast(`Booking status updated to "${status}".`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update booking.", "error");
    }
  }

  async function handleDelete(b: BookingDTO) {
    if (!confirm("Delete this booking?")) return;
    try {
      await adminFetchJson(`/api/admin/bookings/${b.id}`, { method: "DELETE" });
      showToast("Booking deleted.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete booking.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Booking Requests</div>
          <div className="page-subtitle">Numerology reading bookings</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Bookings</span>
          <select className="form-input" style={{ width: "auto", padding: "8px 12px" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="card-body">
          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No bookings yet</div>
              <div className="empty-desc">Bookings submitted through your website will appear here automatically.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Package</th><th>Birth Name</th><th>DOB</th><th>Session Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.clientEmail}</td>
                      <td><span className="badge badge-gold">{b.packageSelected || "—"}</span></td>
                      <td>{b.birthName}</td>
                      <td>{b.dateOfBirth}</td>
                      <td>{b.sessionDate || "Written report"}</td>
                      <td>
                        <select className="form-input" style={{ padding: "4px 8px", fontSize: "0.78rem" }} value={b.status} onChange={(e) => updateStatus(b, e.target.value)}>
                          <option value="new">🆕 New</option>
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="completed">🏁 Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => setViewing(b)}>View</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {viewing && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setViewing(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Booking Details</span>
              <button className="modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: 10, fontSize: "0.9rem" }}>
                <div><strong>Email:</strong> {viewing.clientEmail}</div>
                <div><strong>Name:</strong> {viewing.firstName} {viewing.lastName}</div>
                <div><strong>Birth Name:</strong> {viewing.birthName}</div>
                <div><strong>Date of Birth:</strong> {viewing.dateOfBirth}</div>
                <div><strong>Package:</strong> {viewing.packageSelected || "—"} {viewing.packagePriceUsd ? `($${viewing.packagePriceUsd})` : ""}</div>
                <div><strong>Timezone:</strong> {viewing.timezone || "—"}</div>
                <div><strong>Session Date:</strong> {viewing.sessionDate || "Written report"}</div>
                <div><strong>Reading Focus:</strong> {viewing.readingFocus || "Not specified"}</div>
                <div><strong>Notes:</strong> {viewing.additionalNotes || "None"}</div>
                <div><strong>Submitted:</strong> {new Date(viewing.submittedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

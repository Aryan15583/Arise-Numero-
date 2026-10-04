"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { AdminPagination } from "@/components/admin/AdminPagination";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  orderNumber: string | null;
  message: string;
  status: string;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function AdminMessagesPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Message | null>(null);

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    adminFetchJson<{ items: Message[]; total: number }>(`/api/admin/messages?${params}`)
      .then((d) => {
        setMessages(d.items);
        setTotal(d.total);
      })
      .catch(() => {});
  }

  useEffect(load, [page]);

  async function openMessage(m: Message) {
    setViewing(m);
    if (m.status === "new") {
      await adminFetchJson(`/api/admin/messages/${m.id}`, { method: "PUT", body: JSON.stringify({ status: "read" }) }).catch(() => {});
      load();
    }
  }

  async function handleDelete(m: Message) {
    if (!confirm("Delete this message?")) return;
    try {
      await adminFetchJson(`/api/admin/messages/${m.id}`, { method: "DELETE" });
      showToast("Message deleted.");
      setViewing(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete message.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Contact Messages</div>
          <div className="page-subtitle">Enquiries submitted through the contact form</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">✉️</div><div className="empty-title">No messages yet</div></div></td></tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} style={{ fontWeight: m.status === "new" ? 600 : 400 }}>
                    <td>{m.name}<br /><small style={{ color: "var(--text-muted)", fontWeight: 400 }}>{m.email}</small></td>
                    <td>{m.subject || "—"} {m.orderNumber && <><br /><small>Order: {m.orderNumber}</small></>}</td>
                    <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${m.status === "new" ? "badge-gold" : "badge-active"}`}>{m.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openMessage(m)}>View</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m)}>Delete</button>
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

      {viewing && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setViewing(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">Message from {viewing.name}</span>
              <button className="modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: 10, fontSize: "0.9rem" }}>
                <div><strong>From:</strong> {viewing.name} &lt;<a href={`mailto:${viewing.email}`}>{viewing.email}</a>&gt;</div>
                <div><strong>Subject:</strong> {viewing.subject || "—"}</div>
                {viewing.orderNumber && <div><strong>Order Number:</strong> {viewing.orderNumber}</div>}
                <div><strong>Received:</strong> {new Date(viewing.createdAt).toLocaleString()}</div>
                <div><strong>Message:</strong><p style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{viewing.message}</p></div>
              </div>
            </div>
            <div className="modal-footer">
              <a className="btn btn-primary" href={`mailto:${viewing.email}?subject=${encodeURIComponent(`Re: ${viewing.subject || "Your enquiry"}`)}`}>Reply by Email</a>
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

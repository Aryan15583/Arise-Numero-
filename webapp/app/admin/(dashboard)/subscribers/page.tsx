"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { ExportButton } from "@/components/admin/ExportButton";
import { AdminPagination } from "@/components/admin/AdminPagination";

type Subscriber = { id: string; email: string; source: string | null; subscribedAt: string; unsubscribedAt: string | null };

const PAGE_SIZE = 20;

export default function AdminSubscribersPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    adminFetchJson<{ items: Subscriber[]; total: number; activeCount: number }>(`/api/admin/subscribers?${params}`)
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setActiveCount(d.activeCount);
      })
      .catch(() => {});
  }

  useEffect(load, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function remove(s: Subscriber) {
    if (!confirm(`Permanently delete ${s.email}? (Use this for a "delete my data" request.)`)) return;
    try {
      await adminFetchJson(`/api/admin/subscribers/${s.id}`, { method: "DELETE" });
      showToast("Subscriber deleted.");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Newsletter Subscribers</div>
          <div className="page-subtitle">{activeCount} active subscriber{activeCount === 1 ? "" : "s"} · people who joined from the website footer</div>
        </div>
        <ExportButton type="subscribers" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Subscribers</span>
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Search by email…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <div className="empty-title">{search ? "No matches" : "No subscribers yet"}</div>
              <div className="empty-desc">Visitors who sign up in the website footer will appear here.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Status</th><th>Subscribed</th><th>Source</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td>{s.email}</td>
                      <td>
                        {s.unsubscribedAt ? (
                          <span className="badge badge-inactive" title={`Unsubscribed ${new Date(s.unsubscribedAt).toLocaleDateString()}`}>Unsubscribed</span>
                        ) : (
                          <span className="badge badge-active">Active</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{new Date(s.subscribedAt).toLocaleDateString()}</td>
                      <td>{s.source || "—"}</td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => remove(s)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {ToastEl}
    </>
  );
}

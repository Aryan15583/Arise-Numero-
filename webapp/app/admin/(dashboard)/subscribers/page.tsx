"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { ExportButton } from "@/components/admin/ExportButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SelectAllCell, SelectCell, useBulkDelete } from "@/components/admin/BulkDelete";

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


  const del = useBulkDelete({
    items: items,
    idOf: (s) => s.id,
    urlOf: (s) => `/api/admin/subscribers/${s.id}`,
    noun: "subscriber",
    onDone: load,
    showToast,
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Newsletter Subscribers</div>
          <div className="page-subtitle">{activeCount} active subscriber{activeCount === 1 ? "" : "s"} · people who joined from the website footer</div>
        </div>
        <div className="page-actions">
          {del.bar}
          <ExportButton type="subscribers" />
        </div>
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
                <thead><tr><SelectAllCell bulk={del.bulk} /><th>Email</th><th>Status</th><th>Subscribed</th><th>Source</th></tr></thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <SelectCell bulk={del.bulk} item={s} label={s.email} />
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {del.modal}
      {ToastEl}
    </>
  );
}

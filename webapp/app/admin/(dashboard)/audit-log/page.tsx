"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin/AdminPagination";

type LogEntry = {
  id: string;
  action: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
};

const PAGE_SIZE = 30;

const ACTION_BADGE: Record<string, string> = {
  "admin.login.success": "badge-active",
  "admin.login.failure": "badge-out",
  "admin.pin_change.success": "badge-gold",
  "admin.pin_change.failure": "badge-out",
  "admin.logout_everywhere": "badge-gold",
};

function badgeClass(action: string): string {
  if (ACTION_BADGE[action]) return ACTION_BADGE[action];
  if (action.endsWith(".delete")) return "badge-out";
  if (action.endsWith(".create")) return "badge-active";
  return "badge-inactive";
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    adminFetchJson<{ items: LogEntry[]; total: number }>(`/api/admin/audit-log?${params}`)
      .then((d) => {
        setEntries(d.items);
        setTotal(d.total);
      })
      .catch(() => {});
  }, [page]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Audit Log</div>
          <div className="page-subtitle">Security-relevant admin actions — logins, login-code requests, catalogue and settings edits</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Action</th><th>Detail</th><th>IP</th></tr></thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon">🛡️</div><div className="empty-title">No activity logged yet</div></div></td></tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(e.createdAt).toLocaleString()}</td>
                    <td><span className={`badge ${badgeClass(e.action)}`}>{e.action}</span></td>
                    <td>{e.detail || "—"}</td>
                    <td><code style={{ fontSize: "0.78rem" }}>{e.ip || "—"}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </>
  );
}

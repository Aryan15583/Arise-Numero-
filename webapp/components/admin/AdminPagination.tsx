"use client";

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ← Prev
        </button>
        <span style={{ fontSize: "0.8rem", padding: "6px 4px" }}>
          Page {page} of {totalPages}
        </span>
        <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

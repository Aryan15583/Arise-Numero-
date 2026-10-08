"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import type { ProductDTO } from "@/lib/types";

// The products endpoint is paginated ({ items, total }, max 100 per page). Stock
// totals and the low/out counts need the whole catalogue, so read every page.
async function fetchAllProducts(): Promise<ProductDTO[]> {
  const all: ProductDTO[] = [];
  for (let page = 1; ; page++) {
    const data = await adminFetchJson<{ items: ProductDTO[]; total: number }>(
      `/api/admin/products?page=${page}&pageSize=100`
    );
    all.push(...data.items);
    if (data.items.length === 0 || all.length >= data.total) break;
  }
  return all;
}

export default function AdminStockPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [waiting, setWaiting] = useState<Record<string, number>>({});

  function load() {
    fetchAllProducts().then(setProducts).catch(() => {});
    adminFetchJson<Record<string, number>>("/api/admin/stock-alerts").then(setWaiting).catch(() => {});
  }

  useEffect(load, []);

  const low = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const out = products.filter((p) => p.stock === 0).length;

  async function saveStock(p: ProductDTO) {
    const raw = edits[p.id] ?? String(p.stock);
    const qty = parseInt(raw, 10);
    if (Number.isNaN(qty) || qty < 0) {
      showToast("Enter a valid stock number.", "error");
      return;
    }
    try {
      await adminFetchJson(`/api/admin/products/${p.id}/stock`, { method: "PUT", body: JSON.stringify({ stock: qty }) });
      const notified = p.stock === 0 && qty > 0 ? waiting[p.id] || 0 : 0;
      showToast(notified ? `Stock updated to ${qty}. Emailed ${notified} waiting customer${notified === 1 ? "" : "s"}.` : `Stock updated to ${qty}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update stock.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Stock Levels</div>
          <div className="page-subtitle">Update inventory quantities. Restocking a sold-out product emails everyone waiting for it.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Stock</span>
          <span className="page-subtitle">{out} out of stock · {low} low stock</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Current Stock</th><th>Low Stock Threshold</th><th>Status</th><th title="Customers who asked to be emailed when it is back in stock">Waiting</th><th>Quick Update</th></tr></thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">No products yet</div></div></td></tr>
              ) : (
                products.map((p) => {
                  const pct = Math.min(100, (p.stock / Math.max(p.stock, p.lowStockThreshold * 4, 1)) * 100);
                  const color = p.stock === 0 ? "var(--error)" : p.stock <= p.lowStockThreshold ? "var(--warning)" : "var(--success)";
                  const status = p.stock === 0
                    ? <span className="badge badge-out">Out of Stock</span>
                    : p.stock <= p.lowStockThreshold
                    ? <span className="badge badge-low">Low Stock</span>
                    : <span className="badge badge-active">In Stock</span>;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong><br /><small style={{ color: "var(--text-muted)" }}>{p.category} · {p.beadSize}</small></td>
                      <td>
                        <div className="stock-bar-wrap">
                          <strong style={{ minWidth: 28 }}>{p.stock}</strong>
                          <div className="stock-bar"><div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                        </div>
                      </td>
                      <td>{p.lowStockThreshold}</td>
                      <td>{status}</td>
                      <td>{waiting[p.id] ? <strong>{waiting[p.id]}</strong> : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            min={0}
                            value={edits[p.id] ?? p.stock}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ width: 72, padding: "6px 8px", border: "1.5px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: "0.875rem" }}
                          />
                          <button className="btn btn-sm btn-success" onClick={() => saveStock(p)}>Save</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ToastEl}
    </>
  );
}

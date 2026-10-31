"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { ExportButton } from "@/components/admin/ExportButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { OrderDTO } from "@/lib/types";
import { useAdminCurrency } from "@/components/admin/AdminCurrency";
import { deleteRestocks } from "@/lib/order-rules";

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-low",
  paid: "badge-gold",
  shipped: "badge-active",
  completed: "badge-active",
  cancelled: "badge-out",
  failed: "badge-out",
};

// Statuses an admin can set by hand ("failed" is only ever set by a payment provider).
const SETTABLE = ["pending", "paid", "shipped", "completed", "cancelled"];

const PAGE_SIZE = 20;

type UpdateResponse = OrderDTO & { emailSent?: boolean; warning?: string };

export default function AdminOrdersPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState<OrderDTO | null>(null);

  const [updating, setUpdating] = useState<OrderDTO | null>(null);
  const [formStatus, setFormStatus] = useState("pending");
  const [formCarrier, setFormCarrier] = useState("");
  const [formTracking, setFormTracking] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formNotify, setFormNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const { money } = useAdminCurrency();

  // Selection for bulk delete (kept to the current page of results).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<OrderDTO[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    adminFetchJson<{ items: OrderDTO[]; total: number }>(`/api/admin/orders?${params}`)
      .then((d) => {
        setOrders(d.items);
        setTotal(d.total);
        setSelected(new Set());
      })
      .catch(() => {});
  }

  useEffect(load, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function openUpdate(order: OrderDTO) {
    setViewing(null);
    setUpdating(order);
    setFormStatus(SETTABLE.includes(order.status) ? order.status : "pending");
    setFormCarrier(order.carrier || "");
    setFormTracking(order.trackingNumber || "");
    setFormMessage("");
    setFormNotify(true);
  }

  async function saveUpdate() {
    if (!updating) return;
    setSaving(true);
    try {
      const result = await adminFetchJson<UpdateResponse>(`/api/admin/orders/${updating.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: formStatus,
          carrier: formCarrier.trim() || null,
          trackingNumber: formTracking.trim() || null,
          message: formMessage.trim() || null,
          notifyCustomer: formNotify,
        }),
      });
      const mailed = result.emailSent ? " Customer emailed." : "";
      showToast(`Order updated to "${result.status}".${mailed}`);
      if (result.warning) showToast(`⚠️ ${result.warning}`, "error");
      setUpdating(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update order.", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));

  async function confirmDelete() {
    if (!confirming) return;
    setDeleting(true);
    try {
      const result = await adminFetchJson<{ deleted: string[]; restocked: string[] }>("/api/admin/orders", {
        method: "DELETE",
        body: JSON.stringify({ ids: confirming.map((o) => o.id) }),
      });
      const n = result.deleted.length;
      const back = result.restocked.length ? ` Stock returned for ${result.restocked.length}.` : "";
      showToast(`Deleted ${n} order${n === 1 ? "" : "s"}.${back}`);
      setConfirming(null);
      setViewing(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const restockCount = confirming ? confirming.filter(deleteRestocks).length : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">Track and manage customer orders</div>
        </div>
        <ExportButton type="orders" />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Orders</span>
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Search by name or order ID…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <select className="form-input" style={{ width: "auto", padding: "8px 12px" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            {selected.size > 0 && (
              <button className="btn btn-danger" onClick={() => setConfirming(orders.filter((o) => selected.has(o.id)))}>
                Delete selected ({selected.size})
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <div className="empty-title">No orders yet</div>
              <div className="empty-desc">Orders placed at checkout will appear here automatically.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all orders on this page"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))}
                    />
                  </th>
                  <th>Order ID</th><th>Customer</th><th>Total</th><th>Items</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className={selected.has(o.id) ? "is-selected" : ""}>
                      <td><input type="checkbox" aria-label={`Select order ${o.id}`} checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td>
                      <td><code style={{ fontSize: "0.8rem" }}>{o.id}</code></td>
                      <td>{o.customerName || "—"}<br /><small style={{ color: "var(--text-muted)" }}>{o.customerEmail || ""}</small></td>
                      <td style={{ whiteSpace: "nowrap" }}>{money(o.totalUsd)}</td>
                      <td>{o.items.length} item(s)</td>
                      <td>{o.paymentMethod || "—"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{new Date(o.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] || "badge-inactive"}`}>{o.status}</span>
                        {o.trackingNumber && <><br /><small style={{ color: "var(--text-muted)" }}>📦 {o.trackingNumber}</small></>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => setViewing(o)}>View</button>
                          <button className="btn btn-sm btn-outline" onClick={() => openUpdate(o)}>Update</button>
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
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <span className="modal-title">Order Details</span>
              <button className="modal-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: 12, fontSize: "0.9rem" }}>
                <div><strong>Order ID:</strong> <code>{viewing.id}</code></div>
                <div><strong>Customer:</strong> {viewing.customerName || "—"}</div>
                <div><strong>Email:</strong> {viewing.customerEmail || "—"}</div>
                <div><strong>Phone:</strong> {viewing.customerPhone || "—"}</div>
                <div><strong>Date:</strong> {new Date(viewing.date).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className={`badge ${STATUS_BADGE[viewing.status] || "badge-inactive"}`}>{viewing.status}</span></div>
                {viewing.trackingNumber && <div><strong>Tracking:</strong> {viewing.carrier ? `${viewing.carrier} · ` : ""}{viewing.trackingNumber}</div>}
                <div><strong>Payment Method:</strong> {viewing.paymentMethod || "—"}</div>
                <div><strong>Subtotal:</strong> {money(viewing.subtotalUsd)}</div>
                {viewing.discountUsd > 0 && <div><strong>Discount:</strong> −{money(viewing.discountUsd)} {viewing.couponCode && `(${viewing.couponCode})`}</div>}
                <div><strong>Shipping:</strong> {money(viewing.shippingUsd)}</div>
                <div><strong>Total:</strong> {money(viewing.totalUsd)}</div>
                <div>
                  <strong>Items:</strong><br />
                  {viewing.items.map((i, idx) => (
                    <span key={idx}>• {i.name} × {i.qty} — {money(i.priceUsd * i.qty)}<br /></span>
                  ))}
                </div>
                <div>
                  <strong>Shipping Address:</strong><br />
                  {viewing.shippingAddress.address1 ? (
                    <>
                      {viewing.shippingAddress.firstName} {viewing.shippingAddress.lastName}<br />
                      {viewing.shippingAddress.address1}{viewing.shippingAddress.address2 ? `, ${viewing.shippingAddress.address2}` : ""}<br />
                      {viewing.shippingAddress.city}, {viewing.shippingAddress.state} {viewing.shippingAddress.postalCode}<br />
                      {viewing.shippingAddress.country}
                    </>
                  ) : "—"}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => setConfirming([viewing])}>Delete</button>
              <a className="btn btn-ghost" href={`/admin/invoice/${viewing.id}`} target="_blank" rel="noopener noreferrer">🖨 Invoice</a>
              <button className="btn btn-outline" onClick={() => openUpdate(viewing)}>Update order</button>
              <button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {updating && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setUpdating(null)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">Update order</span>
              <button className="modal-close" onClick={() => setUpdating(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
                <code>{updating.id}</code> · {updating.customerName || "—"}
              </p>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                    {SETTABLE.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <p className="form-hint">
                    Cancelling returns the items to stock; re-opening a cancelled order takes them again.
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier</label>
                  <input className="form-input" value={formCarrier} onChange={(e) => setFormCarrier(e.target.value)} placeholder="e.g. India Post, Delhivery, DHL" maxLength={60} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tracking number</label>
                  <input className="form-input" value={formTracking} onChange={(e) => setFormTracking(e.target.value)} placeholder="Shown to the customer when shipped" maxLength={100} />
                </div>
                <div className="form-group">
                  <label className="form-label">Note to customer (optional)</label>
                  <textarea className="form-input" rows={2} value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Appears on their tracking page and in the email" maxLength={500} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                  <input type="checkbox" checked={formNotify} onChange={(e) => setFormNotify(e.target.checked)} />
                  Email the customer about this update (paid / shipped / completed / cancelled)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setUpdating(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveUpdate} disabled={saving}>{saving ? "Saving…" : "Save update"}</button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !deleting && setConfirming(null)}>
          <div className="modal" style={{ maxWidth: 460 }} role="alertdialog" aria-labelledby="delete-orders-title">
            <div className="modal-header">
              <span className="modal-title" id="delete-orders-title">
                Delete {confirming.length === 1 ? "this order" : `${confirming.length} orders`}?
              </span>
              <button className="modal-close" onClick={() => setConfirming(null)} disabled={deleting}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 12, fontSize: "0.9rem" }}>
              <p>
                This permanently removes {confirming.length === 1 ? <><code>{confirming[0].id}</code> ({confirming[0].customerName || "no name"})</> : "the selected orders"},
                including the customer details and tracking history. <strong>It can&apos;t be undone.</strong>
              </p>
              <p>
                {restockCount > 0
                  ? confirming.length === 1
                    ? "It hasn't shipped yet, so its items will go back into stock."
                    : `${restockCount} of these haven't shipped yet, so their items will go back into stock.`
                  : "Stock levels won't change (shipped, completed and cancelled orders don't hold stock)."}
              </p>
              <p style={{ color: "var(--text-muted)" }}>To keep a record instead, set the order to Cancelled. Consider exporting first if you need it for your accounts.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirming(null)} disabled={deleting}>Keep</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : `Delete permanently`}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";

type Coupon = {
  code: string;
  discountPercent: number;
  description: string | null;
  active: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  minOrderUsd: number | null;
};

function describeRules(c: Coupon): string {
  const parts: string[] = [];
  if (c.minOrderUsd !== null) parts.push(`Min order $${c.minOrderUsd.toFixed(2)}`);
  if (c.maxUses !== null) parts.push(`${c.usedCount}/${c.maxUses} uses`);
  else if (c.usedCount > 0) parts.push(`${c.usedCount} uses`);
  if (c.expiresAt) parts.push(`${new Date(c.expiresAt) < new Date() ? "Expired" : "Expires"} ${new Date(c.expiresAt).toLocaleDateString()}`);
  return parts.join(" · ") || "No restrictions";
}

export default function AdminCouponsPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    adminFetchJson<Coupon[]>("/api/admin/coupons").then(setCoupons).catch(() => {});
  }

  useEffect(load, []);

  function openAdd() {
    setEditingCode(null);
    setCode("");
    setDiscount("");
    setDescription("");
    setActive(true);
    setExpiresAt("");
    setMaxUses("");
    setMinOrder("");
    setModalOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditingCode(c.code);
    setCode(c.code);
    setDiscount(String(c.discountPercent));
    setDescription(c.description || "");
    setActive(c.active);
    setExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : "");
    setMaxUses(c.maxUses !== null ? String(c.maxUses) : "");
    setMinOrder(c.minOrderUsd !== null ? String(c.minOrderUsd) : "");
    setModalOpen(true);
  }

  async function handleSave() {
    const upperCode = code.trim().toUpperCase();
    const discountNum = parseInt(discount, 10);
    if (!upperCode || Number.isNaN(discountNum)) {
      showToast("Code and discount % are required.", "error");
      return;
    }
    const maxUsesNum = maxUses.trim() ? parseInt(maxUses, 10) : null;
    const minOrderNum = minOrder.trim() ? parseFloat(minOrder) : null;
    if ((maxUsesNum !== null && (Number.isNaN(maxUsesNum) || maxUsesNum < 1)) || (minOrderNum !== null && (Number.isNaN(minOrderNum) || minOrderNum < 0))) {
      showToast("Usage limit must be 1 or more, and minimum order can't be negative.", "error");
      return;
    }
    const rules = { expiresAt: expiresAt || null, maxUses: maxUsesNum, minOrderUsd: minOrderNum };

    setSaving(true);
    try {
      if (editingCode) {
        await adminFetchJson(`/api/admin/coupons/${editingCode}`, {
          method: "PUT",
          body: JSON.stringify({ discountPercent: discountNum, description, active, ...rules }),
        });
        showToast(`Coupon "${upperCode}" updated.`);
      } else {
        await adminFetchJson("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify({ code: upperCode, discountPercent: discountNum, description, active, ...rules }),
        });
        showToast(`Coupon "${upperCode}" added.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save coupon.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await adminFetchJson(`/api/admin/coupons/${c.code}`, { method: "PUT", body: JSON.stringify({ active: !c.active }) });
      showToast(`Coupon "${c.code}" ${!c.active ? "activated" : "deactivated"}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update coupon.", "error");
    }
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await adminFetchJson(`/api/admin/coupons/${c.code}`, { method: "DELETE" });
      showToast(`Coupon "${c.code}" deleted.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete coupon.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Coupon Codes</div>
          <div className="page-subtitle">Manage discount codes — optionally with an expiry date, usage limit or minimum order</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Coupon</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Discount</th><th>Rules</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🏷️</div><div className="empty-title">No coupons yet</div></div></td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.code}>
                    <td><code style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.06em" }}>{c.code}</code></td>
                    <td><strong>{c.discountPercent}% off</strong></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{describeRules(c)}</td>
                    <td>{c.description || "—"}</td>
                    <td>{c.active ? <span className="badge badge-active">Active</span> : <span className="badge badge-inactive">Inactive</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>
                        <button className={`btn btn-sm ${c.active ? "btn-ghost" : "btn-success"}`} onClick={() => toggleActive(c)}>{c.active ? "Deactivate" : "Activate"}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">{editingCode ? "Edit Coupon" : "Add Coupon"}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                  <label className="form-label">Coupon Code *</label>
                  <input className="form-input" style={{ textTransform: "uppercase" }} value={code} disabled={!!editingCode} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SUMMER20" />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Percentage *</label>
                  <input type="number" min={1} max={100} className="form-input" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 15" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Summer sale discount" />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid until (optional)</label>
                  <input type="date" className="form-input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                  <p className="form-hint">Works through the end of this day. Leave empty for no expiry.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Total uses allowed (optional)</label>
                  <input type="number" min={1} className="form-input" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="e.g. 100 — empty means unlimited" />
                  {editingCode && <p className="form-hint">Used so far: {coupons.find((c) => c.code === editingCode)?.usedCount ?? 0}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum order, USD (optional)</label>
                  <input type="number" min={0} step="0.01" className="form-input" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="e.g. 50" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="toggle-wrap">
                    <button type="button" className={`toggle ${active ? "on" : ""}`} onClick={() => setActive((v) => !v)} />
                    <span className="toggle-label">{active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Coupon"}</button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

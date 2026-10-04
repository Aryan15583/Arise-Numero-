"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";

type Category = {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export default function AdminCategoriesPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    adminFetchJson<Category[]>("/api/admin/categories").then(setCategories).catch(() => {});
  }

  useEffect(load, []);

  function openAdd() {
    setEditingSlug(null);
    setSlug("");
    setName("");
    setDescription("");
    setActive(true);
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditingSlug(c.slug);
    setSlug(c.slug);
    setName(c.name);
    setDescription(c.description || "");
    setActive(c.active);
    setModalOpen(true);
  }

  async function handleSave() {
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleanSlug || !name.trim()) {
      showToast("Slug and name are required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingSlug) {
        await adminFetchJson(`/api/admin/categories/${editingSlug}`, {
          method: "PUT",
          body: JSON.stringify({ name, description, active }),
        });
        showToast(`"${name}" updated.`);
      } else {
        await adminFetchJson("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({ slug: cleanSlug, name, description, active }),
        });
        showToast(`"${name}" added.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save category.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Products already using it keep their category label, but it will disappear from the shop filter and add-product dropdown.`)) return;
    try {
      await adminFetchJson(`/api/admin/categories/${c.slug}`, { method: "DELETE" });
      showToast(`"${c.name}" deleted.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete category.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Categories</div>
          <div className="page-subtitle">Manage crystal types shown in the shop filter and product form</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">🏷️</div><div className="empty-title">No categories yet</div></div></td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.slug}>
                    <td><strong>{c.name}</strong></td>
                    <td><code>{c.slug}</code></td>
                    <td>{c.description || "—"}</td>
                    <td>{c.active ? <span className="badge badge-active">Active</span> : <span className="badge badge-inactive">Hidden</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>Edit</button>
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
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">{editingSlug ? "Edit Category" : "Add Category"}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input className="form-input" value={slug} disabled={!!editingSlug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. moonstone" />
                  <span className="form-hint">Lowercase, hyphens only. Used as the product&apos;s category value.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Moonstone" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="toggle-wrap">
                    <button type="button" className={`toggle ${active ? "on" : ""}`} onClick={() => setActive((v) => !v)} />
                    <span className="toggle-label">{active ? "Active" : "Hidden"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Category"}</button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

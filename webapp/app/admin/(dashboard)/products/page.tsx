"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { PRODUCT_TYPES, getProductType } from "@/lib/product-types";
import type { ProductDTO } from "@/lib/types";

const BEAD_SIZES = ["", "4mm", "6mm", "8mm", "10mm", "12mm"];
const BADGES = ["", "Bestseller", "New", "Sale", "Premium"];
const PAGE_SIZE = 20;

type Category = { slug: string; name: string };

type FormState = {
  id: string;
  name: string;
  category: string;
  productType: string;
  beadSize: string;
  priceUsd: string;
  originalPriceUsd: string;
  stock: string;
  lowStockThreshold: string;
  badge: string;
  // Read-only: shown in the dialog, derived from approved reviews.
  ratingSummary: string;
  material: string;
  description: string;
  images: string[]; // first = main image
  active: boolean;
  featured: boolean;
};

function emptyForm(defaultCategory: string): FormState {
  return {
    id: "",
    name: "",
    category: defaultCategory,
    productType: "bracelets",
    beadSize: "8mm",
    priceUsd: "",
    originalPriceUsd: "",
    stock: "",
    lowStockThreshold: "5",
    badge: "",
    ratingSummary: "No approved reviews yet",
    material: "",
    description: "",
    images: [],
    active: true,
    featured: false,
  };
}

export default function AdminProductsPage() {
  const { showToast, ToastEl } = useAdminToast();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [saving, setSaving] = useState(false);

  function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (typeFilter) params.set("productType", typeFilter);
    adminFetchJson<{ items: ProductDTO[]; total: number }>(`/api/admin/products?${params}`)
      .then((d) => {
        setProducts(d.items);
        setTotal(d.total);
      })
      .catch(() => {});
  }

  useEffect(load, [page, search, categoryFilter, typeFilter]);
  useEffect(() => {
    adminFetchJson<Category[]>("/api/admin/categories").then(setCategories).catch(() => {});
  }, []);

  // Debounce the free-text search so we're not hitting the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm(categories[0]?.slug || ""));
    setModalOpen(true);
  }

  function openEdit(p: ProductDTO) {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category || categories[0]?.slug || "",
      productType: p.productType || "bracelets",
      beadSize: p.beadSize || "",
      priceUsd: String(p.priceUsd),
      originalPriceUsd: p.originalPriceUsd !== null ? String(p.originalPriceUsd) : "",
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold),
      badge: p.badge || "",
      ratingSummary: p.reviewCount > 0 ? `${p.rating} ★ from ${p.reviewCount} approved review${p.reviewCount === 1 ? "" : "s"}` : "No approved reviews yet",
      material: p.material || "",
      description: p.description || "",
      images: (p.images.length ? p.images : p.imageUrl ? [p.imageUrl] : []).slice(0, 4),
      active: p.active,
      featured: p.featured,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const id = form.id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id || !form.name.trim()) {
      showToast("Product name and ID are required.", "error");
      return;
    }

    const payload = {
      id,
      name: form.name.trim(),
      material: form.material.trim(),
      description: form.description.trim(),
      priceUsd: parseFloat(form.priceUsd) || 0,
      originalPriceUsd: form.originalPriceUsd ? parseFloat(form.originalPriceUsd) : null,
      category: form.category || null,
      productType: form.productType,
      beadSize: form.beadSize || null,
      stock: parseInt(form.stock, 10) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      images: form.images,
      badge: form.badge || null,
      active: form.active,
      featured: form.featured,
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminFetchJson(`/api/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast(`"${form.name}" updated successfully.`);
      } else {
        await adminFetchJson("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
        showToast(`"${form.name}" added successfully.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save product.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: ProductDTO) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await adminFetchJson(`/api/admin/products/${p.id}`, { method: "DELETE" });
      showToast(`"${p.name}" deleted.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete product.", "error");
    }
  }

  async function handleQuickStock(p: ProductDTO) {
    const qty = prompt(`Update stock for "${p.name}"\nCurrent: ${p.stock}\n\nEnter new quantity:`, String(p.stock));
    if (qty === null) return;
    const newQty = parseInt(qty, 10);
    if (Number.isNaN(newQty) || newQty < 0) {
      showToast("Invalid quantity.", "error");
      return;
    }
    try {
      await adminFetchJson(`/api/admin/products/${p.id}/stock`, { method: "PUT", body: JSON.stringify({ stock: newQty }) });
      showToast(`Stock for "${p.name}" updated to ${newQty}.`);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update stock.", "error");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Manage your crystal bracelet catalogue</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Products</span>
          <div className="toolbar">
            <input type="text" className="search-input" placeholder="Search products…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <select
              className="form-input"
              style={{ width: "auto", padding: "8px 12px" }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Stones</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <select
              className="form-input"
              style={{ width: "auto", padding: "8px 12px" }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by product type"
            >
              <option value="">All Types</option>
              {PRODUCT_TYPES.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Image</th><th>Name</th><th>Type / Stone</th><th>Price (USD)</th><th>Stock</th><th>Status</th><th>Featured</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">💎</div><div className="empty-title">No products found</div><div className="empty-desc">Add your first product using the button above.</div></div></td></tr>
              ) : (
                products.map((p) => {
                  const stockBadge = p.stock === 0
                    ? <span className="badge badge-out">Out</span>
                    : p.stock <= p.lowStockThreshold
                    ? <span className="badge badge-low">{p.stock} ⚠️</span>
                    : <span className="badge badge-active">{p.stock}</span>;
                  return (
                    <tr key={p.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <td><img src={p.imageUrl || "/assets/placeholder.svg"} className="product-thumb" alt={p.name} /></td>
                      <td><strong>{p.name}</strong><br /><small style={{ color: "var(--text-muted)" }}>{p.id}</small></td>
                      <td>{getProductType(p.productType)?.name || p.productType}<br /><small style={{ color: "var(--text-muted)" }}>{categories.find((c) => c.slug === p.category)?.name || "—"}</small></td>
                      <td>
                        {p.priceUsd > 0 ? `$${p.priceUsd.toFixed(2)}` : <span className="badge badge-gold" title="No price yet — shown as Price on request and can't be ordered">On request</span>}
                        {p.originalPriceUsd && <><br /><small style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>${p.originalPriceUsd.toFixed(2)}</small></>}
                      </td>
                      <td>{stockBadge}</td>
                      <td>{p.active ? <span className="badge badge-active">Active</span> : <span className="badge badge-inactive">Hidden</span>}</td>
                      <td>{p.featured ? <span className="badge badge-gold">⭐ Featured</span> : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No</span>}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleQuickStock(p)}>Stock</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingId ? "Edit Product" : "Add New Product"}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Amethyst Serenity" />
                </div>
                <div className="form-group">
                  <label className="form-label">Product ID *</label>
                  <input className="form-input" value={form.id} disabled={!!editingId} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="e.g. amethyst-8mm" />
                  <span className="form-hint">Lowercase, hyphens only. Used in cart.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Type *</label>
                  <select className="form-input" value={form.productType} onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))}>
                    {PRODUCT_TYPES.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                  </select>
                  <span className="form-hint">Decides which shop section it appears in.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Stone</label>
                  <select className="form-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                  <span className="form-hint">Manage stones under Admin → Categories.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Bead Size</label>
                  <select className="form-input" value={form.beadSize} onChange={(e) => setForm((f) => ({ ...f, beadSize: e.target.value }))}>
                    {BEAD_SIZES.map((s) => <option key={s} value={s}>{s || "— Not beaded —"}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (USD) *</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))} placeholder="24.99" />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price (USD)</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={form.originalPriceUsd} onChange={(e) => setForm((f) => ({ ...f, originalPriceUsd: e.target.value }))} placeholder="Leave blank if no sale" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input type="number" min="0" className="form-input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="10" />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input type="number" min="0" className="form-input" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <select className="form-input" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}>
                    {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Rating</label>
                  <input className="form-input" value={form.ratingSummary} readOnly disabled title="Calculated automatically from approved reviews (Admin → Reviews)" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Material Description *</label>
                  <input className="form-input" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} placeholder="e.g. Authentic 8mm Amethyst beads, elastic cord" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Full Description</label>
                  <textarea className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Product Images</label>
                  <ProductImageManager
                    images={form.images}
                    onChange={(update) => setForm((f) => ({ ...f, images: update(f.images) }))}
                    onError={(msg) => showToast(msg, "error")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Active (visible on site)</label>
                  <div className="toggle-wrap">
                    <button type="button" className={`toggle ${form.active ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, active: !f.active }))} />
                    <span className="toggle-label">{form.active ? "Active" : "Hidden"}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Featured (show on homepage)</label>
                  <div className="toggle-wrap">
                    <button type="button" className={`toggle ${form.featured ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))} />
                    <span className="toggle-label">{form.featured ? "Featured" : "Not featured"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Product"}</button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}

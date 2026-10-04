"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductDTO } from "@/lib/types";

const SIZE_OPTIONS = ["6mm", "8mm", "10mm"];

type SortValue = "featured" | "price-low" | "price-high" | "rating";

export function ShopClient({
  initialProducts,
  initialCat,
  initialQuery,
  categories,
}: {
  initialProducts: ProductDTO[];
  initialCat?: string;
  initialQuery?: string;
  categories: { slug: string; name: string }[];
}) {
  const [crystal, setCrystal] = useState<string>(
    initialCat && categories.some((c) => c.slug === initialCat) ? initialCat : "all"
  );
  const [price, setPrice] = useState<string>("all");
  const [sizes, setSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortValue>("featured");
  const [query, setQuery] = useState((initialQuery || "").slice(0, 80));

  function toggleSize(size: string) {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  }

  function resetFilters() {
    setCrystal("all");
    setPrice("all");
    setSizes([]);
    setInStockOnly(false);
    setSort("featured");
    setQuery("");
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const categoryNames = new Map(categories.map((c) => [c.slug, c.name.toLowerCase()]));
    let list = initialProducts.filter((p) => {
      if (needle) {
        const haystack = [p.name, p.material, p.description, p.beadSize, categoryNames.get(p.category || "")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!needle.split(/ +/).every((word) => haystack.includes(word))) return false;
      }
      if (crystal !== "all" && p.category !== crystal) return false;
      if (price === "0-20" && !(p.priceUsd < 20)) return false;
      if (price === "20-30" && !(p.priceUsd >= 20 && p.priceUsd < 30)) return false;
      if (price === "30-50" && !(p.priceUsd >= 30 && p.priceUsd < 50)) return false;
      if (price === "50+" && !(p.priceUsd >= 50)) return false;
      if (sizes.length && !sizes.includes(p.beadSize || "")) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });

    list = [...list];
    if (sort === "price-low") list.sort((a, b) => a.priceUsd - b.priceUsd);
    else if (sort === "price-high") list.sort((a, b) => b.priceUsd - a.priceUsd);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [initialProducts, categories, query, crystal, price, sizes, inStockOnly, sort]);

  return (
    <div className="container shop-layout">
      <aside className="shop-sidebar" aria-label="Filter and sort products">
        <div className="filter-section">
          <h2 className="filter-title">Filter By</h2>

          <fieldset className="filter-group">
            <legend className="filter-label">Crystal Type</legend>
            <label className="filter-option">
              <input type="radio" name="crystal" checked={crystal === "all"} onChange={() => setCrystal("all")} />
              All Crystals
            </label>
            {categories.map((c) => (
              <label className="filter-option" key={c.slug}>
                <input type="radio" name="crystal" checked={crystal === c.slug} onChange={() => setCrystal(c.slug)} />
                {c.name}
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-label">Price Range</legend>
            {[
              { value: "all", label: "All Prices" },
              { value: "0-20", label: "Under $20" },
              { value: "20-30", label: "$20 – $30" },
              { value: "30-50", label: "$30 – $50" },
              { value: "50+", label: "Over $50" },
            ].map((opt) => (
              <label className="filter-option" key={opt.value}>
                <input type="radio" name="price" checked={price === opt.value} onChange={() => setPrice(opt.value)} />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-label">Bead Size</legend>
            {SIZE_OPTIONS.map((size) => (
              <label className="filter-option" key={size}>
                <input type="checkbox" checked={sizes.includes(size)} onChange={() => toggleSize(size)} />
                {size}
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-label">Availability</legend>
            <label className="filter-option">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In Stock Only
            </label>
          </fieldset>

          <button className="btn btn-outline btn-sm filter-reset" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </aside>

      <div className="shop-main">
        <div className="shop-search" role="search">
          <label htmlFor="shop-search-input" className="sr-only">Search bracelets</label>
          <input
            id="shop-search-input"
            type="search"
            className="form-input"
            placeholder="Search bracelets — try “amethyst”, “protection”, “8mm”…"
            value={query}
            maxLength={80}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="shop-toolbar" role="toolbar" aria-label="Sort and view options">
          <p className="results-count" aria-live="polite">
            Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="sort-group">
            <label htmlFor="sort-select" className="sort-label">Sort by:</label>
            <select
              id="sort-select"
              className="sort-select"
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="product-grid" role="list" aria-label="Crystal bracelet products">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="cart-empty">
            <div className="cart-empty-icon" aria-hidden="true">💎</div>
            <h2>No bracelets match{query.trim() ? ` “${query.trim()}”` : " your filters"}</h2>
            <p>Try a different search, or adjust or reset your filters.</p>
            <button className="btn btn-primary" onClick={resetFilters}>Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

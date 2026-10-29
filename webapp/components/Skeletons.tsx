import { Header } from "./Header";
import { Footer } from "./Footer";

// Placeholders shown while a shop or product page loads (see loading.tsx files).
function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line skeleton-line--short" />
        <div className="skeleton skeleton-line skeleton-line--title" />
        <div className="skeleton skeleton-line skeleton-line--short" />
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <>
      <Header />
      <main id="main-content" aria-busy="true">
        <div className="page-header container">
          <div className="skeleton skeleton-line skeleton-line--title" style={{ height: 40, width: 260 }} />
        </div>
        <div className="container">
          <span className="sr-only" role="status">Loading products…</span>
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function ProductSkeleton() {
  return (
    <>
      <Header />
      <main id="main-content" aria-busy="true">
        <div className="container skeleton-product">
          <span className="sr-only" role="status">Loading product…</span>
          <div className="skeleton skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-line skeleton-line--title" style={{ height: 36 }} />
            <div className="skeleton skeleton-line skeleton-line--short" style={{ height: 24 }} />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" style={{ width: "80%" }} />
            <div className="skeleton" style={{ height: 52, marginTop: 16 }} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

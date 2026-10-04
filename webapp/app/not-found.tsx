import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content">
        <div className="container notfound">
          <div className="notfound-mark" aria-hidden="true">✦</div>
          <h1 className="page-title">We couldn&apos;t find that page</h1>
          <p className="page-subtitle">
            It may have moved, or the product might no longer be available. Try searching the shop, or head back to
            something familiar.
          </p>

          {/* A plain GET form: works without JavaScript. */}
          <form action="/shop" method="get" className="notfound-search" role="search">
            <label htmlFor="nf-q" className="sr-only">Search bracelets</label>
            <input id="nf-q" name="q" type="search" className="form-input" placeholder="Search bracelets…" maxLength={80} />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          <div className="notfound-links">
            <Link href="/shop" className="btn btn-outline">Shop all bracelets</Link>
            <Link href="/numerology" className="btn btn-outline">Free numerology calculator</Link>
            <Link href="/" className="btn btn-ghost">Home</Link>
            <Link href="/contact" className="btn btn-ghost">Contact us</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

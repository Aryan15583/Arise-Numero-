import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WishlistClient } from "@/components/WishlistClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Your Wishlist",
  description: "Bracelets you've saved at Arise Numero.",
  path: "/wishlist",
  noindex: true,
});

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <div className="page-header container">
          <h1 className="page-title">Your Wishlist</h1>
          <p className="page-subtitle">Saved on this device — no account needed.</p>
        </div>
        <div className="container section">
          <WishlistClient />
        </div>
      </main>
      <Footer />
    </>
  );
}

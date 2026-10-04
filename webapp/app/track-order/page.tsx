import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrackOrderClient } from "@/components/TrackOrderClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Track Your Order",
  description: "Check the status of your Arise Numero order using your order number and email.",
  path: "/track-order",
  noindex: true,
});

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <>
      <Header />
      <main id="main-content">
        <div className="page-header container">
          <h1 className="page-title">Track Your Order</h1>
          <p className="page-subtitle">Enter your order number and the email you used at checkout.</p>
        </div>
        <TrackOrderClient initialId={typeof id === "string" ? id.slice(0, 64) : undefined} />
      </main>
      <Footer />
    </>
  );
}

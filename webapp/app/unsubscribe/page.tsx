import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UnsubscribeClient } from "@/components/UnsubscribeClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Unsubscribe from the Arise Numero newsletter.",
  path: "/unsubscribe",
  noindex: true,
});

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <Header />
      <main id="main-content">
        <div className="container notfound">
          {token ? (
            <UnsubscribeClient token={token.slice(0, 100)} />
          ) : (
            <>
              <h1 className="page-title">Unsubscribe link needed</h1>
              <p className="page-subtitle">Please use the unsubscribe link from one of our emails.</p>
              <Link href="/contact" className="btn btn-outline">Contact us instead</Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

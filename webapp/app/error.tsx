"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown if a page throws while rendering. `reset` re-tries the render, which
// fixes transient problems (a dropped database connection, a brief network blip).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="container notfound" role="alert">
      <div className="notfound-mark" aria-hidden="true">✦</div>
      <h1 className="page-title">Something went wrong</h1>
      <p className="page-subtitle">
        Sorry — that page hit an unexpected problem. It&apos;s not you. Please try again, and if it keeps happening let us know.
      </p>
      <div className="notfound-links">
        <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
        <Link href="/" className="btn btn-outline">Go to the home page</Link>
        <Link href="/contact" className="btn btn-ghost">Contact us</Link>
      </div>
      {error.digest && <p className="text-muted" style={{ marginTop: 24, fontSize: "0.8rem" }}>Reference: {error.digest}</p>}
    </main>
  );
}

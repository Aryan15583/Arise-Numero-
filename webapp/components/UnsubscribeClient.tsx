"use client";

import Link from "next/link";
import { useState } from "react";

// A button rather than unsubscribing on page load: email security scanners
// "click" every link in an email, which would silently unsubscribe people.
export function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

  async function confirm() {
    setState("working");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <>
        <h1 className="page-title">You&apos;re unsubscribed</h1>
        <p className="page-subtitle">You won&apos;t receive any more newsletters from us. Sorry to see you go.</p>
        <Link href="/" className="btn btn-primary">Back to the shop</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Unsubscribe from our newsletter?</h1>
      <p className="page-subtitle">You&apos;ll stop receiving news about new collections and numerology tips.</p>
      <div className="notfound-links">
        <button className="btn btn-primary" onClick={confirm} disabled={state === "working"}>
          {state === "working" ? "Unsubscribing…" : "Yes, unsubscribe me"}
        </button>
        <Link href="/" className="btn btn-ghost">No, keep me subscribed</Link>
      </div>
      {state === "error" && <p className="form-error" role="alert" style={{ marginTop: 16 }}>Something went wrong — please try again.</p>}
    </>
  );
}

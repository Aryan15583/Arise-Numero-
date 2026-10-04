"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "../admin.css";

type Step = "request" | "verify";

// Show the code as ABCD-EFGH while typing/pasting; the server accepts any spacing.
function formatCodeInput(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "verify") inputRef.current?.focus();
  }, [step]);

  async function requestCode() {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/login/request", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // A "just sent one" cooldown means a valid code already exists, so
        // take them to the entry step instead of leaving them stuck.
        if (res.status === 429 && typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds <= 60) {
          setCooldown(data.retryAfterSeconds);
          setStep("verify");
          setInfo("A code was already sent a moment ago — check your inbox.");
          return;
        }
        setError(data.error || "Could not send the code. Please try again.");
        return;
      }
      setSentTo(data.sentTo || null);
      setDevHint(data.devHint || null);
      setCode("");
      setCooldown(60);
      setStep("verify");
      setInfo(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.replace("-", "").length < 4) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "That code didn't work. Try again.");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setCode("");
        inputRef.current?.focus();
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-scope">
      <div id="login-screen">
        <div className="login-box otp-box">
          <div className="login-logo">✦</div>
          <div className="login-title">Arise Numero</div>
          <div className="login-subtitle">Admin Panel</div>

          {step === "request" ? (
            <>
              <p className="otp-lead">
                Sign in with a <strong>one-time code</strong>. We&apos;ll email it to the admin address on file —
                no password to remember or steal.
              </p>
              <button className="otp-btn" onClick={requestCode} disabled={busy}>
                {busy ? "Sending…" : "✉️ Email me a login code"}
              </button>
              <div className={`otp-msg ${error ? "error" : "info"}`} role="status" aria-live="polite">{error}</div>
            </>
          ) : (
            <form onSubmit={verify}>
              <p className="otp-lead">
                We emailed a code to <strong>{sentTo || "the admin address"}</strong>. It expires in 10 minutes
                and works once.
              </p>
              <input
                ref={inputRef}
                className={`otp-input ${shaking ? "error" : ""}`}
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={9}
                placeholder="ABCD-EFGH"
                aria-label="One-time login code"
                value={code}
                onChange={(e) => setCode(formatCodeInput(e.target.value))}
              />
              <button className="otp-btn" type="submit" disabled={busy || code.replace("-", "").length < 4}>
                {busy ? "Checking…" : "Sign in"}
              </button>
              <div className={`otp-msg ${error ? "error" : "info"}`} role="status" aria-live="polite">
                {error || info}
              </div>
              <button type="button" className="otp-link" onClick={requestCode} disabled={busy || cooldown > 0}>
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
              </button>
              {devHint && <p className="otp-note">Dev mode: {devHint}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

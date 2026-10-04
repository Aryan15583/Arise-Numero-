"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { CONSENT_CHANGED_EVENT, CONSENT_KEY } from "@/lib/consent";

// Google Analytics 4 — completely inert unless BOTH are true:
//   1. NEXT_PUBLIC_GA_ID is set (a "G-XXXXXXXXXX" measurement id), and
//   2. the visitor accepted analytics cookies in the cookie banner.
// Nothing is loaded and nothing is sent to Google before consent.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || "";
const GA_ID_VALID = /^G-[A-Z0-9]{4,}$/.test(GA_ID); // also makes it safe to inline into the script below

function readConsent(): string {
  try {
    return localStorage.getItem(CONSENT_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function Analytics() {
  const raw = useSyncExternalStore(subscribe, readConsent, () => "");

  let allowed = false;
  try {
    allowed = !!raw && JSON.parse(raw).analytics === true;
  } catch {
    allowed = false;
  }
  const enabled = GA_ID_VALID && allowed;

  // GA can't be unloaded once running, but this flag makes it stop sending if consent is withdrawn.
  useEffect(() => {
    if (!GA_ID_VALID) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = !enabled;
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}

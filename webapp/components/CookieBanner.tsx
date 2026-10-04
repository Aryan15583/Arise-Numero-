"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGED_EVENT, CONSENT_KEY, OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

type Consent = { essential: boolean; functional: boolean; analytics: boolean; marketing: boolean };

const DEFAULT_PREFS: Consent = { essential: true, functional: true, analytics: false, marketing: false };

function loadSaved(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      functional: parsed.functional !== false,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [prefs, setPrefs] = useState<Consent>(DEFAULT_PREFS);

  useEffect(() => {
    if (loadSaved()) return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // The footer's "Cookie settings" link: let visitors review or withdraw consent any time.
  useEffect(() => {
    function open() {
      setPrefs(loadSaved() ?? DEFAULT_PREFS);
      setVisible(true);
      setShowManage(true);
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  function save(consent: Consent) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, timestamp: Date.now() }));
    } catch {
      /* private mode — choice just won't persist */
    }
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setVisible(false);
    setShowManage(false);
  }

  // The admin panel is private and sets no tracking cookies — never nag there.
  if (pathname?.startsWith("/admin")) return null;
  if (!visible) return null;

  return (
    <>
      <div className="cookie-banner is-visible" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc">
        <div className="cookie-inner">
          <div className="cookie-text">
            <strong id="cookie-title">🍪 We use cookies</strong>
            <p id="cookie-desc">
              We use cookies to enhance your experience. See our <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
          <div className="cookie-actions">
            <button className="btn btn-primary btn-sm" onClick={() => save({ essential: true, functional: true, analytics: true, marketing: true })}>
              Accept All
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowManage(true)}>
              Manage
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => save({ essential: true, functional: false, analytics: false, marketing: false })}>
              Reject
            </button>
          </div>
        </div>
      </div>

      {showManage && (
        <div className="cookie-manage-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">
          <div className="cookie-manage-panel">
            <h2 id="cookie-modal-title">Manage Cookie Preferences</h2>
            <div className="cookie-row">
              <div>
                <strong>Essential Cookies</strong>
                <p className="form-hint">Required for the site to function. Cannot be disabled.</p>
              </div>
              <input type="checkbox" checked disabled aria-label="Essential cookies always enabled" />
            </div>
            <div className="cookie-row">
              <div>
                <strong>Functional Cookies</strong>
                <p className="form-hint">Remember your preferences like currency.</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.functional}
                onChange={(e) => setPrefs((p) => ({ ...p, functional: e.target.checked }))}
                aria-label="Functional cookies"
              />
            </div>
            <div className="cookie-row">
              <div>
                <strong>Analytics Cookies</strong>
                <p className="form-hint">Help us understand how visitors use the site.</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                aria-label="Analytics cookies"
              />
            </div>
            <div className="cookie-row">
              <div>
                <strong>Marketing Cookies</strong>
                <p className="form-hint">Used for personalised advertising.</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                aria-label="Marketing cookies"
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => save(prefs)}>
                Save Preferences
              </button>
              <button className="btn btn-ghost" onClick={() => setShowManage(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

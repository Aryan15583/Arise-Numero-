"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="footer-link-button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      Cookie settings
    </button>
  );
}

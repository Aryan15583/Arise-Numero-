"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicConfig } from "@/lib/public-config";

const DISMISS_KEY = "an_announcement_dismissed";

// Slim site-wide banner, text and link set in Admin → Settings. Dismissing it
// hides that exact message on this device; a new message shows again.
export function AnnouncementBar() {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    getPublicConfig().then((c) => {
      const t = c?.announcementText?.trim() || "";
      if (!t) return;
      let dismissed = "";
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) || "";
      } catch {
        /* storage blocked — just show it */
      }
      if (dismissed === t) return;
      setText(t);
      setLink(c?.announcementLink?.trim() || "");
    });
  }, []);

  if (!text) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, text);
    } catch {
      /* ignore */
    }
    setText("");
  }

  const external = link.startsWith("https://");
  return (
    <div className="announcement-bar" role="region" aria-label="Announcement">
      <p className="announcement-text">
        {link ? (
          external ? (
            <a href={link} target="_blank" rel="noopener noreferrer">{text} →</a>
          ) : (
            <Link href={link}>{text} →</Link>
          )
        ) : (
          text
        )}
      </p>
      <button type="button" className="announcement-close" onClick={dismiss} aria-label="Dismiss announcement">×</button>
    </div>
  );
}

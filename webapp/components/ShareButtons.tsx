"use client";

import { useState } from "react";
import { absoluteUrl } from "@/lib/seo";

// Plain share links (no third-party scripts or trackers) — WhatsApp first, since
// it's how most of this store's customers pass recommendations around.
export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(path);
  const text = `${title} — Arise Numero`;
  const enc = encodeURIComponent;

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: "Pinterest", href: `https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(text)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="share-buttons" aria-label={`Share ${title}`}>
      <span className="share-label">Share:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="share-link" aria-label={`Share on ${l.label}`}>
          {l.label}
        </a>
      ))}
      <button type="button" className="share-link" onClick={copy}>
        {copied ? "✓ Link copied" : "Copy link"}
      </button>
    </div>
  );
}

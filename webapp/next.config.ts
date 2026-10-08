import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy — allow-lists exactly the third parties this app
// actually loads: Google Fonts, the PayPal SDK/checkout, and the Cashfree
// SDK/checkout. Everything else defaults to 'self'.
//
// Known tradeoff: script-src includes 'unsafe-inline' because Next.js
// injects small inline bootstrap scripts (hydration data, etc.) and doing
// this properly requires a per-request nonce threaded through middleware
// into every page — a bigger change than this pass covers. Combined with
// React's default output-escaping and this codebase having zero
// dangerouslySetInnerHTML usage, the practical risk is low, but a nonce-
// based CSP is the natural next hardening step if you want to close this
// gap — see TODO.md.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://www.paypal.com https://www.paypalobjects.com https://sdk.cashfree.com https://www.googletagmanager.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: https:`,
  `connect-src 'self' https://ipapi.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com https://sandbox.cashfree.com https://api.cashfree.com https://*.cashfree.com`,
  `frame-src https://www.paypal.com https://sandbox.cashfree.com https://api.cashfree.com https://*.cashfree.com`,
  `upgrade-insecure-requests`,
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt-and-suspenders with frame-ancestors above, for browsers that
  // predate CSP3 frame-ancestors support.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // Only meaningful over HTTPS (browsers ignore it on plain HTTP), so it's
  // safe to always send — harmless in local dev over http://localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// The repo root has its own package-lock.json (the old static site), which made
// Next.js guess the wrong project root. Pin it to this folder so builds — and
// Vercel's file tracing — only see the app.
const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: { root: appRoot },
  outputFileTracingRoot: appRoot,
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js" to every visitor
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Belt-and-braces for SEO: robots.txt already disallows these, but a header
      // also keeps them out of the index if some page links to them.
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

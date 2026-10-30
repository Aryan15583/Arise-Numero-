import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { logoSealDataUrl } from "@/lib/brand-image";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Site-wide link-preview card (WhatsApp, Facebook, X, LinkedIn, Slack ...).
export default async function Image() {
  const seal = await logoSealDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1228 0%, #2d1f4a 100%)",
          color: "#f0eafa",
        }}
      >
        <img src={seal} width={150} height={150} alt="" style={{ marginBottom: 36 }} />
        <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 40, color: "#d4b47a", marginTop: 24, display: "flex" }}>{SITE_TAGLINE}</div>
        <div style={{ fontSize: 28, color: "#a99bc0", marginTop: 40, display: "flex" }}>
          Handcrafted with real gemstones · Ships worldwide
        </div>
      </div>
    ),
    size
  );
}

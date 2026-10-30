import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { SITE_NAME, truncate } from "@/lib/seo";
import { logoSealDataUrl } from "@/lib/brand-image";

export const alt = `${SITE_NAME} crystal`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-product link-preview card with the real name, material and price.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, material: true, priceUsd: true, active: true },
  });

  const name = product?.active ? product.name : SITE_NAME;
  const material = product?.active ? truncate(product.material, 70) : "Authentic crystals";
  const price = product?.active ? `$${product.priceUsd.toFixed(2)}` : "";
  const seal = await logoSealDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1a1228 0%, #2d1f4a 100%)",
          color: "#f0eafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={seal} width={64} height={64} alt="" style={{ marginRight: 20 }} />
          <div style={{ fontSize: 36, color: "#d4b47a", letterSpacing: 2, display: "flex" }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: name.length > 28 ? 68 : 88, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>{name}</div>
          <div style={{ fontSize: 36, color: "#a99bc0", marginTop: 24, display: "flex" }}>{material}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#d4b47a", display: "flex" }}>{price}</div>
          <div style={{ fontSize: 28, color: "#a99bc0", display: "flex" }}>Handcrafted · Ships worldwide</div>
        </div>
      </div>
    ),
    size
  );
}

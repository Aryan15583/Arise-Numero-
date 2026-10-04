import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

// PUBLIC: list active products (used by the shop and home pages).
// Optional ?ids=a,b,c returns just those products (used by the wishlist page);
// hidden/inactive products are never returned either way.
export async function GET(req: NextRequest) {
  const idsParam = new URL(req.url).searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50)
    : null;

  const rows = await prisma.product.findMany({
    where: { active: true, ...(ids ? { id: { in: ids } } : {}) },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(rows.map(serializeProduct));
}

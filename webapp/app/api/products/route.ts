import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

// PUBLIC: list active products (used by the shop and home pages).
export async function GET() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(rows.map(serializeProduct));
}

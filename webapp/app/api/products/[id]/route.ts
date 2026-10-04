import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

// PUBLIC: single product by id (used by the product detail page).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json(serializeProduct(row));
}

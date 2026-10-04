import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeProduct } from "@/lib/serialize";
import { adminStockUpdateSchema, formatZodError } from "@/lib/validation";

// ADMIN: quick stock update (used by the Stock Levels page).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminStockUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const updated = await prisma.product.update({ where: { id }, data: { stock: parsed.data.stock } });
  return NextResponse.json(serializeProduct(updated));
}

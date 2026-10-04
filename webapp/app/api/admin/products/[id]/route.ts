import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeProduct } from "@/lib/serialize";
import { adminProductUpdateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: update a product.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = adminProductUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const p = parsed.data;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: p.name ?? existing.name,
      material: p.material !== undefined ? p.material : existing.material,
      description: p.description !== undefined ? p.description : existing.description,
      priceUsd: p.priceUsd !== undefined ? p.priceUsd : existing.priceUsd,
      originalPriceUsd: p.originalPriceUsd !== undefined ? p.originalPriceUsd : existing.originalPriceUsd,
      category: p.category !== undefined ? p.category : existing.category,
      beadSize: p.beadSize !== undefined ? p.beadSize : existing.beadSize,
      stock: p.stock !== undefined ? p.stock : existing.stock,
      lowStockThreshold: p.lowStockThreshold !== undefined ? p.lowStockThreshold : existing.lowStockThreshold,
      imageUrl: p.imageUrl !== undefined ? p.imageUrl : existing.imageUrl,
      images: p.images !== undefined ? JSON.stringify(p.images) : existing.images,
      badge: p.badge !== undefined ? p.badge : existing.badge,
      rating: p.rating !== undefined ? p.rating : existing.rating,
      reviewCount: p.reviewCount !== undefined ? p.reviewCount : existing.reviewCount,
      active: p.active !== undefined ? p.active : existing.active,
      featured: p.featured !== undefined ? p.featured : existing.featured,
    },
  });

  await logAudit("product.update", `Updated "${updated.name}" (${updated.id})`, getClientIp(req));

  return NextResponse.json(serializeProduct(updated));
}

// ADMIN: delete a product.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await prisma.product.delete({ where: { id } });
  await logAudit("product.delete", `Deleted "${existing.name}" (${existing.id})`, getClientIp(req));
  return NextResponse.json({ deleted: true });
}

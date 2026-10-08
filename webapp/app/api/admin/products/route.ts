import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeProduct } from "@/lib/serialize";
import { adminProductCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { syncProductUploads } from "@/lib/product-images";
import type { Prisma } from "@prisma/client";

// ADMIN: list products, including hidden/inactive — paginated + searchable
// so the table stays fast as the catalogue grows.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();

  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = category;
  const productType = searchParams.get("productType")?.trim();
  if (productType) where.productType = productType;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    items: rows.map(serializeProduct),
    total,
    page,
    pageSize,
  });
}

// ADMIN: create a product.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const p = parsed.data;
  const id = p.id.trim().toLowerCase().replace(/\s+/g, "-");

  const exists = await prisma.product.findUnique({ where: { id } });
  if (exists) return NextResponse.json({ error: "A product with this id already exists." }, { status: 409 });

  const maxSort = await prisma.product.aggregate({ _max: { sortOrder: true } });

  // The first image is always the main one.
  const images = (p.images || []).filter(Boolean);
  const mainImage = images[0] || p.imageUrl || null;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.product.create({
      data: {
        id,
        name: p.name,
        material: p.material || null,
        description: p.description || null,
        priceUsd: p.priceUsd,
        originalPriceUsd: p.originalPriceUsd ?? null,
        category: p.category || null,
        productType: p.productType || "bracelets",
        beadSize: p.beadSize || null,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        imageUrl: mainImage,
        images: JSON.stringify(images.length ? images : mainImage ? [mainImage] : []),
        badge: p.badge || null,
        active: p.active !== false,
        featured: !!p.featured,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    await syncProductUploads(tx, row.id, images);
    return row;
  });

  await logAudit("product.create", `Created "${created.name}" (${created.id})`, getClientIp(req));

  return NextResponse.json(serializeProduct(created), { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminCategoryUpdateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: update a category.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { slug } = await params;
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = adminCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  const updated = await prisma.category.update({
    where: { slug },
    data: {
      name: c.name ?? existing.name,
      description: c.description !== undefined ? c.description : existing.description,
      sortOrder: c.sortOrder !== undefined ? c.sortOrder : existing.sortOrder,
      active: c.active !== undefined ? c.active : existing.active,
    },
  });

  await logAudit("category.update", `Updated category ${slug}`, getClientIp(req));
  return NextResponse.json(updated);
}

// ADMIN: delete a category. Products keep their (now-orphaned) category
// string — deleting a category doesn't touch existing products, it just
// removes it from the manageable list / shop filter.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { slug } = await params;
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  await prisma.category.delete({ where: { slug } });
  await logAudit("category.delete", `Deleted category ${slug}`, getClientIp(req));
  return NextResponse.json({ deleted: true });
}

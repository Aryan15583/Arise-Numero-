import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminCategoryCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: list all categories (including inactive).
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(rows);
}

// ADMIN: create a category.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminCategoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  const exists = await prisma.category.findUnique({ where: { slug: c.slug } });
  if (exists) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });

  const created = await prisma.category.create({
    data: {
      slug: c.slug,
      name: c.name,
      description: c.description || null,
      sortOrder: c.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      active: c.active !== false,
    },
  });

  await logAudit("category.create", `Created category "${created.name}" (${created.slug})`, getClientIp(req));
  return NextResponse.json(created, { status: 201 });
}

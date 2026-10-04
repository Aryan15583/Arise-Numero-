import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUBLIC: active categories for the shop page filter sidebar.
export async function GET() {
  const rows = await prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(rows);
}

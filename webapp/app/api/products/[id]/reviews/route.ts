import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUBLIC: approved reviews for one product (shown on the product detail page).
// Explicit select: the reviewer's email is private and must never be returned.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await prisma.review.findMany({
    where: { productId: id, status: "approved" },
    orderBy: { createdAt: "desc" },
    select: { id: true, authorName: true, rating: true, title: true, comment: true, verified: true, createdAt: true },
  });
  return NextResponse.json(rows);
}

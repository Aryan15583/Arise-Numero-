import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUBLIC: approved reviews for one product (shown on the product detail page).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await prisma.review.findMany({
    where: { productId: id, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

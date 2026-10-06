import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

// ADMIN: how many customers are waiting for each product to be restocked.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const rows = await prisma.stockAlert.groupBy({
    by: ["productId"],
    where: { notifiedAt: null },
    _count: { _all: true },
  });
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.productId, r._count._all])));
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stockAlertSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// PUBLIC: "Email me when it's back in stock" on a sold-out product.
// Same answer whether or not the address was already on the list.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "stock-alerts", 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = stockAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const { productId, email } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { active: true, stock: true } });
  if (!product || !product.active) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (product.stock > 0) {
    return NextResponse.json({ error: "Good news — this product is in stock now." }, { status: 409 });
  }

  await prisma.stockAlert.upsert({
    where: { productId_email: { productId, email } },
    update: { notifiedAt: null },
    create: { productId, email },
  });
  return NextResponse.json({ ok: true });
}

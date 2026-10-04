import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { couponValidateSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// PUBLIC: validate a coupon code at cart/checkout.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "coupon-validate", 20, 60_000)) {
    return NextResponse.json({ valid: false, message: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = couponValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Enter a coupon code." }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();

  const row = await prisma.coupon.findUnique({ where: { code } });
  if (!row || !row.active) {
    return NextResponse.json({ valid: false, message: "Invalid or expired coupon code." });
  }
  return NextResponse.json({
    valid: true,
    discountPercent: row.discountPercent,
    message: `${row.discountPercent}% off applied.`,
  });
}

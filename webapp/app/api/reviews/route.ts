import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyAdmin, escapeHtml } from "@/lib/email";
import { reviewCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { orderHoldsStock } from "@/lib/inventory";

// A review is from a "verified buyer" when its email matches an order that
// contains this product and is a real purchase (paid, or a live COD/bank order).
async function isVerifiedBuyer(email: string, productId: string): Promise<boolean> {
  const emails = [...new Set([email.trim(), email.trim().toLowerCase()])];
  const orders = await prisma.order.findMany({
    where: { customerEmail: { in: emails } },
    select: { items: true, status: true, paymentMethod: true },
    take: 50,
  });
  return orders.some((o) => {
    if (!orderHoldsStock(o)) return false;
    try {
      const items = JSON.parse(o.items || "[]") as { id?: string }[];
      return Array.isArray(items) && items.some((i) => i.id === productId);
    } catch {
      return false;
    }
  });
}

// PUBLIC: submit a product review. Goes in as "pending" — an admin approves
// it (Admin -> Reviews) before it appears on the product page. This keeps
// the public review list free of spam without needing a moderation service.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "reviews-create", 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const r = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: r.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const verified = r.authorEmail ? await isVerifiedBuyer(r.authorEmail, r.productId) : false;

  const review = await prisma.review.create({
    data: {
      productId: r.productId,
      authorName: r.authorName,
      authorEmail: r.authorEmail || null,
      rating: r.rating,
      title: r.title || null,
      comment: r.comment,
      status: "pending",
      verified,
    },
  });

  await notifyAdmin(
    `New review pending approval — ${product.name}`,
    `<p>${escapeHtml(r.authorName)} left a ${r.rating}-star review on ${escapeHtml(product.name)}${verified ? " (verified buyer)" : ""}.</p>`
  );

  return NextResponse.json(
    { id: review.id, message: "Thank you! Your review will appear once approved." },
    { status: 201 }
  );
}

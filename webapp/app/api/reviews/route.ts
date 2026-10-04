import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyAdmin, escapeHtml } from "@/lib/email";
import { reviewCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

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

  const review = await prisma.review.create({
    data: {
      productId: r.productId,
      authorName: r.authorName,
      authorEmail: r.authorEmail || null,
      rating: r.rating,
      title: r.title || null,
      comment: r.comment,
      status: "pending",
    },
  });

  await notifyAdmin(
    `New review pending approval — ${product.name}`,
    `<p>${escapeHtml(r.authorName)} left a ${r.rating}-star review on ${escapeHtml(product.name)}.</p>`
  );

  return NextResponse.json(
    { id: review.id, message: "Thank you! Your review will appear once approved." },
    { status: 201 }
  );
}

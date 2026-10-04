import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newsletterSubscribeSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCoupon } from "@/lib/coupons";
import { newsletterWelcomeEmail, sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/seo";

// PUBLIC: newsletter signup. The response never reveals whether an address was
// already subscribed (so it can't be used to check who is on the list), and the
// welcome email is only sent when someone is newly (re)subscribed — repeating the
// form can't be used to flood an inbox.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "newsletter", 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = newsletterSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  // Bots fill the hidden field; pretend it worked and do nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const email = parsed.data.email;
  const existing = await prisma.subscriber.findUnique({ where: { email } });

  let token: string | null = null;
  if (!existing) {
    token = randomBytes(24).toString("hex");
    await prisma.subscriber.create({ data: { email, token, source: "footer" } });
  } else if (existing.unsubscribedAt) {
    token = existing.token;
    await prisma.subscriber.update({ where: { email }, data: { unsubscribedAt: null, subscribedAt: new Date() } });
  }

  if (token) {
    const couponCode = (process.env.NEWSLETTER_WELCOME_COUPON || "WELCOME10").toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const usable = coupon && checkCoupon(coupon).ok;
    const { subject, html } = newsletterWelcomeEmail({
      unsubscribeUrl: `${getSiteUrl()}/unsubscribe?token=${token}`,
      couponCode: usable ? coupon.code : null,
      discountPercent: usable ? coupon.discountPercent : null,
    });
    await sendEmail({ to: email, subject, html });
  }

  return NextResponse.json({ ok: true });
}

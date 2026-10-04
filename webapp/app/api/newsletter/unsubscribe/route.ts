import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newsletterUnsubscribeSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// PUBLIC: unsubscribe via the secret token in the email link. Always answers ok,
// so it can't be used to probe which tokens exist.
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), "newsletter-unsub", 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = newsletterUnsubscribeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });

  await prisma.subscriber.updateMany({
    where: { token: parsed.data.token, unsubscribedAt: null },
    data: { unsubscribedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

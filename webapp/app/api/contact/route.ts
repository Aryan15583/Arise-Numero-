import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyAdmin, escapeHtml } from "@/lib/email";
import { contactCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// PUBLIC: contact form submission. Persisted so the admin panel has a real
// inbox regardless of whether the site owner has an EmailJS/Resend key set up.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "contact-create", 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const b = parsed.data;

  const message = await prisma.contactMessage.create({
    data: {
      name: b.name,
      email: b.email,
      subject: b.subject || null,
      orderNumber: b.orderNumber || null,
      message: b.message,
      status: "new",
    },
  });

  await notifyAdmin(
    `New contact message from ${message.name}`,
    `<p><strong>${escapeHtml(message.name)}</strong> (${escapeHtml(message.email)}):</p><p>${escapeHtml(message.message)}</p>`
  );

  return NextResponse.json({ id: message.id, createdAt: message.createdAt }, { status: 201 });
}

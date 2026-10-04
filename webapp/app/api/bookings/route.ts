import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBooking } from "@/lib/serialize";
import { sendEmail, notifyAdmin, bookingConfirmationEmail, escapeHtml } from "@/lib/email";
import { bookingCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const PACKAGE_PRICES: Record<string, { label: string; price: number }> = {
  core: { label: "Core Blueprint", price: 49.99 },
  full: { label: "Full Numeroscope", price: 89.99 },
  premium: { label: "Premium + Live Session", price: 149.99 },
};

// PUBLIC: submit a numerology reading booking.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "bookings-create", 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const b = parsed.data;
  const pkg = PACKAGE_PRICES[b.packageSelected as string];

  const booking = await prisma.booking.create({
    data: {
      firstName: b.firstName || null,
      lastName: b.lastName || null,
      clientEmail: b.clientEmail,
      birthName: b.birthName,
      dateOfBirth: b.dateOfBirth,
      packageSelected: pkg?.label || b.packageSelected || null,
      packagePriceUsd: pkg?.price ?? null,
      timezone: b.timezone || null,
      sessionDate: b.sessionDate || null,
      readingFocus: Array.isArray(b.readingFocus) ? b.readingFocus.join(", ") : b.readingFocus || null,
      additionalNotes: b.additionalNotes || null,
      status: "new",
    },
  });

  const { subject, html } = bookingConfirmationEmail(booking);
  await sendEmail({ to: booking.clientEmail, subject, html });
  await notifyAdmin(
    `New booking — ${booking.packageSelected || "reading"}`,
    `<p>${escapeHtml(booking.clientEmail)} booked a ${escapeHtml(booking.packageSelected || "reading")}.</p>`
  );

  return NextResponse.json(serializeBooking(booking), { status: 201 });
}

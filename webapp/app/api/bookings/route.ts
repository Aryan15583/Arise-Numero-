import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeBooking } from "@/lib/serialize";
import { sendEmail, notifyAdmin, bookingConfirmationEmail, escapeHtml } from "@/lib/email";
import { bookingCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { READING_PACKAGES } from "@/lib/reading-packages";
import { ageFromDob, ADULT_AGE } from "@/lib/age";

const PACKAGE_PRICES: Record<string, { label: string; price: number }> = Object.fromEntries(
  READING_PACKAGES.map((p) => [p.key, { label: p.name, price: p.price }])
);

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

  // Children's data needs a parent's or guardian's consent (DPDP Act 2023).
  const age = ageFromDob(b.dateOfBirth);
  if (age === null) {
    return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });
  }
  const minor = age < ADULT_AGE;
  if (minor && b.guardianConsent !== true) {
    return NextResponse.json(
      { error: "This reading is for someone under 18, so a parent or guardian must book it and give consent." },
      { status: 400 }
    );
  }
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
      additionalNotes:
        [minor ? `[Under 18: booked with parent/guardian consent on ${new Date().toISOString().slice(0, 10)}]` : "", b.additionalNotes || ""]
          .filter(Boolean)
          .join("\n") || null,
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

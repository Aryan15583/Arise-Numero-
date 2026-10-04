import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const MAX_ROWS = 50_000;
// Excel needs a byte-order mark to read UTF-8 (₹, é, ✦ ...) correctly.
const UTF8_BOM = String.fromCharCode(0xfeff);

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return JSON.parse(raw || "") as T;
  } catch {
    return fallback;
  }
}

// ADMIN: download a table as CSV (accounting, mailing lists, backups). Contains
// personal data, so it's admin-only, never cached, and every export is audit-logged.
export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { type } = await params;
  let csv: string;
  let count: number;

  switch (type) {
    case "orders": {
      const rows = await prisma.order.findMany({ orderBy: { date: "desc" }, take: MAX_ROWS });
      count = rows.length;
      csv = toCsv(
        ["Order ID", "Date", "Status", "Customer", "Email", "Phone", "Items", "Subtotal USD", "Discount USD", "Coupon", "Shipping USD", "Total USD", "Payment method", "Payment reference", "Carrier", "Tracking number", "Ship to"],
        rows.map((o) => {
          const items = parseJson<{ name: string; qty: number }[]>(o.items, []);
          const a = parseJson<Record<string, string>>(o.shippingAddress, {});
          return [
            o.id,
            o.date,
            o.status,
            o.customerName,
            o.customerEmail,
            o.customerPhone,
            items.map((i) => `${i.name} x ${i.qty}`).join("; "),
            o.subtotalUsd.toFixed(2),
            o.discountUsd.toFixed(2),
            o.couponCode,
            o.shippingUsd.toFixed(2),
            o.totalUsd.toFixed(2),
            o.paymentMethod,
            o.paymentReference,
            o.carrier,
            o.trackingNumber,
            [a.firstName, a.lastName, a.address1, a.address2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", "),
          ];
        })
      );
      break;
    }
    case "bookings": {
      const rows = await prisma.booking.findMany({ orderBy: { submittedAt: "desc" }, take: MAX_ROWS });
      count = rows.length;
      csv = toCsv(
        ["Booking ID", "Submitted", "Status", "First name", "Last name", "Email", "Birth name", "Date of birth", "Package", "Price USD", "Timezone", "Session date", "Reading focus", "Notes"],
        rows.map((b) => [b.id, b.submittedAt, b.status, b.firstName, b.lastName, b.clientEmail, b.birthName, b.dateOfBirth, b.packageSelected, b.packagePriceUsd, b.timezone, b.sessionDate, b.readingFocus, b.additionalNotes])
      );
      break;
    }
    case "messages": {
      const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: MAX_ROWS });
      count = rows.length;
      csv = toCsv(
        ["Message ID", "Received", "Status", "Name", "Email", "Subject", "Order number", "Message"],
        rows.map((m) => [m.id, m.createdAt, m.status, m.name, m.email, m.subject, m.orderNumber, m.message])
      );
      break;
    }
    case "subscribers": {
      const rows = await prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" }, take: MAX_ROWS });
      count = rows.length;
      csv = toCsv(
        ["Email", "Status", "Subscribed", "Unsubscribed", "Source"],
        rows.map((s) => [s.email, s.unsubscribedAt ? "unsubscribed" : "active", s.subscribedAt, s.unsubscribedAt, s.source])
      );
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
  }

  await logAudit(`export.${type}`, `Exported ${count} row(s) to CSV`, getClientIp(req));

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(UTF8_BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

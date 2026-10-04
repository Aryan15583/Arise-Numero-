import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { getSiteConfig } from "@/lib/site-config";
import { PrintButton } from "@/components/admin/PrintButton";
import type { ResolvedCartLine } from "@/lib/types";
import "../../admin.css";

export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

const PRINT_CSS = `
  .invoice-page { max-width: 780px; margin: 0 auto; padding: 32px 24px; font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1228; background: #fff; min-height: 100vh; }
  .invoice-page table { width: 100%; border-collapse: collapse; }
  .invoice-page th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a6e8a; border-bottom: 2px solid #ddd6cc; padding: 8px 0; }
  .invoice-page td { padding: 10px 0; border-bottom: 1px solid #eee; vertical-align: top; }
  .invoice-page .right { text-align: right; }
  .invoice-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 32px; }
  .invoice-brand { font-size: 26px; font-weight: 700; color: #b8975a; }
  .invoice-meta { text-align: right; font-size: 14px; line-height: 1.6; }
  .invoice-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 14px; line-height: 1.6; }
  .invoice-cols h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #7a6e8a; margin: 0 0 6px; }
  .invoice-totals { margin-left: auto; width: 280px; margin-top: 16px; font-size: 14px; }
  .invoice-totals td { border: 0; padding: 4px 0; }
  .invoice-totals .grand td { border-top: 2px solid #1a1228; padding-top: 8px; font-size: 16px; font-weight: 700; }
  .invoice-foot { margin-top: 40px; font-size: 12px; color: #7a6e8a; border-top: 1px solid #ddd6cc; padding-top: 12px; }
  @media print { .no-print { display: none !important; } .invoice-page { padding: 0; } body { background: #fff !important; } }
`;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();
  const config = await getSiteConfig();

  let items: ResolvedCartLine[] = [];
  let addr: Record<string, string> = {};
  try {
    items = JSON.parse(order.items || "[]");
  } catch {
    items = [];
  }
  try {
    addr = JSON.parse(order.shippingAddress || "{}");
  } catch {
    addr = {};
  }

  const usd = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="invoice-page">
      <style>{PRINT_CSS}</style>

      <div className="no-print" style={{ marginBottom: 24 }}>
        <PrintButton />
      </div>

      <div className="invoice-head">
        <div>
          <div className="invoice-brand">✦ {config.storeName}</div>
          <div style={{ fontSize: 13, color: "#7a6e8a", marginTop: 4 }}>{config.supportEmail}</div>
        </div>
        <div className="invoice-meta">
          <strong style={{ fontSize: 20 }}>INVOICE</strong>
          <br />
          No. <code>{order.id}</code>
          <br />
          Date: {order.date.toLocaleDateString(undefined, { dateStyle: "long" })}
          <br />
          Status: {order.status}
        </div>
      </div>

      <div className="invoice-cols">
        <div>
          <h3>Billed to</h3>
          {order.customerName || "—"}
          <br />
          {order.customerEmail || ""}
          {order.customerPhone && (
            <>
              <br />
              {order.customerPhone}
            </>
          )}
        </div>
        <div>
          <h3>Ship to</h3>
          {addr.address1 ? (
            <>
              {addr.firstName} {addr.lastName}
              <br />
              {addr.address1}
              {addr.address2 ? `, ${addr.address2}` : ""}
              <br />
              {addr.city}, {addr.state} {addr.postalCode}
              <br />
              {addr.country}
            </>
          ) : (
            "—"
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th className="right">Qty</th>
            <th className="right">Price</th>
            <th className="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx}>
              <td>{i.name}</td>
              <td className="right">{i.qty}</td>
              <td className="right">{usd(i.priceUsd)}</td>
              <td className="right">{usd(i.priceUsd * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="invoice-totals">
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td className="right">{usd(order.subtotalUsd)}</td>
          </tr>
          {order.discountUsd > 0 && (
            <tr>
              <td>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td>
              <td className="right">−{usd(order.discountUsd)}</td>
            </tr>
          )}
          <tr>
            <td>Shipping</td>
            <td className="right">{order.shippingUsd === 0 ? "Free" : usd(order.shippingUsd)}</td>
          </tr>
          <tr className="grand">
            <td>Total (USD)</td>
            <td className="right">{usd(order.totalUsd)}</td>
          </tr>
        </tbody>
      </table>

      <div className="invoice-foot">
        Payment method: {order.paymentMethod || "—"}
        {order.trackingNumber ? ` · Tracking: ${order.carrier ? `${order.carrier} ` : ""}${order.trackingNumber}` : ""}
        <br />
        Thank you for shopping with {config.storeName}.
      </div>
    </div>
  );
}

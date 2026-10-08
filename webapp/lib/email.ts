// Transactional email. Two interchangeable providers, inert until configured —
// same pattern as the PayPal/Cashfree integrations:
//   1. SMTP (SMTP_HOST/PORT/USER/PASS) — e.g. a Gmail account + App Password.
//      The simplest way to get the admin login code into a real inbox.
//   2. Resend (RESEND_API_KEY).
// If both are set, SMTP wins. If neither is, we log instead of sending so the
// rest of the app (orders, bookings, contact) keeps working with zero setup.

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import { getSiteUrl } from "./seo";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Arise Numero <onboarding@resend.dev>";
const ADMIN_NOTIFY_ADDRESS = process.env.ADMIN_NOTIFY_EMAIL || null;

// Every email template below interpolates user-supplied text (names, contact
// messages, review comments) into an HTML string. Without escaping, a
// customer could put `<img src=x onerror=...>` in their name or message and
// have it execute in the admin's email client when the notification is
// opened. Escape anything that didn't originate from our own server logic
// before it goes into an `html:` string.
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function smtpConfig() {
  const pass = process.env.SMTP_PASS?.split(" ").join(""); // Google shows app passwords as 4 spaced groups
  if (!pass) return null;
  // Setting only SMTP_PASS (a Gmail App Password) is enough: host and account
  // default to Gmail and the admin address.
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const user = process.env.SMTP_USER?.trim() || process.env.ADMIN_LOGIN_EMAIL?.trim() || "arisenumero@gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10) || 465;
  return { host, user, pass, port };
}

export type EmailProvider = "smtp" | "resend" | null;

export function emailProvider(): EmailProvider {
  if (smtpConfig()) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  return null;
}

export type SendEmailResult = "sent" | "not_configured" | "failed";

export function isEmailConfigured(): boolean {
  return emailProvider() !== null;
}

let smtpTransport: Transporter | null = null;
let smtpTransportKey = "";
function getSmtpTransport(cfg: NonNullable<ReturnType<typeof smtpConfig>>): Transporter {
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (!smtpTransport || smtpTransportKey !== key) {
    smtpTransport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
      auth: { user: cfg.user, pass: cfg.pass },
      // A wrong host/port must fail fast instead of hanging the login request.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    smtpTransportKey = key;
  }
  return smtpTransport;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<SendEmailResult> {
  const provider = emailProvider();
  if (!provider) {
    console.log(`[email:not-configured] would send to ${opts.to}: ${opts.subject}`);
    return "not_configured";
  }

  try {
    if (provider === "smtp") {
      const cfg = smtpConfig()!;
      await getSmtpTransport(cfg).sendMail({
        from: process.env.SMTP_FROM || `Arise Numero <${cfg.user}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      return "sent";
    }

    // The Resend SDK reports API rejections (unverified sender, bad key, ...)
    // in `error` rather than throwing, so check both.
    const { error } = await getClient()!.emails.send({ from: FROM_ADDRESS, to: opts.to, subject: opts.subject, html: opts.html });
    if (error) {
      console.error("Failed to send email:", error);
      return "failed";
    }
    return "sent";
  } catch (err) {
    // Email failures should never break the order/booking/contact flow itself.
    const code = (err as { code?: string }).code;
    if (provider === "smtp" && code === "EAUTH") {
      console.error(
        "Failed to send email: the SMTP server rejected the login. For Gmail you must use an App Password " +
          "(Google Account → Security → 2-Step Verification → App passwords), not your normal password."
      );
    } else {
      console.error("Failed to send email:", err instanceof Error ? err.message : err);
    }
    return "failed";
  }
}

export async function notifyAdmin(subject: string, html: string): Promise<void> {
  if (!ADMIN_NOTIFY_ADDRESS) return;
  await sendEmail({ to: ADMIN_NOTIFY_ADDRESS, subject, html });
}

export function adminLoginCodeEmail(opts: {
  code: string;
  ttlMinutes: number;
  requestIp: string | null;
}): { subject: string; html: string } {
  return {
    subject: "Your Arise Numero admin login code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h1 style="color:#b8975a;">Arise Numero</h1>
        <p>Use this one-time code to sign in to the admin panel:</p>
        <p style="font-size:30px;letter-spacing:6px;font-family:monospace;font-weight:700;
                  background:#f5f1eb;padding:16px 20px;border-radius:10px;text-align:center;">
          ${escapeHtml(opts.code)}
        </p>
        <p>It expires in ${opts.ttlMinutes} minutes and works <strong>once</strong>.
        Asking for a new code cancels this one.</p>
        <p style="color:#7a6e8a;font-size:13px;">
          Requested from IP ${escapeHtml(opts.requestIp || "unknown")}.
          If this wasn't you, ignore this email — without the code, nobody can sign in.
          Never share this code with anyone.
        </p>
      </div>
    `,
  };
}

function emailShell(inner: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1a1228;">
      <h1 style="color:#b8975a;">Arise Numero</h1>
      ${inner}
      <p style="color:#7a6e8a;font-size:12px;margin-top:32px;">Arise Numero · Authentic crystal bracelets &amp; numerology readings</p>
    </div>
  `;
}

export type EmailOrder = {
  id: string;
  customerName: string | null;
  totalUsd: number;
  paymentMethod: string | null;
  items?: string | null; // the order's JSON items string
  trackingNumber?: string | null;
  carrier?: string | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bank_transfer: "Bank transfer",
  paypal: "PayPal",
  cashfree: "UPI / card (Cashfree)",
};

function itemsTable(itemsJson?: string | null): string {
  try {
    const items = JSON.parse(itemsJson || "[]") as { name: string; qty: number; priceUsd: number }[];
    if (!Array.isArray(items) || items.length === 0) return "";
    const rows = items
      .map((i) => {
        const qty = Number(i.qty) || 0;
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${escapeHtml(i.name)} × ${qty}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">$${((Number(i.priceUsd) || 0) * qty).toFixed(2)}</td></tr>`;
      })
      .join("");
    return `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">${rows}</table>`;
  } catch {
    return "";
  }
}

function trackButton(orderId: string): string {
  const url = `${getSiteUrl()}/track-order?id=${encodeURIComponent(orderId)}`;
  return `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#b8975a;color:#1a1228;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Track your order</a></p>`;
}

export function orderConfirmationEmail(
  order: EmailOrder,
  opts: { bankInstructions?: string } = {}
): { subject: string; html: string } {
  const bank =
    order.paymentMethod === "bank_transfer"
      ? `<h3 style="margin-bottom:4px;">Pay by bank transfer</h3>
         <p style="white-space:pre-wrap;background:#f5f1eb;padding:12px 14px;border-radius:8px;">${escapeHtml(
           opts.bankInstructions?.trim() || "We'll email you our bank details shortly."
         )}</p>
         <p>Please use <strong>${escapeHtml(order.id)}</strong> as the payment reference. Your order ships once the payment arrives.</p>`
      : "";
  const cod = order.paymentMethod === "cod" ? "<p>Please have the exact amount ready for Cash on Delivery.</p>" : "";

  return {
    subject: `Order Confirmed — ${order.id}`,
    html: emailShell(`
      <p>Hi ${escapeHtml(order.customerName || "there")},</p>
      <p>Thank you for your order! Order <strong>${escapeHtml(order.id)}</strong> is confirmed.</p>
      ${itemsTable(order.items)}
      <p><strong>Total: $${order.totalUsd.toFixed(2)}</strong> · Payment: ${escapeHtml(
        PAYMENT_LABELS[order.paymentMethod || ""] || order.paymentMethod || "—"
      )}</p>
      ${bank}${cod}
      ${trackButton(order.id)}
      <p>We'll email you again as soon as your order ships.</p>
    `),
  };
}

/** Customer email for an order status change; null for statuses we don't email about. */
export function orderStatusEmail(
  order: EmailOrder,
  status: string,
  message?: string | null
): { subject: string; html: string } | null {
  const note = message?.trim() ? `<p style="background:#f5f1eb;padding:10px 14px;border-radius:8px;">${escapeHtml(message.trim())}</p>` : "";
  const hi = `<p>Hi ${escapeHtml(order.customerName || "there")},</p>`;
  const id = escapeHtml(order.id);

  switch (status) {
    case "paid":
      return {
        subject: `Payment received — ${order.id}`,
        html: emailShell(`${hi}<p>We've received your payment for order <strong>${id}</strong> and are getting it ready to ship.</p>${note}${trackButton(order.id)}`),
      };
    case "shipped": {
      const tracking = order.trackingNumber
        ? `<p><strong>Tracking number:</strong> ${escapeHtml(order.trackingNumber)}${order.carrier ? ` (${escapeHtml(order.carrier)})` : ""}</p>`
        : "";
      return {
        subject: `Your order ${order.id} has shipped`,
        html: emailShell(`${hi}<p>Good news — order <strong>${id}</strong> is on its way!</p>${tracking}${note}${trackButton(order.id)}`),
      };
    }
    case "completed":
      return {
        subject: `Your order ${order.id} is complete`,
        html: emailShell(`${hi}<p>Order <strong>${id}</strong> is complete. We hope you love your crystals — if you do, a review on the product page means the world to us.</p>${note}`),
      };
    case "cancelled":
      return {
        subject: `Your order ${order.id} was cancelled`,
        html: emailShell(`${hi}<p>Order <strong>${id}</strong> has been cancelled. If you already paid online, any refund is returned to your original payment method.</p>${note}<p>If this is unexpected, just reply to this email or contact us.</p>`),
      };
    default:
      return null;
  }
}

export function newsletterWelcomeEmail(opts: {
  unsubscribeUrl: string;
  couponCode?: string | null;
  discountPercent?: number | null;
}): { subject: string; html: string } {
  const offer = opts.couponCode
    ? `<p>As a thank-you, use code <strong style="font-size:18px;letter-spacing:2px;">${escapeHtml(opts.couponCode)}</strong>${
        opts.discountPercent ? ` for ${opts.discountPercent}% off` : ""
      } on your first order.</p>`
    : "";
  return {
    subject: "Welcome to Arise Numero ✦",
    html: emailShell(`
      <p>Thanks for subscribing! You'll hear from us about new crystal collections and numerology insights — never spam.</p>
      ${offer}
      <p style="font-size:12px;color:#7a6e8a;">Changed your mind? <a href="${escapeHtml(opts.unsubscribeUrl)}">Unsubscribe</a> any time.</p>
    `),
  };
}

export function bookingConfirmationEmail(booking: {
  id: string;
  packageSelected: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed — ${booking.packageSelected || "Numerology Reading"}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h1 style="color:#b8975a;">Arise Numero</h1>
        <p>Thank you for booking a <strong>${escapeHtml(booking.packageSelected || "numerology reading")}</strong>.</p>
        <p>We'll be in touch within 24 hours to confirm the details.</p>
      </div>
    `,
  };
}

export function backInStockEmail(opts: { productName: string; productUrl: string }): { subject: string; html: string } {
  return {
    subject: `Back in stock: ${opts.productName}`,
    html: emailShell(`
      <p>Good news — <strong>${escapeHtml(opts.productName)}</strong> is back in stock.</p>
      <p>You asked us to let you know. Stock is limited, so it may sell out again soon.</p>
      <p><a href="${escapeHtml(opts.productUrl)}" style="display:inline-block;background:#b8975a;color:#1a1228;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Shop it now</a></p>
      <p style="font-size:12px;color:#7a6e8a;">This was a one-time alert — we won't email you about this product again.</p>
    `),
  };
}

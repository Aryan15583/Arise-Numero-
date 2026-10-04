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
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.split(" ").join(""); // Google shows app passwords as 4 spaced groups
  if (!host || !user || !pass) return null;
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

export function orderConfirmationEmail(order: {
  id: string;
  customerName: string | null;
  totalUsd: number;
  paymentMethod: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Order Confirmed — ${order.id}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h1 style="color:#b8975a;">Arise Numero</h1>
        <p>Hi ${escapeHtml(order.customerName || "there")},</p>
        <p>Thank you for your order! Your order <strong>${escapeHtml(order.id)}</strong> for
        <strong>$${order.totalUsd.toFixed(2)}</strong> has been confirmed.</p>
        <p>Payment method: ${escapeHtml(order.paymentMethod || "—")}</p>
        <p>We'll email you again once your order ships.</p>
      </div>
    `,
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

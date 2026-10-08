import { z } from "zod";

// ── Public ────────────────────────────────────────────────────────────────

export const cartLineSchema = z.object({
  id: z.string().min(1),
  qty: z.number().int().positive().max(10),
});

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(60),
});

export const orderCreateSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  couponCode: z.string().max(40).optional().nullable(),
  shippingMethod: z.enum(["standard", "express"]).optional(),
  paymentMethod: z.enum(["cod", "bank_transfer"]).optional(),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
  }),
  shipping: shippingAddressSchema.partial().optional(),
});

export const bookingCreateSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  clientEmail: z.string().email(),
  birthName: z.string().min(1).max(200),
  dateOfBirth: z.string().min(1),
  packageSelected: z.string().max(60).optional().nullable(),
  timezone: z.string().max(60).optional().nullable(),
  sessionDate: z.string().max(30).optional().nullable(),
  readingFocus: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  additionalNotes: z.string().max(2000).optional().nullable(),
});

export const contactCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().max(60).optional().nullable(),
  orderNumber: z.string().max(60).optional().nullable(),
  message: z.string().min(1).max(5000),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1).max(40),
  // Cart subtotal in USD, so a minimum-order rule can be checked in the cart.
  subtotalUsd: z.number().min(0).max(1_000_000).optional(),
});

export const reviewCreateSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(1).max(120),
  authorEmail: z.string().email().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(150).optional().nullable(),
  comment: z.string().min(1).max(3000),
});

// ── Admin auth ────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  code: z.string().min(4, "Enter the code from your email.").max(32),
});

// ── Admin products ────────────────────────────────────────────────────────

// A product image is an uploaded photo (/api/images/<id>), a file in /public
// (e.g. /assets/products/x.jpg) or a full https:// URL — nothing else.
const imageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/.test(v), {
    message: "Image must be an uploaded image, a site path like /assets/x.jpg, or an https:// URL.",
  });

export const adminProductCreateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  material: z.string().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  priceUsd: z.number().min(0),
  originalPriceUsd: z.number().min(0).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  beadSize: z.string().max(20).optional().nullable(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  imageUrl: imageUrlSchema.optional().nullable(),
  images: z.array(imageUrlSchema).max(4, "A product can have at most 4 images.").optional(),
  badge: z.string().max(40).optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const adminProductUpdateSchema = adminProductCreateSchema.partial().omit({ id: true });

export const adminStockUpdateSchema = z.object({
  stock: z.number().int().min(0),
});

// ── Admin orders ──────────────────────────────────────────────────────────

export const adminOrderCreateSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().max(30).optional().nullable(),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  items: z.array(z.unknown()).optional(),
  subtotalUsd: z.number().min(0).optional(),
  discountUsd: z.number().min(0).optional(),
  couponCode: z.string().max(40).optional().nullable(),
  shippingUsd: z.number().min(0).optional(),
  totalUsd: z.number().min(0),
  status: z.string().max(20).optional(),
  paymentMethod: z.string().max(30).optional(),
  paymentReference: z.string().max(200).optional().nullable(),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "completed", "cancelled", "failed"]),
  trackingNumber: z.string().trim().max(100).optional().nullable(),
  carrier: z.string().trim().max(60).optional().nullable(),
  // Optional note: shown on the customer's tracking timeline and in the email.
  message: z.string().trim().max(500).optional().nullable(),
  notifyCustomer: z.boolean().optional(),
});

// ── Public: order tracking, newsletter ────────────────────────────────────

export const trackOrderSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  email: z.string().trim().email().max(200),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  // Honeypot: real visitors never see or fill this field, bots do.
  website: z.string().max(200).optional(),
});

export const stockAlertSchema = z.object({
  productId: z.string().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  // Honeypot, same as the newsletter form.
  website: z.string().max(200).optional(),
});

export const newsletterUnsubscribeSchema = z.object({
  token: z.string().trim().min(10).max(100),
});

// ── Admin coupons ─────────────────────────────────────────────────────────

const couponRules = {
  // ISO date or datetime; null clears it. A bare date (YYYY-MM-DD) means "valid through the end of that day".
  expiresAt: z
    .string()
    .max(40)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid expiry date")
    .optional()
    .nullable(),
  maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
  minOrderUsd: z.number().min(0).max(1_000_000).optional().nullable(),
};

export const adminCouponCreateSchema = z.object({
  code: z.string().min(1).max(40),
  discountPercent: z.number().int().min(1).max(100),
  description: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
  ...couponRules,
});

export const adminCouponUpdateSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
  ...couponRules,
});

// ── Admin bookings / messages ─────────────────────────────────────────────

export const adminBookingStatusSchema = z.object({
  status: z.enum(["new", "confirmed", "completed", "cancelled"]),
});

export const adminMessageStatusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});

// ── Admin categories ──────────────────────────────────────────────────────

export const adminCategoryCreateSchema = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema.partial().omit({ slug: true });

// ── Admin reviews ─────────────────────────────────────────────────────────

export const adminReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

// ── Admin site config ─────────────────────────────────────────────────────

export const adminSiteConfigSchema = z.object({
  storeName: z.string().min(1).max(120).optional(),
  supportEmail: z.string().email().optional(),
  standardShippingUsd: z.number().min(0).optional(),
  expressShippingUsd: z.number().min(0).optional(),
  freeShippingThresholdUsd: z.number().min(0).optional(),
  bankTransferInstructions: z.string().max(1000).optional(),
  announcementText: z.string().trim().max(160).optional(),
  announcementLink: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/.test(v), {
      message: "Announcement link must be a site path like /shop or a full https:// URL.",
    })
    .optional(),
  exchangeRates: z
    .object({
      USD: z.number().positive(),
      INR: z.number().positive(),
      EUR: z.number().positive(),
      GBP: z.number().positive(),
      AUD: z.number().positive(),
    })
    .partial()
    .optional(),
});

// ── Cashfree ──────────────────────────────────────────────────────────────

export const cashfreeCreateOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  couponCode: z.string().max(40).optional().nullable(),
  shippingMethod: z.enum(["standard", "express"]).optional(),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().min(6).max(20),
  }),
  shipping: shippingAddressSchema.partial().optional(),
});

// ── Helper ────────────────────────────────────────────────────────────────

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid request.";
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

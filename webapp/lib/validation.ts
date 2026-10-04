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
  imageUrl: z.string().max(500).optional().nullable(),
  images: z.array(z.string().max(500)).optional(),
  badge: z.string().max(40).optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
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
});

// ── Admin coupons ─────────────────────────────────────────────────────────

export const adminCouponCreateSchema = z.object({
  code: z.string().min(1).max(40),
  discountPercent: z.number().int().min(1).max(100),
  description: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

export const adminCouponUpdateSchema = z.object({
  discountPercent: z.number().int().min(1).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
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

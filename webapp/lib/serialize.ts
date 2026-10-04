import type { Product, Order, Booking } from "@prisma/client";
import type { OrderDTO, ProductDTO } from "./types";

export function serializeProduct(p: Product): ProductDTO {
  let images: string[] = [];
  try {
    images = JSON.parse(p.images);
  } catch {
    images = [];
  }
  return {
    id: p.id,
    name: p.name,
    material: p.material,
    description: p.description,
    priceUsd: p.priceUsd,
    originalPriceUsd: p.originalPriceUsd,
    category: p.category,
    beadSize: p.beadSize,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    imageUrl: p.imageUrl,
    images,
    badge: p.badge,
    rating: p.rating,
    reviewCount: p.reviewCount,
    active: p.active,
    featured: p.featured,
  };
}

export function serializeOrder(o: Order): OrderDTO {
  let items = [];
  let shippingAddress = {};
  try {
    items = JSON.parse(o.items);
  } catch {
    items = [];
  }
  try {
    shippingAddress = JSON.parse(o.shippingAddress);
  } catch {
    shippingAddress = {};
  }
  return {
    id: o.id,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress,
    items,
    subtotalUsd: o.subtotalUsd,
    discountUsd: o.discountUsd,
    couponCode: o.couponCode,
    shippingUsd: o.shippingUsd,
    totalUsd: o.totalUsd,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentReference: o.paymentReference,
    date: o.date.toISOString(),
  };
}

export function serializeBooking(b: Booking) {
  return {
    id: b.id,
    firstName: b.firstName,
    lastName: b.lastName,
    clientEmail: b.clientEmail,
    birthName: b.birthName,
    dateOfBirth: b.dateOfBirth,
    packageSelected: b.packageSelected,
    packagePriceUsd: b.packagePriceUsd,
    timezone: b.timezone,
    sessionDate: b.sessionDate,
    readingFocus: b.readingFocus,
    additionalNotes: b.additionalNotes,
    status: b.status,
    submittedAt: b.submittedAt.toISOString(),
  };
}

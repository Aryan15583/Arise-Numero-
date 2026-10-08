import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const MAX_PRODUCT_IMAGES = 4;
// Vercel rejects request bodies over 4.5 MB, so stay safely under it.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const UPLOAD_URL = /^\/api\/images\/([a-z0-9]{20,40})$/;

export function uploadUrl(id: string) {
  return `/api/images/${id}`;
}

/** Ids of uploaded images referenced by a product's image URLs. */
export function uploadedIds(urls: string[]): string[] {
  return urls.map((u) => UPLOAD_URL.exec(u)?.[1]).filter((id): id is string => !!id);
}

/**
 * Works out the real file type from the first bytes instead of trusting the
 * browser-supplied type, so nothing but JPEG/PNG/WebP is ever stored or served
 * (in particular no SVG/HTML, which could carry script).
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * After a product is saved: attach the uploads it now uses and delete uploads
 * it no longer uses (removed in the editor), so the database doesn't fill up
 * with orphaned photos.
 */
export async function syncProductUploads(tx: Prisma.TransactionClient, productId: string, urls: string[]) {
  const ids = uploadedIds(urls);
  if (ids.length) {
    await tx.productImage.updateMany({ where: { id: { in: ids } }, data: { productId } });
  }
  await tx.productImage.deleteMany({ where: { productId, id: { notIn: ids } } });
}

/** Uploads never attached to a product (editor closed without saving) — purge after a day. */
export async function purgeStaleUploads() {
  await prisma.productImage.deleteMany({
    where: { productId: null, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

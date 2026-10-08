import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { MAX_UPLOAD_BYTES, purgeStaleUploads, sniffImageType, uploadUrl } from "@/lib/product-images";

// ADMIN: upload one product photo (multipart field "file", max 4 MB). Stored in the
// database and served from /api/images/<id>. It's linked to a product when
// that product is saved with this URL in its image list.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large — the limit is 4 MB." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffImageType(bytes);
  if (!mimeType) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images can be uploaded." }, { status: 415 });
  }

  const image = await prisma.productImage.create({
    data: { mimeType, size: bytes.length, data: bytes },
    select: { id: true },
  });
  await logAudit("product.image_upload", `Uploaded image ${image.id} (${mimeType}, ${Math.round(bytes.length / 1024)} KB)`, getClientIp(req));
  await purgeStaleUploads();

  return NextResponse.json({ id: image.id, url: uploadUrl(image.id) }, { status: 201 });
}

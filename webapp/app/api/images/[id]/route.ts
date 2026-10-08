import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUBLIC: serves an uploaded product photo. An upload's bytes never change
// (a new photo gets a new id), so browsers and CDNs may cache it for a year.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new NextResponse("Not found", { status: 404 });

  const image = await prisma.productImage.findUnique({ where: { id }, select: { data: true, mimeType: true, size: true } });
  if (!image) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}

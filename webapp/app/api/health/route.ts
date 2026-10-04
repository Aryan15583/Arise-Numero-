import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Basic liveness + DB connectivity check for uptime monitoring / load
// balancer health probes.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, db: "down", time: new Date().toISOString() }, { status: 503 });
  }
}

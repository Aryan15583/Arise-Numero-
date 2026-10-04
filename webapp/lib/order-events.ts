import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type Db = PrismaClient | Prisma.TransactionClient;

/** Appends an entry to the order's customer-visible timeline. Pass `tx` to join a transaction. */
export async function recordOrderEvent(orderId: string, status: string, note?: string | null, db: Db = prisma): Promise<void> {
  await db.orderEvent.create({ data: { orderId, status, note: note || null } });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeBooking } from "@/lib/serialize";

// ADMIN: aggregated stats for the dashboard landing page. Uses count/
// aggregate queries instead of loading full tables into memory — this stays
// fast as products/orders grow into the thousands, unlike `findMany()` +
// JS filtering which would eventually load the whole table on every visit.
const CHART_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  // Start of the day (UTC) CHART_DAYS - 1 days ago, so the chart covers today plus the 13 days before.
  const todayUtc = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  const chartStart = new Date(todayUtc.getTime() - (CHART_DAYS - 1) * DAY_MS);

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    revenueAgg,
    outOfStockCount,
    lowStockProducts,
    recentBookings,
    totalBookingsCount,
    newBookingsCount,
    newMessagesCount,
    pendingReviewsCount,
    pendingOrdersCount,
    activeSubscribers,
    recentPaidOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalUsd: true },
      where: { status: { in: ["paid", "completed", "shipped"] } },
    }),
    prisma.product.count({ where: { stock: 0 } }),
    // SQLite/Prisma can't compare two columns of the same row in `where`
    // (stock <= lowStockThreshold), so pull a small candidate set ordered by
    // stock ascending and filter in JS. Capped at 50 rows regardless of
    // catalogue size, so this stays cheap.
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { stock: "asc" },
      take: 50,
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    }),
    prisma.booking.findMany({ orderBy: { submittedAt: "desc" }, take: 5 }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "new" } }),
    prisma.contactMessage.count({ where: { status: "new" } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.order.findMany({
      where: { date: { gte: chartStart }, status: { in: ["paid", "completed", "shipped"] } },
      select: { date: true, totalUsd: true },
    }),
  ]);

  const revenueByDay = Array.from({ length: CHART_DAYS }, (_, i) => ({
    date: new Date(chartStart.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    revenue: 0,
    orders: 0,
  }));
  for (const o of recentPaidOrders) {
    const day = revenueByDay.find((d) => d.date === o.date.toISOString().slice(0, 10));
    if (day) {
      day.revenue += o.totalUsd;
      day.orders += 1;
    }
  }
  for (const d of revenueByDay) d.revenue = +d.revenue.toFixed(2);

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.lowStockThreshold);

  return NextResponse.json({
    totalProducts,
    activeProducts,
    totalOrders,
    revenue: +(revenueAgg._sum.totalUsd || 0).toFixed(2),
    lowStockCount: lowStock.length,
    outOfStockCount,
    lowStockProducts: lowStock.slice(0, 6).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    totalBookings: totalBookingsCount,
    newBookingsCount,
    recentBookings: recentBookings.map(serializeBooking),
    newMessagesCount,
    pendingReviewsCount,
    pendingOrdersCount,
    activeSubscribers,
    revenueByDay,
  });
}

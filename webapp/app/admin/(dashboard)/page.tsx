"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import type { BookingDTO } from "@/lib/types";

type DashboardData = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  revenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockProducts: { id: string; name: string; stock: number }[];
  totalBookings: number;
  newBookingsCount: number;
  recentBookings: BookingDTO[];
  newMessagesCount: number;
  pendingOrdersCount: number;
  activeSubscribers: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
};

// Dependency-free bar chart (inline SVG) of revenue per day.
function RevenueChart({ days }: { days: DashboardData["revenueByDay"] }) {
  const W = 600;
  const H = 150;
  const gap = 6;
  const bar = (W - gap * (days.length - 1)) / days.length;
  const max = Math.max(...days.map((d) => d.revenue), 1);
  const total = days.reduce((s, d) => s + d.revenue, 0);

  return (
    <svg viewBox={`0 0 ${W} ${H + 26}`} role="img" aria-label={`Revenue over the last ${days.length} days: $${total.toFixed(2)} total`} style={{ width: "100%", height: "auto" }}>
      {days.map((d, i) => {
        const h = d.revenue > 0 ? Math.max(3, Math.round((d.revenue / max) * H)) : 0;
        const x = i * (bar + gap);
        return (
          <g key={d.date}>
            <title>{`${d.date}: $${d.revenue.toFixed(2)} from ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
            <rect x={x} y={0} width={bar} height={H} rx={3} fill="var(--border)" opacity={0.35} />
            {h > 0 && <rect x={x} y={H - h} width={bar} height={h} rx={3} fill="var(--gold)" />}
            {i % 2 === 0 && (
              <text x={x + bar / 2} y={H + 17} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{d.date.slice(5)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateStr] = useState(() =>
    new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );

  useEffect(() => {
    adminFetchJson<DashboardData>("/api/admin/dashboard").then(setData).catch(() => {});
  }, []);

  if (!data) return <p className="page-subtitle">Loading dashboard…</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">{dateStr}</div>
        </div>
        <Link href="/admin/products" className="btn btn-primary">+ Add Product</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-gold">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{data.totalProducts}</div>
          <div className="stat-sub">{data.activeProducts} active</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{data.totalOrders}</div>
          <div className="stat-sub">${data.revenue.toFixed(2)} revenue</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{data.lowStockCount}</div>
          <div className="stat-sub">{data.outOfStockCount} out of stock</div>
        </div>
        <div className="stat-card stat-error">
          <div className="stat-label">Bookings</div>
          <div className="stat-value">{data.totalBookings}</div>
          <div className="stat-sub">{data.newBookingsCount} new</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">💰 Revenue — last {data.revenueByDay.length} days</span>
          <Link href="/admin/orders" className="btn btn-ghost btn-sm">View Orders</Link>
        </div>
        <div className="card-body">
          <RevenueChart days={data.revenueByDay} />
          <p className="page-subtitle" style={{ marginTop: 12 }}>
            Paid, shipped and completed orders only ·{" "}
            <Link href="/admin/orders">{data.pendingOrdersCount} pending order{data.pendingOrdersCount === 1 ? "" : "s"}</Link>{" "}
            awaiting action · <Link href="/admin/subscribers">{data.activeSubscribers} newsletter subscriber{data.activeSubscribers === 1 ? "" : "s"}</Link>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">⚠️ Low Stock Alerts</span>
          <Link href="/admin/stock" className="btn btn-ghost btn-sm">View All Stock</Link>
        </div>
        <div className="card-body">
          {data.lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-title">All stock levels are healthy</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.stock}</td>
                    <td>{p.stock === 0 ? <span className="badge badge-out">Out of Stock</span> : <span className="badge badge-low">Low Stock</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📅 Recent Bookings</span>
          <Link href="/admin/bookings" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        <div className="card-body">
          {data.recentBookings.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No bookings yet</div></div>
          ) : (
            <table>
              <thead><tr><th>Client</th><th>Package</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.clientEmail}</td>
                    <td>{b.packageSelected || "—"}</td>
                    <td>{new Date(b.submittedAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${b.status === "new" ? "badge-gold" : "badge-active"}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

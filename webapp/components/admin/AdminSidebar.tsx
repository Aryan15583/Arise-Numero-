"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { AdminCurrencyPicker } from "./AdminCurrency";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/admin", icon: "📊", label: "Dashboard" }],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", icon: "💎", label: "Products" },
      { href: "/admin/categories", icon: "🗂️", label: "Categories" },
      { href: "/admin/stock", icon: "📦", label: "Stock Levels" },
      { href: "/admin/reviews", icon: "⭐", label: "Reviews" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", icon: "🛍️", label: "Orders" },
      { href: "/admin/coupons", icon: "🏷️", label: "Coupons" },
    ],
  },
  {
    label: "Readings & Inbox",
    items: [
      { href: "/admin/bookings", icon: "📅", label: "Bookings" },
      { href: "/admin/messages", icon: "✉️", label: "Messages" },
      { href: "/admin/subscribers", icon: "📰", label: "Subscribers" },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/admin/audit-log", icon: "🛡️", label: "Audit Log" },
      { href: "/admin/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Phones: the menu folds into a top bar and opens on demand.
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false); // close after choosing a page
  }
  const [counts, setCounts] = useState<{ products: number; orders: number; bookings: number; messages: number; reviews: number }>({
    products: 0,
    orders: 0,
    bookings: 0,
    messages: 0,
    reviews: 0,
  });

  useEffect(() => {
    adminFetchJson<{
      totalProducts: number;
      totalOrders: number;
      totalBookings: number;
      newMessagesCount: number;
      pendingReviewsCount: number;
    }>("/api/admin/dashboard")
      .then((d) =>
        setCounts({
          products: d.totalProducts,
          orders: d.totalOrders,
          bookings: d.totalBookings,
          messages: d.newMessagesCount,
          reviews: d.pendingReviewsCount,
        })
      )
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    if (!confirm("Lock the admin panel?")) return;
    await adminFetchJson("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
  }

  const badgeFor: Record<string, number> = {
    "/admin/products": counts.products,
    "/admin/orders": counts.orders,
    "/admin/bookings": counts.bookings,
    "/admin/messages": counts.messages,
    "/admin/reviews": counts.reviews,
  };

  return (
    <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <div>
          <div className="sidebar-logo">✦ Arise Numero</div>
          <div className="sidebar-subtitle">Admin Panel</div>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={menuOpen}
          aria-controls="admin-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <nav className="sidebar-nav" id="admin-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const badge = badgeFor[item.href];
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                  <span className="nav-icon">{item.icon}</span> {item.label}
                  {badge !== undefined && <span className="nav-badge">{badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <AdminCurrencyPicker />
        <button className="logout-btn" onClick={handleLogout}>🔒 Lock Admin</button>
      </div>
    </aside>
  );
}

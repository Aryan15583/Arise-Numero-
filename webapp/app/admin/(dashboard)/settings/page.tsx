"use client";

import { useEffect, useState } from "react";
import { adminFetchJson } from "@/lib/admin-api";
import { useAdminToast } from "@/components/admin/useAdminToast";

type SiteConfig = {
  storeName: string;
  supportEmail: string;
  standardShippingUsd: number;
  expressShippingUsd: number;
  freeShippingThresholdUsd: number;
  bankTransferInstructions: string;
  exchangeRates: { USD: number; INR: number; EUR: number; GBP: number; AUD: number };
};

type PublicConfig = { paypalClientId: string | null; cashfreeEnabled: boolean; cashfreeMode: string };

export default function AdminSettingsPage() {
  const { showToast, ToastEl } = useAdminToast();

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [publicConfig, setPublicConfig] = useState<PublicConfig | null>(null);
  const [loggingOutEverywhere, setLoggingOutEverywhere] = useState(false);

  useEffect(() => {
    adminFetchJson<SiteConfig>("/api/admin/settings/site").then(setConfig).catch(() => {});
    fetch("/api/config").then((r) => r.json()).then(setPublicConfig).catch(() => {});
  }, []);

  async function logoutEverywhere() {
    if (!confirm("This will sign out every other device/browser currently logged into the admin panel. Continue?")) return;
    setLoggingOutEverywhere(true);
    try {
      await adminFetchJson("/api/admin/logout-everywhere", { method: "POST" });
      showToast("✅ All other sessions have been signed out.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not do that.", "error");
    } finally {
      setLoggingOutEverywhere(false);
    }
  }

  async function saveConfig() {
    if (!config) return;
    setSavingConfig(true);
    try {
      const updated = await adminFetchJson<SiteConfig>("/api/admin/settings/site", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      setConfig(updated);
      showToast("✅ Store settings updated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save settings.", "error");
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <>
      <div className="page-header"><div className="page-title">Settings</div></div>

      <div className="card">
        <div className="card-header"><span className="card-title">🏬 Store Settings</span></div>
        <div className="card-body">
          {!config ? (
            <p className="page-subtitle">Loading…</p>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input className="form-input" value={config.storeName} onChange={(e) => setConfig({ ...config, storeName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input className="form-input" value={config.supportEmail} onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Shipping (USD)</label>
                <input type="number" step="0.01" className="form-input" value={config.standardShippingUsd} onChange={(e) => setConfig({ ...config, standardShippingUsd: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Express Shipping (USD)</label>
                <input type="number" step="0.01" className="form-input" value={config.expressShippingUsd} onChange={(e) => setConfig({ ...config, expressShippingUsd: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Free Shipping Threshold (USD)</label>
                <input type="number" step="0.01" className="form-input" value={config.freeShippingThresholdUsd} onChange={(e) => setConfig({ ...config, freeShippingThresholdUsd: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-full">
                <label className="form-label" htmlFor="bank-instructions">Bank transfer instructions</label>
                <textarea
                  id="bank-instructions"
                  className="form-input"
                  rows={4}
                  maxLength={1000}
                  value={config.bankTransferInstructions || ""}
                  onChange={(e) => setConfig({ ...config, bankTransferInstructions: e.target.value })}
                  placeholder={"Account name, bank, account number / IFSC or IBAN, etc."}
                />
                <p className="form-hint">Shown only to customers who choose bank transfer — in their confirmation email and on the order-confirmed screen. Leave empty to say &quot;we&apos;ll email you our bank details&quot;.</p>
              </div>
              <div className="form-full">
                <label className="form-label" style={{ marginBottom: 8, display: "block" }}>Currency Exchange Rates (per 1 USD)</label>
                <div className="form-grid form-grid-3">
                  {(["INR", "EUR", "GBP", "AUD"] as const).map((code) => (
                    <div className="form-group" key={code}>
                      <label className="form-label">{code}</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={config.exchangeRates[code]}
                        onChange={(e) =>
                          setConfig({ ...config, exchangeRates: { ...config.exchangeRates, [code]: parseFloat(e.target.value) || 0 } })
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="form-hint">Update these periodically — they aren&apos;t pulled from a live feed. Takes effect immediately for all shoppers.</p>
              </div>
              <div className="form-full">
                <button className="btn btn-primary" onClick={saveConfig} disabled={savingConfig}>{savingConfig ? "Saving…" : "Save Store Settings"}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">💳 Payment Gateways</span></div>
        <div className="card-body">
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 16 }}>
            Configured via environment variables (<code>.env</code>), not editable here for security. See <code>TODO.md</code> for setup steps.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${publicConfig?.cashfreeEnabled ? "badge-active" : "badge-inactive"}`}>
                {publicConfig?.cashfreeEnabled ? "Configured" : "Not configured"}
              </span>
              <span>Cashfree (UPI / GPay / Mastercard / Visa) {publicConfig?.cashfreeEnabled && `— ${publicConfig.cashfreeMode} mode`}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`badge ${publicConfig?.paypalClientId ? "badge-active" : "badge-inactive"}`}>
                {publicConfig?.paypalClientId ? "Configured" : "Not configured"}
              </span>
              <span>PayPal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">🛡️ Sign-in, Sessions &amp; Activity</span></div>
        <div className="card-body">
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 12 }}>
            There&apos;s no PIN or password. Each sign-in uses a fresh one-time code emailed to the single admin
            address configured on the server (<code>ADMIN_LOGIN_EMAIL</code>) — it works once, expires in 10 minutes,
            and is replaced every time a new one is requested. Keep that mailbox secure (turn on 2-Step Verification).
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 16 }}>
            If you think a device or browser you used is still signed in and shouldn&apos;t be — a shared/public
            computer, a lost phone — sign out everywhere except this session. Review recent admin activity in the{" "}
            <a href="/admin/audit-log">Audit Log</a>.
          </p>
          <button className="btn btn-danger" onClick={logoutEverywhere} disabled={loggingOutEverywhere}>
            {loggingOutEverywhere ? "Signing out…" : "🚪 Sign Out All Other Sessions"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">ℹ️ About</span></div>
        <div className="card-body">
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong>Arise Numero Admin Panel</strong><br />
            This page is not linked anywhere on the public site.<br />
            Your session is a secure, HTTP-only, SameSite=Strict cookie that expires after 8 hours, and is
            immediately invalidated if you sign out other sessions.<br />
            Login codes and attempts are rate-limited, and repeated wrong codes lock out the offending IP.<br />
            All data is stored in the SQLite database via Prisma — see <code>prisma/schema.prisma</code>.
          </p>
        </div>
      </div>

      {ToastEl}
    </>
  );
}

import { prisma } from "./db";

// Site-wide operational settings, editable from Admin → Settings without a
// redeploy. Stored as one JSON blob in admin_settings (key = "site_config")
// so adding a new field later is a one-line change here, not a migration.
export type SiteConfig = {
  storeName: string;
  supportEmail: string;
  standardShippingUsd: number;
  expressShippingUsd: number;
  freeShippingThresholdUsd: number;
  exchangeRates: { USD: number; INR: number; EUR: number; GBP: number; AUD: number };
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  storeName: "Arise Numero",
  supportEmail: "hello@arisenumero.com",
  standardShippingUsd: 5.99,
  expressShippingUsd: 14.99,
  freeShippingThresholdUsd: 50,
  exchangeRates: { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, AUD: 1.53 },
};

const SITE_CONFIG_KEY = "site_config";

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await prisma.adminSetting.findUnique({ where: { key: SITE_CONFIG_KEY } });
  if (!row) return DEFAULT_SITE_CONFIG;
  try {
    return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

type PartialSiteConfig = Partial<Omit<SiteConfig, "exchangeRates">> & {
  exchangeRates?: Partial<SiteConfig["exchangeRates"]>;
};

export async function setSiteConfig(partial: PartialSiteConfig): Promise<SiteConfig> {
  const current = await getSiteConfig();
  const next: SiteConfig = {
    ...current,
    ...partial,
    exchangeRates: { ...current.exchangeRates, ...partial.exchangeRates },
  };
  await prisma.adminSetting.upsert({
    where: { key: SITE_CONFIG_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SITE_CONFIG_KEY, value: JSON.stringify(next) },
  });
  return next;
}

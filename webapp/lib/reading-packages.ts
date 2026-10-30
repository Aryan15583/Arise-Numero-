// The numerology reading plans. One list, used by the booking page, the
// booking API (prices are always taken from here, never from the browser)
// and the guide pages that promote them.
export type ReadingPackage = {
  key: "core" | "full" | "premium";
  name: string;
  price: number; // USD
  /** One line for promo cards on guide pages. */
  pitch: string;
  features: string[];
  popular: boolean;
};

export const READING_PACKAGES: ReadingPackage[] = [
  {
    key: "core",
    name: "Core Blueprint",
    price: 49.99,
    pitch: "Your three core numbers, decoded in a written report.",
    features: [
      "Life Path Number Analysis",
      "Expression Number Report",
      "Soul Urge Number Insight",
      "Written PDF Report (10–12 pages)",
      "Delivered in 3–5 business days",
    ],
    popular: false,
  },
  {
    key: "full",
    name: "Full Numeroscope",
    price: 89.99,
    pitch: "Your complete chart plus what the year ahead holds for you.",
    features: [
      "Everything in Core Blueprint",
      "Personal Year & Monthly Forecast",
      "Birthday & Personality Numbers",
      "Compatibility Overview",
      "Comprehensive PDF (20–25 pages)",
      "Delivered in 5–7 business days",
    ],
    popular: true,
  },
  {
    key: "premium",
    name: "Premium + Live Session",
    price: 149.99,
    pitch: "Everything, plus a live one-to-one session with your numerologist.",
    features: [
      "Everything in Full Numeroscope",
      "45-minute live video session",
      "Career & Life Purpose Deep Dive",
      "Q&A with your numerologist",
      "Session recording provided",
      "Scheduled at your convenience",
    ],
    popular: false,
  },
];

export function getReadingPackage(key: string | null | undefined): ReadingPackage | null {
  return READING_PACKAGES.find((p) => p.key === key) ?? null;
}

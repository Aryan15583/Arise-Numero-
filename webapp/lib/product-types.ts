// What kind of item a product is. Separate from `category`, which is the
// stone (Amethyst, Lapis Lazuli…), so a shopper can browse "all Pendants" or
// "everything in Amethyst". Each type has its own landing page: /shop?type=<slug>.
export type ProductTypeInfo = {
  slug: string;
  name: string; // plural, used for headings and the filter
  singular: string;
  description: string;
  /** Strung items: show bead size and the wrist-size picker on the product page. */
  beaded: boolean;
};

export const PRODUCT_TYPES: ProductTypeInfo[] = [
  {
    slug: "bracelets",
    name: "Bracelets",
    singular: "Bracelet",
    description: "Handcrafted stretch bracelets strung with natural gemstone beads.",
    beaded: true,
  },
  {
    slug: "pyramid-bracelets",
    name: "Pyramid Bracelets",
    singular: "Pyramid Bracelet",
    description: "Gemstone bead bracelets finished with a pyramid charm.",
    beaded: true,
  },
  {
    slug: "pendants",
    name: "Pendants",
    singular: "Pendant",
    description: "Polished natural stone pendants to wear close every day.",
    beaded: false,
  },
  {
    slug: "rings",
    name: "Rings",
    singular: "Ring",
    description: "Natural gemstone rings in a range of stones.",
    beaded: false,
  },
  {
    slug: "pencils",
    name: "3 Inch Pencils",
    singular: "Pencil",
    description: "Six-sided polished crystal points, about 3 inches tall, for your desk, altar or meditation space.",
    beaded: false,
  },
  {
    slug: "anklets",
    name: "Anklets",
    singular: "Anklet",
    description: "Delicate gemstone bead anklets.",
    beaded: true,
  },
  {
    slug: "rudraksha",
    name: "Rudraksha",
    singular: "Rudraksha",
    description: "Natural Rudraksha beads, traditionally worn for prayer and meditation.",
    beaded: false,
  },
  {
    slug: "bowls-plates",
    name: "Bowls & Plates",
    singular: "Bowl / Plate",
    description: "Crystal bowls and plates for display, cleansing and charging your stones.",
    beaded: false,
  },
  {
    slug: "certificates",
    name: "Certificates",
    singular: "Certificate",
    description: "Certificates of authenticity for your crystals.",
    beaded: false,
  },
];

const BY_SLUG = new Map(PRODUCT_TYPES.map((t) => [t.slug, t]));

export function getProductType(slug: string | null | undefined): ProductTypeInfo | null {
  return slug ? BY_SLUG.get(slug) ?? null : null;
}

export const PRODUCT_TYPE_SLUGS = PRODUCT_TYPES.map((t) => t.slug) as [string, ...string[]];

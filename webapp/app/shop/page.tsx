import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ShopClient } from "@/components/ShopClient";
import { getProductType, type ProductTypeInfo } from "@/lib/product-types";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, productPath, truncate } from "@/lib/seo";

type Props = { searchParams: Promise<{ cat?: string; q?: string; type?: string }> };

const SHOP_DESCRIPTION =
  "Shop authentic crystals at Arise Numero — bracelets, pendants, rings, 3 inch pencils, anklets, Rudraksha, bowls & plates. Ships worldwide.";

// Each product type (/shop?type=pendants), stone (/shop?cat=amethyst) and the two
// combined is its own indexable landing page with its own title and canonical
// URL; unknown/garbage values fall back to the full shop.
async function getCategory(cat: string | undefined) {
  if (!cat) return null;
  return prisma.category.findFirst({ where: { slug: cat, active: true } });
}

function landing(type: ProductTypeInfo | null, category: { slug: string; name: string; description: string | null } | null) {
  const params = new URLSearchParams();
  if (type) params.set("type", type.slug);
  if (category) params.set("cat", category.slug);
  const qs = params.toString();
  const path = qs ? `/shop?${qs}` : "/shop";
  const heading =
    type && category ? `${category.name} ${type.name}`
    : type ? type.name
    : category ? `${category.name} Crystals`
    : "Shop All Crystals";
  const description =
    type && category ? `Shop natural ${category.name} ${type.name.toLowerCase()} at Arise Numero. ${category.description || ""} Ships worldwide.`
    : type ? `${type.description} Shop ${type.name.toLowerCase()} at Arise Numero. Ships worldwide.`
    : category ? `${category.description ? `${category.description} ` : ""}Shop natural ${category.name} bracelets, pendants, rings and more. Ships worldwide.`
    : SHOP_DESCRIPTION;
  return { path, heading, description: truncate(description) };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat, q, type } = await searchParams;
  // Internal search-result pages are thin/duplicate content: keep them out of Google.
  if (q?.trim()) {
    return pageMetadata({ title: "Search", description: SHOP_DESCRIPTION, path: "/shop", noindex: true });
  }
  const page = landing(getProductType(type), await getCategory(cat));
  return pageMetadata({ title: page.heading, description: page.description, path: page.path });
}

export default async function ShopPage({ searchParams }: Props) {
  const { cat, q, type } = await searchParams;
  const productType = getProductType(type);
  const [rows, categories, category] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    getCategory(cat),
  ]);
  const products = rows.map(serializeProduct);
  const listed = products.filter(
    (p) => (!category || p.category === category.slug) && (!productType || p.productType === productType.slug)
  );

  const { heading, path: pagePath } = landing(productType, category);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heading,
    url: absoluteUrl(pagePath),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: listed.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(productPath(p.id)),
        name: p.name,
      })),
    },
  };

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          ...(productType || category ? [{ name: heading, path: pagePath }] : []),
        ])}
      />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            {productType || category ? (
              <>
                <li><Link href="/shop">Shop</Link></li>
                <li aria-current="page">{heading}</li>
              </>
            ) : (
              <li aria-current="page">Shop</li>
            )}
          </ol>
        </nav>

        <div className="page-header container">
          <h1 className="page-title">{heading}</h1>
          <p className="page-subtitle">{productType ? productType.description : "Natural crystals and gemstones. Each piece is unique with natural variations."}</p>
        </div>

        <ShopClient initialProducts={products} initialCat={cat} initialQuery={q} initialType={productType?.slug} categories={categories} />
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ShopClient } from "@/components/ShopClient";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, productPath, truncate } from "@/lib/seo";

type Props = { searchParams: Promise<{ cat?: string }> };

const SHOP_DESCRIPTION =
  "Shop authentic crystal bracelets at Arise Numero. Browse Amethyst, Rose Quartz, Lapis Lazuli, Black Tourmaline and more. Ships worldwide.";

// Each category (/shop?cat=amethyst) is its own indexable landing page with its
// own title and canonical URL; unknown/garbage ?cat= values fall back to /shop.
async function getCategory(cat: string | undefined) {
  if (!cat) return null;
  return prisma.category.findFirst({ where: { slug: cat, active: true } });
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat } = await searchParams;
  const category = await getCategory(cat);
  if (!category) {
    return pageMetadata({ title: "Shop Crystal Bracelets", description: SHOP_DESCRIPTION, path: "/shop" });
  }
  return pageMetadata({
    title: `${category.name} Crystal Bracelets`,
    description: truncate(
      `${category.description ? `${category.description} ` : ""}Shop handcrafted ${category.name} bracelets made with authentic gemstones. Ships worldwide.`
    ),
    path: `/shop?cat=${encodeURIComponent(category.slug)}`,
  });
}

export default async function ShopPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const [rows, categories, category] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    getCategory(cat),
  ]);
  const products = rows.map(serializeProduct);
  const listed = category ? products.filter((p) => p.category === category.slug) : products;

  const heading = category ? `${category.name} Crystal Bracelets` : "Crystal Bracelet Collection";
  const pagePath = category ? `/shop?cat=${encodeURIComponent(category.slug)}` : "/shop";

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
          ...(category ? [{ name: category.name, path: pagePath }] : []),
        ])}
      />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Shop</li>
          </ol>
        </nav>

        <div className="page-header container">
          <h1 className="page-title">{heading}</h1>
          <p className="page-subtitle">Handcrafted with authentic gemstones. Each piece is unique with natural variations.</p>
        </div>

        <ShopClient initialProducts={products} initialCat={cat} categories={categories} />
      </main>
      <Footer />
    </>
  );
}

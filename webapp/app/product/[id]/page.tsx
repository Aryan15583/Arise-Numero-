import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductCard } from "@/components/ProductCard";
import { getProductType } from "@/lib/product-types";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadata, productPath, truncate } from "@/lib/seo";

// generateMetadata and the page both need the row; cache() makes it one query.
const getProduct = cache(async (id: string) => prisma.product.findUnique({ where: { id } }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const row = await getProduct(id);
  if (!row || !row.active) return { title: "Product not found", robots: { index: false, follow: false } };

  const type = getProductType(row.productType);
  const title = !type || row.name.toLowerCase().includes(type.singular.toLowerCase()) ? row.name : `${row.name} ${type.singular}`;
  const description = truncate(row.description) || `${row.name} — ${row.material || "natural crystal"}. Ships worldwide.`;
  return pageMetadata({
    title,
    description,
    path: productPath(row.id),
    image: { url: `${productPath(row.id)}/opengraph-image`, width: 1200, height: 630, alt: `${row.name} — ${SITE_NAME}` },
  });
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getProduct(id);
  // Hidden (inactive) products must not be reachable by URL.
  if (!row || !row.active) notFound();
  const product = serializeProduct(row);
  const productType = getProductType(product.productType);

  const [relatedRows, categoryRow, reviewStats] = await Promise.all([
    // Same crystal type first, then fill up with other bestsellers/featured pieces.
    prisma.product.findMany({
      where: { active: true, id: { not: product.id } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    }),
    product.category ? prisma.category.findUnique({ where: { slug: product.category } }) : Promise.resolve(null),
    // Structured data only ever uses real, moderator-approved customer reviews.
    prisma.review.aggregate({
      where: { productId: product.id, status: "approved" },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  // Same type and stone first, then same type, then same stone, then the rest.
  const score = (p: (typeof relatedRows)[number]) =>
    (p.productType === product.productType ? 2 : 0) + (p.category && p.category === product.category ? 1 : 0);
  const related = [...relatedRows]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map(serializeProduct);

  const url = absoluteUrl(productPath(product.id));
  const imageUrls = [...new Set([product.imageUrl, ...product.images].filter((u): u is string => !!u))].map(absoluteUrl);
  const reviewCount = reviewStats._count.rating;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: truncate(product.description, 500) || undefined,
    sku: product.id,
    url,
    image: imageUrls.length ? imageUrls : undefined,
    material: product.material || undefined,
    category: categoryRow?.name || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    // Price-on-request items have no Offer (Google rejects a price of 0).
    ...(product.priceUsd > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "USD",
            price: product.priceUsd.toFixed(2),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
    ...(reviewCount > 0 && reviewStats._avg.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(reviewStats._avg.rating.toFixed(2)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          ...(productType ? [{ name: productType.name, path: `/shop?type=${productType.slug}` }] : []),
          { name: product.name, path: productPath(product.id) },
        ])}
      />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            {productType && <li><Link href={`/shop?type=${productType.slug}`}>{productType.name}</Link></li>}
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <ProductDetailClient product={product} />

        <section className="section related-products" aria-labelledby="related-heading">
          <div className="container">
            <h2 id="related-heading" className="section-title">You May Also Like</h2>
            <div className="product-grid" role="list" aria-label="Related products">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        <RecentlyViewed currentId={product.id} />
      </main>
      <Footer />
    </>
  );
}

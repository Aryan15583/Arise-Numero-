import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { GuideDisclaimer } from "@/components/guides/GuideDisclaimer";
import { CRYSTAL_GUIDES, crystalPath, getCrystalGuide } from "@/lib/guides/crystals";
import { lifePathPath, lifePathsForCrystal, getLifePathGuide } from "@/lib/guides/life-path";
import { getStoneProducts } from "@/lib/guides/data";
import { thumbnailFor } from "@/lib/product-thumbs";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return CRYSTAL_GUIDES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getCrystalGuide((await params).slug);
  if (!guide) return {};
  return pageMetadata({
    title: `${guide.name} Meaning, Benefits & How to Use It`,
    description: `${guide.name}: ${guide.tagline.toLowerCase()}. Its traditional meaning, benefits, who should wear it, how to cleanse it and natural ${guide.name} jewellery to shop.`,
    path: crystalPath(guide.slug),
  });
}

export default async function CrystalGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getCrystalGuide((await params).slug);
  if (!guide) notFound();
  const products = await getStoneProducts([guide.slug], 8);
  const heroImage = products.find((p) => p.imageUrl)?.imageUrl ?? null;
  const lifePaths = lifePathsForCrystal(guide.slug);
  const pairs = guide.pairsWith.map(getCrystalGuide).filter((c) => c !== null);

  const facts: [string, React.ReactNode][] = [
    ["Colour", guide.colour],
    ["Chakra", guide.chakra],
    ["Zodiac", guide.zodiac.join(", ")],
    ["Element", guide.element],
  ];
  if (lifePaths.length) {
    facts.push([
      "Life Path",
      lifePaths.map((n, i) => (
        <span key={n}>{i > 0 && ", "}<Link href={lifePathPath(n)}>{n} ({getLifePathGuide(n)?.title})</Link></span>
      )),
    ]);
  }

  const cleanseSteps = [
    guide.waterSafe ? { title: "Rinse", text: "Hold it under cool running water for a minute, then pat it completely dry." } : { title: "Keep it dry", text: `${guide.name} shouldn't be soaked in water. Wipe it gently with a soft, dry cloth instead.` },
    { title: "Smoke", text: "Pass it through the smoke of incense, sage or palo santo while setting a clear intention." },
    guide.sunSafe ? { title: "Sun or moonlight", text: "Leave it in gentle morning sunlight or under the full moon to recharge." } : { title: "Moonlight", text: "Recharge it overnight under the moon. Avoid long hours in direct sun, which can fade its colour." },
    ...(guide.slug !== "selenite" ? [{ title: "Selenite plate", text: "Rest it on a Selenite plate overnight, one of the easiest ways to cleanse and recharge any crystal." }] : []),
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.name} Meaning, Benefits & How to Use It`,
    description: guide.intro[0],
    url: absoluteUrl(crystalPath(guide.slug)),
    ...(heroImage ? { image: absoluteUrl(heroImage) } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/assets/brand/icon-512.png") } },
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.name, path: crystalPath(guide.slug) },
        ])}
      />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/guides#crystals">Crystal Guide</Link></li>
            <li aria-current="page">{guide.name}</li>
          </ol>
        </nav>

        <section className="section guide-crystal-hero" aria-labelledby="crystal-heading">
          <div className="container guide-crystal-hero-inner">
            <div className="guide-crystal-media">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailFor(heroImage) ?? heroImage} alt={`Natural ${guide.name}`} width={640} height={640} />
              ) : (
                <div className="guide-crystal-media-empty" aria-hidden="true"><Icon name="gem" size={64} /></div>
              )}
            </div>
            <div className="guide-crystal-text">
              <p className="eyebrow">Crystal Guide</p>
              <h1 id="crystal-heading" className="guide-title guide-title--dark">{guide.name} Meaning &amp; Benefits</h1>
              <p className="guide-tagline">{guide.tagline}</p>
              {guide.intro.map((p) => <p key={p} className="guide-crystal-intro">{p}</p>)}
              <dl className="guide-facts">
                {facts.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              {products.length > 0 && (
                <a href="#shop-stone" className="btn btn-primary btn-lg">Shop {guide.name} <Icon name="arrowRight" size={16} /></a>
              )}
            </div>
          </div>
        </section>

        <section className="section guide-associations-section" aria-labelledby="assoc-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Meaning</p>
              <h2 id="assoc-heading" className="section-title">What {guide.name} is known for</h2>
              <p className="section-subtitle">The properties traditionally associated with {guide.name} across crystal and spiritual practice.</p>
            </div>
            <div className="guide-assoc-grid" role="list">
              {guide.associations.map((a) => (
                <div key={a.title} className="guide-assoc" role="listitem">
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-label={`Wearing ${guide.name}`}>
          <div className="container guide-two-col">
            <div className="guide-panel">
              <h2>Who should wear {guide.name}?</h2>
              <ul className="guide-check-list">
                {guide.whoShouldWear.map((w) => <li key={w}><Icon name="check" size={18} /> {w}</li>)}
                {lifePaths.length > 0 && (
                  <li><Icon name="check" size={18} /> Life Path {lifePaths.join(", ")}, the numbers traditionally drawn to {guide.name}</li>
                )}
              </ul>
            </div>
            <div className="guide-panel">
              <h2>How to wear it</h2>
              <p>{guide.howToWear}</p>
              <h3 className="guide-panel-sub">Care tip</h3>
              <p>{guide.care}</p>
            </div>
          </div>
        </section>

        <section className="section guide-cleanse" aria-labelledby="cleanse-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Care</p>
              <h2 id="cleanse-heading" className="section-title">How to cleanse &amp; charge {guide.name}</h2>
              <p className="section-subtitle">Cleanse your crystal when it first arrives, then every few weeks or whenever it feels dull.</p>
            </div>
            <ol className="guide-steps" role="list">
              {cleanseSteps.map((s, i) => (
                <li key={s.title}>
                  <span className="guide-step-num" aria-hidden="true">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            {guide.slug !== "selenite" && (
              <p className="guide-inline-promo">
                <Icon name="sparkle" size={16} /> Shop our <Link href="/guides/crystals/selenite">Selenite plates</Link> and{" "}
                <Link href="/shop?type=bowls-plates">crystal bowls</Link> for easy cleansing at home.
              </p>
            )}
          </div>
        </section>

        {products.length > 0 && (
          <section className="section" id="shop-stone" aria-labelledby="shop-stone-heading">
            <div className="container">
              <div className="section-header">
                <p className="eyebrow">Shop</p>
                <h2 id="shop-stone-heading" className="section-title">Natural {guide.name} pieces</h2>
                <p className="section-subtitle">Every piece is natural, so colour and markings vary slightly from the photos.</p>
              </div>
              <div className="product-grid" role="list">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="section-cta">
                <Link href={`/shop?cat=${guide.slug}`} className="btn btn-outline btn-lg">View all {guide.name}</Link>
              </div>
            </div>
          </section>
        )}

        <section className="section guide-band" aria-labelledby="match-heading">
          <div className="container guide-band-inner">
            <div>
              <p className="eyebrow eyebrow--light">Find your stone</p>
              <h2 id="match-heading" className="section-title">Which crystals match <em>your</em> numbers?</h2>
              <p>
                Every Life Path number has stones it traditionally resonates with. Find your Life Path free in under a
                minute, or book a personal reading to see your whole numerology chart.
              </p>
            </div>
            <div className="guide-band-actions">
              <Link href="/numerology" className="btn btn-primary btn-lg">Find My Life Path (Free)</Link>
              <Link href="/booking" className="btn btn-outline btn-outline--light btn-lg">See Reading Plans</Link>
            </div>
          </div>
        </section>

        {pairs.length > 0 && (
          <section className="section guide-more" aria-labelledby="pairs-heading">
            <div className="container">
              <h2 id="pairs-heading" className="guide-more-title">{guide.name} pairs well with</h2>
              <ul className="guide-pair-list" role="list">
                {pairs.map((c) => (
                  <li key={c.slug}>
                    <Link href={crystalPath(c.slug)}>
                      <strong>{c.name}</strong>
                      <span>{c.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <GuideDisclaimer>
          The properties described here are traditional and spiritual beliefs about crystals, shared for interest and
          self-care. They are not medical claims and are not a substitute for professional advice or treatment.
        </GuideDisclaimer>
      </main>
      <Footer />
    </>
  );
}

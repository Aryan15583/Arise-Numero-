import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { ReadingPlans } from "@/components/guides/ReadingPlans";
import { LockedInsights } from "@/components/guides/LockedInsights";
import { GuideDisclaimer } from "@/components/guides/GuideDisclaimer";
import { LIFE_PATH_GUIDES, getLifePathGuide, lifePathPath } from "@/lib/guides/life-path";
import { crystalPath, getCrystalGuide } from "@/lib/guides/crystals";
import { getStoneProducts } from "@/lib/guides/data";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LIFE_PATH_GUIDES.map((g) => ({ number: String(g.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const guide = getLifePathGuide(Number((await params).number));
  if (!guide) return {};
  return pageMetadata({
    title: `Life Path Number ${guide.number} Meaning: ${guide.title}`,
    description: `What Life Path ${guide.number} means in numerology: personality, strengths, love, career and lucky crystals for ${guide.title}. Find your number free.`,
    path: lifePathPath(guide.number),
  });
}

export default async function LifePathPage({ params }: { params: Promise<{ number: string }> }) {
  const guide = getLifePathGuide(Number((await params).number));
  if (!guide) notFound();
  const n = guide.number;
  const crystals = guide.crystals.map(getCrystalGuide).filter((c) => c !== null);
  const products = await getStoneProducts(guide.crystals, 4);
  const isMaster = n > 9;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Life Path Number ${n} Meaning: ${guide.title}`,
    description: guide.overview[0],
    url: absoluteUrl(lifePathPath(n)),
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
          { name: `Life Path ${n}`, path: lifePathPath(n) },
        ])}
      />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/guides">Guides</Link></li>
            <li aria-current="page">Life Path {n}</li>
          </ol>
        </nav>

        <section className="guide-hero guide-hero--number" aria-labelledby="lp-heading">
          <div className="container guide-hero-inner">
            <div className="guide-hero-text">
              <p className="eyebrow eyebrow--light">{isMaster ? "Master Number" : "Life Path Number"}</p>
              <h1 id="lp-heading" className="guide-title">
                Life Path {n}: <em>{guide.title}</em>
              </h1>
              <p className="guide-lead">{guide.overview[0]}</p>
              <ul className="guide-chips" role="list" aria-label="Key themes">
                {guide.keywords.map((k) => <li key={k}>{k}</li>)}
              </ul>
              <div className="guide-hero-actions">
                <Link href="/booking?package=full#booking-form-section" className="btn btn-primary btn-lg">Get My Full Reading</Link>
                <Link href="/numerology" className="btn btn-outline btn-outline--light btn-lg">Not sure of your number?</Link>
              </div>
            </div>
            <div className="guide-numeral" aria-hidden="true">
              <span>{n}</span>
            </div>
          </div>
        </section>

        <section className="section guide-body">
          <div className="container guide-layout">
            <article className="guide-article">
              <h2>What Life Path {n} means</h2>
              {guide.overview.slice(1).map((p) => <p key={p}>{p}</p>)}

              <div className="guide-traits">
                <div className="guide-trait-card">
                  <h3><Icon name="sparkle" size={18} /> Strengths</h3>
                  <ul>{guide.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
                <div className="guide-trait-card guide-trait-card--muted">
                  <h3><Icon name="alert" size={18} /> Challenges</h3>
                  <ul>{guide.challenges.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              </div>

              <h2>Life Path {n} in love</h2>
              <p>{guide.love}</p>
              <div className="guide-callout">
                <Icon name="heart" size={20} />
                <p>
                  Life Path {n} often feels a natural ease with {guide.harmonious.map((h, i) => (
                    <span key={h}>{i > 0 && (i === guide.harmonious.length - 1 ? " and " : ", ")}<Link href={lifePathPath(h)}>{h}</Link></span>
                  ))}, but real compatibility depends on far more than one number.{" "}
                  <Link href="/booking?package=full#booking-form-section">The Full Numeroscope compares both full charts</Link>.
                </p>
              </div>

              <h2>Career and purpose</h2>
              <p>{guide.career}</p>
              <ul className="guide-chips guide-chips--plain" role="list" aria-label="Career paths that suit this number">
                {guide.careerFields.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <div className="guide-callout">
                <Icon name="star" size={20} />
                <p>
                  Your Life Path is only one part of the picture: your Expression number shows the talents you bring to work.{" "}
                  <Link href="/booking?package=premium#booking-form-section">Premium readings include a career &amp; life purpose deep dive</Link>.
                </p>
              </div>
            </article>

            <aside className="guide-aside" aria-label={`Crystals for Life Path ${n}`}>
              <div className="guide-aside-card">
                <h2 className="guide-aside-title">Lucky crystals for {n}</h2>
                <ul className="guide-crystal-list" role="list">
                  {crystals.map((c) => (
                    <li key={c.slug}>
                      <Link href={crystalPath(c.slug)}>
                        <strong>{c.name}</strong>
                        <span>{c.tagline}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="guide-aside-card guide-aside-card--cta">
                <p className="guide-aside-kicker">Personal reading</p>
                <p className="guide-aside-big">Your numbers, decoded by a numerologist</p>
                <p>Life Path, Expression, Soul Urge and your year ahead, in one report.</p>
                <Link href="/booking" className="btn btn-primary" style={{ width: "100%" }}>See Reading Plans</Link>
              </div>
            </aside>
          </div>
        </section>

        <LockedInsights
          heading={`What Life Path ${n} alone can't tell you`}
          intro={`Two people with Life Path ${n} can live very different lives. The difference is in the rest of your chart, which comes from your full birth name and exact date of birth. That's what a personal reading reveals:`}
          items={guide.readingHooks}
        />

        {products.length > 0 && (
          <section className="section" aria-labelledby="lp-crystals-heading">
            <div className="container">
              <div className="section-header">
                <p className="eyebrow">Shop by your number</p>
                <h2 id="lp-crystals-heading" className="section-title">Crystals for Life Path {n}</h2>
                <p className="section-subtitle">Natural {crystals.map((c) => c.name).join(", ")} pieces, traditionally paired with Life Path {n}.</p>
              </div>
              <div className="product-grid" role="list">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        <ReadingPlans
          heading="Choose your reading"
          intro={`Go beyond your Life Path ${n}. Every reading is prepared personally from your full birth name and date of birth.`}
        />

        <section className="section guide-more" aria-labelledby="lp-more-heading">
          <div className="container">
            <h2 id="lp-more-heading" className="guide-more-title">Explore other Life Path numbers</h2>
            <ul className="guide-number-strip" role="list">
              {LIFE_PATH_GUIDES.map((g) => (
                <li key={g.number}>
                  <Link href={lifePathPath(g.number)} className={g.number === n ? "is-current" : ""} aria-current={g.number === n ? "page" : undefined}>
                    <span className="guide-number-strip-num">{g.number}</span>
                    <span className="guide-number-strip-name">{g.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <GuideDisclaimer>
          Numerology is offered for entertainment and self-insight only. It is not a substitute for professional advice.
        </GuideDisclaimer>
      </main>
      <Footer />
    </>
  );
}

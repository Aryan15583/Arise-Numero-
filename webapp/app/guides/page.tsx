import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { ReadingPlans } from "@/components/guides/ReadingPlans";
import { LIFE_PATH_GUIDES, lifePathPath } from "@/lib/guides/life-path";
import { CRYSTAL_GUIDES, crystalPath } from "@/lib/guides/crystals";
import { RUDRAKSHA_PATH } from "@/lib/guides/rudraksha";
import { getStoneImages } from "@/lib/guides/data";
import { thumbnailFor } from "@/lib/product-thumbs";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Numerology & Crystal Guides",
  description:
    "Free guides to Life Path numbers 1 to 9, 11, 22 and 33, crystal meanings and benefits, and Rudraksha mukhi meanings, from Arise Numero.",
  path: "/guides",
});

export default async function GuidesPage() {
  const images = await getStoneImages();
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Guides</li>
          </ol>
        </nav>

        <div className="page-header container guides-header">
          <p className="eyebrow">Learn</p>
          <h1 className="page-title">Numerology &amp; Crystal Guides</h1>
          <p className="page-subtitle">
            What your Life Path number says about you, what each crystal is known for, and how to choose the right Rudraksha.
          </p>
        </div>

        <section className="section" id="life-path" aria-labelledby="lp-hub-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Numerology</p>
              <h2 id="lp-hub-heading" className="section-title">Life Path number meanings</h2>
              <p className="section-subtitle">
                Don&apos;t know your number? <Link href="/numerology">Use the free calculator</Link>; it takes under a minute.
              </p>
            </div>
            <ul className="guide-number-grid" role="list">
              {LIFE_PATH_GUIDES.map((g) => (
                <li key={g.number}>
                  <Link href={lifePathPath(g.number)} className="guide-number-tile">
                    <span className="guide-number-tile-num">{g.number}</span>
                    <span className="guide-number-tile-name">{g.title}</span>
                    <span className="guide-number-tile-keys">{g.keywords.slice(0, 2).join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section guide-cleanse" id="crystals" aria-labelledby="crystal-hub-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Crystals</p>
              <h2 id="crystal-hub-heading" className="section-title">Crystal meanings</h2>
              <p className="section-subtitle">The traditional meaning, benefits and care of every stone we carry.</p>
            </div>
            <ul className="guide-crystal-grid" role="list">
              {CRYSTAL_GUIDES.map((c) => {
                const img = images[c.slug];
                return (
                  <li key={c.slug}>
                    <Link href={crystalPath(c.slug)} className="guide-crystal-tile">
                      <span className="guide-crystal-tile-img">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnailFor(img) ?? img} alt="" loading="lazy" decoding="async" width={300} height={300} />
                        ) : (
                          <Icon name="gem" size={40} />
                        )}
                      </span>
                      <span className="guide-crystal-tile-body">
                        <strong>{c.name}</strong>
                        <span>{c.tagline}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="rud-hub-heading">
          <div className="container guide-band-light">
            <div>
              <p className="eyebrow">Sacred beads</p>
              <h2 id="rud-hub-heading" className="section-title">Rudraksha guide</h2>
              <p>The meaning of every mukhi from 1 to 14, with its ruling deity and planet, plus how to wear and care for your Rudraksha.</p>
            </div>
            <Link href={RUDRAKSHA_PATH} className="btn btn-primary btn-lg">Read the Rudraksha Guide</Link>
          </div>
        </section>

        <ReadingPlans heading="Want the full picture?" intro="Guides describe numbers in general. A personal reading is prepared from your own name and date of birth." />
      </main>
      <Footer />
    </>
  );
}

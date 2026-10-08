"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { ProductReviews } from "./ProductReviews";
import { WishlistButton } from "./WishlistButton";
import { ShareButtons } from "./ShareButtons";
import { BackInStockForm } from "./BackInStockForm";
import { getPublicConfig } from "@/lib/public-config";
import { productPath } from "@/lib/seo";
import type { ProductDTO } from "@/lib/types";
import { reviewsLabel, starString } from "@/lib/stars";
import { isPriced } from "@/lib/pricing";
import { getProductType } from "@/lib/product-types";
import { Icon } from "./Icon";

const SIZE_LABELS: Record<string, string> = { S: "15–16cm", M: "17–18cm", L: "19–20cm" };

export function ProductDetailClient({ product }: { product: ProductDTO }) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const [activeImg, setActiveImg] = useState(product.imageUrl || product.images[0] || "/assets/placeholder.svg");
  const [wristSize, setWristSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"reviews" | "shipping" | "returns" | "care">("reviews");
  const [added, setAdded] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50);
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);

  function handleZoomMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }

  useEffect(() => {
    getPublicConfig().then((c) => {
      if (c) setFreeShippingThreshold(c.freeShippingThresholdUsd);
    });
  }, []);

  const images = product.images.length ? product.images : [product.imageUrl || "/assets/placeholder.svg"];
  const priced = isPriced(product);
  const type = getProductType(product.productType);
  const isBracelet = product.productType === "bracelets" || product.productType === "pyramid-bracelets";
  const isOut = product.stock === 0;
  const isLow = !isOut && product.stock <= product.lowStockThreshold;
  const maxQty = Math.max(1, Math.min(10, product.stock));

  function handleAdd() {
    addToCart({ id: product.id, name: product.name, priceUsd: product.priceUsd, imageUrl: product.imageUrl, stock: product.stock }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <>
      <section className="product-detail container" aria-labelledby="product-heading">
        <div className="product-detail-inner">
          <div className="product-gallery">
            <div
              className={`gallery-main ${zoomOrigin ? "is-zooming" : ""}`}
              onMouseMove={handleZoomMove}
              onMouseLeave={() => setZoomOrigin(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="gallery-main-img"
                src={activeImg}
                alt={product.name}
                className="gallery-main-img"
                width={600}
                height={600}
                style={zoomOrigin ? { transformOrigin: zoomOrigin } : undefined}
              />
              <div className="gallery-zoom-hint" aria-hidden="true">Hover to zoom</div>
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs" role="list" aria-label="Product image thumbnails">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`gallery-thumb ${activeImg === img ? "active" : ""}`}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={activeImg === img}
                    onClick={() => setActiveImg(img)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" width={80} height={80} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-detail-badges" aria-label="Product badges">
              {product.badge && <span className="badge badge-bestseller">{product.badge}</span>}
              <span className="badge badge-authentic"><Icon name="check" size={12} /> Natural stone</span>
            </div>

            <h1 id="product-heading" className="product-detail-title">{product.name}</h1>

            {product.reviewCount > 0 ? (
              <div className="product-detail-rating" aria-label={`Customer rating: ${product.rating} out of 5 stars, ${reviewsLabel(product.reviewCount)}`}>
                <span className="stars" aria-hidden="true">{starString(product.rating)}</span>
                <a href="#reviews" className="rating-link">{product.rating.toFixed(1)} ({reviewsLabel(product.reviewCount)})</a>
              </div>
            ) : (
              <div className="product-detail-rating">
                <a href="#reviews" className="rating-link">No reviews yet — be the first to review</a>
              </div>
            )}

            {priced ? (
              <div className="product-detail-price" aria-label="Product pricing">
                <span className="price-main">{format(product.priceUsd)}</span>
                {freeShippingThreshold > 0 && <span className="price-note">Free shipping on orders over {format(freeShippingThreshold)}</span>}
              </div>
            ) : (
              <div className="product-detail-price" aria-label="Product pricing">
                <span className="price-main price-main--request">Price on request</span>
                <span className="price-note">Send us a message and we&apos;ll reply with the price and availability.</span>
              </div>
            )}

            {priced && isOut && (
              <>
                <div className="stock-status stock-out" role="status" aria-live="polite">
                  <span className="stock-dot" aria-hidden="true"></span> Out of stock
                </div>
                <BackInStockForm productId={product.id} productName={product.name} />
              </>
            )}
            {priced && isLow && (
              <div className="stock-status stock-low" role="status" aria-live="polite">
                <span className="stock-dot" aria-hidden="true"></span> Only {product.stock} left — order soon
              </div>
            )}
            {priced && !isOut && !isLow && (
              <div className="stock-status stock-in" role="status" aria-live="polite">
                <span className="stock-dot" aria-hidden="true"></span> In stock
              </div>
            )}

            <div className="product-specs" aria-label="Product specifications">
              <h2 className="specs-title">Specifications</h2>
              <dl className="specs-list">
                {type && <div className="spec-row"><dt>Type</dt><dd>{type.singular}</dd></div>}
                <div className="spec-row"><dt>Material</dt><dd>{product.material}</dd></div>
                {type?.beaded && product.beadSize && <div className="spec-row"><dt>Bead Size</dt><dd>{product.beadSize} diameter</dd></div>}
                {isBracelet && <div className="spec-row"><dt>Wrist Size</dt><dd>Adjustable — fits 15–20cm wrists</dd></div>}
                {product.productType === "anklets" && <div className="spec-row"><dt>Fit</dt><dd>Adjustable to most ankles</dd></div>}
                {product.productType !== "certificates" && <div className="spec-row"><dt>Origin</dt><dd>Natural stone, ethically sourced</dd></div>}
                {isBracelet && <div className="spec-row"><dt>Packaging</dt><dd>Arise Numero gift box included</dd></div>}
              </dl>
            </div>

            {priced && (
            <div className="product-options">
              {isBracelet && (
              <fieldset className="option-group">
                <legend className="option-label">Wrist Size</legend>
                <div className="size-options" role="radiogroup" aria-label="Select wrist size">
                  {Object.entries(SIZE_LABELS).map(([size, range]) => (
                    <label className="size-option" key={size}>
                      <input type="radio" name="wrist-size" checked={wristSize === size} onChange={() => setWristSize(size)} />
                      <span>{size} <em>({range})</em></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              )}

              <div className="quantity-group">
                <label className="option-label" htmlFor="qty-input">Quantity</label>
                <div className="quantity-control">
                  <button className="qty-btn qty-minus" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <input
                    type="number"
                    id="qty-input"
                    className="qty-input"
                    value={qty}
                    min={1}
                    max={maxQty}
                    onChange={(e) => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                    aria-label="Quantity"
                  />
                  <button className="qty-btn qty-plus" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
                </div>
                <p className="qty-limit" aria-live="polite">Max {maxQty} available</p>
              </div>
            </div>
            )}

            <div className="product-cta-group">
              {priced ? (
                <button className="btn btn-primary btn-lg add-to-cart-main" onClick={handleAdd} disabled={isOut}>
                  {added ? <><Icon name="check" size={18} /> Added to bag</> : isOut ? "Out of stock" : <><Icon name="bag" size={18} /> Add to bag</>}
                </button>
              ) : (
                <Link href={`/contact?product=${encodeURIComponent(product.id)}`} className="btn btn-primary btn-lg add-to-cart-main">
                  <Icon name="mail" size={18} /> Enquire about this item
                </Link>
              )}
              <WishlistButton productId={product.id} productName={product.name} variant="full" />
            </div>

            <div className="product-trust" aria-label="Trust indicators">
              <div className="trust-item-sm"><Icon name="lock" size={16} /> Secure checkout</div>
              <div className="trust-item-sm"><Icon name="globe" size={16} /> Ships worldwide</div>
              <div className="trust-item-sm"><Icon name="returns" size={16} /> 14-day returns</div>
              <div className="trust-item-sm"><Icon name="gem" size={16} /> Natural crystal</div>
            </div>

            <ShareButtons path={productPath(product.id)} title={product.name} />

            <div className="product-description">
              <h2>About This {product.productType === "certificates" ? "Certificate" : product.productType === "rudraksha" ? "Rudraksha" : "Crystal"}</h2>
              <p>{product.description}</p>
            </div>
          </div>
        </div>

        <div className="product-tabs" role="tablist" aria-label="Product information tabs" id="reviews">
          <button className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`} role="tab" aria-selected={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>
            Reviews ({product.reviewCount})
          </button>
          <button className={`tab-btn ${activeTab === "shipping" ? "active" : ""}`} role="tab" aria-selected={activeTab === "shipping"} onClick={() => setActiveTab("shipping")}>
            Shipping
          </button>
          <button className={`tab-btn ${activeTab === "returns" ? "active" : ""}`} role="tab" aria-selected={activeTab === "returns"} onClick={() => setActiveTab("returns")}>
            Returns
          </button>
          <button className={`tab-btn ${activeTab === "care" ? "active" : ""}`} role="tab" aria-selected={activeTab === "care"} onClick={() => setActiveTab("care")}>
            Crystal Care
          </button>
        </div>

        {activeTab === "reviews" && (
          <div className="tab-panel">
            <div className="reviews-summary">
              {product.reviewCount > 0 ? (
                <div className="rating-big" aria-label={`Overall rating: ${product.rating} out of 5`}>
                  <span className="rating-number">{product.rating.toFixed(1)}</span>
                  <span className="rating-stars" aria-hidden="true">{starString(product.rating)}</span>
                  <span className="rating-total">Based on {reviewsLabel(product.reviewCount)}</span>
                </div>
              ) : (
                <p className="rating-total">No reviews yet. Bought this bracelet? Share your experience below.</p>
              )}
            </div>
            <ProductReviews productId={product.id} />
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="tab-panel">
            <h3>Shipping Information</h3>
            <table className="info-table" aria-label="Shipping rates and delivery times">
              <thead><tr><th>Region</th><th>Estimated Delivery</th><th>Cost</th></tr></thead>
              <tbody>
                <tr><td>India</td><td>5–10 business days</td><td>Free over ₹2000 / ₹150 otherwise</td></tr>
                <tr><td>USA &amp; Canada</td><td>7–14 business days</td><td>Free over $50 / $5.99 otherwise</td></tr>
                <tr><td>Europe (EU)</td><td>10–18 business days</td><td>Free over €45 / €6.99 otherwise</td></tr>
                <tr><td>UK</td><td>10–16 business days</td><td>Free over £40 / £5.99 otherwise</td></tr>
                <tr><td>Australia &amp; NZ</td><td>12–20 business days</td><td>Free over A$60 / A$9.99 otherwise</td></tr>
                <tr><td>Rest of World</td><td>14–25 business days</td><td>$9.99 flat</td></tr>
              </tbody>
            </table>
            <p className="info-note"><strong>Customs &amp; Duties:</strong> International orders may be subject to import duties or taxes levied by the destination country. These charges are the buyer&apos;s responsibility.</p>
            <p><Link href="/returns">View full shipping &amp; returns policy →</Link></p>
          </div>
        )}

        {activeTab === "returns" && (
          <div className="tab-panel">
            <h3>Return &amp; Refund Policy</h3>
            <p>We offer a <strong>14-day return window</strong> on all non-customised products, in compliance with the EU Distance Selling Directive and applicable consumer protection laws.</p>
            <ul className="info-list">
              <li>Items must be unworn and in original packaging</li>
              <li>Contact us within 14 days of delivery to initiate a return</li>
              <li>Refunds are processed within 5–7 business days of receiving the return</li>
              <li>Return shipping costs are the buyer&apos;s responsibility unless the item is defective</li>
            </ul>
            <p><Link href="/returns">View full returns policy →</Link></p>
          </div>
        )}

        {activeTab === "care" && (
          <div className="tab-panel">
            <h3>Crystal Care Guide</h3>
            <ul className="info-list">
              <li>Avoid prolonged exposure to direct sunlight, which may fade natural colours</li>
              <li>Remove before swimming, bathing, or using chemical cleaners</li>
              <li>Clean gently with a soft, dry cloth</li>
              <li>Store in the included gift box or a soft pouch to prevent scratching</li>
              <li>Elastic cord is high-grade but avoid over-stretching</li>
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

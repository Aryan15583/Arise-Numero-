/**
 * ================================================================
 * ARISE NUMERO — main.js
 * Single JavaScript file for all 12 pages
 *
 * TABLE OF CONTENTS
 * ----------------------------------------------------------------
 * LINE   30  — 1.  THEME: prefers-color-scheme live listener
 * LINE   55  — 2.  FOOTER YEAR
 * LINE   62  — 3.  MOBILE NAVIGATION (works on all 12 pages)
 * LINE  120  — 4.  COOKIE CONSENT BANNER
 * LINE  220  — 5.  CURRENCY SWITCHER
 * LINE  310  — 6.  CART SYSTEM (localStorage, all pages)
 * LINE  520  — 7.  CART PAGE RENDER
 * LINE  680  — 8.  CHECKOUT PAGE
 * LINE  780  — 9.  PRODUCT GALLERY
 * LINE  840  — 10. PRODUCT TABS
 * LINE  900  — 11. QUANTITY CONTROLS
 * LINE  960  — 12. NUMEROLOGY CALCULATOR
 * LINE 1120  — 13. BOOKING PAGE
 * LINE 1210  — 14. SHOP FILTERS & SORT
 * LINE 1340  — 15. CONTACT FORM
 * LINE 1400  — 16. FAQ ACCORDION ANIMATION
 * LINE 1430  — 17. SCROLL & ACCESSIBILITY HELPERS
 * LINE 1470  — 18. INIT — runs everything on DOMContentLoaded
 * ================================================================
 */

'use strict';

/* ================================================================
   LINE 30 — 1. THEME: prefers-color-scheme live listener
   No toggle button. Purely browser/OS driven.
   Updates live if user changes their OS/browser setting mid-session.
   ================================================================ */
function initTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    // LINE 38: Set data-theme on <html> for any CSS that needs it
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  // LINE 42: Apply on load
  applyTheme(mq.matches);

  // LINE 45: Listen for live changes — updates instantly when
  // the user changes their browser or OS appearance setting
  mq.addEventListener('change', (e) => {
    applyTheme(e.matches);
  });
}


/* ================================================================
   LINE 55 — 2. FOOTER YEAR
   Sets current year in all footer copyright spans.
   ================================================================ */
function initFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('#footer-year, .footer-year').forEach(el => {
    el.textContent = year;
  });
}


/* ================================================================
   LINE 62 — 3. MOBILE NAVIGATION
   Works identically on all 12 HTML pages.
   Handles: open/close, outside click, Escape key,
            ARIA attributes, focus trap.
   ================================================================ */
function initMobileNav() {
  const btn    = document.getElementById('mobile-menu-btn');
  const nav    = document.getElementById('mobile-nav');
  const header = document.querySelector('.site-header');

  // LINE 70: If elements don't exist on this page, exit safely
  if (!btn || !nav) return;

  let isOpen = false;

  // LINE 75: Open / close toggle
  function openNav() {
    isOpen = true;
    nav.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close navigation menu');
    // Animate hamburger to X
    const ham = btn.querySelector('.hamburger');
    if (ham) {
      ham.style.background = 'transparent';
      ham.style.setProperty('--ham-rotate', '45deg');
    }
    document.body.style.overflow = 'hidden';
    // LINE 88: Move focus to first nav link for accessibility
    const firstLink = nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeNav() {
    isOpen = false;
    nav.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open mobile menu');
    const ham = btn.querySelector('.hamburger');
    if (ham) {
      ham.style.background = '';
    }
    document.body.style.overflow = '';
  }

  // LINE 102: Button click
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen ? closeNav() : openNav();
  });

  // LINE 108: Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeNav();
      btn.focus(); // Return focus to button
    }
  });

  // LINE 115: Close when clicking outside the nav / header
  document.addEventListener('click', (e) => {
    if (isOpen && header && !header.contains(e.target)) {
      closeNav();
    }
  });

  // LINE 121: Close nav when a nav link is clicked (SPA-style feel)
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeNav());
  });

  // LINE 126: Mark current page link as active in mobile nav
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}


/* ================================================================
   LINE 136 — 4. COOKIE CONSENT BANNER
   GDPR / CCPA compliant.
   Shows on first visit. Remembers choice in localStorage.
   Manage panel allows per-category control.
   ================================================================ */
const COOKIE_KEY = 'ariseNumero_cookieConsent';

function initCookieBanner() {
  const banner  = document.getElementById('cookie-banner');
  if (!banner) return;

  // LINE 144: Don't show if already decided
  const saved = localStorage.getItem(COOKIE_KEY);
  if (saved) return;

  // LINE 148: Show banner after short delay
  setTimeout(() => {
    banner.classList.add('is-visible');
    banner.removeAttribute('hidden');
  }, 800);

  const acceptBtn = document.getElementById('cookie-accept');
  const rejectBtn = document.getElementById('cookie-reject');
  const manageBtn = document.getElementById('cookie-manage');

  function hideBanner() {
    banner.classList.remove('is-visible');
    setTimeout(() => { banner.style.display = 'none'; }, 400);
  }

  // LINE 162: Accept all
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now()
      }));
      hideBanner();
    });
  }

  // LINE 175: Reject non-essential
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false,
        timestamp: Date.now()
      }));
      hideBanner();
    });
  }

  // LINE 188: Manage — show modal
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      showCookieManageModal(hideBanner);
    });
  }
}

// LINE 195: Cookie manage modal
function showCookieManageModal(onSave) {
  // Remove any existing modal
  document.getElementById('cookie-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'cookie-modal';
  modal.className = 'cookie-manage-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cookie-modal-title');

  modal.innerHTML = `
    <div class="cookie-manage-panel">
      <h2 id="cookie-modal-title">Manage Cookie Preferences</h2>
      <div class="cookie-row">
        <div><strong>Essential Cookies</strong><p class="form-hint">Required for the site to function. Cannot be disabled.</p></div>
        <input type="checkbox" checked disabled aria-label="Essential cookies always enabled" />
      </div>
      <div class="cookie-row">
        <div><strong>Functional Cookies</strong><p class="form-hint">Remember your preferences like currency and theme.</p></div>
        <input type="checkbox" id="cm-functional" aria-label="Functional cookies" checked />
      </div>
      <div class="cookie-row">
        <div><strong>Analytics Cookies</strong><p class="form-hint">Help us understand how visitors use the site.</p></div>
        <input type="checkbox" id="cm-analytics" aria-label="Analytics cookies" />
      </div>
      <div class="cookie-row">
        <div><strong>Marketing Cookies</strong><p class="form-hint">Used for personalised advertising.</p></div>
        <input type="checkbox" id="cm-marketing" aria-label="Marketing cookies" />
      </div>
      <div style="display:flex;gap:12px;margin-top:24px;">
        <button class="btn btn-primary" id="cm-save">Save Preferences</button>
        <button class="btn btn-ghost" id="cm-cancel">Cancel</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById('cm-save').focus();

  document.getElementById('cm-save').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      essential: true,
      functional: document.getElementById('cm-functional').checked,
      analytics:  document.getElementById('cm-analytics').checked,
      marketing:  document.getElementById('cm-marketing').checked,
      timestamp:  Date.now()
    }));
    modal.remove();
    onSave();
  });

  document.getElementById('cm-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Trap Escape
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.remove();
  });
}


/* ================================================================
   LINE 220 — 5. CURRENCY SWITCHER
   Auto-detects country via IP on first load.
   Manual override via select dropdown.
   Converts all [data-usd] prices across the page instantly.
   ================================================================ */
const CURRENCY_KEY = 'ariseNumero_currency';

// LINE 227: Exchange rates relative to USD
const EXCHANGE_RATES = {
  USD: { rate: 1,      symbol: '$',   name: 'USD' },
  INR: { rate: 83.5,   symbol: '₹',   name: 'INR' },
  EUR: { rate: 0.92,   symbol: '€',   name: 'EUR' },
  GBP: { rate: 0.79,   symbol: '£',   name: 'GBP' },
  AUD: { rate: 1.53,   symbol: 'A$',  name: 'AUD' },
};

// LINE 235: Country → currency map (common countries)
const COUNTRY_CURRENCY = {
  IN: 'INR', US: 'USD', GB: 'GBP', AU: 'AUD',
  CA: 'USD', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  IE: 'EUR', PT: 'EUR', GR: 'EUR', FI: 'EUR',
  PL: 'EUR', SE: 'EUR', DK: 'EUR', NZ: 'AUD',
  SG: 'USD', AE: 'USD', SA: 'USD', ZA: 'USD',
};

let currentCurrency = 'USD';

function initCurrencySwitcher() {
  // LINE 250: Load saved or default
  const saved = localStorage.getItem(CURRENCY_KEY);
  if (saved && EXCHANGE_RATES[saved]) {
    currentCurrency = saved;
    setCurrencyUI(currentCurrency);
    convertAllPrices();
  } else {
    // LINE 256: Auto-detect via free IP API (no key needed)
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const detected = COUNTRY_CURRENCY[data.country_code] || 'USD';
        currentCurrency = detected;
        setCurrencyUI(currentCurrency);
        convertAllPrices();
      })
      .catch(() => {
        // LINE 265: Fallback silently to USD
        convertAllPrices();
      });
  }

  // LINE 270: Wire up all currency selects on the page
  document.querySelectorAll('#currency-select').forEach(select => {
    // Set current value
    select.value = currentCurrency;

    select.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem(CURRENCY_KEY, currentCurrency);
      // Sync all selects if multiple on page
      document.querySelectorAll('#currency-select').forEach(s => s.value = currentCurrency);
      setCurrencyUI(currentCurrency);
      convertAllPrices();
      updateCartTotals(); // Update cart summary if on cart page
    });
  });
}

// LINE 286: Update currency name display in cart summary
function setCurrencyUI(code) {
  const nameEl = document.getElementById('selected-currency-name');
  if (nameEl) nameEl.textContent = code;
}

// LINE 292: Convert a USD value to current currency string
function formatPrice(usdValue, currency) {
  const curr = EXCHANGE_RATES[currency] || EXCHANGE_RATES['USD'];
  const converted = (parseFloat(usdValue) * curr.rate).toFixed(2);
  return `${curr.symbol}${converted}`;
}

// LINE 299: Convert all [data-usd] elements on the page
function convertAllPrices() {
  document.querySelectorAll('[data-usd]').forEach(el => {
    const usd = el.getAttribute('data-usd');
    if (usd) el.textContent = formatPrice(usd, currentCurrency);
  });
}


/* ================================================================
   LINE 310 — 6. CART SYSTEM
   localStorage-based cart. Works across all pages.
   ================================================================ */
const CART_KEY = 'ariseNumero_cart';

// LINE 315: Load cart from localStorage
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

// LINE 323: Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// LINE 328: Update all cart count badges on the page
function updateCartBadge() {
  const cart  = getCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = total;
    // LINE 334: Accessibility — update aria-label on cart button
    const btn = el.closest('.cart-btn');
    if (btn) btn.setAttribute('aria-label', `Shopping cart, ${total} item${total !== 1 ? 's' : ''}`);
  });
}

// LINE 341: Add item to cart
function addToCart(id, name, priceUSD, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + qty;
  } else {
    cart.push({ id, name, priceUSD: parseFloat(priceUSD), qty });
  }
  saveCart(cart);
  updateCartBadge();
  showAddedToast(name);
}

// LINE 354: Remove item from cart
function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartBadge();
}

// LINE 360: Update quantity of item in cart
function updateCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    item.qty = qty;
    saveCart(cart);
  }
  updateCartBadge();
}

// LINE 374: Toast notification for "Added to cart"
function showAddedToast(name) {
  // Remove any existing toast
  document.getElementById('cart-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<span aria-hidden="true">✓</span> <strong>${name}</strong> added to cart. <a href="cart.html">View cart →</a>`;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    background: var(--bg-surface, #fff);
    border: 1.5px solid var(--brand-gold, #b8975a);
    border-radius: 12px;
    padding: 14px 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    font-size: 0.9rem;
    color: var(--text-primary, #1a1228);
    max-width: 320px;
    animation: fadeIn 0.25s ease;
    font-family: 'DM Sans', sans-serif;
  `;
  toast.querySelector('a').style.cssText = 'color: var(--brand-gold,#b8975a); font-weight:600;';
  document.body.appendChild(toast);

  // LINE 400: Auto-remove after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// LINE 408: Wire up all "Add to Cart" buttons on the page
function initAddToCartButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart, .add-to-cart-main');
    if (!btn) return;
    e.preventDefault();

    const id    = btn.dataset.id;
    const name  = btn.dataset.name;
    const price = btn.dataset.price;
    if (!id || !name || !price) return;

    // LINE 419: Get qty from nearby qty input if present
    let qty = 1;
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) qty = parseInt(qtyInput.value) || 1;

    addToCart(id, name, price, qty);

    // LINE 426: Brief button feedback
    const original = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  });
}

// LINE 435: Package select buttons (booking page)
function initPackageSelect() {
  document.querySelectorAll('.select-package').forEach(btn => {
    btn.addEventListener('click', () => {
      // Highlight selected package card
      document.querySelectorAll('.package-card').forEach(c => c.classList.remove('package-card--selected'));
      btn.closest('.package-card')?.classList.add('package-card--selected');

      const pkg   = btn.dataset.package;
      const price = btn.dataset.price;

      const nameEl  = document.getElementById('selected-package-name');
      const priceEl = document.getElementById('selected-package-price');

      const labels = {
        core:    'Core Blueprint',
        full:    'Full Numeroscope',
        premium: 'Premium + Live Session'
      };

      if (nameEl)  nameEl.textContent  = labels[pkg] || pkg;
      if (priceEl) priceEl.textContent = formatPrice(price, currentCurrency);

      // Scroll to booking form
      document.getElementById('booking-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ================================================================
   LINE 475 — CART TOTALS CALCULATOR
   Used by cart page and checkout page.
   ================================================================ */
let appliedDiscount = 0; // percentage
let appliedCouponCode = null;

// Coupons are now validated server-side against the real database (so a
// coupon disabled or changed in the admin panel takes effect immediately,
// and someone can't just read this file to find valid codes).

function calcCartTotals() {
  const cart     = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.priceUSD * (item.qty || 1)), 0);
  const discount = subtotal * (appliedDiscount / 100);
  const after    = subtotal - discount;
  return { subtotal, discount, after };
}

function updateCartTotals() {
  const { subtotal, discount, after } = calcCartTotals();
  const curr = EXCHANGE_RATES[currentCurrency] || EXCHANGE_RATES['USD'];

  // LINE 496: Update summary elements (cart + checkout pages)
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const fmt = (usd) => `${curr.symbol}${(usd * curr.rate).toFixed(2)}`;

  set('summary-subtotal', fmt(subtotal));
  set('summary-total',    fmt(after));
  set('co-subtotal',      fmt(subtotal));
  set('co-total',         fmt(after));

  // LINE 506: Show discount row if applicable
  const discountRow = document.getElementById('summary-discount-row');
  if (discountRow) discountRow.hidden = appliedDiscount === 0;
  set('summary-discount', `-${fmt(discount)}`);

  // LINE 512: Disable checkout button if cart empty
  const checkoutBtn = document.getElementById('proceed-checkout');
  if (checkoutBtn) {
    const empty = getCart().length === 0;
    checkoutBtn.style.opacity    = empty ? '0.5' : '1';
    checkoutBtn.style.pointerEvents = empty ? 'none' : 'auto';
    checkoutBtn.setAttribute('aria-disabled', empty ? 'true' : 'false');
  }
}


/* ================================================================
   LINE 520 — 7. CART PAGE RENDER
   Builds the full cart table from localStorage data.
   ================================================================ */
function initCartPage() {
  const tbody    = document.getElementById('cart-table-body');
  const emptyEl  = document.getElementById('cart-empty');
  const itemsWrap = document.getElementById('cart-items-wrap');
  if (!tbody) return; // Not on cart page

  renderCartTable();
  initCouponCode();

  function renderCartTable() {
    const cart = getCart();

    // LINE 533: Show empty state or table
    if (cart.length === 0) {
      if (emptyEl)   emptyEl.hidden    = false;
      if (itemsWrap) itemsWrap.hidden  = true;
      updateCartTotals();
      return;
    }

    if (emptyEl)   emptyEl.hidden   = true;
    if (itemsWrap) itemsWrap.hidden = false;

    // LINE 543: Clear existing real rows (keep template)
    const template = document.getElementById('cart-row-template');
    tbody.querySelectorAll('.cart-row:not(#cart-row-template)').forEach(r => r.remove());

    const curr = EXCHANGE_RATES[currentCurrency] || EXCHANGE_RATES['USD'];

    cart.forEach(item => {
      const row  = document.createElement('tr');
      row.className = 'cart-row';
      row.dataset.id    = item.id;
      row.dataset.price = item.priceUSD;

      const unitPrice = (item.priceUSD * curr.rate).toFixed(2);
      const subPrice  = (item.priceUSD * curr.rate * (item.qty || 1)).toFixed(2);

      row.innerHTML = `
        <td class="cart-product-cell">
          <img src="assets/${item.id}-bracelet.jpg"
               onerror="this.src='assets/placeholder.jpg'"
               alt="${item.name} crystal bracelet"
               class="cart-item-img" width="80" height="80" />
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-meta">Crystal Bracelet</span>
          </div>
        </td>
        <td class="cart-price" aria-label="Unit price">${curr.symbol}${unitPrice}</td>
        <td class="cart-qty-cell">
          <div class="quantity-control">
            <button class="qty-btn qty-minus" aria-label="Decrease quantity of ${item.name}" data-id="${item.id}">−</button>
            <input type="number" class="qty-input cart-qty" value="${item.qty || 1}" min="1" max="10"
                   aria-label="Quantity of ${item.name}" data-id="${item.id}" />
            <button class="qty-btn qty-plus" aria-label="Increase quantity of ${item.name}" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="cart-subtotal" aria-label="Subtotal">${curr.symbol}${subPrice}</td>
        <td class="cart-remove-cell">
          <button class="cart-remove-btn" data-id="${item.id}" aria-label="Remove ${item.name} from cart">✕</button>
        </td>`;

      tbody.appendChild(row);
    });

    // LINE 585: Wire up qty buttons in cart table
    tbody.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const item = getCart().find(i => i.id === id);
        if (item) {
          updateCartQty(id, (item.qty || 1) - 1);
          renderCartTable();
          updateCartTotals();
        }
      });
    });

    tbody.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.id;
        const item = getCart().find(i => i.id === id);
        if (item && (item.qty || 1) < 10) {
          updateCartQty(id, (item.qty || 1) + 1);
          renderCartTable();
          updateCartTotals();
        }
      });
    });

    tbody.querySelectorAll('.cart-qty').forEach(input => {
      input.addEventListener('change', () => {
        const id  = input.dataset.id;
        const qty = parseInt(input.value);
        if (!isNaN(qty)) {
          updateCartQty(id, qty);
          renderCartTable();
          updateCartTotals();
        }
      });
    });

    // LINE 615: Remove buttons
    tbody.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        removeFromCart(id);
        renderCartTable();
        updateCartTotals();
      });
    });

    updateCartTotals();
  }
}

// LINE 628: Coupon code handler
function initCouponCode() {
  const input    = document.getElementById('coupon-input');
  const applyBtn = document.getElementById('apply-coupon');
  const feedback = document.getElementById('coupon-feedback');
  if (!applyBtn) return;

  applyBtn.addEventListener('click', async () => {
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) return;

    applyBtn.disabled = true;
    try {
      const resp = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json();

      if (data.valid) {
        appliedDiscount = data.discount_percent;
        appliedCouponCode = code;
        if (feedback) {
          feedback.textContent = `✓ Coupon applied! ${appliedDiscount}% off your order.`;
          feedback.className   = 'coupon-feedback success';
        }
      } else {
        appliedDiscount = 0;
        appliedCouponCode = null;
        if (feedback) {
          feedback.textContent = `✕ ${data.message || 'Invalid coupon code.'}`;
          feedback.className   = 'coupon-feedback error';
        }
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = '✕ Could not check that code right now. Please try again.';
        feedback.className   = 'coupon-feedback error';
      }
    } finally {
      applyBtn.disabled = false;
      updateCartTotals();
    }
  });

  // LINE 650: Allow Enter key on coupon input
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyBtn.click();
    });
  }
}

// LINE 657: Update cart button
function initUpdateCart() {
  const btn = document.getElementById('update-cart');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // Re-read all qty inputs and save
    document.querySelectorAll('.cart-qty').forEach(input => {
      const id  = input.dataset.id;
      const qty = parseInt(input.value);
      if (id && !isNaN(qty)) updateCartQty(id, qty);
    });
    updateCartTotals();
    showAddedToast('Cart updated');
  });
}


/* ================================================================
   LINE 680 — 8. CHECKOUT PAGE
   Populates order summary, handles tabs, form validation,
   country selector customs notice, payment tabs.
   ================================================================ */
function initCheckoutPage() {
  if (!document.getElementById('checkout-form')) return;

  // LINE 686: Populate order summary sidebar
  populateCheckoutSummary();

  // LINE 689: Account type tabs (Guest / Sign In / Register)
  const accountTabs   = document.querySelectorAll('.account-tab');
  const accountPanels = document.querySelectorAll('.account-panel');

  accountTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      accountTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      accountPanels.forEach(p => p.hidden = true);
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      accountPanels[i].hidden = false;
    });
  });

  // LINE 702: Payment method tabs
  const payTabs   = document.querySelectorAll('.payment-tab');
  const payPanels = document.querySelectorAll('.payment-panel');

  payTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      payTabs.forEach(t  => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      payPanels.forEach(p => p.hidden = true);
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      payPanels[i].hidden = false;
    });
  });

  // LINE 715: Country → show customs notice for non-India
  const countrySelect  = document.getElementById('ship-country');
  const customsNotice  = document.getElementById('customs-notice');
  if (countrySelect && customsNotice) {
    countrySelect.addEventListener('change', () => {
      const isInternational = countrySelect.value && countrySelect.value !== 'IN';
      customsNotice.hidden = !isInternational;
    });
  }

  // LINE 724: Create account checkbox toggle
  const createAccChk  = document.getElementById('create-account');
  const pwWrap        = document.getElementById('account-password-wrap');
  if (createAccChk && pwWrap) {
    createAccChk.addEventListener('change', () => {
      pwWrap.hidden = !createAccChk.checked;
      const pwInput = pwWrap.querySelector('input');
      if (pwInput) pwInput.required = createAccChk.checked;
    });
  }

  // LINE 734: Checkout form submission
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateCheckoutForm(form)) {
        handleCheckoutSubmit(form);
      }
    });
  }
}

// LINE 744: Populate checkout sidebar with cart items
function populateCheckoutSummary() {
  const container = document.getElementById('checkout-order-items');
  if (!container) return;

  const cart = getCart();
  const curr = EXCHANGE_RATES[currentCurrency] || EXCHANGE_RATES['USD'];

  if (cart.length === 0) {
    container.innerHTML = '<p class="checkout-empty-note">Your cart is empty. <a href="shop.html">Return to shop</a>.</p>';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="checkout-order-item">
      <img src="assets/${item.id}-bracelet.jpg"
           onerror="this.src='assets/placeholder.jpg'"
           alt="${item.name}"
           width="56" height="56" />
      <div class="checkout-order-item-info">
        <div class="checkout-order-item-name">${item.name}</div>
        <div class="checkout-order-item-meta">Qty: ${item.qty || 1}</div>
      </div>
      <div class="checkout-order-item-price">
        ${curr.symbol}${(item.priceUSD * curr.rate * (item.qty || 1)).toFixed(2)}
      </div>
    </div>`).join('');

  updateCartTotals();
}

// LINE 769: Basic checkout form validation
function validateCheckoutForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(input => {
    input.style.borderColor = '';
    if (!input.value.trim() || (input.type === 'checkbox' && !input.checked)) {
      input.style.borderColor = 'var(--color-error)';
      if (valid) input.focus();
      valid = false;
    }
  });
  return valid;
}

/* ================================================================
   PAYPAL CHECKOUT
   PayPal SDK is loaded in checkout.html.
   Renders the PayPal button inside #pay-paypal panel.
   On approval — clears cart and shows confirmation screen.
   ================================================================ */
function initPayPalButton() {
  // Only run on checkout page and only if PayPal SDK loaded
  if (!document.getElementById('pay-paypal')) return;
  if (typeof paypal === 'undefined') {
    // SDK not loaded yet — checkout.html's loader calls this again once it's ready.
    return;
  }

  // Clear any existing PayPal button
  const container = document.getElementById('pay-paypal');
  const existingBtn = container.querySelector('.paypal-buttons');
  if (existingBtn) existingBtn.remove();

  function getCustomerAndShipping() {
    const val = (id) => document.getElementById(id)?.value || '';
    return {
      customer: {
        name: `${val('ship-first')} ${val('ship-last')}`.trim(),
        email: val('contact-email'),
        phone: val('contact-phone'),
      },
      shipping: {
        address1: val('ship-address1'),
        address2: val('ship-address2'),
        city: val('ship-city'),
        state: val('ship-state'),
        postal_code: val('ship-zip'),
        country: val('ship-country'),
      },
    };
  }

  paypal.Buttons({
    style: {
      layout:  'vertical',
      color:   'gold',
      shape:   'rect',
      label:   'paypal',
      height:  48
    },

    // Ask OUR server to create the PayPal order — it resolves real prices
    // from the database (never trusts amounts from the browser) and
    // records a "pending" order so it shows in the admin panel right away.
    createOrder: async function() {
      const cart = getCart();
      if (!cart.length) { showAddedToast('Your cart is empty.'); throw new Error('Empty cart'); }

      const { customer, shipping } = getCustomerAndShipping();
      const resp = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, qty: i.qty || 1 })),
          coupon_code: appliedCouponCode || undefined,
          customer, shipping,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { showAddedToast(data.error || 'Could not start checkout.'); throw new Error(data.error || 'create-order failed'); }
      return data.paypal_order_id;
    },

    // Ask OUR server to capture the payment — only once PayPal itself
    // confirms funds moved does the order get marked "paid".
    onApprove: async function(data) {
      const resp = await fetch(`/api/paypal/capture-order/${encodeURIComponent(data.orderID)}`, { method: 'POST' });
      const result = await resp.json();
      if (!resp.ok) {
        showAddedToast(result.error || 'Payment could not be completed. Please try again.');
        return;
      }

      // Clear cart
      saveCart([]);
      updateCartBadge();

      // Show confirmation screen
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;
                    justify-content:center;font-family:'DM Sans',sans-serif;
                    background:var(--bg-page,#faf8f4);text-align:center;padding:40px;">
          <div>
            <div style="font-size:4rem;margin-bottom:16px;">✦</div>
            <h1 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;
                       color:#1a1228;margin-bottom:12px;">Order Confirmed!</h1>
            <p style="color:#7a6e8a;margin-bottom:8px;">
              Thank you${result.payer_name ? `, <strong>${result.payer_name}</strong>` : ''}!
            </p>
            <p style="color:#7a6e8a;margin-bottom:24px;">
              Order ID: <code>${result.order_id}</code><br/>
              ${result.payer_email ? `A confirmation has been sent to <strong>${result.payer_email}</strong>.` : ''}
            </p>
            <a href="index.html"
               style="background:#b8975a;color:#1a1228;padding:14px 32px;
                      border-radius:8px;font-weight:600;text-decoration:none;">
              Continue Shopping
            </a>
          </div>
        </div>`;
    },

    // Called if buyer cancels on PayPal
    onCancel: function() {
      showAddedToast('Payment cancelled. Your cart is still saved.');
    },

    // Called on any PayPal error
    onError: function(err) {
      console.error('PayPal error:', err);
      showAddedToast('Payment error. Please try again or contact us.');
    }

  }).render('#pay-paypal');
}

// LINE 780: handleCheckoutSubmit — now only validates form then PayPal handles payment
function handleCheckoutSubmit(form) {
  // Form is valid — PayPal button is already rendered and handles payment
  // Just scroll to the PayPal button panel
  const payPanel = document.getElementById('pay-paypal');
  if (payPanel) {
    // Activate PayPal tab
    document.querySelectorAll('.payment-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.payment-panel').forEach(p => p.hidden = true);
    const paypalTab = document.getElementById('tab-paypal');
    if (paypalTab) {
      paypalTab.classList.add('active');
      paypalTab.setAttribute('aria-selected', 'true');
    }
    payPanel.hidden = false;
    payPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showAddedToast('Please complete payment via PayPal above.');
  }
}


/* ================================================================
   LINE 780 — 9. PRODUCT GALLERY
   Thumbnail click switches main image on product.html
   ================================================================ */
function initProductGallery() {
  const mainImg  = document.getElementById('gallery-main-img');
  const thumbs   = document.querySelectorAll('.gallery-thumb');
  if (!mainImg || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      // Update main image
      const img = thumb.querySelector('img');
      if (img) {
        mainImg.src = img.src;
        mainImg.alt = img.alt;
      }

      // Update active state + aria-pressed
      thumbs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      thumb.classList.add('active');
      thumb.setAttribute('aria-pressed', 'true');
    });

    // LINE 800: Keyboard support — Enter/Space activate thumb
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });

  // LINE 809: Keyboard left/right arrow navigation for thumbnails
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && thumbs[i + 1]) {
        thumbs[i + 1].focus();
        thumbs[i + 1].click();
      }
      if (e.key === 'ArrowLeft' && thumbs[i - 1]) {
        thumbs[i - 1].focus();
        thumbs[i - 1].click();
      }
    });
  });
}


/* ================================================================
   PRODUCT DETAIL PAGE — loads the real product from the API using
   the ?id= in the URL. Fixes the bug where every product.html link
   showed identical static content regardless of which item was
   clicked in the shop.
   ================================================================ */
async function initProductDetailPage() {
  const section = document.getElementById('product-detail-section');
  if (!section) return; // not on product.html

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const notFound = document.getElementById('product-not-found');

  const showNotFound = () => {
    section.style.display = 'none';
    if (notFound) notFound.style.display = 'block';
  };

  if (!id) { showNotFound(); return; }

  let product;
  try {
    const resp = await fetch(`/api/products/${encodeURIComponent(id)}`);
    if (!resp.ok) { showNotFound(); return; }
    product = await resp.json();
  } catch {
    showNotFound(); return;
  }

  // Title / breadcrumb / heading
  document.title = `${product.name} — Arise Numero`;
  const breadcrumb = document.getElementById('breadcrumb-current');
  if (breadcrumb) breadcrumb.textContent = product.name;
  const heading = document.getElementById('product-heading');
  if (heading) heading.textContent = product.name;

  // Badges
  const badgesEl = document.getElementById('product-badges');
  if (badgesEl) {
    badgesEl.innerHTML = (product.badge ? `<span class="badge badge-bestseller">${product.badge}</span>` : '')
      + `<span class="badge badge-authentic">✓ Certified Authentic</span>`;
  }

  // Rating
  const starsEl = document.getElementById('product-stars');
  const ratingTextEl = document.getElementById('product-rating-text');
  if (starsEl) starsEl.textContent = '★★★★★☆☆☆☆☆'.slice(5 - Math.round(product.rating || 5), 10 - Math.round(product.rating || 5));
  if (ratingTextEl) ratingTextEl.textContent = `${(product.rating || 5).toFixed(1)} (${product.review_count || 0} reviews)`;
  const reviewsTabBtn = document.getElementById('btn-reviews');
  if (reviewsTabBtn) reviewsTabBtn.textContent = `Reviews (${product.review_count || 0})`;

  // Price
  const priceEl = document.getElementById('detail-price');
  if (priceEl) {
    priceEl.setAttribute('data-usd', product.price_usd);
    priceEl.textContent = `$${Number(product.price_usd).toFixed(2)}`;
    priceEl.setAttribute('aria-label', `Price: $${Number(product.price_usd).toFixed(2)}`);
  }
  const origEl = document.getElementById('detail-price-original');
  if (origEl) {
    if (product.original_price_usd) {
      origEl.setAttribute('data-usd', product.original_price_usd);
      origEl.textContent = `$${Number(product.original_price_usd).toFixed(2)}`;
      origEl.style.display = '';
    } else {
      origEl.style.display = 'none';
    }
  }

  // Stock status
  const stockWrap = document.getElementById('stock-status-wrap');
  const stockText = document.getElementById('stock-status-text');
  if (stockWrap && stockText) {
    stockWrap.classList.remove('stock-low', 'stock-out', 'stock-in');
    if (product.stock === 0) {
      stockWrap.classList.add('stock-out');
      stockText.textContent = '❌ Out of stock';
    } else if (product.stock <= product.low_stock_threshold) {
      stockWrap.classList.add('stock-low');
      stockText.textContent = `⚠️ Only ${product.stock} left in stock — order soon`;
    } else {
      stockWrap.classList.add('stock-in');
      stockText.textContent = '✅ In stock';
    }
  }

  // Specs
  const specMaterial = document.getElementById('spec-material');
  if (specMaterial) specMaterial.textContent = product.material || '—';
  const specBeadSize = document.getElementById('spec-bead-size');
  if (specBeadSize) specBeadSize.textContent = product.bead_size ? `${product.bead_size} diameter` : '—';

  // Description
  const descEl = document.getElementById('product-description');
  if (descEl) {
    descEl.innerHTML = `<h2>About This Crystal</h2>
      <p>${product.description || ''}</p>
      <p><strong>Note on natural variations:</strong> As a natural gemstone, colour, texture, and pattern may vary slightly from the photos shown. This is a mark of authenticity, not a defect.</p>`;
  }

  // Gallery — main image + thumbnails, rebuilt from product.images
  const images = (product.images && product.images.length) ? product.images : [product.image_url].filter(Boolean);
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg && images[0]) {
    mainImg.src = images[0];
    mainImg.alt = product.name;
  }
  const thumbsWrap = document.getElementById('gallery-thumbs');
  if (thumbsWrap && images.length) {
    thumbsWrap.innerHTML = images.map((src, i) => `
      <button class="gallery-thumb${i === 0 ? ' active' : ''}" aria-label="View ${product.name} image ${i + 1}" aria-pressed="${i === 0}">
        <img src="${src}" alt="${product.name} image ${i + 1}" width="80" height="80" loading="lazy" />
      </button>`).join('');
    initProductGallery(); // re-attach thumbnail listeners to the freshly-built buttons
  }

  // Add to Cart button + quantity cap
  const addBtn = document.getElementById('add-to-cart-main-btn');
  if (addBtn) {
    addBtn.dataset.id = product.id;
    addBtn.dataset.name = product.name;
    addBtn.dataset.price = product.price_usd;
    addBtn.setAttribute('aria-label', `Add ${product.name} bracelet to cart`);
    addBtn.disabled = product.stock === 0;
    addBtn.textContent = product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart';
  }
  const qtyInput = document.getElementById('qty-input');
  const qtyLimit = document.querySelector('.qty-limit');
  const maxQty = Math.max(1, Math.min(10, product.stock || 0));
  if (qtyInput) qtyInput.max = String(maxQty);
  if (qtyLimit) qtyLimit.textContent = product.stock > 0 ? `Max ${maxQty} available` : 'Currently unavailable';

  // Prices just changed — reformat for the active currency.
  if (typeof convertAllPrices === 'function') convertAllPrices();
}


/* ================================================================
   LINE 840 — 10. PRODUCT TABS
   Reviews / Shipping / Returns / Crystal Care
   Full ARIA tab pattern with keyboard navigation.
   ================================================================ */
function initProductTabs() {
  const tabList   = document.querySelector('.product-tabs');
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (!tabList || !tabBtns.length) return;

  function activateTab(index) {
    tabBtns.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    tabPanels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
  }

  // LINE 857: Click
  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(i));
  });

  // LINE 862: Arrow key navigation (WCAG tab pattern)
  tabList.addEventListener('keydown', (e) => {
    const current = [...tabBtns].findIndex(b => b === document.activeElement);
    if (current === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (current + 1) % tabBtns.length;
      tabBtns[next].focus();
      activateTab(next);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (current - 1 + tabBtns.length) % tabBtns.length;
      tabBtns[prev].focus();
      activateTab(prev);
    }
    if (e.key === 'Home') { e.preventDefault(); tabBtns[0].focus(); activateTab(0); }
    if (e.key === 'End')  { e.preventDefault(); const l = tabBtns.length-1; tabBtns[l].focus(); activateTab(l); }
  });

  // LINE 878: Init first tab active
  activateTab(0);
}


/* ================================================================
   LINE 900 — 11. QUANTITY CONTROLS
   Works on product detail page (+/− buttons).
   Cart page has its own inline handler in initCartPage().
   ================================================================ */
function initQuantityControls() {
  // LINE 906: Product detail page qty
  const qtyInput  = document.getElementById('qty-input');
  const minusBtn  = document.querySelector('.qty-minus:not([data-id])');
  const plusBtn   = document.querySelector('.qty-plus:not([data-id])');
  if (!qtyInput) return;

  const max = parseInt(qtyInput.getAttribute('max')) || 10;
  const min = parseInt(qtyInput.getAttribute('min')) || 1;

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      const val = parseInt(qtyInput.value) || 1;
      if (val > min) {
        qtyInput.value = val - 1;
        qtyInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      const val = parseInt(qtyInput.value) || 1;
      if (val < max) {
        qtyInput.value = val + 1;
        qtyInput.dispatchEvent(new Event('change'));
      }
    });
  }

  qtyInput.addEventListener('change', () => {
    let val = parseInt(qtyInput.value);
    if (isNaN(val) || val < min) qtyInput.value = min;
    if (val > max)               qtyInput.value = max;
  });
}


/* ================================================================
   LINE 960 — 12. NUMEROLOGY CALCULATOR
   Life Path, Expression, Soul Urge, Birthday numbers.
   Pythagorean letter-value system.
   Results displayed with animation.
   ================================================================ */

// LINE 967: Pythagorean letter map
const PYTH = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
};

const VOWELS = new Set(['A','E','I','O','U']);

// LINE 977: Reduce a number to single digit (keep 11, 22, 33 as master)
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

// LINE 984: Calculate Life Path from date string "YYYY-MM-DD"
function calcLifePath(dob) {
  const [y, m, d] = dob.split('-').map(Number);
  const mR = reduceNum(m);
  const dR = reduceNum(d);
  const yR = reduceNum(String(y).split('').reduce((s,c) => s + parseInt(c), 0));
  return reduceNum(mR + dR + yR);
}

// LINE 992: Calculate Expression (full name, all letters)
function calcExpression(name) {
  const sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('').reduce((s, c) => s + (PYTH[c] || 0), 0);
  return reduceNum(sum);
}

// LINE 998: Calculate Soul Urge (vowels only)
function calcSoulUrge(name) {
  const sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('').filter(c => VOWELS.has(c)).reduce((s, c) => s + (PYTH[c] || 0), 0);
  return reduceNum(sum);
}

// LINE 1004: Birthday number (day of birth, reduced)
function calcBirthday(dob) {
  const day = parseInt(dob.split('-')[2]);
  return reduceNum(day);
}

// LINE 1009: Number meanings
const NUMBER_MEANINGS = {
  1:  { title: 'The Leader',     desc: 'Independent, pioneering, and driven. You forge your own path with confidence and determination.' },
  2:  { title: 'The Peacemaker', desc: 'Diplomatic, empathetic, and cooperative. You excel at bringing harmony and understanding.' },
  3:  { title: 'The Creator',    desc: 'Expressive, joyful, and imaginative. You inspire others through creativity and communication.' },
  4:  { title: 'The Builder',    desc: 'Practical, disciplined, and reliable. You create lasting foundations through methodical effort.' },
  5:  { title: 'The Explorer',   desc: 'Adventurous, versatile, and free-spirited. You thrive on change and new experiences.' },
  6:  { title: 'The Nurturer',   desc: 'Compassionate, responsible, and caring. You find deep purpose in serving and protecting others.' },
  7:  { title: 'The Seeker',     desc: 'Analytical, introspective, and spiritual. You are driven by a deep quest for truth and wisdom.' },
  8:  { title: 'The Achiever',   desc: 'Ambitious, authoritative, and goal-oriented. You are built for material mastery and leadership.' },
  9:  { title: 'The Humanitarian', desc: 'Compassionate, idealistic, and giving. You are here to serve the greater good of humanity.' },
  11: { title: 'Master Intuitive', desc: 'Highly sensitive and spiritually aware. You carry a powerful gift for insight and inspiration.' },
  22: { title: 'Master Builder',   desc: 'The most powerful number. You have the ability to turn visionary dreams into concrete reality.' },
  33: { title: 'Master Teacher',   desc: 'Pure expression of loving compassion. You are here to uplift and heal humanity through unconditional love.' },
};

function getMeaning(n) {
  return NUMBER_MEANINGS[n] || { title: `Number ${n}`, desc: 'Your unique numeric energy carries its own powerful significance.' };
}

// LINE 1038: Init numerology form
function initNumerologyCalculator() {
  const form = document.getElementById('numerology-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('num-name');
    const dobInput  = document.getElementById('num-dob');
    const privChk   = document.getElementById('num-privacy');

    // LINE 1048: Validation
    let valid = true;
    [nameInput, dobInput].forEach(el => {
      if (!el || !el.value.trim()) {
        el?.style.setProperty('border-color', 'var(--color-error)');
        valid = false;
      } else {
        el?.style.setProperty('border-color', '');
      }
    });

    if (privChk && !privChk.checked) {
      privChk.focus();
      showFieldError(privChk, 'Please accept the privacy notice to continue.');
      valid = false;
    }

    if (!valid) return;

    const name = nameInput.value.trim();
    const dob  = dobInput.value;

    // LINE 1064: Calculate all numbers
    const lifePath   = calcLifePath(dob);
    const expression = calcExpression(name);
    const soulUrge   = calcSoulUrge(name);
    const birthday   = calcBirthday(dob);

    // LINE 1070: Display results
    const resultsEl = document.getElementById('numerology-results');
    if (!resultsEl) return;

    document.getElementById('results-name-display').textContent = `Reading for: ${name}`;
    document.getElementById('life-path-num').textContent  = lifePath;
    document.getElementById('expression-num').textContent = expression;
    document.getElementById('soul-urge-num').textContent  = soulUrge;
    document.getElementById('birthday-num').textContent   = birthday;

    document.getElementById('life-path-desc').textContent  = `${getMeaning(lifePath).title} — ${getMeaning(lifePath).desc}`;
    document.getElementById('expression-desc').textContent = `${getMeaning(expression).title} — ${getMeaning(expression).desc}`;
    document.getElementById('soul-urge-desc').textContent  = `${getMeaning(soulUrge).title} — ${getMeaning(soulUrge).desc}`;
    document.getElementById('birthday-desc').textContent   = `${getMeaning(birthday).title} — ${getMeaning(birthday).desc}`;

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// LINE 1090: Inline field error helper
function showFieldError(field, msg) {
  let err = field.parentElement.querySelector('.field-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'field-error';
    err.style.cssText = 'color:var(--color-error);font-size:0.8rem;margin-top:4px;';
    field.parentElement.appendChild(err);
  }
  err.textContent = msg;
  setTimeout(() => err?.remove(), 4000);
}


/* ================================================================
   LINE 1120 — 13. BOOKING PAGE
   Auto-detect timezone, package selection, form validation.
   ================================================================ */
function initBookingPage() {
  if (!document.getElementById('booking-form')) return;

  // LINE 1125: Auto-detect user timezone
  const tzSelect = document.getElementById('book-timezone');
  if (tzSelect) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Try to find matching option
      const option = [...tzSelect.options].find(o => o.value === tz);
      if (option) {
        tzSelect.value = tz;
      }
    } catch (e) { /* silently ignore */ }
  }

  // LINE 1138: Set minimum date for session booking (today + 1)
  const sessionDate = document.getElementById('book-session-date');
  if (sessionDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    sessionDate.min = tomorrow.toISOString().split('T')[0];
  }

  // LINE 1146: Package card selection
  initPackageSelect();

  // LINE 1149: Booking form submit
  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (validateBookingForm(form)) {
        handleBookingSubmit(form);
      }
    });
  }
}

function validateBookingForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(input => {
    input.style.borderColor = '';
    if (!input.value.trim() || (input.type === 'checkbox' && !input.checked)) {
      input.style.borderColor = 'var(--color-error)';
      if (valid) input.focus();
      valid = false;
    }
  });
  if (!valid) showAddedToast('Please fill in all required fields.');
  return valid;
}

async function handleBookingSubmit(form) {
  const btn = form.querySelector('[type="submit"]');
  if (btn) { btn.textContent = '⏳ Sending…'; btn.disabled = true; }

  // Collect selected reading focus areas
  const focusAreas = [...form.querySelectorAll('input[name="focus"]:checked')]
    .map(i => i.value).join(', ') || 'Not specified';

  const templateParams = {
    // ── Fields you selected ──────────────────────────────────
    client_email:    form.querySelector('#book-email')?.value        || '',
    birth_name:      form.querySelector('#book-birth-name')?.value   || '',
    date_of_birth:   form.querySelector('#book-dob')?.value          || '',
    package_selected: document.getElementById('selected-package-name')?.textContent || 'Not selected',
    timezone:        form.querySelector('#book-timezone')?.value     || '',
    session_date:    form.querySelector('#book-session-date')?.value || 'N/A (Written report)',
    reading_focus:   focusAreas,
    additional_notes: form.querySelector('#book-notes')?.value       || 'None',
    // ── Extra context sent automatically ────────────────────
    submitted_at:    new Date().toLocaleString(),
    to_name:         'Arise Numero Team',
  };

  try {
    // Save to our backend so it shows up in the admin panel's Bookings tab.
    // Best-effort: if this fails, we still send the EmailJS notification
    // below so the customer isn't blocked by a server hiccup.
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.querySelector('#book-first-name')?.value || '',
          last_name:  form.querySelector('#book-last-name')?.value  || '',
          client_email:     templateParams.client_email,
          birth_name:       templateParams.birth_name,
          date_of_birth:    templateParams.date_of_birth,
          package_selected: templateParams.package_selected,
          timezone:         templateParams.timezone,
          session_date:     templateParams.session_date,
          reading_focus:    templateParams.reading_focus,
          additional_notes: templateParams.additional_notes,
        }),
      });
    } catch (persistErr) {
      console.warn('Could not save booking to server (email will still be sent):', persistErr);
    }

    // ── PASTE YOUR IDs BELOW ─────────────────────────────────
    await emailjs.send(
      'YOUR_EMAILJS_SERVICE_ID',          // ← Paste your Service ID here
      'YOUR_EMAILJS_BOOKING_TEMPLATE_ID', // ← Paste your Booking Template ID here
      templateParams
    );
    // ── Success ──────────────────────────────────────────────
    if (btn) {
      btn.textContent = '✓ Booking Confirmed!';
      btn.style.background = 'var(--color-success,#2d7a4f)';
      btn.style.borderColor = 'var(--color-success,#2d7a4f)';
    }
    showAddedToast('Booking received! Check your email for confirmation.');

    // Scroll to top of form to show confirmation
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Insert success message above form
    const existing = document.getElementById('booking-success-msg');
    if (!existing) {
      const msg = document.createElement('div');
      msg.id = 'booking-success-msg';
      msg.className = 'form-success';
      msg.setAttribute('role', 'status');
      msg.innerHTML = `
        <strong>✓ Booking Confirmed!</strong><br/>
        We have received your booking. A confirmation has been sent to
        <strong>${templateParams.client_email}</strong>.
        We will be in touch within 24 hours.`;
      form.parentElement.insertBefore(msg, form);
    }

    form.reset();

  } catch (err) {
    console.error('EmailJS booking error:', err);
    if (btn) { btn.textContent = '🔒 Book & Pay Securely'; btn.disabled = false; }
    showAddedToast('Something went wrong. Please email us directly at hello@arisenumero.com');
  }
}


/* ================================================================
   SHOP PAGE — renders the product grid live from /api/products
   (which is backed by the same database the admin panel edits),
   instead of the old hardcoded 8 products. Then re-runs the
   existing filter/sort wiring against the freshly-built cards.
   ================================================================ */
function badgeClass(badge) {
  if (!badge) return '';
  const b = badge.toLowerCase();
  if (b === 'sale') return 'product-badge--sale';
  if (b === 'new' || b === 'premium') return 'product-badge--new';
  return '';
}

function productCardHTML(p) {
  const badge = p.badge
    ? `<div class="product-badge ${badgeClass(p.badge)}">${p.badge}</div>`
    : '';
  const stockWarn = (p.stock > 0 && p.stock <= (p.low_stock_threshold || 5))
    ? `<div class="stock-warning" role="status" aria-label="Low stock">Only ${p.stock} left!</div>`
    : (p.stock === 0 ? `<div class="stock-warning" role="status" aria-label="Out of stock">Out of stock</div>` : '');
  const stars = '★★★★★☆☆☆☆☆'.slice(5 - Math.round(p.rating || 5), 10 - Math.round(p.rating || 5));
  const originalPrice = p.original_price_usd
    ? `<span class="price-original" aria-label="Original price $${Number(p.original_price_usd).toFixed(2)}">$${Number(p.original_price_usd).toFixed(2)}</span>`
    : '';
  const img = (p.images && p.images[0]) || p.image_url || '';

  return `
    <article class="product-card" role="listitem" data-crystal="${p.category || ''}" data-price="${p.price_usd}" data-size="${p.bead_size || ''}">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-img-link" aria-label="View ${p.name} bracelet">
        <div class="product-img-wrap">
          <img src="${img}" alt="${p.name} — ${p.material || ''}" class="product-img" loading="lazy" width="400" height="400" />
          ${badge}
          ${stockWarn}
        </div>
      </a>
      <div class="product-info">
        <h2 class="product-name"><a href="product.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h2>
        <p class="product-material">${p.material || ''}</p>
        <div class="product-rating" aria-label="${(p.rating || 5).toFixed(1)} out of 5 stars"><span aria-hidden="true">${stars}</span> <span class="rating-count">(${p.review_count || 0})</span></div>
        <div class="product-price-row">
          <span class="product-price" data-usd="${p.price_usd}">$${Number(p.price_usd).toFixed(2)}</span>
          ${originalPrice}
          <button class="btn btn-primary btn-sm add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price_usd}" aria-label="Add ${p.name} to cart" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</button>
        </div>
      </div>
    </article>`;
}

async function initShopPage() {
  const grid = document.getElementById('product-grid');
  if (!grid) return; // not on shop.html

  try {
    const resp = await fetch('/api/products');
    if (!resp.ok) throw new Error('Failed to load products');
    const products = await resp.json();

    grid.innerHTML = products.length
      ? products.map(productCardHTML).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:40px 0;">No products available right now — check back soon.</div>`;
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-muted,#8a7a95);">Could not load products. Please refresh the page.</div>`;
    return;
  }

  // Cards now exist in the DOM — wire up filters/sort/currency against them.
  initShopFilters();
  if (typeof convertAllPrices === 'function') convertAllPrices();
}


/* ================================================================
   LINE 1210 — 14. SHOP FILTERS & SORT
   Filters product cards by crystal, price, size, availability.
   Sort by featured, price, rating, newest.
   ================================================================ */
function initShopFilters() {
  const productCards = document.querySelectorAll('.product-card[data-crystal]');
  if (!productCards.length) return;

  const resultsCount = document.getElementById('results-count');
  const sortSelect   = document.getElementById('sort-select');
  const resetBtn     = document.getElementById('filter-reset');
  const grid         = document.querySelector('.product-grid');

  function getActiveFilters() {
    const crystals = [...document.querySelectorAll('input[name="crystal"]:checked')].map(i => i.value);
    const price    = document.querySelector('input[name="price"]:checked')?.value || 'all';
    const sizes    = [...document.querySelectorAll('input[name="size"]:checked')].map(i => i.value);
    const inStock  = document.querySelector('input[name="avail"]:checked') !== null;
    return { crystals, price, sizes, inStock };
  }

  function matchesFilters(card, filters) {
    const crystal   = card.dataset.crystal  || '';
    const priceUSD  = parseFloat(card.dataset.price || '0');
    const size      = card.dataset.size     || '';
    const stockWarn = card.querySelector('.stock-warning');
    const isOut     = stockWarn && stockWarn.textContent.includes('0');

    // Crystal filter
    if (!filters.crystals.includes('all') && !filters.crystals.includes(crystal)) return false;

    // Price filter
    if (filters.price === '0-20'  && !(priceUSD < 20))             return false;
    if (filters.price === '20-30' && !(priceUSD >= 20 && priceUSD < 30)) return false;
    if (filters.price === '30-50' && !(priceUSD >= 30 && priceUSD < 50)) return false;
    if (filters.price === '50+'   && !(priceUSD >= 50))             return false;

    // Size filter
    if (filters.sizes.length && !filters.sizes.includes(size))      return false;

    // Availability
    if (filters.inStock && isOut) return false;

    return true;
  }

  function applyFilters() {
    const filters = getActiveFilters();
    let visible   = 0;

    const cards = [...productCards];

    // LINE 1264: Sort
    if (sortSelect) {
      const sortVal = sortSelect.value;
      cards.sort((a, b) => {
        if (sortVal === 'price-low')  return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        if (sortVal === 'price-high') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        if (sortVal === 'rating') {
          const ra = parseFloat(a.querySelector('.product-rating')?.getAttribute('aria-label') || '0');
          const rb = parseFloat(b.querySelector('.product-rating')?.getAttribute('aria-label') || '0');
          return rb - ra;
        }
        return 0; // featured / newest — keep original order
      });
      // Re-append in sorted order
      cards.forEach(c => grid?.appendChild(c));
    }

    // LINE 1280: Show/hide
    cards.forEach(card => {
      const show = matchesFilters(card, filters);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    // LINE 1286: Update count
    if (resultsCount) {
      resultsCount.textContent = `Showing ${visible} product${visible !== 1 ? 's' : ''}`;
    }
  }

  // LINE 1292: Wire up all filter inputs
  document.querySelectorAll('input[name="crystal"], input[name="price"], input[name="size"], input[name="avail"]')
    .forEach(input => input.addEventListener('change', applyFilters));

  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  // LINE 1299: Reset filters button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="crystal"]').forEach(i => { i.checked = i.value === 'all'; });
      document.querySelectorAll('input[name="price"]').forEach(i   => { i.checked = i.value === 'all'; });
      document.querySelectorAll('input[name="size"]').forEach(i    => { i.checked = false; });
      document.querySelectorAll('input[name="avail"]').forEach(i   => { i.checked = false; });
      if (sortSelect) sortSelect.value = 'featured';
      applyFilters();
    });
  }

  // Run on load
  applyFilters();
}


/* ================================================================
   LINE 1340 — 15. CONTACT FORM
   Subject dropdown shows/hides order number field.
   Form validation + simulated submission.
   ================================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // LINE 1347: Show order number field for order-related subjects
  const subject    = document.getElementById('contact-subject');
  const orderGroup = document.getElementById('order-number-group');

  if (subject && orderGroup) {
    subject.addEventListener('change', () => {
      orderGroup.hidden = subject.value !== 'order' && subject.value !== 'return';
    });
  }

  // LINE 1357: Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(input => {
      input.style.borderColor = '';
      if (!input.value.trim() || (input.type === 'checkbox' && !input.checked)) {
        input.style.borderColor = 'var(--color-error)';
        if (valid) input.focus();
        valid = false;
      }
    });

    if (!valid) return;

    const btn       = form.querySelector('[type="submit"]');
    const successEl = document.getElementById('contact-success');
    const errorEl   = document.getElementById('contact-error');

    if (btn) { btn.textContent = '⏳ Sending…'; btn.disabled = true; }

    // Build template params with all selected fields
    const templateParams = {
      // ── Fields you selected ──────────────────────────────
      from_name:    form.querySelector('#contact-name')?.value         || '',
      from_email:   form.querySelector('#contact-email-field')?.value  || '',
      phone:        form.querySelector('#contact-phone')?.value        || 'Not provided',
      subject:      form.querySelector('#contact-subject')?.value      || '',
      message:      form.querySelector('#contact-message')?.value      || '',
      order_number: form.querySelector('#contact-order-num')?.value    || 'N/A',
      // ── Extra context sent automatically ─────────────────
      submitted_at: new Date().toLocaleString(),
      to_name:      'Arise Numero Team',
    };

    try {
      // ── PASTE YOUR IDs BELOW ──────────────────────────────
      await emailjs.send(
        'YOUR_EMAILJS_SERVICE_ID',           // ← Paste your Service ID here
        'YOUR_EMAILJS_CONTACT_TEMPLATE_ID',  // ← Paste your Contact Template ID here
        templateParams
      );
      // ── Success ───────────────────────────────────────────
      if (successEl) { successEl.hidden = false; }
      if (errorEl)   { errorEl.hidden   = true;  }
      form.reset();
      successEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('EmailJS contact error:', err);
      if (errorEl)   { errorEl.hidden   = false; }
      if (successEl) { successEl.hidden = true;  }
    }

    if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; }
  });
}


/* ================================================================
   LINE 1400 — 16. FAQ ACCORDION ANIMATION
   Enhances native <details> elements with smooth height animation.
   ================================================================ */
function initFaqAccordion() {
  const details = document.querySelectorAll('.faq-item');
  if (!details.length) return;

  details.forEach(detail => {
    const summary = detail.querySelector('summary');
    const content = detail.querySelector('.faq-answer');
    if (!summary || !content) return;

    // LINE 1410: Smooth open/close with CSS
    content.style.overflow   = 'hidden';
    content.style.transition = 'max-height 0.3s ease, padding 0.3s ease';

    detail.addEventListener('toggle', () => {
      if (detail.open) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
      }
    });
  });
}


/* ================================================================
   LINE 1430 — 17. SCROLL & ACCESSIBILITY HELPERS
   ================================================================ */

// LINE 1433: Active nav link highlighting (desktop + mobile)
function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-link, .mobile-nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Strip query string for comparison
    const linkPage = href.split('?')[0].split('#')[0];

    if (linkPage === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

// LINE 1450: Smooth scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move focus to target for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
}

// LINE 1464: Scroll-to-top on page load (fix back-forward cache)
function fixBFCache() {
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      updateCartBadge();
      convertAllPrices();
    }
  });
}

// LINE 1472: Wishlist button toggle
function initWishlistBtn() {
  const btn = document.querySelector('.wishlist-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isWished = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', isWished ? 'false' : 'true');
    btn.textContent = isWished ? '♡ Wishlist' : '♥ Wishlisted';
    btn.style.color = isWished ? '' : 'var(--color-error)';
    btn.style.borderColor = isWished ? '' : 'var(--color-error)';
  });
}

// LINE 1484: Booking form — show/hide session date based on premium package
function initSessionDateToggle() {
  const sessionGroup = document.getElementById('session-time-group');
  if (!sessionGroup) return;

  // Default: hide for non-live packages
  sessionGroup.hidden = true;

  document.querySelectorAll('.select-package').forEach(btn => {
    btn.addEventListener('click', () => {
      const pkg = btn.dataset.package;
      sessionGroup.hidden = pkg !== 'premium';
      const input = sessionGroup.querySelector('input');
      if (input) input.required = pkg === 'premium';
    });
  });
}


/* ================================================================
   LINE 1470 — 18. INIT
   Runs all modules on DOMContentLoaded.
   Each function checks if its elements exist before running,
   so it is safe to include on every page.
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // LINE 1478: Core — runs on every page
  initTheme();
  initFooterYear();
  initMobileNav();        // ← Mobile nav: works on all 12 pages
  initCookieBanner();
  initCurrencySwitcher();
  initAddToCartButtons();
  updateCartBadge();
  highlightActiveNav();
  initSmoothScroll();
  fixBFCache();

  // LINE 1489: Page-specific — each checks for its own elements
  initCartPage();         // cart.html
  initUpdateCart();       // cart.html
  initCheckoutPage();     // checkout.html
  initPayPalButton();     // checkout.html — renders PayPal button
  initProductGallery();   // product.html
  initProductTabs();      // product.html
  initQuantityControls(); // product.html
  initProductDetailPage(); // product.html — loads the real product from the API
  initNumerologyCalculator(); // numerology.html
  initBookingPage();      // booking.html
  initSessionDateToggle();// booking.html
  initShopPage();          // shop.html — loads live products from the API
  initContactForm();      // contact.html
  initFaqAccordion();     // contact.html
  initWishlistBtn();      // product.html
  initPackageSelect();    // booking.html (also called inside initBookingPage but safe to double-call)

  // LINE 1505: Update cart totals if on cart or checkout
  if (document.getElementById('summary-subtotal') ||
      document.getElementById('co-subtotal')) {
    updateCartTotals();
  }

  // LINE 1511: Convert all prices after currency is resolved
  // (also called inside initCurrencySwitcher, but belt-and-suspenders)
  setTimeout(convertAllPrices, 100);

});

/* ================================================================
   END OF main.js
   ================================================================ */

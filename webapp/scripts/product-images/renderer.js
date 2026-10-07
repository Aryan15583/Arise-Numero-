// Browser-side renderer for the product images (run by ../render-product-images.mjs
// inside headless Chromium). Every bead is shaded per pixel: procedural stone
// texture, diffuse + specular lighting, translucency glow, a soft window
// reflection and a contact shadow. Deterministic: the same seed gives the same image.

/* eslint-disable */
(function () {
  // ── Seeded random + value noise ─────────────────────────────────────────
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeNoise(seed) {
    const rand = mulberry32(seed);
    const perm = new Uint8Array(512);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const vals = new Float32Array(256).map(() => rand());
    const fade = (t) => t * t * (3 - 2 * t);
    function noise3(x, y, z) {
      const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      const xf = x - xi, yf = y - yi, zf = z - zi;
      const u = fade(xf), v = fade(yf), w = fade(zf);
      const h = (a, b, c) => vals[perm[(perm[(perm[a & 255] + b) & 255] + c) & 255]];
      const lerp = (a, b, t) => a + (b - a) * t;
      const x1 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u);
      const x2 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u);
      const x3 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u);
      const x4 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u);
      return lerp(lerp(x1, x2, v), lerp(x3, x4, v), w);
    }
    function fbm(x, y, z, oct = 4) {
      let a = 0.5, f = 1, s = 0, n = 0;
      for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); n += a; a *= 0.5; f *= 2.03; }
      return s / n;
    }
    return { noise3, fbm };
  }

  const mix = (a, b, t) => a + (b - a) * t;
  const mixc = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // ── Stone materials: albedo(point on sphere) + optical properties ────────
  // p = surface point (unit sphere, already rotated per bead), N = noise.
  const STONES = {
    amethyst: {
      shininess: 95, spec: 0.9, gloss2: 0.38, translucency: 0.75, ambient: 0.36,
      albedo(p, N) {
        const warp = N.fbm(p[0] * 1.8, p[1] * 1.8, p[2] * 1.8);
        const zone = N.fbm(p[0] * 1.3 + warp * 1.6, p[1] * 1.3, p[2] * 1.3 + 5);
        const cloud = N.fbm(p[0] * 4 + 10, p[1] * 4, p[2] * 4);
        let c = mixc(hex("#4a2373"), hex("#a77bd6"), smooth(0.25, 0.8, zone));
        c = mixc(c, hex("#e6dbf3"), smooth(0.62, 0.9, cloud) * 0.5); // milky quartz inclusions
        c = mixc(c, hex("#2c1247"), smooth(0.7, 0.95, 1 - zone) * 0.35); // deep colour zones
        return c;
      },
    },
    roseQuartz: {
      shininess: 75, spec: 0.75, gloss2: 0.32, translucency: 0.65, ambient: 0.45,
      albedo(p, N) {
        const cloud = N.fbm(p[0] * 2.4, p[1] * 2.4, p[2] * 2.4);
        const fine = N.fbm(p[0] * 9, p[1] * 9, p[2] * 9, 3);
        let c = mixc(hex("#eab0bd"), hex("#f8dde2"), smooth(0.2, 0.85, cloud));
        c = mixc(c, hex("#fbeef0"), smooth(0.68, 0.9, fine) * 0.4);
        return c;
      },
    },
    lapis: {
      shininess: 60, spec: 0.55, gloss2: 0.22, translucency: 0.0, ambient: 0.28,
      albedo(p, N, bead) {
        const base = N.fbm(p[0] * 2.5, p[1] * 2.5, p[2] * 2.5);
        let c = mixc(hex("#14286e"), hex("#2e4fb4"), smooth(0.2, 0.85, base));
        const vein = Math.abs(N.fbm(p[0] * 3.2 + 4, p[1] * 3.2, p[2] * 3.2) - 0.5);
        c = mixc(c, hex("#b9c4dc"), (1 - smooth(0.0, 0.025, vein)) * 0.45); // calcite streaks
        const fleck = N.noise3(p[0] * 38 + bead, p[1] * 38, p[2] * 38);
        if (fleck > 0.8) c = mixc(c, hex("#f0cf72"), smooth(0.8, 0.88, fleck)); // pyrite
        return c;
      },
    },
    tourmaline: {
      shininess: 38, spec: 0.35, gloss2: 0.15, translucency: 0.0, ambient: 0.22,
      albedo(p, N) {
        const stri = N.fbm(p[0] * 1.2, p[1] * 18, p[2] * 1.2, 3); // striations
        const c = mixc(hex("#0d0d10"), hex("#3a3a42"), smooth(0.45, 0.9, stri) * 0.8);
        return c;
      },
    },
    citrine: {
      shininess: 120, spec: 0.95, gloss2: 0.42, translucency: 0.9, ambient: 0.45,
      albedo(p, N) {
        const cloud = N.fbm(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6);
        const fine = N.fbm(p[0] * 6 + 3, p[1] * 6, p[2] * 6, 3);
        let c = mixc(hex("#e3a93d"), hex("#f6dd8c"), smooth(0.15, 0.85, cloud));
        c = mixc(c, hex("#fdf3cf"), smooth(0.55, 0.9, fine) * 0.45); // pale clear zones
        return c;
      },
    },
    obsidian: {
      shininess: 180, spec: 1.1, gloss2: 0.6, translucency: 0.0, ambient: 0.16,
      albedo(p, N) {
        const sheen = N.fbm(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6);
        return mixc(hex("#050506"), hex("#26222a"), smooth(0.55, 0.95, sheen) * 0.7);
      },
    },
    gold: {
      shininess: 55, spec: 1.2, gloss2: 0.8, translucency: 0.0, ambient: 0.35, metal: true,
      albedo(p, N) {
        return mixc(hex("#a8792c"), hex("#e9c877"), smooth(0.2, 0.9, N.fbm(p[0] * 3, p[1] * 3, p[2] * 3)));
      },
    },
  };

  const L = (() => { const v = [-0.48, -0.62, 0.62]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
  const H = (() => { const v = [L[0], L[1], L[2] + 1]; const m = Math.hypot(...v); return v.map((x) => x / m); })();

  // Renders one bead to its own canvas (diameter d px, with 1px AA edge).
  function renderBead(d, stoneKey, seed, opts = {}) {
    const stone = STONES[stoneKey];
    const N = makeNoise(seed);
    const rand = mulberry32(seed * 7 + 3);
    const size = Math.ceil(d) + 2;
    const cv = document.createElement("canvas");
    cv.width = size; cv.height = size;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(size, size);
    const r = d / 2, c0 = size / 2;
    // Random rotation so every bead shows a different part of the stone.
    const a = rand() * Math.PI * 2, b = rand() * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const flat = opts.rondelle ? 0.55 : 1; // spacer beads are squashed discs
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5 - c0) / r, ny = (y + 0.5 - c0) / (r * flat);
        const dist = Math.hypot(nx, (y + 0.5 - c0) / r);
        const edge = (1 - dist) * r; // px inside the silhouette
        if (edge <= -1 || nx * nx + ny * ny > 1.02) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        // rotate point for texture lookup
        let px = nx * ca - nz * sa, pz = nx * sa + nz * ca;
        let py = ny * cb - pz * sb; pz = ny * sb + pz * cb;
        const alb = stone.albedo([px, py, pz], N, seed);
        const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        const ndh = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
        const fres = Math.pow(1 - nz, 3);
        let lum = stone.ambient + (1 - stone.ambient) * ndl;
        let col = alb.map((v) => v * lum);
        // translucency: light passing through glows on the far side
        if (stone.translucency) {
          const back = Math.max(0, -(nx * L[0] + ny * L[1])) * (0.55 + 0.45 * nz);
          const glow = Math.pow(back, 1.6) * stone.translucency;
          col = col.map((v, i) => v + alb[i] * glow * 0.9);
        }
        // metal tints its highlights; stone highlights are white
        const spec = Math.pow(ndh, stone.shininess) * stone.spec * 255;
        const tint = stone.metal ? alb.map((v) => v / 255) : [1, 1, 1];
        col = col.map((v, i) => v + spec * tint[i]);
        // soft window reflection (secondary, broad highlight)
        const wx = nx + 0.42, wy = ny + 0.36;
        const win = Math.exp(-(wx * wx * 18 + wy * wy * 9)) * stone.gloss2 * 140;
        col = col.map((v, i) => v + win * tint[i]);
        // rim: fresnel sky reflection on top, dark occlusion near the table
        col = col.map((v) => v * (1 - fres * 0.35) + fres * 38 * stone.gloss2 * (ny < 0 ? 1 : 0.3));
        const occl = 1 - smooth(0.35, 1, ny) * 0.35;
        col = col.map((v) => v * occl);
        const i4 = (y * size + x) * 4;
        img.data[i4] = clamp(col[0], 0, 255);
        img.data[i4 + 1] = clamp(col[1], 0, 255);
        img.data[i4 + 2] = clamp(col[2], 0, 255);
        img.data[i4 + 3] = clamp(edge + 1, 0, 1) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  // ── Surfaces ────────────────────────────────────────────────────────────
  function grain(ctx, w, h, amount, seed) {
    const rand = mulberry32(seed);
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rand() - 0.5) * amount;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function surface(ctx, w, h, kind, seed) {
    if (kind === "linen") {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#f4eee6"); g.addColorStop(1, "#e3d8ca");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.05; ctx.strokeStyle = "#8a7a66";
      for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 2); ctx.stroke(); }
      for (let x = 0; x < w; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, h); ctx.stroke(); }
      ctx.globalAlpha = 1;
      grain(ctx, w, h, 10, seed);
    } else if (kind === "slate") {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#3b3a40"); g.addColorStop(1, "#1d1c21");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const N = makeNoise(seed);
      const img = ctx.getImageData(0, 0, w, h);
      for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
        const n = N.fbm(x / 160, y / 60, 0.5, 4) - 0.5;
        const i = (y * w + x) * 4;
        img.data[i] += n * 40; img.data[i + 1] += n * 40; img.data[i + 2] += n * 44;
      }
      ctx.putImageData(img, 0, 0);
      grain(ctx, w, h, 12, seed + 1);
    } else if (kind === "marble") {
      ctx.fillStyle = "#f2f0ec"; ctx.fillRect(0, 0, w, h);
      const N = makeNoise(seed);
      const img = ctx.getImageData(0, 0, w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const t = N.fbm(x / 420, y / 420, 0.3, 3);
        const v = Math.abs(Math.sin((x * 0.8 + y) / 260 + t * 5));
        const vein = (1 - smooth(0, 0.16, v)) * 0.6 + (1 - smooth(0, 0.04, v)) * 0.4;
        const i = (y * w + x) * 4;
        const d = vein * 26 + (t - 0.5) * 16;
        img.data[i] -= d; img.data[i + 1] -= d * 0.97; img.data[i + 2] -= d * 0.9;
      }
      ctx.putImageData(img, 0, 0);
      ctx.save(); ctx.filter = "blur(1.5px)"; ctx.drawImage(ctx.canvas, 0, 0); ctx.restore();
      grain(ctx, w, h, 6, seed + 1);
    }
    // soft key light from top-left + vignette
    const lg = ctx.createRadialGradient(w * 0.25, h * 0.15, 0, w * 0.25, h * 0.15, w * 1.1);
    lg.addColorStop(0, "rgba(255,250,240,0.18)"); lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
    const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.22)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // ── Bracelet layout ─────────────────────────────────────────────────────
  // A ring of touching beads lying on the table, seen from above at an angle.
  function layoutBracelet({ cx, cy, R, tilt, beadMm, stone, pattern, seed, rot = 0, wristMm = 180 }) {
    // Real bead count for a ~18cm wrist, then space items by their actual widths.
    const count = Math.round(wristMm / beadMm);
    const kinds = Array.from({ length: count }, (_, i) => (pattern ? pattern(i, count) : stone));
    const widths = kinds.map((k) => (k === "gold" ? 0.45 : 1)); // spacers are thin rondelles
    const total = widths.reduce((a, b) => a + b, 0);
    const unit = (2 * Math.PI * R) / total; // px per full bead
    const beads = [];
    let acc = 0;
    kinds.forEach((kind, i) => {
      const th = rot + ((acc + widths[i] / 2) / total) * Math.PI * 2;
      acc += widths[i];
      const isGold = kind === "gold";
      const depth = Math.sin(th);
      const scale = 1 + 0.07 * depth;
      beads.push({
        x: cx + R * Math.cos(th),
        y: cy + R * Math.sin(th) * tilt,
        d: unit * 0.985 * scale * (isGold ? 0.78 : 1),
        stone: kind,
        rondelle: isGold,
        angle: th,
        depth,
        seed: (seed + i) * 97 + 11,
      });
    });
    return beads;
  }

  function drawBeads(ctx, beads, opts = {}) {
    const sorted = [...beads].sort((a, b) => a.y - b.y);
    // elastic cord, visible in the gaps
    ctx.save();
    ctx.strokeStyle = "rgba(240,236,230,0.55)"; ctx.lineWidth = 2;
    ctx.beginPath();
    beads.forEach((b, i) => (i ? ctx.lineTo(b.x, b.y) : ctx.moveTo(b.x, b.y)));
    ctx.closePath(); ctx.stroke(); ctx.restore();
    for (const b of sorted) {
      // contact + cast shadow (light from top-left → shadow to bottom-right)
      ctx.save();
      ctx.filter = `blur(${Math.max(2, b.d * 0.12)}px)`;
      ctx.fillStyle = `rgba(30,20,10,${opts.shadow ?? 0.32})`;
      ctx.beginPath();
      ctx.ellipse(b.x + b.d * 0.16, b.y + b.d * 0.36, b.d * 0.5, b.d * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const b of sorted) {
      const bead = renderBead(b.d, b.stone, b.seed, { rondelle: b.rondelle });
      ctx.save();
      if (opts.dof && b.depth < opts.dof.below) ctx.filter = `blur(${((opts.dof.below - b.depth) * opts.dof.amount).toFixed(1)}px)`;
      if (b.rondelle && b.angle !== undefined) {
        // spacer discs sit across the cord: squash axis follows the tangent
        const tx = -Math.sin(b.angle), ty = Math.cos(b.angle) * (opts.tilt ?? 0.65);
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(ty, tx) - Math.PI / 2);
        ctx.drawImage(bead, -bead.width / 2, -bead.height / 2);
      } else {
        ctx.drawImage(bead, b.x - bead.width / 2, b.y - bead.height / 2);
      }
      ctx.restore();
    }
  }

  function giftBox(ctx, w, h) {
    const bx = w * 0.12, by = h * 0.14, bw = w * 0.76, bh = h * 0.72;
    ctx.save();
    ctx.filter = "blur(30px)"; ctx.fillStyle = "rgba(20,10,30,0.45)";
    ctx.fillRect(bx + 30, by + 40, bw, bh);
    ctx.restore();
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, "#3b2860"); g.addColorStop(1, "#1d1230");
    ctx.fillStyle = g;
    roundRect(ctx, bx, by, bw, bh, 26); ctx.fill();
    ctx.strokeStyle = "rgba(212,180,122,0.75)"; ctx.lineWidth = 3;
    roundRect(ctx, bx + 18, by + 18, bw - 36, bh - 36, 16); ctx.stroke();
    // cushion
    const ix = bx + 48, iy = by + 48, iw = bw - 96, ih = bh - 96;
    const cg = ctx.createRadialGradient(ix + iw / 2, iy + ih / 2, 20, ix + iw / 2, iy + ih / 2, iw * 0.7);
    cg.addColorStop(0, "#f5eee4"); cg.addColorStop(1, "#d9cbb8");
    ctx.fillStyle = cg; roundRect(ctx, ix, iy, iw, ih, 12); ctx.fill();
    ctx.save(); roundRect(ctx, ix, iy, iw, ih, 12); ctx.clip();
    ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 40; ctx.lineWidth = 40; ctx.strokeStyle = "rgba(0,0,0,0.2)";
    roundRect(ctx, ix - 20, iy - 20, iw + 40, ih + 40, 20); ctx.stroke();
    ctx.restore();
    // brand line in gold foil
    ctx.fillStyle = "#d4b47a"; ctx.font = "600 26px Georgia, serif"; ctx.textAlign = "center";
    ctx.save(); ctx.globalAlpha = 0.95;
    ctx.fillText("✦  ARISE NUMERO  ✦", w / 2, by + bh - 62);
    ctx.restore();
    return { ix, iy, iw, ih };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ── Scenes ──────────────────────────────────────────────────────────────
  // spec: { size, surface, seed, scene: "bracelet"|"closeup"|"box"|"pair"|"workbench", stone, beadMm, pattern }
  window.renderScene = function (spec) {
    const W = spec.size || 1200, Hh = spec.size || 1200;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = Hh;
    const ctx = cv.getContext("2d");
    const seed = spec.seed || 1;
    const pattern = spec.pattern === "goldEvery6" ? (i) => (i % 6 === 5 ? "gold" : spec.stone)
      : spec.pattern === "goldPairs" ? (i) => (i % 8 === 0 || i % 8 === 1 ? "gold" : spec.stone)
      : null;
    const beadMm = spec.beadMm || 8;

    if (spec.scene === "bracelet") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBeads(ctx, layoutBracelet({ cx: W / 2, cy: Hh * 0.5, R: W * 0.355, tilt: 0.62, beadMm, stone: spec.stone, pattern, seed, rot: 0.2 }), { shadow: spec.surface === "slate" ? 0.55 : 0.3 });
    } else if (spec.scene === "closeup") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBeads(ctx, layoutBracelet({ cx: W * 0.5, cy: Hh * 0.6 - W * 0.95 * 0.6, R: W * 0.95, tilt: 0.6, beadMm, stone: spec.stone, pattern, seed, rot: 0.08 }),
        { dof: { below: 0.75, amount: 14 }, shadow: 0.35 });
    } else if (spec.scene === "box") {
      surface(ctx, W, Hh, spec.surface || "marble", seed);
      const box = giftBox(ctx, W, Hh);
      const cx = box.ix + box.iw / 2, cy = box.iy + box.ih * 0.47;
      if (spec.pair) {
        drawBeads(ctx, layoutBracelet({ cx: cx - W * 0.1, cy, R: W * 0.155, tilt: 0.78, beadMm, stone: spec.stone, pattern, seed, rot: 0.3 }), { shadow: 0.28 });
        drawBeads(ctx, layoutBracelet({ cx: cx + W * 0.12, cy: cy + 10, R: W * 0.155, tilt: 0.78, beadMm, stone: spec.stone, pattern, seed: seed + 50, rot: 1.1 }), { shadow: 0.28 });
      } else {
        drawBeads(ctx, layoutBracelet({ cx, cy, R: W * 0.23, tilt: 0.78, beadMm, stone: spec.stone, pattern, seed, rot: 0.3 }), { shadow: 0.28 });
      }
    } else if (spec.scene === "pair") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBeads(ctx, layoutBracelet({ cx: W * 0.38, cy: Hh * 0.42, R: W * 0.26, tilt: 0.62, beadMm, stone: spec.stone, pattern, seed, rot: 0.2 }), { shadow: 0.3 });
      drawBeads(ctx, layoutBracelet({ cx: W * 0.62, cy: Hh * 0.6, R: W * 0.26, tilt: 0.62, beadMm, stone: spec.stone, pattern, seed: seed + 50, rot: 0.9 }), { shadow: 0.3 });
    } else if (spec.scene === "workbench") {
      // loose beads of every stone around a finished bracelet
      surface(ctx, W, Hh, "linen", seed);
      const rand = mulberry32(seed);
      const stones = ["amethyst", "roseQuartz", "lapis", "citrine", "obsidian", "tourmaline"];
      const loose = [];
      for (let i = 0; i < 42; i++) {
        const ang = rand() * Math.PI * 2, rad = W * (0.33 + rand() * 0.1);
        loose.push({ x: W / 2 + Math.cos(ang) * rad, y: Hh / 2 + Math.sin(ang) * rad * 0.9, d: (6 + rand() * 4) * 8.6, stone: stones[i % stones.length], depth: 0, seed: i * 31 + 5 });
      }
      drawBeads(ctx, layoutBracelet({ cx: W / 2, cy: Hh / 2, R: W * 0.22, tilt: 0.7, beadMm: 8, stone: "amethyst", pattern: (i) => (i % 2 ? "roseQuartz" : "amethyst"), seed, rot: 0.4 }), { shadow: 0.3 });
      const sorted = loose.sort((a, b) => a.y - b.y);
      for (const b of sorted) {
        ctx.save(); ctx.filter = `blur(${b.d * 0.12}px)`; ctx.fillStyle = "rgba(30,20,10,0.3)";
        ctx.beginPath(); ctx.ellipse(b.x + b.d * 0.16, b.y + b.d * 0.36, b.d * 0.5, b.d * 0.26, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        const bead = renderBead(b.d, b.stone, b.seed);
        ctx.drawImage(bead, b.x - bead.width / 2, b.y - bead.height / 2);
      }
    }
    return cv.toDataURL("image/jpeg", spec.quality || 0.86);
  };
})();

// Browser-side renderer for the product images (run by ../render-product-images.mjs
// inside headless Chromium). Every bead is shaded per pixel: procedural stone
// texture, diffuse + specular lighting, translucency glow, a soft window
// reflection and a contact shadow. Deterministic: the same seed gives the same image.

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

  // ── More stones for the full catalogue ─────────────────────────────────
  const fract = (v) => v - Math.floor(v);
  Object.assign(STONES, {
    clearQuartz: {
      shininess: 140, spec: 1.0, gloss2: 0.5, translucency: 0.6, ambient: 0.55,
      albedo(p, N) {
        const cloud = N.fbm(p[0] * 2.4, p[1] * 2.4, p[2] * 2.4);
        let c = mixc(hex("#dfe6ec"), hex("#fbfcfd"), smooth(0.3, 0.75, cloud));
        c = mixc(c, hex("#c3ccd4"), smooth(0.72, 0.9, N.fbm(p[0] * 7, p[1] * 7, p[2] * 7, 3)) * 0.45); // inclusions
        return c;
      },
    },
    moonstone: {
      shininess: 110, spec: 0.8, gloss2: 0.45, translucency: 0.5, ambient: 0.5,
      albedo(p, N) {
        const cloud = N.fbm(p[0] * 2, p[1] * 2, p[2] * 2);
        let c = mixc(hex("#d9dbe0"), hex("#f6f3ee"), smooth(0.25, 0.8, cloud));
        const sheen = smooth(0.4, 0.75, N.fbm(p[0] * 1.4 + 7, p[1] * 1.4, p[2] * 1.4));
        return mixc(c, hex("#8fb6ee"), sheen * 0.85); // blue adularescence
      },
    },
    redJasper: {
      shininess: 55, spec: 0.5, gloss2: 0.22, translucency: 0, ambient: 0.3,
      albedo(p, N) {
        const base = N.fbm(p[0] * 2.6, p[1] * 2.6, p[2] * 2.6);
        let c = mixc(hex("#7a2416"), hex("#b8462c"), smooth(0.2, 0.85, base));
        const vein = Math.abs(N.fbm(p[0] * 3 + 9, p[1] * 3, p[2] * 3) - 0.5);
        c = mixc(c, hex("#5a1a10"), (1 - smooth(0, 0.03, vein)) * 0.6);
        return mixc(c, hex("#d9a07c"), smooth(0.86, 0.95, N.noise3(p[0] * 30, p[1] * 30, p[2] * 30)) * 0.6);
      },
    },
    greenAventurine: {
      shininess: 70, spec: 0.6, gloss2: 0.3, translucency: 0.3, ambient: 0.35,
      albedo(p, N) {
        let c = mixc(hex("#2c6e47"), hex("#5ea97a"), smooth(0.2, 0.85, N.fbm(p[0] * 2.4, p[1] * 2.4, p[2] * 2.4)));
        const fleck = N.noise3(p[0] * 45, p[1] * 45, p[2] * 45);
        return mixc(c, hex("#d7f3df"), smooth(0.84, 0.92, fleck) * 0.8); // fuchsite sparkle
      },
    },
    greenJade: {
      shininess: 90, spec: 0.75, gloss2: 0.38, translucency: 0.45, ambient: 0.4,
      albedo(p, N) {
        const cloud = N.fbm(p[0] * 1.8, p[1] * 1.8, p[2] * 1.8);
        let c = mixc(hex("#2f7a4a"), hex("#79c08f"), smooth(0.15, 0.85, cloud));
        return mixc(c, hex("#cfeccd"), smooth(0.7, 0.92, N.fbm(p[0] * 5, p[1] * 5, p[2] * 5, 3)) * 0.35);
      },
    },
    pyrite: {
      shininess: 40, spec: 1.1, gloss2: 0.7, translucency: 0, ambient: 0.35, metal: true,
      albedo(p, N) {
        const facet = Math.floor(N.noise3(p[0] * 6, p[1] * 6, p[2] * 6) * 5) / 5; // crystalline facets
        return mixc(hex("#7d6a2f"), hex("#dcc56d"), smooth(0.1, 0.9, facet * 0.7 + N.fbm(p[0] * 3, p[1] * 3, p[2] * 3) * 0.4));
      },
    },
    tigerEye: {
      shininess: 85, spec: 0.75, gloss2: 0.35, translucency: 0.15, ambient: 0.32,
      albedo(p, N) {
        const warp = N.fbm(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6);
        const band = Math.sin((p[1] * 7 + warp * 5) * 1.3) * 0.5 + 0.5;
        let c = mixc(hex("#4a2a0e"), hex("#c98a2c"), smooth(0.2, 0.85, band));
        const chat = Math.pow(Math.abs(Math.sin(p[0] * 60 + warp * 8)), 12); // silky chatoyant fibres
        return mixc(c, hex("#f1c46a"), chat * 0.35);
      },
    },
    blackSulimani: {
      shininess: 120, spec: 0.9, gloss2: 0.45, translucency: 0, ambient: 0.2,
      albedo(p, N) {
        const t = p[1] * 2.2 + N.fbm(p[0] * 1.3, p[1] * 1.3, p[2] * 1.3) * 1.6;
        const line = Math.min(fract(t), 1 - fract(t));
        const c = mixc(hex("#0b0a0c"), hex("#1f1d22"), N.fbm(p[0] * 3, p[1] * 3, p[2] * 3));
        return mixc(c, hex("#ece9e2"), (1 - smooth(0.02, 0.07, line)) * 0.95); // white bands
      },
    },
    blackAgate: {
      shininess: 130, spec: 0.95, gloss2: 0.5, translucency: 0, ambient: 0.18,
      albedo(p, N) {
        const band = Math.sin((p[1] * 4 + N.fbm(p[0] * 1.5, p[1] * 1.5, p[2] * 1.5) * 3) * 2) * 0.5 + 0.5;
        return mixc(hex("#08080a"), hex("#2b2a30"), band * 0.6);
      },
    },
    turquoise: {
      shininess: 50, spec: 0.45, gloss2: 0.2, translucency: 0, ambient: 0.35,
      albedo(p, N) {
        let c = mixc(hex("#1f9e9a"), hex("#5fd0c4"), smooth(0.2, 0.85, N.fbm(p[0] * 2.5, p[1] * 2.5, p[2] * 2.5)));
        const vein = Math.abs(N.fbm(p[0] * 3.4 + 2, p[1] * 3.4, p[2] * 3.4) - 0.5);
        return mixc(c, hex("#3a2d22"), (1 - smooth(0, 0.022, vein)) * 0.85); // matrix web
      },
    },
    persianTurquoise: {
      shininess: 60, spec: 0.5, gloss2: 0.22, translucency: 0, ambient: 0.38,
      albedo(p, N) {
        let c = mixc(hex("#38b6d6"), hex("#86dbe8"), smooth(0.2, 0.85, N.fbm(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2)));
        const vein = Math.abs(N.fbm(p[0] * 2.6 + 5, p[1] * 2.6, p[2] * 2.6) - 0.5);
        return mixc(c, hex("#6b6352"), (1 - smooth(0, 0.012, vein)) * 0.5);
      },
    },
    sunstone: {
      shininess: 100, spec: 0.85, gloss2: 0.4, translucency: 0.45, ambient: 0.38,
      albedo(p, N) {
        let c = mixc(hex("#b9501f"), hex("#ec9a55"), smooth(0.2, 0.85, N.fbm(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2)));
        const glint = N.noise3(p[0] * 55, p[1] * 55, p[2] * 55);
        return mixc(c, hex("#ffe1b0"), smooth(0.86, 0.93, glint)); // copper glitter
      },
    },
    howlite: {
      shininess: 45, spec: 0.4, gloss2: 0.18, translucency: 0, ambient: 0.45,
      albedo(p, N) {
        let c = mixc(hex("#e7e4de"), hex("#f8f6f1"), N.fbm(p[0] * 2, p[1] * 2, p[2] * 2));
        const vein = Math.abs(N.fbm(p[0] * 3.2 + 1, p[1] * 3.2, p[2] * 3.2) - 0.5);
        return mixc(c, hex("#6f6a66"), (1 - smooth(0, 0.018, vein)) * 0.8);
      },
    },
    selenite: {
      shininess: 60, spec: 0.5, gloss2: 0.35, translucency: 0.5, ambient: 0.6,
      albedo(p, N) {
        const fibre = Math.sin(p[0] * 90 + N.fbm(p[0] * 2, p[1] * 2, p[2] * 2) * 6) * 0.5 + 0.5;
        return mixc(hex("#ece9e3"), hex("#ffffff"), 0.4 + fibre * 0.6);
      },
    },
    silver: {
      shininess: 60, spec: 1.2, gloss2: 0.9, translucency: 0, ambient: 0.4, metal: true,
      albedo(p, N) {
        return mixc(hex("#8e949b"), hex("#e3e6ea"), smooth(0.2, 0.9, N.fbm(p[0] * 2, p[1] * 2, p[2] * 2)));
      },
    },
  });
  // Rudraksha: brown, knobbly seed with a deep groove for each face (mukhi).
  function rudraksha(mukhi) {
    return {
      shininess: 20, spec: 0.18, gloss2: 0.1, translucency: 0, ambient: 0.3,
      albedo(p, N) {
        let c = mixc(hex("#5b2f16"), hex("#a5612d"), smooth(0.2, 0.85, N.fbm(p[0] * 3, p[1] * 3, p[2] * 3)));
        const knob = N.noise3(p[0] * 22, p[1] * 22, p[2] * 22);
        c = mixc(c, hex("#3a1c0c"), smooth(0.55, 0.85, knob) * 0.55);
        const phi = Math.atan2(p[0], p[2]);
        const groove = Math.pow(Math.max(0, Math.cos(mukhi * (phi + 0.35))), 18) * smooth(0.95, 0.6, Math.abs(p[1])); // face lines
        return mixc(c, hex("#2a1307"), groove * 0.85);
      },
    };
  }
  STONES.rudraksha4 = rudraksha(4);
  STONES.rudraksha5 = rudraksha(5);

  const L = (() => { const v = [-0.48, -0.62, 0.62]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
  const H = (() => { const v = [L[0], L[1], L[2] + 1]; const m = Math.hypot(...v); return v.map((x) => x / m); })();

  // Renders one bead to its own canvas (diameter d px, with 1px AA edge).
  function renderBead(d, stoneKey, seed, opts = {}) {
    const stone = STONES[stoneKey];
    const N = makeNoise(seed);
    const rand = mulberry32(seed * 7 + 3);
    const aspect = opts.aspect || 1; // height / width, for oval and drop shapes
    const size = Math.ceil(d) + 2;
    const sizeH = Math.ceil(d * aspect) + 2;
    const cv = document.createElement("canvas");
    cv.width = size; cv.height = sizeH;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(size, sizeH);
    const r = d / 2, c0 = size / 2, c0y = sizeH / 2, ry = r * aspect;
    // Random rotation so every bead shows a different part of the stone.
    const a = opts.fixed ? 0 : rand() * Math.PI * 2, b = opts.fixed ? 0 : rand() * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const flat = opts.rondelle ? 0.55 : 1; // spacer beads are squashed discs
    for (let y = 0; y < sizeH; y++) {
      for (let x = 0; x < size; x++) {
        const v = (y + 0.5 - c0y) / ry;
        // drop shape: narrows to a point at the top
        const widthAt = opts.shape === "drop" ? Math.sqrt(Math.max(0.0001, (v + 1) / 2)) * 1.08 : 1;
        const nx = (x + 0.5 - c0) / (r * widthAt), ny = v / flat;
        const dist = Math.hypot(nx, v);
        const edge = (1 - dist) * Math.min(r * widthAt, ry); // px inside the silhouette
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

  // ── Helpers for non-bead products ───────────────────────────────────────
  // Flat stone texture (albedo only) for faces of carved pieces.
  function stoneTexture(w, h, stoneKey, seed, scale) {
    const stone = STONES[stoneKey];
    const N = makeNoise(seed);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = stone.albedo([x / scale - 1, y / scale - 1, 0.3], N, seed);
      const i = (y * w + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  function softShadow(ctx, x, y, rx, ry, alpha, blur) {
    ctx.save(); ctx.filter = `blur(${blur}px)`; ctx.fillStyle = `rgba(30,20,10,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function poly(ctx, pts) {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  }

  // A six-sided polished point standing upright (3 visible faces + 3 tip facets).
  function drawPencil(ctx, W, H, stoneKey, seed) {
    const cx = W / 2, base = H * 0.86, top = H * 0.3, apex = H * 0.1, half = W * 0.17;
    const side = half * 0.5; // projected width of the angled side faces
    softShadow(ctx, cx + 40, base + 8, half * 1.4, 34, 0.35, 18);
    const tex = stoneTexture(Math.ceil(half * 2 + 4), Math.ceil(base - apex + 4), stoneKey, seed, half * 0.9);
    const L = [cx - half, top], LC = [cx - half + side, top], RC = [cx + half - side, top], R = [cx + half, top];
    const faces = [
      { pts: [L, LC, [cx - half + side, base], [cx - half, base - 10]], shade: 0.78 },
      { pts: [LC, RC, [cx + half - side, base], [cx - half + side, base]], shade: 1.0 },
      { pts: [RC, R, [cx + half, base - 10], [cx + half - side, base]], shade: 0.58 },
      { pts: [L, LC, [cx, apex]], shade: 0.95 },
      { pts: [LC, RC, [cx, apex]], shade: 1.15 },
      { pts: [RC, R, [cx, apex]], shade: 0.7 },
    ];
    const translucent = (STONES[stoneKey].translucency || 0) > 0.3;
    for (const f of faces) {
      ctx.save(); poly(ctx, f.pts); ctx.clip();
      ctx.drawImage(tex, cx - half - 2, apex - 2);
      ctx.fillStyle = f.shade >= 1 ? `rgba(255,255,255,${(f.shade - 1) * 1.6 + (translucent ? 0.1 : 0)})` : `rgba(0,0,0,${1 - f.shade})`;
      ctx.fill();
      // soft vertical sheen on the front face
      if (f.shade === 1.0) {
        const g = ctx.createLinearGradient(cx - half + side, 0, cx + half - side, 0);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.25, "rgba(255,255,255,0.28)"); g.addColorStop(0.4, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
      ctx.save(); poly(ctx, f.pts); ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    }
  }

  function chainLinks(ctx, pts, metal) {
    ctx.save();
    ctx.strokeStyle = metal === "gold" ? "#c9a24e" : "#b9bec4"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); ctx.stroke();
    ctx.strokeStyle = metal === "gold" ? "rgba(255,240,190,0.7)" : "rgba(255,255,255,0.7)"; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.stroke(); ctx.restore();
  }

  function metalGradient(ctx, x0, y0, x1, y1, metal) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    const [a, b, c] = metal === "gold" ? ["#8a6a2a", "#f3d98c", "#a9822f"] : ["#7f858c", "#f4f6f8", "#9aa0a7"];
    g.addColorStop(0, a); g.addColorStop(0.45, b); g.addColorStop(1, c);
    return g;
  }

  function drawPendant(ctx, W, H, stoneKey, seed) {
    const cx = W / 2, gemTop = H * 0.36;
    chainLinks(ctx, [[W * 0.05, H * 0.02], [W * 0.18, H * 0.3], [cx - 60, gemTop - 40], [cx - 6, gemTop - 70]], "silver");
    chainLinks(ctx, [[W * 0.95, H * 0.02], [W * 0.82, H * 0.3], [cx + 60, gemTop - 40], [cx + 6, gemTop - 70]], "silver");
    // bail
    ctx.save(); ctx.fillStyle = metalGradient(ctx, cx - 26, 0, cx + 26, 0, "silver");
    roundRect(ctx, cx - 22, gemTop - 92, 44, 78, 18); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const gw = W * 0.34, gh = gw * 1.45;
    softShadow(ctx, cx + 36, gemTop + gh * 0.95, gw * 0.45, 30, 0.3, 22);
    const gem = renderBead(gw, stoneKey, seed, { aspect: 1.45, shape: "drop" });
    ctx.drawImage(gem, cx - gem.width / 2, gemTop - 22);
    // cap where the bail grips the stone
    ctx.save(); ctx.fillStyle = metalGradient(ctx, cx - 30, 0, cx + 30, 0, "silver");
    ctx.beginPath(); ctx.ellipse(cx, gemTop - 18, 26, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawRing(ctx, W, H, stoneKey, seed) {
    const cx = W / 2, cy = H * 0.62, rx = W * 0.2, ry = W * 0.23;
    softShadow(ctx, cx + 30, cy + ry + 6, rx * 1.15, 26, 0.35, 16);
    ctx.save(); ctx.lineWidth = 46; ctx.strokeStyle = metalGradient(ctx, cx - rx, cy, cx + rx, cy, "silver");
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath(); ctx.ellipse(cx, cy, rx - 14, ry - 14, 0, Math.PI * 1.05, Math.PI * 1.7); ctx.stroke(); ctx.restore();
    // bezel + oval cabochon on top
    const bw = W * 0.3, top = cy - ry - 30;
    ctx.save(); ctx.fillStyle = metalGradient(ctx, cx - bw / 2, 0, cx + bw / 2, 0, "silver");
    ctx.beginPath(); ctx.ellipse(cx, top, bw / 2 + 16, bw * 0.38 + 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const gem = renderBead(bw, stoneKey, seed, { aspect: 0.76 });
    ctx.drawImage(gem, cx - gem.width / 2, top - gem.height / 2);
  }

  function drawPyramidCharm(ctx, x, y, size) {
    softShadow(ctx, x + size * 0.25, y + size * 0.55, size * 0.6, size * 0.18, 0.3, 8);
    const apex = [x, y - size * 0.75], l = [x - size * 0.6, y + size * 0.35], r = [x + size * 0.45, y + size * 0.45], b = [x + size * 0.05, y + size * 0.2];
    ctx.save();
    poly(ctx, [apex, l, b]); ctx.fillStyle = metalGradient(ctx, l[0], 0, b[0], 0, "gold"); ctx.fill();
    poly(ctx, [apex, b, r]); ctx.fillStyle = "#9c7a35"; ctx.fill();
    ctx.strokeStyle = "rgba(255,240,200,0.6)"; ctx.lineWidth = 1.5; poly(ctx, [apex, l, b]); ctx.stroke();
    ctx.restore();
  }

  function drawBowl(ctx, W, H, seed) {
    const cx = W / 2, cy = H * 0.5, rx = W * 0.38, ry = W * 0.26;
    softShadow(ctx, cx + 30, cy + ry * 0.9, rx * 1.02, ry * 0.5, 0.4, 30);
    // outer wall: rim edge down to a rounded base
    ctx.save(); ctx.fillStyle = metalGradient(ctx, cx - rx, 0, cx + rx, 0, "gold");
    ctx.beginPath(); ctx.moveTo(cx - rx, cy - ry * 0.05);
    ctx.bezierCurveTo(cx - rx, cy + ry * 0.9, cx - rx * 0.45, cy + ry * 1.05, cx, cy + ry * 1.05);
    ctx.bezierCurveTo(cx + rx * 0.45, cy + ry * 1.05, cx + rx, cy + ry * 0.9, cx + rx, cy - ry * 0.05);
    ctx.closePath(); ctx.fill();
    const shade = ctx.createLinearGradient(0, cy, 0, cy + ry * 1.05);
    shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = shade; ctx.fill(); ctx.restore();
    // rim + inside
    ctx.save(); ctx.fillStyle = "#5a4520"; ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.05, rx, ry * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = metalGradient(ctx, cx - rx, 0, cx + rx, 0, "gold"); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.05, rx - 8, ry * 0.55 - 8, 0, 0, Math.PI * 2); ctx.clip();
    const rand = mulberry32(seed); const chips = [];
    for (let i = 0; i < 70; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
      chips.push({ x: cx + Math.cos(a) * d * (rx - 30), y: cy - ry * 0.05 + Math.sin(a) * d * (ry * 0.55 - 20), d: 40 + rand() * 46, seed: i * 13 + seed });
    }
    chips.sort((a, b) => a.y - b.y).forEach((c) => {
      const g = renderBead(c.d, "pyrite", c.seed, { aspect: 0.75 + rand() * 0.4 });
      ctx.drawImage(g, c.x - g.width / 2, c.y - g.height / 2);
    });
    ctx.restore();
  }

  function drawPlate(ctx, W, H, seed) {
    const cx = W / 2, cy = H * 0.5, rx = W * 0.4, ry = W * 0.27, t = 34;
    softShadow(ctx, cx + 30, cy + t + 20, rx, ry * 0.9, 0.3, 30);
    ctx.save(); ctx.fillStyle = "#d9d4cb"; ctx.beginPath(); ctx.ellipse(cx, cy + t, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - rx, cy, rx * 2, t); ctx.restore();
    const tex = stoneTexture(Math.ceil(rx * 2), Math.ceil(ry * 2), "selenite", seed, rx * 0.5);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(tex, cx - rx, cy - ry);
    const g = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    g.addColorStop(0, "rgba(255,255,255,0.35)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); ctx.restore();
    // a bracelet resting on it, to show what it's for
    drawBeads(ctx, layoutBracelet({ cx, cy: cy - 6, R: rx * 0.55, tilt: ry / rx, beadMm: 8, stone: "amethyst", seed: seed + 3, rot: 0.3 }), { shadow: 0.22, tilt: ry / rx });
  }

  function drawCertificate(ctx, W, H) {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.035);
    const w = W * 0.66, h = W * 0.86;
    ctx.save(); ctx.filter = "blur(18px)"; ctx.fillStyle = "rgba(30,20,10,0.3)"; ctx.fillRect(-w / 2 + 22, -h / 2 + 30, w, h); ctx.restore();
    ctx.fillStyle = "#fdfaf3"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = "#b8975a"; ctx.lineWidth = 6; ctx.strokeRect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48);
    ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 36, -h / 2 + 36, w - 72, h - 72);
    ctx.fillStyle = "#2d1f4a"; ctx.textAlign = "center";
    ctx.font = "600 30px Georgia, serif"; ctx.fillText("✦  ARISE NUMERO  ✦", 0, -h / 2 + 120);
    ctx.font = "italic 46px Georgia, serif"; ctx.fillText("Certificate", 0, -h / 2 + 210);
    ctx.font = "26px Georgia, serif"; ctx.fillText("of Authenticity", 0, -h / 2 + 252);
    ctx.fillStyle = "#7a6e8a"; ctx.font = "19px Georgia, serif";
    ["This certifies that the crystal", "described below is a natural stone."].forEach((t, i) => ctx.fillText(t, 0, -h / 2 + 330 + i * 30));
    ctx.strokeStyle = "rgba(45,31,74,0.35)"; ctx.lineWidth = 1.5;
    ["Stone", "Item", "Date"].forEach((label, i) => {
      const y = -h / 2 + 450 + i * 70;
      ctx.textAlign = "left"; ctx.fillStyle = "#2d1f4a"; ctx.font = "18px Georgia, serif"; ctx.fillText(label, -w / 2 + 90, y);
      ctx.beginPath(); ctx.moveTo(-w / 2 + 170, y + 4); ctx.lineTo(w / 2 - 90, y + 4); ctx.stroke();
    });
    // gold seal
    const sx = w / 2 - 130, sy = h / 2 - 140;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2; ctx.fillStyle = i % 2 ? "#a9822f" : "#d8b766";
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.arc(sx, sy, 72, a, a + Math.PI / 12); ctx.fill();
    }
    ctx.fillStyle = metalGradient(ctx, sx - 56, sy - 56, sx + 56, sy + 56, "gold"); ctx.beginPath(); ctx.arc(sx, sy, 56, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6e5420"; ctx.textAlign = "center"; ctx.font = "600 34px Georgia, serif"; ctx.fillText("✦", sx, sy + 12);
    ctx.restore();
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
      : spec.pattern === "mix" ? (i) => ["amethyst", "roseQuartz", "lapis", "citrine", "greenAventurine", "tigerEye", "clearQuartz", "redJasper"][i % 8]
      : spec.pattern === "goldEvery10" ? (i) => (i % 10 === 9 ? "gold" : spec.stone)
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
    } else if (spec.scene === "pencil") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawPencil(ctx, W, Hh, spec.stone, seed);
    } else if (spec.scene === "pendant") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawPendant(ctx, W, Hh, spec.stone, seed);
    } else if (spec.scene === "ring") {
      surface(ctx, W, Hh, spec.surface || "marble", seed);
      drawRing(ctx, W, Hh, spec.stone, seed);
    } else if (spec.scene === "anklet") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBeads(ctx, layoutBracelet({ cx: W / 2, cy: Hh * 0.5, R: W * 0.37, tilt: 0.6, beadMm: 4, wristMm: 230, stone: spec.stone, pattern, seed, rot: 0.2 }), { shadow: 0.28, tilt: 0.6 });
    } else if (spec.scene === "rudraksha") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      // red silk thread through the bead
      ctx.save(); ctx.strokeStyle = "#a3201f"; ctx.lineWidth = 9; ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.moveTo(W * 0.08, Hh * 0.12); ctx.bezierCurveTo(W * 0.3, Hh * 0.2, W * 0.45, Hh * 0.28, W / 2, Hh * 0.32);
      ctx.moveTo(W / 2, Hh * 0.7); ctx.bezierCurveTo(W * 0.56, Hh * 0.82, W * 0.75, Hh * 0.9, W * 0.94, Hh * 0.88); ctx.stroke(); ctx.restore();
      softShadow(ctx, W / 2 + 40, Hh * 0.68, W * 0.2, 40, 0.35, 24);
      const bead = renderBead(W * 0.42, spec.stone, seed, { aspect: 0.92, fixed: true });
      ctx.drawImage(bead, W / 2 - bead.width / 2, Hh * 0.5 - bead.height / 2);
    } else if (spec.scene === "pyramidBracelet") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBeads(ctx, layoutBracelet({ cx: W / 2, cy: Hh * 0.47, R: W * 0.34, tilt: 0.62, beadMm, stone: spec.stone, pattern, seed, rot: 0.2 }), { shadow: 0.3, tilt: 0.62 });
      drawPyramidCharm(ctx, W / 2 + 20, Hh * 0.47 + W * 0.34 * 0.62 + 110, 100);
    } else if (spec.scene === "bowl") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawBowl(ctx, W, Hh, seed);
    } else if (spec.scene === "plate") {
      surface(ctx, W, Hh, spec.surface || "slate", seed);
      drawPlate(ctx, W, Hh, seed);
    } else if (spec.scene === "certificate") {
      surface(ctx, W, Hh, spec.surface || "linen", seed);
      drawCertificate(ctx, W, Hh);
    }
    return cv.toDataURL("image/jpeg", spec.quality || 0.86);
  };
})();

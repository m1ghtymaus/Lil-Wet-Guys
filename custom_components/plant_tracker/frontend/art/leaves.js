// Leaf, strap and stem primitives shared by every rig.

import { clamp, shade } from './color.js';
import { at, curve, deg, dirv, f1, ribbon, side, smooth, sub } from './geom.js';

/* ------------------------------------------------------------------ */
/* Broad leaves: drawn in local space pointing up, base (petiole) at 0,0 */

function lobed(L, W, lobes = 5, depth = 0.45) {
  // Finger-like lobes: two points per rounded lobe tip, one deep sinus between.
  const env = (t) => (W / 2) * Math.pow(Math.sin(Math.PI * (0.14 + 0.86 * t)), 0.7);
  const y = (t) => -L * t + L * 0.18 * Math.pow(1 - t, 3);
  const right = [];
  for (let j = 0; j < lobes; j++) {
    const tc = (j + 0.45) / lobes, dt = 0.16 / lobes;
    right.push([env(tc - dt), y(tc - dt) - L * 0.03]);
    right.push([env(tc + dt) * 0.98, y(tc + dt) - L * 0.05]);
    const ts = (j + 1) / lobes;
    if (j < lobes - 1) right.push([env(ts) * (1 - depth), y(ts)]);
  }
  const left = right.map(([x, yy]) => [-x, yy]).reverse();
  return smooth([[0, L * 0.02], [env(0) * (1 - depth) * 0.6, L * 0.06], ...right, [0, -L * 1.02], ...left, [-env(0) * (1 - depth) * 0.6, L * 0.06]], true);
}

export const SHAPES = {
  oval: (L, W) => `M0 0C${f1(W * 0.55)} ${f1(-L * 0.12)} ${f1(W * 0.55)} ${f1(-L * 0.72)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.55)} ${f1(-L * 0.72)} ${f1(-W * 0.55)} ${f1(-L * 0.12)} 0 0Z`,
  lance: (L, W) => `M0 0C${f1(W * 0.52)} ${f1(-L * 0.25)} ${f1(W * 0.42)} ${f1(-L * 0.72)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.42)} ${f1(-L * 0.72)} ${f1(-W * 0.52)} ${f1(-L * 0.25)} 0 0Z`,
  obovate: (L, W) => `M0 0C${f1(W * 0.16)} ${f1(-L * 0.1)} ${f1(W * 0.56)} ${f1(-L * 0.42)} ${f1(W * 0.5)} ${f1(-L * 0.76)}`
    + `C${f1(W * 0.44)} ${f1(-L * 1.02)} ${f1(-W * 0.44)} ${f1(-L * 1.02)} ${f1(-W * 0.5)} ${f1(-L * 0.76)}`
    + `C${f1(-W * 0.56)} ${f1(-L * 0.42)} ${f1(-W * 0.16)} ${f1(-L * 0.1)} 0 0Z`,
  round: (L, W) => `M0 0C${f1(W * 0.64)} ${f1(-L * 0.02)} ${f1(W * 0.64)} ${f1(-L * 0.92)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.64)} ${f1(-L * 0.92)} ${f1(-W * 0.64)} ${f1(-L * 0.02)} 0 0Z`,
  heart: (L, W) => `M0 0C${f1(W * 0.18)} ${f1(L * 0.08)} ${f1(W * 0.56)} ${f1(L * 0.07)} ${f1(W * 0.53)} ${f1(-L * 0.3)}`
    + `C${f1(W * 0.49)} ${f1(-L * 0.6)} ${f1(W * 0.2)} ${f1(-L * 0.8)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.2)} ${f1(-L * 0.8)} ${f1(-W * 0.49)} ${f1(-L * 0.6)} ${f1(-W * 0.53)} ${f1(-L * 0.3)}`
    + `C${f1(-W * 0.56)} ${f1(L * 0.07)} ${f1(-W * 0.18)} ${f1(L * 0.08)} 0 0Z`,
  arrow: (L, W) => `M0 0Q${f1(W * 0.2)} ${f1(L * 0.05)} ${f1(W * 0.42)} ${f1(L * 0.2)}`
    + `Q${f1(W * 0.64)} ${f1(-L * 0.1)} ${f1(W * 0.45)} ${f1(-L * 0.36)}Q${f1(W * 0.3)} ${f1(-L * 0.7)} 0 ${f1(-L)}`
    + `Q${f1(-W * 0.3)} ${f1(-L * 0.7)} ${f1(-W * 0.45)} ${f1(-L * 0.36)}Q${f1(-W * 0.64)} ${f1(-L * 0.1)} ${f1(-W * 0.42)} ${f1(L * 0.2)}`
    + `Q${f1(-W * 0.2)} ${f1(L * 0.05)} 0 0Z`,
  segment: (L, W) => `M${f1(-W * 0.3)} 0C${f1(-W * 0.56)} ${f1(-L * 0.1)} ${f1(-W * 0.56)} ${f1(-L * 0.36)} ${f1(-W * 0.46)} ${f1(-L * 0.5)}`
    + `C${f1(-W * 0.56)} ${f1(-L * 0.64)} ${f1(-W * 0.56)} ${f1(-L * 0.92)} ${f1(-W * 0.24)} ${f1(-L)}`
    + `Q0 ${f1(-L * 0.93)} ${f1(W * 0.24)} ${f1(-L)}`
    + `C${f1(W * 0.56)} ${f1(-L * 0.92)} ${f1(W * 0.56)} ${f1(-L * 0.64)} ${f1(W * 0.46)} ${f1(-L * 0.5)}`
    + `C${f1(W * 0.56)} ${f1(-L * 0.36)} ${f1(W * 0.56)} ${f1(-L * 0.1)} ${f1(W * 0.3)} 0Z`,
  lobed: (L, W, o) => lobed(L, W, o.lobes, o.depth),
  holes: (L, W) => SHAPES.oval(L, W),
};

function variegate(ctx, o, L, W, shape, sw) {
  const k = o.k ?? 0;
  const vc = o.vari && ctx.fill(o.vari);
  switch (o.variType) {
    case 'edge': {
      const inner = shape(L * 0.84, W * (o.edgeScale ?? 0.64), o);
      return `<path d="${inner}" transform="translate(0 ${f1(-L * 0.07)})" fill="${ctx.fill(o.color)}"/>`;
    }
    case 'streaks': {
      let s = '';
      for (let i = 0; i < 2; i++) {
        const sd = ctx.r(k * 7 + i, 'sd') < 0.5 ? -1 : 1;
        const x0 = sd * W * (0.06 + 0.12 * ctx.r(k * 7 + i, 'sx'));
        s += `<path d="M${f1(x0)} ${f1(-L * 0.12)}Q${f1(x0 + sd * W * 0.2)} ${f1(-L * 0.42)} ${f1(x0 * 0.6)} ${f1(-L * 0.74)}" `
          + `fill="none" stroke="${vc}" stroke-width="${f1(W * 0.07)}" stroke-linecap="round" stroke-opacity=".9"/>`;
      }
      return s;
    }
    case 'spots': {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x = (ctx.r(k * 11 + i, 'px') - 0.5) * W * 0.62;
        const y = -L * (0.2 + 0.56 * ctx.r(k * 11 + i, 'py'));
        s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(W * 0.055)}" ry="${f1(W * 0.045)}" fill="${vc}"/>`;
      }
      return s;
    }
    case 'splash': {
      const r = ctx.r(k, 'splash');
      const sd = ctx.r(k, 'ss') < 0.5 ? -1 : 1;
      if (r < 0.4) {
        return `<path d="${shape(L * 0.86, W * 0.5, o)}" transform="translate(${f1(sd * W * 0.2)} ${f1(-L * 0.05)})" fill="${vc}"/>`;
      }
      if (r < 0.75) {
        return `<ellipse cx="${f1(sd * W * 0.2)}" cy="${f1(-L * 0.5)}" rx="${f1(W * 0.14)}" ry="${f1(L * 0.18)}" fill="${vc}"/>`
          + `<ellipse cx="${f1(-sd * W * 0.16)}" cy="${f1(-L * 0.28)}" rx="${f1(W * 0.08)}" ry="${f1(L * 0.08)}" fill="${vc}"/>`;
      }
      return '';
    }
    case 'veins': {
      return `<ellipse cx="0" cy="${f1(-L * 0.3)}" rx="${f1(W * 0.12)}" ry="${f1(L * 0.26)}" fill="${vc}" fill-opacity=".55"/>`
        + `<path d="M0 ${f1(-L * 0.04)}L${f1(W * 0.3)} ${f1(L * 0.13)}M0 ${f1(-L * 0.04)}L${f1(-W * 0.3)} ${f1(L * 0.13)}`
        + `M0 ${f1(-L * 0.3)}Q${f1(W * 0.2)} ${f1(-L * 0.34)} ${f1(W * 0.33)} ${f1(-L * 0.28)}`
        + `M0 ${f1(-L * 0.3)}Q${f1(-W * 0.2)} ${f1(-L * 0.34)} ${f1(-W * 0.33)} ${f1(-L * 0.28)}`
        + `M0 ${f1(-L * 0.52)}Q${f1(W * 0.14)} ${f1(-L * 0.56)} ${f1(W * 0.24)} ${f1(-L * 0.52)}`
        + `M0 ${f1(-L * 0.52)}Q${f1(-W * 0.14)} ${f1(-L * 0.56)} ${f1(-W * 0.24)} ${f1(-L * 0.52)}" `
        + `fill="none" stroke="${vc}" stroke-width="${f1(sw * 0.8)}" stroke-linecap="round"/>`;
    }
    case 'ripple': {
      // Peperomia caperata style: deep curved grooves between the veins.
      const rc = shade(ctx.fill(o.color), -0.14);
      let p = '';
      for (const [t0, w0] of [[0.22, 0.42], [0.42, 0.44], [0.62, 0.34], [0.8, 0.2]]) {
        for (const sd of [-1, 1]) {
          p += `M${f1(sd * W * 0.03)} ${f1(-L * (t0 - 0.06))}Q${f1(sd * W * w0 * 0.6)} ${f1(-L * (t0 + 0.02))} ${f1(sd * W * w0)} ${f1(-L * (t0 + 0.1))}`;
        }
      }
      return `<path d="${p}" fill="none" stroke="${rc}" stroke-width="${f1(sw * 0.9)}" stroke-linecap="round"/>`;
    }
    default:
      return '';
  }
}

/**
 * A broad leaf at (x, y) pointing along angle a.
 * o: { shape, L, W, color, vari, variType, rib, ribColor, gloss, curl, k, dry }
 */
export function leaf(ctx, x, y, a, o) {
  const d = o.dry != null ? o.dry : ctx.d;
  const L = o.L * (1 - 0.1 * d);
  const W = o.W * (1 - 0.3 * d * (o.curl ?? 1));
  const shape = SHAPES[o.shape] ?? SHAPES.oval;
  const sw = f1(clamp(L / 15, 1, 2.1));
  const paint = (hex) => (o.dry != null ? ctx.fillD(hex, o.dry) : ctx.fill(hex));
  const base = o.variType === 'edge' ? o.vari : o.color;
  let s = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${deg(a)})">`;
  s += `<path d="${shape(L, W, o)}" fill="${paint(base)}" stroke="${ctx.line}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  if (o.shape === 'holes') {
    // Monstera windows: shaded ovals between the midrib and the margin.
    const hc = shade(paint(o.color), -0.3);
    for (const [ht, hs] of [[0.3, 1], [0.5, 1], [0.69, 0.75]]) {
      for (const hx of [-1, 1]) {
        s += `<ellipse cx="${f1(hx * W * 0.2)}" cy="${f1(-L * ht)}" rx="${f1(W * 0.1 * hs)}" ry="${f1(L * 0.065 * hs)}" fill="${hc}" stroke="${ctx.line}" stroke-width=".8"/>`;
      }
    }
  }
  if (o.variType && o.dry == null) s += variegate(ctx, o, L, W, shape, sw);
  if (o.rib !== false) {
    const rc = o.ribColor ? paint(o.ribColor) : shade(paint(o.color), 0.12);
    s += `<path d="M0 ${f1(-L * 0.02)}Q${f1(W * 0.05)} ${f1(-L * 0.5)} 0 ${f1(-L * 0.86)}" fill="none" stroke="${rc}" stroke-width="${f1(sw * 0.65)}" stroke-linecap="round"/>`;
  }
  if (o.gloss && !ctx.ghost && o.dry == null) {
    s += `<path d="M${f1(-W * 0.2)} ${f1(-L * 0.34)}Q${f1(-W * 0.22)} ${f1(-L * 0.6)} ${f1(-W * 0.06)} ${f1(-L * 0.78)}" `
      + `fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  return `${s}</g>`;
}

/* ------------------------------------------------------------------ */
/* Strap-like leaves that follow a walked stem                          */

export const PROFILES = {
  sword: (t) => (t < 0.72 ? 1 - 0.25 * t : ((1 - t) / 0.28) * 0.82),
  tongue: (t) => (0.85 + 0.25 * Math.sin(Math.PI * t * 0.9)) * Math.sqrt(Math.max(0, 1 - t ** 6)),
  spike: (t) => 1 - 0.18 * t,
  triangle: (t) => Math.max(0.03, (1 - t) ** 0.9),
  plump: (t) => Math.max(0.03, (1 - t) ** 0.55) * (0.9 + 0.25 * Math.sin(Math.PI * Math.min(1, t * 1.4))),
  strap: (t) => Math.min(1, 0.55 + t * 2) * (1 - t) ** 0.7,
  taper: (t) => Math.max(0.05, (1 - t) ** 0.6),
  lance: (t) => Math.sin(Math.PI * (0.1 + 0.9 * t)) ** 0.7,
  paddle: (t) => Math.max(0.12, Math.min(1, t / 0.14) ** 0.6) * Math.min(1, (1 - t) / 0.14) ** 0.5,
  stalk: () => 1,
};

/**
 * o: { wf, color, tip, sw, edge, edgeScale, stripe, bands:{n,color,ring}, spots:{n,color,r},
 *      teeth:{n,color}, wrinkle, highlight, groove, rib, veins, tears, tips, id }
 */
export function strapLeaf(ctx, pts, o) {
  const { wf } = o;
  const tip = o.tip ?? 'point';
  const sw = o.sw ?? 1.6;
  const id = o.id ?? 0;
  const d = ctx.d;
  const line = ctx.line;
  const innerScale = o.edge ? o.edgeScale ?? 0.66 : 1;
  let s = '';

  // Leaves that scorch from the margin keep a brown rim as they dry.
  const scorch = o.scorch && !ctx.ghost ? clamp((d - 0.4) / 0.6) : 0;
  if (o.edge || scorch > 0) {
    const rim = o.edge ? ctx.fill(o.edge) : ctx.fillD('#a8743f', 1);
    const k = o.edge ? innerScale : 1 - 0.3 * scorch;
    s += `<path d="${ribbon(pts, wf, tip)}" fill="${rim}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    s += `<path d="${ribbon(pts, (t) => wf(t) * k, tip)}" fill="${ctx.fill(o.color, o.dk ?? 1)}"/>`;
  } else {
    s += `<path d="${ribbon(pts, wf, tip)}" fill="${ctx.fill(o.color, o.dk ?? 1)}" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }
  if (o.stripe) s += `<path d="${ribbon(pts, (t) => wf(t) * 0.3, tip)}" fill="${ctx.fill(o.stripe)}"/>`;

  if (o.highlight && !ctx.ghost) {
    const hp = [];
    for (let i = 0; i <= 8; i++) {
      const t = 0.06 + (i / 8) * 0.8;
      hp.push(side(at(pts, t), -wf(t) * 0.26));
    }
    s += `<path d="${smooth(hp)}" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  if (o.groove || o.rib) {
    const gp = sub(pts, 0.02, o.rib ? 0.95 : 0.9, 8);
    const col = o.rib ? ctx.fill(o.rib) : shade(ctx.fill(o.color), -0.1);
    s += `<path d="${smooth(gp)}" fill="none" stroke="${col}" stroke-width="${o.rib ? 1.8 : 1}" stroke-linecap="round"/>`;
  }
  if (o.veins) {
    let vp = '';
    for (let i = 1; i <= o.veins; i++) {
      const t = i / (o.veins + 1);
      const q = at(pts, t);
      const w = (wf(t) / 2) * 0.92;
      const [dx, dy] = dirv(q.a);
      for (const sd of [-1, 1]) {
        const [ex, ey] = side(q, sd * w);
        vp += `M${f1(q.x)} ${f1(q.y)}L${f1(ex + dx * w * 0.35)} ${f1(ey + dy * w * 0.35)}`;
      }
    }
    s += `<path d="${vp}" fill="none" stroke="${shade(ctx.fill(o.color), -0.1)}" stroke-width=".8" stroke-opacity=".55"/>`;
  }
  if (o.bands) {
    const col = ctx.fill(o.bands.color);
    let bp = '';
    for (let i = 0; i < o.bands.n; i++) {
      const t = 0.08 + ((i + 0.5) * 0.8) / o.bands.n;
      const q = at(pts, t);
      const w = (wf(t) / 2) * innerScale * 0.9;
      const [dx, dy] = dirv(q.a);
      if (o.bands.ring) {
        const [lx, ly] = side(q, -w), [rx, ry] = side(q, w);
        bp += `M${f1(lx)} ${f1(ly)}Q${f1(q.x - dx * 2.4)} ${f1(q.y - dy * 2.4)} ${f1(rx)} ${f1(ry)}`;
      } else {
        const wob = (ctx.r(id * 31 + i, 'bw') - 0.5) * 2;
        const zig = [-1, -0.35, 0.35, 1].map((u, j) => {
          const [x, y] = side(q, u * w);
          const off = (j % 2 ? 1.8 : -1.2) + wob;
          return [x + dx * off, y + dy * off];
        });
        bp += smooth(zig).replace(/^M/, 'M');
      }
    }
    s += `<path d="${bp}" fill="none" stroke="${col}" stroke-width="${o.bands.w ?? 1.5}" stroke-linecap="round" stroke-opacity=".85"/>`;
  }
  if (o.dashes) {
    const col = ctx.fill(o.dashes.color);
    let dp = '';
    for (let i = 0; i < o.dashes.n; i++) {
      const t = 0.14 + (i * 0.72) / o.dashes.n;
      const q = at(pts, t);
      const w = (wf(t) / 2) * innerScale;
      const [dx, dy] = dirv(q.a);
      for (const [u0, u1] of [[-0.85, -0.2], [0.15, 0.8]]) {
        const j = (ctx.r(id * 17 + i, `dj${u0}`) - 0.5) * 2;
        const [x0, y0] = side(q, u0 * w), [x1, y1] = side(q, u1 * w);
        dp += `M${f1(x0 + dx * j)} ${f1(y0 + dy * j)}L${f1(x1 - dx * j)} ${f1(y1 - dy * j)}`;
      }
    }
    s += `<path d="${dp}" fill="none" stroke="${col}" stroke-width="${o.dashes.w ?? 1.8}" stroke-linecap="round"/>`;
  }
  if (o.spots) {
    const col = ctx.fill(o.spots.color);
    for (let i = 0; i < o.spots.n; i++) {
      const t = 0.08 + 0.84 * ctx.r(id * 97 + i, 'st');
      const q = at(pts, t);
      const [x, y] = side(q, (ctx.r(id * 97 + i, 'so') - 0.5) * 0.72 * wf(t) * innerScale);
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${o.spots.r ?? 1.1}" fill="${col}"/>`;
    }
  }
  if (o.teeth) {
    const col = ctx.fill(o.teeth.color);
    let tp = '';
    for (let i = 1; i <= o.teeth.n; i++) {
      const t = (i / (o.teeth.n + 1)) * 0.9;
      const q = at(pts, t);
      const w = wf(t) / 2;
      const [dx, dy] = dirv(q.a);
      const ts = o.teeth.size ?? 3;
      for (const sd of [-1, 1]) {
        const [ex, ey] = side(q, sd * w * 0.96);
        const [tx, ty] = side(q, sd * (w + ts));
        tp += `M${f1(ex - dx * 1.6)} ${f1(ey - dy * 1.6)}L${f1(tx + dx * 1.4)} ${f1(ty + dy * 1.4)}L${f1(ex + dx * 1.6)} ${f1(ey + dy * 1.6)}Z`;
      }
    }
    s += `<path d="${tp}" fill="${col}" stroke="${line}" stroke-width=".8" stroke-linejoin="round"/>`;
  }
  if (o.tears && !ctx.ghost && d > 0.3) {
    let tp = '';
    const n = Math.round(1 + 4 * clamp((d - 0.3) / 0.6));
    for (let i = 0; i < n; i++) {
      const t = 0.25 + 0.6 * ctx.r(id * 13 + i, 'tr');
      const q = at(pts, t);
      const sd = i % 2 ? 1 : -1;
      const w = wf(t) / 2;
      const [ex, ey] = side(q, sd * w);
      const [ix, iy] = side(q, sd * w * 0.3);
      tp += `M${f1(ex)} ${f1(ey)}L${f1(ix)} ${f1(iy)}`;
    }
    s += `<path d="${tp}" fill="none" stroke="${line}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  if (o.wrinkle && !ctx.ghost && d > 0.3) {
    let wp = '';
    for (const u of [-0.22, 0.18]) {
      const lp = [];
      for (let i = 0; i <= 6; i++) {
        const t = 0.12 + (i / 6) * 0.62;
        lp.push(side(at(pts, t), u * wf(t) * innerScale));
      }
      wp += smooth(lp);
    }
    s += `<path d="${wp}" fill="none" stroke="${shade(ctx.fill(o.color), -0.16)}" stroke-width="1" stroke-opacity="${f1(clamp((d - 0.3) / 0.4))}"/>`;
  }
  if (o.tips && !ctx.ghost && d > 0.25) {
    const t0 = 1 - 0.32 * clamp((d - 0.25) / 0.75);
    const sp = sub(pts, t0, 1, 6);
    s += `<path d="${ribbon(sp, (u) => wf(t0 + u * (1 - t0)), tip)}" fill="#a8743f" stroke="${line}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }
  if (o.cap) {
    const e = pts[pts.length - 1];
    const [dx, dy] = dirv(e.a);
    const r = (wf(1) / 2) * 0.95;
    s += `<circle cx="${f1(e.x + dx * r * 0.6)}" cy="${f1(e.y + dy * r * 0.6)}" r="${f1(Math.max(1.4, r * 0.45))}" fill="${ctx.fill(o.cap)}"/>`;
  }
  return s;
}

/** A small strap lying on the ground (fallen dracaena or spider leaf). */
export function strap(ctx, x, y, a, len, W, color) {
  const pts = curve(x, y, a, a + 0.35, len, 6, 1);
  return `<path d="${ribbon(pts, (t) => W * PROFILES.strap(t))}" fill="${ctx.fillD(color, 1)}" stroke="${ctx.line}" stroke-width="1.3" stroke-linejoin="round"/>`;
}

/** A stem: outlined when thick enough, a single darker line when thin. */
export function stem(ctx, pts, color, w) {
  const d = smooth(pts);
  const c = ctx.fill(color, 0.6);
  if (w < 2) {
    return `<path d="${d}" fill="none" stroke="${shade(c, -0.12)}" stroke-width="${f1(w + 0.4)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<path d="${d}" fill="none" stroke="${ctx.line}" stroke-width="${f1(w + 2.2)}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

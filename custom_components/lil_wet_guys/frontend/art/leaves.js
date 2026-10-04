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

/** Monstera leaf: a broad heart with slits cut in from the edge toward the midrib. */
const monsteraEdge = (W, t) => (W / 2) * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.62);
const monsteraY = (L, t) => -L * t + L * 0.14 * Math.pow(1 - t, 2.5);
const monsteraSlits = (slits) => Array.from({ length: slits }, (_, j) => 0.17 + j * (0.64 / (slits - 1)));

function monstera(L, W, slits = 4, depth = 0.4, gap = 0.035) {
  const env = (t) => monsteraEdge(W, t);
  const y = (t) => monsteraY(L, t);
  const right = [[env(0.04), y(0.04)]];
  for (const t of monsteraSlits(slits)) {
    right.push([env(t - gap), y(t - gap)]);
    right.push([env(t) * depth, y(t) - L * 0.035]); // bottom of the slit, angled toward the tip
    right.push([env(t + gap), y(t + gap)]);
  }
  right.push([env(0.93), y(0.93)]);
  const left = right.map(([x, yy]) => [-x, yy]).reverse();
  return smooth([[0, L * 0.03], ...right, [0, -L], ...left], true);
}

/**
 * Thai Constellation variegation on a monstera leaf: short cream dashes sprayed along
 * the veins of every finger, and now and then a finger that is a solid cream sector.
 */
function constellation(ctx, o, L, W, vc) {
  const env = (t) => monsteraEdge(W, t);
  const y = (t) => monsteraY(L, t);
  const slits = monsteraSlits(o.slits ?? 4);
  const k = o.k ?? 0;
  const widths = [0.03, 0.045, 0.06].map((f) => W * f);
  const dashes = widths.map(() => '');
  let sectors = '';
  const dash = (x, yy, len, ang, n) => {
    const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
    const c = Math.floor(ctx.r(n, 'cw') * widths.length);
    dashes[c] += `M${f1(x - dx)} ${f1(yy - dy)}L${f1(x + dx)} ${f1(yy + dy)}`;
  };
  let n = k * 211;
  const sectorAt = Math.floor(ctx.r(k, 'csec') * (slits.length - 1) * 2 * 1.6); // some leaves get none
  let side = 0;
  for (let j = 0; j < slits.length - 1; j++) {
    const a = slits[j], b = slits[j + 1], tc = (a + b) / 2;
    const half = L * ((b - a) / 2 - 0.035); // half the finger's width at the margin
    for (const sd of [-1, 1]) {
      if (side++ === sectorAt) {
        const pts = [[env(a) * 0.4, y(a) - L * 0.035], [env(a + 0.035), y(a + 0.035)], [env(tc), y(tc)],
          [env(b - 0.035), y(b - 0.035)], [env(b) * 0.4, y(b) - L * 0.035]];
        const cx = pts.reduce((m, p) => m + p[0], 0) / pts.length;
        const cy = pts.reduce((m, p) => m + p[1], 0) / pts.length;
        const inset = pts.map(([px, py]) => [sd * (cx + (px - cx) * 0.74), cy + (py - cy) * 0.74]);
        sectors += `<path d="${smooth(inset, true)}" fill="${vc}"/>`;
        continue;
      }
      // The finger runs from beside the midrib out to the margin, sloping like its slits.
      const x0 = env(tc) * 0.2, x1 = env(tc) * 0.86, y0 = y(tc) - L * 0.035, y1 = y(tc);
      const ang = Math.atan2(y1 - y0, sd * (x1 - x0));
      const count = 2 + Math.floor(ctx.r(n++, 'cn') * 4);
      for (let q = 0; q < count; q++) {
        const f = 0.1 + 0.8 * ctx.r(n, 'cf');
        const u = (ctx.r(n, 'cu') * 2 - 1) * 0.5 * half;
        const len = W * (0.05 + 0.08 * ctx.r(n, 'cl'));
        dash(sd * (x0 + (x1 - x0) * f), y0 + (y1 - y0) * f + u, len, ang, n++);
      }
    }
  }
  // A few more on the solid tip.
  for (let q = 0; q < 3; q++) {
    const t = 0.85 + 0.04 * ctx.r(n, 'tt');
    const x = (ctx.r(n, 'tx') * 2 - 1) * env(t) * 0.4;
    dash(x, y(t), W * (0.04 + 0.04 * ctx.r(n, 'tl')), Math.atan2(-0.6, Math.sign(x || 1)), n++);
  }
  return sectors + dashes.map((d, i) => (d
    ? `<path d="${d}" fill="none" stroke="${vc}" stroke-width="${f1(widths[i])}" stroke-linecap="round"/>` : '')).join('');
}

/* Outlines built from their right half: [x, y] as fractions of W and L, base to tip. */

const mirror = (L, W, right) => {
  const pts = right.map(([x, y]) => [x * W, y * L]);
  return [...pts, ...pts.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
};
const polyline = (pts) => `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z`;

/**
 * Teeth along an outline whose half-width (fraction of W) at t (0 base, 1 tip) is profile(t).
 * depth is a number, or a function of the tooth's index for irregular teeth.
 */
function toothed(profile, teeth, depth) {
  const right = [[0, 0]];
  for (let i = 0; i < teeth; i++) {
    const a = 0.06 + (i / teeth) * 0.86, b = 0.06 + ((i + 0.62) / teeth) * 0.86;
    const dp = typeof depth === 'function' ? depth(i) : depth;
    right.push([Math.max(0, profile(a) - dp), -a], [profile(b), -b - 0.012]); // notch, then the tooth's point
  }
  right.push([0, -1]);
  return right;
}

/** Alocasia 'Polly': an arrowhead with lobes swept back and a scalloped edge. */
function pollyHalf() {
  const env = (s) => [0.5 * Math.pow(1 - s, 0.9), -s];
  const right = [[0, 0.03], [0.11, 0.17], [0.27, 0.31], [0.42, 0.21], [0.5, 0.02]];
  const tips = [];
  for (let k = 0; k < 5; k++) {
    const s0 = 0.06 + k * 0.18, s1 = s0 + 0.09;
    const [x0, y0] = env(s0), [x1, y1] = env(s1);
    tips.push([x0, y0]);
    right.push([x0 * 1.04, y0], [x1 * 0.7, y1 + 0.02]); // a scallop's crest, then the dip before the next
  }
  right.push([0, -1]);
  return { right, tips };
}

export const SHAPES = {
  oval: (L, W) => `M0 0C${f1(W * 0.55)} ${f1(-L * 0.12)} ${f1(W * 0.55)} ${f1(-L * 0.72)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.55)} ${f1(-L * 0.72)} ${f1(-W * 0.55)} ${f1(-L * 0.12)} 0 0Z`,
  lance: (L, W) => `M0 0C${f1(W * 0.52)} ${f1(-L * 0.25)} ${f1(W * 0.42)} ${f1(-L * 0.72)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.42)} ${f1(-L * 0.72)} ${f1(-W * 0.52)} ${f1(-L * 0.25)} 0 0Z`,
  obovate: (L, W) => `M0 0C${f1(W * 0.16)} ${f1(-L * 0.1)} ${f1(W * 0.56)} ${f1(-L * 0.42)} ${f1(W * 0.5)} ${f1(-L * 0.76)}`
    + `C${f1(W * 0.44)} ${f1(-L * 1.02)} ${f1(-W * 0.44)} ${f1(-L * 1.02)} ${f1(-W * 0.5)} ${f1(-L * 0.76)}`
    + `C${f1(-W * 0.56)} ${f1(-L * 0.42)} ${f1(-W * 0.16)} ${f1(-L * 0.1)} 0 0Z`,
  elliptic: (L, W) => `M0 0C${f1(W * 0.3)} ${f1(-L * 0.1)} ${f1(W * 0.56)} ${f1(-L * 0.36)} ${f1(W * 0.46)} ${f1(-L * 0.62)}`
    + `C${f1(W * 0.38)} ${f1(-L * 0.82)} ${f1(W * 0.1)} ${f1(-L * 0.93)} 0 ${f1(-L)}`
    + `C${f1(-W * 0.1)} ${f1(-L * 0.93)} ${f1(-W * 0.38)} ${f1(-L * 0.82)} ${f1(-W * 0.46)} ${f1(-L * 0.62)}`
    + `C${f1(-W * 0.56)} ${f1(-L * 0.36)} ${f1(-W * 0.3)} ${f1(-L * 0.1)} 0 0Z`,
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
  monstera: (L, W, o) => monstera(L, W, o.slits, o.depth, o.gap),
  // Persian shield: a long pointed oval with fine teeth.
  serrate: (L, W) => polyline(mirror(L, W, toothed((t) => 0.5 * Math.pow(Math.sin(Math.PI * t), 0.85), 13, 0.035))),
  // Purple passion: a pointed oval, widest low down, with irregular jagged teeth.
  dentate: (L, W) => polyline(mirror(L, W, toothed((t) => 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.68)), 0.8), 7,
    (i) => (i % 2 ? 0.05 : 0.1)))),
  polly: (L, W) => smooth(mirror(L, W, pollyHalf().right), true),
  // Alocasia 'Regal Shield': a broad shield with rounded lobes at the base.
  regal: (L, W) => smooth(mirror(L, W, [[0, 0.02], [0.12, 0.15], [0.3, 0.25], [0.45, 0.14], [0.5, -0.06],
    [0.47, -0.26], [0.4, -0.46], [0.3, -0.64], [0.18, -0.8], [0.08, -0.92], [0, -1]]), true),
  // Alocasia chienlii: a long, narrow arrowhead with a gently wavy edge.
  sagittate: (L, W) => smooth(mirror(L, W, [[0, 0.02], [0.08, 0.17], [0.2, 0.3], [0.33, 0.17], [0.37, -0.04],
    [0.35, -0.2], [0.31, -0.36], [0.28, -0.5], [0.22, -0.64], [0.17, -0.77], [0.09, -0.9], [0, -1]]), true),
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
    case 'zebra': {
      // Tradescantia zebrina: a broad silver stripe either side of the midrib.
      let p = '';
      for (const sd of [-1, 1]) {
        const x = sd * W * 0.2;
        p += `M${f1(x * 0.7)} ${f1(-L * 0.16)}Q${f1(x * 1.2)} ${f1(-L * 0.45)} ${f1(x * 0.45)} ${f1(-L * 0.78)}`;
      }
      return `<path d="${p}" fill="none" stroke="${vc}" stroke-width="${f1(W * 0.12)}" stroke-linecap="round" stroke-opacity=".9"/>`;
    }
    case 'constellation':
      return constellation(ctx, o, L, W, vc);
    case 'ribs': {
      // Pale veins: a midrib and curving side veins (alocasia), joined by a loop
      // inside the margin when o.net is set (nerve plant).
      const arrow = o.shape === 'arrow' || o.shape === 'sagittate' || o.shape === 'regal';
      const half = o.shape === 'sagittate' ? (t) => 0.36 * Math.pow(1 - t, 0.85)
        : o.shape === 'regal' ? (t) => 0.5 * Math.pow(1 - t, 0.6)
        : arrow ? (t) => 0.5 * Math.pow(1 - t, 0.85) : (t) => 0.41 * Math.pow(Math.sin(Math.PI * t), 0.8);
      const pairs = o.veins ?? 4;
      let p = `M0 ${f1(-L * 0.02)}L0 ${f1(-L * 0.92)}`;
      const ends = [[], []];
      for (let i = 0; i < pairs; i++) {
        const t = 0.12 + (i / pairs) * 0.64, te = t + 0.12;
        for (const [j, sd] of [[0, -1], [1, 1]]) {
          const x = sd * W * 0.82 * half(te), y = -L * te;
          p += `M0 ${f1(-L * t)}Q${f1(x * 0.45)} ${f1(-L * (t + 0.02))} ${f1(x)} ${f1(y)}`;
          ends[j].push([x, y]);
        }
      }
      if (arrow) {
        // Veins running back into the two lobes at the base.
        for (const sd of [-1, 1]) p += `M0 ${f1(-L * 0.03)}Q${f1(sd * W * 0.2)} ${f1(L * 0.02)} ${f1(sd * W * 0.34)} ${f1(L * 0.13)}`;
      }
      if (o.net) for (const e of ends) p += smooth([[0, -L * 0.06], ...e, [0, -L * 0.93]]);
      // A pale rim just inside the edge (Alocasia 'Polly').
      const rim = o.rim
        ? `<path d="${shape(L * 0.9, W * 0.84, o)}" transform="translate(0 ${f1(-L * 0.035)})" fill="none" stroke="${vc}" stroke-width="${f1(sw * 0.55)}" stroke-linejoin="round"/>`
        : '';
      return `<path d="${p}" fill="none" stroke="${vc}" stroke-width="${f1(sw * (o.veinW ?? 0.8))}" stroke-linecap="round" stroke-linejoin="round"/>${rim}`;
    }
    case 'polly': {
      // Thick white veins from the midrib out to every scallop, and a white rim.
      let p = `M0 ${f1(L * 0.02)}L0 ${f1(-L * 0.94)}`;
      for (const [x, y] of pollyHalf().tips) {
        for (const sd of [-1, 1]) p += `M0 ${f1(-L * (-y - 0.1))}Q${f1(sd * x * W * 0.4)} ${f1(-L * (-y - 0.04))} ${f1(sd * x * W * 0.9)} ${f1(y * L)}`;
      }
      for (const sd of [-1, 1]) p += `M0 ${f1(-L * 0.02)}Q${f1(sd * W * 0.14)} ${f1(L * 0.1)} ${f1(sd * W * 0.24)} ${f1(L * 0.26)}`;
      return `<path d="${shape(L * 0.9, W * 0.86, o)}" transform="translate(0 ${f1(-L * 0.035)})" fill="none" stroke="${vc}" stroke-width="${f1(sw * 0.55)}" stroke-linejoin="round"/>`
        + `<path d="${p}" fill="none" stroke="${vc}" stroke-width="${f1(sw * 0.95)}" stroke-linecap="round"/>`;
    }
    case 'shield': {
      // Persian shield: dark green at the edge and along every vein, violet between the
      // veins brightening to a silvery lavender sheen down the middle.
      let p = `M0 ${f1(-L * 0.02)}L0 ${f1(-L * 0.9)}`;
      for (let i = 0; i < 6; i++) {
        const t = 0.14 + i * 0.12;
        const reach = W * 0.4 * Math.pow(Math.sin(Math.PI * (t + 0.08)), 0.85);
        for (const sd of [-1, 1]) p += `M0 ${f1(-L * t)}Q${f1(sd * reach * 0.5)} ${f1(-L * (t + 0.04))} ${f1(sd * reach)} ${f1(-L * (t + 0.11))}`;
      }
      return `<path d="${SHAPES.oval(L * 0.66, W * 0.48)}" transform="translate(0 ${f1(-L * 0.15)})" fill="${ctx.fill(o.purple)}"/>`
        + `<path d="${SHAPES.oval(L * 0.44, W * 0.22)}" transform="translate(0 ${f1(-L * 0.24)})" fill="${ctx.fill(o.silver)}" fill-opacity=".7"/>`
        + `<path d="${p}" fill="none" stroke="${vc}" stroke-width="${f1(sw * 0.5)}" stroke-linecap="round"/>`;
    }
    case 'fuzz': {
      // Purple passion: a green leaf under a coat of purple hairs. They show at the
      // margin and wash over the leaf where the light catches them (o.sheen, 0-1);
      // young leaves at the tips are purple all over.
      const sheen = o.sheen ?? 0.4;
      return `<path d="${shape(L * 0.96, W * 0.94, o)}" transform="translate(0 ${f1(-L * 0.02)})" fill="${vc}" fill-opacity="${f1(0.05 + 0.85 * sheen)}"/>`
        + `<path d="${shape(L * 0.88, W * 0.82, o)}" transform="translate(0 ${f1(-L * 0.05)})" fill="none" stroke="${vc}" stroke-opacity="${f1(0.35 + 0.5 * sheen)}" stroke-width="${f1(sw * 0.35)}" stroke-linejoin="round"/>`;
    }
    case 'char': {
      // Alocasia chienlii: matte near-black with a rough, scorched-looking surface of
      // ashy flecks and crinkles.
      let dots = '', crinkles = '';
      for (let i = 0; i < 26; i++) {
        const n = k * 41 + i;
        const t = 0.04 + 0.88 * ctx.r(n, 'ct');
        const x = (ctx.r(n, 'cx') * 2 - 1) * W * 0.3 * Math.pow(1 - t, 0.8);
        const y = -L * t;
        if (i % 3) {
          const r = W * (0.012 + 0.022 * ctx.r(n, 'cr'));
          dots += `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0`;
        } else {
          const l = W * (0.06 + 0.06 * ctx.r(n, 'cl')), sd = ctx.r(n, 'cs') < 0.5 ? -1 : 1;
          crinkles += `M${f1(x)} ${f1(y)}q${f1(l * 0.5)} ${f1(sd * l * 0.3)} ${f1(l)} 0`;
        }
      }
      return `<path d="${dots}" fill="${vc}" fill-opacity=".55"/>`
        + `<path d="${crinkles}" fill="none" stroke="${vc}" stroke-opacity=".45" stroke-width="${f1(sw * 0.35)}" stroke-linecap="round"/>`;
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
  if (o.variType && o.dry == null) s += variegate(ctx, o, L, W, shape, sw);
  if (o.shape === 'holes' || (o.shape === 'monstera' && o.windows !== false)) {
    // Monstera windows: shaded ovals between the midrib and the margin.
    const hc = shade(paint(o.color), -0.3);
    const windows = o.shape === 'holes'
      ? [[0.3, 1, 0.2], [0.5, 1, 0.2], [0.69, 0.75, 0.2]]
      : [[0.36, 0.55, 0.12], [0.6, 0.5, 0.11]];
    for (const [ht, hs, hx0] of windows) {
      for (const hx of [-1, 1]) {
        s += `<ellipse cx="${f1(hx * W * hx0)}" cy="${f1(-L * ht)}" rx="${f1(W * 0.1 * hs)}" ry="${f1(L * 0.065 * hs)}" fill="${hc}" stroke="${ctx.line}" stroke-width=".8"/>`;
      }
    }
  }
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

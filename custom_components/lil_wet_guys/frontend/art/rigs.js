// The nine plant "rigs". Each takes a drawing context and returns SVG for the
// layers behind the pot rim ({back}) and hanging in front of the pot ({front}).
//
// ctx: { p (species def), d (dryness 0-1), ghost, r(i, salt), jit(i, salt, amt),
//        fill(hex, k), fillD(hex, d), line, drops(i, chance, rank), fell(o) }

import { clamp, lerp, mix } from './color.js';
import { BX, BY, at, curve, deg, dirv, droopTo, f1, sgn, side, smooth, sub } from './geom.js';
import { terrarium } from './jar.js';
import { PROFILES, leaf, stem, strapLeaf } from './leaves.js';

const fan = (i, n) => (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2); // -1 .. 1
/** How far a plant has grown past its usual fullness: 0 up to 100%, 1 at 200%. */
const mature = (ctx) => clamp(ctx.full - 1, 0, 1);
/** Narrow a strap where it enters the soil so its corners stay buried. */
const rooted = (wf) => (t) => wf(t) * (t < 0.08 ? 0.6 + 5 * t : 1);

/* ---------------------------------------------------------------- flowers */

function tubeFlower(ctx, x, y, a, color) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${deg(a)})">`
    + `<path d="M-2.4 1 C-3 -7 -2 -13 0 -15 C2 -13 3 -7 2.4 1Z" fill="${ctx.fill(color)}" stroke="${ctx.line}" stroke-width="1"/>`
    + `<path d="M-3.2 1.5 Q0 -5 3.2 1.5Z" fill="${ctx.fill('#5a2a30')}" stroke="${ctx.line}" stroke-width="1"/></g>`;
}

function starFlower(ctx, x, y, r, color) {
  let s = `<g transform="translate(${f1(x)} ${f1(y)})">`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += `<path transform="rotate(${deg(a)})" d="M0 0C${f1(r * 0.3)} ${f1(-r * 0.35)} ${f1(r * 0.22)} ${f1(-r * 0.8)} 0 ${f1(-r)}C${f1(-r * 0.22)} ${f1(-r * 0.8)} ${f1(-r * 0.3)} ${f1(-r * 0.35)} 0 0Z" `
      + `fill="${ctx.fill(color)}" stroke="${ctx.line}" stroke-width=".9"/>`;
  }
  return `${s}<circle r="${f1(r * 0.26)}" fill="${ctx.fill('#f6d34a')}" stroke="${ctx.line}" stroke-width=".9"/></g>`;
}

/** Inch plant: three rounded petals round a yellow eye. */
function triFlower(ctx, x, y, r, color) {
  let s = `<g transform="translate(${f1(x)} ${f1(y)})">`;
  for (let i = 0; i < 3; i++) {
    s += `<ellipse transform="rotate(${i * 120})" cy="${f1(-r * 0.55)}" rx="${f1(r * 0.48)}" ry="${f1(r * 0.6)}" fill="${ctx.fill(color)}" stroke="${ctx.line}" stroke-width=".8"/>`;
  }
  return `${s}<circle r="${f1(r * 0.24)}" fill="${ctx.fill('#f6d34a')}"/></g>`;
}

/** Purple passion: an orange tuft like a little shaving brush in a green cup. */
function tassel(ctx, x, y, a, color) {
  const [dx, dy] = dirv(a);
  let hairs = '';
  for (let i = 0; i < 7; i++) {
    const [hx, hy] = dirv(a + (i / 6 - 0.5) * 1.1);
    hairs += `M${f1(x + dx * 2)} ${f1(y + dy * 2)}l${f1(hx * 5.5)} ${f1(hy * 5.5)}`;
  }
  const cx = x + dx * 1.2, cy = y + dy * 1.2;
  return `<path d="${hairs}" stroke="${ctx.line}" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="${hairs}" stroke="${ctx.fill(color)}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="2.1" ry="2.7" transform="rotate(${deg(a)} ${f1(cx)} ${f1(cy)})" fill="${ctx.fill('#5a7a3a')}" stroke="${ctx.line}" stroke-width=".9"/>`;
}

/** A thin flower spike, thickening into a catkin-like tip (peperomia, nerve plant). */
function spike(ctx, pts, color, w) {
  const tip = smooth(sub(pts, 0.55, 1, 6));
  return stem(ctx, pts, ctx.p.spikes?.stalk ?? ctx.p.stem, 1.2)
    + `<path d="${tip}" fill="none" stroke="${ctx.line}" stroke-width="${f1(w + 2)}" stroke-linecap="round"/>`
    + `<path d="${tip}" fill="none" stroke="${ctx.fill(color)}" stroke-width="${f1(w)}" stroke-linecap="round"/>`;
}

/**
 * A flower stalk rising from a mature plant's heart: snake plants carry tiny
 * greenish-white tubes up a straight spike (p.bloomSpike); aloes and gasteria hang
 * tubular flowers from the top of a stalk that arches over (p.raceme).
 */
function bloomStalk(ctx, x, len, lean) {
  const { p, d } = ctx;
  const r = p.raceme ?? p.bloomSpike;
  const arch = p.raceme ? r.arch ?? 0.5 : 0.05;
  const pts = curve(x, BY + 1, lean * 0.3, lean * 0.3 + sgn(lean || 1) * (arch + d * 0.8), len, 12, 1.6);
  let s = stem(ctx, pts, r.stalk, 1.6);
  const n = r.n ?? 9;
  for (let k = 0; k < n; k++) {
    const q = at(pts, (r.from ?? 0.55) + (k / n) * (0.97 - (r.from ?? 0.55)));
    const sd = k % 2 ? 1 : -1;
    // Hanging flowers droop from the stalk; spike flowers stand out from it.
    const fa = p.raceme ? Math.PI + sd * 0.35 : q.a + sd * 0.9;
    const fl = (r.size ?? 5) * (0.8 + 0.3 * ctx.r(k, 'bfl'));
    const [dx, dy] = dirv(fa);
    s += `<path d="M${f1(q.x)} ${f1(q.y)}l${f1(dx * fl)} ${f1(dy * fl)}" stroke="${ctx.line}" stroke-width="${f1((r.w ?? 2.2) + 1.6)}" stroke-linecap="round"/>`
      + `<path d="M${f1(q.x)} ${f1(q.y)}l${f1(dx * fl)} ${f1(dy * fl)}" stroke="${ctx.fill(r.color)}" stroke-width="${f1(r.w ?? 2.2)}" stroke-linecap="round"/>`;
    if (r.tip) s += `<circle cx="${f1(q.x + dx * fl)}" cy="${f1(q.y + dy * fl)}" r="${f1((r.w ?? 2.2) * 0.45)}" fill="${ctx.fill(r.tip)}"/>`;
  }
  return s;
}

/* ------------------------------------------------------- upright leaves */

function uprightLeaf(ctx) {
  const { p, d } = ctx;
  // A clump only holds so many leaves (p.cap): alocasias drop an old leaf as a new
  // one opens, so a fuller plant spreads by pups instead.
  const n = Math.min(ctx.n(p.count), p.cap ?? Infinity);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({
      i,
      a0: c * (p.spread ?? 0.9) + ctx.jit(i, 'a', 0.12),
      len: lerp(p.len[1], p.len[0], Math.abs(c)) * (0.88 + 0.24 * ctx.r(i, 'l')),
    });
  }
  items.sort((u, v) => v.len - u.len);
  let back = '';
  for (const { i, a0, len } of items) {
    if (ctx.drops(i)) { ctx.fell(p.leaf); continue; }
    const s = sgn(a0);
    const bend = a0 * 0.45 + s * d * (p.droop ?? 1.4);
    const pts = curve(BX + a0 * 7, BY, a0 * 0.5, a0 * 0.5 + bend, len, 10, 1.7);
    back += stem(ctx, pts, p.stem, p.stemW ?? 2.4);
    const tip = pts[pts.length - 1];
    back += leaf(ctx, tip.x, tip.y, droopTo(tip.a + s * (p.tilt ?? 0.35), d * 0.5), { ...p.leaf, k: i });
  }
  // The next leaf, still rolled up like a cigar, rising from the middle (p.scroll).
  if (p.scroll && ctx.full >= 0.5 && !ctx.drops(99, 1, 0.1)) {
    const a = ctx.jit(99, 'sa', 0.12);
    const pts = curve(BX + a * 6, BY, a, a + d * 0.6, p.len[1] * 0.75, 8, 1.4);
    back += strapLeaf(ctx, pts, { color: p.scroll, id: 99, wf: (t) => 4.2 * PROFILES.taper(t), sw: 1.3 });
  }
  return { back };
}

/* ------------------------------------------------------------- trailing */

/** Opposite pairs of leaves, evenly spaced along a stem and smaller toward its tip. */
function pairedLeaves(ctx, pts, len, idBase) {
  const { p, d } = ctx;
  const lf = p.leaf;
  const n = ctx.n(Math.max(2, len / (p.spacing ?? 6.5)));
  let s = '';
  for (let k = 0; k < n; k++) {
    const t = (k + 0.6) / n;
    const q = at(pts, t);
    const sc = 1 - 0.3 * t;
    for (const ls of [-1, 1]) {
      const id = idBase + k * 2 + (ls > 0 ? 1 : 0);
      if (ctx.drops(id)) { if (k % 3 === 0 && ls > 0) ctx.fell(lf); continue; }
      s += leaf(ctx, q.x, q.y, droopTo(q.a + ls * 0.9, 0.08 + d * 0.5), { ...lf, L: lf.L * sc, W: lf.W * sc, k: id });
    }
  }
  return s;
}

function strings(ctx) {
  // Dischidia: one tangle of thin stems, all dressed the same way. The middle ones
  // arch up and over, the outer arches lean further and spill down, and the
  // hanging stems start among them, some behind the rim and some in front.
  const { p, d } = ctx;
  let back = '', front = '';
  const nA = ctx.n(p.arches ?? 8);
  const arches = [];
  for (let i = 0; i < nA; i++) {
    const c = fan(i, nA) + ctx.jit(i, 'ac', 0.08);
    arches.push({ i, c });
  }
  arches.sort((u, v) => Math.abs(v.c) - Math.abs(u.c)); // outer arches behind the middle ones
  for (const { i, c } of arches) {
    const s = c < 0 ? -1 : 1;
    const len = lerp(64, 50, Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'al'));
    const a1 = c * 0.6 + s * (1.4 + 0.7 * ctx.r(i, 'ab') + 0.9 * Math.abs(c)) + s * d * 1.1;
    const pts = curve(BX + c * 26, BY + 1, c * 0.5, a1, len, 14, 1.9);
    back += stem(ctx, pts, p.stem, 1.3) + pairedLeaves(ctx, pts, len, 1000 + i * 40);
    // Grown up, tiny white urn-shaped flowers sit along the stems (p.tinyFlowers).
    if (p.tinyFlowers) {
      const nf = Math.floor(mature(ctx) * 3 * ctx.r(i, 'tf') + mature(ctx));
      for (let k = 0; k < nf; k++) {
        const q = at(pts, 0.3 + 0.6 * ctx.r(i * 7 + k, 'tq'));
        back += `<circle cx="${f1(q.x)}" cy="${f1(q.y)}" r="1.6" fill="${ctx.fill(p.tinyFlowers)}" stroke="${ctx.line}" stroke-width=".7"/>`;
      }
    }
  }
  // Grown up, thin flower spikes stand up out of the middle (p.spikes).
  const nSp = p.spikes ? Math.round(p.spikes.n * mature(ctx)) : 0;
  for (let k = 0; k < nSp; k++) {
    const c = fan(k, nSp) * 0.8 + ctx.jit(k, 'sx', 0.15);
    back += spike(ctx, curve(BX + c * 12, BY + 1, c * 0.3, c * 0.45 + sgn(c) * d * 1.4, 46 * p.spikes.len * (0.9 + 0.2 * ctx.r(k, 'sl')), 8, 1.2), p.spikes.color, p.spikes.w);
  }
  const nH = ctx.n(p.hangs ?? 6, 0);
  const ranks = Math.max(1, Math.ceil(nH / 2) - 1);
  for (let v = 0; v < nH; v++) {
    const s = v % 2 === 0 ? -1 : 1;
    const rank = Math.floor(v / 2);
    const len = lerp(90, 64, rank / ranks) * (0.85 + 0.3 * ctx.r(v, 'hl'));
    // Start inside the rim and rise a little before falling, so they grow out of the clump.
    const x0 = BX + s * (Math.max(8, 34 - rank * 7) + 6 * ctx.r(v, 'hx'));
    const pts = curve(x0, BY, s * (0.45 + 0.35 * ctx.r(v, 'ha')), s * (3.02 + 0.1 * ctx.r(v, 'hb')), len, 18, 0.6);
    const g = stem(ctx, pts, p.stem, 1.3) + pairedLeaves(ctx, pts, len, 3000 + v * 40);
    if (rank % 2 === 1) back += g; // every other pair hangs behind the pot
    else front += g;
  }
  return { back, front };
}

function trailing(ctx) {
  const { p, d } = ctx;
  if (p.form === 'strings') return strings(ctx);
  const lf = p.leaf;
  let back = '', front = '', blooms = '';

  const nTop = ctx.n(p.top ?? 6);
  const tops = [];
  for (let i = 0; i < nTop; i++) {
    const c = fan(i, nTop);
    tops.push({ i, c, a0: c * 1.35 + ctx.jit(i, 'ta', 0.15) });
  }
  tops.sort((u, v) => Math.abs(v.c) - Math.abs(u.c));
  for (const { i, c, a0 } of tops) {
    // The outer stems are nearly as long as the middle ones and arch out over the
    // rim, so the top runs on into the hanging vines instead of sitting apart.
    const s = sgn(a0);
    const len = (p.topLen ?? 26) * (0.75 + 0.5 * ctx.r(i, 'tl')) * (1 - 0.12 * Math.abs(c));
    const pts = curve(BX + c * 22, BY + 1, a0 * 0.75, a0 * 1.3 + s * d * 1.3, len, 8, 1.5);
    back += stem(ctx, pts, p.stem, 1.8);
    // More leaves part-way up (p.topLeaves), alternating sides, for a fuller mound.
    const nMid = ctx.n(p.topLeaves ?? 0, 0);
    for (let k = 0; k < nMid; k++) {
      const id = 600 + i * 10 + k;
      if (ctx.drops(id)) continue;
      const q = at(pts, 0.42 + 0.3 * (k / Math.max(1, nMid - 1)) + ctx.jit(id, 'tq', 0.06));
      const ls = (k + i) % 2 ? 1 : -1;
      back += leaf(ctx, q.x, q.y, droopTo(q.a + ls * 0.95, 0.12 + d * 0.5), { ...lf, L: lf.L * 0.85, W: lf.W * 0.85, k: id });
    }
    if (ctx.drops(i)) { ctx.fell(lf); continue; }
    const tip = pts[pts.length - 1];
    back += leaf(ctx, tip.x, tip.y, droopTo(tip.a + s * 0.35, d * 0.55), { ...lf, k: i });
    // Grown past its usual size it flowers at the tips (p.blooms), drawn over the
    // vines so they show.
    if (p.blooms && ctx.r(i, 'bloom') < mature(ctx) * 0.8 && !ctx.drops(800 + i, 1, 0.1)) {
      blooms += triFlower(ctx, tip.x, tip.y, 4.4, p.blooms);
    }
    if (p.pairs) {
      const q = at(pts, 0.55);
      back += leaf(ctx, q.x, q.y, droopTo(q.a - s * 0.9, d * 0.5), { ...lf, k: i + 50 });
    }
  }

  // A tuft of short stems with leaves low in the middle (p.tuft), so the centre isn't bare.
  const nTuft = ctx.n(p.tuft ?? 0, 0);
  for (let i = 0; i < nTuft; i++) {
    const c = fan(i, nTuft) * 0.8 + ctx.jit(i, 'tc', 0.1);
    const s = sgn(c);
    const len = (p.topLen ?? 26) * (0.35 + 0.25 * ctx.r(i, 'tt'));
    const pts = curve(BX + c * 14, BY + 1, c * 0.55, c * 0.9 + s * d * 1.2, len, 6, 1.4);
    back += stem(ctx, pts, p.stem, 1.6);
    if (ctx.drops(300 + i)) { ctx.fell(lf); continue; }
    const tip = pts[pts.length - 1];
    back += leaf(ctx, tip.x, tip.y, droopTo(tip.a + s * 0.3, d * 0.55), { ...lf, L: lf.L * 0.9, W: lf.W * 0.9, k: 300 + i });
  }

  const nV = ctx.n(p.vines ?? 3, 0);
  for (let v = 0; v < nV; v++) {
    const sd = v % 2 === 0 ? -1 : 1;
    const rank = Math.floor(v / 2);
    // Vines start inside the rim among the top stems and rise a little before
    // falling, so they grow out of the clump.
    const x0 = BX + sd * Math.max(8, 38 - rank * 11);
    const a0 = sd * (0.55 + 0.3 * ctx.r(v, 'va'));
    const a1 = sd * (3.02 + 0.1 * ctx.r(v, 'vb'));
    const len = (p.vineLen ?? 70) * 1.2 * (0.82 + 0.36 * ctx.r(v, 'vl')) * Math.max(0.35, 1 - rank * 0.2); // some goes into the rise
    const pts = curve(x0, BY - 1, a0, a1, len, 18, 0.45);
    let g = stem(ctx, pts, p.stem, 1.6);
    const nL = ctx.n(p.perVine ?? 6);
    // Leggy plants (p.leggy) lose the leaves near the base of their older vines.
    const bare = p.leggy ? 0.3 * mature(ctx) : 0;
    for (let k = 0; k < nL; k++) {
      const t = 0.12 + bare + (k / nL) * (0.88 - bare);
      const q = at(pts, t);
      const s2 = k % 2 ? 1 : -1;
      const id = 100 + v * 20 + k;
      const sc = 1.05 - 0.35 * t;
      const leaves = p.pairs ? [s2, -s2] : [s2];
      for (const [j, ls] of leaves.entries()) {
        if (ctx.drops(id + j * 7)) { if (k % 2 === 0) ctx.fell(lf); continue; }
        const la = droopTo(q.a + ls * 0.95, 0.12 + d * 0.5);
        g += leaf(ctx, q.x, q.y, la, { ...lf, L: lf.L * sc, W: lf.W * sc, k: id + j * 7 });
      }
    }
    // Lipstick plant: clusters of tubular flowers at the tips of grown-up vines.
    if (p.flowers && ctx.full >= 0.6 && ctx.r(v, 'tipfl') < 0.35 + 0.6 * Math.min(1, ctx.full - 0.5) && !ctx.drops(1500 + v, 1, 0.1)) {
      const e = pts[pts.length - 1];
      const nf = 2 + Math.round(mature(ctx) * 2 * ctx.r(v, 'nfl'));
      for (let j = 0; j < nf; j++) g += tubeFlower(ctx, e.x, e.y, e.a + (j - (nf - 1) / 2) * 0.55, p.flowers);
    }
    // Grown past its usual size, a vine branches: side shoots heading outward.
    const nb = Math.floor(mature(ctx) * 2.4 * (0.6 + 0.8 * ctx.r(v, 'nb')));
    for (let b = 0; b < nb; b++) {
      const q = at(pts, 0.32 + b * 0.24 + ctx.jit(v * 5 + b, 'bt', 0.05));
      const bp = curve(q.x, q.y, q.a - sd * 0.9, q.a - sd * 0.2, 18 + 8 * ctx.r(v * 5 + b, 'bl'), 8, 1);
      g += stem(ctx, bp, p.stem, 1.4);
      for (let k = 0; k < 4; k++) {
        const id = 2000 + v * 40 + b * 8 + k;
        if (ctx.drops(id)) continue;
        const bq = at(bp, 0.3 + k * 0.22);
        g += leaf(ctx, bq.x, bq.y, droopTo(bq.a + (k % 2 ? 0.95 : -0.95), 0.12 + d * 0.5), { ...lf, L: lf.L * 0.8, W: lf.W * 0.8, k: id });
      }
    }
    // Aroids put out brown aerial roots at their nodes, reaching back toward the pot.
    if (p.roots && mature(ctx) > 0.15) {
      let roots = '';
      for (let k = 0; k < nL; k++) {
        if (ctx.r(v * 50 + k, 'rt') > mature(ctx) * 0.8) continue;
        const q = at(pts, 0.15 + (k / nL) * 0.8);
        const [dx, dy] = dirv(q.a + sd * 0.7 + ctx.jit(v * 50 + k, 'ra', 0.3));
        const rl = 3.5 + 3.5 * ctx.r(v * 50 + k, 'rl');
        roots += `M${f1(q.x)} ${f1(q.y)}q${f1(dx * rl * 0.5 + 1)} ${f1(dy * rl * 0.5)} ${f1(dx * rl)} ${f1(dy * rl)}`;
      }
      g = `<path d="${roots}" fill="none" stroke="${ctx.line}" stroke-width="2.6" stroke-linecap="round"/>`
        + `<path d="${roots}" fill="none" stroke="${ctx.fill('#9a7452')}" stroke-width="1.4" stroke-linecap="round"/>${g}`;
    }
    front += g;
  }
  return { back, front: front + blooms };
}

/* ----------------------------------------------- swords, tongues, spikes */

function sword(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    let a0, len;
    if (p.fanned) {
      const sd = i % 2 ? 1 : -1;
      const rank = Math.floor(i / 2) / Math.max(1, Math.ceil(n / 2) - 1);
      a0 = sd * (0.18 + rank * (p.spread ?? 1.1)) + ctx.jit(i, 'a', 0.08);
      len = lerp(p.len[1], p.len[0], rank) * (0.9 + 0.2 * ctx.r(i, 'l'));
    } else {
      a0 = c * (p.spread ?? 0.35) + ctx.jit(i, 'a', 0.1);
      len = lerp(p.len[1], p.len[0], Math.abs(c) ** 0.8) * (0.85 + 0.3 * ctx.r(i, 'l'));
    }
    items.push({ i, a0, len, x: BX + c * (p.base ?? 22) + ctx.jit(i, 'x', 3) });
  }
  items.sort((u, v) => v.len - u.len);
  let back = '';
  const prof = PROFILES[p.profile ?? 'sword'];
  for (const { i, a0, len, x } of items) {
    const s = sgn(a0);
    const dp = ctx.dropAt(i, p.flop ?? 0.3);
    const flop = ctx.ghost ? 0 : clamp((d - dp) / 0.35);
    const bend = a0 * (p.curl ?? 0.25) + s * d * (p.lean ?? 0.35) + s * flop * 1.9;
    // Leaves leave the soil nearly upright and fan out above it.
    const pts = curve(x, BY + 1, a0 * 0.3, a0 * 1.25 + bend, len * (1 - 0.06 * d), 14, 1.6);
    const W = p.width * (1 - 0.16 * d);
    back += strapLeaf(ctx, pts, { ...p.strap, id: i, wf: rooted((t) => W * prof(t)), sw: 1.8 });
  }
  // A mature plant now and then sends up a flower stalk.
  if ((p.bloomSpike || p.raceme) && !ctx.pup && ctx.r(0, 'blooms') < mature(ctx) * 1.3 - 0.1) {
    const lean = ctx.jit(1, 'bl', 0.3);
    back += bloomStalk(ctx, BX + lean * 14, (p.raceme ?? p.bloomSpike).len, lean);
  }
  return { back };
}

/* ------------------------------------------------------------ rosettes */

function rosetteAt(ctx, x, sc, ci) {
  const { p, d } = ctx;
  const n = ctx.n(p.count * (sc < 1 ? 0.7 : 1));
  let s = '';
  for (let j = 0; j < n; j++) {
    const u = n === 1 ? 1 : j / (n - 1); // 0 = outer, 1 = heart of the rosette
    const sd = j % 2 ? 1 : -1;
    const id = ci * 50 + j;
    const a0 = sd * lerp(p.spread ?? 1.2, 0.06, u) + ctx.jit(id, 'a', 0.08);
    const len = lerp(p.len[1], p.len[0], u * 0.7) * sc * (0.9 + 0.2 * ctx.r(id, 'l'));
    const bend = -a0 * 0.28 + sgn(a0) * d * 0.55 * (1 - u);
    const pts = curve(x + a0 * 4 * sc, BY + 1, a0 * 0.4, a0 * 1.15 + bend, len, 10, 1.3);
    const W = p.width * sc * (1 - 0.3 * d);
    s += strapLeaf(ctx, pts, { ...p.strap, id, wf: rooted((t) => W * PROFILES[p.profile ?? 'triangle'](t)), sw: 1.5 });
  }
  return s;
}

function rosette(ctx) {
  const spots = [{ x: BX, s: 1 }, { x: BX - 30, s: 0.55 }, { x: BX + 30, s: 0.62 }].slice(0, ctx.n(ctx.p.clusters ?? 1));
  let back = '';
  for (let ci = spots.length - 1; ci >= 0; ci--) back += rosetteAt(ctx, spots[ci].x, spots[ci].s, ci);
  if (ctx.p.raceme && !ctx.pup && ctx.r(0, 'blooms') < mature(ctx) * 1.3 - 0.1) {
    const lean = ctx.jit(1, 'bl', 0.3);
    back = bloomStalk(ctx, BX + lean * 10, ctx.p.raceme.len, lean) + back;
  }
  return { back };
}

/* -------------------------------------------------------- arching (spider) */

function arching(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({
      i,
      a0: c * 1.25 + ctx.jit(i, 'a', 0.1),
      len: lerp(p.len[1], p.len[0], Math.abs(c) ** 0.7) * (0.85 + 0.3 * ctx.r(i, 'l')),
    });
  }
  items.sort((u, v) => Math.abs(u.a0) - Math.abs(v.a0));
  let back = '', front = '';
  for (const { i, a0, len } of items) {
    if (ctx.drops(i)) { ctx.fell({ strap: true, color: p.strap.color, W: p.width }); continue; }
    const s = sgn(a0);
    const a1 = s * Math.min(3.05, Math.abs(a0) * 0.8 + 0.35 + 1.5 * Math.abs(a0) + d * 0.9);
    const pts = curve(BX + a0 * 6, BY, a0 * 0.8, a1, len, 12, 1.3);
    back += strapLeaf(ctx, pts, { ...p.strap, id: i, wf: (t) => p.width * (1 - 0.15 * d) * PROFILES.strap(t), sw: 1.4 });
  }
  // A baby spider plant hanging from a runner: a few roots and a little rosette.
  const plantlet = (x, y, sc, idBase) => {
    let s = '';
    for (let k = 0; k < 3; k++) {
      const rp = curve(x + (k - 1) * 2 * sc, y + 1, Math.PI + (k - 1) * 0.35, Math.PI + (k - 1) * 0.5, 6 * sc, 3, 1);
      s += stem(ctx, rp, '#d8c9a8', 0.8);
    }
    for (let k = 0; k < 5; k++) {
      const a = (k / 4 - 0.5) * 2.2;
      const lp = curve(x, y, a, a + sgn(a) * (0.6 + d * 0.9), (12 + 4 * (1 - Math.abs(a) / 1.1)) * sc, 6, 1.2);
      s += strapLeaf(ctx, lp, { ...p.strap, id: idBase + k, wf: (t) => 3.6 * sc * PROFILES.strap(t), sw: 1.1 });
    }
    return s;
  };
  // Only a mature plant sends out runners; young ones are just a clump of leaves.
  const nRun = ctx.pup || ctx.full < 0.7 ? 0 : ctx.n(p.runners ?? 0, 0);
  for (let r = 0; r < nRun; r++) {
    const sd = r % 2 ? 1 : -1;
    const tier = Math.floor(r / 2); // more runners come out lower and shorter
    const pts = curve(BX + sd * 10, BY, sd * (0.35 + 0.3 * tier), sd * 2.7, 84 - 16 * Math.min(tier, 3), 14, 0.9);
    front += stem(ctx, pts, '#c9d9a0', 1.4);
    // Little white flowers along the runner.
    for (const [j, t] of [0.32, 0.68].entries()) {
      if (ctx.r(r * 4 + j, 'sf') < 0.35 + mature(ctx) * 0.6) {
        const q = at(pts, t);
        front += starFlower(ctx, q.x, q.y - 2, 3.4, '#fbfaf0');
      }
    }
    // An overgrown plant's runners carry a second baby part-way along.
    if (ctx.r(r, 'mid') < mature(ctx) * 1.2) {
      const q = at(pts, 0.5);
      front += plantlet(q.x, q.y + 1, 0.7, 700 + r * 10);
    }
    const e = pts[pts.length - 1];
    front += plantlet(e.x, e.y, 1, 500 + r * 10);
  }
  return { back, front };
}

/* ------------------------------------------------------------------ canes */

function dragon(ctx) {
  const { p, d } = ctx;
  const canes = p.canes;
  let back = '';
  const crowns = [];
  // Young dragon trees are a grassy clump on short canes; the canes lengthen with
  // age, dropping their lower leaves, until each tuft sits on a bare cane.
  const age = ctx.full < 1 ? 0.3 + 0.7 * ctx.full : 1 + 0.1 * mature(ctx);
  for (const [ci, c] of canes.entries()) {
    const h = c.h * age * (0.92 + 0.16 * ctx.r(ci, 'h'));
    const pts = curve(BX + c.x, BY + 1, c.a, c.a + (ctx.r(ci, 'b') - 0.5) * 0.4 + sgn(c.a) * d * 0.15, h, 12, 1);
    back += stem(ctx, pts, p.cane, 5);
    let rings = '';
    for (let m = 1; m < 10; m++) {
      const q = at(pts, m / 10.5);
      const [lx, ly] = side(q, -2.6), [rx, ry] = side(q, 2.6);
      rings += `M${f1(lx)} ${f1(ly)}L${f1(rx)} ${f1(ry)}`;
    }
    back += `<path d="${rings}" stroke="${ctx.fill('#5d4d3e')}" stroke-width=".9" stroke-linecap="round"/>`;
    crowns.push({ e: pts[pts.length - 1], ci });
  }
  for (const { e, ci } of crowns) back += crown(ctx, e.x, e.y, e.a, ci);
  return { back };
}

function crown(ctx, x, y, a, ci) {
  const { p, d } = ctx;
  const m = ctx.n(p.crown ?? 14);
  const items = [];
  for (let j = 0; j < m; j++) {
    const c = fan(j, m);
    items.push({
      j, c,
      la: a + c * 1.9 + ctx.jit(ci * 40 + j, 'a', 0.1),
      len: lerp(p.crownLen[1], p.crownLen[0], Math.abs(c)) * (0.85 + 0.3 * ctx.r(ci * 40 + j, 'l')),
    });
  }
  items.sort((u, v) => Math.abs(v.c) - Math.abs(u.c));
  let s = '';
  for (const { j, c, la, len } of items) {
    const id = ci * 40 + j;
    if (ctx.drops(id, Math.abs(c) > 0.55 ? 0.75 : 0.1, 1 - Math.abs(c))) {
      ctx.fell({ strap: true, color: p.strap.color, W: 4 });
      continue;
    }
    const sg = sgn(la - a || 1);
    const bend = sg * (0.15 + 0.5 * Math.abs(c)) + sg * d * (0.6 + 0.8 * Math.abs(c));
    const pts = curve(x, y, la, la + bend, len, 8, 1.4);
    s += strapLeaf(ctx, pts, { ...p.strap, id, wf: (t) => (p.stripW ?? 4.2) * PROFILES.taper(t), sw: 1.2 });
  }
  return s;
}

function bamboo(ctx) {
  const { p, d } = ctx;
  let back = '';
  const stalks = [...p.stalks].sort((u, v) => v.h - u.h);
  for (const [si, st] of stalks.entries()) {
    const a = ctx.jit(si, 'a', 0.04);
    const pts = curve(BX + st.x, BY + 1, a, a + ctx.jit(si, 'b', 0.04), st.h, 10, 1);
    back += strapLeaf(ctx, pts, { color: p.stalk, id: si, wf: () => 7.5, tip: 'flat', sw: 1.8, dk: 0.8 });
    let nodes = '';
    for (let y = 20; y < st.h - 4; y += 21) {
      const q = at(pts, y / st.h);
      const [lx, ly] = side(q, -4.4), [rx, ry] = side(q, 4.4);
      nodes += `M${f1(lx)} ${f1(ly)}L${f1(rx)} ${f1(ry)}`;
    }
    back += `<path d="${nodes}" stroke="${ctx.line}" stroke-width="1.3" stroke-linecap="round"/>`;
    const e = pts[pts.length - 1];
    back += `<ellipse cx="${f1(e.x)}" cy="${f1(e.y)}" rx="3.9" ry="1.6" fill="${ctx.fill(p.stalk, 0.8)}" stroke="${ctx.line}" stroke-width="1.2"/>`;
    const sprigs = [{ t: 0.9, n: 3 }];
    if (st.h > 80) sprigs.push({ t: 0.5, n: 2 });
    for (const [gi, sp] of sprigs.entries()) {
      const q = at(pts, sp.t);
      const sdBase = gi % 2 ? -1 : 1;
      for (let k = 0; k < sp.n; k++) {
        const id = si * 20 + gi * 5 + k;
        if (ctx.drops(id)) { ctx.fell({ shape: 'lance', L: 22, W: 8, color: p.leaf.color }); continue; }
        const la = sp.n === 3 ? (k - 1) * 0.85 + sdBase * 0.1 : sdBase * (0.7 + k * 0.5);
        const sd = sgn(la);
        const lp = curve(q.x, q.y, la, la + sd * (0.35 + d * 1.1), 24, 8, 1.2);
        back += strapLeaf(ctx, lp, { ...p.leaf, id, wf: (t) => 8.5 * PROFILES.lance(t), sw: 1.3 });
      }
    }
    // The stalks never grow taller; a grown-up plant sprouts new shoots at its nodes.
    if (ctx.r(si, 'shoot') < mature(ctx) * 1.2) {
      const q = at(pts, 0.32 + 0.2 * ctx.r(si, 'sq'));
      const sd = ctx.r(si, 'ss') < 0.5 ? -1 : 1;
      const sp = curve(q.x, q.y, sd * 0.7, sd * 0.35, 16, 6, 1);
      back += stem(ctx, sp, p.stalk, 2.4);
      const e2 = sp[sp.length - 1];
      for (let k = 0; k < 3; k++) {
        const la = sd * 0.35 + (k - 1) * 0.75;
        const lp = curve(e2.x, e2.y, la, la + sgn(la) * (0.35 + d * 1.1), 18, 8, 1.2);
        back += strapLeaf(ctx, lp, { ...p.leaf, id: 300 + si * 5 + k, wf: (t) => 7 * PROFILES.lance(t), sw: 1.2 });
      }
    }
  }
  return { back };
}

function banana(ctx) {
  const { p, d } = ctx;
  let back = '';
  const trunk = curve(BX, BY + 1, 0.02, -0.02, p.trunk, 10, 1);
  back += strapLeaf(ctx, trunk, { color: p.trunkColor, id: 0, wf: (t) => 17 - 6 * t, tip: 'flat', sw: 1.8, dk: 0.7 });
  let blot = '';
  for (let i = 0; i < 6; i++) {
    const q = at(trunk, 0.1 + i * 0.14);
    const [x, y] = side(q, (ctx.r(i, 'bl') - 0.5) * 8);
    blot += `M${f1(x)} ${f1(y)}l${f1(1 + ctx.r(i, 'bx') * 2)} ${f1(-3 - ctx.r(i, 'by') * 3)}`;
  }
  back += `<path d="${blot}" stroke="${ctx.fill('#7b5a3a')}" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".7"/>`;
  const top = trunk[trunk.length - 1];
  const angles = p.leafAngles;
  const order = angles.map((a, k) => ({ a, k })).sort((u, v) => Math.abs(v.a) - Math.abs(u.a));
  for (const { a, k } of order) {
    const a0 = a + ctx.jit(k, 'a', 0.08);
    if (ctx.drops(k, Math.abs(a) > 0.9 ? 0.65 : 0, 0)) { ctx.fell({ shape: 'lance', L: 26, W: 11, color: p.strap.color }); continue; }
    const s = sgn(a0);
    const pet = curve(top.x, top.y + 2, a0 * 0.5, a0, 10, 4, 1);
    back += stem(ctx, pet, p.strap.color, 3);
    const e = pet[pet.length - 1];
    const len = lerp(p.len[1], p.len[0], Math.abs(a)) * (0.9 + 0.2 * ctx.r(k, 'l'));
    const pts = curve(e.x, e.y, a0, a0 + s * (0.35 + 0.55 * Math.abs(a0)) + s * d * 1.35, len, 14, 1.2);
    const W = p.W * (1 - 0.15 * d);
    // Banana leaves tear along their veins as they age, the outer (older) ones most.
    const splits = Math.round(mature(ctx) * (1 + 4 * ctx.r(k, 'spl')) * (0.4 + 0.6 * Math.abs(a)));
    back += strapLeaf(ctx, pts, { ...p.strap, id: k, wf: (t) => W * PROFILES.paddle(t), tip: 'round', sw: 1.8, splits });
  }
  const roll = curve(top.x, top.y + 2, 0.05, -0.1, 30, 6, 1);
  back += strapLeaf(ctx, roll, { color: '#b5d67a', id: 99, wf: (t) => 5.5 * (1 - 0.5 * t), tip: 'round', sw: 1.4 });
  return { back };
}

function zz(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  let back = '';
  // A growing plant pushes up a new stalk from its rhizome, leaflets still furled
  // tight against it like a spear.
  if (ctx.full >= 0.8 && !ctx.pup && ctx.r(0, 'spear') < 0.4 + 0.6 * mature(ctx)) {
    const a = ctx.jit(0, 'spa', 0.35);
    const pts = curve(BX + a * 16, BY + 1, a * 0.4, a * 0.5, p.len[0] * 0.6, 8, 1.2);
    back += strapLeaf(ctx, pts, { color: p.shoot ?? '#8fbf5a', id: 98, wf: (t) => 6 * PROFILES.taper(t), sw: 1.3 });
  }
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({ i, c, a0: c * 0.55 + ctx.jit(i, 'a', 0.08), len: lerp(p.len[1], p.len[0], Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => v.len - u.len);
  for (const { i, c, a0, len } of items) {
    const s = sgn(a0);
    const pts = curve(BX + c * 14, BY + 1, a0, a0 * 1.2 + s * d * 0.45, len, 10, 1.3);
    back += strapLeaf(ctx, pts, { color: p.stem, id: i, wf: (t) => 5.5 - 3.5 * t, tip: 'round', sw: 1.4, dk: 0.6 });
    const m = p.leaflets ?? 8;
    for (let k = 0; k <= m; k++) {
      const id = i * 20 + k;
      if (ctx.drops(id)) { if (k % 3 === 0) ctx.fell(p.leaf); continue; }
      if (k === m) {
        const e = pts[pts.length - 1];
        back += leaf(ctx, e.x, e.y, e.a, { ...p.leaf, L: p.leaf.L * 0.8, W: p.leaf.W * 0.8, k: id });
        continue;
      }
      const t = 0.3 + (k / m) * 0.66;
      const q = at(pts, t);
      const sd = k % 2 ? 1 : -1;
      const la = droopTo(q.a + sd * (0.8 - 0.25 * t), d * 0.3);
      back += leaf(ctx, q.x, q.y, la, { ...p.leaf, L: p.leaf.L * (1.1 - 0.3 * t), W: p.leaf.W * (1.1 - 0.3 * t), k: id });
    }
  }
  return { back };
}

function bird(ctx) {
  // White bird of paradise: big paddle leaves on long stalks fanning up from the soil.
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({
      i, c,
      a0: c * (p.spread ?? 0.55) + ctx.jit(i, 'a', 0.07),
      h: lerp(p.stalk[1], p.stalk[0], Math.abs(c)) * (0.88 + 0.24 * ctx.r(i, 'h')),
    });
  }
  items.sort((u, v) => v.h - u.h); // tallest at the back
  let back = '';
  for (const { i, c, a0, h } of items) {
    if (ctx.drops(i, Math.abs(c) > 0.7 ? 0.6 : 0.15, 1 - Math.abs(c))) {
      ctx.fell({ shape: 'lance', L: 26, W: 11, color: p.strap.color });
      continue;
    }
    const s = sgn(a0);
    const stalk = curve(BX + c * 8, BY + 1, a0 * 0.6, a0 + s * d * 0.5, h, 8, 1.2);
    back += stem(ctx, stalk, p.stalkColor, 3);
    const e = stalk[stalk.length - 1];
    const len = lerp(p.len[1], p.len[0], Math.abs(c)) * (0.9 + 0.2 * ctx.r(i, 'l'));
    const pts = curve(e.x, e.y, e.a + s * 0.12, e.a + s * (0.25 + 0.35 * Math.abs(c)) + s * d * 1.3, len, 12, 1.3);
    const W = p.W * (1 - 0.15 * d);
    // Older leaves split along their veins, so the wind can pass through.
    const splits = Math.round(mature(ctx) * (1 + 4 * ctx.r(i, 'spl')) * (0.4 + 0.6 * Math.abs(c)));
    back += strapLeaf(ctx, pts, { ...p.strap, id: i, wf: (t) => W * PROFILES.paddle(t), tip: 'round', sw: 1.7, splits });
  }
  return { back };
}

const CANES = { dragon, bamboo, banana, zz, bird };
const canes = (ctx) => CANES[ctx.p.form](ctx);

/* ------------------------------------------------------------------ trees */

function rubber(ctx) {
  const { p, d } = ctx;
  // Leaves on short stalks up a stem, alternating sides and smaller toward its tip,
  // which ends in the red sheath of the next leaf.
  // Indoors it stays one stem unless it's cut back. It grows taller with age, and
  // drops its lowest leaves, leaving bare trunk below the leaves.
  const low = 0.22 + 0.28 * mature(ctx);
  const dress = (pts, n, idBase, size = 1) => {
    let s = '';
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0.9 : low + (k / (n - 1)) * (0.94 - low);
      if (ctx.drops(idBase + k, 0.5, k / n)) { ctx.fell(p.leaf); continue; }
      const q = at(pts, t);
      const sd = k % 2 ? 1 : -1;
      const pet = curve(q.x, q.y, q.a + sd * 1.1, q.a + sd * 1.0, 7, 3, 1);
      s += stem(ctx, pet, p.leaf.ribColor ?? p.leaf.color, 2);
      const e = pet[pet.length - 1];
      const sc = lerp(1.05, 0.7, t) * size;
      s += leaf(ctx, e.x, e.y, droopTo(q.a + sd * lerp(1.5, 0.75, t), d * 0.6), { ...p.leaf, L: p.leaf.L * sc, W: p.leaf.W * sc, k: idBase + k });
    }
    const e = pts[pts.length - 1];
    return `${s}<path transform="translate(${f1(e.x)} ${f1(e.y)}) rotate(${deg(e.a)}) scale(${f1(size)})" d="M-2.6 1Q-2 -9 0 -15Q2 -9 2.6 1Z" fill="${ctx.fill(p.sheath)}" stroke="${ctx.line}" stroke-width="1.2"/>`;
  };
  const h = p.h * (ctx.full < 1 ? 0.45 + 0.55 * ctx.full : 1 + 0.12 * mature(ctx));
  const trunk = curve(BX, BY + 1, -0.06, 0.1, h, 12, 1);
  return { back: stem(ctx, trunk, p.trunk, 5) + dress(trunk, ctx.n(p.count), 0) };
}

function fig(ctx) {
  const { p, d } = ctx;
  let back = '';
  const h = p.h;
  for (const ph of [0, Math.PI]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push({ x: BX + 3.4 * Math.sin(t * Math.PI * 3 + ph) * (1 - 0.3 * t), y: BY + 1 - h * t, a: 0 });
    }
    back += stem(ctx, pts, p.trunk, 3.6);
  }
  const top = { x: BX, y: BY + 1 - h };
  const nb = ctx.n(p.branches ?? 7);
  const branches = [];
  for (let b = 0; b < nb; b++) {
    const c = fan(b, nb);
    branches.push({ b, c, a0: c * 1.35 + ctx.jit(b, 'a', 0.1) });
  }
  branches.sort((u, v) => Math.abs(u.c) - Math.abs(v.c));
  for (const { b, c, a0 } of branches) {
    const s = sgn(a0);
    const len = lerp(68, 48, Math.abs(c)) * (0.9 + 0.2 * ctx.r(b, 'l'));
    const pts = curve(top.x, top.y + 4, a0 * 0.8, a0 + s * (0.55 + 0.8 * Math.abs(c)) + s * d * 0.3, len, 10, 1.2);
    back += stem(ctx, pts, p.trunk, 1.7);
    const nl = ctx.n(11);
    for (let k = 0; k < nl; k++) {
      const id = b * 20 + k;
      if (ctx.drops(id)) { ctx.fell(p.leaf); continue; }
      const q = at(pts, 0.12 + (k / nl) * 0.88);
      const sd = k % 2 ? 1 : -1;
      back += leaf(ctx, q.x, q.y, droopTo(q.a + sd * 0.7, 0.3 + d * 0.3), { ...p.leaf, k: id });
    }
  }
  const nt = ctx.n(22, 0);
  for (let k = 0; k < nt; k++) {
    const id = 400 + k;
    if (ctx.drops(id)) continue;
    const a = fan(k, nt) * 1.7;
    const rr = 5 + 11 * ctx.r(k, 'tuft');
    const [dx, dy] = dirv(a);
    back += leaf(ctx, top.x + dx * rr, top.y + 3 + dy * rr, droopTo(a, d * 0.4), { ...p.leaf, k: id });
  }
  return { back };
}

function umbrella(ctx) {
  // Schefflera: stems carry long leaf stalks, each ending in a wheel of
  // rounded leaflets that folds down like a closing umbrella as it dries.
  // With p.braid (money tree) the stems rise from a plaited trunk that tall.
  const { p, d } = ctx;
  let back = '';
  const stems = [...p.stems].sort((u, v) => v.h - u.h);
  const bases = stems.map((st) => ({ x: BX + st.x, y: BY + 1 }));
  if (p.braid) {
    for (let s = 0; s < 3; s++) {
      const ph = (s / 3) * Math.PI * 2;
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push({ x: BX + 3.8 * Math.sin(t * Math.PI * 3 + ph), y: BY + 1 - p.braid * t, a: 0 });
      }
      back += stem(ctx, pts, p.trunk, 3.6);
      stems.forEach((_, si) => { if (si % 3 === s) bases[si] = pts[pts.length - 1]; });
    }
  }
  const heads = [];
  for (const [si, st] of stems.entries()) {
    const pts = curve(bases[si].x, bases[si].y, st.a, st.a + ctx.jit(si, 'b', 0.12) + sgn(st.a) * d * 0.25, st.h, 10, 1);
    back += stem(ctx, pts, p.stem, 3.2);
    const e = pts[pts.length - 1];
    heads.push({ x: e.x, y: e.y, a: e.a, sc: 1, id: si * 60 });
    const nPet = ctx.n(st.h > 80 ? 3 : 2, 0);
    for (let k = 0; k < nPet; k++) {
      const q = at(pts, 0.38 + (k / nPet) * 0.45);
      const sd = (k + si) % 2 ? 1 : -1;
      const len = (26 - k * 3) * (0.9 + 0.2 * ctx.r(si * 5 + k, 'pl'));
      const pet = curve(q.x, q.y, q.a + sd * 1.0, q.a + sd * (0.4 + d * 0.8), len, 6, 1);
      back += stem(ctx, pet, p.petiole, 1.8);
      const pe = pet[pet.length - 1];
      heads.push({ x: pe.x, y: pe.y, a: pe.a, sc: 0.9 - k * 0.04, id: si * 60 + (k + 1) * 12 });
    }
  }
  // Lower wheels first so the upper ones overlap them.
  heads.sort((u, v) => v.y - u.y);
  const n = p.leaflets ?? 8;
  for (const h of heads) {
    const axis = h.a * 0.35;
    const spread = (p.wheel ?? 2.45) * (1 - 0.2 * d);
    const order = [...Array(n).keys()].sort((i, j) => Math.abs(fan(j, n)) - Math.abs(fan(i, n)));
    for (const j of order) {
      const id = h.id + j;
      if (ctx.drops(id)) { if (j % 3 === 0) ctx.fell(p.leaf); continue; }
      const c = fan(j, n);
      const la = droopTo(axis + c * spread, d * 0.7);
      const sc = h.sc * (1 - 0.16 * Math.abs(c));
      const [dx, dy] = dirv(la);
      back += leaf(ctx, h.x + dx * 1.5, h.y + dy * 1.5, la, { ...p.leaf, L: p.leaf.L * sc, W: p.leaf.W * sc, k: id });
    }
    back += `<circle cx="${f1(h.x)}" cy="${f1(h.y)}" r="1.8" fill="${ctx.fill(p.petiole, 0.6)}" stroke="${ctx.line}" stroke-width="1"/>`;
  }
  return { back };
}

/** A moss pole pushed into the pot for a climber: a stake wrapped in sphagnum, tied with twine. */
function mossPole(ctx, x, h) {
  const top = BY - h;
  let s = `<rect x="${f1(x - 5)}" y="${f1(top)}" width="10" height="${f1(h + 4)}" rx="4.5" fill="${ctx.fill('#7d6a46', 0.4)}" stroke="${ctx.line}" stroke-width="1.6"/>`;
  let moss = '', dry = '';
  for (let i = 0; i < h / 3.2; i++) {
    const y = top + 3 + i * 3.2 + ctx.jit(i, 'my', 1);
    const x0 = x - 4 + 8 * ctx.r(i, 'mx');
    const seg = `M${f1(x0)} ${f1(y)}q${f1(ctx.jit(i, 'mq', 2.2))} ${f1(-1.6)} ${f1(ctx.jit(i, 'mw', 2.6))} ${f1(-2.4)}`;
    if (ctx.r(i, 'mc') < 0.6) moss += seg;
    else dry += seg;
  }
  s += `<path d="${moss}" fill="none" stroke="${ctx.fill('#6f8f3e', 0.6)}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<path d="${dry}" fill="none" stroke="${ctx.fill('#a89062', 0.4)}" stroke-width="1" stroke-linecap="round"/>`;
  for (const f of [0.3, 0.68]) {
    const y = top + h * f;
    s += `<path d="M${f1(x - 5)} ${f1(y)}Q${f1(x)} ${f1(y + 2.4)} ${f1(x + 5)} ${f1(y)}" fill="none" stroke="#cbb68a" stroke-width="1.4"/>`;
  }
  return s;
}

/** Short aerial roots hugging the pole from the stem's nodes, every `step` up the stem. */
function gripRoots(ctx, pts, color, from, step) {
  let s = '';
  for (let t = from, i = 0; t < 0.9; t += step, i++) {
    const q = at(pts, t);
    const sd = i % 2 ? 1 : -1;
    s += `M${f1(q.x)} ${f1(q.y)}q${f1(sd * 4)} ${f1(1.5)} ${f1(sd * 6.5 - (q.x - BX))} ${f1(4.5)}`;
  }
  return `<path d="${s}" fill="none" stroke="${ctx.line}" stroke-width="2.8" stroke-linecap="round"/>`
    + `<path d="${s}" fill="none" stroke="${ctx.fill(color)}" stroke-width="1.4" stroke-linecap="round"/>`;
}

/** A long aerial root dropping from a node all the way to the soil. */
function hangingRoot(ctx, q, sd, color) {
  const drop = BY - q.y;
  const pts = curve(q.x, q.y, sd * 1.9, sd * 3.0, drop * 1.12, 10, 0.7);
  return stem(ctx, pts, color, 1.6);
}

function climber(ctx) {
  // A climbing aroid: one winding stem, leaves on stalks alternating up it. It
  // starts short and grows taller with age; overgrown (p.pole), it climbs a moss
  // pole, its aerial roots gripping the moss.
  const { p, d } = ctx;
  let back = '';
  const onPole = p.pole != null && ctx.full >= p.pole;
  const h = p.h * (ctx.full < 1 ? 0.5 + 0.5 * ctx.full : 1 + 0.15 * mature(ctx)) * (1 - 0.04 * d);
  const lean = onPole ? 0 : ctx.jit(0, 'lean', 0.08) + d * 0.14;
  const phase = ctx.r(0, 'phase') * Math.PI;
  const N = 16;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push({
      x: BX + Math.sin(t * Math.PI * 1.7 + phase) * 5.5 * Math.sqrt(t) + Math.sin(lean) * h * t * t,
      y: BY + 1 - h * t,
      a: 0,
    });
  }
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    q.a = Math.atan2(b.x - a.x, a.y - b.y);
  });

  if (onPole) {
    back += mossPole(ctx, BX, h + 8);
  } else {
    // Aerial roots poking out of two lower nodes.
    for (const [t, sd] of [[0.3, -1], [0.52, 1]]) {
      const q = at(pts, t);
      back += stem(ctx, curve(q.x, q.y, sd * 2.3, sd * 2.8, 11, 4, 1), p.root, 1.3);
    }
  }
  const n = ctx.n(p.count);
  const leaves = [];
  let stalks = '';
  for (let k = 0; k < n; k++) {
    if (ctx.drops(k, 0.45, k / n)) { ctx.fell(p.leaf); continue; }
    const t = n === 1 ? 0.6 : 0.16 + (k / (n - 1)) * 0.78;
    const q = at(pts, t);
    const sd = k % 2 ? 1 : -1;
    const plen = lerp(26, 15, t) * (0.9 + 0.2 * ctx.r(k, 'pl'));
    const pet = curve(q.x, q.y, q.a + sd * lerp(1.25, 0.8, t), q.a + sd * (lerp(0.7, 0.35, t) + d * 1.1), plen, 6, 1.2);
    stalks += stem(ctx, pet, p.stem, 2);
    const e = pet[pet.length - 1];
    const sc = lerp(1.05, 0.72, t);
    // The lower, older leaves are the least split.
    const slits = p.leaf.slits != null ? Math.max(0, Math.round(p.leaf.slits * (0.5 + 0.7 * t))) : undefined;
    leaves.push(leaf(ctx, e.x, e.y, droopTo(e.a + sd * 0.7, 0.34 + d * 0.45), { ...p.leaf, slits, L: p.leaf.L * sc, W: p.leaf.W * sc, k }));
  }
  back += stalks + stem(ctx, pts, p.stem, 4.2);
  if (onPole) back += gripRoots(ctx, pts, p.root, 0.2, 0.17);
  back += leaves.join('');
  const top = pts[N];
  back += leaf(ctx, top.x, top.y, top.a + 0.12, { shape: 'lance', L: 17, W: 6.5, color: p.young, rib: false, k: 99 });
  return { back };
}

function monstera(ctx) {
  // Swiss cheese plant. Young, it's a loose clump of leaves on long stalks straight
  // from the soil, each blade held out at an angle. Once it's getting big
  // (p.climbAt), it's trained up a moss pole: the stem climbs it, gripping with
  // aerial roots, one long root drops to the soil, and the leaves it puts out on the
  // way up are its biggest and most split. A couple of old leaves stay at the base.
  const { p, d } = ctx;
  const lf = p.leaf;
  // Stalks, stem, pole and roots go behind the pot; the leaves always in front of
  // it, so the low ones hang over the rim instead of disappearing behind it, and
  // stacked from the bottom up, so higher leaves always lie over lower ones.
  let back = '';
  const blades = [];
  const front = () => blades.sort((u, v) => v.y - u.y).map((b) => b.svg).join('');
  const climbing = ctx.full >= (p.climbAt ?? 1.25);
  const leafAt = (x, y, a, size, slits, k) => leaf(ctx, x, y, a, { ...lf, L: lf.L * size, W: lf.W * size, slits, k });

  // Leaves on long stalks from the soil, tallest at the back.
  // On the pole, a fuller ring of old leaves stays round its foot.
  const nBase = climbing ? Math.min(5, ctx.n(2.4)) : Math.min(ctx.n(p.count), p.cap ?? 7);
  const reach = ctx.full < 1 ? 0.45 + 0.55 * ctx.full : 1; // seedlings have short stalks
  const items = [];
  for (let i = 0; i < nBase; i++) {
    const c = fan(i, nBase) * (climbing ? 1.15 : 1) + ctx.jit(i, 'mc', 0.12);
    items.push({ i, c, len: lerp(72, 44, Math.abs(c)) * reach * (0.85 + 0.3 * ctx.r(i, 'ml')) * (climbing ? 0.5 + 0.3 * ctx.r(i, 'mb') : 1) });
  }
  items.sort((u, v) => v.len - u.len);
  for (const { i, c, len } of items) {
    if (ctx.drops(i, 0.4, 1 - Math.abs(c))) { ctx.fell(lf); continue; }
    const s = sgn(c);
    const pts = curve(BX + c * 9, BY + 1, c * 0.35, c * 1.05 + s * (0.25 + d * 0.9), len, 10, 1.5);
    back += stem(ctx, pts, p.stem, 2.8);
    const e = pts[pts.length - 1];
    // Older (outer, lower) leaves have fewer splits than the newest in the middle.
    const slits = Math.max(0, Math.round(lf.slits * (climbing ? 0.6 : 1 - 0.35 * Math.abs(c))));
    blades.push({ y: e.y, svg: leafAt(e.x, e.y, droopTo(e.a + s * (slits ? 0.55 : 0.35), 0.15 + d * 0.5), 0.92, slits, i) });
  }
  if (!climbing) {
    // The next leaf, still rolled, rising from the middle.
    if (p.scroll && ctx.full >= 0.5 && !ctx.drops(99, 1, 0.1)) {
      const a = ctx.jit(99, 'sa', 0.12);
      back += strapLeaf(ctx, curve(BX + a * 6, BY, a, a + d * 0.6, 50 * reach, 8, 1.4), { color: p.scroll, id: 99, wf: (t) => 4.4 * PROFILES.taper(t), sw: 1.3 });
    }
    return { back, front: front() };
  }

  // Up the pole.
  const h = (88 + 34 * clamp((ctx.full - (p.climbAt ?? 1.25)) / 0.75)) * (1 - 0.04 * d);
  back = mossPole(ctx, BX, h + 6) + back;
  const N = 14;
  const phase = ctx.r(0, 'phase') * Math.PI;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push({ x: BX + Math.sin(t * Math.PI * 1.5 + phase) * 4.5, y: BY + 1 - h * t, a: 0 });
  }
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    q.a = Math.atan2(b.x - a.x, a.y - b.y);
  });
  back += hangingRoot(ctx, at(pts, 0.42), ctx.r(0, 'hr') < 0.5 ? -1 : 1, p.root);
  // Leaves alternating up the pole, each on a stalk arching out from it and
  // hanging to the side: big at the bottom, smaller toward the top.
  const n = Math.min(ctx.n(p.poleLeaves ?? 4), 9);
  let stalks = '';
  for (let k = 0; k < n; k++) {
    const id = 20 + k;
    if (ctx.drops(id, 0.4, k / n)) { ctx.fell(lf); continue; }
    const t = n === 1 ? 0.7 : 0.18 + (k / (n - 1)) * 0.74;
    const q = at(pts, t);
    const sd = (k + (ctx.r(0, 'side') < 0.5 ? 0 : 1)) % 2 ? 1 : -1;
    const pet = curve(q.x, q.y, sd * 0.5, sd * (1.3 + d * 0.8), lerp(40, 22, t) * (0.9 + 0.2 * ctx.r(id, 'pl')), 8, 1.3);
    stalks += stem(ctx, pet, p.stem, 2.4);
    const e = pet[pet.length - 1];
    // The big lower leaves are the most split; the young ones near the top less so.
    const slits = Math.round(lf.slits * lerp(1.2, 0.7, t));
    const la = sd * (2.0 + 0.2 * ctx.r(id, 'la') + d * 0.7);
    blades.push({ y: e.y, svg: leafAt(e.x, e.y, la, lerp(0.92, 0.5, t), slits, id) });
  }
  // A few more leaves at random heights in the middle, on short stalks, hanging
  // forward in front of the pole.
  const nMid = Math.min(3, Math.round(ctx.full * (0.6 + ctx.r(0, 'mid'))));
  for (let j = 0; j < nMid; j++) {
    const id = 40 + j;
    if (ctx.drops(id, 0.4, 0.5)) continue;
    const t = 0.3 + 0.55 * ctx.r(id, 'mt');
    const q = at(pts, t);
    const sd = ctx.r(id, 'ms') < 0.5 ? -1 : 1;
    const pet = curve(q.x, q.y, sd * 0.2, sd * (0.55 + d * 0.8), 12 + 6 * ctx.r(id, 'ml'), 6, 1.2);
    stalks += stem(ctx, pet, p.stem, 2.2);
    const e = pet[pet.length - 1];
    const la = sd * (2.35 + 0.35 * ctx.r(id, 'ma') + d * 0.4);
    blades.push({ y: e.y, svg: leafAt(e.x, e.y, la, lerp(0.8, 0.5, t) * (0.9 + 0.2 * ctx.r(id, 'mz')), Math.round(lf.slits * lerp(1.1, 0.7, t)), id) });
  }
  back += stalks + stem(ctx, pts, p.stem, 4.6) + gripRoots(ctx, pts, p.root, 0.12, 0.15);
  const top = pts[N];
  if (p.scroll && !ctx.drops(98, 1, 0.1)) {
    back += strapLeaf(ctx, curve(top.x, top.y + 2, 0.05, -0.05, 22, 6, 1.2), { color: p.scroll, id: 98, wf: (t) => 4 * PROFILES.taper(t), sw: 1.2 });
  }
  return { back, front: front() };
}

/** An aralia leaf: a short stalk and rachis with a leaflet at the tip and pairs below it. */
function araliaLeaf(ctx, x, y, a, lf, n, id) {
  const { d } = ctx;
  const rach = curve(x, y, a, droopTo(a, 0.1 + d * 0.4), 10, 4, 1);
  let s = stem(ctx, rach, lf.stalk, 1.1);
  for (let j = 0; j < (n - 1) / 2; j++) {
    const q = at(rach, 0.5 + j * 0.25);
    const sc = 0.78 + 0.1 * j;
    for (const sd of [-1, 1]) {
      s += leaf(ctx, q.x, q.y, droopTo(q.a + sd * 0.8, d * 0.5), { ...lf, L: lf.L * sc, W: lf.W * sc, k: id + j * 2 + (sd > 0 ? 1 : 0) });
    }
  }
  const e = rach[rach.length - 1];
  return s + leaf(ctx, e.x, e.y, droopTo(e.a, d * 0.5), { ...lf, k: id + 9 });
}

function aralia(ctx) {
  // Ming aralia: three stems plaited into a short, fat, pale trunk with a swollen
  // base, under a tall, dense crown of leaves made of spiny-toothed leaflets.
  const { p, d } = ctx;
  const lf = p.leaf;
  let back = '';
  const H = p.braid;
  for (let s = 0; s < 3; s++) {
    const ph = (s / 3) * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push({ x: BX + 5.2 * (1 + 1.5 * (1 - t) ** 3) * Math.sin(t * Math.PI * 2.2 + ph), y: BY + 1 - H * t, a: 0 });
    }
    back += stem(ctx, pts, p.trunk, 8);
  }
  const top = { x: BX, y: BY + 1 - H };

  // Branches fan up out of the trunk: the middle ones tallest, so the crown is a tall oval.
  const n = ctx.n(p.count);
  const order = [...Array(n).keys()].sort((i, j) => Math.abs(fan(j, n)) - Math.abs(fan(i, n))); // outer first
  const branches = [];
  for (const i of order) {
    const c = fan(i, n) + ctx.jit(i, 'ac', 0.06);
    const s = sgn(c);
    const len = lerp(92, 56, Math.abs(c)) * (0.9 + 0.2 * ctx.r(i, 'al'));
    const pts = curve(top.x + c * 8, top.y + 2, c * 0.7, c * 1.05 + s * d * 0.5, len, 10, 1.1);
    back += stem(ctx, pts, p.stem, 1.5);
    branches.push({ i, c, pts });
  }
  // A skirt of leaves low round the top of the trunk, so the crown doesn't sit on
  // bare stems.
  const nLow = ctx.n(5, 0);
  for (let j = 0; j < nLow; j++) {
    const id = 700 + j * 10;
    if (ctx.drops(id)) { ctx.fell(lf); continue; }
    const c = fan(j, nLow) + ctx.jit(j, 'lc', 0.08);
    back += araliaLeaf(ctx, top.x + c * 9, top.y + 2 - 6 * ctx.r(j, 'ly'), c * 1.55 + ctx.jit(j, 'la', 0.15), lf, 3 + (j % 2) * 2, id);
  }
  const along = ctx.n(4, 0);
  for (const { i, c, pts } of branches) {
    for (let k = 0; k < along; k++) {
      const id = i * 60 + k * 10;
      if (ctx.drops(id)) { ctx.fell(lf); continue; }
      const q = at(pts, 0.3 + k * 0.18);
      const sd = (k + i) % 2 ? 1 : -1;
      back += araliaLeaf(ctx, q.x, q.y, q.a + sd * (0.9 + 0.3 * Math.abs(c)), lf, 3 + (k % 2) * 2, id);
    }
    const e = pts[pts.length - 1];
    if (!ctx.drops(i * 60 + 50)) back += araliaLeaf(ctx, e.x, e.y, e.a, lf, 5, i * 60 + 50);
  }

  return { back };
}

const TREES = { rubber, fig, umbrella, climber, monstera, aralia };
const tree = (ctx) => TREES[ctx.p.form](ctx);

/* ------------------------------------------------------------------ bushy */

function peperomia(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    const [lo, hi] = p.len ?? [14, 36];
    items.push({ i, c, a0: c * (p.spread ?? 1.15) + ctx.jit(i, 'a', 0.1), len: lerp(hi, lo, Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => v.len - u.len);
  let back = '';
  // Grown past its usual size it sends up thin flower spikes above the leaves (p.spikes).
  const nSp = p.spikes ? Math.round(p.spikes.n * mature(ctx)) : 0;
  const tall = (p.len ?? [14, 36])[1];
  for (let k = 0; k < nSp; k++) {
    const c = fan(k, nSp) * 0.7 + ctx.jit(k, 'sx', 0.15);
    const pts = curve(BX + c * 8, BY + 1, c * 0.35, c * 0.5 + sgn(c) * d * 1.4, tall * p.spikes.len * (0.9 + 0.2 * ctx.r(k, 'sl')), 8, 1.2);
    back += spike(ctx, pts, p.spikes.color, p.spikes.w);
  }
  let front = '';
  for (const { i, c, a0, len } of items) {
    if (ctx.drops(i)) { ctx.fell(p.leaf); continue; }
    const s = sgn(a0);
    // Creeping plants (p.creep) spread as they grow, the outer stems spilling over
    // the rim, in front of the pot.
    const spill = p.creep && Math.abs(c) > 0.45 ? mature(ctx) * Math.min(1, (Math.abs(c) - 0.45) * 2.5) : 0;
    const pts = spill > 0.3
      ? curve(BX + c * 34, BY - 1, s * 0.9, s * (2.2 + spill * 0.6) + s * d * 0.5, len * (1 + 0.8 * spill), 8, 0.8)
      : curve(BX + c * 10, BY + 1, a0 * 0.7, a0 + s * (d * 1.2 + spill * 1.9), len * (1 + 0.8 * spill), 6, 1.4);
    let g = stem(ctx, pts, p.stem, 2);
    // Leaf pairs part-way up the stem (p.nodes), smaller than the tip leaf.
    const nodes = ctx.n(p.nodes ?? 0, 0);
    for (let k = 1; k <= nodes; k++) {
      const q = at(pts, k / (nodes + 1));
      for (const ls of [-1, 1]) {
        const id = 500 + i * 10 + k * 2 + (ls > 0 ? 1 : 0);
        if (ctx.drops(id)) continue;
        g += leaf(ctx, q.x, q.y, droopTo(q.a + ls * 1.0, 0.1 + d * 0.5), { ...p.leaf, L: p.leaf.L * 0.8, W: p.leaf.W * 0.8, k: id });
      }
    }
    const e = pts[pts.length - 1];
    g += leaf(ctx, e.x, e.y, droopTo(e.a + s * 0.4, d * 0.5), { ...p.leaf, k: i });
    if (spill > 0.3) front += g;
    else back += g;
  }
  return { back, front };
}

function obtusifolia(ctx) {
  const { p, d } = ctx;
  let back = '';
  const n = ctx.n(p.count);
  const along = ctx.n(4, 0);
  const m = mature(ctx);
  // Grown up, stems stand upright, then lengthen and lean out (p.sprawl), and some
  // send up flower spikes above the leaves (p.spikes).
  const nSp = p.spikes ? Math.round(p.spikes.n * m) : 0;
  for (let k = 0; k < nSp; k++) {
    const c = fan(k, nSp) * 0.6 + ctx.jit(k, 'sx', 0.15);
    back += spike(ctx, curve(BX + c * 10, BY + 1, c * 0.3, c * 0.4 + sgn(c) * d * 1.4, 46 * p.spikes.len * (0.9 + 0.2 * ctx.r(k, 'sl')), 8, 1.2), p.spikes.color, p.spikes.w);
  }
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    const a0 = c * (0.5 + 0.4 * m * (p.sprawl ?? 0)) + ctx.jit(i, 'a', 0.08);
    const s = sgn(a0);
    const len = lerp(46, 32, Math.abs(c)) * (0.9 + 0.2 * ctx.r(i, 'l')) * (1 + 0.3 * m * (p.sprawl ?? 0));
    const pts = curve(BX + c * 12, BY + 1, a0, a0 * (1.3 + 0.6 * m * (p.sprawl ?? 0)) + s * d * 0.6, len, 8, 1.2);
    back += stem(ctx, pts, p.stem, 3.2);
    // Older stems turn woody at the base (p.woody).
    if (p.woody && m > 0.2) back += stem(ctx, sub(pts, 0, 0.12 + 0.25 * m, 4), p.woody, 3.6);
    for (let k = 0; k < along; k++) {
      const id = i * 10 + k;
      if (ctx.drops(id)) { ctx.fell(p.leaf); continue; }
      const q = at(pts, 0.32 + k * 0.2);
      const sd = (k + i) % 2 ? 1 : -1;
      back += leaf(ctx, q.x, q.y, droopTo(q.a + sd * 0.85, d * 0.45), { ...p.leaf, k: id });
    }
    const e = pts[pts.length - 1];
    if (!ctx.drops(i * 10 + 9)) back += leaf(ctx, e.x, e.y, e.a, { ...p.leaf, L: p.leaf.L * 0.8, W: p.leaf.W * 0.8, k: i * 10 + 9 });
  }
  return { back };
}

function fern(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({ i, c, a0: c * 1.3 + ctx.jit(i, 'a', 0.1), len: lerp(92, 52, Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => Math.abs(u.c) - Math.abs(v.c));
  let back = '';
  // An older plant's swollen root tubers push up out of the soil.
  const nTub = Math.round(mature(ctx) * 4);
  for (let k = 0; k < nTub; k++) {
    const x = BX + (ctx.r(k, 'tbx') - 0.5) * 70;
    back += `<ellipse cx="${f1(x)}" cy="${f1(BY - 1 + ctx.r(k, 'tby') * 2)}" rx="${f1(3.4 + ctx.r(k, 'tbr') * 1.6)}" ry="2.4" transform="rotate(${f1((ctx.r(k, 'tba') - 0.5) * 40)} ${f1(x)} ${f1(BY)})" fill="${ctx.fill('#e8dcc0')}" stroke="${ctx.line}" stroke-width="1"/>`;
  }
  const col = ctx.fill(p.leaf.color);
  for (const { i, c, a0, len } of items) {
    const s = sgn(a0);
    const pts = curve(BX + c * 10, BY + 1, a0 * 0.7, a0 * 0.7 + s * (0.7 + 1.1 * Math.abs(a0)) + s * d * 0.9, len, 16, 1.25);
    let needles = '';
    const steps = Math.floor(len / 3.2);
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const q = at(pts, t);
      for (const sd of [-1, 1]) {
        if (ctx.r(i * 400 + k * 2 + (sd > 0 ? 1 : 0), 'n') < d * 0.6) continue;
        const nl = 6.5 * (1 - 0.45 * t) * (1 - 0.3 * d);
        const [dx, dy] = dirv(q.a + sd * (0.7 + 0.4 * d));
        needles += `M${f1(q.x)} ${f1(q.y)}l${f1(dx * nl)} ${f1(dy * nl)}`;
      }
    }
    back += `<path d="${needles}" fill="none" stroke="${ctx.line}" stroke-width="3.2" stroke-linecap="round"/>`;
    back += stem(ctx, pts, p.stem, 1.4);
    back += `<path d="${needles}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>`;
    // A well-grown fern sets little red berries along its fronds.
    const nb = Math.floor(mature(ctx) * (1.5 + 3 * ctx.r(i, 'nb')));
    for (let b = 0; b < nb; b++) {
      const q = at(pts, 0.25 + 0.6 * ctx.r(i * 9 + b, 'bt'));
      const [bx, by] = side(q, (ctx.r(i * 9 + b, 'bs') - 0.5) * 7);
      back += `<circle cx="${f1(bx)}" cy="${f1(by)}" r="1.8" fill="${ctx.fill('#d8402c')}" stroke="${ctx.line}" stroke-width=".8"/>`;
    }
  }
  return { back };
}

function cactus(ctx) {
  const { p, d } = ctx;
  const n = ctx.n(p.count);
  let back = '';
  // A chain of flat segments; returns where it ends, or null if a segment fell off.
  const chain = (x, y, a, s, segs, L0, idBase, done) => {
    for (let k = 0; k < segs; k++) {
      const id = idBase + k;
      if (ctx.drops(id, 0.35, 1 - (done + k) / (done + segs))) { ctx.fell(p.leaf); return null; }
      const L = L0 * (1 - 0.08 * k);
      // The oldest segments at the base turn woody on a grown-up plant.
      const woody = done === 0 && k === 0 ? clamp(mature(ctx) * 1.4 - 0.3) : 0;
      const color = woody ? mix(p.leaf.color, '#8a7350', woody) : p.leaf.color;
      back += leaf(ctx, x, y, a, { ...p.leaf, color, L, k: id, chain: true });
      const [dx, dy] = dirv(a);
      x += dx * L * 0.9 * (1 - 0.1 * d);
      y += dy * L * 0.9 * (1 - 0.1 * d);
      a += s * (0.16 + d * 0.55) + ctx.jit(id, 'b', 0.1);
    }
    return { x, y, a };
  };
  // Fuller plants flower more.
  const bloom = (end, id) => {
    if (p.flower && ctx.r(id, 'f') < Math.min(0.95, 0.6 * ctx.full) && !ctx.drops(900 + id, 1, 0.05)) {
      back += starFlower(ctx, end.x, end.y, 10, p.flower);
    }
  };
  const order = [...Array(n).keys()].sort((a, b) => Math.abs(fan(a, n)) - Math.abs(fan(b, n)));
  for (const ch of order) {
    const c = fan(ch, n);
    const a0 = c * 1.25 + ctx.jit(ch, 'a', 0.1);
    const segs = 4 + (ctx.r(ch, 'segs') < 0.5 ? 1 : 0);
    const end = chain(BX + c * 12, BY + 1, a0 * 0.55, sgn(a0), segs, p.leaf.L, ch * 10, 0);
    if (!end) continue;
    // Grown past its usual size, a chain forks into two at its tip.
    if (ctx.r(ch, 'fork') < mature(ctx) * 1.1) {
      for (const [j, sd] of [[0, -1], [1, 1]]) {
        const more = 1 + (ctx.r(ch * 2 + j, 'fl') < mature(ctx) ? 1 : 0);
        const tip = chain(end.x, end.y, end.a + sd * 0.5, sd, more, p.leaf.L * 0.8, 200 + ch * 10 + j * 4, segs);
        if (tip) bloom(tip, 50 + ch * 2 + j);
      }
    } else bloom(end, ch);
  }
  return { back };
}

function gynura(ctx) {
  // Purple passion: upright purple stems dressed all the way up with small jagged
  // leaves, smaller toward the tips, where the young leaves are purple all over.
  // The outermost stems lean out and spill over the rim.
  const { p, d } = ctx;
  const lf = p.leaf;
  let back = '', front = '';
  const n = ctx.n(p.count);
  const order = [...Array(n).keys()].sort((a, b) => Math.abs(fan(b, n)) - Math.abs(fan(a, n))); // outer stems behind
  for (const i of order) {
    const c = fan(i, n) + ctx.jit(i, 'gc', 0.05);
    const s = sgn(c);
    const spill = Math.abs(fan(i, n)) === 1;
    const len = (spill ? 46 : lerp(76, 52, Math.abs(c))) * (0.88 + 0.24 * ctx.r(i, 'gl')) * (1 + 0.25 * mature(ctx));
    const pts = spill
      ? curve(BX + s * 32, BY - 1, s * 0.8, s * (2.0 + 0.3 * ctx.r(i, 'gb')) + s * d * 0.5, len, 14, 0.9)
      : curve(BX + c * 18, BY + 1, c * 0.55, c * 0.95 + s * d * 1.2, len, 12, 1.3);
    let g = stem(ctx, pts, p.stem, 1.8);
    const nL = ctx.n(p.perStem ?? 6, 0);
    for (let k = 0; k < nL; k++) {
      const id = i * 20 + k;
      if (ctx.drops(id)) { if (k % 2 === 0) ctx.fell(lf); continue; }
      // It turns leggy with age: the lower leaves go and the stems lengthen.
      const t = 0.2 + 0.2 * mature(ctx) + (k / nL) * (0.72 - 0.2 * mature(ctx));
      const q = at(pts, t);
      const ls = (k + i) % 2 ? 1 : -1;
      const sc = 1.12 - 0.5 * t;
      const sheen = t > 0.75 ? 0.75 : 0.05 + 0.35 * ctx.r(id, 'sh');
      g += leaf(ctx, q.x, q.y, droopTo(q.a + ls * 0.95, 0.1 + d * 0.5), { ...lf, L: lf.L * sc, W: lf.W * sc, sheen, k: id });
    }
    // The newest leaves: a tight pair at the tip, the most purple of all.
    const e = pts[pts.length - 1];
    if (!ctx.drops(i * 20 + 19, 1, 0.2)) {
      const sheen = 0.45 + 0.55 * ctx.r(i, 'young');
      for (const ls of [-1, 1]) {
        g += leaf(ctx, e.x, e.y, e.a + ls * 0.4, { ...lf, L: lf.L * 0.5, W: lf.W * 0.5, sheen, k: i * 20 + 18 + (ls > 0 ? 1 : 0) });
      }
      // Grown past its usual size, it flowers: orange tufts at the tips.
      if (p.bloom && !spill && ctx.r(i, 'bloom') < mature(ctx) * 0.9) g += tassel(ctx, e.x, e.y, e.a, p.bloom);
    }
    if (spill) front += g;
    else back += g;
  }
  return { back, front };
}

const BUSHY = { peperomia, obtusifolia, fern, cactus, gynura };
const bushy = (ctx) => BUSHY[ctx.p.form](ctx);

export const RIGS = {
  upright_leaf: uprightLeaf,
  trailing,
  sword,
  spikes: sword,
  rosette,
  arching,
  canes,
  tree,
  bushy,
  terrarium,
};

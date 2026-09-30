// The nine plant "rigs". Each takes a drawing context and returns SVG for the
// layers behind the pot rim ({back}) and hanging in front of the pot ({front}).
//
// ctx: { p (species def), d (dryness 0-1), ghost, r(i, salt), jit(i, salt, amt),
//        fill(hex, k), fillD(hex, d), line, drops(i, chance, rank), fell(o) }

import { clamp, lerp } from './color.js';
import { BX, BY, at, curve, deg, dirv, droopTo, f1, sgn, side } from './geom.js';
import { PROFILES, leaf, stem, strapLeaf } from './leaves.js';

const fan = (i, n) => (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2); // -1 .. 1
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

/* ------------------------------------------------------- upright leaves */

function uprightLeaf(ctx) {
  const { p, d } = ctx;
  const n = p.count;
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
  return { back };
}

/* ------------------------------------------------------------- trailing */

function trailing(ctx) {
  const { p, d } = ctx;
  const lf = p.leaf;
  let back = '', front = '';

  const nTop = p.top ?? 6;
  const tops = [];
  for (let i = 0; i < nTop; i++) {
    const c = fan(i, nTop);
    tops.push({ i, c, a0: c * 1.15 + ctx.jit(i, 'ta', 0.15) });
  }
  tops.sort((u, v) => Math.abs(v.c) - Math.abs(u.c));
  for (const { i, c, a0 } of tops) {
    const s = sgn(a0);
    const len = (p.topLen ?? 26) * (0.75 + 0.5 * ctx.r(i, 'tl')) * (1 - 0.3 * Math.abs(c));
    const pts = curve(BX + c * 20, BY + 1, a0 * 0.75, a0 * 1.25 + s * d * 1.3, len, 8, 1.5);
    back += stem(ctx, pts, p.stem, 1.8);
    if (ctx.drops(i)) { ctx.fell(lf); continue; }
    const tip = pts[pts.length - 1];
    back += leaf(ctx, tip.x, tip.y, droopTo(tip.a + s * 0.35, d * 0.55), { ...lf, k: i });
    if (p.pairs) {
      const q = at(pts, 0.55);
      back += leaf(ctx, q.x, q.y, droopTo(q.a - s * 0.9, d * 0.5), { ...lf, k: i + 50 });
    }
  }

  const nV = p.vines ?? 3;
  for (let v = 0; v < nV; v++) {
    const sd = v % 2 === 0 ? -1 : 1;
    const rank = Math.floor(v / 2);
    const x0 = BX + sd * (45 - rank * 13);
    const a0 = sd * (0.95 + 0.3 * ctx.r(v, 'va'));
    const a1 = sd * (3.02 + 0.1 * ctx.r(v, 'vb'));
    const len = (p.vineLen ?? 70) * (0.82 + 0.36 * ctx.r(v, 'vl')) * (1 - rank * 0.2);
    const pts = curve(x0, BY - 1, a0, a1, len, 18, 0.45);
    let g = stem(ctx, pts, p.stem, 1.6);
    const nL = p.perVine ?? 6;
    for (let k = 0; k < nL; k++) {
      const t = 0.12 + (k / nL) * 0.88;
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
      if (p.flowers && k % 2 === 1 && ctx.r(id, 'fl') < 0.75 && !ctx.drops(id, 1, 0.1)) {
        g += tubeFlower(ctx, q.x, q.y, q.a - s2 * 0.5, p.flowers);
      }
    }
    front += g;
  }
  return { back, front };
}

/* ----------------------------------------------- swords, tongues, spikes */

function sword(ctx) {
  const { p, d } = ctx;
  const n = p.count;
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
  return { back };
}

/* ------------------------------------------------------------ rosettes */

function rosetteAt(ctx, x, sc, ci) {
  const { p, d } = ctx;
  const n = Math.round(p.count * (sc < 1 ? 0.7 : 1));
  let s = '';
  for (let j = 0; j < n; j++) {
    const u = j / (n - 1); // 0 = outer, 1 = heart of the rosette
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
  const spots = [{ x: BX, s: 1 }, { x: BX - 30, s: 0.55 }, { x: BX + 30, s: 0.62 }].slice(0, ctx.p.clusters ?? 1);
  let back = '';
  for (let ci = spots.length - 1; ci >= 0; ci--) back += rosetteAt(ctx, spots[ci].x, spots[ci].s, ci);
  return { back };
}

/* -------------------------------------------------------- arching (spider) */

function arching(ctx) {
  const { p, d } = ctx;
  const n = p.count;
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
  for (let r = 0; r < (p.runners ?? 0); r++) {
    const sd = r % 2 ? 1 : -1;
    const pts = curve(BX + sd * 10, BY, sd * 0.35, sd * 2.7, 84, 14, 0.9);
    front += stem(ctx, pts, '#c9d9a0', 1.4);
    const e = pts[pts.length - 1];
    for (let k = 0; k < 3; k++) {
      const rp = curve(e.x + (k - 1) * 2, e.y + 1, Math.PI + (k - 1) * 0.35, Math.PI + (k - 1) * 0.5, 6, 3, 1);
      front += stem(ctx, rp, '#d8c9a8', 0.8);
    }
    for (let k = 0; k < 5; k++) {
      const a = (k / 4 - 0.5) * 2.2;
      const lp = curve(e.x, e.y, a, a + sgn(a) * (0.6 + d * 0.9), 12 + 4 * (1 - Math.abs(a) / 1.1), 6, 1.2);
      front += strapLeaf(ctx, lp, { ...p.strap, id: 500 + r * 10 + k, wf: (t) => 3.6 * PROFILES.strap(t), sw: 1.1 });
    }
  }
  return { back, front };
}

/* ------------------------------------------------------------------ canes */

function dragon(ctx) {
  const { p, d } = ctx;
  const canes = p.canes;
  let back = '';
  const crowns = [];
  for (const [ci, c] of canes.entries()) {
    const h = c.h * (0.92 + 0.16 * ctx.r(ci, 'h'));
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
  const m = p.crown ?? 14;
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
    back += strapLeaf(ctx, pts, { ...p.strap, id: k, wf: (t) => W * PROFILES.paddle(t), tip: 'round', sw: 1.8 });
  }
  const roll = curve(top.x, top.y + 2, 0.05, -0.1, 30, 6, 1);
  back += strapLeaf(ctx, roll, { color: '#b5d67a', id: 99, wf: (t) => 5.5 * (1 - 0.5 * t), tip: 'round', sw: 1.4 });
  return { back };
}

function zz(ctx) {
  const { p, d } = ctx;
  const n = p.count;
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({ i, c, a0: c * 0.55 + ctx.jit(i, 'a', 0.08), len: lerp(p.len[1], p.len[0], Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => v.len - u.len);
  let back = '';
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

const CANES = { dragon, bamboo, banana, zz };
const canes = (ctx) => CANES[ctx.p.form](ctx);

/* ------------------------------------------------------------------ trees */

function rubber(ctx) {
  const { p, d } = ctx;
  let back = '';
  const trunk = curve(BX, BY + 1, -0.06, 0.1, p.h, 12, 1);
  back += stem(ctx, trunk, p.trunk, 5);
  const n = p.count;
  for (let k = 0; k < n; k++) {
    const t = 0.22 + (k / (n - 1)) * 0.72;
    if (ctx.drops(k, 0.5, k / n)) { ctx.fell(p.leaf); continue; }
    const q = at(trunk, t);
    const sd = k % 2 ? 1 : -1;
    const pet = curve(q.x, q.y, q.a + sd * 1.1, q.a + sd * 1.0, 7, 3, 1);
    back += stem(ctx, pet, p.leaf.ribColor, 2);
    const e = pet[pet.length - 1];
    const sc = lerp(1.05, 0.7, t);
    back += leaf(ctx, e.x, e.y, droopTo(q.a + sd * lerp(1.5, 0.75, t), d * 0.6), { ...p.leaf, L: p.leaf.L * sc, W: p.leaf.W * sc, k });
  }
  const e = trunk[trunk.length - 1];
  back += `<path transform="translate(${f1(e.x)} ${f1(e.y)}) rotate(${deg(e.a)})" d="M-2.6 1Q-2 -9 0 -15Q2 -9 2.6 1Z" fill="${ctx.fill(p.sheath)}" stroke="${ctx.line}" stroke-width="1.2"/>`;
  return { back };
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
  const nb = p.branches ?? 7;
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
    for (let k = 0; k < 11; k++) {
      const id = b * 20 + k;
      if (ctx.drops(id)) { ctx.fell(p.leaf); continue; }
      const q = at(pts, 0.12 + (k / 11) * 0.88);
      const sd = k % 2 ? 1 : -1;
      back += leaf(ctx, q.x, q.y, droopTo(q.a + sd * 0.7, 0.3 + d * 0.3), { ...p.leaf, k: id });
    }
  }
  for (let k = 0; k < 22; k++) {
    const id = 400 + k;
    if (ctx.drops(id)) continue;
    const a = fan(k, 22) * 1.7;
    const rr = 5 + 11 * ctx.r(k, 'tuft');
    const [dx, dy] = dirv(a);
    back += leaf(ctx, top.x + dx * rr, top.y + 3 + dy * rr, droopTo(a, d * 0.4), { ...p.leaf, k: id });
  }
  return { back };
}

function umbrella(ctx) {
  // Schefflera: stems carry long leaf stalks, each ending in a wheel of
  // rounded leaflets that folds down like a closing umbrella as it dries.
  const { p, d } = ctx;
  let back = '';
  const stems = [...p.stems].sort((u, v) => v.h - u.h);
  const heads = [];
  for (const [si, st] of stems.entries()) {
    const pts = curve(BX + st.x, BY + 1, st.a, st.a + ctx.jit(si, 'b', 0.12) + sgn(st.a) * d * 0.25, st.h, 10, 1);
    back += stem(ctx, pts, p.stem, 3.2);
    const e = pts[pts.length - 1];
    heads.push({ x: e.x, y: e.y, a: e.a, sc: 1, id: si * 60 });
    const nPet = st.h > 80 ? 3 : 2;
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
    const spread = 2.45 * (1 - 0.2 * d);
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

function climber(ctx) {
  // A climbing philodendron: one winding stem, leaves on stalks alternating up it.
  const { p, d } = ctx;
  let back = '';
  const h = p.h * (1 - 0.04 * d);
  const lean = ctx.jit(0, 'lean', 0.08) + d * 0.14;
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

  // Aerial roots poking out of two lower nodes.
  for (const [t, sd] of [[0.3, -1], [0.52, 1]]) {
    const q = at(pts, t);
    back += stem(ctx, curve(q.x, q.y, sd * 2.3, sd * 2.8, 11, 4, 1), p.root, 1.3);
  }
  const n = p.count;
  const leaves = [];
  let stalks = '';
  for (let k = 0; k < n; k++) {
    if (ctx.drops(k, 0.45, k / n)) { ctx.fell(p.leaf); continue; }
    const t = 0.16 + (k / (n - 1)) * 0.78;
    const q = at(pts, t);
    const sd = k % 2 ? 1 : -1;
    const plen = lerp(26, 15, t) * (0.9 + 0.2 * ctx.r(k, 'pl'));
    const pet = curve(q.x, q.y, q.a + sd * lerp(1.25, 0.8, t), q.a + sd * (lerp(0.7, 0.35, t) + d * 1.1), plen, 6, 1.2);
    stalks += stem(ctx, pet, p.stem, 2);
    const e = pet[pet.length - 1];
    const sc = lerp(1.05, 0.72, t);
    leaves.push(leaf(ctx, e.x, e.y, droopTo(e.a + sd * 0.7, 0.34 + d * 0.45), { ...p.leaf, L: p.leaf.L * sc, W: p.leaf.W * sc, k }));
  }
  back += stalks + stem(ctx, pts, p.stem, 4.2) + leaves.join('');
  const top = pts[N];
  back += leaf(ctx, top.x, top.y, top.a + 0.12, { shape: 'lance', L: 17, W: 6.5, color: p.young, rib: false, k: 99 });
  return { back };
}

const TREES = { rubber, fig, umbrella, climber };
const tree = (ctx) => TREES[ctx.p.form](ctx);

/* ------------------------------------------------------------------ bushy */

function peperomia(ctx) {
  const { p, d } = ctx;
  const n = p.count;
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({ i, c, a0: c * 1.15 + ctx.jit(i, 'a', 0.1), len: lerp(36, 14, Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => v.len - u.len);
  let back = '';
  for (const { i, c, a0, len } of items) {
    if (ctx.drops(i)) { ctx.fell(p.leaf); continue; }
    const s = sgn(a0);
    const pts = curve(BX + c * 10, BY + 1, a0 * 0.7, a0 + s * d * 1.2, len, 6, 1.4);
    back += stem(ctx, pts, p.stem, 2);
    const e = pts[pts.length - 1];
    back += leaf(ctx, e.x, e.y, droopTo(e.a + s * 0.4, d * 0.5), { ...p.leaf, k: i });
  }
  return { back };
}

function obtusifolia(ctx) {
  const { p, d } = ctx;
  let back = '';
  const n = p.count;
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    const a0 = c * 0.5 + ctx.jit(i, 'a', 0.08);
    const s = sgn(a0);
    const len = lerp(46, 32, Math.abs(c)) * (0.9 + 0.2 * ctx.r(i, 'l'));
    const pts = curve(BX + c * 12, BY + 1, a0, a0 * 1.3 + s * d * 0.6, len, 8, 1.2);
    back += stem(ctx, pts, p.stem, 3.2);
    for (let k = 0; k < 4; k++) {
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
  const n = p.count;
  const items = [];
  for (let i = 0; i < n; i++) {
    const c = fan(i, n);
    items.push({ i, c, a0: c * 1.3 + ctx.jit(i, 'a', 0.1), len: lerp(92, 52, Math.abs(c)) * (0.85 + 0.3 * ctx.r(i, 'l')) });
  }
  items.sort((u, v) => Math.abs(u.c) - Math.abs(v.c));
  let back = '';
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
  }
  return { back };
}

function cactus(ctx) {
  const { p, d } = ctx;
  const n = p.count;
  let back = '';
  const order = [...Array(n).keys()].sort((a, b) => Math.abs(fan(a, n)) - Math.abs(fan(b, n)));
  for (const ch of order) {
    const c = fan(ch, n);
    const a0 = c * 1.25 + ctx.jit(ch, 'a', 0.1);
    const s = sgn(a0);
    let x = BX + c * 12, y = BY + 1, a = a0 * 0.55;
    const segs = 4 + (ctx.r(ch, 'segs') < 0.5 ? 1 : 0);
    let alive = true;
    for (let k = 0; k < segs; k++) {
      const id = ch * 10 + k;
      if (ctx.drops(id, 0.35, 1 - k / segs)) { ctx.fell(p.leaf); alive = false; break; }
      const L = p.leaf.L * (1 - 0.08 * k);
      back += leaf(ctx, x, y, a, { ...p.leaf, L, k: id });
      const [dx, dy] = dirv(a);
      x += dx * L * 0.9 * (1 - 0.1 * d);
      y += dy * L * 0.9 * (1 - 0.1 * d);
      a += s * (0.16 + d * 0.55) + ctx.jit(id, 'b', 0.1);
    }
    if (alive && p.flower && ctx.r(ch, 'f') < 0.6 && !ctx.drops(900 + ch, 1, 0.05)) {
      back += starFlower(ctx, x, y, 10, p.flower);
    }
  }
  return { back };
}

const BUSHY = { peperomia, obtusifolia, fern, cactus };
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
};

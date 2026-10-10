// A propagation jar: a little glass jar of water with a cutting rooting in it,
// standing in for the pot. Same 200 x 248 drawing space as pot.js, standing on
// y = 236 so arms and feet line up; the pot colour is a band round the jar.

import { clamp, shade } from './color.js';
import { curve, f1 } from './geom.js';
import { faceAt } from './pot.js';
import { stem } from './leaves.js';

/** Where the cutting goes in: the jar's mouth. */
export const MOUTH = 141;

const BODY = 'M75 150Q62 152 62 166L62 228Q62 236 70 236L130 236Q138 236 138 228L138 166Q138 152 125 150Z';
const GHOST_BODY = 'M75 150Q62 152 62 166L62 222Q67 236 75 226Q83 216 91 228Q96 236 100 228Q104 220 109 228'
  + 'Q117 238 125 226Q133 216 138 222L138 166Q138 152 125 150Z';
const NECK = 'M76 151V142H124V151';
const GLASS = '#eef6f6';
const WATER = '#bfe2ee';

/** How high the water stands: full when watered, dropping as the jar dries out. */
const waterLine = (ctx) => 170 + 40 * clamp(ctx.d);

/** Inside the jar, behind the cutting: the glass and the water. */
export function vaseBack(ctx) {
  const glass = ctx.ghost ? ctx.fill(GLASS) : GLASS;
  let s = `<path d="${ctx.ghost ? GHOST_BODY : BODY}" fill="${glass}" fill-opacity=".7"/>`
    + `<path d="${NECK}Z" fill="${glass}" fill-opacity=".7"/>`;
  if (ctx.ghost) return s;
  const wl = waterLine(ctx);
  s += `<path d="M63 ${f1(wl)}H137V228Q137 235 130 235H70Q63 235 63 228Z" fill="${WATER}" fill-opacity=".75"/>`;
  return s;
}

/**
 * The cutting's stem running down into the water and its roots, in plain drawing
 * units: none on a fresh cutting, more and longer the fuller it is (full 0..2).
 */
export function cuttingRoots(ctx, full, color) {
  // The stem runs straight down from the mouth (angles point down at PI) to a node low
  // in the water. Below the waterline it and the roots are softened, seen through the
  // water; above it, crisp.
  const node = { x: 100 + ctx.jit(0, 'node', 3), y: 206 };
  const wl = ctx.ghost ? MOUTH : waterLine(ctx);
  const drop = curve(100, MOUTH, Math.PI, Math.PI - (node.x - 100) / 60, node.y - MOUTH, 6, 1);
  let s = stem(ctx, drop, color, 3);
  if (wl < node.y) s = `<g opacity=".5">${s}</g>` + stem(ctx, curve(100, MOUTH, Math.PI, Math.PI, wl - MOUTH, 3, 1), color, 3);
  const n = Math.round(4 * full);
  const reach = 8 + 14 * Math.min(1, full / 1.4);
  let roots = '', hairs = '';
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = (t - 0.5) * 2.2 + ctx.jit(i, 'ra', 0.2); // fanning out and down
    const len = reach * (0.7 + 0.5 * ctx.r(i, 'rl'));
    const y0 = node.y - 3 + 6 * ctx.r(i, 'ry');
    const pts = curve(node.x, y0, Math.PI + a * 0.5, Math.PI + a, len, 6, 1.2);
    for (const q of pts) { q.x = clamp(q.x, 66, 134); q.y = Math.min(q.y, 231); }
    roots += `M${pts.map((q) => `${f1(q.x)} ${f1(q.y)}`).join('L')}`;
    // Older roots grow side roots.
    if (full > 1) {
      const q = pts[3];
      hairs += `M${f1(q.x)} ${f1(q.y)}l${f1(ctx.jit(i, 'hx', 4))} ${f1(2 + 2 * ctx.r(i, 'hy'))}`;
    }
  }
  const pale = ctx.fill('#f1e7cf');
  let r = '';
  if (roots) {
    r += `<path d="${roots}" fill="none" stroke="${shade(pale, -0.35)}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="${roots}" fill="none" stroke="${pale}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (hairs) r += `<path d="${hairs}" fill="none" stroke="${pale}" stroke-width="1" stroke-linecap="round"/>`;
  return s + (r && wl < node.y ? `<g opacity=".8">${r}</g>` : r);
}

/** Glass, water surface, band and face: in front of everything inside. */
export function vaseFront(ctx, color) {
  const line = ctx.line;
  const band = ctx.ghost ? ctx.fill(color) : color;
  let s = '';
  if (!ctx.ghost) {
    const wl = waterLine(ctx);
    // The water's surface, seen through the glass, and a few bubbles.
    s += `<path d="M63 ${f1(wl)}Q100 ${f1(wl + 3)} 137 ${f1(wl)}" fill="none" stroke="#8fc6db" stroke-width="1.6"/>`
      + [[78, 222, 1.6], [84, 212, 1.1], [121, 226, 1.4]].map(([x, y, r]) => (y > wl + 4
        ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".9"/>` : '')).join('');
  }
  s += `<path d="${ctx.ghost ? GHOST_BODY : BODY}" fill="none" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path d="${NECK}" fill="none" stroke="${line}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M77 145.5H123M77 148.6H123" stroke="${line}" stroke-width=".8" stroke-opacity=".45"/>`
    + `<ellipse cx="100" cy="142" rx="24" ry="2.6" fill="none" stroke="${line}" stroke-width="1.6"/>`;
  if (!ctx.ghost) {
    s += `<path d="M68 170Q66 190 67.5 208" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-opacity=".7"/>`
      + `<path d="M132 168Q134 180 133.4 192" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-opacity=".45"/>`;
  }
  // A band in the pot's colour round the jar's shoulder.
  s += `<path d="M62 158H138V165H62Z" fill="${band}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M63 160.4H137" stroke="${shade(band, 0.2)}" stroke-width="1" stroke-opacity=".8"/>`;
  // The face sits high on the glass, so the roots show beneath it.
  return s + faceAt(ctx, GLASS, -18);
}

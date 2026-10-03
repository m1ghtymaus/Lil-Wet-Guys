// The pot, the soil, the face on the pot and anything lying on the ground.
// Drawing space is a 200 x 248 viewBox; stems leave the soil at (100, 167) and the pot stands on y = 236.

import { clamp, hexToRgb, lerp, mix, shade } from './color.js';
import { f1 } from './geom.js';
import { leaf, strap } from './leaves.js';

const SOIL_WET = '#4b3021';
const SOIL_DRY = '#b8946e';

function potShades(ctx, color) {
  const c = ctx.ghost ? ctx.fill(color) : color;
  return { c, rim: shade(c, 0.07), top: shade(c, 0.12), dark: shade(c, -0.12), light: shade(c, 0.14) };
}

/** Shadow and fallen leaves: drawn first so the pot sits on top. */
export function ground(ctx, dy = 0) {
  if (ctx.ghost) return '';
  let s = `<ellipse cx="100" cy="239" rx="54" ry="5.5" fill="#000" fill-opacity=".13"/>`;
  const spots = [
    { x: 38, y: 239, a: -1.72 }, { x: 163, y: 239.5, a: 1.62 },
    { x: 52, y: 243, a: 1.5 }, { x: 150, y: 243, a: -1.52 },
  ];
  ctx.fallen.slice(0, spots.length).forEach((o, i) => {
    const { x, y, a } = spots[i];
    if (o.strap) s += strap(ctx, x - 12, y, 1.45 + (i % 2) * 0.2, 24, o.W ?? 4, o.color);
    else s += leaf(ctx, x, y, a, { ...o, L: o.L * 0.8, W: o.W * 0.8, dry: 1, variType: undefined, gloss: false });
  });
  return dy ? `<g transform="translate(0 ${dy})">${s}</g>` : s;
}

/** Rim top and soil: behind the plant. */
export function potBack(ctx, color) {
  const { top, dark } = potShades(ctx, color);
  let s = `<ellipse cx="100" cy="164" rx="53" ry="8.5" fill="${top}" stroke="${ctx.line}" stroke-width="2.2"/>`;
  s += `<ellipse cx="100" cy="165.2" rx="45.5" ry="5.8" fill="${ctx.ghost ? shade(top, -0.06) : dark}"/>`;
  s += `<ellipse cx="100" cy="166" rx="44" ry="5" fill="${soilColor(ctx)}"/>`;
  return s;
}

const soilColor = (ctx) => (ctx.ghost ? ctx.fill(SOIL_WET) : mix(SOIL_WET, SOIL_DRY, clamp(ctx.d * 1.15)));

/** Front half of the soil, drawn over the plant so stems and leaves go into the dirt. */
function soilFront(ctx, color) {
  const { top, dark } = potShades(ctx, color);
  let s = `<path d="M54.5 165.2 A45.5 5.8 0 0 0 145.5 165.2 Q100 166.8 54.5 165.2 Z" fill="${soilColor(ctx)}"/>`;
  s += `<path d="M54.5 165.2 A45.5 5.8 0 0 0 145.5 165.2" fill="none" stroke="${ctx.ghost ? shade(top, -0.06) : dark}" stroke-width="1.6"/>`;
  const crack = clamp((ctx.d - 0.45) / 0.45);
  if (crack > 0 && !ctx.ghost) {
    s += `<g fill="none" stroke="#6f5038" stroke-width="1.1" stroke-linecap="round" stroke-opacity="${f1(crack)}">`
      + '<path d="M68 167.5 l6 1.2 l5 -1 l4 0.8"/><path d="M104 168.6 l5 -1.2 l6 1"/>'
      + '<path d="M124 167 l-4 1.4 l3 1.2"/><path d="M88 168 l3 1.2"/></g>';
  }
  return s;
}

/** Pot body, rim band and face: in front of the plant. */
export function potFront(ctx, color) {
  const { c, rim, dark, light } = potShades(ctx, color);
  const line = ctx.line;
  let s = soilFront(ctx, color);
  if (ctx.ghost) {
    // Ghost tail instead of a pot bottom.
    s += `<path d="M55 176 L145 176 L139 228 Q133 240 126.5 229 Q120 219 113 230 Q106.5 240 100 230 `
      + `Q93.5 220 87 230 Q80 240 73.5 229 Q67 219 61 228 Z" fill="${c}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`;
  } else {
    s += `<path d="M55 176 L145 176 L131.5 231 Q130.5 236 125.5 236 L74.5 236 Q69.5 236 68.5 231 Z" fill="${c}"/>`;
    s += `<path d="M126 176 L145 176 L131.5 231 Q130.5 236 125.5 236 L117 236 Z" fill="${dark}" fill-opacity=".55"/>`;
    s += `<path d="M64 188 L70.5 223" stroke="${light}" stroke-width="4" stroke-linecap="round" stroke-opacity=".7"/>`;
    s += `<path d="M55 176 L145 176 L131.5 231 Q130.5 236 125.5 236 L74.5 236 Q69.5 236 68.5 231 Z" fill="none" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`;
  }
  s += `<path d="M47 164 A53 8.5 0 0 0 153 164 L153 175 A53 8.5 0 0 1 47 175 Z" fill="${rim}" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`;
  s += face(ctx, c);
  return s;
}

/** The face moved up or down by dy (the terrarium wears it higher, on its glass). */
export const faceAt = (ctx, potColor, dy) => `<g transform="translate(0 ${dy})">${face(ctx, potColor)}</g>`;

function face(ctx, potColor) {
  const d = ctx.d;
  // Black features on every pot except a black (or near-black) one, where they'd vanish.
  const blackPot = Math.max(...hexToRgb(potColor)) <= 72;
  const ink = ctx.ghost ? '#3d4263' : blackPot ? '#fff6ea' : '#2b2320';
  const ey = 203, ex = [86, 114];
  let s = '';
  if (ctx.ghost) {
    for (const x of ex) s += `<ellipse cx="${x}" cy="${ey}" rx="4.4" ry="6.2" fill="${ink}"/>`;
    s += `<ellipse cx="100" cy="217" rx="3.6" ry="4.6" fill="${ink}"/>`;
    return s;
  }
  // Eyes: plain ovals, closing from the top as the plant dries.
  const lid = clamp((d - 0.12) / 0.7) * 0.85;
  const rx = 3.6, ry = 4.8;
  for (const x of ex) {
    if (lid < 0.02) {
      s += `<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${ink}"/>`;
    } else {
      const cut = lerp(-ry, ry * 0.45, lid);
      const w = rx * Math.sqrt(1 - (cut / ry) ** 2);
      const large = cut < 0 ? 1 : 0;
      s += `<path d="M${f1(x - w)} ${f1(ey + cut)} A${rx} ${ry} 0 ${large} 0 ${f1(x + w)} ${f1(ey + cut)} Z" fill="${ink}"/>`;
      s += `<path d="M${f1(x - rx - 1.2)} ${f1(ey + cut - 0.4)} L${f1(x + rx + 1.2)} ${f1(ey + cut + 0.4)}" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`;
    }
  }
  // Worried brows once it is properly thirsty.
  const brow = clamp((d - 0.4) / 0.3);
  if (brow > 0) {
    const lift = 2.4 * brow;
    s += `<g stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-opacity="${f1(brow)}" fill="none">`
      + `<path d="M80 ${f1(194.5)} L90.5 ${f1(193 - lift)}"/><path d="M120 ${f1(194.5)} L109.5 ${f1(193 - lift)}"/></g>`;
  }
  // Mouth: smile -> flat -> frown.
  const m = lerp(1, -1, clamp(d / 0.6));
  const hw = lerp(8.5, 6.5, clamp(d));
  const my = 214 - 1.5 * Math.min(0, m);
  s += `<path d="M${f1(100 - hw)} ${f1(my)} Q100 ${f1(my + 7 * m)} ${f1(100 + hw)} ${f1(my)}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
  if (d === 0) {
    s += `<ellipse cx="76" cy="210" rx="4.6" ry="2.6" fill="#ff8a8a" fill-opacity=".45"/>`
      + `<ellipse cx="124" cy="210" rx="4.6" ry="2.6" fill="#ff8a8a" fill-opacity=".45"/>`;
  }
  const sweat = clamp((d - 0.2) / 0.3);
  if (sweat > 0) {
    s += `<path transform="translate(131 193) scale(${f1(0.5 + sweat * 0.5)})" d="M0 -7 C3.5 -2.5 4.6 1 0 4.6 C-4.6 1 -3.5 -2.5 0 -7Z" fill="#8fd3ff" stroke="${ctx.line}" stroke-width="1.3"/>`;
  }
  return s;
}

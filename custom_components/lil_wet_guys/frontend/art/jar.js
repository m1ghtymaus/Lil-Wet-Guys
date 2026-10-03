// A glass jar with a wooden lid, standing in for the pot: the moss terrarium.
// Same 200 x 248 drawing space as pot.js; the jar stands on y = 236 like a pot, so
// arms and feet line up. The pot colour becomes a ribbon tied round the neck.

import { clamp, mix, shade } from './color.js';
import { f1 } from './geom.js';
import { faceAt } from './pot.js';

const BODY = 'M66 142Q56 144 56 156L56 228Q56 236 64 236L136 236Q144 236 144 228L144 156Q144 144 134 142Z';
const GHOST_BODY = 'M66 142Q56 144 56 156L56 222Q62 236 70 226Q78 216 86 228Q93 238 100 228Q107 218 114 228'
  + 'Q122 238 130 226Q138 216 144 222L144 156Q144 144 134 142Z';
const GLASS = '#eef6ef';

/** The inside of the jar, lit up by its lights: behind the moss. */
export function jarBack(ctx) {
  return `<path d="${ctx.ghost ? GHOST_BODY : BODY}" fill="${ctx.ghost ? ctx.fill(GLASS) : GLASS}" fill-opacity=".92"/>`;
}

/** Pebbles, soil, moss and a string of lights, all inside the jar. */
export function terrarium(ctx) {
  const { p, d } = ctx;
  if (ctx.ghost) {
    // Just the shapes of the moss, like the other ghosts.
    return { back: `<path d="M60 215Q66 193 82 199Q92 183 106 194Q120 183 130 199Q142 197 140 215Z" fill="${ctx.fill(p.moss[0])}" stroke="${ctx.line}" stroke-width="2" stroke-linejoin="round"/>` };
  }
  // Soil all the way down, with a few darker crumbs.
  const soil = mix('#4b3021', '#b8946e', clamp(d * 1.15));
  let s = `<path d="M57 214Q78 211 100 213Q122 211 143 214L143 228Q143 235 136 235L64 235Q57 235 57 228Z" fill="${soil}"/>`;
  for (const [x, y, r] of [[66, 223, 1.6], [80, 230, 1.3], [95, 220, 1.4], [108, 228.6, 1.7], [122, 221.6, 1.3], [134, 229.4, 1.5], [88, 232.2, 1.1]]) {
    s += `<ellipse cx="${x}" cy="${y}" rx="${f1(r * 1.4)}" ry="${r}" fill="${shade(soil, -0.22)}"/>`;
  }

  // Moss: overlapping cushions, lowest first. They sink and brown as it dries.
  const sink = 1 - 0.25 * d;
  const mounds = [[70, 15, 17.9, 1], [130, 14, 16.5, 2], [100, 20, 22.5, 0], [84, 11, 12, 2], [116, 12, 13.5, 1]];
  for (const [i, [x, rw, h, ci]] of mounds.entries()) {
    const top = 216 - h * sink;
    const color = ctx.fill(p.moss[ci]);
    let bumps = '';
    const n = 4;
    for (let k = 0; k <= n; k++) {
      const bx = x - rw + (2 * rw * k) / n;
      const by = top + (Math.abs(k - n / 2) / (n / 2)) ** 2 * h * 0.55 * sink + ctx.jit(i * 10 + k, 'mb', 1.2);
      bumps += k ? `Q${f1(bx - rw / n)} ${f1(by - 4 * sink)} ${f1(bx)} ${f1(by)}` : `M${f1(bx)} ${f1(by)}`;
    }
    s += `<path d="${bumps}L${f1(x + rw)} 218L${f1(x - rw)} 218Z" fill="${color}" stroke="${ctx.line}" stroke-width="1.8" stroke-linejoin="round"/>`;
    // A few lighter speckles for texture.
    for (let k = 0; k < 4; k++) {
      const sx = x + ctx.jit(i * 7 + k, 'mx', rw * 0.6), sy = top + 3 + ctx.r(i * 7 + k, 'my') * h * 0.5;
      s += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="1.2" fill="${shade(color, 0.22)}"/>`;
    }
  }
  // A pebble and a tiny toadstool among the moss.
  s += `<ellipse cx="121" cy="212" rx="5" ry="3.4" fill="#b7bcc0" stroke="${ctx.line}" stroke-width="1.4"/>`
    + `<path d="M76.6 208V200.5H79.4V208Z" fill="#f4ead2" stroke="${ctx.line}" stroke-width="1.2"/>`
    + `<path d="M73 201Q73 195.4 78 195.4Q83 195.4 83 201Z" fill="${ctx.fill('#d9473f')}" stroke="${ctx.line}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<circle cx="76.4" cy="198.4" r=".9" fill="#fff"/><circle cx="79.8" cy="197.4" r=".7" fill="#fff"/>`;

  // Fairy lights: a thin wire swagged across the jar with glowing bulbs.
  const wire = 'M59 149Q80 163 100 155Q120 147 141 159';
  s += `<path d="${wire}" fill="none" stroke="#6b6458" stroke-width="1.2"/>`;
  const bulbs = [[65, 153], [78, 158], [91, 158.5], [104, 154.5], [117, 151.5], [129, 153], [138, 157.5]];
  const glow = p.lights;
  for (const [x, y] of bulbs) {
    s += `<circle cx="${x}" cy="${y}" r="9" fill="${glow}" fill-opacity=".12"/>`
      + `<circle cx="${x}" cy="${y}" r="5.5" fill="${glow}" fill-opacity=".22"/>`
      + `<circle cx="${x}" cy="${y + 0.6}" r="2.6" fill="${glow}" stroke="${shade(glow, -0.35)}" stroke-width=".8"/>`
      + `<circle cx="${x - 0.8}" cy="${y - 0.2}" r=".8" fill="#fff" fill-opacity=".85"/>`;
  }
  return { back: s };
}

/** Glass, ribbon, lid and face: in front of everything inside. */
export function jarFront(ctx, color) {
  const line = ctx.line;
  const ribbon = ctx.ghost ? ctx.fill(color) : color;
  const wood = ctx.ghost ? ctx.fill(ctx.p.lid) : ctx.p.lid;
  let s = `<path d="${ctx.ghost ? GHOST_BODY : BODY}" fill="none" stroke="${line}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (!ctx.ghost) {
    // Reflections on the glass.
    s += `<path d="M64 163Q62 182 63 200" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-opacity=".75"/>`
      + `<path d="M64.6 208Q64.6 214 65.2 218" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-opacity=".6"/>`
      + `<path d="M137 160Q139 172 138.4 186" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-opacity=".45"/>`;
  }
  // Ribbon round the neck, tied in a bow on one side.
  // Ribbon and lid, drawn for a neck at y = 128 and moved down to this jar's neck (y = 142).
  const neck = (svg) => `<g transform="translate(0 14)">${svg}</g>`;
  s += neck(`<path d="M65 121H135V128.5Q100 131 65 128.5Z" fill="${ribbon}" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>`
    + `<path d="M120 125Q112 117 111 124Q112 131 120 125Q128 117 129 124Q128 131 120 125Z" fill="${shade(ribbon, 0.08)}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M119 126L116 136M121 126L124.5 135.5" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`
    + `<path d="M119 126L116 136M121 126L124.5 135.5" stroke="${ribbon}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<circle cx="120" cy="125" r="2" fill="${shade(ribbon, -0.12)}" stroke="${line}" stroke-width="1.2"/>`
    // Wooden lid with a little knob.
    + `<rect x="92" y="96" width="16" height="9" rx="3" fill="${shade(wood, 0.08)}" stroke="${line}" stroke-width="1.8"/>`
    + `<rect x="61" y="103" width="78" height="18" rx="5" fill="${wood}" stroke="${line}" stroke-width="2.2"/>`
    + `<path d="M64 107.5H136" stroke="${shade(wood, 0.2)}" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M72 113Q84 111 96 113.5M104 115Q118 113 129 115.5M78 117.6Q86 116.6 92 117.8" fill="none" stroke="${shade(wood, -0.2)}" stroke-width="1.2" stroke-linecap="round"/>`);
  // The face sits on the glass, up above the moss where it can be seen.
  s += faceAt(ctx, GLASS, -34);
  return s;
}

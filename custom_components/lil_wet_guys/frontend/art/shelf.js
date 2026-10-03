// The card's "bookshelf" background: a cartoon wooden case drawn behind the plant
// tiles, with a plank under every row and a few small surprises tucked into the free
// spots. The card measures where things stand (in pixels); props are drawn in plant
// units (a pot is about 108 wide) and scaled to match the plants.

import { OUTLINE, luminance, rgbToHex, shade } from './color.js';
import { f1 } from './geom.js';
import { SHAPES } from './leaves.js';

/** Where a plant's feet meet the shelf, as a fraction of its drawing's height. */
export const FLOOR = 240 / 248;

const LINE = OUTLINE;
// Walnut: a deep chocolate back panel, warmer frame and shelves.
const WALNUT = {
  back: '#4e3326', seam: '#3d281d', grain: '#644232',
  frame: '#7b5137', light: '#9a6b4b', dark: '#5e3c29',
  top: '#a5764f', front: '#86593b', frontDark: '#6a4530',
};

/** The bookshelf's wood choices, by the colour of their frame. */
export const WOODS = {
  walnut: WALNUT.frame, oak: '#a8763f', maple: '#cfa36a', cherry: '#93472c',
  mahogany: '#6b2a1f', ebony: '#3d322d', whitewash: '#d8cdbd',
};

/**
 * Every shade the case is drawn in, for a wood name, a #rrggbb colour or [r, g, b].
 * Walnut is hand-picked; anything else is shaded from its frame colour the same way.
 */
export function woodPalette(wood = 'walnut') {
  if (!wood || wood === 'walnut') return WALNUT;
  const frame = Array.isArray(wood) ? rgbToHex(wood) : WOODS[wood] ?? (/^#[0-9a-f]{6}$/i.test(wood) ? wood : WALNUT.frame);
  const at = (l) => shade(frame, l);
  return {
    back: at(-0.12), seam: at(-0.17), grain: at(-0.06),
    frame, light: at(0.1), dark: at(-0.08),
    top: at(0.13), front: at(0.03), frontDark: at(-0.05),
  };
}

// Thread, web and slime colour: white on dark wood, a dark brown on pale wood.
let THREAD = '#fff';
const BOOKS = ['#c4504a', '#4f7fb8', '#7fa650', '#8a6aa8', '#e8b64a', '#4aa6b8', '#d9773a', '#6b8f6e', '#b8546f'];

/** A small seeded random number generator (mulberry32), so a layout can be redrawn the same way. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffled = (list, rand) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Put a prop drawn in plant units at (x, y) pixels. */
const place = (svg, x, y, s, { flip = 1, rot = 0 } = {}) =>
  `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * flip * 100) / 100} ${f1(s * 100) / 100})${rot ? ` rotate(${f1(rot)})` : ''}">${svg}</g>`;

/** A stroke with an outline: a thick dark line under a thinner coloured one. */
const inked = (d, color, w) => `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${f1(w + 2.4)}" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** A soft glow: rings of the colour fading outwards. */
const halo = (x, y, r, color) => [1, 0.7, 0.45].map((k, i) =>
  `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * k)}" fill="${color}" fill-opacity="${[0.1, 0.14, 0.2][i]}"/>`).join('');

const star = (x, y, r, color) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${f1(x + rr * Math.cos(a))} ${f1(y + rr * Math.sin(a))}`;
  }
  return `<path d="${d}Z" fill="${color}" stroke="${LINE}" stroke-width=".7" stroke-linejoin="round"/>`;
};

const sparkle = (x, y, r) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="#ffe27a" stroke="${LINE}" stroke-width=".6"/>`;

/* ----------------------------------------------------------------- props */
// Each is drawn standing on y = 0 (or hanging from it), facing right.

function books(rand, pile = rand() < 0.3) {
  const cols = shuffled(BOOKS, rand);
  let s = '', width = 0;
  if (pile) {
    // A little pile lying down.
    let y = 0;
    const n = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const bw = 28 + rand() * 10, bh = 6.5 + rand() * 2.5, x = -bw / 2 + (rand() - 0.5) * 5;
      s += `<rect x="${f1(x)}" y="${f1(y - bh)}" width="${f1(bw)}" height="${f1(bh)}" rx="1.4" fill="${cols[i]}" stroke="${LINE}" stroke-width="1.6"/>`
        + `<rect x="${f1(x + bw - 5)}" y="${f1(y - bh + 1.6)}" width="3.6" height="${f1(bh - 3.2)}" fill="#f4efe2"/>`;
      y -= bh;
      width = Math.max(width, bw + 5);
    }
    return { svg: s, width };
  }
  const n = 2 + Math.floor(rand() * 4);
  let x = 0;
  for (let i = 0; i < n; i++) {
    const bw = 8.5 + rand() * 6, bh = 30 + rand() * 20, c = cols[i];
    const lean = i === n - 1 && n > 2 && rand() < 0.5 ? 12 + rand() * 10 : 0;
    if (lean) x += bh * Math.sin((lean * Math.PI) / 180); // its top rests on the previous book
    const light = shade(c, 0.35);
    const book = `<rect x="${f1(x)}" y="${f1(-bh)}" width="${f1(bw)}" height="${f1(bh)}" rx="1.4" fill="${c}" stroke="${LINE}" stroke-width="1.6"/>`
      + `<path d="M${f1(x + 1.6)} ${f1(-bh + 5)}h${f1(bw - 3.2)}M${f1(x + 1.6)} ${f1(-bh + 8)}h${f1(bw - 3.2)}M${f1(x + 1.6)} -5h${f1(bw - 3.2)}" stroke="${light}" stroke-width="1.2"/>`
      + (rand() < 0.15 ? star(x + bw / 2, -bh / 2, Math.min(3.6, bw * 0.32), '#f6d36b') : ''); // a spellbook
    s += lean ? `<g transform="rotate(${f1(-lean)} ${f1(x)} 0)">${book}</g>` : book;
    x += bw;
  }
  width = x;
  return { svg: `<g transform="translate(${f1(-width / 2)} 0)">${s}</g>`, width };
}

function snail(shrooms = false) {
  let spiral = '';
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 3.2;
    const r = 1 + t * 0.62;
    spiral += `${i ? 'L' : 'M'}${f1(-1 + r * Math.cos(t))} ${f1(-12 + r * Math.sin(t))}`;
  }
  return `<path d="M-42 -.6H-13" stroke="${THREAD}" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M-14 0Q-15 -4 -10 -4.5L8 -4.5Q10 -5 10.5 -9Q11 -13 14.5 -12.5Q17.5 -12 17 -8Q16.5 -3 13 -1Q11 0 8 0Z" fill="#e8d3a6" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M13 -12L12 -18M15.5 -12L17 -17.5" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<circle cx="12" cy="-18.4" r="1.5" fill="${LINE}"/><circle cx="17.2" cy="-18" r="1.5" fill="${LINE}"/>`
    + `<path d="M14.3 -8.4Q15.5 -7.2 16.5 -8.6" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`
    + `<circle cx="-1" cy="-12" r="9" fill="#c97f4c" stroke="${LINE}" stroke-width="1.6"/>`
    + `<path d="${spiral}" fill="none" stroke="${shade('#c97f4c', -0.35)}" stroke-width="1.3" stroke-linecap="round"/>`
    + (shrooms ? shellShrooms() : '');
}

/** Little toadstools growing out of the snail's shell, following its curve. */
function shellShrooms() {
  let s = '';
  for (const [deg, h, r] of [[-150, 2.6, 3.2], [-114, 4, 4.3], [-80, 2.8, 3.4]]) {
    const a = (deg * Math.PI) / 180;
    const x = -1 + 8.4 * Math.cos(a), y = -12 + 8.4 * Math.sin(a);
    s += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${deg + 90})">`
      + `<path d="M-1.1 1V${f1(-h)}H1.1V1Z" fill="#f4ead2" stroke="${LINE}" stroke-width="1"/>`
      + `<path d="M${f1(-r)} ${f1(-h + 0.5)}Q${f1(-r)} ${f1(-h - r * 1.15)} 0 ${f1(-h - r * 1.15)}Q${f1(r)} ${f1(-h - r * 1.15)} ${f1(r)} ${f1(-h + 0.5)}Z" fill="#d9473f" stroke="${LINE}" stroke-width="1.1" stroke-linejoin="round"/>`
      + `<circle cx="${f1(-r * 0.35)}" cy="${f1(-h - r * 0.6)}" r="${f1(r * 0.16)}" fill="#fff"/></g>`;
  }
  return s;
}

function mushrooms(rand) {
  const glow = rand() < 0.25; // now and then they glow
  const red = !glow && rand() < 0.6;
  const cap = glow ? '#5fe0d0' : red ? '#d9473f' : '#b06f3f';
  const all = [[-6, 12, 8], [5, 8, 6], [12, 4.5, 4.4]];
  let s = glow ? halo(2, -12, 20, '#5fe0d0') : '';
  for (const [x, h, r] of all.slice(0, rand() < 0.5 ? 3 : 2)) {
    s += `<path d="M${f1(x - 1.9)} 0L${f1(x - 1.4)} ${f1(-h)}L${f1(x + 1.4)} ${f1(-h)}L${f1(x + 1.9)} 0Z" fill="#f4ead2" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
      + `<path d="M${f1(x - r)} ${f1(-h + 0.6)}Q${f1(x - r)} ${f1(-h - r * 1.15)} ${f1(x)} ${f1(-h - r * 1.15)}Q${f1(x + r)} ${f1(-h - r * 1.15)} ${f1(x + r)} ${f1(-h + 0.6)}Z" fill="${cap}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`;
    if (red || glow) {
      const dot = glow ? '#e6fffb' : '#fff';
      s += `<circle cx="${f1(x - r * 0.4)}" cy="${f1(-h - r * 0.45)}" r="${f1(r * 0.14)}" fill="${dot}"/>`
        + `<circle cx="${f1(x + r * 0.35)}" cy="${f1(-h - r * 0.7)}" r="${f1(r * 0.11)}" fill="${dot}"/>`;
    }
  }
  return s;
}

function teacup() {
  return `<ellipse cx="0" cy="-1.6" rx="11" ry="2.6" fill="#f4f1ea" stroke="${LINE}" stroke-width="1.5"/>`
    + `<path d="M8 -11.5Q13 -11.5 12.2 -7.6Q11.4 -4.6 7.4 -5.6" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M-7 -3.4L-8 -13L8 -13L7 -3.4Q0 -1.6 -7 -3.4Z" fill="#f4f1ea" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M-7.6 -9H7.6" stroke="#e58fa8" stroke-width="2"/>`
    + `<ellipse cx="0" cy="-13" rx="8" ry="1.6" fill="#a8673e" stroke="${LINE}" stroke-width="1.2"/>`
    + `<path d="M-2 -16q-2 -3 0 -6q2 -3 0 -6M3 -16q-2 -3 0 -5.5" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.3" stroke-linecap="round"/>`;
}

function frog() {
  const g = '#7cc05a', d = '#5d9e40';
  return `<ellipse cx="-7" cy="-2.4" rx="4.2" ry="2.6" fill="${d}" stroke="${LINE}" stroke-width="1.4"/>`
    + `<ellipse cx="7" cy="-2.4" rx="4.2" ry="2.6" fill="${d}" stroke="${LINE}" stroke-width="1.4"/>`
    + `<ellipse cx="0" cy="-6.5" rx="9" ry="6.5" fill="${g}" stroke="${LINE}" stroke-width="1.5"/>`
    + `<ellipse cx="0" cy="-4.4" rx="5" ry="3.4" fill="#d8eeb8"/>`
    + `<circle cx="-4.2" cy="-12.4" r="3.5" fill="${g}" stroke="${LINE}" stroke-width="1.4"/><circle cx="4.2" cy="-12.4" r="3.5" fill="${g}" stroke="${LINE}" stroke-width="1.4"/>`
    + `<circle cx="-4.2" cy="-12.6" r="2.1" fill="#fff"/><circle cx="4.2" cy="-12.6" r="2.1" fill="#fff"/>`
    + `<circle cx="-3.7" cy="-12.6" r="1.1" fill="${LINE}"/><circle cx="4.7" cy="-12.6" r="1.1" fill="${LINE}"/>`
    + `<path d="M-4 -8.4Q0 -5.6 4 -8.4" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<ellipse cx="-3.4" cy="-.8" rx="2.3" ry="1.2" fill="${d}" stroke="${LINE}" stroke-width="1.1"/><ellipse cx="3.4" cy="-.8" rx="2.3" ry="1.2" fill="${d}" stroke="${LINE}" stroke-width="1.1"/>`;
}

function fairyDoor() {
  return `<path d="M-9 0V-14A9 9 0 0 1 9 -14V0Z" fill="#a8673e" stroke="${LINE}" stroke-width="1.7"/>`
    + `<path d="M-3 -1V-21.5M3 -1V-21.5" stroke="${shade('#a8673e', -0.25)}" stroke-width="1.1"/>`
    + `<circle cx="0" cy="-15" r="2.6" fill="#ffe7a3" stroke="${LINE}" stroke-width="1.1"/>`
    + `<circle cx="5.4" cy="-7.4" r="1.2" fill="#f1c24b" stroke="${LINE}" stroke-width=".8"/>`
    + `<path d="M-11 0V-14A11 11 0 0 1 11 -14V0" fill="none" stroke="#7a7068" stroke-width="2.4"/>`
    + `<g transform="translate(15 0)">${mushrooms(() => 0.9).replace(/#b06f3f/g, '#c9694a')}</g>`;
}

function spider(len) {
  let legs = '';
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = -0.7 + k * 0.45;
      legs += `M0 ${f1(len)}q${f1(sd * 3.4)} ${f1(-2 + a * 3)} ${f1(sd * 5.2)} ${f1(a * 5 + 1.2)}`;
    }
  }
  return `<path d="M0 0V${f1(len)}" stroke="${THREAD}" stroke-opacity=".6" stroke-width=".8"/>`
    + `<path d="${legs}" fill="none" stroke="${LINE}" stroke-width="1.1" stroke-linecap="round"/>`
    + `<circle cx="0" cy="${f1(len + 0.4)}" r="3.6" fill="#3b3436" stroke="${LINE}" stroke-width="1"/>`
    + `<circle cx="0" cy="${f1(len + 4.4)}" r="2.3" fill="#3b3436" stroke="${LINE}" stroke-width="1"/>`
    + `<circle cx="-.9" cy="${f1(len + 4.8)}" r=".55" fill="#fff"/><circle cx=".9" cy="${f1(len + 4.8)}" r=".55" fill="#fff"/>`;
}

function ladybug() {
  return `<circle cx="0" cy="-5.6" r="2.6" fill="${LINE}"/>`
    + `<circle cx="0" cy="0" r="4.6" fill="#d8352e" stroke="${LINE}" stroke-width="1.3"/>`
    + `<path d="M0 -4.6V4.6" stroke="${LINE}" stroke-width="1"/>`
    + `<circle cx="-2" cy="-1.4" r=".95" fill="${LINE}"/><circle cx="2.1" cy="-.8" r=".95" fill="${LINE}"/>`
    + `<circle cx="-1.8" cy="2.2" r=".85" fill="${LINE}"/><circle cx="2" cy="2.4" r=".85" fill="${LINE}"/>`;
}

function butterfly(rand) {
  const [a, b] = rand() < 0.5 ? ['#f2a03d', '#e8743a'] : ['#7fb8e8', '#5b8fd6'];
  return `<path d="M0 -1C-4 -10 -14 -11 -13 -4C-12 1 -6 1 0 -1Z" fill="${a}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M0 -1C4 -10 14 -11 13 -4C12 1 6 1 0 -1Z" fill="${a}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M0 0C-3 4 -9 8 -9.5 4C-10 1 -5 0 0 0Z" fill="${b}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M0 0C3 4 9 8 9.5 4C10 1 5 0 0 0Z" fill="${b}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<circle cx="-8.5" cy="-5" r="1.3" fill="#fff" fill-opacity=".8"/><circle cx="8.5" cy="-5" r="1.3" fill="#fff" fill-opacity=".8"/>`
    + `<ellipse cx="0" cy="0" rx="1.3" ry="5" fill="${LINE}"/>`
    + `<path d="M-.4 -4.6Q-2 -8 -3.4 -8.6M.4 -4.6Q2 -8 3.4 -8.6" fill="none" stroke="${LINE}" stroke-width=".8" stroke-linecap="round"/>`;
}

/* ------------------------------------------------------- magical props */

const POTIONS = ['#e05ad0', '#3fd6c6', '#f2c94c', '#9b6bff', '#ff7a59'];

function potions(rand) {
  const cols = shuffled(POTIONS, rand);
  const glass = '#e9f5f7';
  const bottles = [
    (x, c) => halo(x, -8, 15, c) // round flask
      + `<path d="M${x - 2.2} -13V-18H${x + 2.2}V-13" fill="${glass}" stroke="${LINE}" stroke-width="1.4"/>`
      + `<circle cx="${x}" cy="-7.5" r="7.2" fill="${glass}" stroke="${LINE}" stroke-width="1.5"/>`
      + `<path d="M${x - 6.8} -9A7.2 7.2 0 1 0 ${x + 6.8} -9Z" fill="${c}"/>`
      + `<circle cx="${x - 2}" cy="-5" r="1.1" fill="#fff" fill-opacity=".75"/><circle cx="${x + 1.8}" cy="-3" r=".8" fill="#fff" fill-opacity=".75"/>`
      + `<path d="M${x - 4.6} -10Q${x - 4.4} -12.6 ${x - 2} -13.4" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`
      + `<rect x="${x - 2.6}" y="-21.4" width="5.2" height="3.6" rx="1" fill="#b98a5a" stroke="${LINE}" stroke-width="1.2"/>`,
    (x, c) => halo(x, -9, 14, c) // tall bottle
      + `<path d="M${x - 5} -1.5V-13Q${x - 5} -16 ${x - 2} -17V-21H${x + 2}V-17Q${x + 5} -16 ${x + 5} -13V-1.5Q${x + 5} 0 ${x + 3.5} 0H${x - 3.5}Q${x - 5} 0 ${x - 5} -1.5Z" fill="${glass}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<path d="M${x - 4.3} -9H${x + 4.3}V-1.6Q${x + 4.3} -.7 ${x + 3.3} -.7H${x - 3.3}Q${x - 4.3} -.7 ${x - 4.3} -1.6Z" fill="${c}"/>`
      + `<circle cx="${x + 1.5}" cy="-4" r="1" fill="#fff" fill-opacity=".75"/>`
      + `<path d="M${x - 3} -14V-11" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`
      + `<rect x="${x - 2.4}" y="-24" width="4.8" height="3.4" rx="1" fill="#b98a5a" stroke="${LINE}" stroke-width="1.2"/>`,
    (x, c) => halo(x, -6, 10, c) // little vial
      + `<rect x="${x - 2.6}" y="-14" width="5.2" height="14" rx="2.6" fill="${glass}" stroke="${LINE}" stroke-width="1.4"/>`
      + `<rect x="${x - 1.9}" y="-7.5" width="3.8" height="6.8" rx="1.9" fill="${c}"/>`
      + `<rect x="${x - 2.2}" y="-16.6" width="4.4" height="3" rx=".9" fill="#b98a5a" stroke="${LINE}" stroke-width="1.1"/>`,
  ];
  const n = 2 + (rand() < 0.5 ? 1 : 0);
  const order = shuffled([0, 1, 2], rand).slice(0, n);
  const xs = [-11, 2, 13];
  return order.map((b, i) => bottles[b](xs[i] + (n === 2 ? 5 : 0), cols[i])).join('');
}

function crystals(rand) {
  const tips = [[-7, 18, -0.28, 5], [0, 26, 0.02, 6], [7, 16, 0.32, 4.6], [-12, 10, -0.6, 3.6], [11, 10, 0.62, 3.4]];
  let s = halo(0, -14, 24, '#c39bff');
  for (const [x, h, a, wd] of tips.slice(0, 3 + Math.floor(rand() * 3))) {
    const dx = Math.sin(a) * h, dy = -Math.cos(a) * h;
    const px = -Math.cos(a) * wd, py = -Math.sin(a) * wd;
    const bx = x, by = -2;
    const shaft = 0.72;
    const pts = [[bx + px, by + py], [bx + px + dx * shaft, by + py + dy * shaft], [bx + dx, by + dy],
      [bx - px + dx * shaft, by - py + dy * shaft], [bx - px, by - py]];
    s += `<path d="M${pts.map(([u, v]) => `${f1(u)} ${f1(v)}`).join('L')}Z" fill="#a77be0" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
      + `<path d="M${f1(bx)} ${f1(by)}L${f1(bx + dx * shaft)} ${f1(by + dy * shaft)}L${f1(bx + dx)} ${f1(by + dy)}L${f1(bx - px + dx * shaft)} ${f1(by - py + dy * shaft)}L${f1(bx - px)} ${f1(by - py)}Z" fill="#cdb0f6"/>`;
  }
  s += `<path d="M-15 0Q-14 -5 -8 -4Q-2 -7 4 -4Q11 -6 15 0Z" fill="#8c8a94" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`;
  return s + sparkle(-14, -22, 2.4) + sparkle(12, -27, 2);
}

function moonMobile(len) {
  const moon = '#f6d76b';
  const hang = (x, l) => `<path d="M${x} 0V${f1(l)}" stroke="${THREAD}" stroke-opacity=".55" stroke-width=".8"/>`;
  const y = len;
  return hang(0, y - 9) + hang(-11, y - 14) + hang(10, y - 6)
    + `<path d="M-12 0H11" stroke="#c9a46b" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M3 ${f1(y - 9)}A9 9 0 1 0 3 ${f1(y + 9)}A12 12 0 0 1 3 ${f1(y - 9)}Z" fill="${moon}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M-4.4 ${f1(y - 1.4)}q1.4 1.2 2.8 0" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`
    + `<path d="M-3.4 ${f1(y + 3)}q1.4 1 2.6 -.2" fill="none" stroke="${LINE}" stroke-width=".9" stroke-linecap="round"/>`
    + `<ellipse cx="-2.6" cy="${f1(y + 1.2)}" rx="1.2" ry=".7" fill="#ff9a8a" fill-opacity=".55"/>`
    + star(-11, y - 11, 4.4, moon) + star(10, y - 3, 3.6, moon);
}

/* --------------------------------------- cottage and goblin-core props */

function mushroomHouse() {
  // A toadstool cottage with a lit window.
  return halo(5, -15, 12, '#ffd56a')
    + `<path d="M-10 0Q-11.4 -12 -8 -24H8Q11.4 -12 10 0Z" fill="#f4ead2" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M-3.8 0V-7.4A3.8 3.8 0 0 1 3.8 -7.4V0Z" fill="#a8673e" stroke="${LINE}" stroke-width="1.3"/>`
    + `<circle cx="2" cy="-3.6" r=".8" fill="#f1c24b"/>`
    + `<circle cx="5" cy="-15" r="2.8" fill="#ffe7a3" stroke="${LINE}" stroke-width="1.2"/><path d="M5 -17.8V-12.2M2.2 -15H7.8" stroke="${LINE}" stroke-width=".8"/>`
    + `<circle cx="-4.6" cy="-17" r="2" fill="#ffe7a3" stroke="${LINE}" stroke-width="1.1"/>`
    + `<path d="M-17 -21.6Q-16 -38 0 -40Q16 -38 17 -21.6Q0 -26 -17 -21.6Z" fill="#d9473f" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<circle cx="-8" cy="-31" r="2.2" fill="#fff"/><circle cx="3" cy="-35" r="2.6" fill="#fff"/><circle cx="10" cy="-28" r="1.8" fill="#fff"/><circle cx="-12" cy="-25" r="1.3" fill="#fff"/>`
    + `<path d="M-13 0q1 -4 2 0M12 0q1.2 -5 2.4 0" fill="none" stroke="#7fbf63" stroke-width="1.4" stroke-linecap="round"/>`;
}

function fairyFrog() {
  // A frog with fairy wings.
  const wing = '#dccdf7';
  const pair = (sd) => `<ellipse cx="${sd * 10}" cy="-15" rx="8.4" ry="5" transform="rotate(${sd * -38} ${sd * 10} -15)" fill="${wing}" fill-opacity=".92" stroke="${LINE}" stroke-width="1.3"/>`
    + `<ellipse cx="${sd * 9}" cy="-7" rx="5.6" ry="3.4" transform="rotate(${sd * 22} ${sd * 9} -7)" fill="${wing}" fill-opacity=".92" stroke="${LINE}" stroke-width="1.3"/>`
    + `<ellipse cx="${sd * 10.6}" cy="-16.4" rx="3.2" ry="1.3" transform="rotate(${sd * -38} ${sd * 10.6} -16.4)" fill="#fff" fill-opacity=".8"/>`;
  return pair(-1) + pair(1) + frog() + sparkle(13, -22, 2) + sparkle(-14, -24, 1.5);
}

function candle() {
  return halo(0, -25, 17, '#ffd56a')
    + `<circle cx="10.6" cy="-3.6" r="2.8" fill="none" stroke="${LINE}" stroke-width="2.6"/><circle cx="10.6" cy="-3.6" r="2.8" fill="none" stroke="#d6a95a" stroke-width="1.2"/>`
    + `<ellipse cx="0" cy="-1.6" rx="9.4" ry="2.6" fill="#d6a95a" stroke="${LINE}" stroke-width="1.4"/>`
    + `<path d="M-4 -3V-18.4Q-4 -20 -2.6 -20H2.6Q4 -20 4 -18.4V-3Z" fill="#f4ecd8" stroke="${LINE}" stroke-width="1.4"/>`
    + `<path d="M-4 -17Q-3 -13 -2 -16.4Q-1.2 -11 .2 -15.6M2 -17.4Q3 -14 4 -16" fill="none" stroke="#e2d6bb" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M0 -20V-22.4" stroke="${LINE}" stroke-width="1"/>`
    + `<path d="M0 -31Q3.6 -25.6 0 -22.6Q-3.6 -25.6 0 -31Z" fill="#ffc94a" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="M0 -27.6Q1.6 -25 0 -23.6Q-1.6 -25 0 -27.6Z" fill="#fff4c2"/>`;
}

function charms(len) {
  // A twig hung on two threads, with a crystal and a bundle of herbs dangling from it.
  const thread = (x, a, b) => `<path d="M${x} ${f1(a)}V${f1(b)}" stroke="${THREAD}" stroke-opacity=".55" stroke-width=".8"/>`;
  const y = len;
  return thread(-13, 0, y) + thread(13, 0, y) + thread(-7, y, y + 7) + thread(7, y, y + 4)
    + inked(`M-17 ${f1(y)}Q0 ${f1(y - 2)} 17 ${f1(y + 0.6)}M9 ${f1(y - 0.6)}l4 -3`, '#8a6a4a', 2.2)
    + `<path d="M-7 ${f1(y + 7)}L-10.4 ${f1(y + 12)}L-7 ${f1(y + 21)}L-3.6 ${f1(y + 12)}Z" fill="#a77be0" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M-7 ${f1(y + 7)}L-7 ${f1(y + 21)}L-3.6 ${f1(y + 12)}Z" fill="#cdb0f6"/>`
    + `<path d="M4.6 ${f1(y + 4)}H9.4L12.6 ${f1(y + 19)}Q7 ${f1(y + 23)} 1.4 ${f1(y + 19)}Z" fill="#7fa650" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M5.6 ${f1(y + 9)}L4 ${f1(y + 18)}M7 ${f1(y + 9)}V${f1(y + 20)}M8.4 ${f1(y + 9)}L10.2 ${f1(y + 18)}" stroke="#5d8a3c" stroke-width="1" stroke-linecap="round"/>`
    + `<path d="M4.4 ${f1(y + 6.4)}H9.6M4 ${f1(y + 8.4)}H10" stroke="#c9a46b" stroke-width="1.3" stroke-linecap="round"/>`
    + sparkle(-12, y + 17, 1.6);
}

function mushroomFolk() {
  // Two little mushroom people leaning together: a tall amanita and a short brown
  // one, drawn like the shelf's other mushrooms with dot faces on their stems.
  const stem = '#f4ead2', ink = LINE;
  const face = (x, y, happy) => (happy
    ? `<path d="M${f1(x - 2.6)} ${f1(y)}q.9 -1 1.8 0M${f1(x + 0.8)} ${f1(y)}q.9 -1 1.8 0" fill="none" stroke="${ink}" stroke-width=".85" stroke-linecap="round"/>`
    : `<circle cx="${f1(x - 1.7)}" cy="${f1(y)}" r=".85" fill="${ink}"/><circle cx="${f1(x + 1.7)}" cy="${f1(y)}" r=".85" fill="${ink}"/>`)
    + `<path d="M${f1(x - 0.9)} ${f1(y + 1.9)}q.9 .8 1.8 0" fill="none" stroke="${ink}" stroke-width=".8" stroke-linecap="round"/>`
    + `<ellipse cx="${f1(x - 3)}" cy="${f1(y + 1.5)}" rx="1" ry=".6" fill="#ff8a8a" fill-opacity=".6"/><ellipse cx="${f1(x + 3)}" cy="${f1(y + 1.5)}" rx="1" ry=".6" fill="#ff8a8a" fill-opacity=".6"/>`;
  const tall = `<g transform="rotate(6 -5 0)">`
    + `<path d="M-9.6 0Q-11 -6.4 -8 -14H-2.6Q.2 -6.4 -1.2 0Z" fill="${stem}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`
    + face(-5.3, -8, false)
    + `<path d="M-13.6 -13.4Q-13.6 -23.4 -5.3 -23.4Q3 -23.4 3 -13.4Q-5.3 -15.8 -13.6 -13.4Z" fill="#d9473f" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<circle cx="-9" cy="-18.4" r="1.4" fill="#fff"/><circle cx="-3.4" cy="-20.6" r="1.7" fill="#fff"/><circle cx="-.4" cy="-16.4" r="1" fill="#fff"/></g>`;
  const short = `<g transform="rotate(-8 6 0)">`
    + `<path d="M2.6 0Q1.6 -4.4 3.8 -9.4H8.6Q10.6 -4.4 9.6 0Z" fill="${stem}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`
    + face(6.2, -5, true)
    + `<path d="M-.4 -9Q.4 -15.6 6.2 -15.6Q12 -15.6 12.8 -9Q6.2 -10.8 -.4 -9Z" fill="#b5794a" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<circle cx="3.6" cy="-12.4" r=".9" fill="#e8c39a"/><circle cx="7.6" cy="-13.6" r="1.1" fill="#e8c39a"/><circle cx="10.4" cy="-11" r=".8" fill="#e8c39a"/></g>`;
  return `<path d="M-12 0q1 -3.4 2 0M11 0q1.2 -4 2.4 0" fill="none" stroke="#7fbf63" stroke-width="1.3" stroke-linecap="round"/>` + tall + short;
}

function mortar() {
  // A stone mortar with the triple moon on its side, herbs poking out and the pestle in it.
  // Crescents with their backs to the full moon: ) O (
  const crescent = (x, y, sd) => `<path d="M${x} ${f1(y - 2.5)}A2.5 2.5 0 0 ${sd > 0 ? 1 : 0} ${x} ${f1(y + 2.5)}A1.2 2.5 0 0 ${sd > 0 ? 0 : 1} ${x} ${f1(y - 2.5)}Z" fill="#f4ecd8"/>`;
  return `<path d="M-9 -15Q-12 -22 -8 -27M-6 -15Q-6 -24 -1 -27" fill="none" stroke="#5d8a3c" stroke-width="1.2" stroke-linecap="round"/>`
    + `<ellipse cx="-8" cy="-26.4" rx="2.6" ry="1.4" transform="rotate(-50 -8 -26.4)" fill="#7fa650" stroke="${LINE}" stroke-width=".8"/>`
    + `<ellipse cx="-1.4" cy="-26.6" rx="2.6" ry="1.4" transform="rotate(30 -1.4 -26.6)" fill="#7fa650" stroke="${LINE}" stroke-width=".8"/>`
    + inked('M1 -13L11 -26', '#e2d9c8', 3.6)
    + `<path d="M-12 -14H12Q11.4 -3 5 -1.4L6 0H-6L-5 -1.4Q-11.4 -3 -12 -14Z" fill="#b8b2a7" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<ellipse cx="0" cy="-14" rx="12" ry="2.8" fill="#8f8a80" stroke="${LINE}" stroke-width="1.4"/>`
    + `<path d="M4 -14.6L10 -22" stroke="${LINE}" stroke-width="4.6" stroke-linecap="round"/><path d="M4 -14.6L10 -22" stroke="#e2d9c8" stroke-width="2.4" stroke-linecap="round"/>`
    + crescent(-6.6, -7.6, 1) + `<circle cx="0" cy="-7.6" r="2.3" fill="#f4ecd8"/>` + crescent(6.6, -7.6, -1)
    + `<path d="M-9.4 -11Q-9 -6 -6.4 -3.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>`;
}

function mushroomGarland(len) {
  // Strings of little mushrooms and beads hanging from the shelf above.
  const caps = ['#d9473f', '#b5794a', '#e8c39a'];
  let s = '';
  [[-8, 1], [0, 0.78], [8, 0.92]].forEach(([x, f], i) => {
    const l = len * f;
    s += `<path d="M${x} 0V${f1(l)}" stroke="#d9c7a3" stroke-width=".9"/>`;
    for (let k = 0; k < 3; k++) {
      const y = l * (0.28 + 0.3 * k);
      if ((i + k) % 2) {
        s += `<circle cx="${x}" cy="${f1(y)}" r="1.5" fill="#c3b08d" stroke="${LINE}" stroke-width=".8"/>`;
        continue;
      }
      const c = caps[(i + k) % 3];
      s += `<path d="M${x - 1} ${f1(y - 1)}V${f1(y + 3.4)}H${x + 1}V${f1(y - 1)}Z" fill="#f4ead2" stroke="${LINE}" stroke-width=".8"/>`
        + `<path d="M${x - 3.6} ${f1(y)}Q${x - 3.6} ${f1(y - 4.2)} ${x} ${f1(y - 4.2)}Q${x + 3.6} ${f1(y - 4.2)} ${x + 3.6} ${f1(y)}Z" fill="${c}" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
        + (c === '#d9473f' ? `<circle cx="${x - 1.2}" cy="${f1(y - 2.4)}" r=".6" fill="#fff"/>` : '');
    }
    s += `<circle cx="${x}" cy="${f1(l + 1.6)}" r="1.4" fill="#a77be0" stroke="${LINE}" stroke-width=".8"/>`;
  });
  return s;
}

function acorns() {
  // Two acorns on an autumn oak leaf.
  const nut = (x, rot) => `<g transform="translate(${x} -5.2) rotate(${rot})">`
    + `<ellipse cx="0" cy="1.2" rx="3.6" ry="4.4" fill="#c8894a" stroke="${LINE}" stroke-width="1.2"/>`
    + `<path d="M-1.4 -.4Q-1.6 2.4 -.4 4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/>`
    + `<path d="M-4.4 -1.2Q-4.4 -5.4 0 -5.4Q4.4 -5.4 4.4 -1.2Q0 -.2 -4.4 -1.2Z" fill="#8a5a35" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="M-3 -2.6L-1.6 -4.4M-1 -2.2L.6 -4.6M1.2 -2.2L2.8 -4" stroke="#6a4428" stroke-width=".7" stroke-linecap="round"/>`
    + `<path d="M0 -5.4Q.4 -7.2 1.6 -7.6" fill="none" stroke="${LINE}" stroke-width="1.1" stroke-linecap="round"/></g>`;
  return `<path d="M-12 -.6Q-11 -4 -8 -3.6Q-8 -7 -4.6 -6Q-3 -9 0 -7Q3 -9 4.6 -6Q8 -7 8 -3.6Q11 -4 12 -.6Q0 1 -12 -.6Z" fill="#d9893a" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="M-10 -1.2Q0 -2.6 10 -1.2M-4.6 -1.6L-6 -4.6M0 -1.8V-6M4.6 -1.6L6 -4.6" fill="none" stroke="#b56a26" stroke-width=".8" stroke-linecap="round"/>`
    + nut(-3.4, -12) + nut(3.8, 10);
}

function beetle() {
  // A shiny beetle, head up.
  let legs = '';
  for (const sd of [-1, 1]) {
    for (const [y, dy] of [[-2.4, -2.6], [0.6, 0], [3.4, 2.6]]) legs += `M${sd * 3.4} ${y}l${sd * 3} ${dy}`;
  }
  return `<path d="${legs}" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`
    + `<path d="M-1 -7.4Q-2.6 -10 -4.4 -10.6M1 -7.4Q2.6 -10 4.4 -10.6" fill="none" stroke="${LINE}" stroke-width=".9" stroke-linecap="round"/>`
    + `<ellipse cx="0" cy="-6.4" rx="2.6" ry="2" fill="#2d3a40" stroke="${LINE}" stroke-width="1"/>`
    + `<ellipse cx="0" cy="1" rx="4.4" ry="6.2" fill="#3a7f8c" stroke="${LINE}" stroke-width="1.2"/>`
    + `<path d="M0 -4.8V7" stroke="${LINE}" stroke-width=".9"/>`
    + `<path d="M-2.6 -2.6Q-3.2 0 -2.4 2.6M2.2 -3Q2.8 -1.6 2.6 0" fill="none" stroke="#9fe3df" stroke-width=".9" stroke-linecap="round"/>`;
}

function jamJar() {
  // Strawberry jam with a gingham cloth over the lid, tied with twine.
  let checks = '';
  for (const x of [-7, -3.5, 0, 3.5, 7]) checks += `M${x} -21.4V-16.6`;
  return `<path d="M-7.6 -15H7.6V-2Q7.6 0 5.6 0H-5.6Q-7.6 0 -7.6 -2Z" fill="#b8344c" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<rect x="-5" y="-10.6" width="10" height="5.6" rx="1" fill="#f6efdc" stroke="${LINE}" stroke-width=".9"/>`
    + `<path d="M0 -6.4Q-1.6 -7.6 -1.4 -8.6Q-.4 -9.6 0 -8.6Q.4 -9.6 1.4 -8.6Q1.6 -7.6 0 -6.4Z" fill="#d9473f"/>`
    + `<path d="M-5.6 -12.6V-3" stroke="#fff" stroke-opacity=".4" stroke-width="1.3" stroke-linecap="round"/>`
    + `<path d="M-9 -16Q-9.6 -22 0 -22Q9.6 -22 9 -16Q6 -14.4 4.4 -16.4Q2 -14.2 0 -16.4Q-2 -14.2 -4.4 -16.4Q-6 -14.4 -9 -16Z" fill="#f4ecd8" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="${checks}M-8.4 -19.6H8.4M-8.8 -17.4H8.8" stroke="#d9473f" stroke-opacity=".55" stroke-width="1"/>`
    + `<path d="M-8.2 -15.6Q0 -14 8.2 -15.6" fill="none" stroke="#c9a46b" stroke-width="1.6" stroke-linecap="round"/>`;
}

function mushroomBasket() {
  // A woven basket full of foraged mushrooms.
  let weave = '';
  for (const x of [-7.4, -2.6, 2.2, 7]) weave += `M${x} -10.6L${f1(x * 0.8)} -1.2`;
  return inked('M-10.4 -12Q0 -41 10.4 -12', '#a87a4a', 2.2)
    + `<path d="M-5.2 -12V-17H-2.8V-12ZM4.6 -12V-18H7V-12Z" fill="#f4ead2" stroke="${LINE}" stroke-width="1"/>`
    + `<path d="M-9 -16.6Q-9 -22.6 -4 -22.6Q1 -22.6 1 -16.6Q-4 -17.8 -9 -16.6Z" fill="#d9473f" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<circle cx="-6" cy="-20" r=".9" fill="#fff"/><circle cx="-2.4" cy="-21" r=".7" fill="#fff"/>`
    + `<path d="M.6 -17.4Q1 -23.6 5.8 -23.6Q10.6 -23.6 11 -17.4Q5.8 -18.6 .6 -17.4Z" fill="#b5794a" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>`
    + `<path d="M-12 -12H12L9.6 -1.2Q9.4 0 8 0H-8Q-9.4 0 -9.6 -1.2Z" fill="#c99a5e" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<path d="${weave}M-10.8 -7.6H10.8M-10 -3.8H10" stroke="#a87a4a" stroke-width=".9"/>`
    + `<rect x="-13" y="-14" width="26" height="3.4" rx="1.7" fill="#b5834d" stroke="${LINE}" stroke-width="1.3"/>`
    + `<ellipse cx="11.6" cy="-15.4" rx="3.2" ry="1.6" transform="rotate(-30 11.6 -15.4)" fill="#7fa650" stroke="${LINE}" stroke-width=".9"/>`;
}

function stump() {
  // A little tree stump with shelf fungi on its side and a toadstool on top.
  return `<path d="M-12 0Q-13.4 -2 -11 -3Q-11.6 -10 -10.6 -16H10.6Q11.6 -10 11 -3Q13.4 -2 12 0Z" fill="#8a5a3a" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<path d="M-7 -14V-3M-2 -13V-1M3.6 -14V-4M8 -12V-2" stroke="#6a4428" stroke-width="1" stroke-linecap="round"/>`
    + `<ellipse cx="0" cy="-16" rx="10.6" ry="3.4" fill="#e2b77f" stroke="${LINE}" stroke-width="1.3"/>`
    + `<ellipse cx="0" cy="-16" rx="6.6" ry="2" fill="none" stroke="#c29358" stroke-width=".8"/><ellipse cx="0" cy="-16" rx="3" ry=".9" fill="none" stroke="#c29358" stroke-width=".8"/>`
    + `<path d="M10.4 -10Q16 -10.6 15 -8Q12.6 -7.4 10.6 -8ZM10.6 -6Q15 -6.4 14.2 -4.2Q12.4 -3.6 10.8 -4.2Z" fill="#e8c39a" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="M-5 -16.6V-20.6H-3.4V-16.6Z" fill="#f4ead2" stroke="${LINE}" stroke-width=".9"/>`
    + `<path d="M-7.4 -20.4Q-7.4 -24.2 -4.2 -24.2Q-1 -24.2 -1 -20.4Z" fill="#d9473f" stroke="${LINE}" stroke-width="1.1" stroke-linejoin="round"/>`
    + `<circle cx="-5.2" cy="-22.4" r=".7" fill="#fff"/>`;
}

function newt() {
  // A spotted newt climbing, head up.
  const c = '#e8743a';
  return inked('M-1.6 -6L-5.6 -8.6M1.6 -6L5.6 -8.6M-1.4 2.4L-5.4 5M1.4 2.4L5.4 5', c, 1.6)
    + inked('M0 3Q-2.4 9 .4 14Q2.4 17.4 5.4 18', c, 2.6)
    + inked('M0 -10Q1.6 -3.4 0 3.4', c, 4.8)
    + `<ellipse cx="0" cy="-12.6" rx="3.2" ry="3.7" fill="${c}" stroke="${LINE}" stroke-width="1.2"/>`
    + `<circle cx="-1.5" cy="-13.6" r=".75" fill="${LINE}"/><circle cx="1.5" cy="-13.6" r=".75" fill="${LINE}"/>`
    + `<circle cx=".2" cy="-5" r=".8" fill="#3b2a24"/><circle cx="-.6" cy="-1" r=".7" fill="#3b2a24"/><circle cx=".8" cy="1.8" r=".6" fill="#3b2a24"/>`
    + `<circle cx="-6" cy="-8.8" r=".7" fill="${c}"/><circle cx="6" cy="-8.8" r=".7" fill="${c}"/>`;
}

function moonSwing(len) {
  // A crescent moon hung like a swing, with a frog sitting in it.
  const thread = (x) => `<path d="M${x} 0V${f1(len)}" stroke="${THREAD}" stroke-opacity=".55" stroke-width=".8"/>`;
  const y = len;
  return thread(-11.6) + thread(11.6)
    + `<g transform="translate(0 ${f1(y + 4.6)}) scale(.55)">${frog()}</g>`
    + `<path d="M-12 ${f1(y)}A12 12 0 0 0 12 ${f1(y)}A12 5 0 0 1 -12 ${f1(y)}Z" fill="#f6d76b" stroke="${LINE}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<path d="M-9.6 ${f1(y + 4.6)}Q-5.4 ${f1(y + 9.4)} 1.4 ${f1(y + 9.8)}" fill="none" stroke="#fff3c0" stroke-width="1.2" stroke-linecap="round"/>`
    + sparkle(-15, y + 6, 1.8) + sparkle(15, y - 2, 1.5);
}

function cobweb() {
  // A web strung across a top corner, from the corner at (0, 0) into the case.
  const angles = [0, 22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);
  let d = '';
  // Spokes into the corner, but none along the frame's edges.
  for (const a of angles.slice(1, -1)) d += `M0 0L${f1(26 * Math.cos(a))} ${f1(26 * Math.sin(a))}`;
  for (const r of [7, 13.5, 20]) {
    angles.forEach((a, i) => {
      const x = r * Math.cos(a), y = r * Math.sin(a);
      if (!i) { d += `M${f1(x)} ${f1(y)}`; return; }
      const m = (a + angles[i - 1]) / 2, rr = r * 0.82; // each strand sags toward the corner
      d += `Q${f1(rr * Math.cos(m))} ${f1(rr * Math.sin(m))} ${f1(x)} ${f1(y)}`;
    });
  }
  return `<path d="${d}" fill="none" stroke="${THREAD}" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/>`;
}

/** A vine winding up a post, with heart leaves. Pixels in, pixels out. */
function postVine(x, y0, y1, postW, s, rand) {
  const ph = rand() * Math.PI * 2;
  const amp = postW * 0.28;
  let d = '';
  const pts = [];
  for (let y = y0, i = 0; y >= y1; y -= 4, i++) {
    const px = x + Math.sin((y0 - y) / 26 + ph) * amp;
    pts.push([px, y]);
    d += `${i ? 'L' : 'M'}${f1(px)} ${f1(y)}`;
  }
  let leaves = '';
  const heart = SHAPES.heart(11, 10);
  for (let i = 3, k = 0; i < pts.length; i += 4, k++) {
    const [px, py] = pts[i];
    const sd = k % 2 ? 1 : -1;
    const size = 0.75 + 0.3 * rand();
    leaves += place(`<path d="${heart}" fill="#5d9e46" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`
      + `<path d="M0 -1Q.6 -5 0 -8.6" fill="none" stroke="#7fbf63" stroke-width="1" stroke-linecap="round"/>`, px, py, s * size, { rot: sd * (55 + rand() * 25) });
  }
  return inked(d, '#4f7f32', Math.max(1.4, 2.4 * s)) + leaves;
}

/* --------------------------------------------------------------- the case */

const MAGIC = ['potions', 'crystals', 'moonMobile', 'fairyFrog', 'charms', 'mushroomHouse', 'mushroomFolk', 'mortar', 'moonSwing'];

/**
 * Draw the bookshelf. Returns { svg, props, glows }: the case itself (behind
 * everything), the props standing about (which go above the plant labels but behind
 * the plants), and twinkling lights ({ x, y, size, delay, color } in pixels) for
 * the card to animate.
 * g: { w, h, left, right, top, bottom, scale, whimsy, dividers, wood, rows: [{ floor, bottom, pots: [{ x, trailing }] }] }
 *    sizes in pixels: the frame's post, crown and base thickness, pixels per plant unit,
 *    and for each row the y its plants stand on, the y its plank ends and each pot's centre
 *    (trailing plants hang vines past their pot, so props keep further away). whimsy is
 *    how many surprises to place per plant, 0 to 4 (default 1); dividers are the x of
 *    any wooden uprights splitting the case into compartments; wood is a WOODS name or a
 *    colour (see woodPalette).
 */
export function drawBookshelf(g, rand) {
  const { w, h, left, right, top, bottom, rows } = g;
  const WOOD = woodPalette(g.wood);
  THREAD = luminance(WOOD.back) > 0.4 ? '#5c4a3c' : '#fff';
  const u = g.scale; // pixels per plant unit
  const S = (k) => u * k; // props are drawn a little larger than the plants so they read
  const x0 = left, x1 = w - right;
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (lo, hi) => lo + rand() * (hi - lo);

  // Back panel: vertical boards with a little grain and the odd knot.
  let back = `<rect x="${f1(x0)}" y="${f1(top)}" width="${f1(x1 - x0)}" height="${f1(h - top - bottom)}" fill="${WOOD.back}"/>`;
  const boardW = Math.max(48, 98 * u);
  for (let bx = x0; bx < x1; bx += boardW) {
    if (bx > x0) back += `<path d="M${f1(bx)} ${f1(top)}V${f1(h - bottom)}" stroke="${WOOD.seam}" stroke-width="2"/>`;
    for (let k = 0; k < 3; k++) {
      const gx = bx + between(8, boardW - 8), gy = between(top, h - bottom - 40);
      back += `<path d="M${f1(gx)} ${f1(gy)}q${f1(between(-5, 5))} 18 0 ${f1(between(28, 46))}" fill="none" stroke="${WOOD.grain}" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".7"/>`;
    }
    if (rand() < 0.35) {
      const kx = bx + between(12, boardW - 12), ky = between(top + 10, h - bottom - 10);
      back += `<ellipse cx="${f1(kx)}" cy="${f1(ky)}" rx="4.4" ry="2.8" fill="${WOOD.seam}" stroke="${WOOD.grain}" stroke-width="1.4"/>`;
    }
  }
  // Shadows cast by each plank onto the wall below it.
  for (const row of rows.slice(0, -1)) {
    back += `<rect x="${f1(x0)}" y="${f1(row.bottom)}" width="${f1(x1 - x0)}" height="7" fill="#000" fill-opacity=".22"/>`
      + `<rect x="${f1(x0)}" y="${f1(row.bottom + 7)}" width="${f1(x1 - x0)}" height="7" fill="#000" fill-opacity=".09"/>`;
  }

  // Free stretches of each shelf between the pots, where props can stand. A pot is
  // narrower at its foot than its rim, so props may tuck in partly behind one.
  const spans = [];
  rows.forEach((row, r) => {
    const pots = [...row.pots].sort((a, b) => a.x - b.x);
    const half = (p) => (p.trailing ? 62 : 42) * u;
    const edges = [x0 + 4, ...pots.flatMap((p) => [p.x - half(p), p.x + half(p)]), x1 - 4];
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1];
      const before = pots[i / 2 - 1], after = pots[i / 2];
      if (b - a > 14 * u) {
        // A pot the fairy could hide behind (not one draped in vines).
        spans.push({ r, a, b, potLeft: before && !before.trailing, potRight: after && !after.trailing });
      }
    }
  });
  // Uprights splitting the case into compartments: props keep off them.
  const DIVIDER = 10;
  for (const x of g.dividers ?? []) {
    const gap = DIVIDER / 2 + 4;
    for (const sp of [...spans]) {
      if (sp.a >= x + gap || sp.b <= x - gap) continue;
      spans.splice(spans.indexOf(sp), 1, { ...sp, b: x - gap, potRight: false }, { ...sp, a: x + gap, potLeft: false });
    }
  }
  const claim = (width) => {
    const fits = spans.filter((sp) => sp.b - sp.a >= width + 6 * u);
    if (!fits.length) return null;
    const sp = pick(fits);
    const x = between(sp.a + width / 2 + 3 * u, sp.b - width / 2 - 3 * u);
    // Split the stretch around what was placed.
    spans.splice(spans.indexOf(sp), 1,
      { ...sp, b: x - width / 2 - 2 * u, potRight: false }, { ...sp, a: x + width / 2 + 2 * u, potLeft: false });
    return { x, row: rows[sp.r], r: sp.r };
  };

  let wall = '', shelfProps = '', frameProps = '';
  const glows = []; // twinkling lights, which the card animates as separate layers
  const posts = { L: [], R: [] }; // y ranges already used on each post
  const postFree = (side, ya, yb) => posts[side].every(([a, b]) => yb < a || ya > b);

  const ITEMS = {
    books: () => {
      const b = books(rand), k = S(1.45);
      const at = claim(b.width * k);
      if (!at) return false;
      shelfProps += place(b.svg, at.x, at.row.floor, k);
      return true;
    },
    snail: () => {
      const k = S(2), at = claim(34 * k);
      if (!at) return false;
      const flip = rand() < 0.5 ? -1 : 1;
      shelfProps += place(snail(rand() < 0.35), at.x + flip * 12 * k, at.row.floor, k, { flip });
      return true;
    },
    mushrooms: () => {
      const k = S(2.1), at = claim(22 * k);
      if (!at) return false;
      shelfProps += place(mushrooms(rand), at.x - 2 * k, at.row.floor, k);
      return true;
    },
    teacup: () => {
      const k = S(2), at = claim(24 * k);
      if (!at) return false;
      shelfProps += place(teacup(), at.x, at.row.floor, k);
      return true;
    },
    frog: () => {
      const k = S(2), at = claim(20 * k);
      if (!at) return false;
      shelfProps += place(frog(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    fairyDoor: () => {
      const k = S(2.2), at = claim(40 * k);
      if (!at) return false;
      wall += place(fairyDoor(), at.x - 6 * k, at.row.floor, k);
      return true;
    },
    spider: () => {
      const k = S(1.9), at = claim(14 * k);
      if (!at) return false;
      const from = at.r === 0 ? top : rows[at.r - 1].bottom;
      const len = between(0.15, 0.4) * (at.row.floor - from) / k;
      wall += place(spider(len), at.x, from, k);
      return true;
    },
    vine: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      if (posts[side].length) return false;
      const yTop = between(top + 10, top + (h - top - bottom) * 0.55);
      posts[side].push([yTop, h]);
      const x = side === 'L' ? left / 2 : w - right / 2;
      frameProps += postVine(x, h - bottom / 2, yTop, side === 'L' ? left : right, S(1.8), rand);
      return true;
    },
    ladybug: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      const y = between(top + 20, h - bottom - 20);
      if (!postFree(side, y - 14, y + 14)) return false;
      posts[side].push([y - 14, y + 14]);
      frameProps += place(ladybug(), side === 'L' ? left / 2 : w - right / 2, y, S(2), { rot: between(-40, 40) + (rand() < 0.5 ? 180 : 0) });
      return true;
    },
    butterfly: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      const y = between(top + 24, h - bottom - 24);
      if (!postFree(side, y - 20, y + 20)) return false;
      posts[side].push([y - 20, y + 20]);
      const x = side === 'L' ? left - 2 : w - right + 2;
      frameProps += place(butterfly(rand), x, y, S(1.8), { rot: side === 'L' ? 20 : -20 });
      return true;
    },
    postSnail: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      const k = S(1.7), y = between(top + 40, h - bottom - 40);
      if (!postFree(side, y - 30, y + 40)) return false;
      posts[side].push([y - 30, y + 40]);
      // Climbing up the post with its shell toward the shelves.
      const x = side === 'L' ? left / 2 - 3 * k : w - right / 2 + 3 * k;
      frameProps += place(snail(), x, y, k, { rot: -90, flip: side === 'L' ? -1 : 1 });
      return true;
    },
    potions: () => {
      const k = S(1.9), at = claim(34 * k);
      if (!at) return false;
      shelfProps += place(potions(rand), at.x, at.row.floor, k);
      return true;
    },
    crystals: () => {
      const k = S(1.9), at = claim(32 * k);
      if (!at) return false;
      shelfProps += place(crystals(rand), at.x, at.row.floor, k);
      return true;
    },
    mushroomHouse: () => {
      const k = S(1.8), at = claim(36 * k);
      if (!at) return false;
      shelfProps += place(mushroomHouse(), at.x, at.row.floor, k);
      return true;
    },
    fairyFrog: () => {
      const k = S(1.8), at = claim(34 * k);
      if (!at) return false;
      shelfProps += place(fairyFrog(), at.x, at.row.floor, k);
      return true;
    },
    mushroomFolk: () => {
      const k = S(2), at = claim(40 * k);
      if (!at) return false;
      shelfProps += place(mushroomFolk(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    mortar: () => {
      const k = S(2), at = claim(30 * k);
      if (!at) return false;
      shelfProps += place(mortar(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    acorns: () => {
      const k = S(2), at = claim(28 * k);
      if (!at) return false;
      shelfProps += place(acorns(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    jamJar: () => {
      const k = S(2), at = claim(22 * k);
      if (!at) return false;
      shelfProps += place(jamJar(), at.x, at.row.floor, k);
      return true;
    },
    mushroomGarland: () => {
      const k = S(1.7), at = claim(30 * k);
      if (!at) return false;
      const from = at.r === 0 ? top : rows[at.r - 1].bottom;
      wall += place(mushroomGarland(between(0.2, 0.32) * (at.row.floor - from) / k + 6), at.x, from, k);
      return true;
    },
    beetle: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      const y = between(top + 20, h - bottom - 20);
      if (!postFree(side, y - 16, y + 16)) return false;
      posts[side].push([y - 16, y + 16]);
      frameProps += place(beetle(), side === 'L' ? left / 2 : w - right / 2, y, S(1.9), { rot: between(-30, 30) + (rand() < 0.5 ? 180 : 0) });
      return true;
    },
    mushroomBasket: () => {
      const k = S(2), at = claim(30 * k);
      if (!at) return false;
      shelfProps += place(mushroomBasket(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    stump: () => {
      const k = S(2), at = claim(30 * k);
      if (!at) return false;
      shelfProps += place(stump(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    newt: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      const y = between(top + 30, h - bottom - 30);
      if (!postFree(side, y - 24, y + 30)) return false;
      posts[side].push([y - 24, y + 30]);
      frameProps += place(newt(), side === 'L' ? left / 2 : w - right / 2, y, S(1.8), { rot: between(-15, 15), flip: side === 'L' ? 1 : -1 });
      return true;
    },
    moonSwing: () => {
      const k = S(1.7), at = claim(34 * k);
      if (!at) return false;
      const from = at.r === 0 ? top : rows[at.r - 1].bottom;
      wall += place(moonSwing(between(0.15, 0.25) * (at.row.floor - from) / k + 4), at.x, from, k);
      return true;
    },
    cobweb: () => {
      const side = rand() < 0.5 ? 'L' : 'R';
      if (!postFree(side, 0, top + 46)) return false;
      posts[side].push([0, top + 46]);
      // On the back wall, behind everything else, tucked under the frame at its corner.
      wall += place(cobweb(), side === 'L' ? left : w - right, top, S(2.2), { flip: side === 'L' ? 1 : -1 });
      return true;
    },
    candle: () => {
      const k = S(1.8), at = claim(26 * k);
      if (!at) return false;
      shelfProps += place(candle(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
      return true;
    },
    charms: () => {
      const k = S(1.7), at = claim(36 * k);
      if (!at) return false;
      const from = at.r === 0 ? top : rows[at.r - 1].bottom;
      wall += place(charms(between(0.1, 0.2) * (at.row.floor - from) / k + 4), at.x, from, k);
      return true;
    },
    moonMobile: () => {
      const k = S(1.7), at = claim(26 * k);
      if (!at) return false;
      const from = at.r === 0 ? top : rows[at.r - 1].bottom;
      const len = between(0.2, 0.32) * (at.row.floor - from) / k + 9;
      wall += place(moonMobile(len), at.x, from, k);
      return true;
    },
  };

  // A different handful every time, always starting with something magical: whimsy
  // surprises per plant, as many as there's room for. Once every kind has had a turn
  // they come round again, so a very whimsical shelf can have two of a thing.
  const whimsy = Math.min(4, Math.max(0, g.whimsy ?? 1));
  const wanted = Math.round(whimsy * rows.reduce((n, row) => n + row.pots.length, 0));
  let queue = wanted ? [shuffled(MAGIC, rand)[0]] : [];
  let placed = 0;
  for (let tries = 0; placed < wanted && tries < wanted * 3 + 10; tries++) {
    if (!queue.length) queue = shuffled([...Object.keys(ITEMS), 'books', 'books'], rand);
    if (ITEMS[queue.shift()]()) placed++;
  }

  // Fireflies drifting about every shelf, fewer on a less whimsical one.
  rows.forEach((row, r) => {
    const from = r === 0 ? top : rows[r - 1].bottom;
    const n = Math.round((3 + rand() * 2) * Math.min(1.5, whimsy));
    for (let i = 0; i < n; i++) {
      glows.push({
        // Spread along the shelf rather than bunched up.
        x: x0 + ((i + 0.15 + rand() * 0.7) / n) * (x1 - x0), y: between(from + 10, row.floor - 20),
        size: S(between(24, 34)), delay: between(0, 3.4), color: pick(['#ffe873', '#d4ff7a', '#ffe873']),
      });
    }
  });

  // Planks: a lit top surface the plants stand on, and a front edge for their labels.
  let planks = '';
  for (const row of rows) {
    const t = row.floor - 5, f = row.floor + 3;
    planks += `<rect x="${f1(x0 - 2)}" y="${f1(t)}" width="${f1(x1 - x0 + 4)}" height="8" fill="${WOOD.top}" stroke="${LINE}" stroke-width="2"/>`
      + `<rect x="${f1(x0 - 2)}" y="${f1(f)}" width="${f1(x1 - x0 + 4)}" height="${f1(Math.max(6, row.bottom - f))}" fill="${WOOD.front}" stroke="${LINE}" stroke-width="2"/>`
      + `<path d="M${f1(x0)} ${f1(f + 2.6)}H${f1(x1)}" stroke="${WOOD.light}" stroke-width="1.6" stroke-opacity=".8"/>`
      + `<rect x="${f1(x0 - 1)}" y="${f1(row.bottom - 4)}" width="${f1(x1 - x0 + 2)}" height="3" fill="${WOOD.frontDark}"/>`;
    for (let k = 0; k < 2; k++) {
      const gx = between(x0 + 10, x1 - 70), gy = between(f + 8, Math.max(f + 9, row.bottom - 8));
      planks += `<path d="M${f1(gx)} ${f1(gy)}q20 -3 ${f1(between(40, 60))} 0" fill="none" stroke="${WOOD.frontDark}" stroke-width="1.3" stroke-opacity=".6" stroke-linecap="round"/>`;
    }
  }

  for (const x of g.dividers ?? []) {
    const l = x - DIVIDER / 2;
    planks += `<rect x="${f1(l)}" y="${f1(top)}" width="${DIVIDER}" height="${f1(h - top - bottom)}" fill="${WOOD.frame}" stroke="${LINE}" stroke-width="2"/>`
      + `<rect x="${f1(l + 1.6)}" y="${f1(top + 1)}" width="2" height="${f1(h - top - bottom - 2)}" fill="${WOOD.light}" fill-opacity=".7"/>`
      + `<rect x="${f1(l + DIVIDER - 3.6)}" y="${f1(top + 1)}" width="2.6" height="${f1(h - top - bottom - 2)}" fill="${WOOD.dark}"/>`;
  }

  // The frame: two posts, a crown along the top and a base.
  const post = (x, wd, inner) => `<rect x="${f1(x)}" y="0" width="${f1(wd)}" height="${f1(h)}" fill="${WOOD.frame}"/>`
    + `<rect x="${f1(inner === 'right' ? x + wd - 4 : x)}" y="0" width="4" height="${f1(h)}" fill="${WOOD.dark}"/>`
    + `<rect x="${f1(inner === 'right' ? x + 4 : x + wd - 7)}" y="0" width="3" height="${f1(h)}" fill="${WOOD.light}" fill-opacity=".7"/>`;
  let frame = post(0, left, 'right') + post(w - right, right, 'left');
  frame += `<rect x="0" y="0" width="${f1(w)}" height="${f1(top)}" fill="${WOOD.frame}"/>`
    + `<rect x="0" y="4" width="${f1(w)}" height="3" fill="${WOOD.light}" fill-opacity=".8"/>`
    + `<rect x="${f1(left - 2)}" y="${f1(top - 6)}" width="${f1(w - left - right + 4)}" height="6" fill="${WOOD.dark}"/>`
    + `<rect x="0" y="${f1(h - bottom)}" width="${f1(w)}" height="${f1(bottom)}" fill="${WOOD.frame}"/>`
    + `<rect x="0" y="${f1(h - bottom + 3)}" width="${f1(w)}" height="2.5" fill="${WOOD.light}" fill-opacity=".8"/>`;
  frame += `<path d="M${f1(left)} ${f1(top)}V${f1(h - bottom)}M${f1(w - right)} ${f1(top)}V${f1(h - bottom)}`
    + `M${f1(left)} ${f1(top)}H${f1(w - right)}M${f1(left)} ${f1(h - bottom)}H${f1(w - right)}" stroke="${LINE}" stroke-width="2" fill="none"/>`;
  if (rand() < 0.7) {
    const kx = rand() < 0.5 ? left / 2 : w - right / 2;
    frame += `<ellipse cx="${f1(kx)}" cy="${f1(between(top + 30, h - bottom - 30))}" rx="2.6" ry="4" fill="${WOOD.dark}" stroke="${WOOD.light}" stroke-width="1"/>`;
  }

  return { svg: back + wall + planks + frame, props: shelfProps + frameProps, glows };
}

/**
 * Every prop on its own, for the preview page: [{ id, label, svg, scale, box }]. Each
 * svg is in plant units, standing on (or hanging from) y = 0; scale is how much larger
 * than the plants it is drawn on the shelf, and box ([x, y, w, h]) frames it.
 */
export function propGallery() {
  THREAD = '#fff'; // the gallery shows them on walnut
  const r = rng(11);
  const fixed = (v) => () => v;
  return [
    ['books', 'Books', books(rng(5), false).svg, 1.45, [-40, -56, 80, 60]],
    ['book-pile', 'Pile of books', books(rng(5), true).svg, 1.45, [-26, -32, 52, 36]],
    ['snail', 'Snail', snail(), 2, [-46, -26, 68, 30]],
    ['mushroom-snail', 'Mushroom snail', snail(true), 2, [-46, -34, 68, 38]],
    ['mushrooms', 'Mushrooms', mushrooms(fixed(0.45)), 2.1, [-17, -26, 36, 30]],
    ['glowing-mushrooms', 'Glowing mushrooms', mushrooms(fixed(0.1)), 2.1, [-24, -36, 52, 40]],
    ['teacup', 'Teacup', teacup(), 2, [-15, -30, 30, 32]],
    ['frog', 'Frog', frog(), 2, [-14, -18, 28, 20]],
    ['fairy-door', 'Fairy door', fairyDoor(), 2.2, [-14, -26, 46, 28]],
    ['spider', 'Spider', spider(20), 1.9, [-10, -2, 20, 30]],
    ['ladybug', 'Ladybug', ladybug(), 2, [-8, -10, 16, 16]],
    ['butterfly', 'Butterfly', butterfly(r), 1.8, [-15, -12, 30, 22]],
    ['potions', 'Potions', potions(rng(3)), 1.9, [-25, -27, 50, 31]],
    ['crystals', 'Crystals', crystals(fixed(0.99)), 1.9, [-28, -42, 56, 44]],
    ['moon-mobile', 'Moon mobile', moonMobile(24), 1.7, [-18, -2, 36, 38]],
    ['toadstool-cottage', 'Toadstool cottage', mushroomHouse(), 1.8, [-20, -42, 40, 44]],
    ['fairy-frog', 'Fairy frog', fairyFrog(), 1.8, [-22, -30, 44, 32]],
    ['candle', 'Candle', candle(), 1.8, [-18, -42, 36, 44]],
    ['charms', 'Hanging charms', charms(8), 1.7, [-20, -2, 40, 34]],
    ['mushroom-folk', 'Mushroom folk', mushroomFolk(), 2, [-16, -26, 32, 28]],
    ['mortar', 'Mortar and pestle', mortar(), 2, [-15, -30, 30, 32]],
    ['mushroom-garland', 'Mushroom garland', mushroomGarland(24), 1.7, [-14, -2, 28, 32]],
    ['acorns', 'Acorns', acorns(), 2, [-14, -15, 28, 17]],
    ['beetle', 'Beetle', beetle(), 1.9, [-9, -12, 18, 21]],
    ['jam-jar', 'Jam jar', jamJar(), 2, [-11, -24, 22, 26]],
    ['mushroom-basket', 'Mushroom basket', mushroomBasket(), 2, [-15, -30, 30, 32]],
    ['stump', 'Tree stump', stump(), 2, [-15, -26, 32, 28]],
    ['newt', 'Newt', newt(), 1.8, [-9, -18, 18, 38]],
    ['moon-swing', 'Moon swing', moonSwing(14), 1.7, [-17, -2, 34, 30]],
    ['cobweb', 'Cobweb', cobweb(), 2.2, [-2, -2, 30, 30]],
    ['vine', 'Climbing vine', postVine(0, 30, -30, 10, 1, rng(4)), 1.8, [-14, -34, 28, 68]],
  ].map(([id, label, svg, scale, box]) => ({ id, label, svg, scale, box }));
}

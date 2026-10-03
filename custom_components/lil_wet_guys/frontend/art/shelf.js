// The card's "bookshelf" background: a cartoon wooden case drawn behind the plant
// tiles, with a plank under every row and a few small surprises tucked into the free
// spots. The card measures where things stand (in pixels); props are drawn in plant
// units (a pot is about 108 wide) and scaled to match the plants.

import { OUTLINE, shade } from './color.js';
import { f1 } from './geom.js';
import { SHAPES } from './leaves.js';

/** Where a plant's feet meet the shelf, as a fraction of its drawing's height. */
export const FLOOR = 240 / 248;

const LINE = OUTLINE;
// Walnut: a deep chocolate back panel, warmer frame and shelves.
const WOOD = {
  back: '#4e3326', seam: '#3d281d', grain: '#644232',
  frame: '#7b5137', light: '#9a6b4b', dark: '#5e3c29',
  top: '#a5764f', front: '#86593b', frontDark: '#6a4530',
};
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

function books(rand) {
  const cols = shuffled(BOOKS, rand);
  let s = '', width = 0;
  if (rand() < 0.3) {
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

function snail() {
  let spiral = '';
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 3.2;
    const r = 1 + t * 0.62;
    spiral += `${i ? 'L' : 'M'}${f1(-1 + r * Math.cos(t))} ${f1(-12 + r * Math.sin(t))}`;
  }
  return `<path d="M-42 -.6H-13" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M-14 0Q-15 -4 -10 -4.5L8 -4.5Q10 -5 10.5 -9Q11 -13 14.5 -12.5Q17.5 -12 17 -8Q16.5 -3 13 -1Q11 0 8 0Z" fill="#e8d3a6" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`
    + `<path d="M13 -12L12 -18M15.5 -12L17 -17.5" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<circle cx="12" cy="-18.4" r="1.5" fill="${LINE}"/><circle cx="17.2" cy="-18" r="1.5" fill="${LINE}"/>`
    + `<path d="M14.3 -8.4Q15.5 -7.2 16.5 -8.6" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`
    + `<circle cx="-1" cy="-12" r="9" fill="#c97f4c" stroke="${LINE}" stroke-width="1.6"/>`
    + `<path d="${spiral}" fill="none" stroke="${shade('#c97f4c', -0.35)}" stroke-width="1.3" stroke-linecap="round"/>`;
}

function fairy() {
  const skin = '#f7d4b8', wing = '#dff4ff';
  return `<ellipse cx="-9" cy="-30" rx="9" ry="5" transform="rotate(-25 -9 -30)" fill="${wing}" fill-opacity=".9" stroke="${LINE}" stroke-width="1.3"/>`
    + `<ellipse cx="-8" cy="-21.5" rx="6.5" ry="3.6" transform="rotate(20 -8 -21.5)" fill="${wing}" fill-opacity=".9" stroke="${LINE}" stroke-width="1.3"/>`
    + inked('M-2 -9L-2.5 -1.5M2 -9L2.5 -1.5', skin, 1.8)
    + inked('M-2 -20Q-6 -19 -9 -16', skin, 1.8)
    + `<path d="M-3.5 -22L3.5 -22L8 -9Q4 -7 0 -9Q-4 -7 -8 -9Z" fill="#f29bbd" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<circle cx="1.5" cy="-28.5" r="6.2" fill="${skin}" stroke="${LINE}" stroke-width="1.5"/>`
    + `<path d="M-4.6 -28Q-5 -35.5 1.5 -35Q7.5 -35 7.6 -30Q4 -32 1 -31Q-2 -30 -4.6 -28Z" fill="#8b5aa8" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<circle cx="-4.2" cy="-35" r="2.8" fill="#8b5aa8" stroke="${LINE}" stroke-width="1.3"/>`
    + `<circle cx="3.2" cy="-28.2" r=".95" fill="${LINE}"/><circle cx="6" cy="-28.2" r=".95" fill="${LINE}"/>`
    + `<path d="M3.6 -25.6Q4.8 -24.6 6 -25.6" fill="none" stroke="${LINE}" stroke-width=".9" stroke-linecap="round"/>`
    + `<ellipse cx="6.8" cy="-26.2" rx="1.3" ry=".8" fill="#ff8a8a" fill-opacity=".55"/>`
    + sparkle(11, -37, 2.4) + sparkle(14, -24, 1.6);
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

function mouseHole() {
  const fur = '#9c9aa8';
  return `<path d="M-12 0V-10A12 12 0 0 1 12 -10V0Z" fill="#2b1b12" stroke="${LINE}" stroke-width="1.8"/>`
    + `<circle cx="-4.6" cy="-12" r="3.3" fill="${fur}" stroke="${LINE}" stroke-width="1.2"/><circle cx="4.6" cy="-12" r="3.3" fill="${fur}" stroke="${LINE}" stroke-width="1.2"/>`
    + `<circle cx="-4.6" cy="-12" r="1.7" fill="#f2a7b5"/><circle cx="4.6" cy="-12" r="1.7" fill="#f2a7b5"/>`
    + `<ellipse cx="0" cy="-6.6" rx="5.6" ry="5" fill="${fur}" stroke="${LINE}" stroke-width="1.3"/>`
    + `<circle cx="-2.1" cy="-7.6" r=".95" fill="${LINE}"/><circle cx="2.1" cy="-7.6" r=".95" fill="${LINE}"/>`
    + `<circle cx="0" cy="-4.9" r="1.3" fill="#f28a9e"/>`
    + `<path d="M-1.6 -4.6L-7 -5.6M-1.6 -4.2L-7 -3.4M1.6 -4.6L7 -5.6M1.6 -4.2L7 -3.4" stroke="${LINE}" stroke-width=".5"/>`;
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
  return `<path d="M0 0V${f1(len)}" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>`
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
  const hang = (x, l) => `<path d="M${x} 0V${f1(l)}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>`;
  const y = len;
  return hang(0, y - 9) + hang(-11, y - 14) + hang(10, y - 6)
    + `<path d="M-12 0H11" stroke="#c9a46b" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M3 ${f1(y - 9)}A9 9 0 1 0 3 ${f1(y + 9)}A12 12 0 0 1 3 ${f1(y - 9)}Z" fill="${moon}" stroke="${LINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M-4.4 ${f1(y - 1.4)}q1.4 1.2 2.8 0" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"/>`
    + `<path d="M-3.4 ${f1(y + 3)}q1.4 1 2.6 -.2" fill="none" stroke="${LINE}" stroke-width=".9" stroke-linecap="round"/>`
    + `<ellipse cx="-2.6" cy="${f1(y + 1.2)}" rx="1.2" ry=".7" fill="#ff9a8a" fill-opacity=".55"/>`
    + star(-11, y - 11, 4.4, moon) + star(10, y - 3, 3.6, moon);
}

function dragon() {
  const g = '#5fbf9f', d = '#46997e', belly = '#f1e3a8';
  const z = (x, y, k) => `<path d="M${x} ${y}h${f1(3.4 * k)}l${f1(-3.4 * k)} ${f1(3.4 * k)}h${f1(3.4 * k)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return inked('M12 -4Q22 -4 20 -12Q19 -17 14 -16', g, 4.4)
    + `<path d="M13.6 -16.6l3.4 -2.6l-.6 4.2z" fill="#f29b52" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<ellipse cx="2" cy="-8.5" rx="13" ry="8.4" fill="${g}" stroke="${LINE}" stroke-width="1.6"/>`
    + `<path d="M-4 -15.6l2 -3.6l2 3.4M2 -16.8l2 -3.6l2 3.6M8 -15.6l2.2 -3l1.4 3.6" fill="#f29b52" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<path d="M0 -12Q6 -21 12 -12Q8 -14 6 -11Q4 -14 0 -12Z" fill="${d}" stroke="${LINE}" stroke-width="1.3" stroke-linejoin="round"/>`
    + `<path d="M-6 -1.4Q2 1.4 10 -1.4Q8 -5 2 -5Q-4 -5 -6 -1.4Z" fill="${belly}"/>`
    + `<ellipse cx="-12" cy="-6.4" rx="7.4" ry="6" fill="${g}" stroke="${LINE}" stroke-width="1.5"/>`
    + `<ellipse cx="-17.2" cy="-4.4" rx="4" ry="3.2" fill="${g}" stroke="${LINE}" stroke-width="1.3"/>`
    + `<circle cx="-19" cy="-5" r=".6" fill="${LINE}"/>`
    + `<path d="M-14.6 -7.4q1.8 1.4 3.6 0" fill="none" stroke="${LINE}" stroke-width="1.1" stroke-linecap="round"/>`
    + `<path d="M-10.6 -11.6l1.6 -4l1.4 3.2" fill="${belly}" stroke="${LINE}" stroke-width="1" stroke-linejoin="round"/>`
    + `<ellipse cx="-11" cy="-4.2" rx="1.4" ry=".8" fill="#ff8a8a" fill-opacity=".5"/>`
    + z(-22, -22, 1) + z(-27, -30, 0.75);
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

const MAGIC = ['potions', 'crystals', 'dragon', 'moonMobile'];

/**
 * Draw the bookshelf. Returns { svg, glows }: the drawing, and twinkling lights
 * ({ x, y, size, delay, color } in pixels) for the card to animate on top of it.
 * g: { w, h, left, right, top, bottom, scale, rows: [{ floor, bottom, pots: [{ x, trailing }] }] }
 *    sizes in pixels: the frame's post, crown and base thickness, pixels per plant unit,
 *    and for each row the y its plants stand on, the y its plank ends and each pot's centre
 *    (trailing plants hang vines past their pot, so props keep further away).
 */
export function drawBookshelf(g, rand) {
  const { w, h, left, right, top, bottom, rows } = g;
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
      shelfProps += place(snail(), at.x + flip * 12 * k, at.row.floor, k, { flip });
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
    mouseHole: () => {
      const k = S(2.1), at = claim(26 * k);
      if (!at) return false;
      wall += place(mouseHole(), at.x, at.row.floor, k);
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
    fairy: () => {
      // Half hidden behind a pot, leaning out to look.
      const k = S(1.5);
      const fits = spans.filter((sp) => (sp.potLeft || sp.potRight) && sp.b - sp.a >= 16 * k);
      if (!fits.length) return false;
      const sp = pick(fits);
      const fromLeft = sp.potLeft && (!sp.potRight || rand() < 0.5);
      const pot = fromLeft ? sp.a - 42 * u : sp.b + 42 * u; // the pot's centre, just past the span's end
      const sd = fromLeft ? 1 : -1;
      shelfProps += place(fairy(), pot + sd * 44 * u, rows[sp.r].floor, k, { flip: sd, rot: 12 });
      if (fromLeft) sp.a += 20 * k;
      else sp.b -= 20 * k;
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
    dragon: () => {
      const k = S(1.9), at = claim(44 * k);
      if (!at) return false;
      shelfProps += place(dragon(), at.x, at.row.floor, k, { flip: rand() < 0.5 ? -1 : 1 });
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

  // A different handful every time, always with something magical; books may turn up
  // more than once. Long empty stretches (the end of a short row) get a few extra.
  const roomy = spans.reduce((sum, sp) => sum + Math.max(0, sp.b - sp.a - 60 * u), 0);
  const wanted = Math.min(9, Math.max(3, 2 + Math.round(rows.length * 1.5) + Math.floor(roomy / (140 * u))));
  const magic = shuffled(MAGIC, rand)[0];
  const queue = [magic, ...shuffled([...Object.keys(ITEMS).filter((name) => name !== magic), 'books', 'books'], rand)];
  let placed = 0;
  for (const name of queue) {
    if (placed >= wanted) break;
    if (ITEMS[name]()) placed++;
  }

  // Fireflies drifting about every shelf.
  rows.forEach((row, r) => {
    const from = r === 0 ? top : rows[r - 1].bottom;
    const n = 3 + Math.floor(rand() * 3);
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

  return { svg: back + wall + planks + shelfProps + frame + frameProps, glows };
}

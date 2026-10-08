// Entry point: drawPlant() turns a species + pot colour + dryness into SVG.

import { GHOST_LINE, OUTLINE, clamp, dryColor, ghostify } from './color.js';
import { f1 } from './geom.js';
import { LIMB_STYLES, drawArms, drawFeet } from './limbs.js';
import { jarBack, jarFront } from './jar.js';
import { ground, heatHaze, potBack, potFront } from './pot.js';
import { RIGS } from './rigs.js';
import { SPECIES } from './species.js';

export { LIMB_STYLES, SPECIES };

/** Styles the host page must include once (the card puts them in its shadow root). */
export const ART_CSS = `
.pt-art{display:block;width:100%;height:auto;overflow:visible}
.pt-stack{position:relative;width:100%;aspect-ratio:200/248}
.pt-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.pt-happy .pt-lsway{transform-origin:50% 67.34%;will-change:transform;animation:pt-sway 5.5s ease-in-out infinite}
.pt-happy .pt-lwave{will-change:transform;animation:pt-wave 1.1s ease-in-out infinite}
.pt-stack.pt-ghost{will-change:transform;animation:pt-float 3.4s ease-in-out infinite}
.pt-sway{transform-box:view-box;transform-origin:100px 167px}
.pt-happy .pt-sway{animation:pt-sway 5.5s ease-in-out infinite}
.pt-ghost .pt-float{animation:pt-float 3.4s ease-in-out infinite}
.pt-wave{transform-box:view-box}
.pt-happy .pt-wave{animation:pt-wave 1.1s ease-in-out infinite}
@keyframes pt-sway{0%,100%{transform:rotate(-1.3deg)}50%{transform:rotate(1.3deg)}}
@keyframes pt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes pt-wave{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}
@media (prefers-reduced-motion:reduce){.pt-sway,.pt-float,.pt-wave,.pt-lsway,.pt-lwave,.pt-stack{animation:none!important}}
`;

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed, i, salt) {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1) ^ hashStr(salt)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// What can differ between two plants of the same kind: how many stems and leaves
// they have, how long and how widely spread they are, their overall size, and
// which way they face.
const COUNTS = ['count', 'top', 'tuft', 'topLeaves', 'vines', 'perVine', 'hangs', 'arches', 'perStem', 'nodes'];
const LENGTHS = ['len', 'topLen', 'vineLen', 'h'];

/**
 * A setting that changes as a plant grows up, from [[fullness, value], ...] stops:
 * numbers ease between stops (whole numbers stay whole); anything else switches at
 * each stop.
 */
function stage(stops, full) {
  if (full <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [f0, v0] = stops[i - 1], [f1, v1] = stops[i];
    if (full > f1) continue;
    if (typeof v0 !== 'number') return full >= f1 ? v1 : v0;
    const v = v0 + ((v1 - v0) * (full - f0)) / (f1 - f0);
    return Number.isInteger(v0) && Number.isInteger(v1) ? Math.round(v) : v;
  }
  return stops[stops.length - 1][1];
}

/** Keep the `k` most central of a list of stems, canes or leaf angles, in their order. */
function central(list, k) {
  const off = (v) => Math.abs(typeof v === 'number' ? v : v.x ?? v.a ?? 0);
  const keep = new Set(list.map((v, i) => [off(v), i]).sort((u, v) => u[0] - v[0]).slice(0, k).map(([, i]) => i));
  return list.filter((_, i) => keep.has(i));
}

/**
 * This plant's own take on its species: varied by its seed (no seed, no variation)
 * and grown to its fullness (0 a single leaf, 1 as written, 2 overgrown).
 */
function individual(def, seed, full) {
  const out = { ...def };
  // Many plants change shape as they grow up (def.ages): young monsteras have no
  // splits, young scheffleras fewer leaflets, and so on.
  for (const [k, stops] of Object.entries(def.ages ?? {})) {
    if (k === 'leaf') {
      out.leaf = { ...out.leaf };
      for (const [lk, ls] of Object.entries(stops)) out.leaf[lk] = stage(ls, full);
    } else out[k] = stage(stops, full);
  }
  // Counts scale in the rigs (ctx.n); here, fixed lists of stems lose their outer
  // ones, and trailing stems reach further the fuller the plant.
  for (const k of ['stems', 'canes', 'stalks', 'leafAngles']) {
    if (Array.isArray(def[k]) && full < 1) out[k] = central(def[k], Math.max(1, Math.round(def[k].length * full)));
  }
  const reach = full < 1 ? 0.75 + 0.25 * full : 1 + 0.2 * (full - 1);
  for (const k of ['topLen', 'vineLen']) if (typeof def[k] === 'number') out[k] = def[k] * reach;
  if (!seed) return { def: out, flip: false, size: 1 };
  const s = hashStr(seed);
  const r = (i) => rand(s, i, 'individual');
  COUNTS.forEach((k, i) => {
    if (typeof out[k] === 'number') out[k] = Math.max(k === 'topLeaves' || k === 'tuft' || k === 'nodes' ? 0 : 1, out[k] + Math.round((r(i) - 0.5) * 2.4));
  });
  LENGTHS.forEach((k, i) => {
    const f = 0.88 + 0.24 * r(20 + i);
    if (typeof out[k] === 'number') out[k] *= f;
    else if (Array.isArray(out[k])) out[k] = out[k].map((v) => v * f);
  });
  if (typeof def.spread === 'number') out.spread = def.spread * (0.9 + 0.2 * r(30));
  if (Array.isArray(out.stems)) {
    out.stems = out.stems.map((st, i) => ({ ...st, h: st.h * (0.86 + 0.28 * r(40 + i)), a: st.a + (r(50 + i) - 0.5) * 0.24 }));
  }
  // A jar's moss has to stay put inside the glass, so jars only ever face the other way.
  const size = def.container === 'jar' ? 1 : 0.94 + 0.12 * r(31);
  return { def: out, flip: r(32) < 0.5, size };
}

/**
 * Pups: plants that spread by offsets grow little copies of themselves beside the
 * main clump once they're fuller than usual, up to def.pups of them at 190%.
 */
function pups(def, species, seed, d, ghost, heat, full) {
  const n = def.pups ? Math.round(def.pups * clamp((full - 1) / 0.9, 0, 1)) : 0;
  const first = rand(hashStr(`${species}|${seed}`), 0, 'pupside') < 0.5 ? -1 : 1;
  let s = '';
  for (let j = 0; j < n; j++) {
    const tier = Math.floor(j / 2);
    const x = (j % 2 ? -first : first) * (27 + 8 * tier);
    const sc = 0.58 - 0.1 * tier;
    // A pup is a young plant of its own: juvenile leaves and its own variety.
    const young = individual(SPECIES[species] ?? SPECIES.generic_leafy, `${seed}|pup${j}`, 0.45).def;
    const ctx = makeCtx({ ...young, pups: 0 }, d, ghost, `${species}|${seed}|pup${j}`, heat, 0.45);
    ctx.pup = true;
    const { back = '', front = '' } = RIGS[def.rig](ctx);
    s += `<g transform="translate(${f1(100 + x)} 167) scale(${sc}) translate(-100 -167)">${back}${front}</g>`;
  }
  return s;
}

function makeCtx(def, d, ghost, seedStr, heat = null, full = 1) {
  const seed = hashStr(seedStr);
  const dryHue = def.dryHue ?? 36;
  return {
    p: def,
    d,
    ghost,
    full,
    // Young plants have smaller leaves; mature ones bigger (much bigger for climbing aroids).
    grow: full < 1 ? 0.8 + 0.2 * full : 1 + (def.leafGrowth ?? 0.08) * Math.min(1, full - 1),
    /** How many of something this plant grows at its fullness: `base` as drawn, never fewer than `min`. */
    n: (base, min = 1) => Math.max(min, Math.round(base * full)),
    heat: ghost ? null : heat, // 'sweating' or 'scorching' when the room is too hot
    fallen: [],
    line: ghost ? GHOST_LINE : OUTLINE,
    r: (i, salt = '') => rand(seed, i, salt),
    jit(i, salt, amt) { return (this.r(i, salt) - 0.5) * 2 * amt; },
    fill: (hex, k = 1) => (ghost ? ghostify(hex) : dryColor(hex, clamp(d * k), dryHue)),
    fillD: (hex, dd) => (ghost ? ghostify(hex) : dryColor(hex, clamp(dd), dryHue)),
    /** Dryness at which leaf i falls off (Infinity if it never does). */
    dropAt(i, chance = def.drop ?? 0.35, rank) {
      if (ghost || this.r(i, 'dropc') >= chance) return Infinity;
      const r = this.r(i, 'dropt');
      return 0.3 + 0.7 * (rank == null ? r : 0.65 * rank + 0.35 * r);
    },
    drops(i, chance, rank) { return d > 0 && d >= this.dropAt(i, chance, rank); },
    fell(o) { this.fallen.push(o); },
  };
}

function pickStyle(limbs, seed, def) {
  if (limbs == null || limbs === false) return null;
  const style = typeof limbs === 'object' ? limbs
    : LIMB_STYLES[(typeof limbs === 'number' ? limbs : hashStr(`${def.name}|${seed}`)) % LIMB_STYLES.length];
  // Hanging vines cover a raised arm, so trailing plants keep their hands down.
  if (def.rig === 'trailing' && style.arms.includes('wave')) {
    return { ...style, arms: style.arms.map((a) => (a === 'wave' ? 'tucked' : a)) };
  }
  return style;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * @param {object} o
 * @param {string} o.species   species id from SPECIES (unknown ids fall back to a leafy plant)
 * @param {string} o.potColor  #rrggbb
 * @param {number} o.dryness   0 (watered on time) .. 1 (three days overdue)
 * @param {boolean} o.ghost    past saving
 * @param {string} o.heat     'sweating' or 'scorching' when the room is too hot for it
 * @param {string} o.seed      varies angles between plants of the same species
 * @param {number} o.fullness  % of the usual leaves: 0 a single leaf, 100 as drawn, 200 overgrown
 * @param {string} o.label     accessible name
 * @param {number|object|boolean} o.limbs  arms and feet: true picks a pose from the seed (default), a LIMB_STYLES index or style picks one, false draws none
 * @param {boolean} o.layered  return stacked SVG layers in a <div> instead of one <svg>. Moving
 *   whole layers lets the browser animate on the GPU instead of redrawing every path each frame.
 */
export function drawPlant({
  species, potColor = '#c8643c', dryness = 0, ghost = false, heat = null, seed = '', fullness = 100, label = '', limbs = true,
  layered = false,
} = {}) {
  const full = clamp((Number(fullness) || 0) / 100, 0, 2);
  const { def, flip, size } = individual(SPECIES[species] ?? SPECIES.generic_leafy, seed, full);
  const d = ghost ? 0 : clamp(dryness);
  const ctx = makeCtx(def, d, ghost, `${species}|${seed}`, heat, full);
  const drawn = RIGS[def.rig](ctx);
  // Pups stand behind the main clump, except under big leaves held up on stalks,
  // which would hide them; there they go in front (still behind the pot's rim).
  const young = pups(def, species, seed, d, ghost, heat, full);
  const back = def.rig === 'upright_leaf' || def.form === 'bird' ? (drawn.back ?? '') + young : young + (drawn.back ?? '');
  const front = drawn.front ?? '';
  const state = ghost ? 'pt-ghost' : d === 0 ? 'pt-happy' : 'pt-dry';
  const delay = `animation-delay:-${(ctx.r(0, 'sway') * 5.5).toFixed(2)}s`;
  const k = +((def.scale ?? 1) * size).toFixed(3);
  const scale = k !== 1 || flip ? ` transform="translate(100 167) scale(${flip ? -k : k} ${k}) translate(-100 -167)"` : '';
  const style = pickStyle(limbs, seed, def);
  const plantOpacity = ghost ? ' opacity=".88"' : '';
  // Plants sway; moss shut in a jar doesn't (def.still).
  const sway = def.still ? '' : ' class="pt-sway"';
  const layer = (body) => (body ? `<g${sway} style="${delay}"${plantOpacity}><g${scale}>${body}</g></g>` : '');
  const feet = style ? drawFeet(ctx, style, potColor) : '';
  const arms = style ? drawArms(ctx, style, potColor) : [];
  const stillArms = arms.filter((a) => !a.waving).map((a) => a.svg).join('');
  const wavingArms = arms.filter((a) => a.waving);
  // A pot hides the arms' roots behind its rim; a see-through jar has to be drawn over them.
  const jar = def.container === 'jar';
  const [back0, front0] = jar ? [jarBack, jarFront] : [potBack, potFront];
  const floor = ground(ctx);
  const inside = back0(ctx, potColor);
  const pot = `${front0(ctx, potColor)}${feet}${heatHaze(ctx)}`;
  const aria = `role="img" aria-label="${esc(label || def.name)}"`;

  if (!layered) {
    const wave = wavingArms.map((a) => `<g class="pt-wave" style="transform-origin:${a.origin[0]}px ${a.origin[1]}px">${a.svg}</g>`).join('');
    const body = jar
      ? `${floor}${stillArms}${wave}${inside}${layer(back)}${pot}${layer(front)}`
      : `${floor}${inside}${layer(back)}${stillArms}${wave}${pot}${layer(front)}`;
    return `<svg class="pt-art ${state}" viewBox="0 0 200 248" xmlns="http://www.w3.org/2000/svg" ${aria}><g class="pt-float">${body}</g></svg>`;
  }

  // Same drawing as separate stacked SVGs, in paint order.
  const svg = (body, cls = '', css = '') => (body
    ? `<svg class="pt-layer${cls}" viewBox="0 0 200 248" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${css ? ` style="${css}"` : ''}>${body}</svg>`
    : '');
  const plant = (body) => svg(scale ? `<g${scale}>${body}</g>` : body, def.still ? '' : ' pt-lsway', `${delay}${ghost ? ';opacity:.88' : ''}`);
  const pct = ([x, y]) => `${((x / 200) * 100).toFixed(2)}% ${((y / 248) * 100).toFixed(2)}%`;
  const wave = wavingArms.map((a) => svg(a.svg, ' pt-lwave', `transform-origin:${pct(a.origin)}`)).join('');
  const layers = jar
    ? `${svg(floor)}${svg(stillArms)}${wave}${svg(inside)}${plant(back)}${svg(pot)}${plant(front)}`
    : `${svg(floor + inside)}${plant(back)}${svg(stillArms)}${wave}${svg(pot)}${plant(front)}`;
  return `<div class="pt-stack ${state}" ${aria}>${layers}</div>`;
}

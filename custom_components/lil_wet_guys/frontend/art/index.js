// Entry point: drawPlant() turns a species + pot colour + dryness into SVG.

import { GHOST_LINE, OUTLINE, clamp, dryColor, ghostify } from './color.js';
import { LIMB_STYLES, drawArms, drawFeet } from './limbs.js';
import { potBack, potFront, ground } from './pot.js';
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

function makeCtx(def, d, ghost, seedStr) {
  const seed = hashStr(seedStr);
  const dryHue = def.dryHue ?? 36;
  return {
    p: def,
    d,
    ghost,
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
 * @param {string} o.seed      varies angles between plants of the same species
 * @param {string} o.label     accessible name
 * @param {number|object|boolean} o.limbs  arms and feet: true picks a pose from the seed (default), a LIMB_STYLES index or style picks one, false draws none
 * @param {boolean} o.layered  return stacked SVG layers in a <div> instead of one <svg>. Moving
 *   whole layers lets the browser animate on the GPU instead of redrawing every path each frame.
 */
export function drawPlant({
  species, potColor = '#c8643c', dryness = 0, ghost = false, seed = '', label = '', limbs = true, layered = false,
} = {}) {
  const def = SPECIES[species] ?? SPECIES.generic_leafy;
  const d = ghost ? 0 : clamp(dryness);
  const ctx = makeCtx(def, d, ghost, `${species}|${seed}`);
  const { back = '', front = '' } = RIGS[def.rig](ctx);
  const state = ghost ? 'pt-ghost' : d === 0 ? 'pt-happy' : 'pt-dry';
  const delay = `animation-delay:-${(ctx.r(0, 'sway') * 5.5).toFixed(2)}s`;
  const scale = def.scale && def.scale !== 1 ? ` transform="translate(100 167) scale(${def.scale}) translate(-100 -167)"` : '';
  const style = pickStyle(limbs, seed, def);
  const plantOpacity = ghost ? ' opacity=".88"' : '';
  const layer = (body) => (body ? `<g class="pt-sway" style="${delay}"${plantOpacity}><g${scale}>${body}</g></g>` : '');
  const feet = style ? drawFeet(ctx, style, potColor) : '';
  const arms = style ? drawArms(ctx, style, potColor) : [];
  const stillArms = arms.filter((a) => !a.waving).map((a) => a.svg).join('');
  const wavingArms = arms.filter((a) => a.waving);
  const base = `${ground(ctx)}${potBack(ctx, potColor)}`;
  const pot = `${potFront(ctx, potColor)}${feet}`;
  const aria = `role="img" aria-label="${esc(label || def.name)}"`;

  if (!layered) {
    const wave = wavingArms.map((a) => `<g class="pt-wave" style="transform-origin:${a.origin[0]}px ${a.origin[1]}px">${a.svg}</g>`).join('');
    return `<svg class="pt-art ${state}" viewBox="0 0 200 248" xmlns="http://www.w3.org/2000/svg" ${aria}>`
      + `<g class="pt-float">${base}${layer(back)}${stillArms}${wave}${pot}${layer(front)}</g></svg>`;
  }

  // Same drawing as separate stacked SVGs, in paint order.
  const svg = (body, cls = '', css = '') => (body
    ? `<svg class="pt-layer${cls}" viewBox="0 0 200 248" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${css ? ` style="${css}"` : ''}>${body}</svg>`
    : '');
  const plant = (body) => svg(scale ? `<g${scale}>${body}</g>` : body, ' pt-lsway', `${delay}${ghost ? ';opacity:.88' : ''}`);
  const pct = ([x, y]) => `${((x / 200) * 100).toFixed(2)}% ${((y / 248) * 100).toFixed(2)}%`;
  const wave = wavingArms.map((a) => svg(a.svg, ' pt-lwave', `transform-origin:${pct(a.origin)}`)).join('');
  return `<div class="pt-stack ${state}" ${aria}>${svg(base)}${plant(back)}${svg(stillArms)}${wave}${svg(pot)}${plant(front)}</div>`;
}

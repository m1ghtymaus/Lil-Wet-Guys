// Optional arms and feet in the pot's colour, like a sitting planter figure:
// two oval soles peek out from under the front of the pot, and chunky nub arms
// come out of the sides with rounded ends. Styles only nudge the pose. Dryness
// lets the arms hang and the feet flop outward; ghosts have no feet and let
// their arms hang.

import { clamp, lerp, luminance, shade } from './color.js';
import { f1 } from './geom.js';

const SHOULDER = [136, 210]; // right side; the left mirrors

// Right-side positions; a style may give the left side its own, otherwise it mirrors.
const ARM = {
  rest: { elbow: [150, 212], hand: [151, 229] },
  wave: { elbow: [152, 207], hand: [156, 193] },
  tucked: { elbow: [147, 216], hand: [144, 231] },
  wide: { elbow: [152, 213], hand: [156, 227] },
};
const FEET = {
  normal: { foot: [114, 231], tilt: 14 },
  close: { foot: [111, 231.5], tilt: 8 },
  wide: { foot: [118, 230], tilt: 24 },
  raised: { foot: [116, 227], tilt: 32 },
};
const LIMP = { elbow: [145, 217], hand: [143, 232] };
const FLOP = { foot: [119, 232.5], tilt: 50 };

export const LIMB_STYLES = [
  { arms: ['rest', 'rest'], feet: ['normal', 'normal'] },
  { arms: ['rest', 'wave'], feet: ['normal', 'normal'] },
  { arms: ['tucked', 'tucked'], feet: ['close', 'close'] },
  { arms: ['wide', 'wide'], feet: ['wide', 'wide'] },
  { arms: ['tucked', 'rest'], feet: ['normal', 'raised'] },
];

const ease = (t) => t * t * (3 - 2 * t);
/** Limbs match the pot, lifted a little on dark pots so they stay visible. */
const limbColor = (pot) => (luminance(pot) < 0.2 ? shade(pot, 0.16) : shade(pot, -0.03));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const mirror = ([x, y], sd) => (sd > 0 ? [x, y] : [200 - x, y]);
const add = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k];

/**
 * Optional per-side nudges on top of a style, written for the right side
 * (positive x = outward) and mirrored for the left:
 * { L: { arm: [dx, dy], foot: [dx, dy], tilt }, R: { ... } }.
 */
const nudgeFor = (style, i) => style.nudge?.[i === 0 ? 'L' : 'R'];

function stub(ctx, d, color, w) {
  return `<path d="${d}" fill="none" stroke="${ctx.line}" stroke-width="${w + 2.8}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Oval soles peeking out from under the front of the pot. */
export function drawFeet(ctx, style, potColor) {
  if (ctx.ghost) return '';
  const color = shade(limbColor(potColor), 0.05);
  const k = ease(clamp(ctx.d * 1.2));
  let s = '';
  style.feet.forEach((name, i) => {
    const sd = i === 0 ? -1 : 1;
    const f = FEET[name];
    const n = nudgeFor(style, i);
    const [x, y] = mirror(n ? add(mix(f.foot, FLOP.foot, k), n.foot) : mix(f.foot, FLOP.foot, k), sd);
    const tilt = sd * (lerp(f.tilt, FLOP.tilt, k) + (n?.tilt ?? 0));
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="6.6" ry="8.2" transform="rotate(${f1(tilt)} ${f1(x)} ${f1(y)})" `
      + `fill="${color}" stroke="${ctx.line}" stroke-width="1.9"/>`;
  });
  return s;
}

/**
 * Nub arms with rounded ends, coming out from behind the pot. Ghosts let theirs hang.
 * Returns one part per arm: { svg, waving, origin: [x, y] } (origin = the shoulder).
 */
export function drawArms(ctx, style, potColor) {
  const color = ctx.ghost ? ctx.fill(potColor) : limbColor(potColor);
  const k = ctx.ghost ? 1 : ease(clamp(ctx.d * 1.3));
  const parts = [];
  style.arms.forEach((name, i) => {
    const sd = i === 0 ? -1 : 1;
    const pose = ARM[name];
    const [sx, sy] = mirror(SHOULDER, sd);
    const n = nudgeFor(style, i);
    const elbow = mix(pose.elbow, LIMP.elbow, k);
    const hand = mix(pose.hand, LIMP.hand, k);
    const [ex, ey] = mirror(n ? add(elbow, n.arm, 0.5) : elbow, sd);
    const [hx, hy] = mirror(n ? add(hand, n.arm) : hand, sd);
    const svg = stub(ctx, `M${sx} ${sy}Q${f1(ex)} ${f1(ey)} ${f1(hx)} ${f1(hy)}`, color, 9.5);
    parts.push({ svg, waving: name === 'wave' && ctx.d === 0 && !ctx.ghost, origin: [sx, sy] });
  });
  return parts;
}

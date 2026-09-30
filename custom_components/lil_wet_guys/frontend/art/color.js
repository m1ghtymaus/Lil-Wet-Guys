// Colour helpers for the plant drawings. Everything works on #rrggbb strings.

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const OUTLINE = '#2f2a26';
export const GHOST_LINE = '#9aa3cf';
const GHOST_BASE = '#f4f6ff';

export function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => lerp(v, B[i], clamp(t))));
}

/** Lighten (positive) or darken (negative) by shifting HSL lightness. */
export function shade(hex, amount) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, s, clamp(l + amount)]));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Dry a living colour out: hue slides toward straw/brown (or a species'
 * stress colour), saturation drops and lightness drifts toward the middle.
 */
export function dryColor(hex, d, dryHue = 36) {
  if (d <= 0) return hex;
  const t = Math.pow(clamp(d), 0.8);
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  let dh = ((dryHue - h + 540) % 360) - 180; // shortest way round the wheel
  return rgbToHex(hslToRgb([h + dh * t, s * (1 - 0.42 * t), l + (0.55 - l) * 0.3 * t]));
}

export const ghostify = (hex) => mix(GHOST_BASE, hex, 0.14);

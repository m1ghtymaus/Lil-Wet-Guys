// Geometry helpers. Angles are radians measured from straight up, clockwise
// positive, so 0 = up, PI/2 = right, PI = down (matches SVG rotate()).

export const BX = 100; // where stems leave the soil
export const BY = 167;

export const f1 = (v) => Math.round(v * 10) / 10;
export const deg = (a) => f1(a * 57.29578);
export const sgn = (v) => (v < 0 ? -1 : 1);
export const dirv = (a) => [Math.sin(a), -Math.cos(a)];
/** Unit normal pointing to the right of travel. */
export const normal = (a) => [Math.cos(a), Math.sin(a)];

/** Bend an angle toward hanging straight down by fraction t. */
export const droopTo = (a, t) => a + (sgn(a) * Math.PI - a) * Math.min(1, Math.max(0, t));

/**
 * Walk a stem: starts at (x, y) heading a0 and ends heading a1, with the
 * turning concentrated toward the tip when ease > 1.
 */
export function curve(x, y, a0, a1, len, n = 10, ease = 1.3) {
  const pts = [{ x, y, a: a0 }];
  const step = len / n;
  let cx = x, cy = y;
  for (let i = 1; i <= n; i++) {
    const a = a0 + (a1 - a0) * Math.pow((i - 0.5) / n, ease);
    cx += Math.sin(a) * step;
    cy -= Math.cos(a) * step;
    pts.push({ x: cx, y: cy, a: a0 + (a1 - a0) * Math.pow(i / n, ease) });
  }
  return pts;
}

/** Point (with heading) a fraction t of the way along a walked stem. */
export function at(pts, t) {
  const f = Math.min(1, Math.max(0, t)) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i, p = pts[i], q = pts[i + 1];
  return { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u, a: p.a + (q.a - p.a) * u };
}

/** Resample the stretch of a stem between t0 and t1. */
export function sub(pts, t0, t1 = 1, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(at(pts, t0 + ((t1 - t0) * i) / n));
  return out;
}

/** Offset a point sideways (right of travel) by `off`. */
export function side(p, off) {
  const [nx, ny] = normal(p.a);
  return [p.x + nx * off, p.y + ny * off];
}

/** Smooth path through points (Catmull-Rom as cubic Béziers). */
export function smooth(points, closed = false) {
  const P = points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]));
  const n = P.length;
  if (n < 2) return '';
  const get = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(P[0][0])} ${f1(P[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} `
      + `${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} `
      + `${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/**
 * Closed outline of a strap-like leaf that follows a walked stem.
 * width(t) gives the full width at fraction t; tip is 'point', 'round' or 'flat'.
 */
export function ribbon(pts, width, tip = 'point') {
  const n = pts.length - 1;
  const L = [], R = [];
  pts.forEach((p, i) => {
    const w = Math.max(0.2, width(i / n)) / 2;
    L.push(side(p, -w));
    R.push(side(p, w));
  });
  const end = pts[n];
  const [dx, dy] = dirv(end.a);
  const out = [...L];
  if (tip === 'point') out.push([end.x + dx * 2.5, end.y + dy * 2.5]);
  else if (tip === 'round') {
    const w = Math.max(0.5, width(1)) / 2;
    out.push([end.x + dx * w * 0.95, end.y + dy * w * 0.95]);
  }
  out.push(...R.reverse());
  return smooth(out, true);
}

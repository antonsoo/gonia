/** Geometry of a Vitruvian screw and an ideal filled bucket. Length unit: outer radius. */
export const TAU = 2 * Math.PI;
export type ScrewUnits = "digits" | "twelfths";
export interface ScrewState {
  units: ScrewUnits;
  starts: 1 | 2 | 4 | 8;
  lead: number;
  sourceSlope: boolean;
  angle: number;
  turn: number;
  cut: number;
  step: number;
  passage: number;
  page: string;
}
export const screwInitial: Readonly<ScrewState> = {
  units: "digits",
  starts: 8,
  lead: 100,
  sourceSlope: true,
  angle: 370,
  turn: 0,
  cut: 500,
  step: 3,
  passage: 0,
  page: "237",
};
export const screwPages = ["title", "062", "237", "238", "239"] as const;
export interface ScrewGeometry {
  length: number;
  inner: number;
  outer: number;
  circumference: number;
  pitch: number;
  interval: number;
  spacing: number;
  slope: number;
  angle: number;
  sin: number;
  cos: number;
  lambda: number;
  starts: number;
  phase: number;
}
export function screwGeometry(s: ScrewState): ScrewGeometry {
  // X.6: outer diameter L/8. III.1.8 supplies sixteen digits per foot.
  const length = 16,
    outer = 1;
  const inner = s.units === "digits" ? 1 / 2 : 2 / 3;
  const circumference = TAU * inner,
    pitch = (circumference * s.lead) / 100;
  const angle = s.sourceSlope ? Math.atan2(3, 4) : ((s.angle / 10) * Math.PI) / 180;
  const sin = s.sourceSlope ? 3 / 5 : Math.sin(angle);
  const cos = s.sourceSlope ? 4 / 5 : Math.cos(angle);
  const slope = s.sourceSlope ? 3 / 4 : sin / cos;
  return {
    length,
    inner,
    outer,
    circumference,
    pitch,
    interval: circumference / 8,
    spacing: pitch / s.starts,
    slope,
    angle,
    sin,
    cos,
    lambda: (slope * pitch) / TAU,
    starts: s.starts,
    phase: (-s.turn / 180) * Math.PI,
  };
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export interface BucketGeometry {
  rho: number;
  lambda: number;
  delta: number;
  start: number;
  end: number;
  intercept: number;
  regime: "shaft" | "outer" | "none";
}
export function bucketGeometry(rho: number, lambda: number, starts: number): BucketGeometry {
  if (
    !Number.isFinite(rho) ||
    rho <= 0 ||
    rho >= 1 ||
    !Number.isFinite(lambda) ||
    lambda <= 0 ||
    !Number.isInteger(starts) ||
    starts < 1 ||
    starts > 8
  )
    throw new Error("Expected 0 < inner radius < 1, positive pitch ratio and one to eight starts.");
  const start = lambda < rho ? Math.acos(-lambda / rho) : Math.PI;
  const delta = TAU / starts,
    intercept = rho * Math.sin(start) + lambda * start;
  let end = start;
  if (lambda < 1) {
    const bottom = (3 * Math.PI) / 2,
      levelAtBottom = (intercept + 1) / lambda;
    // Restrict integration to the connected wet support. In particular, a
    // nearly vertical spill condition must not hide a tiny bucket between
    // the initial samples of a much larger, mostly empty interval.
    if (levelAtBottom < bottom) {
      let lo = TAU - Math.acos(-lambda),
        hi = bottom;
      for (let i = 0; i < 64; i++) {
        const m = (lo + hi) / 2;
        if (Math.sin(m) + lambda * m > intercept) hi = m;
        else lo = m;
      }
      end = (lo + hi) / 2;
    } else if (levelAtBottom <= bottom + delta) end = levelAtBottom;
    else {
      // At shallow slopes the trailing tip can still lie above the shaft
      // axis. Then the last water touches the INNER blade edge, not the
      // outside casing. Selecting the outside root truncates this wet tip.
      const innerTip = intercept - lambda * (TAU + delta) > 0;
      const radius = innerTip ? rho : 1;
      let lo = innerTip ? TAU + delta : bottom + delta,
        hi = innerTip ? TAU + start + delta : TAU + delta;
      for (let i = 0; i < 64; i++) {
        const m = (lo + hi) / 2;
        if (radius * Math.sin(m - delta) + lambda * m > intercept) hi = m;
        else lo = m;
      }
      end = (lo + hi) / 2;
    }
  }
  return {
    rho,
    lambda,
    delta,
    start,
    end,
    intercept,
    regime: lambda >= 1 ? "none" : lambda < rho ? "shaft" : "outer",
  };
}
export const waterLevel = (b: BucketGeometry, phi: number): number => b.intercept - b.lambda * phi;
/** Select the one connected bucket around the first bottom, excluding its neighbours. */
export function bucketAngles(b: BucketGeometry, phi: number): readonly [number, number] | null {
  if (b.regime === "none" || phi < b.start || phi > b.end) return null;
  const w = waterLevel(b, phi);
  if (w <= -1) return null;
  const theta = Math.asin(clamp(w >= 0 ? w / b.rho : w, -1, 1));
  const low = Math.max(phi - b.delta, Math.PI - theta);
  const high = Math.min(phi, TAU + theta);
  return high > low ? [low, high] : null;
}
export function wetRadii(
  b: BucketGeometry,
  phi: number,
  theta: number,
): readonly [number, number] | null {
  const w = waterLevel(b, phi),
    sine = Math.sin(theta);
  let lo = b.rho,
    hi = 1;
  if (w >= 0) {
    if (sine > 0) hi = Math.min(1, w / sine);
  } else {
    if (sine >= 0) return null;
    lo = Math.max(b.rho, w / sine);
  }
  return hi + 1e-12 >= lo ? [Math.min(lo, hi), hi] : null;
}
/** Exact radial integration; split angular arcs at every change of clipped boundary. */
export function bucketSection(b: BucketGeometry, phi: number): number {
  const range = bucketAngles(b, phi);
  if (!range) return 0;
  const [low, high] = range,
    w = waterLevel(b, phi),
    cuts = [low, high];
  for (const value of [w, w / b.rho]) {
    if (Math.abs(value) >= 1) continue;
    const a = Math.asin(value);
    for (let k = -1; k <= 2; k++)
      for (const point of [a + TAU * k, Math.PI - a + TAU * k])
        if (point > low && point < high) cuts.push(point);
  }
  for (let k = 1; k <= 4; k++) {
    const point = (k * Math.PI) / 2;
    if (point > low && point < high) cuts.push(point);
  }
  cuts.sort((a, c) => a - c);
  let area = 0;
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1],
      c = cuts[i];
    if (a === undefined || c === undefined || c - a < 1e-13) continue;
    const sine = Math.sin((a + c) / 2),
      span = c - a;
    if (w >= 0) {
      area +=
        sine <= w
          ? ((1 - b.rho ** 2) * span) / 2
          : (-w * w * (1 / Math.tan(c) - 1 / Math.tan(a)) - b.rho ** 2 * span) / 2;
    } else {
      if (sine >= 0) continue;
      area +=
        w / sine <= b.rho
          ? ((1 - b.rho ** 2) * span) / 2
          : (span + w * w * (1 / Math.tan(c) - 1 / Math.tan(a))) / 2;
    }
  }
  return clamp(area, 0, Math.PI * (1 - b.rho ** 2));
}
export interface Integral {
  value: number;
  error: number;
  evaluations: number;
  converged: boolean;
}
/** Adaptive Simpson integration with an explicit remaining-error estimate. */
export function integrate(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tolerance = 1e-9,
): Integral {
  let evaluations = 0;
  const sample = (x: number) => {
    evaluations++;
    return f(x);
  };
  const recurse = (
    a: number,
    c: number,
    fa: number,
    fm: number,
    fc: number,
    whole: number,
    eps: number,
    depth: number,
  ): Integral => {
    const m = (a + c) / 2,
      fl = sample((a + m) / 2),
      fr = sample((m + c) / 2);
    const left = ((m - a) / 6) * (fa + 4 * fl + fm),
      right = ((c - m) / 6) * (fm + 4 * fr + fc);
    const delta = left + right - whole,
      error = Math.abs(delta) / 15;
    if (error <= eps || depth === 0)
      return { value: left + right + delta / 15, error, evaluations: 0, converged: error <= eps };
    const l = recurse(a, m, fa, fl, fm, left, eps / 2, depth - 1),
      r = recurse(m, c, fm, fr, fc, right, eps / 2, depth - 1);
    return {
      value: l.value + r.value,
      error: l.error + r.error,
      evaluations: 0,
      converged: l.converged && r.converged,
    };
  };
  // A coarse partition prevents a narrow wet interval from falling between all
  // initial Simpson samples and being mistaken for an identically empty bucket.
  let value = 0,
    error = 0,
    converged = true;
  const pieces = 48;
  for (let i = 0; i < pieces; i++) {
    const a = lo + ((hi - lo) * i) / pieces,
      c = lo + ((hi - lo) * (i + 1)) / pieces;
    const fa = sample(a),
      fm = sample((a + c) / 2),
      fc = sample(c);
    const result = recurse(
      a,
      c,
      fa,
      fm,
      fc,
      ((c - a) * (fa + 4 * fm + fc)) / 6,
      tolerance / pieces,
      16,
    );
    value += result.value;
    error += result.error;
    converged &&= result.converged;
  }
  return { value, error, converged, evaluations };
}
export interface BucketCapacity {
  bucket: BucketGeometry;
  fraction: number;
  perTurn: number;
  oneBucket: number;
  error: number;
  evaluations: number;
  converged: boolean;
}
const capacityCache = new Map<string, BucketCapacity>();
export function screwCapacity(g: ScrewGeometry): BucketCapacity {
  const key = `${g.inner},${g.lambda},${g.starts},${g.pitch}`;
  const found = capacityCache.get(key);
  if (found) return found;
  const bucket = bucketGeometry(g.inner, g.lambda, g.starts);
  const result =
    bucket.regime === "none"
      ? { value: 0, error: 0, evaluations: 0, converged: true }
      : integrate((phi) => bucketSection(bucket, phi), bucket.start, bucket.end);
  const fraction = (g.starts * result.value) / (TAU * Math.PI);
  const perTurn = fraction * Math.PI * g.pitch;
  const capacity = {
    bucket,
    fraction,
    perTurn,
    oneBucket: perTurn / g.starts,
    error: (g.starts * result.error) / (TAU * Math.PI),
    evaluations: result.evaluations,
    converged: result.converged,
  };
  if (capacityCache.size > 120) capacityCache.clear();
  capacityCache.set(key, capacity);
  return capacity;
}
export type ScrewPoint = readonly [number, number, number];
/** Axis distance and radial position to world coordinates. World z is vertical. */
export function screwPoint(g: ScrewGeometry, x: number, radius: number, theta: number): ScrewPoint {
  return [
    x * g.cos - radius * Math.sin(theta) * g.sin,
    radius * Math.cos(theta),
    x * g.sin + radius * Math.sin(theta) * g.cos,
  ];
}
export function bladePoint(g: ScrewGeometry, x: number, radius: number, start: number): ScrewPoint {
  return screwPoint(g, x, radius, (TAU * x) / g.pitch + g.phase + (start * TAU) / g.starts);
}
export function bucketPosition(g: ScrewGeometry, phi: number): number {
  return (g.pitch * (phi - g.phase)) / TAU;
}
/** One cross-section of the selected bucket, suitable for a simple polygon. */
export function bucketOutline(
  b: BucketGeometry,
  phi: number,
  count = 120,
): readonly (readonly [number, number])[] {
  const angles = bucketAngles(b, phi);
  if (!angles) return [];
  const inner: [number, number][] = [],
    outer: [number, number][] = [];
  const samples = Array.from(
    { length: count + 1 },
    (_, i) => angles[0] + ((angles[1] - angles[0]) * i) / count,
  );
  const w = waterLevel(b, phi);
  // Include every circle/waterline junction exactly. Uniform angular samples
  // alone can cut a corner off a narrow, nearly horizontal shoreline.
  for (const ratio of [w, w / b.rho])
    if (Math.abs(ratio) <= 1) {
      const a = Math.asin(ratio);
      for (let k = -1; k <= 2; k++)
        for (const theta of [a + TAU * k, Math.PI - a + TAU * k])
          if (theta > angles[0] && theta < angles[1]) samples.push(theta);
    }
  samples.sort((a, c) => a - c);
  for (const theta of samples) {
    const radii = wetRadii(b, phi, theta);
    if (!radii) continue;
    inner.push([radii[0] * Math.cos(theta), radii[0] * Math.sin(theta)]);
    outer.push([radii[1] * Math.cos(theta), radii[1] * Math.sin(theta)]);
  }
  return [...outer, ...inner.reverse()];
}
export function screwPhi(s: ScrewState, b: BucketGeometry): number {
  return b.start + ((b.end - b.start) * s.cut) / 1000;
}
export function validateScrew(s: ScrewState): void {
  if (s.units !== "digits" && s.units !== "twelfths") throw new Error("Unknown foot division.");
  if (![1, 2, 4, 8].includes(s.starts)) throw new Error("Choose one, two, four or eight starts.");
  if (typeof s.sourceSlope !== "boolean") throw new Error("The slope choice must be boolean.");
  for (const [key, lo, hi] of [
    ["lead", 50, 150],
    ["angle", 150, 750],
    ["turn", 0, 360],
    ["cut", 0, 1000],
    ["step", 0, 5],
    ["passage", 0, 11],
  ] as const)
    if (!Number.isInteger(s[key]) || s[key] < lo || s[key] > hi)
      throw new Error(`The ${key} setting is outside this workshop's range.`);
  if (!screwPages.includes(s.page as (typeof screwPages)[number]))
    throw new Error("Unknown source page.");
}
export function screwQuery(s: ScrewState): string {
  validateScrew(s);
  return `?${new URLSearchParams(Object.entries(s).map(([key, value]) => [key, String(value)]))}`;
}
export function parseScrew(query: string): ScrewState {
  if (query.length > 400) throw new Error("This experiment link is too long.");
  const p = new URLSearchParams(query),
    s = { ...screwInitial };
  for (const key of p.keys())
    if (!Object.hasOwn(s, key) || p.getAll(key).length !== 1)
      throw new Error("Unknown or repeated experiment settings.");
  const units = p.get("units");
  if (units !== null) {
    if (units !== "digits" && units !== "twelfths") throw new Error("Unknown foot division.");
    s.units = units;
  }
  const starts = p.get("starts");
  if (starts !== null) {
    if (!["1", "2", "4", "8"].includes(starts)) throw new Error("Invalid start count.");
    s.starts = Number(starts) as ScrewState["starts"];
  }
  const sourceSlope = p.get("sourceSlope");
  if (sourceSlope !== null) {
    if (sourceSlope !== "true" && sourceSlope !== "false") throw new Error("Invalid slope choice.");
    s.sourceSlope = sourceSlope === "true";
  }
  for (const key of ["lead", "angle", "turn", "cut", "step", "passage"] as const) {
    const raw = p.get(key);
    if (raw !== null) {
      if (!/^\d{1,4}$/.test(raw)) throw new Error("Use bounded whole numbers in experiment links.");
      s[key] = Number(raw);
    }
  }
  const page = p.get("page");
  if (page !== null) s.page = page;
  validateScrew(s);
  return s;
}

/** A symmetric, two-dimensional rigid-block experiment. Length unit: half-span.
 * Force unit W: the arch's own weight, renormalized to 1 for every geometry.
 * No tension, unlimited compression; sliding either excluded or limited by Coulomb friction.
 */
export const STONES = 13;
export const PIER_HEIGHT = 1;
export interface ArchState {
  rise: number;
  thickness: number;
  load: number;
  loading: "crown" | "shoulders";
  width: number;
  mass: number;
  thrust: number;
  bearing: number;
  joint: number;
  page: number;
  /** null retains the original no-sliding idealization; finite values are illustrative. */
  friction: number | null;
}
export const ARCH_DEFAULT: ArchState = {
  rise: 100,
  thickness: 24,
  load: 100,
  loading: "crown",
  width: 50,
  mass: 100,
  thrust: 0.655,
  bearing: 96,
  joint: 3,
  page: 0,
  friction: null,
};
export interface Point {
  x: number;
  y: number;
}
export interface ArchStone {
  index: number;
  left: number;
  right: number;
  centre: Point;
  weight: number;
}
export interface ArchJoint {
  index: number;
  angle: number;
  inner: Point;
  outer: Point;
  vertical: number;
  loadMoment: number;
}
export interface ArchGeometry {
  radius: number;
  cy: number;
  inner: number;
  outer: number;
  stones: ArchStone[];
  joints: ArchJoint[];
  vertical: number;
}
export interface Bound {
  a: number;
  b: number;
  label: string;
}
export interface Domain {
  lower: Bound[];
  upper: Bound[];
  min: number;
  max: number;
  feasible: boolean;
  minFrom: string;
  maxFrom: string;
}
export const pointAt = (radius: number, angle: number, cy: number): Point => ({
  x: radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle),
});

export function archGeometry(s: ArchState): ArchGeometry {
  const f = s.rise / 100,
    t = s.thickness / 100;
  const radius = (1 + f * f) / (2 * f),
    cy = f - radius;
  const inner = radius - t / 2,
    outer = radius + t / 2;
  const end = Math.atan2(-cy, 1),
    start = Math.PI - end;
  const delta = (start - end) / STONES;
  // Exact area centroid of an annular sector, not its mid-curve point.
  const rc =
    (4 * Math.sin(delta / 2) * (outer ** 3 - inner ** 3)) / (3 * delta * (outer ** 2 - inner ** 2));
  const stones = Array.from({ length: STONES }, (_, i) => {
    const left = start - i * delta,
      right = start - (i + 1) * delta;
    const extra =
      s.loading === "crown" ? (i === 6 ? s.load / 100 : 0) : i === 3 || i === 9 ? s.load / 200 : 0;
    return {
      index: i + 1,
      left,
      right,
      centre: pointAt(rc, (left + right) / 2, cy),
      weight: 1 / STONES + extra,
    };
  });
  const vertical = (1 + s.load / 100) / 2;
  let passedWeight = 0,
    loadMoment = 0;
  const joints = Array.from({ length: STONES + 1 }, (_, index) => {
    const angle = start - index * delta;
    const joint = {
      index,
      angle,
      inner: pointAt(inner, angle, cy),
      outer: pointAt(outer, angle, cy),
      vertical: vertical - passedWeight,
      loadMoment,
    };
    const stone = stones[index];
    if (stone) {
      passedWeight += stone.weight;
      loadMoment += stone.weight * stone.centre.x;
    }
    return joint;
  });
  return { radius, cy, inner, outer, stones, joints, vertical };
}

/** Eliminate C from all lower(H) <= C <= upper(H), without a search grid or H cap. */
export function boundDomain(lower: Bound[], upper: Bound[], inequalities: Bound[] = []): Domain {
  let min = 0,
    max = Number.POSITIVE_INFINITY,
    impossible = false;
  let minFrom = "positive horizontal compression",
    maxFrom = "unbounded";
  // Each direct inequality is a H <= b. Friction has no dependence on C.
  const constrain = ({ a, b, label }: Bound) => {
    if (Math.abs(a) < 1e-12) {
      if (b < -1e-12) {
        impossible = true;
        minFrom = label;
      }
    } else if (a > 0 && b / a < max) {
      max = b / a;
      maxFrom = label;
    } else if (a < 0 && b / a > min) {
      min = b / a;
      minFrom = label;
    }
  };
  for (const l of lower)
    for (const u of upper)
      constrain({ a: l.a - u.a, b: u.b - l.b, label: `${l.label} / ${u.label}` });
  for (const inequality of inequalities) constrain(inequality);
  return {
    lower,
    upper,
    min,
    max,
    feasible: !impossible && max > 0 && min <= max + 1e-10,
    minFrom,
    maxFrom,
  };
}

export function archDomain(s: ArchState, g = archGeometry(s), includePiers = false): Domain {
  const lower = g.joints.map((j) => ({
    a: j.inner.y,
    b: -j.vertical * j.inner.x - j.loadMoment,
    label: `joint ${j.index}, inner edge`,
  }));
  const upper = g.joints.map((j) => ({
    a: j.outer.y,
    b: -j.vertical * j.outer.x - j.loadMoment,
    label: `joint ${j.index}, outer edge`,
  }));
  if (includePiers) {
    const halfWidth = s.width / 200,
      pierWeight = s.mass / 100;
    lower.push({
      a: -PIER_HEIGHT,
      b: g.vertical - halfWidth * (g.vertical + pierWeight),
      label: "pier base, inner edge",
    });
    upper.push({
      a: -PIER_HEIGHT,
      b: g.vertical + halfWidth * (g.vertical + pierWeight),
      label: "pier base, outer edge",
    });
  }
  const inequalities: Bound[] = [];
  if (s.friction !== null) {
    const mu = s.friction;
    for (const j of g.joints) {
      const sin = Math.sin(j.angle),
        cos = Math.cos(j.angle);
      // N = H sin(theta) - Q cos(theta); T = H cos(theta) + Q sin(theta).
      // Both signs of shear must satisfy |T| <= mu N.
      for (const sign of [1, -1])
        inequalities.push({
          a: sign * cos - mu * sin,
          b: -j.vertical * (sign * sin + mu * cos),
          label: `joint ${j.index}, friction (${sign > 0 ? "+T" : "-T"})`,
        });
    }
    if (includePiers)
      inequalities.push({
        a: 1,
        b: mu * (g.vertical + s.mass / 100),
        label: "pier base, friction",
      });
  }
  return boundDomain(lower, upper, inequalities);
}
export function interceptInterval(d: Domain, thrust: number) {
  return {
    min: Math.max(...d.lower.map((b) => b.a * thrust + b.b)),
    max: Math.min(...d.upper.map((b) => b.a * thrust + b.b)),
  };
}
export function jointContact(j: ArchJoint, g: ArchGeometry, thrust: number, intercept: number) {
  const normal = thrust * Math.sin(j.angle) - j.vertical * Math.cos(j.angle);
  const shear = thrust * Math.cos(j.angle) + j.vertical * Math.sin(j.angle);
  const radius = (intercept + j.loadMoment - thrust * g.cy) / normal;
  const fraction = (radius - g.inner) / (g.outer - g.inner);
  return {
    ...j,
    normal,
    shear,
    radius,
    fraction,
    point: pointAt(radius, j.angle, g.cy),
    fits: normal > 0 && fraction >= -1e-8 && fraction <= 1 + 1e-8,
    edge: Math.abs(fraction) < 1e-8 || Math.abs(fraction - 1) < 1e-8,
  };
}
export function archAnalysis(s: ArchState) {
  const g = archGeometry(s),
    left = g.joints[0] as ArchJoint;
  const r = g.inner + ((g.outer - g.inner) * s.bearing) / 100;
  const p = pointAt(r, left.angle, g.cy);
  const intercept = s.thrust * p.y - g.vertical * p.x;
  const contacts = g.joints.map((j) => {
    const contact = jointContact(j, g, s.thrust, intercept);
    return {
      ...contact,
      requiredFriction: Math.abs(contact.shear) / contact.normal,
      frictionFits:
        s.friction === null ||
        (contact.normal > 0 && Math.abs(contact.shear) <= s.friction * contact.normal + 1e-10),
    };
  });
  const pierWeight = s.mass / 100;
  const eccentricity =
    (intercept + s.thrust * PIER_HEIGHT - g.vertical) / (g.vertical + pierWeight);
  const pierFits = Math.abs(eccentricity) <= s.width / 200 + 1e-8;
  return {
    geometry: g,
    intercept,
    contacts,
    eccentricity,
    pierFits,
    archFrictionFits: contacts.every((j) => j.frictionFits),
    baseRequiredFriction: s.thrust / (g.vertical + pierWeight),
    baseFrictionFits:
      s.friction === null || s.thrust <= s.friction * (g.vertical + pierWeight) + 1e-10,
    requiredFriction: Math.max(
      s.thrust / (g.vertical + pierWeight),
      ...contacts.map((j) => j.requiredFriction),
    ),
    archFits: contacts.every((j) => j.fits),
    arch: archDomain(s, g),
    whole: archDomain(s, g, true),
  };
}
export function findArchPath(s: ArchState, includePiers: boolean): ArchState | null {
  const g = archGeometry(s),
    domain = archDomain(s, g, includePiers);
  if (!domain.feasible) return null;
  // Very thick shallow rings can admit unbounded H in the unlimited-compression
  // idealization. Pick a finite interior witness without capping the domain.
  const thrust =
    domain.min + Math.min((domain.max - domain.min) / 2, Math.max(0.1, domain.min / 2));
  const interval = interceptInterval(domain, thrust),
    intercept = (interval.min + interval.max) / 2;
  const left = jointContact(g.joints[0] as ArchJoint, g, thrust, intercept);
  return { ...s, thrust, bearing: Math.max(0, Math.min(100, 100 * left.fraction)) };
}

const keys = [
  "rise",
  "thickness",
  "load",
  "loading",
  "width",
  "mass",
  "thrust",
  "bearing",
  "joint",
  "page",
  "friction",
] as const;
export function validArchState(value: unknown): value is ArchState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const number = (k: string, lo: number, hi: number, int = true) =>
    typeof v[k] === "number" &&
    Number.isFinite(v[k]) &&
    v[k] >= lo &&
    v[k] <= hi &&
    (!int || Number.isInteger(v[k]));
  return (
    Object.keys(v).length === keys.length &&
    keys.every((k) => Object.hasOwn(v, k)) &&
    number("rise", 30, 100) &&
    number("thickness", 10, 40) &&
    number("load", 0, 200) &&
    (v.loading === "crown" || v.loading === "shoulders") &&
    number("width", 40, 140) &&
    number("mass", 25, 600) &&
    number("thrust", 0.001, 20, false) &&
    number("bearing", 0, 100, false) &&
    number("joint", 0, STONES) &&
    number("page", 0, 2) &&
    (v.friction === null || number("friction", 0, 2, false))
  );
}
export function archQuery(s: ArchState): string {
  return `?${new URLSearchParams(keys.map((k) => [k, String(s[k])]))}`;
}
export function readArchQuery(search: string): ArchState {
  if (search.length > 2048) throw new Error("The arch link is too long.");
  const q = new URLSearchParams(search);
  for (const key of q.keys())
    if (!(keys as readonly string[]).includes(key))
      throw new Error("The arch link has an unknown setting.");
  if (!keys.some((k) => q.has(k))) return { ...ARCH_DEFAULT };
  // Complete legacy links contain ten settings; absence of friction means no sliding.
  if (!q.has("friction")) q.set("friction", "null");
  if (keys.some((k) => q.getAll(k).length !== 1))
    throw new Error("The arch link has missing or repeated settings.");
  const value = Object.fromEntries(
    keys.map((k) => [
      k,
      k === "friction" && q.get(k) === "null"
        ? null
        : k === "loading"
          ? q.get(k)
          : /^(?:\d+\.?\d*|\d*\.\d+)(?:e-?\d+)?$/.test(q.get(k) ?? "")
            ? Number(q.get(k))
            : NaN,
    ]),
  );
  if (!validArchState(value))
    throw new Error("The arch link contains invalid settings. The starting arch is shown.");
  return value;
}
export const ARCH_SCOPE =
  "Modern 13-block symmetric equilibrium experiment; no tension, no sliding, unlimited compression. Joint resultants and pier-base overturning only. Not an ancient design rule or a structural safety assessment.";
export function archScope(s: ArchState): string {
  return s.friction === null
    ? ARCH_SCOPE
    : `Modern 13-block symmetric equilibrium experiment; no tension, unlimited compression, static Coulomb friction |T| <= μN with uniform illustrative μ = ${s.friction} at every joint and both pier bases. Not a measured ancient material, an ancient design rule or a structural safety assessment.`;
}
export function archRecord(s: ArchState): string {
  return JSON.stringify(
    {
      format: "gonia-arch",
      version: 2,
      scope: archScope(s),
      units: "length: half-span; force W: arch own weight = 1",
      state: s,
    },
    null,
    2,
  );
}
export function openArchRecord(text: string): ArchState {
  if (text.length > 16000) throw new Error("Choose an arch record smaller than 16 KB.");
  let v: { format?: unknown; version?: unknown; state?: unknown; scope?: unknown; units?: unknown };
  try {
    // All schema field names are distinct, including across envelope and state.
    const fields = new Set<string>();
    for (const token of text.matchAll(/"(?:\\.|[^"\\])*"/g)) {
      if (!/^\s*:/.test(text.slice((token.index ?? 0) + token[0].length))) continue;
      const key = JSON.parse(token[0]) as string;
      if (fields.has(key)) throw new Error("The arch record repeats a field.");
      fields.add(key);
    }
    v = JSON.parse(text);
  } catch (error) {
    throw new Error(`Cannot read the arch JSON: ${(error as Error).message}`);
  }
  if (
    !v ||
    Array.isArray(v) ||
    Object.keys(v).sort().join() !== "format,scope,state,units,version" ||
    v.format !== "gonia-arch" ||
    ![1, 2].includes(v.version as number) ||
    typeof v.scope !== "string" ||
    v.units !== "length: half-span; force W: arch own weight = 1"
  )
    throw new Error("Choose a version 1 or 2 Gonia arch record with valid settings.");
  if (v.version === 1) {
    if (
      !v.state ||
      typeof v.state !== "object" ||
      Array.isArray(v.state) ||
      Object.hasOwn(v.state, "friction") ||
      Object.keys(v.state).length !== keys.length - 1
    )
      throw new Error("A version 1 record has ten settings and assumes no sliding.");
    v.state = { ...v.state, friction: null };
  }
  if (!validArchState(v.state)) throw new Error("The arch record has invalid settings.");
  return v.state;
}

export function archCsv(s: ArchState): string {
  const m = archAnalysis(s);
  const rows: (string | number | boolean)[][] = [
    [
      "joint",
      "angle_rad",
      "horizontal_W",
      "vertical_W",
      "normal_W",
      "shear_W",
      "radius_half_span",
      "contact_fraction_from_inner",
      "x_half_span",
      "y_half_span",
      "fits_joint",
      "C_W_half_span",
      "pier_outward_eccentricity_half_span",
      "pier_base_fits",
      "friction_coefficient_or_ideal",
      "required_joint_friction_abs_T_over_N",
      "joint_friction_fits",
      "required_base_friction",
      "base_friction_fits",
      "scope",
    ],
  ];
  for (const j of m.contacts)
    rows.push([
      j.index,
      j.angle,
      s.thrust,
      j.vertical,
      j.normal,
      j.shear,
      j.radius,
      j.fraction,
      j.point.x,
      j.point.y,
      j.fits,
      m.intercept,
      m.eccentricity,
      m.pierFits,
      s.friction === null ? "no sliding assumed" : s.friction,
      j.requiredFriction,
      s.friction === null ? "not checked" : j.frictionFits,
      m.baseRequiredFriction,
      s.friction === null ? "not checked" : m.baseFrictionFits,
      archScope(s),
    ]);
  return rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

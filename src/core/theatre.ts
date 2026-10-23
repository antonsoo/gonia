export type TheatreKind = "greek" | "roman";
export type TheatreArc = "three" | "single";
export type TheatrePart = "orchestra" | "stage" | "stairs" | "construction";
export interface TheatrePoint {
  x: number;
  y: number;
}
export interface TheatreState {
  kind: TheatreKind;
  arc: TheatreArc;
  diameter: number;
  step: number;
  polygon: number;
  vertex: number;
  probe: number;
  part: TheatrePart;
  source: number;
  reading: number;
}
export const THEATRE_DEFAULT: TheatreState = {
  kind: "greek",
  arc: "three",
  diameter: 20,
  step: 4,
  polygon: 0,
  vertex: 0,
  probe: 100,
  part: "orchestra",
  source: 5,
  reading: 7,
};
export const THEATRE_PARTS: TheatrePart[] = ["orchestra", "stage", "stairs", "construction"];
const bounded = (v: unknown, fallback: number, low: number, high: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(low, Math.min(high, Math.round(v)))
    : fallback;
export function normalizeTheatre(input: Partial<TheatreState>): TheatreState {
  const kind = input.kind === "roman" ? "roman" : "greek";
  return {
    kind,
    arc: input.arc === "single" ? "single" : "three",
    diameter: bounded(input.diameter, 20, 12, 36),
    step: bounded(input.step, 4, 0, 4),
    polygon: bounded(input.polygon, 0, 0, kind === "greek" ? 3 : 4),
    vertex: bounded(input.vertex, 0, 0, 11),
    probe: bounded(input.probe, 100, 0, 100),
    part: THEATRE_PARTS.includes(input.part as TheatrePart)
      ? (input.part as TheatrePart)
      : "orchestra",
    source: bounded(input.source, 5, 0, 6),
    reading: bounded(input.reading, 7, 0, 9),
  };
}
export function parseTheatre(search: string): { state: TheatreState; adjusted: boolean } {
  const q = new URLSearchParams(search),
    raw: Record<string, string | number> = {};
  for (const key of Object.keys(THEATRE_DEFAULT)) {
    const v = q.get(key);
    if (v !== null)
      raw[key] = ["kind", "arc", "part"].includes(key) ? v : v.trim() ? Number(v) : NaN;
  }
  const state = normalizeTheatre(raw);
  const adjusted =
    Object.keys(raw).some((key) => raw[key] !== state[key as keyof TheatreState]) ||
    [...q.keys()].some((key) => q.getAll(key).length > 1);
  return { state, adjusted };
}
export function theatreQuery(state: TheatreState): string {
  return `?${new URLSearchParams(Object.entries(normalizeTheatre(state)).map(([k, v]) => [k, String(v)])).toString()}`;
}
export function theatreVertices(kind: TheatreKind, radius = 1) {
  return Array.from({ length: 12 }, (_, index) => {
    const degrees = index * 30 + (kind === "greek" ? 15 : 0),
      angle = (degrees * Math.PI) / 180;
    const x = radius * Math.cos(angle),
      y = radius * Math.sin(angle);
    let role: "stair" | "chord" | "royal" | "guest" | "wing" | "unused";
    if (kind === "roman")
      role =
        index <= 6
          ? "stair"
          : index === 9
            ? "royal"
            : index === 8 || index === 10
              ? "guest"
              : "wing";
    else
      role =
        index <= 6 || index === 11 ? "stair" : index === 7 || index === 10 ? "chord" : "unused";
    return { index, degrees, x: Math.abs(x) < 1e-12 ? 0 : x, y: Math.abs(y) < 1e-12 ? 0 : y, role };
  });
}
export function theatrePolygons(kind: TheatreKind, radius = 1) {
  const vertices = theatreVertices(kind, radius),
    count = kind === "greek" ? 3 : 4;
  return Array.from({ length: count }, (_, i) =>
    Array.from({ length: 12 / count }, (_, j) => {
      const point = vertices[(i + j * count + (kind === "greek" ? 1 : 3)) % 12];
      if (!point) throw new Error("The twelve-point construction is incomplete.");
      return point;
    }),
  );
}
export function theatreFront(kind: TheatreKind, radius: number): number {
  return kind === "greek" ? -radius / Math.SQRT2 : 0;
}
/** Width between the constructed boundaries, not an archaeological measurement. */
export function orchestraWidth(
  y: number,
  radius: number,
  kind: TheatreKind,
  arc: TheatreArc = "three",
): number {
  if (!Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0)
    throw new RangeError("Finite coordinates and a positive radius are required.");
  if (y < theatreFront(kind, radius) - 1e-12 || y > radius + 1e-12) return 0;
  if (y >= 0 || arc === "single" || kind === "roman")
    return 2 * Math.sqrt(Math.max(0, radius * radius - y * y));
  return 2 * (Math.sqrt(4 * radius * radius - y * y) - radius);
}
export function orchestraArea(
  radius: number,
  kind: TheatreKind,
  arc: TheatreArc = "three",
): number {
  if (!Number.isFinite(radius) || radius <= 0)
    throw new RangeError("A finite positive radius is required.");
  if (kind === "roman") return (Math.PI * radius * radius) / 2;
  const h = 1 / Math.SQRT2;
  const extension =
    arc === "single" ? Math.PI / 4 + 0.5 : h * Math.sqrt(4 - h * h) + 4 * Math.asin(h / 2) - 2 * h;
  return radius * radius * (Math.PI / 2 + extension);
}
/** Circle arcs join with the same tangent at the horizontal diameter. */
export function orchestraBoundary(
  kind: TheatreKind,
  arc: TheatreArc,
  radius = 1,
  subdivisions = 120,
): TheatrePoint[] {
  const n = bounded(subdivisions, 120, 8, 10000),
    sideSteps = Math.ceil(n / 2),
    points: TheatrePoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i * Math.PI) / n;
    points.push({ x: radius * Math.cos(t), y: radius * Math.sin(t) });
  }
  if (kind === "greek") {
    const h = radius / Math.SQRT2;
    for (let i = 1; i <= sideSteps; i++) {
      const y = (-h * i) / sideSteps;
      points.push({ x: -orchestraWidth(y, radius, kind, arc) / 2, y });
    }
    for (let i = sideSteps; i >= 1; i--) {
      const y = (-h * i) / sideSteps;
      points.push({ x: orchestraWidth(y, radius, kind, arc) / 2, y });
    }
  }
  return points;
}
export function theatreModel(input: TheatreState) {
  const state = normalizeTheatre(input),
    radius = state.diameter / 2,
    front = theatreFront(state.kind, radius);
  const back = state.kind === "greek" ? -radius : -radius / 2;
  const y = state.kind === "greek" ? (front * state.probe) / 100 : 0;
  const area = orchestraArea(radius, state.kind, state.arc),
    singleArea = orchestraArea(radius, state.kind, "single");
  return {
    state,
    radius,
    front,
    back,
    stageDepth: front - back,
    area,
    singleArea,
    prescribedArea: orchestraArea(radius, state.kind, "three"),
    romanArea: orchestraArea(radius, "roman"),
    probeY: y,
    probeWidth: orchestraWidth(y, radius, state.kind, state.arc),
    singleWidth: orchestraWidth(y, radius, state.kind, "single"),
    vertices: theatreVertices(state.kind, radius),
    polygons: theatrePolygons(state.kind, radius),
    boundary: orchestraBoundary(state.kind, state.arc, radius),
  };
}

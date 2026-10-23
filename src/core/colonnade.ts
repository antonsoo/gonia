export type ColonnadeKind = "double" | "pseudo";
export type ColonnadeRing = "outer" | "inner";
export const colonnadeParts = ["space", "outer", "inner", "cella"] as const;
export type ColonnadePart = (typeof colonnadeParts)[number];
export const colonnadeSources = [
  "restored",
  "remains",
  "prescription",
  "apparatus",
  "capital",
] as const;
export type ColonnadeSource = (typeof colonnadeSources)[number];
export interface ColonnadeState {
  kind: ColonnadeKind;
  gap: number;
  part: ColonnadePart;
  ring: ColonnadeRing;
  count: number;
  source: ColonnadeSource;
  word: number;
}
export const COLONNADE_DEFAULT: ColonnadeState = {
  kind: "pseudo",
  gap: 2.25,
  part: "space",
  ring: "inner",
  count: 0,
  source: "restored",
  word: 0,
};
const bounded = (n: unknown, fallback: number, lo: number, hi: number, step = 1) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.round(Math.min(hi, Math.max(lo, n)) / step) * step
    : fallback;
export function normalizeColonnade(s: Partial<ColonnadeState>): ColonnadeState {
  const ring = s.ring === "outer" ? "outer" : "inner";
  return {
    kind: s.kind === "double" ? "double" : "pseudo",
    gap: bounded(s.gap, 2.25, 1.5, 3, 0.25),
    part: colonnadeParts.includes(s.part as ColonnadePart) ? (s.part as ColonnadePart) : "space",
    ring,
    count: bounded(s.count, 0, 0, ring === "outer" ? 42 : 34),
    source: colonnadeSources.includes(s.source as ColonnadeSource)
      ? (s.source as ColonnadeSource)
      : "restored",
    word: bounded(s.word, 0, 0, 5),
  };
}
export function colonnadeQuery(s: ColonnadeState): string {
  const p = normalizeColonnade(s);
  return `?kind=${p.kind}&gap=${p.gap}&part=${p.part}&ring=${p.ring}&count=${p.count}&source=${p.source}&word=${p.word}`;
}
export function parseColonnade(search: string): { state: ColonnadeState; adjusted: boolean } {
  const q = new URLSearchParams(search);
  const number = (k: string, fallback: number) =>
    q.has(k) ? Number(q.get(k)?.trim() || "NaN") : fallback;
  const raw = {
    kind: (q.get("kind") ?? "pseudo") as ColonnadeKind,
    gap: number("gap", 2.25),
    part: (q.get("part") ?? "space") as ColonnadePart,
    ring: (q.get("ring") ?? "inner") as ColonnadeRing,
    count: number("count", 0),
    source: (q.get("source") ?? "restored") as ColonnadeSource,
    word: number("word", 0),
  };
  const state = normalizeColonnade(raw);
  return {
    state,
    adjusted: Object.keys(raw).some((k) => {
      const key = k as keyof ColonnadeState;
      return raw[key] !== state[key] || q.getAll(key).length > 1;
    }),
  };
}
export interface PlanColumn {
  id: string;
  ring: ColonnadeRing;
  order: number;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  side: "front" | "lower flank" | "rear" | "upper flank";
  corner: boolean;
  present: boolean;
}
// One circuit assigns each corner to an end, never to both adjacent sides.
export function ringColumns(ring: ColonnadeRing, pitch: number, present: boolean): PlanColumn[] {
  const inset = ring === "outer" ? 0 : 1;
  const left = inset,
    right = 14 - inset,
    top = inset,
    bottom = 7 - inset;
  const points: { x: number; y: number; side: PlanColumn["side"] }[] = [];
  for (let y = top; y <= bottom; y++) points.push({ x: left, y, side: "front" });
  for (let x = left + 1; x < right; x++) points.push({ x, y: bottom, side: "lower flank" });
  for (let y = bottom; y >= top; y--) points.push({ x: right, y, side: "rear" });
  for (let x = right - 1; x > left; x--) points.push({ x, y: top, side: "upper flank" });
  return points.map((p, i) => ({
    id: `${ring}-${String(i + 1).padStart(2, "0")}`,
    ring,
    order: i + 1,
    gridX: p.x,
    gridY: p.y,
    x: p.x * pitch,
    y: p.y * pitch,
    side: p.side,
    corner: (p.x === left || p.x === right) && (p.y === top || p.y === bottom),
    present,
  }));
}
export function colonnadeModel(input: Partial<ColonnadeState>) {
  const state = normalizeColonnade(input);
  const pitch = state.gap + 1;
  const outer = ringColumns("outer", pitch, true);
  const inner = ringColumns("inner", pitch, state.kind === "double");
  const cella = {
    x: 2 * pitch - 0.5,
    y: 2 * pitch - 0.5,
    width: 10 * pitch + 1,
    height: 3 * pitch + 1,
    wall: 1,
  };
  return {
    state,
    pitch,
    outer,
    inner,
    cella,
    columns: [...outer, ...inner],
    present: state.kind === "double" ? 76 : 42,
    omitted: state.kind === "double" ? 0 : 34,
    endCount: 8,
    flankCount: 15,
    innerEndCount: 6,
    innerFlankCount: 13,
    wideClear: 2 * state.gap + 1,
    narrowClear: state.gap,
    outerWidth: 14 * pitch + 1,
    outerDepth: 7 * pitch + 1,
    continuousStrip: state.kind === "double" ? state.gap : 2 * state.gap + 1,
  };
}

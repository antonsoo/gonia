/** Ideal, quasi-static parallel-strand model. SI dimensions are teaching choices. */
export type HoistState = {
  rig: "single" | "three" | "five";
  anchor: "moving" | "fixed";
  hold: "rise" | "rope";
  distance: number;
  weight: number;
  arm: 1 | 2 | 4;
};
export const HOIST_DEFAULT: HoistState = {
  rig: "three",
  anchor: "moving",
  hold: "rise",
  distance: 1,
  weight: 600,
  arm: 2,
};
export const HOIST_NAMES = {
  single: "One fixed wheel",
  three: "Trispastos · three wheels",
  five: "Pentaspaston · five wheels",
};
export type RopeLine = {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  support: boolean;
};
export type RopeArc = {
  kind: "arc";
  cx: number;
  cy: number;
  radius: number;
  side: "upper" | "lower";
};
export type RopePart = RopeLine | RopeArc;
export function validHoist(value: unknown): value is HoistState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as Record<string, unknown>;
  return (
    Object.keys(s).length === 6 &&
    Object.keys(HOIST_DEFAULT).every((k) => Object.hasOwn(s, k)) &&
    ["single", "three", "five"].includes(String(s.rig)) &&
    ["moving", "fixed"].includes(String(s.anchor)) &&
    !(s.rig === "single" && s.anchor !== "moving") &&
    ["rise", "rope"].includes(String(s.hold)) &&
    typeof s.distance === "number" &&
    Number.isFinite(s.distance) &&
    s.distance >= 0 &&
    s.distance <= 2 &&
    Math.abs(s.distance * 20 - Math.round(s.distance * 20)) < 1e-8 &&
    typeof s.weight === "number" &&
    Number.isInteger(s.weight) &&
    s.weight >= 100 &&
    s.weight <= 2000 &&
    s.weight % 100 === 0 &&
    [1, 2, 4].includes(Number(s.arm)) &&
    typeof s.arm === "number"
  );
}
export function hoistQuery(s: HoistState): string {
  return `?${new URLSearchParams(Object.entries(s).map(([k, v]) => [k, String(v)]))}`;
}
export function parseHoist(query: string): { state: HoistState; invalid: boolean } {
  const p = new URLSearchParams(query),
    keys = Object.keys(HOIST_DEFAULT);
  if (!p.size) return { state: { ...HOIST_DEFAULT }, invalid: false };
  const candidate = {
    rig: p.get("rig"),
    anchor: p.get("anchor"),
    hold: p.get("hold"),
    distance: Number(p.get("distance")),
    weight: Number(p.get("weight")),
    arm: Number(p.get("arm")),
  };
  const invalid =
    p.size !== 6 ||
    keys.some((k) => p.getAll(k).length !== 1 || p.get(k) === "") ||
    [...p.keys()].some((k) => !keys.includes(k)) ||
    !validHoist(candidate);
  return { state: invalid ? { ...HOIST_DEFAULT } : (candidate as HoistState), invalid };
}
export function hoistJson(s: HoistState): string {
  return `${JSON.stringify({ format: "gonia-hoist-v1", state: s }, null, 2)}\n`;
}
export function readHoist(text: string): HoistState {
  if (new TextEncoder().encode(text).length > 65536)
    throw new Error("Choose a hoist JSON file smaller than 64 KiB.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON. Choose a saved Gonia hoist experiment.");
  }
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}[\]:,]|[^\s{}[\]:,]+/g) ?? [],
    keys = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++)
    if (tokens[i + 1] === ":" && tokens[i]?.startsWith('"')) {
      const key = JSON.parse(tokens[i] ?? '""') as string;
      if (keys.has(key))
        throw new Error("Repeated JSON fields have no unique meaning; nothing has changed.");
      keys.add(key);
    }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length !== 2 ||
    !("format" in data) ||
    data.format !== "gonia-hoist-v1" ||
    !("state" in data) ||
    !validHoist(data.state)
  )
    throw new Error(
      "This is not a complete gonia-hoist-v1 experiment. Check its six settings; nothing has changed.",
    );
  return { ...data.state };
}
export const HOIST_RADIUS = 0.16,
  HOIST_TOP = 1.1,
  HOIST_BASE = 5,
  HOIST_DRUM_Y = 5.8;
export function hoistWheels(s: Pick<HoistState, "rig">): number {
  return s.rig === "single" ? 1 : s.rig === "three" ? 3 : 5;
}
/** Walking the actual route makes the supports explicit, including the tied end. */
export function hoistRoute(s: Pick<HoistState, "rig" | "anchor">, rise: number): RopePart[] {
  const k = (hoistWheels(s) - 1) / 2,
    r = HOIST_RADIUS,
    y = HOIST_BASE - rise,
    parts: RopePart[] = [];
  const moving = s.anchor === "moving";
  parts.push({
    kind: "line",
    x1: 0,
    y1: moving ? y : HOIST_TOP + 0.5,
    x2: 0,
    y2: HOIST_TOP,
    support: moving,
  });
  for (let j = 0; j <= k; j++) {
    parts.push({ kind: "arc", cx: (4 * j + 1) * r, cy: HOIST_TOP, radius: r, side: "upper" });
    const x = (4 * j + 2) * r;
    if (j < k) {
      parts.push({ kind: "line", x1: x, y1: HOIST_TOP, x2: x, y2: y, support: true });
      parts.push({ kind: "arc", cx: (4 * j + 3) * r, cy: y, radius: r, side: "lower" });
      parts.push({
        kind: "line",
        x1: x + 2 * r,
        y1: y,
        x2: x + 2 * r,
        y2: HOIST_TOP,
        support: true,
      });
    } else
      parts.push({ kind: "line", x1: x, y1: HOIST_TOP, x2: x, y2: HOIST_DRUM_Y, support: false });
  }
  return parts;
}
export function ropeLength(parts: RopePart[]): number {
  return parts.reduce(
    (v, p) => v + (p.kind === "line" ? Math.hypot(p.x2 - p.x1, p.y2 - p.y1) : Math.PI * p.radius),
    0,
  );
}
export function ropePoint(parts: RopePart[], distance: number): { x: number; y: number } | null {
  let remaining = distance;
  if (remaining < 0) return null;
  for (const p of parts) {
    const length = p.kind === "line" ? Math.hypot(p.x2 - p.x1, p.y2 - p.y1) : Math.PI * p.radius;
    if (remaining <= length) {
      const f = remaining / length;
      if (p.kind === "line") return { x: p.x1 + f * (p.x2 - p.x1), y: p.y1 + f * (p.y2 - p.y1) };
      const angle = p.side === "upper" ? Math.PI + Math.PI * f : Math.PI - Math.PI * f;
      return { x: p.cx + p.radius * Math.cos(angle), y: p.cy + p.radius * Math.sin(angle) };
    }
    remaining -= length;
  }
  return null;
}
export function hoistModel(s: HoistState) {
  const supports = hoistRoute(s, 0).filter((p) => p.kind === "line" && p.support).length;
  const rise = s.hold === "rise" ? s.distance : s.distance / supports;
  const route = hoistRoute(s, rise),
    initialLength = ropeLength(hoistRoute(s, 0)),
    length = ropeLength(route);
  const rope = initialLength - length,
    tension = s.weight / supports,
    hand = tension / s.arm,
    handPath = rope * s.arm;
  return {
    supports,
    rise,
    rope,
    tension,
    hand,
    handPath,
    work: s.weight * rise,
    ropeWork: tension * rope,
    handWork: hand * handPath,
    route,
    length,
    initialLength,
    drumRadius: 0.15,
    armRadius: 0.15 * s.arm,
    turns: rope / (2 * Math.PI * 0.15),
  };
}

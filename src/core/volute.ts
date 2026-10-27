/** Coordinates are exact integer twelfths of the eye diameter, e. */
export interface PinPoint {
  x: number;
  y: number;
}
export const VOLUTE_PINS: readonly PinPoint[] = [3, 2, 1].flatMap((n) => [
  { x: -n, y: n },
  { x: n, y: n },
  { x: n, y: -n },
  { x: -n, y: -n },
]);
export const VOLUTE_START: PinPoint = { x: 0, y: 54 };
export const PRINTED_SEQUENCE = Array.from({ length: 12 }, (_, i) => i + 1);
export interface VoluteState {
  moves: number[];
  pin: number;
  join: number;
  repair: boolean;
  eye: number;
  page: number;
}
export const VOLUTE_DEFAULT: VoluteState = {
  moves: [1, 2, 3, 4],
  pin: 5,
  join: 4,
  repair: false,
  eye: 12,
  page: 0,
};
export interface CompassArc {
  pin: number;
  start: PinPoint;
  centre: PinPoint;
  end: PinPoint;
  radiusSquared: number;
}
export const minus = (p: PinPoint, q: PinPoint): PinPoint => ({ x: p.x - q.x, y: p.y - q.y });
export const dot = (p: PinPoint, q: PinPoint) => p.x * q.x + p.y * q.y;
export const cross = (p: PinPoint, q: PinPoint) => p.x * q.y - p.y * q.x;
export const norm = (p: PinPoint) => Math.hypot(p.x, p.y);

export function quarterArc(start: PinPoint, pin: number): CompassArc {
  const centre = VOLUTE_PINS[pin - 1];
  if (!centre) throw new Error("Choose a numbered centre from 1 to 12.");
  const radius = minus(start, centre);
  return {
    pin,
    start,
    centre,
    end: { x: centre.x + radius.y, y: centre.y - radius.x },
    radiusSquared: dot(radius, radius),
  };
}
export function voluteArcs(moves: readonly number[]): CompassArc[] {
  if (moves.length > 12) throw new Error("A sheet holds at most twelve quarter circles.");
  let start = VOLUTE_START;
  return moves.map((pin) => {
    const arc = quarterArc(start, pin);
    start = arc.end;
    return arc;
  });
}
export interface VoluteJoin {
  index: number;
  point: PinPoint;
  incoming: PinPoint;
  outgoing: PinPoint;
  before: PinPoint;
  after: PinPoint;
  cross: number;
  dot: number;
  angle: number | null;
  tangent: boolean;
  eye: boolean;
}
export function voluteJoins(arcs: readonly CompassArc[]): VoluteJoin[] {
  return arcs.flatMap((arc, i) => {
    const next = arcs[i + 1];
    const eye = !next && arcs.length === 12 && i === 11;
    if (!next && !eye) return [];
    const after = next?.centre ?? { x: 0, y: 0 };
    const incoming = minus(arc.end, arc.centre),
      outgoing = minus(arc.end, after),
      c = cross(incoming, outgoing),
      d = dot(incoming, outgoing);
    return [
      {
        index: i + 1,
        point: arc.end,
        incoming,
        outgoing,
        before: arc.centre,
        after,
        cross: c,
        dot: d,
        angle:
          norm(incoming) && norm(outgoing) ? (Math.atan2(Math.abs(c), d) * 180) / Math.PI : null,
        tangent: c === 0 && d > 0,
        eye,
      },
    ];
  });
}

/** A local intervention, not a new historical construction. */
export function repairJoin(join: VoluteJoin) {
  const axis = join.incoming;
  if (!dot(axis, axis) || !dot(join.outgoing, join.outgoing)) return null;
  const t = dot(minus(join.after, join.before), axis) / dot(axis, axis);
  // A centre at or beyond the contact point reverses or erases its radius.
  // Such a projection cannot give the same oriented tangent.
  if (t >= 1) return null;
  const centre = { x: join.before.x + t * axis.x, y: join.before.y + t * axis.y };
  const radius = minus(join.point, centre);
  const end = { x: centre.x + radius.y, y: centre.y - radius.x };
  // The original outgoing arc is a clockwise quarter turn around the old pin.
  const old = join.outgoing;
  const oldEnd = { x: join.after.x + old.y, y: join.after.y - old.x };
  return { centre, end, oldEnd, displacement: norm(minus(end, oldEnd)) / 12 };
}
export function voluteSummary(state: VoluteState) {
  const arcs = voluteArcs(state.moves),
    end = arcs.at(-1)?.end ?? VOLUTE_START,
    endSquared = dot(end, end);
  return {
    arcs,
    end,
    endSquared,
    radialGap: (Math.sqrt(endSquared) - 6) / 12,
    onEye: endSquared === 36,
    followsPrint: state.moves.every((pin, i) => pin === i + 1),
    joins: voluteJoins(arcs),
  };
}
export function validVoluteState(value: unknown): value is VoluteState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const integer = (key: string, min: number, max: number) =>
    typeof v[key] === "number" && Number.isInteger(v[key]) && v[key] >= min && v[key] <= max;
  return (
    Object.keys(v).length === 6 &&
    Array.isArray(v.moves) &&
    v.moves.length <= 12 &&
    v.moves.every((n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 12) &&
    integer("pin", 1, 12) &&
    integer("join", 1, 12) &&
    typeof v.repair === "boolean" &&
    integer("eye", 6, 18) &&
    integer("page", 0, 6)
  );
}
export function voluteQuery(s: VoluteState): string {
  const q = new URLSearchParams({
    moves: s.moves.join("."),
    pin: String(s.pin),
    join: String(s.join),
    repair: s.repair ? "1" : "0",
    eye: String(s.eye),
    page: String(s.page),
  });
  return `?${q}`;
}
export function readVoluteQuery(search: string): VoluteState {
  const q = new URLSearchParams(search);
  if (!["moves", "pin", "join", "repair", "eye", "page"].some((key) => q.has(key)))
    return { ...VOLUTE_DEFAULT, moves: [...VOLUTE_DEFAULT.moves] };
  const keys = ["moves", "pin", "join", "repair", "eye", "page"];
  if (keys.some((key) => q.getAll(key).length !== 1))
    throw new Error("The drawing link has missing or repeated settings.");
  if (!/^(?:[1-9]|1[0-2])(?:\.(?:[1-9]|1[0-2])){0,11}$|^$/.test(q.get("moves") ?? ""))
    throw new Error("The drawing link has an invalid compass sequence.");
  if (
    ["pin", "join", "eye", "page"].some((k) => !/^\d{1,2}$/.test(q.get(k) ?? "")) ||
    !/^[01]$/.test(q.get("repair") ?? "")
  )
    throw new Error("The drawing link has invalid settings.");
  const state = {
    moves: q.get("moves") ? (q.get("moves") as string).split(".").map(Number) : [],
    pin: Number(q.get("pin")),
    join: Number(q.get("join")),
    repair: q.get("repair") === "1",
    eye: Number(q.get("eye")),
    page: Number(q.get("page")),
  };
  if (!validVoluteState(state)) throw new Error("The drawing link has out-of-range settings.");
  return state;
}
export function voluteRecord(state: VoluteState): string {
  return JSON.stringify(
    {
      format: "gonia-volute",
      version: 1,
      scope:
        "Modern exact quarter-turn interpretation of Juglaris & Locke, 1889, plate XV; not an ancient capital survey.",
      unit: "One eye diameter e; model coordinates stored in exact twelfths of e.",
      state,
    },
    null,
    2,
  );
}
export function openVoluteRecord(text: string): VoluteState {
  if (text.length > 16000) throw new Error("Choose a volute JSON record smaller than 16 KB.");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (data?.format !== "gonia-volute" || data.version !== 1 || !validVoluteState(data.state))
    throw new Error("Choose a version 1 Gonia volute record with valid settings.");
  return data.state;
}
export function voluteCsv(s: VoluteState): string {
  const m = voluteSummary(s);
  const rows: (string | number)[][] = [
    [
      "arc",
      "pin",
      "cx_twelfths_e",
      "cy_twelfths_e",
      "start_x_twelfths_e",
      "start_y_twelfths_e",
      "end_x_twelfths_e",
      "end_y_twelfths_e",
      "radius_squared_in_twelfths_e_squared",
      "radius_e",
      "sweep_degrees",
      "next_join_degrees",
      "join_cross_integer",
      "join_dot_integer",
      "scope",
    ],
  ];
  m.arcs.forEach((a, i) => {
    const j = m.joins.find((j) => j.index === i + 1);
    rows.push([
      i + 1,
      a.pin,
      a.centre.x,
      a.centre.y,
      a.start.x,
      a.start.y,
      a.end.x,
      a.end.y,
      a.radiusSquared,
      Math.sqrt(a.radiusSquared) / 12,
      90,
      j?.angle ?? "",
      j?.cross ?? "",
      j?.dot ?? "",
      j?.eye
        ? "Direction comparison with eye circle; contact requires endpoint on eye"
        : "Modern exact quarter circles from 1889 plate; no ancient measurement",
    ]);
  });
  return rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

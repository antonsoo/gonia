export const TRANSPORT_KINDS = ["shaft", "bare", "wheels"] as const;
export type TransportKind = (typeof TRANSPORT_KINDS)[number];
export interface TransportState {
  kind: TransportKind;
  width: number;
  height: number;
  radius: number;
  angle: number;
  unit: "chosen" | "feet";
  page: 230 | 231;
}
export const TRANSPORT_DEFAULT: TransportState = {
  kind: "wheels",
  width: 8,
  height: 6,
  radius: 6,
  angle: 0,
  unit: "chosen",
  page: 230,
};
export const TRANSPORT_NAMES: Record<TransportKind, string> = {
  shaft: "The shaft is the roller",
  bare: "A rectangular stone, without wheels",
  wheels: "The stone inside wheels",
};
export const PACONIUS: TransportState = {
  kind: "wheels",
  width: 8,
  height: 6,
  radius: 7.5,
  angle: 0,
  unit: "feet",
  page: 231,
};
export function transportFrameAngle(startAngle: number, elapsedMilliseconds: number): number {
  if (
    !Number.isFinite(startAngle) ||
    startAngle < 0 ||
    startAngle > 360 ||
    !Number.isFinite(elapsedMilliseconds)
  )
    throw new RangeError("A turn needs a bounded starting angle and finite elapsed time.");
  return Math.min(360, startAngle + Math.floor(Math.max(0, elapsedMilliseconds) / 40));
}
export interface XY {
  x: number;
  y: number;
}
const trig = (n: number) => (Math.abs(n) < 1e-14 ? 0 : n);

export function transportModel(state: TransportState, angle = state.angle) {
  for (const length of [state.width, state.height])
    if (!Number.isFinite(length) || length < 2 || length > 12 || !Number.isInteger(length * 2))
      throw new RangeError("Stone dimensions must be 2–12 in half units.");
  if (
    !Number.isFinite(state.radius) ||
    state.radius < 1 ||
    state.radius > 9 ||
    !Number.isInteger(state.radius * 4)
  )
    throw new RangeError("Radius must be 1–9 in quarter units.");
  if (!Number.isFinite(angle) || angle < 0 || angle > 360)
    throw new RangeError("One turn runs from 0 to 360 degrees.");
  if (!TRANSPORT_KINDS.some((k) => k === state.kind))
    throw new RangeError("Unknown transport geometry.");
  const a = state.width / 2,
    b = state.height / 2;
  const radians = (angle * Math.PI) / 180;
  const cos = trig(Math.cos(radians)),
    sin = trig(Math.sin(radians));
  const diagonalRadius = Math.hypot(a, b);
  let centre: XY = { x: state.radius * radians, y: state.radius };
  if (state.kind === "bare") {
    // Each quarter-turn ends with the next face on the ground. Within that
    // interval the advancing lower corner is the fixed instantaneous pivot.
    const quarter = Math.floor(angle / 90);
    const phase = ((angle - quarter * 90) * Math.PI) / 180;
    const horizontal = quarter % 2 === 0 ? a : b;
    const vertical = quarter % 2 === 0 ? b : a;
    centre = {
      x: quarter * (a + b) + horizontal * (1 - Math.cos(phase)) + vertical * Math.sin(phase),
      y: horizontal * Math.sin(phase) + vertical * Math.cos(phase),
    };
  }
  const corners = (
    [
      [-a, -b],
      [a, -b],
      [a, b],
      [-a, b],
    ] as const
  ).map(([x, y]) => ({ x: x * cos + y * sin, y: -x * sin + y * cos }));
  const neededHeight = a * Math.abs(sin) + b * Math.abs(cos);
  const lowest = state.kind === "shaft" ? 0 : centre.y - neededHeight;
  const intrudes = lowest < -1e-9;
  const contacts =
    state.kind === "bare"
      ? corners
          .filter((p) => Math.abs(centre.y + p.y) < 1e-8)
          .map((p) => ({ x: centre.x + p.x, y: 0 }))
      : [{ x: centre.x, y: 0 }];
  return {
    state,
    angle,
    radians,
    centre,
    corners,
    contacts,
    neededHeight,
    diagonalRadius,
    lowest,
    intrudes,
    fullTurnClearance: state.kind === "wheels" ? state.radius - diagonalRadius : 0,
    fullTurnValid: state.kind !== "wheels" || state.radius >= diagonalRadius - 1e-10,
    minimumCentreHeight: state.kind === "bare" ? Math.min(a, b) : state.radius,
    maximumCentreHeight: state.kind === "bare" ? diagonalRadius : state.radius,
    fullTurnDistance:
      state.kind === "bare" ? 2 * (state.width + state.height) : 2 * Math.PI * state.radius,
    paconiusDimensions:
      state.kind === "wheels" &&
      state.width === 8 &&
      state.height === 6 &&
      state.radius === 7.5 &&
      state.unit === "feet",
  };
}

export function transportQuery(s: TransportState): string {
  return `?${new URLSearchParams({ kind: s.kind, w: String(s.width), h: String(s.height), r: String(s.radius), angle: String(s.angle), unit: s.unit, page: String(s.page) })}`;
}
export function parseTransport(search: string): { state: TransportState; issue: string | null } {
  const p = new URLSearchParams(search);
  try {
    for (const key of ["kind", "w", "h", "r", "angle", "unit", "page"])
      if (p.getAll(key).length > 1) throw new Error("duplicate");
    const numeric = (key: string, fallback: number) => {
      const raw = p.get(key);
      if (raw === null) return fallback;
      if (!/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/.test(raw)) throw new Error("number");
      return Number(raw);
    };
    const kind = p.get("kind") ?? TRANSPORT_DEFAULT.kind;
    const unit = p.get("unit") ?? "chosen";
    const page = numeric("page", 230);
    if (
      !TRANSPORT_KINDS.some((k) => k === kind) ||
      (unit !== "chosen" && unit !== "feet") ||
      (page !== 230 && page !== 231)
    )
      throw new Error("choice");
    const state: TransportState = {
      kind: kind as TransportKind,
      width: numeric("w", 8),
      height: numeric("h", 6),
      radius: numeric("r", 6),
      angle: numeric("angle", 0),
      unit,
      page,
    };
    if (!Number.isInteger(state.angle)) throw new Error("angle");
    transportModel(state);
    return { state, issue: null };
  } catch {
    return {
      state: { ...TRANSPORT_DEFAULT },
      issue:
        "This link contains conflicting or out-of-range transport settings. The starting example is shown.",
    };
  }
}

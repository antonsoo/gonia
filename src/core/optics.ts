/** Modern geometry for a chosen flat member; Vitruvius supplies the 1:12 slope only. */
export type OpticsMode = "vertical" | "source" | "normal" | "custom";
export interface OpticsState {
  /** Distances are integral decimetres; the custom angle is tenths of a degree. */
  distance: number;
  height: number;
  eye: number;
  length: number;
  angle: number;
  mode: OpticsMode;
  reading: number;
}
export const opticsInitial: OpticsState = {
  distance: 300,
  height: 120,
  eye: 16,
  length: 40,
  angle: 48,
  mode: "source",
  reading: 1,
};
export const opticsBounds = {
  distance: [50, 4000],
  height: [60, 300],
  eye: [5, 25],
  length: [10, 60],
  angle: [0, 850],
  reading: [0, 5],
} as const;
const modes: readonly string[] = ["vertical", "source", "normal", "custom"];
export function parseOptics(search: string) {
  const params = new URLSearchParams(search),
    state = { ...opticsInitial };
  let invalid = false;
  const keys = {
    distance: "d",
    height: "h",
    eye: "e",
    length: "l",
    angle: "a",
    reading: "read",
  } as const;
  for (const key of Object.keys(keys) as (keyof typeof keys)[]) {
    const values = params.getAll(keys[key]);
    if (values.length === 0) continue;
    const raw = values[0] ?? "",
      value = /^\d+$/.test(raw) ? Number(raw) : NaN;
    const [min, max] = opticsBounds[key];
    if (values.length !== 1 || !Number.isInteger(value) || value < min || value > max)
      invalid = true;
    else state[key] = value;
  }
  const mode = params.getAll("mode");
  if (mode.length) {
    if (mode.length !== 1 || !modes.includes(mode[0] ?? "")) invalid = true;
    else state.mode = mode[0] as OpticsMode;
  }
  return { state, invalid };
}
export function opticsQuery(s: OpticsState) {
  return new URLSearchParams({
    d: String(s.distance),
    h: String(s.height),
    e: String(s.eye),
    l: String(s.length),
    a: String(s.angle),
    mode: s.mode,
    read: String(s.reading),
  }).toString();
}
export function opticsModel(s: OpticsState) {
  for (const key of Object.keys(opticsBounds) as (keyof typeof opticsBounds)[]) {
    const [min, max] = opticsBounds[key];
    if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max)
      throw new RangeError(`Unsupported ${key}`);
  }
  if (!modes.includes(s.mode)) throw new RangeError("Unsupported face treatment");
  const distance = s.distance / 10,
    height = s.height / 10,
    eye = s.eye / 10,
    length = s.length / 10;
  const rise = height - eye,
    range = Math.hypot(distance, rise),
    sightAngle = Math.atan2(rise, distance);
  const angle =
    s.mode === "vertical"
      ? 0
      : s.mode === "source"
        ? Math.atan(1 / 12)
        : s.mode === "normal"
          ? sightAngle
          : (s.angle * Math.PI) / 1800;
  const tangent = { x: -Math.sin(angle), z: Math.cos(angle) },
    normal = { x: -Math.cos(angle), z: -Math.sin(angle) };
  const points = [-0.5, -0.25, 0, 0.25, 0.5].map((fraction) => {
    const x = distance + fraction * length * tangent.x,
      z = height + fraction * length * tangent.z;
    const dx = x,
      dz = z - eye,
      depth = (distance * dx + rise * dz) / range,
      imageUp = (-rise * dx + distance * dz) / range;
    if (!(depth > 0)) throw new RangeError("The chosen member crosses the camera plane");
    return {
      fraction,
      x,
      z,
      depth,
      ray: Math.hypot(dx, dz),
      image: imageUp / depth,
      normalizedImage: ((imageUp / depth) * range) / length,
    };
  });
  const bottom = points[0],
    top = points[4];
  if (!top || !bottom) throw new Error("Missing face endpoints");
  const error = sightAngle - angle,
    difference = top.ray - bottom.ray;
  return {
    distance,
    height,
    eye,
    length,
    rise,
    range,
    sightAngle,
    angle,
    tangent,
    normal,
    points,
    top,
    bottom,
    difference,
    error,
    sourceDistance: 12 * rise,
    sourceOffset: length / Math.sqrt(145),
    sourceVerticalRise: (12 * length) / Math.sqrt(145),
    upperLowerRatio: top.image / -bottom.image,
    foreshortening: Math.cos(error),
    relation:
      Math.abs(difference) < 1e-10 ? "equal" : difference > 0 ? "upper-longer" : "lower-longer",
  };
}
export type OpticsModel = ReturnType<typeof opticsModel>;
export const opticsNumber = (value: number, places = 3) =>
  Number(value.toFixed(places)).toLocaleString("en-US", { maximumFractionDigits: places });
export const degrees = (radians: number) => (radians * 180) / Math.PI;

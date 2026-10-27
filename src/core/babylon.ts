/** Comparative projections, not a reconstruction of the built Etemenanki. */
export interface BabylonState {
  supplied: boolean;
  width: number; // integer quarter-nindanu, 17..27
  height: number; // integer quarter-nindanu, 1..12
  base: 900 | 915; // decimetres assigned to the stele image's base ruler
  ruler: "overall" | "terrace";
  selected: number;
  page: string;
}
export const BABYLON_DEFAULT: BabylonState = {
  supplied: true,
  width: 22,
  height: 4,
  base: 915,
  ruler: "overall",
  selected: 1,
  page: "scheil-300",
};
export const BABYLON_PAGES = [
  "scheil-300",
  "scheil-304",
  "scheil-305",
  "tcl6-lix",
  "tcl6-lx",
  "stele-photo",
  "stele-drawing",
] as const;
/** Read via Scheil pp. 300/304; the absent sixth row remains distinct. */
const tablet = [
  [60, 60, 22],
  [52, 52, 12],
  [40, 40, 4],
  [34, 34, 4],
  [28, 28, 4],
  [null, null, null],
  [16, 15, 10],
] as const;
/** Rounded centimetres reported by Pedersen 2024, pp. 188-189. */
export const STELE = [
  [12.4, 3.7],
  [11, 1.3],
  [9.7, 1.2],
  [8.4, 1.2],
  [7, 1.2],
  [5.5, 1.1],
  [3.9, 2.8],
] as const;
export function validBabylon(s: unknown): s is BabylonState {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const a = s as Record<string, unknown>;
  return (
    Object.keys(a).length === 7 &&
    typeof a.supplied === "boolean" &&
    Number.isInteger(a.width) &&
    Number(a.width) >= 17 &&
    Number(a.width) <= 27 &&
    Number.isInteger(a.height) &&
    Number(a.height) >= 1 &&
    Number(a.height) <= 12 &&
    (a.base === 900 || a.base === 915) &&
    (a.ruler === "overall" || a.ruler === "terrace") &&
    Number.isInteger(a.selected) &&
    Number(a.selected) >= 0 &&
    Number(a.selected) < 7 &&
    typeof a.page === "string" &&
    (BABYLON_PAGES as readonly string[]).includes(a.page)
  );
}
export function babylonQuery(s: BabylonState): string {
  if (!validBabylon(s)) throw new Error("Invalid tower comparison");
  return new URLSearchParams({
    supplied: s.supplied ? "1" : "0",
    width: String(s.width),
    height: String(s.height),
    base: String(s.base),
    ruler: s.ruler,
    selected: String(s.selected),
    page: s.page,
  }).toString();
}
export function readBabylon(search: string): { state: BabylonState; invalid: boolean } {
  const p = new URLSearchParams(search);
  if (!p.size) return { state: { ...BABYLON_DEFAULT }, invalid: false };
  const keys = ["supplied", "width", "height", "base", "ruler", "selected", "page"];
  if (
    [...p.keys()].some((k) => !keys.includes(k) || p.getAll(k).length !== 1) ||
    [...p].some(
      ([k, v]) => ["width", "height", "base", "selected"].includes(k) && !/^\d+$/.test(v),
    ) ||
    (p.has("supplied") && !["0", "1"].includes(p.get("supplied") ?? ""))
  )
    return { state: { ...BABYLON_DEFAULT }, invalid: true };
  const state = {
    ...BABYLON_DEFAULT,
    ...(p.has("supplied") ? { supplied: p.get("supplied") === "1" } : {}),
    ...Object.fromEntries(
      [...p]
        .filter(([k]) => k !== "supplied")
        .map(([k, v]) => [k, ["width", "height", "base", "selected"].includes(k) ? Number(v) : v]),
    ),
  };
  return validBabylon(state)
    ? { state, invalid: false }
    : { state: { ...BABYLON_DEFAULT }, invalid: true };
}
export function babylonModel(s: BabylonState) {
  if (!validBabylon(s)) throw new Error("Invalid tower comparison");
  const factor = s.base / 10 / (s.ruler === "overall" ? 12.5 : 12.4);
  let tabletY = 0,
    steleY = 0;
  const rows = tablet.map((t, i) => {
    const unknown = i === 5 && !s.supplied;
    const width = i === 5 ? (unknown ? null : s.width * 1.5) : (t[0] as number) * 1.5;
    const depth = i === 5 ? width : (t[1] as number) * 1.5;
    const height = i === 5 ? (unknown ? null : s.height * 1.5) : (t[2] as number) * 1.5;
    const source = STELE[i] as readonly [number, number];
    const steleWidth = source[0] * factor,
      steleHeight = source[1] * factor;
    const start = i === 6 && !s.supplied ? null : tabletY;
    const result = {
      level: i + 1,
      kind: i === 5 ? (unknown ? "missing" : "supplied") : "tablet-derived",
      width,
      depth,
      height,
      bottom: start,
      steleWidth,
      steleHeight,
      steleBottom: steleY,
      imageWidth: source[0],
      imageHeight: source[1],
    };
    tabletY += height ?? 0;
    steleY += steleHeight;
    return result;
  });
  return {
    rows,
    factor,
    knownHeight: 84,
    tabletHeight: s.supplied ? tabletY : null,
    steleHeight: steleY,
    steleHeightRange: [12.5 * factor, 12.8 * factor],
    secondHeightRatio: (rows[1]?.height ?? 0) / (rows[1]?.steleHeight ?? 1),
    templePlanRatio: 1.8, // approximately, as reported, not measured here
    templeFrontWidth: rows[6]?.steleWidth ?? 0,
  };
}
export function babylonCSV(s: BabylonState): string {
  const m = babylonModel(s);
  const lines = [
    "level,tablet_status,tablet_length_m,tablet_breadth_m,tablet_height_m,tablet_bottom_m,stele_width_cm,stele_height_cm,projected_width_m,projected_height_m,projected_bottom_m,calibration_width_cm,assigned_base_m",
  ];
  for (const r of m.rows)
    lines.push(
      [
        r.level,
        r.kind,
        r.width ?? "",
        r.depth ?? "",
        r.height ?? "",
        r.bottom ?? "",
        r.imageWidth,
        r.imageHeight,
        r.steleWidth,
        r.steleHeight,
        r.steleBottom,
        s.ruler === "overall" ? 12.5 : 12.4,
        s.base / 10,
      ].join(","),
    );
  return `${lines.join("\r\n")}\r\n`;
}
export function babylonRecord(s: BabylonState): string {
  if (!validBabylon(s)) throw new Error("Invalid tower comparison");
  return `${JSON.stringify(
    {
      schema: "gonia-babylon-1",
      state: s,
      units: "metres; integer state widths/heights are quarter-nindanu at 6 m per nindanu",
      limits:
        "Tablet-derived scheme and calibrated image projection; not a survey of the built tower. Missing data are not zero.",
    },
    null,
    2,
  )}\n`;
}
export function readBabylonRecord(text: string): BabylonState {
  const record: unknown = JSON.parse(text);
  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record) ||
    (record as Record<string, unknown>).schema !== "gonia-babylon-1" ||
    !validBabylon((record as Record<string, unknown>).state)
  )
    throw new Error("This is not a complete Babylon comparison record.");
  return { ...(record as { state: BabylonState }).state };
}

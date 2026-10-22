/** Geometric interpretations of Vitruvius IV.3.9 and III.5.14. All mm are chosen model scale. */
export const RECIPES = ["doric", "ionic", "flat"] as const;
export type Recipe = (typeof RECIPES)[number];
export interface FlutingState {
  recipe: Recipe;
  width: number;
  fillet: number;
  point: number;
  gauge: boolean;
  compare: boolean;
}
export const FLUTING_DEFAULT: Readonly<FlutingState> = {
  recipe: "doric",
  width: 100,
  fillet: 20,
  point: 50,
  gauge: true,
  compare: false,
};
export const recipeNames: Record<Recipe, string> = {
  doric: "Doric · square and compass",
  ionic: "Ionic · moving right angle",
  flat: "Doric · twenty flat faces",
};
export interface Point {
  x: number;
  y: number;
}
export function validateFluting(s: FlutingState): void {
  if (
    !RECIPES.includes(s.recipe) ||
    !Number.isInteger(s.width) ||
    s.width < 50 ||
    s.width > 120 ||
    s.width % 5 ||
    !Number.isInteger(s.fillet) ||
    s.fillet < 0 ||
    s.fillet > 30 ||
    s.fillet % 5 ||
    !Number.isInteger(s.point) ||
    s.point < 5 ||
    s.point > 95 ||
    typeof s.gauge !== "boolean" ||
    typeof s.compare !== "boolean"
  )
    throw new RangeError(
      "Choose a listed recipe, a 50–120 mm width in 5 mm steps, and the listed gauge settings.",
    );
}
export function template(recipe: Recipe, width: number) {
  if (!RECIPES.includes(recipe) || !Number.isFinite(width) || width <= 0)
    throw new RangeError("A known recipe and positive width are required.");
  const half = width / 2;
  const radius = recipe === "doric" ? width / Math.SQRT2 : recipe === "ionic" ? half : Infinity;
  const centre: Point = { x: half, y: recipe === "doric" ? -half : 0 };
  const sweep = recipe === "doric" ? Math.PI / 2 : recipe === "ionic" ? Math.PI : 0;
  const depth = recipe === "doric" ? (Math.SQRT2 - 1) * half : recipe === "ionic" ? half : 0;
  const at = (fraction: number): Point => {
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
      throw new RangeError("Use a point from one end of the flute to the other.");
    if (recipe === "flat") return { x: width * fraction, y: 0 };
    // These two endpoint values also avoid tiny negative depths from trigonometric rounding.
    if (fraction === 0) return { x: 0, y: 0 };
    if (fraction === 1) return { x: width, y: 0 };
    const a =
      recipe === "doric" ? (3 * Math.PI) / 4 - (fraction * Math.PI) / 2 : Math.PI * (1 - fraction);
    return { x: centre.x + radius * Math.cos(a), y: centre.y + radius * Math.sin(a) };
  };
  const belowChordArea = recipe === "flat" ? 0 : (radius * radius * (sweep - Math.sin(sweep))) / 2;
  return { width, radius, centre, sweep, depth, at, belowChordArea };
}
export function gaugeReading(s: FlutingState) {
  validateFluting(s);
  const t = template(s.recipe, s.width);
  const a: Point = { x: 0, y: 0 };
  const b: Point = { x: s.width, y: 0 };
  const p = t.at(s.point / 100);
  const ap = { x: a.x - p.x, y: a.y - p.y };
  const bp = { x: b.x - p.x, y: b.y - p.y };
  const leftLength = Math.hypot(ap.x, ap.y);
  const dot = ap.x * bp.x + ap.y * bp.y;
  const cross = ap.x * bp.y - ap.y * bp.x;
  const angle = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
  const leftUnit = { x: ap.x / leftLength, y: ap.y / leftLength };
  const perpendiculars = [
    { x: -leftUnit.y, y: leftUnit.x },
    { x: leftUnit.y, y: -leftUnit.x },
  ];
  const rightUnit = perpendiculars.reduce((best, u) =>
    u.x * bp.x + u.y * bp.y > best.x * bp.x + best.y * bp.y ? u : best,
  );
  // Extend the perpendicular second arm until it crosses the groove's chord.
  // The missed contact is measured along that chord, rather than to an arbitrary arm endpoint.
  const rightTravel = -p.y / rightUnit.y;
  const contact = { x: p.x + rightUnit.x * rightTravel, y: 0 };
  const miss = Math.abs(b.x - contact.x);
  return {
    template: t,
    a,
    b,
    p,
    leftUnit,
    rightUnit,
    leftLength,
    contact,
    angle,
    miss,
    fits: Math.abs(angle - 90) < 1e-8,
  };
}
export function columnSection(s: FlutingState) {
  validateFluting(s);
  const count = s.recipe === "ionic" ? 24 : 20;
  const land = s.recipe === "ionic" ? s.fillet / 100 : 0;
  const pitch = (2 * Math.PI) / count;
  const halfAngle = (pitch * (1 - land)) / 2;
  const radius = s.width / (2 * Math.sin(halfAngle));
  const chordRadius = radius * Math.cos(halfAngle);
  const local = template(s.recipe, s.width);
  const outsideCap = (radius * radius * (2 * halfAngle - Math.sin(2 * halfAngle))) / 2;
  const removed = count * (outsideCap + local.belowChordArea);
  const originalArea = Math.PI * radius * radius;
  const remaining = originalArea - removed;
  const at = (flute: number, fraction: number): Point => {
    if (!Number.isInteger(flute) || flute < 0 || flute >= count)
      throw new RangeError("Unknown flute.");
    const theta = flute * pitch - Math.PI / 2;
    const p = local.at(fraction);
    const radial = chordRadius - p.y;
    const across = p.x - s.width / 2;
    return {
      x: radial * Math.cos(theta) - across * Math.sin(theta),
      y: radial * Math.sin(theta) + across * Math.cos(theta),
    };
  };
  const circleCentre = (flute: number): Point => {
    const theta = flute * pitch - Math.PI / 2;
    const radial = chordRadius - local.centre.y;
    return { x: radial * Math.cos(theta), y: radial * Math.sin(theta) };
  };
  return {
    count,
    land,
    pitch,
    halfAngle,
    radius,
    diameter: 2 * radius,
    chordRadius,
    local,
    removed,
    originalArea,
    remaining,
    removedPercent: (100 * removed) / originalArea,
    radialDepth: radius - chordRadius + local.depth,
    at,
    circleCentre,
  };
}
export function flutingQuery(s: FlutingState): string {
  validateFluting(s);
  return `?recipe=${s.recipe}&width=${s.width}&fillet=${s.fillet}&point=${s.point}&gauge=${Number(s.gauge)}&compare=${Number(s.compare)}`;
}
export function parseFluting(search: string): { state: FlutingState; warning: boolean } {
  const p = new URLSearchParams(search);
  try {
    for (const key of ["recipe", "width", "fillet", "point", "gauge", "compare"])
      if (p.getAll(key).length > 1) throw new Error("Duplicate setting");
    const number = (key: string, fallback: number) => {
      if (!p.has(key)) return fallback;
      const value = p.get(key) ?? "";
      if (!/^\d{1,3}$/.test(value)) throw new Error("Number syntax");
      return Number(value);
    };
    const bool = (key: string, fallback: boolean) => {
      if (!p.has(key)) return fallback;
      const value = p.get(key);
      if (value !== "0" && value !== "1") throw new Error("Boolean syntax");
      return value === "1";
    };
    const state: FlutingState = {
      recipe: (p.get("recipe") ?? FLUTING_DEFAULT.recipe) as Recipe,
      width: number("width", 100),
      fillet: number("fillet", 20),
      point: number("point", 50),
      gauge: bool("gauge", true),
      compare: bool("compare", false),
    };
    validateFluting(state);
    return { state, warning: false };
  } catch {
    return { state: { ...FLUTING_DEFAULT }, warning: true };
  }
}
export function flutingCsv(s: FlutingState): string {
  const section = columnSection(s);
  const rows = [
    "kind,recipe,width_mm,flute_count,fillet_percent_of_pitch,point_percent,x_mm,y_mm,edge_angle_deg,chord_contact_miss_mm,shaft_diameter_mm,removed_area_mm2,flute_index,sample_index",
  ];
  for (const recipe of RECIPES) {
    const c = columnSection({ ...s, recipe });
    const g = gaugeReading({ ...s, recipe });
    rows.push(
      [
        "summary",
        recipe,
        s.width,
        c.count,
        recipe === "ionic" ? s.fillet : 0,
        s.point,
        g.p.x,
        g.p.y,
        g.angle,
        g.miss,
        c.diameter,
        c.removed,
        "",
        "",
      ].join(","),
    );
    for (let point = 5; point <= 95; point++) {
      const reading = gaugeReading({ ...s, recipe, point });
      rows.push(
        [
          "gauge",
          recipe,
          s.width,
          c.count,
          recipe === "ionic" ? s.fillet : 0,
          point,
          reading.p.x,
          reading.p.y,
          reading.angle,
          reading.miss,
          c.diameter,
          c.removed,
          "",
          "",
        ].join(","),
      );
    }
  }
  for (let flute = 0; flute < section.count; flute++)
    for (let sample = 0; sample <= 40; sample++) {
      const p = section.at(flute, sample / 40);
      rows.push(
        [
          "section",
          s.recipe,
          s.width,
          section.count,
          s.recipe === "ionic" ? s.fillet : 0,
          sample * 2.5,
          p.x,
          p.y,
          "",
          "",
          section.diameter,
          section.removed,
          flute,
          sample,
        ].join(","),
      );
    }
  return [...rows, ""].join("\r\n");
}

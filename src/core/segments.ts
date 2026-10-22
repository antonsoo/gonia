import { type FlutingState, type Point, template, validateFluting } from "./fluting";

function angle(a: Point, p: Point, b: Point) {
  const u = { x: a.x - p.x, y: a.y - p.y },
    v = { x: b.x - p.x, y: b.y - p.y };
  return (Math.atan2(Math.abs(u.x * v.y - u.y * v.x), u.x * v.x + u.y * v.y) * 180) / Math.PI;
}
export function segmentPair(s: FlutingState) {
  validateFluting(s);
  if (s.recipe === "flat") return null;
  const t = template(s.recipe, s.width),
    a = { x: 0, y: 0 },
    b = { x: s.width, y: 0 },
    p = t.at(s.point / 100);
  const initial = s.recipe === "doric" ? (3 * Math.PI) / 4 : Math.PI;
  const qAngle = initial + ((2 * Math.PI - t.sweep) * s.point) / 100;
  const q = {
    x: t.centre.x + t.radius * Math.cos(qAngle),
    y: t.centre.y + t.radius * Math.sin(qAngle),
  };
  const cutDegrees = (t.sweep * 180) / Math.PI;
  return {
    a,
    b,
    c: t.centre,
    radius: t.radius,
    p,
    q,
    cutDegrees,
    oppositeArcDegrees: 360 - cutDegrees,
    pAngle: angle(a, p, b),
    qAngle: angle(a, q, b),
    pBaseA: (180 - (cutDegrees * s.point) / 100) / 2,
    pBaseB: (180 - cutDegrees * (1 - s.point / 100)) / 2,
  };
}
export function segmentsCsv(s: FlutingState): string {
  validateFluting(s);
  const rows = [
    "recipe,width_mm,arc_fraction,point,x_mm,y_mm,edge_angle_deg,facing_arc_deg,containing_arc_deg",
  ];
  for (const recipe of ["doric", "ionic"] as const)
    for (let point = 5; point <= 95; point++) {
      const r = segmentPair({ ...s, recipe, point });
      if (!r) throw new Error("Missing circle");
      for (const name of ["P", "Q"] as const) {
        const p = name === "P" ? r.p : r.q;
        rows.push(
          [
            recipe,
            s.width,
            point / 100,
            name,
            p.x,
            p.y,
            name === "P" ? r.pAngle : r.qAngle,
            name === "P" ? r.oppositeArcDegrees : r.cutDegrees,
            name === "P" ? r.cutDegrees : r.oppositeArcDegrees,
          ].join(","),
        );
      }
    }
  return [...rows, ""].join("\r\n");
}

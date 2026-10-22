import type { FlutingState } from "./core/fluting";
import { segmentPair } from "./core/segments";

const n = (v: number) => Number(v.toFixed(6));
export function segmentDrawing(s: FlutingState, which: "P" | "Q"): string {
  const r = segmentPair({ ...s, width: 100 });
  if (!r) return "";
  const p = which === "P" ? r.p : r.q,
    cy = r.c.y,
    major = s.recipe === "doric",
    radius = n(r.radius);
  const minor = `M0,0 A${radius},${radius} 0 0 0 100,0`,
    other = `M0,0 A${radius},${radius} 0 ${major ? 1 : 0} 1 100,0`;
  const containing = which === "P" ? minor : other,
    facing = which === "P" ? other : minor,
    angle = which === "P" ? r.pAngle : r.qAngle,
    arc = which === "P" ? r.oppositeArcDegrees : r.cutDegrees;
  const prefix = `segment-${which.toLowerCase()}`;
  return `<svg id="${prefix}" viewBox="-40 ${cy - 95} 180 190" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" xmlns="http://www.w3.org/2000/svg"><title id="${prefix}-title">${which} makes ${angle.toFixed(0)} degrees in ${major ? (which === "P" ? "the smaller" : "the larger") : "a semicircular"} segment</title><desc id="${prefix}-desc">The green region contains ${which}. The orange arc faces it and measures ${arc.toFixed(0)} degrees. A and B are the same fixed chord endpoints in both drawings.</desc><path id="${prefix}-region" d="${containing} Z" fill="#e1e8d9"/><circle id="${prefix}-circle" cx="50" cy="${cy}" r="${radius}" class="segment-circle"/><path d="M0,0 H100" class="segment-chord"/><path id="${prefix}-facing" d="${facing}" class="segment-facing" data-arc-deg="${arc}"/>
<path id="${prefix}-rays" d="M0,0 L${n(p.x)},${n(p.y)} L100,0" class="segment-rays"/>
${which === "P" ? `<path d="M0,0 L50,${cy} L100,0 M50,${cy} L${n(p.x)},${n(p.y)}" class="segment-radii"/>` : ""}
<circle cx="0" cy="0" r="1.5" fill="#405a43"/><circle cx="100" cy="0" r="1.5" fill="#405a43"/><circle cx="50" cy="${cy}" r="1.3" fill="#405a43"/><text x="53" y="${cy - 3}">C</text><text x="-7" y="2" text-anchor="end">A</text><text x="107" y="2">B</text>
<circle id="${prefix}-point" cx="${n(p.x)}" cy="${n(p.y)}" r="2.2" fill="#f4f1e8" stroke="#963b25" stroke-width=".8" data-x-mm="${(p.x * s.width) / 100}" data-y-mm="${(p.y * s.width) / 100}"/>
<text x="${n(p.x)}" y="${n(p.y + (which === "P" ? 13 : -10))}" text-anchor="${p.x < 15 ? "start" : p.x > 85 ? "end" : "middle"}" class="segment-point-label">${which} · ${angle.toFixed(0)}°</text><text x="50" y="${which === "P" ? cy - r.radius - 11 : cy + r.radius + 11}" text-anchor="middle" class="segment-arc-label">${arc.toFixed(0)}° facing arc</text></svg>`;
}
export function segmentFigures(s: FlutingState): string {
  const r = segmentPair(s);
  if (!r)
    return '<p class="fluting-small">The flat-faced alternative has no construction circle. Choose Doric or Ionic to compare the two circular segments.</p>';
  return `<div class="segment-figures"><figure><h3>From the hollow’s arc: P</h3>${segmentDrawing(s, "P")}<figcaption><strong>${r.pAngle.toFixed(0)}° at P.</strong> Green region: ${s.recipe === "doric" ? "the smaller segment" : "a semicircle"}, containing P. Orange arc: the other side of A–B.</figcaption></figure><figure><h3>From the other arc: Q</h3>${segmentDrawing(s, "Q")}<figcaption><strong>${r.qAngle.toFixed(0)}° at Q.</strong> Green region: ${s.recipe === "doric" ? "the larger segment" : "the other semicircle"}, containing Q. The chord and circle are unchanged.</figcaption></figure></div>`;
}
export function segmentCalculation(s: FlutingState): string {
  const r = segmentPair(s);
  if (!r) return "";
  return `<h3>Two isosceles triangles explain P.</h3><p>CA, CP and CB are radii of one circle. In triangles CAP and CPB, the two base angles in each triangle are equal. Their angles at C divide the cut’s ${r.cutDegrees.toFixed(0)}° arc.</p><div class="segment-equations"><p>(180° − ${((r.cutDegrees * s.point) / 100).toFixed(2)}°) ÷ 2 = <strong>${r.pBaseA.toFixed(2)}°</strong><span>base angle in CAP</span></p><p>(180° − ${(r.cutDegrees * (1 - s.point / 100)).toFixed(2)}°) ÷ 2 = <strong>${r.pBaseB.toFixed(2)}°</strong><span>base angle in CPB</span></p></div><p>At P, add them: <strong>${r.pBaseA.toFixed(2)}° + ${r.pBaseB.toFixed(2)}° = ${r.pAngle.toFixed(0)}°</strong>. Moving P changes the two parts but not their sum: 180° − ${r.cutDegrees.toFixed(0)}° ÷ 2.</p><p>A, P, B and Q form a cyclic quadrilateral. Its opposite angles add to two right angles (<a href="https://www.claymath.org/library/historical/euclid/files/elem.3.22.html">Euclid III.22</a>), so Q makes <strong>180° − ${r.pAngle.toFixed(0)}° = ${r.qAngle.toFixed(0)}°</strong>.</p><p class="fluting-small">The arc extents and degree arithmetic are modern annotations. A 270° label describes an arc; it does not assign Euclid an ordinary 270° central angle. The Q comparison is geometry, not another carved-flute prescription. Connecting these texts is our teaching choice; it does not document a mason’s method.</p>`;
}

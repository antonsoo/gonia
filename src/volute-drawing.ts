import {
  type CompassArc,
  minus,
  norm,
  type PinPoint,
  quarterArc,
  repairJoin,
  VOLUTE_PINS,
  VOLUTE_START,
  type VoluteJoin,
  type VoluteState,
  voluteSummary,
} from "./core/volute";
import { ve, vn } from "./volute-content";

export const voluteInk = `text{font-family:Plex,Arial,sans-serif;fill:#263b50;font-size:13px}.fine{font-size:11px;fill:#536779}.axis{stroke:#bdcedc;stroke-width:1;stroke-dasharray:5 5}.eye{fill:#e3ecf5;stroke:#466b92;stroke-width:1.5}.curve{fill:none;stroke:#263b50;stroke-width:2.7;stroke-linecap:butt}.active{stroke:#80446d;stroke-width:3.6}.preview{stroke:#80446d;stroke-width:1.8;stroke-dasharray:5 5;fill:none}.leg{stroke:#80446d;stroke-width:1.1;fill:none}.pin{fill:#466b92}.selected-pin{fill:#80446d;stroke:white;stroke-width:1.5}.repair{stroke:#286653;stroke-width:2;stroke-dasharray:4 3;fill:none}.join{fill:white;stroke:#80446d;stroke-width:1.5}.tangent-before{stroke:#80446d;stroke-width:2.5}.tangent-after{stroke:#466b92;stroke-width:2.5;stroke-dasharray:6 4}.tangent-repaired{stroke:#286653;stroke-width:2.5;stroke-dasharray:8 3}.measure{font-family:monospace;font-size:12px}`;

export function arcPoints(a: CompassArc): PinPoint[] {
  const v = minus(a.start, a.centre);
  return Array.from({ length: 49 }, (_, i) => {
    const angle = (-(i / 48) * Math.PI) / 2;
    return {
      x: a.centre.x + v.x * Math.cos(angle) - v.y * Math.sin(angle),
      y: a.centre.y + v.x * Math.sin(angle) + v.y * Math.cos(angle),
    };
  });
}
export function voluteBounds(s: VoluteState) {
  const { arcs } = voluteSummary(s);
  const preview = s.moves.length < 12 ? quarterArc(arcs.at(-1)?.end ?? VOLUTE_START, s.pin) : null;
  const points = [...arcs, ...(preview ? [preview] : [])].flatMap(arcPoints);
  return {
    minX: Math.min(-44, ...points.map((p) => p.x)),
    maxX: Math.max(56, ...points.map((p) => p.x)),
    minY: Math.min(-48, ...points.map((p) => p.y)),
    maxY: Math.max(62, ...points.map((p) => p.y)),
  };
}
export function voluteDrawing(s: VoluteState): string {
  const m = voluteSummary(s),
    b = voluteBounds(s),
    scale = Math.min(610 / (b.maxX - b.minX), 550 / (b.maxY - b.minY)),
    ox = 360 - ((b.minX + b.maxX) / 2) * scale,
    oy = 330 + ((b.minY + b.maxY) / 2) * scale;
  const x = (p: PinPoint) => ox + p.x * scale,
    y = (p: PinPoint) => oy - p.y * scale;
  const path = (a: CompassArc, cls: string, extra = "") =>
    `<path class="${cls}" ${extra} d="M${x(a.start)} ${y(a.start)} A${Math.sqrt(a.radiusSquared) * scale} ${Math.sqrt(a.radiusSquared) * scale} 0 0 1 ${x(a.end)} ${y(a.end)}"/>`;
  const preview = s.moves.length < 12 ? quarterArc(m.end, s.pin) : null;
  const focus = preview ?? m.arcs.findLast((a) => a.pin === s.pin);
  const selected = m.joins.find((j) => j.index === s.join);
  const repair = selected && !selected.eye && s.repair ? repairJoin(selected) : null;
  let repaired = "";
  if (repair && selected) {
    const radius = norm(minus(selected.point, repair.centre)) * scale;
    repaired = `<path class="repair" d="M${x(selected.point)} ${y(selected.point)} A${radius} ${radius} 0 0 1 ${x(repair.end)} ${y(repair.end)}"/><circle class="selected-pin" cx="${x(repair.centre)}" cy="${y(repair.centre)}" r="3"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 650" role="img" aria-label="Compass drawing: ${m.arcs.length} committed quarter circles; ${s.moves.length < 12 ? `centre ${s.pin} previews the next arc` : `endpoint (${vn(m.end.x / 12)}, ${vn(m.end.y / 12)}) eye diameters`}"><style>${voluteInk}</style><rect width="720" height="650" fill="#f2f6fa"/><text x="30" y="29">${m.arcs.length}/12 quarter circles drawn</text><text x="690" y="29" text-anchor="end" class="fine">Equal length scales · e = eye diameter</text><path class="axis" d="M30 ${oy} H690 M${ox} 45 V605"/><circle class="eye" cx="${ox}" cy="${oy}" r="${6 * scale}"/>${VOLUTE_PINS.map((p, i) => `<circle class="${i + 1 === s.pin ? "selected-pin" : "pin"}" cx="${x(p)}" cy="${y(p)}" r="${i + 1 === s.pin ? 4 : 1.6}"/>`).join("")}${m.arcs.map((a, i) => path(a, `curve${a === focus ? " active" : ""}`, `data-arc="${i + 1}" data-pin="${a.pin}" data-radius-squared="${a.radiusSquared}"`)).join("")}${preview ? path(preview, "preview") : ""}${focus ? `<path class="leg" d="M${x(focus.start)} ${y(focus.start)} L${x(focus.centre)} ${y(focus.centre)} L${x(focus.end)} ${y(focus.end)}"/>` : ""}${repaired}${selected ? `<circle class="join" cx="${x(selected.point)}" cy="${y(selected.point)}" r="5"/>` : ""}<circle class="join" cx="${x(m.end)}" cy="${y(m.end)}" r="3"/><text x="${x(VOLUTE_START) + 9}" y="${y(VOLUTE_START) - 10}" class="fine">Start · (0, 4½ e)</text><text x="30" y="628" class="fine">1889 printed guide → ideal circular arcs. New drawing, not an ancient capital survey.</text></svg>`;
}
export function joinDrawing(j: VoluteJoin | undefined, repaired: boolean): string {
  if (!j || j.angle === null)
    return `<p>No pair of nonzero radii is available here. Draw another arc or choose another join.</p>`;
  // Orient the incoming tangent horizontally. Rotate the outgoing by the actual
  // signed angle between radius vectors. The angle is never visually magnified.
  const angle = Math.atan2(j.cross, j.dot),
    length = 160;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 230" role="img" aria-label="Tangent directions differ by ${vn(j.angle)} degrees, drawn at the actual angle. The incoming direction is horizontal."><style>${voluteInk}</style><defs><marker id="vo-arriving" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#80446d"/></marker><marker id="vo-departing" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#466b92"/></marker><marker id="vo-aligned" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#286653"/></marker></defs><rect width="440" height="230" fill="#f2f6fa"/><text x="22" y="26">Directions at actual angles</text><text class="fine" x="22" y="46">Incoming tangent rotated to horizontal; both rotate together.</text><line marker-end="url(#vo-arriving)" class="tangent-before" x1="60" y1="122" x2="380" y2="122"/><line marker-end="url(#vo-departing)" class="tangent-after" x1="${220 - length * Math.cos(angle)}" y1="${122 + length * Math.sin(angle)}" x2="${220 + length * Math.cos(angle)}" y2="${122 - length * Math.sin(angle)}"/>${repaired ? '<line marker-end="url(#vo-aligned)" class="tangent-repaired" x1="60" y1="122" x2="380" y2="122"/>' : ""}<circle class="join" cx="220" cy="122" r="4"/><text x="22" y="191" class="measure">${vn(j.angle)}° ${j.eye ? "to the eye-circle direction" : "at this join"}</text><text x="22" y="212" class="fine">Solid plum: arriving. Dashed blue: departing.${repaired ? " Green: aligned." : ""}</text></svg>`;
}

/** A physical-size outline with a real 50 mm calibration bar. */
export function voluteStencil(s: VoluteState, font: string, license: string): string {
  const b = voluteBounds(s),
    scale = s.eye / 12;
  const width = Math.max(210, Math.ceil((b.maxX - b.minX) * scale + 35)),
    height = Math.max(297, Math.ceil((b.maxY - b.minY) * scale + 110)),
    ox = 18 - b.minX * scale,
    oy = 42 + b.maxY * scale;
  const p = (v: PinPoint) => `${ox + v.x * scale} ${oy - v.y * scale}`;
  const arcs = voluteSummary(s).arcs;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}"><title>Gonia · compass sheet · e = ${s.eye} mm</title><desc>${ve(license)}. New drawing, MIT, Anton Soloviev, 2026. Based on Juglaris and Locke 1889 plate XV, not an ancient survey.</desc><style>@font-face{font-family:Plex;src:url('${font}')}text{font-family:Plex,Arial,sans-serif;fill:#263b50;font-size:3.2px}</style><rect width="${width}" height="${height}" fill="white"/><text x="18" y="16" style="font-size:6px">The compass changes centre.</text><text x="18" y="24">Eye diameter e = ${s.eye} mm · ${arcs.length} committed arcs · sheet ${width} × ${height} mm</text><text x="18" y="31">Exact quarter-turn interpretation of Juglaris &amp; Locke, 1889, plate XV.</text><g fill="none" stroke="#263b50" stroke-width=".25"><circle cx="${ox}" cy="${oy}" r="${s.eye / 2}"/>${arcs
    .map((a) => {
      const r = Math.sqrt(a.radiusSquared) * scale;
      return `<path d="M${p(a.start)} A${r} ${r} 0 0 1 ${p(a.end)}"/>`;
    })
    .join(
      "",
    )}</g>${VOLUTE_PINS.map((v) => `<path d="M${ox + v.x * scale - 0.35} ${oy - v.y * scale} h.7 m-.35 -.35 v.7" stroke="#80446d" stroke-width=".12"/>`).join("")}<text x="18" y="${height - 62}">Your sequence: ${s.moves.join(" → ") || "No arcs yet"}</text><text x="18" y="${height - 53}">Twelve pin locations are crosses. Coordinates and radii are in the measurement CSV.</text><text x="18" y="${height - 44}">Print at actual size / 100%. Verify the bar before using the compass sheet.</text><path id="calibration" d="M18 ${height - 36} v4 m0 -2 h50 m0 -2 v4" fill="none" stroke="#263b50" stroke-width=".25"/><text x="72" y="${height - 33}">50 mm</text><text x="18" y="${height - 22}">Local tangent repair is an inspection overlay; it is not applied to this physical outline.</text><text x="18" y="${height - 14}">https://antonsoo.github.io/gonia/volute.html · New drawing © 2026 Anton Soloviev · MIT</text></svg>`;
}

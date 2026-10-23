import { type TransportState, transportModel } from "./core/transport";

export const transportNumber = (n: number, digits = 3) =>
  (Math.abs(n) < 0.5 * 10 ** -digits ? 0 : n).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
export const transportEscape = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
export const transportUnit = (s: TransportState) =>
  s.unit === "feet" ? "source feet" : "chosen units";

export function transportDrawing(s: TransportState, prefix = "transport"): string {
  const m = transportModel(s);
  const scale = 20;
  const ox = 320,
    ground = 440;
  // Frame the entire turn's envelope, so a large obstructed section is never
  // clipped. The frame stays fixed while the angle changes.
  const highest =
    s.kind === "shaft"
      ? 2 * s.radius
      : s.kind === "bare"
        ? 2 * m.diagonalRadius
        : Math.max(2 * s.radius, s.radius + m.diagonalRadius);
  const lowest = s.kind === "wheels" ? Math.min(0, s.radius - m.diagonalRadius) : 0;
  const top = ground - highest * scale - 55;
  const bodyBottom = ground - lowest * scale;
  const rulerY = bodyBottom + 35;
  const bottom = rulerY + 60;
  const x = (v: number) => ox + (v - m.centre.x) * scale;
  const y = (v: number) => ground - v * scale;
  const body = m.corners.map((p) => `${ox + p.x * scale},${y(m.centre.y + p.y)}`).join(" ");
  const ticks = [];
  const step = s.radius < 3 ? 1 : 2;
  for (let n = Math.floor((m.centre.x - 14) / step) * step; n <= m.centre.x + 14; n += step)
    ticks.push(
      `<path d="M${x(n)},${rulerY}v9" class="road-tick"/><text x="${x(n)}" y="${rulerY + 28}" text-anchor="middle" class="small-label" data-road-mark="${n}">${transportNumber(n)}</text>`,
    );
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4 - m.radians;
    return `<path d="M${ox},${y(m.centre.y)}l${Math.cos(angle) * s.radius * scale},${-Math.sin(angle) * s.radius * scale}" class="wheel-spoke"/>`;
  }).join("");
  const contacts = m.contacts
    .map((p) => `<circle cx="${x(p.x)}" cy="${ground}" r="4" class="road-contact"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} 640 ${bottom - top}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-drawing="transport" data-scale="${scale}" data-origin-x="${ox}" data-ground-y="${ground}" data-world-centre-x="${m.centre.x}" data-world-centre-y="${m.centre.y}"><title id="${prefix}-title">End view at ${s.angle} degrees, camera following the centre</title><desc id="${prefix}-desc">${s.kind === "shaft" ? "A circular shaft rolls directly on the ground." : s.kind === "bare" ? "A rectangular stone rolls about successive corners; its centre rises and falls." : "A rectangular stone turns together with an outer wheel. The two end wheels overlap in this view."} Centre height ${transportNumber(m.centre.y, 8)}, eastward advance ${transportNumber(m.centre.x, 8)} ${transportUnit(s)}.${m.intrudes ? " The stone intersects the ground at this wheel height; this pose is geometrically blocked." : ""} Horizontal and vertical lengths have the same scale.</desc><defs><clipPath id="${prefix}-below"><rect x="0" y="${ground}" width="640" height="${bodyBottom - ground + 15}"/></clipPath><marker id="${prefix}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0L7,3.5L0,7" fill="#405a43"/></marker></defs>
  <text x="22" y="${top + 24}" class="small-label">VIEW ALONG THE STONE’S LENGTH</text><text x="618" y="${top + 24}" text-anchor="end" class="small-label">EQUAL LENGTH SCALES</text>
  ${s.kind === "bare" ? "" : `<circle cx="${ox}" cy="${y(m.centre.y)}" r="${s.radius * scale}" class="${s.kind === "shaft" ? "rolling-shaft" : "wooden-wheel"}" data-shape="rolling-circle"/>${s.kind === "wheels" ? spokes : ""}`}
  ${s.kind === "shaft" ? `<path d="M${ox},${y(m.centre.y)}l${Math.sin(m.radians) * s.radius * scale},${Math.cos(m.radians) * s.radius * scale}" class="wheel-index"/>` : `<polygon points="${body}" class="transport-stone" data-shape="stone"/>${m.intrudes ? `<polygon points="${body}" clip-path="url(#${prefix}-below)" class="stone-intrusion"/>` : ""}`}
  <path d="M20,${ground}H620" class="road"/><path d="M40,${rulerY}H600" class="road"/>${ticks.join("")}${contacts}
  <circle cx="${ox}" cy="${y(m.centre.y)}" r="4" class="stone-centre" data-shape="centre"/><text x="${ox + 12}" y="${y(m.centre.y) - 12}" class="point-label">C</text>
  <path d="M75,${y(m.centre.y)}H95m-10,0V${ground}m-10,0H95" class="height-dimension"/><text x="${65}" y="${(y(m.centre.y) + ground) / 2}" text-anchor="end" class="small-label">${transportNumber(m.centre.y)}</text>
  ${s.kind === "wheels" || s.kind === "shaft" ? `<path d="M${ox + 10},${y(m.centre.y) + 7}h${s.radius * scale + 38}" class="pull-frame" marker-end="url(#${prefix}-arrow)"/><text x="${ox + s.radius * scale + 45}" y="${y(m.centre.y) + 28}" text-anchor="end" class="small-label">pull the frame</text>` : ""}
  <text x="320" y="${rulerY + 50}" text-anchor="middle" class="small-label">Road ruler in ${transportUnit(s)} · camera moves with C</text></svg>`;
}

export function transportGraph(s: TransportState, prefix = "height"): string {
  const m = transportModel(s);
  const max = Math.max(s.radius, m.diagonalRadius) + 1;
  const x = (degree: number) => 55 + (degree / 360) * 510;
  const y = (h: number) => 220 - (h / max) * 170;
  const needed = (angle: number) => transportModel({ ...s, kind: "bare" }, angle).centre.y;
  const curve = Array.from(
    { length: 181 },
    (_, i) => `${i === 0 ? "M" : "L"}${x(i * 2)},${y(needed(i * 2))}`,
  ).join("");
  const selected = s.kind === "bare" ? m.centre.y : s.radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 285" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-graph-x-origin="55" data-graph-x-per-degree="${510 / 360}" data-graph-y-origin="220" data-graph-y-per-unit="${170 / max}"><title id="${prefix}-title">Centre height through one turn</title><desc id="${prefix}-desc">The changing curve is the minimum height required by the rectangular stone at each rotation. A bare stone follows it. A stone in wheels stays at the wheel radius. A wheel radius below any part of the curve cannot carry that section through a full turn without ground intersection. This is a modern kinematic comparison.</desc>
  <path d="M55,35V220H565" class="graph-axis"/>${[0, 90, 180, 270, 360].map((n) => `<path d="M${x(n)},220v5" class="graph-axis"/><text x="${x(n)}" y="246" text-anchor="middle" class="small-label">${n}°</text>`).join("")}
  ${[0, Math.round(max / 2), Math.ceil(max)].map((n) => `<text x="43" y="${y(n) + 5}" text-anchor="end" class="small-label">${n}</text>`).join("")}
  <path d="M55,${y(s.radius)}H565" class="fixed-height"/><path d="${curve}" class="needed-height" data-shape="required-height"/>
  <path d="M${x(s.angle)},220V35" class="phase-guide"/><circle cx="${x(s.angle)}" cy="${y(selected)}" r="5" class="graph-selected"/>
  <text x="55" y="22" class="small-label">HEIGHT / ${transportUnit(s).toUpperCase()}</text><text x="310" y="278" text-anchor="middle" class="small-label">Rotation · horizontal and vertical axes have different units</text></svg>`;
}

import { degrees, type OpticsState, opticsModel, opticsNumber } from "./core/optics";
export const oe = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const n = (x: number) => Number(x.toFixed(5));
function svg(w: number, h: number, title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="vp-diagram" viewBox="0 0 ${w} ${h}" role="img" aria-label="${oe(title)}"><title>${oe(title)}</title><style>.vp-diagram text{font:16px Georgia,serif;fill:#27352f}.vp-diagram .small{font:13px Arial,sans-serif}.vp-diagram .guide{fill:none;stroke:#a7ad9e;stroke-width:1.2}.vp-diagram .upper{stroke:#963b25;fill:none;stroke-width:2}.vp-diagram .lower{stroke:#405a43;fill:none;stroke-width:2;stroke-dasharray:7 5}.vp-diagram .aim{stroke:#737d73;stroke-width:1.2;stroke-dasharray:3 5;fill:none}.vp-diagram .face{stroke:#27352f;stroke-width:5;fill:none}.vp-diagram .paper{fill:#f4f1e8}.vp-diagram .label{paint-order:stroke;stroke:#f4f1e8;stroke-width:4;stroke-linejoin:round}</style>${body}</svg>`;
}
export function opticsScene(s: OpticsState, highlight = "") {
  const m = opticsModel(s),
    scale = Math.min(810 / (m.distance + 8), 275 / (m.height + m.length / 2 + 1)),
    x = (v: number) => 80 + v * scale,
    y = (v: number) => 350 - v * scale;
  const eye = { x: x(0), y: y(m.eye) },
    top = { x: x(m.top.x), y: y(m.top.z) },
    bottom = { x: x(m.bottom.x), y: y(m.bottom.z) },
    cx = x(m.distance),
    cy = y(m.height),
    unit = m.distance > 100 ? 50 : m.distance > 30 ? 10 : 5;
  return svg(
    960,
    435,
    "Chosen observer and a flat upper member, drawn with equal horizontal and vertical scales",
    `
 <text x="20" y="27" class="small">SIDE VIEW / EQUAL X–Y SCALE / CHOSEN METRES</text>
 <path d="M60 350H920" class="guide"/><path d="M${cx} 350V${cy}" class="aim"/>
 <path d="M${eye.x} ${eye.y}L${cx} ${cy}" class="aim"/>
 <path d="M${eye.x} ${eye.y}L${top.x} ${top.y}" class="upper" data-ray="upper" style="stroke-width:${highlight === "upper" ? 4 : 2}"/>
 <path d="M${eye.x} ${eye.y}L${bottom.x} ${bottom.y}" class="lower" data-ray="lower" style="stroke-width:${highlight === "lower" ? 4 : 2}"/>
 <path d="M${cx} ${y(m.height + m.length / 2)}V${y(m.height - m.length / 2)}" class="aim"/>
 <path d="M${bottom.x} ${bottom.y}L${top.x} ${top.y}" class="face" data-face="current"/>
 ${m.points.map((p) => `<circle cx="${n(x(p.x))}" cy="${n(y(p.z))}" r="3.3" fill="#f4f1e8" stroke="#27352f" data-fraction="${p.fraction}" data-world-x="${p.x}" data-world-z="${p.z}"/>`).join("")}
 <circle cx="${eye.x}" cy="${eye.y}" r="${highlight === "eye" ? 8 : 5}" fill="#963b25"/>
 <text x="${eye.x - 25}" y="${eye.y - 18}" class="label">E / eye</text>
 <path d="M${top.x} ${top.y}L${cx + 22} ${cy - 28}M${bottom.x} ${bottom.y}L${cx + 22} ${cy + 28}" class="guide"/>
 <text x="${cx + 25}" y="${cy - 30}" class="label">T</text><text x="${cx + 25}" y="${cy + 5}" class="label">C</text><text x="${cx + 25}" y="${cy + 38}" class="label">B</text>
 <text x="${(eye.x + cx) / 2}" y="377" text-anchor="middle">horizontal distance ${opticsNumber(m.distance, 1)} m</text>
 <path d="M80 409H${80 + unit * scale}M80 404V414M${80 + unit * scale} 404V414" stroke="#737d73"/>
 <text x="${90 + unit * scale}" y="414" class="small">${unit} m</text><text x="920" y="414" text-anchor="end" class="small">The face rotates around C. Dashed vertical: the upright reference.</text>`,
  );
}
export function opticsDetail(s: OpticsState) {
  const m = opticsModel(s),
    cx = 230,
    cy = 153,
    scale = 31;
  const top = { x: cx + (m.top.x - m.distance) * scale, y: cy - (m.top.z - m.height) * scale },
    bottom = { x: cx + (m.bottom.x - m.distance) * scale, y: cy - (m.bottom.z - m.height) * scale };
  const start = Math.PI - m.sightAngle,
    end = Math.PI - m.angle,
    r = 65;
  const a = { x: cx + r * Math.cos(start), y: cy + r * Math.sin(start) },
    b = { x: cx + r * Math.cos(end), y: cy + r * Math.sin(end) };
  return svg(
    440,
    330,
    "A face normal compared with the direction to the chosen eye",
    `
 <text x="20" y="25" class="small">DETAIL / SEPARATE SCALE, SAME ANGLES</text>
 <path d="M${cx} 43V270" class="aim"/><path d="M${bottom.x} ${bottom.y}L${top.x} ${top.y}" class="face"/>
 <path d="M${cx} ${cy}L${cx - 110 * Math.cos(m.angle)} ${cy + 110 * Math.sin(m.angle)}" stroke="#405a43" stroke-width="2.5"/>
 <path d="M${cx} ${cy}L${cx - 110 * Math.cos(m.sightAngle)} ${cy + 110 * Math.sin(m.sightAngle)}" stroke="#963b25" stroke-width="2" stroke-dasharray="3 5"/>
 ${Math.abs(m.error) > 1e-10 ? `<path d="M${a.x} ${a.y}A${r} ${r} 0 0 ${m.error > 0 ? 1 : 0} ${b.x} ${b.y}" class="upper"/>` : ""}
 <circle cx="${cx}" cy="${cy}" r="3" fill="#27352f"/><text x="${cx + 20}" y="${cy + 6}">C</text>
 <text x="20" y="288">${opticsNumber(Math.abs(degrees(m.error)), 3)}° from facing the eye</text>
 <text x="20" y="314" class="small">Solid green: face normal. Dotted red: direction to E.</text>`,
  );
}
export function opticsProjection(s: OpticsState) {
  const m = opticsModel(s),
    y = (v: number) => 170 - 215 * v;
  return svg(
    440,
    340,
    "Projected spacing of equal physical divisions, compared with a face-on reference",
    `
 <text x="20" y="25" class="small">PINHOLE SPACING / CAMERA AIMED AT C</text>
 <text x="105" y="52" text-anchor="middle" class="small">face-on reference</text><text x="300" y="52" text-anchor="middle" class="small">chosen face</text>
 <path d="M105 ${y(-0.5)}V${y(0.5)}" class="aim"/>
 ${[-0.5, -0.25, 0, 0.25, 0.5].map((v) => `<path d="M86 ${y(v)}H124" class="guide"/>`).join("")}
 <path d="M300 ${y(m.bottom.normalizedImage)}V${y(m.top.normalizedImage)}" class="face"/>
 ${m.points.map((p) => `<path d="M277 ${y(p.normalizedImage)}H323" stroke="#963b25" stroke-width="2" data-image-fraction="${p.fraction}" data-image-coordinate="${p.normalizedImage}"/>`).join("")}
 <text x="20" y="310" class="small">Same face length; one quarter between physical marks.</text>
 <text x="20" y="331" class="small">Image scale: L / eye-to-centre distance.</text>`,
  );
}

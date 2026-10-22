import type { Term } from "./content";
import { type Corner, number } from "./core/corner";

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

const scale = 70;
const x = (u: number) => 60 + u * scale;
const fmt = (v: number) => Number(v.toFixed(3));
const line = (x1: number, y1: number, x2: number, y2: number, cls = "") =>
  `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" class="${cls}"/>`;
const text = (px: number, py: number, label: string, cls = "", anchor = "middle") =>
  `<text x="${fmt(px)}" y="${fmt(py)}" class="${cls}" text-anchor="${anchor}">${escapeHtml(label)}</text>`;
const rect = (px: number, py: number, width: number, height: number, cls: string) =>
  `<rect x="${fmt(px)}" y="${fmt(py)}" width="${fmt(width)}" height="${fmt(height)}" class="${cls}"/>`;
function dimension(a: number, b: number, y: number, label: string, cls = ""): string {
  return `<g class="dimension ${cls}">${line(a, y, b, y)}${line(a, y - 6, a, y + 6)}${line(b, y - 6, b, y + 6)}${text((a + b) / 2, y - 12, label)}</g>`;
}

export const drawingStyle = `
svg{font-family:"Plex",Arial,sans-serif;color:#27352f}
.stone{fill:#e7e2d6;stroke:#72776c;stroke-width:1.4}
.beam{fill:#d5d8c9;stroke:#596953;stroke-width:1.4}
.panel{fill:#f7f4ed;stroke:#72776c;stroke-width:1}
.triglyph{fill:#b9c6b3;stroke:#425c44;stroke-width:1.4}
.groove{fill:#71866c;stroke:none}
.shaft-line{stroke:#a4a89b;stroke-width:1;fill:none}
.axis{stroke:#536b58;stroke-width:1.5;stroke-dasharray:6 5;fill:none}
.edge{stroke:#6a6b61;stroke-width:1;stroke-dasharray:2 5}
.dimension{stroke:#52604f;stroke-width:1.3;fill:none}
.dimension text{stroke:none;fill:#27352f;font-size:17px}
.discrepancy{fill:#b0472c;stroke:#b0472c}
.discrepancy text{fill:#963b25}
.gap{fill:#efd0b9;stroke:#b0472c;stroke-width:1.3;stroke-dasharray:3 3}
.annotation{font-size:17px;fill:#4f5d4c;stroke:none}
.tiny{font-size:15px;fill:#4f5d4c;stroke:none}
.selected{fill:#edc697;stroke:#88391f;stroke-width:3}
.corner-mark{stroke:#b0472c;stroke-width:2;fill:none}
.cropline{stroke:#72776c;stroke-width:1.6;fill:none}
`;

export function elevation(c: Corner, selected: Term | null = null, compact = false): string {
  const width = compact ? 550 : 960;
  const end = compact ? 7.1 : 12.1;
  const highlight = (term: Term, cls: string) => `${cls}${selected === term ? " selected" : ""}`;
  const firstAxis = c.columnAxes[0] as number;
  const firstCenter = c.triglyphCenters[0] as number;
  const description = `Front elevation. ${c.parameters.treatment === "align" ? `A ${number(c.cornerGap)} T strip remains at the corner.` : `The corner triglyph is ${number(c.cornerOffset)} T outward of its column axis.`} The end metope is ${number(c.metopes[0]?.width ?? 0)} T wide; the end column bay is ${number(c.bays[0] ?? 0)} T between axes.`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 420" role="img" aria-labelledby="elevation-title elevation-desc"><title id="elevation-title">Doric corner: front elevation</title><desc id="elevation-desc">${escapeHtml(description)}</desc><style>${drawingStyle}${compact ? ".dimension text,.annotation{font-size:21px}.tiny{font-size:19px}" : ""}</style>`;
  // These profiles are diagrammatic. Only horizontal frieze and axis dimensions are modeled.
  c.columnAxes.forEach((axis) => {
    const cx = x(axis);
    const half = 22 + c.parameters.beam * 10;
    s += `<g class="${selected === "column" ? "selected-column" : ""}"><path class="${highlight("column", "stone")}" d="M${cx - half} 263 L${cx + half} 263 L${cx + half + 8} 355 L${cx - half - 8} 355 Z"/>`;
    for (let k = -2; k <= 2; k++)
      s += line(cx + (k * half) / 3, 264, cx + (k * (half + 8)) / 3, 355, "shaft-line");
    s += `<path class="stone" d="M${cx - half} 264 Q${cx - half - 12} 250 ${cx - half - 17} 238 L${cx + half + 17} 238 Q${cx + half + 12} 250 ${cx + half} 264Z"/>`;
    s += rect(cx - half - 20, 222, 2 * half + 40, 16, "stone");
    s += `<path d="M${cx - half - 9} 354 l${half / 2} -4 l${half / 2} 8 l${half / 2} -8 l${half / 2 + 18} 4" class="cropline"/></g>`;
  });
  s += rect(x(0), 153, end * scale, 69, highlight("beam", "beam"));
  s += rect(x(0), 48, end * scale, 105, "panel");
  c.metopes.forEach((m, i) => {
    s += rect(x(m.left), 48, m.width * scale, 105, highlight("metope", "panel"));
    if (i < (compact ? 2 : 4))
      s += dimension(
        x(m.left),
        x(m.right),
        31,
        `${number(m.width)} T`,
        i === 0 && c.parameters.treatment === "widen" && c.discrepancy > 0 ? "discrepancy" : "",
      );
  });
  if (c.cornerGap > 0) s += rect(x(0), 48, c.cornerGap * scale, 105, "gap");
  c.triglyphCenters.forEach((center) => {
    const left = x(center - 0.5);
    s += rect(left, 48, 70, 105, highlight("triglyph", "triglyph"));
    s +=
      rect(left, 55, 70 / 12, 91, "groove") +
      rect(left + 70 / 4, 55, 70 / 6, 91, "groove") +
      rect(left + (70 * 7) / 12, 55, 70 / 6, 91, "groove") +
      rect(left + (70 * 11) / 12, 55, 70 / 12, 91, "groove");
  });
  s += rect(x(0), 153, end * scale, 6, "stone");
  s += line(x(0), 15, x(0), 375, selected === "corner" ? "corner-mark" : "edge");
  c.columnAxes.forEach((axis, i) => {
    s += line(x(axis), 43, x(axis), 389, "axis");
    if (i < 2 && (!compact || i === 0))
      s += dimension(
        x(axis),
        x(c.columnAxes[i + 1] as number),
        391,
        `${number(c.bays[i] as number)} T · axes`,
        i === 0 && c.parameters.treatment === "contract" && c.discrepancy > 0 ? "discrepancy" : "",
      );
  });
  if (c.discrepancy > 0) {
    const a = c.parameters.treatment === "align" ? x(0) : x(firstCenter);
    const b = c.parameters.treatment === "align" ? x(firstCenter - 0.5) : x(firstAxis);
    s += `<g class="discrepancy">${line(a, 169, a, 201)}${line(b, 169, b, 201)}${line(a, 185, b, 185)}</g>`;
    s += text(
      x(0) + 8,
      213,
      `${number(c.discrepancy)} T ${c.parameters.treatment === "align" ? "gap" : "offset"}`,
      "annotation",
      "start",
    );
  }
  s += text(
    width - 15,
    412,
    compact
      ? "Corner detail · shafts cut short"
      : "Local elevation · shafts cut short · roof omitted",
    "tiny",
    "end",
  );
  return `${s}</svg>`;
}

export function plan(c: Corner, selected: Term | null = null, compact = false): string {
  const width = compact ? 550 : 960;
  const end = compact ? 7.1 : 12.1;
  const b = c.parameters.beam;
  const cy = 330 - (b * scale) / 2;
  const first = c.triglyphCenters[0] as number;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 400" role="img" aria-labelledby="plan-title plan-desc"><title id="plan-title">Doric corner: plan from above</title><desc id="plan-desc">Two beams of depth ${number(b)} T meet at a right angle. The corner column axis is ${number(b / 2)} T from each outer face. The front triglyph centre is ${number(first)} T from the corner. Triglyph positions are projected onto the outer faces for comparison.</desc><style>${drawingStyle}${compact ? ".dimension text,.annotation{font-size:21px}.tiny{font-size:19px}" : ""}</style>`;
  s += `<path d="M60 50 H${x(b)} V${330 - b * scale} H${x(end)} V330 H60Z" class="beam${selected === "beam" ? " selected" : ""}"/>`;
  c.columnAxes.forEach((axis) => {
    s += `<circle cx="${x(axis)}" cy="${cy}" r="${b * 26}" class="stone${selected === "column" ? " selected" : ""}"/>`;
    s += line(x(axis), cy - b * 30, x(axis), 347, "axis");
  });
  s += line(x(0) - 12, cy, x(end), cy, "axis");
  s += line(x(b / 2), 50, x(b / 2), 347, "axis");
  c.triglyphCenters.forEach((center) => {
    s += rect(x(center - 0.5), 330, 70, 9, `triglyph${selected === "triglyph" ? " selected" : ""}`);
  });
  s += rect(x(0) - 9, 330 - (first + 0.5) * scale, 9, 70, "triglyph");
  if (c.cornerGap > 0) s += rect(x(0), 330, c.cornerGap * scale, 9, "gap");
  s += dimension(x(0), x(b), 33, `B = ${number(b)} T`);
  s += `<path d="M40 310 V350 H80" class="corner-mark"/>`;
  s += dimension(x(0), x(b / 2), 378, `${number(b / 2)} T`);

  return `${s}</svg>`;
}

import {
  type TheatreArc,
  type TheatreKind,
  type TheatreState,
  theatreFront,
  theatreModel,
} from "./core/theatre";

export const theatreNumber = (n: number, places = 2) => n.toFixed(places).replace(/\.00$/, "");
export const theatreEscape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function theatreDrawing(input: TheatreState, narrow = false, id = "main"): string {
  const m = theatreModel(input),
    s = m.state;
  const width = narrow ? 360 : 800,
    height = narrow ? 440 : 660,
    unit = narrow ? 100 : 170,
    cx = width / 2,
    cy = narrow ? 240 : 350;
  const x = (v: number) => cx + (v * unit) / m.radius,
    y = (v: number) => cy - (v * unit) / m.radius;
  const p = (a: number, b: number) => `${x(a)} ${y(b)}`;
  const line = (a: number, b: number, c: number, d: number, cls: string, attributes = "") =>
    `<line x1="${x(a)}" y1="${y(b)}" x2="${x(c)}" y2="${y(d)}" class="${cls}" ${attributes}/>`;
  const label = (a: number, b: number, text: string, cls = "th-label", anchor = "middle") =>
    `<text x="${x(a)}" y="${y(b)}" text-anchor="${anchor}" class="${cls}">${theatreEscape(text)}</text>`;
  const R = m.radius;
  const outline = (kind: TheatreKind, arc: TheatreArc, extra = 0) => {
    const r = R + extra,
      pr = (r * unit) / R,
      front = theatreFront(kind, R);
    let d = `M${p(r, 0)} A${pr} ${pr} 0 0 0 ${p(-r, 0)}`;
    if (kind === "greek") {
      const cr = arc === "three" ? r + R : r;
      const end = Math.sqrt(cr * cr - front * front) - (arc === "three" ? R : 0),
        pc = (cr * unit) / R;
      d += ` A${pc} ${pc} 0 0 0 ${p(-end, front)} L${p(end, front)} A${pc} ${pc} 0 0 0 ${p(r, 0)}`;
    }
    return `${d} Z`;
  };
  let drawing = "";
  const allGuides = s.part === "construction" || s.step < 3;
  if (s.step >= 2)
    drawing += `<rect x="${x(-1.4 * R)}" y="${y(m.front)}" width="${2.8 * unit}" height="${(m.stageDepth * unit) / R}" class="th-stage${s.part === "stage" ? " th-emphasis" : ""}" data-region="stage" data-front="${m.front}" data-back="${m.back}"/>`;
  if (s.step >= 4) {
    drawing += `<path d="${outline(s.kind, s.arc, R * 0.48)} ${outline(s.kind, s.arc)}" fill-rule="evenodd" class="th-seating"/>`;
    for (const extra of [0.16, 0.32, 0.48])
      drawing += `<path d="${outline(s.kind, s.arc, R * extra)}" class="th-seat-guide"/>`;
  }
  if (s.step >= 3)
    drawing += `<path d="${outline(s.kind, s.arc)}" class="th-orchestra${s.part === "orchestra" ? " th-emphasis" : ""}" data-region="orchestra" data-area="${m.area}"/>`;
  drawing += `<circle cx="${cx}" cy="${cy}" r="${unit}" class="th-initial${allGuides ? " th-prominent" : ""}" data-original-radius="${R}"/>`;
  if (s.step >= 1) {
    for (const [i, polygon] of m.polygons.entries()) {
      const selected = s.polygon === i + 1;
      const visible = s.polygon === 0 || selected;
      drawing += `<polygon points="${polygon.map((v) => `${x(v.x)},${y(v.y)}`).join(" ")}" class="th-polygon${selected ? " th-selected" : ""}${visible ? "" : " th-muted"}${allGuides ? " th-prominent" : ""}" data-polygon="${i + 1}"/>`;
    }
  }
  if (s.step >= 2) {
    drawing += line(-1.4 * R, m.front, 1.4 * R, m.front, "th-front", 'data-line="stage-front"');
    drawing += line(-1.4 * R, m.back, 1.4 * R, m.back, "th-back", 'data-line="scene-front"');
    const dx = narrow ? 1.53 : 1.7;
    drawing += line(dx * R, m.front, dx * R, m.back, "th-dimension");
    for (const yy of [m.front, m.back])
      drawing += line((dx - 0.04) * R, yy, (dx + 0.04) * R, yy, "th-dimension");
    drawing += label(
      (dx - 0.07) * R,
      (m.front + m.back) / 2 - 0.025 * R,
      `${theatreNumber(m.stageDepth)} m`,
      "th-measure",
      "end",
    );
    drawing += label(-1.4 * R, m.back - 0.12 * R, "SCENE FRONT", "th-caption", "start");
    drawing += label(-1.4 * R, m.front + 0.055 * R, "STAGE FRONT", "th-caption", "start");
  }
  if (s.step >= 4) {
    for (const v of m.vertices.filter((v) => v.role === "stair")) {
      const t = (v.degrees * Math.PI) / 180;
      let start = R,
        end = 1.48 * R;
      if (v.y < 0 && s.kind === "greek" && s.arc === "three") {
        const c = Math.abs(Math.cos(t));
        start = -R * c + Math.sqrt(R * R * c * c + 3 * R * R);
        end = -R * c + Math.sqrt(R * R * c * c + (2.48 * R) ** 2 - R * R);
      }
      drawing += line(
        start * Math.cos(t),
        start * Math.sin(t),
        end * Math.cos(t),
        end * Math.sin(t),
        `th-stair${s.part === "stairs" ? " th-emphasis" : ""}`,
        `data-stair="${v.index + 1}"`,
      );
    }
  }
  if (s.kind === "greek" && s.step >= 3) {
    const three = outline("greek", "three"),
      single = outline("greek", "single");
    drawing += `<path d="${three} ${single}" fill-rule="evenodd" class="th-difference"/>`;
    drawing += `<path d="${s.arc === "three" ? single : three}" class="th-alternative"/>`;
    const yy = m.probeY,
      half = m.probeWidth / 2;
    drawing += line(
      -half,
      yy,
      half,
      yy,
      "th-probe",
      `data-probe-width="${m.probeWidth}" data-probe-y="${yy}"`,
    );
    for (const xx of [-half, half])
      drawing += `<circle cx="${x(xx)}" cy="${y(yy)}" r="${narrow ? 3 : 4}" class="th-probe-tip"/>`;
    if (s.part === "construction" || s.step === 3) {
      const bx = Math.sqrt(4 * R * R - yy * yy) - R;
      drawing += line(R, 0, -bx, yy, "th-compass");
      drawing += label((R - bx) / 2, yy / 2 + 0.09 * R, "2R", "th-measure");
      for (const [name, xx] of [
        ["L", -R],
        ["R", R],
      ] as const)
        drawing += `<circle cx="${x(xx)}" cy="${cy}" r="4" class="th-centre"/>${label(xx * 1.14, -0.14 * R, name)}`;
    }
  }
  if (s.step >= 1) {
    for (const v of m.vertices) {
      const active = v.index === s.vertex,
        radial = s.step >= 3 ? 1.07 : 1.1;
      drawing += `<circle cx="${x(v.x)}" cy="${y(v.y)}" r="${active ? (narrow ? 5 : 6) : 2.7}" class="th-vertex${active ? " th-active" : ""}" data-vertex="${v.index + 1}" data-x="${v.x}" data-y="${v.y}" data-role="${v.role}"/>`;
      if (active || s.step < 2 || s.part === "stairs")
        drawing += label(
          v.x * radial,
          v.y * radial - 0.025 * R,
          String(v.index + 1),
          "th-point-label",
        );
    }
  }
  drawing +=
    `<circle cx="${cx}" cy="${cy}" r="3" class="th-centre"/>` +
    label(0.07 * R, 0.07 * R, "O", "th-point-label");
  if (s.step === 0) {
    drawing += line(-R, 0, R, 0, "th-dimension");
    drawing += label(0, -0.18 * R, `D = ${s.diameter} m`, "th-measure");
    drawing += label(0, -0.37 * R, "A chosen modern scale", "th-caption");
  }
  const top = narrow ? 28 : 34;
  const heading =
    s.kind === "greek" ? "THREE SQUARES / GREEK SCHEME" : "FOUR TRIANGLES / ROMAN SCHEME";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="th-plan${narrow ? " th-portrait" : ""}" role="img" aria-labelledby="${id}-title ${id}-desc" data-kind="${s.kind}" data-arc="${s.arc}" data-radius="${R}" data-scale="${unit / R}"><title id="${id}-title">${s.kind === "greek" ? "Greek" : "Roman"} theatre construction, step ${s.step + 1}</title><desc id="${id}-desc">${theatreEscape(`A geometric reading of Vitruvius. Initial diameter ${s.diameter} metres, a chosen scale. Stage depth ${theatreNumber(m.stageDepth)} metres. Orchestra area ${theatreNumber(m.area)} square metres. ${s.kind === "greek" && s.arc === "single" ? "The single-circle shortcut is a modern alteration of the three-centre construction." : ""} The seating extent is illustrative, not a measured theatre.`)}</desc><text x="${narrow ? 16 : 24}" y="${top}" class="th-caption">${heading}</text><text x="${narrow ? 16 : 24}" y="${top + 22}" class="th-caption">D = ${s.diameter} m · equal x/y scales · plan rescaled to fit</text>${drawing}<text x="${narrow ? 16 : 24}" y="${height - 18}" class="th-caption">${s.step >= 4 ? "Seating band: illustrative extent and row guides" : "Construction lines are not walls"}</text></svg>`;
}

export function theatreWidthDrawing(s: TheatreState, id = "width"): string {
  const m = theatreModel(s),
    scale = 140 / m.radius,
    cx = 180;
  const row = (width: number, yy: number, label: string, cls: string) =>
    `<text x="16" y="${yy - 17}" class="th-caption">${label} · ${theatreNumber(width)} m</text><line x1="${cx - (width * scale) / 2}" y1="${yy}" x2="${cx + (width * scale) / 2}" y2="${yy}" class="${cls}"/><path d="M${cx - (width * scale) / 2} ${yy - 5}v10 M${cx + (width * scale) / 2} ${yy - 5}v10" class="${cls}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 145" role="img" aria-labelledby="${id}-title"><title id="${id}-title">Widths at the selected cross-section, drawn at the same scale</title>${row(m.singleWidth, 48, "One circle", "th-shortcut-width")}${row(2 * (Math.sqrt(4 * m.radius * m.radius - m.probeY * m.probeY) - m.radius), 110, "Three centres", "th-true-width")}</svg>`;
}

import {
  columnSection,
  type FlutingState,
  gaugeReading,
  type Point,
  template,
} from "./core/fluting";

const n = (x: number) => Number(x.toFixed(6));
const xy = (p: Point) => `${n(p.x)},${n(p.y)}`;
export function localPath(s: FlutingState): string {
  const t = template(s.recipe, s.width);
  return s.recipe === "flat"
    ? `M0,0 L${s.width},0`
    : `M0,0 A${n(t.radius)},${n(t.radius)} 0 0 0 ${s.width},0`;
}
export function sectionPath(s: FlutingState): string {
  const c = columnSection(s);
  let path = `M${xy(c.at(0, 0))}`;
  for (let i = 0; i < c.count; i++) {
    path +=
      s.recipe === "flat"
        ? ` L${xy(c.at(i, 1))}`
        : ` A${n(c.local.radius)},${n(c.local.radius)} 0 0 0 ${xy(c.at(i, 1))}`;
    if (c.land) path += ` A${n(c.radius)},${n(c.radius)} 0 0 1 ${xy(c.at((i + 1) % c.count, 0))}`;
  }
  return `${path} Z`;
}
export function profileDrawing(s: FlutingState, interactive = true): string {
  const g = gaugeReading(s);
  const scale = 100 / s.width;
  const p = { x: g.p.x * scale, y: g.p.y * scale };
  const contact = g.contact.x * scale;
  const length = Math.hypot(g.contact.x - g.p.x, g.p.y) * scale;
  const marker = [
    { x: p.x + g.leftUnit.x * 5, y: p.y + g.leftUnit.y * 5 },
    { x: p.x + (g.leftUnit.x + g.rightUnit.x) * 5, y: p.y + (g.leftUnit.y + g.rightUnit.y) * 5 },
    { x: p.x + g.rightUnit.x * 5, y: p.y + g.rightUnit.y * 5 },
  ];
  const normalized = { ...s, width: 100 };
  const curve = localPath(normalized);
  return `<svg id="flute-profile" viewBox="-18 -27 136 108" role="img" aria-labelledby="profile-title profile-desc" xmlns="http://www.w3.org/2000/svg"><title id="profile-title">A ${s.width} millimetre ${s.recipe} cut, equal horizontal and vertical scales</title><desc id="profile-desc">${s.recipe === "flat" ? "A flat face joins A and B." : `The hollow is ${g.template.depth.toFixed(2)} millimetres deep. Rays from P to the two edges make ${g.angle.toFixed(0)} degrees. A fixed right-angle tool ${g.fits ? "touches both edges" : `misses B by ${g.miss.toFixed(2)} millimetres along the chord`}.`}</desc>
<defs><pattern id="stone-hatch" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0,4 L4,0" stroke="#d4d8c9" stroke-width=".25"/></pattern></defs>
<path d="${curve} L100,74 L0,74 Z" fill="url(#stone-hatch)"/>
<path d="M0,-12 V-19 M100,-12 V-19 M0,-16 H100" class="dimension"/><text x="50" y="-20" text-anchor="middle">${s.width} mm · chosen groove width</text>
<path d="M0,0 H100" class="chord"/><text x="-5" y="2" text-anchor="end">A</text><text x="105" y="2">B</text>
${s.compare && s.recipe !== "flat" ? `<path d="${localPath({ ...normalized, recipe: s.recipe === "doric" ? "ionic" : "doric" })}" class="other-profile"/>` : ""}
<path id="cut-path" d="${curve}" class="cut" data-width-mm="${s.width}" data-depth-mm="${g.template.depth}"/>
${
  s.recipe !== "flat"
    ? `<path d="M0,0 L${xy(p)} L100,0" class="edge-rays"/>
${
  s.gauge
    ? `<path id="norma" d="M0,0 L${xy(p)} L${n(p.x + g.rightUnit.x * (length + 4))},${n(p.y + g.rightUnit.y * (length + 4))}" class="norma"/><path d="M${marker.map(xy).join(" L")}" class="right-mark"/>
${!g.fits ? `<path d="M${n(contact)},-3 V-8 H100 V-3" class="miss"/><text x="${n((contact + 100) / 2)}" y="-10" text-anchor="middle" class="miss-label">${g.miss.toFixed(2)} mm short</text>` : ""}`
    : ""
}
<circle id="gauge-point" cx="${n(p.x)}" cy="${n(p.y)}" r="2.1" data-x-mm="${g.p.x}" data-y-mm="${g.p.y}" class="gauge-point" ${interactive ? 'data-drag="point"' : ""}/><text x="${n(p.x)}" y="${n(p.y + 9)}" text-anchor="middle">P · ${g.angle.toFixed(0)}° between edge rays</text>`
    : ""
}
<text x="50" y="79" text-anchor="middle" class="material-label">stone remaining below the cut</text></svg>`;
}
export function drumDrawing(s: FlutingState): string {
  const c = columnSection(s);
  const pad = c.radius * 1.16;
  return `<svg id="drum-section" viewBox="${-pad} ${-pad} ${pad * 2} ${pad * 2}" role="img" aria-labelledby="drum-title" xmlns="http://www.w3.org/2000/svg"><title id="drum-title">${c.count} ${s.recipe === "flat" ? "flat faces" : "flutes"} repeated around a ${c.diameter.toFixed(2)} millimetre shaft</title><circle r="${c.radius}" class="original-circle"/><path id="drum-outline" d="${sectionPath(s)}" fill="#e1e5d7" stroke="#405a43" stroke-width="${c.radius * 0.005}" data-radius-mm="${c.radius}" data-area-mm2="${c.remaining}"/><path d="M${-c.radius * 0.06},0 H${c.radius * 0.06} M0,${-c.radius * 0.06} V${c.radius * 0.06}" stroke="#5f6559" stroke-width="${c.radius * 0.003}"/></svg>`;
}
export function constructionDrawing(s: FlutingState): string {
  if (s.recipe === "flat")
    return `<p>Twenty equal divisions joined by straight chords form a regular twenty-sided section. No circular hollow is cut below those chords.</p>`;
  if (s.recipe === "ionic")
    return `<div class="construction-profile">${profileDrawing(
      { ...s, gauge: true, compare: false },
      false,
    )
      .replace(/id="/g, 'id="construction-')
      .replace(
        'aria-labelledby="profile-title profile-desc"',
        'aria-labelledby="construction-profile-title construction-profile-desc"',
      )}</div><p>A right angle whose arms touch A and B can move along a semicircle. Moving P changes the tool’s orientation while the edge angle remains 90°.</p>`;
  return `<svg id="square-construction" viewBox="-32 -137 164 180" role="img" aria-labelledby="square-title" xmlns="http://www.w3.org/2000/svg"><title id="square-title">A compass at the centre of a square draws a circle through all four corners</title><circle cx="50" cy="-50" r="${100 / Math.SQRT2}" class="construction-circle"/><path d="M0,0 V-100 H100 V0 Z M0,0 L100,-100 M0,-100 L100,0" class="square-lines"/><path d="${localPath({ ...s, width: 100 })}" class="cut"/><circle cx="50" cy="-50" r="1.7" fill="#963b25"/><text x="53" y="-43">C</text><text x="-6" y="8">A</text><text x="103" y="8">B</text><text x="50" y="35" text-anchor="middle">Only the bottom quarter arc makes this hollow.</text></svg>`;
}
export function printTemplate(s: FlutingState): string {
  const g = gaugeReading(s);
  const w = s.width,
    left = (190 - w) / 2,
    top = s.recipe === "doric" ? 178 : 115;
  const construction =
    s.recipe === "doric"
      ? `<rect x="0" y="${-w}" width="${w}" height="${w}" fill="none" stroke="#999" stroke-width=".18"/><circle cx="${w / 2}" cy="${-w / 2}" r="${w / Math.SQRT2}" fill="none" stroke="#aaa" stroke-width=".18"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="190mm" height="277mm" viewBox="0 0 190 277" role="img" aria-labelledby="print-title"><title id="print-title">Gonia · ${s.recipe} flute template at chosen model scale</title><rect width="190" height="277" fill="white"/><g fill="#27352f" font-family="Georgia,serif"><text x="10" y="13" font-size="6">The cut inside a column</text><text x="10" y="23" font-size="3.7">${s.recipe.toUpperCase()} · groove chord ${w} mm · depth ${g.template.depth.toFixed(6)} mm</text><text x="10" y="31" font-size="3.2">Chosen model dimensions; source prescription, not a measured ancient column.</text></g><g transform="translate(${left} ${top})">${construction}<path d="M0,0 H${w}" stroke="#999" stroke-width=".18" stroke-dasharray="1 1"/><path id="print-cut" d="${localPath(s)}" fill="none" stroke="#27352f" stroke-width=".35"/><circle cx="0" cy="0" r=".6"/><circle cx="${w}" cy="0" r=".6"/></g><g fill="#27352f" font-family="Georgia,serif" font-size="3.3"><text x="10" y="226">Print at 100% / actual size. Check the bar before using the template.</text><path id="calibration" d="M10,234 V238 M10,236 H35 M35,234 V238" fill="none" stroke="#27352f" stroke-width=".3"/><text x="39" y="237">25 mm</text><text x="10" y="249">Vitruvius ${s.recipe === "ionic" ? "III.5.14: moving right angle." : "IV.3.9: twenty divisions; square and compass, or flat faces."}</text><text x="10" y="258">Krohn edition (1912), p. ${s.recipe === "ionic" ? "74" : "85"}. New drawing: Anton Soloviev, 2026, MIT.</text><text x="10" y="267">https://antonsoo.github.io/gonia/fluting.html</text></g></svg>`;
}

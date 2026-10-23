import { type ColonnadeState, colonnadeModel } from "./core/colonnade";

export const colNumber = (n: number, digits = 3) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits });
export const colEscape = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
export function colonnadeDrawing(s: ColonnadeState, prefix = "col-plan"): string {
  const m = colonnadeModel(s),
    scale = 16;
  const ox = 520 - 7 * m.pitch * scale,
    oy = 310 - 3.5 * m.pitch * scale;
  const x = (v: number) => ox + v * scale,
    y = (v: number) => oy + v * scale;
  const c = m.cella;
  const columns = m.columns
    .map((p) => {
      const traced = p.ring === s.ring && p.order <= s.count;
      const selected = p.ring === s.ring && p.order === s.count;
      return `<g data-column="${p.id}" data-ring="${p.ring}" data-order="${p.order}" data-grid-x="${p.gridX}" data-grid-y="${p.gridY}" data-present="${p.present}" class="${p.ring === "inner" ? "col-inner" : "col-outer"}${traced ? " col-traced" : ""}${selected ? " col-selected" : ""}"><circle cx="${x(p.x)}" cy="${y(p.y)}" r="8" class="${p.present ? "col-shaft" : "col-ghost"}"/><title>${p.id}: ${p.side}${p.corner ? ", corner" : ""}; ${p.present ? "present" : "omitted"}; centre (${colNumber(p.x)}, ${colNumber(p.y)}) D</title>${selected ? `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="13" class="col-count-mark"/><text x="${x(p.x) + 17}" y="${y(p.y) - 12}" class="col-label col-count-label">${p.order}</text>` : ""}</g>`;
    })
    .join("");
  const trace = (s.ring === "outer" ? m.outer : m.inner)
    .slice(0, s.count)
    .map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.y)}`)
    .join("");
  const passage =
    s.kind === "pseudo"
      ? `<rect x="${x(0.5)}" y="${y(0.5)}" width="${(14 * m.pitch - 1) * scale}" height="${(7 * m.pitch - 1) * scale}" class="col-passage"/>`
      : `<rect x="${x(0.5)}" y="${y(0.5)}" width="${(14 * m.pitch - 1) * scale}" height="${(7 * m.pitch - 1) * scale}" class="col-passage col-split"/>`;
  const cutY = y(3 * m.pitch);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 620" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-scale="${scale}" data-origin-x="${ox}" data-origin-y="${oy}" data-part="${s.part}"><title id="${prefix}-title">${s.kind === "pseudo" ? "Inner ring omitted" : "Two perimeter rings"}: an equal-grid plan</title><desc id="${prefix}-desc">Eight columns across each end, fifteen along each flank, counting the corner columns once. Outer ring 42; regular inner ring 34. ${m.present} ring columns present. Simplified cella block unchanged. Clear side strip ${colNumber(m.continuousStrip)} lower diameters at column stations. Equal horizontal and vertical scales. The circles are shaft sections; bases and porch columns are omitted.</desc><defs><pattern id="${prefix}-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0,6L6,0" stroke="#8a9380" stroke-width="0.7"/></pattern></defs>
  <text x="30" y="30" class="col-label">REGULAR MODEL / SHAFT SECTIONS</text><text x="1010" y="30" text-anchor="end" class="col-label">D = LOWER DIAMETER</text>
  <rect x="${x(-1)}" y="${y(-1)}" width="${(14 * m.pitch + 2) * scale}" height="${(7 * m.pitch + 2) * scale}" class="col-boundary"/>${passage}
  <rect x="${x(c.x)}" y="${y(c.y)}" width="${c.width * scale}" height="${c.height * scale}" fill="url(#${prefix}-hatch)" class="col-cella"/>
  <rect x="${x(c.x + c.wall)}" y="${y(c.y + c.wall)}" width="${(c.width - 2 * c.wall) * scale}" height="${(c.height - 2 * c.wall) * scale}" class="col-room"/>
  <text x="520" y="305" text-anchor="middle" class="col-room-title">CELLA BLOCK</text><text x="520" y="330" text-anchor="middle" class="col-label">porches &amp; interior columns omitted</text>
  <path d="M${x(-0.6)},${cutY}H${x(c.x + 0.3)}" class="col-cut"/><text x="${x(-0.9)}" y="${cutY - 12}" text-anchor="end" class="col-label">A</text>
  ${trace ? `<path d="${trace}${s.count === (s.ring === "outer" ? 42 : 34) ? "Z" : ""}" class="col-trace"/>` : ""}${columns}
  <path d="M${x(-1.7)},${y(0)}h-8V${y(7 * m.pitch)}h8" class="col-dimension"/><text x="${x(-2.1)}" y="${y(3.5 * m.pitch)}" text-anchor="end" class="col-label">8</text>
  <path d="M${x(0)},${y(7 * m.pitch + 1.7)}v8H${x(14 * m.pitch)}v-8" class="col-dimension"/><text x="520" y="${y(7 * m.pitch + 1.7) + 30}" text-anchor="middle" class="col-label">15 ALONG EACH FLANK, INCLUDING CORNERS</text>
  <path d="M30,575h80m-80,-5v10m80,-10v10" class="col-dimension"/><text x="70" y="600" text-anchor="middle" class="col-label">5 D</text><text x="1010" y="600" text-anchor="end" class="col-label">${s.kind === "pseudo" ? "DASHED = OMITTED POSITIONS" : "FILLED = PRESENT COLUMNS"}</text></svg>`;
}
export function colonnadeStrip(s: ColonnadeState, prefix = "col-strip"): string {
  const m = colonnadeModel(s),
    p = m.pitch,
    sc = 65;
  const x = (n: number) => 70 + n * sc;
  const outerFace = 0.5,
    innerLeft = p - 0.5,
    innerRight = p + 0.5,
    wallFace = 2 * p - 0.5;
  const dimension = (a: number, b: number, yy: number, label: string) =>
    `<path d="M${x(a)},${yy - 6}v12m0,-6H${x(b)}m0,-6v12" class="col-dimension"/><text x="${x((a + b) / 2)}" y="${yy - 13}" text-anchor="middle" class="col-detail-label">${label}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 240" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-strip-gap="${s.gap}" data-strip-wide="${m.wideClear}"><title id="${prefix}-title">Detail A: a plan strip through column centres</title><desc id="${prefix}-desc">From the inner face of the outer shaft to the outer wall face, ${colNumber(m.wideClear)} D. ${s.kind === "double" ? `An inner shaft separates two clear gaps of ${colNumber(s.gap)} D each.` : "The omitted inner shaft leaves one continuous strip."} Lengths exclude bases; this is a horizontal cut in plan, not an elevation.</desc><rect x="${x(outerFace)}" y="85" width="${m.wideClear * sc}" height="60" class="col-passage"/><circle cx="${x(0)}" cy="115" r="${sc / 2}" class="col-shaft"/><circle cx="${x(p)}" cy="115" r="${sc / 2}" class="${s.kind === "double" ? "col-shaft" : "col-ghost"}"/><rect x="${x(wallFace)}" y="70" width="${sc}" height="90" class="col-wall"/>
  ${dimension(outerFace, wallFace, 45, `${colNumber(m.wideClear)} D across`)}
  ${s.kind === "double" ? dimension(outerFace, innerLeft, 190, `${colNumber(s.gap)} D`) + dimension(innerRight, wallFace, 190, `${colNumber(s.gap)} D`) : dimension(outerFace, wallFace, 190, `${colNumber(m.wideClear)} D clear`)}
  <text x="${x(0)}" y="228" text-anchor="middle" class="col-detail-label">outer shaft</text><text x="${x(p)}" y="228" text-anchor="middle" class="col-detail-label">${s.kind === "double" ? "inner shaft" : "omitted"}</text><text x="${x(wallFace + 0.5)}" y="228" text-anchor="middle" class="col-detail-label">wall</text></svg>`;
}

// A phone gets a complete upright plan, rather than the left third of a wide one.
export function colonnadePortrait(s: ColonnadeState, prefix = "col-portrait"): string {
  const m = colonnadeModel(s),
    scale = 16;
  const ox = 310 - 3.5 * m.pitch * scale,
    oy = 520 - 7 * m.pitch * scale;
  const x = (transverse: number) => ox + transverse * scale;
  const y = (longitudinal: number) => oy + longitudinal * scale;
  const c = m.cella;
  const trace = (s.ring === "outer" ? m.outer : m.inner)
    .slice(0, s.count)
    .map((p, i) => `${i ? "L" : "M"}${x(p.y)},${y(p.x)}`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 1040" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-part="${s.part}" data-scale="${scale}" data-origin-x="${ox}" data-origin-y="${oy}"><title id="${prefix}-title">Complete upright temple plan, ${s.kind === "double" ? "two rings" : "inner ring omitted"}</title><desc id="${prefix}-desc">Front at the top. Eight columns across the front, fifteen down each flank. Outer ring 42; inner ring 34 potential positions. Same regular model and equal length scales as the wide plan.</desc><text x="25" y="28" class="col-label">FRONT AT TOP / D = LOWER DIAMETER</text><rect x="${x(-1)}" y="${y(-1)}" width="${(7 * m.pitch + 2) * scale}" height="${(14 * m.pitch + 2) * scale}" class="col-boundary"/><rect x="${x(0.5)}" y="${y(0.5)}" width="${(7 * m.pitch - 1) * scale}" height="${(14 * m.pitch - 1) * scale}" class="col-passage"/><rect x="${x(c.y)}" y="${y(c.x)}" width="${c.height * scale}" height="${c.width * scale}" class="col-cella" fill="#d8ddcc"/><rect x="${x(c.y + 1)}" y="${y(c.x + 1)}" width="${(c.height - 2) * scale}" height="${(c.width - 2) * scale}" class="col-room"/><text x="310" y="515" text-anchor="middle" class="col-room-title">CELLA</text><text x="310" y="540" text-anchor="middle" class="col-label">simplified block</text><path d="M${x(3 * m.pitch)},${y(-0.6)}V${y(c.x + 0.3)}" class="col-cut"/><text x="${x(3 * m.pitch) + 10}" y="${y(-0.9)}" class="col-label">A</text>${trace ? `<path d="${trace}${s.count === (s.ring === "outer" ? 42 : 34) ? "Z" : ""}" class="col-trace"/>` : ""}${m.columns.map((p) => `<g data-column="${p.id}" data-ring="${p.ring}" data-present="${p.present}" class="${p.ring === "inner" ? "col-inner" : "col-outer"}${p.ring === s.ring && p.order <= s.count ? " col-traced" : ""}"><circle cx="${x(p.y)}" cy="${y(p.x)}" r="8" class="${p.present ? "col-shaft" : "col-ghost"}"/>${p.ring === s.ring && p.order === s.count ? `<circle cx="${x(p.y)}" cy="${y(p.x)}" r="13" class="col-count-mark"/><text x="${x(p.y) + 17}" y="${y(p.x) - 12}" class="col-label col-count-label">${p.order}</text>` : ""}</g>`).join("")}<path d="M${x(0)},${y(-1.8)}v-8H${x(7 * m.pitch)}v8" class="col-dimension"/><text x="310" y="${y(-1.8) - 22}" text-anchor="middle" class="col-label">8 ACROSS EACH END</text><path d="M${x(7 * m.pitch + 1.6)},${y(0)}h8V${y(14 * m.pitch)}h-8" class="col-dimension"/><text x="${x(7 * m.pitch + 1.6) + 15}" y="520" class="col-label">15</text><path d="M25,990h80m-80,-5v10m80,-10v10" class="col-dimension"/><text x="65" y="1015" text-anchor="middle" class="col-label">5 D</text><text x="595" y="1015" text-anchor="end" class="col-label">${s.kind === "pseudo" ? "DASHED = OMITTED" : "TWO RINGS PRESENT"}</text></svg>`;
}

export function colonnadePortraitStrip(s: ColonnadeState): string {
  const m = colonnadeModel(s),
    scale = 50,
    y = (v: number) => 60 + v * scale;
  const wall = 2 * m.pitch - 0.5;
  const dim = (a: number, b: number, label: string) =>
    `<path d="M245,${y(a)}h12m-6,0V${y(b)}m-6,0h12" class="col-dimension"/><text x="267" y="${y((a + b) / 2) + 5}" class="col-detail-label">${label}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 520" role="img" aria-labelledby="col-tall-strip-title col-tall-strip-desc"><title id="col-tall-strip-title">Passage detail, upright plan strip</title><desc id="col-tall-strip-desc">${s.kind === "double" ? `Two clear lanes of ${colNumber(s.gap)} D, divided by one inner shaft.` : `One clear strip of ${colNumber(m.wideClear)} D, including the former inner shaft position.`} Shaft faces only; bases omitted.</desc><rect x="135" y="${y(0.5)}" width="50" height="${m.wideClear * scale}" class="col-passage"/><circle cx="160" cy="${y(0)}" r="25" class="col-shaft"/><circle cx="160" cy="${y(m.pitch)}" r="25" class="${s.kind === "double" ? "col-shaft" : "col-ghost"}"/><rect x="130" y="${y(wall)}" width="60" height="50" class="col-wall"/><text x="110" y="${y(0) + 6}" text-anchor="end" class="col-detail-label">outer shaft</text><text x="110" y="${y(m.pitch) + 6}" text-anchor="end" class="col-detail-label">${s.kind === "double" ? "inner shaft" : "omitted"}</text><text x="110" y="${y(wall + 0.5) + 6}" text-anchor="end" class="col-detail-label">wall</text>${s.kind === "double" ? dim(0.5, m.pitch - 0.5, `${colNumber(s.gap)} D`) + dim(m.pitch + 0.5, wall, `${colNumber(s.gap)} D`) : dim(0.5, wall, `${colNumber(m.wideClear)} D`)}<text x="25" y="507" class="col-label">A / PLAN STRIP AT COLUMN CENTRES</text></svg>`;
}

import {
  bladePoint,
  bucketOutline,
  bucketPosition,
  bucketSection,
  type ScrewGeometry,
  type ScrewPoint,
  type ScrewState,
  screwCapacity,
  screwGeometry,
  screwPhi,
  screwPoint,
  TAU,
  waterLevel,
} from "./core/screw";

export const sn = (n: number, digits = 3): string =>
  new Intl.NumberFormat("en", { maximumFractionDigits: digits }).format(
    Math.abs(n) < 1e-12 ? 0 : n,
  );
const f = (n: number) => n.toFixed(4);
const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const ink = "#27352f",
  green = "#405a43",
  rust = "#963b25",
  blue = "#17658b",
  line = "#bfc3b3";
const head = (w: number, h: number, title: string, description: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(description)}</desc><g font-family="Arial,sans-serif" fill="${ink}" font-size="15">`;
const path = (points: readonly (readonly [number, number])[]) =>
  points.map((p, i) => `${i ? "L" : "M"}${f(p[0])},${f(p[1])}`).join(" ");

/** One complete pitch, with equal physical scales in both surface coordinates. */
export function screwNet(s: ScrewState, paper = false): string {
  const g = screwGeometry(s),
    width = 760,
    height = 650;
  const scale = Math.min(580 / g.pitch, 410 / g.circumference),
    x = 100,
    y = 100;
  const w = scale * g.pitch,
    h = scale * g.circumference;
  let out = head(
    width,
    height,
    "One strip returns after one complete pitch",
    "An unrolled shaft. Horizontal distance is axial distance. Vertical distance is circumferential distance. Both axes use the same scale. The source grid interval is one eighth of the shaft circumference.",
  );
  out += `<text x="100" y="30" font-size="20">Unroll the shaft surface</text><text x="100" y="58">Top and bottom edges meet around the shaft.</text>`;
  out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fffdf7" stroke="${ink}"/>`;
  for (let i = 0; i <= 12; i++) {
    const p = i * g.interval * scale;
    if (s.step >= 2 && p <= w + 1e-8)
      out += `<path d="M${x + p},${y}v${h}" stroke="${line}" fill="none"/>`;
    if (i <= 8)
      out += `<path d="M${x},${y + p}h${w}" stroke="${line}" fill="none"/><text x="82" y="${y + p + 5}" text-anchor="end">${i === 8 ? "0" : i}</text>`;
  }
  for (let j = 0; j < (s.step >= 4 ? s.starts : s.step >= 3 ? 1 : 0); j++) {
    const offset = j / s.starts;
    for (let wrap = 0; wrap <= 1; wrap++) {
      const a = Math.max(0, wrap - offset),
        b = Math.min(1, wrap + 1 - offset);
      if (b <= a) continue;
      out += `<path data-net-start="${j}" d="M${x + w * a},${y + h * (a + offset - wrap)}L${x + w * b},${y + h * (b + offset - wrap)}" stroke="${j === 0 ? rust : green}" stroke-width="${j === 0 ? 4 : 1.8}" fill="none"/>`;
    }
  }
  if (s.step >= 3)
    for (let k = 0; k <= 8; k++)
      out += `<circle cx="${x + (w * k) / 8}" cy="${y + (h * k) / 8}" r="4" fill="${rust}"/><text x="${x + (w * k) / 8 + 7}" y="${y + (h * k) / 8 - 9}" fill="${rust}">${k}</text>`;
  out += `<path d="M${x},${y + h + 34}h${w}" stroke="${rust}"/><path d="M${x},${y + h + 26}v16M${x + w},${y + h + 26}v16" stroke="${rust}"/><text x="${x + w / 2}" y="${y + h + 65}" text-anchor="middle">Pitch P = ${sn(g.pitch)} R · one full turn</text>`;
  out += `<text x="100" y="610">Grid interval = C/8 = ${sn(g.interval)} R.</text><text x="100" y="636">${s.lead === 100 ? "Square cells; diagonal 45°." : "Altered pitch: the diagonal misses successive grid crossings."}</text>`;
  out += `</g></svg>`;
  if (!paper && s.step < 2) {
    const r = 175;
    let end = head(
      width,
      height,
      "Round the shaft; divide its circumference",
      "An end view of the circular shaft. The source foot has sixteen digits. Eight equal circumferential divisions are made by quartering and halving the quarters.",
    );
    end += `<text x="100" y="45" font-size="22">${s.step === 0 ? "A round shaft" : "Quarter, then halve the quarters"}</text><circle cx="350" cy="290" r="${r}" fill="#fffdf7" stroke="${green}" stroke-width="2"/>`;
    if (s.step === 1)
      for (let i = 0; i < 8; i++) {
        const a = (TAU * i) / 8;
        end += `<path d="M350,290L${350 + r * Math.cos(a)},${290 + r * Math.sin(a)}" stroke="${green}" fill="none"/><text x="${350 + (r + 24) * Math.cos(a)}" y="${295 + (r + 24) * Math.sin(a)}" text-anchor="middle">${i}</text>`;
      }
    end += `<text x="100" y="545">Shaft diameter = ${sn(2 * g.inner)} R · length = 16 R</text><text x="100" y="580">${s.units === "digits" ? "Source: length / diameter = 16." : "Your comparison: length / diameter = 12."}</text></g></svg>`;
    return end;
  }
  if (!paper) return out;
  // A physical core diameter of 30 mm determines both axes. Only one pitch is
  // printed, rather than silently shrinking the entire 480 mm source shaft.
  const c = Math.PI * 30,
    p = (c * s.lead) / 100,
    q = c / 8;
  let template = `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" role="img" aria-label="One-pitch paper wrap for a 30 millimetre core"><title>One-pitch shaft wrap · print at 100%</title><g font-family="Arial,sans-serif" fill="#111" font-size="3.5"><text x="20" y="20" font-size="6">Gonia · wrap one pitch</text><text x="20" y="29">30 mm core diameter · ${s.starts} starts · P = ${sn(p)} mm</text><text x="20" y="36">Print at 100%. Cut the rectangle; join its top and bottom edges.</text><text x="20" y="43">${s.units === "digits" ? "Shaft ratio: 16 digits per foot (source)." : "Shaft ratio: 12 parts per foot (your comparison)."}</text><rect x="20" y="48" width="${p}" height="${c}" fill="white" stroke="#111" stroke-width=".3"/>`;
  for (let k = 0; k <= 12; k++) {
    if (k * q <= p + 1e-8)
      template += `<path d="M${20 + k * q},48v${c}" fill="none" stroke="#aaa" stroke-width=".15"/>`;
    if (k <= 8)
      template += `<path d="M20,${48 + k * q}h${p}" fill="none" stroke="#aaa" stroke-width=".15"/>`;
  }
  for (let j = 0; j < s.starts; j++)
    for (let wrap = 0; wrap <= 1; wrap++) {
      const a = Math.max(0, wrap - j / s.starts),
        b = Math.min(1, wrap + 1 - j / s.starts);
      if (b > a)
        template += `<path d="M${20 + p * a},${48 + c * (a + j / s.starts - wrap)}L${20 + p * b},${48 + c * (b + j / s.starts - wrap)}" fill="none" stroke="#111" stroke-width="${j === 0 ? ".6" : ".3"}"/>`;
    }
  template += `<path d="M20,165h25m-25,-2v4m25,-4v4" fill="none" stroke="#111" stroke-width=".3"/><text x="20" y="174">Calibration: this bar must measure 25 mm.</text><text x="20" y="189">This is a surface geometry exercise, not a working pump.</text><text x="20" y="197">Your full shaft would be ${s.units === "digits" ? "480" : "360"} mm long at this core diameter.</text><text x="20" y="205">No joint allowance, sealing, blade thickness or structural design is supplied.</text><text x="20" y="220">Source: Vitruvius X.6; Krohn 1912, pp. 237–238.</text><text x="20" y="228">The source setting has 8 starts and P = circumference.</text><text x="20" y="242">Original diagram © 2026 Anton Soloviev · MIT</text><text x="20" y="250">https://antonsoo.github.io/gonia/screw.html</text></g></svg>`;
  return template;
}

function projection(g: ScrewGeometry) {
  const beta = (20 * Math.PI) / 180;
  const project = (p: ScrewPoint): readonly [number, number] => [
    p[0] * Math.cos(beta) + p[1] * Math.sin(beta),
    -p[2],
  ];
  const corners: ScrewPoint[] = [
    [0, 0, 0],
    [g.length * g.cos, 0, 0],
  ];
  for (const x of [0, g.length])
    for (let k = 0; k < 32; k++) corners.push(screwPoint(g, x, 1, (TAU * k) / 32));
  const points = corners.map(project),
    xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    ymin = Math.min(...ys),
    ymax = Math.max(...ys);
  const scale = Math.min(760 / (xmax - xmin), 490 / (ymax - ymin));
  return {
    point: (p: ScrewPoint): readonly [number, number] => {
      const q = project(p);
      return [
        70 + (760 - (xmax - xmin) * scale) / 2 + (q[0] - xmin) * scale,
        55 + (490 - (ymax - ymin) * scale) / 2 + (q[1] - ymin) * scale,
      ];
    },
    depth: (p: ScrewPoint) => -p[0] * Math.sin(beta) + p[1] * Math.cos(beta),
  };
}

export function screwMachine(s: ScrewState): string {
  const g = screwGeometry(s),
    c = screwCapacity(g),
    phi = screwPhi(s, c.bucket),
    x = bucketPosition(g, phi),
    pr = projection(g);
  let out = head(
    900,
    630,
    "Transparent screw and a tracked water section",
    "Orthographic geometric model. The casing rotates with the blades. Rust traces one material blade. Blue is one section of a single bucket, not all the water. Each complete revolution moves this bucket one pitch uphill.",
  );
  const p = (v: ScrewPoint) => pr.point(v);
  const axis = [
    p([0, 0, 0]),
    p([g.length * g.cos, 0, 0]),
    p([g.length * g.cos, 0, g.length * g.sin]),
    p([0, 0, 0]),
  ];
  out += `<path d="${path(axis)}" stroke="${line}" fill="none" stroke-dasharray="5 4"/>`;
  const faces: { depth: number; markup: string }[] = [];
  const divisions = 144;
  for (let j = 0; j < s.starts; j++)
    for (let k = 0; k < divisions; k++) {
      const a = (g.length * k) / divisions,
        b = (g.length * (k + 1)) / divisions;
      const world = [
        bladePoint(g, a, g.inner, j),
        bladePoint(g, a, 1, j),
        bladePoint(g, b, 1, j),
        bladePoint(g, b, g.inner, j),
      ];
      faces.push({
        depth: world.reduce((n, v) => n + pr.depth(v), 0) / 4,
        markup: `<path d="${path(world.map(p))}Z" fill="${j === 0 ? rust : green}" fill-opacity="${j === 0 ? ".35" : ".09"}" stroke="none"/>`,
      });
    }
  // Transparent shaft and casing are deliberately wire diagrams.
  faces.sort((a, b) => a.depth - b.depth);
  out += faces.map((v) => v.markup).join("");
  for (const radius of [g.inner, 1]) {
    for (const end of [0, g.length]) {
      const ring = Array.from({ length: 65 }, (_, k) =>
        p(screwPoint(g, end, radius, (TAU * k) / 64)),
      );
      out += `<path d="${path(ring)}" fill="none" stroke="${green}" stroke-width="${radius === 1 ? 1.4 : 1}"/>`;
    }
    for (const theta of [Math.PI / 2, -Math.PI / 2])
      out += `<path d="${path([p(screwPoint(g, 0, radius, theta)), p(screwPoint(g, g.length, radius, theta))])}" stroke="${green}" stroke-width="1" fill="none"/>`;
  }
  const selected = Array.from({ length: 301 }, (_, k) =>
    p(bladePoint(g, (g.length * k) / 300, 1, 0)),
  );
  out += `<path d="${path(selected)}" stroke="${rust}" stroke-width="2" fill="none"/>`;
  if (c.bucket.regime !== "none") {
    const level = g.cos * (c.bucket.intercept - g.lambda * g.phase);
    const ends = [c.bucket.start, c.bucket.end].map((angle) =>
      p([bucketPosition(g, angle) * g.cos, 0, level]),
    );
    out += `<path data-horizontal-water="${level}" d="${path(ends)}" fill="none" stroke="${blue}" stroke-dasharray="5 3" stroke-width="2"/>`;
    const outline = bucketOutline(c.bucket, phi).map((q) =>
      p(screwPoint(g, x, Math.hypot(q[0], q[1]), Math.atan2(q[1], q[0]))),
    );
    if (outline.length)
      out += `<path data-water-section="true" data-axis="${x}" d="${path(outline)}Z" fill="${blue}" fill-opacity=".8" stroke="${blue}" stroke-width="1.5"/>`;
    const center = p(screwPoint(g, x, 0, 0));
    out += `<circle cx="${center[0]}" cy="${center[1]}" r="4" fill="${blue}"/>`;
  }
  out += `<text x="70" y="585">Rust: one blade. Blue: bucket cut and horizontal spill level.</text><text x="70" y="612">${sn(s.turn, 0)}° turned · bucket advance ${sn((g.pitch * s.turn) / 360)} R · vertical rise ${sn(((g.pitch * s.turn) / 360) * g.sin)} R</text></g></svg>`;
  return out;
}

export function screwSection(s: ScrewState): string {
  const g = screwGeometry(s),
    c = screwCapacity(g),
    b = c.bucket,
    phi = screwPhi(s, b),
    w = waterLevel(b, phi),
    scale = 180,
    cx = 250,
    cy = 245;
  const pp = (q: readonly [number, number]): readonly [number, number] => [
    cx + q[0] * scale,
    cy - q[1] * scale,
  ];
  let out = head(
    500,
    520,
    "One connected bucket, cut perpendicular to the shaft",
    "The cut is tilted relative to the vertical. Blue marks water between the selected pair of adjacent blades. The horizontal line in this end-on view is the intersection with the actual horizontal water surface. Other buckets are omitted.",
  );
  out += `<text x="30" y="30">Cut perpendicular to the shaft</text><circle cx="${cx}" cy="${cy}" r="${scale}" fill="#fffdf7" stroke="${ink}" stroke-width="2"/>`;
  const outline = bucketOutline(b, phi).map(pp);
  if (outline.length)
    out += `<path data-section-area="${bucketSection(b, phi)}" d="${path(outline)}Z" fill="${blue}" fill-opacity=".75"/>`;
  for (let j = 0; j < s.starts; j++) {
    const a = phi - (j * TAU) / s.starts,
      from = pp([g.inner * Math.cos(a), g.inner * Math.sin(a)]),
      to = pp([Math.cos(a), Math.sin(a)]);
    out += `<path d="${path([from, to])}" stroke="${j <= 1 ? rust : green}" stroke-width="${j <= 1 ? 3 : 1.5}" fill="none"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${scale * g.inner}" fill="#e3e6d8" stroke="${green}" stroke-width="2"/>`;
  if (b.regime !== "none" && Math.abs(w) < 1) {
    const half = Math.sqrt(1 - w * w);
    out += `<path data-level="${w}" d="${path([pp([-half, w]), pp([half, w])])}" stroke="${blue}" stroke-dasharray="6 4" fill="none"/>`;
  }
  out += `<text x="30" y="470">Blue: one bucket only. Other channels’ water is omitted.</text><text x="30" y="497">Area at this cut: ${sn(bucketSection(b, phi), 5)} R²</text></g></svg>`;
  return out;
}

export function screwAreaPlot(s: ScrewState): string {
  const g = screwGeometry(s),
    b = screwCapacity(g).bucket,
    phi = screwPhi(s, b),
    x0 = 65,
    y0 = 200,
    width = 650,
    height = 140;
  let out = head(
    760,
    285,
    "Area of the selected bucket along the shaft",
    "Cross-section area changes along one connected bucket. Integration of these areas along axis distance gives one bucket’s volume. The vertical rule is the chosen cut.",
  );
  out += `<path d="M${x0},45V${y0}h${width}" fill="none" stroke="${ink}"/><text x="65" y="25">Area / R²</text>`;
  const points = Array.from({ length: 301 }, (_, k): readonly [number, number] => [
    x0 + (k / 300) * width,
    y0 -
      (bucketSection(b, b.start + ((b.end - b.start) * k) / 300) /
        ((Math.PI * (1 - g.inner ** 2)) / g.starts)) *
        height,
  ]);
  out += `<path d="M${x0},${y0} ${path(points).replace(/^M/, "L")}L${x0 + width},${y0}Z" fill="${blue}" fill-opacity=".2"/><path d="${path(points)}" stroke="${blue}" stroke-width="2" fill="none"/>`;
  const cut = x0 + (s.cut / 1000) * width;
  out += `<text x="${x0 + 10}" y="52" font-size="13">Whole channel: ${sn((Math.PI * (1 - g.inner ** 2)) / g.starts, 4)} R²</text><path d="M${cut},45V${y0}" stroke="${rust}" stroke-width="2"/><text x="65" y="232">Bucket begins</text><text x="715" y="232" text-anchor="end">Bucket ends</text><text x="65" y="265">Chosen axial position x = ${sn(bucketPosition(g, phi))} R · cut ${sn(s.cut / 10, 1)}%</text></g></svg>`;
  return out;
}

export function screwComparison(s: ScrewState): string {
  const rows: readonly [string, ScrewState][] = [
    ["Source reading", { ...s, units: "digits", starts: 8, lead: 100, sourceSlope: true }],
    ["Your settings", s],
    ["Half your pitch", { ...s, lead: s.lead / 2 }],
    ["Quarter your pitch", { ...s, lead: s.lead / 4 }],
  ];
  return `<table><caption>Same outside radius R and length 16 R; ideal filled geometry</caption><thead><tr><th scope="col">Geometry</th><th scope="col">Inner / outer radius</th><th scope="col">Pitch / R</th><th scope="col">Water fraction</th><th scope="col">Water / turn (R³)</th></tr></thead><tbody>${rows
    .map(([name, state]) => {
      const g = screwGeometry(state),
        c = screwCapacity(g);
      return `<tr><th scope="row">${name}</th><td>${sn(g.inner)}</td><td>${sn(g.pitch)}</td><td>${sn(c.fraction * 100, 2)}%</td><td>${sn(c.perTurn, 4)}</td></tr>`;
    })
    .join("")}</tbody></table>`;
}

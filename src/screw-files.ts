import originalLicense from "../LICENSE?raw";
import {
  bucketPosition,
  bucketSection,
  type ScrewState,
  screwCapacity,
  screwGeometry,
  screwQuery,
  waterLevel,
} from "./core/screw";
import { SCREW_ASSETS } from "./screw-assets";
import {
  SCREW_LIMITS,
  SCREW_PAPER,
  SCREW_SOURCE,
  screwPassages,
  screwSources,
  screwSteps,
} from "./screw-content";
import {
  screwAreaPlot,
  screwComparison,
  screwMachine,
  screwNet,
  screwSection,
  sn,
} from "./screw-drawing";

const verified = new Map<string, Promise<Uint8Array>>();
export function screwAsset(path: string): Promise<Uint8Array> {
  const known = verified.get(path);
  if (known) return known;
  const promise = (async () => {
    const expected = SCREW_ASSETS[path];
    if (!expected) throw new Error("This file has no retained source identity.");
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Source download failed (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    if (digest !== expected)
      throw new Error("The downloaded source does not match this edition’s SHA-256 identity.");
    return bytes;
  })();
  verified.set(path, promise);
  void promise.catch(() => {
    if (verified.get(path) === promise) verified.delete(path);
  });
  return promise;
}
export function screwBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([new Uint8Array(bytes)], { type });
}
export function screwSave(data: string | Blob, name: string, type = "text/plain"): void {
  const url = URL.createObjectURL(typeof data === "string" ? new Blob([data], { type }) : data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function screwCsv(s: ScrewState): string {
  const g = screwGeometry(s),
    c = screwCapacity(g),
    b = c.bucket;
  const rows: (string | number)[][] = [
    ["Gonia ideal water screw", "length unit = outside radius R; volumes R^3; areas R^2"],
    ["assumptions", SCREW_LIMITS],
    ["settings", screwQuery(s)],
    ["inner_radius", g.inner],
    ["outer_radius", 1],
    ["length", g.length],
    ["starts", g.starts],
    ["pitch", g.pitch],
    ["circumference", g.circumference],
    ["slope", g.slope],
    ["angle_degrees", (g.angle * 180) / Math.PI],
    ["lambda", g.lambda],
    ["water_fraction", c.fraction],
    ["water_per_turn", c.perTurn],
    ["water_one_bucket", c.oneBucket],
    ["fraction_integration_error_estimate", c.error],
    ["integration_converged", String(c.converged)],
    [],
    [
      "cut_fraction",
      "blade_angle_radians",
      "axis_position_R",
      "water_level_in_cut_R",
      "section_area_R2",
    ],
  ];
  for (let i = 0; i <= 200; i++) {
    const phi = b.start + ((b.end - b.start) * i) / 200;
    rows.push([i / 200, phi, bucketPosition(g, phi), waterLevel(b, phi), bucketSection(b, phi)]);
  }
  return `${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
const safe = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
export async function screwStudy(s: ScrewState): Promise<string> {
  const files = Object.keys(SCREW_ASSETS),
    bytes = await Promise.all(files.map((path) => screwAsset(path)));
  const data = Object.fromEntries(files.map((p, i) => [p, bytes[i] as Uint8Array]));
  const uri = (path: string, mime: string) =>
    `data:${mime};base64,${base64(data[path] as Uint8Array)}`;
  const g = screwGeometry(s),
    c = screwCapacity(g);
  const model = `<h2>Your retained experiment</h2><p>${s.starts} starts; ${s.units === "digits" ? "sixteen-digit source foot" : "twelve-part-foot comparison"}; pitch ${s.lead}% of shaft circumference; angle ${sn((g.angle * 180) / Math.PI)}°; rotation ${s.turn}°; cut ${sn(s.cut / 10)}%.</p><p>Water fraction ${sn(c.fraction * 100, 4)}%; water per turn ${sn(c.perTurn, 6)} R³. R is the outside radius, not a specified ancient metre length. Integration error estimate in fraction ${c.error.toExponential(2)}; ${c.converged ? "converged" : "NOT converged"}.</p>${screwMachine(s)}${screwSection(s)}${screwAreaPlot(s)}${screwComparison(s)}`;
  const readings = screwPassages
    .map(
      (p, i) =>
        `<article><h3>${i + 1}. ${safe(p.title)}</h3><p>${safe(p.ref)}</p><p class="latin" lang="la">${safe(p.latin)}</p><p>${safe(p.english)}</p><dl>${p.words.map(([word, note]) => `<dt lang="la">${safe(word)}</dt><dd>${safe(note)}</dd>`).join("")}</dl><p>${safe(p.note)}</p></article>`,
    )
    .join("");
  const sources = screwSources
    .map(
      (p) =>
        `<figure class="source"><img src="${uri(`sources/screw/krohn-${p.key}.jpg`, "image/jpeg")}" alt="Complete Krohn 1912 ${p.key === "title" ? "title page" : `printed page ${p.key}, including apparatus`}"><figcaption>${safe(p.title)}. PDF page ${p.pdf}. SHA-256 ${SCREW_ASSETS[`sources/screw/krohn-${p.key}.jpg`]}</figcaption></figure>`,
    )
    .join("");
  const licenses =
    `<details><summary>Original code and diagrams · MIT</summary><pre>${safe(originalLicense)}</pre></details>` +
    ["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"]
      .map(
        (path) =>
          `<details><summary>${path}</summary><pre>${safe(new TextDecoder().decode(data[path]))}</pre></details>`,
      )
      .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Gonia · Eight channels, one revolution · illustrated reading</title><style>@font-face{font-family:Plex;src:url('${uri("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}@font-face{font-family:Noto;src:url('${uri("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}*{box-sizing:border-box}body{font:17px/1.6 Plex,Arial,sans-serif;color:#27352f;background:#f4f1e8;max-width:1000px;margin:auto;padding:28px}h1,h2,h3,.latin{font-family:Noto,serif;font-weight:400}h1{font-size:clamp(36px,7vw,70px);line-height:1.1}h2{font-size:32px}h3{font-size:25px}.latin{font-size:23px}svg,img{max-width:100%;height:auto}article{border-top:1px solid #bfc3b3;margin-top:30px;padding-top:20px}dd{margin:0 0 16px}dt{font-weight:bold}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #bfc3b3;text-align:left;padding:10px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}.source{margin:35px 0}.source img{display:block;margin:auto;max-height:88vh}figcaption{font-size:12px;overflow-wrap:anywhere}a{color:#405a43;overflow-wrap:anywhere}@page{size:A4;margin:16mm}@media print{body{padding:0;background:white;font-size:10pt}h1{font-size:36pt}h2{font-size:24pt}article{break-inside:avoid}svg{max-height:225mm;break-inside:avoid}table{font-size:9pt}.source{break-before:page;margin:0}.source img{max-height:240mm;max-width:100%}figcaption{font-size:8pt}details{display:none}a{color:inherit}}</style></head><body><header><p>Gonia · Vitruvius X.6</p><h1>Eight channels.<br>One revolution.</h1><p>Construct the spiral. Follow one bucket. Read the dimensions.</p></header><p>${SCREW_LIMITS}</p>${model}<h2>How one strip becomes eight channels</h2>${screwNet(s)}${screwSteps.map((step, i) => `<h3>${i + 1}. ${step.title}</h3><p>${step.note}</p>`).join("")}<h2>Twelve Latin readings</h2><p>Selected excerpts from Krohn 1912; line-end hyphens joined, paragraph and sentence punctuation normalized; … marks workshop omissions. New English and contextual notes are learning aids. Full pages below preserve the printed text and apparatus.</p>${readings}<h2>Model and provenance</h2><p>Lengths use outside radius R = 1; length L = 16 R. Source shaft diameter L/16 and outside diameter L/8 give inner radius ρ = 1/2. One helical turn advances P = 2πρR at the source setting. At the 3–4–5 slope K = 3/4, λ = KP/(2πR) = 3/8.</p><p>At blade phase φ a cut lies at x = P(φ − phase)/(2π). The selected bucket’s level in that cut is w = ρ sin φ₀ − λ(φ − φ₀), with φ₀ = arccos(−λ/ρ) for λ &lt; ρ, otherwise π. Intersect the annular channel with r sin θ ≤ w; retain the connected component around its first bottom. Integrate its area along x, then multiply by the number of starts for water per turn.</p><p>Numerical radial/angular boundaries are integrated analytically; an adaptive Simpson integration sums along the shaft. Its error is an estimate, not a rigorous bound. Near the no-retention limit very small values are rounded for display.</p><p>Modern analysis: <a href="${SCREW_PAPER}">Chris Rorres, The Turn of the Screw: Optimal Design of an Archimedes Screw (2000), DOI 10.1061/(ASCE)0733-9429(2000)126:1(72)</a>. This workshop’s original diagrams and implementation are not figures or code from the paper.</p><p><a href="${SCREW_SOURCE}">Original Krohn volume</a> · <a href="https://lexundria.com/vitr/10.6/gw">Gwilt 1826 English</a> · <a href="https://lexundria.com/vitr/10.6/mg">Morgan 1914 English</a></p><p><a href="https://antonsoo.github.io/gonia/screw.html${safe(screwQuery(s))}">Reopen this experiment online</a> · <a download="screw-measurements.csv" href="data:text/csv;base64,${base64(new TextEncoder().encode(screwCsv(s)))}">Embedded measurements CSV</a> · <a download="screw-wrap.svg" href="data:image/svg+xml;base64,${base64(new TextEncoder().encode(screwNet(s, true)))}">Embedded 30 mm core wrap</a></p><h2>Five complete source pages</h2><p>Public domain edition; whole pages rendered with Poppler 24.02.0 at longest side 1700 pixels, JPEG quality 88, no crop or image reconstruction. Original PDF SHA-256 b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139.</p>${sources}<footer><p>Original code, diagrams, English aids and notes © 2026 Anton Soloviev. MIT license:</p><pre>${safe(originalLicense)}</pre><p>Self-hosted Noto Serif and IBM Plex Sans under SIL OFL 1.1.</p>${licenses}</footer></body></html>`;
}

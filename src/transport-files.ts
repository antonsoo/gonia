import {
  TRANSPORT_NAMES,
  type TransportState,
  transportModel,
  transportQuery,
} from "./core/transport";
import { TRANSPORT_ASSETS } from "./transport-assets";
import {
  TRANSPORT_LIMITS,
  TRANSPORT_SOURCE,
  transportGreek,
  transportPages,
  transportReadingHtml,
  transportWords,
} from "./transport-content";
import {
  transportEscape as esc,
  transportNumber as n,
  transportDrawing,
  transportGraph,
  transportUnit,
} from "./transport-drawing";
import ink from "./transport-ink.css?inline";

function save(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function transportCsv(s: TransportState): string {
  const rows: string[][] = [
    [
      "scope",
      "kind",
      "angle_degrees",
      "rectangle_width_reference",
      "rectangle_height_reference",
      "circular_radius_reference",
      "centre_advance",
      "centre_height",
      "lowest_stone_point",
      "minimum_full_turn_clearance",
      "full_turn_geometrically_clear",
      "length_unit",
      "reference",
    ],
  ];
  for (const [scope, angle] of [
    ["selected", s.angle],
    ...Array.from({ length: 361 }, (_, i) => ["full_turn", i]),
  ] as [string, number][]) {
    const m = transportModel(s, angle);
    rows.push([
      scope,
      s.kind,
      String(angle),
      String(s.width),
      String(s.height),
      String(s.radius),
      String(m.centre.x),
      String(m.centre.y),
      String(m.lowest),
      String(m.fullTurnClearance),
      String(m.fullTurnValid),
      transportUnit(s),
      "Ideal rigid bodies; flat road; no slip. Bare rectangle is a modern counterexample. No steering, force, soil or historical physical accuracy is inferred.",
    ]);
  }
  return `${rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function downloadTransportCsv(s: TransportState): void {
  save(transportCsv(s), "gonia-transport.csv", "text/csv;charset=utf-8");
}

async function asset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const r = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!r.ok) throw new Error(`Could not load ${path}. Reconnect and try again.`);
  const b = new Uint8Array(await r.arrayBuffer());
  const actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  if (actual !== TRANSPORT_ASSETS[path])
    throw new Error(`This edition could not verify ${path}. Reload online before saving.`);
  return b;
}
function base64(bytes: Uint8Array): string {
  let b = "";
  for (let i = 0; i < bytes.length; i += 16384)
    b += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(b);
}
export async function downloadTransportReading(s: TransportState): Promise<void> {
  const files = [
    ...transportPages.map((p) => `sources/transport/krohn-${p}.jpg`),
    "fonts/NotoSerif-Regular.ttf",
    "fonts/IBMPlexSans-Regular.woff2",
    "fonts/NotoSerif-OFL.txt",
    "fonts/IBMPlex-OFL.txt",
  ];
  const bytes = new Map(await Promise.all(files.map(async (p) => [p, await asset(p)] as const)));
  const data = (p: string, mime: string) => {
    const b = bytes.get(p);
    if (!b) throw new Error(`Missing ${p}`);
    return `data:${mime};base64,${base64(b)}`;
  };
  const m = transportModel(s);
  const verdict =
    s.kind === "bare"
      ? `The centre moves between ${n(m.minimumCentreHeight, 9)} and ${n(m.maximumCentreHeight, 9)} ${transportUnit(s)}. A complete turn advances ${n(m.fullTurnDistance, 9)}, the rectangle's perimeter.`
      : `The centre stays at ${n(s.radius, 9)} ${transportUnit(s)}. A complete turn advances ${n(m.fullTurnDistance, 9)}, the rolling circumference.`;
  const greek = transportGreek
    .map(
      (g) =>
        `<p><strong lang="grc">${g.article} ${g.word}</strong>, genitive <span lang="grc">${g.genitive}</span> — ${g.meaning}. Latin <i lang="la">${g.latin}</i>. ${g.note} <a href="https://logeion.uchicago.edu/${encodeURIComponent(g.word)}">LSJ via Logeion</a>.</p>`,
    )
    .join("");
  const grammar = Object.values(transportWords)
    .map(
      (w) =>
        `<article class="grammar-note"><h3 lang="la">${esc(w.label)} — ${esc(w.meaning)}</h3><p>${esc(w.note)}</p></article>`,
    )
    .join("");
  const licenses = files
    .filter((p) => p.endsWith("OFL.txt"))
    .map((p) => `<h3>${esc(p)}</h3><pre>${esc(new TextDecoder().decode(bytes.get(p)))}</pre>`)
    .join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia — Before the column stood</title><style>@font-face{font-family:Noto;src:url('${data("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${data("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}*{box-sizing:border-box}body{margin:auto;max-width:1000px;padding:30px;font:16px/1.65 Plex,Arial,sans-serif;color:#27352f;background:#f4f1e8}h1,h2,.transport-latin,[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400;line-height:1.4}h1{font-size:40px}h2{font-size:28px}h3{font-size:18px}a{color:#405a43}section{margin-top:35px}.transport-drawing,.transport-graph{max-width:650px;margin:auto}.transport-small,.eyebrow,figcaption{font-size:13px}.transport-small{overflow-wrap:anywhere}.eyebrow{font-weight:600}.transport-latin{font-size:20px}.transport-reading{border-bottom:1px solid #bfc3b3;padding:20px 0}.printed-page img{display:block;width:100%;height:auto}pre{white-space:pre-wrap;font-size:11px;overflow-wrap:anywhere}.download-link{overflow-wrap:anywhere}${ink}@media(max-width:600px){body{padding:20px}h1{font-size:32px}.transport-latin{font-size:18px}svg .small-label{font-size:21px}}@page{size:A4;margin:15mm}@media print{body{padding:0;background:white;font-size:10pt}h1{font-size:28pt}h2{font-size:20pt}.transport-drawing{max-width:130mm;break-inside:avoid}.transport-graph{max-width:145mm;break-inside:avoid}.transport-latin{font-size:13pt}.transport-reading,.grammar-note{break-inside:avoid}h2,h3{break-after:avoid}.printed-page{break-before:page;margin:0}.printed-page img{max-height:240mm;max-width:100%;width:auto;margin:auto}.printed-page figcaption{font-size:9pt}.licenses,.download-link{display:none}}</style></head><body><header><p>GONIA · <span lang="grc">γωνία</span> · measured ancient architecture</p><h1>Before the column stood.</h1><p>${TRANSPORT_NAMES[s.kind]}. Rectangular comparison width ${s.width}, height ${s.height}; circular radius ${s.radius}; rotation ${s.angle}°. Lengths in ${transportUnit(s)}. ${m.paconiusDimensions ? "The Paconius preset uses the reported 8 × 6 end section and the usual diameter reading of the 15-foot wheels." : "These dimensions are a chosen geometrical example, not a measured ancient load."}</p><p class="transport-small">Edition ${esc(__GONIA_EDITION__)}. <a href="https://antonsoo.github.io/gonia/transport.html${esc(transportQuery(s))}#transport-workshop">Reopen these settings online</a>. The reading, fonts and complete printed pages below open offline.</p></header><main><section><h2>Turn the stone</h2><div class="transport-drawing">${transportDrawing(s, "saved-transport")}</div><p>${verdict}</p><p>At this rotation: centre advance ${n(m.centre.x, 9)}, centre height ${n(m.centre.y, 9)}. ${s.kind === "wheels" ? `Minimum full-turn clearance ${n(m.fullTurnClearance, 9)}. ${m.fullTurnValid ? "The section clears the ground through the turn." : "The section cannot clear the ground through the full turn at this wheel radius."} Current lowest stone point ${n(m.lowest, 9)}.` : "The body is in contact with the ideal road."}</p><div class="transport-graph">${transportGraph(s, "saved-height")}</div><p>The green curve is the rectangular stone's required centre height. The dashed line is the chosen circular radius. A wheel radius below the curve cannot carry that section through a complete turn without ground intersection. Graph axes have different units; the end view preserves equal length scales.</p><p class="download-link"><a download="gonia-transport.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(transportCsv(s)))}">Save these exact selected and full-turn CSV rows</a></p></section><section><h2>A fit is not a successful journey</h2><p>With the Paconius readings, the half-diagonal is five source feet and the wheel radius seven and a half, leaving two and a half at the tightest rotation. This clearance test does not explain the reported veering. The source gives no complete steering geometry, friction measurements or rope-force history.</p></section><section><h2>Read the Latin</h2>${transportReadingHtml(false)}</section><section><h2>Keep the grammar notes</h2>${grammar}</section><section><h2>Greek words carried into Latin</h2>${greek}<p class="transport-small">These are Greek dictionary headwords explaining the Latin technical vocabulary, not a Greek original or back-translation of Vitruvius's account. Definitions and reading notes are new; the links identify LSJ entries in Logeion.</p></section><section><h2>Sources and limits</h2><p>${TRANSPORT_LIMITS}</p><p>Krohn's 1912 edition, printed pp. 230–231 (PDF pages 248–249), <a href="${TRANSPORT_SOURCE}">Internet Archive original</a>. The complete apparatus and the gap in the timber-frame description remain visible. Line-end hyphens are joined in the short excerpts; Roman numerals are normalized in capitalization. No missing frame description is silently restored. Historical text and scans: public domain. Code, new diagrams and English: MIT, Anton Soloviev, 2026. Two JPEGs, two fonts and their two licenses were verified against SHA-256 identities before export.</p></section>${transportPages.map((p) => `<figure class="printed-page" id="transport-printed-${p}"><img src="${data(`sources/transport/krohn-${p}.jpg`, "image/jpeg")}" alt="Complete Krohn 1912 Latin source and critical apparatus, printed page ${p}"><figcaption>Vitruvius X.2, printed p. ${p}; PDF page ${p + 18}. Source scan, including the apparatus.</figcaption></figure>`).join("")}<details class="licenses"><summary>Embedded font copyrights and licenses</summary>${licenses}</details></main></body></html>`;
  save(html, "gonia-transport-reading.html", "text/html;charset=utf-8");
}

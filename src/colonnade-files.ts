import { COLONNADE_ASSETS } from "./colonnade-assets";
import {
  COLONNADE_LEFAS,
  COLONNADE_LIMITS,
  colonnadePartNotes,
  colonnadeReadingHtml,
  colonnadeSourceInfo,
  colonnadeWords,
} from "./colonnade-content";
import {
  colonnadeDrawing,
  colonnadeStrip,
  colEscape as esc,
  colNumber as n,
} from "./colonnade-drawing";
import ink from "./colonnade-ink.css?inline";
import {
  type ColonnadeState,
  colonnadeModel,
  colonnadeQuery,
  colonnadeSources,
} from "./core/colonnade";

function save(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function colonnadeCsv(s: ColonnadeState): string {
  const m = colonnadeModel(s);
  const rows: (string | number | boolean)[][] = [
    [
      "arrangement",
      "ring",
      "id",
      "circuit_order",
      "side",
      "corner",
      "grid_longitudinal",
      "grid_transverse",
      "centre_longitudinal_D",
      "centre_transverse_D",
      "shaft_diameter_D",
      "present",
      "traced",
      "clear_gap_D",
      "axis_pitch_D",
      "whole_side_span_D",
      "continuous_strip_at_column_stations_D",
      "reference",
    ],
  ];
  for (const p of m.columns)
    rows.push([
      s.kind,
      p.ring,
      p.id,
      p.order,
      p.side,
      p.corner,
      p.gridX,
      p.gridY,
      p.x,
      p.y,
      1,
      p.present,
      p.ring === s.ring && p.order <= s.count,
      s.gap,
      m.pitch,
      m.wideClear,
      m.continuousStrip,
      "Chosen regular model in lower shaft diameters. Ring positions only; bases and porch/interior columns omitted. Not a measured Magnesia reconstruction or a verdict on XXXIV/XXXVIII.",
    ]);
  return `${rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function downloadColonnadeCsv(s: ColonnadeState): void {
  save(colonnadeCsv(s), "gonia-colonnade.csv", "text/csv;charset=utf-8");
}

async function asset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const r = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!r.ok) throw new Error(`Could not load ${path}. Reconnect and try again.`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  const actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  if (actual !== COLONNADE_ASSETS[path])
    throw new Error(`This edition could not verify ${path}. Reload online before saving.`);
  return bytes;
}
function base64(bytes: Uint8Array): string {
  let b = "";
  for (let i = 0; i < bytes.length; i += 16384)
    b += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(b);
}
export async function downloadColonnadeReading(s: ColonnadeState): Promise<void> {
  const files = Object.keys(COLONNADE_ASSETS);
  const bytes = new Map(await Promise.all(files.map(async (p) => [p, await asset(p)] as const)));
  const data = (p: string, mime: string) => {
    const b = bytes.get(p);
    if (!b) throw new Error(`Missing ${p}`);
    return `data:${mime};base64,${base64(b)}`;
  };
  const m = colonnadeModel(s);
  const grammar = colonnadeWords
    .map(
      (w) =>
        `<article class="grammar"><h3><i lang="la">${w.label}</i> · ${w.meaning}</h3><p>${w.note}</p></article>`,
    )
    .join("");
  const vocabulary = Object.values(colonnadePartNotes)
    .map(
      (p) =>
        `<article class="grammar"><h3>${p.title}</h3><p lang="grc">${p.greek}</p><p lang="la">${p.latin}</p><p>${p.note} <a href="https://logeion.uchicago.edu/${encodeURIComponent(p.dictionary)}">Dictionary headword</a>.</p></article>`,
    )
    .join("");
  const sources = colonnadeSources
    .map((id) => {
      const source = colonnadeSourceInfo[id];
      return `<figure class="printed-page" id="source-${id}"><figcaption><h2>${source.title}</h2><p>${source.note} <a href="${source.original}">Original volume</a>.</p></figcaption><img src="${data(`sources/colonnade/${source.file}`, "image/jpeg")}" width="${source.width}" height="${source.height}" alt="${esc(source.title)}: complete source image"><p class="identity">SHA-256 ${COLONNADE_ASSETS[`sources/colonnade/${source.file}`]}</p></figure>`;
    })
    .join("");
  const licenses = files
    .filter((f) => f.endsWith(".txt"))
    .map((f) => `<h3>${f}</h3><pre>${esc(new TextDecoder().decode(bytes.get(f)))}</pre>`)
    .join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia — The row that is not there</title><style>
@font-face{font-family:Noto;src:url('${data("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${data("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}
*{box-sizing:border-box}body{max-width:960px;margin:auto;padding:32px;font:16px/1.65 Plex,Arial,sans-serif;color:#27352f;background:#f4f1e8}h1,h2,.col-latin,[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400}h1{font-size:44px;line-height:1.2}h2{font-size:28px;line-height:1.3}h3{font-size:18px}a{color:#405a43}section{margin-top:35px}.col-kicker,.identity{font-size:12px;overflow-wrap:anywhere}.col-latin{font-size:21px}.col-reading,.grammar{padding:14px 0;border-bottom:1px solid #bfc3b3}.plans{display:grid;grid-template-columns:1fr 1fr;gap:20px}.col-strip{max-width:640px;margin:auto}.printed-page{margin:45px 0 0}.printed-page img{display:block;width:100%;height:auto}.identity{color:#56604f}table{width:100%;border-collapse:collapse}th,td{text-align:left;border-bottom:1px solid #bfc3b3;padding:9px}pre{white-space:pre-wrap;font-size:11px;overflow-wrap:anywhere}
${ink}
@media(max-width:600px){body{padding:20px}h1{font-size:34px}.plans{display:block}.col-latin{font-size:18px}}
@page{size:A4;margin:14mm}@media print{body{padding:0;font-size:10pt;background:#fff}h1{font-size:27pt}h2{font-size:20pt}h2,h3{break-after:avoid}.plans{display:block}.plan-figure{break-inside:avoid;max-width:150mm;margin:0 auto 10mm}.plan-figure svg{max-height:95mm}.col-strip{max-width:135mm;break-inside:avoid}.col-reading,.grammar{break-inside:avoid}.col-latin{font-size:12pt}.printed-page{break-before:page;margin:0}.printed-page img{max-width:100%;max-height:205mm;width:auto;margin:auto}.printed-page figcaption{font-size:9pt}.printed-page h2{font-size:15pt;margin-top:0}.identity{font-size:7pt}.licenses,.download{display:none}}
</style></head><body><header><p>GONIA · <span lang="grc">γωνία</span> · measured ancient architecture</p><h1>The row that is not there.</h1><p>Selected arrangement: ${s.kind === "pseudo" ? "inner ring omitted" : "two perimeter rings"}. Chosen equal gap ${n(s.gap)} D; diameter 1 D; axis pitch ${n(m.pitch)} D. The simplified cella block and outer axes stay fixed when the inner ring is omitted.</p><p class="identity">Edition ${esc(__GONIA_EDITION__)}. <a href="https://antonsoo.github.io/gonia/colonnade.html${esc(colonnadeQuery(s))}#col-workshop">Reopen these settings</a>. Both plans, vocabulary, fonts and all five complete source images are embedded for offline reading.</p></header><main>
<section><h2>Compare the two arrangements</h2><div class="plans">${(["double", "pseudo"] as const).map((kind) => `<figure class="plan-figure"><figcaption>${kind === "double" ? "Two perimeter rings: 76 model columns" : "Inner ring omitted: 42 model columns"}</figcaption><div class="col-plan">${colonnadeDrawing({ ...s, kind }, `saved-${kind}`)}</div></figure>`).join("")}</div><h3>The selected passage at a column station</h3><div class="col-strip">${colonnadeStrip(s, "saved-strip")}</div><p>${n(s.gap)} + 1 + ${n(s.gap)} = ${n(m.wideClear)} D. ${s.kind === "double" ? "The inner shaft separates two clear lanes." : "Removing the inner shaft joins the full width."} In the double row the lanes communicate through the gaps between columns. The strip is measured between shaft faces, excluding bases.</p><table><caption>Distinct model ring positions; corners assigned to ends</caption><thead><tr><th scope="col">Ring</th><th scope="col">Ends</th><th scope="col">Flanks without corners</th><th scope="col">Total</th></tr></thead><tbody><tr><th scope="row">Outer</th><td>2 × 8</td><td>2 × 13</td><td>42</td></tr><tr><th scope="row">Inner</th><td>2 × 6</td><td>2 × 11</td><td>34</td></tr></tbody></table><p>Selected trace: ${s.ring} ring, ${s.count} positions visited. The plans are regular-grid experiments, not a measured Magnesia reconstruction. Porches, interior columns, bases, steps and roof supports are omitted.</p><p class="download"><a download="gonia-colonnade.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(colonnadeCsv(s)))}">Save all 76 potential positions as CSV</a></p></section>
<section><h2>A number the grid cannot settle</h2><p>Krohn prints XXXIV (34); the apparatus on p. 66 attributes that reading to Philander and records XXXVIII (38) in the textual tradition. The model's regular inner ring has 34 positions. Agreement with a neat grid does not prove that an editorial reading is correct.</p><p><a href="${COLONNADE_LEFAS}">Pavlos Lefas (2001)</a> argues for 38 through an interpretation involving the inner building's ends and antae. The model omits its porches. Neither this model nor the photograph establishes that a completed double colonnade was physically removed at Magnesia.</p></section>
<section><h2>Read the Latin</h2>${colonnadeReadingHtml(false)}</section><section><h2>Keep the word notes</h2>${grammar}</section><section><h2>Greek architectural vocabulary</h2>${vocabulary}<p>Greek headwords explain the vocabulary; they are not a Greek original of the Latin. English explanations and translations are new.</p></section><section><h2>Scope and sources</h2><p>${COLONNADE_LIMITS}</p><p>Vitruvius III.2.6–7 and III.3.8, edited by F. Krohn (1912), pp. 63 and 66. Humann, Kohte and Watzinger, <cite>Magnesia am Maeander</cite> (1904), pp. 41, 43, 55: preserved-state plan, proposed restoration and capital photograph. Heidelberg University Library supplies the latter scans with the Public Domain Mark. The 1912 Latin scans are from Internet Archive. All page borders, legends, apparatus and library credits remain. Short excerpts join line-end hyphens and capitalize the numeral. New text, diagrams and code: MIT, Anton Soloviev, 2026. Each embedded image, font and license was verified by SHA-256 before this download was prepared.</p></section>${sources}<details class="licenses"><summary>Embedded font copyright and license notices</summary>${licenses}</details></main></body></html>`;
  save(html, "gonia-colonnade-reading.html", "text/html;charset=utf-8");
}

import mit from "../LICENSE?raw";
import manifest from "../public/sources/volute/manifest.json";
import {
  repairJoin,
  type VoluteState,
  voluteCsv,
  voluteQuery,
  voluteRecord,
  voluteSummary,
} from "./core/volute";
import { voluteAsset, voluteData } from "./volute-assets";
import {
  VOLUTE_LIMITS,
  ve,
  vn,
  volutePages,
  voluteReadingHtml,
  voluteWordHtml,
} from "./volute-content";
import { joinDrawing, voluteDrawing, voluteStencil } from "./volute-drawing";

export function saveVolute(data: string, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function voluteTable(s: VoluteState): string {
  const m = voluteSummary(s);
  return `<table><caption>Committed quarter circles. Coordinates are exact twelfths of e; square roots and angles are rounded here. The CSV retains the integer squared radii and cross/dot products.</caption><thead><tr><th scope="col">Arc / pin</th><th scope="col">Centre (e)</th><th scope="col">Radius (e)</th><th scope="col">End (e)</th><th scope="col">Next direction</th></tr></thead><tbody>${m.arcs
    .map((a, i) => {
      const j = m.joins.find((j) => j.index === i + 1);
      return `<tr><th scope="row">${i + 1} / ${a.pin}</th><td>${vn(a.centre.x / 12)}, ${vn(a.centre.y / 12)}</td><td>${vn(Math.sqrt(a.radiusSquared) / 12)}</td><td>${vn(a.end.x / 12)}, ${vn(a.end.y / 12)}</td><td>${j ? (j.angle === null ? "Undefined: zero radius" : `${vn(j.angle)}°${j.eye ? " to eye circle*" : ""}`) : "No next arc"}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table><p class="vo-note">* An eye-circle direction comparison is a join only when the endpoint lies on the eye. Your final radial gap is ${vn(m.radialGap)} e. The local repair overlay does not alter this table or the committed arcs.</p>`;
}
export async function voluteSvg(s: VoluteState): Promise<string> {
  const [font, license] = await Promise.all([
    voluteAsset("fonts/IBMPlexSans-Regular.woff2"),
    voluteAsset("fonts/IBMPlex-OFL.txt"),
  ]);
  return voluteStencil(s, voluteData(font, "font/woff2"), new TextDecoder().decode(license));
}
export async function voluteStudy(s: VoluteState): Promise<string> {
  const paths = [
    "fonts/IBMPlexSans-Regular.woff2",
    "fonts/IBMPlexSans-SemiBold.woff2",
    "fonts/NotoSerif-Regular.ttf",
    "fonts/IBMPlex-OFL.txt",
    "fonts/NotoSerif-OFL.txt",
    ...volutePages.map((p) => `sources/volute/${p.file}`),
  ];
  const assets = await Promise.all(paths.map(voluteAsset));
  const uri = (index: number, mime: string) => voluteData(assets[index] as Uint8Array, mime);
  const m = voluteSummary(s),
    j = m.joins.find((j) => j.index === s.join),
    repair = j && !j.eye ? repairJoin(j) : null;
  const embedText = (text: string, mime: string) =>
    voluteData(new TextEncoder().encode(text), mime);
  const svg = voluteStencil(s, uri(0, "font/woff2"), new TextDecoder().decode(assets[3]));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Gonia · The compass changes centre · saved reading</title><style>@font-face{font-family:Plex;src:url('${uri(0, "font/woff2")}')}@font-face{font-family:Plex;src:url('${uri(1, "font/woff2")}');font-weight:600}@font-face{font-family:Noto;src:url('${uri(2, "font/ttf")}')}*{box-sizing:border-box}body{font:16px/1.6 Plex,Arial,sans-serif;max-width:940px;margin:auto;padding:30px;color:#263b50;background:#f2f6fa}h1,h2,h3,.vo-latin{font-family:Noto,serif;font-weight:400}h1{font-size:48px;line-height:1.15}h2{font-size:30px;margin-top:1.8em}h3{font-size:24px;break-after:avoid}a{color:#315f99;overflow-wrap:anywhere}.vo-latin{font-size:22px}.vo-note{color:#536779}svg,img{width:100%;height:auto}.vo-reading{padding:18px 0;border-top:1px solid #cfdeeb}.table-pan{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #cfdeeb}caption{text-align:left;margin:12px 0}dt{font-weight:600}dt span{display:block}dd{margin:0 0 18px}.source{margin:35px 0}.source img{max-width:800px;display:block;margin:auto}figcaption{margin-top:12px;font-size:14px}pre{font:12px/1.5 monospace;white-space:pre-wrap;overflow-wrap:anywhere}@media print{@page{size:A4;margin:17mm}body{padding:0;background:white;font-size:10pt}h1{font-size:31pt}h2{font-size:22pt;break-after:avoid}h3{font-size:16pt}.vo-latin{font-size:13pt}.vo-reading{break-inside:avoid}svg{max-height:215mm;break-inside:avoid}.table-pan{overflow:visible}table{font-size:8pt}td,th{padding:5px}.source{break-before:page;break-inside:avoid;margin:0}.source img{width:auto;max-width:100%;max-height:218mm}.source figcaption{font-size:9pt}.licenses{break-before:page}.downloads{display:none}a{color:inherit}}</style></head><body><header><p>Gonia · Ionic volute · saved compass experiment</p><h1>The compass changes centre.</h1><p>${VOLUTE_LIMITS}</p></header><main><h2>Your drawing sequence</h2><p>${s.moves.join(" → ") || "No committed arcs"}. ${m.followsPrint ? "These choices follow the printed centre order so far." : "These choices differ from the printed centre order."} All committed arcs turn clockwise through 90°. Endpoint (${vn(m.end.x / 12)}, ${vn(m.end.y / 12)}) e. ${m.onEye ? "The endpoint lies exactly on the eye circle." : `Radial gap to the eye: ${vn(m.radialGap)} e.`}</p>${voluteDrawing(s)}<p>Dashed plum is an uncommitted next-arc preview. A green overlay, when selected, changes only one next centre for inspection; it does not replace the committed outline.</p><h2>Inspect a direction</h2>${joinDrawing(j, Boolean(s.repair && repair))}<p>The displayed angle is calculated between two radii at the endpoint. Rotating both radii through 90° gives their tangent directions without changing the angle. Two arcs meeting at a point need not have the same tangent.</p><div class="table-pan">${voluteTable(s)}</div><h2>The ancient words and the later plate</h2><p>Selected Latin: Krohn 1912, pp. 71–72. Line wraps and end-of-line hyphens are removed; punctuation is lightly regularized. Angle-bracketed editorial supplies remain. New English translations and grammar notes are learning aids. The 1889 English guide is a separate later interpretation.</p>${voluteReadingHtml(false)}<h2>Words used at the desk</h2><dl>${voluteWordHtml()}</dl><h2>What the exact construction assumes</h2><p>In units of e/12, the eye centre is (0,0), its radius is 6, and the start is (0,54). Pins 1–4 are (−3,3), (3,3), (3,−3), (−3,−3); pins 5–8 use ±2, and pins 9–12 use ±1. A quarter turn sends P to C + (Pᵧ − Cᵧ, −Pₓ + Cₓ). Integer coordinates remain exact. The radius is the square root of the retained integer squared radius. Join angles use atan2(|cross|, dot).</p><p>The full 1–12 sequence ends at (0,6), on the eye. This establishes contact, not tangent continuity. The selected local intervention projects the next centre onto the incoming radius; that makes one pair of directions agree and moves the next endpoint. It is a modern experiment, not a proposed historical restoration. The eye circle itself is not moved.</p><p>Reference: <a href="https://architectura.univ-tours.fr/en/livres-notice/goldman1649c490/">Maria Losito’s 2012 research notice on Goldmann’s different 1649 volute</a> documents the distinction between later constructions. Our desk operates the specified 1889 plate, not Goldmann’s construction.</p><div class="downloads"><h2>Native files kept inside this reading</h2><ul><li><a download="gonia-volute.json" href="${embedText(voluteRecord(s), "application/json")}">Editable drawing JSON</a></li><li><a download="gonia-volute.csv" href="${embedText(voluteCsv(s), "text/csv")}">Exact-coordinate measurement CSV</a></li><li><a download="gonia-volute-compass.svg" href="${embedText(svg, "image/svg+xml")}">Physical compass sheet · e = ${s.eye} mm</a></li><li><a download="volute-source-manifest.json" href="${embedText(JSON.stringify(manifest, null, 2), "application/json")}">Source identities and provenance</a></li></ul><p><a href="https://antonsoo.github.io/gonia/volute.html${ve(voluteQuery(s))}#vo-bench">Reopen this sequence online</a></p></div><h2>Six complete pages and a surviving capital</h2><p>${manifest.derivation} Public-domain editions; each included image and font was checked against its retained SHA-256 identity before this reading was produced.</p>${volutePages.map((p, i) => `<figure class="source"><img src="${uri(i + 5, "image/jpeg")}" alt="${ve(p.title)}; complete page"><figcaption><strong>${p.title}</strong>. ${p.note} ${p.pdfPage ? `PDF page ${p.pdfPage}.` : "The Met Open Access, CC0. Complete photograph retained byte for byte."} <a href="${manifest.originals[p.source as keyof typeof manifest.originals].url}${p.pdfPage ? `#page=${p.pdfPage}` : ""}">Original source</a></figcaption></figure>`).join("")}<section class="licenses"><h2>Licenses retained in this file</h2><p>New code, diagrams, English and notes:</p><pre>${ve(mit)}</pre><h3>IBM Plex Sans</h3><pre>${ve(new TextDecoder().decode(assets[3]))}</pre><h3>Noto Serif</h3><pre>${ve(new TextDecoder().decode(assets[4]))}</pre></section></main></body></html>`;
}

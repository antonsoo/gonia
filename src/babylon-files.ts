import mit from "../LICENSE?raw";
import { babylonAsset, babylonData } from "./babylon-assets";
import {
  BABYLON_LIMITS,
  BABYLON_ORACC,
  BABYLON_SCAN,
  BABYLON_TABLET,
  babylonPages,
  babylonReadings,
  babylonWords,
} from "./babylon-content";
import { babylonDiagram, babylonPlate, be, bn } from "./babylon-drawing";
import type { ScanView } from "./babylon-scan";
import { type BabylonState, babylonCSV, babylonModel, babylonRecord } from "./core/babylon";
export function saveBabylon(data: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function babylonSVG(s: BabylonState): Promise<string> {
  const [font, license] = await Promise.all([
    babylonData("fonts/IBMPlexSans-Regular.woff2", "font/woff2"),
    babylonAsset("fonts/IBMPlex-OFL.txt"),
  ]);
  return babylonPlate(s, font, mit, new TextDecoder().decode(license));
}
export function babylonTable(s: BabylonState): string {
  const m = babylonModel(s);
  return `<table><caption>Every row keeps its source. Metres are rounded for display; the CSV keeps the computed numeric values.</caption><thead><tr><th scope="col">Level</th><th scope="col">Tablet-derived L × B × H (m)</th><th scope="col">Status</th><th scope="col">Image W × H (cm)</th><th scope="col">Projected W × H (m)</th></tr></thead><tbody>${m.rows.map((r) => `<tr ${s.selected === r.level - 1 ? 'class="bb-selected-row"' : ""}><th scope="row">${r.level}${r.level === 7 ? " · sanctuary" : ""}</th><td>${r.width === null ? "Unknown" : `${bn(r.width)} × ${bn(r.depth as number)} × ${bn(r.height as number)}`}</td><td>${r.kind === "missing" ? "No written row" : r.kind === "supplied" ? "Your supplied dimensions" : "Conventional reading"}</td><td>${bn(r.imageWidth, 1)} × ${bn(r.imageHeight, 1)}</td><td>${bn(r.steleWidth)} × ${bn(r.steleHeight)}</td></tr>`).join("")}</tbody></table>`;
}
export async function babylonStudy(
  s: BabylonState,
  snapshot: { image: string; view: ScanView } | null,
): Promise<string> {
  const m = babylonModel(s);
  const [regular, bold, serif, plex, noto, pdf, ...images] = await Promise.all([
    babylonData("fonts/IBMPlexSans-Regular.woff2", "font/woff2"),
    babylonData("fonts/IBMPlexSans-SemiBold.woff2", "font/woff2"),
    babylonData("fonts/NotoSerif-Regular.ttf", "font/ttf"),
    babylonAsset("fonts/IBMPlex-OFL.txt").then((b) => new TextDecoder().decode(b)),
    babylonAsset("fonts/NotoSerif-OFL.txt").then((b) => new TextDecoder().decode(b)),
    babylonData("sources/babylon/pedersen2024.pdf", "application/pdf"),
    ...babylonPages.map((p) => babylonData(`sources/babylon/${p.file}`, "image/jpeg")),
  ]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Gonia — A tower between two sources</title><style>
@font-face{font-family:Plex;src:url('${regular}')}@font-face{font-family:Plex;src:url('${bold}');font-weight:600 800}@font-face{font-family:Noto;src:url('${serif}')}*{box-sizing:border-box}body{font:16px/1.6 Plex,Arial,sans-serif;color:#27352f;background:#f4f1e8;max-width:1040px;margin:35px auto;padding:0 20px}h1{font-size:2.8rem;line-height:1.12}h2{font-size:1.65rem;margin-top:2em}a{color:#405a43;overflow-wrap:anywhere}.diagrams{display:flex;gap:12px}.diagrams>div{width:50%}svg{width:100%;height:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:9px 7px;border-bottom:1px solid #bfc3b3;vertical-align:top}caption{text-align:left;margin:14px 0}th{font-weight:600}.bb-selected-row{background:#e1e6d8}.source{margin:2em 0;break-inside:avoid;max-width:800px}.source img,.scan img{width:100%;height:auto}.source figcaption{margin-top:10px}.reading{font:1.25rem/1.7 Noto,serif}.note{color:#5f6559}pre{font:12px/1.5 Plex,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere}.table-pan{overflow:auto}.word{border-top:1px solid #bfc3b3;padding-top:12px}.word h3{font-family:Noto,serif}.scan{max-width:800px;margin:25px 0}section{break-inside:auto}@media(max-width:600px){body{padding:0 12px}h1{font-size:2.1rem}.diagrams{display:block}.diagrams>div{width:100%}table{font-size:13px;min-width:570px}}@media print{@page{size:A4;margin:17mm}body{background:white;margin:0;padding:0;font-size:10pt;max-width:none}h1{font-size:27pt}h2{font-size:19pt;break-after:avoid}h3{break-after:avoid}.reading{break-inside:avoid}.diagrams{display:flex}.diagrams>div{width:50%}.table-pan{overflow:visible}table{min-width:0;font-size:8pt;break-inside:avoid}th,td{padding:5px 4px}a{color:inherit}.source{break-before:page;break-inside:avoid;margin:0;max-width:none}.source img{display:block;max-height:220mm;width:auto;max-width:100%;margin:auto}.source figcaption{font-size:9pt}.licenses{break-before:page}.reading{font-size:12pt}.scan{break-inside:avoid}pre{font-size:8pt}}
</style></head><body><header><p>Gonia · measured ancient architecture · saved comparison</p><h1>A tower between two sources.</h1><p>Babylon's Etemenanki: a later clay-tablet copy and a carved stone image preserve different evidence. This reading keeps the supplied dimensions visible.</p></header><main>
<h2>Your two projections</h2><p>${s.supplied ? `Your supplied sixth storey is ${bn(s.width / 4)} × ${bn(s.width / 4)} × ${bn(s.height / 4)} rods. The tablet-derived total is ${bn(m.tabletHeight as number)} m.` : "The sixth-storey measurements are unresolved. Written-height subtotal in the conventional reading: 84 m. There is no total tower height from that subtotal alone."}</p><p>Your image ruler assigns ${bn(s.base / 10)} m to ${s.ruler === "overall" ? "12.5 cm overall image width" : "12.4 cm lower-terrace width"}. The scale factor is ${bn(m.factor, 6)} m per image centimetre. Applying it to all rounded height measurements gives ${bn(m.steleHeight)} m. That is an inference from a chosen scale.</p>
<div class="diagrams"><div>${babylonDiagram(s, "tablet", true)}</div><div>${babylonDiagram(s, "stele", true)}</div></div><p class="note">Both diagrams use equal horizontal and vertical metres. Rectangular outlines and centred terraces are this lesson's comparison convention. The unknown-gap diagram's top sanctuary is not vertically located. Sloping walls, stairs, courtyards and building phases are not reconstructed.</p><div class="table-pan">${babylonTable(s)}</div>
<p><a download="gonia-babylon-comparison.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(babylonCSV(s))}">Save the numerical CSV</a> · <a download="gonia-babylon-record.json" href="data:application/json;charset=utf-8,${encodeURIComponent(babylonRecord(s))}">Save the editable comparison record</a></p>
<h2>Sixth is supplied; seventh is written.</h2><p>The numerical sequence in the retained 1914 edition runs from the fifth storey to the seventh-storey sanctuary. The conventional sixth storey, 5½ by 5½ rods and one rod high, completes a 90 m scheme. Removing that row leaves 84 m of known heights, not an 84 m tower. Changing its dimensions explores a hypothesis; it does not restore a lost measurement.</p>
<p>The sanctuary's breadth is 3¾ rods in the modern interpretation used here. At 6 m per rod its footprint is 24 × 22.5 m. Scheil's earlier reading of the fractional expression is retained on the full page and differs from this interpretation. The retained BTTo transliteration also displays 2½ for the lower height while its translation reads 5½; this activity uses the retained 1914 row's 5½ and labels the scheme conventional.</p>
<p>The missing-row controls hold the other conventional dimensions fixed. <a href="https://revistas.uam.es/isimu/article/download/3374/3591">Montero Fenollós, with Vegas and Mileto, p. 204</a>, discusses a 66 m proposal that reinterprets other rows too. Changing only the sixth row cannot reproduce every published hypothesis.</p><h2>One stone can use more than one scale.</h2><p>Pedersén reports the plan of the top sanctuary at approximately 1.8 times the elevation's scale. Treating both as a single uniformly scaled drawing would make the plan too large. The royal figure and the building also do not establish a common human scale.</p><p>The source's rounded image heights total 12.5 cm. The paper also describes 12.5–12.8 cm overall height and alternative ground levels. This comparison projects those figures under the ruler you selected; it does not replace them with a falsely exact measurement of the ancient tower.</p>
${snapshot ? `<section><h2>Your inspection of the source scan</h2><figure class="scan"><img src="${snapshot.image}" alt="Actual rendering saved from the retained photogrammetric scan"><figcaption>Photogrammetry: Olof Pedersén, October 2023, <a href="${BABYLON_SCAN}">Zenodo 10374395</a>, CC BY 4.0. New rendering: turn ${snapshot.view.turn}°, tip ${snapshot.view.tip}°, light ${snapshot.view.light}°, zoom ${snapshot.view.zoom}, ${snapshot.view.texture ? "photographic texture" : "plain geometry"}. Geometry is a scan of the stone and its support, not a scan of the ancient tower. All 189,027 original triangles retained; new averaged normals and illustrative lighting. The texture retains its photographed lighting. The live viewer is not embedded in this script-free document.</figcaption></figure></section>` : ""}
<h2>Read the numerical language</h2><p>Capital forms identify signs. Lowercase forms identify Akkadian words. These normalized reading aids do not reproduce every wedge, restoration or early editorial reading.</p>${babylonReadings.map((r) => `<section><h3>${be(r.label)}</h3><p class="reading">${be(r.reading)}</p><p>${be(r.english)}</p><p class="note">${be(r.note)}</p></section>`).join("")}${babylonWords.map((w) => `<section class="word"><h3>${be(w.written)} · ${be(w.word)}</h3><p>${be(w.meaning)}. ${be(w.note)}</p></section>`).join("")}
<h2>Keep the sources distinct</h2><p>${be(BABYLON_LIMITS)}</p><p>The clay tablet AO 6555 was copied at Uruk in Seleucid year 83 (229 BCE), from a Borsippa exemplar according to its colophon. It is later than Nebuchadnezzar II's building. <a href="${BABYLON_TABLET}">Louvre object record</a>; <a href="${BABYLON_ORACC}">current digital edition</a>.</p><p>The stone's provenance is not a controlled modern excavation. Pedersén 2024 reports a 1990s find based on villagers' accounts without photographic corroboration and a return to Iraq in December 2023. Authenticity has been debated; <a href="https://doi.org/10.2143/BIOR.81.1.3293875">George 2024</a> argues that it is genuine. Neither this rendering nor a source's authority independently settles those questions.</p>
<p><a download="pedersen2024.pdf" href="${pdf}">Save the complete retained 2024 article (PDF)</a>. Olof Pedersén, <cite>The Tower of Babylon Stele Found in Babylon</cite>, IRAQ 85, 179–191, DOI 10.1017/irq.2024.4, CC BY 4.0. The image measurements and plan-scale comparison come from pp. 188–189. The article's provisional drawing distinguishes insecure reconstructions in grey.</p>
<section><h2>The complete retained source images</h2>${babylonPages.map((p, i) => `<figure class="source"><img src="${images[i]}" alt="${be(p.label)}"><figcaption><strong>${be(p.label)}.</strong> ${be(p.note)} <a href="${p.url}">Original source</a>.</figcaption></figure>`).join("")}</section>
<section class="licenses"><h2>Attribution and licenses</h2><p>Scheil 1914 and Thureau-Dangin 1922: public-domain printed pages, via Persée and Internet Archive. Museum photographs are not bundled. Stele photograph, provisional drawing, article, scan and texture: Olof Pedersén, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The atlas texture was reduced to 2048 pixels; scan positions converted to float32 with no shape edits or simplification. New normals, lighting and numerical diagrams are identified as modern.</p><p>Lexical mappings: Giulia Lentini's BTTo Q007970, adapted from A. R. George 1992, Living Among Ruins, LMU Munich, 2019–2020. The downloaded lexical JSON declares CC0; the portal credits its edition under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. Modern English translations are linked rather than reproduced. New activity, reading aids, explanations, diagrams and code: Anton Soloviev, 2026, MIT. Embedded fonts retain their OFL notices.</p><h3>Code and new content</h3><pre>${be(mit)}</pre><h3>IBM Plex</h3><pre>${be(plex)}</pre><h3>Noto Serif</h3><pre>${be(noto)}</pre></section>
</main></body></html>`;
}

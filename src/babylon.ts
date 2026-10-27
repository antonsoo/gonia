import "./style.css";
import "./babylon.css";
import { babylonAsset } from "./babylon-assets";
import {
  BABYLON_LIMITS,
  BABYLON_ORACC,
  BABYLON_PAPER,
  BABYLON_SCAN,
  BABYLON_TABLET,
  babylonPages,
  babylonReadings,
  babylonWords,
} from "./babylon-content";
import { babylonDiagram, be, bn } from "./babylon-drawing";
import { babylonStudy, babylonSVG, babylonTable, saveBabylon } from "./babylon-files";
import { BabylonScan, SCAN_FRONT, type ScanView } from "./babylon-scan";
import {
  type BabylonState,
  babylonCSV,
  babylonModel,
  babylonQuery,
  babylonRecord,
  readBabylon,
  readBabylonRecord,
} from "./core/babylon";
import { offlineStatus } from "./offline";

const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
};
const initial = readBabylon(location.search);
let state: BabylonState = initial.state,
  committed = babylonQuery(state),
  sourceRevision = 0,
  sourceURL = "",
  scan: BabylonScan | undefined;
let scanView: ScanView = { ...SCAN_FRONT };
el("app").innerHTML =
  `<a class="skip" href="#bb-bench">Skip to the comparison</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./colonnade.html">Greek temple plan</a><a href="./ledger.html">Building accounts</a><a href="./babylon.html" aria-current="page">Babylon</a></nav></header>
<main><section class="bb-intro"><div><p class="bb-kicker">Etemenanki · Babylon</p><h1>A tower between<br>two sources.</h1></div><div><p>A clay tablet lists dimensions. A stone carries an elevation and a plan. Bring their evidence to the same drawing—and see where a number has been supplied.</p><p class="bb-note">Neo-Babylonian building, sixth century BCE. Tablet copy: Uruk, 229 BCE. Modern comparisons remain visible as comparisons.</p><a href="#bb-source">Inspect the complete printed evidence</a></div></section>
<p id="bb-invalid" class="bb-warning" role="status" ${initial.invalid ? "" : "hidden"}>Invalid or repeated comparison settings. The complete starting comparison has been restored.</p>
<section id="bb-bench" class="bb-bench" aria-labelledby="bb-bench-title"><div class="bb-section-heading"><div><p class="bb-kicker">01 · Compare the elevations</p><h2 id="bb-bench-title" tabindex="-1">How tall is the second terrace?</h2></div><p>Both drawings use equal horizontal and vertical metres.<br>Centred rectangles are a modern comparison convention.</p></div>
<div class="bb-levels" role="group" aria-label="Select a storey">${Array.from({ length: 7 }, (_, i) => `<button type="button" data-bb-select="${i}" aria-controls="bb-level-detail">${i + 1}<small>${i === 5 ? "Missing row" : i === 6 ? "Sanctuary" : "Storey"}</small></button>`).join("")}</div>
<div class="bb-bench-grid"><div><div class="bb-diagrams"><figure><div id="bb-tablet"></div><figcaption><strong id="bb-tablet-caption">Tablet-derived scheme</strong><span class="bb-caption-long">Numerical scheme from the tablet's edited dimensions. The dashed sixth level is yours to supply.</span></figcaption></figure><figure><div id="bb-stele"></div><figcaption><strong>Stone-image projection</strong><span class="bb-caption-long">Projection from the stone image's rounded centimetre measurements, under your selected ruler.</span></figcaption></figure></div><div id="bb-level-detail" class="bb-level-detail" aria-live="polite"></div><button type="button" id="bb-read-row">Read this row in the printed evidence</button></div>
<aside class="bb-controls" aria-label="Comparison assumptions"><fieldset><legend>The missing sixth level</legend><label class="bb-check"><input type="checkbox" id="bb-supplied">Supply dimensions</label><p class="bb-note">The written sequence jumps from fifth to seventh. A completed drawing adds evidence of its own.</p><div id="bb-missing-controls"><label for="bb-width">Supplied length and breadth <output id="bb-width-value" for="bb-width"></output></label><input type="range" id="bb-width" min="17" max="27" step="1"><label for="bb-height">Supplied height <output id="bb-height-value" for="bb-height"></output></label><input type="range" id="bb-height" min="1" max="12" step="1"></div><button type="button" id="bb-conventional">Use conventional completion</button><p id="bb-total" class="bb-total" role="status"></p></fieldset>
<fieldset><legend>The stone image's ruler</legend><label for="bb-base">Assign a real base width<select id="bb-base"><option value="915">91.5 m · excavated base</option><option value="900">90 m · conventional tablet scheme</option></select></label><label for="bb-ruler">Match it to a reported image width<select id="bb-ruler"><option value="overall">12.5 cm · overall image</option><option value="terrace">12.4 cm · first terrace</option></select></label><p id="bb-factor" class="bb-note"></p><p class="bb-note">Pedersén's measurements are rounded. Changing the ruler changes the projection, not the ancient building.</p></fieldset></aside></div>
<details class="bb-table-details"><summary>Read every number in the comparison</summary><div class="bb-table-pan" tabindex="0" role="region" aria-label="Complete numerical comparison; scroll horizontally on a narrow screen" id="bb-table"></div></details>
<p class="bb-note">The rectangular sanctuary's breadth is 3¾ rods in the modern interpretation: 24 × 22.5 m at 6 m per rod. No stairs, parapets, wall slopes, interiors or construction phases are recovered by these outlines.</p></section>
<section class="bb-section bb-plan"><div><p class="bb-kicker">02 · Read an ancient drawing</p><h2>Two views.<br>Two scales.</h2><p>The plan above the tower shows the top sanctuary from above. The elevation below shows it from the front. A single ruler does not automatically connect them.</p><div class="bb-actions" role="group" aria-label="Compare the plan and elevation scales"><button type="button" data-bb-plan="1">Try one scale</button><button type="button" data-bb-plan="1.8">Use the reported relative scale</button></div><p id="bb-plan-result" class="bb-result" role="status"></p><p class="bb-note">This arithmetic uses Pedersén's approximate reported ratio, 1.8:1, and the reported 3.9 cm sanctuary front. It is not a new measurement of the photograph. Grey lines in his drawing are insecure reconstructions.</p><button type="button" id="bb-find-plan">Inspect the full provisional drawing</button></div><figure><img id="bb-plan-image" hidden width="650" height="906" alt="Pedersén's provisional reading: top-sanctuary plan above the stepped elevation; insecure parts in grey" ><figcaption>Olof Pedersén, 2023, figure 3 in the 2024 article. CC BY 4.0. A modern reading of the damaged surface.</figcaption></figure></section>
<section class="bb-section" id="bb-inspect" aria-labelledby="bb-inspect-title"><div class="bb-section-heading"><div><p class="bb-kicker">03 · Inspect the source object</p><h2 id="bb-inspect-title" tabindex="-1">Move the light across the stone.</h2></div><p>A scan of the surviving stone and its support.<br>Compare the captured surface with the photograph and drawing.</p></div><div class="bb-scan-grid"><div class="bb-scan-stage"><img id="bb-scan-poster" hidden width="550" height="917" alt="Two joined stone fragments; the plan, tower and king occupy the upper part"><canvas id="bb-canvas" role="img" aria-label="Photogrammetric scan of the stone and its support, controlled by the turn, tip, light and enlargement controls" aria-describedby="bb-scan-note" hidden></canvas></div><div><button type="button" id="bb-load-scan" class="bb-primary">Load the source scan · 5.1 MB</button><p id="bb-scan-status" role="status">The photograph is available before the interactive scan loads.</p><fieldset id="bb-scan-controls" disabled><legend>Inspect the captured surface</legend><label for="bb-turn">Turn stone <output id="bb-turn-value" for="bb-turn">0°</output></label><input type="range" id="bb-turn" min="-180" max="180" value="0"><label for="bb-tip">Tip stone <output id="bb-tip-value" for="bb-tip">0°</output></label><input type="range" id="bb-tip" min="-75" max="75" value="0"><label for="bb-light">Light direction <output id="bb-light-value" for="bb-light">−60°</output></label><input type="range" id="bb-light" min="-180" max="180" value="-60"><label for="bb-zoom">Enlarge <output id="bb-zoom-value" for="bb-zoom">3.1</output></label><input type="range" id="bb-zoom" min="1" max="5" step="0.1" value="3.1"><label class="bb-check"><input type="checkbox" id="bb-texture" checked>Show photographic colour</label><div class="bb-actions"><button type="button" id="bb-front">Whole stone</button><button type="button" id="bb-upper">Plan and tower</button></div></fieldset><p id="bb-scan-note" class="bb-note">Photogrammetry: Olof Pedersén, October 2023, <a href="${BABYLON_SCAN}">Zenodo 10374395</a>, CC BY 4.0. The support surface is retained. The plain-stone view uses the captured shape with a new illustrative light. The photographic colour keeps the lighting from when it was taken; the new lamp cannot remove it.</p></div></div></section>
<section class="bb-section" id="bb-source" aria-labelledby="bb-source-title"><div class="bb-section-heading"><div><p class="bb-kicker">04 · Read the evidence</p><h2 id="bb-source-title" tabindex="-1">The gap survives the copy.</h2></div><p>Whole pages and source images.<br>Reading aids stay separate from the printed text.</p></div><div class="bb-reading-grid"><div><label for="bb-reading">Select a numerical reading<select id="bb-reading">${babylonReadings.map((r, i) => `<option value="${i}">${be(r.label)}</option>`).join("")}</select></label><div id="bb-reading-text" class="bb-reading-text"></div><button type="button" id="bb-find-reading">Find this reading in the sources</button><h3>Words for measuring</h3><div class="bb-words" role="group" aria-label="Measurement vocabulary">${babylonWords.map((w, i) => `<button type="button" data-bb-word="${i}" aria-controls="bb-word-note">${be(w.meaning.split(";")[0] ?? w.meaning)}<small>${be(w.word)}</small></button>`).join("")}</div><div id="bb-word-note" class="bb-word-note" aria-live="polite"></div><p class="bb-note">Capital forms label cuneiform signs; lowercase forms identify Akkadian words. Lexical mappings: Giulia Lentini's <a href="${BABYLON_ORACC}">BTTo Q007970</a>, from A. R. George 1992, LMU Munich's Living Among Ruins. New English explanations. No invented ancient pronunciation or synthetic cuneiform is used.</p></div>
<div><div class="bb-source-controls"><label for="bb-page">Complete retained evidence<select id="bb-page">${babylonPages.map((p) => `<option value="${p.id}">${be(p.label)}</option>`).join("")}</select></label><button type="button" id="bb-retry">Reload source</button></div><p id="bb-source-status" class="bb-note" role="status"></p><label for="bb-page-zoom">Page size <output id="bb-page-zoom-value" for="bb-page-zoom">100%</output></label><input type="range" id="bb-page-zoom" min="100" max="250" step="25" value="100"><div class="bb-source-pan" id="bb-source-pan" tabindex="0" role="region" aria-label="Complete source image; use arrow keys to pan"><img id="bb-source-image" alt="" hidden></div><p id="bb-source-caption" class="bb-note"></p><div class="bb-actions"><a id="bb-original">Open the original source</a><a href="./sources/babylon/manifest.json">Provenance and identities</a><a href="./sources/babylon/pedersen2024.pdf" download>Full 2024 article (PDF)</a></div></div></div></section>
<section class="bb-section bb-two"><div><h2>A later copy,<br>an older building.</h2><p>The tablet's colophon identifies a copy made at Uruk in year 83 of Seleucus (229 BCE), from a Borsippa exemplar. The document has its own mathematical and scholarly purposes. It is later than Nebuchadnezzar II's tower.</p><p>The missing-row controls keep the other conventional dimensions fixed. <a href="https://revistas.uam.es/isimu/article/download/3374/3591">Montero Fenollós, with Vegas and Mileto, p. 204</a>, discusses a 66 m proposal that reinterprets other rows too. This control does not cover every published hypothesis.</p><p>Its account of several cubit standards also makes it dangerous to convert every number in the complete tablet with one universal metre factor. This room converts only the conventional tower-dimension scheme.</p><a href="${BABYLON_TABLET}">Louvre: AO 6555</a></div><div><h2>A disputed history,<br>a damaged surface.</h2><p>The stone did not come from a controlled modern excavation. Pedersén reports a 1990s find from villagers' accounts without photographic corroboration, and its return to Iraq in December 2023. Earlier collection find stories changed.</p><p>Authenticity has been debated; <a href="https://doi.org/10.2143/BIOR.81.1.3293875">George's 2024 article</a> argues that it is genuine. A rotatable scan cannot independently settle provenance or authenticity. Pedersén also disputes using the tablet's second-storey height as a reliable elevation.</p><a href="${BABYLON_PAPER}">Read Pedersén's study and its limits</a></div></section>
<section class="bb-section bb-two"><div><h2>Keep your assumptions<br>beside the sources.</h2><p>Save this comparison, both drawings, the numerical reading aids, seven complete source images, the full 2024 PDF, fonts and licenses in one illustrated reading. If the scan is loaded, its current actual rendering and settings are included. The saved HTML opens and prints without scripts.</p><div class="bb-actions"><button type="button" id="bb-save" class="bb-primary">Save illustrated reading</button><button type="button" id="bb-svg">Save comparison plate (SVG)</button><button type="button" id="bb-csv">Save numbers (CSV)</button><button type="button" id="bb-json">Save editable record (JSON)</button><button type="button" id="bb-import">Open a saved record</button><input type="file" id="bb-file" accept="application/json,.json" hidden><button type="button" id="bb-share">Share tower comparison</button></div><p id="bb-save-status" role="status"></p><label for="bb-share-url" id="bb-share-label" hidden>Comparison link<input type="url" id="bb-share-url" readonly></label></div><div><h2>Where the evidence stops.</h2><p>${be(BABYLON_LIMITS)}</p><p>Article, stele photograph, drawing, scan and texture: Olof Pedersén, CC BY 4.0. Full public-domain printed pages: Scheil 1914 and Thureau-Dangin 1922. New activity, diagrams, English reading aids and code: Anton Soloviev, 2026, MIT. The source manifest describes every transformation.</p><a href="./ledger.html">Return to the Greek building accounts</a></div></section>
</main><footer><span>Gonia · measured ancient architecture</span><span id="bb-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;

let planScale = 1,
  reading = 1,
  word = 0;
async function showStaticSource(id: string, file: string) {
  const img = el<HTMLImageElement>(id);
  try {
    const bytes = await babylonAsset(`sources/babylon/${file}`);
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    const picture = new Image();
    picture.src = url;
    try {
      await picture.decode();
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    img.src = url;
    img.hidden = false;
    img.dataset.source = file;
    img.dataset.sourceVerified = "true";
  } catch (error) {
    const note = document.createElement("p");
    note.className = "bb-warning";
    note.textContent = error instanceof Error ? error.message : "Source image unavailable.";
    img.after(note);
  }
}
function render() {
  const m = babylonModel(state),
    r = m.rows[state.selected];
  el("bb-tablet-caption").textContent = state.supplied
    ? "Tablet-derived scheme"
    : "Tablet: sixth unknown";
  if (!r) return;
  el("bb-tablet").innerHTML = babylonDiagram(state, "tablet");
  el("bb-stele").innerHTML = babylonDiagram(state, "stele");
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-bb-select]"))
    button.setAttribute("aria-pressed", String(Number(button.dataset.bbSelect) === state.selected));
  el<HTMLInputElement>("bb-supplied").checked = state.supplied;
  el<HTMLInputElement>("bb-width").value = String(state.width);
  el<HTMLInputElement>("bb-height").value = String(state.height);
  el<HTMLInputElement>("bb-width").disabled = !state.supplied;
  el<HTMLInputElement>("bb-height").disabled = !state.supplied;
  el("bb-width-value").textContent = `${bn(state.width / 4)} rods · ${bn(state.width * 1.5)} m`;
  el("bb-height-value").textContent = `${bn(state.height / 4)} rods · ${bn(state.height * 1.5)} m`;
  el("bb-total").textContent =
    m.tabletHeight === null
      ? "84 m of stated heights + unknown sixth height. Total unresolved."
      : `${bn(m.tabletHeight)} m total = 84 m of stated heights + ${bn(state.height * 1.5)} m supplied.`;
  el<HTMLSelectElement>("bb-base").value = String(state.base);
  el<HTMLSelectElement>("bb-ruler").value = state.ruler;
  el("bb-factor").textContent =
    `${bn(state.base / 10)} ÷ ${state.ruler === "overall" ? "12.5" : "12.4"} = ${bn(m.factor, 6)} m per image centimetre. The 12.5–12.8 cm overall-height report would project to ${bn(m.steleHeightRange[0] as number)}–${bn(m.steleHeightRange[1] as number)} m under this ruler.`;
  el("bb-level-detail").innerHTML =
    `<h3>${r.level === 7 ? "Top sanctuary" : `Level ${r.level}`}</h3><div class="bb-measures"><p><span>Tablet-derived height</span><strong>${r.height === null ? "Unknown" : `${bn(r.height)} m`}</strong><small>${r.kind === "supplied" ? "Your supplied value" : r.kind === "missing" ? "The row is absent" : `${bn((r.height ?? 0) / 6)} rods × 6 m`}</small></p><p><span>Image-projected height</span><strong>${bn(r.steleHeight)} m</strong><small>${bn(r.imageHeight, 1)} cm × ${bn(m.factor, 4)} m/cm</small></p></div><p>${r.kind === "missing" ? "The omitted row is not a zero-height terrace. Its dimensions and the sanctuary's resulting elevation remain unresolved." : `The projection ${r.height === null ? "cannot be compared with an unknown dimension" : `is ${bn((r.steleHeight / (r.height || 1)) * 100, 1)}% of the ${r.kind === "supplied" ? "height you supplied" : "conventional tablet-derived height"}`}. Neither number by itself settles the built tower's height.`}</p>`;
  el("bb-table").innerHTML = babylonTable(state);
  el<HTMLSelectElement>("bb-page").value = state.page;
  renderPlan();
  if (!el("bb-share-label").hidden) el<HTMLInputElement>("bb-share-url").value = shareURL();
}
function renderPlan() {
  const m = babylonModel(state),
    inferred = (m.templeFrontWidth * 1.8) / planScale;
  el("bb-plan-result").textContent =
    `At ${planScale === 1 ? "one common scale" : "a separate 1.8× plan scale"}, the reported plan width would imply ${bn(inferred)} m, compared with ${bn(m.templeFrontWidth)} m from the sanctuary's front elevation. ${planScale === 1 ? "The plan comes out 80% wider. The shared-scale assumption creates that discrepancy." : "The agreement follows from applying the reported relative scale; it is not independent proof of the building's dimensions."}`;
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bb-plan]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.bbPlan) === planScale));
}
function shareURL() {
  return `${location.origin}${location.pathname}?${babylonQuery(state)}#bb-bench`;
}
function change(update: Partial<BabylonState>, push = true) {
  state = { ...state, ...update };
  const query = babylonQuery(state);
  if (query !== committed) {
    history[push ? "pushState" : "replaceState"](null, "", `?${query}${location.hash}`);
    committed = query;
  }
  el("bb-invalid").hidden = true;
  render();
}
async function showSource() {
  const revision = ++sourceRevision,
    p = babylonPages.find((p) => p.id === state.page);
  if (!p) return;
  el<HTMLImageElement>("bb-source-image").hidden = true;
  el("bb-source-status").textContent = "Checking this source's retained identity…";
  el("bb-source-caption").textContent = p.note;
  el<HTMLAnchorElement>("bb-original").href = p.url;
  try {
    const bytes = await babylonAsset(`sources/babylon/${p.file}`);
    if (revision !== sourceRevision) return;
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" })),
      picture = new Image();
    picture.src = url;
    try {
      await picture.decode();
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    if (revision !== sourceRevision) {
      URL.revokeObjectURL(url);
      return;
    }
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    sourceURL = url;
    const img = el<HTMLImageElement>("bb-source-image");
    img.src = url;
    img.alt = p.label;
    img.width = picture.naturalWidth;
    img.height = picture.naturalHeight;
    img.hidden = false;
    img.dataset.source = p.file;
    el("bb-source-status").textContent = `Verified source · ${p.label}`;
  } catch (error) {
    if (revision === sourceRevision)
      el("bb-source-status").textContent =
        error instanceof Error ? error.message : "Source unavailable. Reload to retry.";
  }
}
function choosePage(page: string) {
  change({ page });
  void showSource();
}
function renderReading() {
  const r = babylonReadings[reading];
  if (!r) return;
  el("bb-reading-text").innerHTML =
    `<h3>${be(r.label)}</h3><p class="bb-transliteration">${be(r.reading)}</p><p>${be(r.english)}</p><p class="bb-note">${be(r.note)}</p>`;
}
function renderWord() {
  const w = babylonWords[word];
  if (!w) return;
  el("bb-word-note").innerHTML =
    `<h4>${be(w.written)} · <span lang="akk">${be(w.word)}</span></h4><p>${be(w.meaning)}. ${be(w.note)}</p>`;
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bb-word]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.bbWord) === word));
}
function renderScan() {
  for (const key of ["turn", "tip", "light", "zoom"] as const) {
    el<HTMLInputElement>(`bb-${key}`).value = String(scanView[key]);
    el(`bb-${key}-value`).textContent = `${scanView[key]}${key === "zoom" ? "" : "°"}`;
  }
  el<HTMLInputElement>("bb-texture").checked = scanView.texture;
  scan?.draw(scanView);
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bb-select]"))
  b.addEventListener("click", () => change({ selected: Number(b.dataset.bbSelect) }));
el<HTMLInputElement>("bb-supplied").addEventListener("change", (e) =>
  change({ supplied: (e.target as HTMLInputElement).checked }),
);
for (const key of ["width", "height"] as const)
  el<HTMLInputElement>(`bb-${key}`).addEventListener("input", (e) =>
    change({ [key]: Number((e.target as HTMLInputElement).value) }, false),
  );
el("bb-conventional").addEventListener("click", () =>
  change({ supplied: true, width: 22, height: 4 }),
);
el<HTMLSelectElement>("bb-base").addEventListener("change", (e) =>
  change({ base: Number((e.target as HTMLSelectElement).value) as 900 | 915 }),
);
el<HTMLSelectElement>("bb-ruler").addEventListener("change", (e) =>
  change({ ruler: (e.target as HTMLSelectElement).value as "overall" | "terrace" }),
);
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bb-plan]"))
  b.addEventListener("click", () => {
    planScale = Number(b.dataset.bbPlan);
    renderPlan();
  });
el("bb-find-plan").addEventListener("click", () => {
  choosePage("stele-drawing");
  el("bb-source-title").focus();
});
el("bb-read-row").addEventListener("click", () => {
  reading =
    state.selected === 6
      ? 3
      : state.selected === 5 || state.selected === 4
        ? 2
        : state.selected === 0
          ? 0
          : 1;
  el<HTMLSelectElement>("bb-reading").value = String(reading);
  renderReading();
  choosePage("scheil-300");
  el("bb-source-title").focus();
});
el<HTMLSelectElement>("bb-reading").addEventListener("change", (e) => {
  reading = Number((e.target as HTMLSelectElement).value);
  renderReading();
});
el("bb-find-reading").addEventListener("click", () => {
  const r = babylonReadings[reading];
  if (r) choosePage(r.page);
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bb-word]"))
  b.addEventListener("click", () => {
    word = Number(b.dataset.bbWord);
    renderWord();
  });
el<HTMLSelectElement>("bb-page").addEventListener("change", (e) =>
  choosePage((e.target as HTMLSelectElement).value),
);
el("bb-retry").addEventListener("click", () => void showSource());
el<HTMLInputElement>("bb-page-zoom").addEventListener("input", (e) => {
  const v = (e.target as HTMLInputElement).value;
  el<HTMLImageElement>("bb-source-image").style.width = `${v}%`;
  el("bb-page-zoom-value").textContent = `${v}%`;
});
el("bb-load-scan").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("bb-load-scan");
  button.disabled = true;
  el("bb-scan-status").textContent = "Verifying the source geometry and texture…";
  try {
    scan = new BabylonScan(el<HTMLCanvasElement>("bb-canvas"), el("bb-scan-status"));
    await scan.load();
    el("bb-canvas").hidden = false;
    el("bb-scan-poster").hidden = true;
    el<HTMLFieldSetElement>("bb-scan-controls").disabled = false;
    button.hidden = true;
    renderScan();
    el<HTMLInputElement>("bb-turn").focus({ preventScroll: true });
  } catch (error) {
    el("bb-scan-status").textContent =
      error instanceof Error ? error.message : "The source scan is unavailable.";
    button.disabled = false;
  }
});
for (const key of ["turn", "tip", "light", "zoom"] as const)
  el<HTMLInputElement>(`bb-${key}`).addEventListener("input", (e) => {
    scanView = { ...scanView, [key]: Number((e.target as HTMLInputElement).value) };
    renderScan();
  });
el<HTMLInputElement>("bb-texture").addEventListener("change", (e) => {
  scanView = { ...scanView, texture: (e.target as HTMLInputElement).checked };
  renderScan();
});
el("bb-front").addEventListener("click", () => {
  scanView = { ...SCAN_FRONT };
  renderScan();
});
el("bb-upper").addEventListener("click", () => {
  scanView = { ...SCAN_FRONT, zoom: 5, focus: 0.16 };
  renderScan();
});
el("bb-csv").addEventListener("click", () =>
  saveBabylon(babylonCSV(state), "gonia-babylon-comparison.csv", "text/csv;charset=utf-8"),
);
el("bb-json").addEventListener("click", () =>
  saveBabylon(babylonRecord(state), "gonia-babylon-record.json", "application/json"),
);
el("bb-import").addEventListener("click", () => el<HTMLInputElement>("bb-file").click());
el<HTMLInputElement>("bb-file").addEventListener("change", async (e) => {
  const input = e.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw new Error("Comparison record is too large.");
    const saved = readBabylonRecord(await file.text());
    change(saved);
    void showSource();
    el("bb-save-status").textContent = "Saved tower comparison restored.";
  } catch (error) {
    el("bb-save-status").textContent =
      `Record left unchanged. ${error instanceof Error ? error.message : "Invalid record."}`;
  } finally {
    input.value = "";
  }
});
el("bb-svg").addEventListener("click", async () => {
  const captured = { ...state };
  try {
    saveBabylon(await babylonSVG(captured), "gonia-babylon-plate.svg", "image/svg+xml");
    el("bb-save-status").textContent =
      "Comparison plate saved with its font, editable record and licenses.";
  } catch (error) {
    el("bb-save-status").textContent =
      error instanceof Error ? error.message : "Could not save the plate.";
  }
});
el("bb-save").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("bb-save"),
    captured = { ...state },
    snapshot = scan?.snapshot() ?? null;
  button.disabled = true;
  el("bb-save-status").textContent = "Verifying all seven source images, the article and fonts…";
  try {
    const html = await babylonStudy(captured, snapshot);
    saveBabylon(html, "gonia-babylon-reading.html", "text/html;charset=utf-8");
    el("bb-save-status").textContent =
      "Illustrated reading saved with the comparison captured when you clicked, complete sources, fonts and licenses.";
  } catch (error) {
    el("bb-save-status").textContent =
      error instanceof Error ? error.message : "Could not save the complete reading.";
  } finally {
    button.disabled = false;
  }
});
el("bb-share").addEventListener("click", () => {
  el("bb-share-label").hidden = false;
  el<HTMLInputElement>("bb-share-url").value = shareURL();
  el<HTMLInputElement>("bb-share-url").select();
  el("bb-save-status").textContent =
    "Comparison link selected. Copy it to keep these tower assumptions and source selection; scan angles are separate inspection controls.";
});
window.addEventListener("popstate", () => {
  const restored = readBabylon(location.search);
  state = restored.state;
  committed = babylonQuery(state);
  el("bb-invalid").hidden = !restored.invalid;
  render();
  void showSource();
});
render();
renderReading();
renderWord();
void showSource();
void showStaticSource("bb-plan-image", "stele-drawing.jpg");
void showStaticSource("bb-scan-poster", "stele-photo.jpg");
void offlineStatus(el("bb-offline"));

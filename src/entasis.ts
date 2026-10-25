import {
  compareMaxima,
  decimal,
  type EntasisState,
  enlargements,
  entasisCsv,
  heightLabel,
  offsetLabel,
  readEntasis,
  shaftLength,
  stationMeasurements,
  writeEntasis,
} from "./core/entasis";
import { escapeHtml } from "./drawing";
import { entasisPassage, entasisSources, entasisWords } from "./entasis-content";
import { departureDrawing, edgeDrawing, measurementHead, measurementRows } from "./entasis-drawing";
import { entasisStudy } from "./entasis-study";
import { offlineStatus } from "./offline";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing ${id}`);
  return element as T;
}
let state = readEntasis(location.search);
let source = "41";
let sourceFocus: number | null = null;
get("app").innerHTML = `
<a class="skip" href="#entasis-workshop">Skip to the measured profile</a>
<header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./#workshop">Doric corner</a><a href="./spacing.html">Column spacing</a><a href="./entasis.html" aria-current="page">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a><a href="./optics.html">Viewpoint</a></nav></header>
<main class="entasis-main">
<section class="entasis-intro"><h1>The curve<br>inside the taper.</h1><div><p>A Parthenon column narrows as it rises. Yet its edge sits slightly outside a straight taper. That small addition is <em>entasis</em>.</p><p>Follow a surveyor’s numbers. Enlarge the difference. Read what the ancient text actually says.</p><a href="#entasis-workshop">Inspect the measured edge ↓</a></div></section>
<section id="entasis-workshop" aria-labelledby="entasis-title"><h2 id="entasis-title" tabindex="-1">How much curve can five measurements show?</h2><p class="entasis-lead">Francis Penrose’s 1888 comparison records one exterior <a href="./fluting.html">flute edge</a> of the fourth east-front column from the Parthenon’s northeast corner. These five corrected offsets are measured inward from a line through the base, parallel to the column axis.</p>
<div class="entasis-controls"><div><label for="entasis-station">Inspect a measured height <output id="station-output" for="entasis-station"></output></label><input id="entasis-station" type="range" min="0" max="4" step="1" aria-describedby="station-hint"><small id="station-hint">Five printed stations, from base to shaft top.</small></div>
<div><label for="entasis-enlargement">Enlarge the departure</label><select id="entasis-enlargement">${enlargements.map((n) => `<option value="${n}">${n}× horizontally${n === 1 ? " · true scale" : ""}</option>`).join("")}</select><small>The left drawing stays at true proportions.</small></div>
<div><label for="entasis-prediction">Compare a prediction</label><select id="entasis-prediction"><option value="none">Measurements only</option><option value="hyperbola">Penrose’s hyperbola</option><option value="circle">Penrose’s circle</option></select><small>Printed values, with five guide points.</small></div>
<div><label for="entasis-units">Drawing labels</label><select id="entasis-units"><option value="metric">Metres + millimetres</option><option value="feet">Original feet</option></select><small>The table always preserves the source units.</small></div></div>
<div class="entasis-figures"><figure><h3>Measured offsets, equal scales</h3><div id="entasis-edge"></div><figcaption>Both directions have the same scale. Axis-referenced offsets remove the whole column’s inward lean. The shaded slice does not set its full diameter.</figcaption></figure><figure><h3>The straight taper subtracted</h3><div id="entasis-departure"></div><figcaption id="departure-caption"></figcaption></figure></div>
<div class="entasis-key"><span><i></i>Corrected column offsets</span><span><i class="chord-key"></i>Straight endpoint taper</span><span id="prediction-key"><i class="prediction-key"></i><span id="prediction-key-label"></span></span></div>
<p class="entasis-small">Straight guides join the five plotted stations. They do not supply intermediate measurements or reproduce the mathematical curve between Penrose’s prediction points.</p>
<div class="entasis-calculation" aria-live="polite" aria-atomic="true"><h3 id="calculation-title"></h3><div class="entasis-equation" id="entasis-equation"></div><p id="calculation-note"></p></div>
<div class="table-scroll entasis-table" tabindex="0" role="region" aria-label="Five measurement stations and calculated departures; scroll horizontally"><table><caption>Penrose (1888), p. 41. Original offsets in feet; taper and departures calculated here. <a href="#entasis-sources" data-source="41">Inspect the printed rows</a>.</caption><thead id="entasis-table-head"></thead><tbody id="entasis-table-body"></tbody></table></div>
<p class="entasis-small">Decimal conversion uses 1 foot = 304.8 mm. Extra digits describe the calculation, not the survey’s accuracy. The source gives no statistical uncertainty for these rows.</p>
<div class="entasis-experiments"><article><h3>Does a circular arc agree?</h3><p>Penrose compares a circle through the base, middle and top stations. Those three agreements are built into the choice. Inspect the other two heights.</p><button type="button" id="compare-circle">Compare at 8.70 feet</button></article><article><h3>Read the numbers against the prose.</h3><p>The text says the hyperbola differs by no more than 0.001 feet. Its printed middle row gives 0.2875 against 0.2886: a difference of 0.0011 feet.</p><button type="button" id="inspect-rounding">Inspect the middle row</button></article></div>
<p id="prediction-assessment"></p>
<div class="entasis-actions"><button type="button" id="entasis-share">Copy this view</button><button type="button" id="entasis-save">Save illustrated reading</button><button type="button" id="entasis-csv">Download the numbers</button><p id="entasis-action-status" role="status"></p></div>
</section>
<section class="entasis-section" aria-labelledby="maxima-title"><h2 id="maxima-title">Small compared with what?</h2><p>The largest departure among our five stations is <strong>16.508 mm</strong> at 15.75 feet. Penrose separately reports a maximum of <strong>0.057 feet (17.374 mm)</strong> at 13.8 feet. A maximum in a short table is not necessarily the maximum of the whole profile.</p><p>His previous page compares six shafts. First compare their reported maxima in actual units; then scale each shaft to the Parthenon’s 31.43-foot length.</p>
<div class="entasis-basis" role="group" aria-label="Basis for comparing reported maxima"><button type="button" data-comparison="actual">Actual reported sizes</button><button type="button" data-comparison="equal">Equal shaft length</button></div><p id="maxima-basis-note"></p><div id="maxima-chart" class="maxima-chart"></div>
<details><summary>Inspect all six source rows and the normalization</summary><div class="table-scroll entasis-table" tabindex="0" role="region" aria-label="Six reported maxima; scroll horizontally"><table><thead><tr><th scope="col">Penrose’s name</th><th scope="col">Shaft / ft</th><th scope="col">Maximum / ft</th><th scope="col">Height above stylobate / ft</th><th scope="col">Equal-length maximum / ft, calculated</th><th scope="col">Penrose’s comparison / ft</th></tr></thead><tbody id="maxima-rows"></tbody></table></div><p class="entasis-small">The shaft lengths exclude the apophyge and related details. The heights are above the stylobate, so they are not interchangeable with distances measured from the bottom of every shaft. Historical building names are retained. These are six reported maxima, not six reconstructed continuous curves.</p></details>
<p class="entasis-small">The equal-length calculation is maximum × 31.43 / shaft length. Penrose’s separately rounded comparison column remains visible in the table. At equal length, his small Propylaea order has a larger relative entasis than the Parthenon.</p><a href="#entasis-sources" data-source="40">Inspect the original six-row table</a></section>
<section class="entasis-section" aria-labelledby="entasis-reading-title"><h2 id="entasis-reading-title">An addition in the middle parts.</h2><div class="entasis-reading"><p lang="la">${entasisPassage.latin}</p><div><p>${entasisPassage.english}</p><p class="entasis-small">${entasisPassage.note}</p><a href="#entasis-sources" data-source="latin">Inspect the Latin and its critical apparatus</a></div></div><div class="entasis-words">${entasisWords.map((w) => `<article><h3 lang="${w.lang}">${w.word}</h3><p>${w.gloss}</p><p class="entasis-small">${w.explanation}${w.source ? ` <a href="${w.source}">Greek dictionary</a>.` : ""}</p></article>`).join("")}</div></section>
<section class="entasis-section" aria-labelledby="evidence-title"><h2 id="evidence-title">A shape, a fit, an explanation.</h2><div class="entasis-evidence"><article><h3>The survey</h3><p>Penrose stretched a weighted harp wire beside a flute edge and read the offsets with a vernier. He then corrected for horizontal shifts between drums and transferred the offsets to an axis-parallel reference line.</p><p>Our five rows come from that corrected comparison. They are not the raw distances from the wire. <a href="#entasis-sources" data-source="40">Read his method</a>.</p></article><article><h3>The fitted curve</h3><p>His hyperbola predictions agree more closely with these five rows than his circle does. He took that agreement as evidence for an ancient hyperbolic design.</p><p>The numerical agreement alone does not identify the builders’ tools or method. The workshop shows the printed predictions and their discrepancies; it does not certify his historical inference.</p></article><article><h3>The proposed purpose</h3><p>Penrose describes entasis as an optical correction. Modern research disputes that explanation: Alain Goriely’s <a href="https://arxiv.org/html/2510.16831v2">2026 analysis</a> argues against the conventional optical-correction account.</p><p>These measurements establish departures from a straight taper. This workshop measures neither an ancient observer’s perception nor an architect’s intention.</p></article></div></section>
<section id="entasis-sources" class="entasis-section" aria-labelledby="entasis-sources-title"><h2 id="entasis-sources-title" tabindex="-1">Read the marks on the page.</h2><p>Penrose, <cite>An Investigation of the Principles of Athenian Architecture</cite>, second edition (1888), pp. 39–41 and plate XIV. High-resolution public-domain scans from Heidelberg University Library. The Latin page is Krohn’s 1912 edition of Vitruvius, p. 68, from Internet Archive.</p><div class="entasis-source-choices" role="group" aria-label="Printed source">${entasisSources.map((s) => `<button type="button" data-source-page="${s.id}" aria-pressed="false">${s.label}</button>`).join("")}</div><figure class="entasis-source-figure"><div class="entasis-scan-window" id="entasis-scan-window" tabindex="0" role="region" aria-label="Scanned source; scroll to read the complete page"></div><figcaption id="entasis-scan-caption"></figcaption></figure><div class="entasis-source-controls"><button type="button" id="entasis-scan-zoom" aria-pressed="false">Enlarge scan</button><a id="entasis-image-link">Open full image</a><a id="entasis-original-link">Library source</a><a href="./sources/entasis/entasis-source-pages.pdf">All five source pages (PDF)</a></div></section>
</main><footer><a href="./spacing.html">Read the space between columns</a><span id="entasis-offline" role="status">Preparing offline workshop…</span><a href="https://github.com/antonsoo/gonia">Source &amp; license</a></footer>`;

function update() {
  get<HTMLInputElement>("entasis-station").value = String(state.station);
  const row = stationMeasurements(state.station);
  const selectedHeight = heightLabel(row.height, state.units);
  get("station-output").textContent = `${selectedHeight} · station ${state.station + 1} of 5`;
  get("entasis-station").setAttribute(
    "aria-valuetext",
    `${selectedHeight}, station ${state.station + 1} of 5`,
  );
  get<HTMLSelectElement>("entasis-enlargement").value = String(state.enlargement);
  get<HTMLSelectElement>("entasis-prediction").value = state.prediction;
  get<HTMLSelectElement>("entasis-units").value = state.units;
  get("entasis-edge").innerHTML = edgeDrawing(state);
  get("entasis-departure").innerHTML = departureDrawing(state);
  get("departure-caption").textContent =
    `Horizontal distances are ${state.enlargement === 1 ? "at true scale" : `enlarged ${state.enlargement} times`}; heights keep the left drawing’s scale. Zero is the straight line joining the base and shaft-top offsets.`;
  get("prediction-key").hidden = state.prediction === "none";
  get("prediction-key-label").textContent = `Penrose’s ${state.prediction} predictions`;
  get("calculation-title").textContent = `At ${selectedHeight}, subtract the inward offsets.`;
  get("entasis-equation").innerHTML =
    `<div>${offsetLabel(row.taper, state.units)}<span>straight taper</span></div><div aria-hidden="true">−</div><div>${offsetLabel(row.column, state.units)}<span>corrected column</span></div><div aria-hidden="true">=</div><div>${offsetLabel(row.departure, state.units)}<span>outward departure</span></div>`;
  get("calculation-note").textContent =
    `Straight taper = 0.684 × ${decimal(row.height, 2)} / 31.43 feet. ${row.departure === 0 ? "The departure is zero at this endpoint by construction." : "The edge is outside that taper while still being inward of its position at the base."}`;
  get("entasis-table-head").innerHTML = measurementHead(state);
  // Preserve the focused station button when a table row changes the selection.
  const focused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement.dataset.selectStation
      : undefined;
  get("entasis-table-body").innerHTML = measurementRows(state);
  if (focused !== undefined)
    document
      .querySelector<HTMLButtonElement>(`[data-select-station="${focused}"]`)
      ?.focus({ preventScroll: true });
  get("prediction-assessment").textContent =
    state.prediction === "none"
      ? "The measured edge stays inward of its base position at every higher station. Entasis is the addition relative to straight taper; it need not make the shaft wider than its base."
      : state.prediction === "circle"
        ? "The circle’s largest discrepancy in these five rows is 0.0067 feet (2.042 mm), at 8.70 feet. The zero differences at base, middle and top are the three points used to choose the circle."
        : "The hyperbola’s largest printed discrepancy in these five rows is 0.0011 feet (0.335 mm), at 15.75 feet. That numerical fit does not establish the ancient construction method or the survey’s uncertainty.";
  document.querySelectorAll<HTMLButtonElement>("[data-comparison]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.comparison === state.comparison));
  });
  get("maxima-basis-note").textContent =
    state.comparison === "actual"
      ? "Reported maxima at each shaft’s actual size. The bar scale is fixed across both comparisons."
      : `Each shaft scaled uniformly to ${heightLabel(shaftLength, state.units)}. The bar scale is unchanged; these values are calculated from Penrose’s printed lengths and maxima.`;
  get("maxima-chart").innerHTML = compareMaxima(state.comparison)
    .map(
      (r) =>
        `<div class="maximum-row"><span class="maximum-name">${r.name}</span><span class="maximum-track" aria-hidden="true"><span class="maximum-bar" data-maximum-ft="${r.displayedMaximum}" style="width:${(r.displayedMaximum / 0.12) * 100}%"></span></span><span class="maximum-value">${offsetLabel(r.displayedMaximum, state.units)}</span></div>`,
    )
    .join("");
  get("maxima-rows").innerHTML = compareMaxima(state.comparison)
    .map(
      (r) =>
        `<tr><th scope="row">${r.name}</th><td>${decimal(r.length, 2)}</td><td>${decimal(r.maximum, 4)}</td><td>${decimal(r.height, 2)}</td><td>${decimal(r.normalizedMaximum, 6)}</td><td>${decimal(r.printedComparison, 4)}</td></tr>`,
    )
    .join("");
  history.replaceState(null, "", `${location.pathname}${writeEntasis(state)}${location.hash}`);
}
function drawSource() {
  sourceFocus = null;
  const page = entasisSources.find((s) => s.id === source);
  if (!page) throw new Error("Unknown source page");
  document.querySelectorAll<HTMLButtonElement>("[data-source-page]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.sourcePage === source));
  });
  const file = `./sources/entasis/${page.file}`;
  get("entasis-scan-window").innerHTML =
    `<img src="${file}" width="${page.width}" height="${page.height}" alt="${page.label}: complete scanned page" loading="lazy">`;
  get("entasis-scan-window").scrollTo(0, 0);
  get("entasis-scan-caption").textContent = `${page.label}. ${page.note}`;
  get<HTMLAnchorElement>("entasis-image-link").href = file;
  get<HTMLAnchorElement>("entasis-original-link").href = page.link;
}
async function focusSourcePassage() {
  const selected = source;
  const window = get("entasis-scan-window");
  const image = window.querySelector("img");
  if (!image) return;
  const fraction = { "39": 0.4, "40": 0.23, "41": 0.435, plate: 0.47, latin: 0.22 }[selected] ?? 0;
  sourceFocus = fraction;
  // Firefox can reject decode() while a newly selected lazy image has not started loading.
  // An explicit source jump is an immediate request to read this page.
  image.loading = "eager";
  try {
    await image.decode();
  } catch {
    return;
  }
  if (selected !== source || image !== window.querySelector("img") || sourceFocus !== fraction)
    return;
  window.scrollTo({
    top: Math.max(0, image.clientHeight * fraction - window.clientHeight / 2),
    left: Math.max(0, (image.clientWidth - window.clientWidth) / 2),
  });
}
get("entasis-station").addEventListener("input", () => {
  state = { ...state, station: Number(get<HTMLInputElement>("entasis-station").value) };
  update();
});
get("entasis-enlargement").addEventListener("change", () => {
  state = {
    ...state,
    enlargement: Number(
      get<HTMLSelectElement>("entasis-enlargement").value,
    ) as EntasisState["enlargement"],
  };
  update();
});
get("entasis-prediction").addEventListener("change", () => {
  state = {
    ...state,
    prediction: get<HTMLSelectElement>("entasis-prediction").value as EntasisState["prediction"],
  };
  update();
});
get("entasis-units").addEventListener("change", () => {
  state = {
    ...state,
    units: get<HTMLSelectElement>("entasis-units").value as EntasisState["units"],
  };
  update();
});
document.addEventListener("click", (event) => {
  const target =
    event.target instanceof Element ? event.target.closest<HTMLElement>("button,a") : null;
  if (!target) return;
  if (target.dataset.selectStation !== undefined) {
    state = { ...state, station: Number(target.dataset.selectStation) };
    update();
  } else if (target.dataset.comparison) {
    state = { ...state, comparison: target.dataset.comparison as EntasisState["comparison"] };
    update();
  } else if (target.dataset.sourcePage || target.dataset.source) {
    source = target.dataset.sourcePage ?? target.dataset.source ?? "41";
    drawSource();
    if (target.dataset.source) {
      event.preventDefault();
      get("entasis-sources-title").focus();
      get("entasis-sources").scrollIntoView();
      void focusSourcePassage();
    }
  }
});
for (const [id, prediction, station] of [
  ["compare-circle", "circle", 1],
  ["inspect-rounding", "hyperbola", 2],
] as const)
  get(id).addEventListener("click", () => {
    state = { ...state, prediction, station, enlargement: 200 };
    update();
    get("entasis-title").focus();
    get("entasis-workshop").scrollIntoView();
  });
for (const event of ["wheel", "touchstart", "pointerdown", "keydown"])
  get("entasis-scan-window").addEventListener(
    event,
    () => {
      sourceFocus = null;
    },
    { passive: true },
  );
get("entasis-scan-zoom").addEventListener("click", () => {
  const window = get("entasis-scan-window");
  const image = window.querySelector("img");
  if (!image) return;
  const frame = window.getBoundingClientRect();
  const before = image.getBoundingClientRect();
  const centreX = (frame.left + window.clientWidth / 2 - before.left) / before.width;
  const centreY = sourceFocus ?? (frame.top + window.clientHeight / 2 - before.top) / before.height;
  sourceFocus = null;
  const enlarged = window.classList.toggle("enlarged");
  const after = image.getBoundingClientRect();
  window.scrollTo({
    left:
      window.scrollLeft + after.left + centreX * after.width - frame.left - window.clientWidth / 2,
    top:
      window.scrollTop + after.top + centreY * after.height - frame.top - window.clientHeight / 2,
  });
  get("entasis-scan-zoom").setAttribute("aria-pressed", String(enlarged));
  get("entasis-scan-zoom").textContent = enlarged ? "Fit scan to width" : "Enlarge scan";
});
get("entasis-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}${writeEntasis(state)}#entasis-workshop`;
  try {
    await navigator.clipboard.writeText(url);
    get("entasis-action-status").textContent =
      "Copied the station, enlargement, prediction, units and comparison settings.";
  } catch {
    get("entasis-action-status").innerHTML =
      `<label for="entasis-link">Copy this view</label><input id="entasis-link" readonly value="${escapeHtml(url)}">`;
    get<HTMLInputElement>("entasis-link").select();
  }
});
function download(contents: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
get("entasis-csv").addEventListener("click", () => {
  download(entasisCsv(), "text/csv;charset=utf-8", "gonia-penrose-five-stations.csv");
  get("entasis-action-status").textContent =
    "Saved all five original rows, both printed predictions and the calculated departures. Source units and converted millimetres have separate columns.";
});
get("entasis-save").addEventListener("click", async () => {
  const snapshot = { ...state };
  const button = get<HTMLButtonElement>("entasis-save");
  button.disabled = true;
  get("entasis-action-status").textContent =
    "Preparing the drawing, readings and five verified source images…";
  try {
    const images = Object.fromEntries(
      await Promise.all(
        entasisSources.map(async (s) => {
          const response = await fetch(`./sources/entasis/${s.file}`);
          if (!response.ok) throw new Error("Source unavailable");
          const buffer = await response.arrayBuffer();
          const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          if (hash !== s.hash) throw new Error("Unexpected source image");
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(new Blob([buffer], { type: "image/jpeg" }));
          });
          return [s.id, data];
        }),
      ),
    );
    download(
      entasisStudy(snapshot, images),
      "text/html;charset=utf-8",
      `gonia-entasis-${snapshot.prediction}-${snapshot.enlargement}x.html`,
    );
    get("entasis-action-status").textContent =
      "Saved this view, both comparisons, the language reading and all five source images in one offline document. Open it or print to PDF.";
  } catch {
    get("entasis-action-status").textContent =
      "The source images could not be verified. Reconnect and try saving again.";
  } finally {
    button.disabled = false;
  }
});
addEventListener("popstate", () => {
  state = readEntasis(location.search);
  update();
});
update();
drawSource();
if (location.hash)
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
void offlineStatus(get("entasis-offline"));

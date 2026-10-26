import {
  degrees,
  opticsNumber as num,
  type OpticsMode,
  type OpticsState,
  opticsBounds,
  opticsModel,
  opticsQuery,
  parseOptics,
} from "./core/optics";
import { offlineStatus } from "./offline";
import { OPTICS_LIMITS, opticsPassages, opticsSourcePages } from "./optics-content";
import { oe, opticsDetail, opticsProjection, opticsScene } from "./optics-drawing";
import { opticsBook, opticsCsv, opticsSvg, saveOptics } from "./optics-files";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const item = document.getElementById(id);
  if (!item) throw new Error(`Missing ${id}`);
  return item as T;
}
const parsed = parseOptics(location.search);
let state = parsed.state,
  word = 0,
  committed = opticsQuery(state);
const sliders = [
  ["distance", "Horizontal distance"],
  ["height", "Face-centre height"],
  ["eye", "Eye height"],
  ["length", "Face edge length"],
] as const;
const treatments: [OpticsMode, string][] = [
  ["vertical", "Keep it vertical"],
  ["source", "Incline by 1:12"],
  ["normal", "Face the eye"],
  ["custom", "Choose an angle"],
];
el("app").innerHTML =
  `<a class="skip" href="#vp-workshop">Skip to the experiment</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./spacing.html">Spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a><a href="./optics.html" aria-current="page">Viewpoint</a><a href="./ledger.html">Building accounts</a></nav></header><main>
<section class="vp-intro"><h1>One twelfth.<br>Seen from where?</h1><div><p>Vitruvius tells the builder to incline the upper members forward by a twelfth of their height.</p><p>Keep that inclination. Move the observer. Compare the two lines he draws from the eye.</p><a href="#vp-workshop">Try the ancient prescription</a></div></section>
<section class="vp-section" id="vp-workshop" aria-labelledby="vp-title"><div class="vp-section-head"><h2 id="vp-title" tabindex="-1">A fixed lean.<br>A moving eye.</h2><p>The ratio comes from <a href="#vp-reading">III.5.13</a>. The chosen dimensions, flat face and observer are a modern experiment.</p></div><p id="vp-invalid" role="status" ${parsed.invalid ? "" : "hidden"}>Invalid or repeated settings in this link were replaced with defaults for those fields.</p>
<div class="vp-bench"><div class="vp-controls">${sliders.map(([key, label]) => `<label for="vp-${key}">${label}<output id="vp-${key}-value" for="vp-${key}"></output></label><input id="vp-${key}" type="range" min="${opticsBounds[key][0]}" max="${opticsBounds[key][1]}" step="1">`).join("")}<p class="vp-small">Metres are chosen examples. The face keeps the same edge length and rotates about its centre C.</p><fieldset><legend>Treat the face</legend>${treatments.map(([value, label]) => `<label class="vp-radio"><input type="radio" name="vp-mode" value="${value}">${label}${value === "normal" ? '<span class="vp-small">Modern comparison</span>' : ""}</label>`).join("")}</fieldset><label for="vp-angle">Custom forward angle<output id="vp-angle-value" for="vp-angle"></output></label><input id="vp-angle" type="range" min="0" max="850" step="1"><p class="vp-small" id="vp-angle-note"></p><button id="vp-find" type="button">Find a view for the 1:12 lean</button><p class="vp-small">Finds equal endpoint ray lengths in this model. Vitruvius gives no viewing distance.</p></div>
<div class="vp-board"><div class="vp-pan" tabindex="0" role="region" aria-label="Side view with equal scales; use arrow keys to pan"><div id="vp-scene"></div></div><dl class="vp-readouts"><div><dt>Upper ray E–T</dt><dd id="vp-upper"></dd></div><div><dt>Lower ray E–B</dt><dd id="vp-lower"></dd></div><div><dt>Upper minus lower</dt><dd id="vp-difference"></dd></div></dl><p class="vp-finding" id="vp-finding" aria-live="polite"></p><p class="vp-small">Ray lengths are geometric distances in chosen metres. The upper ray is solid vermilion; the lower is dashed green. Readouts are rounded.</p><div class="vp-details"><div id="vp-detail"></div><div id="vp-projection"></div></div><p id="vp-spacing"></p><p class="vp-small">Five marks divide the physical face into four equal lengths. The pinhole comparison aims at C and normalizes both rulers to the same face-on scale. It measures image spacing, not a viewer’s perception of verticality.</p></div></div>
<details class="vp-method"><summary>Inspect the geometric comparison</summary><p>Let d be the horizontal distance, H the face-centre height and e the eye height. A face rotated forward by α has upward tangent (−sin α, cos α). The direction from its centre to the eye is (−d, e−H). These are perpendicular when tan α = (H−e)/d. The source’s 1:12 slope therefore faces this chosen eye at d = 12(H−e).</p><p>Equal ray lengths to endpoints on either side of C give the same condition. This is our front-on criterion. It does not prove the author intended that distance, or predict the appearance of a whole building. The face-on reference changes its angle for each observer; the prescribed lean stays fixed.</p><p id="vp-ratio"></p></details></section>
<section class="vp-section" id="vp-reading" aria-labelledby="vp-reading-title"><div class="vp-section-head"><h2 id="vp-reading-title" tabindex="-1">Read the instruction.<br>Keep its claim in view.</h2><p>Six short passages, new English and eighteen contextual word notes. Greek companion words connect the building vocabulary; they are not a Greek original of this Latin text.</p></div><div class="vp-reading-grid"><div><label for="vp-reading-select">Choose a passage</label><select id="vp-reading-select">${opticsPassages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join("")}</select><p id="vp-reference" class="vp-small"></p><h3 id="vp-passage-title"></h3><p id="vp-latin" lang="la" class="vp-latin"></p><p id="vp-english"></p><div id="vp-words" class="vp-words" role="group" aria-label="Words in this passage"></div><div id="vp-word-note" class="vp-word-note" aria-live="polite"></div><p id="vp-reading-note"></p><div class="vp-actions"><button id="vp-prev" type="button">Previous passage</button><button id="vp-next" type="button">Next passage</button><button id="vp-find-source" type="button">Find the printed page</button></div><p class="vp-small">Krohn’s edited text, 1912. Excerpts retain the words of the selected clauses; line-end hyphens are joined. The numeral XII is capitalized here. Consult the complete page and critical apparatus.</p></div><div><label for="vp-source">Complete printed evidence</label><select id="vp-source">${opticsSourcePages.map((p, i) => `<option value="${i}">${p.key === "title" ? "Title" : `p. ${p.key}`} · ${p.label}</option>`).join("")}</select><p id="vp-source-note" class="vp-small"></p><label for="vp-zoom">Enlarge the page<output id="vp-zoom-value" for="vp-zoom">100%</output></label><input id="vp-zoom" type="range" min="100" max="250" step="25" value="100"><div class="vp-source-pan" id="vp-source-pan" tabindex="0" role="region" aria-label="Complete printed source page; use arrow keys to pan"><img id="vp-source-image" alt=""><p id="vp-source-error" hidden role="status">The page could not be loaded. Reload online or open the original volume.</p></div><div class="vp-actions"><a id="vp-original-page" target="_blank" rel="noreferrer">Original volume at this page</a><a href="./sources/optics/manifest.json">Provenance and hashes</a></div></div></div></section>
<section class="vp-section vp-object"><figure><img src="./sources/optics/met-252453-DP144130.jpg" width="3738" height="3790" alt="A marble Ionic capital, part of its fluted shaft and base, reassembled in the Metropolitan Museum; modern museum columns stand behind it." loading="lazy"><figcaption>The Met, 26.59.1. Gift of The American Society for the Excavation of Sardis, 1926. Public-domain image, CC0; unchanged.</figcaption></figure><div><h2>Where the upper<br>members would begin.</h2><p>Find the volutes: the Ionic capital sits at the top of this column. The source speaks of the members <span lang="la">supra capitula</span> — above the capitals.</p><p>This Greek column from the Temple of Artemis at Sardis dates to about 300 BCE. The display is reassembled from one or more columns; parts of the shaft are restored, and the profiled base below the torus is a copy.</p><p>The upper building is absent. This photograph identifies a capital; it supplies no measured inclination for the experiment.</p><a href="https://www.metmuseum.org/art/collection/search/252453">Inspect the museum’s object record</a></div></section>
<section class="vp-section vp-save"><div><h2>Keep the viewpoint<br>and the words.</h2><p>Save an illustrated reading with this experiment, all six passages and notes, four complete printed pages and the original museum photograph. It opens and prints offline.</p></div><div><div class="vp-actions"><button id="vp-save-book" type="button">Save illustrated reading</button><button id="vp-save-svg" type="button">Save diagram (SVG)</button><button id="vp-save-csv" type="button">Save comparisons (CSV)</button><button id="vp-share" type="button">Share this experiment</button></div><p id="vp-save-status" role="status"></p><label id="vp-share-label" for="vp-share-url" hidden>Link to these settings<input id="vp-share-url" type="url" readonly></label></div></section>
<section class="vp-section vp-limits"><h2>A prescription.<br>A chosen comparison.</h2><div><p>${OPTICS_LIMITS}</p><p>The preceding discussion in III.5.9 includes an ancient air-density explanation. The geometric experiment does not use that theory. Inclination angles here are not construction advice.</p><a href="./entasis.html">Another optical adjustment: the missing entasis diagram</a></div></section></main><footer><span>Gonia · measured ancient architecture</span><span id="vp-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;
function drawings() {
  const target = opticsPassages[state.reading]?.words[word]?.target ?? "";
  el("vp-scene").innerHTML = opticsScene(state, target);
  el("vp-detail").innerHTML = opticsDetail(state);
  el("vp-projection").innerHTML = opticsProjection(state);
}
function render() {
  const m = opticsModel(state);
  for (const [key] of sliders) {
    el<HTMLInputElement>(`vp-${key}`).value = String(state[key]);
    el(`vp-${key}-value`).textContent = `${num(state[key] / 10, 1)} m`;
  }
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="vp-mode"]'))
    radio.checked = radio.value === state.mode;
  el<HTMLInputElement>("vp-angle").value = String(state.angle);
  el<HTMLInputElement>("vp-angle").disabled = state.mode !== "custom";
  el("vp-angle-value").textContent = `${num(state.angle / 10, 1)}°`;
  el("vp-angle-note").textContent =
    `Actual forward angle: ${num(degrees(m.angle), 3)}°. ${state.mode === "custom" ? "Your chosen comparison." : "The custom slider is available only with “Choose an angle”."}`;
  el("vp-upper").textContent = `${num(m.top.ray, 4)} m`;
  el("vp-lower").textContent = `${num(m.bottom.ray, 4)} m`;
  el("vp-difference").textContent = `${num(m.difference, 5)} m`;
  el("vp-finding").textContent =
    m.relation === "equal"
      ? "The two endpoint rays have equal lengths. This face points squarely at the chosen eye."
      : m.relation === "upper-longer"
        ? "The upper ray is longer. The face’s normal points above this eye’s direction."
        : "The upper ray is shorter. The face’s normal points below this eye’s direction.";
  el("vp-spacing").textContent =
    `Upper / lower projected half-length: ${num(m.upperLowerRatio, 5)}. A face aimed squarely at the eye has ratio 1.`;
  el("vp-ratio").textContent =
    `For this ${num(m.length, 1)} m face edge, the 1:12 treatment has a vertical rise of ${num(m.sourceVerticalRise, 5)} m and a forward offset of ${num(m.sourceOffset, 5)} m. Their ratio is 1:12. At the chosen heights, equal rays occur at horizontal distance ${num(m.sourceDistance, 1)} m.`;
  el("vp-share-label").hidden = true;
  drawings();
}
function commit() {
  const query = opticsQuery(state);
  if (query !== committed) {
    history.pushState(null, "", `${location.pathname}?${query}${location.hash}`);
    committed = query;
  }
}
history.replaceState(null, "", `${location.pathname}?${committed}${location.hash}`);
for (const [key] of sliders) {
  el(`vp-${key}`).addEventListener("input", () => {
    state = { ...state, [key]: Number(el<HTMLInputElement>(`vp-${key}`).value) };
    render();
  });
  el(`vp-${key}`).addEventListener("change", commit);
}
el("vp-angle").addEventListener("input", () => {
  state = { ...state, angle: Number(el<HTMLInputElement>("vp-angle").value) };
  render();
});
el("vp-angle").addEventListener("change", commit);
for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="vp-mode"]'))
  radio.addEventListener("change", () => {
    state = { ...state, mode: radio.value as OpticsMode };
    render();
    commit();
  });
el("vp-find").addEventListener("click", () => {
  state = { ...state, mode: "source", distance: 12 * (state.height - state.eye) };
  render();
  commit();
});
function showSource(index: number) {
  const p = opticsSourcePages[index];
  if (!p) return;
  el<HTMLSelectElement>("vp-source").value = String(index);
  const img = el<HTMLImageElement>("vp-source-image");
  img.src = `${import.meta.env.BASE_URL}${p.file}`;
  img.alt = `Complete Krohn 1912 ${p.key === "title" ? "title page" : `printed page ${p.key} with critical apparatus`}; PDF page ${p.pdf}`;
  el("vp-source-note").textContent =
    `Krohn 1912 · ${p.key === "title" ? "title" : `printed p. ${p.key}`} · PDF page ${p.pdf}. ${p.label}.`;
  el<HTMLAnchorElement>("vp-original-page").href =
    `https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf#page=${p.pdf}`;
  el("vp-source-error").hidden = true;
}
function showWord() {
  const w = opticsPassages[state.reading]?.words[word];
  if (!w) return;
  for (const b of el("vp-words").querySelectorAll<HTMLButtonElement>("button"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.word) === word));
  el("vp-word-note").innerHTML =
    `<strong lang="la">${oe(w.word)}</strong> · ${oe(w.gloss)}<p>${oe(w.note)}</p>${w.greek ? `<p>Greek companion: <span lang="grc">${oe(w.greek)}</span> · <a href="${w.lexicon}">Lexicon evidence</a></p>` : ""}`;
  drawings();
}
function reading() {
  const p = opticsPassages[state.reading];
  if (!p) return;
  el<HTMLSelectElement>("vp-reading-select").value = String(state.reading);
  el("vp-reference").textContent =
    `Vitruvius ${p.ref} · Krohn p. ${p.page}, printed lines ${p.lines}`;
  el("vp-passage-title").textContent = p.title;
  el("vp-latin").textContent = p.latin;
  el("vp-english").textContent = p.english;
  el("vp-reading-note").textContent = p.note;
  el("vp-words").innerHTML = p.words
    .map(
      (w, i) =>
        `<button type="button" lang="la" data-word="${i}" aria-pressed="false">${oe(w.word)}</button>`,
    )
    .join("");
  el<HTMLButtonElement>("vp-prev").disabled = state.reading === 0;
  el<HTMLButtonElement>("vp-next").disabled = state.reading === 5;
  word = 0;
  showWord();
  showSource(opticsSourcePages.findIndex((s) => s.key === String(p.page)));
}
el("vp-words").addEventListener("click", (event) => {
  const b = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-word]");
  if (!b) return;
  word = Number(b.dataset.word);
  showWord();
});
el("vp-reading-select").addEventListener("change", () => {
  state = { ...state, reading: Number(el<HTMLSelectElement>("vp-reading-select").value) };
  reading();
  commit();
});
for (const [id, step] of [
  ["prev", -1],
  ["next", 1],
] as const)
  el(`vp-${id}`).addEventListener("click", () => {
    state = { ...state, reading: state.reading + step };
    reading();
    commit();
  });
el("vp-find-source").addEventListener("click", () => {
  showSource(
    opticsSourcePages.findIndex((p) => p.key === String(opticsPassages[state.reading]?.page)),
  );
  el("vp-source-pan").focus();
});
el("vp-source").addEventListener("change", () =>
  showSource(Number(el<HTMLSelectElement>("vp-source").value)),
);
el("vp-zoom").addEventListener("input", () => {
  const value = el<HTMLInputElement>("vp-zoom").value;
  el("vp-zoom-value").textContent = `${value}%`;
  el<HTMLImageElement>("vp-source-image").style.width = `${value}%`;
});
el("vp-source-image").addEventListener("error", () => {
  el("vp-source-error").hidden = false;
});
window.addEventListener("popstate", () => {
  state = parseOptics(location.search).state;
  committed = opticsQuery(state);
  render();
  reading();
});
el("vp-share").addEventListener("click", () => {
  commit();
  el("vp-share-label").hidden = false;
  const input = el<HTMLInputElement>("vp-share-url");
  input.value = `${location.origin}${location.pathname}?${opticsQuery(state)}#vp-workshop`;
  input.focus();
  input.select();
});
el("vp-save-svg").addEventListener("click", () =>
  saveOptics(opticsSvg(state), "gonia-viewpoint.svg", "image/svg+xml"),
);
el("vp-save-csv").addEventListener("click", () =>
  saveOptics(opticsCsv(state), "gonia-viewpoint.csv", "text/csv;charset=utf-8"),
);
el("vp-save-book").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("vp-save-book"),
    snapshot = { ...state };
  button.disabled = true;
  el("vp-save-status").textContent =
    "Checking the complete source images and preparing your reading…";
  try {
    saveOptics(
      await opticsBook(snapshot),
      "gonia-viewpoint-reading.html",
      "text/html;charset=utf-8",
    );
    el("vp-save-status").textContent = "Reading saved with the settings at the moment you clicked.";
  } catch (error) {
    el("vp-save-status").textContent =
      error instanceof Error
        ? error.message
        : "Could not prepare this reading. Reload online and try again.";
  } finally {
    button.disabled = false;
  }
});
render();
reading();
void offlineStatus(el("vp-offline"));

export type { OpticsState };

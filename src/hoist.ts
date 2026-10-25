import {
  HOIST_NAMES,
  hoistJson,
  hoistModel,
  hoistQuery,
  parseHoist,
  readHoist,
} from "./core/hoist";
import { HOIST_LIMITS, HOIST_SOURCE, hoistPassages, hoistSources } from "./hoist-content";
import { he, hn, hoistDrawing, hoistTable, hoistWindlass } from "./hoist-drawing";
import { hoistCsv, hoistReading, hoistSvg, saveHoist } from "./hoist-files";
import { offlineStatus } from "./offline";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing ${id}`);
  return e as T;
}
const parsed = parseHoist(location.search);
let state = parsed.state,
  passage = 1;
el("app").innerHTML =
  `<a class="skip" href="#hw-workshop">Skip to the hoist</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./spacing.html">Spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html" aria-current="page">Hoist</a><a href="./optics.html">Viewpoint</a></nav></header><main>
<section class="hw-intro"><h1>Where you tie the rope<br>changes the lift.</h1><div><p>Vitruvius describes a three-wheel hoist with its rope end tied to the lower block.</p><p>Keep the wheels. Move that tie to the fixed support. Find the missing upward pull.</p><a href="#hw-workshop">Follow the rope and lift the load</a></div></section>
<section id="hw-workshop" class="hw-section" aria-labelledby="hw-title"><h2 id="hw-title" tabindex="-1">Three wheels. How many upward pulls?</h2><p id="hw-invalid" class="hw-notice" role="status" ${parsed.invalid ? "" : "hidden"}>This link has incomplete, repeated or invalid settings. The default experiment is open.</p><div class="hw-workbench"><div class="hw-board"><label for="hw-diagram-zoom">Enlarge the drawing <output id="hw-diagram-zoom-value" for="hw-diagram-zoom">100%</output></label><input id="hw-diagram-zoom" type="range" min="100" max="200" step="25" value="100"><div class="hw-diagram-pan" id="hw-diagram-pan" tabindex="0" role="region" aria-label="Hoist drawing; enlarge and use arrow keys to pan"><div id="hw-drawing"></div></div><p>Each blue arrow is a rope portion pulling on the moving assembly. The tied end counts only when it moves with that assembly.</p></div><div class="hw-controls"><label for="hw-rig">Choose the wheels</label><select id="hw-rig">${Object.entries(
    HOIST_NAMES,
  )
    .map(([v, name]) => `<option value="${v}">${name}</option>`)
    .join(
      "",
    )}</select><label for="hw-anchor">Tie the end to</label><select id="hw-anchor"><option value="moving">Moving assembly · Vitruvius’s route</option><option value="fixed">Fixed support · your alteration</option></select><p id="hw-route-note" class="hw-small"></p><button type="button" id="hw-read-tie">Read where he ties it</button><label for="hw-hold">Keep the same distance of</label><select id="hw-hold"><option value="rise">Load rise</option><option value="rope">Rope wound onto the drum</option></select><label for="hw-distance"><span id="hw-distance-label">Load rise</span> <output id="hw-distance-value" for="hw-distance"></output></label><input id="hw-distance" type="range" min="0" max="2" step="0.05" value="1"><p class="hw-small">Move the slider to operate the hoist. Switching the distance choice keeps the slider’s number and applies it to the newly chosen motion.</p><label for="hw-weight">Total hanging weight</label><select id="hw-weight">${Array.from({ length: 20 }, (_, i) => `<option value="${(i + 1) * 100}">${(i + 1) * 100} N</option>`).join("")}</select><p class="hw-small">Includes the load and moving hardware. Modern illustrative forces; no ancient weight or safe capacity is inferred.</p><dl class="hw-readout"><div><dt>Supporting rope portions</dt><dd id="hw-supports"></dd></div><div><dt>Each upward tension T</dt><dd id="hw-tension"></dd></div><div><dt>Load rises</dt><dd id="hw-rise"></dd></div><div><dt>Rope winds in</dt><dd id="hw-rope"></dd></div></dl><p id="hw-balance" class="hw-finding" aria-live="polite"></p></div></div></section>
<section class="hw-section hw-windlass"><div><h2>Less hand force.<br>A longer hand path.</h2><p>The source turns the windlass with bars. Choose a longer arm and compare the hand’s path with the rope wound onto the drum.</p><label for="hw-arm">Effort arm / drum radius</label><select id="hw-arm"><option value="1">1 · arm 0.15 m</option><option value="2">2 · arm 0.30 m</option><option value="4">4 · arm 0.60 m</option></select><p class="hw-small">Chosen drum radius 0.15 m; perpendicular hand force and constant winding radius. This detail has its own scale.</p><dl class="hw-readout"><div><dt>Tangential hand force</dt><dd id="hw-hand"></dd></div><div><dt>Hand path along its circle</dt><dd id="hw-hand-path"></dd></div></dl><div id="hw-work"></div><p>The force is smaller because it acts through a greater distance. The ideal machine creates no extra work.</p></div><div id="hw-windlass"></div></section>
<section class="hw-section"><h2>Compare the same task.</h2><p id="hw-compare-note"></p><div id="hw-table" class="hw-table" tabindex="0" role="region" aria-label="Force, travel and work comparison; scroll horizontally"></div><details><summary>Inspect the rope constraint and the modern equations</summary><p>Let n be the number of supporting vertical portions, W the total hanging weight, h the rise and s the rope wound in. Every moving straight portion shortens by h; the half-circular arcs retain their length. The route therefore gives s = n h. Equal tension gives n T = W.</p><p>For the chosen windlass, hand force F at perpendicular arm L balances rope tension at drum radius R: F L = T R. The hand moves through (L/R)s. Consequently W h = T s = F × hand path. Work is in joules: one newton through one metre is one joule.</p><p>The wheel drawing is unrolled and horizontally expanded. Only its reported vertical travel is quantitative; it is not a scale restoration. White dots stay at equal material distances along the same rope, measured from the tied end; dots reaching the drum are wound in. A constant-radius drum is assumed even after multiple turns.</p><p><a href="https://openstax.org/books/college-physics-2e/pages/9-5-simple-machines">Modern mechanics background: OpenStax, Simple Machines</a>. These equations analyse the edited source route; they are not quoted numerical laws from Vitruvius.</p></details></section>
<section id="hw-reading" class="hw-section" aria-labelledby="hw-reading-title"><h2 id="hw-reading-title" tabindex="-1">Follow the words<br>that fasten the rope.</h2><p>Seven excerpts, new English and contextual Latin and Greek notes. The five complete printed pages include the title and critical apparatus.</p><div class="hw-reading-layout"><div><label for="hw-passage">Choose a passage</label><select id="hw-passage">${hoistPassages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join("")}</select><p id="hw-ref" class="hw-small"></p><h3 id="hw-passage-title"></h3><p id="hw-latin" lang="la" class="hw-latin"></p><p id="hw-english"></p><div id="hw-words" class="hw-words" role="group" aria-label="Words in this passage"></div><p id="hw-word-note" class="hw-word-note" aria-live="polite"></p><p id="hw-reading-note" class="hw-small"></p><div class="hw-actions"><button type="button" id="hw-prev">Previous passage</button><button type="button" id="hw-next">Next passage</button><button type="button" id="hw-find-source">Find it on the page</button></div><p class="hw-small">Excerpts, not complete chapters. Line-end hyphens are joined. ⟨Angle brackets⟩ retain editorial additions; … marks our omissions. Greek forms are quoted within this Latin edition. Compare the apparatus.</p></div><div><label for="hw-source">Printed evidence</label><select id="hw-source">${hoistSources.map((p, i) => `<option value="${i}">${p.key === "title" ? "Title" : `p. ${p.key}`} · ${p.title}</option>`).join("")}</select><p id="hw-source-note" class="hw-small"></p><label for="hw-zoom">Enlarge the page <output id="hw-zoom-value" for="hw-zoom">100%</output></label><input type="range" id="hw-zoom" min="100" max="250" step="25" value="100"><div class="hw-source-pan" id="hw-source-pan" tabindex="0" role="region" aria-label="Complete printed source; use arrow keys to pan"><img id="hw-source-image" alt=""><p id="hw-source-error" role="status" hidden>The page is unavailable. Reload online or follow the original volume link.</p></div><div class="hw-source-links"><a id="hw-full-source" target="_blank" rel="noreferrer">Open full page</a><a href="${HOIST_SOURCE}" target="_blank" rel="noreferrer">Original volume</a><a href="./sources/hoist/manifest.json">Provenance and hashes</a></div></div></div></section>
<section class="hw-section hw-save"><div><h2>Keep the route<br>and the reading.</h2><p>The illustrated reading embeds the selected rig, both tied-end alternatives, all seven excerpts and their notes, five full source pages, fonts and exact measurements. It opens and prints offline.</p></div><div><div class="hw-actions"><button type="button" id="hw-save-reading">Save illustrated reading</button><button type="button" id="hw-save-svg">Save diagram (SVG)</button><button type="button" id="hw-save-csv">Save measurements (CSV)</button></div><div class="hw-actions"><button type="button" id="hw-save-json">Save experiment (JSON)</button><label class="hw-file-label" for="hw-open-json">Open experiment (JSON)</label><input type="file" id="hw-open-json" accept=".json,application/json"><button type="button" id="hw-share">Share this experiment</button></div><p id="hw-save-status" role="status"></p><label id="hw-share-label" for="hw-share-url" hidden>Link to these settings<input type="url" id="hw-share-url" readonly></label></div></section>
<section class="hw-section hw-limits"><h2>The route is evidence.<br>The numbers are a model.</h2><div><p>${HOIST_LIMITS}</p><p>The three- and five-wheel routes use the lower-block tie in X.2.1. Moving that tie to the fixed support and the single-wheel control are our comparisons. The spread-out wheels, load shape and drum are explanatory diagrams. No lifting frame or stone grip is reconstructed.</p><p><a href="./transport.html">Before the lift: roll a column drum or architrave</a></p></div></section></main><footer><span>Gonia · measured ancient architecture</span><span id="hw-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;
function update() {
  const m = hoistModel(state);
  for (const key of ["rig", "anchor", "hold", "distance", "weight", "arm"] as const)
    el<HTMLInputElement>(`hw-${key}`).value = String(state[key]);
  el<HTMLSelectElement>("hw-anchor").disabled = state.rig === "single";
  const movingOption = el<HTMLSelectElement>("hw-anchor").options[0];
  if (movingOption)
    movingOption.textContent =
      state.rig === "single" ? "Load end · modern control" : "Moving assembly · Vitruvius’s route";
  el("hw-route-note").textContent =
    state.rig === "single"
      ? "Modern control: a single fixed wheel only changes the rope’s direction. Its other end is on the load."
      : state.anchor === "moving"
        ? "Source route: the tie moves with the lower block. Its tension helps lift the load."
        : "Your alteration: the same wheels, but the tie stays on the fixed support. One upward tension is lost.";
  el("hw-title").textContent =
    `${state.rig === "single" ? "One wheel" : state.rig === "three" ? "Three wheels" : "Five wheels"}. ${m.supports} upward ${m.supports === 1 ? "pull" : "pulls"}.`;
  el("hw-drawing").innerHTML = hoistDrawing(state);
  el("hw-windlass").innerHTML = hoistWindlass(state);
  el("hw-distance-label").textContent = state.hold === "rise" ? "Load rise" : "Rope wound in";
  el("hw-distance-value").textContent = `${hn(state.distance)} m`;
  for (const [key, value] of Object.entries({
    supports: String(m.supports),
    tension: `${hn(m.tension)} N`,
    rise: `${hn(m.rise, 3)} m`,
    rope: `${hn(m.rope, 3)} m`,
    hand: `${hn(m.hand)} N`,
    "hand-path": `${hn(m.handPath, 3)} m`,
  }))
    el(`hw-${key}`).textContent = value;
  el("hw-balance").textContent =
    `${m.supports} × ${hn(m.tension, 3)} N ≈ ${hn(state.weight)} N upward, balancing the weight. Displayed values are rounded.`;
  el("hw-work").innerHTML =
    `<p class="hw-work-line">Load: ${hn(state.weight)} N × ${hn(m.rise, 3)} m ≈ <strong>${hn(m.work, 3)} J</strong></p><p class="hw-work-line">Rope: ${hn(m.tension, 3)} N × ${hn(m.rope, 3)} m ≈ <strong>${hn(m.ropeWork, 3)} J</strong></p><p class="hw-work-line">Hand: ${hn(m.hand, 3)} N × ${hn(m.handPath, 3)} m ≈ <strong>${hn(m.handWork, 3)} J</strong></p>`;
  el("hw-table").innerHTML = hoistTable(state);
  el("hw-compare-note").textContent =
    state.hold === "rise"
      ? "Hold the load rise fixed: more supports reduce tension but require more rope. The work on the same weight is unchanged."
      : "Hold the rope take-up fixed: more supports reduce tension and the load rises less. This is a smaller lifting task, so its work also decreases.";
  history.replaceState(null, "", `${location.pathname}${hoistQuery(state)}${location.hash}`);
  el("hw-share-label").hidden = true;
}
for (const key of ["rig", "anchor", "hold", "distance", "weight", "arm"] as const)
  el(`hw-${key}`).addEventListener(key === "distance" ? "input" : "change", () => {
    const value = el<HTMLInputElement>(`hw-${key}`).value;
    state = {
      ...state,
      [key]: ["distance", "weight", "arm"].includes(key) ? Number(value) : value,
    };
    if (state.rig === "single") state.anchor = "moving";
    update();
  });
function showSource(index: number) {
  const p = hoistSources[index];
  if (!p) return;
  el<HTMLSelectElement>("hw-source").value = String(index);
  const url = `${import.meta.env.BASE_URL}sources/hoist/krohn-${p.key}.jpg`;
  el<HTMLImageElement>("hw-source-image").src = url;
  el<HTMLImageElement>("hw-source-image").alt =
    `Complete Krohn 1912 ${p.key === "title" ? "title page" : `printed page ${p.key} and critical apparatus`}; PDF page ${p.pdf}`;
  el<HTMLAnchorElement>("hw-full-source").href = url;
  el("hw-source-note").textContent =
    `Krohn 1912, ${p.key === "title" ? "title page" : `printed p. ${p.key}`}; PDF page ${p.pdf}. ${p.title}.`;
  el("hw-source-error").hidden = true;
  el<HTMLInputElement>("hw-zoom").value = "100";
  zoom();
  el("hw-source-pan").scrollTo(0, 0);
}
function showPassage() {
  const p = hoistPassages[passage];
  if (!p) return;
  el<HTMLSelectElement>("hw-passage").value = String(passage);
  for (const [id, text] of Object.entries({
    ref: p.ref,
    "passage-title": p.title,
    latin: p.latin,
    english: p.english,
    "reading-note": p.note,
  }))
    el(`hw-${id}`).textContent = text;
  // The Latin passage contains quoted Greek, retained in the same font with language spans.
  el("hw-latin").innerHTML = he(p.latin).replace(
    /(εὐθεῖαν|κυκλωτήν|ὑπομόχλιον)/g,
    '<span lang="grc">$1</span>',
  );
  el("hw-words").innerHTML = p.words
    .map(
      (w, i) =>
        `<button type="button" data-hw-word="${i}" aria-pressed="false" lang="${w.greek ? "grc" : "la"}">${he(w.form)}</button>`,
    )
    .join("");
  el("hw-word-note").textContent = "Choose a word or phrase to read its role here.";
  el<HTMLButtonElement>("hw-prev").disabled = passage === 0;
  el<HTMLButtonElement>("hw-next").disabled = passage === hoistPassages.length - 1;
  showSource(hoistSources.findIndex((s) => s.key === p.page));
}
el("hw-words").addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-hw-word]");
  if (!target) return;
  const word = hoistPassages[passage]?.words[Number(target.dataset.hwWord)];
  if (!word) return;
  for (const b of el("hw-words").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b === target));
  el("hw-word-note").textContent = `${word.form}: ${word.gloss}. ${word.note}`;
});
el("hw-passage").addEventListener("change", () => {
  passage = Number(el<HTMLSelectElement>("hw-passage").value);
  showPassage();
});
for (const [id, step] of [
  ["prev", -1],
  ["next", 1],
] as const)
  el(`hw-${id}`).addEventListener("click", () => {
    passage += step;
    showPassage();
  });
el("hw-read-tie").addEventListener("click", () => {
  passage = 1;
  showPassage();
  el("hw-reading").scrollIntoView();
  el("hw-reading-title").focus({ preventScroll: true });
});
el("hw-find-source").addEventListener("click", () => {
  showSource(hoistSources.findIndex((p) => p.key === hoistPassages[passage]?.page));
  el("hw-source-pan").focus();
});
el("hw-source").addEventListener("change", () =>
  showSource(Number(el<HTMLSelectElement>("hw-source").value)),
);
function zoom() {
  const value = el<HTMLInputElement>("hw-zoom").value;
  el("hw-zoom-value").textContent = `${value}%`;
  el<HTMLImageElement>("hw-source-image").style.width = `${value}%`;
}
el("hw-zoom").addEventListener("input", zoom);
el("hw-source-image").addEventListener("error", () => {
  el("hw-source-error").hidden = false;
});
el("hw-save-svg").addEventListener("click", () =>
  saveHoist(hoistSvg(state), "gonia-hoist.svg", "image/svg+xml"),
);
el("hw-save-csv").addEventListener("click", () =>
  saveHoist(hoistCsv(state), "gonia-hoist.csv", "text/csv;charset=utf-8"),
);
el("hw-save-json").addEventListener("click", () =>
  saveHoist(hoistJson(state), "gonia-hoist.json", "application/json"),
);
el("hw-open-json").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("hw-open-json"),
    file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 65536) throw new Error("Choose a hoist JSON file smaller than 64 KiB.");
    const next = readHoist(await file.text());
    state = next;
    update();
    el("hw-save-status").textContent = "Experiment opened. The six settings are restored.";
  } catch (error) {
    el("hw-save-status").textContent =
      error instanceof Error
        ? error.message
        : "Could not read this experiment; nothing has changed.";
  } finally {
    input.value = "";
  }
});
el("hw-save-reading").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("hw-save-reading"),
    snapshot = { ...state };
  button.disabled = true;
  el("hw-save-status").textContent =
    "Checking the source pages and preparing your illustrated reading…";
  try {
    const html = await hoistReading(snapshot);
    saveHoist(html, "gonia-hoist-reading.html", "text/html;charset=utf-8");
    el("hw-save-status").textContent =
      "Illustrated reading saved with the settings at the moment you clicked.";
  } catch (error) {
    el("hw-save-status").textContent =
      error instanceof Error
        ? error.message
        : "Could not prepare this reading. Reload online and try again.";
  } finally {
    button.disabled = false;
  }
});
el("hw-share").addEventListener("click", () => {
  el("hw-share-label").hidden = false;
  el<HTMLInputElement>("hw-share-url").value =
    `${location.origin}${location.pathname}${hoistQuery(state)}#hw-workshop`;
  el<HTMLInputElement>("hw-share-url").focus();
  el<HTMLInputElement>("hw-share-url").select();
});
el("hw-diagram-zoom").addEventListener("input", () => {
  const value = el<HTMLInputElement>("hw-diagram-zoom").value;
  el("hw-diagram-zoom-value").textContent = `${value}%`;
  el("hw-drawing").style.width = `${value}%`;
});
update();
showPassage();
void offlineStatus(el("hw-offline"));

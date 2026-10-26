import {
  bucketPosition,
  bucketSection,
  parseScrew,
  type ScrewState,
  screwCapacity,
  screwGeometry,
  screwInitial,
  screwPhi,
  screwQuery,
} from "./core/screw";
import { offlineStatus } from "./offline";
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
import { screwAsset, screwBlob, screwCsv, screwSave, screwStudy } from "./screw-files";

const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing workshop element ${id}`);
  return node as T;
};
let state: ScrewState,
  invalid = "";
try {
  state = parseScrew(location.search);
} catch (error) {
  state = { ...screwInitial };
  invalid = error instanceof Error ? error.message : "Invalid settings.";
}
const options = (values: readonly (readonly [string | number, string])[]) =>
  values.map(([v, label]) => `<option value="${v}">${label}</option>`).join("");
el("app").innerHTML =
  `<a class="skip" href="#sc-main">Skip to workshop</a><header class="sc-header"><a class="sc-brand" href="./">Gonia <span>measured ancient architecture</span></a><nav aria-label="Workshops"><a href="./transport.html">Stone transport</a><a href="./hoist.html">Hoists</a><a href="./optics.html">Sight lines</a><a href="#sc-reading">Latin &amp; source</a><a href="./ledger.html">Building accounts</a></nav></header><main id="sc-main"><section class="sc-intro"><p class="sc-eyebrow">Vitruvius · De architectura X.6</p><h1>Eight channels.<br>One revolution.</h1><p class="sc-deck">A strip winds around a shaft. Eight strips make eight channels. Turn the screw and follow the water they hold.</p><p>Build the geometry from the Latin dimensions, then change the pitch and slope. A modern ideal model makes the retained water visible.</p><div class="sc-jump"><a href="#sc-build">Unroll a strip ↓</a><a href="#sc-water">Follow a bucket ↓</a><a href="#sc-reading">Read the source ↓</a></div><p id="sc-link-error" role="status"></p></section>
<section id="sc-build" class="sc-section"><div class="sc-section-head"><p class="sc-eyebrow">01 / Make the spiral</p><h2>One turn follows one strip.<br>Eight starts divide the space.</h2><p>The source grid has equal intervals along and around the shaft. On its unrolled surface, one strip follows a diagonal through successive crossings.</p></div><div class="sc-build-layout"><div class="sc-controls"><label for="sc-step">Construction step</label><select id="sc-step">${screwSteps.map((v, i) => `<option value="${i}">${i + 1}. ${v.title}</option>`).join("")}</select><p id="sc-step-note"></p><div class="sc-actions"><button id="sc-step-back" type="button">Previous step</button><button id="sc-step-next" type="button">Next step</button><button id="sc-read-step" type="button">Read this instruction</button></div><label for="sc-units">Read the shaft dimensions</label><select id="sc-units"><option value="digits">Source: 16 digits per foot</option><option value="twelfths">Comparison: 12 parts per foot</option></select><p class="sc-small">III.1.8 defines the source foot. The twelve-part option tests a modern reading of the English word “inches”; it is not another ancient prescription.</p><label for="sc-starts">Number of blade starts</label><select id="sc-starts">${options(
    [
      [8, "8 · source"],
      [4, "4 · altered"],
      [2, "2 · altered"],
      [1, "1 · altered"],
    ],
  )}</select><label for="sc-lead">Pitch / shaft circumference <output id="sc-lead-out" for="sc-lead"></output></label><input id="sc-lead" type="range" min="50" max="150" step="1"><p class="sc-small">Pitch P is the axial advance of one blade in a full turn. It is not the spacing between adjacent starts.</p><button id="sc-reset" type="button">Restore the source geometry</button></div><div><div class="sc-pan" tabindex="0" role="region" aria-label="Unrolled shaft diagram; scroll horizontally on small screens"><div id="sc-net"></div></div><button id="sc-enlarge-net" type="button" class="sc-enlarge" aria-pressed="false">Enlarge diagram</button><dl class="sc-metrics"><div><dt>Inner / outer radius</dt><dd id="sc-rho"></dd></div><div><dt>One turn: P</dt><dd id="sc-pitch"></dd></div><div><dt>Adjacent starts: P/N</dt><dd id="sc-spacing"></dd></div></dl><p class="sc-small">R = outside radius. Both axes of the unrolled drawing use the same scale. Rust follows one strip; green repeats it at the other starts.</p></div></div></section>
<section id="sc-water" class="sc-section"><div class="sc-section-head"><p class="sc-eyebrow">02 / Follow a bucket</p><h2>The blade turns.<br>The bucket travels uphill.</h2><p>The casing turns with the blades. Watch one bucket’s selected section advance, while a rust line follows one material blade. A full revolution advances the bucket one pitch.</p></div><div class="sc-machine-layout"><div class="sc-controls"><label for="sc-slope">Incline the screw</label><select id="sc-slope"><option value="source">Source: rise 3, run 4, length 5</option><option value="custom">Alter the angle</option></select><label for="sc-angle">Angle above horizontal <output id="sc-angle-out" for="sc-angle"></output></label><input id="sc-angle" type="range" min="150" max="750" step="1"><p id="sc-slope-note" class="sc-small"></p><label for="sc-turn">Turn the screw <output id="sc-turn-out" for="sc-turn"></output></label><input id="sc-turn" type="range" min="0" max="360" step="1"><div class="sc-actions"><button id="sc-play" type="button">Turn once slowly</button><button id="sc-turn-back" type="button">Return to 0°</button></div><p id="sc-motion" class="sc-small" role="status"></p><p class="sc-small">The timed turn is a teaching motion, not an ancient operating speed. Rotation stops at 360°; the tracked bucket never silently jumps back.</p><dl class="sc-metrics"><div><dt>Bucket advances</dt><dd id="sc-advance"></dd></div><div><dt>Bucket rises</dt><dd id="sc-rise"></dd></div></dl></div><div><div class="sc-pan" tabindex="0" role="region" aria-label="Transparent screw diagram; scroll horizontally on small screens"><div id="sc-machine"></div></div><button id="sc-enlarge-machine" type="button" class="sc-enlarge" aria-pressed="false">Enlarge diagram</button><p class="sc-small">Transparent, zero-thickness geometric model. Blue shows only the chosen bucket’s section; the other water is omitted. No timber joints, bearings or drive mechanism are reconstructed.</p></div></div>
<div class="sc-water-layout"><div><h3>A cut through one bucket</h3><label for="sc-cut">Move from its beginning to its end <output id="sc-cut-out" for="sc-cut"></output></label><input id="sc-cut" type="range" min="0" max="1000" step="1"><div id="sc-section"></div><p id="sc-regime" class="sc-finding" aria-live="polite"></p></div><div class="sc-capacity"><h3>How much does it retain?</h3><p class="sc-big"><span id="sc-fraction"></span><span class="sc-big-unit">of a pitch-length cylinder</span></p><p>Water per complete turn: <strong id="sc-volume"></strong></p><p class="sc-small">The denominator of the percentage is the whole outside cylinder πR²P, including the solid shaft. This percentage is a volume fraction, not efficiency.</p><div class="sc-pan" tabindex="0" role="region" aria-label="Bucket area plot; scroll horizontally on small screens"><div id="sc-area"></div></div><button id="sc-enlarge-area" type="button" class="sc-enlarge" aria-pressed="false">Enlarge diagram</button><p id="sc-integral" class="sc-small"></p></div></div><div class="sc-table-pan" tabindex="0" role="region" aria-label="Comparison of water fraction and water per turn; scroll horizontally"><div id="sc-compare"></div></div><p>Compare your pitch with half and a quarter of that pitch, holding the other dimensions, slope and number of starts fixed. The water fraction can keep rising while the volume per turn falls.</p><p class="sc-small">The last two rows are calculated comparisons, including pitches outside the slider range. Every row uses its own pitch-length cylinder as the percentage denominator.</p>
<details class="sc-math"><summary>Inspect the geometry and its limits</summary><p>${SCREW_LIMITS}</p><p>The outside radius is R = 1 and length L = 16 R. Source shaft diameter = L/16; outside diameter = L/8; hence inner radius ρ = 1/2. The source construction gives pitch P = 2πρR. Its 3–4–5 triangle gives slope K = 3/4. Let λ = KP/(2πR); the source setting has λ = 3/8.</p><p>A blade at axial position x has angle θ = 2πx/P + phase. Our positive operating turn decreases phase, so a bucket advances uphill. Its water surface remains horizontal in world coordinates. In a perpendicular cut at blade angle φ, that level is w = ρ sin φ₀ − λ(φ − φ₀), where φ₀ = arccos(−λ/ρ) when λ &lt; ρ, otherwise π.</p><p>Intersect the annular channel with r sin θ ≤ w, retaining one connected bucket around the first bottom. Integrate its section area along x; multiply one bucket’s volume by N to obtain water per turn. Angular and radial clipping are integrated analytically; adaptive Simpson integration sums along the axis. The displayed error is a numerical estimate, not a rigorous bound.</p><p>When λ &lt; ρ, water touches the shaft. For ρ ≤ λ &lt; 1, only outer pockets remain. At λ ≥ 1, the ideal screw cannot retain a bucket. At source pitch these boundaries occur at 45° and about 63.435°. Geometry alone does not predict a real pump’s discharge.</p><p><a href="${SCREW_PAPER}">Modern analysis: Chris Rorres, The Turn of the Screw (2000)</a>, DOI 10.1061/(ASCE)0733-9429(2000)126:1(72). Original workshop diagrams and implementation.</p></details></section>
<section id="sc-reading" class="sc-section"><div class="sc-section-head"><p class="sc-eyebrow">03 / Read the dimensions</p><h2>Feet. Digits. Crossings.<br>The words change the machine.</h2><p>Twelve short readings, new English and contextual Latin notes. Five complete pages retain the edition title, unit definition and critical apparatus.</p></div><div class="sc-reading-layout"><div><label for="sc-passage">Choose a passage</label><select id="sc-passage">${screwPassages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join("")}</select><p id="sc-ref" class="sc-small"></p><h3 id="sc-reading-title"></h3><p id="sc-latin" class="sc-latin" lang="la"></p><p id="sc-english"></p><div id="sc-words" class="sc-actions" role="group" aria-label="Latin words in this passage"></div><p id="sc-word-note" class="sc-word-note" aria-live="polite"></p><p id="sc-reading-note" class="sc-small"></p><div class="sc-actions"><button id="sc-prev" type="button">Previous passage</button><button id="sc-next" type="button">Next passage</button><button id="sc-find-source" type="button">Find it on the page</button></div><p class="sc-small">Selected excerpts, not the complete chapter. Line-end hyphens joined; paragraph and sentence punctuation normalized. … marks our omissions. The complete pages preserve the printed text and apparatus. Greek loans are explained as vocabulary in this Latin text.</p><p class="sc-small">Compare <a href="https://lexundria.com/vitr/10.6/gw">Gwilt 1826</a> and <a href="https://lexundria.com/vitr/10.6/mg">Morgan 1914</a> in English.</p></div><div><label for="sc-source">Printed evidence</label><select id="sc-source">${screwSources.map((p) => `<option value="${p.key}">${p.key === "title" ? "Title" : `p. ${p.key}`} · ${p.title}</option>`).join("")}</select><p id="sc-source-note" class="sc-small"></p><label for="sc-zoom">Enlarge the page <output id="sc-zoom-out" for="sc-zoom">100%</output></label><input id="sc-zoom" type="range" min="100" max="250" step="25" value="100"><div class="sc-source-pan" id="sc-source-pan" tabindex="0" role="region" aria-label="Complete printed source; use arrow keys to pan"><img id="sc-source-image" alt="" hidden><p id="sc-source-status" role="status"></p></div><div class="sc-actions"><a id="sc-full-source" target="_blank" rel="noreferrer" hidden>Open verified full page</a><button id="sc-source-retry" type="button">Reload this source page</button><a href="${SCREW_SOURCE}" target="_blank" rel="noreferrer">Original volume</a><a href="./sources/screw/manifest.json">Provenance &amp; hashes</a></div></div></div></section>
<section class="sc-section sc-save"><div><p class="sc-eyebrow">04 / Keep the workshop</p><h2>A reading, a cut,<br>a paper spiral.</h2><p>The illustrated reading embeds your diagrams, all twelve Latin readings and notes, five complete source pages, fonts and measurements. Open and print it without the site.</p><p>The paper wrap prints one pitch around a chosen 30 mm core. It includes a 25 mm calibration bar. This is a surface geometry exercise; physical assembly has not been tested.</p></div><div><div class="sc-actions"><button id="sc-save-study" type="button">Save illustrated reading</button><button id="sc-save-svg" type="button">Save screw diagram (SVG)</button><button id="sc-save-wrap" type="button">Save paper wrap (SVG)</button><button id="sc-save-csv" type="button">Save measurements (CSV)</button><button id="sc-share" type="button">Share this experiment</button></div><p id="sc-save-status" role="status"></p><label for="sc-share-url" id="sc-share-label" hidden>Link to these settings<input type="url" id="sc-share-url" readonly></label></div></section><section class="sc-section sc-limits"><h2>A text, a construction,<br>a modern analysis.</h2><p>${SCREW_LIMITS}</p><p>The source proportions and the conventional pitch interpretation are distinguished from your alterations. The projected machine, spill-level calculation and paper template are explanatory models. The manuscript variants and Krohn’s editorial decisions remain visible on the full pages.</p><p><a href="./hoist.html">Another machine in Book X: trace the hoist’s tied rope</a></p></section></main><footer class="sc-footer"><span>Gonia · measured ancient architecture</span><span id="sc-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;
el("sc-link-error").textContent = invalid
  ? `This experiment link was not applied: ${invalid} Showing source settings.`
  : "";

let frame = 0,
  playing = false;
function updateMotion() {
  const g = screwGeometry(state);
  el("sc-machine").innerHTML = screwMachine(state);
  el<HTMLInputElement>("sc-turn").value = String(state.turn);
  el("sc-turn-out").textContent = `${sn(state.turn, 0)}°`;
  el("sc-advance").textContent = `${sn((g.pitch * state.turn) / 360)} R`;
  el("sc-rise").textContent = `${sn(((g.pitch * state.turn) / 360) * g.sin)} R`;
}
function update() {
  const g = screwGeometry(state),
    c = screwCapacity(g),
    step = screwSteps[state.step];
  for (const key of ["step", "units", "starts", "lead", "angle", "cut"] as const)
    el<HTMLInputElement>(`sc-${key}`).value = String(state[key]);
  el<HTMLSelectElement>("sc-slope").value = state.sourceSlope ? "source" : "custom";
  el<HTMLInputElement>("sc-angle").disabled = state.sourceSlope;
  el("sc-angle-out").textContent = `${sn((g.angle * 180) / Math.PI, 2)}°`;
  el("sc-lead-out").textContent = `${state.lead}%`;
  el("sc-cut-out").textContent = `${sn(state.cut / 10, 1)}%`;
  el("sc-step-note").textContent = step?.note ?? "";
  el<HTMLButtonElement>("sc-step-back").disabled = state.step === 0;
  el<HTMLButtonElement>("sc-step-next").disabled = state.step === 5;
  el("sc-net").innerHTML = screwNet(state);
  el("sc-rho").textContent = sn(g.inner);
  el("sc-pitch").textContent = `${sn(g.pitch)} R`;
  el("sc-spacing").textContent = `${sn(g.spacing)} R`;
  el("sc-slope-note").textContent = state.sourceSlope
    ? "Source triangle: rise 3/5 and run 4/5 of the shaft length. Slope K = 3/4."
    : "Your altered angle. Restore the source triangle to return to about 36.87°.";
  el("sc-section").innerHTML = screwSection(state);
  el("sc-area").innerHTML = screwAreaPlot(state);
  el("sc-compare").innerHTML = screwComparison(state);
  el("sc-fraction").textContent = `${sn(c.fraction * 100, 2)}%`;
  el("sc-volume").textContent = `${sn(c.perTurn, 5)} R³`;
  el("sc-regime").textContent =
    c.bucket.regime === "none"
      ? "No retained bucket: this pitch and slope have λ ≥ 1. The source pages remain available below."
      : c.bucket.regime === "shaft"
        ? "Water touches the shaft at the spill point. The dashed line is the water surface in this cut."
        : "Only an outer pocket remains. Its water does not reach the shaft. The dashed line is the water surface in this cut.";
  el("sc-integral").textContent = c.converged
    ? `Integration converged; estimated error in the fraction ${c.error.toExponential(1)}. Chosen cut: ${sn(bucketSection(c.bucket, screwPhi(state, c.bucket)), 5)} R²; axial position ${sn(bucketPosition(g, screwPhi(state, c.bucket)))} R.`
    : "Integration did not reach its tolerance; regard the displayed volume as unresolved.";
  el("sc-share-label").hidden = true;
  updateMotion();
}
function remember() {
  history.pushState(null, "", `${location.pathname}${screwQuery(state)}${location.hash}`);
}
function stopMotion(commit = false) {
  if (!playing) return;
  playing = false;
  cancelAnimationFrame(frame);
  el("sc-play").textContent = "Turn once slowly";
  el("sc-motion").textContent =
    state.turn >= 360
      ? "Full turn complete. The bucket has advanced one pitch."
      : `Paused at ${sn(state.turn, 0)}°.`;
  if (commit) remember();
}
function change(patch: Partial<ScrewState>, commit = true) {
  stopMotion();
  state = { ...state, ...patch };
  update();
  if (commit) remember();
}
for (const key of ["step", "units", "starts"] as const)
  el(`sc-${key}`).addEventListener("change", () =>
    change({
      [key]:
        key === "units"
          ? el<HTMLInputElement>(`sc-${key}`).value
          : Number(el<HTMLInputElement>(`sc-${key}`).value),
    }),
  );
for (const key of ["lead", "angle", "turn", "cut"] as const) {
  el(`sc-${key}`).addEventListener("input", () => {
    stopMotion();
    state = { ...state, [key]: Number(el<HTMLInputElement>(`sc-${key}`).value) };
    if (key === "turn") updateMotion();
    else update();
  });
  el(`sc-${key}`).addEventListener("change", remember);
}
el("sc-slope").addEventListener("change", () =>
  change({ sourceSlope: el<HTMLSelectElement>("sc-slope").value === "source" }),
);
el("sc-step-back").addEventListener("click", () => change({ step: Math.max(0, state.step - 1) }));
el("sc-step-next").addEventListener("click", () => change({ step: Math.min(5, state.step + 1) }));
el("sc-reset").addEventListener("click", () => {
  change({ ...screwInitial, passage: state.passage, page: state.page });
  el("sc-motion").textContent = "Source geometry restored.";
});
el("sc-turn-back").addEventListener("click", () => {
  change({ turn: 0 });
  el("sc-motion").textContent = "Returned to the first bucket position.";
});
el("sc-play").addEventListener("click", () => {
  if (playing) {
    stopMotion(true);
    return;
  }
  if (state.turn >= 360) {
    el("sc-motion").textContent = "Return to 0° before starting another tracked turn.";
    return;
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    change({ turn: 360 });
    el("sc-motion").textContent =
      "Full turn applied without animation, following your reduced motion preference.";
    return;
  }
  playing = true;
  el("sc-play").textContent = "Pause turn";
  el("sc-motion").textContent = "Turning one tracked bucket uphill…";
  const start = performance.now(),
    initial = state.turn;
  const tick = (now: number) => {
    if (!playing) return;
    state.turn = Math.min(360, Math.round(initial + ((now - start) * 30) / 1000));
    updateMotion();
    if (state.turn >= 360) stopMotion(true);
    else frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMotion(true);
});

let sourceVersion = 0,
  sourceUrl = "";
async function showSource() {
  const selected = screwSources.find((p) => p.key === state.page);
  if (!selected) return;
  const version = ++sourceVersion;
  el<HTMLSelectElement>("sc-source").value = selected.key;
  el("sc-source-note").textContent =
    `Krohn 1912 · ${selected.key === "title" ? "title" : `printed p. ${selected.key}`} · PDF page ${selected.pdf}. ${selected.title}.`;
  const img = el<HTMLImageElement>("sc-source-image");
  img.hidden = true;
  img.removeAttribute("src");
  el("sc-full-source").hidden = true;
  el("sc-source-status").textContent = "Downloading and checking the complete source page…";
  if (sourceUrl) {
    URL.revokeObjectURL(sourceUrl);
    sourceUrl = "";
  }
  try {
    const bytes = await screwAsset(`sources/screw/krohn-${selected.key}.jpg`);
    if (version !== sourceVersion) return;
    sourceUrl = URL.createObjectURL(screwBlob(bytes, "image/jpeg"));
    img.src = sourceUrl;
    img.alt = `Complete Krohn 1912 ${selected.key === "title" ? "title page" : `printed page ${selected.key}, including critical apparatus`}; PDF page ${selected.pdf}.`;
    await img.decode();
    if (version !== sourceVersion) return;
    img.hidden = false;
    el("sc-source-status").textContent = "Full page matches this edition’s SHA-256 identity.";
    el<HTMLAnchorElement>("sc-full-source").href = sourceUrl;
    el("sc-full-source").hidden = false;
    el("sc-source-pan").scrollTo(0, 0);
  } catch (error) {
    if (version !== sourceVersion) return;
    img.hidden = true;
    el("sc-source-status").textContent =
      `Source unavailable: ${error instanceof Error ? error.message : "Download failed."} Retry online or open the original volume.`;
  }
}
function showReading() {
  const p = screwPassages[state.passage];
  if (!p) return;
  el<HTMLSelectElement>("sc-passage").value = String(state.passage);
  for (const [key, value] of Object.entries({
    ref: p.ref,
    "reading-title": p.title,
    latin: p.latin,
    english: p.english,
    "reading-note": p.note,
  }))
    el(`sc-${key}`).textContent = value;
  el("sc-words").replaceChildren(
    ...p.words.map(([word, note], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.lang = "la";
      button.textContent = word;
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        for (const b of el("sc-words").querySelectorAll("button"))
          b.setAttribute("aria-pressed", String(b === button));
        el("sc-word-note").textContent = note;
      });
      return button;
    }),
  );
  el("sc-word-note").textContent = p.words[0]?.[1] ?? "";
  el<HTMLButtonElement>("sc-prev").disabled = state.passage === 0;
  el<HTMLButtonElement>("sc-next").disabled = state.passage === screwPassages.length - 1;
}
function passage(value: number) {
  stopMotion();
  state.passage = value;
  showReading();
  remember();
}
el("sc-passage").addEventListener("change", () =>
  passage(Number(el<HTMLSelectElement>("sc-passage").value)),
);
el("sc-prev").addEventListener("click", () => passage(Math.max(0, state.passage - 1)));
el("sc-next").addEventListener("click", () =>
  passage(Math.min(screwPassages.length - 1, state.passage + 1)),
);
el("sc-read-step").addEventListener("click", () => {
  passage(screwSteps[state.step]?.passage ?? 0);
  location.hash = "sc-reading";
  el("sc-reading-title").tabIndex = -1;
  el("sc-reading-title").focus();
});
el("sc-find-source").addEventListener("click", () => {
  state.page = screwPassages[state.passage]?.page ?? "237";
  void showSource();
  remember();
});
el("sc-source").addEventListener("change", () => {
  state.page = el<HTMLSelectElement>("sc-source").value;
  void showSource();
  remember();
});
el("sc-source-retry").addEventListener("click", () => void showSource());
el("sc-zoom").addEventListener("input", () => {
  const zoom = el<HTMLInputElement>("sc-zoom").value;
  el("sc-zoom-out").textContent = `${zoom}%`;
  el("sc-source-image").style.width = `${zoom}%`;
});
window.addEventListener("popstate", () => {
  stopMotion();
  try {
    state = parseScrew(location.search);
    update();
    showReading();
    void showSource();
  } catch {
    el("sc-link-error").textContent =
      "The history link has invalid settings; the current experiment is retained.";
  }
});
el("sc-share").addEventListener("click", async () => {
  stopMotion(true);
  const url = `${location.origin}${location.pathname}${screwQuery(state)}${location.hash}`;
  el<HTMLInputElement>("sc-share-url").value = url;
  el("sc-share-label").hidden = false;
  try {
    await navigator.clipboard.writeText(url);
    el("sc-save-status").textContent = "Experiment link copied.";
  } catch {
    el("sc-save-status").textContent = "Copy the experiment link from the field.";
    el<HTMLInputElement>("sc-share-url").select();
  }
});
for (const [id, name, type, data] of [
  ["svg", "screw-diagram.svg", "image/svg+xml", () => screwMachine(state)],
  ["wrap", "screw-wrap.svg", "image/svg+xml", () => screwNet(state, true)],
  ["csv", "screw-measurements.csv", "text/csv", () => screwCsv(state)],
] as const)
  el(`sc-save-${id}`).addEventListener("click", () => {
    stopMotion(true);
    screwSave(data(), name, type);
    el("sc-save-status").textContent = `${name} saved from the current settings.`;
  });
el("sc-save-study").addEventListener("click", async () => {
  stopMotion(true);
  const snapshot = { ...state },
    button = el<HTMLButtonElement>("sc-save-study");
  button.disabled = true;
  el("sc-save-status").textContent =
    "Checking all source pages, fonts and notices before assembling your reading…";
  try {
    const html = await screwStudy(snapshot);
    screwSave(html, "screw-illustrated-reading.html", "text/html");
    el("sc-save-status").textContent =
      "Illustrated reading saved. Its source pages, fonts, measurements and paper wrap are embedded; it opens without the site.";
  } catch (error) {
    el("sc-save-status").textContent =
      `Reading was not saved: ${error instanceof Error ? error.message : "A required source failed."} Retry online; no incomplete reading was substituted.`;
  } finally {
    button.disabled = false;
  }
});
for (const key of ["net", "machine", "area"])
  el(`sc-enlarge-${key}`).addEventListener("click", () => {
    const button = el(`sc-enlarge-${key}`),
      large = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(large));
    button.textContent = large ? "Fit diagram to width" : "Enlarge diagram";
    const diagram = el(`sc-${key}`);
    diagram.style.minWidth = large
      ? `${Math.max(900, (diagram.parentElement?.clientWidth ?? 0) * 2)}px`
      : "0";
  });
update();
showReading();
void showSource();
void offlineStatus(el("sc-offline"));

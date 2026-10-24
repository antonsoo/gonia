import {
  normalizeTheatre,
  parseTheatre,
  THEATRE_DEFAULT,
  THEATRE_PARTS,
  type TheatreArc,
  type TheatreKind,
  type TheatreState,
  theatreModel,
  theatreQuery,
} from "./core/theatre";
import { offlineStatus } from "./offline";
import {
  THEATRE_LIMITS,
  theatreParts,
  theatrePassages,
  theatreSources,
  theatreSteps,
} from "./theatre-content";
import {
  theatreEscape as esc,
  theatreNumber as n,
  theatreDrawing,
  theatreWidthDrawing,
} from "./theatre-drawing";
import { saveTheatre, theatreCsv, theatreReading, theatreSvg } from "./theatre-files";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
}
let parsed = parseTheatre(location.search),
  state = parsed.state,
  displayedSource = -1;
get("app").innerHTML =
  `<a class="skip" href="#th-workshop">Skip to the theatre plan</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./spacing.html">Spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html" aria-current="page">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a></nav></header><main>
<section class="th-intro"><div><p class="th-kicker">Drawing room VII / Vitruvius, Book V</p><h1>Twelve points.<br>Two theatres.</h1></div><div class="th-opening"><p>Four triangles give the Roman theatre its stage. Three squares give the Greek theatre a different one.</p><p>Both start with twelve points on a circle. Follow the instructions and discover why a larger orchestra can accompany a shallower stage.</p><a href="#th-workshop">Put the compass to work ↓</a></div></section>
<section id="th-workshop" aria-labelledby="th-title"><div class="th-section-heading"><div><p class="th-kicker">01 / Construct the difference</p><h2 id="th-title" tabindex="-1">The same circle.<br>A different use of space.</h2></div><p>A geometric reading of two prescriptions. The metre scale is chosen; neither plan is a survey of a particular building.</p></div><p id="th-adjusted" class="th-notice" role="status" hidden>Some shared settings were outside this experiment’s range and have been adjusted.</p>
<div class="th-workbench"><div class="th-board"><div class="th-board-head"><span id="th-board-label">Greek scheme</span><a class="th-mobile-link" href="#th-controls">Change the plan ↓</a><span>Plan / looking down</span></div><div id="th-plan" class="th-wide"></div><div id="th-plan-portrait" class="th-narrow"></div><div class="th-legend"><span><i class="th-key-front"></i>Stage front</span><span><i class="th-key-scene"></i>Scene behind it</span><span><i class="th-key-arc"></i>Extra width from moved centres</span></div><p class="th-board-note">The drawing rescales to fit. Both axes have the same scale. The outer seating extent, row guides and stage side edges are illustrative.</p></div>
<aside id="th-controls" class="th-controls" aria-label="Construction controls"><fieldset class="th-kind"><legend>Follow a prescription</legend><button type="button" id="th-greek" aria-pressed="true">Greek <span>Three squares</span></button><button type="button" id="th-roman" aria-pressed="false">Roman <span>Four triangles</span></button></fieldset><label for="th-diameter">Initial circle diameter <span>Chosen modern metres</span></label><input type="number" id="th-diameter" min="12" max="36" step="1" inputmode="numeric" aria-describedby="th-input-note"><p id="th-input-note" class="th-small">12–36 m, whole metres. This is not an ancient foot conversion.</p><fieldset class="th-part-controls"><legend>Inspect a part</legend>${THEATRE_PARTS.map((part) => `<button type="button" data-th-part="${part}" aria-pressed="false">${theatreParts[part].title}</button>`).join("")}</fieldset><div class="th-part-note" aria-live="polite"><h3 id="th-part-title"></h3><p id="th-part-greek" lang="grc"></p><p id="th-part-latin" lang="la"></p><p id="th-part-note"></p><a id="th-dictionary">Greek dictionary headword ↗</a></div><a class="th-mobile-link" href="#th-board-label">Inspect the changed plan ↑</a></aside></div>
<div class="th-construction"><div class="th-steps" aria-label="Construction stages">${["Circle", "Polygons", "Stage lines", "Orchestra", "Stair guides"].map((label, index) => `<button type="button" data-th-step="${index}" aria-pressed="false"><span>0${index + 1}</span>${label}</button>`).join("")}</div><div class="th-command"><div><p class="th-kicker" id="th-step-count"></p><h3 id="th-step-title"></h3></div><div><p id="th-step-note"></p><button type="button" id="th-read-command" class="th-text-button">Read the Latin instruction ↓</button></div></div><div class="th-tracing"><div><label for="th-polygon">Trace one polygon</label><select id="th-polygon"><option value="0">All construction polygons</option></select></div><div><label for="th-vertex">Inspect a construction point <output id="th-vertex-value" for="th-vertex"></output></label><input type="range" id="th-vertex" min="0" max="11" step="1"><p id="th-vertex-note" class="th-small" aria-live="polite"></p></div></div></div>
<section id="th-extension" class="th-extension" aria-labelledby="th-extension-title"><div><p class="th-kicker">Detail A / The easy-to-miss instruction</p><h2 id="th-extension-title">Move the centre.<br>Keep the opening wider.</h2><p>The Greek orchestra does not merely continue the original circle. Each end of its diameter becomes a compass centre for the opposite extension. The new compass radius is <strong>2R</strong>.</p><fieldset class="th-arc-controls"><legend>Compare the lower boundary</legend><button type="button" id="th-three" aria-pressed="true">Follow the three centres</button><button type="button" id="th-single" aria-pressed="false">Try a single-circle shortcut</button></fieldset><p id="th-arc-note" class="th-small" aria-live="polite"></p></div><div class="th-cross-section"><label for="th-probe">Move the measured cut <output id="th-probe-value" for="th-probe"></output></label><input type="range" id="th-probe" min="0" max="100" step="1"><div class="th-range-ends"><span>At the diameter</span><span>At the stage</span></div><div id="th-width-figure"></div><p id="th-width-note"></p><p id="th-area-note" class="th-small"></p><a href="#th-board-label" class="th-mobile-link">Find this cut on the plan ↑</a></div></section>
<div class="th-comparison"><div><p class="th-kicker">02 / Compare what the rules produce</p><h2>Shallower in plan.<br>Higher in the text.</h2><p>At the same starting diameter, the Greek scheme has a shallower platform and more orchestra space. The height instruction is separate: a plan cannot show it.</p></div><div class="th-table-scroll" tabindex="0" role="region" aria-label="Comparison of both prescribed schemes"><table><caption id="th-table-caption"></caption><thead><tr><th scope="col">Dimension</th><th scope="col">Roman</th><th scope="col">Greek</th></tr></thead><tbody><tr><th scope="row">Stage depth</th><td id="th-roman-depth"></td><td id="th-greek-depth"></td></tr><tr><th scope="row">Orchestra area</th><td id="th-roman-area"></td><td id="th-greek-area"></td></tr><tr><th scope="row">Platform height<br><span class="th-small">Source’s feet</span></th><td>No more than 5</td><td>10–12</td></tr></tbody></table><p class="th-small">Greek values use the prescribed three centres. Areas describe constructed outlines before seats, stairs, altars or passages. Metres and feet are kept separate.</p></div></div>
<div class="th-save"><div><h3>Keep the construction</h3><p>Save your view, the comparison, ten readings and all seven source images in one offline file.</p></div><div><div class="th-save-buttons"><button type="button" id="th-save-reading">Save illustrated reading</button><button type="button" id="th-save-svg">Save diagram (SVG)</button><button type="button" id="th-save-csv">Save coordinates (CSV)</button><button type="button" id="th-share">Share this view</button></div><p id="th-action-status" role="status"></p><label id="th-share-label" for="th-share-url" hidden>Link to these settings<input id="th-share-url" readonly type="url"></label></div></div></section>
<section id="th-reading" class="th-reading" aria-labelledby="th-reading-title"><div class="th-section-heading"><div><p class="th-kicker">03 / Read the instruction</p><h2 id="th-reading-title" tabindex="-1">The line on the page<br>becomes a line in the plan.</h2></div><p>Vitruvius writes in Latin and borrows Greek architectural words. Read a selected passage with a new English translation, then inspect the printed edition.</p></div><label for="th-passage">Choose a passage</label><select id="th-passage">${theatrePassages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join("")}</select><article id="th-reading-article"><p class="th-kicker" id="th-reference"></p><h3 id="th-passage-title"></h3><div class="th-languages"><div><p class="th-language-label">LATIN / KROHN, 1912</p><p id="th-latin" lang="la"></p></div><div><p class="th-language-label">ENGLISH / NEW TRANSLATION</p><p id="th-english"></p></div></div><details id="th-grammar"><summary><span id="th-word" lang="la"></span> <span id="th-gloss"></span></summary><p id="th-grammar-note"></p></details><div class="th-reading-actions"><button type="button" id="th-reading-prev">Previous passage</button><button type="button" id="th-reading-next">Next passage</button><button type="button" id="th-show-source">Inspect its printed page ↓</button></div></article><p class="th-small">These are selected excerpts, not the whole chapters. Angle brackets preserve editorial supplements. Line-end hyphens are joined, numeral case is normalized, and line numbers and apparatus are omitted in the reading. The complete scanned pages retain them.</p></section>
<section class="th-questions" aria-label="Three things to work out"><p class="th-kicker">Before you leave the drawing</p><div><details><summary>Why not twelve lower stairways?</summary><p>Switch to Roman and inspect all twelve points. Seven lie around the seating semicircle, including its two ends. The other five concern the scene. The instruction divides their jobs; it does not turn each point into a stairway.</p></details><details><summary>Does the one-circle shortcut change the stage depth?</summary><p>No. It keeps the two Greek stage lines and changes only the orchestra’s lower boundary. Move the cut from the diameter toward the stage: the widths start equal and then separate.</p></details><details><summary>Can these rules prove how a ruined theatre was built?</summary><p>No. They construct a textual scheme. A real building needs archaeological measurements and an account of its phases. Vitruvius himself says that site and use can require changes in proportion; read the last passage.</p></details></div></section>
<section id="th-evidence" class="th-evidence" aria-labelledby="th-evidence-title"><div class="th-section-heading"><div><p class="th-kicker">04 / Inspect the evidence</p><h2 id="th-evidence-title" tabindex="-1">An ancient instruction.<br>Later interpretations.</h2></div><p>The Latin pages are from Krohn’s 1912 edition. Leake’s 1824 and Morgan’s 1914 diagrams interpret the text; neither is an ancient surviving plan or a measured archaeological survey.</p></div><div class="th-source-layout"><div class="th-source-controls"><label for="th-source">Choose the evidence</label><select id="th-source">${theatreSources.map((p, i) => `<option value="${i}">${p.label}</option>`).join("")}</select><h3 id="th-source-title"></h3><p id="th-source-note"></p><label for="th-source-zoom">Image enlargement <output id="th-source-zoom-value">100%</output></label><input type="range" id="th-source-zoom" min="100" max="250" step="25" value="100"><button type="button" id="th-find-passage">Find the passage</button><p><a id="th-full-image" target="_blank" rel="noreferrer">Open full image ↗</a></p><p><a id="th-source-original" target="_blank" rel="noreferrer">Source volume ↗</a></p><p class="th-small">Public-domain text and historical diagrams. All seven images are included in the offline edition and saved reading. <a href="./sources/theatre/manifest.json">Provenance and image hashes</a>.</p></div><div id="th-source-pan" class="th-source-pan" tabindex="0" role="region" aria-label="Source image; scroll or use arrow keys to pan"><img id="th-source-image" alt=""><p id="th-source-error" role="status" hidden>The source image could not be loaded. Reconnect and reload, or follow the source volume link.</p></div></div></section>
<section class="th-limits"><h2>The scheme is<br>not the whole building.</h2><div><p>${THEATRE_LIMITS}</p><p>The names “Greek” and “Roman” here identify Vitruvius’s two prescriptions. They do not classify every building or period of ancient performance.</p><details><summary>Inspect the modern geometry</summary><p>With the initial centre at O = (0, 0), let R be the radius and positive y face the seating. The Roman stage lies between y = 0 and y = −R/2. The Greek stage lies between y = −R/√2 and y = −R.</p><p>Below y = 0, the Greek left boundary is x = R − √(4R² − y²), centred at (R, 0); the right is its reflection. The cross-section therefore measures 2(√(4R² − y²) − R). The one-circle shortcut measures 2√(R² − y²).</p><p>The areas are modern integrations of those widths. They are not ancient quoted calculations. The displayed values are rounded; the CSV retains full floating-point coordinates.</p></details><p><a href="./echea.html">Next: place and hear the theatre’s sounding vessels →</a></p></div></section></main><footer><span>Gonia · measured ancient architecture</span><span id="th-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;

function update(patch: Partial<TheatreState>, mode: "push" | "replace" = "push") {
  state = normalizeTheatre({ ...state, ...patch });
  parsed.adjusted = false;
  history[mode === "push" ? "pushState" : "replaceState"](
    null,
    "",
    `${location.pathname}${theatreQuery(state)}${location.hash}`,
  );
  render();
}
function render() {
  const m = theatreModel(state),
    part = theatreParts[state.part],
    step = theatreSteps[state.kind][state.step],
    passage = theatrePassages[state.reading];
  if (!step || !passage) throw new Error("The selected reading is unavailable.");
  get("th-adjusted").hidden = !parsed.adjusted;
  get("th-plan").innerHTML = theatreDrawing(state, false, "theatre-wide");
  get("th-plan-portrait").innerHTML = theatreDrawing(state, true, "theatre-narrow");
  get("th-board-label").textContent =
    `${state.kind === "greek" ? "Greek" : "Roman"} scheme${state.kind === "greek" && state.arc === "single" ? " · altered boundary" : ""}`;
  for (const kind of ["greek", "roman"])
    get(`th-${kind}`).setAttribute("aria-pressed", String(state.kind === kind));
  get<HTMLInputElement>("th-diameter").value = String(state.diameter);
  get("th-diameter").removeAttribute("aria-invalid");
  get("th-input-note").textContent =
    "12–36 m, whole metres. This is not an ancient foot conversion.";
  for (const part of THEATRE_PARTS)
    document
      .querySelector(`[data-th-part="${part}"]`)
      ?.setAttribute("aria-pressed", String(state.part === part));
  for (const field of ["title", "greek", "latin", "note"] as const)
    get(`th-part-${field}`).textContent = part[field];
  get<HTMLAnchorElement>("th-dictionary").href =
    `https://logeion.uchicago.edu/${encodeURIComponent(part.headword)}`;
  document.querySelectorAll<HTMLElement>("[data-th-step]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.thStep) === state.step));
  });
  get("th-step-count").textContent = `Step ${state.step + 1} of 5`;
  get("th-step-title").textContent = step.title;
  get("th-step-note").textContent = step.note;
  const selector = get<HTMLSelectElement>("th-polygon");
  const count = state.kind === "greek" ? 3 : 4;
  if (selector.options.length !== count + 1)
    selector.innerHTML = `<option value="0">All construction polygons</option>${Array.from({ length: count }, (_, i) => `<option value="${i + 1}">${state.kind === "greek" ? "Square" : "Triangle"} ${i + 1}</option>`).join("")}`;
  selector.value = String(state.polygon);
  selector.disabled = state.step < 1;
  get<HTMLInputElement>("th-vertex").value = String(state.vertex);
  get<HTMLInputElement>("th-vertex").disabled = state.step < 1;
  get("th-vertex-value").textContent = `${state.vertex + 1} / 12`;
  const v = m.vertices[state.vertex];
  if (v) {
    const roles = {
      stair: "A direction for the lower stairs.",
      chord:
        "A square corner on the stage-front line. The three-centre boundary reaches farther sideways.",
      royal: "A guide for the royal door in the scene.",
      guest: "A guide for a guest-chamber door in the scene.",
      wing: "A guide for a side approach to the scene.",
      unused: "Below the stage-front line; not one of the drawn lower stair directions.",
    };
    get("th-vertex-note").textContent =
      `Point ${v.index + 1} · ${v.degrees}°. ${roles[v.role]} Position (${n(v.x)}, ${n(v.y)}) m.`;
  }
  get("th-extension").hidden = state.kind !== "greek";
  for (const arc of ["three", "single"])
    get(`th-${arc}`).setAttribute("aria-pressed", String(state.arc === arc));
  get("th-arc-note").textContent =
    state.arc === "three"
      ? "The rust-colored strips show what continuing the original circle would miss."
      : "Your alteration: one circle replaces the two lower arcs. The stage lines stay fixed. The dashed outline shows the three-centre construction.";
  get<HTMLInputElement>("th-probe").value = String(state.probe);
  get("th-probe-value").textContent = `${state.probe}% toward the stage`;
  get("th-width-figure").innerHTML = theatreWidthDrawing(state);
  const trueWidth = 2 * (Math.sqrt(4 * m.radius * m.radius - m.probeY * m.probeY) - m.radius);
  get("th-width-note").textContent =
    `At y = ${n(m.probeY)} m, the three-centre opening is ${n(trueWidth - m.singleWidth)} m wider than the single-circle shortcut.`;
  get("th-area-note").textContent =
    `Across the whole lower extension, the moved centres add ${n(m.prescribedArea - m.singleArea)} m² to the one-circle outline. This is constructed area, not extra seating capacity.`;
  const roman = theatreModel({ ...state, kind: "roman" }),
    greek = theatreModel({ ...state, kind: "greek", arc: "three" });
  get("th-table-caption").textContent =
    `Both prescribed schemes · initial diameter ${state.diameter} m`;
  for (const [kind, model] of [
    ["roman", roman],
    ["greek", greek],
  ] as const) {
    get(`th-${kind}-depth`).textContent = `${n(model.stageDepth)} m`;
    get(`th-${kind}-area`).textContent = `${n(model.area)} m²`;
  }
  get<HTMLSelectElement>("th-passage").value = String(state.reading);
  get("th-reference").textContent = passage.ref;
  get("th-passage-title").textContent = passage.title;
  get("th-latin").textContent = passage.latin;
  get("th-english").textContent = passage.english;
  get("th-word").textContent = passage.word;
  get("th-gloss").textContent = ` · ${passage.gloss}`;
  get("th-grammar-note").textContent = passage.grammar;
  get<HTMLButtonElement>("th-reading-prev").disabled = state.reading === 0;
  get<HTMLButtonElement>("th-reading-next").disabled = state.reading === theatrePassages.length - 1;
  get<HTMLSelectElement>("th-source").value = String(state.source);
  if (displayedSource !== state.source) {
    const source = theatreSources[state.source];
    if (!source) throw new Error("Missing source page.");
    displayedSource = state.source;
    const image = get<HTMLImageElement>("th-source-image");
    get("th-source-title").textContent = source.title;
    get("th-source-note").textContent = source.note;
    get("th-source-error").hidden = true;
    image.alt = source.title;
    image.src = `${import.meta.env.BASE_URL}sources/theatre/${source.file}`;
    get<HTMLAnchorElement>("th-full-image").href = image.src;
    get<HTMLAnchorElement>("th-source-original").href = source.url;
    get<HTMLInputElement>("th-source-zoom").value = "100";
    image.style.width = "100%";
    get("th-source-zoom-value").textContent = "100%";
    get("th-source-pan").scrollTo(0, 0);
  }
}
for (const kind of ["greek", "roman"] as TheatreKind[])
  get(`th-${kind}`).addEventListener("click", () => {
    const step = theatreSteps[kind][state.step];
    update({ kind, polygon: 0, reading: step?.passage ?? 0 });
  });
get<HTMLInputElement>("th-diameter").addEventListener("input", () => {
  const input = get<HTMLInputElement>("th-diameter");
  if (!input.value || !input.checkValidity()) {
    input.setAttribute("aria-invalid", "true");
    get("th-input-note").textContent =
      "Enter a whole diameter from 12 to 36 m. The plan keeps its last valid size.";
    return;
  }
  input.removeAttribute("aria-invalid");
  get("th-input-note").textContent =
    "12–36 m, whole metres. This is not an ancient foot conversion.";
  update({ diameter: input.valueAsNumber }, "replace");
});
document.querySelectorAll<HTMLElement>("[data-th-part]").forEach((b) => {
  b.addEventListener("click", () => {
    const part = b.dataset.thPart;
    if (THEATRE_PARTS.includes(part as TheatreState["part"]))
      update({ part: part as TheatreState["part"], step: 4 });
  });
});
document.querySelectorAll<HTMLElement>("[data-th-step]").forEach((b) => {
  b.addEventListener("click", () => {
    const step = Number(b.dataset.thStep);
    update({ step, reading: theatreSteps[state.kind][step]?.passage ?? 0 });
  });
});
get("th-polygon").addEventListener("change", () =>
  update({ polygon: Number(get<HTMLSelectElement>("th-polygon").value) }),
);
get("th-vertex").addEventListener("input", () =>
  update({ vertex: Number(get<HTMLInputElement>("th-vertex").value) }, "replace"),
);
get("th-probe").addEventListener("input", () =>
  update({ probe: Number(get<HTMLInputElement>("th-probe").value), step: 4 }, "replace"),
);
for (const arc of ["three", "single"] as TheatreArc[])
  get(`th-${arc}`).addEventListener("click", () => update({ arc, step: 4 }));
get("th-read-command").addEventListener("click", () => {
  update({ reading: theatreSteps[state.kind][state.step]?.passage ?? 0 });
  get("th-reading-title").focus();
  get("th-reading").scrollIntoView();
});
get("th-passage").addEventListener("change", () =>
  update({ reading: Number(get<HTMLSelectElement>("th-passage").value) }),
);
for (const [id, delta] of [
  ["prev", -1],
  ["next", 1],
] as const)
  get(`th-reading-${id}`).addEventListener("click", () =>
    update({ reading: state.reading + delta }),
  );
get("th-show-source").addEventListener("click", () => {
  update({ source: theatrePassages[state.reading]?.source ?? 0 });
  get("th-evidence-title").focus();
  get("th-evidence").scrollIntoView();
});
get("th-source").addEventListener("change", () =>
  update({ source: Number(get<HTMLSelectElement>("th-source").value) }),
);
get("th-source-zoom").addEventListener("input", () => {
  const value = get<HTMLInputElement>("th-source-zoom").value;
  get<HTMLImageElement>("th-source-image").style.width = `${value}%`;
  get("th-source-zoom-value").textContent = `${value}%`;
});
get("th-find-passage").addEventListener("click", () => {
  const source = theatreSources[state.source];
  if (source)
    get("th-source-pan").scrollTo({
      top: get<HTMLImageElement>("th-source-image").height * source.focus,
      left: 0,
    });
});
get("th-source-image").addEventListener("error", () => {
  get("th-source-error").hidden = false;
});
get("th-source-image").addEventListener("load", () => {
  get("th-source-error").hidden = true;
});
get("th-share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.search = theatreQuery(state);
  url.hash = "th-workshop";
  get("th-share-label").hidden = false;
  get<HTMLInputElement>("th-share-url").value = url.href;
  try {
    await navigator.clipboard.writeText(url.href);
    get("th-action-status").textContent =
      "Link copied. It retains the plan, boundary, cut, reading and source.";
  } catch {
    get<HTMLInputElement>("th-share-url").focus();
    get<HTMLInputElement>("th-share-url").select();
    get("th-action-status").textContent = "Copy the selected link to retain these settings.";
  }
});
get("th-save-svg").addEventListener("click", () => {
  saveTheatre(
    theatreSvg(state, matchMedia("(max-width: 700px)").matches),
    "gonia-theatre.svg",
    "image/svg+xml;charset=utf-8",
  );
  get("th-action-status").textContent = "Saved this diagram with its model description and scale.";
});
get("th-save-csv").addEventListener("click", () => {
  saveTheatre(theatreCsv(state), "gonia-theatre.csv", "text/csv;charset=utf-8");
  get("th-action-status").textContent =
    "Saved all twelve vertices, sampled boundary and calculated measurements.";
});
get("th-save-reading").addEventListener("click", async () => {
  const button = get<HTMLButtonElement>("th-save-reading"),
    saved = { ...state };
  button.disabled = true;
  get("th-action-status").textContent =
    "Verifying the seven images and fonts, then preparing your reading…";
  try {
    saveTheatre(
      await theatreReading(saved),
      "gonia-theatre-reading.html",
      "text/html;charset=utf-8",
    );
    get("th-action-status").textContent =
      "Saved the illustrated reading with both schemes, Latin, notes, fonts and seven source images.";
  } catch (error) {
    get("th-action-status").textContent =
      error instanceof Error
        ? error.message
        : "The reading could not be saved. Reconnect and try again.";
  } finally {
    button.disabled = false;
  }
});
window.addEventListener("popstate", () => {
  parsed = parseTheatre(location.search);
  state = parsed.state;
  render();
});
render();
void offlineStatus(get("th-offline"));
get("th-save-reading").insertAdjacentHTML(
  "afterend",
  `<a class="th-reset" href="./theatre.html${esc(theatreQuery(THEATRE_DEFAULT))}#th-workshop">Reset the example</a>`,
);

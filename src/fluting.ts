import {
  columnSection,
  FLUTING_DEFAULT,
  type FlutingState,
  flutingQuery,
  gaugeReading,
  parseFluting,
  RECIPES,
  type Recipe,
  recipeNames,
} from "./core/fluting";
import { flutingSources, readingContent } from "./fluting-content";
import { constructionDrawing, drumDrawing, profileDrawing } from "./fluting-drawing";
import { downloadFluting } from "./fluting-files";
import { offlineStatus } from "./offline";
import { segmentReading } from "./segments-content";
import { segmentCalculation, segmentFigures } from "./segments-drawing";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing ${id}`);
  return el as T;
}
let parsed = parseFluting(location.search),
  state = { ...parsed.state },
  source = 0;
get("app").innerHTML =
  `<a class="skip" href="#fluting-workshop">Skip to the carving workshop</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./#workshop">Doric corner</a><a href="./spacing.html">Column spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html" aria-current="page">Fluting</a><a href="./transport.html">Transport</a></nav></header><main>
<section class="fluting-intro"><h1>The cut<br>inside a column.</h1><div><p>A flute is a hollow carved along a shaft. But what shape is that hollow? A compass and a carpenter’s square give two different answers.</p><p>Try Vitruvius’s instructions. Move the tool. Take a template to paper. Read the Latin—and a Greek word in its own sentence.</p><a href="#fluting-workshop">Inspect the cut ↓</a></div></section>
<section id="fluting-workshop" aria-labelledby="fluting-title"><p class="eyebrow">One groove · equal scales</p><h2 id="fluting-title" tabindex="-1">Does the square fit the cut?</h2><p class="fluting-lead">Keep the groove’s width fixed. Compare two geometric readings of Vitruvius, then move P along the curve. The thin rays join P to both edges; the vermilion tool always keeps its 90° corner.</p><p id="fluting-warning" role="status"></p>
<div class="fluting-controls"><div><label for="recipe">Source construction</label><select id="recipe">${RECIPES.map((r) => `<option value="${r}">${recipeNames[r]}</option>`).join("")}</select><small>Prescriptions, not a survey of surviving profiles.</small></div><div><label for="width">Chosen groove width <output id="width-value" for="width"></output></label><input id="width" type="range" min="50" max="120" step="5"><small>Modern model scale, in millimetres.</small></div><div><label for="point">Move the tool <output id="point-value" for="point"></output></label><input id="point" type="range" min="5" max="95" step="1"><small>Use arrow keys, or drag P on the drawing.</small></div></div>
<div class="fluting-switches"><label><input id="gauge" type="checkbox">Show the fixed right-angle tool</label><label><input id="compare" type="checkbox">Overlay the other circular profile</label></div>
<div class="fluting-plates"><figure><h3>Across a single hollow</h3><div id="profile-holder"></div><figcaption id="profile-caption"></figcaption></figure><figure><h3 id="drum-heading"></h3><div id="drum-holder"></div><figcaption id="drum-caption"></figcaption></figure></div>
<div class="fluting-numbers" aria-live="polite" aria-atomic="true"><div><strong id="cut-depth"></strong><span>depth below A–B</span></div><div><strong id="edge-angle"></strong><span>angle between edge rays</span></div><div><strong id="gauge-miss"></strong><span id="miss-label">second contact short of B</span></div></div><p id="gauge-verdict" class="fluting-verdict"></p><p><a href="#segment-study">Why 135° here, but 45° on the other arc?</a></p>
<div class="fluting-controls"><div><label for="fillet">Ionic fillet <output id="fillet-value" for="fillet"></output></label><input id="fillet" type="range" min="0" max="30" step="5"><small id="fillet-hint">Chosen share of each angular pitch left on the outer circle; no ancient width is prescribed here.</small></div></div>
<div class="fluting-table-scroll" tabindex="0" role="region" aria-label="Three source constructions; scroll horizontally"><table class="fluting-table"><caption>Same chosen groove width; shaft diameter changes with flute count and fillets. Calculations describe this model, not ancient measurements or load capacity.</caption><thead><tr><th scope="col">Construction</th><th scope="col">Depth / mm</th><th scope="col">Edge angle</th><th scope="col">Shaft Ø / mm</th><th scope="col">Area removed</th></tr></thead><tbody id="recipe-table"></tbody></table></div>
<div class="fluting-actions"><button id="share" type="button">Copy this view</button><button id="save-template" type="button">Save paper template (SVG)</button><button id="save-reading" type="button">Save illustrated reading</button><button id="save-csv" type="button">Download coordinates (CSV)</button><button id="reset" type="button">Reset</button><p id="action-status" role="status"></p></div><p class="fluting-small">The SVG template uses millimetres and includes a 25 mm calibration bar. Print at actual size and measure the bar. Printer scaling has not been tested.</p>
</section><section class="fluting-section"><p class="eyebrow">Recover the construction</p><h2 id="construction-heading"></h2><div class="fluting-construction"><div id="construction-holder"></div><div id="construction-note"></div></div></section>
<section class="fluting-section" id="segment-study" aria-labelledby="segment-title"><p class="eyebrow">Euclid · the angle in a segment</p><h2 id="segment-title" tabindex="-1">Same chord. Which segment?</h2><p class="fluting-lead">A chord divides the circle into two regions. An angle in one region faces the other arc. Keep A and B fixed and compare one point on each side.</p><div class="segment-controls"><div role="group" aria-label="Construction circle"><button type="button" data-segment-recipe="doric">Doric circle</button><button type="button" data-segment-recipe="ionic">Ionic circle</button></div><div><label for="segment-point">Move both points <output id="segment-point-value" for="segment-point"></output></label><input id="segment-point" type="range" min="5" max="95" step="1"><small>The same fraction along each of the two arcs; endpoints stay fixed.</small></div></div><div id="segment-figures"></div><div id="segment-calculation" class="segment-calculation"></div><button id="save-segments" type="button">Download both arcs (CSV)</button><button id="share-segment" type="button">Copy this comparison</button><p id="segment-status" role="status"></p>${segmentReading()}</section>
${readingContent()}
<section class="fluting-section" id="fluting-sources"><h2 tabindex="-1">Read the marks on the page.</h2><p>Complete public-domain pages, including their apparatus. Krohn’s Latin edition dates to 1912. Bywater’s Greek edition was first published in 1894; this scan is the 1920 printing. Heiberg’s Greek Euclid and his Latin translation date to 1883. English translations and diagrams here are new.</p><div class="fluting-source-choices" role="group" aria-label="Printed source">${flutingSources.map((p, i) => `<button type="button" data-page="${i}">${p.label}</button>`).join("")}</div><figure class="fluting-source-figure"><div class="fluting-source-window" id="source-window" tabindex="0" role="region" aria-label="Complete printed source; scroll to read"></div><figcaption id="source-caption"></figcaption></figure><div class="fluting-source-links"><button id="source-zoom" type="button" aria-pressed="false">Enlarge scan</button><a id="source-image">Open full image</a><a id="source-original">Library source</a></div><p class="fluting-small">The Latin instructions support these geometric constructions; they do not establish that every Doric groove is a quarter-circle or every Ionic groove a semicircle. The model chooses a millimetre scale and an Ionic fillet width. It makes no claim about structural strength or ancient visual perception.</p></section></main><footer><a href="./entasis.html">Measure the curve along a flute edge</a><span id="fluting-offline" role="status">Preparing offline workshop…</span><a href="https://github.com/antonsoo/gonia">Source &amp; license</a></footer>`;
function draw() {
  for (const key of ["recipe", "width", "fillet", "point"] as const)
    get<HTMLInputElement>(key).value = String(state[key]);
  for (const key of ["gauge", "compare"] as const) get<HTMLInputElement>(key).checked = state[key];
  for (const key of ["point", "gauge", "compare"] as const)
    get<HTMLInputElement>(key).disabled = state.recipe === "flat";
  get<HTMLInputElement>("fillet").disabled = state.recipe !== "ionic";
  get("width-value").textContent = `${state.width} mm`;
  get("point-value").textContent = `${state.point}% of the arc`;
  get("fillet-value").textContent = `${state.fillet}% of pitch · modern choice`;
  const g = gaugeReading(state),
    c = columnSection(state);
  get("profile-holder").innerHTML = profileDrawing(state);
  get("drum-holder").innerHTML = drumDrawing(state);
  get("drum-heading").textContent =
    `${c.count} ${state.recipe === "flat" ? "flat faces" : "cuts around the drum"}`;
  get("profile-caption").textContent =
    state.recipe === "flat"
      ? "A regular polygon leaves twenty flat faces. Its chords have no hollow beneath them."
      : `The horizontal and vertical scales match. ${state.compare ? "The dashed curve is the other circular recipe at the same width. " : ""}The right-angle tool keeps one arm at A; its other arm ${g.fits ? "also reaches B" : "crosses the chord before B"}.`;
  get("drum-caption").textContent =
    `Shaft diameter ${c.diameter.toFixed(2)} mm. ${state.recipe === "ionic" ? `${state.fillet}% of each pitch remains as an outer-circle fillet.` : "The divisions meet at sharp arrises."} The dashed circle is the uncut shaft.`;
  get("cut-depth").textContent = `${g.template.depth.toFixed(2)} mm`;
  get("edge-angle").textContent = state.recipe === "flat" ? "—" : `${g.angle.toFixed(0)}°`;
  get("gauge-miss").textContent = state.recipe === "flat" ? "—" : `${g.miss.toFixed(2)} mm`;
  get("gauge-verdict").textContent =
    state.recipe === "flat"
      ? "This is the un-hollowed alternative in the Doric passage. There is no curved groove for the norma to inspect."
      : g.fits
        ? "The 90° tool touches both edges as P moves. The semicircle satisfies this moving-square test."
        : "The edge rays remain 135° apart as P moves. A 90° tool cannot touch both edges and sit on this quarter-circle hollow.";
  get("recipe-table").innerHTML = RECIPES.map((recipe) => {
    const s = { ...state, recipe },
      t = gaugeReading(s),
      section = columnSection(s);
    return `<tr><th scope="row">${recipeNames[recipe]}</th><td>${t.template.depth.toFixed(3)}</td><td>${recipe === "flat" ? "—" : `${t.angle.toFixed(0)}°`}</td><td>${section.diameter.toFixed(3)}</td><td>${section.removedPercent.toFixed(3)}%</td></tr>`;
  }).join("");
  get("segment-figures").innerHTML = segmentFigures(state);
  get("segment-calculation").innerHTML = segmentCalculation(state);
  get<HTMLInputElement>("segment-point").value = String(state.point);
  get<HTMLInputElement>("segment-point").disabled = state.recipe === "flat";
  get("segment-point-value").textContent = `${state.point}% of each arc`;
  document.querySelectorAll<HTMLButtonElement>("[data-segment-recipe]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.segmentRecipe === state.recipe));
  });
  get("construction-holder").innerHTML = constructionDrawing(state);
  get("construction-heading").textContent =
    state.recipe === "doric"
      ? "A circle through a square’s corners."
      : state.recipe === "ionic"
        ? "A moving right angle."
        : "Twenty divisions, joined by chords.";
  get("construction-note").innerHTML =
    state.recipe === "doric"
      ? `<p>A square has the groove’s width as its side. Put the compass at its centre C. A circle through its corners has radius width ÷ √2.</p><p>The hollow below A–B is a 90° arc of that circle. Its depth is width × (√2 − 1) ÷ 2: <strong>${g.template.depth.toFixed(3)} mm</strong> here.</p><p>The 90° at C and the 135° at P are different angles at different places. The diagram keeps both constructions visible.</p>`
      : state.recipe === "ionic"
        ? `<p>Put the corner of a square at P and its arms against A and B. The points where both arms touch are consistent with a semicircle on A–B.</p><p>Its radius and depth are both half the chosen width: <strong>${g.template.depth.toFixed(3)} mm</strong>.</p><p>The norma’s orientation changes as P moves, but its corner stays at 90°.</p>`
        : `<p>Each face is a straight chord. Joining twenty equally spaced division points cuts a regular polygon from the original round shaft.</p><p>The hollow depth is zero, but removing the outer circular caps still removes <strong>${c.removedPercent.toFixed(3)}%</strong> of the original section’s area.</p>`;
}
function change(patch: Partial<FlutingState>, record = true) {
  state = { ...state, ...patch };
  draw();
  if (record)
    history.pushState(null, "", `${location.pathname}${flutingQuery(state)}${location.hash}`);
  get("action-status").textContent = "";
  get("segment-status").textContent = "";
}
for (const id of ["recipe", "width", "fillet", "point", "gauge", "compare"] as const)
  get<HTMLInputElement>(id).addEventListener("change", () => {
    const el = get<HTMLInputElement>(id);
    change({
      [id]:
        id === "recipe"
          ? (el.value as Recipe)
          : id === "gauge" || id === "compare"
            ? el.checked
            : Number(el.value),
    });
  });
for (const id of ["width", "point", "fillet"] as const)
  get<HTMLInputElement>(id).addEventListener("input", () =>
    change({ [id]: Number(get<HTMLInputElement>(id).value) }, false),
  );
get("segment-point").addEventListener("input", () =>
  change({ point: Number(get<HTMLInputElement>("segment-point").value) }, false),
);
get("segment-point").addEventListener("change", () =>
  change({ point: Number(get<HTMLInputElement>("segment-point").value) }),
);
document.querySelectorAll<HTMLButtonElement>("[data-segment-recipe]").forEach((b) => {
  b.addEventListener("click", () => change({ recipe: b.dataset.segmentRecipe as Recipe }));
});
get("reset").addEventListener("click", () => change({ ...FLUTING_DEFAULT }));
window.addEventListener("popstate", () => {
  parsed = parseFluting(location.search);
  state = { ...parsed.state };
  draw();
});
get("fluting-warning").textContent = parsed.warning
  ? "This link contains conflicting or invalid settings. The complete view has been reset."
  : "";
function drawSource() {
  const p = flutingSources[source];
  if (!p) throw new Error("Missing source");
  get("source-window").innerHTML =
    `<img src="./sources/fluting/${p.file}" width="${p.width}" height="${p.height}" alt="${p.label}: complete printed page">`;
  get("source-window").scrollTo(0, 0);
  get("source-caption").textContent = `${p.label}. ${p.note}`;
  get<HTMLAnchorElement>("source-image").href = `./sources/fluting/${p.file}`;
  get<HTMLAnchorElement>("source-original").href = p.url;
  document.querySelectorAll<HTMLElement>("[data-page]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.page) === source));
  });
}
document.querySelectorAll<HTMLElement>("[data-source],[data-page]").forEach((b) => {
  b.addEventListener("click", () => {
    source = Number(b.dataset.source ?? b.dataset.page);
    drawSource();
  });
});
get("source-zoom").addEventListener("click", () => {
  const on = get("source-window").classList.toggle("enlarged");
  get("source-zoom").setAttribute("aria-pressed", String(on));
  get("source-zoom").textContent = on ? "Fit scan to width" : "Enlarge scan";
});
async function copyView(fragment: string) {
  const status = fragment === "#segment-study" ? get("segment-status") : get("action-status");
  const url = new URL(`${location.pathname}${flutingQuery(state)}${fragment}`, location.origin)
    .href;
  try {
    await navigator.clipboard.writeText(url);
    status.textContent = "Link copied with these settings.";
  } catch {
    status.textContent = "Copy this view: ";
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    status.append(a);
  }
}
get("share").addEventListener("click", () => copyView("#fluting-workshop"));
get("share-segment").addEventListener("click", () => copyView("#segment-study"));
for (const kind of ["template", "reading", "csv", "segments"] as const)
  get(`save-${kind}`).addEventListener("click", async () => {
    const snapshot = { ...state };
    const status = kind === "segments" ? get("segment-status") : get("action-status");
    status.textContent =
      kind === "reading" ? "Preparing the source pages and fonts…" : "Preparing the file…";
    try {
      await downloadFluting(kind, snapshot);
      status.textContent = "File saved with the settings selected when you clicked.";
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : "The file could not be prepared. Try again.";
    }
  });
let dragging = false;
get("profile-holder").addEventListener("pointerdown", (e) => {
  if (!(e.target instanceof Element) || !e.target.hasAttribute("data-drag")) return;
  dragging = true;
  get("profile-holder").setPointerCapture(e.pointerId);
  e.preventDefault();
});
get("profile-holder").addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const svg = get<HTMLElement>("flute-profile") as unknown as SVGSVGElement;
  const matrix = svg.getScreenCTM();
  if (!matrix) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
  let low = 5,
    high = 95;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const candidate = (gaugeReading({ ...state, point: Math.round(mid) }).p.x / state.width) * 100;
    if (candidate < p.x) low = mid;
    else high = mid;
  }
  change({ point: Math.max(5, Math.min(95, Math.round((low + high) / 2))) }, false);
});
get("profile-holder").addEventListener("pointerup", (e) => {
  if (!dragging) return;
  dragging = false;
  get("profile-holder").releasePointerCapture(e.pointerId);
  history.pushState(null, "", `${location.pathname}${flutingQuery(state)}${location.hash}`);
});
get("profile-holder").addEventListener("pointercancel", () => {
  dragging = false;
});
draw();
drawSource();
history.replaceState(null, "", `${location.pathname}${flutingQuery(state)}${location.hash}`);
offlineStatus(get("fluting-offline"));

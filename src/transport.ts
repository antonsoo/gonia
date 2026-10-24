import {
  PACONIUS,
  parseTransport,
  TRANSPORT_DEFAULT,
  TRANSPORT_KINDS,
  TRANSPORT_NAMES,
  type TransportKind,
  type TransportState,
  transportFrameAngle,
  transportModel,
  transportQuery,
} from "./core/transport";
import { offlineStatus } from "./offline";
import {
  TRANSPORT_LIMITS,
  TRANSPORT_SOURCE,
  type TransportWord,
  transportGreek,
  transportReadingHtml,
  transportWords,
} from "./transport-content";
import {
  transportNumber as n,
  transportDrawing,
  transportGraph,
  transportUnit,
} from "./transport-drawing";
import { downloadTransportCsv, downloadTransportReading } from "./transport-files";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing ${id}`);
  return e as T;
}
let parsed = parseTransport(location.search);
let state = parsed.state;
let playing = false,
  frame = 0;
get("app").innerHTML =
  `<a class="skip" href="#transport-workshop">Skip to the rolling stone</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./#workshop">Doric corner</a><a href="./spacing.html">Column spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html" aria-current="page">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a></nav></header><main>
<section class="transport-intro"><div><p class="eyebrow">Vitruvius · stone on the way to Ephesus</p><h1>Before the<br>column stood.</h1></div><div><p>A shaft can be its own roller. A bare rectangular beam must rise and fall as it rolls. Metagenes enclosed the ends in wheels—and the beam became the axle.</p><p>Turn the stone through one revolution. Then read an account in which a machine turned but could not keep to the road.</p><p class="transport-small">Source-grounded geometry with chosen dimensions. This is a modern end view, not a recovered machine plan.</p></div></section>
<section id="transport-workshop" aria-labelledby="transport-heading"><div class="transport-heading"><div><p class="eyebrow">An end view · rolling without slipping</p><h2 id="transport-heading" tabindex="-1">What must rise?</h2></div><p id="transport-issue" role="status" hidden></p></div>
<div class="transport-workbench"><div class="transport-board"><div class="transport-plate-heading"><span>Camera follows C</span><span>Road ruler moves underneath</span></div><label class="transport-zoom-label" for="transport-zoom">Enlarge end view <input id="transport-zoom" type="range" min="100" max="250" step="25" value="100"></label><div id="transport-picture" class="transport-drawing" tabindex="0" role="region" aria-label="End view; enlarge and scroll or use arrow keys to pan"></div><p class="transport-small" id="transport-picture-note"></p></div>
<div class="transport-controls"><label for="transport-kind">Compare the geometries</label><select id="transport-kind">${TRANSPORT_KINDS.map((k) => `<option value="${k}">${TRANSPORT_NAMES[k]}</option>`).join("")}</select><p id="transport-method-note" class="transport-small"></p><div id="stone-dimensions"><label for="stone-width">Stone width <output id="stone-width-value" for="stone-width"></output></label><input id="stone-width" type="range" min="2" max="12" step="0.5"><label for="stone-height">Stone height <output id="stone-height-value" for="stone-height"></output></label><input id="stone-height" type="range" min="2" max="12" step="0.5"></div><div id="radius-control"><label for="rolling-radius"><span id="radius-label">Wheel radius</span> <output id="rolling-radius-value" for="rolling-radius"></output></label><input id="rolling-radius" type="range" min="1" max="9" step="0.25"></div>
<label for="transport-angle">Turn clockwise <output id="transport-angle-value" for="transport-angle"></output></label><input id="transport-angle" type="range" min="0" max="360" step="1"><div class="transport-play"><button id="transport-play" type="button" aria-pressed="false">Play one turn</button><button id="transport-quarter" type="button">Next quarter-turn</button></div><p class="transport-small">Use arrow keys for single degrees. Motion starts only when requested. It pauses when the tab is hidden.</p><p id="transport-unit-note" class="transport-small"></p><div class="transport-presets"><button id="transport-paconius" type="button">Try Paconius’s reported dimensions</button><button id="transport-tight" type="button">Try a wheel that is too small</button><button id="transport-reset" type="button">Reset the chosen example</button></div></div></div>
<div id="transport-measures" class="transport-measures" aria-live="polite" aria-atomic="true"><div><strong id="centre-height"></strong><span>centre height</span></div><div><strong id="centre-advance"></strong><span>advance from the start</span></div><div><strong id="full-clearance"></strong><span id="clearance-label"></span></div></div><p id="transport-verdict" class="transport-verdict"></p><p class="transport-small">The comparisons describe geometry. Loads are not matched for mass or volume, and no pulling force or construction safety is inferred.</p>
<div class="transport-analysis"><div><p class="eyebrow">Through the whole revolution</p><h2>A corner sets<br>the clearance.</h2><p>The green curve is the rectangular stone’s required centre height. The bare stone follows it as it tips around successive ground corners. A circular wheel keeps its centre at one height.</p><p>The dashed line is the chosen radius. If any of the green curve rises above it, the stone cannot complete a turn at that wheel height without meeting the road.</p><p id="transport-graph-reference" class="transport-small"></p><p id="transport-full-turn"></p></div><div class="transport-graph" id="transport-height-graph" tabindex="0" role="region" aria-label="Full-turn height graph; use arrow keys to scroll"></div></div>
<details class="transport-math"><summary>Why does the half-diagonal decide a full turn?</summary><p>For a section of width w and height h, the lowest corner reaches (w/2)|sin θ| + (h/2)|cos θ| below its centre. Its largest reach is √[(w/2)² + (h/2)²], half the diagonal. A wheel that clears the stone while it stands upright can still be too small later in the turn.</p><p>A bare rectangle travels its perimeter, 2(w+h), in one full turn. A circle travels 2πR. These advances are different because the body touches the road differently. A bare rectangle pivots about one ground corner until the next face arrives.</p></details>
<div class="transport-actions"><button id="transport-share" type="button">Copy this view</button><button id="transport-csv" type="button">Download the complete turn (CSV)</button><button id="transport-save" type="button">Save illustrated transport reading</button><p id="transport-action-status" role="status"></p></div><p id="transport-share-fallback" hidden><label for="transport-share-url">Copy this link</label><input id="transport-share-url" type="text" readonly></p></section>
<section class="transport-section transport-failure"><div><p class="eyebrow">A source-shaped limit</p><h2>It fits.<br>It still veered.</h2></div><div><p>Vitruvius reports a later replacement base: twelve feet long, eight wide, six high. Paconius enclosed it in wheels of about fifteen feet and pulled a rope wound around crossbars.</p><p>Taking the twelve-foot length as the wheel axis, and fifteen feet as wheel diameter, the 8 × 6 end section has a five-foot half-diagonal. The 7½-foot radius leaves 2½ feet of clearance through a complete turn.</p><p>Yet the text reports that the machine went to one side, had to be pulled back, and exhausted the contractor’s money. The clearance calculation cannot explain that report. This flat end view has no steering, soil or rope-force model.</p><button type="button" id="transport-case">Set those reported dimensions</button><a href="#transport-sources" data-transport-page="231">Read X.2.13–14 on printed p. 231</a></div></section>
<section class="transport-section transport-language" aria-labelledby="transport-language-title"><div class="transport-reading-head"><div><p class="eyebrow">Read the machine in Latin</p><h2 id="transport-language-title">The rings are not<br>the road wheels.</h2><p>Tap an underlined Latin word for its role in the sentence. Read the full print, including the critical apparatus, alongside the excerpts.</p><p class="transport-small">Vitruvius says Chersiphron distrusted carts on the soft roads. He describes pivots fixed into the shaft ends, turning inside rings in a pulled timber frame. The end view tests geometry; it does not test soil or bearing behaviour.</p></div><aside id="transport-word-panel" class="transport-word-note" aria-live="polite"><p class="eyebrow">Word and construction</p><h3 id="transport-word-title"></h3><p id="transport-word-meaning"></p><p id="transport-word-note"></p></aside></div><div class="transport-readings">${transportReadingHtml()}</div>
<div class="transport-greek"><h3>Greek words carried into Latin</h3><p>These headwords name the objects in Greek. They explain technical vocabulary in the Latin account; they are not a Greek original or a back-translation.</p><div>${transportGreek.map((g) => `<article><h4 lang="grc">${g.article} ${g.word}</h4><p class="transport-greek-genitive">Genitive <span lang="grc">${g.genitive}</span></p><p>${g.meaning}. Latin <i lang="la">${g.latin}</i>.</p><p class="transport-small">${g.note} <a href="https://logeion.uchicago.edu/${encodeURIComponent(g.word)}">LSJ via Logeion ↗</a>.</p></article>`).join("")}</div></div></section>
<section class="transport-section" id="transport-sources"><div class="transport-source-head"><div><p class="eyebrow">The complete printed evidence</p><h2 id="transport-source-title" tabindex="-1"></h2><p class="transport-small">Vitruvius X.2.11–14, F. Krohn’s 1912 edition. Short excerpts join line-end hyphens and normalize numeral capitalization; they retain the editor’s text. A gap in the timber-frame description and the apparatus remain in the scan.</p></div><div class="transport-source-actions"><button type="button" data-transport-page="230">Printed p. 230</button><button type="button" data-transport-page="231">Printed p. 231</button><label for="transport-source-zoom">Enlarge source page <input id="transport-source-zoom" type="range" min="100" max="300" step="25" value="100"></label><button type="button" id="transport-source-start">Start of the transport account</button><button type="button" id="transport-page-top">Page top</button><a id="transport-open-image" target="_blank" rel="noreferrer">Open full image ↗</a><a href="./sources/transport/vitruvius-230-231.pdf">Both complete source pages (PDF)</a><a href="${TRANSPORT_SOURCE}">Original volume ↗</a></div></div><div class="transport-source-pan" id="transport-source-pan" tabindex="0" role="region" aria-label="Complete Latin source; scroll or use arrow keys to pan"><img id="transport-source-image" alt="" width="1274" height="2000"></div><p id="transport-page-note" class="transport-small"></p></section>
<section class="transport-section transport-limits"><h2>What this model can establish.</h2><p>${TRANSPORT_LIMITS}</p><p>The twelve-foot wheel size in the Metagenes account does not supply the dimensions of his beams. The initial 8 × 6 section is chosen. The Paconius preset preserves symbolic source feet without converting them to a modern physical length. The usual wheel-diameter interpretation follows <a href="https://lexundria.com/vitr/10.2.12/mg">Morgan’s translation</a>, and the identification of the long dimension with the wheel axis is stated explicitly.</p><p>Continue with the <a href="./fluting.html">cut inside a column</a>, <a href="./entasis.html">measured entasis</a>, or <a href="https://antonsoo.github.io/rajju/field.html">Āpastamba’s marked-cord ground</a>.</p></section></main><footer><span>Gonia · <span lang="grc">γωνία</span></span><p id="transport-offline" role="status">Preparing offline workshop…</p><a href="https://github.com/antonsoo/gonia">Source & methods</a></footer>`;

function write(push = false): void {
  const u = new URL(location.href);
  for (const [k, v] of new URLSearchParams(transportQuery(state))) u.searchParams.set(k, v);
  history[push ? "pushState" : "replaceState"](null, "", u);
}
function zoom(value: string): void {
  const svg = get("transport-picture").querySelector<SVGSVGElement>("svg");
  if (svg) svg.style.width = `${value}%`;
}
async function sourceStart(): Promise<void> {
  const image = get<HTMLImageElement>("transport-source-image");
  const page = state.page;
  try {
    await image.decode();
    if (state.page === page)
      get("transport-source-pan").scrollTop = page === 230 ? image.clientHeight * 0.29 : 0;
  } catch {
    /* The full image link remains available if the source is unavailable. */
  }
}
function source(): void {
  const img = get<HTMLImageElement>("transport-source-image"),
    url = `${import.meta.env.BASE_URL}sources/transport/krohn-${state.page}.jpg`;
  if (img.getAttribute("src") !== url) {
    img.src = url;
    img.alt = `Complete Krohn 1912 printed page ${state.page}, including Latin text and critical apparatus. PDF page ${state.page + 18}.`;
    img.style.width = "100%";
    get<HTMLInputElement>("transport-source-zoom").value = "100";
    get("transport-source-pan").scrollTo(0, 0);
    void sourceStart();
  }
  get("transport-source-title").textContent = `Krohn · printed page ${state.page}`;
  get<HTMLAnchorElement>("transport-open-image").href = url;
  get("transport-page-note").textContent =
    state.page === 230
      ? "The shaft transport and the beginning of Metagenes’s wheel method. The timber-frame description contains a printed gap; no missing frame dimensions have been restored in this model."
      : "The wheel method continues, then the reported 12 × 8 × 6 base, fifteen-foot wheels and veering machine. The apparatus records variant readings, including the contractor’s name; this room follows Krohn’s Paconius.";
  for (const b of document.querySelectorAll<HTMLButtonElement>("button[data-transport-page]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.transportPage) === state.page));
}
function render(): void {
  const m = transportModel(state),
    unit = transportUnit(state);
  get("transport-measures").setAttribute("aria-live", playing ? "off" : "polite");
  get("transport-issue").hidden = parsed.issue === null;
  get("transport-issue").textContent = parsed.issue ?? "";
  get<HTMLSelectElement>("transport-kind").value = state.kind;
  for (const [id, key] of [
    ["stone-width", "width"],
    ["stone-height", "height"],
    ["rolling-radius", "radius"],
    ["transport-angle", "angle"],
  ] as const) {
    get<HTMLInputElement>(id).value = String(state[key]);
    get(`${id}-value`).textContent =
      key === "angle" ? `${state.angle}°` : `${n(state[key])} ${unit}`;
  }
  get("stone-dimensions").hidden = state.kind === "shaft";
  get("radius-control").hidden = state.kind === "bare";
  get("radius-label").textContent = state.kind === "shaft" ? "Shaft radius" : "Wheel radius";
  get("transport-method-note").textContent =
    state.kind === "shaft"
      ? "Chersiphron’s principle: the shaft itself rolls while a surrounding frame is drawn. The source does not supply this shaft radius."
      : state.kind === "bare"
        ? "Modern counterexample: remove the wheels and let the rectangular section turn on its own corners. This is not the method Vitruvius prescribes."
        : "Metagenes’s principle: the beam turns together with the surrounding wheels. Two end wheels overlap in this view; the full frame is not reconstructed.";
  get("transport-picture").innerHTML = transportDrawing(state);
  zoom(get<HTMLInputElement>("transport-zoom").value);
  get("transport-picture-note").textContent = m.intrudes
    ? "Red below the road marks a geometric obstruction. The display holds the wheel centre at R so the conflict remains visible; this is not a physically possible rolling pose."
    : state.kind === "bare"
      ? "Dark dots mark the active ground corner or the ends of a flat contact edge. C marks the centre."
      : "Dark dots mark ideal road contact; C marks the centre. The dashed pulling line locates the frame at the axis, without reconstructing its bearings.";
  get("transport-height-graph").innerHTML = transportGraph(state);
  get("centre-height").textContent = `${n(m.centre.y, 6)} ${unit}`;
  get("centre-advance").textContent = `${n(m.centre.x, 6)} ${unit}`;
  get("full-clearance").textContent =
    state.kind === "wheels"
      ? `${n(m.fullTurnClearance, 6)} ${unit}`
      : state.kind === "bare"
        ? `${n(m.maximumCentreHeight - m.minimumCentreHeight, 6)} ${unit}`
        : `0 ${unit}`;
  get("clearance-label").textContent =
    state.kind === "wheels"
      ? "minimum clearance through the turn"
      : "centre-height variation through the turn";
  get("transport-verdict").textContent =
    state.kind === "bare"
      ? `The centre rises and falls, from ${n(m.minimumCentreHeight)} to ${n(m.maximumCentreHeight)} ${unit}. The rectangular stone does not roll at one centre height.`
      : state.kind === "shaft"
        ? "The circular shaft rolls at a constant centre height. This establishes a geometric path, not the effort needed to pull it."
        : m.fullTurnValid
          ? `The rectangular section clears the road through a complete turn. ${m.paconiusDimensions ? "This fit does not explain the veering reported for Paconius’s machine." : "That clearance alone does not establish successful transport."}`
          : `This wheel is too small for the complete turn. The stone needs a radius of at least ${n(m.diagonalRadius, 6)} ${unit} to avoid the road; it ${m.intrudes ? "intersects the road now" : "clears at this angle but will meet the road later"}.`;
  get("transport-graph-reference").textContent =
    `Rectangular comparison: ${n(state.width)} × ${n(state.height)}. Circular reference radius: ${n(state.radius)}. Lengths in ${unit}.`;
  get("transport-full-turn").textContent =
    `One full turn advances ${n(m.fullTurnDistance, 6)} ${unit}: ${state.kind === "bare" ? "the rectangle’s perimeter, 2(w+h)" : "the rolling circumference, 2πR"}. The two shape types do not travel equal distances per revolution.`;
  get("transport-unit-note").textContent = m.paconiusDimensions
    ? "Paconius’s reported dimensions: 8 × 6 end section, 15-foot wheel diameter. Source feet remain symbolic; no metre conversion is made."
    : state.unit === "feet"
      ? "You are altering the source-foot example. These changed dimensions are your exploration, not dimensions newly supplied by the text."
      : "One consistent chosen unit. The section and radius are illustrative; no shared ancient load size is inferred.";
  get("transport-play").textContent = playing
    ? "Pause turn"
    : state.angle === 360
      ? "Replay one turn"
      : "Play one turn";
  get("transport-play").setAttribute("aria-pressed", String(playing));
  source();
}
function stop(): void {
  playing = false;
  cancelAnimationFrame(frame);
}
function change(patch: Partial<TransportState>, push = false): void {
  stop();
  state = { ...state, ...patch };
  parsed = { state, issue: null };
  write(push);
  render();
}
get<HTMLSelectElement>("transport-kind").addEventListener("change", (e) =>
  change({ kind: (e.target as HTMLSelectElement).value as TransportKind }, true),
);
for (const [id, key] of [
  ["stone-width", "width"],
  ["stone-height", "height"],
  ["rolling-radius", "radius"],
  ["transport-angle", "angle"],
] as const)
  get<HTMLInputElement>(id).addEventListener("input", (e) =>
    change({ [key]: Number((e.target as HTMLInputElement).value) }),
  );
get("transport-quarter").addEventListener("click", () =>
  change(
    { angle: state.angle >= 360 ? 0 : Math.min(360, (Math.floor(state.angle / 90) + 1) * 90) },
    true,
  ),
);
get("transport-reset").addEventListener("click", () => change({ ...TRANSPORT_DEFAULT }, true));
get("transport-tight").addEventListener("click", () =>
  change({ ...TRANSPORT_DEFAULT, radius: 4, angle: 45 }, true),
);
for (const id of ["transport-paconius", "transport-case"])
  get(id).addEventListener("click", () => {
    change({ ...PACONIUS }, true);
    if (id === "transport-case") get("transport-heading").focus();
  });
get("transport-play").addEventListener("click", () => {
  if (playing) {
    stop();
    write();
    render();
    return;
  }
  if (state.angle === 360) state = { ...state, angle: 0 };
  playing = true;
  const angle = state.angle;
  // A frame's timestamp can precede the click handler's performance.now().
  // Start with the first actual frame clock, rather than mixing those samples.
  let start: number | undefined;
  let previous = angle;
  const tick = (now: number) => {
    if (!playing) return;
    start ??= now;
    const next = Math.max(previous, transportFrameAngle(angle, now - start));
    if (next !== previous) {
      previous = next;
      state = { ...state, angle: next };
      if (next === 360) stop();
      write();
      render();
    }
    if (playing) frame = requestAnimationFrame(tick);
  };
  render();
  frame = requestAnimationFrame(tick);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing) {
    stop();
    write();
    render();
  }
});
get<HTMLInputElement>("transport-zoom").addEventListener("input", (e) =>
  zoom((e.target as HTMLInputElement).value),
);
get<HTMLInputElement>("transport-source-zoom").addEventListener("input", (e) => {
  const image = get<HTMLImageElement>("transport-source-image");
  const pan = get("transport-source-pan");
  const fraction = pan.scrollTop / image.clientHeight;
  image.style.width = `${(e.target as HTMLInputElement).value}%`;
  pan.scrollTop = fraction * image.clientHeight;
});
get("transport-source-start").addEventListener("click", () => {
  void sourceStart();
});
get("transport-page-top").addEventListener("click", () =>
  get("transport-source-pan").scrollTo(0, 0),
);
for (const e of document.querySelectorAll<HTMLElement>("[data-transport-page]"))
  e.addEventListener("click", () =>
    change({ page: Number(e.dataset.transportPage) as 230 | 231 }, true),
  );
function word(key: TransportWord, anchor?: HTMLButtonElement): void {
  const w = transportWords[key];
  get("transport-word-title").textContent = w.label;
  get("transport-word-meaning").textContent = w.meaning;
  get("transport-word-note").textContent = w.note;
  if (anchor) {
    const position = anchor.getBoundingClientRect().top;
    const sentence = anchor.closest(".transport-reading")?.querySelector(".transport-latin");
    if (sentence) {
      sentence.insertAdjacentElement("afterend", get("transport-word-panel"));
      document
        .querySelector(".transport-reading-head")
        ?.classList.add("transport-reading-intro-only");
      window.scrollBy(0, anchor.getBoundingClientRect().top - position);
    }
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-transport-word]"))
    b.setAttribute("aria-pressed", String(b.dataset.transportWord === key));
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-transport-word]"))
  b.addEventListener("click", () => word(b.dataset.transportWord as TransportWord, b));
get("transport-csv").addEventListener("click", () => {
  downloadTransportCsv(state);
  get("transport-action-status").textContent =
    "Selected pose and 361 full-turn samples downloaded. These are geometric positions, without force or steering estimates.";
});
get("transport-save").addEventListener("click", async () => {
  stop();
  render();
  const s = { ...state };
  get<HTMLButtonElement>("transport-save").disabled = true;
  get("transport-action-status").textContent = "Verifying the source pages, fonts and licenses…";
  try {
    await downloadTransportReading(s);
    get("transport-action-status").textContent =
      "Illustrated reading downloaded with both complete source pages. It opens and prints offline.";
  } catch (e) {
    get("transport-action-status").textContent =
      e instanceof Error ? e.message : "The reading could not be saved.";
  } finally {
    get<HTMLButtonElement>("transport-save").disabled = false;
  }
});
get("transport-share").addEventListener("click", async () => {
  stop();
  write();
  render();
  const link = location.href;
  try {
    await navigator.clipboard.writeText(link);
    get("transport-action-status").textContent =
      "View link copied, including units, rotation and source page.";
  } catch {
    get("transport-share-fallback").hidden = false;
    const input = get<HTMLInputElement>("transport-share-url");
    input.value = link;
    input.focus();
    input.select();
    get("transport-action-status").textContent =
      "Copy the selected link. Clipboard access was not granted.";
  }
});
window.addEventListener("popstate", () => {
  stop();
  parsed = parseTransport(location.search);
  state = parsed.state;
  render();
});
render();
word("cnodaces");
void offlineStatus(get("transport-offline"));

import {
  COLONNADE_LEFAS,
  COLONNADE_LIMITS,
  colonnadePartNotes,
  colonnadeReadingHtml,
  colonnadeSourceInfo,
  colonnadeWords,
} from "./colonnade-content";
import {
  colonnadeDrawing,
  colonnadePortrait,
  colonnadePortraitStrip,
  colonnadeStrip,
  colNumber as n,
} from "./colonnade-drawing";
import { downloadColonnadeCsv, downloadColonnadeReading } from "./colonnade-files";
import {
  COLONNADE_DEFAULT,
  type ColonnadeKind,
  type ColonnadePart,
  type ColonnadeRing,
  type ColonnadeSource,
  type ColonnadeState,
  colonnadeModel,
  colonnadeParts,
  colonnadeQuery,
  colonnadeSources,
  normalizeColonnade,
  parseColonnade,
} from "./core/colonnade";
import { offlineStatus } from "./offline";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing ${id}`);
  return el as T;
}
let parsed = parseColonnade(location.search),
  state = parsed.state;
let displayedSource: ColonnadeSource | undefined;
get("app").innerHTML =
  `<a class="skip" href="#col-workshop">Skip to the temple plan</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./#workshop">Doric corner</a><a href="./spacing.html">Column spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html" aria-current="page">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a></nav></header><main>
<section class="col-intro"><div><p class="col-kicker">An omission by Hermogenes · Vitruvius III</p><h1>The row that<br>is not there.</h1></div><div><p>Keep the temple’s outer columns. Omit the inner ring. The building keeps its breadth, but the walk around its walls changes.</p><p>That is the idea behind a <i>pseudodipteral</i> temple. Make the change, count the columns, then ask why a printed text and its footnote give different totals.</p><a href="#col-evidence">Compare with the excavators’ plans of Magnesia</a></div></section>
<section id="col-workshop" aria-labelledby="col-heading"><div class="col-section-head"><div><p class="col-kicker">01 / Make the omission</p><h2 id="col-heading" tabindex="-1">The same outer ring.<br>A different walk.</h2></div><p class="col-small">A regular model in lower diameters (D). The cella block and outer axes stay fixed when the inner ring is removed.</p></div><p id="col-adjusted" role="status" hidden>Some link settings were outside the experiment’s range and have been adjusted.</p>
<div class="col-workbench"><div class="col-controls col-settings"><fieldset><legend>Compare the arrangements</legend><button type="button" id="col-double" aria-pressed="false">Keep both rings <span lang="grc">δίπτερος</span></button><button type="button" id="col-pseudo" aria-pressed="true">Omit the inner ring <span lang="grc">ψευδοδίπτερος</span></button></fieldset><label for="col-gap">Clear gap between shafts <output id="col-gap-value" for="col-gap"></output></label><input id="col-gap" type="range" min="1.5" max="3" step="0.25"><p class="col-small">A chosen equal gap. Magnesia’s restored central entrance is wider; this model does not reproduce it. <a href="./spacing.html">Explore unequal spacing</a>.</p></div><div class="col-board"><div class="col-board-top"><span>Horizontal plan · equal length scales</span><label for="col-zoom">Plan zoom <select id="col-zoom"><option value="100">100%</option><option value="150">150%</option><option value="200">200%</option></select></label></div><div id="col-plan-pan" class="col-plan-pan" tabindex="0" role="region" aria-label="Temple plan; scroll or use arrow keys to pan"><div id="col-plan" class="col-plan col-wide-drawing"></div><div id="col-plan-portrait" class="col-plan col-tall-drawing"></div></div><div class="col-count-controls"><label for="col-ring">Trace a ring</label><select id="col-ring"><option value="outer">Outer ring · 42 positions</option><option value="inner">Inner ring · 34 positions</option></select><label for="col-count">Positions visited <output id="col-count-value" for="col-count"></output></label><input id="col-count" type="range" min="0" max="34" step="1"><div class="col-count-buttons"><button id="col-count-start" type="button">Start again</button><button id="col-count-next" type="button">Next column</button><button id="col-count-all" type="button">Trace the whole ring</button><a href="#col-plan-pan">Inspect the traced plan ↑</a></div><p id="col-count-note" role="status"></p></div><p class="col-small col-plan-hint">Scroll the enlarged plan to inspect a corner. Dashed circles are omitted positions, not excavated foundations. The circles show shafts; bases would extend farther.</p></div>
<div class="col-controls col-vocab"><fieldset class="col-part-controls"><legend>Read a part of the plan</legend>${colonnadeParts.map((part) => `<button type="button" data-col-part="${part}" aria-pressed="false">${{ space: "Passage", outer: "Outer columns", inner: "Inner ring", cella: "Cella" }[part]}</button>`).join("")}</fieldset><div class="col-part-note" aria-live="polite"><h3 id="col-part-title"></h3><p id="col-part-greek" lang="grc"></p><p id="col-part-latin" lang="la"></p><p id="col-part-note"></p><a id="col-dictionary">Dictionary headword ↗</a></div></div></div>
<div class="col-width"><div><p class="col-kicker">Detail A / A cut through column centres</p><h3 id="col-width-title"></h3><p id="col-width-note"></p><p class="col-small">This is a horizontal strip in plan. The double row’s lanes connect through its intercolumnar gaps; the columns do not form a solid wall.</p></div><div><div class="col-strip-pan" tabindex="0" role="region" aria-label="Measured passage detail; scroll or use arrow keys to pan"><div id="col-strip" class="col-wide-drawing"></div><div id="col-strip-portrait" class="col-tall-drawing"></div></div><p class="col-equation" id="col-equation"></p></div></div>
<div class="col-counting"><div><p class="col-kicker">02 / Count each corner once</p><h2>Eight by fifteen<br>does not mean 120.</h2><p>Those are counts along the boundary, not a filled grid. Nor is the answer 46: each corner belongs to an end and a flank.</p><p>The regular ring one pitch inside has six across an end and thirteen along a flank. Trace either circuit; the counter gives corners to the ends.</p></div><div class="col-count-table"><div class="col-table-pan" tabindex="0" role="region" aria-label="Ring counts; scroll or use arrow keys to read every column"><table><caption>Distinct positions in the model’s rings</caption><thead><tr><th scope="col">Ring</th><th scope="col">Ends</th><th scope="col">Flanks without corners</th><th scope="col">Total</th></tr></thead><tbody><tr><th scope="row">Outer</th><td>2 × 8</td><td>2 × 13</td><td>42</td></tr><tr><th scope="row">Inner</th><td>2 × 6</td><td>2 × 11</td><td>34</td></tr></tbody></table></div></div></div>
<aside class="col-dispute"><p class="col-kicker">A count is not a textual verdict</p><h3>The text prints 34.<br>The apparatus preserves 38.</h3><div><p>Krohn’s 1912 main text prints <span lang="la">XXXIV</span>. His apparatus attributes that reading to Philander and records <span lang="la">XXXVIII</span> in the textual tradition. Our simple inner ring gives 34. Its agreement with an editorial reading does not prove that reading correct.</p><p>Pavlos Lefas’s <a href="${COLONNADE_LEFAS}">2001 study</a> argues for 38 through an interpretation involving the ends of the inner building and its antae. The regular model omits that building’s porches. It cannot adjudicate the argument.</p><a href="#col-sources" data-col-source="apparatus">Inspect the number and its apparatus</a></div></aside>
<div class="col-actions"><button type="button" id="col-share">Copy this view</button><button type="button" id="col-csv">Save column coordinates (CSV)</button><button type="button" id="col-save">Save illustrated reading</button><p id="col-action-status" role="status"></p></div><p id="col-share-fallback" hidden><label for="col-share-url">Copy this link</label><input id="col-share-url" type="text" readonly></p></section>
<section id="col-evidence" class="col-section"><div class="col-section-head"><div><p class="col-kicker">03 / Read the building and the words</p><h2>A prescription.<br>A ruin. A restoration.</h2></div><p>The Latin gives the plan a name. The excavation publication records a particular building. Its clean restoration is an interpretation of remains, with porch and interior columns beyond our ring count.</p></div><div class="col-language">${colonnadeReadingHtml()}<aside id="col-word-note" class="col-word-note" aria-live="polite"><p class="col-kicker">A word in the instruction</p><h3 id="col-word-title"></h3><p id="col-word-meaning"></p><p id="col-word-explanation"></p></aside></div><p class="col-small">Latin: Vitruvius, edited by F. Krohn, 1912. Line-end hyphens are joined and the numeral is capitalized. The translations and reading notes are new. Greek headwords explain architectural vocabulary; they are not a Greek original of this Latin passage.</p>
<div id="col-sources" class="col-source-section"><div class="col-source-nav" aria-label="Select source image">${colonnadeSources.map((source) => `<button type="button" data-col-source="${source}" aria-pressed="false">${{ restored: "Restored plan", remains: "Preserved state", prescription: "Latin plan", apparatus: "34 / 38", capital: "Capital photograph" }[source]}</button>`).join("")}</div><h3 id="col-source-title" tabindex="-1"></h3><p id="col-source-note"></p><div class="col-source-tools"><label for="col-source-zoom">Enlarge source <input id="col-source-zoom" type="range" min="100" max="300" step="25" value="100"></label><button type="button" id="col-source-find">Find the passage</button><button type="button" id="col-source-top">Page top</button><a id="col-open-image" target="_blank" rel="noreferrer">Open full image ↗</a><a id="col-original">Original volume ↗</a></div><div id="col-source-pan" class="col-source-pan" tabindex="0" role="region" aria-label="Complete printed source image; scroll or use arrow keys to pan"><img id="col-source-image" alt=""></div><p id="col-source-error" role="status" hidden>The source image could not be loaded. Reconnect and reload, or follow the original volume link.</p><p class="col-small">Humann, Kohte &amp; Watzinger, <cite>Magnesia am Maeander</cite> (1904), pp. 41, 43, 55. Scans: Heidelberg University Library, Public Domain Mark. Latin scans: Internet Archive, public-domain 1912 edition. Images retain page borders, legends, apparatus and library credits.</p></div></section>
<section class="col-section col-limits"><h2>What the experiment<br>leaves open.</h2><div><p>${COLONNADE_LIMITS}</p><p>Vitruvius credits Hermogenes with this arrangement. The omission is a comparison of architectural schemes: it does not establish that the temple at Magnesia once had a complete double colonnade which was physically demolished.</p><p>The words <i lang="grc">δίπτερος</i> and <i lang="grc">ψευδοδίπτερος</i> describe arrangement. <i>Ionic</i> describes an architectural order. One label does not determine the other: compare the photographed capital with the plan.</p><p><a href="./spacing.html">Continue with the wider central entrance</a> · <a href="./transport.html">How did the stone reach the site?</a></p></div></section></main><footer><span>Gonia · a measured reading of ancient architecture</span><span id="col-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;

function setState(patch: Partial<ColonnadeState>, historyMode: "push" | "none" = "push") {
  state = normalizeColonnade({ ...state, ...patch });
  parsed.adjusted = false;
  if (historyMode === "push")
    history.pushState(null, "", `${location.pathname}${colonnadeQuery(state)}${location.hash}`);
  render();
}
function render() {
  const m = colonnadeModel(state),
    part = colonnadePartNotes[state.part];
  get("col-adjusted").hidden = !parsed.adjusted;
  get("col-plan").innerHTML = colonnadeDrawing(state);
  get("col-strip").innerHTML = colonnadeStrip(state);
  get("col-plan-portrait").innerHTML = colonnadePortrait(state);
  get("col-strip-portrait").innerHTML = colonnadePortraitStrip(state);
  for (const kind of ["double", "pseudo"] as ColonnadeKind[])
    get(`col-${kind}`).setAttribute("aria-pressed", String(kind === state.kind));
  get<HTMLInputElement>("col-gap").value = String(state.gap);
  get("col-gap-value").textContent = `${n(state.gap)} D`;
  document.querySelectorAll<HTMLButtonElement>("[data-col-part]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.colPart === state.part));
  });
  get("col-part-title").textContent = part.title;
  get("col-part-greek").textContent = part.greek;
  get("col-part-latin").textContent = part.latin;
  get("col-part-note").textContent = part.note;
  get<HTMLAnchorElement>("col-dictionary").href =
    `https://logeion.uchicago.edu/${encodeURIComponent(part.dictionary)}`;
  get("col-width-title").textContent =
    state.kind === "pseudo"
      ? `One clear strip of ${n(m.wideClear)} D`
      : `Two clear lanes of ${n(state.gap)} D`;
  get("col-width-note").textContent =
    state.kind === "pseudo"
      ? "The former shaft position becomes part of the passage. The outer row and the wall have not moved."
      : "At a column station the inner shaft occupies one diameter between two gaps. Removing it joins all three widths.";
  get("col-equation").textContent = `${n(state.gap)} + 1 + ${n(state.gap)} = ${n(m.wideClear)} D`;
  get<HTMLSelectElement>("col-ring").value = state.ring;
  get<HTMLInputElement>("col-count").max = state.ring === "outer" ? "42" : "34";
  get<HTMLInputElement>("col-count").value = String(state.count);
  get("col-count-value").textContent = `${state.count} / ${state.ring === "outer" ? 42 : 34}`;
  get<HTMLButtonElement>("col-count-next").disabled =
    state.count === (state.ring === "outer" ? 42 : 34);
  const selected = (state.ring === "outer" ? m.outer : m.inner)[state.count - 1];
  get("col-count-note").textContent = selected
    ? `${selected.id}: ${selected.side}${selected.corner ? ", corner counted here" : ""}. ${selected.present ? "Present" : "Omitted"} in this arrangement. Centre (${n(selected.x)}, ${n(selected.y)}) D.`
    : "Start at the upper corner of the front, then follow the lower flank, rear and upper flank.";
  const word = colonnadeWords[state.word];
  if (word) {
    get("col-word-title").textContent = word.label;
    get("col-word-title").lang = "la";
    get("col-word-meaning").textContent = word.meaning;
    get("col-word-explanation").textContent = word.note;
    document
      .querySelector(`[data-col-word="${state.word}"]`)
      ?.closest("article")
      ?.append(get("col-word-note"));
  }
  document.querySelectorAll<HTMLButtonElement>("[data-col-word]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.colWord) === state.word));
  });
  document.querySelectorAll<HTMLButtonElement>("button[data-col-source]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.colSource === state.source));
  });
  if (displayedSource !== state.source) {
    const source = colonnadeSourceInfo[state.source];
    displayedSource = state.source;
    get("col-source-title").textContent = source.title;
    get("col-source-note").textContent = source.note;
    get("col-source-find").textContent =
      state.source === "apparatus"
        ? "Find the apparatus entry"
        : state.source === "prescription"
          ? "Find the plan prescription"
          : "Centre the illustration";
    const img = get<HTMLImageElement>("col-source-image");
    const url = `${import.meta.env.BASE_URL}sources/colonnade/${source.file}`;
    get("col-source-error").hidden = true;
    img.src = url;
    img.alt = `${source.title}. Complete printed page, including its original legends and credits.`;
    img.width = source.width;
    img.height = source.height;
    get<HTMLAnchorElement>("col-open-image").href = url;
    get<HTMLAnchorElement>("col-original").href = source.original;
    get<HTMLInputElement>("col-source-zoom").value = "100";
    img.style.width = "100%";
    get("col-source-pan").scrollTo(0, 0);
  }
}
for (const kind of ["double", "pseudo"] as ColonnadeKind[])
  get(`col-${kind}`).addEventListener("click", () => setState({ kind }));
document.querySelectorAll<HTMLButtonElement>("[data-col-part]").forEach((b) => {
  b.addEventListener("click", () => setState({ part: b.dataset.colPart as ColonnadePart }));
});
for (const id of ["gap", "count"] as const) {
  get<HTMLInputElement>(`col-${id}`).addEventListener("input", (e) =>
    setState({ [id]: Number((e.target as HTMLInputElement).value) }, "none"),
  );
  get(`col-${id}`).addEventListener("change", () =>
    history.pushState(null, "", `${location.pathname}${colonnadeQuery(state)}${location.hash}`),
  );
}
get("col-ring").addEventListener("change", (e) =>
  setState({ ring: (e.target as HTMLSelectElement).value as ColonnadeRing, count: 0 }),
);
get("col-count-start").addEventListener("click", () => setState({ count: 0 }));
get("col-count-next").addEventListener("click", () => setState({ count: state.count + 1 }));
get("col-count-all").addEventListener("click", () =>
  setState({ count: state.ring === "outer" ? 42 : 34 }),
);
get("col-zoom").addEventListener("change", (e) => {
  for (const id of ["col-plan", "col-plan-portrait"])
    get(id).style.width = `${(e.target as HTMLSelectElement).value}%`;
});
document.querySelectorAll<HTMLElement>("[data-col-source]").forEach((el) => {
  el.addEventListener("click", () => setState({ source: el.dataset.colSource as ColonnadeSource }));
});
document.querySelectorAll<HTMLButtonElement>("[data-col-word]").forEach((b) => {
  b.addEventListener("click", () => {
    setState({ word: Number(b.dataset.colWord) });
    b.closest("article")?.append(get("col-word-note"));
    get("col-word-note").scrollIntoView({ block: "nearest" });
  });
});
get("col-source-image").addEventListener("error", () => {
  get("col-source-error").hidden = false;
});
get<HTMLInputElement>("col-source-zoom").addEventListener("input", (e) => {
  const pane = get("col-source-pan"),
    img = get<HTMLImageElement>("col-source-image");
  const fractionX = (pane.scrollLeft + pane.clientWidth / 2) / img.clientWidth;
  const fractionY = (pane.scrollTop + pane.clientHeight / 2) / img.clientHeight;
  img.style.width = `${(e.target as HTMLInputElement).value}%`;
  pane.scrollTo(
    fractionX * img.clientWidth - pane.clientWidth / 2,
    fractionY * img.clientHeight - pane.clientHeight / 2,
  );
});
get("col-source-find").addEventListener("click", async () => {
  const img = get<HTMLImageElement>("col-source-image"),
    pane = get("col-source-pan");
  try {
    await img.decode();
  } catch {
    return;
  }
  const zoom =
    state.source === "apparatus" && matchMedia("(max-width: 760px)").matches
      ? 200
      : matchMedia("(max-width: 760px)").matches
        ? 300
        : 175;
  get<HTMLInputElement>("col-source-zoom").value = String(zoom);
  img.style.width = `${zoom}%`;
  const focus =
    state.source === "apparatus"
      ? [0.66, 0.845]
      : state.source === "prescription"
        ? [0.5, 0.43]
        : [0.5, 0.45];
  pane.scrollTo(
    (focus[0] ?? 0.5) * img.clientWidth - pane.clientWidth / 2,
    (focus[1] ?? 0.5) * img.clientHeight - pane.clientHeight / 2,
  );
});
get("col-source-top").addEventListener("click", () => get("col-source-pan").scrollTo(0, 0));
get("col-share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.search = colonnadeQuery(state);
  try {
    await navigator.clipboard.writeText(url.href);
    get("col-action-status").textContent =
      "Link copied with this plan, count, word and source page.";
  } catch {
    get("col-share-fallback").hidden = false;
    const field = get<HTMLInputElement>("col-share-url");
    field.value = url.href;
    field.focus();
    field.select();
    get("col-action-status").textContent = "Copy the link from the selected field.";
  }
});
get("col-csv").addEventListener("click", () => {
  downloadColonnadeCsv(state);
  get("col-action-status").textContent =
    "Saved all 76 potential ring positions, with present/omitted status and coordinate units.";
});
get("col-save").addEventListener("click", async () => {
  const button = get<HTMLButtonElement>("col-save");
  button.disabled = true;
  get("col-action-status").textContent =
    "Preparing the reading and verifying all five source images…";
  try {
    await downloadColonnadeReading({ ...state });
    get("col-action-status").textContent =
      "Saved both arrangements, Latin, word notes and five complete source images for offline reading and printing.";
  } catch (e) {
    get("col-action-status").textContent =
      e instanceof Error ? e.message : "The reading could not be saved. Reconnect and retry.";
  } finally {
    button.disabled = false;
  }
});
window.addEventListener("popstate", () => {
  parsed = parseColonnade(location.search);
  state = parsed.state;
  render();
});
render();
void offlineStatus(get("col-offline"));
// A reset link remains an ordinary URL and is usable without clipboard access.
get("col-workshop").insertAdjacentHTML(
  "beforeend",
  `<p class="col-small"><a href="./colonnade.html${colonnadeQuery(COLONNADE_DEFAULT)}#col-workshop">Reset the chosen example</a></p>`,
);

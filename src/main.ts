import "./style.css";
import { sourcePassages, strategies, type Term, terms } from "./content";
import {
  buildCorner,
  number,
  readState,
  type Treatment,
  treatments,
  writeState,
} from "./core/corner";
import { elevation, escapeHtml, plan } from "./drawing";
import { offlineStatus } from "./offline";
import { downloadStudy } from "./study";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing application root");
let state = readState(location.search);
let selected: Term | null = null;
const compact = matchMedia("(max-width: 650px)");
app.innerHTML = `
<a class="skip" href="#workshop">Skip to the drawing</a>
<header class="masthead"><a class="wordmark" href="${import.meta.env.BASE_URL}"><span class="mark" aria-hidden="true">└</span> Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="#workshop">Doric corner</a><a href="./spacing.html">Column spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="#about">About</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a><a href="./optics.html">Viewpoint</a></nav></header>
<main>
<section class="introduction" aria-labelledby="title"><div><p class="eyebrow">A study in ancient Greek architecture</p><h1 id="title">Every rhythm<br>meets a corner.</h1></div><div class="intro-copy"><p>A row of columns. A rhythm of grooved blocks and square panels. Turn the corner of a Doric temple, and the two rhythms no longer agree.</p><p class="muted">Change the geometry. See what an architect has to give up.</p><a href="#workshop" class="text-link">Explore the Doric corner problem <span aria-hidden="true">↓</span></a></div></section>
<section id="workshop" class="workshop" aria-labelledby="workshop-title">
<div class="section-heading"><h2 id="workshop-title">The corner workshop</h2><span class="folio">01 / GEOMETRY</span></div>
<div class="workbench"><aside class="controls" aria-label="Model controls">
<label class="control-title" for="beam">1. Make the beam deeper</label><p class="control-hint">B is beam depth. T is triglyph width.<br>We keep T = 1 and the usual metope = 1.5 T.</p>
<div class="readout"><span>B / T</span><output id="beam-value" for="beam"></output></div><input id="beam" type="range" min="1" max="3" step="0.01" value="${state.beam}" aria-describedby="beam-hint"/><div class="range-ends"><span>1 · equal widths</span><span>3 · deeper beam</span></div><p id="beam-hint" class="control-hint">At B = T the conflict disappears. Increase B to see why it returns.</p>
<fieldset><legend>2. Choose the compromise</legend>${treatments.map((t, i) => `<label class="choice"><input type="radio" name="treatment" value="${t}" ${state.treatment === t ? "checked" : ""}/><span><small>0${i + 1}</small>${strategies[t].title}</span></label>`).join("")}</fieldset>
</aside>
<div class="drawing-area"><div class="drawing-heading"><h3>Front elevation</h3><span>Look at the first panel and column bay</span></div><div id="elevation"></div><div class="legend"><span><i class="axis-key"></i> Column axis</span><span><i class="offset-key"></i> Corner discrepancy</span><span class="unit-key">Dimensions in triglyph widths, T</span></div>
<div class="outcome" aria-live="polite" aria-atomic="true"><h3 id="outcome-title"></h3><p id="outcome-text"></p></div>
<details id="plan-details" open><summary>Plan from above <span>Why beam depth matters</span></summary><div id="plan"></div><p class="plan-note">Short bars project the triglyphs onto the outer faces. The corner column sits halfway across each beam: B / 2 from the outer faces. A triglyph flush with the corner has its centre only T / 2 from the edge. Their difference is the problem.</p></details>
</div><aside class="word-tools" aria-label="Vocabulary and study tools"><label class="control-title" for="term">3. Learn a part</label><select id="term"><option value="">No part highlighted</option>${terms.map((t) => `<option value="${t.id}">${t.english} · ${t.greek}</option>`).join("")}</select><div id="word-detail" class="word-detail"><p>Select a part to connect its English name with Greek and Latin.</p></div>
<button type="button" id="show-part" class="mobile-jump">View highlighted part ↑</button><div class="actions"><button type="button" id="reset">Reset</button><button type="button" id="share">Copy this view</button><button type="button" id="save">Save study</button></div><p id="action-status" role="status" class="control-hint"></p>
</aside></div>
<div class="measure-band"><div><span>The discrepancy</span><strong id="delta-value"></strong><small>δ = (B − T) / 2</small></div><div><span>First metope</span><strong id="metope-value"></strong><small>Usual width 1.5 T</small></div><div><span>End column bay</span><strong id="bay-value"></strong><small>Usual spacing 5 T, axis to axis</small></div><div><span>Corner triglyph</span><strong id="offset-value"></strong><small id="offset-note"></small></div></div>
<div class="comparison"><h3>What each choice preserves</h3><p>For the beam depth you have selected. “Aligned” here includes the corner column.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Treatment comparison; scroll horizontally to see all columns"><table><thead><tr><th scope="col">Treatment</th><th scope="col">Triglyph at corner</th><th scope="col">Equal metopes</th><th scope="col">Equal column bays</th><th scope="col">All column triglyphs aligned</th></tr></thead><tbody id="comparison-body"></tbody></table></div></div>
<p class="model-note">An idealized local corner, not a reconstruction of a named temple. One intermediate triglyph per bay; frieze height 1.5 T. Column profiles are illustrative. Actual temples have further adjustments, and the timber origins of the Doric order remain debated. <a href="#model">Read the model’s limits</a>.</p>
</section>
<section id="reading" class="reading" aria-labelledby="reading-title"><div class="section-heading"><h2 id="reading-title">An ancient author notices the problem</h2><span class="folio">02 / VITRUVIUS</span></div><div class="reading-intro"><p>Vitruvius describes these competing demands in <cite>De architectura</cite> IV.3.2. He is a Roman author writing about a Greek architectural tradition. He calls both compromises faulty; that is his judgment, not a verdict on the surviving buildings.</p><p class="muted">Latin from F. Krohn’s 1912 edition, pp. 82–83; punctuation adapted for sentence reading. English translation made for Gonia. <a href="${import.meta.env.BASE_URL}sources/vitruvius-82-83.pdf">Open the scanned pages (PDF)</a>.</p></div>
${sourcePassages.map((p, i) => `<article class="passage"><span class="passage-index">0${i + 1}</span><p lang="la">${p.latin}</p><div><p>${p.english}</p><p class="passage-note">${p.note}</p>${i === 2 || i === 3 ? `<button type="button" class="try-source" data-treatment="${i === 2 ? "widen" : "contract"}">See this at B = 2T <span aria-hidden="true">↑</span></button>` : ""}</div></article>`).join("")}
<p class="source-caution">His half-triglyph adjustment fits the workshop when B = 2T. At other depths, the geometric discrepancy changes. This workshop does not reconstruct the full temple scheme that he goes on to prescribe.</p></section>
<section id="about" class="about" aria-labelledby="about-title"><div class="section-heading"><h2 id="about-title">A small problem with a long history</h2><span class="folio">03 / NOTES</span></div><div class="about-columns"><div><h3 id="model">What the drawing assumes</h3><p>Two perpendicular beams of equal depth meet at their outer faces. The corner column is centred under their intersection. Triglyphs are 1 T wide; ordinary metopes are 1.5 T wide and high. Two triglyph pitches make a normal column bay of 5 T.</p><p>For a deeper beam, its half-depth exceeds a triglyph’s half-width. A regular frieze starting at the corner therefore shifts by δ = (B − T) / 2 relative to a regular colonnade. Contracting the first bay restores alignment at the next column. It leaves the corner triglyph itself off-axis.</p><p>We omit roof, sculpture, colour, entasis, load calculations and variation across a whole building. The slider is an experiment in ratios, not a catalogue of measured temple dimensions. The “equal widths” endpoint is a geometric limit, not an archaeological reconstruction.</p></div><div><h3>Sources you can follow</h3><ol class="sources"><li><a href="https://archive.org/details/vitruviidearchit00vitr_1/page/82/mode/2up">Vitruvius, <cite>De architectura</cite> IV.3.2</a>, ed. F. Krohn (Teubner, 1912), pp. 82–83. Source of the Latin passage and its two compromises. The bundled scan is public domain.</li><li><a href="https://doi.org/10.2307/507412">Mark Wilson Jones, “Doric Measure and Architectural Design 2: A Modular Reading of the Classical Temple”</a>, <cite>American Journal of Archaeology</cite> 105.4 (2001), pp. 675–713, especially fig. 2, p. 677. Basis for the corner geometry; Gonia’s drawings are newly generated from coordinates.</li><li><a href="https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n104870/">Liddell–Scott–Jones, <cite>A Greek–English Lexicon</cite></a>, via Perseus / Scaife ATLAS. Each Greek entry in the workshop links to its own dictionary source. Latin architectural terms occur in Vitruvius IV.2–3; <i lang="la">angulus</i> is the ordinary Latin word for corner.</li></ol><h3>Keep exploring</h3><p><a href="./spacing.html">The space between columns</a> follows Vitruvius’s five spacing systems. Change the front width, compare clear gaps with column axes, and find why the central entrance is wider.</p><p><a href="https://antonsoo.github.io/stoicheia/">Stoicheia</a> puts another ancient Greek problem on the drawing board: Euclid’s constructions, read in Greek, Latin and English.</p><p>Gonia is free, open source, and runs in your browser. Saving a study downloads a self-contained HTML document. The workshop and scanned passage are available offline after the offline indicator confirms the download.</p></div></div></section>
</main><footer><span>Gonia · <span lang="grc">γωνία</span> · a corner, an angle</span><span id="offline" role="status">Preparing offline workshop…</span><a href="https://github.com/antonsoo/gonia">Source &amp; license</a></footer>`;

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing ${id}`);
  return e as T;
}
function draw(): void {
  const c = buildCorner(state);
  byId("elevation").innerHTML = elevation(c, selected, compact.matches);
  byId("plan").innerHTML = plan(c, selected, compact.matches);
  byId<HTMLOutputElement>("beam-value").value = `${number(state.beam)} T`;
  byId<HTMLInputElement>("beam").value = String(state.beam);
  document.querySelectorAll<HTMLInputElement>('[name="treatment"]').forEach((e) => {
    e.checked = e.value === state.treatment;
  });
  byId("outcome-title").textContent =
    c.discrepancy === 0
      ? "At equal widths, the conflict disappears"
      : strategies[state.treatment].short;
  byId("outcome-text").textContent =
    c.discrepancy === 0
      ? "The beam and triglyph are equally wide, so both centres sit 0.5 T from the corner. All three treatments coincide. Increase the beam depth to separate them."
      : strategies[state.treatment].text;
  byId("delta-value").textContent = `${number(c.discrepancy)} T`;
  byId("metope-value").textContent = `${number(c.metopes[0]?.width ?? 0)} T`;
  byId("bay-value").textContent = `${number(c.bays[0] ?? 0)} T`;
  byId("offset-value").textContent = `${number(c.cornerOffset)} T off-axis`;
  byId("offset-note").textContent = `Strip before triglyph: ${number(c.cornerGap)} T`;
  byId("comparison-body").innerHTML = treatments
    .map((t) => {
      const m = buildCorner({ ...state, treatment: t });
      const yes = (v: boolean) =>
        `<td class="${v ? "preserved" : "changed"}">${v ? "Yes" : "No"}</td>`;
      return `<tr${t === state.treatment ? ' class="current"' : ""}><th scope="row">${strategies[t].title}${t === state.treatment ? '<span class="current-label">Selected</span>' : ""}</th>${yes(m.cornerGap === 0)}${yes(Math.abs((m.metopes[0]?.width ?? 0) - m.metopeWidth) < 1e-9)}${yes(Math.abs((m.bays[0] ?? 0) - m.normalBay) < 1e-9)}${yes(m.cornerOffset === 0)}</tr>`;
    })
    .join("");
  const term = terms.find((t) => t.id === selected);
  byId("word-detail").innerHTML = term
    ? `<h3>${term.english}</h3><p class="word-greek" lang="grc">${term.greek}</p><p>${term.transliteration} <span class="muted">· transliteration</span></p><p><span class="muted">Latin</span> <i lang="la">${term.latin}</i></p><p>${term.meaning}</p><p class="control-hint">${term.grammar} <a href="${term.source}">Greek dictionary entry</a>.</p>`
    : "<p>Select a part to connect its English name with Greek and Latin.</p>";
  byId<HTMLSelectElement>("term").value = selected ?? "";
}
function update(push = false): void {
  const search = writeState(state);
  if (location.search !== search)
    history[push ? "pushState" : "replaceState"](
      null,
      "",
      `${location.pathname}${search}${location.hash}`,
    );
  draw();
}
byId<HTMLInputElement>("beam").addEventListener("input", (e) => {
  state = { ...state, beam: Number((e.target as HTMLInputElement).value) };
  update();
});
document.querySelectorAll<HTMLInputElement>('[name="treatment"]').forEach((e) => {
  e.addEventListener("change", () => {
    state = { ...state, treatment: e.value as Treatment };
    update(true);
  });
});
byId<HTMLSelectElement>("term").addEventListener("change", (e) => {
  selected = ((e.target as HTMLSelectElement).value as Term) || null;
  draw();
});
byId("show-part").addEventListener("click", () => {
  byId("elevation").scrollIntoView();
});
byId("reset").addEventListener("click", () => {
  state = { beam: 2, treatment: "align" };
  selected = null;
  update(true);
  byId("action-status").textContent = "Reset to a beam depth of 2 T.";
});
byId("share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.search = writeState(state);
  url.hash = "workshop";
  try {
    await navigator.clipboard.writeText(url.href);
    byId("action-status").textContent = "Link copied with this beam depth and treatment.";
  } catch {
    byId("action-status").innerHTML =
      `<label for="share-link">Copy this link:</label><input id="share-link" readonly value="${escapeHtml(url.href)}"/>`;
    byId<HTMLInputElement>("share-link").select();
  }
});
byId("save").addEventListener("click", () => {
  downloadStudy(buildCorner(state));
  byId("action-status").textContent =
    "Study saved with the drawings, measurements and source passage.";
});
document.querySelectorAll<HTMLButtonElement>(".try-source").forEach((e) => {
  e.addEventListener("click", () => {
    state = { beam: 2, treatment: e.dataset.treatment as Treatment };
    update(true);
    byId("workshop").scrollIntoView();
    byId<HTMLInputElement>("beam").focus({ preventScroll: true });
  });
});
addEventListener("popstate", () => {
  state = readState(location.search);
  draw();
});
compact.addEventListener("change", draw);
draw();
if (location.hash === "#workshop")
  requestAnimationFrame(() => {
    byId("workshop").scrollIntoView();
  });
void offlineStatus(byId("offline"));

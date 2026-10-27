import "./style.css";
import "./volute.css";
import manifest from "../public/sources/volute/manifest.json";
import {
  openVoluteRecord,
  PRINTED_SEQUENCE,
  quarterArc,
  readVoluteQuery,
  repairJoin,
  VOLUTE_DEFAULT,
  VOLUTE_PINS,
  type VoluteState,
  voluteCsv,
  voluteQuery,
  voluteRecord,
  voluteSummary,
} from "./core/volute";
import { offlineStatus } from "./offline";
import { voluteAsset } from "./volute-assets";
import {
  VOLUTE_LIMITS,
  ve,
  vn,
  volutePages,
  voluteReadingHtml,
  voluteWordHtml,
} from "./volute-content";
import { joinDrawing, voluteDrawing } from "./volute-drawing";
import { saveVolute, voluteStudy, voluteSvg, voluteTable } from "./volute-files";

let state: VoluteState;
let initialError = "";
try {
  state = readVoluteQuery(location.search);
} catch (error) {
  state = { ...VOLUTE_DEFAULT, moves: [...VOLUTE_DEFAULT.moves] };
  initialError = `${(error as Error).message} The opening example is shown.`;
}
const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing application root");
app.innerHTML = `<a class="skip" href="#vo-bench">Skip to the compass desk</a>
<header class="vo-masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./fluting.html">Column flutes</a><a href="#vo-reading">Read Vitruvius</a><a href="#vo-keep">Keep the drawing</a></nav></header>
<main class="vo-main"><section class="vo-intro"><div><p class="vo-kicker">Ionic volute · a compass desk</p><h1>The compass<br>changes centre.</h1></div><div><p>Place twelve pins to draw an Ionic scroll. Then inspect a join: do the curves merely meet, or do they turn in the same direction?</p><p class="vo-note">Vitruvius gives dimensions and promises a figure. The drawing desk uses a separate, much later guide: the 1889 English Vignola.</p><a href="#vo-bench">Put the compass on the sheet ↓</a></div></section>
<section id="vo-bench" aria-labelledby="vo-bench-title"><div class="vo-section-head"><h2 id="vo-bench-title">Choose a centre. Draw a quarter.</h2><p>Solid ink is committed. Dashes preview your next choice.</p></div><div class="vo-bench"><div class="vo-sheet"><div id="vo-drawing"></div><p id="vo-sequence" class="vo-sequence"></p><p id="vo-result" role="status"></p></div><aside class="vo-controls" aria-label="Compass controls"><h3>The eye, enlarged</h3><p class="vo-note">The eye’s centre is the cross. Numbered pins are separate compass centres; choose one.</p><div class="vo-pin-map"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="59"/><path d="M60 1 L119 60 L60 119 L1 60 Z M30 30 L90 90 M30 90 L90 30 M56 60 H64 M60 56 V64"/></svg>${VOLUTE_PINS.map((p, i) => `<button type="button" class="vo-pin" data-pin="${i + 1}" style="left:${50 + (p.x / 12) * 100}%;top:${50 - (p.y / 12) * 100}%" aria-pressed="false" aria-label="Centre ${i + 1}, x ${vn(p.x / 12)} e, y ${vn(p.y / 12)} e">${i + 1}</button>`).join("")}</div><p id="vo-pin-note" class="vo-coordinate"></p><button type="button" id="vo-draw" class="vo-primary">Draw quarter circle</button><div class="vo-actions"><button type="button" id="vo-guide-pin">Select the next printed pin</button><button type="button" id="vo-undo">Undo last arc</button></div><p id="vo-next" class="vo-note"></p><details><summary>Other starting sheets</summary><div class="vo-actions"><button type="button" id="vo-empty">Start with an empty sheet</button><button type="button" id="vo-complete">Draw the full printed sequence</button><button type="button" id="vo-repeat">Try repeating centre 4</button></div><p class="vo-note">Repeating a pin is a deliberate counterexample. Your actual choices remain in the saved record.</p></details></aside></div>
<div class="vo-inspection"><div><p class="vo-kicker">Meeting and turning</p><h2>A shared point<br>is only half the question.</h2><label for="vo-join">Inspect a direction after</label><select id="vo-join"></select><div id="vo-join-drawing"></div><p id="vo-join-note"></p></div><div class="vo-repair"><h3>Move one compass pin</h3><p>For two circular arcs to meet with the same tangent, their two centres and the meeting point must lie on one line, with the radii pointing the same way.</p><button type="button" id="vo-repair" aria-pressed="false">Align the next centre</button><p id="vo-repair-note" aria-live="polite"></p><p class="vo-note">This is a local modern intervention. It moves one next centre, then draws another 90° arc. It does not alter your committed outline, move the eye circle, or propose a lost ancient recipe.</p></div></div>
<details class="vo-measurements"><summary>Inspect coordinates, compass radii and every join</summary><div class="vo-table-pan" tabindex="0" role="region" aria-label="Compass measurements; scroll horizontally if needed" id="vo-table"></div></details><p class="vo-boundary">${VOLUTE_LIMITS}</p></section>
<section id="vo-reading"><div class="vo-section-head"><h2>The ancient instruction.<br>The later drawing.</h2><p>Latin with new English and grammar notes. The brackets matter.</p></div><p>Vitruvius, <cite>De architectura</cite> III.5.5–8, Krohn’s 1912 edition, pp. 71–72. Line wraps and end-of-line hyphens are removed; punctuation is lightly regularized. Angle-bracketed supplements remain visible. Greek headwords below explain technical borrowings; they are not a Greek original of this Latin text.</p><p><button type="button" data-vo-page="6">Compare with the surviving Sardis capital</button> The museum photograph records a restored display, not a test of our compass recipe.</p><div class="vo-readings">${voluteReadingHtml()}</div><details class="vo-words"><summary>Read seven words from the drawing desk</summary><dl>${voluteWordHtml()}</dl></details>
<div class="vo-source"><h3>Inspect the page or the surviving capital</h3><label for="vo-page">Source page</label><select id="vo-page">${volutePages.map((p, i) => `<option value="${i}">${p.title}</option>`).join("")}</select><p id="vo-source-note"></p><div class="vo-source-actions"><button type="button" id="vo-zoom" aria-pressed="false">Enlarge source page</button><a id="vo-source-image" target="_blank" rel="noopener">Open verified image</a><a id="vo-source-original" target="_blank" rel="noopener">Original source record</a></div><figure><div id="vo-source-frame" class="vo-source-frame" tabindex="0" role="region" aria-label="Complete printed source; use arrow keys to pan when enlarged"></div><figcaption id="vo-source-caption" role="status"></figcaption></figure><p class="vo-note">Whole pages, including the apparatus. ${manifest.derivation} The later plate’s line is not precision evidence for an actual ancient capital.</p></div></section>
<section id="vo-keep"><div class="vo-section-head"><h2>Take the compass<br>back to paper.</h2><p>Keep the actual pin sequence, source pages and measurements.</p></div><div class="vo-keep-grid"><div><label for="vo-eye">Printed eye diameter</label><div class="vo-eye-control"><input id="vo-eye" type="number" min="6" max="18" step="1"><span>mm · a chosen model size</span></div><p class="vo-note">The SVG has physical millimetre dimensions and a 50 mm calibration bar. Print at 100% and check the bar. An unusually wide sequence can require a sheet larger than A4; its dimensions are written on the sheet.</p><div class="vo-actions"><button type="button" id="vo-save-svg">Save compass sheet (SVG)</button><button type="button" id="vo-save-html">Save illustrated reading (HTML)</button></div></div><div><h3>Continue the same experiment</h3><div class="vo-actions"><button type="button" id="vo-save-json">Save editable JSON</button><button type="button" id="vo-save-csv">Save measurements (CSV)</button><button type="button" id="vo-share">Copy drawing link</button></div><label for="vo-open">Reopen a saved JSON</label><input id="vo-open" type="file" accept=".json,application/json"><p class="vo-note">The illustrated reading opens without scripts or a connection. It contains all six full source pages, the museum photograph, fonts, licenses, the drawing and the native files above.</p></div></div><p id="vo-action-status" role="status">${ve(initialError)}</p><details class="vo-method"><summary>How the exact construction is calculated</summary><p>Set e/12 as the coordinate unit. The eye is centred on (0,0), its radius is 6 and the start is (0,54). The first four centres use (±3,±3); the next four use (±2,±2); the last four use (±1,±1), starting at upper left and continuing clockwise in each group.</p><p>A quarter turn maps P to C + (Pᵧ − Cᵧ, −Pₓ + Cₓ). These coordinates and squared radii stay integers. Angles use atan2 of the absolute cross product and dot product of the two radius vectors. The full printed sequence ends at (0,6): contact with the eye is exact, while its final direction difference is about 8.13°. The guide’s axis distances are not its compass radii.</p><p>The local alignment projects the next centre onto the incoming radius. Its floating-point result is used only for the inspection overlay. The saved committed arcs stay exact quarter circles. This is an interpretation of this edition’s named points and centre divisions, not a claim about all historical volute constructions.</p><p><a href="https://architectura.univ-tours.fr/en/livres-notice/goldman1649c490/">Losito’s research notice on Goldmann</a> explains another later construction and its different continuity choices. The desk does not implement Goldmann’s design.</p><p><a href="./fluting.html">Continue with the cuts in a column</a> or <a href="./">return to the Doric corner</a>.</p></details></section></main><footer class="vo-footer"><a href="./">Gonia · measured ancient architecture</a><span id="vo-offline" role="status">Preparing offline workshop…</span><a href="https://github.com/antonsoo/gonia">Source &amp; license</a></footer>`;

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
}
const say = (text: string) => {
  el("vo-action-status").textContent = text;
};
function draw(): void {
  const m = voluteSummary(state);
  if (!m.joins.some((j) => j.index === state.join)) state.join = m.joins.at(-1)?.index ?? 1;
  document.querySelectorAll<HTMLButtonElement>("[data-pin]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.pin) === state.pin));
  });
  el("vo-drawing").innerHTML = voluteDrawing(state);
  el("vo-sequence").textContent = `Your pins: ${state.moves.join(" → ") || "none yet"}`;
  el("vo-result").textContent =
    state.moves.length === 12
      ? `${m.onEye ? "The endpoint is exactly on the eye." : `The endpoint misses the eye by ${vn(m.radialGap)} e radially (negative means inside).`} ${m.followsPrint ? "Contact alone does not establish a shared tangent. Inspect the eye contact below." : "This is the result of your actual pin choices, which differ from the printed sequence."}`
      : `${state.moves.length} quarter circles committed. ${m.followsPrint ? "The sequence follows the guide so far." : "Your choices differ from the printed sequence."}`;
  const p = VOLUTE_PINS[state.pin - 1];
  if (!p) return;
  el("vo-pin-note").textContent = `Pin ${state.pin} · (${vn(p.x / 12)}, ${vn(p.y / 12)}) e`;
  el<HTMLButtonElement>("vo-draw").disabled = state.moves.length === 12;
  el<HTMLButtonElement>("vo-guide-pin").disabled = state.moves.length === 12;
  el<HTMLButtonElement>("vo-undo").disabled = !state.moves.length;
  const next = state.moves.length < 12 ? quarterArc(m.end, state.pin) : null;
  el("vo-next").textContent = next
    ? `This choice uses radius ${vn(Math.sqrt(next.radiusSquared) / 12)} e. The guide’s next pin is ${state.moves.length + 1}.`
    : "All twelve quarters are drawn. Undo, start again or inspect a join.";

  el<HTMLSelectElement>("vo-join").innerHTML = m.joins
    .map(
      (j) =>
        `<option value="${j.index}">${j.eye ? "Arc 12 → eye circle" : `Arc ${j.index} → arc ${j.index + 1}`}</option>`,
    )
    .join("");
  el<HTMLSelectElement>("vo-join").value = String(state.join);
  el<HTMLSelectElement>("vo-join").disabled = !m.joins.length;
  const j = m.joins.find((j) => j.index === state.join),
    repair = j && !j.eye ? repairJoin(j) : null;
  el("vo-join-drawing").innerHTML = joinDrawing(j, Boolean(state.repair && repair));
  el("vo-join-note").textContent = j
    ? j.angle === null
      ? "A zero-radius arc has no tangent direction to compare. Choose another join."
      : `${j.eye && !m.onEye ? "The endpoint is away from the eye, so this is only a direction comparison, not an actual join. " : ""}The two radius directions differ by ${vn(j.angle)}°. ${j.tangent ? "They have the same tangent here." : "Their tangents turn by the same angle."}`
    : "Draw at least two arcs to compare their directions.";
  el<HTMLButtonElement>("vo-repair").disabled = !repair;
  el("vo-repair").setAttribute("aria-pressed", String(Boolean(state.repair && repair)));
  el("vo-repair").textContent =
    state.repair && repair ? "Restore the chosen centre" : "Align the next centre";
  el("vo-repair-note").textContent =
    repair && state.repair
      ? `The next centre becomes (${vn(repair.centre.x / 12)}, ${vn(repair.centre.y / 12)}) e. The tangent difference becomes 0°. Its next endpoint moves ${vn(repair.displacement)} e (${vn(repair.displacement * state.eye)} mm at your print size). The original endpoint remains on the sheet for comparison.`
      : j?.eye
        ? "The eye is a fixed circle, not a movable next compass pin. Choose an earlier join to try a local alignment."
        : "Choose Align the next centre to project it onto the arriving radius. Compare the green next arc with the committed one.";
  el("vo-table").innerHTML = voluteTable(state);
  el<HTMLInputElement>("vo-eye").value = String(state.eye);
  el<HTMLSelectElement>("vo-page").value = String(state.page);
}
function chooseMoves(moves: number[]) {
  state.moves = [...moves];
  state.pin = Math.min(12, moves.length + 1);
  state.join = moves.length === 12 ? 12 : Math.max(1, moves.length - 1);
  state.repair = false;
  draw();
}
document.querySelectorAll<HTMLButtonElement>("[data-pin]").forEach((b) => {
  b.addEventListener("click", () => {
    state.pin = Number(b.dataset.pin);
    draw();
  });
});
el("vo-draw").addEventListener("click", () => {
  if (state.moves.length < 12) chooseMoves([...state.moves, state.pin]);
});
el("vo-guide-pin").addEventListener("click", () => {
  state.pin = Math.min(12, state.moves.length + 1);
  draw();
});
el("vo-undo").addEventListener("click", () => chooseMoves(state.moves.slice(0, -1)));
el("vo-empty").addEventListener("click", () => chooseMoves([]));
el("vo-complete").addEventListener("click", () => chooseMoves(PRINTED_SEQUENCE));
el("vo-repeat").addEventListener("click", () =>
  chooseMoves([1, 2, 3, 4, 4, 6, 7, 8, 9, 10, 11, 12]),
);
el("vo-join").addEventListener("change", () => {
  state.join = Number(el<HTMLSelectElement>("vo-join").value);
  state.repair = false;
  draw();
});
el("vo-repair").addEventListener("click", () => {
  state.repair = !state.repair;
  draw();
});
el("vo-eye").addEventListener("change", () => {
  const value = el<HTMLInputElement>("vo-eye").valueAsNumber;
  if (!Number.isInteger(value) || value < 6 || value > 18) {
    say("Choose an eye diameter from 6 to 18 whole millimetres.");
    draw();
    return;
  }
  state.eye = value;
  draw();
});

let pageAttempt = 0,
  sourceUrl: string | null = null;
async function loadPage(): Promise<void> {
  const attempt = ++pageAttempt,
    page = volutePages[state.page];
  if (!page) return;
  el("vo-source-frame").setAttribute("aria-busy", "true");
  el("vo-source-frame").replaceChildren();
  el<HTMLAnchorElement>("vo-source-image").removeAttribute("href");
  el<HTMLAnchorElement>("vo-source-original").href =
    `${manifest.originals[page.source as keyof typeof manifest.originals].url}${page.pdfPage ? `#page=${page.pdfPage}` : ""}`;
  el("vo-source-caption").textContent = "Loading and checking the selected page…";
  el("vo-source-note").textContent = page.note;
  try {
    const bytes = await voluteAsset(`sources/volute/${page.file}`);
    if (attempt !== pageAttempt) return;
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    const img = new Image();
    img.src = url;
    img.alt = `${page.title}; complete source page including margins`;
    try {
      await img.decode();
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    if (attempt !== pageAttempt) {
      URL.revokeObjectURL(url);
      return;
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = url;
    el("vo-source-frame").replaceChildren(img);
    el<HTMLAnchorElement>("vo-source-image").href = url;
    el("vo-source-caption").textContent =
      `${page.title}. ${page.pdfPage ? `Whole PDF page ${page.pdfPage}` : "Whole museum photograph"}; ${page.width} × ${page.height} pixels. Image identity verified.`;
    el("vo-source-frame").scrollTo(0, 0);
  } catch (error) {
    if (attempt === pageAttempt)
      el("vo-source-caption").textContent =
        `${(error as Error).message} Select the page again to retry.`;
  } finally {
    if (attempt === pageAttempt) el("vo-source-frame").setAttribute("aria-busy", "false");
  }
}
el("vo-page").addEventListener("change", () => {
  state.page = Number(el<HTMLSelectElement>("vo-page").value);
  void loadPage();
});
document.querySelectorAll<HTMLButtonElement>("[data-vo-page]").forEach((b) => {
  b.addEventListener("click", () => {
    state.page = Number(b.dataset.voPage);
    el<HTMLSelectElement>("vo-page").value = String(state.page);
    void loadPage();
    el("vo-page").focus();
  });
});
el("vo-zoom").addEventListener("click", () => {
  const enlarged = el("vo-source-frame").classList.toggle("vo-enlarged");
  el("vo-zoom").setAttribute("aria-pressed", String(enlarged));
  el("vo-zoom").textContent = enlarged ? "Fit source page" : "Enlarge source page";
  if (enlarged) el("vo-source-frame").focus();
});
function save(
  id: string,
  operation: (s: VoluteState) => Promise<string> | string,
  name: string,
  mime: string,
) {
  const button = el<HTMLButtonElement>(id);
  button.addEventListener("click", async () => {
    const snapshot = structuredClone(state);
    button.disabled = true;
    say("Preparing your file…");
    try {
      const data = await operation(snapshot);
      saveVolute(data, name, mime);
      say(`Saved ${name}.`);
    } catch (error) {
      say((error as Error).message);
    } finally {
      button.disabled = false;
    }
  });
}
save("vo-save-json", voluteRecord, "gonia-volute.json", "application/json");
save("vo-save-csv", voluteCsv, "gonia-volute.csv", "text/csv");
save("vo-save-svg", voluteSvg, "gonia-volute-compass.svg", "image/svg+xml");
save("vo-save-html", voluteStudy, "gonia-volute-reading.html", "text/html");
el("vo-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}${voluteQuery(state)}#vo-bench`;
  try {
    await navigator.clipboard.writeText(url);
    say("Drawing link copied. It keeps your pin choices and inspection settings.");
  } catch {
    say(`Copy this drawing link: ${url}`);
  }
});
el("vo-open").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("vo-open"),
    file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 16000) throw new Error("Choose a volute JSON record smaller than 16 KB.");
    const opened = openVoluteRecord(await file.text());
    state = opened;
    draw();
    void loadPage();
    say("Drawing record reopened; your pin choices and settings are restored.");
  } catch (error) {
    say((error as Error).message);
  } finally {
    input.value = "";
  }
});
window.addEventListener("popstate", () => {
  try {
    state = readVoluteQuery(location.search);
    draw();
    void loadPage();
  } catch (error) {
    say((error as Error).message);
  }
});
draw();
void loadPage();
void offlineStatus(el("vo-offline"));

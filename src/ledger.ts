import "./style.css";
import "./ledger.css";
import {
  type LedgerState,
  ledgerCSV,
  ledgerModel,
  ledgerQuery,
  money,
  readLedger,
} from "./core/ledger";
import {
  LEDGER_AIO,
  LEDGER_EDITION,
  LEDGER_LIMITS,
  LEDGER_MUSEUM,
  LEDGER_VOLUME,
  type LedgerEntry,
  ledgerEntries,
  ledgerPages,
  ledgerPeople,
  ledgerWords,
} from "./ledger-content";
import { le, ledgerNumeral, ledgerRemainder } from "./ledger-drawing";
import { ledgerAsset, ledgerStudy, saveLedger } from "./ledger-files";
import { offlineStatus } from "./offline";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
}
const initial = readLedger(location.search);
let state: LedgerState = initial.state;
let page = ledgerEntries[state.entry].page as string;
let sourceRevision = 0,
  sourceUrl = "";
let committed = ledgerQuery(state);
el("app").innerHTML =
  `<a class="skip" href="#lg-workshop">Skip to the ledger</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./spacing.html">Spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html">Sounding vessels</a><a href="./hoist.html">Hoist</a><a href="./optics.html">Viewpoint</a><a href="./screw.html">Water screw</a><a href="./ledger.html" aria-current="page">Building accounts</a></nav></header>
<main><section class="lg-intro"><h1>Seven names,<br>one uneven obol.</h1><div><p>The Erechtheion’s columns preserve the work. A building account preserves the names: Simias, Kerdon, Sindron, Sokles, Sannion, Epieikes, Sosandros.</p><p>Divide a recorded total among them. Then see why getting the sum right does not recover the ancient entry.</p><a href="#lg-reading">Read the Greek and inspect the printed pages</a></div></section>
<p class="lg-warning" id="lg-invalid" role="status" ${initial.invalid ? "" : "hidden"}>Invalid or repeated ledger settings. The complete starting experiment has been restored.</p>
<section class="lg-workshop" id="lg-workshop" aria-labelledby="lg-title"><div class="lg-choice"><div><h2 id="lg-title" tabindex="-1">Share the total in whole obols.</h2><p class="lg-note">Erechtheion, 408/7 BCE. Two entries, the same seven names.</p></div><div class="lg-entry-buttons" role="group" aria-label="Account entry"><button type="button" data-lg-entry="90">90 drachmas<small>Earlier entry</small></button><button type="button" data-lg-entry="100">100 drachmas<small>Later entry</small></button></div></div>
<div class="lg-layout"><div><div class="lg-ledger" role="group" aria-label="Allocate the remainder among seven named workers"><div class="lg-head" aria-hidden="true"><span>Name in the account</span><span>Your allocation</span><span class="lg-record-heading">Edited record</span></div>${ledgerPeople.map((p, i) => `<div class="lg-row" data-lg-row="${i}"><button type="button" class="lg-person" data-lg-person="${i}" aria-controls="lg-person-detail"><strong>${le(p.name)}</strong><span lang="grc">${le(p.greek)}</span></button><div><output class="lg-money" id="lg-your-${i}" for="lg-extra-${i}"></output><label for="lg-extra-${i}"><input type="checkbox" id="lg-extra-${i}" data-lg-extra="${i}" aria-label="Add one obol to ${le(p.name)}">Add one obol</label></div><span class="lg-unrevealed" id="lg-hidden-${i}">Reveal below</span><span class="lg-record" id="lg-record-${i}" hidden></span></div>`).join("")}</div><div class="lg-actions"><button type="button" id="lg-reveal" class="lg-primary">Reveal the account</button><button type="button" id="lg-clear">Clear extra obols</button><button type="button" id="lg-copy" hidden>Use the recorded distribution</button></div><p id="lg-result" class="lg-result" role="status"></p></div>
<aside class="lg-aside" aria-label="How the division works"><div><h3>Six obols.<br>One drachma.</h3><p id="lg-division"></p><div id="lg-remainder"></div></div><div><p>Every name starts with the same whole-obol amount. Use the checkboxes to place the remainder, at most one extra obol per name.</p><p id="lg-options"></p><p class="lg-note">This is a modern arithmetic exercise. The account does not explain why particular names receive the extra obols.</p></div></aside></div>
<p class="lg-note lg-full-note">The source amounts are an edited reading of a damaged inscription. Some names and numeral signs are restored. “Recorded” means present in that reading, including restorations; it does not mean every sign survives on the stone.</p></section>
<section class="lg-section" id="lg-reading" aria-labelledby="lg-reading-title"><div class="lg-reading"><div><h2 id="lg-reading-title" tabindex="-1">A name is more<br>than a number.</h2><p>Select a name above. Inspect its identifier, amount and corresponding lines.</p><div id="lg-person-detail" class="lg-profile" aria-live="polite"></div><div id="lg-money-detail" class="lg-money-detail"></div><button type="button" id="lg-find">Find this name on the Greek page</button><p class="lg-note lg-full-note">Greek name aids join split words and retain older Attic spellings; selected long vowels use the later alphabet. These aids do not reproduce restoration brackets. Consult the complete printed page and <a href="./sources/ledger/ig-476-excerpt.xml" download>the licensed edited Greek excerpt (XML)</a>.</p>
<div class="lg-words" role="group" aria-label="Greek words from the account">${ledgerWords.map((w, i) => `<button type="button" lang="grc" data-lg-word="${i}" aria-controls="lg-word-note">${w.word}</button>`).join("")}</div><div class="lg-word-note" id="lg-word-note" aria-live="polite"></div></div>
<div><div class="lg-source-control"><label for="lg-page">Complete printed evidence<select id="lg-page">${ledgerPages.map((p) => `<option value="${p.id}">${p.label}</option>`).join("")}</select></label><button type="button" id="lg-retry">Reload source</button></div><p id="lg-source-note" class="lg-note lg-source-note" role="status"></p><label for="lg-zoom">Page size <output id="lg-zoom-value" for="lg-zoom">100%</output></label><input type="range" id="lg-zoom" min="100" max="250" step="25" value="100"><div class="lg-source-pan" id="lg-source-pan" tabindex="0" role="region" aria-label="Complete printed source; use arrow keys to pan"><div class="lg-source-sheet" id="lg-source-sheet"><img id="lg-source-image" width="1600" height="2196" alt=""><span id="lg-source-band" class="lg-source-band" hidden></span></div><p class="lg-source-error" id="lg-source-error" role="status" hidden></p></div><p id="lg-lines" class="lg-note lg-source-note"></p><p class="lg-note">Caskey’s 1927 printed edition, not a photograph of the stone. The outline marks a line band, not individual surviving letters. Number signs are additive; an obol stroke is not a decimal digit.</p><div class="lg-actions"><a id="lg-original">Open this page in the original volume</a><a href="./sources/ledger/manifest.json">Provenance and file identities</a></div></div></div></section>
<section class="lg-section lg-two"><div><h2>The worker,<br>the owner, the entry.</h2><p>The current IG and AIO readings interpret five possessive identifiers in the earlier entry as ownership of enslaved workers. “Of Simias” is a grammatical relationship; the legal interpretation comes from scholarship and context.</p><p>An amount beside a name does not establish who received the money, kept it or decided how it was used. Kerdon has no status identifier in these excerpts. Simias’s place of residence does not establish citizenship.</p><a href="${LEDGER_AIO}">Compare Lambert and Osborne’s translation and commentary</a></div><div><h2>Two entries,<br>not two daily wages.</h2><p>Both entries belong to the eighth prytany. Caskey interprets the repeated teams as successive stages of fluting the east columns. This activity uses only two sums, not his proposed complete-column cost.</p><p>The 1927 English translation renders possessive identifiers as family relationships. This lesson follows the current ownership interpretation instead. The retained Greek pages let you inspect the underlying text.</p><p>The sums can be exact while the evidence is incomplete. A bracketed restoration remains a restoration after you add the numbers.</p><a href="${LEDGER_MUSEUM}">Inspect the Acropolis Museum record for EM 6667 δ</a></div></section>
<section class="lg-section lg-two"><div><h2>Keep the names<br>beside the numbers.</h2><p>Save your allocation, both edited entries, contextual Greek notes, four complete source pages, fonts and licenses in one illustrated HTML reading. It opens and prints offline.</p><p>The CSV keeps your figures and the edited figures in separate columns, in exact integer obols.</p><div class="lg-actions"><button type="button" id="lg-save" class="lg-primary">Save illustrated reading</button><button type="button" id="lg-csv">Save comparison (CSV)</button><button type="button" id="lg-share">Share this allocation</button></div><p id="lg-save-status" class="lg-save-status" role="status"></p><label id="lg-share-label" class="lg-share-label" for="lg-share-url" hidden>Link to this allocation<input type="url" id="lg-share-url" readonly></label></div><div><h2>Where the evidence stops.</h2><p>${LEDGER_LIMITS}</p><p><a href="${LEDGER_EDITION}">IG I³ 476, digital edition</a>, Berlin-Brandenburg Academy of Sciences and Humanities, CC BY 4.0. The linked excerpt retains the selected edited text and markup, with a new attribution header. New English explanations, drawings and activity: Anton Soloviev, 2026, MIT.</p><p><a href="${LEDGER_VOLUME}">Paton, ed., The Erechtheum (1927)</a>, inscription section by Lacey Davis Caskey. Getty Research Institute scan via Internet Archive. Complete public-domain printed pages. Modern translations and museum photographs are linked.</p><a href="./fluting.html">Explore the geometry of a fluted column</a></div></section></main>
<footer><span>Gonia · measured ancient architecture</span><span id="lg-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;

function band() {
  const p = ledgerPeople[state.person];
  if (!p) return;
  const matches = page === ledgerEntries[state.entry].page;
  const marker = el("lg-source-band");
  marker.hidden = !matches;
  const position = p.bands[state.entry === 90 ? 0 : 1];
  marker.style.top = `${position[0] * 100}%`;
  marker.style.height = `${position[1] * 100}%`;
  el("lg-lines").textContent = matches
    ? `${p.name}: IG lines ${p.lines[state.entry === 90 ? 0 : 1]}. This page uses Caskey XVII, col. I line numbers: ${ledgerEntries[state.entry].caskey} for the complete selected team entry.`
    : "Use “Find this name” to return to the selected entry’s Greek page. Page 412 contains Caskey’s historical interpretation, rather than a transcription of this team alone.";
}
function render() {
  const m = ledgerModel(state);
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-lg-entry]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.lgEntry) === state.entry));
  for (const [i, row] of m.rows.entries()) {
    el(`lg-your-${i}`).textContent = money(row.chosen);
    el<HTMLInputElement>(`lg-extra-${i}`).checked = row.extra;
    const record = el(`lg-record-${i}`);
    record.textContent = money(row.recorded);
    record.hidden = !state.record;
    el(`lg-hidden-${i}`).hidden = state.record;
    document
      .querySelector(`[data-lg-person="${i}"]`)
      ?.setAttribute("aria-pressed", String(state.person === i));
  }
  el("lg-reveal").hidden = state.record;
  el("lg-copy").hidden = !state.record;
  el("lg-division").textContent =
    `${state.entry} drachmas = ${m.total} obols. Give each of seven names ${money(m.base)} (${m.base} obols). There ${m.remainder === 1 ? "is" : "are"} ${m.remainder} obol${m.remainder === 1 ? "" : "s"} left to distribute.`;
  el("lg-remainder").innerHTML = ledgerRemainder(state);
  el("lg-options").textContent =
    `${m.alternatives} different distributions balance this total under the activity’s one-extra-obol rule. Only one reproduces the edited entry.`;
  el("lg-result").textContent =
    m.left > 0
      ? `${m.left} obol${m.left === 1 ? " remains" : "s remain"} to place. Your allocation totals ${money(m.allocated)}; the entry totals ${state.entry} drachmas.`
      : m.left < 0
        ? `${-m.left} obol${m.left === -1 ? "" : "s"} over the total. Remove that many checkmarks to balance the allocation.`
        : !state.record
          ? "The total balances. Reveal the account to see whether this is its distribution."
          : m.matches
            ? "Balanced, and it matches the edited record. The arithmetic does not tell us why these particular names received the extra obols."
            : "Balanced, but different from the edited record. More than one distribution gives the correct sum; the source supplies the names beside the amounts.";
  const person = m.rows[state.person];
  if (!person) return;
  el("lg-person-detail").innerHTML =
    `<h3>${le(person.name)} <span lang="grc">${le(person.greek)}</span></h3><p>${le(person.description)}</p><p>${le(person.note)}</p>`;
  el("lg-money-detail").innerHTML = state.record
    ? `<p>Edited amount: <strong>${money(person.recorded)}</strong> · IG lines ${person.lines[state.entry === 90 ? 0 : 1]}</p>${ledgerNumeral(person.recorded)}<p class="lg-equation">${Math.floor(person.recorded / 6)} × 6 + ${person.recorded % 6} = ${person.recorded} obols</p><p class="lg-note">Schematic numeral outlines: a triangle counts ten drachmas; a crossbar sign, one drachma; a plain stroke, one obol. The printed page preserves damaged and restored signs.</p>`
    : "<p>Reveal the account above to see this name’s edited amount and a schematic reading of its numeral.</p>";
  el("lg-share-label").hidden = true;
  band();
}
function commit() {
  const query = ledgerQuery(state);
  if (query !== committed) {
    history.pushState(null, "", `${location.pathname}?${query}${location.hash}`);
    committed = query;
  }
}
async function source(find = false) {
  const revision = ++sourceRevision;
  let candidateUrl = "";
  const p = ledgerPages.find((x) => x.id === page);
  if (!p) return;
  el<HTMLSelectElement>("lg-page").value = page;
  el("lg-source-error").hidden = true;
  el("lg-source-note").textContent = "Verifying the complete printed page…";
  el("lg-source-sheet").hidden = true;
  el<HTMLAnchorElement>("lg-original").href = `${LEDGER_VOLUME}/page/n${p.leaf}/mode/1up`;
  try {
    const bytes = await ledgerAsset(`sources/ledger/${p.file}`);
    if (revision !== sourceRevision) return;
    candidateUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }));
    // Load a fresh image before replacing the displayed one. Reusing a zoomed
    // image and awaiting decode() can reject a valid repeated blob in Firefox.
    const img = new Image(1600, 2196);
    img.id = "lg-source-image";
    img.alt = `Complete ${p.label}, The Erechtheum, 1927; Internet Archive leaf ${p.leaf}.`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("The verified page could not be displayed. Reload the source to retry."));
      img.src = candidateUrl;
    });
    if (revision !== sourceRevision) {
      URL.revokeObjectURL(candidateUrl);
      return;
    }
    el("lg-source-image").replaceWith(img);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = candidateUrl;
    candidateUrl = "";
    el("lg-source-sheet").hidden = false;
    el("lg-source-note").textContent =
      `Verified ${p.label}. Complete page, including the edition’s brackets and line numbering.`;
    band();
    if (find) {
      const row = ledgerPeople[state.person];
      if (row) {
        const pan = el("lg-source-pan"),
          sheet = el("lg-source-sheet");
        pan.scrollTop = sheet.clientHeight * row.bands[state.entry === 90 ? 0 : 1][0] - 60;
        // The printed Greek occupies the right half of the page. Keep its
        // selected line band in view when enlargement hides the margins.
        pan.scrollLeft = sheet.clientWidth * 0.61 - pan.clientWidth / 2;
      }
    }
  } catch (error) {
    if (candidateUrl) URL.revokeObjectURL(candidateUrl);
    if (revision !== sourceRevision) return;
    el("lg-source-error").hidden = false;
    el("lg-source-error").textContent =
      error instanceof Error
        ? error.message
        : "Source unavailable. Reconnect, then reload the source.";
    el("lg-source-note").textContent =
      "Source verification did not finish. The original volume remains linked below.";
  }
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-lg-entry]"))
  b.addEventListener("click", () => {
    state = { ...state, entry: Number(b.dataset.lgEntry) as LedgerEntry, extra: 0 };
    page = ledgerEntries[state.entry].page;
    render();
    commit();
    void source();
  });
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-lg-person]"))
  b.addEventListener("click", () => {
    state = { ...state, person: Number(b.dataset.lgPerson) };
    render();
    commit();
  });
for (const c of document.querySelectorAll<HTMLInputElement>("[data-lg-extra]"))
  c.addEventListener("change", () => {
    state = { ...state, extra: state.extra ^ (1 << Number(c.dataset.lgExtra)) };
    render();
    commit();
  });
el("lg-clear").addEventListener("click", () => {
  state = { ...state, extra: 0 };
  render();
  commit();
});
el("lg-reveal").addEventListener("click", () => {
  state = { ...state, record: true };
  render();
  commit();
  el("lg-copy").focus();
});
el("lg-copy").addEventListener("click", () => {
  state = { ...state, extra: ledgerEntries[state.entry].mask };
  render();
  commit();
});
el("lg-find").addEventListener("click", () => {
  page = ledgerEntries[state.entry].page;
  void source(true);
  el("lg-source-pan").focus({ preventScroll: true });
});
el("lg-page").addEventListener("change", () => {
  page = el<HTMLSelectElement>("lg-page").value;
  void source();
});
el("lg-retry").addEventListener("click", () => void source());
el("lg-zoom").addEventListener("input", () => {
  const zoom = el<HTMLInputElement>("lg-zoom").value;
  el("lg-source-sheet").style.width = `${zoom}%`;
  el("lg-zoom-value").textContent = `${zoom}%`;
});
function showWord(index: number) {
  const w = ledgerWords[index];
  if (!w) return;
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-lg-word]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.lgWord) === index));
  el("lg-word-note").innerHTML =
    `<strong lang="grc">${w.word}</strong> · ${le(w.roman)} · ${le(w.meaning)}<p>${le(w.note)}</p>`;
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-lg-word]"))
  b.addEventListener("click", () => showWord(Number(b.dataset.lgWord)));
el("lg-csv").addEventListener("click", () => {
  saveLedger(ledgerCSV(state), `gonia-ledger-${state.entry}.csv`, "text/csv;charset=utf-8");
  el("lg-save-status").textContent =
    "Saved exact integer obols, with your allocation and the edited record in separate columns.";
});
el("lg-save").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("lg-save");
  const snapshot = { ...state };
  button.disabled = true;
  el("lg-save-status").textContent =
    "Verifying the source pages, edited excerpt, fonts and licenses…";
  try {
    const html = await ledgerStudy(snapshot);
    saveLedger(html, `gonia-ledger-${snapshot.entry}-reading.html`, "text/html;charset=utf-8");
    el("lg-save-status").textContent =
      "Saved both entries, your allocation, Greek notes, all four source pages, fonts and licenses. Open offline or print.";
  } catch (error) {
    el("lg-save-status").textContent =
      error instanceof Error ? error.message : "Sources unavailable. Reconnect and try again.";
  } finally {
    button.disabled = false;
  }
});
el("lg-share").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.search = ledgerQuery(state);
  url.hash = "lg-workshop";
  el<HTMLInputElement>("lg-share-url").value = url.href;
  el("lg-share-label").hidden = false;
  try {
    await navigator.clipboard.writeText(url.href);
    el("lg-save-status").textContent = "Copied the allocation link.";
  } catch {
    el("lg-save-status").textContent = "The allocation link is ready to copy below.";
    el<HTMLInputElement>("lg-share-url").select();
  }
});
addEventListener("popstate", () => {
  const parsed = readLedger(location.search);
  state = parsed.state;
  committed = ledgerQuery(state);
  el("lg-invalid").hidden = !parsed.invalid;
  page = ledgerEntries[state.entry].page;
  render();
  void source();
});
history.replaceState(null, "", `${location.pathname}?${committed}${location.hash}`);
render();
showWord(0);
void source();
void offlineStatus(el("lg-offline"));
if (location.hash)
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());

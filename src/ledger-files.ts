import originalLicense from "../LICENSE?raw";
import { type LedgerState, ledgerCSV, ledgerModel, money } from "./core/ledger";
import { LEDGER_ASSETS } from "./ledger-assets";
import {
  LEDGER_AIO,
  LEDGER_EDITION,
  LEDGER_LIMITS,
  LEDGER_MUSEUM,
  LEDGER_VOLUME,
  ledgerEntries,
  ledgerPages,
  ledgerPeople,
  ledgerWords,
} from "./ledger-content";
import { le, ledgerComparison, ledgerNumeral, ledgerRemainder } from "./ledger-drawing";

const verified = new Map<string, Promise<Uint8Array>>();
export function ledgerAsset(path: string): Promise<Uint8Array> {
  const known = verified.get(path);
  if (known) return known;
  const promise = (async () => {
    const expected = LEDGER_ASSETS[path];
    if (!expected) throw new Error("This source has no retained identity.");
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Source download failed (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    if (hash !== expected)
      throw new Error(
        "A source or font does not match this edition’s identity. Reconnect and reload before saving.",
      );
    return bytes;
  })();
  verified.set(path, promise);
  void promise.catch(() => {
    if (verified.get(path) === promise) verified.delete(path);
  });
  return promise;
}
async function ledgerData(path: string, type: string): Promise<string> {
  const bytes = await ledgerAsset(path);
  let binary = "";
  for (const n of bytes) binary += String.fromCharCode(n);
  return `data:${type};base64,${btoa(binary)}`;
}
export function saveLedger(data: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function ledgerStudy(s: LedgerState): Promise<string> {
  const m = ledgerModel(s);
  const [regular, semibold, greek, plexLicense, notoLicense, xml, ...pages] = await Promise.all([
    ledgerData("fonts/IBMPlexSans-Regular.woff2", "font/woff2"),
    ledgerData("fonts/IBMPlexSans-SemiBold.woff2", "font/woff2"),
    ledgerData("fonts/NotoSerif-Regular.ttf", "font/ttf"),
    ledgerAsset("fonts/IBMPlex-OFL.txt").then((b) => new TextDecoder().decode(b)),
    ledgerAsset("fonts/NotoSerif-OFL.txt").then((b) => new TextDecoder().decode(b)),
    ledgerData("sources/ledger/ig-476-excerpt.xml", "application/xml"),
    ...ledgerPages.map((p) => ledgerData(`sources/ledger/${p.file}`, "image/jpeg")),
  ]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia — Seven names, one uneven obol</title><style>
@font-face{font-family:Plex;src:url('${regular}')}@font-face{font-family:Plex;src:url('${semibold}');font-weight:600 800}@font-face{font-family:Noto;src:url('${greek}')}*{box-sizing:border-box}body{font:16px/1.6 Plex,sans-serif;color:#27352f;background:#f4f1e8;margin:36px auto;max-width:1000px;padding:0 20px}h1{font-size:2.8rem;line-height:1.15}h2{margin-top:2em}a{color:#405a43;overflow-wrap:anywhere}[lang=grc]{font-family:Noto,serif}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{text-align:left;border-bottom:1px solid #bfc3b3;padding:9px}th{font-weight:600}caption{text-align:left}svg{max-width:360px;width:100%;height:auto}.lg-numeral{height:36px;width:auto;display:block}figure{margin:28px 0;break-inside:avoid}figure img{width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.sources figure{max-width:800px}.profile{border-top:1px solid #bfc3b3;padding-top:16px}@media(max-width:550px){body{margin:20px auto;padding:0 12px}h1{font-size:2rem}th,td{padding:6px;font-size:13px}}@media print{body{background:white;font-size:11pt;max-width:none;margin:0}h1{font-size:28pt}h2,h3{break-after:avoid}.profile{break-inside:avoid}thead th{white-space:nowrap}figure{break-before:page}figure img{max-height:230mm;object-fit:contain}.licenses{break-before:page}}
</style></head><body><header><p>Gonia · Erechtheion building accounts · 408/7 BCE</p><h1>Seven names,<br>one uneven obol.</h1><p>Selected entry: ${s.entry} drachmas. IG I³ 476, lines ${m.source.lines}. This document includes your allocation and the edited record, even if you had not yet revealed it in the activity.</p></header>
<h2>Divide the total. Then read the record.</h2><p>Six obols make one drachma. ${m.total} obols divided among seven names gives ${money(m.base)} each, with ${m.remainder} obol${m.remainder === 1 ? "" : "s"} left over. This activity permits one extra whole obol per name. ${m.alternatives} distributions balance that total within these rules.</p>${ledgerRemainder(s)}${ledgerComparison(s)}<p>Your allocation ${m.balanced ? "balances the total" : `leaves ${m.left} obols unallocated (a negative number means over-allocation)`}; it ${m.matches ? "matches" : "differs from"} the edited record. A balanced sum alone cannot establish the ancient distribution or its reason.</p>
<p><a download="gonia-ledger-${s.entry}.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(ledgerCSV(s))}">Save this exact comparison as CSV</a> · <a download="ig-476-excerpt.xml" href="${xml}">Save the licensed edited Greek excerpt (XML)</a></p>
<h2>Keep both entries.</h2><table><caption>The sums below are computed from edited amounts. Both entries occur in the eighth prytany.</caption><thead><tr><th>Name</th><th>Earlier: 90 dr.</th><th>Later: 100 dr.</th><th>Identifier and interpretation</th></tr></thead><tbody>${ledgerPeople.map((p, i) => `<tr><th scope="row">${le(p.name)}</th><td>${money(ledgerEntries[90].obols[i] as number)}</td><td>${money(ledgerEntries[100].obols[i] as number)}</td><td>${le(p.description)}</td></tr>`).join("")}</tbody></table>
<h2>The seven names</h2>${m.rows.map((r, i) => `<section class="profile"><h3>${le(r.name)} <span lang="grc">${le(r.greek)}</span></h3><p>${le(r.description)}. ${le(r.note)}</p><p>IG lines ${r.lines[s.entry === 90 ? 0 : 1]}: ${money(r.recorded)}</p>${ledgerNumeral(r.recorded)}<p>${Math.floor(r.recorded / 6)} drachmas × 6 + ${r.recorded % 6} obols = ${r.recorded} obols.</p><p>Name ${i + 1} in the selected team; this order does not assign individual flutes to people.</p></section>`).join("")}
<h2>Read four working words</h2><p>Reading aids join words split across lines and use ordinary Unicode Greek. They retain selected older Attic spellings; οἰκῶν and Σοκλῆς show long vowels in the later alphabet. They are not a diplomatic transcription. The licensed XML and scanned pages retain the edition’s restoration brackets.</p>${ledgerWords.map((w) => `<h3 lang="grc">${w.word}</h3><p>${le(w.roman)} · ${le(w.meaning)}. ${le(w.note)}</p>`).join("")}
<h2>What the account can establish</h2><p>${le(LEDGER_LIMITS)}</p><p>Parts of names and numeral signs are restored by editors. The exact sums are exact arithmetic on that edited reading, rather than proof that every sign survives. The current IG and AIO ownership interpretation takes precedence over Caskey’s 1927 English translation, which renders possessive identifiers as family relationships. No modern AIO translation is reproduced here.</p><p>The 1927 p. 412 table interprets repeated work stages and distinguishes preserved from restored totals. Its proposed complete-column cost is not used as a measured total or as the budget for this activity.</p>
<h2>Sources and attribution</h2><ul><li><a href="${LEDGER_EDITION}">Inscriptiones Graecae, IG I³ 476</a>, Berlin-Brandenburg Academy of Sciences and Humanities. Selected edited Greek lines reused under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; excerpt header replaced with attribution, unrelated lines omitted, text and markup retained.</li><li><a href="${LEDGER_AIO}">Attic Inscriptions Online, IG I³ 476</a>, translation and commentary by Stephen Lambert and Robin Osborne. Linked for comparison and interpretation; their translation is not bundled.</li><li><a href="${LEDGER_MUSEUM}">Acropolis Museum, EM 6667 δ</a>, the account fragment’s object record. The printed pages below are an edition, not photographs of the stone.</li><li><a href="${LEDGER_VOLUME}">The Erechtheum (1927)</a>, edited by James Morton Paton; inscription text by Lacey Davis Caskey. Harvard University Press. Getty Research Institute scan via Internet Archive. Complete, unmodified public-domain pages, with original page numbering.</li></ul>
<section class="sources"><h2>The complete printed pages</h2>${ledgerPages.map((p, i) => `<figure><img src="${pages[i]}" width="1600" height="2196" alt="Complete ${le(p.label)}"><figcaption>${le(p.label)}. Internet Archive leaf ${p.leaf}. ${p.id === "390" ? "Caskey XVII col. I, lines 41–47 correspond to IG 199–205." : p.id === "392" ? "Caskey XVII col. I, lines 77–84 correspond to IG 235–242." : p.id === "412" ? "Historical interpretation and table, not a newly measured building budget." : "Title and publication information."}</figcaption></figure>`).join("")}</section>
<section class="licenses"><h2>Code, educational content and font licenses</h2><p>New activity, diagrams, English explanations and code: Anton Soloviev, 2026, MIT. This document contains the original fonts and their licenses. CC BY 4.0 applies separately to the edited Greek excerpt.</p><pre>${le(originalLicense)}</pre><h3>IBM Plex</h3><pre>${le(plexLicense as string)}</pre><h3>Noto Serif</h3><pre>${le(notoLicense as string)}</pre></section></body></html>`;
}

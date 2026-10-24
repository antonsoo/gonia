import license from "../LICENSE?raw";
import {
  ECHEA_NOTES,
  type EcheaState,
  echeaPlaces,
  echeaQuery,
  echeaRow,
  echeaSound,
  echeaWav,
  noteFrequency,
  resonator,
  responseAmplitude,
} from "./core/echea";
import { ECHEA_ASSETS } from "./echea-assets";
import { ECHEA_LIMITS, ECHEA_SOURCE, echeaPassages, echeaSources } from "./echea-content";
import {
  echeaBurst,
  echeaCurve,
  echeaMounting,
  echeaPlan,
  echeaTrace,
  ecEscape as esc,
  ecNumber as n,
} from "./echea-drawing";
import ink from "./echea-ink.css?inline";
export function saveEchea(
  content: string | Uint8Array<ArrayBuffer>,
  name: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function echeaSvg(s: EcheaState): string {
  return echeaPlan(s, "saved-plan").replace(
    "<title",
    `<metadata>${esc(license)}</metadata><style>${esc(ink)}</style><title`,
  );
}
export function echeaCsv(s: EcheaState): string {
  const rows: (string | number)[][] = [
    [
      "record",
      "order",
      "place",
      "note",
      "ratio_to_mese",
      "mese_hz",
      "frequency_hz",
      "drive_offset_cents",
      "q",
      "steady_relative_amplitude",
      "free_decay_seconds_to_1_over_e",
    ],
  ];
  for (const [i, note] of echeaRow(s.order).entries()) {
    const entry = ECHEA_NOTES[note];
    if (entry)
      rows.push([
        "vessel",
        s.order,
        i + 1,
        entry.name,
        entry.ratio.join("/"),
        s.reference,
        noteFrequency(note, s.reference),
        "",
        "",
        "",
        "",
      ]);
  }
  const m = resonator(s);
  rows.push([
    "selected_response",
    s.order,
    "",
    ECHEA_NOTES[s.note]?.name ?? "",
    "",
    s.reference,
    m.drive,
    s.detune,
    s.q,
    m.amplitude,
    m.tau,
  ]);
  for (let cents = -200; cents <= 200; cents++)
    rows.push([
      "response_curve",
      s.order,
      "",
      ECHEA_NOTES[s.note]?.name ?? "",
      "",
      s.reference,
      m.natural * 2 ** (cents / 1200),
      cents,
      s.q,
      responseAmplitude(2 ** (cents / 1200), s.q),
      m.tau,
    ]);
  return `${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function echeaTable(s: EcheaState): string {
  return `<table><caption>Seven pitches; mese = ${s.reference} Hz (chosen). Places count left to right in the drawing.</caption><thead><tr><th scope="col">Pitch</th><th scope="col">Places</th><th scope="col">Ratio to mese</th><th scope="col">Hz</th></tr></thead><tbody>${ECHEA_NOTES.map((note, i) => `<tr><th scope="row">${note.name}</th><td>${echeaPlaces(i, s.order).join(", ")}</td><td>${note.ratio.join(":")}</td><td>${n(noteFrequency(i, s.reference), 3)}</td></tr>`).join("")}</tbody></table>`;
}
function base64(bytes: Uint8Array): string {
  let raw = "";
  for (let i = 0; i < bytes.length; i += 16384)
    raw += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(raw);
}
async function verified(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok)
    throw new Error("A source page or font is unavailable. Reconnect and reload before saving.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== ECHEA_ASSETS[path])
    throw new Error(
      "A source page or font does not match this edition. Reload online before saving.",
    );
  return bytes;
}
export async function echeaReading(state: EcheaState): Promise<string> {
  const s = { ...state };
  const assets = new Map(
    await Promise.all(
      Object.keys(ECHEA_ASSETS).map(async (path) => [path, await verified(path)] as const),
    ),
  );
  const bytes = (path: string) => {
    const value = assets.get(path);
    if (!value) throw new Error(`Missing ${path}`);
    return value;
  };
  const data = (path: string, type: string) => `data:${type};base64,${base64(bytes(path))}`;
  const rowAudio = `data:audio/wav;base64,${base64(echeaWav(echeaSound(s, "row")))}`;
  const responseAudio = `data:audio/wav;base64,${base64(echeaWav(echeaSound(s, "response")))}`;
  const m = resonator(s);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; media-src data:; base-uri 'none'; form-action 'none'"><title>Gonia · Thirteen vessels. Seven notes.</title><style>
@font-face{font-family:Noto;src:url('${data("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${data("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}*{box-sizing:border-box}body{max-width:900px;margin:auto;padding:28px;background:#f4f1e8;color:#27352f;font:16px/1.65 Plex,Arial,sans-serif}h1,h2,[lang=la],[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400}h1{font-size:42px;line-height:1.15}h2{font-size:28px;line-height:1.25}h3{font-size:20px}section,figure{margin:35px 0}figure{padding:0}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #bfc3b3;text-align:left;padding:10px}caption{text-align:left;margin-bottom:15px}img{max-width:100%;height:auto}audio{width:100%;max-width:480px}a{color:#405a43}article{border-top:1px solid #bfc3b3;padding:18px 0}.latin{font-size:21px}.small,figcaption{font-size:13px}.hash{overflow-wrap:anywhere;font-size:10px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}.mount{max-width:500px;margin:auto}${ink}
@media(max-width:600px){body{padding:18px}h1{font-size:32px}th,td{padding:6px;font-size:12px}.latin{font-size:19px}}
@page{size:A4;margin:14mm}@media print{body{background:white;padding:0;font-size:10pt}h1{font-size:28pt}h2{font-size:19pt}h3{font-size:14pt}.latin{font-size:12pt}h2,h3{break-after:avoid}figure,article,table{break-inside:avoid}.plan svg{max-height:110mm}.trace svg{max-height:65mm}.source{break-before:page}.source img{display:block;max-height:206mm;width:auto;margin:auto}.source h2{font-size:15pt}.audio,.downloads,.licenses{display:none}.mount{max-width:105mm}}
</style></head><body><header><p>Gonia · Vitruvius V.4–5</p><h1>Thirteen vessels.<br>Seven notes.</h1><p>Saved arrangement: <strong>${s.order === "source" ? "the printed prescription" : "ascending alteration — not the prescription"}</strong>. Mese = ${s.reference} Hz, a modern listening reference.</p><p class="small"><a href="https://antonsoo.github.io/gonia/echea.html${esc(echeaQuery(s))}">Reopen these settings</a>. This document embeds its drawings, audio, fonts and all five source pages. It needs no network connection.</p></header><main>
<figure class="plan">${echeaPlan(s, "saved-plan")}<figcaption>Selected: ${ECHEA_NOTES[s.note]?.name}. The two halves mirror one another; only the central pitch has one vessel. Schematic plan, with illustrative bowl shapes.</figcaption></figure><figure class="trace">${echeaTrace(s, "saved-trace")}<figcaption>The vertical scale represents logarithmic pitch height, not seating height.</figcaption></figure>
<section><h2>The fourth place is not another fourth</h2><p>From either end, the prescription descends from nete hyperbolaeon to nete diezeugmenon to paramese. The fourth place then rises to nete synhemmenon. Quarta counts a position; diatessaron names a musical interval. Swapping the third and fourth placements produces an ascending half-row, but alters the text.</p>${echeaTable(s)}<p>A tetrachord is a group of four notes spanning a fourth. In this model, the conjunct tetrachord runs from mese to nete synhemmenon; the disjunct one starts a tone higher, at paramese, and runs to nete diezeugmenon. Its starting note is still below the other tetrachord’s top note. That overlap explains the turn in the row.</p><p>These are pure-ratio realizations of the fixed-note relationships, with fourth = 4:3, octave = 2:1 and the mese–paramese tone = 9:8. Vitruvius gives names and intervals, not these hertz values or an ancient pitch standard. The Greek forms are normalized musical names corresponding to his Latin transliterations.</p><div class="audio"><h3>Hear your row, left to right</h3><audio controls src="${rowAudio}"></audio><p>Sine tones at one fixed level, not recorded bronze vessels.</p></div></section>
<section><h2>One mode responds selectively</h2><p>The selected mode has natural frequency ${n(m.natural, 3)} Hz. Drive: ${n(m.drive, 3)} Hz (${s.detune} cents offset); Q = ${s.q}. Steady response relative to a matched drive: ${n(m.amplitude * 100, 2)}%. Free decay time to 1/e amplitude: ${n(m.tau, 4)} seconds.</p>${echeaCurve(s, "saved-response")}${echeaBurst(s, "saved-burst")}<p>The equation is x″ + (ω₀/Q)x′ + ω₀²x = (ω₀²/Q) sin(ωt). The drive lasts 1.5 seconds, starting from rest; the same oscillator then decays freely. x is dimensionless displacement, not pressure or loudness. Its exact solution is converted to audio at a fixed gain, so detuned examples remain quieter. The final 25 ms fades to silence.</p><div class="audio"><h3>Hear the selected response</h3><audio controls src="${responseAudio}"></audio><p>Only the response is played; the driving tone is not mixed in. A short burst need not reach the steady amplitude shown by the graph.</p></div><p class="downloads"><a download="gonia-echea.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(echeaCsv(s)))}">Download pitches and response curve</a></p></section>
<section><h2>What rests inside the chamber?</h2><div class="mount">${echeaMounting("saved-mount")}</div><p>The prescribed support leaves the vessel free of the walls. Its size and exact profile are not supplied. Source feet describe the wedges and openings; they are not modern metres.</p></section>
<section><h2>Read the evidence</h2><p>Nine selected passages from F. Krohn’s 1912 edition. Line-end hyphens are joined. Angle brackets preserve editorial additions; square brackets preserve deletions. English translations and reading notes are new.</p>${echeaPassages.map((p, i) => `<article><p class="small">${p.ref}</p><h3>${i + 1}. ${p.title}</h3><p class="latin" lang="la">${esc(p.latin)}</p><p>${esc(p.english)}</p><p><strong lang="la">${esc(p.word)}</strong> · ${esc(p.gloss)}</p><p>${esc(p.note)}</p></article>`).join("")}</section>
<section><h2>Keep the Greek names</h2>${ECHEA_NOTES.map((note) => `<p><span lang="grc">${note.greek}</span> · ${note.name}: ${note.gloss.toLowerCase()}.</p>`).join("")}<p>The Greek forms explain the musical terms; they are not a Greek original of Vitruvius’s Latin instructions.</p></section>
<section><h2>What remains unknown</h2><p>${ECHEA_LIMITS}</p><p>Shell vibration and resonance of enclosed air are different mechanisms. A selected musical frequency alone does not identify the mechanism or predict the effect at an audience seat. Modern researchers have considered both reinforcement and absorption; their models are not a measurement of Vitruvius’s vessels.</p><p>Further reading: <a href="https://www.eaa-saat.eu/SAAT2011/atti/AA2011-9_Rindel.pdf">J. H. Rindel, Echo Problems in Ancient Theatres (2011)</a>; <a href="https://www.eaa-saat.eu/SAAT2011/atti/AA2011-39_Polychronopoulos-et-al.pdf">Polychronopoulos et al., The Use of Resonators in Ancient Greek Theaters (2011)</a>. The workshop reproduces none of their figures or simulations.</p></section>
${echeaSources.map((source) => `<figure class="source"><figcaption><h2>Krohn, p. ${source.page}: ${source.title}</h2><p>${source.note} <a href="${ECHEA_SOURCE}/page/n${source.page + 17}/mode/1up">Source volume</a>.</p></figcaption><img src="${data(source.path, "image/jpeg")}" alt="Complete printed page ${source.page}, including the critical apparatus"><p class="hash">SHA-256 ${ECHEA_ASSETS[source.path]}</p></figure>`).join("")}
<footer><p>Public-domain source edition. New text, drawings and code: MIT, Anton Soloviev, 2026.</p><details class="licenses"><summary>Redistribution notices</summary><pre>${esc(license)}</pre>${["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"].map((path) => `<h3>${path}</h3><pre>${esc(new TextDecoder().decode(bytes(path)))}</pre>`).join("")}</details></footer></main></body></html>`;
}

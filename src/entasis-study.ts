import {
  compareMaxima,
  decimal,
  type EntasisState,
  heightLabel,
  offsetLabel,
  stationMeasurements,
  writeEntasis,
} from "./core/entasis";
import plateStyles from "./entasis.css?inline";
import { entasisPassage, entasisSources, entasisWords } from "./entasis-content";
import { departureDrawing, edgeDrawing, measurementHead, measurementRows } from "./entasis-drawing";

export function entasisStudy(state: EntasisState, images: Record<string, string>): string {
  const row = stationMeasurements(state.station);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The curve inside the taper · Gonia</title><style>
:root{--ink:#27352f;--green:#405a43;--muted:#5f6559;--line:#bfc3b3;--orange:#963b25;--paper:#f4f1e8}*{box-sizing:border-box}body{max-width:1040px;margin:36px auto;padding:0 24px;color:var(--ink);background:white;font:17px/1.6 Georgia,serif}h1,h2,h3{line-height:1.25}a{color:var(--green)}table{border-collapse:collapse;width:100%;font:13px/1.5 Arial,sans-serif}th,td{padding:8px;border-bottom:1px solid var(--line);text-align:left}.table-scroll{overflow:auto}caption{text-align:left;margin-bottom:10px}figure{margin:0}.source-pages{margin-top:40px}.source-pages img{display:block;width:100%;height:auto}.source-pages figure{margin-top:30px}.source-pages figcaption{font-size:14px}footer{border-top:1px solid var(--line);margin-top:30px;font-size:14px}.entasis-figures{margin-top:25px}.entasis-figures h3{font-size:18px}.reading-passage{margin:30px 0}.reading-passage [lang=la]{font-size:21px}
${plateStyles}
@page{size:A4;margin:12mm}@media print{body{margin:0;padding:0;font-size:11px;max-width:none}h1{font-size:25px}h2{font-size:20px}h2,h3{break-after:avoid}.entasis-figures{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:580px;break-inside:avoid}.entasis-figures figure{width:100%;max-width:none}.entasis-figures h3{font-size:14px}.entasis-figures figcaption{font-size:10px}.entasis-plate{max-height:420px}.entasis-words{display:grid;grid-template-columns:1fr 1fr;gap:0 25px}.entasis-words article{break-inside:avoid}.entasis-words h3{font-size:16px;margin:8px 0}.entasis-words article{padding:6px 0}.reading-passage [lang=la]{font-size:14px}.entasis-small{font-size:10px}table{font-size:9px}tr{break-inside:avoid}.source-pages{break-before:page}.source-pages figure{break-before:page;break-inside:avoid;margin-top:10px}.source-pages figure:first-of-type{break-before:auto}.source-pages figure:first-of-type img{max-height:780px}.source-pages img{max-height:870px;width:auto;max-width:100%;margin:auto}.source-pages figcaption{font-size:10px}}
</style></head><body><h1>The curve inside the taper</h1><p>Penrose’s five corrected offsets from one exterior flute edge of the fourth east-front Parthenon column from the northeast corner. Source: <cite>An Investigation of the Principles of Athenian Architecture</cite>, second edition (1888), p. 41.</p>
<p>Selected height: <strong>${heightLabel(row.height, state.units)}</strong>. Horizontal departure enlargement: <strong>${state.enlargement}×</strong>. Prediction: <strong>${state.prediction === "none" ? "none" : `Penrose’s ${state.prediction}`}</strong>. Building comparison: <strong>${state.comparison === "equal" ? "equal shaft length" : "actual reported sizes"}</strong>.</p>
<div class="entasis-figures"><figure><h3>Measured offsets, equal scales</h3>${edgeDrawing(state)}<figcaption>Axis-referenced offsets remove the whole column’s inward lean. The shaded slice does not reconstruct its full diameter.</figcaption></figure><figure><h3>The straight taper subtracted</h3>${departureDrawing(state)}<figcaption>Horizontal distances ${state.enlargement}×; the vertical scale matches the first drawing. Zero is the straight endpoint taper.</figcaption></figure></div>
<p>Green circles are corrected column offsets; orange dashes show the straight taper. ${state.prediction === "none" ? "" : `Orange squares are Penrose’s printed ${state.prediction} predictions.`} Straight guides connect the five stations; they are not intermediate measurements or a reconstruction of the continuous mathematical curve.</p>
<h2>At the selected station</h2><p>${offsetLabel(row.taper, state.units)} straight taper − ${offsetLabel(row.column, state.units)} corrected column = <strong>${offsetLabel(row.departure, state.units)} outward departure</strong>.</p><p>The chord offset is 0.684 × ${decimal(row.height, 2)} / 31.43 feet. All higher measured stations lie inward of the base. Entasis is an addition relative to straight taper; it need not make the shaft wider than its base.</p>
<div class="table-scroll"><table><thead>${measurementHead(state)}</thead><tbody>${measurementRows(state, false)}</tbody></table></div>
<p>Original offsets are in English feet. Metric conversion uses 304.8 mm per foot. Additional calculated decimals are not estimates of measurement accuracy; the source gives no statistical uncertainty for these rows.</p>
<h2>What the predictions establish</h2><p>The circle passes through the base, middle and top stations by construction. Its largest discrepancy in these rows is 0.0067 feet (2.042 mm), at 8.70 feet. The hyperbola’s largest printed discrepancy is 0.0011 feet (0.335 mm), at 15.75 feet. Penrose’s prose says no more than 0.001 feet, but his printed middle row is 0.2875 against 0.2886. This document retains the numbers.</p>
<p>Penrose inferred an ancient hyperbolic design from the agreement. A close fit alone does not establish the builders’ method. His optical-correction explanation is also disputed; see Alain Goriely’s <a href="https://arxiv.org/html/2510.16831v2">2026 analysis</a>. No optical experiment is performed here.</p>
<h2>Six reported maxima</h2><p>The largest departure among our five stations is 16.508 mm at 15.75 feet. Penrose separately reports 0.057 feet (17.374 mm) at 13.8 feet. A maximum in a short table is not necessarily the maximum of the full profile.</p><p>Selected comparison: ${state.comparison === "actual" ? "actual reported sizes" : "each shaft scaled to the Parthenon’s 31.43-foot length"}. Normalization is maximum × 31.43 / shaft length. Penrose’s separately rounded comparison remains beside the calculated result.</p>
<div class="table-scroll"><table><thead><tr><th>Name</th><th>Shaft / ft</th><th>Maximum / ft</th><th>Height above stylobate / ft</th><th>Equal-length maximum / ft</th><th>Printed comparison / ft</th><th>Selected display</th></tr></thead><tbody>${compareMaxima(
    state.comparison,
  )
    .map(
      (r) =>
        `<tr><th>${r.name}</th><td>${decimal(r.length, 2)}</td><td>${decimal(r.maximum, 4)}</td><td>${decimal(r.height, 2)}</td><td>${decimal(r.normalizedMaximum, 6)}</td><td>${decimal(r.printedComparison, 4)}</td><td>${offsetLabel(r.displayedMaximum, state.units)}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div><p>The shaft lengths exclude the apophyge and related details; heights of maxima are measured above the stylobate. These are reported maxima, not six reconstructed continuous profiles. Historical building names are retained.</p>
<section class="reading-passage"><h2>An addition in the middle parts</h2><p lang="la">${entasisPassage.latin}</p><p>${entasisPassage.english}</p><p>${entasisPassage.note}</p></section><div class="entasis-words">${entasisWords.map((w) => `<article><h3 lang="${w.lang}">${w.word}</h3><p>${w.gloss}</p><p>${w.explanation}${w.source ? ` <a href="${w.source}">Dictionary</a>.` : ""}</p></article>`).join("")}</div>
<section class="source-pages"><h2>The printed evidence</h2><p>Four Penrose pages from Heidelberg University Library and one Krohn page from Internet Archive. All five public-domain images are embedded below. Penrose’s p. 40 explains the wire measurements, drum-shift corrections and change of reference line; the plotted numbers come from his corrected five-row comparison on p. 41.</p>${entasisSources.map((s) => `<figure><figcaption><strong>${s.label}</strong>. ${s.note} <a href="${s.link}">Library record</a>.</figcaption><img src="${images[s.id]}" width="${s.width}" height="${s.height}" alt="${s.label}: complete scanned page"></figure>`).join("")}</section>
<footer><p><a href="https://antonsoo.github.io/gonia/entasis.html${writeEntasis(state)}#entasis-workshop">Open this view in Gonia</a>. This file opens without a network connection. Code, new drawings and new English: MIT, Anton Soloviev, 2026. Penrose and Vitruvius text and scans: public domain. Library attribution is retained on the Penrose scans.</p></footer></body></html>`;
}

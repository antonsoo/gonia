import {
  ECHEA_NOTES,
  type EcheaState,
  echeaRow,
  echeaSound,
  noteFrequency,
  resonator,
  responseAmplitude,
} from "./core/echea";
export const ecEscape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const ecNumber = (n: number, digits = 2) => n.toFixed(digits);
const svg = (body: string, title: string, description: string, box: string, id: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="ec-diagram" viewBox="${box}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc>${body}</svg>`;
export function echeaPlan(s: EcheaState, id = "ec-plan"): string {
  const row = echeaRow(s.order);
  let body = [205, 245, 280, 320]
    .map((r) => `<path class="ec-seat" d="M${360 - r} 355 A${r} ${r} 0 0 1 ${360 + r} 355"/>`)
    .join("");
  body += `<path class="ec-axis" d="M360 25V355M28 355H692"/><rect class="ec-stage" x="210" y="365" width="300" height="35"/><text x="360" y="390" text-anchor="middle">Stage / scaena</text><text x="360" y="248" text-anchor="middle">Thirteen chambers</text><text class="ec-small-ink" x="360" y="278" text-anchor="middle">Twelve equal spaces</text>`;
  row.forEach((note, i) => {
    const angle = Math.PI - (i * Math.PI) / 12,
      x = 360 + 280 * Math.cos(angle),
      y = 355 - 280 * Math.sin(angle);
    const nx = 360 + 322 * Math.cos(angle),
      ny = 355 - 322 * Math.sin(angle);
    body += `<g data-ec-place="${i + 1}" data-note="${note}" class="ec-vessel ${s.note === note ? "ec-selected" : ""}"><rect x="${x - 23}" y="${y - 22}" width="46" height="44" rx="12"/><path d="M${x - 14} ${y + 10}Q${x - 16} ${y - 14} ${x} ${y - 14}Q${x + 16} ${y - 14} ${x + 14} ${y + 10}Z"/><text x="${nx}" y="${ny + 7}" text-anchor="middle">${i + 1}</text></g>`;
  });
  return svg(
    body,
    "Thirteen sounding-vessel positions",
    `${s.order === "source" ? "Vitruvius’s prescribed" : "Altered ascending"} row. Left to right: ${row.map((n, i) => `${i + 1}, ${ECHEA_NOTES[n]?.name}`).join("; ")}. Selected vessels are outlined. The semicircle and bowl profiles are schematic.`,
    "0 0 720 420",
    id,
  );
}
export function echeaTrace(s: EcheaState, id = "ec-trace"): string {
  const row = echeaRow(s.order),
    base = noteFrequency(0, s.reference);
  const points = row.map((n, i) => ({
    x: 50 + i * 51.5,
    y: 180 - ((1200 * Math.log2(noteFrequency(n, s.reference) / base)) / 2200) * 120,
    n,
  }));
  let body = `<text x="24" y="26">Pitch along the row</text><text class="ec-small-ink" x="24" y="54">Higher on this page = higher in pitch</text><path class="ec-axis" d="M50 190H668"/><path class="ec-trace-line" d="${points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ")}"/>`;
  points.forEach((p, i) => {
    body += `<g class="ec-dot ${p.n === s.note ? "ec-selected" : ""}"><circle cx="${p.x}" cy="${p.y}" r="${p.n === s.note ? 8 : 5}"/><text x="${p.x}" y="215" text-anchor="middle">${i + 1}</text></g>`;
  });
  return svg(
    body,
    "Pitch is not a steadily descending route to the centre",
    s.order === "source"
      ? "Moving from the left end towards the centre, pitch falls twice, rises from paramese to nete synhemmenon, then falls three times. The right half mirrors it."
      : "In the altered row, pitch falls continuously from the left end to the centre, then rises continuously to the right end.",
    "0 0 720 235",
    id,
  );
}
export function echeaCurve(s: EcheaState, id = "ec-curve"): string {
  const m = resonator(s),
    x = (c: number) => 65 + ((c + 200) / 400) * 580,
    y = (a: number) => 235 - a * 175;
  let body = `<text x="25" y="27">Steady response / matched response</text>`;
  for (const a of [0, 0.5, 1])
    body += `<path class="ec-grid" d="M65 ${y(a)}H645"/><text class="ec-small-ink" x="52" y="${y(a) + 6}" text-anchor="end">${a}</text>`;
  for (const c of [-200, -100, 0, 100, 200])
    body += `<text class="ec-small-ink" x="${x(c)}" y="265" text-anchor="middle">${c > 0 ? "+" : ""}${c}</text>`;
  body += `<path class="ec-response-line" d="${Array.from({ length: 801 }, (_, i) => {
    const c = -200 + i / 2;
    return `${i ? "L" : "M"}${x(c)} ${y(responseAmplitude(2 ** (c / 1200), s.q))}`;
  }).join(
    " ",
  )}"/><path class="ec-probe" d="M${x(s.detune)} 48V235"/><circle class="ec-probe-dot" cx="${x(s.detune)}" cy="${y(m.amplitude)}" r="7"/><text x="355" y="299" text-anchor="middle">Drive offset in cents; 100 cents = a modern semitone</text>`;
  return svg(
    body,
    "A single resonator responds selectively",
    `Chosen Q ${s.q}. At a drive offset of ${s.detune} cents, steady displacement amplitude is ${ecNumber(m.amplitude * 100, 1)} percent of a matched drive. This graph is not a theatre’s sound pressure.`,
    "0 0 710 320",
    id,
  );
}
export function echeaMounting(id = "ec-mount"): string {
  return svg(
    `<path class="ec-masonry" d="M25 270V80H175V45H490V270H440V105H210V270Z"/><path class="ec-bowl" d="M235 226Q218 120 322 141Q426 162 410 270"/><path class="ec-wedge" d="M218 270L256 270L235 226Z"/><path class="ec-axis" d="M30 270H485"/><path class="ec-leader" d="M140 205H223M335 90V134M285 320L242 259"/><text x="30" y="192">To stage</text><text x="282" y="82">Clear above</text><text x="245" y="347">Wedge ≥ ½ foot</text><path class="ec-probe" d="M185 227V270"/><text class="ec-small-ink" x="30" y="306">Opening ½ foot high</text><text class="ec-small-ink" x="30" y="370">Opening length: 2 feet (out of this section)</text>`,
    "An inverted vessel resting clear of its chamber",
    "Illustrative section after the text: an inverted vessel does not touch the walls and has room above. A wedge on the stage-facing side is at least half a source foot high. The opening is half a foot high and two feet long. Vessel size and profile are not given.",
    "0 0 520 395",
    id,
  );
}

/** Peaks from the exact samples used for listening, with a fixed displacement scale. */
export function echeaBurst(s: EcheaState, id = "ec-burst"): string {
  const clip = echeaSound(s, "response"),
    duration = clip.samples.length / clip.rate;
  const x = (time: number) => 65 + (580 * time) / duration;
  const points = Array.from({ length: 240 }, (_, i) => {
    const start = Math.floor((i * clip.samples.length) / 240),
      end = Math.floor(((i + 1) * clip.samples.length) / 240);
    let peak = 0;
    for (let j = start; j < end; j++) peak = Math.max(peak, Math.abs(clip.samples[j] ?? 0) / 0.32);
    return `${x((start + end) / (2 * clip.rate))},${175 - peak * 105}`;
  });
  return svg(
    `<text x="25" y="27">The burst you hear</text><text class="ec-small-ink" x="25" y="51">Peak displacement; the vertical scale stays fixed</text><path class="ec-grid" d="M65 70H645M65 175H645"/><text class="ec-small-ink" x="52" y="76" text-anchor="end">1</text><text class="ec-small-ink" x="52" y="181" text-anchor="end">0</text><polygon class="ec-burst-fill" points="65,175 ${points.join(" ")} 645,175"/><path class="ec-probe" d="M${x(1.5)} 60V175"/><text class="ec-small-ink" x="${Math.min(625, x(1.5)) - 8}" y="90" text-anchor="end">Drive off</text><text class="ec-small-ink" x="65" y="206">0 s</text><text class="ec-small-ink" x="645" y="206" text-anchor="end">${ecNumber(duration)} s</text><path class="ec-time-cursor" data-ec-time-cursor="${duration}" d="M65 60V175" hidden/>`,
    "A finite drive builds up vibration, then leaves a free decay",
    `Peak displacement from the audible samples, before their fixed playback gain. Drive ends at 1.5 seconds; sound ends at ${ecNumber(duration)} seconds. Each plotted peak covers ${ecNumber((duration / 240) * 1000, 1)} milliseconds.`,
    "0 0 710 225",
    id,
  );
}

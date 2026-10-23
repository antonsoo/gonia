import license from "../LICENSE?raw";
import { THEATRE_DEFAULT, type TheatreState, theatreModel, theatreQuery } from "./core/theatre";
import { THEATRE_ASSETS } from "./theatre-assets";
import { THEATRE_LIMITS, theatreParts, theatrePassages, theatreSources } from "./theatre-content";
import {
  theatreEscape as esc,
  theatreNumber as n,
  theatreDrawing,
  theatreWidthDrawing,
} from "./theatre-drawing";
import ink from "./theatre-ink.css?inline";

export function saveTheatre(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function theatreSvg(s: TheatreState, narrow = false): string {
  return theatreDrawing(s, narrow, "saved").replace(
    "<title",
    `<metadata>${esc(license)}</metadata><style>${esc(ink)}</style><title`,
  );
}
export function theatreCsv(s: TheatreState): string {
  const m = theatreModel(s),
    rows: (string | number)[][] = [
      [
        "record",
        "scheme",
        "boundary",
        "diameter_m",
        "index",
        "x_m",
        "y_m",
        "role",
        "metric",
        "value",
        "unit",
      ],
    ];
  const initial = [s.kind, s.kind === "roman" ? "semicircle" : s.arc, s.diameter];
  for (const v of m.vertices)
    rows.push(["vertex", ...initial, v.index + 1, v.x, v.y, v.role, "angle", v.degrees, "degrees"]);
  for (const [i, p] of m.boundary.entries())
    rows.push([
      "boundary_sample",
      ...initial,
      i + 1,
      p.x,
      p.y,
      "sampled guide; exact model uses circle arcs",
      "",
      "",
      "",
    ]);
  for (const [metric, value, unit] of [
    ["radius", m.radius, "m"],
    ["stage_front_y", m.front, "m"],
    ["scene_front_y", m.back, "m"],
    ["stage_depth", m.stageDepth, "m"],
    ["orchestra_area", m.area, "m2"],
    ["prescribed_area", m.prescribedArea, "m2"],
    ["single_circle_area", m.singleArea, "m2"],
    ["probe_y", m.probeY, "m"],
    ["probe_width", m.probeWidth, "m"],
    ["single_circle_probe_width", m.singleWidth, "m"],
  ] as const)
    rows.push([
      "measurement",
      ...initial,
      "",
      "",
      "",
      "modern geometric model",
      metric,
      value,
      unit,
    ]);
  return `${rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n")}\r\n`;
}
async function verified(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok)
    throw new Error(
      "A source image or font is unavailable. Reconnect and try again after the edition is saved.",
    );
  const bytes = new Uint8Array(await response.arrayBuffer()),
    hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
  if (hash !== THEATRE_ASSETS[path])
    throw new Error(
      "A bundled source does not match this edition. Reload online before saving the reading.",
    );
  return bytes;
}
const base64 = (bytes: Uint8Array) => {
  let raw = "";
  for (let i = 0; i < bytes.length; i += 16384)
    raw += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(raw);
};
export async function theatreReading(s: TheatreState): Promise<string> {
  const files = new Map(
    await Promise.all(
      Object.keys(THEATRE_ASSETS).map(async (path) => [path, await verified(path)] as const),
    ),
  );
  const bytes = (path: string) => {
    const found = files.get(path);
    if (!found) throw new Error(`Missing source ${path}`);
    return found;
  };
  const data = (path: string, type: string) => `data:${type};base64,${base64(bytes(path))}`;
  const m = theatreModel(s),
    roman = theatreModel({ ...s, kind: "roman" }),
    greek = theatreModel({ ...s, kind: "greek", arc: "three" });
  const diagrams = [
    { title: "Your saved construction", state: s },
    {
      title: "Roman scheme · completed",
      state: { ...THEATRE_DEFAULT, kind: "roman" as const, diameter: s.diameter },
    },
    {
      title: "Greek scheme · completed, three centres",
      state: { ...THEATRE_DEFAULT, diameter: s.diameter },
    },
  ];
  const notices = ["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"]
    .map((path) => `<h3>${path}</h3><pre>${esc(new TextDecoder().decode(bytes(path)))}</pre>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia · Twelve points. Two theatres.</title><style>
@font-face{font-family:Noto;src:url('${data("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${data("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}
*{box-sizing:border-box}body{max-width:960px;margin:auto;padding:32px;font:16px/1.65 Plex,Arial,sans-serif;background:#f4f1e8;color:#27352f}h1,h2,h3,[lang=la],[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400}h1{font-size:46px;line-height:1.15}h2{font-size:29px;line-height:1.3}h3{font-size:21px}a{color:#405a43}section{margin:38px 0}figure{margin:24px 0}figcaption,.meta{font-size:13px}.passage{padding:18px 0;border-top:1px solid #bfc3b3}.latin{font-size:21px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #bfc3b3}img{display:block;max-width:100%;height:auto}.source{margin-top:45px}.source img{margin:auto}.identity{overflow-wrap:anywhere;font-size:11px}.wide{display:block}.narrow{display:none}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}.measure{max-width:360px;margin:auto}${ink}
@media(max-width:600px){body{padding:20px}.wide{display:none}.narrow{display:block}h1{font-size:36px}.latin{font-size:18px}th,td{padding:7px;font-size:13px}}
@page{size:A4;margin:14mm}@media print{body{padding:0;background:white;font-size:10pt}h1{font-size:28pt}h2{font-size:19pt}h3{font-size:14pt}h2,h3{break-after:avoid}.wide{display:block}.narrow{display:none}.plan{break-inside:avoid}.plan svg{max-height:145mm}.passage{break-inside:avoid}.latin{font-size:12pt}.source{break-before:page;margin:0}.source img{max-height:210mm;width:auto}.source figcaption{font-size:9pt}.source h2{font-size:15pt}.licenses,.downloads{display:none}table{break-inside:avoid}}
</style></head><body><header><p>GONIA · MEASURED ANCIENT ARCHITECTURE</p><h1>Twelve points.<br>Two theatres.</h1><p>Saved scheme: ${s.kind}. Diameter ${s.diameter} metres, a chosen modern scale. ${s.kind === "greek" && s.arc === "single" ? "The single-circle boundary is your alteration of the three-centre instruction." : "The adopted boundary follows the printed construction."} Construction step ${s.step + 1}/5; selected vertex ${s.vertex + 1}.</p><p class="meta"><a href="https://antonsoo.github.io/gonia/theatre.html${esc(theatreQuery(s))}">Reopen these settings</a>. Fonts, diagrams, all ten readings and seven source images are embedded. Opening this file makes no external requests.</p></header><main>
${diagrams.map(({ title, state }, i) => `<figure class="plan"><figcaption><h2>${title}</h2></figcaption><div class="wide">${theatreDrawing(state, false, `saved-${i}`)}</div><div class="narrow">${theatreDrawing(state, true, `saved-narrow-${i}`)}</div></figure>`).join("")}
<section><h2>The consequences of the two instructions</h2><table><caption>Both schemes use the same initial diameter of ${s.diameter} m</caption><thead><tr><th scope="col">Model quantity</th><th scope="col">Roman</th><th scope="col">Greek, three centres</th></tr></thead><tbody><tr><th scope="row">Stage depth</th><td>${n(roman.stageDepth)} m</td><td>${n(greek.stageDepth)} m</td></tr><tr><th scope="row">Constructed orchestra area</th><td>${n(roman.area)} m²</td><td>${n(greek.area)} m²</td></tr><tr><th scope="row">Platform height in the text</th><td>No more than 5 feet</td><td>10–12 feet</td></tr></tbody></table><p>The height limits are in the source’s feet. They are not converted into the metre scale of the plan. The plan’s areas and square roots are modern calculations, not measurements or computations attributed to Vitruvius.</p>${s.kind === "greek" ? `<h3>The saved cross-section</h3><p>At y = ${n(m.probeY)} m, your selected boundary is ${n(m.probeWidth)} m wide. A continuation of the initial circle is ${n(m.singleWidth)} m wide. Three-centre orchestra area: ${n(m.prescribedArea)} m². Single-circle alteration: ${n(m.singleArea)} m².</p><div class="measure">${theatreWidthDrawing(s, "saved-width")}</div>` : ""}<p class="downloads"><a download="gonia-theatre.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(theatreCsv(s)))}">Save the coordinates and measurements</a></p></section>
<section><h2>Read the instructions</h2><p>Selected excerpts from Vitruvius V.6–7, F. Krohn’s 1912 Latin edition. English and grammar notes are new. Angle brackets preserve editorial supplements; line-end hyphens are joined, numeral case is normalized, and source line numbers and apparatus are omitted here. Inspect the complete pages below.</p>${theatrePassages.map((p, i) => `<article class="passage"><p class="meta">${p.ref}</p><h3>${i + 1}. ${p.title}</h3><p class="latin" lang="la">${esc(p.latin)}</p><p>${p.english}</p><p><strong lang="la">${p.word}</strong> · ${p.gloss}</p><p>${p.grammar}</p></article>`).join("")}</section>
<section><h2>Keep the vocabulary</h2>${Object.values(theatreParts)
    .map(
      (p) =>
        `<article class="passage"><h3>${p.title}</h3><p><span lang="grc">${p.greek}</span> · <span lang="la">${p.latin}</span></p><p>${p.note}</p></article>`,
    )
    .join(
      "",
    )}<p>Greek headwords explain parts and tools. They are not a Greek original of this Latin passage.</p></section><section><h2>What these drawings establish</h2><p>${THEATRE_LIMITS}</p><p>The Greek lower arcs use radius 2R and centres at the opposite ends of the initial diameter. Their boundaries are x = ±(√(4R² − y²) − R) below y = 0; the stage front is y = −R/√2. A single circle uses x = ±√(R² − y²). The comparison retains the stage lines and changes only this boundary. The table therefore isolates a geometric consequence, not a historical alternative plan.</p><p>Krohn prints ‘sinistram’ in V.7.1; the apparatus records ‘dextram’ in the textual tradition. The model follows the printed reading, including the cross-diameter compass motion. Leake’s 1824 and Morgan’s 1914 diagrams are later interpretations, not ancient surviving plans or archaeological surveys.</p></section>
${theatreSources.map((source) => `<figure class="source"><figcaption><h2>${source.title}</h2><p>${source.note} <a href="${source.url}">Source volume</a>.</p></figcaption><img src="${data(`sources/theatre/${source.file}`, "image/jpeg")}" alt="${esc(source.title)}: historical source image"><p class="identity">SHA-256 ${THEATRE_ASSETS[`sources/theatre/${source.file}`]}</p></figure>`).join("")}
<footer><p>Historical source texts and diagrams: public domain. New English, teaching notes and diagrams: MIT, Anton Soloviev, 2026.</p><details class="licenses"><summary>Copyright and redistribution notices</summary><h3>Code and new text</h3><pre>${esc(license)}</pre>${notices}</details></footer></main></body></html>`;
}

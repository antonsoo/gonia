import { HOIST_NAMES, type HoistState, hoistJson, hoistModel, hoistQuery } from "./core/hoist";
import { HOIST_ASSETS } from "./hoist-assets";
import { HOIST_LIMITS, HOIST_SOURCE, hoistPassages, hoistSources } from "./hoist-content";
import { he, hn, hoistDrawing, hoistTable, hoistWindlass } from "./hoist-drawing";
import ink from "./hoist-ink.css?inline";
export function saveHoist(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function variants(s: HoistState): HoistState[] {
  return (["single", "three", "five"] as const).flatMap((rig) =>
    (rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const)).map((anchor) => ({
      ...s,
      rig,
      anchor,
    })),
  );
}
export function hoistCsv(s: HoistState): string {
  const rows: (string | number)[][] = [
    [
      "scope",
      "rig",
      "anchor",
      "held_distance_kind",
      "distance_m",
      "weight_N",
      "arm_over_drum",
      "supports",
      "rise_m",
      "rope_wound_m",
      "tension_N",
      "hand_force_N",
      "hand_path_m",
      "load_work_J",
      "rope_work_J",
      "hand_work_J",
      "visible_rope_m",
      "initial_visible_rope_m",
      "drum_turns",
      "model",
    ],
  ];
  const add = (scope: string, state: HoistState) => {
    const m = hoistModel(state);
    rows.push([
      scope,
      state.rig,
      state.anchor,
      state.hold,
      state.distance,
      state.weight,
      state.arm,
      m.supports,
      m.rise,
      m.rope,
      m.tension,
      m.hand,
      m.handPath,
      m.work,
      m.ropeWork,
      m.handWork,
      m.length,
      m.initialLength,
      m.turns,
      "Ideal quasi-static parallel strands; no friction or rope mass; total weight includes moving hardware; modern SI choices; fixed tie is our alteration.",
    ]);
  };
  add("selected", s);
  for (const v of variants(s)) {
    add("same_task", v);
    for (let i = 0; i <= 40; i++) add("slider_trace", { ...v, distance: i / 20 });
  }
  return `${rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function hoistSvg(s: HoistState): string {
  return hoistDrawing(s, "saved-hoist").replace(
    /(<svg[^>]*>)/,
    `$1<style>${ink}</style><metadata>${he(hoistJson(s))}</metadata>`,
  );
}
async function assets(): Promise<Map<string, Uint8Array<ArrayBuffer>>> {
  return new Map(
    await Promise.all(
      Object.entries(HOIST_ASSETS).map(async ([path, hash]) => {
        const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
        if (!response.ok) throw new Error(`Could not load ${path}. Reload online and try again.`);
        const bytes = new Uint8Array(await response.arrayBuffer()),
          actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
            b.toString(16).padStart(2, "0"),
          ).join("");
        if (actual !== hash)
          throw new Error(`This edition could not verify ${path}. Reload online before saving.`);
        return [path, bytes] as const;
      }),
    ),
  );
}
function b64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
export async function hoistReading(s: HoistState): Promise<string> {
  const files = await assets(),
    data = (path: string, mime: string) => {
      const b = files.get(path);
      if (!b) throw new Error(`Missing ${path}`);
      return `data:${mime};base64,${b64(b)}`;
    },
    m = hoistModel(s);
  const other: HoistState = { ...s, anchor: s.anchor === "moving" ? "fixed" : "moving" };
  const language = (text: string) =>
    he(text).replace(/(εὐθεῖαν|κυκλωτήν|ὑπομόχλιον)/g, '<span lang="grc">$1</span>');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia — Where you tie the rope changes the lift</title><style>@font-face{font-family:Noto;src:url('${data("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${data("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}*{box-sizing:border-box}body{margin:auto;max-width:1050px;padding:30px;color:#233341;background:white;font:16px/1.65 Plex,Arial,sans-serif}h1,h2,h3,.latin,[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400}h1{font-size:40px;line-height:1.25}h2{font-size:29px;line-height:1.35}h3{font-size:21px}p{max-width:78ch}a{color:#315f81}.small{font-size:13px;overflow-wrap:anywhere}section{margin-top:35px}.diagram{max-width:700px;margin:auto;background:#eef3f5}.diagram svg{display:block;width:100%;height:auto}.windlass{max-width:450px}.latin{font-size:23px;line-height:1.9}.passage{margin:30px 0}.word{margin:14px 0}.word strong{font-weight:600}.table{overflow:auto}table{border-collapse:collapse;font-size:13px;min-width:850px;width:100%}caption{text-align:left}td,th{padding:10px;text-align:left;border-bottom:1px solid #bac7ce}th small{display:block;font-weight:400}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px}.printed img{width:100%;height:auto;display:block}figcaption{font-size:13px}.work{padding:12px;background:#eef3f5}${ink}@media(max-width:600px){body{padding:20px}h1{font-size:32px}.latin{font-size:20px}}@page{size:A4;margin:15mm}@media print{body{padding:0;font-size:10pt}h1{font-size:28pt}h2{font-size:21pt;break-after:avoid}h3{break-after:avoid}.diagram{max-width:145mm;break-inside:avoid}.windlass{max-width:110mm}.latin{font-size:13pt}.word{break-inside:avoid}.table{overflow:visible}table{min-width:0;font-size:7pt}td,th{padding:5px}.printed{break-before:page;margin:0}.printed img{max-height:240mm;max-width:100%;width:auto;margin:auto}.printed figcaption{font-size:8pt}.licenses,.downloads{display:none}}</style></head><body><header><p>Gonia / measured ancient architecture</p><h1>Where you tie the rope changes the lift.</h1><p>${he(HOIST_NAMES[s.rig])}; end on ${s.anchor === "moving" ? "moving assembly" : "fixed support"}; held ${s.hold === "rise" ? "load rise" : "rope take-up"} ${hn(s.distance)} m; weight ${hn(s.weight)} N; arm/drum ratio ${s.arm}.</p><p class="small">Edition ${he(__GONIA_EDITION__)}. <a href="https://antonsoo.github.io/gonia/hoist.html${he(hoistQuery(s))}#hw-workshop">Reopen these settings</a>. This file embeds its fonts, diagrams, measurements, language notes and five full printed pages. It contains no scripts.</p><div class="downloads"><a download="gonia-hoist.json" href="data:application/json;charset=utf-8,${he(encodeURIComponent(hoistJson(s)))}">Save editable experiment</a> / <a download="gonia-hoist.csv" href="data:text/csv;charset=utf-8,${he(encodeURIComponent(hoistCsv(s)))}">Save exact measurements</a></div></header><main><section><h2>Follow the actual rope route</h2><div class="diagram">${hoistDrawing(s, "reading-selected")}</div><p>${m.supports} supporting portions, each pulling upward with ${hn(m.tension, 6)} N. The load rises ${hn(m.rise, 6)} m while ${hn(m.rope, 6)} m wind onto the drum. The total weight includes moving hardware.</p><p>The source ties the end to the lower block. A tie on the fixed support is our modern alteration. A single fixed wheel is a modern control. The wheels are spread sideways to expose the route; the source locates wheels within each block. The drawing is not a scale restoration of the frame.</p>${s.rig !== "single" ? `<h3>Change only the tied end</h3><div class="diagram">${hoistDrawing(other, "reading-other")}</div><p>The same wheel count now gives ${hoistModel(other).supports} supporting portions. The same numeric ${s.hold === "rise" ? "load rise" : "rope take-up"} is held fixed. All other settings stay the same.</p>` : ""}</section><section><h2>Turn the windlass</h2><div class="diagram windlass">${hoistWindlass(s, "reading-drum")}</div><p>Chosen drum R = 0.15 m; arm L = ${hn(m.armRadius)} m; tangential hand force ${hn(m.hand, 6)} N. The hand path is ${hn(m.handPath, 6)} m and the drum makes ${hn(m.turns, 6)} turns.</p><div class="work"><p>Load: ${hn(s.weight)} N × ${hn(m.rise, 6)} m ≈ ${hn(m.work, 6)} J.</p><p>Rope: ${hn(m.tension, 6)} N × ${hn(m.rope, 6)} m ≈ ${hn(m.ropeWork, 6)} J.</p><p>Hand: ${hn(m.hand, 6)} N × ${hn(m.handPath, 6)} m ≈ ${hn(m.handWork, 6)} J.</p></div><p>With n supporting portions, each moving straight run shortens by the rise h; circular arcs retain their length. Thus rope take-up s = n h. Equal tension T balances W: n T = W. The ideal windlass balances moments: F L = T R. Its hand path is (L/R)s, so W h = T s = F × hand path. Displayed values are rounded; the embedded CSV retains full floating-point values.</p></section><section><h2>Compare the same controlled distance</h2><p>${s.hold === "rise" ? "The same weight rises through the same distance in every row. More supports reduce tension and require more rope; load work stays the same." : "The same amount of rope is wound in every row. More supports reduce tension and the load rises less; this smaller lifting task requires less work."}</p><div class="table">${hoistTable(s)}</div></section><section><h2>Read the Latin and quoted Greek</h2>${hoistPassages.map((p) => `<article class="passage"><h3>${he(p.title)}</h3><p class="small">${he(p.ref)}</p><p class="latin" lang="la">${language(p.latin)}</p><p>${he(p.english)}</p><p class="small">${he(p.note)}</p>${p.words.map((w) => `<p class="word"><strong lang="${w.greek ? "grc" : "la"}">${he(w.form)}</strong>: ${he(w.gloss)}. ${he(w.note)}</p>`).join("")}</article>`).join("")}<p>These are excerpts. Line-end hyphens are joined; angle brackets retain editorial additions; … marks omissions. The first sentence crosses pp.226–227. The final excerpt joins the fulcrum term on p.232 to the arm comparison on p.233. The five source pages preserve the complete surrounding text and apparatus.</p></section><section><h2>Source and model boundaries</h2><p>${HOIST_LIMITS}</p><p>Vitruvius, <i>De architectura</i>, X.2.1–3 and X.3.1–3, ed. F. Krohn, Leipzig: B. G. Teubner, 1912. <a href="${HOIST_SOURCE}">Original public-domain volume</a>. Krohn's upper-wheel count II and summum are additions attributed to Joc.; his apparatus also distinguishes the Greek κυκλωτήν reading from Latin-letter witnesses. Nothing here repairs those textual layers silently.</p><p>The ideal numerical laws are modern analysis; <a href="https://openstax.org/books/college-physics-2e/pages/9-5-simple-machines">OpenStax's simple-machines discussion</a> explains the background. Historical text and scans: public domain. Code, new English, language notes and diagrams: MIT, Anton Soloviev, 2026. Every embedded scan, font and license was verified against its edition's SHA-256 identity before export.</p></section>${hoistSources.map((p) => `<figure class="printed"><img src="${data(`sources/hoist/krohn-${p.key}.jpg`, "image/jpeg")}" alt="Complete Krohn 1912 ${p.key === "title" ? "title page" : `printed page ${p.key} and critical apparatus`}"><figcaption>Krohn 1912, ${p.key === "title" ? "title page" : `printed p. ${p.key}`}; PDF page ${p.pdf}. ${he(p.title)}.</figcaption></figure>`).join("")}<details class="licenses"><summary>Embedded font copyrights and licenses</summary>${["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"].map((p) => `<h3>${he(p)}</h3><pre>${he(new TextDecoder().decode(files.get(p)))}</pre>`).join("")}</details></main></body></html>`;
}

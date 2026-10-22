import { type FlutingState, flutingCsv, flutingQuery, recipeNames } from "./core/fluting";
import plateStyles from "./fluting.css?inline";
import { flutingSources, readingContent } from "./fluting-content";
import { drumDrawing, printTemplate, profileDrawing } from "./fluting-drawing";
import { flutingFontLicenses } from "./fluting-font-licenses";

const fonts = {
  "NotoSerif-Regular.ttf": "5473d2e43bdd018ee124a4addba8091fd0a29894b121cbb741023af6549662b6",
  "IBMPlexSans-Regular.woff2": "ba711a3085ff9f27440b6b9c4550cfc47c97bf36591d5da958b975bb3add8c1a",
};
function save(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
async function embed(path: string, digest: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("A source page could not be loaded. Reconnect and try again.");
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== digest)
    throw new Error(
      "A source page or font differs from this edition. Reload the workshop before saving.",
    );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The source could not be embedded."));
    reader.readAsDataURL(
      new Blob([bytes], {
        type: path.endsWith(".jpg")
          ? "image/jpeg"
          : path.endsWith(".ttf")
            ? "font/ttf"
            : "font/woff2",
      }),
    );
  });
}
export async function downloadFluting(kind: "template" | "reading" | "csv", s: FlutingState) {
  if (kind === "template") {
    save(`gonia-${s.recipe}-${s.width}mm.svg`, printTemplate(s), "image/svg+xml");
    return;
  }
  if (kind === "csv") {
    save("gonia-fluting.csv", flutingCsv(s), "text/csv");
    return;
  }
  const [images, serif, sans] = await Promise.all([
    Promise.all(flutingSources.map((p) => embed(`./sources/fluting/${p.file}`, p.sha256))),
    embed("./fonts/NotoSerif-Regular.ttf", fonts["NotoSerif-Regular.ttf"]),
    embed("./fonts/IBMPlexSans-Regular.woff2", fonts["IBMPlexSans-Regular.woff2"]),
  ]);
  const csv = encodeURIComponent(flutingCsv(s));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>The cut inside a column · Gonia</title><style>@font-face{font-family:Noto;src:url(${serif})}@font-face{font-family:Plex;src:url(${sans})}:root{--ink:#27352f;--green:#405a43;--muted:#5f6559;--orange:#963b25;--line:#bfc3b3;--paper:#f4f1e8}*{box-sizing:border-box}body{max-width:1060px;padding:20px 25px;margin:auto;background:#f4f1e8;color:var(--ink);font:16px/1.6 Plex,Arial,sans-serif}h1,h2,h3{font-weight:400;line-height:1.2}h1,h2{font-family:Noto,Georgia,serif}a{color:var(--green)}figure{margin:0}svg{display:block;width:100%}details{margin:15px 0}.reading-credit{border-top:1px solid var(--line);padding:16px 0;font-size:13px}.printed-pages figure{margin-top:25px}.printed-pages img{display:block;width:100%;height:auto}.printed-pages figcaption{font-size:14px}p{margin:0 0 16px}pre{white-space:pre-wrap;font:11px/1.5 monospace;overflow-wrap:anywhere}${plateStyles}@page{size:A4;margin:13mm}@media print{body{padding:0;margin:0;background:white;font-size:11px;max-width:none}h1{font-size:28px}h2{font-size:21px}.fluting-section{break-inside:auto;padding:15px 0}.fluting-readings{display:grid;grid-template-columns:1fr 1fr;gap:25px}.fluting-grammar{display:grid;grid-template-columns:1fr 1fr;gap:20px}.source-words,.fluting-grammar h3{font-size:15px}.genitive-line>[lang]{font-size:18px}.fluting-plates{display:grid;grid-template-columns:1.3fr 1fr;break-inside:avoid}.fluting-plates figcaption{font-size:10px}.reading-credit{font-size:9px;line-height:1.3;padding:4px 0;break-inside:avoid}.reading-credit p{margin:0}.reading-credit details{display:none}.printed-pages{break-before:auto}.printed-pages>h2{display:none}.printed-pages figure{break-before:page;break-inside:avoid}.printed-pages img{max-height:240mm;width:auto;max-width:100%;margin:auto}.printed-pages figcaption{font-size:10px}h2,h3{break-after:avoid}}</style></head><body class="fluting-page"><h1>The cut inside a column</h1><p>${recipeNames[s.recipe]}. Chosen groove width ${s.width} mm. Tool at ${s.point}% of the arc. Ionic fillets ${s.fillet}% of each pitch (a modern choice). All drawings preserve equal horizontal and vertical scales.</p><div class="fluting-plates"><figure><h3>The hollow and the tool</h3>${profileDrawing(s, false)}<figcaption>Thin rays reach both edges. The vermilion tool has a fixed 90° corner; its second contact may fall short of B. The gap is measured along A–B.</figcaption></figure><figure><h3>The repeated drum section</h3>${drumDrawing(s)}<figcaption>Real circular hollows and outer-circle fillets. The dashed circle is the uncut shaft. This geometry does not predict structural strength or visual perception.</figcaption></figure></div><p>Doric square-and-compass construction: depth = width × (√2 − 1) / 2; edge angle 135°. Ionic semicircle: depth = width / 2; edge angle 90°. The Doric flat-faced alternative has no hollow. Prescriptions do not establish that all surviving ancient profiles follow these curves.</p><p><a download="gonia-fluting.csv" href="data:text/csv;charset=utf-8,${csv}">Save the exact coordinates and all three comparisons (CSV)</a>. <a download="gonia-template.svg" href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(printTemplate(s))}">Save the millimetre template (SVG)</a>. Print at actual size and check the 25 mm bar; physical printer scaling has not been tested.</p>${readingContent()}<aside class="reading-credit"><p><a href="https://antonsoo.github.io/gonia/fluting.html${flutingQuery(s)}#fluting-workshop">Reopen these settings in Gonia</a>. Source pages and fonts are embedded. Code, diagrams and new English: Anton Soloviev, 2026, MIT. Vitruvius, Aristotle and these historical printed pages: public domain. Fonts retain their licenses in the Gonia source repository.</p><details><summary>Embedded font copyrights and licenses</summary><pre>${flutingFontLicenses.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</pre></details></aside><section class="printed-pages"><h2>The complete printed evidence</h2>${flutingSources.map((p, i) => `<figure><img src="${images[i]}" width="${p.width}" height="${p.height}" alt="${p.label}: complete printed page"><figcaption><strong>${p.label}</strong>. ${p.note} <a href="${p.url}">Library source</a>.</figcaption></figure>`).join("")}</section></body></html>`;
  // Static readings have no source chooser. Each passage links directly to its embedded page.
  const result = html
    .replaceAll("<details><summary>Read", "<details open><summary>Read")
    .replace(/href="#fluting-sources" data-source="(\d)"/g, (_, i) => `href="#printed-${i}"`)
    .replace(
      /<figure><img src=/g,
      (() => {
        let i = 0;
        return () => `<figure id="printed-${i++}"><img src=`;
      })(),
    );
  save("gonia-fluting-reading.html", result, "text/html");
}

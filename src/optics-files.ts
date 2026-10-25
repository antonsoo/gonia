import manifest from "../public/sources/optics/manifest.json";
import {
  degrees,
  opticsNumber as num,
  type OpticsMode,
  type OpticsState,
  opticsModel,
  opticsQuery,
} from "./core/optics";
import { OPTICS_LIMITS, opticsPassages, opticsSourcePages } from "./optics-content";
import { oe, opticsDetail, opticsProjection, opticsScene } from "./optics-drawing";
export function saveOptics(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function opticsCsv(s: OpticsState) {
  const rows: (string | number)[][] = [
    [
      "scope",
      "treatment",
      "horizontal_distance_m",
      "face_centre_height_m",
      "eye_height_m",
      "face_edge_length_m",
      "forward_angle_degrees",
      "upper_ray_m",
      "lower_ray_m",
      "upper_minus_lower_m",
      "angle_from_face_on_degrees",
      "upper_lower_projected_half_ratio",
      "bottom_normalized_image",
      "lower_quarter_normalized_image",
      "centre_normalized_image",
      "upper_quarter_normalized_image",
      "top_normalized_image",
      "model",
    ],
  ];
  const add = (scope: string, state: OpticsState) => {
    const m = opticsModel(state);
    rows.push([
      scope,
      state.mode,
      m.distance,
      m.height,
      m.eye,
      m.length,
      degrees(m.angle),
      m.top.ray,
      m.bottom.ray,
      m.difference,
      degrees(m.error),
      m.upperLowerRatio,
      ...m.points.map((p) => p.normalizedImage),
      "Modern flat face rotated about its centre; pinhole aimed at centre; SI dimensions chosen; source supplies 1:12 slope only.",
    ]);
  };
  add("selected", s);
  for (const mode of ["vertical", "source", "normal", "custom"] as OpticsMode[]) {
    add("same_observer", { ...s, mode });
    for (let distance = 50; distance <= 4000; distance += 10)
      add("distance_trace", { ...s, mode, distance });
  }
  return `${rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function opticsSvg(s: OpticsState) {
  return opticsScene(s).replace(
    /(<svg[^>]*>)/,
    `$1<metadata>${oe(JSON.stringify({ settings: s, scope: OPTICS_LIMITS, source: "Vitruvius III.5.13, Krohn 1912 p.74" }))}</metadata>`,
  );
}
async function sourceAssets() {
  return new Map(
    await Promise.all(
      Object.entries(manifest.assets).map(async ([path, hash]) => {
        const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
        if (!response.ok) throw new Error(`Could not load ${path}. Reload online before saving.`);
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
function b64(bytes: Uint8Array) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 16384)
    text += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(text);
}
export async function opticsBook(s: OpticsState) {
  const assets = await sourceAssets(),
    m = opticsModel(s),
    uri = (path: string, type: string) => {
      const bytes = assets.get(path);
      if (!bytes) throw new Error(`Missing ${path}`);
      return `data:${type};base64,${b64(bytes)}`;
    };
  const url = `https://antonsoo.github.io/gonia/optics.html?${opticsQuery(s)}#vp-workshop`;
  const comparison = (["vertical", "source", "normal", "custom"] as OpticsMode[])
    .map((mode) => {
      const v = opticsModel({ ...s, mode });
      return `<tr><th scope="row">${mode === "vertical" ? "Vertical" : mode === "source" ? "Source 1:12" : mode === "normal" ? "Face the eye" : "Custom angle"}</th><td>${num(degrees(v.angle), 5)}°</td><td>${num(v.top.ray, 5)}</td><td>${num(v.bottom.ray, 5)}</td><td>${num(v.upperLowerRatio, 5)}</td></tr>`;
    })
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Gonia — One twelfth, seen from where?</title><style>
 @font-face{font-family:Noto;src:url('${uri("fonts/NotoSerif-Regular.ttf", "font/ttf")}')}@font-face{font-family:Plex;src:url('${uri("fonts/IBMPlexSans-Regular.woff2", "font/woff2")}')}*{box-sizing:border-box}body{max-width:940px;margin:30px auto;padding:0 24px;color:#27352f;background:#f4f1e8;font:17px/1.6 Plex,Arial,sans-serif}h1,h2,h3,[lang=la],[lang=grc]{font-family:Noto,Georgia,serif;font-weight:400}h1{font-size:44px;line-height:1.2}h2{font-size:29px;line-height:1.3}h3{font-size:22px}a{color:#405a43;overflow-wrap:anywhere}.vp-diagram{display:block;width:100%;height:auto}.small,figcaption{font-size:14px}.latin{font-size:21px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pair>div{min-width:0}section{border-top:1px solid #bfc3b3;padding:24px 0;margin-top:25px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #bfc3b3;padding:8px}th{font-weight:400}.word{border-left:2px solid #bfc3b3;padding-left:13px;margin:18px 0}.word p{margin:5px 0}.source img{display:block;max-width:100%;height:auto}.object img{display:block;width:auto;max-width:100%;max-height:620px;height:auto;margin:auto}figure{margin:0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 monospace}.source{break-before:page}.source h2{font-size:21px}.no-split{break-inside:avoid}@page{size:A4;margin:16mm}@media(max-width:600px){body{padding:0 15px}.pair{grid-template-columns:1fr}h1{font-size:34px}.table-pan{overflow:auto}}@media print{body{margin:0;padding:0;max-width:none;background:white;font-size:10pt;line-height:1.45}h1{font-size:27pt}h2{font-size:18pt}h3{font-size:14pt}.latin{font-size:13pt}p{orphans:3;widows:3}.small,figcaption{font-size:9pt}.source img{width:auto;height:auto;max-width:100%;max-height:225mm;margin:auto}.source{border:0;margin:0;padding:0}.source p{margin:6px 0}.object img{max-height:170mm}.readings{break-before:page}.passage{break-before:page}.diagram-page{break-before:page}.table-page{break-before:page}table{font-size:9pt}.word{break-inside:avoid}.credits{break-before:page}.vp-diagram text{fill:#27352f}}
 </style></head><body><main><h1>One twelfth.<br>Seen from where?</h1><p>Vitruvius prescribes a forward inclination of one twelfth of a member’s height. Move the observer; compare the rays, the face normal and the projected spacing of equal physical marks.</p><p><strong>Scope.</strong> ${OPTICS_LIMITS}</p><p>Selected treatment: <strong>${oe(s.mode)}</strong>. Horizontal distance ${num(m.distance, 1)} m; face centre ${num(m.height, 1)} m; eye ${num(m.eye, 1)} m; face edge ${num(m.length, 1)} m. Actual forward angle ${num(degrees(m.angle), 5)}°. Saved custom angle ${num(s.angle / 10, 1)}°. Selected passage ${s.reading + 1}.</p><p class="small">This self-contained file has no script and makes no automatic network request. Follow links to consult the online sources. New English, notes, code and diagrams: Anton Soloviev, 2026, MIT. Historical text and scans: public domain. Museum image and data: The Met Open Access, CC0.</p><p class="small">Reopen this viewpoint: <a href="${oe(url)}">${oe(url)}</a></p>
 <section class="diagram-page"><h2>The selected observer and member</h2>${opticsScene(s)}<p>Upper ray: ${num(m.top.ray, 5)} m. Lower ray: ${num(m.bottom.ray, 5)} m. Upper minus lower: ${num(m.difference, 5)} m. Relation: ${oe(m.relation)}.</p><div class="pair"><div>${opticsDetail(s)}</div><div>${opticsProjection(s)}</div></div><p>Five marks divide the physical face into four equal lengths. The camera aims at C. Image heights use the face-on L/R scale, where R is the distance to C. Upper / lower projected half-length ratio: ${num(m.upperLowerRatio, 5)}.</p><p class="small">Only the large side view shares one horizontal and vertical world scale. The angular detail and two normalized rulers have separate scales. No full temple, carved profile or human perceptual response is reconstructed.</p></section>
 <section class="table-page"><h2>Four treatments, the same observer</h2><div class="table-pan" tabindex="0" role="region" aria-label="Four treatments at the same observer; scroll horizontally"><table><thead><tr><th>Treatment</th><th>Forward angle</th><th>Upper ray, m</th><th>Lower ray, m</th><th>Image half ratio</th></tr></thead><tbody>${comparison}</tbody></table></div><h3>The chosen criterion</h3><p>Let d be horizontal distance, H face-centre height and e eye height. The upward tangent of a forward-leaning face is (−sin α, cos α). It is perpendicular to the centre-to-eye vector (−d, e−H) when tan α = (H−e)/d. Endpoint rays have equal lengths under the same condition.</p><p>For the 1:12 slope, d = 12(H−e). At these chosen heights the model gives ${num(m.sourceDistance, 1)} m. Vitruvius supplies no such viewing-distance rule. Equal rays are our geometric front-on criterion, not a measurement of an ancient viewer’s experience.</p><p>The source treatment’s ${num(m.length, 1)} m edge has vertical rise ${num(m.sourceVerticalRise, 5)} m and forward offset ${num(m.sourceOffset, 5)} m. Their ratio is 12:1. The absolute dimensions and rotation about the centre are chosen.</p><p>For a point P, let q=P−E and let v be the unit direction from the eye to C. Pinhole height is (q·v⊥)/(q·v). Multiplying by R/L gives the normalized ruler coordinate. The face-on reference has endpoints −1/2 and 1/2. This projection measures spacing, not apparent verticality.</p></section>
 <div class="readings">${opticsPassages.map((p, i) => `<section class="passage"><h2>${i + 1}. ${oe(p.title)}</h2><p class="small">Vitruvius ${p.ref}; Krohn 1912, p. ${p.page}, lines ${p.lines}.</p><p class="latin" lang="la">${oe(p.latin)}</p><p>${oe(p.english)}</p><p>${oe(p.note)}</p>${p.words.map((w) => `<div class="word"><p><strong lang="la">${oe(w.word)}</strong> · ${oe(w.gloss)}</p><p>${oe(w.note)}</p>${w.greek ? `<p>Greek companion <span lang="grc">${oe(w.greek)}</span>; <a href="${w.lexicon}">lexicon evidence</a>. This is a learning aid, not a Greek original of the Latin.</p>` : ""}</div>`).join("")}</section>`).join("")}</div>
 <section class="object"><h2>Locate a capital, not a measured tilt</h2><figure><img src="${uri("sources/optics/met-252453-DP144130.jpg", "image/jpeg")}" alt="Reassembled Ionic capital, partial fluted shaft and base from Sardis, displayed in the Metropolitan Museum."><figcaption>Marble column from the Temple of Artemis at Sardis, Greek, ca. 300 BCE. The Met, 26.59.1. Gift of The American Society for the Excavation of Sardis, 1926. CC0; original JPEG unchanged.</figcaption></figure><p>The volutes locate the capital. The source’s upper members belong above it; the upper building is absent. The display is reassembled from one or more columns; parts of the shaft are restored and the profiled base below the torus is a copy. The modern museum columns behind it are separate objects.</p><p><a href="${manifest.photograph.objectURL}">The museum’s object record</a> · <a href="https://www.metmuseum.org/hubs/open-access">The Met Open Access policy</a>. This photograph is not a source for the model’s inclination.</p></section>
 ${opticsSourcePages.map((p) => `<section class="source"><h2>${p.key === "title" ? "Title" : `Printed page ${p.key}`} · Krohn 1912</h2><p class="small">${oe(p.label)}. PDF page ${p.pdf}. Complete page, including apparatus where present.</p><img src="${uri(p.file, "image/jpeg")}" alt="Complete ${p.key === "title" ? "title page" : `printed page ${p.key}`} of Krohn’s 1912 edition"><p class="small"><a href="${manifest.originalURL}#page=${p.pdf}">Consult the identified original volume</a>.</p></section>`).join("")}
 <section class="credits"><h2>Source identities and licences</h2><p>${oe(manifest.edition)}. The Latin excerpts join line-end hyphens and capitalize XII. They are selected clauses, not complete chapters. The preceding discussion in III.5.9 includes an ancient air-density explanation; our geometric analysis does not use it.</p><p class="small">Original PDF SHA-256: ${manifest.originalSha256}. Full pages 72–74 rendered at 2100 pixels on the long edge, JPEG quality 88, without cropping or retouching. The existing complete title-page image is reused.</p><pre>${oe(new TextDecoder().decode(assets.get("sources/optics/NOTICES.txt")))}</pre><h3>Retained source and font SHA-256 identities</h3><pre>${oe(JSON.stringify(manifest.assets, null, 2))}</pre><h3>Retained original museum metadata</h3><pre>${oe(new TextDecoder().decode(assets.get("sources/optics/met-252453.json")))}</pre>${["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"].map((path) => `<h3>${oe(path)}</h3><pre>${oe(new TextDecoder().decode(assets.get(path)))}</pre>`).join("")}</section></main></body></html>`;
}

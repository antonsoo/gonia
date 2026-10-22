import {
  buildSpacing,
  compareSpacing,
  measure,
  normalizeSpacing,
  readSpacing,
  type SpacingSystem,
  spacingSystems,
  writeSpacing,
} from "./core/spacing";
import { escapeHtml } from "./drawing";
import { offlineStatus } from "./offline";
import {
  type Dimension,
  dimensionWords,
  greekParts,
  heightPassage,
  modulePassage,
  sourceImage,
  sourcePages,
  spacingNames,
  spacingPassages,
  spacingSource,
} from "./spacing-content";
import { spacingDrawing } from "./spacing-drawing";
import { spacingStudy } from "./spacing-study";

const get = <T extends HTMLElement = HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing ${id}`);
  return element as T;
};
let state = readSpacing(location.search);
let dimension: Dimension = "gap";
let sourcePage: number = spacingPassages[state.system].page;
const compact = matchMedia("(max-width: 650px)");
get("app").innerHTML = `
<a class="skip" href="#spacing-workshop">Skip to the spacing workshop</a>
<header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./#workshop">Doric corner</a><a href="./spacing.html" aria-current="page">Column spacing</a><a href="./entasis.html">Entasis</a></nav></header>
<main class="spacing-main">
<section class="spacing-intro"><h1>Give the entrance<br>more room.</h1><div><p>For Vitruvius, a row of columns is more than a repeating pattern. Its gaps determine the approach, its proportions and the span of the beams above.</p><p>Choose a spacing system. Keep the front fixed, or keep one column diameter fixed, and watch the rest follow.</p></div></section>
<section id="spacing-workshop" aria-labelledby="spacing-title"><h2 id="spacing-title" tabindex="-1">The space between columns</h2><div class="system-choices" role="group" aria-label="Spacing system">${spacingSystems.map((system) => `<button type="button" data-system="${system}" aria-pressed="false"><strong>${spacingNames[system].title}</strong><span>${spacingNames[system].short}</span></button>`).join("")}</div>
<div class="spacing-workbench"><aside class="spacing-controls" aria-label="Drawing controls"><label for="column-count">Columns across the front</label><select id="column-count"><option value="4">4 · tetrastyle</option><option value="6">6 · hexastyle</option><option value="8">8 · octastyle</option></select>
<fieldset><legend>What stays fixed?</legend><label><input type="radio" name="scale-basis" value="front"> Front width</label><label><input type="radio" name="scale-basis" value="diameter"> Lower column diameter</label></fieldset>
<div id="front-setting"><label for="front-width">Front between outer shaft faces <output id="front-output" for="front-width"></output></label><input type="range" id="front-width" min="6" max="36" step="0.25"><p>Excludes the steps and projecting bases.</p></div>
<div id="diameter-setting"><label for="lower-diameter">Lower diameter <output id="diameter-output" for="lower-diameter"></output></label><input type="range" id="lower-diameter" min="0.5" max="2" step="0.05"><p>D is the unit used for every gap and height.</p></div>
<div id="wide-setting"><label for="wide-gap">Choose an illustrative wide gap <output id="wide-output" for="wide-gap"></output></label><input type="range" id="wide-gap" min="3.25" max="6" step="0.25"><p>Vitruvius gives no numerical araeostyle gap in this passage. This value is your example.</p></div>
<div id="centre-setting"><label class="centre-choice"><input id="equal-centre" type="checkbox"> Try making every gap equal</label><p>This deliberately removes the wider central opening prescribed for eustyle spacing.</p></div>
<p class="scale-note">Metres give the drawing a modern scale. No conversion from Roman feet is implied.</p><button type="button" id="view-spacing-drawing">View changed drawing</button>
</aside><div class="spacing-drawing-area" id="spacing-drawing-area"><div class="spacing-figure-title"><h3 id="selected-system" tabindex="-1"></h3><p id="scale-description"></p></div><p id="alteration" class="alteration" role="status"></p><div id="spacing-drawing"></div>
<div class="dimension-tools" role="group" aria-label="Dimension to inspect">${(["gap", "axis", "diameter", "height", "front"] as Dimension[]).map((d) => `<button type="button" data-dimension="${d}" aria-pressed="false">${{ gap: "Clear gap", axis: "Column axes", diameter: "Diameter", height: "Height", front: "Front width" }[d]}</button>`).join("")}</div><p id="dimension-note" class="dimension-note"></p>
<p class="spacing-drawing-note">The same drawing scale is used for all five systems at these settings. The silhouettes are schematic; bases, capitals, entasis and corner thickening are not measured here.</p>
</div></div>
<div class="spacing-numbers" aria-live="polite" aria-atomic="true" id="spacing-numbers"></div>
<article class="spacing-passage" aria-labelledby="selected-passage-title"><div><h3 id="selected-passage-title"></h3><p id="selected-latin" lang="la"></p><button type="button" id="inspect-passage">Inspect this printed page</button></div><div><p id="selected-english"></p><p id="selected-note" class="passage-note"></p></div></article>
<div class="spacing-actions"><button type="button" id="spacing-share">Copy model link</button><button type="button" id="spacing-save">Save illustrated reading</button><p id="spacing-action-status" role="status"></p></div>
</section>
<section class="spacing-comparison" aria-labelledby="comparison-title"><h2 id="comparison-title">Hold one measure. Compare the rest.</h2><p id="comparison-description"></p><div class="table-scroll" role="region" tabindex="0" aria-label="All five spacing systems; scroll to inspect all measurements"><table><thead><tr><th>System</th><th>Gap / D</th><th>Centre / D</th><th>Height / D</th><th>Diameter / m</th><th>Front / m</th><th>Height / m</th></tr></thead><tbody id="spacing-comparison"></tbody></table></div></section>
<section class="module-lesson" aria-labelledby="module-title"><div><h2 id="module-title">Where do eighteen parts come from?</h2><p id="module-intro">For six-column eustyle spacing, Vitruvius divides the front into eighteen parts. Count the columns, the four ordinary gaps and the wider central gap separately.</p><button type="button" id="try-eustyle">Set six columns across an 18 m front</button></div><div><div class="module-ledger" id="module-ledger"></div><p id="module-result"></p><p class="module-reference" lang="la">${modulePassage.latin}</p><p>${modulePassage.english}</p><p class="passage-note">${modulePassage.note}</p><a href="#spacing-sources" data-source-page="65">Inspect III.3.7 on printed page 65</a></div></section>
<section class="height-reading"><h2>Read the height as a ratio.</h2><p lang="la">${heightPassage.latin}</p><p>${heightPassage.english}</p><p class="passage-note">${heightPassage.note}</p><a href="#spacing-sources" data-source-page="66">Inspect the height rules on printed page 66</a></section>
<section class="spacing-words"><h2>Greek words inside Latin names.</h2><p>Vitruvius writes in Latin and uses names borrowed from Greek. These word-parts help you read the names; the numerical rules come from his sentences.</p><div class="greek-word-list">${greekParts.map((word) => `<article><h3 lang="grc">${word.greek}</h3><p><span class="roman">${word.roman}</span> · ${word.meaning}</p><p>${word.note} <a href="${word.source}">Dictionary entry</a>.</p></article>`).join("")}</div><p><a href="https://antonsoo.github.io/pyknon/">Hear what “close-packed” means for ancient musical intervals in Pyknon.</a></p></section>
<section id="spacing-sources" class="spacing-sources" aria-labelledby="source-title"><h2 id="source-title" tabindex="-1">Keep the printed evidence beside you.</h2><p>F. Krohn’s 1912 edition of <cite>De architectura</cite>, printed pp. 64–67. Excerpts above join line-end hyphens and use new English translations. The scan retains the editor’s critical apparatus.</p><div class="source-page-choices" role="group" aria-label="Printed source page">${sourcePages.map((page) => `<button type="button" data-page="${page}" aria-pressed="false">Page ${page}</button>`).join("")}</div><figure id="source-figure"></figure><p><a href="./sources/spacing/vitruvius-64-67.pdf">Open all four scanned pages (PDF)</a> · <a href="${spacingSource}">Complete volume at Internet Archive</a></p>
<div class="spacing-limits"><h3>What this drawing establishes</h3><p>This is a reading of the stated proportions, before the later corner-thickening adjustment. It is not a survey of a surviving temple. Column profiles, base and capital shapes, entasis, optical effects, beam strength and the complete temple plan are outside the model.</p><p>Vitruvius’s preferences and warnings are attributed to him. They are not present-day structural advice. The araeostyle slider is a chosen illustration; it does not fill a missing ancient measurement. The equal-gap eustyle setting is an explicit counterexample to the text.</p></div></section>
</main><footer><a href="./#workshop">Return to the Doric corner workshop</a><span id="spacing-offline" role="status">Preparing offline workshop…</span><a href="https://github.com/antonsoo/gonia">Source &amp; license</a></footer>`;

function drawSource() {
  document.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.page) === sourcePage));
  });
  get("source-figure").innerHTML =
    `<a href="${sourceImage(sourcePage)}"><img src="${sourceImage(sourcePage)}" width="1157" height="1800" alt="Krohn's printed Latin text and critical apparatus, page ${sourcePage}" loading="lazy"></a><figcaption>Printed page ${sourcePage}. Open the image to inspect it at full size. Public-domain scan, Internet Archive.</figcaption>`;
}
function drawDimension() {
  get("spacing-drawing").innerHTML = spacingDrawing(
    buildSpacing(state),
    dimension,
    compact.matches,
  );
  document.querySelectorAll<HTMLButtonElement>("[data-dimension]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.dimension === dimension));
  });
  get("dimension-note").innerHTML =
    `<strong lang="la">${dimensionWords[dimension].latin}</strong> · ${dimensionWords[dimension].meaning}`;
}
function update() {
  state = normalizeSpacing(state);
  const m = buildSpacing(state);
  const altered = state.system === "eustyle" && state.equalCentre;
  get<HTMLSelectElement>("column-count").value = String(state.columns);
  document.querySelectorAll<HTMLInputElement>('[name="scale-basis"]').forEach((input) => {
    input.checked = input.value === state.basis;
  });
  for (const [id, value] of [
    ["front-width", state.front],
    ["lower-diameter", state.diameter],
    ["wide-gap", state.wideGap],
  ] as const)
    get<HTMLInputElement>(id).value = String(value);
  get("front-output").textContent = `${measure(state.front)} m`;
  get("diameter-output").textContent = `${measure(state.diameter)} m`;
  get("wide-output").textContent = `${measure(state.wideGap)} D`;
  get("front-setting").hidden = state.basis !== "front";
  get("diameter-setting").hidden = state.basis !== "diameter";
  get("wide-setting").hidden = state.system !== "araeostyle";
  get("centre-setting").hidden = state.system !== "eustyle";
  get<HTMLInputElement>("equal-centre").checked = state.equalCentre;
  document.querySelectorAll<HTMLButtonElement>("[data-system]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.system === state.system));
  });
  get("selected-system").textContent =
    `${spacingNames[state.system].title} · ${state.columns} columns`;
  const fixed =
    state.basis === "front"
      ? `Front held at ${measure(state.front)} m`
      : `Lower diameter held at ${measure(state.diameter)} m`;
  get("scale-description").textContent = fixed;
  get("alteration").hidden = !altered && state.system !== "araeostyle";
  get("alteration").textContent = altered
    ? "Your alteration: every gap is 2.25 D. The source's eustyle arrangement has a 3 D central opening."
    : `Chosen example: ${measure(state.wideGap)} D clear gaps. The araeostyle passage gives no fixed numerical gap.`;
  drawDimension();
  get("spacing-numbers").innerHTML = [
    ["Lower diameter", `${measure(m.diameter)} m`, "D = one module"],
    [
      "Ordinary clear gap",
      `${measure(m.ordinaryGap)} D`,
      `${measure(m.ordinaryGap * m.diameter)} m`,
    ],
    ["Central clear gap", `${measure(m.centreGap)} D`, `${measure(m.centreGap * m.diameter)} m`],
    ["Column height", `${measure(m.height)} m`, `${measure(m.heightRatio)} D`],
    ["Front width", `${measure(m.front)} m`, `${measure(m.widthModules)} D`],
  ]
    .map(
      ([label, value, detail]) =>
        `<div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`,
    )
    .join("");
  const passage = spacingPassages[state.system];
  get("selected-passage-title").textContent =
    `Vitruvius ${passage.section} · ${spacingNames[state.system].latin}`;
  get("selected-latin").textContent = passage.latin;
  get("selected-english").textContent = passage.english;
  get("selected-note").textContent = passage.note;
  get("comparison-description").textContent =
    `${fixed}; ${state.columns} columns in each row. Araeostyle uses your chosen ${measure(state.wideGap)} D gap.${state.equalCentre ? " The eustyle row retains your deliberately altered equal centre." : ""}`;
  get("spacing-comparison").innerHTML = compareSpacing(state)
    .map(
      (item) =>
        `<tr${item.parameters.system === state.system ? ' class="selected-row"' : ""}><th>${spacingNames[item.parameters.system].title}${item.parameters.system === "araeostyle" ? " (chosen gap)" : item.parameters.system === "eustyle" && state.equalCentre ? " (altered)" : ""}</th><td>${measure(item.ordinaryGap)}</td><td>${measure(item.centreGap)}</td><td>${measure(item.heightRatio)}</td><td>${measure(item.diameter)}</td><td>${measure(item.front)}</td><td>${measure(item.height)}</td></tr>`,
    )
    .join("");
  const eustyle = buildSpacing({ ...state, system: "eustyle" });
  const prescribed = buildSpacing({ ...state, system: "eustyle", equalCentre: false });
  get("module-title").textContent =
    `Why does the text give ${measure(prescribed.widthModules)} parts?`;
  get("module-intro").textContent =
    `For ${state.columns}-column eustyle spacing, Vitruvius divides the front into ${measure(prescribed.widthModules)} parts. Count the ${state.columns} columns, the ${state.columns - 2} ordinary gaps and the wider central gap separately.`;
  get("module-ledger").innerHTML =
    `<div><strong>${state.columns}</strong><span>column diameters</span></div><span>+</span><div><strong>${state.columns - 2} × 2.25</strong><span>ordinary gaps</span></div><span>+</span><div><strong>${measure(eustyle.centreGap)}</strong><span>central gap${state.equalCentre ? " · altered" : ""}</span></div><span>=</span><div><strong>${measure(eustyle.widthModules)} D</strong><span>eustyle front</span></div>`;
  get("module-result").textContent = state.equalCentre
    ? "Equalizing the centre removes 0.75 D from the module count. At fixed front width, the diameter must grow to fill that front; at fixed diameter, the front becomes narrower."
    : "The wider entrance contributes an extra 0.75 D. The column count and the clear gaps together explain the printed total.";
  history.replaceState(null, "", `${location.pathname}${writeSpacing(state)}${location.hash}`);
}
function jumpSource(page: number) {
  sourcePage = page;
  drawSource();
  get("source-title").focus();
  get("spacing-sources").scrollIntoView();
}
document.addEventListener("click", (event) => {
  const button =
    event.target instanceof Element ? event.target.closest<HTMLElement>("button, a") : null;
  if (!button) return;
  if (button.dataset.system) {
    state = { ...state, system: button.dataset.system as SpacingSystem, equalCentre: false };
    sourcePage = spacingPassages[state.system].page;
    update();
    drawSource();
  } else if (button.dataset.dimension) {
    dimension = button.dataset.dimension as Dimension;
    drawDimension();
  } else if (button.dataset.page) {
    sourcePage = Number(button.dataset.page);
    drawSource();
  } else if (button.dataset.sourcePage) {
    event.preventDefault();
    jumpSource(Number(button.dataset.sourcePage));
  }
});
get("column-count").addEventListener("change", () => {
  state = { ...state, columns: Number(get<HTMLSelectElement>("column-count").value) as 4 | 6 | 8 };
  update();
});
document.querySelectorAll<HTMLInputElement>('[name="scale-basis"]').forEach((input) => {
  input.addEventListener("change", () => {
    state = { ...state, basis: input.value as "front" | "diameter" };
    update();
  });
});
for (const [id, key] of [
  ["front-width", "front"],
  ["lower-diameter", "diameter"],
  ["wide-gap", "wideGap"],
] as const)
  get(id).addEventListener("input", () => {
    state = { ...state, [key]: Number(get<HTMLInputElement>(id).value) };
    update();
  });
get("equal-centre").addEventListener("change", () => {
  state = { ...state, equalCentre: get<HTMLInputElement>("equal-centre").checked };
  update();
});
get("view-spacing-drawing").addEventListener("click", () => {
  get("selected-system").focus();
  get("spacing-drawing-area").scrollIntoView();
});
get("inspect-passage").addEventListener("click", () =>
  jumpSource(spacingPassages[state.system].page),
);
get("try-eustyle").addEventListener("click", () => {
  state = {
    ...state,
    system: "eustyle",
    columns: 6,
    basis: "front",
    front: 18,
    equalCentre: false,
  };
  sourcePage = 65;
  update();
  drawSource();
  get("spacing-title").focus();
  get("spacing-workshop").scrollIntoView();
});
get("spacing-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}${writeSpacing(state)}#spacing-workshop`;
  try {
    await navigator.clipboard.writeText(url);
    get("spacing-action-status").textContent =
      "Model link copied, including any deliberate equal-gap alteration.";
  } catch {
    get("spacing-action-status").innerHTML =
      `<label for="spacing-link">Copy model link</label><input id="spacing-link" readonly value="${escapeHtml(url)}">`;
    get<HTMLInputElement>("spacing-link").select();
  }
});
const imageHashes = [
  "0441326734ad358f30c097af70ffd79a6cabd3cb38a4f39b66a9d67af4c081eb",
  "c7136ef18758da483606cc4338d34dff6179054b376852dc21dfb9fd7edc26f9",
  "dcee6fe5e93edca54ad739922c6d57fe4ecc40a2815f1825557f6603f2fabe86",
  "24c4429621ad5aa6a74ee4ed0657adee2ae5a095a0d8340aba5a997462d9921a",
];
get("spacing-save").addEventListener("click", async () => {
  const selected = buildSpacing(state);
  const button = get<HTMLButtonElement>("spacing-save");
  button.disabled = true;
  get("spacing-action-status").textContent = "Preparing the reading and all four source pages…";
  try {
    const images = Object.fromEntries(
      await Promise.all(
        sourcePages.map(async (page, i) => {
          const response = await fetch(sourceImage(page));
          if (!response.ok) throw new Error("Source unavailable");
          const buffer = await response.arrayBuffer();
          const digest = await crypto.subtle.digest("SHA-256", buffer);
          const hash = [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
          if (hash !== imageHashes[i]) throw new Error("Unexpected source page");
          const encoded = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(new Blob([buffer], { type: "image/jpeg" }));
          });
          return [page, encoded];
        }),
      ),
    );
    const blob = new Blob([spacingStudy(selected, images)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gonia-${selected.parameters.system}-${selected.parameters.columns}-columns${selected.parameters.system === "eustyle" && selected.parameters.equalCentre ? "-altered" : ""}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    get("spacing-action-status").textContent =
      "Saved the drawing, comparison, Latin reading, Greek word-parts and all four source pages. Open offline or print.";
  } catch {
    get("spacing-action-status").textContent =
      "The source pages could not be verified. Reconnect and try saving again.";
  } finally {
    button.disabled = false;
  }
});
compact.addEventListener("change", drawDimension);
addEventListener("popstate", () => {
  state = readSpacing(location.search);
  sourcePage = spacingPassages[state.system].page;
  update();
  drawSource();
});
update();
drawSource();
if (location.hash === "#spacing-workshop")
  requestAnimationFrame(() => get("spacing-workshop").scrollIntoView());
void offlineStatus(get("spacing-offline"));

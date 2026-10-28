import "./style.css";
import "./arch.css";
import { archAsset } from "./arch-assets";
import { ae, an, archPages, archReadingHtml, archWords } from "./arch-content";
import { archSvg, archVerdict, contactSvg, frictionSvg } from "./arch-drawing";
import { archFacts, archStudy, archTable, saveArch } from "./arch-files";
import {
  ARCH_DEFAULT,
  type ArchState,
  archAnalysis,
  archCsv,
  archQuery,
  archRecord,
  archScope,
  findArchPath,
  openArchRecord,
  readArchQuery,
} from "./core/arch";
import { offlineStatus } from "./offline";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
}
let state: ArchState = { ...ARCH_DEFAULT },
  startup = "",
  word = "";
try {
  state = readArchQuery(location.search);
} catch (error) {
  startup = (error as Error).message;
}
const range = (id: string, label: string, min: number, max: number, step = "1") =>
  `<div class="ar-control"><label for="ar-${id}">${label}</label><output id="ar-${id}-value" for="ar-${id}"></output><input id="ar-${id}" type="range" min="${min}" max="${max}" step="${step}"></div>`;
el("app").innerHTML = `
<a class="skip" href="#ar-bench">Skip to the experiment</a>
<header class="ar-masthead"><a class="ar-brand" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Arch workshop"><a href="./">Doric corner</a><a href="./volute.html">Ionic volute</a><a href="#ar-reading">Read Vitruvius</a><a href="#ar-keep">Keep the experiment</a></nav></header>
<main class="ar-main"><section class="ar-intro" aria-labelledby="ar-title"><div><p>Vitruvius VI.8 / a modern force experiment</p><h1 id="ar-title">The arch and the pier</h1></div><div><p>A wedge cannot pull its neighbour back. It has to pass the load on by pushing.</p><p>Find a pressure path through thirteen stones. Then follow the force all the way to the ground.</p><a href="#ar-bench">Begin with an arch that fits but bases that miss</a></div></section>
<section id="ar-bench" aria-labelledby="ar-bench-title"><div class="ar-section-head"><div><h2 id="ar-bench-title">Where does the push go?</h2><p>The blue dots are joint contacts. A dot beyond a joint means this trial needs tension.</p></div><button type="button" id="ar-reset">Reset the opening example</button></div>
<div class="ar-bench"><aside class="ar-controls" aria-label="Geometry and loading"><h3>Shape and load</h3>
${range("rise", "Centreline rise / half-span", 30, 100)}${range("thickness", "Radial thickness / half-span", 10, 40)}
<p class="ar-note">The centreline span stays 2. Each shape's own weight is renormalized to W = 1; this compares proportions, not equal volumes of stone.</p>
${range("load", "Extra vertical load / W", 0, 200)}<label class="ar-select-label" for="ar-loading">Where does the extra load act?</label><select id="ar-loading"><option value="crown">On the crown stone</option><option value="shoulders">Half on stone 4, half on stone 10</option></select>
<h3>Each pier</h3>${range("width", "Base width / half-span", 40, 140)}${range("mass", "Pier weight / W", 25, 600)}<p class="ar-note">Height = 1 half-span. Width and weight are independent. A wider base keeps the weight you chose.</p>
<details><summary>Other starting experiments</summary><div class="ar-starts"><button type="button" id="ar-thin">A thin semicircle, own weight only</button><button type="button" id="ar-shallow">A shallow arch, own weight only</button><button type="button" id="ar-shoulders">Move the opening load to the shoulders</button></div></details>
</aside><div class="ar-plate"><div class="ar-plate-head"><span>Section / 13 equal-angle stones</span><button type="button" id="ar-enlarge" aria-pressed="false">Enlarge section</button></div><div id="ar-section-frame" tabindex="0" role="region" aria-label="Arch section; when enlarged use arrow keys to pan"><div id="ar-drawing"></div></div><p class="ar-legend"><span><i class="ar-blue"></i> Trial contact path</span><span><i class="ar-gold"></i> Selected joint</span><span><i class="ar-red"></i> Failed contact or friction</span></p>
<div class="ar-outcome" aria-live="polite" aria-atomic="true"><h3 id="ar-verdict"></h3><p id="ar-explanation"></p></div>
<p class="ar-note ar-model-scope">The blue line joins joint contacts. Rigid blocks; no tension, unlimited compression. Sliding is excluded or checked with your chosen friction. This learning model does not assess a real structure. <a href="#ar-friction-title">Test sliding resistance</a>. <a href="#ar-model">Read the assumptions</a>.</p>
</div></div>
<div class="ar-trial"><div><h3>Move the pressure path</h3><p>Geometry and loads allow a family of possible forces. Choose a trial, or ask for one that meets the stated checks.</p><div class="ar-thrust-control"><label for="ar-thrust">Horizontal thrust H / W</label><input id="ar-thrust" type="number" min="0.001" max="20" step="any" inputmode="decimal"><label class="ar-note" for="ar-thrust-range">Move H</label><input id="ar-thrust-range" type="range" min="0.001" max="3" step="any"></div>
${range("bearing", "Left bearing: inner edge 0%, outer edge 100%", 0, 100, "any")}
<div class="ar-actions"><button type="button" id="ar-fit-arch">Find an arch path</button><button type="button" id="ar-fit-whole">Include the pier bases</button></div><p id="ar-domain" class="ar-note"></p><p id="ar-whole-domain" class="ar-note"></p></div>
<div id="ar-inspect"><h3>Open a joint</h3><label for="ar-joint">Joint number, from the left spring to the right</label><div class="ar-joint-nav"><button type="button" id="ar-prev" aria-label="Previous joint">Previous</button><select id="ar-joint">${Array.from({ length: 14 }, (_, i) => `<option value="${i}">${i}${i === 0 ? " / left bearing" : i === 13 ? " / right bearing" : ""}</option>`).join("")}</select><button type="button" id="ar-next" aria-label="Next joint">Next</button></div><div id="ar-contact"></div><p id="ar-contact-note"></p><p class="ar-note">The joint is rotated and enlarged here. 0% and 100% mark its inner and outer edges. A contact need not stay within the middle third: this ideal model allows partial opening. Edge contact is a limit, with no finite stress solution.</p></div></div>
<section class="ar-friction-desk" aria-labelledby="ar-friction-title"><div class="ar-section-head"><div><h3 id="ar-friction-title">A contact can fit and still need too much friction.</h3><p>A push across a joint has a normal part N and a shear part T along the face. Static friction can carry at most μN of shear.</p></div><div class="ar-actions"><button type="button" id="ar-slide">Try a path that needs more friction</button><button type="button" id="ar-base-slide">Try a sliding base</button></div></div>
<div class="ar-friction-settings"><h3>Sliding resistance</h3><label class="ar-select-label" for="ar-friction-mode">Contact assumption</label><select id="ar-friction-mode"><option value="ideal">No sliding assumed (original model)</option><option value="finite">Test finite friction</option></select>
<div class="ar-control"><label for="ar-friction">Illustrative friction coefficient μ</label><input id="ar-friction" type="number" min="0" max="2" step="any" inputmode="decimal" value="0.65"><label for="ar-friction-range" class="ar-note">Move μ</label><input id="ar-friction-range" type="range" min="0" max="2" step="0.01" value="0.65"></div><p class="ar-note">The same μ applies at all joints and both bases. Choose a value to investigate; these are not measurements of ancient masonry.</p>
</div><div class="ar-force-directions"><figure><div id="ar-joint-friction"></div><figcaption id="ar-joint-friction-note"></figcaption></figure><figure><div id="ar-base-friction"></div><figcaption id="ar-base-friction-note"></figcaption></figure></div><p id="ar-friction-summary" aria-live="polite"></p><p id="ar-friction-domain" class="ar-note"></p><p class="ar-note">The shaded cone contains force directions with |T| ≤ μN; its half-angle is arctan μ. Arrows have equal length to compare directions. Widening a base helps its contact position, but only extra weight or less thrust changes its required H/(V + P). This is a static test: a failed check does not predict the ensuing motion.</p></section>
<details class="ar-details"><summary>Read every contact as numbers</summary><div class="ar-table-scroll" tabindex="0" role="region" aria-label="All fourteen joint contacts; scroll horizontally"><div id="ar-table"></div></div><div id="ar-facts"></div></details>
<p id="ar-status" role="status">${ae(startup)}</p></section>
<section id="ar-reading" class="ar-section" aria-labelledby="ar-reading-title"><div class="ar-reading-head"><div><h2 id="ar-reading-title">“The outer piers must be broader.”</h2><p>Vitruvius first describes a relieving arch above timber, then the outer supports of buildings carried on piers. His words connect the stones to their supports; they give no numerical thrust formula.</p></div><p class="ar-note">Latin: F. Krohn's 1912 edition, printed p. 141. New English and language notes for Gonia. Line-end hyphens joined; punctuation adapted for parallel reading. Readings 3 and 4 are one sentence.</p></div>
${archReadingHtml()}
<div class="ar-word-desk"><div><h3>Read a word in its job</h3><div class="ar-word-buttons">${archWords.map((w, i) => `<button type="button" data-word="${i}" aria-pressed="false" lang="la">${w.word.split(" · ")[0]}</button>`).join("")}</div><p class="ar-note">Selecting a word highlights its architectural role in the section. These are Latin words from the passage.</p></div><div id="ar-word" aria-live="polite"><p>Select a word to connect its forms with the drawing.</p></div></div>
<div class="ar-source"><div><h3>Keep the print in view</h3><p>The complete page includes the critical apparatus. The ancient text, the 1912 editor's decisions and our modern experiment are different kinds of evidence.</p><label for="ar-page">Printed source page</label><select id="ar-page">${archPages.map((p, i) => `<option value="${i}">${p.title}</option>`).join("")}</select><button type="button" id="ar-source-zoom" aria-pressed="false">Enlarge source page</button><p id="ar-source-caption" class="ar-note" role="status"></p><p><a href="https://archive.org/details/vitruviidearchit00vitr_1/page/141/mode/2up">Original volume at Internet Archive</a></p><button type="button" id="ar-source-retry">Retry source page</button></div><div id="ar-source-frame" tabindex="0" role="region" aria-label="Whole printed source; use arrow keys to pan an enlarged page"><img id="ar-source-image" alt="" hidden></div></div></section>
<section id="ar-model" class="ar-section ar-model" aria-labelledby="ar-model-title"><div><h2 id="ar-model-title">What a fitted line establishes</h2><p>Each stone is a rigid annular sector with its weight at its area centroid. Extra vertical load is symmetric. Force and moment equilibrium locate the resultant at every radial joint. A path fits when all fourteen resultants cross their joints in compression.</p><p>The base check also includes each pier's weight. If its resultant falls outside the base, that trial would require the ground to pull downward on part of the base. This model permits compression only.</p><p>The complete range calculation compares every inner-edge constraint with every outer-edge constraint. It does not mistake a failed trial for a proof that no trial can work. <a href="https://github.com/antonsoo/gonia/blob/main/docs/arch-model.md">Read the model and equations</a>.</p></div><div><h3>A modern model beside an ancient claim</h3><p><span id="ar-scope"></span></p><p>The blue line joins the interface contacts to guide the eye. It is not a continuous stress solution inside the stones. Thirteen blocks do not establish a continuous arch's minimum thickness. The model omits soil bearing, settlement, mortar, crushing, elasticity, construction sequence, lateral loads and three-dimensional restraint.</p><p>The pier head is shaped to meet the spring joint; its weight acts on its centreline. Base width and weight vary separately. These are no measured ancient dimensions.</p><p>Modern context: <a href="https://drake.mit.edu/doxygen_cxx/group__friction__model.html">Drake’s static Coulomb friction model</a>, <a href="https://doi.org/10.1016/0020-7683(66)90018-7">Heyman, “The stone skeleton” (1966)</a>, and <a href="https://concrete.ethz.ch/assets/brd/slides/arch-bridges-2025-04-07.pdf">ETH Zurich's arch-bridge lectures (2025)</a>. No modern diagrams are reproduced. The English and notes have not had independent philological review.</p></div></section>
<section id="ar-keep" class="ar-section ar-keep" aria-labelledby="ar-keep-title"><div><h2 id="ar-keep-title">Keep the whole argument</h2><p>Save your chosen geometry, contacts and pier resultants. The illustrated reading includes all five Latin/English readings, eight word notes, three complete printed pages, fonts and licenses. It works without a connection or scripts.</p><p class="ar-note">Use your browser's Print command on the saved reading for a PDF. Native JSON, CSV and SVG downloads remain available in that file.</p></div><div><div class="ar-actions"><button type="button" id="ar-json">Save editable JSON</button><button type="button" id="ar-csv">Save joint CSV</button><button type="button" id="ar-svg">Save section SVG</button><button type="button" id="ar-html">Save illustrated reading</button><button type="button" id="ar-share">Copy experiment link</button></div><label class="ar-file-label" for="ar-open">Reopen an editable experiment</label><input type="file" id="ar-open" accept=".json,application/json"><p id="ar-save-status" role="status"></p></div></section>
</main><footer class="ar-footer"><a href="./">More Gonia workshops</a><span id="ar-offline" role="status">Preparing the offline edition…</span><a href="https://github.com/antonsoo/gonia">Source and licenses</a></footer>`;

let stateRevision = 0,
  importAttempt = 0;
const say = (message: string) => {
  el("ar-status").textContent = message;
};
function draw() {
  stateRevision++;
  if (state.friction !== null) chosenFriction = state.friction;
  const m = archAnalysis(state);
  el("ar-drawing").innerHTML = archSvg(state, word);
  for (const key of ["rise", "thickness", "load", "width", "mass", "bearing"] as const) {
    el<HTMLInputElement>(`ar-${key}`).value = String(state[key]);
    el<HTMLOutputElement>(`ar-${key}-value`).value =
      `${an(state[key] / (key === "bearing" ? 1 : 100), key === "bearing" ? 3 : 2)}${key === "bearing" ? "%" : ""}`;
  }
  el<HTMLInputElement>("ar-thrust").value = String(state.thrust);
  const slider = el<HTMLInputElement>("ar-thrust-range");
  slider.max = String(
    Math.min(20, Math.max(1, state.thrust * 1.25, m.arch.feasible ? m.arch.max * 1.25 : 1)),
  );
  slider.value = String(state.thrust);
  el<HTMLSelectElement>("ar-loading").value = state.loading;
  el<HTMLSelectElement>("ar-joint").value = String(state.joint);
  el<HTMLSelectElement>("ar-page").value = String(state.page);
  el<HTMLButtonElement>("ar-prev").disabled = state.joint === 0;
  el<HTMLButtonElement>("ar-next").disabled = state.joint === 13;
  el("ar-verdict").textContent = archVerdict(state);
  el("ar-explanation").textContent =
    state.friction !== null
      ? `${m.archFits ? "All joint contact positions fit" : "Some joint contact positions miss"}; ${m.pierFits ? "base positions fit" : "base positions miss"}. ${m.archFrictionFits ? "Joint shear is within" : "Some joint shear exceeds"} μN; ${m.baseFrictionFits ? "base shear is within" : "base shear exceeds"} μ(V + P). ${m.whole.feasible ? "A path meeting all checks exists; the current trial may differ." : "No force and bearing combination meets all checks with these settings."}`
      : m.archFits && m.pierFits
        ? `All fourteen contacts fit and the base resultant is ${an(Math.abs(m.eccentricity))} half-span from its centre, within the ${an(state.width / 200)} half-width. This is one equilibrium witness under the stated assumptions.`
        : !m.arch.feasible
          ? "Changing only the horizontal push and bearing position cannot repair this finite model. Try changing its thickness, shape or load. No claim about a real arch follows."
          : !m.whole.feasible
            ? `An arch path exists, but none fits these pier bases as well. This trial's base eccentricity is ${an(Math.abs(m.eccentricity))}; only ${an(state.width / 200)} half-width is available. Try a broader base or a heavier pier.`
            : "A different choice of force and bearing position can fit both the joints and the bases. Use ‘Include the pier bases’ to find one.";
  el("ar-domain").textContent = m.arch.feasible
    ? `All possible H for the arch${state.friction === null ? " (no sliding assumed)" : ` with μ = ${an(state.friction, 6)}`}: ${an(m.arch.min, 6)}${Number.isFinite(m.arch.max) ? `–${an(m.arch.max, 6)} W` : " W and upward (unbounded in this unlimited-compression model)"}, with a suitable bearing position. A chosen H alone does not guarantee a fit.`
    : "No H and bearing combination fits all arch joints under these assumptions.";
  el("ar-whole-domain").textContent = m.whole.feasible
    ? `Including the bases: ${an(m.whole.min, 6)}–${an(m.whole.max, 6)} W. Displayed endpoints are rounded; edge contact is a limiting state.`
    : "Including the bases: no joint-and-base equilibrium path in this symmetric model.";
  el("ar-contact").innerHTML = contactSvg(state);
  const j = m.contacts[state.joint];
  if (!j) throw new Error("Missing joint");
  el("ar-contact-note").textContent =
    `Joint ${j.index}: ${j.fits ? (j.edge ? "contact at an edge" : "contact inside") : "contact beyond an edge"}. Normal compression ${an(j.normal, 6)} W; shear ${an(j.shear, 6)} W. ${state.friction === null ? "Sliding resistance is assumed, not checked." : `Required μ = |T|/N = ${an(j.requiredFriction, 6)}; chosen μ = ${an(state.friction, 6)}. ${j.frictionFits ? "Within the friction limit." : "Friction limit exceeded."}`}`;
  el("ar-scope").textContent = archScope(state);
  el("ar-joint-friction").innerHTML = frictionSvg(state);
  el("ar-base-friction").innerHTML = frictionSvg(state, true);
  el("ar-joint-friction-note").textContent =
    `Joint ${j.index}: N = ${an(j.normal, 6)} W, T = ${an(j.shear, 6)} W. ${state.friction === null ? "No sliding assumed." : j.frictionFits ? "Friction fits." : "Friction exceeded."}`;
  el("ar-base-friction-note").textContent =
    `Either base: N = V + P = ${an(m.geometry.vertical + state.mass / 100, 6)} W, |T| = H = ${an(state.thrust, 6)} W. ${state.friction === null ? "No sliding assumed." : m.baseFrictionFits ? "Friction fits." : "Friction exceeded."}`;
  const sliding = m.contacts.filter((j) => !j.frictionFits).map((j) => j.index);
  el("ar-friction-summary").textContent =
    state.friction === null
      ? "The original model excludes sliding. Choose ‘Test finite friction’ or try one of the experiments above to test that assumption."
      : `Joint friction ${sliding.length ? `exceeded at ${sliding.join(", ")}` : "fits at all fourteen joints"}. Base friction ${m.baseFrictionFits ? "fits" : "is exceeded"}. This trial needs at least μ = ${an(m.requiredFriction, 6)} across all contacts. That is a requirement for this trial, not the minimum over all possible paths.`;
  const ideal = archAnalysis({ ...state, friction: null });
  el("ar-friction-domain").textContent =
    state.friction === null
      ? ""
      : `Contact geometry alone ${ideal.arch.feasible ? `allows H from ${an(ideal.arch.min, 6)} to ${Number.isFinite(ideal.arch.max) ? an(ideal.arch.max, 6) : "an unbounded upper limit"} W` : "has no arch path"}. ` +
        (m.arch.feasible
          ? `Adding joint friction leaves ${an(m.arch.min, 6)}–${an(m.arch.max, 6)} W.`
          : `With joint friction the lower requirement is ${an(m.arch.min, 6)} W (${m.arch.minFrom}) and the upper limit is ${an(m.arch.max, 6)} W (${m.arch.maxFrom}); the requirements cannot be met together.`) +
        " Endpoints are rounded; the solver uses the unrounded bounds.";
  el<HTMLSelectElement>("ar-friction-mode").value = state.friction === null ? "ideal" : "finite";
  for (const id of ["ar-friction", "ar-friction-range"]) {
    const input = el<HTMLInputElement>(id);
    input.disabled = state.friction === null;
    if (state.friction !== null) input.value = String(state.friction);
  }
  el("ar-table").innerHTML = archTable(state);
  el("ar-facts").innerHTML = archFacts(state);
  el("ar-drawing")
    .querySelectorAll<SVGGElement>("[data-joint]")
    .forEach((node) => {
      const inspect = (focus: boolean) => {
        state.joint = Number(node.dataset.joint);
        draw();
        if (focus) el<HTMLSelectElement>("ar-joint").focus();
      };
      node.addEventListener("click", () => inspect(false));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inspect(true);
        }
      });
    });
}
for (const key of ["rise", "thickness", "load", "width", "mass", "bearing"] as const) {
  el<HTMLInputElement>(`ar-${key}`).addEventListener("input", (event) => {
    state[key] = Number((event.target as HTMLInputElement).value);
    draw();
  });
}
let chosenFriction = state.friction ?? 0.65;
el<HTMLSelectElement>("ar-friction-mode").addEventListener("change", (event) => {
  state.friction = (event.target as HTMLSelectElement).value === "ideal" ? null : chosenFriction;
  draw();
});
for (const id of ["ar-friction", "ar-friction-range"]) {
  el<HTMLInputElement>(id).addEventListener(id === "ar-friction" ? "change" : "input", (event) => {
    const input = event.target as HTMLInputElement,
      value = input.valueAsNumber;
    if (!Number.isFinite(value) || value < 0 || value > 2) {
      input.value = String(chosenFriction);
      say("Choose a finite illustrative μ from 0 to 2.");
      return;
    }
    chosenFriction = value;
    state.friction = value;
    draw();
  });
}
el("ar-slide").addEventListener("click", () => {
  state = { ...ARCH_DEFAULT, width: 100, friction: 0.65, joint: 0 };
  chosenFriction = 0.65;
  draw();
  say(
    "All contacts fit, but the bearing needs μ = 0.655. With μ = 0.65 another path can work: include the bases to find it. Then try μ = 0.60.",
  );
});
el("ar-base-slide").addEventListener("click", () => {
  const trial = { ...ARCH_DEFAULT, rise: 40, load: 0, width: 140, mass: 25, joint: 0 };
  state = { ...(findArchPath(trial, false) ?? trial), friction: 0.6 };
  chosenFriction = 0.6;
  draw();
  say(
    "Joint forces and all contact positions fit. The bases need more friction. Widening them cannot change H/(V + P); increasing pier weight can.",
  );
});
el<HTMLInputElement>("ar-thrust-range").addEventListener("input", (event) => {
  state.thrust = Number((event.target as HTMLInputElement).value);
  draw();
});
el<HTMLInputElement>("ar-thrust").addEventListener("change", () => {
  const input = el<HTMLInputElement>("ar-thrust"),
    value = input.valueAsNumber;
  if (!Number.isFinite(value) || value < 0.001 || value > 20) {
    input.value = String(state.thrust);
    say("Choose a finite horizontal thrust from 0.001 to 20 W.");
    return;
  }
  state.thrust = value;
  draw();
});
el<HTMLSelectElement>("ar-loading").addEventListener("change", (event) => {
  state.loading = (event.target as HTMLSelectElement).value as ArchState["loading"];
  draw();
});
el<HTMLSelectElement>("ar-joint").addEventListener("change", (event) => {
  state.joint = Number((event.target as HTMLSelectElement).value);
  draw();
});
for (const [id, delta] of [
  ["ar-prev", -1],
  ["ar-next", 1],
] as const)
  el(id).addEventListener("click", () => {
    state.joint = Math.max(0, Math.min(13, state.joint + delta));
    draw();
  });
for (const [id, whole] of [
  ["ar-fit-arch", false],
  ["ar-fit-whole", true],
] as const) {
  el(id).addEventListener("click", () => {
    const fitted = findArchPath(state, whole);
    if (!fitted) {
      say(
        whole
          ? "No path fits the joints and bases together. Try changing the base, pier weight, geometry, loading or friction assumption."
          : "No path fits every joint. Change the thickness, shape, loading or friction assumption.",
      );
      return;
    }
    state = fitted;
    draw();
    say(
      whole
        ? "Found one path meeting every joint and base check under your chosen sliding assumption. Many force distributions may be possible."
        : "Found one path through every arch joint. The pier bases are checked separately below the section.",
    );
  });
}
el("ar-reset").addEventListener("click", () => {
  state = { ...ARCH_DEFAULT };
  word = "";
  selectWord(null);
  draw();
  void loadSource();
  say("Opening example restored: the arch contacts fit, but the base resultants miss.");
});
el("ar-thin").addEventListener("click", () => {
  state = { ...ARCH_DEFAULT, thickness: 10, load: 0, thrust: 0.195, bearing: 80 };
  draw();
  say(
    "A thin semicircle under its own weight. The full interval check finds no path through all fourteen joints.",
  );
});
el("ar-shallow").addEventListener("click", () => {
  state = { ...ARCH_DEFAULT, rise: 40, load: 0 };
  state = findArchPath(state, false) ?? state;
  draw();
  say(
    "A shallow arch with one fitted arch path. Check whether these pier bases can carry its outward push.",
  );
});
el("ar-shoulders").addEventListener("click", () => {
  state = { ...ARCH_DEFAULT, loading: "shoulders" };
  state = findArchPath(state, false) ?? state;
  draw();
  say(
    "The same extra weight now acts equally on stones 4 and 10. Compare the allowed thrust interval and the bases.",
  );
});
el("ar-enlarge").addEventListener("click", () => {
  const wide = el("ar-section-frame").classList.toggle("ar-enlarged");
  el("ar-enlarge").setAttribute("aria-pressed", String(wide));
  el("ar-enlarge").textContent = wide ? "Fit section" : "Enlarge section";
  if (wide) el("ar-section-frame").focus();
});
function selectWord(index: number | null) {
  const w = index === null ? undefined : archWords[index];
  word = w?.part ?? "";
  document.querySelectorAll<HTMLButtonElement>("[data-word]").forEach((b) => {
    b.setAttribute("aria-pressed", String(Number(b.dataset.word) === index));
  });
  el("ar-word").innerHTML = w
    ? `<h3 lang="la">${w.word}</h3><p><strong>${w.gloss}</strong></p><p>${w.note}</p><a href="#ar-bench">See this part in the section</a>`
    : "<p>Select a word to connect its forms with the drawing.</p>";
}
document.querySelectorAll<HTMLButtonElement>("[data-word]").forEach((b) => {
  b.addEventListener("click", () => {
    selectWord(Number(b.dataset.word));
    draw();
  });
});
document.querySelectorAll<HTMLButtonElement>("[data-widen]").forEach((b) => {
  b.addEventListener("click", () => {
    state.width = 100;
    draw();
    say("Each base is now 1 half-span wide. Pier weight and the trial force are unchanged.");
    el("ar-bench").scrollIntoView();
    el<HTMLInputElement>("ar-width").focus({ preventScroll: true });
  });
});

let sourceAttempt = 0,
  sourceUrl = "";
async function loadSource() {
  stateRevision++;
  const attempt = ++sourceAttempt,
    index = state.page,
    page = archPages[index];
  if (!page) return;
  const img = el<HTMLImageElement>("ar-source-image");
  img.hidden = true;
  img.removeAttribute("src");
  el("ar-source-caption").textContent = `Loading and checking ${page.title}…`;
  try {
    const bytes = await archAsset(`sources/arch/${page.file}`);
    if (attempt !== sourceAttempt || index !== state.page) return;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    img.src = sourceUrl;
    img.alt = `${page.title}. Complete printed page, including margins and apparatus.`;
    img.hidden = false;
    el("ar-source-caption").textContent =
      `${page.title}. ${page.note} Whole image identity verified (${page.bytes.toLocaleString("en-US")} bytes, SHA-256).`;
  } catch (error) {
    if (attempt === sourceAttempt && index === state.page)
      el("ar-source-caption").textContent = (error as Error).message;
  }
}
el<HTMLSelectElement>("ar-page").addEventListener("change", (event) => {
  state.page = Number((event.target as HTMLSelectElement).value);
  void loadSource();
});
el("ar-source-retry").addEventListener("click", () => {
  void loadSource();
});
document.querySelectorAll<HTMLButtonElement>("[data-source]").forEach((b) => {
  b.addEventListener("click", () => {
    state.page = Number(b.dataset.source);
    el<HTMLSelectElement>("ar-page").value = String(state.page);
    void loadSource();
    el("ar-source-frame").scrollIntoView();
    el<HTMLSelectElement>("ar-page").focus({ preventScroll: true });
  });
});
el("ar-source-zoom").addEventListener("click", () => {
  const wide = el("ar-source-frame").classList.toggle("ar-enlarged");
  el("ar-source-zoom").setAttribute("aria-pressed", String(wide));
  el("ar-source-zoom").textContent = wide ? "Fit source page" : "Enlarge source page";
  if (wide) el("ar-source-frame").focus();
});
function saving(
  id: string,
  operation: (s: ArchState) => string | Promise<string>,
  name: string,
  mime: string,
) {
  const button = el<HTMLButtonElement>(id);
  button.addEventListener("click", async () => {
    const snapshot = structuredClone(state);
    button.disabled = true;
    el("ar-save-status").textContent = "Preparing the experiment you selected…";
    try {
      const data = await operation(snapshot);
      saveArch(data, name, mime);
      el("ar-save-status").textContent = `Saved ${name}.`;
    } catch (error) {
      el("ar-save-status").textContent = (error as Error).message;
    } finally {
      button.disabled = false;
    }
  });
}
saving("ar-json", archRecord, "gonia-arch.json", "application/json");
saving("ar-csv", archCsv, "gonia-arch-contacts.csv", "text/csv");
saving("ar-svg", (s) => archSvg(s, "", true), "gonia-arch.svg", "image/svg+xml");
saving("ar-html", archStudy, "gonia-arch-reading.html", "text/html");
el("ar-open").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("ar-open"),
    file = input.files?.[0];
  if (!file) return;
  const attempt = ++importAttempt,
    revision = stateRevision;
  try {
    if (file.size > 16000) throw new Error("Choose an arch record smaller than 16 KB.");
    const text = await file.text();
    if (attempt !== importAttempt || revision !== stateRevision) return;
    const opened = openArchRecord(text);
    state = opened;
    draw();
    void loadSource();
    el("ar-save-status").textContent = "Editable arch reopened with its original settings.";
  } catch (error) {
    if (attempt === importAttempt && revision === stateRevision)
      el("ar-save-status").textContent = (error as Error).message;
  } finally {
    if (attempt === importAttempt) input.value = "";
  }
});
el("ar-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}${archQuery(state)}#ar-bench`;
  try {
    await navigator.clipboard.writeText(url);
    el("ar-save-status").textContent =
      "Experiment link copied, including the trial force and bearing position.";
  } catch {
    el("ar-save-status").innerHTML =
      `<label for="ar-share-link">Copy this experiment link</label><input id="ar-share-link" readonly value="${ae(url)}">`;
    el<HTMLInputElement>("ar-share-link").select();
  }
});
addEventListener("popstate", () => {
  try {
    state = readArchQuery(location.search);
    draw();
    void loadSource();
  } catch (error) {
    say((error as Error).message);
  }
});
draw();
void loadSource();
void offlineStatus(el("ar-offline"));

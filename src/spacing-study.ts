import { compareSpacing, measure, type SpacingModel, writeSpacing } from "./core/spacing";
import { escapeHtml } from "./drawing";
import {
  greekParts,
  heightPassage,
  modulePassage,
  sourcePages,
  spacingNames,
  spacingPassages,
  spacingSource,
} from "./spacing-content";
import { spacingDrawing } from "./spacing-drawing";

export function spacingStudy(model: SpacingModel, images: Record<number, string>): string {
  const p = model.parameters;
  const name = spacingNames[p.system].title;
  const altered = p.system === "eustyle" && p.equalCentre;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${name} · ${p.columns} columns · Gonia</title>
<style>body{max-width:1000px;margin:36px auto;padding:0 20px;color:#27352f;background:white;font:17px/1.6 Georgia,serif}h1,h2{line-height:1.2}a{color:#405a43}.spacing-plate{width:100%;height:auto;font-family:system-ui}.spacing-column path:first-child,.spacing-plan-column circle{fill:#e3e6d8;stroke:#405a43;stroke-width:1.3}.spacing-axis{fill:none;stroke:#8a9380;stroke-dasharray:3 4;stroke-width:1}.spacing-ground{stroke:#405a43}.spacing-open{fill:#f7dfc7}.spacing-dimension{fill:#963b25}.spacing-dimension path{stroke:#963b25;fill:none;stroke-width:1.5}.plate-heading{fill:#5f6559}table{border-collapse:collapse;width:100%;font:14px/1.5 system-ui}th,td{padding:8px;border-bottom:1px solid #bfc3b3;text-align:left}.scroll{overflow:auto}[lang=la]{font-size:19px}.source-page{width:100%;max-width:620px}.source-pages{margin-top:35px}footer{margin-top:35px;border-top:1px solid #bfc3b3;font-size:14px}.altered{border:2px solid #963b25;padding:15px}.phone-plate{display:none}@media(max-width:620px){.wide-plate{display:none}.phone-plate{display:block}}@media print{body{margin:0;font-size:12px}.phone-plate{display:none}.wide-plate{display:block}.spacing-plate{max-height:300px}h2,h3{break-after:avoid}tr,figure,.reading-passage{break-inside:avoid}.source-page{max-height:850px;width:auto;max-width:100%}.source-pages figure{break-before:page}}</style>
<h1>${name}: the space between ${p.columns} columns</h1>
<p>${p.basis === "front" ? `Front held at ${measure(p.front)} m` : `Lower diameter held at ${measure(p.diameter)} m`}. Metres are a modern scale choice, not a conversion from Roman feet.</p>
${altered ? '<p class="altered"><strong>Deliberately altered example:</strong> every gap is 2.25 D. The source instead prescribes a wider 3 D central opening. This is not the source’s eustyle arrangement.</p>' : ""}
${p.system === "araeostyle" ? `<p><strong>Chosen illustration:</strong> the ${measure(p.wideGap)} D gap is a user-selected example. III.3.5 gives no numerical araeostyle gap.</p>` : ""}
<div class="wide-plate">${spacingDrawing(model, "gap")}</div><div class="phone-plate">${spacingDrawing(model, "gap", true)}</div>
<p>Lower diameter: ${measure(model.diameter)} m. Ordinary gap: ${measure(model.ordinaryGap)} D. Central gap: ${measure(model.centreGap)} D. Column height: ${measure(model.height)} m (${measure(model.heightRatio)} D). Front between outer shaft faces: ${measure(model.front)} m (${measure(model.widthModules)} D).</p>
<p>A clear gap excludes the shafts; an axis-to-axis bay includes one diameter as well. The drawing scale is shared by the five systems for these settings. Profiles are schematic. Bases, capitals, entasis, corner thickening and structural loads are not modeled.</p>
<h2>Compare the five systems</h2><div class="scroll"><table><thead><tr><th>System</th><th>Gap / D</th><th>Centre / D</th><th>Height / D</th><th>Diameter / m</th><th>Front / m</th><th>Height / m</th></tr></thead><tbody>${compareSpacing(
    p,
  )
    .map(
      (m) =>
        `<tr><th>${spacingNames[m.parameters.system].title}${m.parameters.system === "araeostyle" ? " (chosen gap)" : m.parameters.system === "eustyle" && p.equalCentre ? " (altered centre)" : ""}</th><td>${measure(m.ordinaryGap)}</td><td>${measure(m.centreGap)}</td><td>${measure(m.heightRatio)}</td><td>${measure(m.diameter)}</td><td>${measure(m.front)}</td><td>${measure(m.height)}</td></tr>`,
    )
    .join("")}</tbody></table></div>
<h2>Read the instructions</h2>${[spacingPassages[p.system], modulePassage, heightPassage].map((passage) => `<section class="reading-passage"><h3>Vitruvius ${passage.section} · printed p. ${passage.page}</h3><p lang="la">${escapeHtml(passage.latin)}</p><p>${passage.english}</p><p>${passage.note}</p></section>`).join("")}
<h2>Greek word-parts</h2>${greekParts.map((word) => `<p><strong lang="grc">${word.greek}</strong> (${word.roman}): ${word.meaning}. ${word.note} <a href="${word.source}">Dictionary</a>.</p>`).join("")}
<p>Vitruvius writes in Latin. These Greek headwords explain borrowed names; they are not a fabricated Greek version of his passage. English translations and teaching notes are new.</p>
<section class="source-pages"><h2>The printed evidence</h2><p>F. Krohn, <cite>Vitruvii De architectura libri decem</cite> (Teubner, 1912), pp. 64–67. Public-domain page images from the <a href="${spacingSource}">Internet Archive scan</a>. Line-end hyphens have been joined in the excerpts; numerals and the editor’s readings are retained.</p>${sourcePages.map((page) => `<figure><figcaption>Printed page ${page}</figcaption><img class="source-page" src="${images[page]}" alt="Krohn's Latin text and critical apparatus, printed page ${page}"></figure>`).join("")}</section>
<footer><p><a href="https://antonsoo.github.io/gonia/spacing.html${writeSpacing(p)}#spacing-workshop">Open these settings</a>. All four page images are embedded in this document; it opens without a network connection. Code, drawings and new English: MIT, Anton Soloviev, 2026. The source text and scans are public domain.</p></footer></html>`;
}

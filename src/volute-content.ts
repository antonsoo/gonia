import manifest from "../public/sources/volute/manifest.json";

export const volutePages = manifest.pages;
export const VOLUTE_LIMITS =
  "A modern exact quarter-turn interpretation of Juglaris & Locke’s 1889 English Vignola, plate XV. The twelve centres and named axis points are interpreted as ideal geometry. This is neither a survey of an ancient capital nor a recovered drawing by Vitruvius. The printed line’s precision cannot be inferred from our calculation.";
export const voluteReadings = [
  {
    title: "Eight parts belong to the volutes",
    latin:
      "tunc ex novem partibus et dimidia una pars et dimidia abaci crassitudo relinquatur; reliquae octo volutis constituantur.",
    english:
      "Then, from the nine and a half parts, let one and a half parts remain for the abacus’s thickness; let the other eight be assigned to the volutes.",
    note: "relinquatur and constituantur are passive commands: ‘let … be left’, ‘let … be assigned’. The singular pars and plural octo [partes] take different verb endings. The total is 1½ + 8 = 9½, not nine parts.",
    page: 0,
  },
  {
    title: "Put the eye between two unequal lengths",
    latin:
      "tunc in eo loco, qui locus dividit quattuor et dimidiam et tres et dimidiam partem, centrum oculi ⟨conlocetur⟩",
    english:
      "Then, at the place dividing four and a half from three and a half parts, let the centre of the eye be placed.",
    note: "oculi is genitive: ‘of the eye’. The eye is not halfway down the eight-part height. Krohn supplies ⟨conlocetur⟩, ‘let it be placed’; the brackets remain visible here. This is an editorial supply, not a newly discovered ancient word.",
    page: 0,
  },
  {
    title: "Give the eye one part",
    latin:
      "signeturque ex eo centro rotunda circinatio tam magna in diametro, quam una pars ex octo partibus est. ea erit oculi magnitudine",
    english:
      "And from that centre let a circular outline be marked, as large in diameter as one part out of the eight parts. That will be the size of the eye.",
    note: "ex eo centro means ‘from that centre’. diametro names the diameter, not the radius. On this desk e is that diameter, so the eye’s radius is e/2. Changing the print size changes millimetres, not these ratios.",
    page: 0,
  },
  {
    title: "The reduction has a textual problem",
    latin:
      "tunc ab summo sub abaco inceptum ⟨schema volutae⟩ in singulis tetrantorum actionibus dimidiatum oculi spatium minuatur, doneque in eundem tetrantem, qui subest, conveniat.",
    english:
      "Then let the ⟨volute’s figure⟩, begun from the top under the abacus, be diminished by half the eye’s span in each operation of the quadrants, until it comes into the same quadrant which lies below.",
    note: "This deliberately close English follows Krohn’s difficult wording, not Morgan’s different ‘under the abacus’ ending. Krohn supplies ⟨schema volutae⟩ and edits qui subest, conveniat; his apparatus records alternatives. A phrase about quadrants does not itself locate twelve compass centres. Do not extend the half-eye decrement through three turns and call it the whole surviving recipe.",
    page: 0,
  },
  {
    title: "A promised figure",
    latin:
      "de volutarum descriptionibus, uti ad circinum sint recte involutae, quemadmodum describantur, in extremo libro forma et ratio earum erit subscripta.",
    english:
      "Concerning the drawing of the volutes—how they are to be drawn so as to be wound correctly to the compass—their figure and calculation will be set down at the end of the book.",
    note: "forma et ratio means ‘figure and calculation/account’. The future erit points forward. The ancient illustration is not preserved here. The 1889 plate below is a much later construction, not the fulfilment of this promise in a surviving ancient manuscript.",
    page: 1,
  },
] as const;

export const voluteWords = [
  {
    word: "voluta · volutarum",
    gloss: "scroll · of the scrolls",
    language: "la",
    note: "A form related to winding or rolling. The title names an architectural scroll; our arc construction follows one selected later guide, not every Ionic volute.",
  },
  {
    word: "oculus · oculi",
    gloss: "eye · of the eye",
    language: "la",
    note: "The small circle at the centre. It supplies the unit e. It is not the same point as any of the twelve compass pins.",
  },
  {
    word: "circinus · circini",
    gloss: "compass · of the compass",
    language: "la",
    note: "A drawing compass has one fixed leg at the selected centre and a moving leg on the curve. Changing the fixed leg changes the circle.",
  },
  {
    word: "minuatur",
    gloss: "let it be diminished",
    language: "la",
    note: "Present passive subjunctive from minuere. This command gives a reduction; it does not name the geometric location of the next centre.",
  },
  {
    word: "ἄβαξ · abacus",
    gloss: "board or slab; the capital’s top member",
    language: "grc",
    note: "Greek headword and its Latin architectural borrowing. This is vocabulary, not a Greek original of the Latin passage. The abacus lies above the volutes.",
  },
  {
    word: "κάθετος · cathetus",
    gloss: "perpendicular; a dropped vertical",
    language: "grc",
    note: "Greek headword and the Latinized technical term. The vertical line through the eye locates its upper and lower portions. A construction pin need not lie on that line.",
  },
  {
    word: "διάμετρος · diametros",
    gloss: "diameter",
    language: "grc",
    note: "Greek headword and the borrowing in Vitruvius. The diameter runs across a circle through its centre; confusing it with a radius doubles or halves the construction.",
  },
] as const;

export const ve = (s: string | number): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
export const vn = (n: number, places = 6): string => Number(n.toFixed(places)).toString();
export function voluteReadingHtml(links = true): string {
  return voluteReadings
    .map(
      (r) =>
        `<article class="vo-reading"><h3>${r.title}</h3><p class="vo-latin" lang="la">${r.latin}</p><p>${r.english}</p><p class="vo-note">${r.note}</p>${links ? `<button type="button" data-vo-page="${r.page}">Inspect the whole page and apparatus</button>` : ""}</article>`,
    )
    .join("");
}
export function voluteWordHtml(): string {
  return voluteWords
    .map(
      (w) =>
        `<div><dt><span lang="${w.language}">${w.word}</span> <span>${w.gloss}</span></dt><dd>${w.note}</dd></div>`,
    )
    .join("");
}

import type { ColonnadePart, ColonnadeSource } from "./core/colonnade";

export const COLONNADE_VOLUME = "https://digi.ub.uni-heidelberg.de/diglit/humann1904";
export const COLONNADE_LATIN = "https://archive.org/details/vitruviidearchit00vitr_1";
export const COLONNADE_LEFAS = "https://doi.org/10.3917/arch.011.0093";
export const COLONNADE_LIMITS =
  "The plans are a modern regular-grid experiment in lower shaft diameters (D), not a measured reconstruction of Magnesia. Equal gaps, a one-D wall and a simplified enclosed cella block are chosen. Porches, interior columns, bases, steps, roof supports and structural calculations are omitted. The 42 and 76 counts include only the model's perimeter rings. A clear strip is measured between shaft faces at column stations; actual bases would occupy more space. Geometry does not determine a textual reading, construction cost or crowd capacity.";

export const colonnadePartNotes: Record<
  ColonnadePart,
  { title: string; greek: string; latin: string; note: string; dictionary: string }
> = {
  space: {
    title: "The surrounding passage",
    greek: "τὸ πτερόν · πτεροῦ",
    latin: "ambulatio; pteroma",
    note: "A wing becomes an architectural word for the space around a temple. Removing the inner colonnade joins the two narrow side lanes and the former shaft position into one broad strip.",
    dictionary: "πτερόν",
  },
  outer: {
    title: "The retained columns",
    greek: "ὁ κίων · κίονος",
    latin: "columna; exteriores ordines",
    note: "Eight across each end and fifteen along each flank do not make 46 separate columns. The four corners belong to both descriptions. One circuit visits 42 distinct positions.",
    dictionary: "κίων",
  },
  inner: {
    title: "The omitted colonnade",
    greek: "δίπτερος → ψευδοδίπτερος",
    latin: "interiores ordines columnarum",
    note: "Di- means two; pteron means wing. Pseudo- qualifies the double arrangement: its outer spacing remains, with the inner ring absent. The regular inner ring here has six by thirteen positions, or 34 distinct columns.",
    dictionary: "δίπτερος",
  },
  cella: {
    title: "The enclosed temple room",
    greek: "ὁ ναός · ναοῦ",
    latin: "cella; parietes cellae",
    note: "Naos can name the temple, and in architectural description its main room. This experiment simplifies the inner building to a block. The source restoration has porches and additional columns which this block does not represent.",
    dictionary: "ναός",
  },
};
export const colonnadeWords = [
  {
    label: "octonae",
    meaning: "eight in each place",
    note: "A distributive numeral, feminine plural with columnae: eight at the front and eight at the rear. It does not mean eight divided between both ends.",
  },
  {
    label: "quinae denae",
    meaning: "fifteen on each side",
    note: "Two words form the distributive fifteen. The next phrase includes the corner columns, so the long-side count overlaps the end counts.",
  },
  {
    label: "cum angularibus",
    meaning: "including the corner columns",
    note: "Cum takes the ablative. Angularibus stands for the corner columnae. Count each corner once when finding a total, even though it belongs to an end and a flank.",
  },
  {
    label: "duorum intercolumniorum",
    meaning: "of two spaces between columns",
    note: "A genitive quantity attached to spatium, space. The following genitive adds one lower shaft thickness. If a clear gap is g diameters, the passage is 2g + 1, rather than two axis pitches.",
  },
  {
    label: "interiores ordines",
    meaning: "the inner rows",
    note: "The accusative plural is the object of distulit, removed. Columnarum is genitive plural, of columns. XXXIV is the editor's printed number; the apparatus also records XXXVIII.",
  },
  {
    label: "ambulationi laxamentum",
    meaning: "room for walking",
    note: "Ambulationi is dative: for the walk or passage. Laxamentum is the room provided. Vitruvius argues for use and appearance; his later rain example does not supply a measurable occupancy or loading limit.",
  },
];
export const colonnadeReadings = [
  {
    title: "Count the ends and the flanks",
    section: "III.2.6",
    source: "prescription" as const,
    latin:
      "pseudodipteros autem sic conlocatur, ut in fronte et postico sint columnae octonae, in lateribus cum angularibus quinae denae.",
    english:
      "The pseudodipteral temple is arranged so that there are eight columns each at the front and rear, and fifteen on each flank, including the corners.",
    words: [0, 1, 2],
  },
  {
    title: "Measure between faces",
    section: "III.2.6",
    source: "prescription" as const,
    latin:
      "sint autem parietes cellae contra quaternas columnas medianas in fronte et postico. ita duorum intercolumniorum et imae crassitudinis columnae spatium erit ab parietibus circa ad extremos ordines columnarum.",
    english:
      "The cella walls are to stand opposite the four middle columns at the front and rear. Thus a space of two intercolumniations and the lower thickness of a column will extend all round from the walls to the outer rows of columns.",
    words: [3],
  },
  {
    title: "Read what is doubled",
    section: "III.2.7, excerpt",
    source: "prescription" as const,
    latin: "sed circa aedem duplices habet ordines columnarum",
    english: "But around the temple it has double rows of columns.",
    words: [],
  },
  {
    title: "Remove the inner rows",
    section: "III.3.8, excerpt",
    source: "apparatus" as const,
    latin:
      "ex dipteri enim aedis symmetria distulit interiores ordines columnarum XXXIV eaque ratione sumptus operasque compendii fecit.",
    english:
      "For from the proportioned arrangement of the dipteral temple he removed the inner rows of thirty-four columns, and in this way saved expense and labour.",
    words: [4],
  },
  {
    title: "Keep room for a walk",
    section: "III.3.8, excerpt",
    source: "apparatus" as const,
    latin:
      "is in medio ambulationi laxamentum egregie circa cellam fecit de aspectuque nihil inminuit",
    english:
      "He provided ample room in the middle for walking around the cella and diminished nothing of its appearance.",
    words: [5],
  },
];
export const colonnadeSourceInfo: Record<
  ColonnadeSource,
  { title: string; file: string; note: string; original: string; width: number; height: number }
> = {
  restored: {
    title: "A proposed restoration · figure 30, printed p. 43",
    file: "humann-043.jpg",
    note: "Julius Kohte's restored plan in Humann, Kohte and Watzinger (1904). Wiederherstellung means restoration. Count eight across an end and fifteen along a flank. There are also porch and interior columns: the outer ring is not the whole building's column total. The centre opening at the ends is wider than neighbouring gaps.",
    original: `${COLONNADE_VOLUME}/0051`,
    width: 3439,
    height: 2539,
  },
  remains: {
    title: "The preserved state · figure 29, printed p. 41",
    file: "humann-041.jpg",
    note: "The caption says im erhaltenen Bestande, in the preserved state, after R. Heyne's survey. Compare its different material symbols and discontinuous remains with the clean restoration. It records the excavation publication's assessment, not a current site survey or a complete standing temple.",
    original: `${COLONNADE_VOLUME}/0049`,
    width: 3439,
    height: 2539,
  },
  prescription: {
    title: "The Latin prescription · Krohn, printed p. 63",
    file: "krohn-063.jpg",
    note: "Vitruvius III.2.6–7. The pseudodipteral prescription begins just above the middle of the page. The critical apparatus remains below. Our excerpts join line-end hyphens; English translations and grammar notes are new.",
    original: `${COLONNADE_LATIN}/page/63/mode/1up`,
    width: 1414,
    height: 2200,
  },
  apparatus: {
    title: "The disputed number · Krohn, printed p. 66",
    file: "krohn-066.jpg",
    note: "The main text prints xxxiv (34). In the apparatus, line 4 reads “xxxiv Phil: xxxviii x”. Krohn attributes 34 to Philander and records 38 in the textual tradition. A regular-ring calculation cannot decide whether that editorial reading should be accepted.",
    original: `${COLONNADE_LATIN}/page/66/mode/1up`,
    width: 1414,
    height: 2200,
  },
  capital: {
    title: "A surviving piece · figure 38, printed p. 55",
    file: "humann-055.jpg",
    note: "The publication photographs the underside of an Ionic capital, with its volutes. It is an actual architectural fragment. Its photograph provides neither the missing inner colonnade nor proof that a dipteral predecessor once stood here.",
    original: `${COLONNADE_VOLUME}/0063`,
    width: 1800,
    height: 2828,
  },
};
export function colonnadeReadingHtml(interactive = true): string {
  return colonnadeReadings
    .map(
      (r) =>
        `<article class="col-reading"><p class="col-kicker">${r.section} · ${r.title}</p><p lang="la" class="col-latin">${r.latin}</p><p>${r.english}</p>${interactive ? `<div class="col-word-links">${r.words.map((w) => `<button type="button" data-col-word="${w}"><i lang="la">${colonnadeWords[w]?.label}</i></button>`).join("")}<a href="#col-sources" data-col-source="${r.source}">Inspect the complete page</a></div>` : ""}</article>`,
    )
    .join("");
}

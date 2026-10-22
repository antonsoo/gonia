import type { SpacingSystem } from "./core/spacing";

export const spacingNames: Record<SpacingSystem, { title: string; latin: string; short: string }> =
  {
    pycnostyle: { title: "Pycnostyle", latin: "pycnostylos", short: "Close together" },
    systyle: { title: "Systyle", latin: "systylos", short: "A little farther apart" },
    eustyle: { title: "Eustyle", latin: "eustylos", short: "A wider central entrance" },
    diastyle: { title: "Diastyle", latin: "diastylos", short: "Three diameters apart" },
    araeostyle: { title: "Araeostyle", latin: "araeostylos", short: "Widely separated" },
  };
export interface SpacingPassage {
  section: string;
  page: 64 | 65 | 66 | 67;
  latin: string;
  english: string;
  note: string;
}
export const spacingPassages: Record<SpacingSystem, SpacingPassage> = {
  pycnostyle: {
    section: "III.3.2",
    page: 64,
    latin:
      "ergo pycnostylos est, cuius intercolumnio unius et dimidiatae columnae crassitudo interponi potest",
    english:
      "Pycnostyle is the arrangement in whose gap the thickness of one and a half columns can be placed.",
    note: "The gap is measured between shafts. It is 1.5 diameters; the distance from one column axis to the next is 2.5 diameters. In III.3.3 Vitruvius criticizes the cramped approach and obstructed views of close-set columns.",
  },
  systyle: {
    section: "III.3.2",
    page: 64,
    latin:
      "item systylos est, in qua duarum columnarum crassitudo in intercolumnio poterit conlocari",
    english:
      "Systyle is the arrangement in which the thickness of two columns can be placed in the gap.",
    note: "Duarum columnarum means ‘of two columns’. Two diameters describe the empty interval, not the axis spacing. Vitruvius continues by relating the base plinths to their intervening spaces; this workshop does not model those base details.",
  },
  eustyle: {
    section: "III.3.6",
    page: 65,
    latin:
      "namque facienda sunt in intervallis spatia duarum columnarum et quartae partis columnae crassitudinis, mediumque intercolumnium unum, quod erit in fronte, alterum, quod in postico, trium columnarum crassitudine",
    english:
      "Make the ordinary spaces two column-thicknesses and a quarter; make the middle gap at the front, and the corresponding one at the rear, three column-thicknesses.",
    note: "The central opening is an exception. Medium intercolumnium is the middle gap, not a middle column. This model follows the stated ordinary diameter before the later corner-thickening adjustment in III.3.11.",
  },
  diastyle: {
    section: "III.3.4",
    page: 64,
    latin:
      "diastyli autem haec erit compositio, cum trium columnarum crassitudinem intercolumnio interponere possumus",
    english:
      "The diastyle arrangement is one in which we can place the thickness of three columns in the gap.",
    note: "Vitruvius next says that the large intervals cause architraves to break. That is the ancient author's warning, not a modern structural limit calculated by this app. No material strength, load or beam depth is modeled here.",
  },
  araeostyle: {
    section: "III.3.5",
    page: 64,
    latin:
      "in araeostylis autem nec lapideis nec marmoreis epistyliis uti datur, sed inponendae de materia trabes perpetuae",
    english:
      "For araeostyle arrangements, stone or marble architraves cannot be used; continuous timber beams must be laid across instead.",
    note: "This passage gives no fixed gap in diameters. The slider selects a modern illustrative example. Its value must not be mistaken for a number supplied by Vitruvius. His timber prescription is shown as textual evidence, not a structural design recommendation.",
  },
};
export const modulePassage: SpacingPassage = {
  section: "III.3.7",
  page: 65,
  latin:
    "frons loci quae in aede constituta fuerit, si tetrastylos facienda fuerit, dividatur in partes XI S praeter crepidines et proiecturas spirarum; si sex erit columnarum, in partes XVIII; si octastylos constituetur, dividatur in XXIV et semissem",
  english:
    "Divide the intended front into eleven and a half parts for four columns, excluding the steps and projecting bases; into eighteen for six columns; into twenty-four and a half for eight columns.",
  note: "S abbreviates a half, semis. Each part becomes one lower column diameter. These totals include the columns themselves as well as the clear gaps. The numbers follow Krohn's printed text; his apparatus below records variant readings.",
};
export const heightPassage: SpacingPassage = {
  section: "III.3.10",
  page: 66,
  latin:
    "eustyli autem aedis columnae, uti systyli, in novem partes altitudo dividatur et dimidiam partem, et eius una pars constituatur in crassitudine imi scapi",
  english:
    "For an eustyle temple, as for a systyle one, divide the column's height into nine and a half parts; make one part the thickness at the bottom of the shaft.",
  note: "Altitudo is height; crassitudo is thickness or diameter here. Novem ... et dimidiam partem says nine and a half. The drawing uses this passage and the other four proportions in III.3.10, rather than silently substituting a different translation's number.",
};
export const sourcePages = [64, 65, 66, 67] as const;
export function sourceImage(page: number): string {
  return `./sources/spacing/krohn-0${page + 18}.jpg`;
}
export const spacingSource =
  "https://archive.org/details/vitruviidearchit00vitr_1/page/64/mode/2up";
export const greekParts = [
  {
    greek: "στῦλος",
    roman: "stylos",
    meaning: "pillar, column",
    note: "The recurring -style part belongs to the Greek word for a pillar. It is unrelated to a stylistic preference in the modern sense.",
    source:
      "https://atlas.perseus.tufts.edu/dictionaries/entry/urn:cite2:scaife-viewer:dictionaries.v1:lsj-n97386/",
  },
  {
    greek: "πυκνός",
    roman: "pyknos",
    meaning: "close, compact",
    note: "Pycno- describes close spacing. The same Greek word gives Pyknon, our separate experiment in close musical intervals.",
    source: "https://cld.bbaw.de/lemma/grc/%CF%80%CF%85%CE%BA%CE%BD%CF%8C%CF%82",
  },
  {
    greek: "σύν",
    roman: "syn",
    meaning: "with, together",
    note: "The first part of systyle is a form of this combining element. The architectural ratio comes from Vitruvius's definition, not from the word-part alone.",
    source:
      "https://atlas.perseus.tufts.edu/dictionaries/entry/urn:cite2:scaife-viewer:dictionaries.v1:lsj-n99002/",
  },
  {
    greek: "διά",
    roman: "dia",
    meaning: "through; apart in compounds",
    note: "Dia- can express separation in a compound. Here Vitruvius gives the numerical gap as three diameters.",
    source: "https://cld.bbaw.de/lemma/grc/%CE%B4%CE%B9%CE%AC",
  },
  {
    greek: "ἀραιός",
    roman: "araios",
    meaning: "sparse, not close-set",
    note: "Araeo- describes wide separation. It does not itself specify four diameters or any other fixed number.",
    source: "https://logeion.uchicago.edu/%E1%BC%80%CF%81%CE%B1%CE%B9%CF%8C%CF%82",
  },
  {
    greek: "εὖ",
    roman: "eu",
    meaning: "well",
    note: "Eu- conveys a favorable judgment. Vitruvius prefers the eustyle arrangement; the name does not establish that every surviving temple followed it.",
    source: "https://atlas.perseus.tufts.edu/lemma/599/",
  },
];
export type Dimension = "gap" | "axis" | "diameter" | "height" | "front";
export const dimensionWords: Record<Dimension, { latin: string; meaning: string }> = {
  gap: {
    latin: "intercolumnium",
    meaning: "The clear interval between two shafts at their lower diameter.",
  },
  axis: {
    latin: "axis",
    meaning:
      "A modern drawing aid here: the line through a column's centre. An axis-to-axis bay includes one diameter in addition to its clear gap.",
  },
  diameter: {
    latin: "crassitudo imi scapi",
    meaning:
      "The thickness at the bottom of the shaft. In this scheme one such diameter is the modulus, the unit used to size the other parts.",
  },
  height: {
    latin: "altitudo",
    meaning:
      "Height. The source's column-height ratio changes with the spacing system. The profile in the drawing is schematic.",
  },
  front: {
    latin: "frons",
    meaning:
      "The front measured between the outer shaft faces. This module count excludes the steps and projecting bases named in the passage.",
  },
};

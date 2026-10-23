import { transportEscape as esc } from "./transport-drawing";

export const TRANSPORT_SOURCE = "https://archive.org/details/vitruviidearchit00vitr_1";
export const transportPages = [230, 231] as const;
export const transportReadings = [
  {
    title: "Free to turn",
    page: 230,
    section: "X.2.11",
    latin: "cnodaces autem in armillis inclusi liberam habuerunt versationem.",
    english: "The pivots, enclosed in the rings, could turn freely.",
    note: "The stone rotates while the timber frame is pulled. The next sentence explicitly supplies oxen; free rotation is not perpetual motion.",
  },
  {
    title: "The beam becomes the axle",
    page: 231,
    section: "X.2.12",
    latin:
      "epistylia vero inclusa uti axes in rotis eadem ratione, qua scapi, sine mora ad opus pervenerunt.",
    english:
      "The architraves, enclosed like axles in the wheels, reached the work without delay in the same way as the shafts.",
    note: "The preceding page gives wheels of about twelve feet. The usual diameter reading follows Morgan's translation. No architrave cross-section is specified; the initial 8 × 6 section here is a chosen illustration.",
  },
  {
    title: "The route is part of the method",
    page: 231,
    section: "X.2.12",
    latin: "nec ullus est clivus sed perpetuus campus.",
    english: "There is no hill, but an uninterrupted plain.",
    note: "Vitruvius also qualifies the distance as eight Roman miles. The drawing assumes a flat road and makes no conversion of his units or reconstruction of that route.",
  },
  {
    title: "The reported replacement block",
    page: 231,
    section: "X.2.13",
    latin: "haec autem basis erat longa pedes duodecim, lata pedes VIII, alta pedes sex.",
    english: "This base was twelve feet long, eight feet wide and six feet high.",
    note: "The Paconius preset takes the twelve-foot length along the wheel axis, leaving an 8 × 6 end section. X.2.14 gives wheels of about fifteen feet, read as diameter here. Those are explicit modeling interpretations, not new archaeological measurements.",
  },
  {
    title: "Turning did not ensure a straight journey",
    page: 231,
    section: "X.2.14",
    latin: "sed non poterat ad lineam via recta ducere, sed exibat in unam partem.",
    english: "But he could not guide it straight along the road; it kept going off to one side.",
    note: "Vitruvius reports that Paconius pulled a rope wound around the crossbars, repeatedly had to draw the machine back, and lost money. This two-dimensional model has no steering or rope-pull dynamics; it cannot establish the cause of that failure.",
  },
] as const;

export const transportWords = {
  cnodaces: {
    label: "cnodaces",
    meaning: "pivots",
    note: "Nominative plural, the subject of habuerunt. Vitruvius uses a Greek technical loan; compare κνώδαξ, a pin or pivot. The diagram marks their common axis at C.",
  },
  armillis: {
    label: "armillis",
    meaning: "in the rings",
    note: "Ablative plural of armilla after in: location inside the bearing rings. The pivots turn within them; these rings are not the large road wheels.",
  },
  versationem: {
    label: "versationem",
    meaning: "turning, rotation",
    note: "Accusative singular, with liberam: the freedom to turn. Habuerunt is past-tense plural, agreeing with cnodaces.",
  },
  epistylia: {
    label: "epistylia",
    meaning: "architraves",
    note: "Neuter nominative plural, the subject of pervenerunt. Inclusa agrees with it. Compare Greek ἐπιστύλιον: the horizontal member over columns.",
  },
  axes: {
    label: "axes",
    meaning: "axles",
    note: "Plural of axis. Uti introduces the comparison: the architraves themselves occupy the axle position inside the wheels.",
  },
  rotis: {
    label: "rotis",
    meaning: "in the wheels",
    note: "Ablative plural of rota after in. These are the large rolling wheels, distinct from the bearing rings named armillae.",
  },
  clivus: {
    label: "clivus",
    meaning: "a slope or hill",
    note: "Nominative singular. Nec ullus denies any hill in this description of the route; the present model assumes that stated flatness.",
  },
  lata: {
    label: "lata",
    meaning: "wide",
    note: "Feminine nominative singular, agreeing with basis. Longa, lata and alta give three different dimensions; width eight and height six make the end section used here.",
  },
  ducere: {
    label: "ducere",
    meaning: "to lead or draw",
    note: "An infinitive after poterat, could. The reported problem is guiding the machine along a straight line, not an assertion that its rectangular load would strike the road.",
  },
} as const;
export type TransportWord = keyof typeof transportWords;

export const transportGreek = [
  {
    word: "κνώδαξ",
    genitive: "κνώδακος",
    article: "ὁ",
    meaning: "a pivot or pin on which something turns",
    latin: "cnodax",
    note: "The singular changes its stem before the genitive ending. The Latin passage has the plural cnodaces.",
  },
  {
    word: "κύλινδρος",
    genitive: "κυλίνδρου",
    article: "ὁ",
    meaning: "a roller or cylinder",
    latin: "cylindrus",
    note: "Vitruvius compares the method to the rollers used to level palaestra walks. His Latin plural is cylindri.",
  },
  {
    word: "ἐπιστύλιον",
    genitive: "ἐπιστυλίου",
    article: "τό",
    meaning: "an architrave, the member over columns",
    latin: "epistylium",
    note: "A neuter noun. Latin epistylia is plural in the selected sentence; these beams turn within the wheels.",
  },
] as const;

export const TRANSPORT_LIMITS =
  "A modern kinematic reading of Vitruvius X.2.11–14, not an archaeological reconstruction or engineering plan. The road is flat, bodies rigid and wheels circular; rolling has no slip. Two end wheels are represented by one end view. The stone and wheels turn together. Actual bearings, frame dimensions, taper, soil, friction, rope winding, steering, forces, masses and animal effort are outside the model. The bare rectangle is an explicit modern counterexample, not a method prescribed in the passage.";

export function transportReadingHtml(interactive = true): string {
  return transportReadings
    .map((p, i) => {
      let latin = esc(p.latin);
      if (interactive)
        for (const [key, word] of Object.entries(transportWords))
          latin = latin.replace(
            new RegExp(`\\b${word.label}\\b`),
            `<button type="button" class="transport-word" aria-controls="transport-word-panel" data-transport-word="${key}">${word.label}</button>`,
          );
      return `<article class="transport-reading"><p class="eyebrow">${p.section} · ${p.title}</p><p class="transport-latin" lang="la">${latin}</p><p>${p.english}</p><p class="transport-small">${p.note} <a href="${interactive ? "#transport-sources" : `#transport-printed-${p.page}`}" ${interactive ? `data-transport-page="${p.page}"` : ""}>Printed p. ${p.page}</a>.</p><span id="transport-reading-${i}"></span></article>`;
    })
    .join("");
}

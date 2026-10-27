export const BABYLON_TABLET = "https://collections.louvre.fr/en/ark:/53355/cl010167181";
export const BABYLON_SCHEIL = "https://www.persee.fr/doc/minf_0398-3609_1914_num_39_1_1606";
export const BABYLON_TCL = "https://archive.org/details/tablettesduruk00thuruoft";
export const BABYLON_PAPER = "https://doi.org/10.1017/irq.2024.4";
export const BABYLON_SCAN = "https://doi.org/10.5281/zenodo.10374395";
export const BABYLON_ORACC = "https://oracc.museum.upenn.edu/btto/Q007970";
export const BABYLON_LIMITS =
  "These are two ways of reasoning from surviving evidence, not measured elevations of the ancient building. The tablet is a later copy; a missing line is supplied by editors. The stone image is worn, and treating its proportions as a uniform scale is an assumption. Neither source fixes every wall, stair, terrace offset or construction phase.";
export const babylonPages = [
  {
    id: "scheil-300",
    file: "scheil-300.jpg",
    label: "Scheil 1914, p. 300 · numerical rows",
    note: "Whole printed page. Rows 1–5 are followed by row 6 naming the seventh storey; the sixth storey's measurements are absent. Scheil's older sign readings differ from the modern reading aids.",
    url: `${BABYLON_SCHEIL}?pageId=T2_300`,
  },
  {
    id: "scheil-304",
    file: "scheil-304.jpg",
    label: "Scheil 1914, p. 304 · French translation",
    note: "Whole printed page, including the unfilled jump from fifth to seventh storey. This early translation is retained as evidence, not as a current critical edition.",
    url: `${BABYLON_SCHEIL}?pageId=T2_304`,
  },
  {
    id: "scheil-305",
    file: "scheil-305.jpg",
    label: "Scheil 1914, p. 305 · copy and date",
    note: "Whole printed page. The colophon identifies Uruk, 26 Kislīmu, year 83 of Seleucus. Scheil converts it to 229 BCE; no day-exact modern conversion is needed here.",
    url: `${BABYLON_SCHEIL}?pageId=T2_305`,
  },
  {
    id: "tcl6-lix",
    file: "tcl6-lix.jpg",
    label: "Thureau-Dangin 1922, plate LIX · obverse",
    note: "Hand copy of AO 6555, no. 32, face. An editor's drawing of cuneiform signs, not a photograph of the clay.",
    url: "https://archive.org/download/tablettesduruk00thuruoft/tablettesduruk00thuruoft.pdf#page=125",
  },
  {
    id: "tcl6-lx",
    file: "tcl6-lx.jpg",
    label: "Thureau-Dangin 1922, plate LX · reverse",
    note: "Hand copy of AO 6555, no. 32, reverse. The first rows continue the tower dimensions. Inspect the missing ordinal against the numerical table.",
    url: "https://archive.org/download/tablettesduruk00thuruoft/tablettesduruk00thuruoft.pdf#page=127",
  },
  {
    id: "stele-photo",
    file: "stele-photo.jpg",
    label: "Pedersén 2024, figure 1 · stone photograph",
    note: "Two joined fragments. The elevation and top-building plan occupy the upper part; the king is shown at a larger scale. Photograph Olof Pedersén, 2023, CC BY 4.0. Extracted unmodified from the article PDF.",
    url: BABYLON_PAPER,
  },
  {
    id: "stele-drawing",
    file: "stele-drawing.jpg",
    label: "Pedersén 2024, figure 3 · provisional drawing",
    note: "A modern interpretation of the stone. Grey lines are insecure reconstructions. The plan above and elevation below do not share one scale. Drawing Olof Pedersén, 2023, CC BY 4.0; extracted unmodified from the article PDF.",
    url: BABYLON_PAPER,
  },
] as const;
export const babylonWords = [
  {
    written: "ÚS",
    word: "šiddu",
    meaning: "length",
    note: "A sign label in capitals, followed by the Akkadian word. Scheil writes uš; the modern corpus lemmatizes the word as šiddu. Do not pronounce the capital sign label as an Akkadian sentence.",
  },
  {
    written: "SAG",
    word: "pūtu",
    meaning: "breadth",
    note: "Literally also 'front' or 'forehead'. In these measurements it names the breadth. A second horizontal dimension does not tell us where the next terrace sits.",
  },
  {
    written: "SUKUD",
    word: "mēlû",
    meaning: "height",
    note: "Scheil uses gud in his older transliteration. The modern sign label SUKUD is associated with Akkadian mēlû. The units still have to be identified before converting to metres.",
  },
  {
    written: "GAR / NINDA",
    word: "nindanu",
    meaning: "a measuring rod; a length unit",
    note: "The numerical comparison uses the conventional conversion 1 nindanu = 12 ordinary cubits ≈ 6 m. The tablet also discusses other cubit standards: a single automatic conversion is not valid for its entire text.",
  },
  {
    written: "KÙŠ",
    word: "ammatu",
    meaning: "cubit",
    note: "A length unit, not one universal modern length. The 90 m tablet-derived scheme and a 91.5 m excavated base are kept separate rather than silently equated.",
  },
  {
    written: "rik-bi / U₅",
    word: "rikbu",
    meaning: "storey",
    note: "The second storey is written with a syllabic word; later rows use a sign. The label seventh after fifth is evidence for a gap, not surviving measurements for the gap.",
  },
  {
    written: "KI.TA",
    word: "šaplû",
    meaning: "lower",
    note: "The lower brickwork in the first numerical row. It does not by itself tell us the construction date, material strengths or present surviving height.",
  },
  {
    written: "AN.TA",
    word: "elû",
    meaning: "upper",
    note: "The upper sanctum belongs above the terraces. Its 4 by 3¾ nindanu footprint is rectangular; the drawing below shows a front elevation, not a square plan.",
  },
] as const;
export const babylonReadings = [
  {
    label: "Lower brickwork",
    levels: [0],
    reading: "15 GAR ÚS · 15 GAR SAG · 5½ GAR SUKUD",
    english: "Length 15 rods; breadth 15 rods; height 5½ rods: the lower brickwork.",
    page: "scheil-300",
    note: "Numerical reading aid from Scheil's p. 300, with normalized sign labels. At the chosen 6 m conversion: 90 × 90 × 33 m. The retained BTTo transliteration displays 2½ here while its translation reads 5½; this activity explicitly follows the 5½ in the retained 1914 numerical row and the conventional scheme.",
  },
  {
    label: "Second storey",
    levels: [1],
    reading: "13 GAR ÚS · 13 GAR SAG · 3 GAR SUKUD · rik-bi 2-ú",
    english: "Length 13 rods; breadth 13 rods; height 3 rods: the second storey.",
    page: "scheil-300",
    note: "A normalized numerical aid, not a diplomatic transcription. The photograph's second terrace is much shallower when the stone's image is projected with one uniform scale.",
  },
  {
    label: "Third storey",
    levels: [2],
    reading: "10 GAR ÚS · 10 GAR SAG · 1 GAR SUKUD · U₅ 3-šú",
    english: "Length 10 rods; breadth 10 rods; height 1 rod: the third storey.",
    page: "scheil-300",
    note: "A normalized aid to the numerical row. At 6 m per rod this is 60 × 60 × 6 m. The 6 m height belongs to this conventional reading; it is not a new measurement of a surviving terrace.",
  },
  {
    label: "Fourth storey",
    levels: [3],
    reading: "8½ GAR ÚS · 8½ GAR SAG · 1 GAR SUKUD · U₅ 4-ú",
    english: "Length 8½ rods; breadth 8½ rods; height 1 rod: the fourth storey.",
    page: "scheil-300",
    note: "The half rod changes the footprint to 51 × 51 m under this conversion. The row gives dimensions, while the centred position in the comparison drawing remains a modern convention.",
  },
  {
    label: "Fifth, then seventh",
    levels: [4, 5],
    reading: "7 GAR ÚS · 7 GAR SAG · 1 GAR SUKUD · U₅ 5-šú … U₅ 7-ú",
    english:
      "The fifth storey is given dimensions. The next surviving row names the seventh. There is no written sixth-storey dimension row in between.",
    page: "scheil-304",
    note: "The ellipsis is this lesson's omission marker. Modern editors supply a sixth row. Use the missing-level controls to distinguish a supplied value from a written one.",
  },
  {
    label: "Top sanctuary",
    levels: [6],
    reading: "4 GAR ÚS · 3¾ GAR SAG · 2½ GAR SUKUD",
    english: "Length 4 rods; breadth 3¾ rods; height 2½ rods: the upper sanctuary.",
    page: "tcl6-lx",
    note: "The breadth follows the modern 3¾ interpretation. Scheil's 1914 page reads the fractional expression differently. At 6 m per rod, the scheme is 24 × 22.5 × 15 m; it is not a 24 m square.",
  },
  {
    label: "Copied and checked",
    levels: [],
    reading: "GABA.RI bar-sip.KI … SAR-ma … ù ba-ri",
    english: "A duplicate from Borsippa … written … and checked.",
    page: "scheil-300",
    note: "Selected words only, with omissions explicitly marked. The colophon describes transmission of a text. A checked copy can still contain a missing row and is not an excavator's field measurement.",
  },
] as const;

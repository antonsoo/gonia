import type { Treatment } from "./core/corner";

export const strategies: Record<Treatment, { title: string; short: string; text: string }> = {
  align: {
    title: "Keep the centres aligned",
    short: "A gap at the corner",
    text: "Place a triglyph above every column axis, with one halfway between. The rhythm is regular. But the first triglyph no longer reaches the corner: a strip is left beside it.",
  },
  widen: {
    title: "Widen the end metope",
    short: "A wider end panel",
    text: "Pull the corner triglyph out to the edge and leave the columns in place. The panel beside that triglyph grows wider. The corner triglyph is now off its column’s axis.",
  },
  contract: {
    title: "Contract the end bay",
    short: "A narrower column bay",
    text: "Start the regular frieze at the corner. Keep the corner column centred under the crossing beams and bring the other columns towards it. The end bay shrinks; the metopes keep their rhythm. The corner triglyph remains off its column’s axis.",
  },
};

const lsj = (id: number) =>
  `https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n${id}/`;
export const terms = [
  {
    id: "corner",
    english: "Corner",
    greek: "γωνία",
    transliteration: "gōnía",
    latin: "angulus",
    grammar: "Greek noun, feminine; Latin noun, masculine.",
    meaning:
      "Where the front and return meet. Gonia takes its name from this Greek word for a corner or angle.",
    source: lsj(23129),
  },
  {
    id: "triglyph",
    english: "Triglyph",
    greek: "τρίγλυφος",
    transliteration: "tríglyphos",
    latin: "triglyphus",
    grammar: "Greek architectural noun, feminine; Latin noun, masculine.",
    meaning:
      "A grooved block in the Doric frieze. The drawing shows two full grooves and a half-groove at each edge. Its width is our unit T.",
    source: lsj(104870),
  },
  {
    id: "metope",
    english: "Metope",
    greek: "μετόπη",
    transliteration: "metópē",
    latin: "metopa",
    grammar: "Greek and Latin nouns, feminine.",
    meaning:
      "The panel between two triglyphs. It may carry sculpture; here it is left plain so that its changing width is easy to see.",
    source: lsj(67204),
  },
  {
    id: "beam",
    english: "Architrave",
    greek: "ἐπιστύλιον",
    transliteration: "epistýlion",
    latin: "epistylium",
    grammar: "Greek and Latin nouns, neuter.",
    meaning:
      "The horizontal member resting on the column capitals, below the frieze. The plan reveals its depth B, which an elevation cannot show.",
    source:
      "https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Ashort-def-34769/",
  },
  {
    id: "column",
    english: "Column",
    greek: "κίων",
    transliteration: "kíōn",
    latin: "columna",
    grammar: "Greek noun, masculine or feminine; Latin noun, feminine.",
    meaning:
      "A vertical support. The dashed line marks its centre, or axis. Our bay measurements run between axes, not between the edges of the shafts.",
    source: lsj(57643),
  },
] as const;
export type Term = (typeof terms)[number]["id"];

export const sourcePassages = [
  {
    latin:
      "namque necesse est triglyphos constitui contra medios tetrantes columnarum, metopasque, quae inter triglyphos fient, aeque longas esse quam altas.",
    english:
      "For the triglyphs must be placed opposite the centres of the columns, and the metopes between the triglyphs must be as wide as they are high.",
    note: "The desired regularity: alignment and square panels.",
  },
  {
    latin:
      "contraque in angulares columnas triglyphi in extremis partibus constituuntur et non contra medios tetrantes.",
    english:
      "But at the corner columns the triglyphs are placed at the outermost ends, rather than opposite the centres.",
    note: "The corner requires a different alignment.",
  },
  {
    latin:
      "ita metopae, quae proximae ad angulares triglyphos fiunt, non exeunt quadratae sed oblongiores triglyphi dimidia latitudine.",
    english:
      "So the metopes beside the corner triglyphs do not come out square, but wider by half a triglyph’s width.",
    note: "Widening the end panel. His half-triglyph adjustment matches our B = 2T example.",
  },
  {
    latin:
      "at qui metopas aequales volunt facere, intercolumnia extrema contrahunt triglyphi dimidia latitudine.",
    english:
      "Those who want equal metopes instead contract the end intercolumniations by half a triglyph’s width.",
    note: "Contracting the end spacing. Vitruvius criticizes both compromises in the following sentence.",
  },
] as const;

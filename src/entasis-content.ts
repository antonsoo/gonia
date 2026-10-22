export const penroseSource = "https://digi.ub.uni-heidelberg.de/diglit/penrose1888/0054";
export const entasisSources = [
  {
    id: "39",
    label: "Penrose · p. 39",
    file: "penrose-039.jpg",
    width: 2675,
    height: 4203,
    hash: "9fc580752d535a0eb0be60b6aec035c078bab4f69b74aded7f4a90b567024b07",
    note: "The meaning of entasis, including Penrose's observation that these profiles remain narrower above the base.",
    link: "https://digi.ub.uni-heidelberg.de/diglit/penrose1888/0052",
  },
  {
    id: "40",
    label: "Penrose · p. 40",
    file: "penrose-040.jpg",
    width: 2675,
    height: 4203,
    hash: "59d088f75181c483300ebb0e3b136148bde990dfee83841a269d96a7aca4c144",
    note: "Six reported maxima and the sequence from stretched-wire readings to corrected, axis-referenced offsets.",
    link: "https://digi.ub.uni-heidelberg.de/diglit/penrose1888/0053",
  },
  {
    id: "41",
    label: "Penrose · p. 41",
    file: "penrose-041.jpg",
    width: 2675,
    height: 4203,
    hash: "7b5dd6ae503603cb99564905004290b01fc4b91015f8326eb5a028aa70dd4c25",
    note: "The five column offsets and hyperbola predictions; the circle comparison is in footnote 1. This page supplies the workshop's plotted numbers.",
    link: penroseSource,
  },
  {
    id: "plate",
    label: "Penrose · plate XIV",
    file: "penrose-Taf_14.jpg",
    width: 4013,
    height: 2961,
    hash: "2ed65b3bdba64d8817c4b04676e67eadcc6b5b0fd360c0495f6b6c2df017e227",
    note: "The fuller survey of the northern of the two central east-front columns, and a separate Erechtheum column. The original plate already enlarges the horizontal entasis. Only the five-row p. 41 comparison is digitized here.",
    link: "https://digi.ub.uni-heidelberg.de/diglit/penrose1888/0156",
  },
  {
    id: "latin",
    label: "Vitruvius · p. 68",
    file: "krohn-068.jpg",
    width: 1414,
    height: 2200,
    hash: "4fa9ef64924b677902b225ebc022efb13246151ea16fff2c1f7d60bdc92d0cd2",
    note: "Krohn's 1912 Latin edition, III.3.13. The sentence naming entasis appears immediately above chapter IV; the critical apparatus remains visible below.",
    link: "https://archive.org/details/vitruviidearchit00vitr_1/page/68/mode/2up",
  },
] as const;
export const entasisPassage = {
  latin:
    "de adiectione, quae adicitur in mediis columnis, quae apud Graecos εντασις appellatur, in extremo libro erit forma et ratio eius, quemadmodum mollis et conveniens efficiatur, subscripta.",
  english:
    "Concerning the addition made in the middle parts of columns, which the Greeks call entasis, a diagram and an explanation of how to make it gentle and appropriate will be set down at the end of the book.",
  note: "Vitruvius III.3.13, Krohn (1912), p. 68. New English translation. Greek εντασις follows this printing's unaccented word; the dictionary headword below supplies accents. Line-end hyphens are joined. The promised ancient illustration has not survived; neither this sentence nor our drawing recovers its recipe.",
};
export const entasisWords = [
  {
    word: "ἔντασις",
    lang: "grc",
    gloss: "entasis · tension, stretching",
    explanation:
      "A feminine noun, genitive ἐντάσεως. In the architectural passage it names the addition within a tapering shaft. Its broader meaning does not establish the architect's motive.",
    source:
      "https://atlas.perseus.tufts.edu/dictionaries/entry/urn:cite2:scaife-viewer:dictionary-entries.atlas_v1:middle-liddell.perseus-eng2-n11200/",
  },
  {
    word: "ἐντείνω",
    lang: "grc",
    gloss: "enteinō · I stretch, strain tight",
    explanation:
      "The related verb helps remember the noun. Penrose connects the word with stretching a line or bending a bow; that is an explanation of the name, not a measured optical effect.",
    source:
      "https://atlas.perseus.tufts.edu/dictionaries/headword/%E1%BC%90%CE%BD%CF%84%CE%B5%CE%AF%CE%BD%CF%89/",
  },
  {
    word: "de adiectione",
    lang: "la",
    gloss: "concerning the addition",
    explanation:
      "De takes the ablative; adiectione is the ablative singular of adiectio. The related passive verb adicitur means ‘is added’.",
    source: "",
  },
  {
    word: "in mediis columnis",
    lang: "la",
    gloss: "in the middle parts of columns",
    explanation:
      "Mediis and columnis are ablative plural. The phrase gives a region; it does not specify a maximum at exactly half the shaft's height.",
    source: "",
  },
  {
    word: "forma et ratio",
    lang: "la",
    gloss: "a diagram and an explanation",
    explanation:
      "Here forma is the promised figure and ratio its account or method. Reading ratio as a supplied numerical proportion would invent information absent from this sentence.",
    source: "",
  },
  {
    word: "mollis et conveniens",
    lang: "la",
    gloss: "gentle and appropriate",
    explanation:
      "The adjectives describe the intended result. Quemadmodum introduces how it is to be made; efficiatur is a passive subjunctive.",
    source: "",
  },
];

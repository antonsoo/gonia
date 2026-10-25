export const SCREW_SOURCE =
  "https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf";
export const SCREW_PAPER = "https://www.cs.drexel.edu/~crorres/screw/screw.pdf";
export const SCREW_LIMITS =
  "An ideal, slowly turning, filled screw: watertight rotating casing, zero-thickness blades and no leakage, friction, sloshing or end losses. The blue region is one connected bucket at its spill level. Its volume is a geometrical capacity, not hydraulic efficiency or measured ancient performance. No output rate, human power or safe construction is inferred.";
export const screwSources = [
  { key: "title", pdf: 5, title: "Krohn’s 1912 edition" },
  { key: "062", pdf: 80, title: "III.1.8 · sixteen digits in a foot" },
  { key: "237", pdf: 255, title: "X.6.1–2 · shaft, equal grid and first strip" },
  { key: "238", pdf: 256, title: "X.6.2–4 · channels, casing and inclination" },
  { key: "239", pdf: 257, title: "End of X.6; the next machine begins" },
] as const;
export const screwSteps = [
  {
    title: "Round the shaft",
    note: "For every foot of length, give the shaft one digit of diameter. With sixteen digits per foot, shaft diameter = length / 16. The model takes the eventual outer radius as one length unit.",
    passage: 1,
  },
  {
    title: "Divide its circumference",
    note: "Quarter, then halve the quarters: eight divisions around each end. These are positions around the same shaft, not eight turns of a single strip.",
    passage: 3,
  },
  {
    title: "Mark the same interval along it",
    note: "One eighth of the circumference supplies the axial interval too. Unroll the surface: the source grid has equal sides. Each diagonal step advances both coordinates by one interval.",
    passage: 4,
  },
  {
    title: "Follow one flexible strip",
    note: "Advance to the next axial and circumferential crossing. Eight steps bring the strip back to its starting circumferential line, one full circumference farther along the shaft. That axial advance is the pitch P.",
    passage: 6,
  },
  {
    title: "Repeat; build up the blades",
    note: "Repeat the helical route from all eight starting divisions. Stack strips until the total diameter reaches length / 8. The ideal drawing gives the blades no thickness; it does not show joinery.",
    passage: 8,
  },
  {
    title: "Enclose and incline",
    note: "Boards enclose the channels and rotate with them. The source’s right triangle has rise 3, run 4 and screw length 5. Turn the screw below: one tracked bucket advances one pitch in a full revolution.",
    passage: 11,
  },
] as const;
export interface ScrewPassage {
  title: string;
  ref: string;
  page: string;
  latin: string;
  english: string;
  words: readonly (readonly [string, string])[];
  note: string;
}
export const screwPassages: readonly ScrewPassage[] = [
  {
    title: "Much water; a modest lift",
    ref: "X.6.1 · p. 237",
    page: "237",
    latin:
      "Est autem etiam cocleae ratio, quae magnam vim haurit aquae, sed non tam alte tollit quam rota.",
    english:
      "There is also the screw arrangement, which draws a great quantity of water, but does not raise it as high as the wheel.",
    words: [
      [
        "cocleae",
        "Genitive of coclea: a snail or spiral, here the water screw. A Greek loan in a Latin text; no Greek original of this passage is supplied.",
      ],
      [
        "vim aquae",
        "Vis can mean force or quantity. Here magnam vim aquae is a large amount of water, not a numerical measurement of force.",
      ],
      [
        "non tam … quam",
        "‘Not so … as’: tam alte … quam rota compares the height with that of the wheel in the preceding chapter.",
      ],
    ],
    note: "Vitruvius gives a comparison, not a measured discharge. The workshop therefore reports volume per revolution in a chosen length unit, not litres per minute.",
  },
  {
    title: "Feet of length, digits of thickness",
    ref: "X.6.1 · p. 237",
    page: "237",
    latin:
      "tignum sumitur, cuius tigni quanta paratur pedum longitudo, tanta digitorum expeditur crassitudo.",
    english:
      "Take a timber: however many feet are assigned to its length, assign that many digits to its thickness.",
    words: [
      ["tignum", "A timber or beam; after rounding, the inner shaft."],
      [
        "quanta … tanta",
        "A matching pair: ‘as much … so much’. The numerical count is the same, but the units are different.",
      ],
      [
        "pedum / digitorum",
        "Genitive plurals of pes and digitus: ‘of feet’ and ‘of digits’. Converting the units supplies the shaft’s slenderness.",
      ],
    ],
    note: "We interpret crassitudo here as diameter, following the circular shaft and the conventional reconstruction. No particular metre length is assigned to a Roman foot.",
  },
  {
    title: "Ask the same author what a digit is",
    ref: "III.1.8 · p. 62",
    page: "062",
    latin:
      "relinquitur pes quattuor palmorum. palmus autem habet quattuor digitos. ita efficitur, ut habeat pes sedecim digitos",
    english:
      "A foot of four palms remains. A palm has four digits. Thus a foot comes to have sixteen digits.",
    words: [
      ["palmorum", "‘Of palms’: four palms make one foot in this account."],
      ["sedecim", "Sixteen: 4 × 4. This is the conversion used by the source setting."],
      [
        "ita efficitur, ut",
        "‘Thus it comes about that …’; habeat is subjunctive in the resulting clause.",
      ],
    ],
    note: "Gwilt’s 1826 English uses ‘inches’ in X.6; Morgan’s 1914 English uses ‘digits’. The twelve-part-foot comparison asks what happens if a modern reader takes ‘inches’ as twelfths. It is our reading experiment, not an alternative stated by Vitruvius.",
  },
  {
    title: "Eight equal parts",
    ref: "X.6.1 · p. 237",
    page: "237",
    latin:
      "id ad circinum rotundatur. in capitibus circino dividentur circumitiones eorum tetrantibus et octantibus in partes octo",
    english:
      "Round it with the compass. At the ends, divide their circumferences with the compass, by quarters and eighths, into eight parts.",
    words: [
      [
        "circinum / circino",
        "Accusative / ablative of circinus: compass; ‘with the compass’ describes the instrument.",
      ],
      [
        "tetrantibus et octantibus",
        "By quarters and eighths. Halving a quarter produces an eighth.",
      ],
      [
        "capitibus",
        "‘At the ends’: the circular end faces of the shaft, not the ends of eight separate screws.",
      ],
    ],
    note: "In the unrolled drawing, the top and bottom edges meet when the sheet wraps around the shaft. The numbered circumferential lines are the same lines at both ends.",
  },
  {
    title: "Make the axial grid equal",
    ref: "X.6.1 · p. 237",
    page: "237",
    latin:
      "et quam magna pars sit octava circinationis tigni, tam magna spatia decidantur in longitudinem. … sic et in rotundatione et in longitudine aequalia spatia fient. … facient decusationes et in decusationibus finita puncta.",
    english:
      "Make the intervals along the length as large as an eighth of the timber’s circumference. … Thus the spaces around it and along it will be equal. … They will form crossings, and at those crossings fixed points.",
    words: [
      [
        "octava",
        "‘An eighth’: it qualifies pars, the circumferential part used as the axial interval.",
      ],
      ["aequalia spatia", "Equal intervals. The unrolled source grid therefore has square cells."],
      [
        "decusationes",
        "Crossings or intersections. They supply points through which the flexible strips are laid.",
      ],
    ],
    note: "The grid remains the source’s grid when you alter the pitch. A steeper or shallower diagonal then ceases to follow successive square-grid crossings.",
  },
  {
    title: "A flexible strip, sealed with pitch",
    ref: "X.6.2 · pp. 237–238",
    page: "237",
    latin:
      "sumitur salignea tenuis aut de vitice secta regula, quae uncta liquida pice figitur in primo decusis puncto. deinde traicitur oblique ad insequentis longitudinis et circumitionis decusis",
    english:
      "Take a thin willow strip, or one cut from chaste tree, smear it with liquid pitch and fasten it at the first crossing. Then carry it obliquely to the next crossing along the length and around the circumference.",
    words: [
      [
        "regula",
        "Here a slender wooden strip. Translating every occurrence as a rigid ‘ruler’ would hide how it bends around the shaft.",
      ],
      [
        "pice",
        "Ablative of pix: sealing pitch or resin. This Latin word does not name the geometrical pitch P; that is our modern English term.",
      ],
      ["oblique", "Obliquely, across the grid rather than along either family of grid lines."],
    ],
    note: "The excerpt crosses the page break. The whole pages retain Krohn’s apparatus, including variant readings of the crossing instruction.",
  },
  {
    title: "Return to the starting line",
    ref: "X.6.2 · p. 238",
    page: "238",
    latin:
      "et ita pervenit et figitur ad eam lineam recedens a primo in octavum punctum, in qua prima pars est eius fixa.",
    english:
      "And so it reaches and is fastened to that line, passing from the first to the eighth point, on which its first part was fixed.",
    words: [
      [
        "ad eam lineam … in qua",
        "‘To that line … on which’: the return is to the same circumferential generator, farther along the shaft.",
      ],
      [
        "a primo in octavum",
        "‘From the first to the eighth’. The counting is compressed; compare the following sentences and the complete page.",
      ],
      ["fixa", "‘Fastened’: feminine because it describes pars, the first part of the strip."],
    ],
    note: "The conventional geometric reading used here takes eight equal diagonal advances to complete a turn: P = shaft circumference. This explicit model interpretation does not settle every textual or construction detail.",
  },
  {
    title: "Eight channels, a snail’s imitation",
    ref: "X.6.2 · p. 238",
    page: "238",
    latin:
      "eadem ratione per omne spatium longitudinis et rotunditatis singulis decusationibus oblique fixae regulae per octo crassitudinis divisiones involutos faciunt canales et iustam cocleae naturalemque imitationem.",
    english:
      "In the same way, strips fixed obliquely at the crossings throughout the length and circumference make winding channels through the eight divisions of the thickness: a proper, natural imitation of a snail.",
    words: [
      [
        "canales",
        "Channels: the spaces bounded by adjacent blades. The model uses eight helical blades to form eight channels.",
      ],
      [
        "involutos",
        "Wound or coiled; it describes canales, not eight complete turns in one pitch.",
      ],
      [
        "imitationem",
        "An imitation or likeness. The snail is a naming and shape analogy, not a mathematical specification of a biological shell.",
      ],
    ],
    note: "One blade advances by P per revolution. Adjacent blade starts are separated axially by P/8. Changing the number of starts below is a modern comparison.",
  },
  {
    title: "Stack up to a total diameter",
    ref: "X.6.3 · p. 238",
    page: "238",
    latin:
      "ita per id vestigium aliae super alias figuntur unctae pice liquida, et exaggerantur ad id, uti longitudinis octava pars fiat summa crassitudo.",
    english:
      "Along that trace, further strips are fixed one upon another, smeared with liquid pitch, and built up until the total thickness becomes an eighth of the length.",
    words: [
      [
        "aliae super alias",
        "‘Others upon others’: further strips follow the same helical trace to build up the blade.",
      ],
      [
        "exaggerantur",
        "They are heaped or built up. It does not specify a modern blade’s metal thickness.",
      ],
      [
        "summa crassitudo",
        "The total thickness, interpreted here as the finished outside diameter, length / 8.",
      ],
    ],
    note: "The source setting consequently has inner radius / outer radius = 1/2. The twelfths experiment changes that ratio to 2/3 while retaining the specified outside diameter.",
  },
  {
    title: "The casing turns with the blades",
    ref: "X.6.3 · p. 238",
    page: "238",
    latin:
      "supra eas circumdantur et figuntur tabulae, quae pertegant eam involutionem. tunc eae tabulae pice saturantur et lamminis ferreis configantur, ut ab aquae vi ne dissolvantur.",
    english:
      "Boards are placed and fastened around them to cover the coiling structure. Then the boards are saturated with pitch and secured with iron plates so that the force of the water does not loosen them.",
    words: [
      [
        "tabulae",
        "Boards: the enclosing outer cylinder. It belongs to the rotating assembly in this reconstruction.",
      ],
      ["lamminis ferreis", "‘With iron plates’: an ablative phrase naming the fastenings."],
      ["ne dissolvantur", "‘So that they are not loosened’: a negative purpose clause."],
    ],
    note: "The drawing makes this casing transparent so the channels remain visible. It is not a claim that the ancient machine was open on top. This model differs from a screw rotating inside a stationary trough.",
  },
  {
    title: "People turn it by treading",
    ref: "X.6.3 · p. 238",
    page: "238",
    latin: "et ita cocleae hominibus calcantibus faciunt versationes.",
    english: "And in this way the screws make their rotations as people tread.",
    words: [
      [
        "hominibus calcantibus",
        "An ablative absolute: ‘with people treading’. Calcantibus is a present participle.",
      ],
      [
        "versationes",
        "Turnings or rotations. One revolution is the operational unit of our volume calculation.",
      ],
      [
        "cocleae",
        "Here nominative plural: the screws are the subject. In the opening passage cocleae was genitive singular.",
      ],
    ],
    note: "The sentence does not give a rotation rate, torque or human power. The workshop’s timed animation is a slow teaching motion, not a historical speed estimate.",
  },
  {
    title: "The 3–4–5 right triangle",
    ref: "X.6.4 · p. 238",
    page: "238",
    latin:
      "erectio autem eius ad inclinationem sic erit conlocanda, uti, quemadmodum Pythagoricum trigonum orthogonium describitur, sic id habeat responsum, id est uti dividatur longitudo in partes v, earum trium extollatur caput cocleae; ita erit ab perpendiculo ad imas naris spatium earum partium iiii.",
    english:
      "Set its elevation and inclination in the proportions of the Pythagorean right triangle: divide the length into five parts and raise the head of the screw by three of them; the distance from the perpendicular to the lower openings will then be four of those parts.",
    words: [
      [
        "trigonum orthogonium",
        "Latinized Greek words for a right triangle. Their Greek origin does not make this a surviving Greek passage.",
      ],
      [
        "trium / iiii",
        "Three of the five parts rise vertically; four run horizontally. Thus sin α = 3/5 and tan α = 3/4.",
      ],
      [
        "naris",
        "Accusative plural here: openings, literally ‘nostrils’. The lower inlet is meant.",
      ],
    ],
    note: "At this slope and the source pitch, λ = tan(α)P/(2πR) = 3/8. Modern integration gives about 17.03% of a pitch-length outside cylinder occupied by water; this is not an efficiency percentage.",
  },
];

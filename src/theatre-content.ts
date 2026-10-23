import type { TheatreKind, TheatrePart } from "./core/theatre";

export const THEATRE_LATIN = "https://archive.org/details/vitruviidearchit00vitr_1";
export const THEATRE_LIMITS =
  "This is a geometric reading of Vitruvius’s ideal plans, not a measured Greek or Roman theatre. Metres are a chosen modern scale. The outer seating band and stage side edges are illustrative. Areas omit seats, stairs, altars and passages; they establish no audience capacity or acoustic performance.";
export const theatreSources = [
  {
    file: "krohn-106.jpg",
    title: "Start the Roman plan",
    label: "Latin · 106",
    note: "Krohn (1912), printed p. 106. The last two lines begin V.6.1; the circle instruction continues on p. 107.",
    url: `${THEATRE_LATIN}/page/n123/mode/1up`,
    focus: 0.74,
  },
  {
    file: "krohn-107.jpg",
    title: "Four triangles, seven stair directions",
    label: "Latin · 107",
    note: "V.6.1–3. The upper lines preserve two editorial supplements in angle brackets. The text assigns seven vertices to the seating and the other five to the stage arrangement.",
    url: `${THEATRE_LATIN}/page/n124/mode/1up`,
    focus: 0.05,
  },
  {
    file: "krohn-108.jpg",
    title: "Proportion has limits",
    label: "Latin · 108",
    note: "V.6.6–7. Near the bottom, Vitruvius asks the architect to distinguish required proportions from adjustments to site and scale. The discussion continues on p. 109.",
    url: `${THEATRE_LATIN}/page/n125/mode/1up`,
    focus: 0.48,
  },
  {
    file: "krohn-109.jpg",
    title: "Begin the Greek construction",
    label: "Latin · 109",
    note: "V.7.1 begins at the foot of the main text. Three squares replace the Roman triangles. This instruction continues on p. 110.",
    url: `${THEATRE_LATIN}/page/n126/mode/1up`,
    focus: 0.65,
  },
  {
    file: "krohn-110.jpg",
    title: "Three centres and a narrower stage",
    label: "Latin · 110",
    note: "V.7.1–2. Inspect the main text and apparatus: Krohn prints ‘sinistram’ for the left side in line 9, while his apparatus records ‘dextram’ in the tradition. The model follows this edition’s printed reading.",
    url: `${THEATRE_LATIN}/page/n127/mode/1up`,
    focus: 0.02,
  },
  {
    file: "leake-greek-orchestra.jpg",
    title: "Leake’s Greek orchestra, 1824",
    label: "Greek diagram · 1824",
    note: "W. M. Leake, Journal of a Tour in Asia Minor (1824), p. 324. H, I and K are the three centres; A–C is the stage front, F–G the scene. This later interpretation of the text is not an excavated ground plan.",
    url: "https://www.gutenberg.org/cache/epub/78967/pg78967-images.html#illus08",
    focus: 0,
  },
  {
    file: "morgan-roman-plan.jpg",
    title: "The Roman plan in Morgan, 1914",
    label: "Roman diagram · 1914",
    note: "Vitruvius: The Ten Books on Architecture, translated by M. H. Morgan (1914), p. 147. Illustrations prepared under H. L. Warren. The dotted triangles guide the stairs and stage. Walls and colonnades belong to this later interpretation.",
    url: "https://www.gutenberg.org/files/20239/20239-h/20239-h.htm#Page_147",
    focus: 0,
  },
] as const;

export const theatrePassages = [
  {
    title: "Begin with a circle",
    ref: "V.6.1 · pp. 106–107",
    source: 0,
    latin:
      "Ipsius autem theatri conformatio sic est facienda, uti, quam magna futura est perimetros imi, centro medio conlocato circumagatur linea rotundationis, in eaque quattuor scribantur trigona paribus lateribus, ⟨quae paribus⟩ intervallis extremam lineam circinationis tangant.",
    english:
      "The theatre itself is to be laid out as follows: according to the intended perimeter at the bottom, set a centre in the middle and draw a circular line. Inscribe in it four triangles with equal sides, which touch the outer circular line at equal intervals.",
    word: "centro medio conlocato",
    gloss: "with the centre placed in the middle",
    grammar:
      "An ablative absolute: centro and conlocato agree in case. The placement is completed before circumagatur, ‘let it be drawn around’. The angle-bracketed words in the Latin are Krohn’s editorial supplement, not an unmarked addition by this workshop.",
  },
  {
    title: "Two parallel lines make the Roman stage",
    ref: "V.6.1 · p. 107",
    source: 1,
    latin:
      "ex his trigonis cuius latus fuerit proximum scaenae, ea regione, qua praecidit curvaturam circinationis, ibi finiatur scaenae frons, et ab eo loco per centrum parallelos linea ducatur, quae disiungat proscaenii pulpitum et orchestrae regionem.",
    english:
      "Of these triangles, take the one whose side is nearest the scene. Where it cuts the circular curve, let the front of the scene be set. From that position, draw a parallel line through the centre to separate the stage platform from the area of the orchestra.",
    word: "per centrum",
    gloss: "through the centre",
    grammar:
      "Per takes the accusative. It locates the second line precisely: the diameter, not the triangle’s side, separates the Roman platform from the orchestra. Parallelos is a Greek borrowing used with linea.",
  },
  {
    title: "The orchestra changes its use",
    ref: "V.6.2 · p. 107",
    source: 1,
    latin:
      "ita latius factum fuerit pulpitum quam Graecorum, quod omnes artifices in scaena dant operam, in orchestra autem senatorum sunt sedibus loca designata. et eius pulpiti altitudo sit ne plus pedum quinque, uti, qui in orchestra sederint, spectare possint omnium agentium gestus.",
    english:
      "The platform will thus be made broader than that of the Greeks, because all the performers work on the stage, while places in the orchestra are assigned to senators’ seats. Let the platform’s height be no more than five feet, so that those seated in the orchestra can see the movements of all the performers.",
    word: "ne plus pedum quinque",
    gloss: "no more than five feet",
    grammar:
      "This is a height limit, independent of the plan’s circle diameter. The experiment keeps the source’s feet in the reading; it does not silently convert them into the modern metre scale chosen for the plan.",
  },
  {
    title: "Seven vertices for stairs; five for the scene",
    ref: "V.6.2–3 · p. 107",
    source: 1,
    latin:
      "cunei spectaculorum in theatro ita dividantur, uti anguli trigonorum, qui currunt circum curvaturam circinationis, dirigant ascensus scalasque inter cuneos ad primam praecinctionem; supra autem alternis itineribus superiores cunei medii dirigantur. i autem, qui sunt in imo et dirigunt scalaria, erunt numero VII; reliqui quinque scaenae designabunt compositionem.",
    english:
      "Divide the wedges of seating so that the triangle vertices around the curve direct the ascents and stairs between the wedges up to the first cross-aisle. Above it, arrange the upper wedges midway, with alternating passages. The vertices at the bottom that direct the stairs will be seven in number; the remaining five will determine the arrangement of the scene.",
    word: "reliqui quinque",
    gloss: "the remaining five",
    grammar:
      "Reliqui agrees with the understood anguli, ‘vertices’. Twelve construction points do not mean twelve lower stairways. The seven include the two ends of the semicircle; between them lie six angular intervals.",
  },
  {
    title: "Replace the triangles with squares",
    ref: "V.7.1 · pp. 109–110",
    source: 3,
    latin:
      "In Graecorum theatris non omnia isdem rationibus sunt facienda, quod primum in ima circinatione, ut in latino trigonorum IIII, in eo quadratorum trium anguli circinationis lineam tangunt, et cuius quadrati latus est proximum scaenae praeciditque curvaturam circinationis, ea regione designatur finitio proscaenii.",
    english:
      "In Greek theatres not everything is to be done by the same rules. First, in the lowest circle, where the Latin theatre has four triangles, the vertices of three squares touch the circular line. Where the side of the square nearest the scene cuts the circular curve, the boundary of the proscenium is marked.",
    word: "quadratorum trium anguli",
    gloss: "the vertices of three squares",
    grammar:
      "Quadratorum trium is genitive plural: ‘of three squares’. Anguli is the subject of tangunt, ‘touch’. The square side locates the stage’s front here; the corresponding Roman triangle side located the scene behind the stage.",
  },
  {
    title: "Set the scene at a tangent",
    ref: "V.7.1 · p. 110",
    source: 4,
    latin:
      "et ab ea regione ad extremam circinationem curvaturae parallelos linea designatur, in qua constituitur frons scaenae.",
    english:
      "From that position, mark a parallel line at the outermost curve of the circle; on it the front of the scene is placed.",
    word: "in qua",
    gloss: "on which",
    grammar:
      "The relative pronoun refers to linea. In the adopted plan, this is the tangent behind the square’s side. Measure between these two parallel lines to obtain the Greek stage’s front-to-back depth.",
  },
  {
    title: "Move the compass to the ends of the diameter",
    ref: "V.7.1 · p. 110",
    source: 4,
    latin:
      "per centrumque orchestrae proscaenii regioni parallelos linea describitur, et qua secat circinationis lineas dextra ac sinistra, in cornibus hemicycli centra signantur. et circino conlocato in dextra ab intervallo sinistro circumagitur circinatio ad proscaenii sinistram partem; item centro conlocato in sinistro cornu ab intervallo dextro circumagitur ad proscaenii dextram partem.",
    english:
      "Draw through the orchestra’s centre a line parallel to the proscenium. Where it cuts the circle on the right and left, mark centres at the ends of the semicircle. With the compass set on the right, sweep from the distance to the left across to the left side of the proscenium. Then, with the centre at the left end, sweep from the distance to the right across to the right side of the proscenium.",
    word: "circino conlocato in dextra",
    gloss: "with the compass set on the right",
    grammar:
      "Another ablative absolute. The right centre draws the left extension: the compass reaches across the full diameter, so its radius is 2R. Krohn’s apparatus records a different transmitted side word; this construction follows his printed main text.",
  },
  {
    title: "More orchestra, less stage depth",
    ref: "V.7.2 · p. 110",
    source: 4,
    latin:
      "ita tribus centris hac descriptione ampliorem habent orchestram Graeci et scaenam recessiorem minoreque latitudine pulpitum, quod λογεῖον appellant, ideo quod ⟨apud⟩ eos tragici et comici actores in scaena peragunt, reliqui autem artifices suas per orchestram praestant actiones; itaque ex eo scaenici et thymelici graece separatim nominantur.",
    english:
      "Thus, through this construction from three centres, the Greeks have a roomier orchestra, a scene set farther back, and a narrower platform, which they call the logeion. Among them, tragic and comic actors perform on the stage, while the other performers carry out their actions throughout the orchestra; hence their separate Greek names, scenic and thymelic performers.",
    word: "tribus centris",
    gloss: "from three centres",
    grammar:
      "An ablative describing the means of the construction. Ampliorem and recessiorem are comparatives: ‘more spacious’ and ‘farther back’. Here ‘narrower’ concerns the platform’s depth between the parallel lines, not its whole left-to-right span.",
  },
  {
    title: "Height and stair directions remain distinct",
    ref: "V.7.2 · p. 110",
    source: 4,
    latin:
      "eius logei altitudo non minus debet esse pedum X, non plus duodecim. gradationes scalarum inter cuneos et sedes contra quadratorum angulos dirigantur ad primam praecinctionem, a praecinctione inter eas iterum mediae dirigantur, et ad summam quotiens praecinguntur, altero tanto semper amplificantur.",
    english:
      "The logeion’s height must be not less than ten feet and not more than twelve. Direct the stairs between the wedges and seats toward the square vertices up to the first cross-aisle. Beyond it, direct further stairs midway between them; toward the top, at each cross-aisle, their number is increased again by as much.",
    word: "non minus … non plus",
    gloss: "not less … not more",
    grammar:
      "The pair sets an inclusive height interval. These feet belong to the vertical specification. A plan alone cannot show that the Greek platform is also higher than the Roman limit of five feet.",
  },
  {
    title: "Use can require a change in proportion",
    ref: "V.6.7 · p. 108",
    source: 2,
    latin:
      "Nec tamen in omnibus theatris symmetriae ad omnes rationes et effectus possunt respondere, sed oportet architectum animadvertere, quibus proportionibus necesse sit sequi symmetriam et quibus ad loci naturam aut magnitudinem operis temperari.",
    english:
      "Yet in every theatre the proportions cannot meet every requirement and practical result. The architect must distinguish the proportions that must follow the scheme from those that must be adjusted to the nature of the site or the scale of the work.",
    word: "ad loci naturam",
    gloss: "to the nature of the site",
    grammar:
      "Loci is the genitive of locus, ‘place’. The surrounding discussion names features that need usable dimensions in both small and large theatres. A proportional construction is not a universal survey of ancient buildings.",
  },
] as const;

export const theatreParts: Record<
  TheatrePart,
  { title: string; greek: string; latin: string; note: string; headword: string }
> = {
  orchestra: {
    title: "Orchestra",
    greek: "ὀρχήστρα",
    latin: "orchestra",
    note: "The space in front of the stage. Vitruvius assigns Roman senators seats here, but describes other performers using it in the Greek scheme. The same word does not guarantee the same use.",
    headword: "ὀρχήστρα",
  },
  stage: {
    title: "Stage platform",
    greek: "λογεῖον",
    latin: "pulpitum",
    note: "Vitruvius explicitly gives logeion as the Greek name. Here the measured dimension is front-to-back depth. The scene behind it, scaena / σκηνή, is a different part.",
    headword: "λογεῖον",
  },
  stairs: {
    title: "Stair directions",
    greek: "κλίμαξ",
    latin: "scalae · ascensus",
    note: "A Greek headword for a ladder or stair, alongside Vitruvius’s Latin terms. The polygon vertices guide directions; the drawing does not count every stair or row in a real theatre.",
    headword: "κλίμαξ",
  },
  construction: {
    title: "The construction circle",
    greek: "κύκλος",
    latin: "circinatio · circinus",
    note: "Circle and compass are related but distinct: circinatio names the circular tracing, circinus the tool. The Greek extension moves the compass from O to the ends of the diameter.",
    headword: "κύκλος",
  },
};
export const theatreSteps: Record<TheatreKind, { title: string; note: string; passage: number }[]> =
  {
    greek: [
      {
        title: "Set the initial circle",
        note: "O is its centre. This modern metre scale is chosen for comparison; the ancient instruction begins with a perimeter, not a universal diameter.",
        passage: 4,
      },
      {
        title: "Inscribe three squares",
        note: "Each square uses every third point. The twelve points are equally spaced, but offset by 15° from the Roman arrangement. Highlight a square to follow its four sides.",
        passage: 4,
      },
      {
        title: "Separate platform and scene",
        note: "The nearest square side sets the stage front. A parallel tangent sets the scene behind it. The depth is R − R/√2.",
        passage: 5,
      },
      {
        title: "Use the other two centres",
        note: "The compass on the right reaches the left end of the diameter: radius 2R. Sweep the left extension, then reverse the operation. A single circle misses these side strips.",
        passage: 6,
      },
      {
        title: "Read the completed scheme",
        note: "The orchestra gains room while the platform has less depth. The seating band only illustrates the stair directions; its extent and rows are not prescribed here.",
        passage: 7,
      },
    ],
    roman: [
      {
        title: "Set the initial circle",
        note: "Place O in the middle of the intended lowest perimeter. Changing the chosen diameter scales every length; it does not change the proportions.",
        passage: 0,
      },
      {
        title: "Inscribe four triangles",
        note: "Each equilateral triangle uses every fourth point. Four triangles give twelve distinct equally spaced vertices. Select one to trace its three sides.",
        passage: 0,
      },
      {
        title: "Draw the two parallel lines",
        note: "The nearest triangle side fixes the scene front. A parallel through O separates the platform from the orchestra: its depth is R/2.",
        passage: 1,
      },
      {
        title: "Keep the semicircular orchestra",
        note: "The stage starts at the diameter. Vitruvius assigns the Roman orchestra to senators’ seats; no three-centre extension is added in this scheme.",
        passage: 2,
      },
      {
        title: "Give seven vertices to the stairs",
        note: "Seven vertices around the semicircle guide the lower stairs. The other five concern the scene: the royal door, guest doors and side approaches.",
        passage: 3,
      },
    ],
  };

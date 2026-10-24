export const HOIST_SOURCE =
  "https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf";
export const HOIST_LIMITS =
  "An ideal, quasi-static model with a massless inextensible rope, frictionless wheels and parallel vertical portions. The stated weight includes the load and moving hardware. Frame geometry, strength, friction, acceleration, rope layers on the drum and operator capacity are outside the model. The dimensions, newtons and metres are modern teaching choices, not measured ancient equipment.";
export const hoistSources = [
  { key: "title", pdf: 5, title: "Title and 1912 imprint" },
  { key: "226", pdf: 244, title: "X.2.1 begins; the upper wheels" },
  { key: "227", pdf: 245, title: "Rope route, tied end, windlass and names" },
  { key: "232", pdf: 250, title: "X.3.1–2; straight and circular motion" },
  { key: "233", pdf: 251, title: "X.3.3; the longer lever arm" },
];
export type HoistWord = { form: string; gloss: string; note: string; greek?: boolean };
export const hoistPassages: {
  title: string;
  ref: string;
  page: string;
  latin: string;
  english: string;
  note: string;
  words: HoistWord[];
}[] = [
  {
    title: "Two wheels in the upper block",
    ref: "X.2.1, pp.226–227",
    page: "226",
    latin: "in trocleam induntur orbiculi ⟨II⟩ per axiculos versationes habentes.",
    english: "Into the pulley block are set ⟨two⟩ wheels, able to turn on their small axles.",
    note: "Krohn supplies II in angle brackets; the apparatus attributes the addition to Joc. The sentence crosses the printed page boundary. Read the next page as well. This is an edited witness, not a surviving ancient blueprint.",
    words: [
      {
        form: "in trocleam",
        gloss: "into the pulley block",
        note: "In with an accusative indicates placement into it. Troclea is the containing block here; orbiculi are its rotating wheels.",
      },
      {
        form: "orbiculi",
        gloss: "small wheels / sheaves",
        note: "Nominative plural, the subject of passive induntur. A wheel count alone does not state how many rope portions support a moving load.",
      },
      {
        form: "per axiculos",
        gloss: "on / by means of small axles",
        note: "Per with the accusative describes the means of rotation. Axiculus is a diminutive of axis.",
      },
      {
        form: "versationes habentes",
        gloss: "having rotations",
        note: "Habentes agrees with orbiculi; the wheels are able to turn.",
      },
    ],
  },
  {
    title: "Follow the rope to its tied end",
    ref: "X.2.1, p.227",
    page: "227",
    latin:
      "per orbiculum ⟨summum⟩ traicitur ductarius funis, deinde demittitur et traducitur circa orbiculum trocleae inferioris, refertur autem ad orbiculum imum trocleae superioris et ita descendit ad inferiorem et in foramine eius religatur.",
    english:
      "The hauling rope is passed over the ⟨uppermost⟩ wheel; then it is let down and led around the wheel of the lower block. It is brought back to the lowest wheel of the upper block, then descends to the lower block and is tied in its opening.",
    note: "Summum is an editorial addition attributed to Joc. The decisive attachment is religatur: the end is tied to the lower block. The diagram spreads the upper wheels sideways to make the route legible; it does not reproduce their described vertical arrangement.",
    words: [
      {
        form: "ductarius funis",
        gloss: "hauling rope",
        note: "Funis is nominative singular, the subject of the passive verbs that follow the rope's route. Ductarius describes its hauling use.",
      },
      {
        form: "trocleae inferioris",
        gloss: "of the lower block",
        note: "Two genitives modify orbiculum. Inferioris contrasts with superioris, the upper block.",
      },
      {
        form: "imum",
        gloss: "lowest",
        note: "Accusative masculine singular agrees with orbiculum. The text locates wheels within the upper block; our unrolled diagram separates them horizontally.",
      },
      {
        form: "refertur",
        gloss: "is brought back",
        note: "Present passive of refero. Keep following the same rope, rather than imagining another independently pulled line.",
      },
      {
        form: "in foramine eius",
        gloss: "in its opening",
        note: "In with the ablative locates the tie. Eius refers to the lower block just mentioned.",
      },
      {
        form: "religatur",
        gloss: "is tied / fastened",
        note: "Present passive of religo. This attachment moves with the lower assembly and supplies one of its upward tensions.",
      },
    ],
  },
  {
    title: "Wind the hauling end",
    ref: "X.2.1–2, p.227",
    page: "227",
    latin:
      "altera pars funis refertur inter imas machinae partes. … cum autem funis habet caput ad suculam religatum et vectes ducentes eam versant, funis ⟨se⟩ involvendo circum suculam extenditur et ita sublevat onera ad altitudinem et operum conlocationes.",
    english:
      "The other part of the rope is brought between the machine's lowest parts. … When the rope has its end fastened to the windlass, and the bars that drive it turn it, the rope, by winding ⟨itself⟩ around the windlass, is pulled taut and so raises loads to the height and positions required by the works.",
    note: "The ellipsis omits the intervening description of the windlass mounting and stone grips. Krohn adds se. The circular detail shows a chosen constant-radius drum and perpendicular hand force; these dimensions and the numerical force law are modern analysis.",
    words: [
      {
        form: "altera pars",
        gloss: "the other part",
        note: "Altera distinguishes the hauling side from the end already fastened to the moving block.",
      },
      {
        form: "ad suculam religatum",
        gloss: "fastened to the windlass",
        note: "Religatum agrees with caput, the rope's end. Do not confuse this second fastening with the tie to the lower block.",
      },
      {
        form: "vectes",
        gloss: "bars / levers",
        note: "Nominative plural, the subject of versant. Eam refers to the windlass they turn.",
      },
      {
        form: "involvendo",
        gloss: "by winding",
        note: "Ablative gerund gives the means. Circum with the accusative suculam says what the rope winds around.",
      },
      {
        form: "onera",
        gloss: "loads",
        note: "Accusative plural of onus, the object of sublevat. The model's weight is a force in newtons, not a Roman unit of mass.",
      },
    ],
  },
  {
    title: "Three wheels; five wheels",
    ref: "X.2.3, p.227",
    page: "227",
    latin:
      "haec autem ratio machinationis, quod per tres orbiculos circumvolvitur, trispastos appellatur. cum vero in ima troclea duo orbiculi, in superiore tres versantur, id pentaspaston dicitur.",
    english:
      "This arrangement of machinery, because the rope winds around three wheels, is called trispastos. When two wheels turn in the lower block and three in the upper, it is called pentaspaston.",
    note: "These names count wheels in the described arrangements. Our fixed-support tie is a modern alteration for comparison, not a second ancient prescription. A single fixed wheel is a modern control example.",
    words: [
      {
        form: "per tres orbiculos",
        gloss: "around / through three wheels",
        note: "Per with the accusative describes the rope's route. The following clause specifies how the five wheels are divided between the two blocks.",
      },
      {
        form: "in ima troclea",
        gloss: "in the lower block",
        note: "In with the ablative locates two wheels in the lower block. Three are in superiore, the upper one, with troclea understood.",
      },
      {
        form: "trispastos",
        gloss: "the named three-wheel arrangement",
        note: "A Greek technical name in the Latin text. The experiment retains Krohn's Latin spelling rather than presenting a back-translated Greek quotation.",
      },
      {
        form: "pentaspaston",
        gloss: "the named five-wheel arrangement",
        note: "Another Greek technical name as printed in Latin. In the source route the tied end adds a fifth supporting tension to the four provided by two moving wheels.",
      },
    ],
  },
  {
    title: "Straight and circular motion",
    ref: "X.3.1, p.232",
    page: "232",
    latin:
      "una porrecti, quam Graeci εὐθεῖαν vocitant, altera rotunditatis, quam Graeci κυκλωτήν appellant.",
    english:
      "One is straight extension, which the Greeks call eutheian; the other is circular motion, which the Greeks call kyklōtēn.",
    note: "This excerpt selects the two kinds of motion from the preceding sentence. Krohn prints the Greek forms; his apparatus attributes κυκλωτήν to Joc. and records Latin-letter manuscript variants. These are forms in this edition, not an independent Greek treatise.",
    words: [
      {
        form: "porrecti",
        gloss: "of straight extension",
        note: "A genitive form used for the straight kind of motion. This is contrasted with rotunditatis, circularity.",
      },
      {
        form: "εὐθεῖαν",
        gloss: "straight (form in the Latin text)",
        note: "Accusative feminine singular of εὐθύς, eutheian in transliteration. A noun is understood in the Greek expression. The form is quoted, not a label for an ancient numerical formula.",
        greek: true,
      },
      {
        form: "κυκλωτήν",
        gloss: "circular (edited form)",
        note: "Accusative feminine singular, kyklōtēn. Krohn's apparatus credits this Greek reading to Joc.; the Latin-letter witnesses differ. Compare the printed apparatus before treating the spelling as unproblematic.",
        greek: true,
      },
    ],
  },
  {
    title: "Rotation produces a straight lift",
    ref: "X.3.2, p.232",
    page: "232",
    latin:
      "inducuntur uti centra axiculi in orbiculos et in trocleis conlocantur, per quos orbiculos funis circumactus directis ductionibus et in sucula conlocatus vectium versationibus onerum facit egressus in altum.",
    english:
      "Small axles are inserted as centres into the wheels and placed in the pulley blocks. The rope, passed around these wheels with straight runs and set on the windlass, brings loads upward through the turning of the bars.",
    note: "The source links turning and straight hauling. In the model, rope wound onto the drum equals the shortening of the drawn rope route. Stored rope is reported as a length; the illustration does not model additional layers changing the drum radius.",
    words: [
      {
        form: "uti centra",
        gloss: "as centres",
        note: "Uti means 'as' here. The small axles occupy the wheels' centres of rotation.",
      },
      {
        form: "directis ductionibus",
        gloss: "with straight pulls / runs",
        note: "Ablative plural. It connects the rope's straight portions with the wheels' circular action.",
      },
      {
        form: "vectium versationibus",
        gloss: "by the turning of the bars",
        note: "Vectium is genitive plural of vectis; versationibus is ablative plural, expressing the means.",
      },
    ],
  },
  {
    title: "A longer arm changes the effort",
    ref: "X.3.2–3, pp.232–233",
    page: "233",
    latin:
      "quod Graeci ὑπομόχλιον appellant … id autem ⟨eo facilius fit⟩, quo brevior pars prior vectis ab ea pressione, quod est centrum, subit sub onus, et quo longius ab eo centro distans caput eius deducitur.",
    english:
      "What the Greeks call hypomochlion … this ⟨is done more easily⟩ the shorter the front part of the lever that goes beneath the load from the support, which is the centre, and the farther its end is brought down from that centre.",
    note: "The ellipsis joins the fulcrum name at the end of p.232 to the arm comparison on p.233; it does not imply adjacent words. Krohn supplies eo facilius fit. Applying the ideal lever law to a constant-radius windlass is our mathematical comparison, not a quoted ancient calculation.",
    words: [
      {
        form: "ὑπομόχλιον",
        gloss: "fulcrum / support",
        note: "Hypomochlion, a neuter Greek noun quoted in the Latin sentence. On p.233 it appears again in Latin letters after supra. The windlass's axle is the centre in our circular comparison.",
        greek: true,
      },
      {
        form: "brevior",
        gloss: "shorter",
        note: "Comparative agrees with pars, the part of the lever on the load side.",
      },
      {
        form: "quo … et quo",
        gloss: "the more … and the more",
        note: "The paired comparative clauses describe shortening the load arm and increasing the effort arm. They do not give the displayed modern metre values.",
      },
    ],
  },
];

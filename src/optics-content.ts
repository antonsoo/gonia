export interface OpticsWord {
  word: string;
  gloss: string;
  note: string;
  target: "eye" | "face" | "upper" | "lower" | "image" | "source";
  greek?: string;
  lexicon?: string;
}
export interface OpticsPassage {
  title: string;
  ref: string;
  page: 73 | 74;
  lines: string;
  latin: string;
  english: string;
  note: string;
  words: OpticsWord[];
}
export const opticsPassages: OpticsPassage[] = [
  {
    title: "Above the capitals",
    ref: "III.5.13",
    page: 74,
    lines: "11–13",
    latin:
      "Membra omnia, quae supra capitula columnarum sunt futura, id est epistylia, zophora, coronae, tympana, fastigia, acroteria",
    english:
      "All the members which are to be above the capitals of the columns: architraves, friezes, cornices, pediment panels, gables and roof ornaments.",
    note: "This is a list of upper members. The experiment isolates one chosen flat face. It does not reconstruct a whole temple or infer the geometry of every object in the list.",
    words: [
      {
        word: "supra capitula",
        gloss: "above the capitals",
        note: "Supra takes the accusative. Capitula is the neuter plural of capitulum. The photograph below locates an actual Ionic capital; the upper building is absent from that museum display.",
        target: "source",
      },
      {
        word: "epistylia",
        gloss: "architraves",
        greek: "ἐπιστύλιον",
        lexicon:
          "https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Ashort-def-34769/",
        note: "A Latin neuter plural borrowed from Greek. The Greek headword names the beam over columns. The Greek form is a companion word for learning, not a Greek original of this Latin passage.",
        target: "face",
      },
      {
        word: "acroteria",
        gloss: "roof ornaments",
        note: "Another neuter plural in the list. Acroteria belong at a roof's summit or corners. The same inclination instruction follows the entire list, without giving a separate observer position for each member.",
        target: "face",
      },
    ],
  },
  {
    title: "A twelfth part",
    ref: "III.5.13",
    page: 74,
    lines: "13–14",
    latin: "inclinanda sunt in fronte suae cuiusque altitudinis parte XII",
    english: "They must be inclined to the front by a twelfth part of each one's own height.",
    note: "The model interprets this as forward offset divided by vertical rise = 1/12. Its angle is arctan(1/12), about 4.764°. Absolute dimensions and the location of the eye are modern choices.",
    words: [
      {
        word: "inclinanda sunt",
        gloss: "must be inclined",
        note: "The gerundive with sunt expresses an instruction. Inclinanda agrees with the plural membra. The text prescribes a treatment; it does not report a measured tilt for the Sardis object.",
        target: "face",
      },
      {
        word: "suae cuiusque altitudinis",
        gloss: "of each one's own height",
        note: "The genitive phrase identifies the height whose fraction is taken. The model preserves a chosen face edge length while rotating around its centre, so both its vertical rise and its forward offset are shown explicitly.",
        target: "face",
      },
      {
        word: "parte XII",
        gloss: "by a twelfth part",
        note: "An ablative of measure. XII is twelve; the phrase gives one twelfth of the height. The degree readout is our conversion of that ratio.",
        target: "face",
      },
    ],
  },
  {
    title: "Two rays from the eye",
    ref: "III.5.13",
    page: 74,
    lines: "14–16",
    latin:
      "ideo quod, cum steterimus contra frontes, ab oculo lineae duae si extensae fuerint et una tetigerit imam operis partem, altera summam, quae summam tetigerit, longior fiet",
    english:
      "For this reason: when we stand facing the fronts, if two lines are extended from the eye, one touching the work's lowest part and the other its highest, the one touching the highest will be longer.",
    note: "The sentence introduces the author's explanation. In this experiment the endpoints belong to one chosen member. Change the observer and measure both Euclidean ray lengths; the text supplies no viewing distance.",
    words: [
      {
        word: "ab oculo",
        gloss: "from the eye",
        note: "Ab takes the ablative oculo. The eye is the origin of both drawn rays. Its selected height is in modern metres, not a recovered ancient observer height.",
        target: "eye",
      },
      {
        word: "una … altera",
        gloss: "one … the other",
        note: "The paired feminine forms refer to the two lineae. In the diagram, the upper ray is solid vermilion and the lower ray is dashed green; the distinction does not depend on colour alone.",
        target: "lower",
      },
      {
        word: "longior fiet",
        gloss: "will become longer",
        note: "Longior is the comparative agreeing with the line. Fiet is the future of fio. The readout compares the unrounded lengths, including cases where the upper ray becomes shorter after a chosen forward tilt.",
        target: "upper",
      },
    ],
  },
  {
    title: "An appearance of leaning back",
    ref: "III.5.13",
    page: 74,
    lines: "17–18",
    latin:
      "ita quo longior visus linea in superiorem partem procedit, resupinatam facit eius speciem",
    english:
      "Thus, as the line of sight extends farther to the upper part, it makes that part's appearance seem to lean backward.",
    note: "This is a claim about appearance. Our pinhole diagram measures projected spacing and a face-normal angle. Those geometric quantities do not establish what an ancient observer actually perceived.",
    words: [
      {
        word: "visus linea",
        gloss: "line of sight",
        note: "Visus is genitive here: a line of vision. The camera comparison aims along the line from the chosen eye to the face's centre C. Both physical rays and that aiming line stay visible.",
        target: "eye",
      },
      {
        word: "resupinatam",
        gloss: "leaning backward",
        note: "The participle describes speciem, the appearance. It is not a statement that the drawn stone has physically rotated backward. Compare the unchanged physical divisions with their projected spacing.",
        target: "image",
      },
      {
        word: "speciem",
        gloss: "appearance",
        note: "Species can concern how something presents itself to sight. The experiment labels its outputs as geometry rather than replacing this historical perceptual claim with a modern measurement.",
        target: "image",
      },
    ],
  },
  {
    title: "Plumb and square",
    ref: "III.5.13",
    page: 74,
    lines: "18–20",
    latin:
      "cum autem, uti supra scriptum est, in fronte inclinata fuerint, tunc in aspectu videbuntur esse ad perpendiculum et normam",
    english:
      "But when they have been inclined to the front, as written above, then in view they will seem to be plumb and square.",
    note: "Equal endpoint ray lengths are our deliberately chosen front-on criterion. A fixed 1:12 slope meets it at distance = 12 × (face-centre height minus eye height). That relation follows from this model, not from a viewing-distance rule stated by Vitruvius.",
    words: [
      {
        word: "videbuntur esse",
        gloss: "will seem to be",
        note: "The future passive of video with esse expresses how the members will appear. Keep that wording beside the model's more limited, numerical front-on criterion.",
        target: "image",
      },
      {
        word: "ad perpendiculum",
        gloss: "to a plumb line",
        greek: "κάθετος",
        lexicon:
          "https://vocab.perseus.org/word-list/urn%3Acts%3AgreekLit%3Atlg1799.tlg001.perseus-grc2%3A11.Prop.11/?o=3",
        note: "Perpendiculum is a plumb line. The Greek companion κάθετος can name a perpendicular or plumb line. A physical vertical, a face normal and a line of sight are three distinct directions in the drawing.",
        target: "face",
      },
      {
        word: "normam",
        gloss: "a builder's square",
        note: "Norma names the square or standard of rightness. In the modern comparison, a face points at the eye when its normal aligns with the aiming line. That does not turn the image into a psychological test.",
        target: "face",
      },
    ],
  },
  {
    title: "A reasoned adjustment",
    ref: "III.5.9",
    page: 73,
    lines: "3–4",
    latin: "quare semper adiciendum est rationis supplementum in symmetriarum membris",
    english: "Therefore a reasoned allowance must always be added in the proportioned members.",
    note: "The preceding passage discusses sight at height, including an ancient explanation involving the density of air. That theory is not used by the pinhole model. This short clause is context for the author's adjustments, not a numerical law for all buildings.",
    words: [
      {
        word: "adiciendum est",
        gloss: "must be added",
        note: "Another gerundive instruction, singular here with supplementum. Compare it with the plural inclinanda sunt in the later prescription.",
        target: "source",
      },
      {
        word: "rationis supplementum",
        gloss: "a reasoned allowance",
        note: "The wording calls for an adjustment. It does not supply this experiment's camera, eye height, face length or rotation centre. Those choices are retained with every exported study.",
        target: "source",
      },
      {
        word: "symmetriarum membris",
        gloss: "in the proportioned members",
        note: "The context is architectural proportion. The metre values are chosen examples; the 1:12 inclination is the specific source quantity explored here.",
        target: "source",
      },
    ],
  },
];
export const opticsSourcePages = [
  { key: "title", file: "sources/hoist/krohn-title.jpg", pdf: 5, label: "The 1912 title page" },
  {
    key: "72",
    file: "sources/optics/krohn-072.jpg",
    pdf: 90,
    label: "Sight at height: beginning of III.5.9",
  },
  {
    key: "73",
    file: "sources/optics/krohn-073.jpg",
    pdf: 91,
    label: "A reasoned allowance and upper-member proportions",
  },
  {
    key: "74",
    file: "sources/optics/krohn-074.jpg",
    pdf: 92,
    label: "The 1:12 inclination and its sight-line explanation",
  },
] as const;
export const OPTICS_LIMITS =
  "Vitruvius supplies the inclination ratio. Metres, observer position, face edge length, centre rotation and the pinhole camera are chosen modern conditions. Equal ray lengths define a geometric front-on comparison here; they do not measure an ancient viewer's perception, establish a particular temple's construction, or reconstruct the absent upper building at Sardis.";

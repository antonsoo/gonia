import manifest from "../public/sources/arch/manifest.json";

export const archPages = manifest.pages;
export const ae = (s: string | number): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
export const an = (n: number, p = 4): string => Number(n.toFixed(p)).toString();
export const archReadings = [
  {
    title: "An arch can relieve a wall's weight",
    latin:
      "item administrandum est, uti levent onus parietum fornicationes cuneorum divisionibus et ad centrum respondentes earum conclusurae.",
    english:
      "Care must also be taken that arches, with their divisions into wedges and their closures directed toward the centre, relieve the weight of the walls.",
    note: "uti levent states the intended result: ‘that they relieve’. onus is the object, ‘weight’; fornicationes is the subject, ‘arches’. ad centrum refers to radial construction, not to the modern blue force path. Krohn's apparatus records variant readings at cuneorum.",
  },
  {
    title: "The timber underneath can be replaced",
    latin:
      "cum enim extra trabes aut liminum capita arcus cuneis erunt conclusae, primum non pandabit materies levata onere; deinde, si quod vetustate vitium ceperit, sine molitione fulturarum faciliter mutabitur.",
    english:
      "For when arches have been closed with wedges above the beams or the ends of the lintels, first the timber, relieved of its load, will not sag; then, if it develops a defect through age, it will be easily replaced without constructing props.",
    note: "levata onere is ‘relieved of the load’. The passage describes a relieving arch over timber. Our isolated arch omits that timber and the wall above it; it is not a reconstruction of this arrangement. Krohn prints the unusual arcus … conclusae; the reading is retained.",
  },
  {
    title: "The outer piers need more breadth",
    latin:
      "itemque, quae pilatim aguntur aedificia et cuneorum divisionibus coagmentis ad centrum respondentibus fornices concluduntur, extremae pilae in his latiores spatio sunt faciundae, uti vires eae habentes resistere possint,",
    english:
      "Likewise, in buildings carried on piers, where arches are closed with wedge divisions and joints directed toward the centre, the outer piers must be made broader in extent, so that, having strength, they can resist,",
    note: "The sentence continues in the next reading. latiores is comparative, ‘broader’; sunt faciundae expresses an obligation, ‘must be made’. There is no numerical pier-width formula here. Our width and mass controls are modern independent choices.",
  },
  {
    title: "The loaded wedges can push the bearings out",
    latin:
      "cum cunei ab oneribus parietum pressi per coagmenta ad centrum se prementes extruderent incumbas.",
    english:
      "since the wedges, pressed by the loads of the walls and pressing against one another through the joints toward the centre, would push out the bearings.",
    note: "This completes the preceding sentence. pressi is passive, ‘pressed’; se prementes is active and reciprocal here, ‘pressing against one another’. extruderent is ‘would push out’. The Latin describes an effect; it does not supply our equilibrium equations or assumptions.",
  },
  {
    title: "Restraint belongs to the whole work",
    latin:
      "itaque si angulares pilae erunt spatiosis magnitudinibus, continendo cuneos firmitatem operibus praestabunt.",
    english:
      "And so, if the corner piers are of ample size, by restraining the wedges they will provide stability to the works.",
    note: "continendo is an ablative gerund, ‘by restraining’; cuneos is what is restrained. firmitatem is the object of praestabunt, ‘they will provide stability’. It is a claim about support, not a certificate for a particular surviving arch.",
  },
] as const;
export const archWords = [
  {
    word: "cuneus · cunei · cuneos",
    gloss: "wedge · wedges · wedges as object",
    note: "A wedge-shaped stone in this context. cunei is nominative plural in the pushing clause; cuneos is accusative plural after continendo in the final clause.",
    part: "stone",
  },
  {
    word: "coagmentum · coagmenta",
    gloss: "joint · joints",
    note: "The meeting of pieces. per coagmenta means ‘through the joints’. The model checks where a resultant crosses each radial joint; it does not model joint friction.",
    part: "joint",
  },
  {
    word: "centrum · ad centrum",
    gloss: "centre · toward the centre",
    note: "The common centre of the radial divisions. In a shallow circular arch this centre lies below the spring level. It is a geometric centre, not a centre of gravity.",
    part: "centre",
  },
  {
    word: "pila · pilae",
    gloss: "pier · piers",
    note: "A massive support here, rather than the word for a slender column, columna. extremae pilae are the outer piers; angulares pilae are the corner piers.",
    part: "pier",
  },
  {
    word: "onus · onera · oneribus",
    gloss: "weight or load · loads · by loads",
    note: "One word changes form with its job in the sentence. ab oneribus parietum is ‘by the loads of the walls’. We use W for the arch's own weight and label any extra load separately.",
    part: "load",
  },
  {
    word: "latiores",
    gloss: "broader",
    note: "Comparative adjective agreeing with pilae. The author asks for more breadth, but the passage gives no particular ratio. Base width and weight are kept separate on the bench.",
    part: "base",
  },
  {
    word: "incumbas",
    gloss: "bearings or supporting parts",
    note: "Accusative plural, the object of extruderent: the parts that would be thrust out. ‘Abutments’ is a useful architectural rendering, not a claim that the word specifies our support shape.",
    part: "pier",
  },
  {
    word: "firmitatem",
    gloss: "stability or strength",
    note: "Accusative singular of firmitas. The author says the piers provide it by restraining the wedges. Our much narrower result is equilibrium under explicit ideal assumptions.",
    part: "base",
  },
] as const;
export function archReadingHtml(buttons = true): string {
  return archReadings
    .map(
      (r, i) =>
        `<article class="ar-reading"><h3>${r.title}</h3><p class="ar-latin" lang="la">${r.latin}</p><div><p>${r.english}</p><p class="ar-note">${r.note}</p>${buttons ? `<button type="button" data-source="0">Read this on printed p. 141</button>${i === 2 ? ' <button type="button" data-widen>Try a broader pier base</button>' : ""}` : ""}</div></article>`,
    )
    .join("");
}
export function archWordHtml(): string {
  return `<dl>${archWords.map((w) => `<div><dt lang="la">${w.word}</dt><dd><strong>${w.gloss}</strong>. ${w.note}</dd></div>`).join("")}</dl>`;
}

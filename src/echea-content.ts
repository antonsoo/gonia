export const ECHEA_SOURCE = "https://archive.org/details/vitruviidearchit00vitr_1";
export const ECHEA_LIMITS =
  "The placement follows Vitruvius V.5.2 in Krohn’s edition. The semicircle is a schematic row, not a surveyed theatre. Frequencies, pure ratios, sine tones and damping are chosen modern realizations. Neither the drawing nor the single-mode experiment establishes ancient vessel shape, timbre, loudness or acoustic benefit.";
export const echeaSources = [
  {
    page: 102,
    path: "sources/echea/krohn-102.jpg",
    title: "Fixed and moving notes",
    note: "V.4.3–5. The fixed-note list begins at the bottom and continues on p. 103.",
    focus: 0.6,
  },
  {
    page: 103,
    path: "sources/echea/krohn-103.jpg",
    title: "The names of the fixed notes",
    note: "V.4.5–8. The first two lines finish the list. The lower discussion distinguishes conjunct and disjunct tetrachords.",
    focus: 0,
  },
  {
    page: 104,
    path: "sources/echea/krohn-104.jpg",
    title: "Make, support and place the vessels",
    note: "V.5.1–2 begins halfway down. The angle-bracketed et is Krohn’s editorial supplement. Read the full page and apparatus.",
    focus: 0.32,
  },
  {
    page: 105,
    path: "sources/echea/krohn-105.jpg",
    title: "The row, its intended effect, and larger theatres",
    note: "V.5.2 continues at the top. The larger theatre’s three rows appear below; this workshop models only the one-row prescription.",
    focus: 0,
  },
  {
    page: 106,
    path: "sources/theatre/krohn-106.jpg",
    title: "The limits of the author’s examples",
    note: "V.5.6–8. Vitruvius cannot point to an example at Rome. He reports Greek and Italian examples, Mummius’s spoils, and cheaper earthenware alternatives.",
    focus: 0.4,
  },
] as const;
export const echeaPassages = [
  {
    title: "The fixed notes",
    ref: "V.4.5 · pp. 102–103",
    source: 0,
    latin:
      "stantes autem sunt, qui inter mobiles [sunt] interpositi continent tetrachordi coniunctionem et e generum discriminibus suis finibus sunt permanentes; appellantur autem sic: proslambanomenos, hypate hypaton, hypate meson, mese, nete synhemmenon, paramese, nete diezeugmenon, nete hyperbolaeon.",
    english:
      "The fixed notes, placed between the moving ones, maintain the connection of the tetrachord and stay at their own limits through the differences of the genera. They are named as follows: proslambanomenos, hypate hypaton, hypate meson, mese, nete synhemmenon, paramese, nete diezeugmenon, nete hyperbolaeon.",
    word: "stantes / mobiles",
    gloss: "fixed / moving",
    note: "These terms describe a note’s position when changing musical genus. The one-row vessel prescription uses seven of these eight fixed notes, leaving out proslambanomenos. The square brackets preserve Krohn’s deletion of sunt. The list itself is not in ascending pitch order.",
  },
  {
    title: "Tune the bronze",
    ref: "V.5.1 · p. 104",
    source: 2,
    latin:
      "Ita ex his indagationibus mathematicis rationibus fiant vasa aerea pro ratione magnitudinis theatri, eaque ita fabricentur, ut, cum tangantur, sonitum facere possint inter se diatessaron, diapente ⟨et⟩ ex ordine ad disdiapason.",
    english:
      "Following these investigations, let bronze vessels be made by mathematical rules, in proportion to the size of the theatre. Let them be fashioned so that, when struck, they can sound with one another a fourth, a fifth, and in sequence up to a double octave.",
    word: "cum tangantur",
    gloss: "when they are touched or struck",
    note: "Tangantur is present passive subjunctive. This is a test of the fashioned vessels’ sounding pitches; it does not supply a frequency in hertz or a vessel profile. The angle brackets mark the editor’s supplied et. The general double-octave instruction does not mean the seven-note row spans two octaves: it omits the lowest fixed note.",
  },
  {
    title: "Leave the vessel free",
    ref: "V.5.1 · p. 104",
    source: 2,
    latin:
      "postea inter sedes theatri constitutis cellis ratione musica ibi conlocentur ita, uti nullum parietem tangant circaque habeant locum vacuum et ab summo capite spatium, ponanturque inversa et habeant in parte, quae spectat ad scaenam, suppositos cuneos ne minus altos semipede; contraque eas cellas relinquantur aperturae inferiorum graduum cubilibus longae pedes duo, altae semipede.",
    english:
      "Then, after chambers have been made among the theatre seats, let them be placed there according to musical rules, touching no wall and having empty space around them and above their tops. Let them be set upside down, with wedges at least half a foot high beneath the side facing the stage. Opposite these chambers, let openings be left in the beds of the lower steps, two feet long and half a foot high.",
    word: "ponanturque inversa",
    gloss: "and let them be placed upside down",
    note: "Inversa agrees with the neuter plural vasa, not with cellae. The foot dimensions govern wedges and openings. They do not give a bowl’s diameter. The cutaway is a reading aid with an illustrative bowl shape; there is no conversion to a modern metre dimension.",
  },
  {
    title: "Thirteen chambers, twelve intervals",
    ref: "V.5.2 · p. 104",
    source: 2,
    latin:
      "si non erit ampla magnitudine theatrum, media altitudinis transversa regio designetur et in ea tredecim cellae duodecim aequalibus intervallis distantes confornicentur",
    english:
      "If the theatre is not large, let a horizontal band be marked halfway up its height, and in it let thirteen vaulted chambers be built, separated by twelve equal intervals.",
    word: "tredecim / duodecim",
    gloss: "thirteen / twelve",
    note: "These intervals are spaces between chambers. Thirteen positions need twelve gaps. They are not twelve equal musical intervals. The schematic plan uses equal angular gaps on a semicircle; the text locates the row halfway up the seating.",
  },
  {
    title: "From either end: three descending notes",
    ref: "V.5.2 · pp. 104–105",
    source: 2,
    latin:
      "uti ea echea, quae supra scripta sunt, ad neten hyperbolaeon sonantia in cellis, quae sunt in cornibus extremis, utraque parte prima conlocentur, secunda ab extremis diatessaron ad neten diezeugmenon, tertia diatessaron ad paramesen",
    english:
      "Let the sounding vessels mentioned above, sounding nete hyperbolaeon, be placed first on each side in the chambers at the extreme wings; the second from the ends a fourth away, at nete diezeugmenon; the third a fourth away, at paramese.",
    word: "utraque parte",
    gloss: "on each side",
    note: "Both halves receive the same pitches. Prima, secunda and tertia count placements inward from each end, not pitches upward from the centre. Krohn’s apparatus records corrected readings for diezeugmenon and paramesen; the model follows the printed text, not a claim that every manuscript agrees.",
  },
  {
    title: "The fourth place interrupts the descent",
    ref: "V.5.2 · p. 105",
    source: 3,
    latin:
      "quarta ad neten synhemmenon, quinta diatessaron ad mesen, sexta diatessaron ad hypaten meson, in medio unum diatessaron ad hypaten hypaton.",
    english:
      "The fourth at nete synhemmenon; the fifth a fourth away, at mese; the sixth a fourth away, at hypate meson; and in the middle one vessel a fourth away, at hypate hypaton.",
    word: "quarta / diatessaron",
    gloss: "fourth placement / interval of a fourth",
    note: "Quarta counts the fourth vessel from an end. There is no diatessaron before nete synhemmenon. That pitch is higher than paramese. In the chosen pure-ratio realization, the rise is 32:27, about 294 cents. Sorting by pitch swaps the third and fourth placements on each side and changes the prescription.",
  },
  {
    title: "What Vitruvius expects to happen",
    ref: "V.5.3 · p. 105",
    source: 3,
    latin:
      "ita hac ratiocinatione vox a scaena uti ab centro profusa se circumagens tactuque feriens singulorum vasorum cava excitaverit auctam claritatem et concentu convenientem sibi consonantiam.",
    english:
      "By this arrangement, the voice pouring out from the stage as from a centre, spreading around and striking the hollows of the individual vessels, will bring about increased clarity and a consonance agreeing with itself through the combined sound.",
    word: "auctam claritatem",
    gloss: "increased clarity",
    note: "This is the author’s proposed effect. A musical placement diagram cannot establish whether a built theatre became louder or clearer. The modern oscillator below isolates frequency selectivity; it has no seats, audience, reflections or sound-pressure calibration.",
  },
  {
    title: "What he can point to",
    ref: "V.5.8 · p. 106",
    source: 4,
    latin:
      "sin autem quaeritur, in quo theatro ea sint facta, Romae non possumus ostendere, sed in Italiae regionibus et in pluribus Graecorum civitatibus. etiamque auctorem habemus Lucium Mummium, qui diruto theatro Corinthiorum ea aenea Romam deportavit et de manubiis ad aedem Lunae dedicavit.",
    english:
      "If it is asked in which theatre these things have been made, we cannot point to one at Rome, but can in regions of Italy and in several Greek cities. We also have Lucius Mummius as a witness: after destroying the Corinthians’ theatre he carried its bronze vessels to Rome and made a dedication from the spoils at the temple of Luna.",
    word: "Romae non possumus ostendere",
    gloss: "we cannot point to one at Rome",
    note: "The author distinguishes local examples from reported ones. This passage is literary testimony, not a surviving set of thirteen measured vessels or a record of their sound.",
  },
  {
    title: "A less expensive material",
    ref: "V.5.8 · p. 106",
    source: 4,
    latin:
      "multi etiam sollertes architecti, qui in oppidis non magnis theatra constituerunt, propter inopiam fictilibus doliis ita sonantibus electis hac ratiocinatione compositis perfecerunt utilissimos effectus.",
    english:
      "Many skilful architects who built theatres in smaller towns, because of limited means, selected earthenware jars that sounded in this way and arranged them by this reasoning, achieving very useful effects.",
    word: "fictilibus doliis … electis",
    gloss: "earthenware jars having been selected",
    note: "The wording gives a material alternative and a requirement to select sounding jars. It does not establish that air-cavity resonance and vibration of a bronze shell are the same mechanism. Their relative roles remain a question for historical and acoustic research.",
  },
] as const;

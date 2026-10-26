export const LEDGER_EDITION =
  "https://telota.bbaw.de/ig/digitale-edition/inschrift/IG%20I%C2%B3%20476";
export const LEDGER_AIO = "https://atticinscriptions.com/inscription/IGI3/476";
export const LEDGER_MUSEUM = "https://www.theacropolismuseum.gr/en/node/22236";
export const LEDGER_VOLUME = "https://archive.org/details/erechtheummeasur1192unse";

export const ledgerPeople = [
  {
    name: "Simias",
    greek: "Σιμίας",
    description: "Living in Alopeke",
    note: "The residence formula identifies where he lives. This entry does not call him an Athenian citizen.",
    lines: ["200–201", "236–237"],
    bands: [
      [0.348, 0.041],
      [0.289, 0.041],
    ],
  },
  {
    name: "Kerdon",
    greek: "Κέρδον",
    description: "No further identifier here",
    note: "A name alone does not establish legal status. Keep Kerdon’s status unspecified in this excerpt.",
    lines: ["201", "237–238"],
    bands: [
      [0.368, 0.022],
      [0.309, 0.041],
    ],
  },
  {
    name: "Sindron",
    greek: "Σίνδρον",
    description: "Of Simias; interpreted as enslaved",
    note: "The possessive name is interpreted as an enslaved worker’s owner, rather than a father, in the current IG and AIO readings. The Greek does not spell out a word for ‘slave’ here.",
    lines: ["201–202", "238–239"],
    bands: [
      [0.368, 0.041],
      [0.329, 0.041],
    ],
  },
  {
    name: "Sokles",
    greek: "Σοκλῆς",
    description: "Of Axiopeithes; interpreted as enslaved",
    note: "The owner named for Sokles is Axiopeithes, not Simias. An amount recorded beside his name does not tell us who took possession of the payment.",
    lines: ["202–203", "239–240"],
    bands: [
      [0.389, 0.041],
      [0.349, 0.041],
    ],
  },
  {
    name: "Sannion",
    greek: "Σαννίον",
    description: "Of Simias; interpreted as enslaved",
    note: "The possessive identifier links Sannion with Simias. The record gives a payment entry, without reporting working hours, personal receipt or living conditions.",
    lines: ["203–204", "240"],
    bands: [
      [0.409, 0.041],
      [0.369, 0.022],
    ],
  },
  {
    name: "Epieikes",
    greek: "Ἐπιείκες",
    description: "Of Simias; interpreted as enslaved",
    note: "Epieikes’s second amount is one obol below the first five entries. That small difference is compatible with dividing a total into whole obols; the inscription gives no reason for the choice.",
    lines: ["204–205", "240–241"],
    bands: [
      [0.429, 0.041],
      [0.369, 0.041],
    ],
  },
  {
    name: "Sosandros",
    greek: "Σόσανδρος",
    description: "Of Simias in the first entry; interpreted as enslaved",
    note: "The first entry supplies the possessive ‘of Simias’. The second repeats the name without that identifier. Keep the two entries visible rather than silently inserting words into the second.",
    lines: ["205", "241–242"],
    bands: [
      [0.449, 0.022],
      [0.389, 0.041],
    ],
  },
] as const;

export type LedgerEntry = 90 | 100;
export const ledgerEntries = {
  90: {
    title: "Earlier entry",
    lines: "199–205",
    caskey: "41–47",
    page: "390",
    leaf: 420,
    obols: [78, 77, 77, 77, 77, 77, 77],
    mask: 1,
  },
  100: {
    title: "Later entry",
    lines: "235–242",
    caskey: "77–84",
    page: "392",
    leaf: 422,
    obols: [86, 86, 86, 86, 86, 85, 85],
    mask: 31,
  },
} as const;

export const ledgerWords = [
  {
    word: "ῥαβδόσεος",
    roman: "rhabdoseos",
    meaning: "for fluting",
    note: "A genitive of ῥάβδωσις, the cutting of vertical channels. The older spelling corresponds to later ῥαβδώσεως. The heading appears at IG line 192, above the first selected entry.",
  },
  {
    word: "οἰκῶν",
    roman: "oikōn",
    meaning: "living, residing",
    note: "A present participle modifying Simias: ‘living in Alopeke’. This reading aid uses ω; the stone’s older Attic alphabet writes Ο for this sound. Residence is not a statement of citizenship.",
  },
  {
    word: "Σιμίο",
    roman: "Simio",
    meaning: "of Simias",
    note: "A possessive genitive after a worker’s name. Its old Attic ending -ο corresponds to later -ου. Modern editors interpret this identifier as ownership here. It is not a separately written word meaning ‘enslaved’.",
  },
  {
    word: "ἑχσῆς",
    roman: "hechsēs",
    meaning: "next in sequence",
    note: "The source’s older spelling corresponds to later ἑξῆς. With ‘the next [column]’, it orders the work entries. It does not divide particular flutes among the named workers.",
  },
] as const;

export const ledgerPages = [
  { id: "390", file: "caskey-390.jpg", leaf: 420, label: "p. 390 · earlier Greek entry" },
  { id: "392", file: "caskey-392.jpg", leaf: 422, label: "p. 392 · later Greek entry" },
  { id: "412", file: "caskey-412.jpg", leaf: 442, label: "p. 412 · Caskey’s interpretation" },
  { id: "title", file: "paton-title.jpg", leaf: 7, label: "Title page · Paton, 1927" },
] as const;

export const LEDGER_LIMITS =
  "These are two selected entries for column-fluting work in the Erechtheion accounts, 408/7 BCE, not a complete building budget or a daily wage table. The totals 90 and 100 drachmas are sums of the edited individual amounts. Equal division with whole-obol adjustments is a modern arithmetic comparison; it does not establish the ancient accountant’s intention. No amount is converted into modern money. A payment entered beside an enslaved worker’s name does not establish that the worker personally received or controlled it.";

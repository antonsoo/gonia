# Seven names, one uneven obol

The existing fluting workshop explains the shape of a channel. This room asks
who appears in the accounts for cutting the channels. It uses a small,
auditable historical record rather than inventing a construction economy.

## Source decisions

The primary text is **IG I³ 476**, Erechtheion building accounts, 408/7 BCE,
especially lines 199–205 and 235–242. Both entries occur in the eighth prytany.
The seven names recur in the same order. The first entry gives a possessive
identifier for Sosandros; the second omits it. That difference is preserved.

- [Inscriptiones Graecae digital edition](https://telota.bbaw.de/ig/digitale-edition/inschrift/IG%20I%C2%B3%20476),
  Berlin-Brandenburg Academy of Sciences and Humanities. The edited Greek is
  licensed CC BY 4.0. The retained XML excerpt preserves the selected lines,
  markup, restorations and older Attic vowel glyphs. Its attribution header
  replaces the original header; unrelated lines are omitted. The excerpt also
  includes the fluting heading and immediately adjoining clause boundaries.
- [Attic Inscriptions Online](https://atticinscriptions.com/inscription/IGI3/476),
  translation and commentary by Stephen Lambert and Robin Osborne. Used to
  check amounts, names and interpretation. Its English is linked, not bundled.
- [Acropolis Museum, EM 6667 δ](https://www.theacropolismuseum.gr/en/node/22236),
  object record for fragment XVII, dated 408/7 BCE. The museum photograph is
  linked rather than redistributed.
- [The Erechtheum (1927)](https://archive.org/details/erechtheummeasur1192unse),
  edited by James Morton Paton, Harvard University Press; inscription section
  by Lacey Davis Caskey. Complete Greek pages 390 and 392, interpretation page
  412 and the title page are retained from the Getty Research Institute scan.
  This US publication is public domain in the United States. The 1600-pixel
  page images are unmodified IIIF responses, not crops. Exact URLs, archive
  leaves and hashes are in the [manifest](../public/sources/ledger/manifest.json).

The printed and modern line numbering differ:

| Entry | Current IG lines | Caskey XVII, col. I | Printed page | Archive leaf |
| --- | --- | --- | --- | --- |
| Earlier selected team | 199–205 | 41–47 | 390 | 420 |
| Later selected team | 235–242 | 77–84 | 392 | 422 |

The visual line bands indicate where to look in the printed edition; they do
not classify which letters survive on the original stone. Brackets supply
lost text and numeral strokes. The arithmetic acts on the edited reading,
including those supplies. It cannot independently confirm a restoration.

The current IG German interpretation and AIO English interpretation identify
five possessive relationships in the first entry as ownership of enslaved
workers. The lesson follows them, rather than Caskey’s older English rendering
as family relationships. It does not infer Kerdon’s status from his name or
Simias’s citizenship from his place of residence. It does not infer who
personally received, controlled or kept the payments.

The short Greek reading aids join line breaks and retain selected older
Attic spellings. Ordinary Unicode long vowels are used in οἰκῶν and Σοκλῆς.
They are explicitly distinct from the diplomatic text. The XML retains the
edition’s special glyphs, which may need its epigraphic font to display fully;
the printed pages supply an offline visual reference independent of that font.

## Arithmetic and the modern activity

The [University of Canterbury numismatic guide](https://www.canterbury.ac.nz/about-uc/what-we-do/uc-in-the-community/exhibitions-and-collections/alexander-the-great-exhibition/a-guide-to-coins-and-coin-terms)
states the six-obol drachma. No weight standard or modern purchasing-power
equivalence is inferred. The application stores integer **obols**, not decimal
drachmas. This is a unit choice for this activity, not a claim that smaller
coin fractions did not exist.

| Name | Earlier entry (obols) | Later entry (obols) |
| --- | ---: | ---: |
| Simias | 78 | 86 |
| Kerdon | 77 | 86 |
| Sindron | 77 | 86 |
| Sokles | 77 | 86 |
| Sannion | 77 | 86 |
| Epieikes | 77 | 85 |
| Sosandros | 77 | 85 |
| Computed total | 540 | 600 |

For a total T in obols, Euclidean division gives `T = 7q + r`. Each name
starts with q; a checkbox contributes one extra obol. The activity deliberately
limits the remainder to one extra per name. There are `choose(7,r)` balanced
distributions: seven for 540 and twenty-one for 600. Exactly one reproduces
each edited entry. This is compatible with a near-equal allocation, but does
not prove the ancient accountant used that procedure or explain the recipients.

```text
Edited individual amounts --sum--> 540 or 600 obols
                                      |
                                  divide by 7
                                      |
                          equal base + remainder
                                      |
                         learner chooses recipients
                                      |
                    balanced? -----> matches edited names?
```

The source totals are computed from the edited individual amounts. Neither is
presented as the full cost of one column. Caskey p. 412 supplies an interpretation
of multiple stages; its reconstructed complete cost is not used as the activity
budget. No particular flute is assigned to an individual person.

The schematic numeral renderer draws additive signs directly: a triangle for
ten drachmas, a crossbar sign for one drachma and a stroke for one obol. These
are teaching outlines, not a type facsimile or restoration of the marble.

## Design and implementation

Audience and purpose follow the owner’s brief: curious fluent English readers
learning ancient architecture through original language, pictures and an
operable question. The room retains Gonia’s existing paper (#f4f1e8), ink
(#27352f), green (#405a43), source-outline red (#963b25), and rule (#bfc3b3).
IBM Plex carries controls and prose; the existing Noto Serif carries Greek
and the established heading treatment. No new font or runtime dependency is added.

The ledger itself is the main visual. Seven aligned names, adjustable amounts
and revealed source amounts make the relationship inspectable. Identifiers
and source pages sit below it. At phone width each recorded amount moves
beneath its corresponding allocation; names and all controls remain available.
The source pane can enlarge, pan and center the selected printed line band.
No decorative architecture reconstruction suggests evidence the account lacks.

```text
Desktop                         Phone
names | allocation | record     name       | allocation
--------------------------                  record
division and remainder aside   -----------------------
                               division and remainder
identifier | complete page     identifier
                               complete page
```

`src/core/ledger.ts` contains integer arithmetic, strict URL decoding and CSV.
`src/ledger-content.ts` retains the selected data and editorial explanations.
`src/ledger-drawing.ts` draws numeral and remainder diagrams.
`src/ledger-files.ts` creates the script-free reading. The UI preserves stable
checkbox/button nodes so updates retain keyboard focus. Revealing the record
moves focus to its newly available action. History restores all activity state.
Page zoom and incidental source-page browsing are local viewing preferences.

Every displayed scan and each exported image, font, license and Greek XML
excerpt is checked against a pinned SHA-256 identity. Failed promises are
removed so a corrected response can be retried. Saving snapshots activity state
before asynchronous asset loading. The complete Gonia worker inventory includes
the twelfth room and all its sources; the shared worker verifies every build
file before claiming offline readiness.

## Boundaries

The activity establishes an arithmetic relationship and a route back to an
edited inscription. It does not establish an ancient rounding algorithm,
relative productivity, daily pay, citizenship, family structure, an enslaved
worker’s control of money, current purchasing power or a full project budget.
Its exact sums do not remove uncertainty from restored text. New code and
English educational explanations are MIT; CC BY 4.0 applies separately to the
retained modern edited Greek excerpt. Public deployment remains a separate claim.

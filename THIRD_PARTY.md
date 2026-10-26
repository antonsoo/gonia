# Third-party material

Gonia's code, diagrams and English translations are MIT licensed. The following
materials retain their own provenance and terms.

## The omitted-colonnade room

`public/sources/colonnade/` contains five complete public-domain source images:

| Image            | Edition and role                                                  | Delivery                                  |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| `krohn-063.jpg`  | Krohn's 1912 Vitruvius, printed p. 63, III.2.6–7                  | Rendered from PDF page 81                 |
| `krohn-066.jpg`  | Same edition, p. 66, III.3.8 and the XXXIV / XXXVIII apparatus    | Rendered from PDF page 84                 |
| `humann-041.jpg` | Humann, Kohte and Watzinger (1904), fig. 29: preserved-state plan | Heidelberg full IIIF image                |
| `humann-043.jpg` | Same publication, fig. 30: proposed restored plan                 | Heidelberg full IIIF image                |
| `humann-055.jpg` | Same publication, fig. 38: underside of a capital                 | Heidelberg IIIF image at 1800-pixel width |

The [source identities](docs/colonnade-source-identities.json) record exact
endpoints, image hashes, original Latin PDF hash and page mapping. The Latin
pages were rendered with `pdftoppm -scale-to 2200 -jpeg -jpegopt quality=86`.
They retain the complete critical apparatus. The Heidelberg images are
unchanged responses from the library's image service, with page borders and
library credits retained. The [library manifest](https://digi.ub.uni-heidelberg.de/diglit/iiif/humann1904/manifest.json)
attributes Heidelberg University Library and applies the Public Domain Mark.
The library metadata and all three responses were checked on 2026-10-23.

The five short Latin excerpts were checked against the actual scanned print;
line-end hyphens are joined and the Roman numeral is capitalized. The English,
word notes, drawings and regular-grid model are new. Greek dictionary headwords
explain the technical vocabulary and link to Logeion; they are not a Greek
original of Vitruvius's text.

The [model note](docs/colonnade-model.md) distinguishes the regular model from
the excavation publication's restored and preserved plans. It also identifies
the separately linked Pavlos Lefas 2001 article and the fact that only its
publisher's abstract was accessible. No modern figure or full text from that
article is bundled. The portable reading embeds the complete OFL notices for
both included fonts, as well as the source attributions and image identities.

## Rolling stone transport

`public/sources/transport/` contains the complete printed pages 230–231 of
the same public-domain Krohn 1912 edition identified below, corresponding to
original PDF pages 248–249. The outer margin's earlier pagination is not the
printed header's page number. The JPEGs were rendered at a 2000-pixel long edge
with Poppler 24.02.0, quality 85. The two-page PDF retains both complete pages.
The [source reviewer](scripts/transport-source-review.py) reproduces the same
JPEGs from both the identified original and the bundled PDF.

| File                    | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `krohn-230.jpg`         | `026ea712d595e7dfd5bdd64cb469185b322a1736b5c7b6ff54df72fc2f61392e` |
| `krohn-231.jpg`         | `4c141850b98b08663f164765479e96d7711103fb1816725d50e65acf0ac7ea01` |
| `vitruvius-230-231.pdf` | `9fa4fd4033b5ce82d3e0a5b0ee4b7d59885641e0a8baf4a8d95cfba83a4f8cfc` |

The five short Latin excerpts were checked against these images. Line-end
hyphens are joined and Roman numeral capitalization normalized. The printed
gap in the frame description remains visible; no lost dimensions are invented.
The original apparatus is retained, including variants of Paconius's name.
The wheel sizes are interpreted as diameters following Morgan's English
translation ([X.2.12](https://lexundria.com/vitr/10.2.12/mg),
[X.2.14](https://lexundria.com/vitr/10.2.14/mg)); the model explicitly assumes
that the long dimension of the replacement base lies along the wheel axis.

Greek headwords, meanings and genitives were checked against rendered LSJ
entries in Logeion: [κνώδαξ](https://logeion.uchicago.edu/κνώδαξ),
[κύλινδρος](https://logeion.uchicago.edu/κύλινδρος) and
[ἐπιστύλιον](https://logeion.uchicago.edu/ἐπιστύλιον). Definitions and grammar
notes are newly written; no modern dictionary article is bundled. These
headwords explain the Latin technical loans, rather than supplying a Greek
original of Vitruvius. The new English and diagrams are MIT.

Saved readings verify and embed the original two JPEGs, Noto Serif and IBM
Plex Sans, together with both full font copyright/license texts. The complete
asset identities are in [the transport manifest](docs/transport-source-identities.json).


## Latin source scan

`public/sources/vitruvius-82-83.pdf` contains printed pages 82–83 from
_Vitruvii De architectura libri decem_, edited by F. Krohn, Leipzig: B. G.
Teubner, 1912. It was extracted without changing the page content from PDF
pages 100–101 of the Internet Archive scan
[`vitruviidearchit00vitr_1`](https://archive.org/details/vitruviidearchit00vitr_1).
This ancient text and 1912 edition are public domain. The source PDF and
extracted pages were obtained and inspected on 2026-10-21.

| File                     | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Original Archive PDF     | `b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139` |
| Bundled two-page extract | `8f35a11a732949212f90aa9da356146794b632dcd94dd62d95a2c48b0dad7f93` |

The four Latin sentences were checked visually against these pages. Line-end
hyphens were joined; sentence punctuation was adapted. No apparatus readings
were silently substituted. The English is a new translation for this project.

## Column-spacing source pages

`public/sources/spacing/` contains printed pages 64–67 of the same public-domain
Krohn edition, corresponding to PDF pages 82–85. The four-page PDF was extracted
without altering the page content. The JPEGs were rendered from those pages
with `pdftoppm -scale-to 1800 -jpeg -jpegopt quality=85`. All four were inspected
against the full PDF; neither the text nor the critical apparatus was cropped.
The saved HTML reading embeds these exact JPEG bytes.

| File                         | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `vitruvius-64-67.pdf`        | `bc8f455c15075825093b559beeb40a84964454d5fb27e8436d2d33f3edd8912e` |
| `krohn-082.jpg` (printed 64) | `0441326734ad358f30c097af70ffd79a6cabd3cb38a4f39b66a9d67af4c081eb` |
| `krohn-083.jpg` (printed 65) | `c7136ef18758da483606cc4338d34dff6179054b376852dc21dfb9fd7edc26f9` |
| `krohn-084.jpg` (printed 66) | `dcee6fe5e93edca54ad739922c6d57fe4ecc40a2815f1825557f6603f2fabe86` |
| `krohn-085.jpg` (printed 67) | `24c4429621ad5aa6a74ee4ed0657adee2ae5a095a0d8340aba5a997462d9921a` |

The seven excerpts in `src/spacing-content.ts` are transcribed from III.3.2,
.4–.7 and .10, joining line-end hyphens. Their English translations are new.
The model uses III.3.10's explicit _novem ... et dimidiam partem_ (nine and a
half) for eustyle height, also given in numerals on printed page 65. It does
not silently inherit the eight-and-a-half reading in
[Gwilt's English translation](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/3%2A.html).
The araeostyle passage gives a timber-beam prescription but no numerical gap;
the app's adjustable gap is explicitly a modern illustration.

Greek word-parts were checked against LSJ through Scaife ATLAS, the
Berlin-Brandenburg Academy's Corpus Lexicographicum Graecum, and Logeion.
The interface and exported reading link each headword to its entry. These
are Greek dictionary headwords explaining the borrowed Latin architectural
names, not a Greek original of Vitruvius's Latin text. Definitions and notes
are newly written; no modern dictionary article is reproduced.

## Entasis measurements and source pages

`public/sources/entasis/penrose-039.jpg`, `penrose-040.jpg`, `penrose-041.jpg`
and `penrose-Taf_14.jpg` are unchanged full-resolution JPEG responses from
Heidelberg University Library's public IIIF service for Francis Penrose,
_An Investigation of the Principles of Athenian Architecture_, second edition,
1888. The [library manifest](https://digi.ub.uni-heidelberg.de/diglit/iiif/penrose1888/manifest.json)
identifies the library and applies the Public Domain Mark. Original library
footers remain in the scans. The image endpoints have the form
`https://digi.ub.uni-heidelberg.de/iiif/2/penrose1888%3A041.jpg/full/full/0/default.jpg`;
substitute `039`, `040`, or `Taf_14` for the other pages.

`krohn-068.jpg` is printed p. 68 (PDF page 86) of the same 1912 Archive edition
used above, rendered with `pdftoppm -scale-to 2200 -jpeg`. The text and critical
apparatus remain complete. Its III.3.13 sentence is transcribed with joined
line-end hyphens and normalized Greek sigma letterforms; the unaccented Greek
word follows the printing. The English and reading notes are new.

| File                       | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `penrose-039.jpg`          | `9fc580752d535a0eb0be60b6aec035c078bab4f69b74aded7f4a90b567024b07` |
| `penrose-040.jpg`          | `59d088f75181c483300ebb0e3b136148bde990dfee83841a269d96a7aca4c144` |
| `penrose-041.jpg`          | `7b5dd6ae503603cb99564905004290b01fc4b91015f8326eb5a028aa70dd4c25` |
| `penrose-Taf_14.jpg`       | `2ed65b3bdba64d8817c4b04676e67eadcc6b5b0fd360c0495f6b6c2df017e227` |
| `krohn-068.jpg`            | `4fa9ef64924b677902b225ebc022efb13246151ea16fff2c1f7d60bdc92d0cd2` |
| `entasis-source-pages.pdf` | `4ba8a9fb3e63e4a03272e1a30e5a6a66f989b4155ef6ada3c792a74ab9ec0517` |

The five-page PDF embeds these JPEG bytes without re-encoding; regenerate it
with `python3 scripts/entasis-source-pdf.py`. The app verifies each scan's hash
before embedding it in a saved reading. Images and tables were inspected
directly; OCR was used only to locate passages.

The five plotted rows are Penrose's corrected comparison on p. 41, not a new
transcription of every row of plate XIV. That plate is supplied as context.
His p. 40 six-building table supplies lengths, maxima, their reported heights
and a separately rounded equal-length comparison. New SVGs use these numbers;
they do not copy modern scholarly diagrams.

Alain Goriely's [2026 analysis](https://arxiv.org/html/2510.16831v2) is linked
as a contrasting interpretation of optical-correction claims. No text extract,
figure or adapted illustration from that article is bundled. The Greek
headwords link to Scaife ATLAS's Middle Liddell and headword records; their
short explanations and all Latin grammar notes are newly written.

## Fonts

- IBM Plex Sans, Regular and SemiBold WOFF2, from
  [IBM/plex](https://github.com/IBM/plex/tree/master/packages/plex-sans/fonts/complete/woff2).
  SIL Open Font License 1.1: `public/fonts/IBMPlex-OFL.txt`.
- Noto Serif, Regular TTF, from the
  [Noto Serif project](https://github.com/notofonts/latin-greek-cyrillic).
  SIL Open Font License 1.1: `public/fonts/NotoSerif-OFL.txt`.

All fonts are self-hosted. No font service is contacted by the application.

## Research and dictionaries

Mark Wilson Jones, “Doric Measure and Architectural Design 2: A Modular Reading
of the Classical Temple,” _American Journal of Archaeology_ 105.4 (2001),
675–713, [DOI 10.2307/507412](https://doi.org/10.2307/507412), fig. 2, p. 677,
informs the geometric model. His figure is **not** redistributed: the app draws
its own geometry from calculated coordinates. His account distinguishes
evidence from hypotheses about timber origins.

Greek headwords and their grammatical information were checked in
Liddell–Scott–Jones via Perseus / Scaife ATLAS. The short explanatory definitions
in Gonia are newly written. Individual entries are linked from the interface
and in `src/content.ts`; the architrave entry links to Perseus's short definition.
Latin triglyph, metope, column and epistyle terms are attested in Vitruvius IV.2–3.
The workshop uses dictionary headwords, not a claim that Greek and Latin noun
genders always match.

## Flute-carving workshop

`public/sources/fluting/` contains three complete public-domain source pages:
Krohn's 1912 Vitruvius, pp. 74 and 85, and Bywater's Aristotle, p. 205,
from the 1920 printing of his edition first published in 1894. Internet Archive
provided the scans. [Source identities and decisions](docs/fluting-sources.md)
record the full PDFs, exact image hashes, page mapping and editorial brackets.
The short Greek transcription was also checked against Perseus's Bywater TEI
(CC BY-SA 4.0); that complete digital text is not bundled. All new English
translations, grammar notes and geometric drawings are MIT, Anton Soloviev, 2026.
The standalone HTML reading embeds Noto Serif and IBM Plex Sans with their
complete OFL copyright and license notices inside the file.

## Euclid's segment comparison

`public/sources/fluting/heiberg-240.jpg` and `heiberg-241.jpg` are complete
public-domain pages from Heiberg's 1883 edition of Euclid, from the University
of Toronto / Gerstein scan at Internet Archive. Heiberg edited the Greek and
made the modern Latin translation. [The source note](docs/segments-sources.md)
records the original PDF identity, page mapping, transcription and the
distinction between the angle in a segment and the angle of a segment.
New comparison drawings, English, explanations and code are MIT,
Anton Soloviev, 2026.

## Sounding vessels

`public/sources/echea/` adds complete pages 102–105 of Krohn's 1912 public-domain
Vitruvius edition. Page 106 reuses `public/sources/theatre/krohn-106.jpg`.
The [manifest](public/sources/echea/manifest.json) gives the PDF identity, page
mapping, rendering settings and SHA-256 hashes. The
[source and model note](docs/echea-model.md) records transcription and editorial
decisions. All five pages were visually inspected.

New English translations, language notes, SVG drawings and sounds generated
from the documented modern equation are MIT, Anton Soloviev, 2026. No modern
research illustration, modern translation or instrument recording is bundled.
Saved readings embed the existing Noto Serif and IBM Plex font bytes with
their full OFL notices.

## Hoist room

`public/sources/hoist/` contains five complete public-domain pages from Krohn's
1912 Vitruvius: title, 226–227 and 232–233. The manifest records the freshly
verified original PDF identity, exact page mapping, render settings and hashes.
No page is cropped or retouched. New English, Latin/Greek notes, diagrams and
model are MIT, Anton Soloviev, 2026. The source's editorial additions remain
visible. Saved readings embed the existing fonts and complete OFL notices.

## Erechtheion building accounts

`public/sources/ledger/` retains four complete public-domain pages from
_The Erechtheum, measured, drawn and restored_, edited by James Morton Paton,
Harvard University Press, 1927. Lacey Davis Caskey wrote its inscription section.
The Getty Research Institute scan is supplied through Internet Archive. Images
are unmodified complete IIIF responses. The manifest records their archive
leaves, exact URLs and SHA-256 identities.

`ig-476-excerpt.xml` selects edited Greek lines 192–206 and 235–243 from
[IG I³ 476](https://telota.bbaw.de/ig/digitale-edition/inschrift/IG%20I%C2%B3%20476),
Inscriptiones Graecae, Berlin-Brandenburg Academy of Sciences and Humanities.
That modern edition is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The selected text, line markers and restoration brackets are retained;
unrelated lines are omitted and the header is replaced with excerpt attribution.
Its special epigraphic glyphs are retained in the XML. Ordinary-Greek reading
aids in the app explicitly join line breaks and replace selected long vowels.

Stephen Lambert and Robin Osborne’s modern AIO translation is linked and used
for checking and interpretation; it is not redistributed. The museum object
record and photograph are linked. New English explanations, the allocation
activity and numeral outlines are MIT, Anton Soloviev, 2026. The standalone
reading includes attribution, complete source pages and the bundled fonts’
full OFL notices. See [source decisions](docs/ledger-model.md).

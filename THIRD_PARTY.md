# Third-party material

Gonia's code, diagrams and English translations are MIT licensed. The following
materials retain their own provenance and terms.

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

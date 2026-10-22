# Third-party material

Gonia's code, diagrams and English translations are MIT licensed. The following
materials retain their own provenance and terms.

## Latin source scan

`public/sources/vitruvius-82-83.pdf` contains printed pages 82–83 from
*Vitruvii De architectura libri decem*, edited by F. Krohn, Leipzig: B. G.
Teubner, 1912. It was extracted without changing the page content from PDF
pages 100–101 of the Internet Archive scan
[`vitruviidearchit00vitr_1`](https://archive.org/details/vitruviidearchit00vitr_1).
This ancient text and 1912 edition are public domain. The source PDF and
extracted pages were obtained and inspected on 2026-10-21.

| File | SHA-256 |
| --- | --- |
| Original Archive PDF | `b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139` |
| Bundled two-page extract | `8f35a11a732949212f90aa9da356146794b632dcd94dd62d95a2c48b0dad7f93` |

The four Latin sentences were checked visually against these pages. Line-end
hyphens were joined; sentence punctuation was adapted. No apparatus readings
were silently substituted. The English is a new translation for this project.

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
of the Classical Temple,” *American Journal of Archaeology* 105.4 (2001),
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

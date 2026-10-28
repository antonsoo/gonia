# Latin, print and the modern model

The selected text is Vitruvius, _De architectura_ VI.8.3-4, from
F. Krohn's Teubner edition (Leipzig, 1912), printed p. 141. The room keeps the
preceding page and the title page as context. The Latin is ancient; its edited
print is from 1912; the force calculation is a new instructional model.

| Retained file     | Original PDF page | Printed content                                        |
| ----------------- | ----------------: | ------------------------------------------------------ |
| `krohn-141.jpg`   |               159 | VI.8.1-6, including the selected arch and pier clauses |
| `krohn-140.jpg`   |               158 | VI.7 and the opening of VI.8.1                         |
| `krohn-title.jpg` |                 5 | Title page identifying Krohn and the 1912 edition      |

The complete original PDF was fetched again from
[Internet Archive](https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf)
on 2026-10-27. Its SHA-256 is
`b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139`.
The [retained manifest](../public/sources/arch/manifest.json) records the PDF
identity, page mapping, derivation, each image identity and related font/license
identities. The source viewer and illustrated export reject mismatching bytes,
including a successful HTTP response containing another valid page.

```sh
curl -fL https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf -o /tmp/krohn.pdf
python3 scripts/arch-sources.py /tmp/krohn.pdf
```

The script checks the original PDF's hash before rendering whole pages with
Poppler `pdftoppm -scale-to 2200 -jpeg -jpegopt quality=88`. Reference renderer:
Poppler 24.02.0. The images retain margins and apparatus; no image was cropped,
retouched or reconstructed. All three images were visually inspected, and the
selected Latin was checked against the actual print.

## Reading decisions

- Line-end hyphens are joined. Sentence punctuation is adapted for parallel
  reading, without changing the selected words. The third and fourth readings
  preserve the two parts of a single sentence and disclose the split.
- Krohn's `arcus … conclusae` is retained despite its unusual agreement. His
  apparatus at `cuneorum` remains on the complete page. The display does not
  silently rewrite the edited Latin into a more regular form.
- `latiores … sunt faciundae` is an obligation to make the outer piers broader.
  No particular width, weight or modern calculation is prescribed here.
- The first two readings describe a relieving arch above timber and a wall
  load. The isolated thirteen-stone model does not reconstruct that arrangement.
- `ad centrum` describes radial divisions and joints. It is not a statement
  that the modern locus of joint resultants points at the circle's centre.
- `incumbas` is rendered as "bearings", with "abutments" discussed in the word
  note. This does not assign the ancient word our schematic support geometry.
- The English, eight contextual word notes and grammar explanations are new.
  They have not received independent philological review.

The [Latin comparison](https://penelope.uchicago.edu/Thayer/L/Roman/Texts/Vitruvius/6*.html#8.3)
and [Joseph Gwilt's English](https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Vitruvius/6*.html#8.3)
at LacusCurtius were consulted online; neither site is the bundled edition.
No modern copyrighted diagram or photograph is reproduced. The model's
[modern structural references](arch-model.md#modern-references) are linked
separately from the ancient text.

## Rights

The 1912 pages are public domain. New English, diagrams and code use the
repository's [MIT license](../LICENSE). The local Noto Serif and IBM Plex fonts
use SIL OFL 1.1; the illustrated reading embeds two actual font files, both
complete OFL notices, and the complete MIT license. Its source-identity download
retains the original and derivative identities. The SVG uses the viewer's
Arial or sans-serif font; its geometry is portable, but its text is not a
font-embedded facsimile.

# Printed sources for the carving workshop

## What the source establishes

| Page                           | Passage                       | Used here                                                                                                                      |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Krohn 1912, p. 85              | Vitruvius IV.3.9              | Twenty Doric divisions, a flat-faced alternative, and a compass at the centre of a square drawing a circle through its corners |
| Krohn 1912, p. 74              | Vitruvius III.5.14            | Twenty-four flutes and a norma whose arms contact both edges while its corner follows the hollow                               |
| Bywater, 1920 printing, p. 205 | Aristotle, EN X.4, 1174a23-24 | The Greek noun for fluting, with the column in a nested genitive phrase                                                        |

The quarter-circle and semicircle are explicit geometric readings of these
instructions. They are not a classification of every surviving Doric or Ionic
flute. The 50-120 mm groove widths and Ionic fillet proportions are chosen model
values. Neither area removed nor groove depth is a strength or optical model.

Krohn marks `〈angulos〉` as an editorial supplement in III.5.14. His apparatus
credits Jocundus, noting a different position for the addition. The workshop's
short quotation of the preceding contact instruction retains the brackets.
It does not turn a supplied word into an unmarked manuscript reading. The
Doric quotation starts after the disputed `[striaturae]` earlier in IV.3.9.

Aristotle is discussing different activities within building, in an argument
about activity and pleasure. He supplies the Greek sentence, not a Greek
translation of Vitruvius or a recipe for flute geometry. The transcription
was compared with both the complete printed page and the
[Perseus Bywater TEI](https://github.com/PerseusDL/canonical-greekLit/blob/master/data/tlg0086/tlg010/tlg0086.tlg010.perseus-grc2.xml).
The digital edition is credited for that cross-check; the app transcribes the
public-domain printed page and does not redistribute the complete TEI.
The [LSJ entry for rhabdosis](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n92050/)
independently identifies the architectural use and cites this clause.

## Reproduce the images

Download the full public-domain PDFs from Internet Archive:
- [Vitruvii De architectura libri decem, ed. F. Krohn (1912)](https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf).
  SHA-256 `b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139`.
- [Aristotelis Ethica Nicomachea, ed. I. Bywater, 1920 printing](https://archive.org/download/aristotelis00aristuoft/aristotelis00aristuoft.pdf).
  The edition was first published in 1894; the retained scan is not labeled as
  an 1894 physical copy. Its PDF SHA-256 is recorded in the source receipt.

Using Poppler's `pdftoppm`, render PDF pages 103 and 92 from Krohn, and 217 from
Bywater, with `-scale-to 2200 -jpeg -jpegopt quality=90 -singlefile`. These are
printed pages 85, 74 and 205 respectively. The public JPEGs preserve complete
pages, including running heads, page numbers, margins and critical apparatus.
They are not reconstructed text or generated illustrations.

Each JPEG's exact dimensions and SHA-256 are in
[`src/fluting-content.ts`](../src/fluting-content.ts). The saved reading checks
those identities, embeds all three unchanged images and embeds the local Greek
and interface fonts with their full copyright/license notices. Its CSV and SVG
links work from the native file with browser networking disabled.

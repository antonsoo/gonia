# Euclid's two segments and two different angle phrases

The paired comparison applies Euclid's circle geometry to two modern readings
of Vitruvius's flute instructions. It is a teaching connection, not evidence
that Vitruvius or a named ancient mason used this argument.

## The retained pages

Euclid, _Euclidis opera omnia_, vol. I, Greek edited and Latin translated by
J. L. Heiberg (B. G. Teubner, Leipzig, 1883). The scan is the University of
Toronto / Gerstein copy hosted by
[Internet Archive](https://archive.org/details/euclidisoperaomn01eucluoft).
Heiberg's Latin is a nineteenth-century translation, not an ancient Latin text.

| Printed page | PDF page | Content used                                                 |
| ------------ | -------: | ------------------------------------------------------------ |
| 240          |      254 | III.31's Greek opening statement, near the bottom            |
| 241          |      255 | Heiberg's Latin statement, below the preceding III.30 figure |

Full PDF: [source download](https://archive.org/download/euclidisoperaomn01eucluoft/euclidisoperaomn01eucluoft.pdf).
20,890,632 bytes; SHA-256
`da285c581c2dda86e2b25e20db3ce604bf6fb8765228fcd71cfc89d47a9d1c17`.
Render PDF pages 254 and 255 with Poppler's `pdftoppm`, maximum dimension
2200 pixels and JPEG quality 88. The complete pages remain uncropped, including
page numbers, preceding material and the critical apparatus. Their exact
hashes and 1400 by 2200 dimensions are recorded in `src/fluting-content.ts`.

The first three comparisons are transcribed through the lesser segment's
angle being greater than right. Printed line breaks and line-end hyphenation
are removed; printed theta is normalized to modern theta. The later clause
about the angle OF a segment remains visible in both facsimiles but is not
silently merged into the straight-chord angle statement. The English is new.

## What the language distinguishes

- `ἐν τῷ μείζονι τμήματι`: in the larger circular region. The dative follows
  `ἐν`; `τμῆμα` becomes `τμήματι`. This is a region bounded by an arc and a
  chord, not just the line segment A-B.
- `ἐλάττων ὀρθῆς`: less than a right angle. The adjective describes the
  understood `γωνία`; the comparison takes a genitive.
- `minor recto`: Heiberg makes the corresponding Latin comparison with the
  ablative. `positus` agrees with masculine `angulus`.

The later `τοῦ… τμήματος γωνία` / `angulus segmenti` refers to an angle OF a
segment. Compare [definitions III.6-8](https://www.euclids-elements.org/elements/books/bookIII/definitions/defIII7/):
the angle of a segment uses a curved boundary; the angle in it is formed by two
straight chords. Our numeric angles are the latter. The Latin page's upper
figure belongs to III.30 and is not the workshop's new paired diagram.

## The modern calculation

For P on the cut's arc, join the centre C to A, P and B. Equal radii give two
isosceles triangles. If the cut's central arc is phi, their two base angles
at P sum to `180 - phi/2`: 135 degrees for the quarter circle, 90 for the
semicircle. Moving P redistributes those two base angles without changing
their sum.

Q lies on the complementary arc. A, P, B and Q form a cyclic quadrilateral,
so the opposite angles add to two right angles
([Euclid III.22, Greek and translation](https://www.claymath.org/library/historical/euclid/files/elem.3.22.html)).
That gives 45 and 90 degrees respectively at Q.

Orange marks the arc facing each point. A 270-degree label describes the
extent of an arc in modern degree notation; it does not attribute an ordinary
reflex central angle to Euclid. III.31 supplies the right/less/greater
classification, not these model widths or a second carving prescription.

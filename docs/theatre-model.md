# Twelve points. Two theatres.

This room reads Vitruvius V.6.1–3 and V.7.1–2 as instructions for an ideal
plan, not as a reconstruction of a particular theatre. The seventh room extends
Gonia’s measured architectural experiments beyond temple columns.

The text supplies four equilateral triangles for the Latin theatre, and three
squares for the Greek one. Both yield twelve equally spaced vertices, but the
polygons do different work. The Roman triangle's near side fixes the scaena
front; a parallel through the centre fixes the stage's front. In the Greek
description the square's near side fixes the stage front and a parallel tangent
fixes the scaena front. The Greek orchestra continues beyond the semicircle
using two arcs centred at the opposite ends of its diameter.

## Model coordinates

The initial circle has centre O=(0,0), radius R. Positive y points toward the
seating. The stages lie below the horizontal diameter. A modern diameter in
metres scales the construction; it is neither an ancient foot conversion nor
a measured building. The main drawing rescales to keep the same legible size.

| Quantity       | Roman scheme       | Greek scheme                      |
| -------------- | ------------------ | --------------------------------- |
| Vertex angles  | 0 + 30k degrees    | 15 + 30k degrees                  |
| Stage front y  | 0                  | -R/sqrt(2)                        |
| Scaena front y | -R/2               | -R                                |
| Stage depth    | R/2                | R(1-1/sqrt(2))                    |
| Lower outline  | None: a semicircle | Opposite-centre arcs of radius 2R |

Below y=0, the Greek left boundary has centre (R,0), so
`x = R - sqrt(4R^2-y^2)`. The right boundary is its reflection. The arcs meet
the upper semicircle tangentially at (-R,0) and (R,0); their curvatures differ.
The constructed area ends at the stage-front line. It excludes any intruding
seats, stairs, altar or doorway treatment. It predicts no audience capacity,
acoustic quality or structural strength.

The optional single-circle shortcut keeps the Greek stage lines but continues
the original circle. It is explicitly a learner's alteration, not a second
reading of Vitruvius's three-centre command. At the stage front its clear width
is sqrt(2)R; the three-centre width is (sqrt(14)-2)R. The two small side strips
are easy to overlook. A movable cross-section shows their changing width.

Areas are computed analytically. An independent numerical integration of
horizontal widths verifies them. Browser sampling checks the drawn outline. No ancient
area calculation is attributed to the author. The outer seating band is a
chosen illustration; this passage does not determine its total extent. The
Greek stair directions at the twelve square vertices are guides, not counts
of every stair in a preserved theatre.

## Printed evidence and reading decisions

Latin is transcribed from F. Krohn's 1912 edition, printed pp. 106–110
(PDF pages 124–128), Internet Archive `vitruviidearchit00vitr_1`. All five
complete pages include their apparatus. Angle brackets in the selected Latin
preserve editorial supplements; English translations and grammar notes are new.
Greek headwords are vocabulary, not a fabricated Greek original of the Latin.

Two public-domain later interpretations accompany the text: W. M. Leake,
_Journal of a Tour in Asia Minor_ (1824), p. 324, Greek orchestra diagram;
and the Roman plan in M. H. Morgan's _Vitruvius: The Ten Books on Architecture_
(1914), p. 147, illustrations prepared under H. L. Warren. These are modern
diagrams of the prescription. They are not ancient surviving plans or measured
excavation surveys. Their letter labels are retained in the source images;
the interactive diagram uses its own O/L/R and numbered vertices.

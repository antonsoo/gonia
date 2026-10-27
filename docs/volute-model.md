# The compass changes centre

The Ionic volute desk operates a specific later drawing instruction, and asks
a geometric question its appearance can conceal: when two circular arcs meet,
do they also share a tangent?

Start locally with `npm ci && npm run dev`, then open
`http://127.0.0.1:4328/gonia/volute.html`. The root workshop and the fluting room
both link to **Ionic volute**. Build with `npm run build`; output is `dist/`.
The recorded review uses a production preview on port 4437.

## Which source does what?

| Source                                                                      | Retained evidence                | What it supports                                                                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitruvius III.5.5–7; Krohn 1912 p. 71, PDF 89                               | Whole Latin page and apparatus   | Abacus/volute division, eye position and diameter, quadrant reduction; visible editorial supplies and variants                                      |
| Vitruvius III.5.7–8; Krohn p. 72, PDF 90                                    | Whole Latin page and apparatus   | The promise of a figure and calculation at the book's end                                                                                           |
| Juglaris & Locke, _The Five Orders of Architecture_, 1889, plate XV, PDF 68 | Whole signed plate               | Twelve numbered centres; enlarged eye; later interpretation of a capital's scroll                                                                   |
| Same volume, explanation of XV, PDF 69                                      | Whole English page               | Eye diameter two parts; named axis distances 9, 8, 7, 6; successive quarters and thirds of the half diagonal                                        |
| Same volume, plate XIV, PDF 64                                              | Whole plate                      | The later book's complete Ionic capital and its parts                                                                                               |
| Same volume, title page, PDF 5                                              | Whole title page                 | Actual edition, translators and date; this is not a scan of a 1562 original                                                                         |
| The Met 26.59.1, object 252453; DP144130                                    | Byte-identical museum photograph | A Greek Ionic capital from Sardis, dated ca. 300 BCE; comparison with an actual object, with restoration and original-position uncertainty retained |

Original PDFs:
[Krohn](https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf),
[Juglaris & Locke](https://archive.org/download/fiveordersofarch00vign/fiveordersofarch00vign.pdf).
The two PDF hashes, derived page hashes, image dimensions and local font/license
identities are in [the retained manifest](../public/sources/volute/manifest.json).
Six whole PDF pages were rendered at longest side 2200 px, JPEG quality 88,
with Poppler. No cropping or reconstruction. The [museum photograph](https://images.metmuseum.org/CRDImages/gr/original/DP144130.jpg)
is retained without resizing or retouching. Its [object record](https://www.metmuseum.org/art/collection/search/252453),
[API record](https://collectionapi.metmuseum.org/public/collection/v1/objects/252453)
and [Open Access policy](https://www.metmuseum.org/policies/image-resources)
identify the object and CC0 image. Gift of The American Society for the
Excavation of Sardis, 1926. The display omits most of the shaft; parts of the
shaft are restored and the profiled base below the torus is a copy. The museum
does not establish one certain original position for the capital. Our curve is
not fitted to this photograph.

## The ancient and later constructions remain separate

Vitruvius assigns eight parts to the volutes, places the eye 4.5 parts below
the abacus and 3.5 above the lower end, and gives it a one-part diameter. He
describes a half-eye reduction in quadrant operations. He then promises a
figure and account; that ancient figure is not preserved with this passage.
The desk does not identify the 1889 plate with that missing figure.

Krohn's Latin has visible textual decisions. We retain his supplied
`<conlocetur>` and `<schema volutae>` as angle-bracketed words in the displayed
Latin. The close English of the reduction clause follows his edited
`qui subest, conveniat`, rather than importing Morgan's different ending into
the same Latin. The whole apparatus remains inspectable. English and grammar
notes are new. Greek headwords explain borrowings; they are not a Greek text
of this passage.

For a research account of different later constructions, see Maria Losito's
[2012 notice on Goldmann's 1649 volute](https://architectura.univ-tours.fr/en/livres-notice/goldman1649c490/).
The notice makes clear that later authors made different choices about centre
positions and joins. This desk implements its stated interpretation of the
1889 plate; it does not implement Goldmann's design or judge every Renaissance
construction from one example.

## Exact quarter circles

Let `e` be the eye diameter. Store coordinates as integer twelfths of `e`.
The eye centre is `(0,0)`, its radius is `6`, and the initial point is `(0,54)`.
The plate's diamond and side-bisecting lines locate the first square's centres
at `(+-3,+-3)`. Moving one third of the half diagonal inward gives the square
at `(+-2,+-2)`; the last square is `(+-1,+-1)`.

For each selected centre `C`, draw the clockwise 90-degree circular arc from
the current point `P` to `Q`:

```text
Q.x = C.x + (P.y - C.y)
Q.y = C.y - (P.x - C.x)
r^2 = (P.x - C.x)^2 + (P.y - C.y)^2
```

Coordinates and squared radii remain exact integers for every allowed twelve-pin
sequence. Only square roots and trigonometric values need floating point. The
rendered path is an SVG circular arc; it is not a sampled spline or logarithmic
spiral. Its preview is uncommitted. Each learner command records the actual pin
chosen, including repeated pins.

The printed order has these endpoints. This table uses twelfths of `e`, not
millimetres:

| Arc / pin | Centre x | Centre y | End x | End y | Squared radius |
| --------- | -------: | -------: | ----: | ----: | -------------: |
| 1         |       -3 |        3 |    48 |     0 |           2610 |
| 2         |        3 |        3 |     0 |   -42 |           2034 |
| 3         |        3 |       -3 |   -36 |     0 |           1530 |
| 4         |       -3 |       -3 |     0 |    30 |           1098 |
| 5         |       -2 |        2 |    26 |     0 |            788 |
| 6         |        2 |        2 |     0 |   -22 |            580 |
| 7         |        2 |       -2 |   -18 |     0 |            404 |
| 8         |       -2 |       -2 |     0 |    14 |            260 |
| 9         |       -1 |        1 |    12 |     0 |            170 |
| 10        |        1 |        1 |     0 |   -10 |            122 |
| 11        |        1 |       -1 |    -8 |     0 |             82 |
| 12        |       -1 |       -1 |     0 |     6 |             50 |

The first four axis distances are the guide's 8, 7, 6 and 5 parts, where the
eye diameter is two parts. The last point is exactly on the eye circle.
These axis distances are not the compass radii: the first radius is
`sqrt(2610)/12 e`, about `4.257347 e`, not `4.5 e`.

## Contact and direction

At a join `J`, compare `u = J - C_before` with `v = J - C_after`. Rotating both
radius vectors by the same 90 degrees gives their clockwise tangent
directions. Thus their angle difference is:

```text
angle = atan2(abs(u.x*v.y - u.y*v.x), u.x*v.x + u.y*v.y)
```

For two nonzero radii, a zero cross product and positive dot product establish
the same oriented tangent. A zero-radius arc has no tangent; the desk says so.
It does not assign it a fabricated zero-degree success.

At the first join the integer cross and dot products are `-18` and `2304`,
so the angle is `atan(1/128)`, about 0.447614 degrees. At the final eye contact
they are `6` and `42`, so the direction difference is `atan(1/7)`, about
8.130102 degrees. These are properties of our exact interpretation. The
scan's line cannot prove accuracy to six decimal places, and this computation
is not evidence of tool marks or angular defects on an ancient stone.

The small direction drawing rotates the arriving tangent to horizontal and
rotates the other by exactly the same amount. Angles are not enlarged.

## One local intervention

Project the next centre onto the incoming radius line:

```text
t = dot(C_after - C_before, u) / dot(u,u)
C_new = C_before + t*u
```

When `t < 1`, this gives the same oriented radius at `J`. A new clockwise
quarter circle then has a different endpoint. The green overlay shows that
consequence, while the committed curves, CSV and physical outline remain the
learner's actual quarter-circle sequence. A projection at or beyond `J` would
erase or reverse the radius; that intervention is unavailable. The fixed eye
circle cannot be moved as though it were another drawing pin.

This local experiment is not a whole-spiral solution or a historical
restoration. Changing one constraint can disturb another. Only the outer curve
is operated: the inner fillet, complete capital, carving and structural loads
are outside this model.

## Keep and reproduce an experiment

| Artifact         | Retained content                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON             | Versioned actual pin sequence, selected pin/join, local intervention, print scale and source selection; reopening validates before changing the sheet                         |
| CSV              | Integer coordinates, exact squared radii and cross/dot products, rounded floating values and scope                                                                            |
| Physical SVG     | Committed outline, twelve pin marks, physical millimetre dimensions, embedded font/license and 50 mm calibration bar                                                          |
| Script-free HTML | Drawing/inspection, readings, word notes, six whole source pages, the whole museum photograph, three fonts, full licenses and embedded native JSON/CSV/SVG/manifest downloads |
| PDF example      | An actual Chromium print of the downloaded HTML; raster source dimensions remain independently checkable                                                                      |

The SVG's eye diameter is a chosen 6–18 mm. It has physical dimensions, rather
than a pixel width that happens to look right on screen. Normal sequences fit
A4. The sheet grows for an unusually wide drawing and states its dimensions.
Print at actual size and verify the bar before using it as a template.

Image, font and license requests must match their manifest byte counts and
SHA-256 identities before source display or portable export. A failed request
can be retried. Selection tokens prevent a late image from replacing a newer
source choice. Export snapshots the settings before awaiting assets.

Offline readiness uses the existing complete-edition service worker, including
the new HTML entry, scripts and all source assets. An ordinary online first
view is not itself a claim that the complete edition is saved.

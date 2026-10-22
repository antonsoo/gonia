# Two angles from the same chord

## What can be learned

A chord bounds two circular regions. In the Doric construction circle, P on
the hollow's quarter arc makes 135 degrees; Q on the complementary arc makes
45. Green identifies the region containing each point. Orange identifies
the arc facing it. Both points move while the chord remains fixed. In the
Ionic circle, both regions are semicircles and both angles remain right.
The physical 100 mm groove comparison remains 20.710678 mm deep for the Doric
compass construction and 50 mm for the Ionic semicircle; the original
[carving review](fluting-review.md) explains that model and its source limits.

Two radius triangles split P's angle into changing base angles. Their total
is `180 - phi/2`. The cyclic quadrilateral A-P-B-Q then gives Q as the
supplement of P (Euclid III.22). The 270-degree annotation measures the facing
arc; it does not attribute an ordinary reflex central angle to Euclid.

Read III.31's Greek beside Heiberg's explicitly modern Latin translation,
with new English and grammar. The larger circular segment contains the smaller
straight-chord angle. The complete pages also contain the later angle OF a
segment statement; the lesson distinguishes that curved-boundary notion from
the angle IN a segment. [Sources and transcription](segments-sources.md).
This is a teaching connection between texts, not evidence for a mason's method.

## Model and actual diagrams

The pure model rotates to a point on each arc and measures each angle using
cross and dot products. The separate Python oracle rotates the source chord's
starting vector, uses the cosine law for angles and triangle base angles,
checks both points on the same circle, and checks the opposite-angle total.
It imports no application functions.

The current core check covers 728 width/recipe/point combinations and one
364-row CSV: 19,180 comparisons, with raw numerical error below 2.6e-14
relative to max(1, reference magnitude). It also parses actual SVG circles, ray endpoints, green-region
arc flags and orange-facing-arc flags. Coordinates are checked separately
from the rounded text. The [core receipt](segments-geometry.json) records those checks.
The [clean-build browser record](segments-browser.json) covers 48 actual SVG
views; [the independent browser oracle](segments-rendered-geometry.json)
checks 2,912 downloaded rows and 16,000 coordinates, angles and arc properties.
The four configurations use Chromium and Firefox at 1440 and 375 px. Native
keyboard ranges, linked controls, back/forward, real Chromium clipboard
read-back, denied-clipboard link reopening, no-circle flat behavior, source
images and native offline files passed. No page errors, document overflow or
WCAG A/AA axe violations were observed.

The [original carving workflows](segments-fluting-browser.json) and their
[independent calculation](segments-fluting-geometry.json) were rerun with all
five source pages and all four offline rooms, including origin-socket refusal,
substituted-image export rejection and held export snapshots. The
[development review](segments-development.json) confirms the actual Vite
preview styles and new comparison at both widths and in both engines.

The existing six shared settings remain the state. A second native point
slider controls the same point fraction, and the circle buttons update the
main recipe. Browser history restores both. The comparison's copy action
preserves its source-study fragment. A denied clipboard API exposes a real
copyable link. A flat face has no invented construction circle.

The new CSV has both P and Q at 5-95% of each arc in both circular recipes:
364 rows. A=(0,0), B=(width,0), with positive y directed into the hollow;
Q lies at negative y on the other arc. Rows give millimetre coordinates,
the measured angle, facing arc extent
and containing arc extent. The original carving-coordinate CSV and physical
SVG template remain separate exports.

## Native reading and reproduction

The illustrated reading contains both new diagrams, the calculation, Greek,
Latin, all five full source JPEGs, both local fonts and full OFL notices.
Its comparison CSV is a working data download in the native file, alongside
the original carving CSV and millimetre SVG. Earlier carving-only examples
are retained with their original review; this edition gets separate artifacts.
The [HTML](../examples/segment-reading.html) is 4,766,494 bytes. Its
[nine-page PDF](../examples/segment-reading.pdf) retains the five unchanged
JPEG streams and extractable Greek/Latin. The [print receipt](segments-print.json)
also keeps the physical template's measured 24.999824 mm calibration bar;
physical printer scaling is unverified. The original SVG template is unchanged.

A new staged-tree archive received `npm ci`, full checks and the production
browser review. Its [38-file build](segments-clean-verification.json) is
byte-identical at two distinct roots. No previous node_modules were reused.
Source PDF and full-page identities are in the source note and
[the source receipt](segments-source-verification.json).

```sh
npm ci
npm run check
npm run verify:segments
npm run preview
# In another terminal:
npm run test:segments -- http://127.0.0.1:4328/gonia/ /tmp/gonia-segments-review
python3 scripts/segments-oracle.py /tmp/gonia-segments-review/browser.json
```

The browser reviewer uses Chromium and Firefox at 1440 and 375 px. Publication
claims require exact current public bytes and a separate public-browser run;
local build success alone does not establish either.

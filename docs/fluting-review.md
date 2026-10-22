# Flute carving: reviewed geometry and reading

## What can be learned

A compass at the centre of Vitruvius's Doric square gives a quarter-circle
hollow. A fixed right-angle tool cannot simultaneously touch that hollow
and both edges. At the same width, his Ionic moving-square test is consistent
with a semicircle. The edge rays remain 135 and 90 degrees respectively as
P moves; these are different angles from the Doric circle's 90-degree central
arc. At 100 mm width, the Doric depth is 20.710678 mm and the midpoint tool
contact falls 41.421356 mm short of B along the chord. The semicircle is 50 mm
deep and the tool fits both edges.

The fourth workshop repeats the actual concave arcs around 20 or 24 divisions,
with explicit modern Ionic fillets. It holds the groove chord fixed, so shaft
diameter changes. A flat twenty-sided alternative also removes area outside
its chords, despite having zero hollow depth. Area removed is a geometric
comparison, not a prediction of load capacity or visual perception.

The Latin pages retain the apparatus and the supplied `〈angulos〉`, credited
to Jocundus. Aristotle's own Greek provides the noun for fluting and the nested
phrase `τῆς (τοῦ κίονος) ῥαβδώσεως`. His context contrasts building activities;
it does not prescribe either curve. See [source identities](fluting-sources.md).

## Independent calculations and real browser work

- [Core geometry](fluting-geometry.json): 336 combinations, 350,464 comparisons.
  The independent Python program rotates the circle's starting vector, uses
  the law of cosines for the edge angle, intersects a perpendicular line with
  the chord, and integrates the complete section boundary using Green's
  theorem. It does not import application geometry or repeat its circular-cap
  area calculation. Raw calculation error stayed below 7e-13 relative to a
  denominator of max(1, reference magnitude). SVG command rounding is reported
  separately with its own tolerance.
- [Production browser record](fluting-browser.json) and
  [rendered geometry](fluting-rendered-geometry.json): Chromium and Firefox at
  1440 and 375 px; 28 recorded actual views and 13,808 CSV rows. The oracle
  checks the literal arc radii, flags and endpoints, all exported section
  coordinates, the visible point and rounded readouts. It checks equal SVG
  scales and avoids accepting an outward bulge as a concave flute.
- Keyboard ranges, actual pointer dragging, recipe and fillet changes,
  comparison overlays, browser back/forward, all three full
  source images, and real file downloads passed. No document overflow,
  page errors or WCAG A/AA axe violations were observed in those four runs.
- Networking was disabled and the local origin's sockets were also refused.
  All four rooms loaded and worked. Saved native HTML files decoded all three
  source images and their Greek fonts, followed the internal Greek source
  link, and downloaded CSV bytes identical to the live workshop's export.
- Substituting a source image while returning HTTP 200 refused the illustrated
  export. Correct bytes restored it. A source response held across a control
  change produced the original click-time view. Duplicate query parameters
  reset the whole shared view, with a visible explanation.

The browser record stores portable basenames for the generated artifacts.
Rerun the script into a chosen directory and pass its raw `browser.json` to
`fluting-oracle.py`; the script's live receipt contains their actual paths.

## Paper and saved reading

[The standalone SVG](../examples/fluting-doric-100mm.svg) uses a 190 by 277 mm
viewport, a true 100 mm groove chord and a 25 mm calibration bar. It prints
source references and the modern-scale qualification inside the file.
The browser also exports the current recipe and width, including a 120 mm
Ionic example reviewed in the native PDF check.

[Print inspection](fluting-print.json) measures the actual vector bar at
24.999824 mm in Chromium's PDF. Its paper rectangle rounds to approximately
190.161 by 276.945 mm; that browser page-size rounding is recorded rather
than presented as exact. This does not establish physical printer scaling.
The user should print at actual size and measure the bar.

The [saved illustrated reading](../examples/fluting-reading.html) embeds
three complete source JPEGs, both fonts and their full OFL notices, the two
diagrams, new English, Latin grammar, Greek and working CSV/SVG downloads.
Its PDF retains the exact three JPEG byte streams and extractable Greek and
Latin. Images and PDFs were inspected visually, including the page numbers,
apparatus and Greek clause. The source material is not generated imagery.

## Reproduce

```sh
npm ci
npm run check
npm run verify:fluting
node scripts/fluting-browser.mjs /tmp/gonia-fluting-review
python3 scripts/fluting-oracle.py /tmp/gonia-fluting-review/browser.json
uv run scripts/fluting-print-review.py /tmp/gonia-fluting-review
```

The last command is optional and installs the declared PyMuPDF version into
uv's environment. The app has no runtime dependencies. A [clean installation receipt](fluting-clean-verification.json) records a new
staged-tree archive, npm ci, full checks and all four browser workflows. The
36-file build is byte-identical at two distinct filesystem roots. Public-origin
evidence is recorded after deployment.
Previous corner, spacing and entasis browser workflows were rerun in all four
configurations; their independent numerical checks passed.

## Publication and cache replacement

Source `314e600cb21d2846acde83ab833288e2a719b680` introduced the fourth room.
Pages commit `c0e797d` published it while preserving earlier hashed assets for
readers with a cached entry page. The [initial canonical-byte receipt](fluting-initial-hosted-bytes.json)
matched all 36 build files. The [actual public workflows](fluting-initial-hosted-browser.json)
and [public geometry](fluting-initial-hosted-geometry.json) passed in both
engines and widths, including native saved files and all four offline routes.
Browser networking was disabled for those public offline checks; the public
origin itself remained running.

The [controlled upgrade record](fluting-controlled-upgrade.json) serves the
exact previously published three-room Pages tree `42a2ba5`, then the initial
four-room production build on the same local origin. In both engines, holding
one new source response or substituting its bytes with HTTP 200 kept the old
three-room cache usable with the origin unavailable. Correct complete bytes
then installed all four rooms. These are two-edition production-server
experiments, not a claim about old public tabs surviving that deployment.

During final review, [the public cache reproduction](fluting-cache-before.json)
showed that an ordinary font request recreated a manually deleted cache as an
empty cache. Both fetch branches now use read-only `caches.match` with the
edition's cache name; only installation opens a cache. The
[local reproduction after the fix](fluting-cache-after-local.json) leaves the
cache absent, while the font still loads online. The
[cache-fix browser workflows](fluting-cache-fix-browser.json) and their
[geometry checks](fluting-cache-fix-geometry.json) retain all four offline
rooms and exports. The saved reading's bytes are unchanged.

The public replacement is Pages commit `a900f8d`, built from source `8d17755`.
The [canonical public byte check](fluting-hosted-bytes.json) matches all 36
files. The [public cache reproduction after the fix](fluting-cache-after-hosted.json)
leaves the deleted cache absent in both engines.

The [actual public-tab transition](fluting-hosted-upgrade.json) held the first
four-room edition open in Chromium and Firefox at 375 px while the cache fix
was published. Each old page rejected the new edition's readiness until a
reload. The new cache held exactly the 35 listed resources (the worker itself
is the 36th build file), with the previous cache absent. With browser networking
disabled, all four rooms loaded; the Ionic gauge fitted and the Greek page
decoded. This is an actual public four-room-to-four-room upgrade. The separate
three-room-to-four-room experiment above uses a controlled local server.

The [final public workflows](fluting-hosted-browser.json) and [their independent geometry check](fluting-hosted-geometry.json) repeat all four browser configurations against the replacement build, including 28 actual downloads and 13,808 independently checked CSV rows. The final hosted reading remains byte-identical to the reviewed example.

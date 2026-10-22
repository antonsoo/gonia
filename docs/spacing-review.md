# Column-spacing workshop review

Runtime revision: `43855af0393bb72341ec2b6a128d61a6f4e31891`.
Reviewed on 2026-10-21 (Pacific time). Publication evidence is recorded
separately in `spacing-publication.json` and `spacing-hosted.json` when available.

## The lesson

Five spacing systems follow Vitruvius III.3.2–10, with four/six/eight-column
fronts and two different constraints: hold the front width or hold the lower
column diameter. Eustyle spacing supplies the central experiment. Removing
its extra 0.75-diameter central allowance increases diameter at fixed front;
it decreases the front at fixed diameter. Both the shared link and saved
document retain the deliberate alteration.

Krohn's printed pp. 64–67 were read directly. The source distinguishes clear
gaps from shaft widths; III.3.10 explicitly gives eustyle height as nine and a
half diameters. The araeostyle passage supplies no numerical gap. Its slider
therefore remains a labeled modern illustration. The model precedes the later
corner-thickening rule and does not reconstruct a named temple or calculate
beam strength. Source details and exact scan hashes are in `THIRD_PARTY.md`.

## Independent measurements

The Python oracle imports no application code. It solves simultaneous equations
for the column axes, diameter and height over exact rational numbers, then
measures gaps between the solved positions. It also checks the three eustyle
front totals printed in III.3.7: 11.5, 18 and 24.5 diameters.

| Check                 | Cases | Comparisons | Largest absolute difference |
| --------------------- | ----: | ----------: | --------------------------: |
| Core geometry         |   144 |       2,160 |   `7.105427357601002e-15 m` |
| Rendered SVG geometry |   132 |       1,064 |   `1.9245319506921987e-6 m` |

The browser receipt reads circle coordinates from the actual SVG and shaft
height through `getBBox()`. Parsed coordinates and core results retain a
`1e-11 m` tolerance. Only the single-precision SVG height measurement uses
`1e-5 m`; it must not be confused with the precision of the source model.
Receipts: `spacing-geometry.json`, `spacing-rendered-geometry.json`.

## Real workflows

`scripts/spacing-browser.mjs` exercises Chromium 153.0.8010.12 and Firefox 153.0
at 1440 and 375 pixels. For each it changes all five systems, all three column
counts and both scale constraints through native controls. It also checks all
five dimension labels, the altered central gap, an extreme wide front, shared
state, focus after source jumps, all four decoded source images, and saved
HTML files. Four accessibility states per configuration have no axe WCAG
2/2.1/2.2 AA findings. There is no page overflow or external runtime request.

Disabling the real HTTP server's sockets establishes that reload, navigation
between both workshops, source reading and HTML export work from the saved
edition. Offline and online default exports are byte-identical. All four JPEGs
inside each export match their original bytes. Substituting another valid page
image rejects the export and produces a visible failed-offline-install status;
it does not leave the initial download indicator spinning indefinitely.

The existing Doric workshop's controls, terms, source PDF, exports and offline
reload passed its four browser configurations at `dab532f`. Subsequent runtime
changes only refined the spacing reading's print CSS. See
`spacing-corner-regression.json`. The published check exercises navigation
through both entry points again.

Eight development-server checks cover both entry points, both browsers and
both sizes, including styles, fonts, overflow, CSP errors and actual SVG
favicon responses. This caught and corrected Vite's duplicated base prefix
in the development favicon URL. See `spacing-development.json`.

## Saved reading and reproducibility

The retained altered example is a six-page A4 PDF: two pages of geometry,
comparison, Latin/English and Greek vocabulary, followed by four complete
source pages. The Latin stays with its translation; source introductions stay
with the first scan. Desktop and phone drawings were visually inspected, as
were all source pages and the PDF layout. The HTML contains no external
runtime dependencies and embeds all four source images.
- `examples/eustyle-reading.html`: prescribed six-column eustyle arrangement.
- `examples/eustyle-altered-reading.html`: equalized centre at a 1 m diameter.
- `examples/eustyle-altered-reading.pdf`: printed altered reading.
- `docs/assets/spacing-1440.png`, `spacing-375.png`: actual workshop screenshots.

A clean source archive was installed with `npm ci --no-audit` after the registry
audit request stalled in the first install attempt. No dependency was changed
to bypass an installation problem. Formatting, TypeScript, seven focused checks,
production build and both independent geometry oracles passed. The final two
print-only changes were overlaid from the committed archive and the build and
complete spacing browser review rerun. `spacing-build.json` records every
produced file's hash. These results establish the measured model and browser
behavior, not the historical use of any chosen dimensions.

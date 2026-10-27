# Local review: the Ionic volute compass desk

The desk is complete in this checkout. Choose twelve actual compass pins,
inspect where circular arcs meet without sharing a tangent, and test the
consequence of aligning one next centre. The learner's sequence, rather than a
success animation, determines the curve and its endpoint.

Start with `npm ci && npm run dev`, then open
`http://127.0.0.1:4328/gonia/volute.html`. The root workshop and the fluting room
both provide **Ionic volute** links. `npm run build` produces `dist/`.

## What the learner can do

Choose and record compass centres, keep deliberate wrong turns, undo an arc,
compare endpoint contact with a shared tangent, and inspect a surviving capital
without claiming the model fits it. Five Latin readings and complete source
pages connect the experiment to its two distinct textual traditions.

## Evidence boundaries

This records the original **local** source/build/browser review. No source push,
tag, package release or deployment was performed during that review. No hosted-byte comparison or remote CI
success is claimed. `HOUSE_STANDARDS.md` reserves publication for the
coordinator. Existing public Gonia pages and this new local room were separate
publication claims. The later [publication record](volute-publication.md) records
the owner-authorized push and public verification.

The [source and geometry account](volute-model.md) separates the ancient Latin,
Krohn's textual decisions, the 1889 drawing guide, our ideal circular arcs and
the surviving museum object. It also records the source URLs and image
derivation. The [design account](volute-design.md) explains the operable eye and
the choice to record actual drawing actions.

| Work                               | Revision / scope                                                            |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Feature                            | `4129805`                                                                   |
| Clean-install archive              | `b03df96`; product source and build inputs match the final reviewed edition |
| Copy/portable-link browser harness | `b2d23e7`                                                                   |
| Upgrade baseline                   | `3977841`, built from an independent archive of the previous commit         |
| New offline edition                | `1023ec1fe598f072a97f54d79ffb5170cd628a45d28878298b27eff295b2ef59`          |

## What was exercised

| Workflow                                                     | Chromium 1440 | Chromium 375 | Firefox 1440                            | Firefox 375                             |
| ------------------------------------------------------------ | ------------- | ------------ | --------------------------------------- | --------------------------------------- |
| Root navigation to the compass desk                          | Passed        | Passed       | Passed                                  | Passed                                  |
| Twelve pin/arc commands using a keyboard                     | Passed        | Passed       | Passed                                  | Passed                                  |
| Deliberate repeated pin, undo and native JSON reopen         | Passed        | Passed       | Passed                                  | Passed                                  |
| Local tangent alignment preserves the committed outline      | Passed        | Passed       | Passed                                  | Passed                                  |
| Copy action leaves the address unchanged                     | Passed        | Passed       | Passed                                  | Passed                                  |
| Actual clipboard text matches the portable link              | Passed        | Passed       | Not read through browser permission API | Not read through browser permission API |
| Six printed pages and whole museum photograph                | Passed        | Passed       | Passed                                  | Passed                                  |
| Enlarged source, horizontal/vertical arrow-key panning       | Passed        | Passed       | Passed                                  | Passed                                  |
| JSON, CSV, physical SVG and illustrated HTML downloads       | Passed        | Passed       | Passed                                  | Passed                                  |
| Script-free HTML, embedded sources/fonts, zero HTTP requests | Passed        | Passed       | Passed                                  | Passed                                  |
| Native link from downloaded HTML reopens offline             | Passed        | Passed       | Passed                                  | Passed                                  |
| Complete worker edition, offline reload and HTML export      | Passed        | Passed       | Passed                                  | Passed                                  |
| Offline return to root and back to the new room              | Passed        | Passed       | Passed                                  | Passed                                  |
| Page errors / tested axe violations / document overflow      | 0 / 0 / none  | 0 / 0 / none | 0 / 0 / none                            | 0 / 0 / none                            |

The complete browser receipt is [browser.json](volute-review/browser.json).
An additional [navigation review](volute-review/navigation.json) follows the
root through the existing fluting room and its keyboard-operated link to the
new desk in Chromium and Firefox. It checks the actual exported SVG's physical
CSS dimensions too.
The tested axe tags are WCAG 2 A/AA and WCAG 2.1 AA; this automated result does
not establish a comprehensive accessibility audit. Four actual download sets
were independently inspected by [the artifact verifier](../scripts/volute-artifacts.py).

The production review served a fresh clean build on port 4441. A separate
375px [development check](volute-review/development.json) exercised the actual
Vite route, controls and verified source assets without warnings about public
JSON imports. Development reports itself as a preview, not an installed
offline edition.

## Numerical and artifact evidence

The [artifact receipt](volute-review/artifacts.json) checks actual downloaded
files against the retained manifest and independent circle invariants:
- The first turn reaches the guide's named axis points; the complete sequence
  ends at `(0,6)` in twelfths of the eye diameter.
- Every recorded start/end point has exactly the stated integer squared
  distance from its selected centre. The first join angle is independently
  `atan(1/128)`; the eye contact angle is `atan(1/7)`.
- Every saved HTML contains all seven source images byte for byte, three
  identified fonts, two full font licenses, the native JSON/CSV/SVG files and
  the source manifest. The offline export retains the same native state.
- SVG dimensions are physical millimetres. The exported radii match the
  chosen 15 mm eye diameter and the calibration path is exactly 50 SVG units
  on a millimetre-mapped view box. A real printer and paper were not measured.
- The actual Chromium PDF has 18 pages, no JavaScript, and retains all seven
  source images at their original raster dimensions, including the complete
  3738 × 3790 Met photograph.

Source selection was also reviewed outside the service worker: delay the first
Latin page, select the later plate, then release the earlier response. The late
page cannot replace the selected plate. A substituted source is rejected and
leaves no stale image displayed. A substituted font withholds the SVG export.
Restoring the expected bytes allows both operations to be retried.

## Replacement of an existing offline edition

[upgrade.json](volute-review/upgrade.json) records Chromium and Firefox using a
real previous-commit build, then switching the served directory to the new
build. The museum photograph was deliberately held during installation.

```text
previous edition: 123 cached files
        |
        v
new page loaded; photograph withheld
"Downloading the updated workshop & sources..."
        |
        v
photograph released; complete install and controller replacement
        |
        v
new edition: 134 cached files; previous cache removed
        |
        v
offline reload -> draw -> inspect photograph -> save SVG -> root -> new room
```

Readiness was withheld while the asset was held. Both browsers then removed
the previous cache, used the new page and photograph offline, downloaded the
physical sheet offline, and returned through the root navigation.

## Clean build and reproduction

An archive of `b03df96` received a fresh `npm ci`, then `npm run check` under
Node 24.21.0. Lint, strict typecheck, all 57 checks and production build passed.
This includes seven focused geometry/record cases. The build contains 135
files including the generated service worker; its 134 cached files include
the complete new room. [clean-build.json](volute-review/clean-build.json)
records versions and every build file's size and SHA-256 identity.

With the existing browser installations, run:

```sh
npm ci
npm run check
npm exec vite preview -- --host 127.0.0.1 --port 4437 --strictPort
```

In another terminal:

```sh
npm run test:volute -- http://127.0.0.1:4437/gonia/ /tmp/gonia-volute
npm run verify:volute-files -- /tmp/gonia-volute /tmp/gonia-volute/artifacts.json
node scripts/volute-upgrade.mjs PREVIOUS_DIST NEW_DIST /tmp/gonia-volute/upgrade.json
```

The artifact verifier uses Python's standard library and Poppler's `pdfinfo`,
`pdfimages` and `pdftotext`. It reads the actual browser downloads. The source
preparation script additionally needs Pillow and the identified original PDFs,
museum API JSON and original JPEG; its docstring names the expected files.
Normal learner use needs none of these preparation tools.

## Portable examples and visual review

[Printable reading](../examples/volute-reading.pdf) ·
[Complete illustrated reading, gzip](../examples/volute-reading.html.gz) ·
[Editable experiment](../examples/volute-experiment.json) ·
[Measurement CSV](../examples/volute-measurements.csv) ·
[Physical SVG](../examples/volute-compass.svg).
Decompress the HTML before opening it. The illustrated file includes all native
downloads and provenance, without scripts or remote asset requests.

Real reviewed screenshots:
[desktop](assets/volute-desktop.png), [mobile](assets/volute-mobile.png),
[portable reading](assets/volute-portable.png), and
[actual SVG sheet](assets/volute-template.png). The last screenshot renders the
unchanged SVG as an object in a plain local HTML viewing sheet.
The enlarged pin map stays usable at 375px; fine measurements also remain
ordinary text and a horizontally scrollable table. The selected centre's
compass legs correspond to its preview or committed arc. The tangent display
uses actual angles and oriented arrowheads. The first PDF pages and the whole
museum-photograph page were visually inspected; source images are uncropped,
and the measurement table repeats its header when it continues on a new page.

Known limits are in the model account: one exact interpretation of a later
guide, outer curve only, one local intervention, no inferred ancient tool
marks, and no survey fit to the museum capital. The finite printed drawing
cannot supply the precision of the modern calculation.

Suggested repository description: “Measured ancient architecture, with working
geometry, original-language readings and inspectable sources.” Topics:
`ancient-greek`, `architecture`, `vitruvius`, `geometry`, `education`, `offline`,
`ionic-order`.

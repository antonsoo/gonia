# Ionic volute: publication evidence

[Open the compass desk](https://antonsoo.github.io/gonia/volute.html).
The repository owner authorized publication. These observations were made on
2026-10-27 UTC, after the independent clean-build and local upgrade review.

| Surface                    | Observed result                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pushed source              | `7d5556de794f63814655e8f01eddbcd601ea8f80` on `main`. The feature is `4129805`; later commits retain browser tools, actual examples and the local review.                                                                                                                                                                                                              |
| Clean build                | The independently installed Node 24.21.0 build recorded in [the local review](volute-review.md#clean-build-and-reproduction) matches every current build path and byte.                                                                                                                                                                                                |
| Static publication         | Normal fast-forward `gh-pages` commit `f94883d`; the reviewed `dist/` was copied over the previous static branch.                                                                                                                                                                                                                                                      |
| Canonical public files     | All 135 build files and the canonical root/index responses match before and after the public browser review. [Before](volute-publication/hosted-before.json), [after](volute-publication/hosted-after.json).                                                                                                                                                           |
| Existing open tabs         | All 96 previously published paths outside the new build still return their previous bytes, including old hashed assets. [Retained-file comparison](volute-publication/retained-assets.json). This does not establish behavior of every possible old open tab.                                                                                                          |
| Public browser operation   | Chromium and Firefox, each at 1440 and 375 pixels: twelve keyboard-drawn arcs, wrong pin/undo/reopen, explicit copied link, tangent intervention, all six printed pages and the whole museum photograph. [Browser receipt](volute-publication/browser.json).                                                                                                           |
| Actual public downloads    | Four sets of JSON, CSV, physical SVG and script-free illustrated HTML pass the independent axis/circle and identity checks. All seven images, three fonts, two full licenses and the embedded native files match. The actual PDF has 18 pages and retains every source image at its original raster dimensions. [Artifact receipt](volute-publication/artifacts.json). |
| Offline public use         | Each browser installs the current 134-file cache, reopens the sequence through its actual downloaded HTML link with networking disabled, exports again and returns through root navigation. No readiness is inferred from registration alone.                                                                                                                          |
| Accessibility observations | No document overflow, application errors or violations under the exercised axe WCAG 2 A/AA and 2.1 AA tags in the four configurations. This is not a comprehensive accessibility audit.                                                                                                                                                                                |

The new offline edition is
`1023ec1fe598f072a97f54d79ffb5170cd628a45d28878298b27eff295b2ef59`.
The [local replacement review](volute-review.md#replacement-of-an-existing-offline-edition)
separately withholds a real asset during a previous-edition upgrade. Public
network-disabled operation and that controlled upgrade are distinct evidence.

No package or tag was published. These checks do not establish remote source-CI
success, physical printer calibration, the accuracy of the ancient capital's
construction, or a recovered ancient drawing. The source account distinguishes
Vitruvius, Krohn's editorial decisions, the 1889 compass guide and the museum
object. [Read the model and its limits](volute-model.md).

To repeat the public browser and actual-file review:

```sh
node scripts/volute-browser.mjs https://antonsoo.github.io/gonia/ OUTPUT
python3 scripts/volute-artifacts.py OUTPUT OUTPUT/artifacts.json
```

The canonical checker is retained in Officina as `scripts/verify-pages.mjs`;
pass the public base URL, Gonia's reviewed `dist/`, `--out RECEIPT` and an optional
retry window. It compares the responses at canonical URLs without cache-busting.

# Measured entasis, 2026-10-21

Runtime source: `0620fb7d1840871ae409bca7c62e31aaa32dd79f`.
Offline edition: `d0619e019ecbb29ed2ca362ac75aec0da0c6490df33cd907099603415f482252`.
This review concerns the three-workshop build. It does not certify an ancient
construction method or an optical explanation.

## What can be learned

Five corrected offsets from Penrose's 1888 p. 41 are drawn at equal horizontal
and vertical scales, then shown relative to the straight line joining their
endpoints. Horizontal enlargement is explicit and never changes the first
view. Both views retain the same vertical scale. The highlighted height links
keyboard control, drawing, source values, subtraction and table row.

Penrose's predictions are compared at those five stations. His circle's three
chosen points are not independent confirmations. The printed hyperbola row
also exposes a small discrepancy between his table and his prose. Six reported
maxima from p. 40 can be compared at actual size and after equalizing shaft
length. The table retains his separately rounded comparison values.

The Latin reading is Vitruvius III.3.13, Krohn (1912), p. 68. Six word notes
explain the Greek term and the Latin construction without inventing the lost
diagram or a numerical prescription.

## Sources and calculations

The four Penrose scans were retrieved from Heidelberg's public-domain IIIF
images and visually read against the tables and explanation. The fifth image
is the complete Krohn page rendered from the Archive scan. Full pages are
included; the reader initially centers the relevant passage but permits panning
through every margin and the critical apparatus. Enlarging the scan retains
the selected passage. Library provenance and exact file hashes are in
[THIRD_PARTY.md](../THIRD_PARTY.md) and [the build receipt](entasis-build.json).

The five stations are corrected axis-referenced offsets of one exterior flute
edge, not raw wire distances or the full width of a reconstructed column. A
straight guide between observations supplies no new observations. The largest
of these five departures (16.508 mm) is distinct from the separately reported
maximum (17.374 mm, rounded), at a different height. No statistical uncertainty
is supplied by the source.

An independent Python Decimal calculation transcribes the source rows directly,
without importing the application's data. It checks the subtractions,
normalization, CSV numbers, and 240 shared-state round trips: 412 checks. A
second pass compares actual browser SVG coordinates, predicted points, bar
lengths and equal view scales in 484 rendered views: 16,308 comparisons.
See `entasis-geometry.json` and `entasis-rendered-geometry.json`.

The dependency-free source-PDF generator preserves the five JPEG streams.
Extracting them again with `pdfimages -j` reproduced all five original file
hashes, so the packet does not silently downsample its evidence.

## Actual reading and offline use

`entasis-browser.json` covers Chromium 153.0.8010.12 and Firefox 155.0 at 1440
and 375 pixels. It exercises every measurement, enlargement, prediction and
unit choice, both maxima comparisons, native clipboard sharing, all five source
images, source focus during enlargement, CSV and standalone HTML downloads.
Automated accessibility audits report no violations in the reviewed states.
The retained desktop/phone screenshots and printed reading were visually
inspected. The eight-page reading includes two measured drawings, both tables,
the ancient passage and vocabulary, and all five complete scans.

The HTTP origin is actually disabled for offline navigation between all three
workshops, source reading and export. Saved HTML embeds the five original JPEGs
byte-for-byte. Fresh installations are separately held beyond the old eight-
second timeout and given a substituted valid JPEG; the latter is rejected by
integrity verification and can then be repaired.

`entasis-offline-before.json` records the reproduced old behavior: a completed
28-file cache still displayed “unavailable” after the delayed source arrived.
The shared status observer now follows installation and activation through the
controlling worker. It does not interrogate the superseded worker during an
update, and cache inspection cannot recreate a deleted old cache.

`entasis-upgrade.json` starts from the previously published two-workshop build.
In both engines, a held source leaves the old edition available; a substituted
source does not produce a false success; restoring the correct response reaches
the complete new edition. All three pages then work without the origin. These
are controlled local upgrade experiments, separate from the public-site check.

The mobile header now keeps every workshop link visible. A first-visit Firefox
source jump also loads its selected scan immediately before decoding; otherwise
the browser could reject decoding of the still-deferred lazy image and leave
the source table above the reader. The hosted workflow reproduces this first
visit before checking its center at both widths.

A further controlled upgrade exposed a completed replacement left waiting.
The observer now requests activation when a worker reaches the installed state
or is already waiting at registration. Integrity verification still precedes
that state; incomplete source packets remain rejected.

The existing spacing workshop passed all four browser configurations again
at the initial feature revision (`entasis-spacing-regression.json`). The corner review uses the current About
navigation anchor before continuing into the Latin reading: the old harness
still expected a removed Reading link. Its geometric, vocabulary, saved-document
and offline checks are otherwise unchanged (`entasis-corner-regression.json`). These two regression receipts precede the
mobile header and first-visit source fixes; the final entasis and public-site
checks cover navigation through the revised header.
Twelve development-server views cover all entry points, both widths and engines
(`entasis-development.json`).

## Clean build and reproducibility

A clean archive of the runtime revision was installed with ordinary `npm ci`
under Node 24.22.0. `npm run check`, `verify:geometry`, `verify:spacing`, and
`verify:entasis` passed. Its 29 produced files total 10,615,319 bytes and match
the browser-reviewed build byte-for-byte (`entasis-build.json`).

```sh
npm ci
npm run check
npm run verify:entasis
npm run test:entasis -- /tmp/gonia-entasis/browser.json
python3 scripts/entasis-oracle.py /tmp/gonia-entasis/browser.json
node scripts/entasis-upgrade.mjs /path/to/previous/dist /tmp/gonia-entasis/upgrade.json
node scripts/entasis-hosted.mjs https://antonsoo.github.io/gonia/ /tmp/gonia-entasis/hosted.json
```

The upgrade experiment requires the previously published artifact. The hosted
script checks a saved reading against `examples/entasis-circle-reading.html`,
source hashes, selected calculations, native controls and three offline pages.
Public bytes and browser results are recorded separately after publication.

## Public artifact

The reviewed runtime `0620fb7d1840871ae409bca7c62e31aaa32dd79f` was published
in Pages commit `42a2ba5`; source and evidence were pushed in `c0ed68e`.
The canonical root and every one of the 29 build files matched the clean build
by length and SHA-256 (`entasis-publication.json`). Earlier hashed assets remain
on the deployment branch for visitors who still have the prior entry page.

The actual public site passed the four Chromium/Firefox desktop/phone journeys
(`entasis-hosted.json`): shared calculation and landing, a byte-identical saved
reading, keyboard controls, first-visit source focus, all five source hashes,
and navigation through all three workshops with the browser network disabled.
These results do not claim that GitHub Actions executed the local checks.

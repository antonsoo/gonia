# Verification scope

The geometry oracle solves positional constraints with Python `Fraction` and
Gaussian elimination; it does not import the TypeScript formula. The report
in `geometry-review.json` covers every supported beam depth and treatment.
It verifies the idealized model, not the measurements of a real temple.

The browser harness serves the built artifact from its own local origin. It
uses Chromium and Firefox at 1440 and 375 pixels. It checks the shared-view
landing position, native keyboard slider endpoints, each treatment, all five
vocabulary entries, source-to-model buttons, preservation of geometry through
section navigation, downloadable HTML and Greek/Latin text. It runs axe on
five states per configuration.

For offline checks the harness destroys incoming origin sockets, reloads the
application, changes a parameter with the keyboard and fetches the cached
source PDF. The PDF hash must match the built source. This avoids treating
page-level network emulation as proof that a service worker made no network
requests. Exported HTML is opened as a local file and must make no external
requests. A Chromium PDF is also produced for visual and text inspection.

Real desktop and phone screenshots were visually inspected in both browsers.
The review corrected an overlapping plan annotation, moved the mobile
vocabulary tools after the drawing, and made the overflowing comparison table
keyboard focusable. Query parameters preserve geometry while fragments remain
available for section navigation.

Retained reports identify the exact build inputs and publication separately.
A local successful build, a browser review and a hosted byte match are
different claims. Automated accessibility results are bounded checks, not an
accessibility certification. Historical content still merits specialist review.

## Published review, 2026-10-21

The clean Node 24.22.0 build used source
`a44ee544f225a4f71b28a18795acf8b383ac936f`. Its
[build-input and file inventory](build-review.json) records 11 files totaling
817,395 bytes, including fonts and the scanned source. The
[browser report](browser-review.json) records all four desktop/phone and
Chromium/Firefox configurations, 20 accessibility-state checks, actual origin
failures during offline reloads, and exact cached source hashes.

The [publication receipt](publication.json) verifies the canonical hosted root
and every artifact file against those bytes. The initial Pages commit is
`b1eb659d9f1f3e9dd27b5c574e0042c0eec3d394`. The
[public browser journeys](hosted-review.json) independently exercise the shared
geometry, native controls, vocabulary and source buttons at the HTTPS site.
Each downloaded HTML study exactly matches the retained
[example](../examples/widened-metope.html).

The [desktop](assets/workshop-desktop.png) and [phone](assets/workshop-phone.png)
screenshots show actual browser output. The printed
[example PDF](../examples/widened-metope.pdf) was inspected visually and its
Greek vocabulary, Latin passage and numeric measurements checked with
`pdftotext`. The development quickstart was also opened in a browser and its
slider operated by keyboard.

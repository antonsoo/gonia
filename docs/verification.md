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

# Friction search: local review, 2026-11-04

The learner can now ask for the least friction admitted across every pressure
path, compare the joints with the complete arch and bases, draw either witness,
and test a failing lower coefficient. Two operated examples distinguish
joint-only equilibrium from base support and a fixed trial from a better path
made available by wider bases. Existing Latin readings and whole source pages
stay beside the explicitly modern model.

## Verification

| Command / workflow                                               | Local result                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                                         | Fresh install; zero audit vulnerabilities reported                                                                                                |
| `npm run check`                                                  | Lint, TypeScript and worker typechecks, 77 tests, production build passed                                                                         |
| `npm run verify:arch-friction`                                   | 50 geometries; 72 actual lower/upper brackets and 28 contact-geometry failures independently agreed; 344 LP optimizations                         |
| `npm run verify:arch`                                            | Existing 1,120 geometry/load cases and 4,480 LP optimizations passed; maximum thrust-endpoint difference about 7.82e-14 W                         |
| `npm run test:arch-friction -- http://127.0.0.1:4328/gonia/ ...` | Chromium and Firefox, each at 1440 and 375 px; both bounds, width exercise, keyboard, native files, standalone reading and offline exports passed |
| `node scripts/arch-browser.mjs http://127.0.0.1:4328/gonia/ ...` | Existing source, vocabulary, fourteen-joint, fifteen-room offline and stale-operation regression passed in both browsers and widths               |

[Threshold LP results](evidence/arch-friction-search/threshold-oracle.json),
[existing arch LP results](evidence/arch-friction-search/arch-oracle.json),
[search browser receipt](evidence/arch-friction-search/browser.json),
[full arch browser receipt](evidence/arch-friction-search/arch-browser.json), and
[example byte identities](evidence/arch-friction-search/artifacts.json), and
[142 locally served file comparisons](evidence/arch-friction-search/local-served.json) retain
the actual evidence. Tests ran on WSL2 Linux with Node 26.7.0 and SciPy 1.18.1;
CI remains configured for Node 24. No remote CI run is claimed.

Each browser's native search CSV matched the download inside its retained
reading and the later offline download. The file opened over `file:` and all
three actual source images decoded. The full regression also opens the reading
with JavaScript disabled and checks source image bytes. No app page errors,
external-origin requests or accessibility violations were recorded. This is
automated accessibility evidence, not an accessibility certification.

The final source build produces 141 offline content files plus the worker. The
cache also holds a separate progress record. An old regression assertion
incorrectly counted that record as a lesson file; it now verifies the exact
content inventory, refuses unknown records, and checks the progress record's
edition and verified count separately. The worker's own SHA-256 inspection
remains the readiness check. No worker behavior changed in this feature.

An initial browser run was invalidated by rebuilding during its cache check.
A subsequent run exposed the outdated progress-record count above. An early
Firefox run ended with a closed target during the first-install wait; later
complete runs and an isolated fresh Firefox install probe succeeded. That
single early run is not treated as a product fix or a passing check.

## Visual and artifact review

[Desktop](assets/arch-friction-search-desktop.png) and
[375 px phone](assets/arch-friction-search-phone.png) captures are actual browser
output. The graph remains legible through a local horizontal scroll region on
phones; it does not widen the page. Table rows stack, the approximate values
stay prominent, and exact bounds remain available in native details controls.
The original caption collapse and the saved reading's cramped phone labels
were corrected and rechecked. The result keeps Gonia's measured section and
force palette instead of adding a new dashboard shell.

The worked example is in [examples/arch-friction-search](../examples/arch-friction-search/).
Its gzip reading is an actual native browser download compressed without path
or timestamp metadata. It contains the graph, full-precision search results,
original source pages, fonts, licenses and downloadable JSON/CSV/SVG files.
Decompress it before opening:

```sh
gzip -dc examples/arch-friction-search/reading.html.gz > /tmp/gonia-friction-reading.html
```

Search resolution is not physical accuracy. These are floating-point numerical
bounds under the existing symmetric thirteen-block model, with edge contact
allowed. The friction coefficient is uniform and illustrative; the result is
neither historical reconstruction nor structural design advice. See
[the model](arch-friction-search.md) for equations, tolerances and exclusions.

## Delivery

`npm run build` writes the complete static edition to `dist/`, with base
`/gonia/`. `npm run dev` and `npm run preview` use port 4328. Only local work
was authorized by the house publication rules: no push, tag, deployment or
registry publication was performed. Hosted bytes and remote behavior have not
been verified for this change.

Suggested repository description: **Measured ancient architecture: operate the
geometry, read the original languages, and keep the evidence.**

Suggested topics: `ancient-architecture`, `vitruvius`, `geometry`, `statics`,
`latin`, `interactive-learning`, `offline-first`.

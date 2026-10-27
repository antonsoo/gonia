# Babylon: publication evidence

[Open the missing sixth storey](https://antonsoo.github.io/gonia/babylon.html?supplied=0&selected=5&page=scheil-300#bb-bench).
This publication was authorized by the repository owner. Source, static branch,
hosted bytes and browser behavior were checked separately on 2026-10-27 UTC
(2026-10-26 in the owner's timezone).

| Surface                           | Observed result                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pushed source                     | `f27c806b74efd0367ceae9ad60661fdc63abfd58` on `main`. Runtime source is `4894c4d43cc3039101ec3b59c0f92e9c1f012cdf`; the later commit retains documentation and actual examples.                                                                                                                                      |
| Independent public-source build   | Fresh HTTPS clone, fresh `npm ci`, `npm run check` on Node 24.21.0. Formatting, types, 50 tests and build pass. All 124 output paths and bytes match the reviewed Node 26.7.0 build. [Receipt](babylon-publication/remote-build.json).                                                                               |
| Static publication                | Normal fast-forward `gh-pages` commit `446dfa5aa509f341aa8920875463cb2121130c19`. Current build copied over the existing static branch; older hashed assets remain available to open tabs.                                                                                                                           |
| Canonical public bytes            | All 124 current files, plus canonical root/index aliases, match before and after the browser journeys. [Before](babylon-publication/hosted-before.json), [after](babylon-publication/hosted-after.json). An earlier pass still saw the old root and was not treated as success.                                      |
| Actual public browser operation   | Chromium 153.0.8010.12 and Firefox 155.0, each at 1440 and 375 pixels: controls, seven source-row jumps, complete sources, real scan and native downloads pass. All four install the complete 123-file cache, then reload and operate with browser networking disabled. [Receipt](babylon-publication/browser.json). |
| Actual public numerical artifacts | The independent rational oracle checks 196 downloaded CSV rows and 392 actual SVG groups. [Receipt](babylon-publication/geometry.json).                                                                                                                                                                              |
| Actual public portable editions   | Four native HTML/SVG editions open as files with scripts disabled and no HTTP requests. Seven original images, full source PDF, embedded JSON/CSV, fonts and notices match retained identities. The actual printed reading has 17 pages. [Receipt](babylon-publication/artifacts.json).                              |
| GitHub workflows                  | The legacy Pages build succeeded. Source CI and the source Pages workflow did not start. These are not passing source checks. [Observed statuses and links](babylon-publication/actions.json).                                                  |

The browser receipt records per-process Mesa software GL used on this WSL
machine. It does not establish hardware GPU performance. Public offline review
disabled browser networking; the [local review](babylon-review.md) separately
stopped the actual production origin and exercised four interrupted upgrades.
Physical printing and tagged-PDF accessibility remain unverified.

The [learner workflow](babylon-review.md#what-changed-for-the-learner) and
[source/model decisions](babylon-model.md) explain the missing numerical row,
the provisional image reading, the modern metre projection and the source
object's uncertain provenance. Publishing a scan establishes none of the
building's actual dimensions or the stone's disputed history.

The same public browser driver accepts an HTTPS base as its third argument:

```sh
node scripts/babylon-browser.mjs /tmp/gonia-babylon-public https://antonsoo.github.io/gonia/
python3 scripts/babylon-oracle.py --browser /tmp/gonia-babylon-public/review.json
python3 scripts/babylon-artifacts.py /tmp/gonia-babylon-public
```

The canonical checker is retained in Officina as `scripts/verify-pages.mjs`;
pass the public base, Gonia's `dist/`, an output path and an optional retry
window. It compares complete responses at canonical URLs, without cache-busting
parameters or inference from HTTP status alone.

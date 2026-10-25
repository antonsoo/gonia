# Water screw: source and public edition

The owner explicitly authorized pushing and continued work on 2026-10-25.
Main and the existing `gh-pages` history were advanced normally, without force
or an orphan deployment. Earlier hashed assets remain available for old tabs.

| Boundary               | Observed evidence                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source                 | Main `a1c470e23da233da0da7cfb54ffa6d61e0ef3401`; implementation, source pages, native examples and review scripts are public                                                                                     |
| Clean build            | [Node 24 report](screw-clean.json), source `3c04ee1ca2ae21b59a45658a5cdf6ca93caa53ed`; clean install and full check, 44 tests, all 101 output files identical to the reviewed build                              |
| Static branch          | `0c6a28ab77268cd0aa8a0a72adfaf7ada5494e2f`; GitHub Pages reported built at 2026-10-25 11:49:13 UTC                                                                                                               |
| Canonical hosted bytes | [101 of 101 current files](screw-hosted-files.json) match; canonical directory index matches before and after; no query cache busting                                                                            |
| Public browser         | [Chromium and Firefox, 1440 and 375 pixels](screw-hosted-browser.json); controls, history, source pages, keyboard reading and source panning, complete tracked turn, real downloads and standalone readings pass |
| Native output          | All twenty public-browser downloads match their local-review counterparts byte for byte: SVG, wrap, CSV, online and offline HTML across four configurations                                                      |
| Offline scope          | Public replay disables browser networking after installation; local review disables the actual test origin. Both produce new complete readings offline                                                           |

Open the [water-screw workshop](https://antonsoo.github.io/gonia/screw.html).
The [model](screw-model.md) and [direct review](screw-review.md) retain the
historical interpretation, modern assumptions, independent geometry, source
regeneration, update failures and print inspection. Publication does not
establish physical assembly, historical operating speed or hydraulic performance.

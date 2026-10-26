# Building accounts: source and public edition

The owner authorized publication on 2026-10-25. The existing `main` and
`gh-pages` histories were advanced normally, preserving earlier hashed assets
for readers with cached entry pages.

Open [Seven names, one uneven obol](https://antonsoo.github.io/gonia/ledger.html#lg-workshop).
The [initial review](ledger-review.md) and [source decisions](ledger-model.md)
retain the account’s editorial and historical boundaries.

| Boundary                   | Observed evidence                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source                     | Public `main` at `cf9f092`; implementation, complete source pages, licensed Greek excerpt, examples and native workflow scripts are available.                                                                                                                      |
| Clean build                | Source inputs from `00db20d`, and the final documentation checkout `06c1104`, passed an isolated Node 24.21.0 install and full check. All 110 files match the [reviewed build identity](ledger-review/build-identity.json).                                         |
| Static branch              | `c1e6980`, a normal child of the existing Pages history. Pages API reports legacy `gh-pages` at `/`, status `built`. This is separate from a CI claim.                                                                                                              |
| Canonical hosted files     | [110 of 110 files](ledger-review/hosted-files.json) match the reviewed build. The canonical directory entry matches before and after inventory, without query cache busting.                                                                                        |
| Actual hosted browser      | [Chromium and Firefox at 1440 and 375 pixels](ledger-review/hosted-browser.json) pass the allocation, reveal, source, zoom, keyboard, history, sharing, native download and offline workflows. The canonical directory entry is rechecked after each configuration. |
| Native downloads           | [Twenty hosted-browser files](ledger-review/hosted-downloads.json) match the local-review CSV, XML, online HTML and offline HTML byte for byte.                                                                                                                     |
| Portable reading and print | [Artifact inspection](ledger-review/hosted-artifacts.json) opens each study offline, verifies all embedded scans and fonts, and recovers all four original source JPEGs from the printed PDF byte for byte.                                                         |
| Offline scope              | Hosted replay disables browser networking after current-worker takeover; the earlier local replay also disables the actual origin. Both save new complete readings offline.                                                                                         |

Publication does not establish an ancient rounding algorithm, personal receipt
of wages, a complete project budget or the certainty of editorial restorations.
The current deployed worker inventories 109 files; the worker itself makes
110 current build files. Older retained hashed files are outside that inventory.

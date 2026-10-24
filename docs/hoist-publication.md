# Public hoist edition

The reviewed ninth room is available at
[Gonia / Hoist](https://antonsoo.github.io/gonia/hoist.html#hw-workshop).

| Boundary               | Observed identity or result                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewed source        | `cc4a123ea05ae5f42dfb4313323ea55dc539ee31`                                                                                                                                                      |
| Pages branch           | `d4a9632c2395a455fcb5e84199fb2514c6ee4d74`                                                                                                                                                      |
| Pages build            | API reports `built` for that exact Pages commit                                                                                                                                                 |
| Canonical hosted files | All 81 current build files match reviewed SHA-256 identities; the directory URL matches the entry before and after the inventory                                                                |
| Actual public browser  | Chromium 153 and Firefox 155, 1440 and 375 px: tied-end changes, same-rise/same-rope comparison, windlass, keyboard navigation, source reading, native files and all nine rooms browser-offline |
| Fresh public clone     | HTTPS clone of the reviewed source, Node 24.22.0, `npm ci`, `npm run check`; all 81 output files byte identical to the reviewed build                                                           |

[Canonical file inventory](hoist-hosted-files.json) ·
[Hosted browser operations](hoist-hosted-browser.json) ·
[Fresh clone](hoist-public-clone.json) ·
[Local review, origin-disabled experiment and upgrade](hoist-review.md).

The hosted browser review disables browser networking after complete installation;
it cannot shut down the public origin. The separate local production experiment
also destroys its origin connections. The Pages branch preserves historical
hashed assets for already-open pages; those are outside the current inventory.
A later documentation-only commit retains these observations without changing
production inputs. This records branch-based publication, not a registry release
or a claim that hosted CI jobs ran.

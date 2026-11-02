# Published hoist loss model and offline audit

The [operable lesson](https://antonsoo.github.io/gonia/hoist.html?rig=three&anchor=moving&hold=rise&distance=1&weight=600&arm=2&efficiency=90#hw-losses) now includes the independently checked loss model and the repairs described in the [audit](hoist-audit.md). The wheel transfer is a chosen modern assumption, not an ancient measurement.

| Boundary                  | Observed result                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reviewed source           | `e95faa0277497f1e57c601a1518277ad6f347e61`                                                                                                                               |
| Pages commit              | `cc2b5c9ae144c354f4496a8db9cd3aacf185b9fd`                                                                                                                               |
| Canonical hosted bytes    | All 142 current build files match the reviewed build by size and SHA-256; the directory entry matches before and after                                                   |
| Public browsers           | Chromium 153 and Firefox 155, each at 1440 and 375 px; all 15 rooms operated, offline check controls used, no page overflow                                              |
| Immutable public evidence | Five pinned raw artifacts match their exact committed bytes; source working tree clean at check                                                                          |
| Remote CI                 | Run `41402134754` failed; the reported check job has `steps: []`. It provides no executed-check evidence. Local clean-install/build and browser evidence remain separate |

Receipts: [hosted bytes](hoist-audit-publication/hosted-files.json), [public room operations](hoist-audit-publication/rooms.json), [immutable raw artifacts](hoist-audit-publication/source.json). Local reproduction, exact arithmetic, failed-install recovery, native downloads and the sustained shared-bandwidth experiment are retained in the [audit](hoist-audit.md).

This documentation-only follow-up does not change production inputs. Historical hashed files remain on the Pages branch for already-open editions and are outside the current build inventory. Public-browser offline checks disable browser networking; the separate local audit exercises broken origin responses and cache corruption.

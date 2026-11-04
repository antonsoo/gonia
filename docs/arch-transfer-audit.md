# Arch source-transfer and publication audit

Audit started 2026-11-04 after the local friction-search review. The earlier
[local checkpoint](arch-friction-search-review.md) records the initial feature;
this audit adds adversarial source transfers, cancellation and publication.

## Reproduced learner failure

The retained p. 141 image contains 611,151 bytes. A native HTTP server delivered
1,600 bytes every 100 ms, continuously. The original arch loader's absolute
30-second AbortSignal timeout cancelled it at 30.123 seconds after 476,800 bytes.
The viewer hid the image and showed “The user aborted a request.” The same
loader supplied the illustrated reading. A fast source retry worked; earlier
fast-network and offline checks did not reveal the failure.

The repaired reader completed the same image in 38.46 seconds and verified its
recorded byte length and SHA-256. It distinguishes three bounds:

| Stage         | Bound                    | Meaning                                      |
| ------------- | ------------------------ | -------------------------------------------- |
| Await headers | 60 seconds               | No response has begun                        |
| Read body     | 20 seconds of inactivity | No new chunk has arrived                     |
| Whole file    | 180 seconds              | Total read/digest ceiling, including headers |

An actively arriving body can therefore outlast thirty seconds. The total
ceiling prevents a tiny but continuous stream from keeping the operation alive
indefinitely. Zero-length chunks do not represent useful transport progress in
the native Fetch stream; the audit uses actual nonempty HTTP chunks.

The reader allocates only the edition's expected byte count, rejects an extra
chunk before copying it, rejects an early end, and hashes a complete exact-size
body before admitting it to the in-memory verified cache. Failed and cancelled
reads never become successful memo entries. Unknown identities cause no fetch.

## Cancellation ownership and Firefox

Each active source viewer or reading export owns its AbortController. Moving
to another printed page aborts the old viewer; cancelling a reading aborts all
of that reading's unfinished reads. It does not abort a simultaneous viewer.
The export snapshots state before fetching, so later changes do not rewrite
the saved experiment. Closing the page aborts its foreground operations; a
persisted page restored from the back/forward cache restarts its source read.

Only verified successes are reused across operations. Unfinished requests are
not shared. Native HTTP tests observe the export connection closing while the
viewer's connection remains open, then complete the viewer and retry export.
The complete export is still available after cancellation.

The first independent-request attempt used normal HTTP caching; Firefox could
keep a matching request alive after export cancellation. `cache: no-store`
separated the requests, but an isolated controlled Firefox offline probe found
that `no-store` and `reload` reads failed while `default` and `no-cache` could
read the saved source. The `no-cache` alternative still merged native requests in Firefox. The final
reader uses **no-store before worker control**, then the **default** request
path once a service worker controls the document. This preserves cold request
ownership and the verified offline fallback. Both cancellation and offline
exports are checked again against the final build. The service worker's own
background edition installation/repair is independent of foreground cancellation
and can continue; this change does not cancel that operation.

## What was audited

`npm run test:arch-transfer -- dist <receipt-directory>` uses native HTTP
streaming, not simulated browser clocks or mocked fetch replies. In Chromium
and Firefox it checks a 38-second active transfer, a body stalled after its
first chunk, early EOF, an oversized body, an equal-size wrong hash, refusal of
bad exports, valid retry, export cancellation with a concurrent viewer, and
superseded viewer cancellation. The cancellation captures include desktop and
375-pixel phone layouts. To exercise the real three-minute ceiling as well:

```sh
ARCH_TOTAL_DEADLINE=1 npm run test:arch-transfer -- dist /tmp/gonia-arch-transfer
```

The `ARCH_CANCEL_ONLY=1` switch narrows diagnosis to request ownership; it is
not a substitute for the full transfer audit. The real ceiling run is slower
than ordinary regression checks and stays optional in CI.

The numerical audit separately generated 12,000 deterministic valid input
states and checked 24,000 searches: 22,080 brackets yielded valid portable
witnesses; 1,920 scope/geometry combinations were impossible. This is a check
of production invariants, not an independent oracle. Reproduce it with:

```sh
node --import tsx scripts/arch-friction-stress.ts
```

The independent endpoint-pressure/shear LP now checks 114 configurations,
including 64 deterministic varied configurations in addition to the earlier
grid and width exercise. It agrees on 183 actual lower/upper brackets and 45
contact-geometry failures, using 822 LP optimizations. The original 1,120-case
arch oracle also passes. Model limits remain unchanged: a symmetric modern
thirteen-block equilibrium experiment, illustrative uniform friction, partial
opening and limiting edge contact; no measured ancient material or structural
safety determination.

## Slow first installation

A separate cold test shares a single 128,000-byte/second payload budget across
all foreground and background requests. It saves the actual reading during the
first installation, changes the live width while the reading is pending, then
checks the retained click-time state. Full-edition readiness must remain false
at this point. After all files are verified, it disables the origin and checks
an offline reload and a fresh offline reading export.

This exposed a separate Firefox failure: the previous schedule started its two
largest files first, and the installing worker ended before either completed.
No verified-file checkpoint was available to trigger automatic continuation.
The corrected schedule retains small files first and fetches one background
file at a time. It gives large files the remaining bandwidth rather than making
them compete with each other, and retains early verified progress for the
existing native-worker continuation mechanism. Readiness still requires every
file's complete size/hash, never partial bytes or a progress count alone.

Run the slow test independently for each engine:

```sh
node scripts/arch-cold-source-audit.mjs dist /tmp/gonia-cold-chromium chromium
node scripts/arch-cold-source-audit.mjs dist /tmp/gonia-cold-firefox firefox
```

Firefox completed the corrected cold install in **470.033 seconds**. The
reading had completed in **28.550 seconds**, while readiness remained false.
Its observed native states record seven installing workers becoming redundant
at roughly sixty seconds each; an eighth worker completed activation. The final
inventory had zero missing or corrupt files, and both origin-disabled reload
and a fresh offline export passed. These are measured local results, not a
guarantee for every connection or browser policy.

Chromium completed its corrected cold install in **512.091 seconds** after a
native installing-worker interruption at roughly five minutes. Its reading had
completed in **25.248 seconds**. Its final inventory and origin-disabled reload
and export also passed. The native continuation can repeat some incomplete
transfers; the byte totals in the receipts are not a bandwidth-efficiency claim.

The fixture copies its build to an isolated snapshot before serving it, so a
later local build cannot silently replace bytes during a multi-minute install.
The initial Chromium baseline install was invalidated by a local rebuild and is
not counted as a passing complete-install check. Both engines are rerun against
the corrected snapshot. The native three-minute ceiling receipt exercises the
same uncached reader branch before the later cache-selection correction;
final cancellation and offline workflows are separately rerun.

The varied-state generators use the high bits of their deterministic random
state, with an explicit coverage guard for both loading arrangements. Using the
low bit at a fixed position in an even-length generator cycle would silently
select only one arrangement. The final stress sample contains 5,993 crown and
6,007 shoulder-load states.

Final build, browser, transfer and publication receipts are retained under
[evidence/arch-transfer-audit](evidence/arch-transfer-audit/). Source pushes,
Pages deployment, hosted bytes and operated public behavior are separate
claims; each requires its own receipt.

## Local verification after the fixes

| Workflow                                                         | Result                                                                                                                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh install, lint, typechecks, unit tests and production build | Passed; 77 tests                                                                                                                                                                  |
| Native source transfer audit, both browsers                      | Slow active bodies, idle failure, exact size, bad hash, request ownership and valid retry passed                                                                                  |
| Friction discovery and retained study                            | Root navigation to the arch, keyboard question link, both search bounds, files, standalone reading and offline export passed at 1440/375 px in Chromium/Firefox                   |
| Fifteen-room offline review                                      | Every room's actual controls, cache checks and repair footer passed in both browsers and widths                                                                                   |
| Damage and recovery                                              | Missing/corrupt file withdrawal, cross-tab status, repair, error/maintenance/stalled navigation fallback, first-install retry and hoist cancellation passed in both engines       |
| Prior-edition upgrade                                            | Held and substituted files preserve the old verified edition; the explicit Reload workshop action opens the new edition and retains the URL's choice; old tabs withdraw readiness |

The upgrade fixture now identifies each built entry script rather than assuming
an older release lacks a particular button. It operates the actual reload offer
and waits for the reloaded document before inspecting it. Early harness failures
are not counted as product regressions or passing checks. One broad audit and
one Chromium slow-install process ended with exit 143 without a result receipt;
those runs are excluded and rerun, rather than being reported as successes.
The retained worked reading still matches the current native download byte for
byte in Chromium; the transfer repair changes delivery behavior, not its historical content.


For canonical served-byte verification, build the candidate first, then run:

```sh
node scripts/verify-served.mjs https://antonsoo.github.io/gonia/ /tmp/gonia-hosted.json
```

This compares every canonical content file and the generated worker with the
local build by SHA-256. Preserved older hashed assets on Pages are outside that
canonical inventory. The separate public browser review operates discovery,
controls, source pages, native files and offline exports; a matching HTTP body
alone does not establish those behaviors.


## Reloading the working experiment

A further public probe found that selecting the shallow example, joint 12 and
source page 2 did not change the address. Ordinary reload reset base width from
1.4 to 0.5, joint 12 to 3, and source page 2 to 0. That also affected the explicit
reload offered after an edition update. The native JSON already retained every
necessary field; the current address did not.

The address now retains the complete valid experiment, including unrounded
force/bearing values and the selected joint and source page. Replacing the
current entry avoids a history entry for every slider movement. Drag writes are
coalesced at 100 ms; completed changes, clicks, key releases, imports and reload
shortcuts flush the final selection immediately. Identical addresses cause no
write. A 700-input burst with Chromium's normal IPC flooding protection exposed
why writing on every input was insufficient: the control ended at 99 while the
address silently stopped at 97. Playwright normally disables that protection;
the updated browser runner explicitly leaves it enabled.

The updated workflow compares native editable JSON before/after online reload
and after a controlled offline reload, then checks 700 range inputs followed by
a committed change, unchanged history length, the final address, and a further
offline reload. It passes in both engines at both viewport widths, without
history-throttling warnings. The [before probe](evidence/arch-transfer-audit/reload-loss-before.json)
and [reload browser receipt](evidence/arch-transfer-audit/reload-browser.json)
retain the observed behavior.

The cold-install receipts above belong to the preceding transfer release. The
address-retention patch changes the generated edition inventory but leaves the
worker program byte-identical; [the program comparison](evidence/arch-transfer-audit/worker-program-comparison.json)
records that distinction. Slow-install timings are not presented as new timing
measurements for the later inventory. The working-state reload and public
workflows are rerun on the final edition.

## Public reload checkpoint and shared reader

The address-retention edition was built from source
`0e72f0a10dfa350e9295e9b180f57ab61092d668` and published on Pages commit
`f9812ca466af4e7ab8dfb1060b0e25a9f4bfd43a`.
[Public byte comparison](evidence/arch-transfer-audit/hosted-reload.json) records
142/142 canonical files matching, including the worker, at 21:08 UTC on
2026-11-04. [Public browser receipt](evidence/arch-transfer-audit/public-reload-browser.json)
records all four browser/viewport combinations, full-state restoration online
and offline, the 700-input history check, and actual downloadable readings.
These are receipts for that specific edition.

The subsequent [Ionic source-reader audit](volute-transfer-audit.md) extracts
this reader for reuse by the volute desk. Its source comparison confirms that
the arch's read-body implementation and the worker program are unchanged;
the new shared build file changes the edition inventory. Earlier slow-install
receipts remain evidence of the recorded earlier inventory, rather than a new
full bandwidth test of its successor. Fresh arch browser and native-transfer
receipts, all-room offline checks and publication checks are retained with the
Ionic audit.

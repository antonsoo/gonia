# Keep the complete Ionic capital readable

The Ionic volute desk compares an exact compass construction with printed pages and a surviving capital. Its complete Met photograph is 2,337,058 bytes. On a connection delivering 4,096 bytes every 100 ms, the old reader aborted after 30.064 seconds with 1,220,608 bytes sent. The image was still arriving. The caption exposed a browser abort message; the reading export used the same failing reader. [Reproduction receipt](evidence/volute-transfer-audit/before.json).

The volute and arch now use one retained-identity reader. It allocates the recorded byte count, refuses extra bytes before copying, rejects premature EOF and wrong SHA-256, and reuses only verified successes. A stalled body stops after 20 seconds without a new chunk; headers have 60 seconds and the whole request has a 180-second ceiling. These are transfer limits, not a guarantee for every connection.

Each reader owns its cancellation signal. Cancelling the illustrated reading aborts that export's outstanding requests while a simultaneous source viewer continues. Choosing another source stops the previous viewer's request. A failed export aborts its sibling reads. The export snapshots the selected drawing before fetching sources. A failed source offers **Retry selected source** without requiring a change of page. The empty image pane collapses on failure, and image controls become available only after verification.

Cold readers use independent uncached requests. A worker-controlled page uses the normal request path so that Firefox can read a saved response offline. This is the browser behavior established in the [arch transfer audit](arch-transfer-audit.md), not an assumption that all cache modes behave alike.

The photograph, source pages, Latin, construction, attribution and historical limits are unchanged. The complete photograph was visually inspected in this audit. This repair does not turn the later compass construction into evidence of how the ancient capital was drawn.

## Verification boundaries

The native HTTP fixture uses real streamed response bodies, rather than a simulated timer or a fulfilled browser route. It exercises continuous slow arrival, stalled arrival, truncated and oversized bodies, same-size substitution, cancellation during simultaneous viewing and export, successful retry, and replacement of a stalled viewer. The same fixture operates both desks through `GONIA_TRANSFER_ROOM`.

```
npm run build
npm run test:volute-transfer -- dist /tmp/gonia-volute-transfer
npm run test:volute -- http://127.0.0.1:4328/gonia/ /tmp/gonia-volute
npm run verify:volute-files -- /tmp/gonia-volute
node scripts/volute-retry-audit.mjs http://127.0.0.1:4328/gonia/ /tmp/gonia-volute-retry
```

The ordinary browser review operates the compass with the keyboard, inspects every retained source, downloads actual JSON/CSV/SVG/HTML, reopens native state, reads the script-free packet, and exports again after an offline reload. The artifact oracle checks the downloaded geometry, embedded source bytes, fonts, licenses and printable dimensions independently of the UI. Chromium and Firefox are reviewed at 1440 and 375 pixels. Hosted-byte verification and public behavior are separate receipts; local success alone is not publication evidence.

## Recorded local results

| Native transfer | Chromium | Firefox |
| --- | --- | --- |
| Complete slow photo and reading | 61.890 s | 60.186 s |
| Stalled body, followed by valid retry | 20.771 s | 21.078 s |
| Truncated, oversized, same-size wrong hash | Refused; retry passed | Refused; retry passed |
| Cancel export while source viewer continues | Passed | Passed |
| Replace stalled viewer; retry export | Passed | Passed |
| Save e = 12 mm, change live desk to 15 mm during transfer | Saved 12 mm | Saved 12 mm |

[Native receipt](evidence/volute-transfer-audit/native-transfer.json). These native runs precede the final error-pane collapse. The transfer implementation is unchanged by that view-only follow-up. The [final recovery review](evidence/volute-transfer-audit/retry-controls.json) tests the collapsed pane, hidden unverified image link, disabled zoom, keyboard retry of the same selection, and restored controls in both engines at both widths. [Phone capture](assets/volute-source-retry-phone.png) and [desktop capture](assets/volute-source-retry-desktop.png) were visually reviewed.

The [final local browser receipt](evidence/volute-transfer-audit/browser.json) and [artifact oracle](evidence/volute-transfer-audit/artifacts.json) cover actual downloads and offline source reading. The [all-room review](evidence/volute-transfer-audit/rooms.json) operates all fifteen rooms in all four configurations after offline takeover. No page errors or accessibility violations were reported in the volute browser review. Physical printing and independent philological review remain outside this audit.

The [fresh archive check](evidence/volute-transfer-audit/clean-build.json) records `npm ci` and `npm run check` at source `5d85da67cb49ddf270525a4f1909af2c69d018fd`: lint, TypeScript, 77 tests, and build passed. All 143 output files are byte-identical to the working build. [Local served-file comparison](evidence/volute-transfer-audit/local-served.json) separately checks those 143 files through HTTP. The build command is `npm run build`; its static output is `dist/`.

The [source-body comparison](evidence/volute-transfer-audit/shared-reader-comparison.json) confirms the retained arch read-body and offline worker program are unchanged. Fresh [arch native transfer](evidence/volute-transfer-audit/arch-native.json) and [arch browser](evidence/volute-transfer-audit/arch-browser.json) reviews pass after the extraction. The earlier shared-bandwidth installation and real three-minute ceiling receipts remain evidence of their named editions; they have not been relabelled as measurements of this new inventory.

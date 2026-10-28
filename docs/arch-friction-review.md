# Finite friction in the arch workshop

## Try the actual work

After the README quickstart open `/gonia/arch.html#ar-friction-title`.
1. Choose **Try a path that needs more friction**. All fourteen contact
   positions and both base resultants fit. Joint 0 has N = 1 W and
   T = -0.655 W. The chosen illustrative coefficient 0.65 is too small.
   The red direction lies just outside its cone; base friction still fits.
2. Choose **Include the pier bases**. A different trial meets every contact
   and friction check. The complete H interval is approximately
   0.642922 to 0.650000 W; the actual witness is not rounded internally.
3. Set the coefficient to 0.60. No H and C can meet every joint check.
   A failed search keeps your trial. The geometric contact interval alone
   remains nonempty, making the added assumption consequential.
4. Choose **Try a sliding base**. The joints and contact positions fit but
   base friction fails. Change width between 1 and 1.4: the base's required
   H/(V+P) stays unchanged. Increase pier weight from 0.25 to 1 W: this
   trial's base friction and contact checks both pass.
5. Toggle **No sliding assumed** and **Test finite friction**. The force and
   bearing position stay put. The coefficient is a hypothetical uniform value;
   the workshop supplies no ancient material measurement.
6. Inspect every joint, read Vitruvius's five Latin/English excerpts and open
   the three complete scans. The ancient text does not supply these equations.
7. Keep JSON, CSV, SVG and the illustrated reading. Reopen both a current
   version 2 file and the original `examples/arch/experiment.json`: version 1
   retains the original no-sliding assumption. Open the actual reading with
   scripts and networking disabled; its native downloads still work.

## Why this changes the experiment

The earlier workshop answered where a compressive resultant crossed a joint.
Its stated no-sliding assumption removed a separate possible failure. The
current room lets a learner test that assumption without conflating friction
with the contact point, an arbitrary failed path with an empty feasible set,
or base widening with adding weight. [Equations, numerical tolerances,
references and record migration](arch-model.md#finite-static-friction).

Static equilibrium can establish only a witness in this rigid finite model.
It does not predict motion following failure, measure material behavior or
assess a historical structure. The original Latin and source pages remain
unchanged; the contextual joint note identifies friction as a modern option.

## Reproduce

```sh
npm ci
npm run check
npm run verify:arch
npm run preview -- --port 4371
```

In another terminal:

```sh
node scripts/arch-browser.mjs http://127.0.0.1:4371/gonia/ /tmp/arch-friction-review
python3 scripts/arch-artifacts.py /tmp/arch-friction-review
node scripts/arch-friction-upgrade.mjs /path/to/previous/dist dist /tmp/arch-friction-upgrade.json
```

The browser runner exercises Chromium and Firefox at 1440 and 375 pixels,
keyboard operation, source bytes, actual downloads, version 1 migration,
finite-friction repairs and impossibility, all fifteen rooms offline after the
current controller and complete cache inventory, and the saved local reading.
Held source/export/import responses exercise actual races. No public delivery
is implied by a local run. [Retained receipts](evidence/arch-friction/).

## Publication boundary

The user explicitly authorized publication. Source `45f6ec2` and fast-forward
Pages `82e90aa` were pushed on 2026-10-28. All 142 canonical files matched the
fresh Node 24 build, before and after the public browser workflows. Chromium
and Firefox at 1440 and 375 pixels operated the actual hosted lesson, saved and
reopened real native files, preserved version 1's assumption, read source blobs,
and reloaded all fifteen rooms offline after the matching current controller
and complete 141-file inventory. [Public receipts](evidence/arch-friction-public/).

The actual hosted downloads pass the independent force/moment, friction,
source/font/license and native-equivalence audit. Their 15-page PDF keeps all
fifteen Latin/English/note paragraphs, eight word notes and three byte-identical
original source JPEGs, with text inside checked margins. Local printed-output
review caught and corrected a crowded table heading before publication.

Production edition: `677bbcf202b8df298cbe57a3e3bfb2baea706903cf541e6bb04617d9a2728635`.
CI run 40666609625 failed with no executed check steps; it is not validation
evidence. Legacy Pages build/deploy run 40666626716 succeeded independently.
Earlier arch receipts refer to the older contact-only edition. This record
makes no physical structure, physical printer or independent philology claim.

# Direct review of the viewpoint room

## What a learner can do

Open [One twelfth, seen from where?](https://antonsoo.github.io/gonia/optics.html?d=300&h=120&e=16&l=40&a=48&mode=source&read=4#vp-workshop).
Keep the source's 1:12 inclination. At a chosen face-centre height of 12 m
and eye height of 1.6 m, press **Find a view for the 1:12 lean**. The model
moves the observer from 30 m to 124.8 m, where the endpoint rays have equal
lengths. Move one decimetre farther: the upper ray becomes shorter. Choose
**Face the eye** and both rays become equal again by changing the face's angle.
This is a modern geometric comparison; the ancient text supplies no distance
and makes a broader claim about appearance.

The same learner can change four physical dimensions, try a custom angle,
inspect equal physical marks in a centre-aimed pinhole projection, restore
settings with browser Back/Forward, share a viewpoint, read six Latin clauses
with new English and eighteen contextual notes, follow two sourced Greek
companion words, enlarge four complete source pages and identify an actual
Ionic capital in an unchanged museum photograph.

The [model and source boundaries](optics-model.md) identify the author's
prescription, the chosen geometry, the earlier air-density explanation and the
assembled museum object's limits. No carved profile, whole temple or human
perceptual response is reconstructed.

## Operated production review

The [browser recipe](../scripts/optics-browser.mjs) exercises Chromium 153 and
Firefox 155 at 1440 and 375 pixels. The [retained receipt](optics-browser.json)
records native ranges, radios, keyboard focus, equal rays, the reversal,
history, share/reopen, all six readings and eighteen word notes, both Greek
companions, all four decoded source pages and the original museum image.
It independently checks the actual SVG world-point attributes and rendered
projected-mark paths against ray/screen intersections. Actual SVG, CSV and
HTML downloads are saved and reopened. The script-free study makes zero
automatic network requests. Both app and study have zero axe violations in
these configurations; no full accessibility audit is implied.

After a complete installation, the local production server destroys its
connections and browser networking is disabled. All ten rooms open, the new
experiment operates, and a fresh illustrated reading is generated from saved
assets. A separate substituted-source experiment rejects an HTTP-successful
but wrong source JPEG before downloading a study. This is not inferred from
HTTP status or a screenshot.

The [upgrade receipt](optics-upgrade.json) covers Chromium and Firefox with
both a held and a substituted new source page. The prior build's 81 files were
first checked against the existing canonical hosted identities. The old
nine-room edition remains usable offline while the tenth is incomplete;
unverified studies are not downloaded. After repair, all ten rooms open
with their origin disabled; the new experiment and fresh reading operate. Inspection after deleting caches reports
incompleteness without recreating a cache. The harness explicitly triggers an
update without awaiting its installation, allowing the held response to be
released later in Firefox as well as Chromium.

The separate [navigation receipt](optics-navigation.json) covers eighty actual
keyboard routes: every room at 375, 768, 1024 and 1440 pixels in both browsers.
All document bounds fit the viewport. Its service workers are blocked; it is
a navigation/layout review, not an offline claim.

## Independent geometry and native artifacts

`npm run verify:optics` checks 819 combinations against a Python solver using
65-digit Decimal Euclidean distances and line/screen intersections. The source
direction is constructed directly as (1,12)/sqrt(145), not by calling the
TypeScript angle conversion. Custom-angle trigonometry uses Python math and
is not arbitrary precision. The [receipt](optics-oracle.json) records 20,097
comparisons and maximum error scaled by max(1,abs(expected)) below 1.2e-13.
These computations validate the chosen geometry, not ancient perception.

The [artifact inspection](optics-artifacts.json), produced by
`python3 scripts/optics-artifacts.py <browser-output-folder>`, independently
checks all 1,589 data rows of each of four actual CSV downloads, selected
settings in native SVG, all 74 complete language fields in HTML and the
twenty-page Chromium PDF, and all five source JPEGs. Every original JPEG is
recovered byte for byte from both HTML and PDF.
- [Actual SVG](../examples/optics.svg) and [CSV](../examples/optics.csv).
- [Actual printed PDF](../examples/optics-reading.pdf).
- [Exact saved HTML, gzip-compressed](../examples/optics-reading.html.gz).
  Decompress it before opening; no external assets or scripts are required.
- [Example byte identities](optics-example-identities.json) and
  [source/font identities](optics-sources.json).

The final range review also reproduces a label collision at d=5 m, H=6 m,
e=2.5 m, L=6 m and a custom 64.5-degree tilt. The corrected ruler keeps all
marks below the heading and above the captions. The [close-view screenshot](assets/optics-ruler-close.png)
was opened and reviewed.

The complete PDF geometry and table pages were visually inspected, including
the intact comparison table. The retained [desktop](assets/optics-1440.png)
and [phone](assets/optics-375.png) screenshots were opened and reviewed.

## Reproduce

Use Node 24 or later. `npm ci` then `npm run check` installs, lints, typechecks,
runs the existing 39 tests and builds the complete site. `npm run verify:optics`
runs the independent geometry comparison. `npm run test:optics -- <output>`
starts its own local production origin, exercises both browsers and saves the
actual study files. `node scripts/optics-upgrade.mjs <prior-nine-room-dist>
<receipt.json>` runs the held/substituted upgrade. Browser executables must
already be available to Playwright. All local and hosted publication claims
remain separate from these source commands; no registry release is implied.

The [fresh public clone](optics-public-clone.json) used Node 24.21.0,
`npm ci` and `npm run check`; all 91 build files match the reviewed Node 26
outputs byte for byte. The [development receipt](optics-development.json)
also exercises the actual `npm run dev` entry, JSON/licence imports, equal-ray
control, Greek companion, complete HTML download and malformed-link recovery.

# Where the rope ends

This review concerns the ninth room's local implementation and actual browser
files. Public source and hosted-file identities are recorded separately when
publication is verified.

## What a learner can do

Keep three wheels and move the tied end from the moving assembly to the fixed
support. Three upward tensions become two. Keep five wheels: five become four.
The rope route supplies the count; wheel names alone do not. The lower-block
tie follows the edited Vitruvius X.2.1 reading. Fixed-support ties and the single
fixed wheel are explicit modern comparisons.

Hold the rise constant to compare required rope and unchanged load work. Hold
rope take-up constant to discover a smaller rise and a smaller lifting task.
Change a windlass arm: hand force falls as hand path grows. The same work is
accounted for at load, rope and hand. White material markers move along the
actual route, rather than a decorative arrow or progress bar.

Read seven excerpts with new English, twenty-eight contextual Latin and Greek
notes and five complete printed pages. The apparatus remains visible; the
source's editorial additions and Greek spelling layer are identified. Save a
complete script-free reading with the selected route, its tie alteration,
windlass, comparison table, all language notes, scans, fonts, JSON and CSV.

## Direct verification

| Boundary                       | Observed result                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working Node 26.7.0            | `npm run check`: lint, strict typecheck, 39 tests and production build pass; five new tests address real force/travel constraints, material markers and ambiguous editable input                            |
| Clean Node 24.22.0             | Separate `npm ci` and full check; all 81 production files byte identical                                                                                                                                    |
| Documented quickstart          | Clean Node 24 `npm ci` then exact `npm run dev` at port 4328; both browsers and widths exercise the actual controls, language, native files and portable reading; footer correctly says Development preview |
| Independent model              | Python Fraction calculations and independently constructed endpoints/arcs agree in 540 configurations; maximum absolute numerical difference 4.321e-12, asserted tolerance 1e-8                             |
| Chromium 153 / Firefox 155     | 1440 and 375 px: actual three/five/single wheel routes, both ties, fixed rise versus fixed take-up, weight and windlass arm changes                                                                         |
| Actual navigation              | Keyboard in-page navigation after changing rig, weight and arm retains the active experiment; this caught and fixed an initial state-reset defect                                                           |
| Phone detail                   | Real keyboard sliders, retained control focus, 200% drawing and source enlargement with ArrowRight panning; whole document fits viewport                                                                    |
| Editable native files          | Actual JSON save/reopen, duplicate-key rejection without partial change, second-tab shared state; unit checks also reject escaped duplicate keys, unknown, incomplete, off-grid and oversized input         |
| Language and evidence          | All seven readings and 28 word buttons operated; Greek edited-reading note reached; all five decoded full scans match manifest SHA-256                                                                      |
| Actual downloaded geometry     | Python inspects the native SVG's literal M/L/A route, five force-arrow groups and state metadata against independently constructed display coordinates                                                      |
| Actual downloaded measurements | All 211 rows in each of four CSV downloads agree with independent force, travel, work and winding calculations                                                                                              |
| Click-time reading             | Save at five wheels / moving tie / rise 1 m / 1200 N / arm ratio 4, then change controls. Native HTML retains the earlier state and embedded JSON, all readings and five correctly hashed full pages        |
| Portable local HTML            | Both browsers at both widths decode scans/fonts, fit the viewport and make zero automatic remote requests; no scripts or event handlers; the PDF reports no JavaScript                                      |
| Origin-disabled offline        | After installation, the local server destroys its connections and browser networking is disabled. All nine rooms reload; tie changes and complete illustrated export work                                   |
| Accessibility                  | Axe reports no violations in the inspected Greek-reading state in all four configurations; not a full assistive-technology audit                                                                            |
| Old-room navigation            | 108 combinations: nine rooms, six widths (375,621,768,820,1024,1440), both browsers. Actual keyboard navigation to Hoist and viewport bounds pass; service workers blocked for this layout-only review      |

[Browser operations](hoist-browser.json) · [Build identities](hoist-build-identity.json) ·
[Independent model](hoist-oracle.json) · [Native SVG/CSV oracle](hoist-artifact-oracle.json) ·
[Navigation](hoist-navigation.json) · [Saved artifacts](hoist-artifacts.json) ·
[Clean development workflow](hoist-development.json).

## Eight-to-nine-room upgrade

The baseline is an archive of actual source
`f8158e47833aa9cd62f5450812605f9559295d45`, built with the current locked dependency
directory. It is not claimed as a separate clean install. The new source has the
separate Node 24 installation above.

At 375 px, Chromium and Firefox receive either a held p.233 image or HTTP 200
with p.232 bytes substituted for it. The new page cannot claim offline readiness
and cannot save an unverified reading. The old complete edition still works
when the local origin is disabled; its navigation contains no ninth room.
Release or correct the response, retry, and the new complete worker takes over.
All nine rooms then open with the origin disabled, and the new room operates
and downloads its complete reading. A current-worker inspection after cache
deletion reports incomplete without recreating a cache.

[Upgrade, failure and recovery receipt](hoist-upgrade.json). The service worker's
integrity inventory and cache identity distinguish editions. Readiness describes
the cache at inspection time, not a guarantee against later browser eviction.

## Visual and printed review

Desktop, phone and the Greek-reading screenshots were opened and inspected.
The native saved reading prints as 13 A4 pages, about 2.8 MB. Pages 1,2 and 13
were inspected for both tie routes and the final full source page; extracted
text preserves Greek, Latin, the 1200 N example, work values and final caption.
The complete source pages were inspected directly against the edition.
Physical lifting, printing or measurements of real apparatus were not performed.

The [source/model note](hoist-model.md) separates the edited source, modern
counterexamples and ideal equations. No ancient safe capacity, frame dimensions,
friction coefficient or exact numerical force law is inferred.

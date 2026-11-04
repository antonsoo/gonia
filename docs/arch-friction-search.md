# Can another pressure path need less friction?

This extends the existing arch experiment. A chosen path's largest |T|/N does
not minimize that requirement over other equilibrium paths. The new search
keeps geometry and loads fixed, and varies horizontal thrust H and the bearing
position. It compares the joints alone with the complete joint-and-base model.

## Evidence and model boundary

Vitruvius VI.8.3-4 discusses radial wedges and wider outer piers. On 2026-11-04,
the retained Krohn p. 141 image was independently inspected again: the wider-pier
instruction is at lines 18-21 and the loaded wedges pushing out the bearings
follow it. The critical apparatus remains on the whole page. The page identity
is `63c035dae4114c03c8404171f624f93690fe122eedd301e9913c0525cd7f781d`.
[Source identities and transcriptions](arch-sources.md) retain the edition and
original PDF provenance. No ancient friction coefficient or minimization method
is claimed. This feature adds no new historical attribution.

The modern contact law is the static inequality |T| <= mu N; see
[Drake's physical model](https://drake.mit.edu/doxygen_cxx/group__friction__model.html).
The [existing model](arch-model.md) supplies geometry, area centroids, loads,
no-tension contacts, pier moments and the full interval elimination.

## Search

At each joint j:

    N_j(H) = H sin(theta_j) - Q_j cos(theta_j)
    T_j(H) = H cos(theta_j) + Q_j sin(theta_j)
    r_j(H) = |T_j(H)| / N_j(H)

For this symmetric downward-loaded family N_j is positive for H > 0. Pier bases
require r_base(H) = H/(V + P). Contact position depends on H and moment intercept
C; the friction ratios depend on H alone. An arch-only path must satisfy every
joint ratio and all joint contact bounds. A complete path must also satisfy base
friction and base contact position. A low joint ratio outside the appropriate
contact interval is unusable.

Increasing mu relaxes every Coulomb bound without changing contact geometry.
That makes feasible coefficients monotone. The algorithm first checks contact
geometry with sliding excluded; if impossible, friction cannot repair it. Then
it checks mu = 2. If that fails, it reports only that the search range ended,
without guessing a threshold beyond it. Otherwise it bisects [0, 2], eliminating
C and intersecting all H bounds at each step, until the coefficient bracket is
narrower than 0.000001. The lower endpoint fails this numerical feasibility
check; the upper admits an actual witness. The current valid arch family cannot
carry all fourteen differently oriented joints with mu = 0.

The solver uses the existing floating-point tolerances: effectively zero affine
coefficients below 1e-12, parallel incompatibility below -1e-12, and thrust-bound
agreement within 1e-10. The bracket is numerical, not an interval-arithmetic
certificate. Its width is search resolution, not physical precision. Edge
contact is a limiting state without a finite stress solution. This does not
assess stone strength, soil, settlement, dynamics or safety.

The diagram samples 241 H values for each curve, solely for drawing. Its
horizontal view is explicitly finite even when the contact domain is unbounded;
vertical requirements above mu = 2 are clipped. The two strips show complete
contact-only H intervals. The markers come from search witnesses, not the
sampled minimum. The graph is keyboard-pannable on phones.

## Two operated counterexamples

| Choice                                                                        | Arch-only feasible upper mu | Joint-and-base feasible upper mu |
| ----------------------------------------------------------------------------- | --------------------------: | -------------------------------: |
| Rise 0.4; thickness 0.24; own weight only; base width 1.4; pier weight 0.25 W |        0.035843849182128906 |              0.42659950256347656 |
| Rise 0.3; thickness 0.16; extra 1 W on shoulders; width 0.4; pier weight 4 W  |          unchanged by width |               0.2967395782470703 |
| Same shoulder-loaded arch and weight; width increased to 1.4                  |          unchanged by width |               0.2473735809326172 |

The shallow arch's joint-only witness cannot carry the bases. The second
exercise starts at a fitted narrow-base witness. Widening alone keeps H,
bearing, mu and weight unchanged, so its required friction stays unchanged.
The broader contact interval admits another witness: H rises from approximately
1.11875681 to 1.23686572 W while the worst required coefficient falls. More
horizontal thrust can reduce the governing joint shear ratio even though it
increases the base shear ratio. Width does not directly change a fixed path's
friction; it changes which paths may be chosen.

Search results are cached only by shape, loads, width and weight. Changing the
current trial, selected joint, source page or coefficient does not change them.
Applying a witness preserves the currently inspected joint and source page.
Existing JSON and shared URLs already retain every necessary input, so no new
record version or hidden state is required. CSV retains geometry, both bounds,
conflicting constraints and witness H/bearing at full precision. The portable
HTML includes the graph, results, native CSV, fonts, complete source images and
licenses, with no scripts.

## Reproduce

```sh
npm ci
npm run check
npm run verify:arch-friction
```

Serve the fixed production build with `npm run preview`, then run:

```sh
npm run test:arch-friction
node scripts/arch-browser.mjs http://127.0.0.1:4328/gonia/ /tmp/gonia-arch-regression
```

The independent SciPy/HiGHS oracle uses endpoint pressures and free shear,
balancing x/y forces and moments on each block and both piers. It does not use
the production H,C elimination. Both actual bracket endpoints are checked with
primal and dual feasibility tolerances 1e-9. The source runner includes a grid
of geometries and both width-exercise configurations.

The browser runner operates both bounds, changes geometry without overwriting
the trial, checks the width counterexample, reopens the script-free file via
`file:`, compares its embedded CSV to the native download, checks actual image
decoding, and repeats search and export after disconnecting a controlled page.
It covers Chromium/Firefox at 1440 and 375 pixels, keyboard interaction,
accessibility, errors, external requests and horizontal overflow. Browser math
can differ in the last digits of witness H/bearing; full-precision files are
compared within each browser, rather than asserting cross-engine byte identity.

Screenshots use the existing palette: chalk #f8f9fc, ink #24304d, force blue
#2458bd, base gold #9b6500 and trial raspberry #a72c50. Plex carries controls and
measurements; Noto remains the Latin reading face. The force graph is the one
added visual element; no new application shell or decorative ruins are added.
The initial phone caption failure was corrected by making the caption a full
width block in the stacked table. Precise numerical details stay expandable.

Final local check results and retained files are listed in
[the verification receipt](arch-friction-search-review.md). Publication is a
separate step; this review does not establish remote or hosted behavior.

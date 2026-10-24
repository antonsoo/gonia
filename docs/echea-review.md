# Sounding-vessel room review

Reviewed locally on 2026-10-23 (America/Los_Angeles; machine records use UTC).
The new room connects the existing theatre construction to a musical prescription
in Vitruvius V.5. It is an addition to Gonia, not a separate catalogue app.

## What a learner can now do

Follow thirteen positions and seven named pitches; hear their non-monotonic
order; compare an explicitly altered ascending row; learn the Greek names and
read nine Latin passages with new English; inspect five full printed pages;
explore a separate modern resonator; and keep the experiment as HTML, PDF, SVG,
CSV or WAV. The text explains the overlap of conjunct and disjunct tetrachords
so the pitch reversal has a musical reason, not just a plotted surprise.

The existing seven rooms gained a navigation link. Their shared navigation wraps
at intermediate widths. The final source does not change their geometric models.

## Historical and physical boundaries

The [model note](echea-model.md) records the source edition, full page mapping,
editorial variants, transcriptions, ratios and derivation. The Latin was checked
against the complete printed pages. The app follows Krohn's printed reading,
including its editorial interventions; it does not claim manuscript unanimity.

The thirteen positions and pitch names follow the text. Frequencies, pure-ratio
realization, bowl profile and semicircular drawing are stated modern choices.
The single-mode oscillator is an explanatory model, not a theatre simulation,
measured ancient vessel, authentic timbre, speech-clarity prediction or proof of
sound amplification. The larger theatre's three rows were left out because their
additional textual and musical questions need a dedicated treatment.

## Reproducible verification

Requires Node.js 24+, Python 3, and installed Chromium/Firefox for browser runs.
The source checkout was checked with Node 26.7.0; the reproducibility run used
Node 24.22.0 from a fresh archive, with a fresh `npm ci`.

```sh
npm ci
npm run check
npm run verify:echea
node scripts/echea-browser.mjs /tmp/gonia-echea-review
python3 scripts/echea-audio-oracle.py /tmp/gonia-echea-review
```

For the documented development workflow, start `npm run dev`, then in another
terminal:

```sh
node scripts/echea-browser.mjs /tmp/gonia-echea-development http://127.0.0.1:4328/gonia/
```

For an edition upgrade, supply a complete prior seven-room production build:

```sh
node scripts/echea-upgrade.mjs /path/to/prior/dist /tmp/gonia-echea-upgrade.json
```

The browser and upgrade tools create their own production server and ports.
Do not rebuild `dist/` during their run. No browser installation, GitHub push,
registry release or deployment is performed by these review commands.

| Evidence                       | Result                                                                                 | Retained record                                          |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Full project check             | Lint, strict typecheck, 34 tests and production build passed                           | [Fresh install and build hashes](echea-clean-build.json) |
| Defining differential equation | 81 combinations, ten observations each; independent RK4 integration                    | [Numerical oracle](echea-oracle.json)                    |
| Pitch row                      | All 13 frequencies checked independently with rational arithmetic                      | Same oracle                                              |
| Production browser workflow    | Chromium and Firefox, each at 1440 and 375 pixels                                      | [Browser record](echea-browser.json)                     |
| Development workflow           | Both engines and widths; source controls and exports                                   | [Development record](echea-development.json)             |
| Live/generated audio           | Actual AudioBuffer PCM matches downloaded WAV PCM                                      | Browser record                                           |
| Audio content                  | Independent frequency estimates, RMS and free-decay pitch                              | [Audio record](echea-audio.json)                         |
| Offline operation              | All eight rooms navigated with the origin disabled; reading exported offline           | Browser record                                           |
| Interrupted update             | Held scan and substituted scan preserve old usable edition; full valid update recovers | [Upgrade record](echea-upgrade.json)                     |
| Intermediate layout            | No horizontal page overflow in all eight rooms at 900 pixels                           | [Layout record](echea-layout.json)                       |

The fresh Node 24 installation rebuilt all **72 production files** identically to
the reviewed checkout: every SHA-256 matched, including `sw.js`. The
[clean-build record](echea-clean-build.json) pins the source commit and lists
every file hash. Subsequent review-record changes do not affect the build inputs.

The independent integrator uses at least 160 steps per fastest cycle and stops
exactly at the forcing cutoff. Maximum absolute displacement discrepancy was
`1.2411e-5`; maximum velocity discrepancy divided by natural angular frequency
was `1.4244e-5`. The application uses the closed-form solution, not that integrator.

The audio oracle reads actual browser downloads. For each of four browser/width
combinations, it checks all thirteen tones with interpolated zero crossings,
the detuned drive frequency, the change to the mode's damped natural frequency
after cutoff, and the detuned/matched RMS ratio. It also compares embedded audio
bytes in the online and offline saved readings. This verifies digital samples,
not the quality of a physical playback device or a human listening experiment.

Browser actions include native keyboard selection, source-image enlargement,
previous/next readings, source-page navigation, history restoration, sharing, download
buttons, and sound cancellation on a control change. A deliberately delayed
AudioContext resume is cancelled before it can begin playing. Both engines
reported zero axe violations in the reviewed state, zero page errors and no
external runtime requests. This is not a claim of an exhaustive accessibility
audit. All five saved scan hashes match the bundled originals.

## Inspectable results

The [saved reading](../examples/echea-reading.html) embeds its font, source pages,
two sounds and diagrams, without runtime scripts or remote subresources. It can
be opened locally. The 14-page [PDF](../examples/echea-reading.pdf) was generated from
that actual browser download. Printing to paper was not tested.
- [Full workshop screenshot](assets/echea-desktop.png)
- [375-pixel workshop](assets/echea-mobile.png)
- [Slow build-up and free decay](assets/echea-resonance.png)
- [Latin beside the printed source](assets/echea-reading.png)
- [Pitch row WAV](../examples/echea-row.wav)
- [Matched response](../examples/echea-matched.wav) and [detuned response](../examples/echea-detuned.wav)
- [Measured CSV](../examples/echea.csv) and [plan SVG](../examples/echea.svg)

The retained screenshots were opened and inspected. The desktop composition
keeps the musical row beside its seven controls; phones put the large native
buttons below an overview. Source images can be enlarged and panned with the
keyboard. Small labels in the plan are supplemented by full-sized pitch buttons
and an HTML table. No interaction depends on hovering or hitting a tiny SVG mark.
The exported PDF keeps the source apparatus complete and selectable Latin/Greek
text in the new reading.

## Publication boundary

The complete static build command is `npm run build`; output is **`dist/`**,
with base path **`/gonia/`** and new entry **`echea.html`**. Source and build have
been reviewed locally. This session did not push, create a release, change
GitHub settings or deploy. `HOUSE_STANDARDS.md` explicitly says, “Do NOT create
the GitHub repo, push, tag, or publish to npm/PyPI/crates.”

No hosted-byte or public-browser claim is made for this new edition. The new
room is linked from all local Gonia pages; Officina's public catalogue was left
unchanged to avoid advertising an undeployed route.

Suggested repository description:
“Measured ancient architecture: temple geometry, stone transport, theatre plans and sounding vessels.”
Suggested topics: `ancient-greek`, `architecture`, `vitruvius`, `music-theory`,
`acoustics`, `education`, `offline`, `typescript`.

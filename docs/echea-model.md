# Thirteen vessels, seven notes

This room reads Vitruvius V.5.1–3 and selected evidence from V.4.5 and V.5.8.
Its subject is the one-row prescription for a smaller theatre. It does not
implement the larger theatre's three genera/rows, whose textual and tuning
questions deserve a separate treatment.

## What the source determines

Krohn (1912), pp. 104–105, assigns pitches from each wing towards the centre:

| Place counted inward | Name              | This drawing's positions |
| -------------------- | ----------------- | ------------------------ |
| First                | nete hyperbolaeon | 1, 13                    |
| Second               | nete diezeugmenon | 2, 12                    |
| Third                | paramese          | 3, 11                    |
| Fourth               | nete synhemmenon  | 4, 10                    |
| Fifth                | mese              | 5, 9                     |
| Sixth                | hypate meson      | 6, 8                     |
| Middle               | hypate hypaton    | 7                        |

Thirteen vaulted chambers have twelve equal spatial gaps. The plan uses equal
angles along a semicircle to visualize those gaps. It does not assign metres,
locate excavated niches, or predict sound travel. The straight trace plots log
frequency against position, not seating height.

The text explicitly names a musical fourth at five transitions on either
half. It does **not** name that interval between the third and fourth placements.
The latter note is higher. The ascending alteration swaps paramese and nete
synhemmenon on both sides and changes no pitch values. This is a counterfactual
sorting operation, not a proposed historical alternative.

## A stated listening realization

The app takes a pure fourth as 4:3, a pure octave as 2:1, and the disjunction
between mese and paramese as a 9:8 tone. Relative to mese, the frequencies are:

| Name              | Ratio | Frequency at chosen mese = 220 Hz |
| ----------------- | ----- | --------------------------------: |
| hypate hypaton    | 9/16  |                            123.75 |
| hypate meson      | 3/4   |                               165 |
| mese              | 1     |                               220 |
| nete synhemmenon  | 4/3   |                     293.333333... |
| paramese          | 9/8   |                             247.5 |
| nete diezeugmenon | 3/2   |                               330 |
| nete hyperbolaeon | 2     |                               440 |

The rise from paramese to nete synhemmenon is `(4/3)/(9/8) = 32/27`.
Multiplying every pitch by a new reference leaves every relationship unchanged.
The references 165, 220 and 330 Hz are chosen listening conveniences. The row
omits proslambanomenos and therefore spans less than the general double-octave
compass mentioned in V.5.1. Neither the Latin nor this workshop establishes an
ancient frequency standard or specifies a particular composer's temperament.

The seven Greek forms are normalized musical names corresponding to Vitruvius's
Latin transliterations. They are not a supposed Greek original of his Latin.
The English glosses describe pitch function rather than translating hypate and
nete literally as physical string positions. V.4.5 supplies the fixed-note list;
V.4.7 explains the conjunct/disjunct tetrachord names on the same preserved pages.

## The separate resonance experiment

This experiment illustrates one physical principle, frequency selectivity.
It neither models thirteen coupled vessels nor assigns their profiles, masses,
wall thicknesses, material losses, mouth geometry, acoustic radiation or coupling
to an audience. A shell vibration and an air-cavity mode are distinct mechanisms.
Their frequency labels alone do not identify an ancient mechanism.

Let `w0 = 2*pi*f0`, `w = 2*pi*f`, and `Q` be the chosen quality factor. We solve:

```
x'' + (w0/Q)*x' + w0^2*x = (w0^2/Q)*sin(w*t)  for 0 <= t <= 1.5 s
x'' + (w0/Q)*x' + w0^2*x = 0                  after 1.5 s
x(0) = 0, x'(0) = 0
```

`x` is dimensionless displacement. The drive is scaled by `1/Q` so the steady
response at `f = f0` is one for every Q. Absolute forcing is **not** held fixed
when Q changes. Within one Q, detuning holds that forcing amplitude constant.
This normalization makes the graph a relative response, not a pressure gain.

For `r = f/f0`, the steady amplitude and phase are:

```
A = 1 / sqrt(Q^2 * (1-r^2)^2 + r^2)
phi = atan2(r/Q, 1-r^2)
```

Set `alpha = w0/(2Q)`, `wd = sqrt(w0^2-alpha^2)`. During forcing:

```
x(t) = A*sin(w*t-phi) + exp(-alpha*t)*(a*cos(wd*t)+b*sin(wd*t))
a = A*sin(phi)
b = (alpha*a - A*w*cos(phi))/wd
```

Differentiate this expression to obtain velocity. At the end of the drive,
compute `xT, vT`. The free motion for `u = t - 1.5` is:

```
x(t) = exp(-alpha*u) * (xT*cos(wd*u) + (vT+alpha*xT)/wd*sin(wd*u))
```

Position and velocity are continuous at the cutoff. The free displacement
envelope decays to `1/e` in `tau = Q/(pi*f0)` seconds; energy decays twice as
fast in exponent. The resonator's damped frequency is `wd/(2*pi)`, slightly
below its undamped natural frequency. A finite drive need not reach steady state.

The response graph is sampled every half cent from -200 to +200. Its highlighted
point uses the exact selected value. The burst graph takes peaks in 240 equal
windows from the actual playback samples and divides out the fixed 0.32 gain.
Its vertical scale is fixed; the horizontal duration follows the generated sound.
The final window includes the explicit end fade. The playhead uses AudioContext
time and is suppressed under reduced motion.

## Audio and exported files

All audio is mono, 24 kHz. The row uses 0.48-second sine tones, 18 ms attacks,
35 ms releases, and a 0.62-second onset period. The fixed peak level is 0.24.
These are test tones, not a bronze timbre, speech or an ancient performance.

Response samples evaluate the exact solution at a fixed gain of 0.32. Duration
is `1.5 + 5*tau + 0.04` seconds, rounded up to a complete sample. The last 25 ms
fades linearly to zero. There is no automatic peak normalization or mixing of
the driving tone into the result. The response remains quiet when detuned.

Live playback uses those same Float32 samples. WAV encoding rounds to signed
PCM16. Changing any experiment setting, navigating history, hiding the tab or
pressing Stop cancels playback. A generation counter prevents a delayed audio
resume from starting after cancellation. A silent or disconnected output device
is outside digital verification.

The saved HTML contains the selected plan, trace, response graphs, two audio
files, complete pitch table, nine readings, Greek names, full scans, font bytes
and font notices. It contains no script or remote subresources. CSV exports the
thirteen placements, selected response and integer-cent response curve. The
source image and font hashes are verified before a reading can be saved.
The export captures settings at the time Save is pressed.

## Source decisions and boundaries

The source PDF is the Internet Archive copy of **Vitruvii De architectura libri
decem**, edited by F. Krohn, Leipzig, 1912:
<https://archive.org/details/vitruviidearchit00vitr_1>.
Printed pages 102–106 map to one-based PDF pages 120–124 and Archive leaves
n119–n123. PDF SHA-256:
`b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139`.

Four pages were rendered complete at a maximum dimension of 1800 pixels;
p. 106 reuses the existing complete theatre image. All five were inspected
visually. OCR located passages but did not substitute for inspection. The
[manifest](../public/sources/echea/manifest.json) records image hashes.

Line-end hyphens are joined in the reading; editorial angle brackets and square
brackets remain marked. The p. 105 apparatus documents corrected readings for
names in V.5.2. The app follows Krohn's printed text, without claiming manuscript
unanimity. The new English translations and short language notes are original.
The complete page images are public domain.

The mounting section preserves free space above and around the inverted vessel,
a stage-facing supporting wedge at least half a source foot high, and an opening
two source feet long and half a foot high. The vessel tilts on the wedge in the
illustrative section. Those dimensions do not give its profile or diameter.

V.5.3 describes an expected increase in clarity. V.5.8 gives testimony about
examples and materials, and explicitly cannot point to an example at Rome.
These statements are not acoustic measurements. Two linked research papers
explore hypotheses with modern simulations:
- J. H. Rindel, “Echo Problems in Ancient Theatres and a Comment to the ‘Sounding
  Vessels’ Described by Vitruvius,” 2011, Acoustics of Ancient Theatres conference:
  <https://www.eaa-saat.eu/SAAT2011/atti/AA2011-9_Rindel.pdf>.
- S. Polychronopoulos, D. Kougias, P. Polykarpou and D. Skarlatos, “The Use of
  Resonators in Ancient Greek Theaters,” same conference, 2011:
  <https://www.eaa-saat.eu/SAAT2011/atti/AA2011-39_Polychronopoulos-et-al.pdf>.

The app reproduces neither their figures nor their theatre models. Background
for the modern differential equation is supplied by UNSW Physclips,
[Oscillations](https://www.animations.physics.unsw.edu.au/jw/oscillations.htm).

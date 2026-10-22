# Corner model and source boundaries

The local model follows the geometrical situation in Wilson Jones (2001),
figure 2, p. 677: beam depth greater than triglyph width creates a discrepancy
between the desired corner ending and column/triglyph alignment. All geometry
and SVGs in this repository are original implementations, not traced figures.

## Coordinates and constraints

Let T = 1, ordinary metope width M = 1.5, frieze height H = 1.5,
triglyph pitch P = T + M = 2.5, normal axis spacing S = 2P = 5.
The outside face of the return is x = 0; beam depth B ranges from 1 to 3 in
increments of 0.01. The corner column axis is C0 = B/2.

| Treatment | Column axes C0, C1, C2            | Triglyph centres G0 through G4    |
| --------- | --------------------------------- | --------------------------------- |
| Align     | B/2 + jS                          | B/2 + kP                          |
| Widen     | B/2 + jS                          | G0 = T/2; remaining Gk = B/2 + kP |
| Contract  | C0 = B/2; remaining Cj = T/2 + jS | T/2 + kP                          |

Measure a metope between the adjacent triglyph edges, not their centres.
Measure a bay between column axes, not the clear distance between shafts.
For every treatment, the corner strip plus the corner axis offset equals
(B − T)/2. This preserves the distinction between moving a corner triglyph and
contracting a column bay; neither is silently treated as restoring every ideal.

The plan projects triglyph positions onto the outside beam faces. Its circles
indicate the columns below, not circular cuts through the architrave. The
elevation shows shortened illustrative shafts, a capital and the architrave;
only its horizontal frieze and axis dimensions are measured by the model.
No structural adequacy is inferred from these profiles.

## Text, translation and vocabulary

The app contains the four sentences beginning _namque necesse est_ and ending
_triglyphi dimidia latitudine_ in IV.3.2. They span printed pages 82–83 of
Krohn's 1912 edition. The transcription was compared visually to the bundled
scan; line breaks and sentence punctuation were adapted. The following
sentence, in which Vitruvius calls both compromises _mendosum_, is summarized
and distinguished from the application's own explanation.

The Latin _intercolumnia_ is rendered “intercolumniations” in the source reader.
The numerical workshop uses axis-to-axis bays and labels them accordingly. In
this ideal model, equal shaft profiles mean contraction changes both the axis
spacing and the clear spacing by the same amount.

Greek nouns are supplied as vocabulary headwords; this is not a fabricated
Greek original for Vitruvius's Latin. κίων can be masculine or feminine;
architectural τρίγλυφος is feminine in the cited LSJ entry, whereas Latin
_triglyphus_ is masculine. Transliterations are reading aids, not audio or a
claim to reproduce historical pronunciation.

## What would be needed for temple presets

A named building would require a stated survey, units, individual bay widths,
triglyph and metope measurements, beam-face offsets, the measurement level on
the tapering column, and known restoration uncertainties. A generic ratio
cannot stand in for that evidence. Double contraction and other whole-building
adjustments are deliberately outside the current local model.

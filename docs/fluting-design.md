# Two gauges for a carved flute

Audience and taste come from the owner's brief: fluent English speakers who
want to learn ancient architecture and Greek/Latin through consequential,
source-grounded illustrations. Keep Gonia's architectural working-sheet tone,
warm plaster, green ink, vermilion discrepancy, Plex controls and Noto readings.

The existing entasis lesson measures a flute edge without showing what a flute
is. A fourth room will make that physical feature explicit and connect two
prescriptions in Vitruvius: IV.3.9's Doric square-and-compass construction, and
III.5.14's Ionic moving right-angle check. These are prescriptions to explore,
not a claim that every surviving Doric or Ionic column follows these profiles.

## Core question

A 100 mm-wide Doric template traced through the corners of a square gives a
quarter-circle hollow, 20.710678 mm below its chord. A semicircle of the same
width is 50 mm deep. The rays from a point on the quarter arc to its ends form
135 degrees; on the semicircle they form 90. The second is the locus picked
out by a moving right-angle tool. Show the contact and the mismatch directly.

Let A=(0,0), B=(w,0), with inward depth positive. For the quarter arc, the circle
centre is C=(w/2,-w/2) and radius w/sqrt(2). Its selected point moves from
135 to 45 degrees about C. For the semicircle, C=(w/2,0), radius w/2, and the
lower arc joins A and B. The flat Doric alternative has twenty plane faces.

The local template width is a chosen 50–120 mm in 5 mm steps. A point slider
uses 5–95% of the arc, avoiding degenerate endpoint angles. The main drawing
shows the hollow, edge rays and a fixed 90-degree gauge. A separate construction
view shows the square/circle or the moving-square locus. A same-width overlay
compares the other circular recipe. Native keyboard controls accompany direct
point dragging.

## Repeating the cut around a drum

Doric recipes use 20 divisions; the Ionic recipe uses 24. An illustrative
Ionic fillet takes 0–30% of each angular pitch, initially 20%; that dimension
is a modern choice. Doric templates meet at sharp arrises; the flat option
forms a regular polygon. For half flute angle alpha and held chord width w:

```text
R = w / (2 sin(alpha))
chord radius from shaft centre = R cos(alpha)
radial deepest point = R cos(alpha) - local sagitta
```

The full section repeats the actual circular arcs with outer-circle fillets.
It does not fake fluting with radial stripes. Circular-segment areas permit
an independent numerical check of the area removed; this says nothing about
load capacity or optical perception. Holding template width fixed makes the
computed shaft diameters differ, and the interface must state that.

A printable standalone SVG keeps the model width in millimetres, includes a
25 mm calibration bar and cites the source passages. A saved illustrated HTML
reading embeds the source pages, typefaces, diagrams, grammar and exact data.
Physical printing remains unverified; the SVG's units and resulting native
PDF geometry can be inspected independently.

## Sources and readings

- Krohn's 1912 Vitruvius, printed p. 85 (PDF 103), IV.3.9: circle through
  the square's corners. Retain the editorial brackets in any quoted words.
- Same edition, printed p. 74 (PDF 92), III.5.14: XXIIII flutes and the norma.
  Its supplied `〈angulos〉` must not silently become an unmarked manuscript word.
- Aristotle, Nicomachean Ethics X.4, 1174a23–24, gives the phrase naming a
  column's fluting. It contrasts building activities, not flute profiles.
  Read the nested genitives beside a short Greek clause and its original context.
- Greek headwords and new English grammar notes remain separate from the
  Latin original. There is no invented Greek version of Vitruvius.

Before publication, compare actual SVG geometry and downloaded values to an
independent circle/intersection or numerical-area calculation. Exercise both
engines at desktop and 375 px, drag and keyboard actions, printed units, native
saved files, all four offline rooms and real hosted bytes. Preserve the existing
corner, spacing and entasis lessons and their historical evidence.

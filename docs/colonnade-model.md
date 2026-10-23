# An omitted colonnade, rather than a smaller temple

Vitruvius III.2.6 prescribes eight columns across each end and fifteen along
each flank, including the corners. He places the cella walls opposite the four
middle front columns and gives the surrounding clear width as two
intercolumniations plus one lower column thickness. III.2.7 describes double
rows around a dipteral temple. III.3.8 attributes the omission to Hermogenes.

The model isolates these relationships. It does not supply a reconstruction of
Magnesia's porches, inner room, bases, steps or roof. No claim about original
construction sequence follows from switching between the two arrangements.

## Coordinates and faces

All lengths use a lower shaft diameter D = 1. The chosen clear gap g varies
from 1.5 to 3 in quarter-diameter steps. The axis pitch is p = g + 1.

| Feature                     | Longitudinal grid coordinate | Transverse grid coordinate |
| --------------------------- | ---------------------------- | -------------------------- |
| Outer ring                  | 0 through 14                 | 0 through 7                |
| Inner ring                  | 1 through 13                 | 1 through 6                |
| Enclosure wall centre lines | 2 and 12                     | 2 and 5                    |

A ring contains only lattice positions on its rectangular boundary, not all
positions in the grid. Physical coordinates are the grid indices multiplied
by p. The wall thickness is a chosen 1 D. Consequently the outer wall face
on one flank is at 2p - 1/2. The outer shaft's inner face is at 1/2.

Their separation is `(2p - 1/2) - 1/2 = 2p - 1 = 2g + 1`.
The inner shaft spans p - 1/2 through p + 1/2. With that shaft present,
both remaining face-to-face gaps are g. With it absent, its diameter joins
the two gaps into one strip of width 2g + 1. At g = 2.25 the narrow gaps are
2.25 D and the joined strip is 5.5 D.

This is a strip through shaft centres. Between successive inner columns the
two narrow lanes communicate; the row is not a wall. Actual bases project
beyond the shafts and would change usable floor clearances. No occupancy,
roof-span feasibility, load, money or labour estimate is computed.

The unchanging circle scale is 16 drawing units per D. Desktop places the
long direction horizontally; phones place it vertically with separately
positioned labels. Both diagrams use equal horizontal and vertical scales.
Enlargement changes the viewing scale, not the model. The phone's independent
upright strip preserves the same face distances.

## Count a boundary without reusing a corner

| Ring  | Both ends, including corners | Both flanks, excluding corners | Total |
| ----- | ---------------------------- | ------------------------------ | ----- |
| Outer | 2 x 8                        | 2 x 13                         | 42    |
| Inner | 2 x 6                        | 2 x 11                         | 34    |

The circuit starts at one end, crosses the lower flank, returns along the
other end and finishes along the upper flank. Every position has a stable ID,
grid coordinate, physical coordinate, ring, side, corner status and circuit
order. Omitting the inner ring changes its `present` flag, without moving a
position or the enclosure. The potential inventory always has 76 positions.
The drawing deliberately retains dashed omitted positions. They are not
excavated foundation locations.

## Why the model cannot settle 34 versus 38

Krohn's p. 66 prints xxxiv in the main text. The line-4 apparatus says
`xxxiv Phil: xxxviii x`: an attribution of the 34 reading to Philander,
beside the transmitted 38. A simple ring gives 34 positions. This shows why
the number may look geometrically attractive, without establishing that an
editor should accept it.

Pavlos Lefas, “How Many Columns Did Hermogenes Remove? A Comment on Vitruvius'
De Architectura III,3,8,” _Revue archéologique_ 2001/1, pp. 93–103,
[DOI](https://doi.org/10.3917/arch.011.0093), argues for 38 through an
interpretation involving the inner building's ends and antae. Only the
publisher's abstract was accessible for this work. Its argument is identified
and linked, not reproduced as a proven reconstruction or used to silently
change the outer grid. No modern figure from that paper is bundled.

## Evidence and preservation

The restored plan on p. 43 of the 1904 excavation publication has porch and
interior columns beyond the outer 42, and a wider central opening at the ends.
It is not the equal grid above. The p. 41 preserved-state plan uses different
material and preservation symbols. The capital on p. 55 is a photographed
fragment, not a photograph of a complete temple.

Shared links preserve arrangement, gap, selected part, traced ring and count,
Latin word, and independent source page. They do not preserve pan or zoom.
The CSV retains all potential positions with explicit present/omitted flags.
The portable reading embeds both arrangements, the selected passage strip,
all vocabulary and readings, five complete source images, fonts and licenses.
Each embedded asset is SHA-256 verified before saving. No script or runtime
network service is needed to open it.

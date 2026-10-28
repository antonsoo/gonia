# The arch and the pier

## Design decision

Vitruvius VI.8.3-4 connects radial wedge joints, relieving arches and wider outer
piers. This room makes one question operable: can a set of joint reactions fit
the arch while its piers require a reaction beyond their bases?

The main view is a large, labelled section through thirteen stones, including
the supports down to their bases. Blue traces forces; raspberry marks a missed
joint or base. The geometry controls sit beside this section. An inspector
enlarges any joint without shrinking its labels on a phone. The ancient Latin
and complete printed page follow the experiment. They never appear as a
derivation of modern statics.

Palette: chalk #f8f9fc, stone #dddfe8, ink #24304d, force blue #2458bd,
contact gold #9b6500, missed-contact raspberry #a72c50. Plex is the working
typeface; Noto Serif is reserved for source-language reading. Text is left
aligned. The arch itself supplies the visual identity; decorative ruins,
dashboard tiles and antiqued textures add nothing.

```text
  geometry |     stone section and force path
           |     arch check / pier check
  trial H  |     enlarged selected joint
  bearing  |     all possible H intervals
  ---------+--------------------------------
  Latin clause | new English | whole source page
  saved experiment with actual source pages
```

## Geometry and loads

Lengths use the centreline half-span a = 1. Rise f ranges from 0.30 to 1.00;
radial thickness t ranges from 0.10 to 0.40. The circular centreline has
R = (1 + f^2)/(2f), centre (0, f-R), and endpoints (-1,0), (1,0).
The inner and outer radii are R-t/2 and R+t/2. Thirteen equal-angle annular
sectors are rigid blocks. Their self-weight is proportional to area and
renormalized so the complete arch weighs W = 1 for **each** geometry.

Each sector's vertical weight acts at its exact area centroid. Its radius is
4 sin(d/2) (Ro^3-Ri^3) / (3d (Ro^2-Ri^2)), where d is its angle. This differs
from placing weight on the centreline. Extra vertical load acts on stone 7,
or equally on stones 4 and 10, on the same vertical lines as their centroids.
It does not represent a distributed wall or historical loading measurement.
Symmetry makes each vertical support reaction V = (1 + extra load)/2.

## Joint equilibrium

Choose horizontal reaction H > 0 and the radius of contact on the left spring
joint. Its position (xL,yL) sets C = H yL - V xL. At joint j, let Qj be
V minus all weights to its left; let Xj be the sum of those weights times
their centroid x coordinates. The line of action obeys

    H y - Qj x = C + Xj.

On its radial joint, normal force N = H sin(theta) - Qj cos(theta), and
the intersection radius is (C + Xj - H cy)/N. For these symmetric downward
loads N is positive. A joint is admissible when its radius lies between Ri
and Ro. Edge contact is a limiting ideal state, not a finite stress solution.
The experiment does not require the middle third: partial contact is allowed
under the no-tension, unlimited-compression idealization.

The drawn line joins the interface contacts to guide the eye; it is not a
continuous stress solution inside the stones. We check **all fourteen
interfaces**, not a sampled continuous arch or internal stresses.
No inference about a continuum arch's minimum thickness is made from this
fixed thirteen-block discretization.

## Finding every admissible horizontal thrust

Each inner edge gives C >= H yi - Qj xi - Xj; each outer edge gives
C <= H yo - Qj xo - Xj. Write these as Li(H) <= C <= Uj(H).
Eliminate C by imposing every pair Li(H) <= Uj(H). Each pair bounds H
above or below, or makes the domain empty. Intersect all bounds with H > 0.
This computes a whole interval without a search grid or an arbitrary H cap.
At any H in that interval, max Li <= C <= min Uj gives all allowed C.
The automatic path picks an interior H, no further than max(0.1, Hmin/2)
above the lower limit, then the midpoint of C's interval. A thick shallow ring
can have an unbounded H interval under unlimited compression: a nearly
horizontal force path can cross every joint. The automatic path still picks
a finite witness. This is a consequence of the idealization, not infinite
capacity in actual masonry. Neither witness predicts unique real forces.

## Piers

Each rigid support has base centre x = +/-1, base width b, height h = 1
below the centreline spring level, and specified weight P at that horizontal
centre. Geometry is schematic: a shaped head meets the inclined spring joint.
Pier weight and base width are independent controls; increasing width does
not silently increase weight. The support's weight acts on its centreline.

The left base resultant has xB = (-C-P-Hh)/(V+P). Relative to its centre,
outward eccentricity is e = (C+Hh-V)/(V+P). The right support is its mirror.
The base can carry compression when |e| <= b/2. These inequalities add
one more lower and upper affine bound on C. The same complete interval
solver can therefore check the arch with its bases, rather than checking a
single arbitrary arch path and declaring that all paths fail.

This is an overturning/contact check. It presumes sliding cannot occur at
the joints or bases. No soil bearing, settlement, mortar, crushing, elastic
deformation, lateral loading, dynamic behavior, construction sequence or
three-dimensional restraint is modelled. A matching line certifies only the
stated finite equilibrium model. This is a learning experiment, not a tool
for designing or assessing a structure.

## Modern references

- Jacques Heyman, "The stone skeleton", _International Journal of Solids and
  Structures_ 2.2 (1966), DOI: https://doi.org/10.1016/0020-7683(66)90018-7.
- Philippe Block, Thierry Ciblac and John Ochsendorf, "Real-time limit analysis
  of vaulted masonry buildings", _Computers & Structures_ 84 (2006),
  https://doi.org/10.1016/j.compstruc.2006.08.002. Their no-tension,
  unlimited-compression and no-sliding assumptions inform the model boundary;
  our finite calculation and drawings are new.
- ETH Zurich, _Arch bridges_, Chair of Concrete Structures and Bridge Design,
  2025 lecture slides: https://concrete.ethz.ch/assets/brd/slides/arch-bridges-2025-04-07.pdf.
  Linked for modern force-path context. No modern illustrations are bundled.

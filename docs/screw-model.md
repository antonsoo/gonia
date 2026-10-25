# Eight channels, one revolution

The water-screw room reads Vitruvius X.6.1–4 in F. Krohn's 1912 edition,
printed pp.237–239. III.1.8, printed p.62, defines the foot used in the
dimensional conversion. The [retained manifest](../public/sources/screw/manifest.json)
maps all five complete images, including the title, to the original PDF.
No source page is cropped or reconstructed. Apparatus and adjacent text remain visible.

| Edited source instruction                                                          | Geometrical interpretation in this room                                                             |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| As many digits of shaft thickness as feet of length                                | With 16 digits per foot, shaft diameter = L/16                                                      |
| Total thickness one eighth of the length                                           | Finished outside diameter = L/8                                                                     |
| Divide each end into eight equal parts                                             | Eight circumferential starting positions                                                            |
| Axial intervals equal an eighth of the circumference                               | Square cells on the unrolled source shaft                                                           |
| Lay a strip obliquely through successive crossings and return to its starting line | Conventional reading: eight diagonal advances complete a turn; pitch P equals shaft circumference C |
| Repeat through all eight divisions                                                 | Eight helical blades; adjacent starts are separated axially by P/8                                  |
| Enclose with sealed boards                                                         | Rotating watertight casing in the ideal model                                                       |
| Right triangle: screw length 5, rise 3, run 4                                      | sin(alpha) = 3/5; tan(alpha) = 3/4                                                                  |

The phrase _a primo in octavum punctum_ compresses the counting. The room
states the conventional pitch interpretation explicitly rather than silently
turning the edited Latin into a complete fabrication specification. Shaft and
outside thickness are interpreted as diameters. Joints, bearings and the
treading drive are not reconstructed. The source's fragment _capita tigni ferrea_
is not expanded into an invented construction sentence.

With outside radius R=1, L=16, inner radius rho=1/2 and P=pi. The unrolled
drawing uses the same axial and circumferential scale. It distinguishes one
blade's full pitch from spacing between starts. Its first two stages show the
circular end, the third the grid, the fourth one strip and the last two the
repeated starts. The water analysis always describes the finished machine.

Gwilt's 1826 English uses "inches" where Morgan's 1914 English uses "digits".
The room's twelve-part-foot option asks what a modern reader would construct
if "inches" were interpreted as twelfths. It is a modern reading experiment,
not a second prescription attributed to Vitruvius. Holding the outside diameter
and length fixed changes the inner radius to 2/3 and increases the source-like
pitch to 4pi/3. No absolute Roman foot in metres is required.

The twelve excerpts join line-end hyphens and normalize paragraph/sentence
punctuation. Ellipses identify omissions. English and grammar notes are new
learning aids. Latinized Greek loans are identified without inventing a Greek
original. The five full pages preserve the printed text and apparatus independently
of the excerpts.

## Modern filled-bucket analysis

Reference: [Chris Rorres, The Turn of the Screw: Optimal Design of an Archimedes Screw](https://www.cs.drexel.edu/~crorres/screw/screw.pdf),
Journal of Hydraulic Engineering 126(1), 72–80 (2000),
DOI [10.1061/(ASCE)0733-9429(2000)126:1(72)](https://doi.org/10.1061/%28ASCE%290733-9429%282000%29126%3A1%2872%29).
All workshop drawings and code are original; no paper figures or text are bundled.

Let K=tan(alpha), lambda=KP/(2piR), and delta=2pi/N. Blade angle at position x
is theta=2pi*x/P+phase. Positive operating rotation decreases phase. A fixed
bucket coordinate phi therefore lies at x=P(phi-phase)/(2pi) and advances P
in a full revolution. The same material blade returns to its original pose.

The source setting has rho=1/2 and lambda=3/8. In a perpendicular cut, the
waterline is

    w(phi) = rho*sin(phi0) - lambda*(phi-phi0)
    phi0 = acos(-lambda/rho) when lambda < rho; otherwise pi.

Intersect the annular sector between adjacent blades with r*sin(theta) <= w.
Select the connected bucket around its first bottom, excluding neighbouring
buckets across the dry crest. The code integrates radial and angular clipping
analytically, splitting at every change of circle/waterline boundary. An
adaptive Simpson integration sums section areas along the axis.

The wet endpoint has three possible kinds of contact: a lower blade edge,
the lowest point of the casing, or the upper blade edge. At shallow slopes
the last upper-edge contact can occur at the inner shaft, above the axis.
Assuming an outside-edge contact there truncates a wet tip. Independent radial
integration exposed this error during development; the corrected four-start,
50%-pitch, 15-degree example has water fraction about 0.460370929.

The reported integration error is an estimate, not a rigorous bound. The wet
support is solved before integration so that extremely small pockets near
lambda=1 cannot fall between samples of a mostly dry interval. SVG outlines
include exact circle/waterline junctions before approximating circular arcs.

| Pitch/slope condition | Ideal retained region                  |
| --------------------- | -------------------------------------- |
| lambda < rho          | Spill surface touches the shaft        |
| rho <= lambda < 1     | Small outer pockets; shaft remains dry |
| lambda >= 1           | No retained bucket                     |

At the source pitch these thresholds occur at 45 degrees and atan(2), about
63.435 degrees. Source water fraction is approximately 0.1703168626. Water per
turn is approximately 1.680960057 R^3. The denominator of the fraction is the
whole pitch-length cylinder pi*R^2*P, including the shaft. It is not hydraulic
efficiency. Halving the source pitch increases both fraction and volume per
turn; quartering it increases the fraction further but reduces volume per turn.

The projected world coordinates use the inclined shaft as one axis and a
vertical radial direction as another. Substituting the bucket-position equation
into world height gives cos(alpha)*(intercept-lambda*phase), independent of the
chosen cut. Thus the dashed blue spill level is horizontal and rises by
P*sin(alpha) over a complete revolution. Blue shows one section, not a complete
fluid simulation or every filled channel.

No blade thickness, leakage, friction, sloshing, end loss, inlet filling rate,
drive power or actual operating speed is inferred. The timed turn is a teaching
motion. The 30 mm core wrap is a one-pitch surface exercise with a 25 mm
calibration bar; physical assembly and pumping have not been tested.

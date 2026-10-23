# A stone turns before it stands

Vitruvius X.2.11–14 describes transport to the temple at Ephesus: Chersiphron's
shafts roll in a pulled frame, Metagenes encloses architrave ends in wheels,
and a later contractor, Paconius, uses a rope-driven machine that veers.
Krohn's 1912 printed pp. 230–231 are bundled in full. The page numbers in the
outer margins refer to an earlier pagination; use the printed headers when
comparing the room with this edition. PDF pages are 248–249.

The model follows one end section as it turns clockwise. The camera tracks
the centre C horizontally; the road ruler moves to show advance. Both physical
axes share one scale. A separate graph uses degrees and lengths, explicitly
different units. Two end wheels overlap in this projection. The wheel and
enclosed stone rotate together; the full frame and bearings are not restored.

## What can be learned

| Example                                                | Centre height through a turn       | Advance per turn            | Result                                                          |
| ------------------------------------------------------ | ---------------------------------- | --------------------------- | --------------------------------------------------------------- |
| Circular shaft, chosen radius 6                        | Constant 6                         | 12π ≈ 37.699112             | A circle can be its own roller                                  |
| Bare 8 × 6 rectangle, modern counterexample            | Between 3 and 5                    | Perimeter 28                | The centre must rise and fall                                   |
| Same section in chosen radius-6 wheels                 | Constant 6                         | 12π ≈ 37.699112             | Minimum geometric clearance 1                                   |
| Same section in radius-4 wheels                        | Constant 4 in the attempted motion | 8π ≈ 25.132741              | Clears at 0° and 90°, obstructed between them                   |
| Paconius reading: 8 × 6 end section, wheel diameter 15 | Constant 7.5 source feet           | 15π ≈ 47.123890 source feet | Minimum clearance 2.5, without establishing successful steering |

The radius-4 example is particularly useful: checking only quarter-turns misses
the collision. At 45° its lowest corner is `4 - 7/sqrt(2) ≈ -0.949747`.
The deepest possible intrusion is one unit, at a different angle. Red below
the road shows that geometric conflict; the app does not pretend the obstructed
pose is physically possible. The complete-turn verdict remains negative even
when the selected pose itself clears.

The source gives no cross-section for Metagenes's beams. The initial 8 × 6
section is a chosen illustration, not a missing ancient measurement. In the
Paconius account, 12 × 8 × 6 dimensions are explicit. The preset takes the long
dimension along the wheel axis, and follows Morgan's usual diameter reading of
the roughly 15-foot wheels. These interpretations are stated in the interface.
Source feet remain symbolic; no conversion to metres is made. Altering that
preset is labeled as exploration rather than additional source evidence.

## Rolling geometry

For a circle of radius R turning through θ radians without slip,
`x = Rθ`, `y = R`. A rectangular body centred at that axis has local vertices
`(±w/2, ±h/2)`. Clockwise rotation maps each local point `(u,v)` to

```text
x_local = u cos θ + v sin θ
y_local = -u sin θ + v cos θ
```

Its lowest corner reaches
`H(θ) = (w/2)|sin θ| + (h/2)|cos θ|` below the centre. The maximum reach is
`sqrt((w/2)^2 + (h/2)^2)`, half the diagonal. Thus constant-height wheels need
at least that radius for a full turn. Merely exceeding h/2 at the initial pose
is insufficient. Exact tangency is geometrically clear in this ideal model;
no tolerance or safety allowance is inferred.

Without wheels, the rectangle rotates about its advancing lower ground corner.
Let `a=w/2`, `b=h/2`, `q=floor(angle/90°)`, and `φ=angle-q*90°`.
For even q use `(A,B)=(a,b)`; for odd q use `(A,B)=(b,a)`:

```text
centre_x = q(a+b) + A(1-cos φ) + B sin φ
centre_y = A sin φ + B cos φ
```

The endpoints at 360° are retained as a completed turn rather than reset to
the initial position. Four quarter-turns advance `4(a+b)=2(w+h)`.
At flat-face contact the two edge endpoints are marked; between them the
single instantaneous support corner is marked. The active corner remains
fixed on the road during its interval. The independent checker instead moves
the complete polygon about successive support vertices; it does not import
or restate the application's quarter-turn expression.

## Reading decisions

The Latin excerpts retain Krohn's text, join line-end hyphens and normalize
Roman numeral capitalization. The critical apparatus is visible. A printed
gap in the timber-frame description is not filled by invented dimensions.
The room follows Krohn's _Paconius_; the name's variants remain in the apparatus.
English translations and grammar notes are new reading aids, not a new edition.

| Latin in the account | Reading role                                           | Related Greek headword                   |
| -------------------- | ------------------------------------------------------ | ---------------------------------------- |
| cnodaces             | Nominative plural, pivots that can turn freely         | ὁ κνώδαξ, genitive κνώδακος              |
| armillis             | Ablative plural after in, within bearing rings         | No fabricated Greek counterpart supplied |
| epistylia            | Neuter plural subject, architraves enclosed like axles | τό ἐπιστύλιον, genitive ἐπιστυλίου       |
| cylindri             | Rollers in the palaestra comparison                    | ὁ κύλινδρος, genitive κυλίνδρου          |

Greek morphology and meanings were checked in rendered LSJ entries through
Logeion. These are dictionary headwords explaining Latin technical vocabulary,
not a Greek original or back-translation. Each entry is linked in the live and
saved readings. _Armillae_ name bearing rings; _rotae_ name the road wheels.
Free rotation does not mean self-powered motion: the account supplies oxen.

## Outputs and limits

URLs retain kind, dimensions, radius, integer-degree pose, unit label and source
page. Conflicting known fields and invalid dimensions reset the entire state
with an explanation. CSV contains one selected row and 361 full-turn samples.
Columns distinguish the rectangular reference dimensions and circular reference
radius, including when one geometry is inactive. Those references also label
the comparison graph. No mass, force or steering result is synthesized.

Saved HTML captures the click-time settings, verifies both JPEGs, two fonts
and both font licenses, and embeds their original bytes. It includes complete
source pages, diagram, height graph, Latin, all nine grammar notes, Greek headwords and exact CSV bytes.
It contains no scripts or runtime network requests. Magnification and source
scroll position are local reading aids, not historical parameters.

This is flat-road, rigid-body, no-slip kinematics. Soil, actual bearing friction,
tapered shafts, frame reconstruction, rope winding, forces, matched masses,
animal effort and steering are absent. The report of veering cannot be explained
by a two-dimensional clearance model. A geometrically admissible turn does not
validate a machine, establish the account's historicity or give engineering advice.

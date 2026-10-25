# A prescribed inclination and a chosen observer

The source is Vitruvius III.5.13, Krohn 1912, printed p.74, lines 11–20.
It names members above the capitals, prescribes a forward inclination by one
twelfth of each member's height, compares two lines from the eye and claims
that the treatment will make the members seem plumb and square. The short
context from III.5.9 appears on p.73, lines 3–4. The complete preceding p.72
is also retained, including the start of the discussion of sight at height.

| Source quantity                              | Modern choice or consequence                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Forward inclination by one twelfth of height | Offset / vertical rise = 1/12; alpha = atan(1/12), about 4.764 degrees        |
| Two lines extended from an eye               | Euclidean distances from a chosen eye to endpoints of one chosen flat member  |
| A claim about appearing plumb and square     | Equal endpoint distances define this experiment's narrower front-on criterion |
| No specified observer distance               | The model derives d = 12(H-e), rather than attributing it to Vitruvius        |
| A list of upper members                      | The diagram isolates a flat face, without reconstructing every listed object  |

The face has a fixed edge length L and rotates about C=(d,H). Its upward unit
tangent is t=(-sin alpha, cos alpha). The eye is E=(0,e). The five physical
marks are P=C+fLt, with f=-1/2,-1/4,0,1/4,1/2. The source treatment therefore
has forward offset L/sqrt(145) and vertical rise 12L/sqrt(145). Keeping L fixed
allows fair projection comparisons; that centre rotation is a modern choice.

Endpoint squared-distance subtraction gives

    |T-E|^2 - |B-E|^2 = 2 L [-d sin(alpha) + (H-e) cos(alpha)]

Equal rays occur when tan(alpha)=(H-e)/d. At the default heights H=12 m,
e=1.6 m, the source slope therefore meets this criterion at d=124.8 m. At
30 m the upper ray is longer; beyond 124.8 m it is shorter. Turning the face
normal toward the eye meets the criterion for every allowed observer, but
changes the inclination. All distances are chosen modern metres.

The pinhole camera aims at C. Let R=|C-E|, v=(C-E)/R and q=P-E. Its signed
image height is (q dot v-perpendicular)/(q dot v). Multiplication by R/L
normalizes the face-on endpoints to -1/2 and +1/2. The displayed ratio compares
the projected upper and lower halves. This is not an experiment on perceived
verticality, and equal endpoint ray lengths do not establish the perception
Vitruvius describes. The earlier air-density theory is not used by the model.

The side-view drawing uses one horizontal and vertical scale. The angular
detail and projected rulers have their own scales. Integral decimetres and
tenths of a degree are state encodings, not claims about ancient precision.
The custom-angle control permits geometric counterexamples, not structurally
safe building advice.

## Source identities

The [manifest](../public/sources/optics/manifest.json) identifies the original
PDF by SHA-256 and maps printed pages 72, 73, 74 to PDF pages 90, 91, 92.
All are complete pages, including apparatus. The title image is reused from
the earlier hoist source set. The three new renders use a 2100-pixel long edge
and JPEG quality 88, without cropping or retouching. Excerpts join line-end
hyphens and capitalize XII. English and grammar notes are new.

The [Met object record](https://www.metmuseum.org/art/collection/search/252453)
identifies the Sardis column, accession 26.59.1, about 300 BCE. The assembled
display includes restored shaft portions and a copied profiled base. It is
not a complete in-situ column or evidence for this model's inclination. The
original 3738-by-3790 image and API metadata are retained unchanged under
[The Met's CC0 Open Access policy](https://www.metmuseum.org/hubs/open-access).
The upper building is absent. Background museum columns are separate objects.

Greek companions epistylion and kathetos have direct Perseus/Scaife lexicon
links in the readings. They are vocabulary aids, not a Greek original of the
Latin. Historical scans are public domain; new text/code/diagrams are MIT;
Noto and Plex retain their complete OFL notices. The complete exported study
checks all eleven retained source/font identities before downloading.

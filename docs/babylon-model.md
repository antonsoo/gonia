# A tower between two sources

The room compares two stated datasets for Etemenanki, the ziggurat in Babylon.
It is not a reconstruction of the built tower. The learner can change one
supplied row, remove that row, choose an image calibration and inspect the
actual stone scan. Different readings and measurement assumptions remain
visible in the resulting drawings and saved files.

## The numerical source

AO 6555, the Esagil tablet, is catalogued by the
[Louvre](https://collections.louvre.fr/en/ark:/53355/cl010167181). Its colophon
identifies a copy at Uruk, Seleucid year 83 (229 BCE), from a Borsippa exemplar.
That is later than Nebuchadnezzar II's building. A copied and checked text is
not an excavator's elevation survey.

The retained public-domain pages are Scheil 1914, pp. 300, 304 and 305, and
Thureau-Dangin 1922, TCL 6 no. 32, plates LIX and LX. The complete pages let a
reader see the missing row and differences in interpretation. The independent
model uses this conventional scheme, with 6 m per nindanu:

| Part               | Length (rods) | Breadth (rods) | Height (rods) | Status in this comparison                                     |
| ------------------ | ------------: | -------------: | ------------: | ------------------------------------------------------------- |
| Lower brickwork    |            15 |             15 |           5.5 | Conventional reading; 5.5 appears explicitly on Scheil p. 300 |
| Second storey      |            13 |             13 |             3 | Numerical row                                                 |
| Third              |            10 |             10 |             1 | Numerical row                                                 |
| Fourth             |           8.5 |            8.5 |             1 | Numerical row                                                 |
| Fifth              |             7 |              7 |             1 | Numerical row                                                 |
| Sixth              |           5.5 |            5.5 |             1 | Entire row supplied in the conventional completion            |
| Seventh, sanctuary |             4 |           3.75 |           2.5 | Modern interpretation of the breadth; rectangular footprint   |

The written sequence jumps from fifth to seventh. With the sixth row removed,
the conventional stated heights sum to 84 m. The tower's total height and the
sanctuary's elevation remain unresolved. They do not become 84 m and 69 m.
The CSV leaves unknown dimensions and the sanctuary's unknown bottom blank.
The diagram shows a labelled layout gap and removes the metre ruler above it.
It never treats the graphic gap as a measured six-metre storey.

With a supplied sixth height h, the computed total is 84 + h metres. The
default h is 6 m; it completes a 90 m scheme. The learner's integer controls
represent quarter-rods, a modern interface choice. Their bounds keep the
supplied footprint between the sanctuary and fifth terrace. They do not define
the range of possible ancient reconstructions or prove structural feasibility.
[Montero Fenollós, with Vegas and Mileto, p. 204](https://revistas.uam.es/isimu/article/download/3374/3591),
discusses a 66 m proposal that reinterprets other rows as well. A sixth-row
control with the other conventional dimensions fixed cannot reproduce it.

There are two editorial differences worth retaining rather than silently
harmonizing. Scheil's reading of the sanctuary breadth differs from the modern
3.75 used in the model. Also, the retained BTTo online transliteration shows
2.5 in the lower-height position while its English translation shows 5.5. The
activity explicitly uses the 5.5 in the retained early numerical row and the
conventional scheme. It does not claim an independent collation of the clay.

The 6 m conversion is confined to this scheme. The full tablet discusses
different cubit standards. Applying the same conversion to every section of
the text would erase that distinction.

## The image source

Olof Pedersén's [2024 study](https://doi.org/10.1017/irq.2024.4), published in
IRAQ 85 (2023), pp. 179–191, includes a photograph, a provisional drawing and
the following rounded centimetre measurements (pp. 188–189):

| Part from below | Width on image (cm) | Height on image (cm) |
| --------------- | ------------------: | -------------------: |
| First terrace   |                12.4 |                  3.7 |
| Second          |                11.0 |                  1.3 |
| Third           |                 9.7 |                  1.2 |
| Fourth          |                 8.4 |                  1.2 |
| Fifth           |                 7.0 |                  1.2 |
| Sixth           |                 5.5 |                  1.1 |
| Sanctuary       |                 3.9 |                  2.8 |

For assigned base B metres and selected image ruler R centimetres, the
projection factor is B/R metres per centimetre. Every image dimension is
multiplied by that same factor. The learner chooses B = 90 or 91.5 and
R = 12.5 (overall image) or 12.4 (first terrace). This distinguishes a
conventional tablet conversion from the reported excavated base and a rounded
overall width from a terrace measurement.

At B = 91.5 and R = 12.5, the rounded heights project to 91.5 m and the second
terrace to 9.516 m. At R = 12.4 the projected total is about 92.24 m. These are
new arithmetic results under disclosed assumptions, not extra precision in
the original measurements. The paper also reports 12.5–12.8 cm overall height
and discusses raised ground. The UI retains the corresponding projected range.

The plan-scale exercise uses the paper's approximately 1.8:1 relative scale
between the top-sanctuary plan and elevation. It does not measure new pixel
coordinates or use the king as a human ruler. Agreement after dividing by 1.8
is a consequence of applying that reported ratio, not independent validation
of the building's size.

The provisional drawing's grey parts remain grey. Its stairs, buttresses and
lost surface cannot be inferred from the rectangular comparison outlines.
The numerical silhouettes are modern, centred rectangles with equal metre
scales. The scan below them is of the stone, not the tower.

## The photogrammetric object

[Zenodo 10374395](https://doi.org/10.5281/zenodo.10374395) retains Olof
Pedersén's October 2023 photogrammetry under CC BY 4.0. The workshop preserves
all 103,234 source positions and all 189,027 source triangles, including the
support surface. It does not simplify, crop, fill holes or invent hidden walls.

`scripts/babylon-mesh.py` checks the original OBJ SHA-256 before conversion.
It explicitly omits the deposited file's 104-byte opaque trailer after the
last face, joins only identical position/UV pairs, converts coordinates to
float32 and computes new area-weighted vertex normals. Source triangle order
and texture coordinates are retained. The compressed binary uses a `.mesh`
extension so servers do not apply HTTP gzip decoding before the application's
byte-identity check and explicit decompression.

The 8192-pixel texture atlas is reduced to 2048 pixels with Pillow; parameters
and original identities are retained in the public manifest. The photographic
texture includes its original lighting. The neutral rendering uses only the
captured geometry and new averaged normals with a modern directional light.
This is not reflectance transformation imaging or a recovery of lost signs.

The initial camera maps source axes with a proper rotation (no reflection),
then turns the scan upright. Camera turn, tip, light, enlargement and a
top-surface focus have native keyboard controls. Changing the camera does not
change the source coordinates. Without WebGL 2 the numerical workshop,
verified photograph and illustrated export remain available.

## Transmission and uncertainty

The stone's provenance is not a controlled modern excavation. Pedersén's
1990s find account comes from villagers and lacks photographic corroboration.
His article records the December 2023 return to Iraq. Authenticity has been
debated; [George 2024](https://doi.org/10.2143/BIOR.81.1.3293875) argues that
the monument is genuine. The workshop does not settle authenticity, provenance,
the actual tower height or construction history by rendering a scan.

Normalized numerical reading aids use capitals for sign labels and lowercase
for Akkadian words. Lexical mappings are checked against Giulia Lentini's
BTTo Q007970 (Living Among Ruins, LMU Munich), adapted from A. R. George 1992.
The corpus JSON declares CC0; the portal credits its edition under CC BY-SA
3.0. New English aids identify omissions and editorial differences. They are
not a diplomatic transcription or an audio reconstruction of Akkadian.

## Reproduction and portable records

The public [manifest](../public/sources/babylon/manifest.json) identifies the
original PDF, source-page reductions, unchanged extracted article JPEGs,
corpus archive, original scan and texture, final files and related fonts.
All displayed images and export assets are checked against retained hashes.
A late response cannot replace a newly selected source; a wrong valid JPEG
or mesh is refused and can be retried after recovery.

The native JSON and shared URL preserve the numerical comparison, including
inactive supplied dimensions when the row is unknown. Scan angles and plan
inspection are separate reading controls. The illustrated HTML captures the
actual current scan rendering and its settings when loaded, all seven source
images, the full 2024 PDF, numerical CSV/JSON, fonts and licenses. It has no
scripts. Its scan snapshot is static; its source-article and native-record
download links work without a network.

The standalone SVG contains both metre-scaled comparisons, the editable
record, a font and full MIT/OFL notices. It contains no scan geometry and
does not present the stone as a reconstructed tower. Physical printing and
tagged-PDF accessibility require separate evidence.

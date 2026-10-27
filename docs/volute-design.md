# The compass changes centre

Audience: an English-speaking learner of Greek architecture. Job: draw the
outer edge of an Ionic volute using a later printed compass construction, then
measure the distinction between curves meeting and sharing a tangent.

The ancient passage and the later drawing must remain visibly different sources.
Vitruvius III.5.6 gives the eye's proportions and a reduction rule; III.5.8
promises a figure. We do not substitute a Renaissance construction for that
missing figure. The operable plate follows the twelve labelled centres and
quarter-turn instruction of Juglaris and Locke's **1889** English Vignola,
plate XV. The nested squares are an exact modern interpretation of that plate,
not measurements of an ancient capital or a claim about Vignola's original
engraving. Our computation can test its own ideal curves more precisely than
the scan can establish a drawn line's accuracy.

Palette: drawing paper #f2f6fa; ink #263b50; guide blue #466b92;
grid #cfdeeb; compass plum #80446d; repair green #286653. Existing self-hosted
Plex provides controls and prose; Noto Serif carries the title and Latin;
system monospace carries coordinates. The room belongs to Gonia but its cool
drafting sheet differs from the other rooms' warm architectural plates.

Layout:

```text
Gonia / Ionic volute                 draw | read | keep
The compass changes centre.         one physical action, one precise question
+--------------------------------+----------------------------+
| drawing sheet                  | enlarged eye, 12 pin sites |
| actual circular arcs           | selected centre + command  |
| current compass legs           | undo / finish / start      |
+--------------------------------+----------------------------+
| inspect a join                 | align the next centre      |
| actual tangent directions      | measure the displaced end  |
+--------------------------------+----------------------------+
ancient Latin / new English / word notes / whole source pages
native record / measurements / printable compass sheet / portable reading
```

Signature: the small eye becomes a large operable pin map, with twelve native
buttons at the actual centre positions. The full sheet keeps equal horizontal
and vertical scales. It is a tool for placing compass legs, not a picture of a
generic Ionic order. No decorative animation or invented progress score.

Critique before implementation: an initial idea to make another slider-driven
spiral would repeat existing workshops. The chosen interaction instead records
the learner's actual sequence of centre choices, including repeated/wrong pins.
Each command performs a real 90-degree rotation. The final eye contact and the
join angles follow from that sequence; they are not preset feedback.

Local exact arithmetic uses twelfths of the eye diameter. The optional repair
projects one next centre onto the incoming radius. It aligns that one tangent
and moves the following endpoint; it does not claim to repair the entire volute
or recover a lost ancient construction.

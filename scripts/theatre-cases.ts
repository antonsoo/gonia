import { THEATRE_DEFAULT, theatreModel } from "../src/core/theatre";

for (const diameter of Array.from({ length: 25 }, (_, i) => i + 12))
  for (const [kind, arc] of [
    ["roman", "three"],
    ["greek", "three"],
    ["greek", "single"],
  ] as const) {
    const model = theatreModel({ ...THEATRE_DEFAULT, kind, arc, diameter });
    console.log(
      JSON.stringify({
        diameter,
        kind,
        arc,
        stageDepth: model.stageDepth,
        area: model.area,
        vertices: model.vertices,
        boundary: model.boundary,
        probes: Array.from({ length: 101 }, (_, probe) => {
          const m = theatreModel({ ...THEATRE_DEFAULT, diameter, kind, arc, probe });
          return { y: m.probeY, width: m.probeWidth };
        }),
      }),
    );
  }

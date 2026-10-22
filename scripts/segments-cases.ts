import { FLUTING_DEFAULT, type FlutingState } from "../src/core/fluting.ts";
import { segmentPair, segmentsCsv } from "../src/core/segments.ts";
import { segmentDrawing } from "../src/segments-drawing.ts";

const cases = [];
for (const recipe of ["doric", "ionic"] as const)
  for (const width of [50, 75, 100, 120])
    for (let point = 5; point <= 95; point++) {
      const state: FlutingState = { ...FLUTING_DEFAULT, recipe, width, point };
      cases.push({
        state,
        pair: segmentPair(state),
        drawings: point % 5 === 0 ? [segmentDrawing(state, "P"), segmentDrawing(state, "Q")] : [],
      });
    }
console.log(
  JSON.stringify({
    cases,
    csv: segmentsCsv({ ...FLUTING_DEFAULT, width: 120 }),
    flat: segmentPair({ ...FLUTING_DEFAULT, recipe: "flat" }),
  }),
);

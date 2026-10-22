import {
  columnSection,
  type FlutingState,
  flutingQuery,
  gaugeReading,
  parseFluting,
  RECIPES,
} from "../src/core/fluting.ts";
import { printTemplate, sectionPath } from "../src/fluting-drawing.ts";

const cases = [];
for (const recipe of RECIPES)
  for (const width of [50, 75, 100, 120])
    for (const fillet of [0, 5, 20, 30])
      for (const point of [5, 17, 33, 50, 69, 83, 95]) {
        const state: FlutingState = { recipe, width, fillet, point, gauge: true, compare: false };
        const g = gaugeReading(state),
          c = columnSection(state);
        cases.push({
          state,
          gauge: g,
          column: c,
          samples: Array.from({ length: 21 }, (_, i) => g.template.at(i / 20)),
          section: Array.from({ length: c.count }, (_, i) => ({
            centre: c.circleCentre(i),
            points: Array.from({ length: 21 }, (_, j) => c.at(i, j / 20)),
          })),
          path: sectionPath(state),
          roundTrip: parseFluting(flutingQuery(state)),
          paper: point === 50 && fillet === 20 ? printTemplate(state) : null,
        });
      }
console.log(JSON.stringify({ cases }));

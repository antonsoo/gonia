import {
  compareMaxima,
  entasisCsv,
  normalizeEntasis,
  readEntasis,
  stationMeasurements,
  stations,
  writeEntasis,
} from "../src/core/entasis.ts";

console.log(
  JSON.stringify({
    source: "Penrose 1888, pp. 40-41",
    stations: stations.map((_, i) => stationMeasurements(i)),
    actual: compareMaxima("actual"),
    equal: compareMaxima("equal"),
    csv: entasisCsv(),
    roundTrips: [0, 1, 2, 3, 4].flatMap((station) =>
      ([1, 25, 100, 200] as const).flatMap((enlargement) =>
        (["none", "hyperbola", "circle"] as const).flatMap((prediction) =>
          (["metric", "feet"] as const).flatMap((units) =>
            (["actual", "equal"] as const).map((comparison) => {
              const input = { station, enlargement, prediction, units, comparison };
              return { input, output: readEntasis(writeEntasis(input)) };
            }),
          ),
        ),
      ),
    ),
    malformed: [
      "?station=NaN&enlarge=Infinity",
      "?station=-1&prediction=ellipse&units=rods&compare=unknown",
      "?station=99&enlarge=1000",
      "?station=2.5&enlarge=20",
    ].map((search) => ({ search, output: readEntasis(search) })),
    invalidNumbers: normalizeEntasis({ station: Infinity, enlargement: NaN as 1 }),
  }),
);

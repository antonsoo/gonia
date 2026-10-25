import { bucketSection, screwCapacity, screwGeometry, screwInitial } from "../src/core/screw.ts";

const cases = [];
for (const units of ["digits", "twelfths"] as const)
  for (const starts of [1, 2, 4, 8] as const)
    for (const lead of [50, 100, 150])
      for (const angle of [150, 370, 500, 620, 750]) {
        const state = { ...screwInitial, units, starts, lead, angle, sourceSlope: false },
          g = screwGeometry(state),
          c = screwCapacity(g);
        cases.push({
          state,
          geometry: g,
          capacity: c,
          sections: Array.from({ length: 17 }, (_, i) => {
            const phi = c.bucket.start + ((c.bucket.end - c.bucket.start) * i) / 16;
            return { phi, area: bucketSection(c.bucket, phi) };
          }),
        });
      }
console.log(JSON.stringify({ cases }));

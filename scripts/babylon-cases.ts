import { BABYLON_DEFAULT, babylonModel } from "../src/core/babylon";

for (const supplied of [true, false])
  for (const base of [900, 915] as const)
    for (const ruler of ["overall", "terrace"] as const)
      for (let width = 17; width <= 27; width++)
        for (let height = 1; height <= 12; height++) {
          const state = { ...BABYLON_DEFAULT, supplied, base, ruler, width, height };
          console.log(JSON.stringify({ state, model: babylonModel(state) }));
        }

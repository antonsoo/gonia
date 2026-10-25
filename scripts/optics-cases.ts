import { type OpticsMode, opticsInitial, opticsModel } from "../src/core/optics";

const cases = [];
for (const distance of [50, 300, 1248, 2500, 4000])
  for (const height of [60, 120, 300])
    for (const eye of [5, 16, 25])
      for (const length of [10, 40, 60])
        for (const mode of ["vertical", "source", "normal", "custom"] as OpticsMode[])
          for (const angle of mode === "custom" ? [0, 48, 850] : [48]) {
            const state = { ...opticsInitial, distance, height, eye, length, mode, angle };
            cases.push({ state, result: opticsModel(state) });
          }
for (const height of [60, 120, 300])
  for (const eye of [5, 16, 25]) {
    const state = { ...opticsInitial, height, eye, distance: 12 * (height - eye) };
    cases.push({ state, result: opticsModel(state) });
  }
console.log(JSON.stringify(cases));

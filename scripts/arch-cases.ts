import { ARCH_DEFAULT, archAnalysis, findArchPath } from "../src/core/arch";

let index = 0;
for (const rise of [30, 40, 55, 75, 100])
  for (const thickness of [10, 16, 24, 40])
    for (const load of [0, 50, 100, 200])
      for (const loading of ["crown", "shoulders"] as const)
        for (const friction of [null, 0, 0.2, 0.4, 0.6, 0.8, 1.5]) {
          const state = {
            ...ARCH_DEFAULT,
            friction,
            rise,
            thickness,
            load,
            loading,
            width: [40, 50, 100, 140][index % 4] as number,
            mass: [25, 100, 300, 600][Math.floor(index / 4) % 4] as number,
          };
          const m = archAnalysis(state);
          console.log(
            JSON.stringify({
              state,
              arch: { feasible: m.arch.feasible, min: m.arch.min, max: m.arch.max },
              whole: { feasible: m.whole.feasible, min: m.whole.min, max: m.whole.max },
              witness: findArchPath(state, true) ?? findArchPath(state, false),
            }),
          );
          index++;
        }

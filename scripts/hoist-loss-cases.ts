import { HOIST_DEFAULT, hoistModel } from "../src/core/hoist";

for (const rig of ["single", "three", "five"] as const)
  for (const anchor of rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const))
    for (let efficiency = 50; efficiency <= 100; efficiency++)
      for (const hold of ["rise", "rope"] as const)
        for (const [distance, weight, arm] of [
          [0, 100, 1],
          [0.05, 600, 2],
          [2, 2000, 4],
        ] as const) {
          const state = { ...HOIST_DEFAULT, rig, anchor, efficiency, hold, distance, weight, arm };
          console.log(JSON.stringify({ state, model: hoistModel(state) }));
        }

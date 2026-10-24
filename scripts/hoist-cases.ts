import { HOIST_DEFAULT, type HoistState, hoistModel, hoistRoute } from "../src/core/hoist";

for (const rig of ["single", "three", "five"] as const)
  for (const anchor of rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const))
    for (const hold of ["rise", "rope"] as const)
      for (const arm of [1, 2, 4] as const)
        for (const distance of [0, 0.05, 0.35, 1, 1.95, 2])
          for (const weight of [100, 600, 2000]) {
            const state: HoistState = {
              ...HOIST_DEFAULT,
              rig,
              anchor,
              hold,
              arm,
              distance,
              weight,
            };
            console.log(
              JSON.stringify({ state, model: hoistModel(state), probe: hoistRoute(state, 0.713) }),
            );
          }

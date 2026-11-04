import { ARCH_DEFAULT } from "../src/core/arch";
import { frictionThreshold } from "../src/core/arch-friction";

for (const rise of [30, 40, 70, 100])
  for (const thickness of [10, 24, 40])
    for (const load of [0, 200])
      for (const loading of ["crown", "shoulders"] as const) {
        const state = {
          ...ARCH_DEFAULT,
          rise,
          thickness,
          load,
          loading,
          width: rise === 100 ? 100 : 50,
          mass: thickness === 40 ? 25 : 100,
        };
        console.log(
          JSON.stringify({
            state,
            results: [frictionThreshold(state, false), frictionThreshold(state, true)],
          }),
        );
      }

for (const width of [40, 140]) {
  const state = {
    ...ARCH_DEFAULT,
    rise: 30,
    thickness: 16,
    load: 100,
    loading: "shoulders" as const,
    width,
    mass: 400,
  };
  console.log(
    JSON.stringify({
      state,
      results: [frictionThreshold(state, false), frictionThreshold(state, true)],
    }),
  );
}

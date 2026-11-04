import assert from "node:assert/strict";
import { ARCH_DEFAULT, archAnalysis, validArchState } from "../src/core/arch";
import { frictionThreshold } from "../src/core/arch-friction";

let seed = 673491;
const random = (n: number) => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return Math.floor((seed / 2 ** 32) * n);
};
const loadingCounts = { crown: 0, shoulders: 0 };
const count = { cases: 0, brackets: 0, geometryFailures: 0 };
for (let i = 0; i < 12000; i++) {
  const state = {
    ...ARCH_DEFAULT,
    rise: 30 + random(71),
    thickness: 10 + random(31),
    load: random(201),
    loading: random(2) ? ("crown" as const) : ("shoulders" as const),
    width: 40 + random(101),
    mass: 25 + random(576),
  };
  loadingCounts[state.loading]++;
  for (const bases of [false, true]) {
    const r = frictionThreshold(state, bases);
    count.cases++;
    if (r.kind === "geometry") {
      count.geometryFailures++;
      continue;
    }
    assert.equal(r.kind, "bracket");
    if (r.kind !== "bracket") continue;
    count.brackets++;
    const a = archAnalysis(r.witness);
    assert.ok(validArchState(r.witness) && a.archFits && a.archFrictionFits);
    if (bases) assert.ok(a.pierFits && a.baseFrictionFits);
  }
}
assert.ok(loadingCounts.crown > 5000 && loadingCounts.shoulders > 5000);
console.log(
  JSON.stringify(
    {
      seed: 673491,
      generatedStates: 12000,
      loadingCounts,
      ...count,
      scope: "Deterministic production invariants, not an independent force-balance oracle",
    },
    null,
    2,
  ),
);

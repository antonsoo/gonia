import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCH_DEFAULT,
  archAnalysis,
  archQuery,
  archRecord,
  openArchRecord,
  readArchQuery,
  validArchState,
} from "../src/core/arch";
import {
  FRICTION_SEARCH_TOLERANCE,
  frictionGeometryKey,
  frictionThreshold,
  frictionThresholdCsv,
} from "../src/core/arch-friction";

test("the least friction search keeps a failed bound and an actual, portable upper witness", () => {
  for (const rise of [30, 40, 70, 100])
    for (const thickness of [10, 24, 40])
      for (const load of [0, 100, 200])
        for (const loading of ["crown", "shoulders"] as const)
          for (const bases of [false, true]) {
            const state = { ...ARCH_DEFAULT, rise, thickness, load, loading, width: 100 };
            const r = frictionThreshold(state, bases);
            if (r.kind === "geometry") {
              assert.equal(archAnalysis(state)[bases ? "whole" : "arch"].feasible, false);
              continue;
            }
            if (r.kind === "above-range") {
              assert.equal(
                archAnalysis({ ...state, friction: 2 })[bases ? "whole" : "arch"].feasible,
                false,
              );
              continue;
            }
            assert.ok(r.upper > r.lower && r.upper - r.lower < FRICTION_SEARCH_TOLERANCE);
            assert.equal(
              archAnalysis({ ...state, friction: r.lower })[bases ? "whole" : "arch"].feasible,
              false,
            );
            const m = archAnalysis(r.witness);
            assert.ok(m.archFits && m.archFrictionFits);
            if (bases) assert.ok(m.pierFits && m.baseFrictionFits);
            assert.ok(validArchState(r.witness));
            assert.deepEqual(openArchRecord(archRecord(r.witness)), r.witness);
            assert.deepEqual(readArchQuery(archQuery(r.witness)), r.witness);
            assert.ok(r.lowerConstraint.length && r.upperConstraint.length);
          }
});

test("a trial's excessive friction is not the global requirement", () => {
  const state = { ...ARCH_DEFAULT, width: 100, friction: 0.65 };
  const r = frictionThreshold(state, true);
  assert.equal(r.kind, "bracket");
  if (r.kind !== "bracket") return;
  assert.ok(r.upper < 0.65);
  assert.ok(archAnalysis(state).requiredFriction > 0.65);
  const changed = { ...state, thrust: 1.2, bearing: 1, friction: null, joint: 12, page: 2 };
  assert.equal(frictionGeometryKey(state), frictionGeometryKey(changed));
  const other = frictionThreshold(changed, true);
  assert.equal(other.kind, "bracket");
  if (other.kind === "bracket") {
    assert.equal(other.lower, r.lower);
    assert.equal(other.upper, r.upper);
    assert.equal(other.witness.page, 2);
    assert.equal(other.witness.joint, 12);
  }
});

test("the least arch-only coefficient need not carry the piers, and more pier weight can help", () => {
  const state = { ...ARCH_DEFAULT, rise: 40, load: 0, width: 140, mass: 25 };
  const arch = frictionThreshold(state, false),
    whole = frictionThreshold(state, true);
  const heavy = frictionThreshold({ ...state, mass: 100 }, true);
  assert.ok(arch.kind === "bracket" && whole.kind === "bracket" && heavy.kind === "bracket");
  assert.ok(whole.lower > arch.upper * 10);
  assert.ok(heavy.upper < whole.lower);
  assert.equal(archAnalysis(arch.witness).baseFrictionFits, false);
  assert.equal(archAnalysis(whole.witness).baseFrictionFits, true);
  assert.equal(
    frictionThreshold({ ...ARCH_DEFAULT, thickness: 10, load: 0 }, false).kind,
    "geometry",
  );
});

test("search CSV retains geometry and full precision without inventing a witness for impossible geometry", () => {
  const state = { ...ARCH_DEFAULT, width: 100 };
  const r = frictionThreshold(state, true);
  assert.ok(r.kind === "bracket");
  const csv = frictionThresholdCsv(state);
  assert.ok(csv.includes(String(r.upper)) && csv.includes(String(r.witness.thrust)));
  assert.ok(csv.includes('"100","24","100","crown","100","100"'));
  assert.equal(csv.split("\r\n").length, 3);
  assert.match(
    frictionThresholdCsv({ ...state, thickness: 10, load: 0 }),
    /"geometry","","","",""/,
  );
});

test("width cannot change a fixed path's friction, but can lower the best admitted requirement", () => {
  const state = {
    ...ARCH_DEFAULT,
    rise: 30,
    thickness: 16,
    loading: "shoulders" as const,
    width: 40,
    mass: 400,
  };
  const narrow = frictionThreshold(state, true);
  assert.ok(narrow.kind === "bracket");
  const widerTrial = { ...narrow.witness, width: 140 };
  assert.equal(
    archAnalysis(widerTrial).requiredFriction,
    archAnalysis(narrow.witness).requiredFriction,
  );
  const wide = frictionThreshold(widerTrial, true);
  assert.ok(wide.kind === "bracket");
  assert.ok(wide.upper < narrow.lower - 0.04);
  assert.ok(wide.witness.thrust > narrow.witness.thrust);
});

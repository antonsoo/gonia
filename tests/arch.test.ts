import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ARCH_DEFAULT,
  archAnalysis,
  archGeometry,
  archQuery,
  archRecord,
  boundDomain,
  findArchPath,
  openArchRecord,
  readArchQuery,
} from "../src/core/arch";

test("the opening example passes every arch interface but cannot fit the pier bases", () => {
  const m = archAnalysis(ARCH_DEFAULT);
  assert.equal(m.archFits, true);
  assert.equal(m.pierFits, false);
  assert.equal(m.arch.feasible, true);
  assert.equal(m.whole.feasible, false);
  assert.ok(m.contacts.every((j) => j.normal > 0));
  assert.equal(findArchPath(ARCH_DEFAULT, true), null);
  const broader = { ...ARCH_DEFAULT, width: 100 };
  const b = archAnalysis(broader);
  assert.equal(b.archFits && b.pierFits, true);
  assert.equal(b.intercept, m.intercept);
  assert.equal(b.eccentricity, m.eccentricity);
  assert.equal(broader.mass, ARCH_DEFAULT.mass);
});

test("thin-ring infeasibility differs from an arbitrary failed trial in a feasible arch", () => {
  assert.equal(archAnalysis({ ...ARCH_DEFAULT, thickness: 10, load: 0 }).arch.feasible, false);
  const trial = { ...ARCH_DEFAULT, thrust: 0.25 };
  assert.equal(archAnalysis(trial).archFits, false);
  assert.equal(archAnalysis(trial).arch.feasible, true);
  const fitted = findArchPath(trial, false);
  assert.ok(fitted);
  assert.equal(archAnalysis(fitted).archFits, true);
});

test("each finite block balances horizontal force, vertical force and moment", () => {
  for (const loading of ["crown", "shoulders"] as const) {
    const state = { ...ARCH_DEFAULT, rise: 45, load: 170, loading };
    const fitted = findArchPath(state, false);
    assert.ok(fitted);
    const m = archAnalysis(fitted);
    for (const [i, stone] of m.geometry.stones.entries()) {
      const left = m.contacts[i],
        right = m.contacts[i + 1];
      assert.ok(left && right);
      assert.ok(Math.abs(left.vertical - right.vertical - stone.weight) < 1e-12);
      const moment = (j: typeof left) => j.point.x * j.vertical - j.point.y * fitted.thrust;
      assert.ok(Math.abs(moment(left) - moment(right) - stone.weight * stone.centre.x) < 1e-12);
    }
    for (const [i, j] of m.contacts.entries()) {
      const other = m.contacts[13 - i];
      assert.ok(other);
      assert.ok(Math.abs(j.fraction - other.fraction) < 1e-12);
    }
  }
});

test("self weight is normalized for each shape and loads remain symmetric", () => {
  for (const rise of [30, 60, 100])
    for (const thickness of [10, 24, 40]) {
      const g = archGeometry({ ...ARCH_DEFAULT, rise, thickness });
      assert.ok(Math.abs(g.stones.reduce((sum, b) => sum + b.weight, 0) - 2) < 1e-12);
      assert.ok(Math.abs(g.stones.reduce((sum, b) => sum + b.weight * b.centre.x, 0)) < 1e-12);
      assert.equal(g.vertical, 1);
      const j = g.joints[0];
      assert.ok(j);
      assert.ok(Math.abs((j.inner.x + j.outer.x) / 2 + 1) < 1e-12);
      assert.ok(Math.abs((j.inner.y + j.outer.y) / 2) < 1e-12);
    }
});

test("an unbounded ideal thrust domain still produces a finite valid witness", () => {
  const s = { ...ARCH_DEFAULT, rise: 30, thickness: 40, load: 0 };
  assert.equal(archAnalysis(s).arch.max, Number.POSITIVE_INFINITY);
  const fit = findArchPath(s, false);
  assert.ok(fit && Number.isFinite(fit.thrust));
  assert.equal(archAnalysis(fit).archFits, true);
  assert.deepEqual(openArchRecord(archRecord(fit)), fit);
});

test("the complete interval solver finds crossed, parallel and limiting constraints", () => {
  const b = (a: number, c: number) => ({ a, b: c, label: "fixture" });
  const fit = boundDomain([b(1, 0)], [b(-1, 4)]);
  assert.equal(fit.feasible, true);
  assert.equal(fit.max, 2);
  assert.equal(boundDomain([b(0, 1)], [b(0, 0)]).feasible, false);
  const point = boundDomain([b(0, 1), b(2, -1)], [b(1, 0)]);
  assert.equal(point.feasible, true);
  assert.equal(point.min, 1);
  assert.equal(point.max, 1);
});

test("wider and heavier piers can enlarge the feasible set without changing the arch", () => {
  const state = { ...ARCH_DEFAULT, rise: 40, load: 0 };
  const original = archAnalysis(state),
    broader = archAnalysis({ ...state, width: 100 });
  const heavier = archAnalysis({ ...state, mass: 500 });
  assert.equal(broader.arch.min, original.arch.min);
  assert.equal(broader.arch.max, original.arch.max);
  assert.ok(broader.whole.max >= original.whole.max);
  assert.ok(heavier.whole.max >= original.whole.max);
  for (const s of [state, { ...state, mass: 500 }]) {
    const fit = findArchPath(s, true);
    assert.ok(fit);
    const m = archAnalysis(fit);
    assert.equal(m.archFits && m.pierFits, true);
  }
});

test("records and links preserve non-rounded automatic witnesses and reject invalid settings", () => {
  const fit = findArchPath({ ...ARCH_DEFAULT, width: 100 }, true);
  assert.ok(fit);
  assert.deepEqual(openArchRecord(archRecord(fit)), fit);
  assert.deepEqual(readArchQuery(archQuery(fit)), fit);
  const native = JSON.parse(archRecord(fit));
  for (const value of [
    null,
    [],
    {},
    { ...native, state: { ...fit, thrust: null } },
    { ...native, state: { ...fit, bearing: 101 } },
    { ...native, state: { ...fit, joint: 14 } },
  ]) {
    assert.throws(() => openArchRecord(JSON.stringify(value)));
  }
  for (const search of [
    "?rise=100",
    `${archQuery(fit)}&thrust=0.1`,
    archQuery(fit).replace("rise=100", "rise="),
    archQuery(fit).replace("width=100", "width=999"),
  ])
    assert.throws(() => readArchQuery(search));
});

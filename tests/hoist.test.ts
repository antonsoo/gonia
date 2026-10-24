import assert from "node:assert/strict";
import test from "node:test";
import {
  HOIST_DEFAULT,
  type HoistState,
  hoistJson,
  hoistModel,
  hoistQuery,
  hoistRoute,
  parseHoist,
  readHoist,
  ropeLength,
  ropePoint,
} from "../src/core/hoist";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test("same wheels, different tied end: source routes have three/five supports, alterations two/four", () => {
  for (const [rig, anchor, n] of [
    ["single", "moving", 1],
    ["three", "moving", 3],
    ["three", "fixed", 2],
    ["five", "moving", 5],
    ["five", "fixed", 4],
  ] as const) {
    const m = hoistModel({ ...HOIST_DEFAULT, rig, anchor });
    assert.equal(m.supports, n);
    near(m.tension, 600 / n);
    near(m.rope, n);
  }
});
test("visible route shortening, force balance and both work transfers agree across all settings", () => {
  for (const rig of ["single", "three", "five"] as const)
    for (const anchor of rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const))
      for (const hold of ["rise", "rope"] as const)
        for (const arm of [1, 2, 4] as const)
          for (const distance of [0, 0.05, 0.35, 1, 1.95, 2]) {
            const s: HoistState = { ...HOIST_DEFAULT, rig, anchor, hold, arm, distance },
              m = hoistModel(s);
            near(m.rope, m.supports * m.rise);
            near(m.tension * m.supports, s.weight);
            near(m.work, m.ropeWork);
            near(m.work, m.handWork);
            near(m.hand * m.armRadius, m.tension * m.drumRadius);
            const delta = 1e-5;
            near(
              (ropeLength(hoistRoute(s, 0)) - ropeLength(hoistRoute(s, delta))) / delta,
              m.supports,
            );
          }
});
test("holding rope take-up makes extra supports trade load rise for force", () => {
  const three = hoistModel({ ...HOIST_DEFAULT, hold: "rope" }),
    five = hoistModel({ ...HOIST_DEFAULT, rig: "five", hold: "rope" });
  near(three.rope, 1);
  near(five.rope, 1);
  near(three.rise, 1 / 3);
  near(five.rise, 1 / 5);
  near(three.hand, 100);
  near(five.hand, 60);
});
test("material rope points traverse continuous arcs and disappear only onto the drum", () => {
  const route = hoistRoute(HOIST_DEFAULT, 1),
    len = ropeLength(route);
  assert.equal(ropePoint(route, -1), null);
  assert.equal(ropePoint(route, len + 0.001), null);
  const first = ropePoint(route, 0);
  assert.deepEqual(first, { x: 0, y: 4 });
  for (let d = 0; d < len - 0.02; d += 0.01) {
    const a = ropePoint(route, d),
      b = ropePoint(route, d + 0.01);
    assert(a && b);
    assert(Math.hypot(a.x - b.x, a.y - b.y) <= 0.010000001);
  }
});
test("shared and editable experiments reject incomplete, repeated, off-grid and unknown fields atomically", () => {
  assert.deepEqual(readHoist(hoistJson(HOIST_DEFAULT)), HOIST_DEFAULT);
  assert.deepEqual(parseHoist(hoistQuery(HOIST_DEFAULT)), { state: HOIST_DEFAULT, invalid: false });
  for (const q of [
    "?rig=three",
    `${hoistQuery(HOIST_DEFAULT)}&rig=five`,
    hoistQuery(HOIST_DEFAULT).replace("distance=1", "distance=1.01"),
    hoistQuery(HOIST_DEFAULT)
      .replace("rig=three", "rig=single")
      .replace("anchor=moving", "anchor=fixed"),
  ])
    assert.equal(parseHoist(q).invalid, true);
  for (const text of [
    hoistJson(HOIST_DEFAULT).replace('"weight": 600', '"weight": 600, "weight": 900'),
    hoistJson(HOIST_DEFAULT).replace('"rig": "three"', '"rig": "three", "r\\u0069g": "five"'),
    JSON.stringify({ format: "gonia-hoist-v1", state: { ...HOIST_DEFAULT, arm: 3 } }),
    " ".repeat(65537),
  ])
    assert.throws(() => readHoist(text));
});

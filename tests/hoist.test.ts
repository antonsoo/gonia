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

test("raising losses retain load balance, account for local work, and skip a stationary wheel", () => {
  for (const rig of ["single", "three", "five"] as const)
    for (const anchor of rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const))
      for (const efficiency of [50, 90, 99, 100])
        for (const distance of [0, 0.05, 2]) {
          const s = { ...HOIST_DEFAULT, rig, anchor, efficiency, distance },
            m = hoistModel(s);
          near(
            m.supportTensions.reduce((a, b) => a + b, 0),
            s.weight,
          );
          near(m.work + m.loss, m.handWork);
          near(m.ropeWork, m.handWork);
          assert(m.loss >= 0);
          assert(m.supportTensions.every((t) => t > 0));
          if (anchor === "fixed") {
            near(m.wheels[0]?.loss ?? -1, 0);
            near(m.wheels[0]?.travel ?? -1, 0);
          }
        }
  const m = hoistModel({ ...HOIST_DEFAULT, efficiency: 90 });
  near(m.efficiency, 0.813);
  near(m.tension, 600000 / 2439);
});

test("legacy links and version-one records reopen as ideal, while new loss settings are strict", () => {
  const { efficiency: _ignored, ...legacy } = HOIST_DEFAULT;
  assert.deepEqual(
    readHoist(JSON.stringify({ format: "gonia-hoist-v1", state: legacy })),
    HOIST_DEFAULT,
  );
  const q = new URLSearchParams(Object.entries(legacy).map(([k, v]) => [k, String(v)]));
  assert.deepEqual(parseHoist(`?${q}`), { state: HOIST_DEFAULT, invalid: false });
  const lossy = { ...HOIST_DEFAULT, efficiency: 90 };
  assert.deepEqual(readHoist(hoistJson(lossy)), lossy);
  assert.deepEqual(parseHoist(hoistQuery(lossy)), { state: lossy, invalid: false });
  for (const efficiency of [null, "90", [], 49, 101, 90.5])
    assert.throws(() =>
      readHoist(JSON.stringify({ format: "gonia-hoist-v2", state: { ...lossy, efficiency } })),
    );
  for (const rig of [["three"], {}, null])
    assert.throws(() =>
      readHoist(JSON.stringify({ format: "gonia-hoist-v2", state: { ...lossy, rig } })),
    );
  assert.throws(() => readHoist(JSON.stringify({ format: "gonia-hoist-v1", state: lossy })));
  assert.equal(parseHoist(`${hoistQuery(lossy)}&efficiency=80`).invalid, true);
  assert.equal(parseHoist(hoistQuery(lossy).replace("efficiency=90", "efficiency=")).invalid, true);
});

test("record format tags must be strings", () => {
  assert.throws(() =>
    readHoist(JSON.stringify({ format: ["gonia-hoist-v2"], state: HOIST_DEFAULT })),
  );
});

test("native records retain a license notice and accept earlier version-two records", () => {
  const saved = JSON.parse(hoistJson(HOIST_DEFAULT));
  assert.match(saved.notice, /PolyForm-Noncommercial-1.0.0/);
  assert.deepEqual(readHoist(JSON.stringify(saved)), HOIST_DEFAULT);
  delete saved.notice;
  assert.deepEqual(readHoist(JSON.stringify(saved)), HOIST_DEFAULT);
  assert.throws(() => readHoist(JSON.stringify({ ...saved, notice: "unrelated" })));
});

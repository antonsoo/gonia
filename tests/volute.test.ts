import assert from "node:assert/strict";
import test from "node:test";
import {
  cross,
  minus,
  openVoluteRecord,
  PRINTED_SEQUENCE,
  quarterArc,
  readVoluteQuery,
  repairJoin,
  VOLUTE_DEFAULT,
  validVoluteState,
  voluteArcs,
  voluteJoins,
  voluteQuery,
  voluteRecord,
  voluteSummary,
} from "../src/core/volute";

test("the printed 9,8,7,6 axis lengths and three turns end on the eye", () => {
  const arcs = voluteArcs(PRINTED_SEQUENCE);
  assert.deepEqual(
    arcs.map((a) => a.end),
    [
      { x: 48, y: 0 },
      { x: 0, y: -42 },
      { x: -36, y: 0 },
      { x: 0, y: 30 },
      { x: 26, y: 0 },
      { x: 0, y: -22 },
      { x: -18, y: 0 },
      { x: 0, y: 14 },
      { x: 12, y: 0 },
      { x: 0, y: -10 },
      { x: -8, y: 0 },
      { x: 0, y: 6 },
    ],
  );
  const m = voluteSummary({ ...VOLUTE_DEFAULT, moves: PRINTED_SEQUENCE });
  assert.equal(m.onEye, true);
  assert.equal(m.radialGap, 0);
  assert.equal(arcs[0]?.radiusSquared, 2610);
});
test("the first and eye contacts have non-collinear radii despite meeting", () => {
  const joins = voluteJoins(voluteArcs(PRINTED_SEQUENCE));
  assert.equal(joins[0]?.cross, -18);
  assert.equal(joins[0]?.dot, 2304);
  assert.equal(joins[11]?.cross, 6);
  assert.equal(joins[11]?.dot, 42);
  assert.ok(Math.abs((joins[11]?.angle ?? 0) - 8.13010235415598) < 1e-12);
  assert.ok(joins.every((j) => !j.tangent));
});
test("one tangent alignment moves the next endpoint without altering committed arcs", () => {
  const arcs = voluteArcs(PRINTED_SEQUENCE),
    original = structuredClone(arcs);
  const join = voluteJoins(arcs)[0];
  assert.ok(join);
  const repair = repairJoin(join);
  assert.ok(repair);
  assert.ok(Math.abs(repair.centre.x - 432 / 145) < 1e-12);
  assert.ok(Math.abs(repair.centre.y - 384 / 145) < 1e-12);
  assert.ok(Math.abs(cross(join.incoming, minus(join.point, repair.centre))) < 1e-10);
  assert.ok(repair.displacement > 0);
  assert.deepEqual(arcs, original);
});
test("repeating centre 4 records a different actual curve and misses the eye", () => {
  const moves = [1, 2, 3, 4, 4, 6, 7, 8, 9, 10, 11, 12];
  const m = voluteSummary({ ...VOLUTE_DEFAULT, moves });
  assert.equal(m.followsPrint, false);
  assert.equal(m.onEye, false);
  assert.deepEqual(m.end, { x: 6, y: 10 });
  assert.equal(m.arcs[4]?.pin, 4);
});
test("zero-radius arcs have no claimed tangent or repair", () => {
  const a = quarterArc({ x: -3, y: 3 }, 1);
  const j = voluteJoins([a, quarterArc(a.end, 2)])[0];
  assert.ok(j);
  assert.equal(j.angle, null);
  assert.equal(j.tangent, false);
  assert.equal(repairJoin(j), null);
});
test("native records and explicit share links round-trip even an empty sequence", () => {
  for (const moves of [[], [4, 4], PRINTED_SEQUENCE]) {
    const s = { ...VOLUTE_DEFAULT, moves, repair: true, page: 5 };
    assert.deepEqual(openVoluteRecord(voluteRecord(s)), s);
    assert.deepEqual(readVoluteQuery(voluteQuery(s)), s);
  }
});
test("invalid, repeated, nonfinite and out-of-range settings are rejected", () => {
  for (const v of [
    null,
    [],
    {},
    { ...VOLUTE_DEFAULT, moves: [0] },
    { ...VOLUTE_DEFAULT, eye: Infinity },
    { ...VOLUTE_DEFAULT, moves: Array(13).fill(1) },
    { ...VOLUTE_DEFAULT, page: 7 },
  ])
    assert.equal(validVoluteState(v), false);
  assert.throws(() => readVoluteQuery(`${voluteQuery(VOLUTE_DEFAULT)}&pin=1`));
  assert.throws(() => openVoluteRecord('{"format":"other","version":1}'));
  assert.throws(() => openVoluteRecord("{"));
  assert.throws(() => openVoluteRecord(" ".repeat(16001)));
});

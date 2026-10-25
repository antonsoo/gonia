import assert from "node:assert/strict";
import test from "node:test";
import {
  bladePoint,
  bucketGeometry,
  bucketOutline,
  bucketPosition,
  bucketSection,
  parseScrew,
  screwCapacity,
  screwGeometry,
  screwInitial,
  screwPoint,
  screwQuery,
  TAU,
  waterLevel,
} from "../src/core/screw";

const near = (a: number, b: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test("the source foot, eight equal advances and 3–4–5 triangle determine the model", () => {
  const g = screwGeometry(screwInitial),
    c = screwCapacity(g);
  near(g.length / (2 * g.inner), 16);
  near(g.length / (2 * g.outer), 8);
  near(g.pitch, TAU * g.inner);
  near(8 * g.interval, g.pitch);
  near(g.spacing, g.interval);
  near(g.sin, 3 / 5);
  near(g.cos, 4 / 5);
  near(g.slope, 3 / 4);
  near(g.lambda, 3 / 8);
  near(c.fraction, 0.1703168626, 2e-10);
  near(c.perTurn, 1.6809600567, 2e-9);
  assert(c.converged);
  assert(c.error < 2e-10);
  const alternate = screwGeometry({ ...screwInitial, units: "twelfths" });
  near(alternate.length / (2 * alternate.inner), 12);
  near(alternate.inner, 2 / 3);
});
test("independently published rounded design points constrain the numerical capacity", () => {
  const g = screwGeometry(screwInitial);
  // Rorres 2000, Table 1; the paper uses a coarser quadrature and rounds values.
  for (const [starts, inner, lambda, fraction] of [
    [1, 0.5358, 0.1285, 0.2811],
    [2, 0.5369, 0.1863, 0.2747],
    [3, 0.5357, 0.2217, 0.2697],
    [4, 0.5353, 0.2456, 0.2667],
    [8, 0.5354, 0.2957, 0.2609],
  ]) {
    const c = screwCapacity({
      ...g,
      starts: starts as number,
      inner: inner as number,
      lambda: lambda as number,
    });
    near(c.fraction, fraction as number, 1.5e-4);
    assert(c.converged);
  }
});
test("spill regimes, very small pockets and the no-retention boundary remain distinct", () => {
  const g = screwGeometry(screwInitial);
  for (const lambda of [0.49, 0.5, 0.8, 0.999, 0.9999999, 1, 1.4]) {
    const c = screwCapacity({ ...g, lambda });
    assert.equal(c.bucket.regime, lambda < 0.5 ? "shaft" : lambda < 1 ? "outer" : "none");
    assert(c.converged);
    assert(c.fraction >= 0);
    if (lambda < 1) assert(c.fraction > 0);
    else near(c.fraction, 0);
  }
  const full = screwCapacity(g),
    short = screwCapacity({ ...g, pitch: g.pitch / 2, lambda: g.lambda / 2 });
  assert(short.fraction > full.fraction);
  assert(short.perTurn > full.perTurn);
  const veryShort = screwCapacity({ ...g, pitch: g.pitch / 4, lambda: g.lambda / 4 });
  assert(veryShort.fraction > short.fraction);
  assert(veryShort.perTurn < short.perTurn);
  const shallow = screwCapacity(
    screwGeometry({ ...screwInitial, starts: 4, lead: 50, sourceSlope: false, angle: 150 }),
  );
  near(shallow.fraction, 0.4603709289, 4e-8);
  near(bucketSection(shallow.bucket, shallow.bucket.end), 0);
  assert(bucketSection(shallow.bucket, shallow.bucket.end - 0.001) > 0);
});
test("section polygons, actual world water heights and one-turn displacement agree", () => {
  for (const starts of [1, 2, 4, 8] as const)
    for (const units of ["digits", "twelfths"] as const)
      for (const angle of [150, 370, 500, 620, 750]) {
        const s = { ...screwInitial, starts, units, sourceSlope: false, angle },
          g = screwGeometry(s),
          c = screwCapacity(g);
        const turned = screwGeometry({ ...s, turn: 360 });
        for (let k = 0; k <= 20; k++) {
          const phi = c.bucket.start + ((c.bucket.end - c.bucket.start) * k) / 20,
            x = bucketPosition(g, phi),
            points = bucketOutline(c.bucket, phi, 800);
          const level = g.cos * (c.bucket.intercept - g.lambda * g.phase);
          let twiceArea = 0;
          for (let i = 0; i < points.length; i++) {
            const a = points[i],
              b = points[(i + 1) % points.length];
            assert(a && b);
            twiceArea += a[0] * b[1] - b[0] * a[1];
            const world = screwPoint(g, x, Math.hypot(...a), Math.atan2(a[1], a[0]));
            assert(world[2] <= level + 1e-10);
          }
          near(Math.abs(twiceArea) / 2, bucketSection(c.bucket, phi), 8e-5);
          near(bucketPosition(turned, phi) - x, g.pitch);
          if (c.bucket.regime !== "none") {
            const before = screwPoint(
              g,
              x,
              1,
              Math.asin(Math.max(-1, Math.min(1, waterLevel(c.bucket, phi)))),
            );
            const after = screwPoint(
              turned,
              bucketPosition(turned, phi),
              1,
              Math.asin(Math.max(-1, Math.min(1, waterLevel(c.bucket, phi)))),
            );
            near(after[2] - before[2], g.pitch * g.sin);
          }
        }
        for (const x of [0, 0.73, 4, 16])
          for (const radius of [g.inner, 1]) {
            const before = bladePoint(g, x, radius, 0),
              after = bladePoint(turned, x, radius, 0);
            for (let i = 0; i < 3; i++) near(before[i] as number, after[i] as number);
          }
      }
});
test("shared settings round trip and reject ambiguous or out-of-range controls", () => {
  assert.deepEqual(parseScrew(screwQuery({ ...screwInitial })), screwInitial);
  for (const query of [
    "?starts=3",
    "?turn=361",
    "?turn=1&turn=2",
    "?sourceSlope=0",
    "?cut=1.2",
    "?toString=x",
    "?page=../238",
    "?lead=49",
    "?passage=12",
    "?angle=NaN",
    `?${"x".repeat(401)}`,
  ])
    assert.throws(() => parseScrew(query));
  assert.throws(() => bucketGeometry(0.5, 0, 8));
});

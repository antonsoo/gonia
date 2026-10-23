import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTheatre,
  orchestraArea,
  orchestraBoundary,
  orchestraWidth,
  parseTheatre,
  THEATRE_DEFAULT,
  theatreModel,
  theatrePolygons,
  theatreQuery,
} from "../src/core/theatre";

const near = (a: number, b: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
test("four triangles and three squares partition twelve distinct circle points", () => {
  for (const kind of ["greek", "roman"] as const) {
    const polygons = theatrePolygons(kind, 7),
      points = polygons.flat();
    assert.equal(points.length, 12);
    assert.equal(new Set(points.map((p) => p.index)).size, 12);
    for (const polygon of polygons) {
      const distances = polygon.map((p, i) => {
        near(Math.hypot(p.x, p.y), 7);
        const q = polygon[(i + 1) % polygon.length];
        assert.ok(q);
        return Math.hypot(q.x - p.x, q.y - p.y);
      });
      for (const distance of distances) near(distance, distances[0] ?? 0);
    }
    const selected = polygons[0];
    assert.ok(selected);
    const bottom = selected.filter((p) => p.y < 0);
    assert.equal(bottom.length, 2);
    near(bottom[0]?.y ?? 0, bottom[1]?.y ?? 1);
    near(bottom[0]?.y ?? 0, kind === "greek" ? -7 / Math.SQRT2 : -3.5);
  }
});
test("the Roman vertices give seven lower stair directions and five scene guides", () => {
  const m = theatreModel({ ...THEATRE_DEFAULT, kind: "roman" });
  assert.equal(m.vertices.filter((v) => v.role === "stair").length, 7);
  assert.equal(m.vertices.filter((v) => v.role === "royal").length, 1);
  assert.equal(m.vertices.filter((v) => v.role === "guest").length, 2);
  assert.equal(m.vertices.filter((v) => v.role === "wing").length, 2);
});
test("the moved compass reaches the opposite boundary with a full-diameter radius", () => {
  for (const diameter of [12, 20, 36])
    for (let probe = 0; probe <= 100; probe++) {
      const m = theatreModel({ ...THEATRE_DEFAULT, diameter, probe });
      near(Math.hypot(-m.probeWidth / 2 - m.radius, m.probeY), diameter);
      near(Math.hypot(m.probeWidth / 2 + m.radius, m.probeY), diameter);
      assert.ok(m.probeWidth >= m.singleWidth - 1e-12);
    }
});
test("changing the lower boundary preserves both stage lines and all twelve vertices", () => {
  const three = theatreModel(THEATRE_DEFAULT),
    single = theatreModel({ ...THEATRE_DEFAULT, arc: "single" });
  near(three.front, single.front);
  near(three.back, single.back);
  near(three.stageDepth, single.stageDepth);
  assert.deepEqual(three.vertices, single.vertices);
  assert.ok(three.area > single.area);
  near(single.area, 100 * ((3 * Math.PI) / 4 + 0.5));
  near(three.stageDepth, 10 - 5 * Math.SQRT2);
  near(three.probeWidth, (Math.sqrt(14) - 2) * 10);
});
test("sampled outlines retain both endpoints with odd and even subdivision counts", () => {
  for (const count of [8, 9, 119, 120, 121])
    for (const arc of ["single", "three"] as const) {
      const points = orchestraBoundary("greek", arc, 10, count),
        front = -10 / Math.SQRT2;
      assert.equal(points.filter((p) => Math.abs(p.y - front) < 1e-12).length, 2);
      for (const p of points) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      const left = points.find((p) => Math.abs(p.y - front) < 1e-12);
      assert.ok(left);
      near(-2 * left.x, orchestraWidth(front, 10, "greek", arc));
    }
});
test("shared views round-trip and malformed settings never create nonfinite geometry", () => {
  const chosen = {
    ...THEATRE_DEFAULT,
    kind: "roman" as const,
    diameter: 36,
    reading: 9,
    source: 6,
    polygon: 4,
    vertex: 11,
    probe: 20,
  };
  assert.deepEqual(parseTheatre(theatreQuery(chosen)).state, chosen);
  for (const search of [
    "?diameter=NaN&source=99&step=-3",
    "?diameter=Infinity&probe=1e309&vertex=abc",
    "?kind=foreign&arc=ellipse&part=evil",
    "?diameter=12&diameter=36",
  ]) {
    const parsed = parseTheatre(search);
    assert.equal(parsed.adjusted, true);
    const m = theatreModel(parsed.state);
    assert.ok(Number.isFinite(m.area) && Number.isFinite(m.probeWidth));
  }
  assert.equal(normalizeTheatre({ ...THEATRE_DEFAULT, kind: "greek", polygon: 4 }).polygon, 3);
});
test("widths outside the orchestra are zero and invalid metric inputs are rejected", () => {
  assert.equal(orchestraWidth(-1, 10, "roman"), 0);
  assert.equal(orchestraWidth(11, 10, "greek"), 0);
  assert.equal(orchestraWidth(-8, 10, "greek"), 0);
  for (const radius of [0, -1, NaN, Infinity]) {
    assert.throws(() => orchestraArea(radius, "greek"), RangeError);
    assert.throws(() => orchestraWidth(0, radius, "roman"), RangeError);
  }
});

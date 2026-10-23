import assert from "node:assert/strict";
import test from "node:test";
import {
  COLONNADE_DEFAULT,
  colonnadeModel,
  colonnadeQuery,
  type PlanColumn,
  parseColonnade,
} from "../src/core/colonnade";

test("omitting the inner ring keeps the retained geometry and joins the passage widths", () => {
  const double = colonnadeModel({ kind: "double" });
  const pseudo = colonnadeModel({ kind: "pseudo" });
  assert.deepEqual(double.outer, pseudo.outer);
  assert.deepEqual(double.cella, pseudo.cella);
  assert.equal(double.present, 76);
  assert.equal(pseudo.present, 42);
  assert.equal(pseudo.omitted, 34);
  assert.equal(pseudo.continuousStrip, 5.5);
  assert.equal(double.continuousStrip, 2.25);
  assert.equal(pseudo.wideClear, 2 * double.narrowClear + 1);
});
test("each circuit visits its corners once and moves to an adjacent shaft at every step", () => {
  const m = colonnadeModel({});
  for (const [ring, total, front, flank] of [
    [m.outer, 42, 8, 13],
    [m.inner, 34, 6, 11],
  ] as const) {
    assert.equal(ring.length, total);
    assert.equal(new Set(ring.map((p) => `${p.x},${p.y}`)).size, total);
    assert.equal(ring.filter((p) => p.corner).length, 4);
    assert.equal(ring.filter((p) => p.side === "front").length, front);
    assert.equal(ring.filter((p) => p.side === "lower flank").length, flank);
    for (const [i, p] of ring.entries()) {
      const next: PlanColumn | undefined = ring[(i + 1) % ring.length];
      assert.ok(next);
      assert.equal(Math.hypot(p.x - next.x, p.y - next.y), m.pitch);
    }
  }
});
test("shared settings preserve independent plan, count, source page and Latin word", () => {
  const state = {
    ...COLONNADE_DEFAULT,
    kind: "double" as const,
    gap: 1.5,
    ring: "outer" as const,
    count: 42,
    source: "apparatus" as const,
    word: 5,
  };
  assert.deepEqual(parseColonnade(colonnadeQuery(state)), { state, adjusted: false });
});
test("malformed settings cannot create negative gaps, phantom counts or injected source paths", () => {
  const result = parseColonnade(
    "?kind=other&gap=Infinity&count=9999&source=../../bad&word=-8&part=<script>",
  );
  assert.equal(result.adjusted, true);
  assert.deepEqual(result.state, { ...COLONNADE_DEFAULT, count: 34 });
  assert.equal(parseColonnade("?gap=2&gap=3").adjusted, true);
  assert.equal(parseColonnade("?gap=").state.gap, 2.25);
  assert.equal(parseColonnade("?ring=outer&count=-1").state.count, 0);
});

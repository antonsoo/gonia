import assert from "node:assert/strict";
import test from "node:test";
import { FLUTING_DEFAULT } from "../src/core/fluting";
import { segmentPair } from "../src/core/segments";

test("the same chord has opposite-segment angles, not the same angle on both arcs", () => {
  for (const recipe of ["doric", "ionic"] as const)
    for (const point of [5, 17, 50, 83, 95]) {
      const r = segmentPair({ ...FLUTING_DEFAULT, recipe, point });
      assert(r);
      assert.ok(Math.abs(r.pAngle - (recipe === "doric" ? 135 : 90)) < 1e-10);
      assert.ok(Math.abs(r.qAngle - (recipe === "doric" ? 45 : 90)) < 1e-10);
      assert.ok(Math.abs(r.pBaseA + r.pBaseB - r.pAngle) < 1e-10);
      assert.ok(Math.abs(r.pAngle + r.qAngle - 180) < 1e-10);
      assert.ok(r.p.y > 0 && r.q.y < 0);
    }
});
test("a flat face does not acquire an invented circle", () =>
  assert.equal(segmentPair({ ...FLUTING_DEFAULT, recipe: "flat" }), null));

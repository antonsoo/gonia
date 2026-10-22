import assert from "node:assert/strict";
import test from "node:test";
import {
  columnSection,
  FLUTING_DEFAULT,
  flutingQuery,
  gaugeReading,
  parseFluting,
  template,
} from "../src/core/fluting";

test("the square's corners establish a quarter circle, not the moving-square semicircle", () => {
  const doric = template("doric", 100),
    ionic = template("ionic", 100);
  for (const p of [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: -100 },
    { x: 100, y: -100 },
  ])
    assert.ok(
      Math.abs(Math.hypot(p.x - doric.centre.x, p.y - doric.centre.y) - doric.radius) < 1e-10,
    );
  assert.ok(Math.abs(doric.depth - 20.71067811865476) < 1e-10);
  assert.equal(ionic.depth, 50);
  for (const point of [5, 19, 50, 81, 95]) {
    const d = gaugeReading({ ...FLUTING_DEFAULT, point }),
      i = gaugeReading({ ...FLUTING_DEFAULT, recipe: "ionic", point });
    assert.ok(Math.abs(d.angle - 135) < 1e-10);
    assert.ok(Math.abs(i.angle - 90) < 1e-10);
    assert.ok(d.miss > 0);
    assert.ok(i.miss < 1e-10);
  }
});
test("flat faces retain material inside their chords; Ionic lands keep their chosen pitch share", () => {
  const c = columnSection({ ...FLUTING_DEFAULT, recipe: "flat" });
  const polygon = (c.count * c.radius * c.radius * Math.sin((2 * Math.PI) / c.count)) / 2;
  assert.ok(Math.abs(c.remaining - polygon) < 1e-8);
  for (const fillet of [0, 5, 20, 30]) {
    const i = columnSection({ ...FLUTING_DEFAULT, recipe: "ionic", fillet });
    assert.equal(i.count, 24);
    assert.equal(i.land, fillet / 100);
    assert.ok(i.remaining > 0 && i.remaining < i.originalArea);
    assert.ok(Math.abs(i.remaining + i.removed - i.originalArea) < 1e-9);
  }
});
test("an invalid or conflicting shared state resets completely", () => {
  for (const search of [
    "?width=100&width=50",
    "?width=100&recipe=unknown",
    "?point=0&fillet=25",
    "?gauge=true",
    "?width=55.0",
    "?fillet=31",
  ]) {
    assert.deepEqual(parseFluting(search), { state: { ...FLUTING_DEFAULT }, warning: true });
  }
  assert.deepEqual(
    parseFluting(
      flutingQuery({ ...FLUTING_DEFAULT, recipe: "ionic", width: 120, fillet: 30, point: 95 }),
    ).state,
    { ...FLUTING_DEFAULT, recipe: "ionic", width: 120, fillet: 30, point: 95 },
  );
});

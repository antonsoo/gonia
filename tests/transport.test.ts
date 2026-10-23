import assert from "node:assert/strict";
import test from "node:test";
import {
  PACONIUS,
  parseTransport,
  TRANSPORT_DEFAULT,
  transportFrameAngle,
  transportModel,
  transportQuery,
} from "../src/core/transport";

test("a first-frame timestamp before the click clock cannot create a negative pose", () => {
  // Firefox witness: click 308 ms; first frame 302.56 ms, callback at 312 ms.
  assert.equal(transportFrameAngle(0, 302.56 - 308), 0);
  assert.equal(transportFrameAngle(137, -5.44), 137);
  assert.equal(transportFrameAngle(137, 40), 138);
  assert.equal(transportFrameAngle(359, 1000), 360);
});

test("a bare rectangle walks its perimeter and changes height", () => {
  const s = { ...TRANSPORT_DEFAULT, kind: "bare" as const };
  for (const [angle, x, y] of [
    [0, 0, 3],
    [90, 7, 4],
    [180, 14, 3],
    [270, 21, 4],
    [360, 28, 3],
  ]) {
    const m = transportModel(s, angle);
    assert.equal(m.centre.x, x);
    assert.equal(m.centre.y, y);
    assert.ok(Math.abs(m.lowest) < 1e-12);
  }
  const crest = transportModel(s, (Math.atan2(4, 3) * 180) / Math.PI);
  assert.ok(Math.abs(crest.centre.y - 5) < 1e-12);
  assert.equal(crest.maximumCentreHeight, 5);
  assert.equal(crest.minimumCentreHeight, 3);
});
test("each bare-stone interval rotates about a fixed ground corner", () => {
  const s = { ...TRANSPORT_DEFAULT, kind: "bare" as const };
  for (let q = 0; q < 4; q++) {
    const a = transportModel(s, q * 90 + 15),
      b = transportModel(s, q * 90 + 75);
    assert.equal(a.contacts.length, 1);
    assert.equal(b.contacts.length, 1);
    assert.ok(Math.abs((a.contacts[0]?.x ?? NaN) - (b.contacts[0]?.x ?? NaN)) < 1e-12);
  }
});
test("the diagonal, not just the upright half-height, bounds a complete wheel turn", () => {
  const undersized = { ...TRANSPORT_DEFAULT, radius: 4 };
  assert.equal(transportModel(undersized, 0).intrudes, false);
  assert.equal(transportModel(undersized, 53).intrudes, true);
  assert.equal(transportModel(undersized).fullTurnClearance, -1);
  assert.equal(transportModel({ ...undersized, radius: 5 }).fullTurnValid, true);
});
test("the reported Paconius section fits the reported wheel size geometrically", () => {
  const m = transportModel(PACONIUS, 53);
  assert.equal(m.diagonalRadius, 5);
  assert.equal(m.fullTurnClearance, 2.5);
  assert.equal(m.fullTurnValid, true);
  assert.equal(m.paconiusDimensions, true);
  // Feasible clearance says nothing about steering, costs or actual ground.
});
test("shaft and wheels move by circumference while a bare rectangle moves by perimeter", () => {
  assert.equal(
    transportModel({ ...TRANSPORT_DEFAULT, kind: "shaft" }).fullTurnDistance,
    12 * Math.PI,
  );
  assert.equal(transportModel({ ...TRANSPORT_DEFAULT, kind: "bare" }).fullTurnDistance, 28);
  const a = transportModel(TRANSPORT_DEFAULT, 30),
    b = transportModel({ ...TRANSPORT_DEFAULT, radius: 9 }, 30);
  assert.equal(b.centre.x / a.centre.x, 1.5);
});
test("transport links retain the source units and page, and reject ambiguity", () => {
  assert.deepEqual(parseTransport(transportQuery({ ...PACONIUS, angle: 137 })), {
    state: { ...PACONIUS, angle: 137 },
    issue: null,
  });
  for (const q of [
    "?w=8x",
    "?r=0",
    "?h=12.5",
    "?angle=12.5",
    "?kind=shaft&kind=wheels",
    "?page=250",
    "?unit=metres",
  ]) {
    assert.ok(parseTransport(q).issue, q);
    assert.deepEqual(parseTransport(q).state, TRANSPORT_DEFAULT);
  }
});

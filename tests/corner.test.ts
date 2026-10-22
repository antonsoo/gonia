import assert from "node:assert/strict";
import test from "node:test";
import { buildCorner, readState, treatments, writeState } from "../src/core/corner";
import { studyDocument } from "../src/study";

test("Vitruvius's half-triglyph examples at B = 2T", () => {
  const aligned = buildCorner({ beam: 2, treatment: "align" });
  assert.equal(aligned.cornerGap, 0.5);
  assert.equal(aligned.cornerOffset, 0);
  const widened = buildCorner({ beam: 2, treatment: "widen" });
  assert.equal(widened.metopes[0]?.width, 2);
  assert.equal(widened.cornerOffset, 0.5);
  const contracted = buildCorner({ beam: 2, treatment: "contract" });
  assert.deepEqual(contracted.bays, [4.5, 5]);
  assert.equal(contracted.metopes[0]?.width, 1.5);
  assert.equal(contracted.cornerOffset, 0.5);
});

test("the equal-width limit really coincides across treatments", () => {
  const reference = buildCorner({ beam: 1 });
  for (const treatment of treatments) {
    const c = buildCorner({ beam: 1, treatment });
    assert.deepEqual(c.columnAxes, reference.columnAxes);
    assert.deepEqual(c.triglyphCenters, reference.triglyphCenters);
    assert.equal(c.cornerOffset, 0);
    assert.equal(c.cornerGap, 0);
  }
});

test("share inputs are bounded and cannot introduce markup", () => {
  for (const raw of [
    "?b=NaN&t=widen",
    "?b=Infinity",
    "?b=%3Csvg%3E&t=%3Cscript%3E",
    "?b=",
    "?b=2junk",
  ]) {
    assert.equal(readState(raw).beam, 2);
    assert.ok(treatments.includes(readState(raw).treatment));
  }
  assert.equal(readState("?b=9").beam, 3);
  assert.equal(readState("?b=0").beam, 1);
  for (let b = 100; b <= 300; b++)
    for (const treatment of treatments) {
      const state = { beam: b / 100, treatment };
      assert.deepEqual(readState(writeState(state)), state);
    }
});

test("saved study retains the actual selected corner and its remaining compromise", () => {
  const html = studyDocument(buildCorner({ beam: 2.4, treatment: "contract" }));
  assert.match(html, /4\.3 T/);
  assert.match(html, /0\.7 T/);
  assert.match(html, /corner triglyph remains off/);
  assert.match(html, /intercolumnia extrema contrahunt/);
  assert.match(html, /ἐπιστύλιον/);
  assert.match(html, /b=2\.40&amp;t=contract#workshop/);
  assert.doesNotMatch(html, /<script|<link|<iframe|<img/);
});

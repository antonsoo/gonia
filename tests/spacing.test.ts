import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSpacing, readSpacing, spacingDefault, writeSpacing } from "../src/core/spacing";
import { spacingStudy } from "../src/spacing-study";

test("equalizing the central gap changes diameter at fixed front, and front at fixed diameter", () => {
  const prescribed = buildSpacing(spacingDefault);
  const changed = buildSpacing({ ...spacingDefault, equalCentre: true });
  assert.equal(prescribed.front, changed.front);
  assert(changed.diameter > prescribed.diameter);
  assert.equal(prescribed.widthModules - changed.widthModules, 0.75);
  const fixedD = buildSpacing({ ...spacingDefault, basis: "diameter", equalCentre: true });
  assert.equal(fixedD.diameter, prescribed.diameter);
  assert.equal(prescribed.front - fixedD.front, 0.75);
});
test("a shared alteration and chosen wide gap survive round trips, while malformed inputs stay bounded", () => {
  const state = {
    ...spacingDefault,
    system: "araeostyle" as const,
    wideGap: 5.25,
    equalCentre: true,
  };
  assert.deepEqual(readSpacing(writeSpacing(state)), state);
  const bad = readSpacing("?system=%3Csvg%3E&n=7&front=Infinity&d=-10&gap=99&centre=unknown");
  assert.equal(bad.system, "eustyle");
  assert.equal(bad.columns, 6);
  assert.equal(bad.front, 18);
  assert.equal(bad.diameter, 0.5);
  assert.equal(bad.wideGap, 6);
  assert.equal(bad.equalCentre, false);
});
test("the saved reading preserves the alteration and includes every source page", () => {
  const model = buildSpacing({ ...spacingDefault, equalCentre: true });
  const images = { 64: "page64", 65: "page65", 66: "page66", 67: "page67" };
  const html = spacingStudy(model, images);
  assert.match(html, /Deliberately altered example/);
  assert.match(html, /17.25 D/);
  assert.match(html, /centre=equal/);
  for (const image of Object.values(images)) assert(html.includes(`src="${image}"`));
  const wide = spacingStudy(buildSpacing({ system: "araeostyle" }), images);
  assert.match(wide, /user-selected example/);
  assert.match(wide, /gives no numerical araeostyle gap/);
});

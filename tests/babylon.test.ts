import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BABYLON_DEFAULT,
  babylonCSV,
  babylonModel,
  babylonQuery,
  babylonRecord,
  readBabylon,
  readBabylonRecord,
} from "../src/core/babylon";

test("the unwritten sixth row does not become a zero-height terrace or a located sanctuary", () => {
  const s = { ...BABYLON_DEFAULT, supplied: false };
  const m = babylonModel(s);
  assert.equal(m.tabletHeight, null);
  assert.equal(m.knownHeight, 84);
  assert.equal(m.rows[5]?.kind, "missing");
  assert.equal(m.rows[5]?.width, null);
  assert.equal(m.rows[5]?.depth, null);
  assert.equal(m.rows[5]?.height, null);
  assert.equal(m.rows[5]?.bottom, 69);
  assert.equal(m.rows[6]?.bottom, null);
  assert.equal(m.rows[6]?.height, 15);
  const row = babylonCSV(s).split("\r\n")[6]?.split(",");
  assert.deepEqual(row?.slice(0, 6), ["6", "missing", "", "", "", "69"]);
  assert.equal(babylonCSV(s).split("\r\n")[7]?.split(",")[5], "");
});

test("a completed 90 m scheme remains separate from a 91.5 m calibration and a rectangular sanctuary", () => {
  const m = babylonModel(BABYLON_DEFAULT);
  assert.equal(m.tabletHeight, 90);
  assert.equal(m.rows[6]?.width, 24);
  assert.equal(m.rows[6]?.depth, 22.5);
  assert.ok(Math.abs(m.steleHeight - 91.5) < 1e-12);
  assert.ok(Math.abs((m.rows[1]?.steleHeight ?? 0) - 9.516) < 1e-12);
  const different = babylonModel({ ...BABYLON_DEFAULT, ruler: "terrace" });
  assert.ok(different.steleHeight > 92.23 && different.steleHeight < 92.25);
  assert.equal(different.tabletHeight, 90);
});

test("shared and native records restore all comparison assumptions or reject the complete record", () => {
  const s = {
    ...BABYLON_DEFAULT,
    supplied: false,
    width: 27,
    height: 12,
    base: 900 as const,
    ruler: "terrace" as const,
    selected: 6,
    page: "tcl6-lx",
  };
  assert.deepEqual(readBabylon(babylonQuery(s)), { state: s, invalid: false });
  assert.deepEqual(readBabylonRecord(babylonRecord(s)), s);
  for (const q of [
    "?base=900&base=915",
    "?width=17.0",
    "?height=0",
    "?selected=7",
    "?page=unknown",
    "?supplied=true",
    "?base=NaN",
    "?ruler=overall&extra=1",
  ]) {
    assert.deepEqual(readBabylon(q), { state: BABYLON_DEFAULT, invalid: true }, q);
  }
  for (const broken of [
    { ...s, height: 0 },
    { ...s, width: 28 },
    { ...s, base: 901 },
    { ...s, unexpected: 1 },
  ]) {
    assert.throws(() =>
      readBabylonRecord(JSON.stringify({ schema: "gonia-babylon-1", state: broken })),
    );
  }
});

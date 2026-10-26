import assert from "node:assert/strict";
import { test } from "node:test";
import { ledgerCSV, ledgerInitial, ledgerModel, ledgerQuery, readLedger } from "../src/core/ledger";

test("whole-obol allocations expose alternatives without changing the edited entries", () => {
  for (const entry of [90, 100] as const) {
    const balanced: number[] = [];
    let matching = 0;
    for (let extra = 0; extra < 128; extra++) {
      const m = ledgerModel({ ...ledgerInitial, entry, extra });
      assert.equal(
        m.rows.reduce((n, row) => n + row.recorded, 0),
        entry * 6,
      );
      assert.equal(
        m.rows.reduce((n, row) => n + row.chosen, 0),
        m.allocated,
      );
      if (m.balanced) balanced.push(extra);
      if (m.matches) {
        assert.equal(m.balanced, true);
        matching++;
      }
    }
    assert.equal(balanced.length, entry === 90 ? 7 : 21);
    assert.equal(matching, 1);
    assert.ok(balanced.includes(entry === 90 ? 1 : 31));
  }
});

test("saved settings reject repeated or malformed identity instead of silently changing a subset", () => {
  for (const search of [
    "?entry=90&entry=100",
    "?extra=128",
    "?person=7",
    "?extra=1e2",
    "?entry=90&person=",
    "?record=true",
    "?entry=90&extra=-1",
  ]) {
    const parsed = readLedger(search);
    assert.equal(parsed.invalid, true, search);
    assert.deepEqual(parsed.state, ledgerInitial);
  }
  const s = { entry: 90 as const, extra: 64, person: 6, record: true };
  assert.deepEqual(readLedger(ledgerQuery(s)), { state: s, invalid: false });
});

test("export keeps a balanced alternative separate from the edited record", () => {
  const s = { entry: 90 as const, extra: 64, person: 6, record: false };
  assert.equal(ledgerModel(s).balanced, true);
  assert.equal(ledgerModel(s).matches, false);
  const csv = ledgerCSV(s);
  assert.ok(csv.includes('"your_obols","edited_record_obols"'));
  assert.ok(
    csv.includes('"Sosandros","Of Simias in the first entry; interpreted as enslaved","78","77"'),
  );
  assert.ok(csv.includes('"Simias","Living in Alopeke","77","78"'));
});

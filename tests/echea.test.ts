import assert from "node:assert/strict";
import test from "node:test";
import {
  ECHEA_DEFAULT,
  ECHEA_NOTES,
  echeaPlaces,
  echeaQuery,
  echeaRow,
  echeaSound,
  echeaWav,
  noteFrequency,
  parseEchea,
  resonator,
  responseAt,
} from "../src/core/echea";

const near = (actual: number, expected: number, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
test("the printed one-row prescription mirrors six pairs around one centre, including its pitch reversal", () => {
  const row = echeaRow("source");
  assert.deepEqual(
    row.map((i) => ECHEA_NOTES[i]?.short),
    ["NH", "ND", "P", "NS", "M", "HM", "HH", "HM", "M", "NS", "P", "ND", "NH"],
  );
  assert.deepEqual(echeaPlaces(0, "source"), [7]);
  for (let n = 1; n < 7; n++) assert.equal(echeaPlaces(n, "source").length, 2);
  const frequency = row.map((i) => noteFrequency(i, 220));
  for (const i of [0, 1, 3, 4, 5]) near((frequency[i] ?? 0) / (frequency[i + 1] ?? 1), 4 / 3);
  near((frequency[3] ?? 0) / (frequency[2] ?? 1), 32 / 27);
  assert.deepEqual(echeaPlaces(3, "ascending"), [3, 11]);
  assert.deepEqual(echeaPlaces(4, "ascending"), [4, 10]);
  assert.deepEqual([...echeaRow("source")].sort(), [...echeaRow("ascending")].sort());
});
test("the response starts at rest, is continuous when forcing ends, and subsequently satisfies free decay", () => {
  for (const natural of [92.8125, 220, 660])
    for (const detune of [-200, 0, 100])
      for (const q of [40, 120, 360]) {
        const drive = natural * 2 ** (detune / 1200),
          initial = responseAt(0, natural, drive, q);
        near(initial.x, 0);
        near(initial.v, 0, 1e-8);
        const at = responseAt(1.5, natural, drive, q),
          after = responseAt(1.5 + 1e-10, natural, drive, q);
        near(after.x, at.x, 1e-6);
        near(after.v, at.v, 0.003);
        const period = 1 / (natural * Math.sqrt(1 - 1 / (4 * q * q))),
          decay = Math.exp((-Math.PI * natural * period) / q);
        const a = responseAt(1.8, natural, drive, q),
          b = responseAt(1.8 + period, natural, drive, q);
        near(b.x, a.x * decay, 1e-9);
        near(b.v, a.v * decay, 1e-6);
      }
});
test("detuning changes response level without normalizing it away in audio", () => {
  const rms = (a: Float32Array) =>
    Math.sqrt(a.slice(12000, 35000).reduce((sum, x) => sum + x * x, 0) / 23000);
  const matched = echeaSound({ ...ECHEA_DEFAULT, detune: 0 }, "response"),
    miss = echeaSound({ ...ECHEA_DEFAULT, detune: 100 }, "response");
  assert.ok(rms(matched.samples) > 8 * rms(miss.samples));
  for (const clip of [matched, miss, echeaSound(ECHEA_DEFAULT, "row")]) {
    assert.ok(clip.samples.every((x) => Number.isFinite(x) && Math.abs(x) < 1));
    const wav = echeaWav(clip),
      view = new DataView(wav.buffer);
    assert.equal(view.getUint32(40, true), clip.samples.length * 2);
    assert.equal(view.getUint32(24, true), 24000);
    assert.equal(new TextDecoder().decode(wav.slice(0, 4)), "RIFF");
  }
  near(resonator(ECHEA_DEFAULT).amplitude, 1);
});
test("shared experiments round trip and reject ambiguous state", () => {
  for (const reference of [165, 220, 330])
    for (const q of [40, 120, 360]) {
      const state = {
        ...ECHEA_DEFAULT,
        reference,
        q,
        note: 6,
        detune: -123,
        reading: 8,
        order: "ascending" as const,
      };
      assert.deepEqual(parseEchea(echeaQuery(state)), { state, adjusted: false });
    }
  for (const query of ["?n=1&n=2", "?d=100&d=100"])
    assert.deepEqual(parseEchea(query), { state: ECHEA_DEFAULT, adjusted: true });
  for (const query of ["?d=Infinity", "?n=", "?q=1", "?a=440", "?r=100", "?n=-1", "?o=unknown"])
    assert.equal(parseEchea(query).adjusted, true);
});

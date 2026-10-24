import { ECHEA_DEFAULT, echeaRow, noteFrequency, resonator, responseAt } from "../src/core/echea";

for (const reference of [165, 220, 330])
  for (const note of [0, 3, 6])
    for (const q of [40, 120, 360])
      for (const detune of [-100, 0, 100]) {
        const s = { ...ECHEA_DEFAULT, reference, note, q, detune },
          m = resonator(s);
        console.log(
          JSON.stringify({
            state: s,
            ...m,
            times: [0, 0.001, 0.013, 0.19, 0.7, 1.499, 1.5, 1.501, 1.7, 2.1].map((t) => ({
              t,
              ...responseAt(t, m.natural, m.drive, q),
            })),
          }),
        );
      }
console.log(
  JSON.stringify({
    row: echeaRow("source").map((note) => ({ note, hz: noteFrequency(note, 220) })),
  }),
);

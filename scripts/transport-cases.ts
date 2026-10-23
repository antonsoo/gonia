import { TRANSPORT_DEFAULT, TRANSPORT_KINDS, transportModel } from "../src/core/transport";

const cases = [];
for (const width of [2, 7.5, 12])
  for (const height of [2, 6.5, 12])
    for (const radius of [1, 4.25, 9])
      for (const kind of TRANSPORT_KINDS)
        for (const angle of [0, 1, 44, 53, 89, 90, 91, 179, 180, 181, 269, 270, 271, 359, 360]) {
          const state = { ...TRANSPORT_DEFAULT, width, height, radius, kind, angle };
          const m = transportModel(state);
          cases.push({
            state,
            centre: m.centre,
            corners: m.corners,
            contacts: m.contacts,
            lowest: m.lowest,
            diagonalRadius: m.diagonalRadius,
            fullTurnClearance: m.fullTurnClearance,
            fullTurnDistance: m.fullTurnDistance,
          });
        }
process.stdout.write(JSON.stringify(cases));

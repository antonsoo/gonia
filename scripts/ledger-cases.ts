import { ledgerInitial, ledgerModel } from "../src/core/ledger";

console.log(
  JSON.stringify(
    [90, 100].flatMap((entry) =>
      Array.from({ length: 128 }, (_, extra) => {
        const state = { ...ledgerInitial, entry: entry as 90 | 100, extra };
        const m = ledgerModel(state);
        return {
          entry,
          extra,
          chosen: m.rows.map((r) => r.chosen),
          recorded: m.rows.map((r) => r.recorded),
          total: m.total,
          allocated: m.allocated,
          left: m.left,
          balanced: m.balanced,
          matches: m.matches,
          alternatives: m.alternatives,
        };
      }),
    ),
  ),
);

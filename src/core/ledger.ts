import { type LedgerEntry, ledgerEntries, ledgerPeople } from "../ledger-content";

export interface LedgerState {
  entry: LedgerEntry;
  extra: number;
  person: number;
  record: boolean;
}
export const ledgerInitial: Readonly<LedgerState> = {
  entry: 100,
  extra: 0,
  person: 0,
  record: false,
};
export function obolCount(mask: number): number {
  let count = 0;
  for (let i = 0; i < 7; i++) count += (mask >> i) & 1;
  return count;
}
/** All arithmetic uses integer obols: six make one drachma. */
export function ledgerModel(s: LedgerState) {
  const source = ledgerEntries[s.entry];
  const total = s.entry * 6;
  const base = Math.floor(total / 7);
  const remainder = total % 7;
  const rows = ledgerPeople.map((p, i) => ({
    ...p,
    chosen: base + ((s.extra >> i) & 1),
    recorded: source.obols[i] as number,
    extra: Boolean(s.extra & (1 << i)),
  }));
  const allocated = base * 7 + obolCount(s.extra);
  return {
    source,
    total,
    base,
    remainder,
    rows,
    allocated,
    left: total - allocated,
    balanced: total === allocated,
    matches: s.extra === source.mask,
    // Choosing one or five recipients gives seven or twenty-one arrangements.
    alternatives: remainder === 1 ? 7 : 21,
  };
}
export function money(obols: number): string {
  const dr = Math.floor(obols / 6),
    ob = obols % 6;
  return ob ? `${dr} dr. ${ob} ob.` : `${dr} dr.`;
}
export function ledgerQuery(s: LedgerState): string {
  return new URLSearchParams({
    entry: String(s.entry),
    extra: String(s.extra),
    person: String(s.person),
    record: s.record ? "1" : "0",
  }).toString();
}
export function readLedger(search: string): { state: LedgerState; invalid: boolean } {
  const p = new URLSearchParams(search);
  const validNumber = (key: string, fallback: number, allowed: (n: number) => boolean) => {
    if (!p.has(key)) return fallback;
    const text = p.get(key) ?? "";
    const n = Number(text);
    if (p.getAll(key).length !== 1 || !/^\d{1,3}$/.test(text) || !allowed(n)) throw new Error(key);
    return n;
  };
  try {
    const entry = validNumber("entry", 100, (n) => n === 90 || n === 100) as LedgerEntry;
    const extra = validNumber("extra", 0, (n) => n >= 0 && n <= 127);
    const person = validNumber("person", 0, (n) => n >= 0 && n < 7);
    const record = validNumber("record", 0, (n) => n === 0 || n === 1) === 1;
    return { state: { entry, extra, person, record }, invalid: false };
  } catch {
    return { state: { ...ledgerInitial }, invalid: true };
  }
}
export function ledgerCSV(s: LedgerState): string {
  const m = ledgerModel(s);
  const rows: (string | number)[][] = [
    ["Gonia Erechtheion ledger", "IG I3 476; 408/7 BCE; modern allocation exercise"],
    ["unit", "integer obols; 6 obols = 1 drachma"],
    ["source", "https://telota.bbaw.de/ig/digitale-edition/inschrift/IG%20I%C2%B3%20476"],
    ["edited_lines", m.source.lines],
    ["entry_total_obols", m.total],
    ["your_allocated_obols", m.allocated],
    ["unallocated_obols_negative_means_over", m.left],
    [
      "name",
      "source_identifier_interpretation",
      "your_obols",
      "edited_record_obols",
      "edited_record_drachmas",
      "edited_record_remaining_obols",
      "IG_lines",
    ],
    ...m.rows.map((r) => [
      r.name,
      r.description,
      r.chosen,
      r.recorded,
      Math.floor(r.recorded / 6),
      r.recorded % 6,
      r.lines[s.entry === 90 ? 0 : 1],
    ]),
  ];
  return `${rows.map((row) => row.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n")}\n`;
}

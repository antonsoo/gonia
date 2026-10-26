import { type LedgerState, ledgerModel, money } from "./core/ledger";

export const le = (s: string): string =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Numeral outlines avoid depending on a font's support for acrophonic signs. */
export function ledgerNumeral(obols: number): string {
  let dr = Math.floor(obols / 6);
  const tens = Math.floor(dr / 10);
  dr %= 10;
  const symbols = [
    ...Array.from({ length: tens }, () => "ten"),
    ...Array.from({ length: dr }, () => "drachma"),
    ...Array.from({ length: obols % 6 }, () => "obol"),
  ];
  return `<svg class="lg-numeral" viewBox="0 0 ${symbols.length * 18 + 8} 32" role="img" aria-label="${money(obols)} in a schematic Attic numeral"><title>${money(obols)}: ten-drachma triangles, one-drachma bars with a crossbar, and obol strokes</title><g fill="none" stroke="currentColor" stroke-width="1.7">${symbols.map((kind, i) => `<path transform="translate(${i * 18 + 4},4)" d="${kind === "ten" ? "M0 23 L7 0 L14 23 Z" : kind === "drachma" ? "M7 0 V24 M7 11 H16" : "M7 0 V24"}"/>`).join("")}</g></svg>`;
}

export function ledgerRemainder(s: LedgerState): string {
  const m = ledgerModel(s);
  return `<svg viewBox="0 0 360 72" role="img" aria-label="${m.remainder} obols to distribute; ${m.remainder - m.left} currently assigned"><title>One circle per remainder obol; an outline remains until assigned</title>${Array.from({ length: m.remainder }, (_, i) => `<circle cx="${30 + i * 48}" cy="26" r="15" fill="${i < m.remainder - m.left ? "#405a43" : "none"}" stroke="#405a43" stroke-width="2"/><path d="M${30 + i * 48} 18 v16" stroke="${i < m.remainder - m.left ? "#f4f1e8" : "#405a43"}" stroke-width="2"/>`).join("")}<text x="14" y="66" fill="#27352f" font-size="14">${m.left < 0 ? `${-m.left} obols over the total` : `${m.left} obol${m.left === 1 ? "" : "s"} left to place`}</text></svg>`;
}

export function ledgerComparison(s: LedgerState): string {
  const m = ledgerModel(s);
  return `<table><caption>IG I³ 476 · ${m.source.lines}. Six obols make one drachma.</caption><thead><tr><th scope="col">Name</th><th scope="col">Your allocation</th><th scope="col">Edited record</th></tr></thead><tbody>${m.rows.map((r) => `<tr><th scope="row">${le(r.name)}</th><td>${money(r.chosen)}</td><td>${money(r.recorded)}</td></tr>`).join("")}</tbody><tfoot><tr><th scope="row">Total</th><td>${money(m.allocated)}</td><td>${money(m.total)}</td></tr></tfoot></table>`;
}

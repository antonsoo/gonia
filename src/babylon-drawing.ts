import { type BabylonState, babylonModel, babylonRecord } from "./core/babylon";
export const be = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const bn = (v: number, digits = 2) =>
  v.toLocaleString("en-US", { maximumFractionDigits: digits });
export function babylonDiagram(
  s: BabylonState,
  kind: "tablet" | "stele",
  standalone = false,
): string {
  const m = babylonModel(s),
    scale = 3.6,
    base = 472,
    centre = 242;
  const unknown = kind === "tablet" && !s.supplied;
  const ticks = [0, 20, 40, 60, 80, 100].filter((v) => !unknown || v <= 60);
  const title = kind === "tablet" ? "Tablet-derived scheme" : "Calibrated stone image";
  let y = 0;
  const blocks = m.rows
    .map((row, i) => {
      const missing = kind === "tablet" && row.kind === "missing";
      const height = kind === "tablet" ? (row.height ?? 6) : row.steleHeight;
      const width = kind === "tablet" ? (row.width ?? 42) : row.steleWidth;
      const bottom = y;
      y += height;
      const selected = s.selected === i;
      const color = kind === "tablet" ? "#963b25" : "#405a43";
      return `<g data-bb-level="${i + 1}" data-bb-kind="${kind}" data-bb-status="${kind === "tablet" ? row.kind : "image-projection"}" ${unknown && i === 6 ? "" : `data-bb-bottom="${bottom}"`} ${missing ? "" : `data-bb-width="${width}" data-bb-height="${height}"`}>
      <rect x="${centre - (width * scale) / 2}" y="${base - (bottom + height) * scale}" width="${width * scale}" height="${height * scale}" fill="${missing ? "none" : selected ? color : kind === "tablet" ? "#efe3d8" : "#e1e6d8"}" stroke="${color}" stroke-width="${selected ? 2.5 : 1.2}" ${i === 5 && kind === "tablet" ? 'stroke-dasharray="5 4"' : ""}/>
      <text x="${centre}" y="${base - (bottom + height / 2) * scale + 5}" text-anchor="middle" fill="${selected && !missing ? "#ffffff" : "#27352f"}" font-size="14">${missing ? "6 · unknown" : i + 1}</text>
      ${missing ? `<path d="M48 ${base - (bottom + 2) * scale} l7 -5 l-7 -5 l7 -5" stroke="#963b25" fill="none"/><text x="242" y="${base - (bottom + height) * scale - 7}" text-anchor="middle" font-size="12" fill="#963b25">Drawing gap; height not located</text>` : ""}
    </g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 550" role="img" aria-label="${title}: seven numbered parts${unknown ? ", with an unknown sixth-storey gap" : ""}. Select a level in the controls for numerical values." ${standalone ? 'font-family="Plex, sans-serif"' : ""}><title>${title}</title><style>text{font-family:Plex,Arial,sans-serif}</style><rect width="480" height="550" fill="#f4f1e8"/>
    <text x="22" y="30" font-size="17" fill="#27352f">${title}</text>
    <text x="22" y="52" font-size="13" fill="#5f6559">${kind === "tablet" ? "1 rod = 6 m · centred rectangular outlines" : "Rounded source centimetres × your ruler"}</text>
    ${ticks.map((v) => `<line x1="57" x2="427" y1="${base - v * scale}" y2="${base - v * scale}" stroke="#bfc3b3" stroke-dasharray="2 6"/><text x="47" y="${base - v * scale + 4}" text-anchor="end" font-size="12" fill="#5f6559">${v}</text>`).join("")}
    <text x="20" y="88" font-size="12" fill="#5f6559">m</text>${blocks}
    <line x1="57" x2="427" y1="${base}" y2="${base}" stroke="#27352f"/>
    <text x="242" y="499" font-size="14" text-anchor="middle" fill="#27352f">${kind === "tablet" ? (m.tabletHeight === null ? "Total height unresolved" : `${bn(m.tabletHeight)} m with your supplied sixth level`) : `${bn(m.steleHeight)} m under this calibration`}</text>
    <text x="242" y="523" font-size="12" text-anchor="middle" fill="#5f6559">${kind === "tablet" ? "Dashed sixth outline = supplied, not written" : "Image projection, not an excavated elevation"}</text>
  </svg>`;
}
export function babylonPlate(s: BabylonState, font: string, mit: string, ofl: string): string {
  const nested = (kind: "tablet" | "stele", x: number) =>
    babylonDiagram(s, kind, true).replace(
      '<svg xmlns="http://www.w3.org/2000/svg"',
      `<svg x="${x}" y="80" width="480" height="550"`,
    );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" role="img" aria-labelledby="plate-title plate-desc"><title id="plate-title">Gonia — A tower between two sources</title><desc id="plate-desc">Compare a tablet-derived scheme with a modern projection of the Tower of Babylon stele. Neither diagram is a survey of the built tower. A missing sixth row is distinct from zero.</desc><metadata>${be(JSON.stringify({ record: JSON.parse(babylonRecord(s)), source: "Scheil 1914 pp. 300/304; Pedersen 2024 pp. 188-189, DOI 10.1017/irq.2024.4", author: "Anton Soloviev, 2026", license: mit, fontLicense: ofl }))}</metadata><style>@font-face{font-family:Plex;src:url('${font}')}text{font-family:Plex,Arial,sans-serif}</style><rect width="960" height="720" fill="#f4f1e8"/><text x="28" y="38" fill="#27352f" font-size="25">A tower between two sources</text><text x="28" y="64" fill="#5f6559" font-size="14">Gonia · equal horizontal and vertical metres in both comparisons</text>${nested("tablet", 0)}${nested("stele", 480)}<text x="28" y="657" fill="#27352f" font-size="14">Source dimensions, supplied dimensions and a uniformly calibrated image are different kinds of evidence.</text><text x="28" y="683" fill="#5f6559" font-size="12">New diagrams: Anton Soloviev, 2026, MIT. Full code and embedded font licenses are in this SVG's metadata.</text></svg>`;
}

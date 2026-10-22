/** A local, idealized Doric corner, measured in triglyph widths (T = 1).
 * One intermediate triglyph per normal column bay. No named temple is fitted.
 */
export const treatments = ["align", "widen", "contract"] as const;
export type Treatment = (typeof treatments)[number];
export interface Parameters {
  beam: number;
  treatment: Treatment;
}
export interface Corner {
  parameters: Parameters;
  triglyphWidth: number;
  metopeWidth: number;
  friezeHeight: number;
  normalBay: number;
  discrepancy: number;
  columnAxes: number[];
  triglyphCenters: number[];
  metopes: { left: number; right: number; width: number }[];
  bays: number[];
  cornerGap: number;
  cornerOffset: number;
}

export function normalize(input: Partial<Parameters>): Parameters {
  const beam = typeof input.beam === "number" && Number.isFinite(input.beam) ? input.beam : 2;
  return {
    beam: Math.round(Math.min(3, Math.max(1, beam)) * 100) / 100,
    treatment: treatments.includes(input.treatment as Treatment)
      ? (input.treatment as Treatment)
      : "align",
  };
}

export function buildCorner(input: Partial<Parameters>): Corner {
  const parameters = normalize(input);
  const { beam, treatment } = parameters;
  const triglyphWidth = 1;
  const metopeWidth = 1.5;
  const pitch = triglyphWidth + metopeWidth;
  const normalBay = 2 * pitch;
  const discrepancy = (beam - triglyphWidth) / 2;
  const columnAxes = Array.from({ length: 3 }, (_, i) =>
    i === 0 || treatment !== "contract"
      ? beam / 2 + i * normalBay
      : triglyphWidth / 2 + i * normalBay,
  );
  const triglyphCenters = Array.from({ length: 5 }, (_, i) =>
    treatment === "contract" || (treatment === "widen" && i === 0)
      ? triglyphWidth / 2 + i * pitch
      : beam / 2 + i * pitch,
  );
  const metopes = triglyphCenters.slice(1).map((center, i) => {
    const left = (triglyphCenters[i] as number) + triglyphWidth / 2;
    const right = center - triglyphWidth / 2;
    return { left, right, width: right - left };
  });
  return {
    parameters,
    triglyphWidth,
    metopeWidth,
    friezeHeight: metopeWidth,
    normalBay,
    discrepancy,
    columnAxes,
    triglyphCenters,
    metopes,
    bays: columnAxes.slice(1).map((x, i) => x - (columnAxes[i] as number)),
    cornerGap: (triglyphCenters[0] as number) - triglyphWidth / 2,
    cornerOffset: (columnAxes[0] as number) - (triglyphCenters[0] as number),
  };
}

export function readState(hash: string): Parameters {
  const p = new URLSearchParams(hash.replace(/^[#?]/, ""));
  const raw = p.get("b");
  return normalize({
    beam: raw && /^\d(?:\.\d{1,2})?$/.test(raw) ? Number(raw) : 2,
    treatment: p.get("t") as Treatment,
  });
}

export function writeState(p: Parameters): string {
  const state = normalize(p);
  return `?b=${state.beam.toFixed(2)}&t=${state.treatment}`;
}

export function number(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "") || "0";
}

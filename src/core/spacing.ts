export const spacingSystems = [
  "pycnostyle",
  "systyle",
  "eustyle",
  "diastyle",
  "araeostyle",
] as const;
export type SpacingSystem = (typeof spacingSystems)[number];
export interface SpacingParameters {
  system: SpacingSystem;
  columns: 4 | 6 | 8;
  basis: "front" | "diameter";
  front: number;
  diameter: number;
  wideGap: number;
  equalCentre: boolean;
}
export const spacingDefault: SpacingParameters = {
  system: "eustyle",
  columns: 6,
  basis: "front",
  front: 18,
  diameter: 1,
  wideGap: 4,
  equalCentre: false,
};
function bounded(value: unknown, fallback: number, min: number, max: number, step: number) {
  const finite = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Number((Math.round(Math.max(min, Math.min(max, finite)) / step) * step).toFixed(2));
}
export function normalizeSpacing(input: Partial<SpacingParameters>): SpacingParameters {
  return {
    system: spacingSystems.includes(input.system as SpacingSystem)
      ? (input.system as SpacingSystem)
      : spacingDefault.system,
    columns: input.columns === 4 || input.columns === 8 ? input.columns : 6,
    basis: input.basis === "diameter" ? "diameter" : "front",
    front: bounded(input.front, 18, 6, 36, 0.25),
    diameter: bounded(input.diameter, 1, 0.5, 2, 0.05),
    wideGap: bounded(input.wideGap, 4, 3.25, 6, 0.25),
    equalCentre: input.equalCentre === true,
  };
}
export interface SpacingModel {
  parameters: SpacingParameters;
  ordinaryGap: number;
  centreGap: number;
  heightRatio: number;
  widthModules: number;
  diameter: number;
  height: number;
  front: number;
  axes: number[];
  gaps: { left: number; right: number; width: number; modules: number; central: boolean }[];
}
export function buildSpacing(input: Partial<SpacingParameters>): SpacingModel {
  const parameters = normalizeSpacing(input);
  const { system, columns, basis, equalCentre, wideGap } = parameters;
  const ordinaryGap = {
    pycnostyle: 1.5,
    systyle: 2,
    eustyle: 2.25,
    diastyle: 3,
    araeostyle: wideGap,
  }[system];
  const centreGap = system === "eustyle" && !equalCentre ? 3 : ordinaryGap;
  const heightRatio = {
    pycnostyle: 10,
    systyle: 9.5,
    eustyle: 9.5,
    diastyle: 8.5,
    araeostyle: 8,
  }[system];
  const centralIndex = columns / 2 - 1;
  const gapModules = Array.from({ length: columns - 1 }, (_, i) =>
    i === centralIndex ? centreGap : ordinaryGap,
  );
  const widthModules = columns + gapModules.reduce((total, gap) => total + gap, 0);
  const diameter = basis === "front" ? parameters.front / widthModules : parameters.diameter;
  const axes = [diameter / 2];
  const gaps = gapModules.map((modules, i) => {
    const left = (axes[i] as number) + diameter / 2;
    const right = left + modules * diameter;
    axes.push(right + diameter / 2);
    return { left, right, width: right - left, modules, central: i === centralIndex };
  });
  return {
    parameters,
    ordinaryGap,
    centreGap,
    heightRatio,
    widthModules,
    diameter,
    height: heightRatio * diameter,
    front: widthModules * diameter,
    axes,
    gaps,
  };
}
export function readSpacing(search: string): SpacingParameters {
  const q = new URLSearchParams(search);
  const numeric = (key: string, fallback: number) =>
    q.has(key) && q.get(key)?.trim() ? Number(q.get(key)) : fallback;
  return normalizeSpacing({
    system: q.get("system") as SpacingSystem,
    columns: numeric("n", 6) as 4 | 6 | 8,
    basis: q.get("hold") as "front" | "diameter",
    front: numeric("front", 18),
    diameter: numeric("d", 1),
    wideGap: numeric("gap", 4),
    equalCentre: q.get("centre") === "equal",
  });
}
export function writeSpacing(p: SpacingParameters): string {
  return `?system=${p.system}&n=${p.columns}&hold=${p.basis}&front=${p.front}&d=${p.diameter}&gap=${p.wideGap}&centre=${p.equalCentre ? "equal" : "wide"}`;
}
export function compareSpacing(p: SpacingParameters): SpacingModel[] {
  return spacingSystems.map((system) => buildSpacing({ ...p, system }));
}
export function measure(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

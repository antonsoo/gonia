/** Penrose (1888), printed p. 41. All input lengths are English feet. */
export const stations = [
  { height: 0, column: 0, hyperbola: 0, circle: 0 },
  { height: 8.7, column: 0.1397, hyperbola: 0.1392, circle: 0.1464 },
  { height: 15.75, column: 0.2886, hyperbola: 0.2875, circle: 0.2886 },
  { height: 23, column: 0.4618, hyperbola: 0.4613, circle: 0.4585 },
  { height: 31.43, column: 0.684, hyperbola: 0.684, circle: 0.684 },
] as const;
export const shaftLength = 31.43;
export const topOffset = 0.684;
export const millimetresPerFoot = 304.8;
export const enlargements = [1, 25, 100, 200] as const;
export type Prediction = "none" | "hyperbola" | "circle";
export interface EntasisState {
  station: number;
  enlargement: (typeof enlargements)[number];
  prediction: Prediction;
  units: "metric" | "feet";
  comparison: "actual" | "equal";
}
export const defaultEntasis: EntasisState = {
  station: 2,
  enlargement: 100,
  prediction: "none",
  units: "metric",
  comparison: "actual",
};
export function normalizeEntasis(p: Partial<EntasisState>): EntasisState {
  return {
    station:
      Number.isInteger(p.station) && (p.station ?? -1) >= 0 && (p.station ?? 5) < 5
        ? (p.station as number)
        : defaultEntasis.station,
    enlargement: enlargements.includes(p.enlargement as EntasisState["enlargement"])
      ? (p.enlargement as EntasisState["enlargement"])
      : defaultEntasis.enlargement,
    prediction: p.prediction === "hyperbola" || p.prediction === "circle" ? p.prediction : "none",
    units: p.units === "feet" ? "feet" : "metric",
    comparison: p.comparison === "equal" ? "equal" : "actual",
  };
}
export function readEntasis(search: string): EntasisState {
  const p = new URLSearchParams(search);
  return normalizeEntasis({
    station: p.has("station") ? Number(p.get("station")) : defaultEntasis.station,
    enlargement: Number(p.get("enlarge")) as EntasisState["enlargement"],
    prediction: p.get("prediction") as Prediction,
    units: p.get("units") as EntasisState["units"],
    comparison: p.get("compare") as EntasisState["comparison"],
  });
}
export function writeEntasis(state: EntasisState): string {
  const p = normalizeEntasis(state);
  return `?station=${p.station}&enlarge=${p.enlargement}&prediction=${p.prediction}&units=${p.units}&compare=${p.comparison}`;
}
export function stationMeasurements(index: number) {
  const row = stations[index];
  if (!row) throw new RangeError("Unknown measurement station");
  const taper = (topOffset * row.height) / shaftLength;
  return {
    ...row,
    taper,
    departure: taper - row.column,
    hyperbolaDeparture: taper - row.hyperbola,
    circleDeparture: taper - row.circle,
    hyperbolaDifference: row.hyperbola - row.column,
    circleDifference: row.circle - row.column,
  };
}
export const reportedMaxima = [
  {
    name: "Erechtheum · north portico",
    length: 21.12,
    maximum: 0.0195,
    height: 10.42,
    printedComparison: 0.029,
  },
  { name: "Theseum", length: 17.1, maximum: 0.023, height: 8.7, printedComparison: 0.042 },
  {
    name: "Parthenon · peristyle",
    length: 31.43,
    maximum: 0.057,
    height: 13.8,
    printedComparison: 0.057,
  },
  {
    name: "Propylaea · small order",
    length: 17.5,
    maximum: 0.0343,
    height: 9.33,
    printedComparison: 0.0615,
  },
  {
    name: "Propylaea · large eastern order",
    length: 25.6,
    maximum: 0.0627,
    height: 13.75,
    printedComparison: 0.077,
  },
  {
    name: "Jupiter Olympius",
    length: 43.7,
    maximum: 0.118,
    height: 18.4,
    printedComparison: 0.084,
  },
] as const;
export function compareMaxima(basis: EntasisState["comparison"]) {
  return reportedMaxima.map((row) => ({
    ...row,
    displayedMaximum: row.maximum * (basis === "equal" ? shaftLength / row.length : 1),
    normalizedMaximum: (row.maximum * shaftLength) / row.length,
  }));
}
export function decimal(value: number, places = 3): string {
  return (Math.abs(value) < 0.5 * 10 ** -places ? 0 : value).toFixed(places);
}
export function offsetLabel(feet: number, units: EntasisState["units"]): string {
  return units === "feet" ? `${decimal(feet, 4)} ft` : `${decimal(feet * millimetresPerFoot)} mm`;
}
export function heightLabel(feet: number, units: EntasisState["units"]): string {
  return units === "feet" ? `${decimal(feet, 2)} ft` : `${decimal(feet * 0.3048)} m`;
}
export function entasisCsv(): string {
  return `${[
    "source,height_ft,column_offset_ft,hyperbola_offset_ft,circle_offset_ft,straight_taper_ft,departure_ft,departure_mm,hyperbola_minus_column_mm,circle_minus_column_mm",
    ...stations.map((_, i) => {
      const r = stationMeasurements(i);
      return [
        "Penrose1888_p41",
        r.height,
        r.column,
        r.hyperbola,
        r.circle,
        r.taper,
        r.departure,
        r.departure * millimetresPerFoot,
        r.hyperbolaDifference * millimetresPerFoot,
        r.circleDifference * millimetresPerFoot,
      ].join(",");
    }),
  ].join("\r\n")}\r\n`;
}

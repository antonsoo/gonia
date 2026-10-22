import {
  decimal,
  type EntasisState,
  heightLabel,
  offsetLabel,
  shaftLength,
  stationMeasurements,
  stations,
  topOffset,
} from "./core/entasis";

// Both plates share physical units per SVG unit; only residual x is enlarged.
const scale = 460 / shaftLength;
const bottom = 505;
const y = (height: number) => bottom - height * scale;
const point = (x: number, height: number) => `${decimal(x, 6)},${decimal(y(height), 6)}`;

export function edgeDrawing(state: EntasisState): string {
  const origin = 190;
  const x = (offset: number) => origin - offset * scale;
  const r = stationMeasurements(state.station);
  const points = stations.map((s) => point(x(s.column), s.height)).join(" ");
  return `<svg class="entasis-plate" data-plate="edge" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 570" role="img" aria-labelledby="edge-title edge-description">
<title id="edge-title">Parthenon column-edge offsets with equal axis scales</title><desc id="edge-description">Height ${heightLabel(shaftLength, state.units)}. Horizontal and vertical lengths have the same scale. Five corrected column offsets are joined by straight guides, beside the straight endpoint taper. This is one edge, not a complete column width.</desc>
<text x="20" y="22" class="plate-heading">Equal horizontal and vertical scale</text>
<path class="shaft-slice" d="M115 ${bottom} L${origin} ${bottom} ${stations
    .slice(1)
    .map((s) => `L${x(s.column)} ${y(s.height)}`)
    .join(" ")} L115 ${y(shaftLength)} Z"/>
<path class="datum" d="M${origin} ${bottom} V${y(shaftLength)}"/>
<path class="chord" data-reference="taper" d="M${origin} ${bottom} L${x(topOffset)} ${y(shaftLength)}"/>
<polyline class="observed" points="${points}"/>
${stations.map((s, i) => `<g><path class="station-rule" d="M70 ${y(s.height)} H${origin + 16}"/><text x="64" y="${y(s.height) + 4}" text-anchor="end" class="height-label">${heightLabel(s.height, state.units)}</text><circle data-station="${i}" data-offset-ft="${s.column}" cx="${decimal(x(s.column), 6)}" cy="${decimal(y(s.height), 6)}" r="${i === state.station ? 5 : 3}" class="observed-dot${i === state.station ? " chosen-dot" : ""}"/></g>`).join("")}
<path class="selected-level" d="M110 ${y(r.height)} H${origin + 36}"/>
<text x="221" y="${Math.max(65, Math.min(475, y(r.height) - 10))}" class="selected-label">Selected</text>
<path class="dimension-line" d="M${x(topOffset)} 36 V29 H${origin} V36"/>
<text x="${origin + 12}" y="36" class="small-label">${offsetLabel(topOffset, state.units)}</text>
<text x="20" y="539">Inward taper continues above the base.</text>
<text x="20" y="558" class="small-label">Shaded slice shows the column side only.</text></svg>`;
}

export function departureDrawing(state: EntasisState): string {
  const origin = 87;
  const x = (offset: number) => origin + offset * scale * state.enlargement;
  const rows = stations.map((_, i) => stationMeasurements(i));
  const r = rows[state.station];
  if (!r) throw new RangeError("Unknown station");
  const prediction = state.prediction;
  const predicted = (row: (typeof rows)[number]) =>
    prediction === "circle" ? row.circleDeparture : row.hyperbolaDeparture;
  const ticks =
    state.units === "feet"
      ? [0, 0.025, 0.05, 0.075]
      : [0, 5 / 304.8, 10 / 304.8, 15 / 304.8, 20 / 304.8];
  const visibleTicks = ticks.filter(
    (_t, i) =>
      i === 0 || state.enlargement >= 100 || (state.enlargement === 25 && i === ticks.length - 1),
  );
  return `<svg class="entasis-plate" data-plate="departure" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 570" role="img" aria-labelledby="departure-title departure-description">
<title id="departure-title">Departure from straight taper, horizontal scale ${state.enlargement} times enlarged</title><desc id="departure-description">The endpoint chord is zero. Positive distances extend outward from that chord. Five corrected offsets give the green points.${prediction === "none" ? "" : ` The orange squares are Penrose's printed ${prediction} predictions.`} Lines between the five stations are guides, not additional measurements.</desc>
<text x="20" y="22" class="plate-heading">Horizontal ${state.enlargement}× · same vertical scale</text>
${visibleTicks.map((t) => `<path class="grid-line" d="M${x(t)} 45 V${bottom}"/><text x="${x(t)}" y="528" text-anchor="middle" class="small-label">${decimal(t * (state.units === "feet" ? 1 : 304.8), state.units === "feet" ? 3 : 0)}</text>`).join("")}
${rows.map((row) => `<path class="station-rule" d="M70 ${y(row.height)} H315"/><text x="64" y="${y(row.height) + 4}" text-anchor="end" class="height-label">${heightLabel(row.height, state.units)}</text>`).join("")}
<path class="chord" d="M${origin} 45 V${bottom}"/>
<polyline class="observed" points="${rows.map((row) => point(x(row.departure), row.height)).join(" ")}"/>
${prediction === "none" ? "" : `<polyline class="prediction-line" points="${rows.map((row) => point(x(predicted(row)), row.height)).join(" ")}"/>${rows.map((row, i) => `<rect class="prediction-dot" data-prediction="${prediction}" data-station="${i}" data-departure-ft="${predicted(row)}" x="${decimal(x(predicted(row)) - 3, 6)}" y="${decimal(y(row.height) - 3, 6)}" width="6" height="6"/>`).join("")}`}
<path class="selected-departure" d="M${origin} ${y(r.height)} H${x(r.departure)}"/>
${rows.map((row, i) => `<circle data-station="${i}" data-departure-ft="${row.departure}" cx="${decimal(x(row.departure), 6)}" cy="${decimal(y(row.height), 6)}" r="${i === state.station ? 5 : 3}" class="observed-dot${i === state.station ? " chosen-dot" : ""}"/>`).join("")}
<text x="${Math.max(105, x(r.departure) + 9)}" y="${Math.max(64, Math.min(490, y(r.height) - 11))}" class="selected-label">${offsetLabel(r.departure, state.units)}</text>
<text x="20" y="552">Outward departure / ${state.units === "feet" ? "feet" : "millimetres"}</text></svg>`;
}

export function measurementRows(state: EntasisState, interactive = true): string {
  return stations
    .map((s, i) => {
      const r = stationMeasurements(i);
      const difference = state.prediction === "circle" ? r.circleDifference : r.hyperbolaDifference;
      return `<tr${i === state.station ? ' class="selected-row"' : ""}><th scope="row">${interactive ? `<button type="button" data-select-station="${i}" aria-pressed="${i === state.station}" aria-label="Inspect height ${decimal(s.height, 2)} feet">${decimal(s.height, 2)}</button>` : decimal(s.height, 2)}</th><td>${decimal(s.column, 4)}</td><td>${decimal(r.taper, 6)}</td><td>${decimal(r.departure, 6)}</td><td>${decimal(r.departure * 304.8)}</td>${state.prediction === "none" ? "" : `<td>${decimal(s[state.prediction], 4)}</td><td>${difference > 0 ? "+" : ""}${decimal(difference * 304.8)}</td>`}</tr>`;
    })
    .join("");
}
export function measurementHead(state: EntasisState): string {
  return `<tr><th scope="col">Height / ft</th><th scope="col">Column / ft</th><th scope="col">Straight taper / ft</th><th scope="col">Departure / ft</th><th scope="col">Departure / mm</th>${state.prediction === "none" ? "" : `<th scope="col">${state.prediction === "circle" ? "Circle" : "Hyperbola"} / ft</th><th scope="col">Prediction − column / mm</th>`}</tr>`;
}

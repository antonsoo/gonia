import { compareSpacing, measure, type SpacingModel } from "./core/spacing";
import { escapeHtml } from "./drawing";
import type { Dimension } from "./spacing-content";

export function spacingDrawing(m: SpacingModel, selected: Dimension, compact = false): string {
  const comparisons = compareSpacing(m.parameters);
  const maxWidth = Math.max(...comparisons.map((item) => item.front));
  const maxHeight = Math.max(...comparisons.map((item) => item.height));
  const width = compact ? 360 : 1000;
  const floorLimit = compact ? 205 : 480;
  const scale = Math.min((width - 112) / maxWidth, (floorLimit - 40) / maxHeight);
  const floor = 40 + maxHeight * scale;
  const left = (width - m.front * scale) / 2;
  const x = (metres: number) => left + metres * scale;
  const y = (metres: number) => floor - metres * scale;
  const d = m.diameter * scale;
  const planY = floor + (compact ? 58 : 76);
  const font = compact ? 12 : 16;
  const maxDiameter = Math.max(...comparisons.map((item) => item.diameter));
  const height = planY + (maxDiameter * scale) / 2 + font + 43;
  const middle = m.gaps.find((gap) => gap.central);
  if (!middle) throw new Error("Missing central gap");
  const dimension = (a: number, b: number, atY: number, label: string) =>
    `<g class="spacing-dimension"><path d="M${a} ${atY - 5}V${atY + 5}M${a} ${atY}H${b}M${b} ${atY - 5}V${atY + 5}"/><text x="${(a + b) / 2}" y="${atY + font + 5}" text-anchor="middle">${escapeHtml(label)}</text></g>`;
  let annotation = "";
  const dimY = planY + d / 2 + 17;
  if (selected === "gap") {
    annotation = dimension(
      x(middle.left),
      x(middle.right),
      dimY,
      `${measure(m.centreGap)} D clear`,
    );
  } else if (selected === "axis") {
    annotation = dimension(
      x(middle.left - m.diameter / 2),
      x(middle.right + m.diameter / 2),
      dimY,
      `${measure(m.centreGap + 1)} D axis to axis`,
    );
  } else if (selected === "diameter") {
    annotation = dimension(x(0), x(m.diameter), dimY, "D");
  } else if (selected === "front") {
    annotation = dimension(x(0), x(m.front), dimY, `${measure(m.widthModules)} D`);
  } else {
    const hx = x(0) - 22;
    annotation = `<g class="spacing-dimension"><path d="M${hx - 5} ${y(m.height)}H${hx + 5}M${hx} ${y(m.height)}V${floor}M${hx - 5} ${floor}H${hx + 5}"/><text transform="translate(${hx - 7} ${(y(m.height) + floor) / 2}) rotate(-90)" text-anchor="middle">${measure(m.heightRatio)} D</text></g>`;
  }
  const centralFill = selected === "gap" || selected === "axis";
  return `<svg class="spacing-plate" viewBox="0 0 ${width} ${height}" role="img" aria-label="${m.parameters.columns} columns in front elevation and plan. The central clear gap is ${measure(m.centreGap)} diameters; its axis spacing is ${measure(m.centreGap + 1)} diameters." style="font-size:${font}px">
<text x="16" y="20" class="plate-heading">Front elevation</text>
${centralFill ? `<rect class="spacing-open" x="${x(middle.left)}" y="${y(m.height)}" width="${middle.width * scale}" height="${m.height * scale}"/>` : ""}
<path class="spacing-ground" d="M${x(-0.35 * m.diameter)} ${floor}H${x(m.front + 0.35 * m.diameter)}"/>
${m.axes
  .map((axis) => {
    const cx = x(axis);
    const top = y(m.height);
    // A schematic silhouette. No entasis, capital or base measurements are inferred.
    return `<g class="spacing-column" data-axis-m="${axis}" data-diameter-m="${m.diameter}" data-height-m="${m.height}"><path d="M${cx - d * 0.66} ${floor}v${-d * 0.22}h${d * 0.16}L${cx - d * 0.4} ${top + d * 0.5}H${cx - d * 0.65}V${top}h${d * 1.3}v${d * 0.5}h${-d * 0.25}L${cx + d * 0.5} ${floor - d * 0.22}h${d * 0.16}V${floor}Z"/><path class="spacing-axis" d="M${cx} ${top - 7}V${floor + 8}"/></g>`;
  })
  .join("")}
<text x="16" y="${planY - 22}" class="plate-heading">Plan at the lower shaft</text>
${centralFill ? `<rect class="spacing-open" x="${x(middle.left)}" y="${planY - d / 2}" width="${middle.width * scale}" height="${d}"/>` : ""}
${m.axes.map((axis) => `<g class="spacing-plan-column" data-plan-axis-m="${axis}"><circle cx="${x(axis)}" cy="${planY}" r="${d / 2}"/><path class="spacing-axis" d="M${x(axis)} ${planY - d / 2 - 5}V${planY + d / 2 + 5}M${x(axis) - 4} ${planY}h8"/></g>`).join("")}
${annotation}</svg>`;
}

import { ae, an } from "./arch-content";
import { type FrictionThreshold, frictionThresholdText } from "./core/arch-friction";

export function frictionSearchTable(
  results: readonly FrictionThreshold[],
  controls = false,
): string {
  return `<table class="ar-threshold-table"><caption>Least friction admitted by this model, searching μ from 0 to 2</caption><thead><tr><th scope="col">Checks included</th><th scope="col">Search across every path</th>${controls ? '<th scope="col">Try the bounds</th>' : ""}</tr></thead><tbody>${results.map((r, i) => `<tr><th scope="row">${i ? "Arch and pier bases" : "Arch joints only"}</th><td>${r.kind === "bracket" ? `<p class="ar-threshold-value">μ ≈ ${an((r.lower + r.upper) / 2, 6)}</p><details${controls ? "" : " open"}><summary>Numerical bounds and path</summary><p>${ae(frictionThresholdText(r))}</p><p class="ar-note">Upper-bound witness: H = ${an(r.witness.thrust, 8)} W; bearing ${an(r.witness.bearing, 8)}%. At the failing lower bound, these thrust constraints conflict: ${ae(r.lowerConstraint)}; ${ae(r.upperConstraint)}.</p></details>` : `<p>${ae(frictionThresholdText(r))}</p>`}</td>${controls ? `<td>${r.kind === "bracket" ? `<div class="ar-threshold-actions"><button type="button" data-friction-witness="${i}">Use feasible upper bound</button><button type="button" data-friction-fail="${i}">Try failing lower bound</button></div>` : "No witness available"}</td>` : ""}</tr>`).join("")}</tbody></table>`;
}

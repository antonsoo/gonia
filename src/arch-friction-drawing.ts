import { ae, an } from "./arch-content";
import { type ArchState, archDomain, archGeometry } from "./core/arch";
import type { FrictionThreshold } from "./core/arch-friction";

/** Samples draw curves only. The threshold search itself never samples H. */
export function frictionSearchSvg(s: ArchState, results: readonly FrictionThreshold[]): string {
  const g = archGeometry(s),
    arch = archDomain({ ...s, friction: null }, g),
    whole = archDomain({ ...s, friction: null }, g, true);
  if (!arch.feasible)
    return "<p>No curve is drawn: there is no thrust interval that can fit every arch joint.</p>";
  const witnesses = results.flatMap((r, i) =>
    r.kind === "bracket" ? [{ ...r, bases: i === 1 }] : [],
  );
  const xmax = Math.min(
    arch.max,
    Math.max(1, arch.min * 1.5, ...witnesses.map((r) => r.witness.thrust * 1.6)),
  );
  const X = (h: number) => 85 + (700 * h) / xmax,
    Y = (mu: number) => 325 - 130 * Math.max(0, Math.min(2, mu));
  const jointRequirement = (h: number) =>
    Math.max(
      ...g.joints.map((j) => {
        const n = h * Math.sin(j.angle) - j.vertical * Math.cos(j.angle);
        return Math.abs(h * Math.cos(j.angle) + j.vertical * Math.sin(j.angle)) / n;
      }),
    );
  const path = (f: (h: number) => number) =>
    Array.from({ length: 241 }, (_, i) => {
      const h = arch.min + ((xmax - arch.min) * i) / 240;
      return `${i ? "L" : "M"}${X(h)},${Y(f(h))}`;
    }).join(" ");
  const band = (min: number, max: number, y: number, color: string) => {
    const left = Math.max(0, min),
      right = Math.min(xmax, max);
    return right >= left
      ? `<path d="M${X(left)} ${y}H${X(right)}" stroke="${color}" stroke-width="8"/>`
      : "";
  };
  const description = `Required joint friction (blue) and base friction (gold) against horizontal thrust. The usable coefficient must be at least the larger requirement and the contact positions must fit. The blue and gold strips show thrust intervals allowed by contact geometry alone. Curves are sampled for illustration; transition bounds come from the complete interval solver. Horizontal view ends at H = ${xmax}; requirements above mu = 2 are clipped. Current H = ${s.thrust}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" role="img" aria-label="${ae(description)}">
<style>text{font-family:Arial,sans-serif;fill:#24304d;font-size:16px}</style>
<text x="85" y="28" font-weight="bold">Required friction μ</text>
<rect x="85" y="65" width="700" height="260" fill="#edf1f7"/>
<rect x="${X(arch.min)}" y="65" width="${X(xmax) - X(arch.min)}" height="260" fill="#fff"/>
${[0, 0.5, 1, 1.5, 2].map((mu) => `<path d="M85 ${Y(mu)}H785" stroke="#c8cfdd"/><text x="65" y="${Y(mu) + 5}" text-anchor="end">${mu}</text>`).join("")}
${Array.from({ length: 5 }, (_, i) => {
  const h = (xmax * i) / 4;
  return `<path d="M${X(h)} 325v7" stroke="#69738a"/><text x="${X(h)}" y="354" text-anchor="middle">${an(h, 3)}</text>`;
}).join("")}
<path d="${path(jointRequirement)}" fill="none" stroke="#2458bd" stroke-width="3"/>
<path d="${path((h) => h / (g.vertical + s.mass / 100))}" fill="none" stroke="#9b6500" stroke-width="3"/>
${witnesses.map((r) => `<circle cx="${X(r.witness.thrust)}" cy="${Y(r.upper)}" r="${r.bases ? 7 : 5}" fill="${r.bases ? "#9b6500" : "#2458bd"}" stroke="#fff" stroke-width="2"/>`).join("")}
${s.thrust <= xmax ? `<path d="M${X(s.thrust)} 65V325" stroke="#a72c50" stroke-width="2" stroke-dasharray="6 5"/>` : ""}
<text x="85" y="388">Horizontal thrust H / W</text><text x="65" y="416" text-anchor="end">Joints</text><text x="65" y="440" text-anchor="end">Bases</text>${band(arch.min, arch.max, 411, "#2458bd")}${whole.feasible ? band(whole.min, whole.max, 435, "#9b6500") : ""}
<text x="85" y="462">${s.thrust <= xmax ? "Dashed line: current trial" : "Current trial is beyond this horizontal view"}. Curves above μ = 2 are clipped.</text>
</svg>`;
}

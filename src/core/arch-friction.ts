import { type ArchState, archDomain, archGeometry, findArchPath } from "./arch";

export const FRICTION_SEARCH_MAX = 2;
export const FRICTION_SEARCH_TOLERANCE = 0.000001;
export type FrictionThreshold =
  | { kind: "geometry" }
  | { kind: "above-range"; maximum: number }
  | {
      kind: "bracket";
      lower: number;
      upper: number;
      witness: ArchState;
      lowerConstraint: string;
      upperConstraint: string;
    };

/** Numerical transition bracket, not an exact material property.
 * For fixed geometry and loads, increasing mu only relaxes Coulomb bounds.
 * Every bisection step eliminates C over all H; it never samples force paths.
 * Keep a failing lower endpoint and a feasible upper endpoint, then construct
 * one actual contact path at that upper endpoint.
 */
export function frictionThreshold(s: ArchState, includePiers: boolean): FrictionThreshold {
  const geometry = archGeometry(s);
  if (!archDomain({ ...s, friction: null }, geometry, includePiers).feasible)
    return { kind: "geometry" };
  const domainAt = (friction: number) => archDomain({ ...s, friction }, geometry, includePiers);
  if (!domainAt(FRICTION_SEARCH_MAX).feasible)
    return { kind: "above-range", maximum: FRICTION_SEARCH_MAX };
  let lower = 0,
    upper = FRICTION_SEARCH_MAX;
  while (upper - lower > FRICTION_SEARCH_TOLERANCE) {
    const middle = (lower + upper) / 2;
    if (domainAt(middle).feasible) upper = middle;
    else lower = middle;
  }
  const witness = findArchPath({ ...s, friction: upper }, includePiers);
  if (!witness) throw new Error("The upper friction bound lost its equilibrium witness.");
  const failed = domainAt(lower);
  return {
    kind: "bracket",
    lower,
    upper,
    witness,
    lowerConstraint: failed.minFrom,
    upperConstraint: failed.maxFrom,
  };
}

/** All search inputs, deliberately excluding the chosen path and coefficient. */
export function frictionGeometryKey(s: ArchState): string {
  return [s.rise, s.thickness, s.load, s.loading, s.width, s.mass].join("/");
}

export function frictionThresholdText(result: FrictionThreshold): string {
  if (result.kind === "geometry")
    return "No contact path exists even with sliding excluded. More friction cannot repair this geometry and loading.";
  if (result.kind === "above-range")
    return `No equilibrium path at μ = ${result.maximum}. The search stops there; no threshold is claimed beyond it.`;
  // Binary endpoints terminate exactly in base ten. Preserve every digit so
  // copying the displayed upper coefficient never rounds it below feasibility.
  return `Transition bracket: μ = ${result.lower} fails; μ = ${result.upper} admits a path. Width of bracket below 0.000001. Numerical bounds, not exact values or measured stone friction.`;
}

export function frictionThresholdCsv(s: ArchState): string {
  const rows: (string | number)[][] = [
    [
      "rise_percent_half_span",
      "thickness_percent_half_span",
      "extra_load_percent_W",
      "loading",
      "pier_width_percent_half_span",
      "pier_weight_percent_W",
      "scope",
      "result",
      "mu_failing_lower",
      "mu_feasible_upper",
      "witness_H_W",
      "witness_bearing_percent",
      "conflicting_lower_bound",
      "conflicting_upper_bound",
      "notice",
    ],
  ];
  for (const [label, bases] of [
    ["arch joints", false],
    ["arch joints and pier bases", true],
  ] as const) {
    const r = frictionThreshold(s, bases);
    rows.push([
      s.rise,
      s.thickness,
      s.load,
      s.loading,
      s.width,
      s.mass,
      label,
      r.kind,
      r.kind === "bracket" ? r.lower : "",
      r.kind === "bracket" ? r.upper : "",
      r.kind === "bracket" ? r.witness.thrust : "",
      r.kind === "bracket" ? r.witness.bearing : "",
      r.kind === "bracket" ? r.lowerConstraint : "",
      r.kind === "bracket" ? r.upperConstraint : "",
      "Modern symmetric 13-block model; numerical search over 0 <= mu <= 2; tolerance 0.000001. Code and original diagrams: PolyForm-Noncommercial-1.0.0. Required Notice: Copyright (c) 2026 Anthony Mercer (https://github.com/antonsoo/gonia).",
    ]);
  }
  return rows
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

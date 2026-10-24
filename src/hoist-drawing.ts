import {
  HOIST_BASE,
  HOIST_NAMES,
  HOIST_RADIUS,
  HOIST_TOP,
  type HoistState,
  hoistModel,
  hoistWheels,
  ropePoint,
} from "./core/hoist";
export function hn(v: number, d = 2): string {
  return Number(v.toFixed(d)).toLocaleString("en-US", { maximumFractionDigits: d });
}
export function he(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
export function hoistDrawing(s: HoistState, id = "hoist"): string {
  const m = hoistModel(s),
    k = (hoistWheels(s) - 1) / 2,
    r = HOIST_RADIUS,
    last = (4 * k + 2) * r,
    ox = 330 - last * 130;
  const x = (v: number) => ox + 260 * v,
    y = (v: number) => 50 + 78 * v,
    by = y(HOIST_BASE - m.rise),
    beam = by + 29;
  const rope = m.route
    .map((p, i) =>
      p.kind === "line"
        ? `${i === 0 ? `M ${x(p.x1)} ${y(p.y1)} ` : ""}L ${x(p.x2)} ${y(p.y2)}`
        : `A ${260 * r} ${78 * r} 0 0 ${p.side === "upper" ? 1 : 0} ${x(p.cx + r)} ${y(p.cy)}`,
    )
    .join(" ");
  const supports = m.route.filter((p) => p.kind === "line" && p.support);
  const wheels = m.route
    .filter((p) => p.kind === "arc")
    .map((p) =>
      p.kind === "arc"
        ? `<ellipse cx="${x(p.cx)}" cy="${y(p.cy)}" rx="${260 * r - 5}" ry="${78 * r - 3}" class="hw-wheel ${p.side === "lower" ? "hw-moving" : ""}"/><circle cx="${x(p.cx)}" cy="${y(p.cy)}" r="3" class="hw-axle"/><path d="M ${x(p.cx)} ${y(p.cy)} V ${p.side === "upper" ? 92 : beam}" class="hw-frame ${p.side === "lower" ? "hw-load-frame" : ""}"/>`
        : "",
    )
    .join("");
  const arrows = supports
    .map((p, i) =>
      p.kind === "line"
        ? `<g data-support="${i + 1}"><path d="M ${x(p.x1)} ${by - 32} V ${by - 83}" class="hw-force" marker-end="url(#${id}-up)"/><text x="${x(p.x1) + 8}" y="${by - 60}" class="hw-t-label">T</text></g>`
        : "",
    )
    .join("");
  const knots = Array.from({ length: Math.ceil(m.initialLength / 0.55) }, (_, i) =>
    ropePoint(m.route, 0.27 + i * 0.55),
  )
    .filter((p) => p !== null)
    .map((p) => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="3.3" class="hw-rope-mark"/>`)
    .join("");
  const anchorY = s.anchor === "moving" ? by : y(HOIST_TOP + 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 650" role="img" aria-labelledby="${id}-title ${id}-desc" data-supports="${m.supports}" data-rise="${m.rise}" data-rope="${m.rope}" data-rope-length="${m.length}"><title id="${id}-title">${he(HOIST_NAMES[s.rig])}; ${m.supports} supporting portions</title><desc id="${id}-desc">${s.anchor === "moving" ? "The tied end moves with the load." : "The tied end is fixed to the support, a modern alteration."} Load rises ${hn(m.rise, 4)} metres while ${hn(m.rope, 4)} metres of rope wind onto the drum. Each marked supporting portion supplies ${hn(m.tension, 4)} newtons upward. The wheels are unrolled sideways; this is a schematic.</desc><defs><marker id="${id}-up" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#315f81" stroke-width="1.5"/></marker><marker id="${id}-down" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#635483" stroke-width="1.5"/></marker></defs><text x="30" y="31" class="hw-heading">${m.supports} upward tensions support ${hn(s.weight)} N</text><text x="30" y="59" class="hw-small">${he(HOIST_NAMES[s.rig])}; ${s.anchor === "moving" ? "end tied to moving assembly" : "end tied to fixed support"}</text><path d="M ${x(0) - 32} 92 H ${x(last) + 32}" class="hw-fixed"/><text x="${x(0) - 30}" y="84" class="hw-small">Fixed support</text>${wheels}<path d="M ${x(0) - 12} ${y(HOIST_BASE) + 29} H ${x(last - 2 * r) + 12}" class="hw-baseline"/><text x="620" y="${y(HOIST_BASE) + 35}" text-anchor="end" class="hw-small">Start</text><path d="M ${x(0) - 12} ${beam} H ${x(Math.max(0, last - 2 * r)) + 12}" class="hw-load-frame"/><path d="M ${x(0)} ${anchorY} V ${s.anchor === "moving" ? beam : 92}" class="${s.anchor === "moving" ? "hw-load-frame" : "hw-frame"}"/><path d="${rope}" class="hw-rope" data-route="true"/>${knots}<circle cx="${x(0)}" cy="${anchorY}" r="7" class="hw-knot"/><text x="${x(0) - 12}" y="${anchorY + 8}" text-anchor="end" class="hw-small">Tie</text>${arrows}<path d="M 660 ${y(HOIST_BASE) + 29} V ${beam}" class="hw-rise"/><text x="650" y="${(y(HOIST_BASE) + 29 + beam) / 2 - 8}" text-anchor="end" class="hw-small">${hn(m.rise, 3)} m rise</text><path d="M 649 ${beam} H 670 M 649 ${y(HOIST_BASE) + 29} H 670" class="hw-rise"/><path d="M ${x(last / 2 - r)} ${beam} V ${beam + 18}" class="hw-load-frame"/><rect x="${x(last / 2 - r) - 64}" y="${beam + 18}" width="128" height="49" rx="3" class="hw-load"/><text x="${x(last / 2 - r)}" y="${beam + 49}" text-anchor="middle" class="hw-load-text">${hn(s.weight)} N</text><path d="M ${x(last / 2 - r)} ${beam + 73} v 35" class="hw-weight" marker-end="url(#${id}-down)"/><text x="${x(last / 2 - r) + 13}" y="${beam + 99}" class="hw-small">Weight W</text><circle cx="${x(last)}" cy="${y(5.8) + 9}" r="12" class="hw-drum"/><text x="${x(last) + 22}" y="${y(5.8) + 13}" class="hw-small">To windlass</text><text x="30" y="620" class="hw-small">Blue arrows: each marked rope portion pulls upward with T = ${hn(m.tension)} N.</text><text x="30" y="644" class="hw-small">Schematic: wheels spread sideways. Dots mark positions along the same rope.</text></svg>`;
}
export function hoistWindlass(s: HoistState, id = "windlass"): string {
  const m = hoistModel(s),
    cx = 220,
    cy = 180,
    dr = 38,
    arm = dr * s.arm,
    angle = m.turns * 2 * Math.PI - 0.4;
  const ex = cx + arm * Math.cos(angle),
    ey = cy + arm * Math.sin(angle),
    tx = -Math.sin(angle),
    ty = Math.cos(angle);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 380" role="img" aria-labelledby="${id}-title"><title id="${id}-title">Chosen windlass: ${hn(m.hand)} N at a ${hn(m.armRadius)} metre arm; ${hn(m.handPath)} metres of hand travel</title><circle cx="${cx}" cy="${cy}" r="${arm}" class="hw-orbit"/><circle cx="${cx}" cy="${cy}" r="${dr}" class="hw-drum"/><path d="M ${cx} ${cy} L ${ex} ${ey}" class="hw-handle"/><circle cx="${ex}" cy="${ey}" r="6" class="hw-knot"/><path d="M ${cx + dr} 35 V ${cy}" class="hw-rope"/><path d="M ${ex} ${ey} l ${tx * 37} ${ty * 37}" class="hw-hand-force"/><text x="20" y="27" class="hw-heading">A longer arm trades force for travel</text><text x="20" y="330" class="hw-small">Drum R = 0.15 m; arm L = ${hn(m.armRadius)} m; L/R = ${s.arm}</text><text x="20" y="357" class="hw-small">${hn(m.turns, 3)} turns wind ${hn(m.rope, 3)} m; hand path ${hn(m.handPath, 3)} m</text></svg>`;
}
export function hoistTable(s: HoistState): string {
  const rows = (["single", "three", "five"] as const).flatMap((rig) =>
    (rig === "single" ? (["moving"] as const) : (["moving", "fixed"] as const)).map((anchor) => {
      const row = { ...s, rig, anchor },
        m = hoistModel(row);
      return `<tr${rig === s.rig && anchor === s.anchor ? ' aria-current="true"' : ""}><th scope="row">${he(HOIST_NAMES[rig])}<small>${anchor === "moving" ? (rig === "single" ? "End on load; modern control" : "End on moving block; source route") : "End on fixed support; your alteration"}</small></th><td>${m.supports}</td><td>${hn(m.rise, 4)}</td><td>${hn(m.rope, 4)}</td><td>${hn(m.tension, 4)}</td><td>${hn(m.hand, 4)}</td><td>${hn(m.handPath, 4)}</td><td>${hn(m.work, 4)}</td></tr>`;
    }),
  );
  return `<table><caption>Same ${s.hold === "rise" ? "load rise" : "rope take-up"}: ${hn(s.distance)} m; same weight ${hn(s.weight)} N and arm ratio ${s.arm}. Ideal values.</caption><thead><tr><th scope="col">Arrangement</th><th scope="col">Supports</th><th scope="col">Rise (m)</th><th scope="col">Rope (m)</th><th scope="col">Tension (N)</th><th scope="col">Hand (N)</th><th scope="col">Hand path (m)</th><th scope="col">Work (J)</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

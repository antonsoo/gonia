import mitLicense from "../LICENSE?raw";
import { ae, an } from "./arch-content";
import { type ArchState, archAnalysis, archScope, PIER_HEIGHT, pointAt, STONES } from "./core/arch";

export function archSvg(s: ArchState, highlighted = "", standalone = false): string {
  const m = archAnalysis(s),
    g = m.geometry;
  const X = (x: number) => 500 + x * 240,
    Y = (y: number) => 360 - y * 240;
  const xy = (p: { x: number; y: number }) => `${X(p.x)},${Y(p.y)}`;
  const sector = (left: number, right: number) => {
    const a = pointAt(g.outer, left, g.cy),
      b = pointAt(g.outer, right, g.cy);
    const c = pointAt(g.inner, right, g.cy),
      d = pointAt(g.inner, left, g.cy);
    return `M${xy(a)} A${240 * g.outer},${240 * g.outer} 0 0 1 ${xy(b)} L${xy(c)} A${240 * g.inner},${240 * g.inner} 0 0 0 ${xy(d)} Z`;
  };
  const left = g.joints[0];
  if (!left) throw new Error("Missing spring joint");
  const half = s.width / 200;
  const lp = [
    { x: -1 - half, y: -PIER_HEIGHT },
    { x: -1 - half, y: left.outer.y },
    left.outer,
    left.inner,
    { x: -1 + half, y: left.inner.y },
    { x: -1 + half, y: -PIER_HEIGHT },
  ];
  const pier = (mirror: number) => lp.map((p) => `${X(mirror * p.x)},${Y(p.y)}`).join(" ");
  // This locus joins interface resultants; it is not an internal stress field.
  const points = m.contacts.map((j) => xy(j.point)).join(" ");
  const base = -1 - m.eccentricity;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 670" role="${standalone ? "img" : "group"}" aria-labelledby="ar-svg-title ar-svg-desc">
${standalone ? `<metadata>${ae(mitLicense)}\n${ae(archScope(s))}</metadata>` : ""}
<title id="ar-svg-title">An arch and its supports, with a trial contact path</title><desc id="ar-svg-desc">${ae(archScope(s))} ${m.archFits ? "All fourteen joint contacts fit." : "Some joint contacts miss the stone."} The base resultant is ${m.pierFits ? "inside" : "outside"} its base. ${s.friction === null ? "Sliding is excluded by assumption." : `Friction: ${m.archFrictionFits ? "all joints pass" : "some joints exceed the limit"}; ${m.baseFrictionFits ? "bases pass" : "bases exceed the limit"}.`} H = ${an(s.thrust)} W. Lengths in centreline half-spans.</desc>
<style>text{font-family:Arial,sans-serif;fill:#24304d;font-size:16px}.ar-stone{fill:#dddfe8;stroke:#69738a;stroke-width:1.4}.ar-stone:nth-child(even){fill:#e8eaf0}.ar-pier{fill:#d0d5e1;stroke:#69738a;stroke-width:1.4}.ar-joint{stroke:#69738a;stroke-width:1.2}.ar-missed{stroke:#a72c50;stroke-width:4;stroke-dasharray:5 4}.ar-selected{stroke:#9b6500;stroke-width:6}.ar-contact{fill:#2458bd;stroke:#f8f9fc;stroke-width:1.5}.ar-outside{fill:#a72c50}.ar-path{fill:none;stroke:#2458bd;stroke-width:3.2}.ar-highlight{fill:#e6ce85;stroke:#9b6500;stroke-width:3}.ar-hit{stroke:transparent;stroke-width:24;cursor:pointer}.ar-joint-control:focus .ar-hit{stroke:#9b6500;stroke-opacity:.35}.ar-small{font-size:14px}.ar-force{stroke:#2458bd;stroke-width:2.5}.ar-weight{stroke:#69738a;stroke-width:1.3}</style>
<defs><marker id="ar-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill="#2458bd"/></marker><marker id="ar-grey-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#69738a"/></marker><clipPath id="ar-clip"><rect x="10" y="15" width="980" height="615"/></clipPath></defs>
<g clip-path="url(#ar-clip)"><path d="M30 ${Y(-1)}H970" stroke="#69738a" stroke-width="2"/>
<polygon class="ar-pier ${highlighted === "pier" || highlighted === "base" ? "ar-highlight" : ""}" points="${pier(1)}"/><polygon class="ar-pier ${highlighted === "pier" || highlighted === "base" ? "ar-highlight" : ""}" points="${pier(-1)}"/>
<g>${g.stones.map((b) => `<path class="ar-stone ${highlighted === "stone" && b.index === 7 ? "ar-highlight" : ""}" data-stone="${b.index}" d="${sector(b.left, b.right)}"/>`).join("")}</g>
${highlighted === "centre" ? `<path d="${g.joints.map((j) => `M${X(0)},${Y(g.cy)}L${xy(j.outer)}`).join(" ")}" stroke="#9b6500" stroke-width="1.5" stroke-dasharray="6 5"/><circle cx="${X(0)}" cy="${Y(g.cy)}" r="6" fill="#9b6500"/>` : ""}
<polyline class="ar-path" points="${points}"/>
${g.stones
  .map((b) => {
    const mid = (b.left + b.right) / 2,
      top = pointAt(g.outer, mid, g.cy);
    const extra = b.weight > 1 / STONES + 1e-8;
    const length = extra ? 46 : 19;
    return `<line class="${extra || highlighted === "load" ? "ar-force" : "ar-weight"}" x1="${X(b.centre.x)}" y1="${Y(top.y) - length - 7}" x2="${X(b.centre.x)}" y2="${Y(top.y) - 7}" marker-end="url(#${extra || highlighted === "load" ? "ar-arrow" : "ar-grey-arrow"})"/>${extra ? `<text x="${X(b.centre.x) + 12}" y="${Y(top.y) - 30}" class="ar-small">+${an(b.weight - 1 / STONES, 2)} W</text>` : ""}`;
  })
  .join("")}
${m.contacts
  .map((j) => {
    const label = pointAt(g.outer + 0.12, j.angle, g.cy);
    const control = standalone
      ? ""
      : ` role="button" tabindex="0" data-joint="${j.index}" aria-label="Inspect joint ${j.index}: ${j.fits ? "contact fits" : "contact outside"}${!j.frictionFits ? "; friction limit exceeded" : ""}"`;
    return `<g class="ar-joint-control"${control}><line class="ar-joint ${!j.fits ? "ar-missed" : ""} ${s.joint === j.index || highlighted === "joint" ? "ar-selected" : ""}" x1="${X(j.inner.x)}" y1="${Y(j.inner.y)}" x2="${X(j.outer.x)}" y2="${Y(j.outer.y)}"/><line class="ar-hit" x1="${X(j.inner.x)}" y1="${Y(j.inner.y)}" x2="${X(j.outer.x)}" y2="${Y(j.outer.y)}"/><circle class="ar-contact ${j.fits && j.frictionFits ? "" : "ar-outside"}" cx="${X(j.point.x)}" cy="${Y(j.point.y)}" r="${s.joint === j.index ? 6 : 4}"/><text class="ar-joint-label ar-small" x="${X(label.x)}" y="${Y(label.y) + 5}" text-anchor="middle">${j.index}</text></g>`;
  })
  .join("")}
${m.contacts
  .filter((j) => j.index === 0 || j.index === 13)
  .map((j) => {
    const side = j.index === 0 ? -1 : 1;
    const x = X(j.point.x),
      y = Y(j.point.y);
    const magnitude = Math.hypot(s.thrust, g.vertical),
      dx = (side * s.thrust) / magnitude,
      dy = g.vertical / magnitude;
    return `<line class="ar-force" x1="${x + dx * 10}" y1="${y + dy * 10}" x2="${x + dx * 84}" y2="${y + dy * 84}" marker-end="url(#ar-arrow)"/>`;
  })
  .join("")}
${[-1, 1]
  .map((side) => {
    const x = X(side * -base);
    return `<circle cx="${x}" cy="${Y(-1)}" r="7" fill="${m.pierFits && m.baseFrictionFits ? "#2458bd" : "#a72c50"}"/><path d="M${x},${Y(-1) + 30}v-22" stroke="${m.pierFits && m.baseFrictionFits ? "#2458bd" : "#a72c50"}" stroke-width="3"/>`;
  })
  .join("")}
</g>
<text x="500" y="485" text-anchor="middle">H = ${an(s.thrust)} W, outward at each bearing</text>
<text x="500" y="513" text-anchor="middle" class="ar-small">${m.archFits ? "All joint contacts fit" : `${m.contacts.filter((j) => !j.fits).length} joint contacts outside`} / ${m.pierFits ? "Base resultants inside" : "Base resultants outside"}</text>
<text x="500" y="541" text-anchor="middle" class="ar-small">${s.friction === null ? "No sliding assumed / friction untested" : `μ = ${an(s.friction, 6)} / ${m.archFrictionFits ? "Joint friction fits" : "Joint friction exceeded"} / ${m.baseFrictionFits ? "Base friction fits" : "Base friction exceeded"}`}</text>
<text x="260" y="654" text-anchor="middle" class="ar-small">Left base centre x = -1</text><text x="740" y="654" text-anchor="middle" class="ar-small">Right base centre x = 1</text>
</svg>`;
}

export function contactSvg(s: ArchState): string {
  const m = archAnalysis(s),
    j = m.contacts[s.joint];
  if (!j) throw new Error("Missing selected joint");
  const x = 65 + Math.max(-0.13, Math.min(1.13, j.fraction)) * 290;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 190" role="img" aria-label="Joint ${j.index}, rotated and enlarged. Contact ${an(j.fraction * 100, 2)} percent of the way from its inner to outer edge."><rect x="65" y="64" width="290" height="70" fill="#dddfe8"/><path d="M65 64H355M65 52V144M355 52V144" fill="none" stroke="#69738a" stroke-width="2"/><path d="M${x} 18V64" stroke="${j.fits ? "#2458bd" : "#a72c50"}" stroke-width="3"/><circle cx="${x}" cy="64" r="7" fill="${j.fits ? "#2458bd" : "#a72c50"}"/><text x="65" y="170" text-anchor="middle" font-size="16" fill="#24304d">Inner edge</text><text x="355" y="170" text-anchor="middle" font-size="16" fill="#24304d">Outer edge</text><text x="210" y="108" text-anchor="middle" font-size="18" fill="#24304d">${an(j.fraction * 100, 2)}%${j.fits ? "" : " (beyond the joint)"}</text></svg>`;
}

/** Directions are normalized to equal length; magnitudes stay in the ledger. */
export function frictionSvg(s: ArchState, base = false): string {
  const m = archAnalysis(s),
    j = m.contacts[s.joint];
  if (!j) throw new Error("Missing joint");
  const normal = base ? m.geometry.vertical + s.mass / 100 : j.normal;
  const shear = base ? s.thrust : j.shear;
  const required = Math.abs(shear) / normal;
  const fits = s.friction === null || required <= s.friction + 1e-10;
  const angle = Math.atan2(shear, normal),
    cone = Math.atan(s.friction ?? 0);
  const p = (a: number, r = 130) => `${65 + r * Math.cos(a)},${170 - r * Math.sin(a)}`;
  const label = base ? "Either pier base" : `Joint ${j.index}`;
  const conePath =
    s.friction === null
      ? ""
      : `<path d="M65 170L${p(cone)}A130 130 0 ${2 * cone > Math.PI ? 1 : 0} 1 ${p(-cone)}Z" fill="#e1e8f6"/><path d="M${p(cone)}L65 170L${p(-cone)}" fill="none" stroke="#69738a" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 340" role="img" aria-label="${label}: normal ${an(normal, 6)} W, shear ${an(shear, 6)} W. Required friction ${an(required, 6)}. ${s.friction === null ? "No sliding assumed; no cone checked." : `Chosen μ ${s.friction}; ${fits ? "direction inside or on" : "direction outside"} the friction cone.`}">
<title>${label}: force direction and friction</title><style>text{font-family:Arial,sans-serif;fill:#24304d;font-size:16px}</style>
<text x="22" y="28" font-weight="bold">${label}</text>${conePath}<path d="M35 170H250M65 315V45" fill="none" stroke="#69738a" stroke-width="1" stroke-dasharray="4 4"/><text x="260" y="176">Normal N</text><text x="79" y="58">+ shear T</text>
<path d="M65 170L${p(angle)}" stroke="${fits ? "#2458bd" : "#a72c50"}" stroke-width="4"/><circle cx="${65 + 130 * Math.cos(angle)}" cy="${170 - 130 * Math.sin(angle)}" r="6" fill="${fits ? "#2458bd" : "#a72c50"}"/>
<text x="230" y="215">|T| / N = ${an(required, 6)}</text><text x="230" y="242">${s.friction === null ? "No cone checked" : `μ = ${an(s.friction, 6)}`}</text><text x="22" y="332">Directions only; force sizes in W below.</text></svg>`;
}

export function archVerdict(s: ArchState): string {
  const m = archAnalysis(s);
  if (s.friction !== null) {
    if (m.archFits && m.pierFits && m.archFrictionFits && m.baseFrictionFits)
      return "This path meets the contact and friction checks.";
    if (m.archFits && m.pierFits && (!m.archFrictionFits || !m.baseFrictionFits))
      return "The contacts fit. The friction does not.";
    if (!m.arch.feasible) return "No path meets every joint check at this friction.";
    return "This trial fails a contact or friction check.";
  }
  if (m.archFits && m.pierFits) return "This path fits the arch and the bases.";
  if (m.archFits) return "The arch fits. Its bases need more restraint.";
  if (!m.arch.feasible) return "No path fits all fourteen joints in this model.";
  return "This trial misses a joint. Another path can fit.";
}

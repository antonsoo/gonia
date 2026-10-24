/** The seven fixed pitches, ordered from the centre towards either end in V.5.2. */
export const ECHEA_NOTES = [
  {
    name: "Hypate hypaton",
    greek: "ὑπάτη ὑπάτων",
    ratio: [9, 16],
    gloss: "Lowest note of the lowest tetrachord",
    short: "HH",
  },
  {
    name: "Hypate meson",
    greek: "ὑπάτη μέσων",
    ratio: [3, 4],
    gloss: "Lowest note of the middle tetrachord",
    short: "HM",
  },
  { name: "Mese", greek: "μέση", ratio: [1, 1], gloss: "The middle note", short: "M" },
  {
    name: "Nete synhemmenon",
    greek: "νήτη συνημμένων",
    ratio: [4, 3],
    gloss: "Highest note of the conjunct tetrachord",
    short: "NS",
  },
  { name: "Paramese", greek: "παραμέση", ratio: [9, 8], gloss: "The note beside mese", short: "P" },
  {
    name: "Nete diezeugmenon",
    greek: "νήτη διεζευγμένων",
    ratio: [3, 2],
    gloss: "Highest note of the disjunct tetrachord",
    short: "ND",
  },
  {
    name: "Nete hyperbolaeon",
    greek: "νήτη ὑπερβολαίων",
    ratio: [2, 1],
    gloss: "Highest note of the highest tetrachord",
    short: "NH",
  },
] as const;
export type EcheaOrder = "source" | "ascending";
export interface EcheaState {
  note: number;
  reference: number;
  order: EcheaOrder;
  detune: number;
  q: number;
  reading: number;
}
export const ECHEA_DEFAULT: EcheaState = {
  note: 3,
  reference: 220,
  order: "source",
  detune: 0,
  q: 120,
  reading: 4,
};
export const ECHEA_READINGS = 9;
function number(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}
export function normalizeEchea(value: Partial<EcheaState>): EcheaState {
  return {
    note: number(value.note, ECHEA_DEFAULT.note, 0, 6),
    reference: value.reference === 165 || value.reference === 330 ? value.reference : 220,
    order: value.order === "ascending" ? "ascending" : "source",
    detune: number(value.detune, 0, -200, 200),
    q: value.q === 40 || value.q === 360 ? value.q : 120,
    reading: number(value.reading, ECHEA_DEFAULT.reading, 0, ECHEA_READINGS - 1),
  };
}
export function parseEchea(query: string): { state: EcheaState; adjusted: boolean } {
  const p = new URLSearchParams(query);
  const fields = ["n", "a", "o", "d", "q", "r"];
  const numeric = (key: string, fallback: number) => {
    const raw = p.get(key);
    return raw === null ? fallback : /^-?\d+$/.test(raw) ? Number(raw) : Number.NaN;
  };
  const raw = {
    note: numeric("n", ECHEA_DEFAULT.note),
    reference: numeric("a", 220),
    order: (p.get("o") ?? "source") as EcheaOrder,
    detune: numeric("d", 0),
    q: numeric("q", 120),
    reading: numeric("r", ECHEA_DEFAULT.reading),
  };
  const state = normalizeEchea(raw);
  const adjusted =
    fields.some((key) => p.getAll(key).length > 1) ||
    Object.keys(raw).some((key) => raw[key as keyof EcheaState] !== state[key as keyof EcheaState]);
  // Duplicate settings have no unique interpretation. Do not silently select one.
  return {
    state: fields.some((key) => p.getAll(key).length > 1) ? { ...ECHEA_DEFAULT } : state,
    adjusted,
  };
}
export function echeaQuery(s: EcheaState): string {
  return `?n=${s.note}&a=${s.reference}&o=${s.order}&d=${s.detune}&q=${s.q}&r=${s.reading}`;
}
export function noteFrequency(note: number, reference: number): number {
  const value = ECHEA_NOTES[note];
  if (!value || !Number.isFinite(reference) || reference <= 0) throw new Error("Invalid pitch");
  return (reference * value.ratio[0]) / value.ratio[1];
}
export function echeaRow(order: EcheaOrder): number[] {
  const half = order === "ascending" ? [0, 1, 2, 4, 3, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
  return [...half.slice(1).reverse(), ...half];
}
export function echeaPlaces(note: number, order: EcheaOrder): number[] {
  return echeaRow(order).flatMap((n, index) => (n === note ? [index + 1] : []));
}
export function responseAmplitude(ratio: number, q: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0 || !Number.isFinite(q) || q < 1)
    throw new Error("Invalid resonator parameters");
  return 1 / Math.hypot(q * (1 - ratio * ratio), ratio);
}
export function resonator(s: EcheaState) {
  const natural = noteFrequency(s.note, s.reference),
    ratio = 2 ** (s.detune / 1200);
  return {
    natural,
    drive: natural * ratio,
    ratio,
    amplitude: responseAmplitude(ratio, s.q),
    tau: s.q / (Math.PI * natural),
    damped: natural * Math.sqrt(1 - 1 / (4 * s.q * s.q)),
  };
}
/** Exact response of x'' + w0/Q x' + w0² x = w0²/Q sin(wt), initially at rest.
 * The drive ends at `duration`; position and velocity are continuous there.
 * Displacement is dimensionless, normalized to a steady matched drive's amplitude. */
export function responseAt(
  t: number,
  natural: number,
  drive: number,
  q: number,
  duration = 1.5,
): { x: number; v: number } {
  if (!Number.isFinite(t) || t < 0) throw new Error("Invalid response time");
  return responseFunction(natural, drive, q, duration)(t);
}
function responseFunction(natural: number, drive: number, q: number, duration: number) {
  if (
    ![natural, drive, q, duration].every(Number.isFinite) ||
    natural <= 0 ||
    drive <= 0 ||
    q < 1 ||
    duration <= 0
  )
    throw new Error("Invalid response parameters");
  const w0 = 2 * Math.PI * natural,
    w = 2 * Math.PI * drive;
  const decay = w0 / (2 * q),
    wd = Math.sqrt(w0 * w0 - decay * decay);
  const r = drive / natural,
    amplitude = responseAmplitude(r, q);
  const phase = Math.atan2(r / q, 1 - r * r);
  const a = amplitude * Math.sin(phase);
  const b = (decay * a - amplitude * w * Math.cos(phase)) / wd;
  const driven = (time: number) => {
    const c = Math.cos(wd * time),
      sn = Math.sin(wd * time),
      e = Math.exp(-decay * time);
    return {
      x: amplitude * Math.sin(w * time - phase) + e * (a * c + b * sn),
      v:
        amplitude * w * Math.cos(w * time - phase) +
        e * ((b * wd - decay * a) * c - (a * wd + decay * b) * sn),
    };
  };
  const end = driven(duration);
  const freeB = (end.v + decay * end.x) / wd;
  return (t: number) => {
    if (t <= duration) return driven(t);
    const u = t - duration;
    const c = Math.cos(wd * u),
      sn = Math.sin(wd * u),
      e = Math.exp(-decay * u);
    return {
      x: e * (end.x * c + freeB * sn),
      v: e * ((freeB * wd - decay * end.x) * c - (end.x * wd + decay * freeB) * sn),
    };
  };
}
export const ECHEA_RATE = 24000;
export const ECHEA_DRIVE_SECONDS = 1.5;
export interface EcheaClip {
  samples: Float32Array<ArrayBuffer>;
  rate: number;
  cues: { at: number; duration: number; note: number; label: string }[];
}
export type EcheaSound = "note" | "row" | "response";
export function echeaSound(s: EcheaState, kind: EcheaSound): EcheaClip {
  if (kind === "response") {
    const m = resonator(s),
      length = ECHEA_DRIVE_SECONDS + 5 * m.tau + 0.04;
    const samples = new Float32Array(Math.ceil(length * ECHEA_RATE));
    // Coefficients and the cutoff state are shared by every sample in a burst.
    const response = responseFunction(m.natural, m.drive, s.q, ECHEA_DRIVE_SECONDS);
    for (let i = 0; i < samples.length; i++) {
      const t = i / ECHEA_RATE;
      // One fixed gain across settings. Do not normalize quiet detuned cases.
      const fade = Math.min(1, (samples.length - 1 - i) / (0.025 * ECHEA_RATE));
      samples[i] = 0.32 * response(t).x * fade;
    }
    return {
      samples,
      rate: ECHEA_RATE,
      cues: [
        { at: 0, duration: ECHEA_DRIVE_SECONDS, note: s.note, label: "Drive on" },
        {
          at: ECHEA_DRIVE_SECONDS,
          duration: length - ECHEA_DRIVE_SECONDS,
          note: s.note,
          label: "Drive off · free decay",
        },
      ],
    };
  }
  const notes = kind === "row" ? echeaRow(s.order) : [s.note];
  const period = 0.62,
    duration = 0.48;
  const samples = new Float32Array(Math.ceil(notes.length * period * ECHEA_RATE));
  const cues = notes.map((note, index) => ({
    at: index * period,
    duration,
    note,
    label:
      kind === "row"
        ? `Place ${index + 1} · ${ECHEA_NOTES[note]?.name}`
        : (ECHEA_NOTES[note]?.name ?? ""),
  }));
  for (const cue of cues) {
    const f = noteFrequency(cue.note, s.reference),
      start = Math.round(cue.at * ECHEA_RATE);
    for (let i = 0; i < Math.floor(duration * ECHEA_RATE); i++) {
      const t = i / ECHEA_RATE;
      const envelope = Math.min(1, t / 0.018, (duration - t) / 0.035);
      samples[start + i] = 0.24 * envelope * Math.sin(2 * Math.PI * f * t);
    }
  }
  return { samples, rate: ECHEA_RATE, cues };
}
export function echeaWav(clip: EcheaClip): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(44 + clip.samples.length * 2),
    v = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) v.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  v.setUint32(4, bytes.length - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, clip.rate, true);
  v.setUint32(28, clip.rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, clip.samples.length * 2, true);
  for (let i = 0; i < clip.samples.length; i++)
    v.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, clip.samples[i] ?? 0)) * 32767),
      true,
    );
  return bytes;
}

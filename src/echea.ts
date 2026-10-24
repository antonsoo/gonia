import {
  ECHEA_NOTES,
  type EcheaClip,
  type EcheaSound,
  type EcheaState,
  echeaPlaces,
  echeaQuery,
  echeaSound,
  echeaWav,
  normalizeEchea,
  noteFrequency,
  parseEchea,
  resonator,
} from "./core/echea";
import { ECHEA_LIMITS, ECHEA_SOURCE, echeaPassages, echeaSources } from "./echea-content";
import {
  echeaBurst,
  echeaCurve,
  echeaMounting,
  echeaPlan,
  echeaTrace,
  ecNumber as n,
} from "./echea-drawing";
import { echeaCsv, echeaReading, echeaSvg, echeaTable, saveEchea } from "./echea-files";
import { offlineStatus } from "./offline";

function get<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing ${id}`);
  return el as T;
}
let parsed = parseEchea(location.search),
  state = parsed.state,
  shownSource = -1;
get("app").innerHTML =
  `<a class="skip" href="#ec-workshop">Skip to the sounding vessels</a><header class="masthead"><a class="wordmark" href="./">Gonia <span lang="grc">γωνία</span></a><nav aria-label="Main"><a href="./">Doric corner</a><a href="./spacing.html">Spacing</a><a href="./entasis.html">Entasis</a><a href="./fluting.html">Fluting</a><a href="./transport.html">Transport</a><a href="./colonnade.html">Temple plan</a><a href="./theatre.html">Theatre</a><a href="./echea.html" aria-current="page">Sounding vessels</a></nav></header><main>
<section class="ec-intro"><h1>Thirteen vessels.<br>Seven notes.</h1><div><p>Vitruvius asks for bronze vessels among the theatre seats, each sounding a named musical note.</p><p>Follow their order from the wings to the centre. There is a surprise: the pitch does not keep going down.</p><a href="#ec-workshop">Place the notes and hear the turn</a></div></section>
<section id="ec-workshop" class="ec-section" aria-labelledby="ec-title"><h2 id="ec-title" tabindex="-1">A musical prescription,<br>set into a building.</h2><p id="ec-adjusted" class="ec-notice" role="status" hidden>Some shared settings were invalid and have been adjusted. Repeated settings have no unique meaning, so that link opens the default experiment.</p><div class="ec-workbench"><div class="ec-board"><div class="ec-board-head"><span id="ec-arrangement-label"></span><span>Plan / schematic</span></div><div id="ec-plan"></div><div id="ec-trace"></div><p>Position numbers run left to right in this drawing. The seating, chamber size and bowl profiles are illustrative. Use the pitch buttons to locate a matching pair.</p></div><div class="ec-controls"><fieldset><legend>Select a pitch and locate its vessels</legend><div class="ec-pitches">${[6, 5, 4, 3, 2, 1, 0].map((i) => `<button type="button" data-ec-note="${i}" aria-pressed="false"><span class="ec-place" id="ec-place-${i}"></span><span>${ECHEA_NOTES[i]?.name}<small id="ec-hz-${i}"></small></span></button>`).join("")}</div></fieldset><div class="ec-selected-note"><p id="ec-greek" lang="grc"></p><p id="ec-gloss" class="ec-small"></p><p id="ec-selection" aria-live="polite"></p></div><label for="ec-reference">Choose a listening reference for mese</label><select id="ec-reference"><option value="165">165 Hz</option><option value="220">220 Hz</option><option value="330">330 Hz</option></select><p class="ec-small">This reference is modern. The text gives note names and intervals, not an ancient frequency standard.</p><div class="ec-actions"><button type="button" id="ec-play-note">Hear selected pitch</button><button type="button" id="ec-play-row">Hear the row</button></div><button type="button" id="ec-read-order">Read its placement instruction</button></div></div>
<div class="ec-playback"><p id="ec-play-status" role="status">Sine-tone examples. No recording or reconstruction of a bronze vessel.</p><button type="button" id="ec-stop" disabled>Stop sound</button></div><div class="ec-order"><div><fieldset><legend>Compare the order</legend><div class="ec-order-controls"><button type="button" id="ec-source-order" aria-pressed="true">Follow the printed row</button><button type="button" id="ec-ascending-order" aria-pressed="false">Sort each half by pitch</button></div></fieldset><p class="ec-small">Sorting is your alteration. It swaps two pairs of vessels; the pitches themselves stay the same.</p></div><div><p id="ec-order-finding" class="ec-finding"></p><p>The fourth placement is <i lang="la">quarta</i>. A musical fourth is <i lang="la">diatessaron</i>. At the turn, the text uses the first word and omits the second.</p></div></div><details><summary>Follow the ratios and all thirteen positions</summary><div id="ec-table" class="ec-table-wrap" tabindex="0" role="region" aria-label="Pitch and position table"></div><p>For this listening realization, a fourth is 4:3, an octave 2:1, and the tone from mese to paramese 9:8. The resulting paramese–nete synhemmenon rise is 32:27, or about 294 cents. These exact ratios implement the fixed-note relationships; they are not numbers quoted from V.5.</p><p>Hypate and nete are conventional string names. Here hypate is the low-pitched end of a tetrachord and nete its high-pitched end. The normalized Greek spellings explain Vitruvius’s Latin transliterations.</p></details></section>
<section id="ec-resonance" class="ec-section" aria-labelledby="ec-resonance-title"><div class="ec-resonance"><div><h2 id="ec-resonance-title">A note can match.<br>What does that establish?</h2><p>A resonator responds strongly near one of its natural frequencies. Move a driving tone away from the selected pitch and watch the response shrink.</p><div id="ec-curve" class="ec-chart"></div><div id="ec-burst" class="ec-chart"></div><p class="ec-small">Above: steady relative response. Below: the finite burst and its free decay. Both measure displacement in one modern oscillator, not a theatre’s sound pressure, loudness or clarity.</p></div><div class="ec-lab-controls"><h3 id="ec-mode-title"></h3><label for="ec-detune">Driving tone offset <output id="ec-detune-value" for="ec-detune"></output></label><input type="range" id="ec-detune" min="-200" max="200" step="1" value="0"><div class="ec-actions"><button type="button" id="ec-match">Match the pitch</button><button type="button" id="ec-miss">Move one semitone up</button></div><label for="ec-q">Choose how slowly the free vibration decays</label><select id="ec-q"><option value="40">Q = 40 · shorter decay</option><option value="120">Q = 120 · middle decay</option><option value="360">Q = 360 · longer decay</option></select><p class="ec-small">Illustrative settings. No ancient vessel’s damping is known from this text. Higher Q makes the response narrower and the build-up slower. Each Q is scaled to the same steady matched response.</p><dl class="ec-readout"><div><dt>Driving frequency</dt><dd id="ec-drive-hz"></dd></div><div><dt>Steady relative response</dt><dd id="ec-amplitude"></dd></div><div><dt>Decay to 1/e amplitude</dt><dd id="ec-tau"></dd></div><div><dt>Drive duration</dt><dd>1.5 seconds</dd></div></dl><div class="ec-actions"><button type="button" id="ec-play-response">Hear this response</button><button type="button" id="ec-stop-response" disabled>Stop sound</button></div><p id="ec-response-status" class="ec-status" role="status"></p><p class="ec-small">Only the response is heard, at a fixed level across settings. After the drive stops, it rings at its own damped frequency. A short drive need not reach the steady level shown above.</p></div></div><details><summary>Inspect the modern equation and the historical limit</summary><p>We solve x″ + (ω₀/Q)x′ + ω₀²x = (ω₀²/Q) sin(ωt), starting from rest. Here ω₀ = 2π times the selected frequency, ω is the drive frequency, and x is dimensionless displacement. The drive ends at 1.5 seconds; position and velocity continue into free decay.</p><p>The steady amplitude is 1 / √[Q²(1 − r²)² + r²], where r is the drive/natural frequency ratio. At r = 1 it equals 1. Free amplitude decays by a factor of e in Q/(πf₀) seconds. Audio uses the exact solution, a fixed gain of 0.32, and a final 25 ms fade. <a href="https://www.animations.physics.unsw.edu.au/jw/oscillations.htm#forced">Background: UNSW’s forced oscillations</a>.</p><p>A bronze shell’s vibration and the resonance of air in a cavity are different physical modes. This single-mode equation identifies neither one as the ancient mechanism. The experiment omits the theatre, audience, radiated power and reflected sound.</p></details></section>
<section id="ec-mounting" class="ec-section ec-mount-layout"><div><h2>Turn the vessel over.<br>Leave it room to sound.</h2><p>Vitruvius asks for empty space around and above each vessel. A wedge raises the side facing the stage. The vessel must touch no wall.</p><p>The drawing follows those relationships. Its bowl shape and chamber size are illustrative; the source does not supply them.</p><button type="button" id="ec-read-mount">Read the mounting instruction</button></div><div>${echeaMounting()}</div></section>
<section id="ec-reading" class="ec-section" aria-labelledby="ec-reading-title"><h2 id="ec-reading-title" tabindex="-1">Read what is prescribed.<br>Notice what is claimed.</h2><p>Nine selected passages, new English translations, and the full printed pages from Krohn’s 1912 edition. The apparatus remains visible.</p><div class="ec-reading-layout"><div><label for="ec-passage">Choose a passage</label><select id="ec-passage">${echeaPassages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join("")}</select><article><p id="ec-ref" class="ec-small"></p><h3 id="ec-passage-title"></h3><p id="ec-latin" class="ec-latin" lang="la"></p><p id="ec-english" class="ec-translation"></p><details id="ec-grammar" open><summary><span id="ec-word" lang="la"></span> <span id="ec-word-gloss"></span></summary><p id="ec-grammar-note"></p></details><div class="ec-actions"><button type="button" id="ec-prev">Previous passage</button><button type="button" id="ec-next">Next passage</button><button type="button" id="ec-find-source">Find it on the page</button></div></article><p class="ec-small">These are excerpts, not the complete chapters. Line-end hyphens are joined. Angle brackets mark editorial additions; square brackets mark deletions. The source pages preserve the edition’s spelling and apparatus.</p></div><div><label for="ec-source">Printed evidence</label><select id="ec-source">${echeaSources.map((s, i) => `<option value="${i}">p. ${s.page} · ${s.title}</option>`).join("")}</select><p id="ec-source-note" class="ec-source-note"></p><label for="ec-zoom">Enlarge the source <output id="ec-zoom-value">100%</output></label><input type="range" id="ec-zoom" min="100" max="250" step="25" value="100"><div class="ec-source-pan" id="ec-source-pan" tabindex="0" role="region" aria-label="Printed source page; use arrow keys to pan"><img id="ec-source-image" alt=""><p id="ec-source-error" role="status" hidden>The page is unavailable. Reconnect and reload, or follow the source volume link.</p></div><div class="ec-source-links"><a id="ec-full-source" target="_blank" rel="noreferrer">Open full image</a><a id="ec-original-source" target="_blank" rel="noreferrer">Source volume</a><a href="./sources/echea/manifest.json">Provenance and hashes</a></div></div></div></section>
<section class="ec-section ec-save" aria-labelledby="ec-save-title"><div><h2 id="ec-save-title">Take the experiment<br>and its evidence.</h2><p>The illustrated reading keeps both sounds, the measured diagrams, all nine passages and five complete source pages in a single file. It opens and prints offline.</p></div><div><div class="ec-actions"><button type="button" id="ec-save-reading">Save illustrated reading</button><button type="button" id="ec-save-svg">Save plan (SVG)</button><button type="button" id="ec-save-csv">Save measurements (CSV)</button></div><div class="ec-actions"><button type="button" id="ec-save-row">Save row sound (WAV)</button><button type="button" id="ec-save-response">Save response (WAV)</button><button type="button" id="ec-share">Share this experiment</button></div><p id="ec-save-status" class="ec-status" role="status"></p><label id="ec-share-label" for="ec-share-url" hidden>Link to these settings<input type="url" id="ec-share-url" readonly></label></div></section>
<section class="ec-section ec-boundaries"><h2>A prescription<br>is not a recording.</h2><div><p>${ECHEA_LIMITS}</p><p>Vitruvius expects greater clarity, reports vessels elsewhere, and says he cannot point to an example at Rome. Those are different kinds of evidence. His cheaper earthenware alternative raises further questions about how the vessels sounded.</p><details><summary>Two modern acoustic investigations</summary><p><a href="https://www.eaa-saat.eu/SAAT2011/atti/AA2011-9_Rindel.pdf">Jens Holger Rindel (2011)</a> considers absorption as a possible response to focused echoes. <a href="https://www.eaa-saat.eu/SAAT2011/atti/AA2011-39_Polychronopoulos-et-al.pdf">Polychronopoulos and colleagues (2011)</a> compare theatre models with and without resonators and report limited effects on overall acoustic indices. They investigate hypotheses; neither supplies a recording of Vitruvius’s vessels.</p></details><p><a href="./theatre.html">Construct the Greek and Roman theatre plans</a> · <a href="https://antonsoo.github.io/pyknon/">Hear the moving notes of a Greek tetrachord in Pyknon</a></p></div></section></main><footer><span>Gonia · measured ancient architecture</span><span id="ec-offline" role="status">Checking offline edition…</span><a href="https://github.com/antonsoo/gonia">Source &amp; MIT license</a></footer>`;
let audioContext: AudioContext | undefined, audioNode: AudioBufferSourceNode | undefined;
let playId = 0,
  frame = 0,
  playing = false;
function stopSound(message = "Sound stopped.") {
  playId++;
  cancelAnimationFrame(frame);
  if (audioNode) {
    audioNode.onended = null;
    audioNode.stop();
    audioNode.disconnect();
    audioNode = undefined;
  }
  document.querySelector("[data-ec-time-cursor]")?.setAttribute("hidden", "");
  const wasPlaying = playing;
  playing = false;
  get<HTMLButtonElement>("ec-stop").disabled = true;
  get<HTMLButtonElement>("ec-stop-response").disabled = true;
  document.querySelectorAll(".ec-playing").forEach((el) => {
    el.classList.remove("ec-playing");
  });
  if (wasPlaying) {
    get("ec-play-status").textContent = message;
    get("ec-response-status").textContent = message;
  }
}
async function play(kind: EcheaSound) {
  stopSound();
  const id = ++playId,
    snapshot = { ...state };
  playing = true;
  get<HTMLButtonElement>("ec-stop").disabled = false;
  get<HTMLButtonElement>("ec-stop-response").disabled = false;
  try {
    audioContext ??= new AudioContext();
    await audioContext.resume();
    if (id !== playId) return;
    if (audioContext.state !== "running")
      throw new Error("Audio did not start. Try the play button again.");
    const clip: EcheaClip = echeaSound(snapshot, kind),
      buffer = audioContext.createBuffer(1, clip.samples.length, clip.rate);
    buffer.copyToChannel(clip.samples, 0);
    audioNode = audioContext.createBufferSource();
    audioNode.buffer = buffer;
    audioNode.connect(audioContext.destination);
    const starts = audioContext.currentTime + 0.035;
    audioNode.onended = () => {
      if (id === playId) stopSound("Sound finished.");
    };
    audioNode.start(starts);
    let last = -1;
    const tick = () => {
      if (id !== playId || !audioContext) return;
      const time = audioContext.currentTime - starts;
      const current = clip.cues.findIndex((cue) => time >= cue.at && time < cue.at + cue.duration);
      if (current !== last) {
        last = current;
        const cue = clip.cues[current];
        document.querySelectorAll(".ec-playing").forEach((el) => {
          el.classList.remove("ec-playing");
        });
        if (cue) {
          const text =
            kind === "response"
              ? `${cue.label}. ${n(resonator(snapshot).drive)} Hz drive; Q = ${snapshot.q}.`
              : cue.label;
          get("ec-play-status").textContent = text;
          if (kind === "response") get("ec-response-status").textContent = text;
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const selector =
              kind === "row" ? `[data-ec-place="${current + 1}"]` : `[data-note="${cue.note}"]`;
            document.querySelectorAll(selector).forEach((el) => {
              el.classList.add("ec-playing");
            });
          }
        }
      }
      const cursor = document.querySelector<SVGPathElement>("[data-ec-time-cursor]");
      if (
        kind === "response" &&
        cursor &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        cursor.removeAttribute("hidden");
        const duration = Number(cursor.dataset.ecTimeCursor),
          x = 65 + (580 * Math.max(0, Math.min(duration, time))) / duration;
        cursor.setAttribute("d", `M${x} 60V175`);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
  } catch (error) {
    if (id === playId) {
      stopSound();
      get("ec-play-status").textContent =
        error instanceof Error
          ? error.message
          : "Sound is unavailable. The WAV download still works.";
      get("ec-response-status").textContent = get("ec-play-status").textContent;
    }
  }
}
function showSource(index: number) {
  const source = echeaSources[index];
  if (!source) return;
  get<HTMLSelectElement>("ec-source").value = String(index);
  if (shownSource === index) return;
  shownSource = index;
  const image = get<HTMLImageElement>("ec-source-image");
  image.alt = `Krohn (1912), complete printed page ${source.page}, including the critical apparatus`;
  image.src = `${import.meta.env.BASE_URL}${source.path}`;
  image.style.width = "100%";
  get<HTMLInputElement>("ec-zoom").value = "100";
  get("ec-zoom-value").textContent = "100%";
  get("ec-source-note").textContent = source.note;
  get<HTMLAnchorElement>("ec-full-source").href = image.src;
  get<HTMLAnchorElement>("ec-original-source").href =
    `${ECHEA_SOURCE}/page/n${source.page + 17}/mode/1up`;
  get("ec-source-error").hidden = true;
  get("ec-source-pan").scrollTo(0, 0);
}
function render() {
  const note = ECHEA_NOTES[state.note],
    m = resonator(state),
    passage = echeaPassages[state.reading];
  if (!note || !passage) throw new Error("Invalid selection");
  get("ec-adjusted").hidden = !parsed.adjusted;
  get("ec-plan").innerHTML = echeaPlan(state);
  get("ec-trace").innerHTML = echeaTrace(state);
  get("ec-curve").innerHTML = echeaCurve(state);
  get("ec-burst").innerHTML = echeaBurst(state);
  get("ec-arrangement-label").textContent =
    state.order === "source" ? "Vitruvius’s one-row prescription" : "Ascending alteration";
  for (let i = 0; i < 7; i++) {
    document
      .querySelector(`[data-ec-note="${i}"]`)
      ?.setAttribute("aria-pressed", String(i === state.note));
    get(`ec-place-${i}`).textContent = echeaPlaces(i, state.order).join(" & ");
    get(`ec-hz-${i}`).textContent = `${n(noteFrequency(i, state.reference))} Hz`;
  }
  get("ec-greek").textContent = note.greek;
  get("ec-gloss").textContent = note.gloss;
  get("ec-selection").textContent =
    `${note.name}: ${n(m.natural)} Hz. ${state.note === 0 ? "One vessel, at place 7." : `Matching vessels at places ${echeaPlaces(state.note, state.order).join(" and ")}.`}`;
  get<HTMLSelectElement>("ec-reference").value = String(state.reference);
  get("ec-source-order").setAttribute("aria-pressed", String(state.order === "source"));
  get("ec-ascending-order").setAttribute("aria-pressed", String(state.order === "ascending"));
  get("ec-order-finding").textContent =
    state.order === "source"
      ? "From either end: down, down, then up. Paramese gives way to the higher nete synhemmenon."
      : "Your alteration removes the turn. Paramese and nete synhemmenon have exchanged places on both sides.";
  get("ec-table").innerHTML = echeaTable(state);
  get("ec-mode-title").textContent = `Selected mode: ${note.name}`;
  get<HTMLInputElement>("ec-detune").value = String(state.detune);
  get("ec-detune-value").textContent = `${state.detune > 0 ? "+" : ""}${state.detune} cents`;
  get<HTMLSelectElement>("ec-q").value = String(state.q);
  get("ec-drive-hz").textContent = `${n(m.drive)} Hz`;
  get("ec-amplitude").textContent = `${n(m.amplitude * 100, 1)}%`;
  get("ec-tau").textContent = `${n(m.tau, 3)} s`;
  get<HTMLSelectElement>("ec-passage").value = String(state.reading);
  get("ec-ref").textContent = passage.ref;
  get("ec-passage-title").textContent = passage.title;
  get("ec-latin").textContent = passage.latin;
  get("ec-english").textContent = passage.english;
  get("ec-word").textContent = passage.word;
  get("ec-word-gloss").textContent = ` · ${passage.gloss}`;
  get("ec-grammar-note").textContent = passage.note;
  get<HTMLButtonElement>("ec-prev").disabled = state.reading === 0;
  get<HTMLButtonElement>("ec-next").disabled = state.reading === echeaPassages.length - 1;
  showSource(passage.source);
  get("ec-share-label").hidden = true;
}
function update(patch: Partial<EcheaState>, mode: "push" | "replace" = "push") {
  stopSound();
  state = normalizeEchea({ ...state, ...patch });
  parsed.adjusted = false;
  history[mode === "push" ? "pushState" : "replaceState"](
    null,
    "",
    `${location.pathname}${echeaQuery(state)}${location.hash}`,
  );
  render();
}
function read(index: number) {
  update({ reading: index });
  get("ec-reading-title").focus();
  get("ec-reading").scrollIntoView();
}
for (const el of document.querySelectorAll<HTMLButtonElement>("[data-ec-note]"))
  el.addEventListener("click", () => update({ note: Number(el.dataset.ecNote) }));
get("ec-reference").addEventListener("change", () =>
  update({ reference: Number(get<HTMLSelectElement>("ec-reference").value) }),
);
get("ec-source-order").addEventListener("click", () => update({ order: "source" }));
get("ec-ascending-order").addEventListener("click", () => update({ order: "ascending" }));
get("ec-detune").addEventListener("input", () =>
  update({ detune: Number(get<HTMLInputElement>("ec-detune").value) }, "replace"),
);
get("ec-q").addEventListener("change", () =>
  update({ q: Number(get<HTMLSelectElement>("ec-q").value) }),
);
get("ec-match").addEventListener("click", () => update({ detune: 0 }));
get("ec-miss").addEventListener("click", () => update({ detune: 100 }));
get("ec-read-order").addEventListener("click", () => read(state.note >= 4 ? 4 : 5));
get("ec-read-mount").addEventListener("click", () => read(2));
get("ec-passage").addEventListener("change", () =>
  update({ reading: Number(get<HTMLSelectElement>("ec-passage").value) }),
);
get("ec-prev").addEventListener("click", () => update({ reading: state.reading - 1 }));
get("ec-next").addEventListener("click", () => update({ reading: state.reading + 1 }));
get("ec-source").addEventListener("change", () =>
  showSource(Number(get<HTMLSelectElement>("ec-source").value)),
);
get("ec-zoom").addEventListener("input", () => {
  const zoom = get<HTMLInputElement>("ec-zoom").value;
  get<HTMLImageElement>("ec-source-image").style.width = `${zoom}%`;
  get("ec-zoom-value").textContent = `${zoom}%`;
});
get("ec-find-source").addEventListener("click", () => {
  const index = echeaPassages[state.reading]?.source ?? 2;
  showSource(index);
  const pan = get("ec-source-pan");
  pan.focus();
  pan.scrollIntoView({ block: "center" });
  const image = get<HTMLImageElement>("ec-source-image");
  const position = () => pan.scrollTo(0, image.clientHeight * (echeaSources[index]?.focus ?? 0));
  if (image.complete) position();
  else image.addEventListener("load", position, { once: true });
});
get("ec-source-image").addEventListener("error", () => {
  get("ec-source-error").hidden = false;
});
for (const kind of ["note", "row", "response"] as const)
  get(`ec-play-${kind}`).addEventListener("click", () => void play(kind));
get("ec-stop").addEventListener("click", () => stopSound());
get("ec-stop-response").addEventListener("click", () => stopSound());
get("ec-save-svg").addEventListener("click", () =>
  saveEchea(echeaSvg(state), "gonia-echea.svg", "image/svg+xml"),
);
get("ec-save-csv").addEventListener("click", () =>
  saveEchea(echeaCsv(state), "gonia-echea.csv", "text/csv;charset=utf-8"),
);
for (const kind of ["row", "response"] as const)
  get(`ec-save-${kind}`).addEventListener("click", () => {
    saveEchea(echeaWav(echeaSound(state, kind)), `gonia-echea-${kind}.wav`, "audio/wav");
    get("ec-save-status").textContent =
      `${kind === "row" ? "Row" : "Response"} sound saved for the current settings.`;
  });
get("ec-save-reading").addEventListener("click", async () => {
  const button = get<HTMLButtonElement>("ec-save-reading"),
    snapshot = { ...state };
  button.disabled = true;
  get("ec-save-status").textContent = "Preparing the reading and checking its source pages…";
  try {
    saveEchea(await echeaReading(snapshot), "gonia-echea-reading.html", "text/html;charset=utf-8");
    get("ec-save-status").textContent =
      "Illustrated reading saved, with the settings selected when you pressed Save.";
  } catch (error) {
    get("ec-save-status").textContent =
      error instanceof Error
        ? error.message
        : "Could not save the reading. Reconnect and try again.";
  } finally {
    button.disabled = false;
  }
});
get("ec-share").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}${echeaQuery(state)}#ec-workshop`;
  get<HTMLInputElement>("ec-share-url").value = url;
  get("ec-share-label").hidden = false;
  try {
    await navigator.clipboard.writeText(url);
    get("ec-save-status").textContent = "Link copied.";
  } catch {
    get("ec-save-status").textContent = "Select and copy the link below.";
    get<HTMLInputElement>("ec-share-url").select();
  }
});
window.addEventListener("popstate", () => {
  stopSound();
  parsed = parseEchea(location.search);
  state = parsed.state;
  render();
});
window.addEventListener("pagehide", () => stopSound());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSound("Sound stopped while the page was hidden.");
});
render();
void offlineStatus(get("ec-offline"));

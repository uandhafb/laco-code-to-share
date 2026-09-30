// Strudel wrapper. @strudel/web is loaded as a classic script and exposes `strudel` + `initStrudel`.
window.Sound = (() => {
  const state = {
    // Each layer can be switched off and given its own effects (functions pattern → pattern).
    layers: {
      drums: { on: true, mods: [] },
      melody: { on: true, mods: [] },
    },
    mods: [],        // effects applied to every layer
    cps: 0.5,
    playing: false,
    code: "",
  };
  const listeners = { change: [], error: [], hit: [] };
  const emit = (type, payload) => listeners[type].forEach((fn) => fn(payload));

  // Drum hits pulse the visuals (and the controls) at the moment they are heard, not when scheduled.
  const firePulse = (hap, now, cps, target) => {
    const delay = Math.max(0, (target - now) * 1000);
    const gain = typeof hap.value?.gain === "number" ? hap.value.gain : 1;
    setTimeout(() => {
      Visuals.pulse(Math.min(1, gain));
      emit("hit", gain);
    }, delay);
  };

  const applyMods = (pat, list) => list.reduce((p, fn) => fn(p), pat);

  // Helpers used inside scene code: drums(...) and melody(...).
  const layerHelper = (name) => (pat) => {
    const layer = state.layers[name];
    if (!layer.on) return strudel.silence;
    const p = applyMods(applyMods(strudel.reify(pat), layer.mods), state.mods);
    return name === "drums" ? p.onTrigger(firePulse, false) : p;
  };
  window.drums = layerHelper("drums");
  window.melody = layerHelper("melody");

  let repl = null;
  const ready = initStrudel({
    // The basic Tidal sample pack, classic drum machines (e.g. "bossdr220_ht"), a piano and rim shots.
    // Only the lists load here; each sound is downloaded the first time it plays.
    prebake: () => Promise.all([
      strudel.samples("github:tidalcycles/dirt-samples"),
      strudel.samples("https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json"),
      strudel.samples("https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json"),
      // Only the rim shots from the uzu drum kit, so the other scenes' bd/sd/hh don't change.
      fetch("https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main/strudel.json")
        .then((r) => r.json())
        .then((kit) => strudel.samples({ _base: kit._base, rim: kit.rim })),
    ]),
    onToggle: (started) => {
      state.playing = started;
      emit("change", state);
    },
  }).then((r) => (repl = r));

  // Strudel reports eval and scheduler errors through its logger.
  document.addEventListener("strudel.log", (e) => {
    if (e.detail?.type === "error") emit("error", e.detail.message.replace(/^\[\w+\] error: /, ""));
  });

  // Browsers only allow audio after a user gesture, so call this from a click
  // before anything awaits.
  // iPhones and iPads need a bit more: they mute this kind of sound when the device is on
  // silent, and sometimes stay locked after the first tap. So on the first tap we tell iOS
  // this page plays media, play a silent buffer, and loop a silent audio file.
  const SILENT = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
  let unlocked = false;
  function unlock() {
    const ctx = strudel.getAudioContext();
    ctx.resume();
    if (unlocked) return;
    unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    } catch {}
    try {
      const silent = new Audio(SILENT);
      silent.loop = true;
      silent.setAttribute("playsinline", "");
      silent.play().catch(() => {});
    } catch {}
  }

  async function run(code) {
    unlock();
    state.code = code;
    const r = await ready;
    r.setCps(state.cps);
    const pattern = await r.evaluate(code);
    // The code may have called setcps() itself; keep our tempo in sync.
    if (typeof r.scheduler?.cps === "number") state.cps = r.scheduler.cps;
    emit("change", state);
    return !!pattern;
  }

  async function stop() {
    (await ready).stop();
  }

  async function setTempo(cps) {
    state.cps = cps;
    (await ready).setCps(cps);
    emit("change", state);
  }

  // Layer and effect changes re-run the current code so drums()/melody() are re-read.
  // Debounced, because dragging a control can fire many changes in a row.
  let rerunTimer = 0;
  function rerun() {
    emit("change", state);
    if (!state.playing || !state.code) return;
    clearTimeout(rerunTimer);
    rerunTimer = setTimeout(() => run(state.code), 150);
  }

  function set(name, on) {
    if (state.layers[name].on === on) return;
    state.layers[name].on = on;
    rerun();
  }

  // target: "drums", "melody", or "all"
  function setMods(target, list) {
    if (target === "all") state.mods = list;
    else state.layers[target].mods = list;
    rerun();
  }

  function toggle(name) {
    set(name, !state.layers[name].on);
    return state.layers[name].on;
  }

  function reset() {
    Object.values(state.layers).forEach((l) => {
      l.on = true;
      l.mods = [];
    });
    state.mods = [];
    rerun();
  }

  // Current position in cycles (1 cycle = 1 bar), or null when nothing is playing.
  const cycle = () => (repl && state.playing ? repl.scheduler.now() : null);

  return {
    state,
    run,
    stop,
    setTempo,
    set,
    setMods,
    toggle,
    reset,
    cycle,
    unlock,
    on: (type, fn) => {
      listeners[type].push(fn);
      return () => listeners[type].splice(listeners[type].indexOf(fn), 1);
    },
  };
})();

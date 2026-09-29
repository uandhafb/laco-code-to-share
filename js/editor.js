// Live-code panel: two textareas (strudel / hydra), run with Ctrl/⌘+Enter, stop with Ctrl+.
window.Editor = (() => {
  const panel = document.getElementById("code-panel");
  const toggleBtn = document.getElementById("code-toggle");
  const body = document.getElementById("code-body");
  const sceneLabel = document.getElementById("code-scene");
  const status = document.getElementById("code-status");
  const areas = {
    strudel: document.getElementById("code-strudel"),
    hydra: document.getElementById("code-hydra"),
  };
  const tabs = [...panel.querySelectorAll("[role=tab]")];
  let original = { strudel: "", hydra: "" };
  let active = "strudel";

  const setStatus = (text, kind = "info") => {
    status.textContent = text;
    status.dataset.kind = kind;
  };

  const setOpen = (open) => {
    panel.dataset.open = open;
    toggleBtn.setAttribute("aria-expanded", open);
    body.hidden = !open;
    try { localStorage.setItem("code-open", open ? "1" : "0"); } catch {}
  };

  const select = (lang) => {
    active = lang;
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.lang === lang));
    Object.entries(areas).forEach(([k, el]) => (el.hidden = k !== lang));
  };

  async function run(lang = active) {
    const code = areas[lang].value;
    if (lang === "hydra") {
      Visuals.run(code);
      return;
    }
    setStatus("running…");
    const ok = await Sound.run(code);
    if (ok) setStatus("▸ playing", "ok");
  }

  function load(scene, name) {
    original = { ...scene };
    areas.strudel.value = scene.strudel;
    areas.hydra.value = scene.hydra;
    sceneLabel.textContent = name;
  }

  toggleBtn.addEventListener("click", () => setOpen(panel.dataset.open !== "true"));
  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.lang)));
  panel.querySelector("[data-action=run]").addEventListener("click", () => {
    run("strudel");
    run("hydra");
  });
  panel.querySelector("[data-action=stop]").addEventListener("click", () => Sound.stop());
  panel.querySelector("[data-action=reset]").addEventListener("click", () => {
    areas.strudel.value = original.strudel;
    areas.hydra.value = original.hydra;
    setStatus("reset to the original scene — press run to hear it");
  });

  Object.entries(areas).forEach(([lang, el]) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        run(lang);
      }
    });
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "." && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      Sound.stop();
    }
  });

  Sound.on("error", (msg) => setStatus("strudel: " + msg, "error"));
  Sound.on("change", (s) => {
    if (!s.playing && status.dataset.kind === "ok") setStatus("■ stopped");
  });
  Visuals.on("error", (msg) => setStatus("hydra: " + msg, "error"));
  Visuals.on("ok", () => {
    if (status.dataset.kind === "error" && status.textContent.startsWith("hydra")) setStatus("hydra ok", "ok");
  });

  let stored = null;
  try { stored = localStorage.getItem("code-open"); } catch {}
  setOpen(stored === "1");
  select("strudel");

  return { load, run, open: () => setOpen(true), setStatus };
})();

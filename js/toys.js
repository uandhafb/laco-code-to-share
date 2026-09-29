// Floating controls. There are three versions to compare — knots, code, orbits —
// each in js/toys/. Pick one with ?toys=knots|code|orbits or the switcher (top right).

// Small helpers shared by the versions.
window.ToyKit = {
  el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    node.append(...children);
    return node;
  },

  svg(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  },

  // Pointer dragging that tells a drag from a click. Enter/Space count as a click,
  // so every control also works from the keyboard.
  drag(el, { start, move, end, click }, signal) {
    let s = null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      s = { x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
      start?.(e);
      e.preventDefault();
    }, { signal });
    el.addEventListener("pointermove", (e) => {
      if (!s) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 5) s.moved = true;
      if (s.moved) move?.(e);
    }, { signal });
    const up = (e) => {
      if (!s) return;
      const moved = s.moved;
      s = null;
      if (moved) end?.(e);
      else click?.(e);
    };
    el.addEventListener("pointerup", up, { signal });
    el.addEventListener("pointercancel", (e) => {
      if (s) end?.(e);
      s = null;
    }, { signal });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        click?.(e);
      }
    }, { signal });
  },

  small: () => innerWidth < 700,
};

window.ToyModes = {};

window.Toys = (() => {
  const root = document.getElementById("toys");
  const MODES = ["knots", "code", "orbits"];
  let current = null;
  let reduced = false;

  const switcher = ToyKit.el("div", { className: "compare" });
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Compare button versions");
  switcher.append(ToyKit.el("span", { className: "compare__label", textContent: "compare buttons:" }));
  const buttons = MODES.map((name) => {
    const b = ToyKit.el("button", { type: "button", textContent: name });
    b.addEventListener("click", () => use(name));
    switcher.append(b);
    return b;
  });
  document.body.append(switcher);

  function pick() {
    const fromUrl = new URLSearchParams(location.search).get("toys");
    if (MODES.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem("toys");
      if (MODES.includes(saved)) return saved;
    } catch {}
    return MODES[0];
  }

  function use(name) {
    if (current) current.unmount();
    root.replaceChildren();
    Sound.reset();
    Visuals.post("");
    current = ToyModes[name];
    current.mount(root, { reduced });
    root.dataset.mode = name;
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", MODES[i] === name));
    try { localStorage.setItem("toys", name); } catch {}
    const url = new URL(location.href);
    url.searchParams.set("toys", name);
    history.replaceState(null, "", url);
  }

  return {
    start(opts = {}) {
      reduced = !!opts.reduced;
      use(pick());
    },
  };
})();

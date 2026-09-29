// Floating controls: the hanging knot tags (js/toys/knots.js).

// Small helpers used by the knots.
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

window.Toys = {
  start(opts = {}) {
    const root = document.getElementById("toys");
    root.dataset.mode = "knots";
    ToyModes.knots.mount(root, { reduced: !!opts.reduced });
  },
};

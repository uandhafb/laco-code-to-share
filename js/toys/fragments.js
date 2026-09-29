// Version 2: code fragments. Real bits of Strudel and Hydra code float around.
// Drag one into "the loop" to add it to what's playing; click it there to take it out.
ToyModes.code = (() => {
  const { el, drag, small } = ToyKit;

  const TOKENS = [
    { code: ".fast(2)", kind: "sound", fn: (p) => p.fast(2) },
    { code: ".rev()", kind: "sound", fn: (p) => p.rev() },
    { code: ".room(.8)", kind: "sound", fn: (p) => p.room(0.8) },
    { code: ".slow(2)", kind: "sound", fn: (p) => p.slow(2) },
    { code: ".jux(rev)", kind: "sound", fn: (p) => p.jux(strudel.rev) },
    { code: ".degradeBy(.5)", kind: "sound", fn: (p) => p.degradeBy(0.5) },
    { code: ".kaleid(5)", kind: "visual" },
    { code: ".pixelate(40, 40)", kind: "visual" },
    { code: ".colorama(.3)", kind: "visual" },
    { code: ".modulate(noise(3), .1)", kind: "visual" },
    { code: ".invert()", kind: "visual" },
  ];

  let ac, raf, offHit, tokens, reduced, loop, slots;

  function spread() {
    const W = innerWidth, H = innerHeight, sm = small();
    const x0 = sm ? 0.04 : 0.5, x1 = sm ? 0.7 : 0.82;
    const y0 = sm ? 0.42 : 0.14, y1 = sm ? 0.66 : 0.58;
    const cols = sm ? 2 : 3;
    const floating = tokens.filter((t) => !t.attached);
    const rows = Math.ceil(floating.length / cols);
    floating.forEach((t, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      t.bx = W * (x0 + (x1 - x0) * (cols > 1 ? c / (cols - 1) : 0)) + (r % 2) * 30;
      t.by = H * (y0 + (y1 - y0) * (rows > 1 ? r / (rows - 1) : 0));
      // Keep the whole piece on screen, allowing for its drift.
      t.bx = Math.max(8, Math.min(W - t.el.offsetWidth - 24, t.bx));
    });
  }

  function update() {
    const on = tokens.filter((t) => t.attached).sort((a, b) => a.order - b.order);
    Sound.setMods("all", on.filter((t) => t.kind === "sound").map((t) => t.fn));
    Visuals.post(on.filter((t) => t.kind === "visual").map((t) => t.code).join(""));

    // Show the attached pieces inside the loop's code lines; click one to remove it.
    Object.entries(slots).forEach(([kind, slot]) => {
      slot.replaceChildren(...on.filter((t) => t.kind === kind).map((t) => {
        const b = el("button", {
          type: "button",
          className: `token token--${kind} token--in`,
          textContent: t.code,
          title: "click to take it out",
        });
        b.setAttribute("aria-label", `remove ${t.code}`);
        b.addEventListener("click", () => detach(t), { signal: ac.signal });
        return b;
      }));
    });
    tokens.forEach((t) => (t.el.hidden = t.attached));
  }

  let counter = 0;
  function attach(t) {
    t.attached = true;
    t.order = counter++;
    update();
  }
  function detach(t) {
    t.attached = false;
    update();
    t.el.focus?.();
  }

  const overLoop = (e) => {
    const r = loop.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };

  function step(ts) {
    const t = ts / 1000;
    tokens.forEach((k) => {
      if (k.attached) return;
      const dx = k.dragging || reduced ? 0 : Math.sin(t * 0.4 + k.phase) * 16;
      const dy = k.dragging || reduced ? 0 : Math.cos(t * 0.33 + k.phase) * 10;
      k.el.style.transform = `translate(${k.bx + dx}px, ${k.by + dy}px)`;
    });
    raf = requestAnimationFrame(step);
  }

  return {
    mount(root, opts) {
      reduced = opts.reduced;
      ac = new AbortController();

      slots = { sound: el("span", { className: "loop__slot" }), visual: el("span", { className: "loop__slot" }) };
      loop = el("div", { className: "loop" },
        el("p", { className: "loop__title", textContent: "⟳ the loop" }),
        el("p", { className: "loop__line" },
          el("span", { className: "loop__kind", textContent: "♪" }),
          el("span", { textContent: "stack(drums, melody)" }), slots.sound),
        el("p", { className: "loop__line" },
          el("span", { className: "loop__kind", textContent: "◐" }),
          el("span", { textContent: "src(o0)" }), slots.visual, el("span", { textContent: ".out()" })));
      loop.setAttribute("role", "group");
      loop.setAttribute("aria-label", "The loop: code added to what is playing");
      root.append(loop);

      const list = small()
        ? TOKENS.filter((t, i) => (t.kind === "sound" ? i < 3 : i < 9))
        : TOKENS;
      tokens = list.map((def) => ({ ...def, attached: false, dragging: false, phase: Math.random() * 6, bx: 0, by: 0 }));
      tokens.forEach((t) => {
        t.el = el("button", { type: "button", className: `token token--${t.kind}`, textContent: t.code });
        t.el.setAttribute("aria-label", `add ${t.code} to the loop`);
        root.append(t.el);
        let off = null;
        drag(t.el, {
          start: (e) => {
            t.dragging = true;
            off = { x: e.clientX - t.bx, y: e.clientY - t.by };
          },
          move: (e) => {
            t.bx = e.clientX - off.x;
            t.by = e.clientY - off.y;
            loop.classList.toggle("is-over", overLoop(e));
          },
          end: (e) => {
            t.dragging = false;
            loop.classList.remove("is-over");
            if (overLoop(e)) attach(t);
          },
          click: () => attach(t),
        }, ac.signal);
      });

      root.append(el("p", { className: "toy-hint", textContent: "drag code into the loop · click it there to take it out" }));

      spread();
      update();
      offHit = Sound.on("hit", () => {
        loop.classList.add("is-hit");
        setTimeout(() => loop.classList.remove("is-hit"), 110);
      });
      addEventListener("resize", spread, { signal: ac.signal });
      raf = requestAnimationFrame(step);
    },

    unmount() {
      cancelAnimationFrame(raf);
      ac.abort();
      offHit();
    },
  };
})();

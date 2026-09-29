// Version 3: orbits. Each sound layer is a dot going round its own loop, one lap every 4 bars.
// Drag a dot to the inner ring (faster), middle (normal) or outer ring (slower);
// drag it off the rings to mute it. When the dots meet where the loops cross, the visuals flash.
ToyModes.orbits = (() => {
  const { el, svg, drag, small } = ToyKit;

  const RINGS = [
    { scale: 0.6, label: "×2", mod: (p) => p.fast(2), speed: 2 },
    { scale: 1, label: "×1", mod: null, speed: 1 },
    { scale: 1.4, label: "×½", mod: (p) => p.slow(2), speed: 0.5 },
  ];
  const LAYERS = [
    { id: "drums", side: 1 },    // goes clockwise on the left loop
    { id: "melody", side: -1 },  // mirrors it on the right loop, so they meet at the crossings
  ];

  const BARS_PER_LAP = 4;   // slow enough to catch a dot

  let ac, raf, offHit, reduced, geo, orbits, flash, idleCycle, lastT, lastMeet;

  function layout() {
    const W = innerWidth, H = innerHeight, sm = small();
    const R = sm ? W * 0.16 : Math.min(W, H) * 0.17;
    const cy = sm ? H * 0.6 : H * 0.45;
    const cxA = sm ? W * 0.36 : W * 0.66;
    geo = { R, centers: [[cxA, cy], [cxA + 0.9 * R, cy]] };
    orbits.forEach((o, i) => {
      [o.cx, o.cy] = geo.centers[i];
      o.guides.forEach((c, j) => {
        c.setAttribute("cx", o.cx);
        c.setAttribute("cy", o.cy);
        c.setAttribute("r", R * RINGS[j].scale);
      });
      o.guideLabels.forEach((t, j) => {
        const r = R * RINGS[j].scale;
        const a = o.side > 0 ? -2.4 : -0.74;
        t.setAttribute("x", o.cx + Math.cos(a) * r);
        t.setAttribute("y", o.cy + Math.sin(a) * r);
      });
      o.name.setAttribute("x", o.cx);
      o.name.setAttribute("y", o.cy - R * 1.4 - 12);
    });
  }

  function apply(o) {
    Sound.set(o.id, o.ring !== null);
    Sound.setMods(o.id, o.ring !== null && RINGS[o.ring].mod ? [RINGS[o.ring].mod] : []);
    o.guides.forEach((c, j) => c.classList.toggle("is-active", j === o.ring));
    o.el.classList.toggle("is-off", o.ring === null);
    o.el.setAttribute("aria-label",
      `${o.id}: ${o.ring === null ? "off" : { 0: "faster", 1: "normal speed", 2: "slower" }[o.ring]}`);
  }

  function step(ts) {
    const dt = lastT ? (ts - lastT) / 1000 : 0;
    lastT = ts;
    let cycle = Sound.cycle();
    if (cycle === null) {
      // Not playing: drift slowly (or stay still with reduced motion).
      if (!reduced) idleCycle += dt * Sound.state.cps * 0.25;
      cycle = idleCycle;
    } else {
      idleCycle = cycle;
    }

    orbits.forEach((o) => {
      if (o.dragging || o.held || o.ring === null) return;
      const r = geo.R * RINGS[o.ring].scale;
      const a = 2 * Math.PI * (cycle / BARS_PER_LAP) * RINGS[o.ring].speed - Math.PI / 2;
      o.x = o.cx + (o.side > 0 ? Math.cos(a) : -Math.cos(a)) * r;
      o.y = o.cy + Math.sin(a) * r;
    });
    orbits.forEach((o) => (o.el.style.transform = `translate(${o.x}px, ${o.y}px)`));

    // The two dots meet: flash the visuals.
    const [A, B] = orbits;
    if (A.ring !== null && B.ring !== null && !A.dragging && !B.dragging &&
        Math.hypot(A.x - B.x, A.y - B.y) < 24 && ts - lastMeet > 300) {
      lastMeet = ts;
      Visuals.pulse(1);
      flash.setAttribute("cx", (A.x + B.x) / 2);
      flash.setAttribute("cy", (A.y + B.y) / 2);
      flash.classList.remove("is-on");
      void flash.getBBox();
      flash.classList.add("is-on");
    }
    raf = requestAnimationFrame(step);
  }

  return {
    mount(root, opts) {
      reduced = opts.reduced;
      ac = new AbortController();
      idleCycle = 0;
      lastT = 0;
      lastMeet = 0;

      const layer = svg("svg", { class: "toys__svg", "aria-hidden": "true" });
      root.append(layer);
      orbits = LAYERS.map((def) => {
        const g = svg("g", { class: `orbit orbit--${def.id}` });
        const guides = RINGS.map(() => svg("circle", { class: "orbit-guide" }));
        const guideLabels = RINGS.map((ring) => {
          const t = svg("text", { class: "orbit-guide-label" });
          t.textContent = ring.label;
          return t;
        });
        const name = svg("text", { class: "orbit-name" });
        name.textContent = def.id;
        g.append(...guides, ...guideLabels, name);
        layer.append(g);
        const dot = el("button", { type: "button", className: `orbit-dot orbit-dot--${def.id}` },
          el("span", { textContent: def.id }));
        root.append(dot);
        // A dot holds still while the pointer is over it, so it can be grabbed.
        dot.addEventListener("pointerenter", () => (o.held = true));
        dot.addEventListener("pointerleave", () => (o.held = false));
        const o = { ...def, guides, guideLabels, name, el: dot, ring: 1, x: 0, y: 0, dragging: false, held: false };
        return o;
      });
      flash = svg("circle", { class: "orbit-flash", r: 26 });
      layer.append(flash);
      layout();

      orbits.forEach((o) => {
        drag(o.el, {
          start: () => (o.dragging = true),
          move: (e) => {
            o.x = e.clientX;
            o.y = e.clientY;
          },
          end: (e) => {
            o.dragging = false;
            const rel = Math.hypot(e.clientX - o.cx, e.clientY - o.cy) / geo.R;
            if (rel < 0.3 || rel > 1.75) {
              o.ring = null;   // parked off the loops: muted
            } else {
              o.ring = RINGS.reduce((best, r, j) =>
                Math.abs(r.scale - rel) < Math.abs(RINGS[best].scale - rel) ? j : best, 0);
            }
            apply(o);
          },
          // Keyboard / click: normal → faster → slower → off → normal
          click: () => {
            o.ring = { 1: 0, 0: 2, 2: null, null: 1 }[o.ring];
            apply(o);
          },
        }, ac.signal);
        apply(o);
      });

      root.append(el("p", { className: "toy-hint", textContent: "drag a dot in (faster) or out (slower) · off the loops to mute" }));

      offHit = Sound.on("hit", () => {
        const d = orbits[0].el;
        d.classList.add("is-hit");
        setTimeout(() => d.classList.remove("is-hit"), 110);
      });
      addEventListener("resize", layout, { signal: ac.signal });
      raf = requestAnimationFrame(step);
    },

    unmount() {
      cancelAnimationFrame(raf);
      ac.abort();
      offHit();
    },
  };
})();

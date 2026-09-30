// Version 1: knots on strings. Tied means on. Drop a knot onto another to tie them;
// pull them apart to untie. Drums and melody start tied, so the music plays.
// The wind plays too: every few bars it carries a knot over to tie it, or pulls
// two apart. It waits while someone is playing with the knots.
ToyModes.knots = (() => {
  const { el, svg, drag, small } = ToyKit;

  // drums and melody are the sound layers. The others add a piece of code while tied:
  // "sound" pieces go after the Strudel pattern, "visual" pieces after the Hydra scene.
  const KNOTS = [
    { id: "drums", label: "drums" },
    { id: "melody", label: "melody" },
    { id: "jux", label: "jux", code: ".jux(rev)", kind: "sound", fn: (p) => p.jux(strudel.rev) },
    { id: "degrade", label: "degrade", code: ".degradeBy(.7)", kind: "sound", fn: (p) => p.degradeBy(0.7) },
    { id: "pixelate", label: "pixelate", code: ".pixelate(40, 40)", kind: "visual" },
    { id: "noise", label: "noise", code: ".modulate(noise(3), .1)", tag: ".modulate(noise)", kind: "visual" },
    { id: "kaleid", label: "kaleid", code: ".kaleid(5)", kind: "visual" },
  ];
  const PHONE_KNOTS = ["drums", "melody", "jux", "pixelate", "kaleid"];
  const TIE_DIST = 110;     // drop a tag this close to another (centre to centre) to tie
  const BREAK_DIST = 240;   // drag this far from a partner to untie
  let HALF_W, HALF_H, BOND_LEN;   // half the tag size (matches the CSS), set at mount
  const WIND_EVERY = 8;     // bars between gusts
  const FIRST_GUST = 4;     // the first one comes sooner
  const IDLE_MS = 10000;    // after someone touches a knot, the wind waits this long

  let ac, raf, offHit, knots, bonds, reduced, ropeLayer, bondLayer, lastPost;
  let windClock, nextGust, lastTouch, lastTs, carried;
  let loopSound, loopVisual, tieCounter;
  let box, boxH, rail, minY = 0;   // minY: tags never rise above the rail (phones)   // the tags' area (first screen), its height, and the phone "rail" line

  const byId = (id) => knots.find((k) => k.id === id);
  const bonded = (a, b) => bonds.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const isTied = (id) => bonds.some(([a, b]) => a === id || b === id);

  // Desktop and tablet: tags hang from the top edge, to the right of the title.
  // Phone and upright tablet: the opening text comes first; tags hang from a rail in their own band below
  // the sign-up buttons, with the loop under them, so nothing covers the text.
  // Phones, and tablets held upright, get the band below the text.
  const inBand = () => small() || (innerHeight > innerWidth && innerWidth <= 1100);

  function layout() {
    const W = innerWidth, H = innerHeight, sm = inBand();
    let top = 0, rests;
    if (sm) {
      box.style.height = document.querySelector(".hero").offsetHeight + "px";
      top = document.querySelector(".hero__actions").getBoundingClientRect().bottom + scrollY + 40;
      rests = [70, 160, 95, 185, 120];
      rail.setAttribute("x1", 12); rail.setAttribute("x2", W - 12);
      rail.setAttribute("y1", top); rail.setAttribute("y2", top);
    } else {
      box.style.height = "";
      rests = [0.3, 0.44, 0.24, 0.52, 0.34, 0.46, 0.28].map((r) => r * H);
    }
    rail.style.display = sm ? "" : "none";
    const left = sm ? 0.14 : 0.47, right = sm ? 0.86 : 0.93;
    knots.forEach((k, i) => {
      k.ax = W * (left + (right - left) * (i / Math.max(1, knots.length - 1)));
      k.ay = top;
      k.rest = rests[i % rests.length];
    });
    boxH = box.offsetHeight;
    minY = sm ? top + HALF_H + 12 : HALF_H;
    knots.forEach((k) => (k.y = Math.max(minY, k.y)));
  }

  function apply() {
    knots.forEach((k) => {
      const tied = isTied(k.id);
      // Remember the order pieces were tied in, so the loop reads left to right.
      if (tied && k.tiedAt == null) k.tiedAt = tieCounter++;
      if (!tied) k.tiedAt = null;
      k.el.classList.toggle("is-tied", tied);
      k.el.setAttribute("aria-pressed", tied);
      k.el.setAttribute("aria-label", `${k.code || k.label}: ${tied ? "tied, on" : "loose, off"}`);
    });
    const pieces = knots.filter((k) => k.code && k.tiedAt != null).sort((a, b) => a.tiedAt - b.tiedAt);
    const sound = pieces.filter((k) => k.kind === "sound");
    const visual = pieces.filter((k) => k.kind === "visual");

    Sound.set("drums", isTied("drums"));
    Sound.set("melody", isTied("melody"));
    Sound.setMods("all", sound.map((k) => k.fn));
    const post = visual.map((k) => k.code).join("");
    if (post !== lastPost) Visuals.post((lastPost = post));

    drawLoop(sound, visual);
    drawBonds();
  }

  // "the loop": the code that is playing right now, so the knots can be read as code.
  function drawLoop(sound, visual) {
    const layers = ["drums", "melody"].filter(isTied);
    const piece = (k) => el("span", { className: `loop__piece loop__piece--${k.kind}`, textContent: k.code });
    loopSound.replaceChildren(
      el("span", { textContent: layers.length ? `stack(${layers.join(", ")})` : "silence" }),
      ...sound.map(piece));
    loopVisual.replaceChildren(
      el("span", { textContent: "src(o0)" }), ...visual.map(piece), el("span", { textContent: ".out()" }));
  }

  function tie(a, b) {
    if (a === b || bonded(a, b)) return;
    bonds.push([a, b]);
    apply();
  }

  function untieAll(id) {
    bonds = bonds.filter(([a, b]) => a !== id && b !== id);
    apply();
  }

  function nearest(k, maxDist = Infinity) {
    let best = null, bestD = maxDist;
    knots.forEach((o) => {
      if (o === k) return;
      const d = Math.hypot(o.x - k.x, o.y - k.y);
      if (d < bestD) (best = o), (bestD = d);
    });
    return best;
  }

  function drawBonds() {
    bondLayer.replaceChildren(...bonds.map(() => svg("path", { class: "bond" })));
  }

  function render() {
    knots.forEach((k, i) => {
      // The string sags when it has slack.
      const d = Math.hypot(k.x - k.ax, k.y - HALF_H - k.ay);
      const sag = Math.max(0, k.rest - d) * 0.6;
      const mx = (k.ax + k.x) / 2, my = (k.ay + k.y - HALF_H) / 2 + sag;
      ropeLayer.children[i].setAttribute("d", `M${k.ax},${k.ay} Q${mx},${my} ${k.x},${k.y - HALF_H + 10}`);
      k.el.style.transform = `translate(${k.x}px, ${k.y}px)`;
    });
    bonds.forEach(([a, b], i) => {
      const A = byId(a), B = byId(b);
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 12;
      bondLayer.children[i]?.setAttribute("d",
        `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}` +
        // a small loop at the middle: the laço
        ` M${mx + 7},${my - 6} a7,7 0 1,0 0.1,0`);
    });
  }

  // ── wind ────────────────────────────────────────────────────
  const isMusic = (id) => id === "drums" || id === "melody";
  const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

  function gust() {
    const loose = knots.filter((k) => !isTied(k.id) && !k.dragging);
    // Only pull apart bonds that leave drums or melody playing: the wind never makes silence.
    const breakable = bonds.filter((b) =>
      bonds.some((x) => x !== b && (isMusic(x[0]) || isMusic(x[1]))));
    const looseMusic = loose.find((k) => isMusic(k.id));

    if (looseMusic || (loose.length && (!breakable.length || Math.random() < 0.55))) {
      const k = looseMusic || pickRandom(loose);
      carried = { k, target: pickRandom(knots.filter((o) => o !== k)), t0: performance.now() };
      k.carried = true;
      k.el.classList.add("is-carried");
    } else if (breakable.length) {
      const [a, b] = pickRandom(breakable);
      bonds = bonds.filter((x) => !(x[0] === a && x[1] === b));
      apply();
      const A = byId(a), B = byId(b), dir = Math.sign(A.x - B.x) || 1;
      A.vx += 9 * dir; A.vy -= 5;
      B.vx -= 9 * dir; B.vy -= 5;
    }
  }

  function letGo(tieIt) {
    const { k, target } = carried;
    k.carried = false;
    k.el.classList.remove("is-carried");
    carried = null;
    if (tieIt) tie(k.id, target.id);
  }

  // The carried knot drifts toward its target with a little wobble, then ties on arrival.
  function carry(now) {
    const { k, target, t0 } = carried;
    const age = now - t0;
    const dx = target.x - k.x, dy = target.y - k.y, d = Math.hypot(dx, dy) || 1;
    if (d < TIE_DIST * 0.8) return letGo(true);
    if (age > 6000) return letGo(false);
    const wobble = Math.sin(age / 180) * 1.5;
    k.x += dx * 0.035 - (dy / d) * wobble;
    k.y += dy * 0.035 + (dx / d) * wobble;
  }

  function wind(dt) {
    const playing = Sound.cycle();
    windClock = playing ?? windClock + dt * Sound.state.cps;
    // The sound (re)started and the clock jumped back: line the next gust up again.
    if (windClock < nextGust - WIND_EVERY) nextGust = (Math.floor(windClock / WIND_EVERY) + 1) * WIND_EVERY;
    if (carried) return carry(performance.now());
    if (windClock >= nextGust) {
      nextGust += WIND_EVERY;
      if (performance.now() - lastTouch > IDLE_MS) gust();
    }
  }

  function step(ts) {
    const t = ts / 1000;
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (!reduced) wind(dt);
    knots.forEach((k) => {
      k.fx = 0;
      k.fy = 0.35; // gravity
      const dx = k.x - k.ax, dy = k.y - k.ay, d = Math.hypot(dx, dy) || 1;
      const stretch = d - k.rest;
      k.fx -= stretch * 0.012 * dx / d;
      k.fy -= stretch * 0.012 * dy / d;
      if (!reduced) k.fx += Math.sin(t * 0.7 + k.phase) * 0.05;
    });
    bonds.forEach(([a, b]) => {
      const A = byId(a), B = byId(b);
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - BOND_LEN) * 0.03;
      A.fx += f * dx / d; A.fy += f * dy / d;
      B.fx -= f * dx / d; B.fy -= f * dy / d;
    });
    for (let i = 0; i < knots.length; i++) {
      for (let j = i + 1; j < knots.length; j++) {
        const A = knots[i], B = knots[j];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
        // Tags are rectangles: any two that overlap (tied or not) push apart
        // along the axis they overlap least, so every tag stays readable.
        const ox = 2 * HALF_W + 8 - Math.abs(dx), oy = 2 * HALF_H + 8 - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (ox < oy) {
            const f = ox * 0.12 * (Math.sign(dx) || 1);
            A.fx -= f; B.fx += f;
          } else {
            const f = oy * 0.12 * (Math.sign(dy) || 1);
            A.fy -= f; B.fy += f;
          }
        }
      }
    }
    knots.forEach((k) => {
      if (k.dragging || k.carried) return;
      k.vx = (k.vx + k.fx) * 0.9;
      k.vy = (k.vy + k.fy) * 0.9;
      k.x = Math.max(HALF_W, Math.min(innerWidth - HALF_W, k.x + k.vx));
      k.y = Math.max(minY, Math.min(boxH - HALF_H, k.y + k.vy));
    });
    render();
    raf = requestAnimationFrame(step);
  }

  return {
    mount(root, opts) {
      reduced = opts.reduced;
      ac = new AbortController();
      lastPost = null;
      tieCounter = 0;
      windClock = 0;
      nextGust = FIRST_GUST;
      lastTouch = -Infinity;
      lastTs = 0;
      carried = null;
      HALF_W = small() ? 55 : 58;
      HALF_H = small() ? 29 : 29;
      BOND_LEN = 2 * HALF_W + 10;   // tied tags hang side by side
      const layer = svg("svg", { class: "toys__svg", "aria-hidden": "true" });
      ropeLayer = svg("g");
      bondLayer = svg("g");
      rail = svg("line", { class: "rail" });
      layer.append(rail, ropeLayer, bondLayer);
      root.append(layer);
      box = root;

      loopSound = el("span");
      loopVisual = el("span");
      const loop = el("div", { className: "loop" },
        el("p", { className: "loop__title", textContent: "⟳ the loop" }),
        el("p", { className: "loop__line" }, el("span", { className: "loop__kind", textContent: "♪" }), loopSound),
        el("p", { className: "loop__line" }, el("span", { className: "loop__kind", textContent: "◐" }), loopVisual));
      loop.setAttribute("aria-live", "polite");
      loop.setAttribute("aria-label", "The loop: the code playing right now");
      root.append(loop);

      knots = (small() ? KNOTS.filter((k) => PHONE_KNOTS.includes(k.id)) : KNOTS).map((def) => ({
        ...def, x: 0, y: 0, vx: 0, vy: 0, fx: 0, fy: 0, phase: Math.random() * 6, dragging: false,
      }));
      layout();
      knots.forEach((k) => {
        k.x = k.ax;
        k.y = k.rest;
        ropeLayer.append(svg("path", { class: "rope" }));
        // A hanging tag: the word, and underneath the code it adds.
        k.el = el("button", { type: "button", className: `knot knot--${k.kind || "layer"}` },
          el("span", { className: "knot__word", textContent: k.label }),
          el("span", { className: "knot__code", textContent: k.tag || k.code || `${k.id}(…)` }));
        root.append(k.el);
        // Any touch hands control to the visitor: the wind lets go and waits.
        k.el.addEventListener("pointerdown", () => {
          lastTouch = performance.now();
          if (carried) letGo(false);
        }, { signal: ac.signal });
        k.el.addEventListener("keydown", () => (lastTouch = performance.now()), { signal: ac.signal });
        drag(k.el, {
          start: () => {
            k.dragging = true;
            k.vx = k.vy = 0;
          },
          move: (e) => {
            // The tags live on the first screen and scroll with the page: use page coordinates.
            k.x = e.pageX;
            k.y = e.pageY;
            bonds.filter(([a, b]) => a === k.id || b === k.id).forEach(([a, b]) => {
              const o = byId(a === k.id ? b : a);
              if (Math.hypot(o.x - k.x, o.y - k.y) > BREAK_DIST) {
                bonds = bonds.filter((p) => !(p[0] === a && p[1] === b));
                apply();
              }
            });
          },
          end: () => {
            k.dragging = false;
            const o = nearest(k, TIE_DIST);
            if (o) tie(k.id, o.id);
          },
          click: () => {
            if (isTied(k.id)) untieAll(k.id);
            else tie(k.id, nearest(k).id);
          },
        }, ac.signal);
      });

      bonds = [["drums", "melody"]];
      apply();
      offHit = Sound.on("hit", (gain) => {
        bondLayer.classList.add("is-hit");
        setTimeout(() => bondLayer.classList.remove("is-hit"), 110);
        // The strings swing with the drums.
        if (!reduced) knots.forEach((k) => (k.vx += (Math.random() - 0.5) * 3 * gain));
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

// After the opening screen, about, sign up and the workshops hang together like the
// knots above: ropes tie the boxes into one chain, swing with the drums, and the boxes
// drift a few pixels. With reduced motion everything stays still.
(() => {
  const root = document.getElementById("tied");
  const svg = root.querySelector(".tied__ropes");
  const NS = "http://www.w3.org/2000/svg";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The sign-up box holds the form, so it stays still: nobody should type into a moving box.
  const floaters = [...root.querySelectorAll(".block, .workshop")]
    .filter((el) => el.id !== "signup")
    .map((el) => ({ el, phase: Math.random() * 6 }));
  let edges = [], paths = [], raf = 0, visible = false, kick = 0, columns = 0;

  // Which boxes are tied to which. Two columns: about–sign up on the left, about across
  // to the workshops, then down the workshops. One column: a single chain top to bottom.
  function build() {
    const about = root.querySelector("#about");
    const signup = root.querySelector("#signup");
    const head = root.querySelector("#workshops-head");
    const cards = [...root.querySelectorAll(".workshop")];
    columns = getComputedStyle(root).gridTemplateColumns.split(" ").length;
    const chain = (list) => list.slice(1).map((b, i) => [list[i], b]);
    edges = columns > 1
      ? [[about, signup], [about, head], ...chain([head, ...cards])]
      : chain([about, signup, head, ...cards]);
    svg.replaceChildren(...edges.map(() => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "tie");
      return p;
    }));
    paths = [...svg.children];
  }

  function draw(t) {
    const base = root.getBoundingClientRect();
    edges.forEach(([a, b], i) => {
      const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
      const acx = A.left + A.width / 2 - base.left, acy = A.top + A.height / 2 - base.top;
      const bcx = B.left + B.width / 2 - base.left, bcy = B.top + B.height / 2 - base.top;
      const sway = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * 10 + kick * 16 * (i % 2 ? 1 : -1);
      let x1, y1, x2, y2, cx, cy;
      if (Math.abs(bcx - acx) > Math.abs(bcy - acy)) {
        // side by side: from the facing edges, sagging down
        const dir = Math.sign(bcx - acx);
        x1 = (dir > 0 ? A.right : A.left) - base.left; y1 = acy;
        x2 = (dir > 0 ? B.left : B.right) - base.left; y2 = bcy;
        cx = (x1 + x2) / 2; cy = (y1 + y2) / 2 + 40 + sway;
      } else {
        // stacked: bottom of one to the top of the next, bowing sideways
        x1 = acx; y1 = A.bottom - base.top;
        x2 = bcx; y2 = B.top - base.top;
        cx = (x1 + x2) / 2 + 28 + sway; cy = (y1 + y2) / 2;
      }
      // the small loop (the laço) sits at the middle of the curve
      const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2, my = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
      paths[i].setAttribute("d", `M${x1},${y1} Q${cx},${cy} ${x2},${y2} M${mx + 8},${my - 7} a8,8 0 1,0 0.1,0`);
    });
  }

  function frame(ts) {
    const t = ts / 1000;
    if (!reduced) {
      floaters.forEach((f) => {
        f.el.style.translate = `${Math.sin(t * 0.35 + f.phase) * 3}px ${Math.cos(t * 0.3 + f.phase) * 4}px`;
      });
    }
    if (getComputedStyle(root).gridTemplateColumns.split(" ").length !== columns) build();
    draw(t);
    kick *= 0.9;
    raf = visible ? requestAnimationFrame(frame) : 0;
  }

  build();
  // Only animate while this part of the page is on screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(root);
  addEventListener("resize", () => draw(performance.now() / 1000));

  Sound.on("hit", (gain) => {
    kick = Math.max(kick, gain);
    svg.classList.add("is-hit");
    setTimeout(() => svg.classList.remove("is-hit"), 110);
  });
})();

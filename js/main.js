// Renders js/content.js into the page and wires scenes, sound and motion together.
(() => {
  const S = window.SITE;
  const series = S.series;
  const $ = (id) => document.getElementById(id);

  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    Object.assign(node, props);
    children.flat().forEach((c) => node.append(c));
    return node;
  };
  // Only allow web and mail links from the content file.
  const safeUrl = (url) => (/^(https?:|mailto:|#)/.test(url) ? url : "#");

  // ── content ─────────────────────────────────────────────────
  $("kicker").textContent = series.kicker;
  $("title").textContent = series.title;
  $("subtitle").textContent = series.subtitle;
  $("tagline").textContent = series.tagline;
  $("dates").textContent = series.dates;
  $("place").textContent = series.place;
  // **bold** in the content file becomes <strong>; everything else stays plain text.
  const rich = (text) => text.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? el("strong", { textContent: part }) : part));
  const def = series.definition;
  $("about-text").append(
    el("p", { className: "about__def" },
      el("strong", { className: "about__word", textContent: def.word }), " ",
      el("span", { className: "about__say", textContent: def.say }), " ",
      def.meaning),
    ...series.about.map((p) => el("p", {}, rich(p))));
  $("bring").append(...series.bring.map((b) => el("li", { textContent: b })));
  $("signup-intro").textContent = series.signup.intro;
  $("signup-review").textContent = series.signup.review;
  document.querySelectorAll("[data-role-hint]").forEach((el) => {
    el.textContent = "— " + series.signup.roles[el.dataset.roleHint];
  });
  $("contact").href = "mailto:" + series.contact;
  $("contact").textContent = series.contact;
  series.links.forEach((l, i) => {
    if (i) $("footer-links").append(" · ");
    $("footer-links").append(el("a", { href: safeUrl(l.url), textContent: l.label, target: "_blank", rel: "noopener" }));
  });

  const articles = S.workshops.map((w, i) => {
    const meta = el("dl", { className: "workshop__meta" },
      ...[["when", w.date], ["where", w.place], ["with", w.facilitator], ["level", w.level]]
        .filter(([, v]) => v)
        .map(([k, v]) => el("div", {}, el("dt", { textContent: k }), el("dd", { textContent: v }))));
    const article = el("article", { className: "workshop" },
      el("span", { className: "workshop__num", textContent: w.number, ariaHidden: "true" }),
      el("h3", { className: "workshop__title", textContent: w.title }),
      meta,
      ...w.description.map((p) => el("p", { textContent: p })));
    article.dataset.scene = i;
    $("workshop-list").append(el("li", {}, article));
    return article;
  });

  // ── scenes ──────────────────────────────────────────────────
  let soundOn = false;   // becomes true after the first explicit "start sound"
  let current = null;

  const sceneFor = (i) => (i === "intro" ? S.intro : S.workshops[i].scene);
  const nameFor = (i) => (i === "intro" ? "intro" : `workshop ${S.workshops[i].number}`);

  function loadScene(i, { sound }) {
    current = i;
    Editor.load(sceneFor(i), nameFor(i));
    Editor.run("hydra");
    if (sound) {
      soundOn = true;
      Sound.unlock();
      Editor.run("strudel");
    }
    articles.forEach((a) => a.classList.toggle("is-active", String(a.dataset.scene) === String(i)));
  }

  function startSound() {
    soundOn = true;
    Sound.unlock();
    Editor.run("strudel");
  }

  loadScene("intro", { sound: false });

  // The sound button next to "edit the code" starts and stops the sound.
  $("start").addEventListener("click", () => (Sound.state.playing ? Sound.stop() : startSound()));

  Sound.on("change", (s) => {
    $("start").textContent = s.playing ? "■ stop sound" : "▶ start sound";
  });

  // Optional: switch scenes as each workshop scrolls into view.
  const follow = $("follow");
  const observer = new IntersectionObserver((entries) => {
    if (!follow.checked) return;
    const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!seen) return;
    const i = seen.target.id === "top" ? "intro" : Number(seen.target.dataset.scene);
    if (i !== current) loadScene(i, { sound: soundOn && Sound.state.playing });
  }, { threshold: 0.6 });
  observer.observe($("top"));
  articles.forEach((a) => observer.observe(a));

  // ── motion ──────────────────────────────────────────────────
  // Controls sway and drift unless the visitor's system asks for reduced motion.
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  Visuals.speed(motion ? 1 : 0.3);
  document.body.classList.toggle("still", !motion);
  // Wait for fonts so the controls are measured at their final size.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => Toys.start({ reduced: !motion }));

  Visuals.on("fatal", () => document.body.classList.add("no-webgl"));
})();

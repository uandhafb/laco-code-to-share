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

  // ── past / next ─────────────────────────────────────────────
  // A meetup is past the day after it happens. ?today=YYYY-MM-DD fakes the date (for testing).
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const fake = new URLSearchParams(location.search).get("today");
  const today = /^\d{4}-\d{2}-\d{2}$/.test(fake || "") ? fake : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  S.workshops.forEach((w) => (w.past = !!w.day && w.day < today));
  const next = S.workshops.find((w) => w.day && !w.past);

  const articles = S.workshops.map((w, i) => {
    const meta = el("dl", { className: "workshop__meta" },
      ...[["when", w.date], ["where", w.place], ["with", w.facilitator], ["level", w.level]]
        .filter(([, v]) => v)
        .map(([k, v]) => el("div", {}, el("dt", { textContent: k }), el("dd", { textContent: v }))));
    const schedule = w.schedule && el("div", { className: "workshop__schedule" },
      el("h4", { textContent: "approximate schedule" }),
      el("ol", {}, ...w.schedule.map(([time, what]) =>
        el("li", {}, el("time", { textContent: time }), " ", el("span", { textContent: what })))));
    // One presenter, or a list of them; each can have links ([label, url]).
    const people = w.presenter ? [].concat(w.presenter) : [];
    const presenters = people.map((who) => el("div", { className: "workshop__presenter" },
      el("h4", { textContent: who.label }),
      el("p", {}, el("strong", { textContent: who.name }), " — ", who.bio),
      ...(who.links ? [el("ul", { className: "workshop__links" }, ...who.links.map(([label, url]) =>
        el("li", {}, el("a", { href: safeUrl(url), textContent: label, target: "_blank", rel: "noopener" }))))] : [])));
    const badge = w === next && el("span", { className: "workshop__badge", textContent: w.day === today ? "today!" : "next" });
    const article = el("article", { className: "workshop", id: `meetup-${w.number}` },
      el("span", { className: "workshop__num", textContent: w.number, ariaHidden: "true" }),
      ...(badge ? [badge] : []),
      el("h3", { className: "workshop__title", textContent: w.title }),
      meta,
      ...w.description.map((p) => el("p", {}, rich(p))),
      ...[schedule, ...presenters].filter(Boolean));
    if (w.scene) article.dataset.scene = i;
    article.classList.toggle("is-past", w.past);
    article.classList.toggle("is-next", w === next);
    $(w.term ? `workshop-list-${w.term}` : "workshop-list").append(el("li", { hidden: w.past }, article));
    return article;
  });

  // Past meetups are folded away; a button above each list shows them again.
  document.querySelectorAll(".workshops").forEach((list) => {
    const past = [...list.children].filter((li) => li.hidden);
    if (!past.length) return;
    const label = (open) => open
      ? `hide past meetups ▴`
      : `show ${past.length} past meetup${past.length > 1 ? "s" : ""} ▾`;
    const btn = el("button", { type: "button", className: "past-toggle", textContent: label(false) });
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open);
      btn.textContent = label(open);
      past.forEach((li) => (li.hidden = !open));
      document.dispatchEvent(new Event("tied:rebuild"));   // the ropes skip hidden cards
    });
    list.prepend(el("li", { className: "past-toggle-row" }, btn));
  });

  // "next meetup →" on the opening screen
  if (next) {
    const a = el("a", { href: `#meetup-${next.number}`, className: "hero__next" },
      el("span", { className: "hero__next-label", textContent: next.day === today ? "today →" : "next meetup →" }), " ",
      el("strong", { textContent: next.title.startsWith("[") ? `LAÇO #${Number(next.number)}` : next.title }), ` · ${next.date} ↓`);
    $("next-meetup").append(a);
  }

  // ── scenes ──────────────────────────────────────────────────
  let soundOn = false;   // becomes true after the first explicit "start sound"
  let current = null;

  const sceneFor = (i) => (i === "intro" ? S.intro : S.workshops[i].scene);
  const nameFor = (i) => (i === "intro" ? "intro" : `meetup ${S.workshops[i].number}`);

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
  articles.filter((a) => a.dataset.scene).forEach((a) => observer.observe(a));

  // ── motion ──────────────────────────────────────────────────
  // Controls sway and drift unless the visitor's system asks for reduced motion.
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  Visuals.speed(motion ? 1 : 0.3);
  document.body.classList.toggle("still", !motion);
  // Wait for fonts so the controls are measured at their final size.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => Toys.start({ reduced: !motion }));

  Visuals.on("fatal", () => document.body.classList.add("no-webgl"));
})();

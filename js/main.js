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
  document.querySelectorAll("[data-role-hint]").forEach((el) => {
    el.textContent = "— " + series.signup.roles[el.dataset.roleHint];
  });
  $("contact").href = "mailto:" + series.contact;
  $("contact").textContent = series.contact;

  // ── past / next ─────────────────────────────────────────────
  // A meetup is past the day after it happens. ?today=YYYY-MM-DD fakes the date (for testing).
  const fake = new URLSearchParams(location.search).get("today");
  const today = /^\d{4}-\d{2}-\d{2}$/.test(fake || "") ? fake :
    new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Toronto" }).format(new Date());
  S.workshops.sort((a, b) => (a.day || "9999").localeCompare(b.day || "9999"));
  S.workshops.forEach((w) => (w.past = !!w.day && w.day < today));
  const [next, following] = S.workshops.filter((w) => w.day && !w.past);
  const titleFor = (w) => w.title.startsWith("[") ? `LAÇO #${Number(w.number)}` : w.title;
  const meetupDate = (w) => {
    if (!w.day) return w.date;
    const [date, hours] = w.date.split(" · ");
    return [`${date}, ${w.day.slice(0, 4)}`, hours].filter(Boolean).join(" · ");
  };
  const archive = $("past-meetups");
  const pastList = $("past-workshop-list");

  const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  function addOverviewDate(w) {
    const list = $(`term-dates-${w.day?.slice(0, 4)}`);
    if (!list) return;
    const hours = w.date.split(" · ")[1];
    const link = el("a", { href: `#meetup-${w.number}` },
      el("span", { className: "term-number", textContent: `#${Number(w.number)}` }),
      el("time", { dateTime: w.day, textContent: shortDate.format(new Date(w.day)) }));
    const state = w === next ? (w.day === today ? "today" : "next") : "";
    if (state) link.append(el("strong", { className: "term-status", textContent: state }));
    if (hours) link.append(el("span", { className: "term-hours", textContent: hours }));
    const label = [titleFor(w), meetupDate(w), w.past ? "past meetup" : state].filter(Boolean);
    link.setAttribute("aria-label", label.join(", "));
    list.append(el("li", { className: w.past ? "is-past" : "" }, link));
  }

  const articles = S.workshops.map((w, i) => {
    addOverviewDate(w);
    const meta = el("dl", { className: "workshop__meta" },
      ...[["when", meetupDate(w)], ["where", w.place], ["with", w.facilitator], ["level", w.level]]
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
      el("h3", { className: "workshop__title", textContent: titleFor(w) }),
      meta,
      ...w.description.map((p) => el("p", {}, rich(p))),
      ...[schedule, ...presenters].filter(Boolean));
    if (w.scene) article.dataset.scene = i;
    article.classList.toggle("is-past", w.past);
    article.classList.toggle("is-next", w === next);
    const item = el("li", {}, article);
    if (w.past) {
      pastList.prepend(item);
    } else {
      $("workshop-list").append(item);
    }
    return article;
  });

  archive.hidden = !pastList.childElementCount;
  $("past-count").textContent = `(${pastList.childElementCount})`;
  archive.addEventListener("toggle", () => document.dispatchEvent(new Event("tied:rebuild")));
  function revealLinkedMeetup() {
    const target = $(location.hash.slice(1));
    if (target && pastList.contains(target) && !archive.open) {
      archive.open = true;
      target.scrollIntoView();
    }
  }
  revealLinkedMeetup();
  addEventListener("hashchange", revealLinkedMeetup);

  // The hero follows the calendar: the next meetup, and the one after it.
  const heroSchedule = $("next-meetup");
  if (next) {
    heroSchedule.append(el("div", { className: "hero__featured" },
      el("span", { className: "hero__next-label", textContent: next.day === today ? "Today" : "Next meetup" }),
      el("h2", {}, el("a", { href: `#meetup-${next.number}`, textContent: titleFor(next) })),
      el("time", { dateTime: next.day, textContent: meetupDate(next) }),
      el("span", { className: "hero__venue", textContent: next.place })));
    if (following) {
      const program = following.title.startsWith("[") ? " · Program to be announced soon" : "";
      heroSchedule.append(el("div", { className: "hero__following" },
        el("span", { className: "hero__next-label", textContent: "Coming up" }),
        el("a", { href: `#meetup-${following.number}`, textContent: titleFor(following) }), program,
        el("time", { dateTime: following.day, textContent: meetupDate(following) })));
    }
  } else {
    heroSchedule.append(el("p", { className: "hero__featured", textContent: "New meetup dates will appear here." }));
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

  // Optional: the scenes (intro, then each meetup's in date order) are spread evenly
  // over the page — each one plays for an equal part of the scroll, top to bottom.
  const follow = $("follow");
  const order = ["intro", ...S.workshops.map((w, i) => (w.scene ? i : null)).filter((i) => i !== null)];
  let ticking = false;
  function followScroll() {
    ticking = false;
    if (!follow.checked) return;
    const room = document.documentElement.scrollHeight - innerHeight;
    const part = room > 0 ? Math.min(order.length - 1, Math.floor((scrollY / room) * order.length)) : 0;
    const i = order[part];
    if (i !== current) loadScene(i, { sound: soundOn && Sound.state.playing });
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(followScroll); }
  }, { passive: true });
  follow.addEventListener("change", followScroll);

  // The yellow highlight follows the meetup card in the middle of the screen.
  const highlight = new IntersectionObserver((entries) => entries.forEach((e) =>
    e.target.classList.toggle("is-active", e.isIntersecting)), { rootMargin: "-50% 0px -50% 0px" });
  articles.forEach((a) => highlight.observe(a));

  // ── motion ──────────────────────────────────────────────────
  // Controls sway and drift unless the visitor's system asks for reduced motion.
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  Visuals.speed(motion ? 1 : 0.3);
  document.body.classList.toggle("still", !motion);
  // Wait for fonts so the controls are measured at their final size.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => Toys.start({ reduced: !motion }));

  Visuals.on("fatal", () => document.body.classList.add("no-webgl"));
})();

// Registration form. It is styled like the rest of the site, and it sends the answers to a
// Google Form (so they land in a Google Sheet, with email notifications) — see README.md.
(() => {
  const cfg = window.SITE.series.signup;
  const workshops = window.SITE.workshops;
  const form = document.getElementById("signup-form");
  const status = document.getElementById("signup-status");
  const submit = form.querySelector("button[type=submit]");
  const roleBoxes = [...form.querySelectorAll("input[name=role]")];
  const ROLES = roleBoxes.map((b) => b.value);   // attendee, performer, presenter
  const el = (tag, props = {}, ...children) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  };

  // ── "which workshops?" (for attendees), built from the workshop list ──
  const list = document.getElementById("f-workshop-list");
  const workshopBoxes = workshops.map((w, i) => {
    const box = el("input", { type: "checkbox", name: "workshop", value: String(i) });
    list.append(el("label", { className: "check" }, box, " ",
      el("b", { textContent: `workshop ${w.number}` }), " ",
      el("span", { className: "check__hint", textContent: w.date })));
    return box;
  });
  const allBox = document.getElementById("f-all");
  allBox.addEventListener("change", () => workshopBoxes.forEach((b) => (b.checked = allBox.checked)));
  workshopBoxes.forEach((b) => b.addEventListener("change", () => {
    allBox.checked = workshopBoxes.every((x) => x.checked);
    setError("f-workshops", "");
  }));
  const chosenWorkshops = () => workshopBoxes.filter((b) => b.checked).map((b) => Number(b.value));

  // ── "rank your preferred dates" (performers and presenters) ──
  // One dropdown per date: 1st … 4th choice, or "–" to leave a date out.
  const ordinal = (n) => ["1st", "2nd", "3rd"][n - 1] || `${n}th`;
  const ranks = {};
  form.querySelectorAll(".rank").forEach((set) => {
    ranks[set.dataset.for] = workshops.map((w, i) => {
      const select = el("select", { id: `${set.id}-${i}` },
        el("option", { value: "", textContent: "–" }),
        ...workshops.map((_, n) => el("option", { value: String(n + 1), textContent: ordinal(n + 1) })));
      select.addEventListener("change", () => setError(set.id, ""));
      set.append(el("div", { className: "rank__row" },
        select, " ",
        el("label", { htmlFor: select.id, textContent: w.date })));
      return select;
    });
  });
  // "1. Wednesday, November 11 · 13:30–17:00; 2. …" in the order the person ranked them
  const rankText = (key) => ranks[key]
    .map((s, i) => ({ n: Number(s.value), date: workshops[i].date }))
    .filter((r) => r.n)
    .sort((a, b) => a.n - b.n)
    .map((r) => `${r.n}. ${r.date}`)
    .join("; ");
  function checkRank(key) {
    const values = ranks[key].map((s) => s.value).filter(Boolean);
    if (!values.length) return "please rank at least one date";
    if (new Set(values).size !== values.length) return "each choice can only be used once";
    return "";
  }

  // ── Google Form connection ──────────────────────────────────
  // Read from the "pre-filled link" Google Forms makes (⋮ → Get pre-filled link).
  // Its entries come in question order: name, email, roles (one value per option),
  // workshops (one value per workshop — this question is optional), performance,
  // presentation, and the last "anything else?" box.
  function connection() {
    let url;
    try { url = new URL(cfg.google.prefilled); } catch { return null; }
    if (url.hostname !== "docs.google.com" || !url.pathname.includes("/forms/")) return null;
    const entries = [];
    url.searchParams.forEach((value, key) => {
      if (!key.startsWith("entry.")) return;
      const e = entries.find((x) => x.key === key);
      if (e) e.values.push(value);
      else entries.push({ key, values: [value] });
    });
    const hasWorkshops = entries.length === 7;
    if (!(entries.length === 6 || hasWorkshops) || entries[2].values.length !== ROLES.length) return null;
    const rest = entries.slice(hasWorkshops ? 4 : 3);
    return {
      action: url.origin + url.pathname.replace(/\/viewform$/, "/formResponse"),
      name: entries[0].key,
      email: entries[1].key,
      roles: entries[2].key,
      // the option labels exactly as written in the Google Form, in the same order as ours
      roleLabels: Object.fromEntries(ROLES.map((r, i) => [r, entries[2].values[i]])),
      workshops: hasWorkshops ? entries[3].key : null,
      workshopLabels: hasWorkshops ? entries[3].values : [],
      performance: rest[0].key,
      presentation: rest[1].key,
      message: rest[2].key,
    };
  }
  const google = connection();
  const workshopLabel = (i) => google.workshopLabels[i] || `Workshop ${workshops[i].number}`;

  // ── show the follow-up question for each ticked role ────────
  const followUps = [...form.querySelectorAll("[data-show-if]")];
  const chosen = () => roleBoxes.filter((b) => b.checked).map((b) => b.value);
  function updateFollowUps() {
    const roles = chosen();
    followUps.forEach((el) => (el.hidden = !roles.includes(el.dataset.showIf)));
  }
  roleBoxes.forEach((b) => b.addEventListener("change", () => {
    updateFollowUps();
    setError("f-roles", "");
  }));
  updateFollowUps();

  // ── validation ──────────────────────────────────────────────
  function setError(id, message) {
    const el = document.getElementById(id);
    const msg = document.getElementById(id + "-error");
    msg.textContent = message;
    if (el.tagName === "FIELDSET") el.toggleAttribute("data-invalid", !!message);
    else el.setAttribute("aria-invalid", message ? "true" : "false");
    if (message) el.setAttribute("aria-describedby", id + "-error");
  }

  function validate() {
    const v = (name) => form.elements[name].value.trim();
    const problems = [];
    const check = (id, ok, message) => {
      setError(id, ok ? "" : message);
      if (!ok) problems.push(id);
    };
    check("f-name", v("name").length > 0, "please write your name");
    check("f-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")), "please write a valid email, like you@example.com");
    const roles = chosen();
    check("f-roles", roles.length > 0, "please choose at least one");
    if (roles.includes("attendee")) check("f-workshops", chosenWorkshops().length > 0, "please choose at least one workshop (or all of them)");
    if (roles.includes("performer")) {
      check("f-performance", v("performance").length > 0, "tell us a little about what you'd perform");
      const r = checkRank("performance");
      check("f-rank-performance", !r, r);
    }
    if (roles.includes("presenter")) {
      check("f-presentation", v("presentation").length > 0, "tell us a little about what you'd present");
      const r = checkRank("presentation");
      check("f-rank-presentation", !r, r);
    }
    return problems;
  }

  form.querySelectorAll("input, textarea, select").forEach((el) =>
    el.addEventListener("input", () => {
      if (el.getAttribute("aria-invalid") === "true") validate();
    }));

  const setStatus = (text, kind = "") => {
    status.textContent = text;
    status.dataset.kind = kind;
  };

  // ── send ────────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const problems = validate();
    if (problems.length) {
      const first = document.getElementById(problems[0]);
      (first.tagName === "FIELDSET" ? first.querySelector("input, select") : first).focus();
      setStatus("some answers need a look — see above", "error");
      return;
    }
    if (form.elements.website.value) return;   // a bot filled the hidden field
    if (!google) {
      setStatus("The form isn't connected to Google Forms yet (see README.md, “Registration form”).", "error");
      return;
    }

    const roles = chosen();
    const picked = roles.includes("attendee") ? chosenWorkshops().map(workshopLabel) : [];
    let message = form.elements.message.value.trim();
    const data = new URLSearchParams();
    data.append(google.name, form.elements.name.value.trim());
    data.append(google.email, form.elements.email.value.trim());
    roles.forEach((r) => data.append(google.roles, google.roleLabels[r]));
    if (google.workshops) picked.forEach((w) => data.append(google.workshops, w));
    // A Google Form without the workshops question still gets the choice, inside the last box.
    else if (picked.length) message = `Workshops: ${picked.join(", ")}` + (message ? `\n\n${message}` : "");
    // The date ranking goes in the same answer, on its own line.
    const withRank = (key) => `${form.elements[key].value.trim()}\n\nPreferred dates: ${rankText(key)}`;
    data.append(google.performance, roles.includes("performer") ? withRank("performance") : "");
    data.append(google.presentation, roles.includes("presenter") ? withRank("presentation") : "");
    data.append(google.message, message);

    submit.disabled = true;
    setStatus("sending…");
    try {
      // Google doesn't let other sites read its reply ("no-cors"), so a finished request
      // is as much confirmation as we can get. Answers show up in the form's Responses tab.
      await fetch(google.action, { method: "POST", mode: "no-cors", body: data });
      form.replaceChildren(Object.assign(document.createElement("p"), {
        className: "form__thanks",
        textContent: cfg.thanks,
      }));
      form.setAttribute("tabindex", "-1");
      form.focus();
    } catch {
      submit.disabled = false;
      setStatus(`couldn't send — check your connection and try again, or email ${window.SITE.series.contact}`, "error");
    }
  });
})();

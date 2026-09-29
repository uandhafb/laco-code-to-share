// Registration form. It is styled like the rest of the site, and it sends the answers to a
// Google Form (so they land in a Google Sheet, with email notifications) — see README.md.
(() => {
  const cfg = window.SITE.series.signup;
  const form = document.getElementById("signup-form");
  const status = document.getElementById("signup-status");
  const submit = form.querySelector("button[type=submit]");
  const roleBoxes = [...form.querySelectorAll("input[name=role]")];
  const ROLES = roleBoxes.map((b) => b.value);   // attendee, performer, presenter

  // ── Google Form connection ──────────────────────────────────
  // Read from the "pre-filled link" Google Forms makes (⋮ → Get pre-filled link).
  // Its entries come in question order: name, email, roles (one value per option), performance,
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
    if (entries.length !== 6 || entries[2].values.length !== ROLES.length) return null;
    return {
      action: url.origin + url.pathname.replace(/\/viewform$/, "/formResponse"),
      name: entries[0].key,
      email: entries[1].key,
      roles: entries[2].key,
      // the option labels exactly as written in the Google Form, in the same order as ours
      roleLabels: Object.fromEntries(ROLES.map((r, i) => [r, entries[2].values[i]])),
      performance: entries[3].key,
      presentation: entries[4].key,
      message: entries[5].key,
    };
  }
  const google = connection();

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
    if (roles.includes("performer")) check("f-performance", v("performance").length > 0, "tell us a little about what you'd perform");
    if (roles.includes("presenter")) check("f-presentation", v("presentation").length > 0, "tell us a little about what you'd present");
    return problems;
  }

  form.querySelectorAll("input, textarea").forEach((el) =>
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
      (first.tagName === "FIELDSET" ? first.querySelector("input") : first).focus();
      setStatus("some answers need a look — see above", "error");
      return;
    }
    if (form.elements.website.value) return;   // a bot filled the hidden field
    if (!google) {
      setStatus("The form isn't connected to Google Forms yet (see README.md, “Registration form”).", "error");
      return;
    }

    const roles = chosen();
    const data = new URLSearchParams();
    data.append(google.name, form.elements.name.value.trim());
    data.append(google.email, form.elements.email.value.trim());
    roles.forEach((r) => data.append(google.roles, google.roleLabels[r]));
    data.append(google.performance, roles.includes("performer") ? form.elements.performance.value.trim() : "");
    data.append(google.presentation, roles.includes("presenter") ? form.elements.presentation.value.trim() : "");
    data.append(google.message, form.elements.message.value.trim());

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

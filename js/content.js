// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to change the site's text and the live scenes.
//  Anything in [SQUARE BRACKETS] is a placeholder to replace.
// ─────────────────────────────────────────────────────────────
//
//  Each scene has two pieces of code:
//   - strudel: sound. Wrap layers in drums(...) and melody(...) so the
//     floating controls can switch them off and add effects. Drum hits
//     also send a pulse to the visuals.
//   - hydra: visuals. You can use these extra values:
//       pulse       0..1, jumps on every drum hit and fades out
//       pointer.x   0..1, mouse / touch position
//       pointer.y   0..1
//     Output o3 is reserved for the floating controls' visual effects.

window.SITE = {
  series: {
    title: "LAÇO",
    subtitle: "code to share",
    kicker: "a series of live coding workshops",
    // The square brackets here are part of the design, not a placeholder.
    tagline: "[Free and welcoming to all levels. Share and experience art made with code]",
    dates: "2026.2027",
    place: "Visualization Studio, Concordia University",
    // The dictionary-style line at the top of "about".
    definition: {
      word: "laço",
      say: "/ˈla.su/ (Brazilian Portuguese):",
      meaning: "a knot, a bow, a loop; also the ties or bonds between people.",
    },
    // Paragraphs of "about". Text between **double stars** is shown in bold.
    about: [
      "**LAÇO: code to share** is a series of free workshops that brings people together to build connections through live coding — the practice of creating music and visuals with the code on screen for everyone to see.",
      "All levels are welcome, no experience needed. Come to learn, to share, or just to hang out!",
    ],
    bring: [
      "a laptop",
      "headphones",
      "curiosity — no coding or music experience needed",
    ],
    signup: {
      intro: "Join as an attendee, a performer or a presenter — or all three.",
      review: "Registrations are reviewed as they come in, until spots are filled. Performers and presenters will be contacted by email to confirm the details.",
      roles: {
        performer: "perform live code (music, visuals, web choreography)",
        presenter: "present first steps and tips for your language",
      },
      thanks: "Thanks, you're in the loop! If you signed up to perform or present, we'll email you to confirm the details.",

      // Connects the form to your Google Form. See "Registration form" in README.md.
      // Paste the pre-filled link from Google Forms into `prefilled` and the rest is read from it.
      google: {
        prefilled: "https://docs.google.com/forms/d/e/1FAIpQLSf7m7VMzc_b3it6MFxKsAzqx8wO7-pXBqSlb4AY7YehVebVyg/viewform?usp=pp_url&entry.589212447=uandha&entry.136257565=@ndjksjkdb&entry.623795492=Attendee&entry.623795492=Performer&entry.623795492=Presenter&entry.1664604987=xcxc&entry.1213673293=czcx&entry.643209352=czc",
      },
    },
    contact: "uandha.fernandesbarbosa@mail.concordia.ca",
  },

  // Scene that plays on the landing screen.
  intro: {
    strudel: `stack(
  drums(
    s("bd*4, [~ hh]*4, <[~ cp?0.35, cp!3?0.7 ~]>")
      .room(.5).rsize(2)
      .gain(.35)
      .pan(rand)
  ),

  melody(
    n("0 .. 7").scale("D:dorian")
      .s("triangle").fast(2)
      .degradeBy(.3)
      .delay(.3)
      .gain(.4)
  )
)`,
    hydra: `const loop = (side, r, g, b) =>
  shape(99, 0.34, 0.02)
    .diff(shape(99, 0.3, 0.02))
    .scrollX(() => side * (0.1 + Math.sin(time * 0.4) * 0.07))
    .color(r, g, b)

loop(1, 0.83, 1, 0.23).add(loop(-1, 1, 0.31, 0.85))
  .scale(() => 1 + pulse * 0.08, () => innerHeight / innerWidth, 1)
  .rotate(() => time * 0.05 + (pointer.x - 0.5))
  .modulate(noise(2, 0.1), 0.02)
  .blend(src(o0).scale(1.015).hue(0.03), 0.85)
  .out()`,
  },

  workshops: [
    {
      number: "01",
      title: "[WORKSHOP 01 — TBA]",
      date: "Wednesday, November 4 · 13:30–17:00",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `stack(
  drums(
    s("bossdr220_ht(3,8,<2 0 1 0 0>)")
      .lpf(200)
      .gain(0.45)
      .pan(rand)
  ),

  melody(
    n(run("<4 16/8>"))
      .chord("<C^7, Db^7 <Fm^7 Dm7>>")
      .voicing()
      .add(note("<1 2>/4"))
      .dec(.1)
      .pan(sine.slow(10))
      .gain(0.35)
      //.fast(2)
  )
)`,
        hydra: `shape(4, () => 0.3 + pulse * 0.3, 0.01)
  .repeat(3, 3)
  .rotate(() => time * 0.1 + (pointer.x - 0.5) * 3)   // mouse left/right: turn
  .scale(() => 1.4 - pointer.y * 0.8)                  // mouse up/down: zoom
  .modulate(osc(6, 0.1), 0.2)
  .color(0.2, 0.9, 0.8)
  .out()`,
      },
    },
    {
      number: "02",
      title: "[WORKSHOP 02 — TBA]",
      date: "Wednesday, November 11 · 13:30–17:00",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `setcpm(120/4)

stack(
  melody(
    stack(
      s("[rim:1(3,8,<0 0 0 1>)]*2")
        .lpq("<0 10 20 30>")
        .delay(0.25)
        .gain(0.3)
        .pan(rand),

      s("perc:2")
        .slice("[1. 1. 0.8 1]*2", "[.3 0.15 .1 0.18]*1")
        .clip(0.7)
        .degradeBy(0.5)
        .slow(0.75)
        .gain(0.4)
        .pan(rand)
    ).every(9, x => x.slice(8, "0 1 <2 2*2> 3 [4 0] 5 6 7"))
  ),

  drums(
    stack(
      s("bd(2,8)*2")
        .gain(0.5)
        .room(1.5),

      s("sd(3,8)*2")
        .mask("[0 1!3]*2")
        .gain(0.5)
        .room(1.5)
    ).every(9, x => x.s("sd(3,8)*2").mask("[0 1!3]*2").delay(0.2))
      .gain(0.3)
      .room(2)
      .size(0.2)
  )
)`,
        hydra: `osc(10, 0, 0)
  .add(noise(5, 1))
  .color(0, 1, 3)
  .colorama(0.4)
  .rotate(() => (pointer.x - 0.5) * 3)          // mouse left/right: turn
  .scale(() => 1.4 - pointer.y * 0.8)          // mouse up/down: zoom
  .out()`,
      },
    },
    {
      number: "03",
      title: "[WORKSHOP 03 — TBA]",
      date: "Wednesday, November 25 · 13:30–17:00",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `stack(
  drums(
    stack(
      s("bd").bank("korgkr55").beat("0,7?,11?0.2", 16),
      s("sd").bank("UnivoxMicroRhythmer12"),
      s("hh:4").jux(press).pan("<.5 1 .5 0>")
    ).gain(0.7)
  ),

  melody(
    stack(
      note("d1!3")
        .s("sine")
        .penv(27)
        .distort("8:.4")
        .gain(0.007),

      note("<c#*8 f?0.2 d#*16? <[f2?0.2 a#]>/5>/2")
        .s("supersaw")
        .room(2)
        .gain(0.25)
    )
  )
)`,
        hydra: `noise(3, 0.1, 7)
  .rotate(1, -1, -2)
  .mask(shape(20))
  .rotate(() => (pointer.x - 0.5) * 3)          // mouse left/right: turn
  .scale(() => 1.4 - pointer.y * 0.8)          // mouse up/down: zoom
  .colorama(0.8)
  .modulateScale(o0)
  .modulateScale(o0, 1)
  .blend(o0)
  .blend(o0)
  .out(o0)`,
      },
    },
    {
      number: "04",
      title: "[WORKSHOP 04 — TBA]",
      date: "Wednesday, December 9 · 13:30–17:00",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `stack(
  drums(
    stack(
      s("glitch")
        .n("0 4 2 7")
        .jux(rev)
        .hpf(2200)
        .bpf(sine.slow(12).range(1200, 7200))
        .bpq(sine.slow(9).range(0.25, 0.98))
        .delay(0.08).decay(0.85)
        .speed("<3.95 4 4.03 4.01>")
        .gain(sine.fast(10).range(0.15, 0.55))
        .pan(sine.slow(5)),

      s("noise")
        .segment("<8 16 32 16>")
        .gain(sine.slow(6).range(0.0, 0.9))
        .bpf(sine.slow(10).range(120, 9000))
        .bpq(sine.slow(7).range(0.12, 0.97))
        .pan(saw.slow(3))
        .room(2.8).sz(0.9),

      s("noise")
        .segment("<16 32>")
        .gain(sine.slow(8).range(0.02, 0.22))
        .bpf("<250 500 1000 2000 3200 5200 7800>")
        .bpq(0.985)
        .pan(sine.slow(9))
        .room(4.2).sz(0.95)
    )
  ),

  melody(
    stack(
      note("<c2 [~ eb5] ~ [g6 ~ a1]>")
        .s("piano")
        .ply("<1 2 1 4>")
        .lpf(sine.slow(16).range(500, 1900))
        .hpf(sine.slow(20).range(40, 240))
        .room(2.1).sz(3)
        .gain(0.5)
        .pan(sine.slow(1.7).range(-0.4, 0.4)),

      s("sine")
        .freq(saw.slow(18).range(40, 6200))
        .crush(sine.slow(2.2).range(1, 10))
        .gain(0.12)
        .bpf(sine.slow(14).range(300, 8000))
        .bpq(0.96)
        .pan(sine.slow(0.7))
        .room(6).sz(0.92)
    )
  )
)`,
        hydra: `noise(4, 0.1)
  .color(0.3, 0.9, 1)
  .modulateRotate(osc(3, 0.05), () => 0.5 + pulse)
  .kaleid(3)
  .rotate(() => (pointer.x - 0.5) * 3)          // mouse left/right: turn
  .scale(() => 1.4 - pointer.y * 0.8)          // mouse up/down: zoom
  .out()`,
      },
    },
  ],
};

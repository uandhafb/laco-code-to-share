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
    links: [
      { label: "[instagram]", url: "[https://instagram.com/...]" },
      { label: "[mastodon]", url: "[https://...]" },
    ],
  },

  // Scene that plays on the landing screen.
  intro: {
    strudel: `// ctrl/⌘ + enter to run · ctrl + . to stop
// euclidean rhythms + a scale
stack(
  drums(s("bd*4, [~ hh]*4, ~ cp").gain(.9)),
  melody(
    n("0 .. 7").scale("D:dorian")
      .s("triangle").fast(2)
      .degradeBy(.3)
      .delay(.3).gain(.4)
  )
)`,
    hydra: `// laço: two loops tied together
const loop = (side, r, g, b) =>
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
      date: "Wednesday, November 4 · 13:30–16:30",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `// a minor groove + a filter sweep
stack(
  drums(s("bd ~ [~ bd] ~, ~ sd, hh*8").gain(.8)),
  melody(
    n("<0 2 4 [6 4]>*2").scale("C4:minor")
      .s("sawtooth")
      .lpf(sine.range(400, 2000).slow(8))
      .room(.4).gain(.3)
  )
)`,
        hydra: `shape(4, () => 0.3 + pulse * 0.3, 0.01)
  .repeat(3, 3)
  .rotate(() => time * 0.1)
  .modulate(osc(6, 0.1), 0.2)
  .color(0.2, 0.9, 0.8)
  .out()`,
      },
    },
    {
      number: "02",
      title: "[WORKSHOP 02 — TBA]",
      date: "Wednesday, November 11 · 13:30–16:30",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `// chords + a slower groove
stack(
  drums(s("808bd:3 ~ ~ 808bd:3, ~ 808sd:1").room(.2)),
  melody(
    note("<[c4,e4,g4] [a3,c4,e4] [f3,a3,c4] [g3,b3,d4]>")
      .s("square").lpf(1200)
      .gain(.2).slow(2)
  )
)`,
        hydra: `voronoi(8, 0.3, 0.3)
  .mult(osc(10, 0.1, () => pulse * 2))
  .modulateScale(noise(2), 0.4)
  .color(1, 0.6, 0.3)
  .out()`,
      },
    },
    {
      number: "03",
      title: "[WORKSHOP 03 — TBA]",
      date: "Wednesday, November 25 · 13:30–16:30",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `// polyrhythm + samples played backwards on one side
stack(
  drums(s("bd(5,8), hh*16?, ~ sd").speed(perlin.range(.9, 1.1))),
  melody(
    s("arpy*8").n("<0 3 5 7>")
      .speed("<1 1.5 2>")
      .jux(rev).room(.3).gain(.5)
  )
)`,
        hydra: `src(o0)
  .scale(1.01)
  .rotate(0.01)
  .blend(
    osc(30, 0.1, 1).kaleid(6)
      .mask(shape(6, () => 0.2 + pulse * 0.4)),
    0.3
  )
  .out()`,
      },
    },
    {
      number: "04",
      title: "[WORKSHOP 04 — TBA]",
      date: "Wednesday, December 9 · 13:30–16:30",
      place: "Visualization Studio (LB-314, 3rd floor), Webster Library",
      facilitator: "",   // TODO: add the facilitator's name (empty = hidden)
      level: "all levels",
      description: [
        // TODO: replace with what participants will learn and make, and a line about the facilitator.
        "We're preparing the program for each workshop. It will be announced soon!",
      ],
      scene: {
        strudel: `// a slow chord loop over a steady beat
stack(
  drums(s("bd [~ bd] ~ bd, ~ cp, hh*4").gain(.8)),
  melody(
    note("<[c3,g3,e4] [a2,e3,c4] [f2,c3,a3] [g2,d3,b3]>")
      .s("sawtooth").lpf(900)
      .room(.5).gain(.22)
  )
)`,
        hydra: `noise(4, 0.1)
  .color(0.3, 0.9, 1)
  .modulateRotate(osc(3, 0.05), () => 0.5 + pulse)
  .kaleid(3)
  .out()`,
      },
    },
  ],
};

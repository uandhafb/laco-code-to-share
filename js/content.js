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
    subtitle: "live code to share",
    kicker: "a series of livecoding workshops",
    tagline: "[One sentence about the series: e.g. learn to make music and visuals with code, from zero, together.]",
    dates: "2026",
    place: "Visualization Studio, Concordia Library",
    about: [
      "[Paragraph 1: what the series is, who it is for, and why livecoding.]",
      "[Paragraph 2: format — how many sessions, how long, hands-on, free or paid, no experience needed?]",
      "[Paragraph 3: who is organising it, with thanks to partners or supporters.]",
    ],
    bring: [
      "a laptop with a recent Chrome or Firefox",
      "headphones",
      "curiosity — no coding or music experience needed",
    ],
    signup: {
      label: "sign up",
      url: "[https://SIGN-UP-FORM-LINK]",
      note: "[Places are limited to N people per workshop.]",
    },
    contact: "[you@example.com]",
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
      title: "[WORKSHOP 1 TITLE — e.g. Patterns: first steps with Strudel]",
      date: "[DAY DD MONTH, HH:MM–HH:MM]",
      place: "[ROOM / VENUE]",
      facilitator: "[FACILITATOR NAME]",
      level: "beginner",
      description: [
        "[What participants will learn and make in this session.]",
        "[Optional second paragraph: about the facilitator.]",
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
      title: "[WORKSHOP 2 TITLE — e.g. Shaders for everyone: visuals with Hydra]",
      date: "[DAY DD MONTH, HH:MM–HH:MM]",
      place: "[ROOM / VENUE]",
      facilitator: "[FACILITATOR NAME]",
      level: "beginner",
      description: [
        "[What participants will learn and make in this session.]",
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
      title: "[WORKSHOP 3 TITLE — e.g. Algorave: performing together]",
      date: "[DAY DD MONTH, HH:MM–HH:MM]",
      place: "[ROOM / VENUE]",
      facilitator: "[FACILITATOR NAME]",
      level: "all levels",
      description: [
        "[What participants will learn and make in this session. Maybe it ends with a public performance?]",
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
  ],
};

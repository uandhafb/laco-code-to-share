# LAÇO: live code to share

The website for **LAÇO**, a series of livecoding workshops at the Visualization Studio, Concordia Library (2026).

The whole page is a live instrument. The background is [Hydra](https://hydra.ojack.xyz) visuals, the sound is [Strudel](https://strudel.cc), and visitors can play with both, by tying knots or by editing the code directly.

It's plain HTML, CSS and JavaScript with no build step and nothing to install, so GitHub Pages can serve the folder as-is.

## What's on the page

- **Opening screen:** the LAÇO title over the live visuals (two loops tied together), with *sign up* and *see the workshops* buttons.
- **Hanging tags (the knots):** tags hang on strings to the right of the title. **Tied means on**: drop one tag onto another to tie them, and pull them apart to untie.
  - `DRUMS` and `MELODY` are the sound layers.
  - `JUX` (`.jux(rev)`) and `DEGRADE` (`.degradeBy(.7)`) change the sound.
  - `PIXELATE`, `NOISE` (`.modulate(noise(3), .1)`) and `KALEID` (`.kaleid(5)`) change the visuals.
- **The wind:** the strings swing with the drums. Every 8 bars the wind ties or unties a tag by itself, so the page keeps changing even when nobody touches it. It never silences both drums and melody, and it waits 10 seconds after anyone touches a tag.
- **The loop:** a box that shows the code playing right now, for example `stack(drums, melody).jux(rev)` and `src(o0).kaleid(5).out()`. People who don't read code can still see what each tag does.
- **About, sign up and workshops:** the sections below the opening screen, tied together with ropes that flash on each drum hit. Each workshop has its own sound and visuals scene ("play this scene").
- **Start sound / edit the code:** two buttons in the bottom-right corner. The code panel lets anyone edit the Strudel and Hydra code. Ctrl/⌘+Enter runs it and Ctrl+. stops it.

Visitors whose system asks for reduced motion get a still version: no swaying, no wind, no drifting boxes.

## Run it locally

You only need Python 3, which macOS already has. No virtual environment or packages are needed, because the server below is part of Python itself.

```sh
cd laco-code-to-share
python3 -m http.server 8000
```

Open http://localhost:8000.

- Opening `index.html` straight from disk won't work: the page and the Hydra iframe talk through `postMessage`, which needs a real web address.
- After changing files, reload with **Cmd+Shift+R** so the browser doesn't show an old copy.
- Sound starts only after a click on **start sound**, because browsers block audio until then.

## Edit the text

Almost everything is in **[js/content.js](js/content.js)**:

- `series`: title, tagline, dates, venue, about text, what to bring, sign-up link, contact and social links.
- `intro`: the sound and visuals scene of the opening screen.
- `workshops`: one entry per workshop, each with its own `scene`.

Placeholders are written `[LIKE THIS]`. Also update the `<title>` and the two `description` tags at the top of [index.html](index.html); link previews use them.

## Write a scene

Each scene has `strudel` code (sound) and `hydra` code (visuals).

**Strudel:** wrap layers in `drums(…)` and `melody(…)` so the tags can switch them on and off and add effects. Drum hits also pulse the visuals.

```js
stack(
  drums(s("bd*4, [~ hh]*4, ~ cp")),
  melody(n("0 .. 7").scale("D:dorian").s("triangle").gain(.4))
)
```

Samples come from [tidalcycles/dirt-samples](https://github.com/tidalcycles/Dirt-Samples) (`bd`, `sd`, `hh`, `cp`, `arpy`, `808bd`, …). The built-in synths are `sine`, `square`, `triangle` and `sawtooth`.

**Hydra:** three extra values are available:

| value | what it is |
|---|---|
| `pulse` | 0–1, jumps on each drum hit and fades out |
| `pointer.x`, `pointer.y` | 0–1, mouse or touch position |

```js
osc(10, 0.1, () => pulse * 2).kaleid(4).rotate(() => pointer.x).out()
```

Don't use output `o3` in scenes; the tags use it for their visual effects.

## Comparing the three button versions (temporary)

While the design is being decided, the "compare buttons" box at the top right switches between three versions of the controls. Each one can also be opened with a link:

| link | version |
|---|---|
| `?toys=knots` | hanging tags on strings (described above), the current favourite |
| `?toys=code` | code fragments that you drag into "the loop" |
| `?toys=orbits` | drums and melody as dots going round two linked loops |

Once one is chosen, the other two (`js/toys/fragments.js`, `js/toys/orbits.js`) and the switcher can be removed.

## Publish on GitHub Pages

1. In this repository, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then `main` and `/ (root)`, and save.
3. After a minute the site is at **https://uandhafb.github.io/laco-code-to-share/**.

This repository is **private**. GitHub Pages for private repositories needs a paid plan (GitHub Pro, or GitHub Education's free Pro). Otherwise, make the repository public first.

`.nojekyll` tells GitHub Pages to serve the files exactly as they are.

## How it's put together

| file | role |
|---|---|
| `index.html` | page structure, the tied sections, the code panel |
| `hydra.html` | Hydra in its own iframe, because its names (`osc`, `noise`, …) clash with Strudel's |
| `css/style.css` | all the styling |
| `js/content.js` | the text and the scenes (edit this one) |
| `js/sound.js` | Strudel setup, start/stop, tempo, the `drums()` / `melody()` helpers |
| `js/visuals.js` | sends code, drum pulses and the pointer to the Hydra iframe |
| `js/editor.js` | the "edit the code" panel |
| `js/toys.js` | the version switcher and shared drag helpers |
| `js/toys/knots.js` | the hanging tags, the wind and the loop |
| `js/toys/fragments.js`, `js/toys/orbits.js` | the two other versions being compared |
| `js/tied.js` | the ropes between about, sign up and the workshops |
| `js/main.js` | fills the page from `content.js` and connects everything |

Strudel (`@strudel/web@1.3.0`) and Hydra (`hydra-synth@1.4.0`) load from unpkg with integrity hashes. To upgrade one, change the version in its URL and update the `integrity` value.

## Credits

Made with [Strudel](https://strudel.cc) and [Hydra](https://hydra.ojack.xyz) (both AGPL-3.0). Inspired by [strudel-pie](https://github.com/vigliensoni/strudel-pie) by Gabriel Vigliensoni.

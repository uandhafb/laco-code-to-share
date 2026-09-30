# LAÇO: code to share

The website for **LAÇO**, a series of free live coding workshops for all levels at the Visualization Studio, Webster Library, Concordia University (2026.2027).

**Live site: https://uandhafb.github.io/laco-code-to-share/**

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
- **Registration form:** in the sign-up box. People choose to take part as an **attendee**, **performer** and/or **presenter**. Performers and presenters get a follow-up box to describe their performance or presentation (languages, tools, length). The answers go to a Google Form (see [Registration form](#registration-form)).
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

## Registration form

The form on the site is styled like the rest of the page, and its answers go to a **Google Form that you own**. You get every registration in a Google Sheet, plus an email when a new one arrives.

The form's texts (intro, the "we're reviewing registrations" note, role descriptions, thank-you message) are in `series.signup` in [js/content.js](js/content.js).

### Connect it (once)

1. Go to [forms.google.com](https://forms.google.com) and create a blank form, for example **"LAÇO — registration"**. As its description, you can paste: *We're reviewing registrations as they come in and will fill the workshops accordingly. We'll email you to confirm your place.*
2. Add these seven questions, **in this order**:

   | # | question | type | required |
   |---|---|---|---|
   | 1 | Name | Short answer | yes |
   | 2 | Email | Short answer | yes |
   | 3 | I'd like to take part as | Checkboxes, with the options **Attendee**, **Performer**, **Presenter** (in that order) | yes |
   | 4 | Which workshops would you like to join? | Checkboxes, one option per workshop: **Workshop 01**, **Workshop 02**, **Workshop 03**, **Workshop 04** (same order as the site) | no |
   | 5 | About your performance | Paragraph | no |
   | 6 | About your presentation | Paragraph | no |
   | 7 | Anything else? (questions, ideas, access needs) | Paragraph | no |

   Don't add "response validation"; the site already checks the answers.
3. In **Settings → Responses**, set **Collect email addresses** to *Do not collect*, and leave **Limit to 1 response** off. Both would make Google ask people to sign in, which blocks answers coming from the site.
4. In the **Responses** tab, click **Link to Sheets** to get a spreadsheet. Then open **⋮ → Get email notifications for new responses**.
5. Click **⋮** (top right) → **Get pre-filled link**. Type `NAME`, `EMAIL`, tick **all** the role options and **all** the workshop options, type `PERF`, `PRES` and `NOTE`, click **Get link**, then **Copy link**.
6. Paste that link into `series.signup.google.prefilled` in [js/content.js](js/content.js), replacing `[PASTE THE GOOGLE FORM PRE-FILLED LINK HERE]`.
7. Send one test registration from the site and check that it appears in the form's **Responses** tab.

Until step 6 is done, the form says it isn't connected yet instead of sending.

The workshops question (4) is optional in the Google Form: without it, the site writes the attendee's choice at the start of the "anything else?" answer instead. If you add or remove a workshop on the site, add or remove its option in the Google Form too, and paste a new pre-filled link.

Google's notification email only says that a new response arrived; the answers themselves are in the Sheet. If you'd like every answer written out in the email, a short Google Apps Script can do that.

## The live site

**https://uandhafb.github.io/laco-code-to-share/**

GitHub Pages publishes the `main` branch (folder `/ (root)`, set in **Settings → Pages**). Every push to `main` updates the live site in about a minute.

`.nojekyll` tells GitHub Pages to serve the files exactly as they are.

### After changing files

The links to the CSS and scripts in `index.html` end in `?v=…` (for example `js/content.js?v=20260930a`). GitHub Pages lets browsers keep files for 10 minutes, so **change that version text on every update** (for example to today's date plus a letter). Then visitors get the new files straight away instead of an old saved copy.

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
| `js/toys.js` | starts the knots, and shared drag helpers |
| `js/toys/knots.js` | the hanging tags, the wind and the loop |
| `js/tied.js` | the ropes between about, sign up and the workshops |
| `js/signup.js` | the registration form: follow-up questions, checks, sending to Google Forms |
| `js/main.js` | fills the page from `content.js` and connects everything |

Strudel (`@strudel/web@1.3.0`) and Hydra (`hydra-synth@1.4.0`) load from unpkg with integrity hashes. To upgrade one, change the version in its URL and update the `integrity` value.

## Credits

Made with [Strudel](https://strudel.cc) and [Hydra](https://hydra.ojack.xyz) (both AGPL-3.0). Inspired by [strudel-pie](https://github.com/vigliensoni/strudel-pie) by Gabriel Vigliensoni.

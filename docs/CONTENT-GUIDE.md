# Content guide

How to add or edit site content without touching component code. All of
it lives in `data/`.

## Adding or editing a project (`data/projects.js`)

`PROJECTS` is an ordered array — order matters twice over: it's the grid
order on the home page, **and** the first four entries become the hero
slideshow (`components/Hero.js`, `SLIDES = PROJECTS.slice(0, 4)`). Adding
a new "flagship" project at the top pushes the previous 4th slide out of
the hero automatically.

Each entry:

```js
{
  id: 'kramer',                 // unique, used as React key + PROJECTS lookup in nav
  title: 'Restaurant Kramer - Light That Fire',
  type: 'Hospitality',          // shown as the small label on the tile + detail meta row
  place: 'Berlin-Neukölln, DE',
  year: '2026',
  splats: '2M',                 // shown in the detail page's spec row
  area: '160 m²',
  capture: '3 hr · 677 Photos',
  url: 'https://gospl.io/tours/space_kramer/',  // omit entirely for "coming soon" projects
  img: `${BASE}/assets/projects/kramer.jpg`,     // tile + hero background
  lead: 'Mixology and Fine Dining cooked over open fire in Neukölln,',
  body: [
    'First paragraph...',
    'Second paragraph, can include [markdown-style links](https://example.com).',
  ],
}
```

- **`url` is the switch that turns a project from "static preview" to
  "live tour."** Leave it out (don't set it to `''` or `null` — omit the
  key) to get the "Coming soon" badge and no tour button/iframe; see
  `components/Detail.js` and the Solar Eclipse Tempelhof entry for a
  worked "coming soon" example, including putting "COMING SOON!" in the
  `title` itself (there's no separate "status" field — the convention is
  to say it in the title).
- **`img` must be prefixed with `${BASE}`** (the module-level
  `const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''`) — a bare
  `/assets/...` path breaks on the GitHub Pages preview. Drop the actual
  file in `public/assets/projects/`.
- **`body` is an array of paragraphs**, not a single string with `\n` —
  each entry renders as its own `<p>`. Inline links use
  `[visible text](https://...)` and are parsed by `components/Detail.js`'s
  `renderBodyLinks`; only `http(s)://` URLs match.
- Removing a project's `url` later (e.g. a tour goes offline) is enough
  by itself to flip it back to "coming soon" styling — no other field
  needs to change, and `data/stats.js`'s "tours live" count updates
  automatically (see below).

## Stats (`data/stats.js`)

```js
export const STATS = [
  { value: '74M+', label: 'Splats rendered' },
  { value: `${PROJECTS.filter((p) => p.url).length}+`, label: 'Tours live' },
  { value: '3+', label: 'Countries' },
]
```

Only the middle entry is derived; the other two are hand-maintained
strings and won't update themselves — if total splat count or country
count changes, edit those literals directly.

## Process steps (`data/process.js`)

Four `{ num, title, body }` entries rendered as the numbered columns
under "About GoSPL". `num` is a display string (`'01'`, `'02'`, ...), not
used for sorting — array order is display order. Adding or removing a
step changes the grid's column count in CSS too (`.process` is
`grid-template-columns: repeat(4,1fr)` on desktop) — see
`components/ProcessSteps.js` / `DESIGN-SYSTEM.md`'s breakpoint table if
you change the count away from 4.

## Legal / static pages

`app/imprint/`, `app/impressum/`, `app/privacy-policy/`,
`app/datenschutz/`, `app/accessibility/`, `app/barrierefreiheit/` are
plain JSX, not data-driven — edit the page file directly. Each
English/German pair cross-links to its counterpart (`legal-lang` link) —
**update both files together**, since nothing enforces the pairing in
code; a change made to only one side leaves the language switcher
pointing at stale content on the other. `.legal-updated` timestamps
("Last updated: ...") are hand-typed strings — bump them when the
content actually changes, since nothing does this automatically.

# GoSPL — gospl.io

GoSPL's marketing site plus the interactive gaussian-splat tour system it
links out to. Two mostly-independent parts share this one repo:

1. **The marketing site** (`app/`, `components/`, `data/`, `public/`) — a
   statically-exported Next.js site: home page, work grid, project detail
   pages, and legal/contact pages.
2. **The tour player system** (`player/`, `admin/`, `content/`, `tools/`) —
   a single shared PlayCanvas/SuperSplat viewer that renders every gaussian-
   splat "step inside the space" tour linked from the marketing site's work
   grid. See `player/README.md` for how it works, `admin/README.md` for the
   password-protected authoring copy, and `handover.md` for a full
   implementation deep-dive (physics, hotspots, collision, debug mode, and
   more).

## Marketing site

Next.js 16 (App Router), React 19, Tailwind 4, exported as a fully static
site (`output: 'export'` in `next.config.mjs` — no Node server at runtime).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export
npm run lint
```

- `app/` — pages: home (`page.js`), legal/contact pages, `not-found.js`.
- `components/` — shared UI (`Header`, `Footer`, `Hero`, `WorkGrid`,
  `Detail`, `ContactForm`, etc.).
- `data/projects.js` — the portfolio/work content: one entry per project,
  each with a `url` pointing at its tour (or an external link). Body
  paragraphs support `[text](url)` markdown-style links, rendered as real
  links in `Detail.js`.
- `public/assets/` — images copied as-is into the export.

## Tour player system

A tour is just a folder of data files under `content/<slug>/`; the same
`player/` code renders all of them, updated once and applied everywhere.
`admin/` is a password-gated copy with an in-browser authoring overlay for
placing hotspots and tuning tours without touching JSON by hand. Full
details, adding a new tour, and local dev instructions live in
`player/README.md` and `admin/README.md`.

## Deployment

`gospl.io` is on fixed shared hosting with no control over Apache's
DocumentRoot, so the whole site — this Next.js app's build output plus
`player/`, `admin/`, and `content/` — is deployed into one
`public_html/SITE/` folder, and the root `.htaccess` (hand-maintained on
the server, not tracked in this repo) transparently rewrites requests into
`SITE/`, so the site still appears at `gospl.io/...` root URLs. A handful
of unrelated legacy client-project folders also live at `public_html`
root, untouched and excluded from that rewrite.

Because of this, the production build must use root-relative asset paths:
`next.config.mjs` defaults `basePath` to `''` when `NODE_ENV=production`
(overridable via a `NEXT_BASE_PATH` env var). The build output location is
controlled by `NEXT_DIST_DIR` (default: `~/Desktop/BUILD`, outside the
repo) — on Windows, Turbopack refuses a `distDir` outside the project
folder, so use e.g. `NEXT_DIST_DIR=build` (already gitignored) instead.

A separate GitHub Pages preview (`.github/workflows/deploy.yml`) auto-
deploys `main` on every push, with `NEXT_BASE_PATH=/GoSPL.Website` and
`NEXT_DIST_DIR=out` — unrelated to and independent from the live
`gospl.io` deployment described above.

## Source of truth

This repo is the sole source of truth for `player/`/`admin/`/`content/`/
`tools/` — see `handover.md` for why (a separate `PLAY` repo held a
drifted copy and should no longer be deployed from).

# GoSPL — gospl.io

GoSPL's marketing site (`app/`, `components/`, `data/`, `public/`) — a
statically-exported Next.js site: home page, work grid, project detail
pages, and legal/contact pages.

The interactive gaussian-splat tours it links out to — the shared player,
its `admin/` authoring copy, and every tour's `content/<slug>/` — live in
[`jwkoenig/PLAY`](https://github.com/jwkoenig/PLAY), which is their single
source of truth. Deploys combine the two repos; see
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Documentation

Full documentation — architecture, the design system and its
responsive-behavior rules, component reference, content-editing guide,
deployment process, and a registry of easy-to-accidentally-revert
features — lives in [`docs/`](./docs/README.md). Start there for anything
beyond a quick orientation.

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
- `app/layout.js` — site-wide `<title>`/description metadata (currently
  "GoSPL - Photoreal by Nature, Interactive by Choice").

Recent content edits: removed the manual pause button from the hero
slideshow (`components/Hero.js`, `app/globals.css` — hover-to-pause still
works), updated the XOIO Mountain Chalet tour link, and flagged the Solar
Eclipse Tempelhof project as "COMING SOON!" in its title.

## Tour player system

A tour is a folder of data files under `content/<slug>/` in the PLAY repo;
the marketing site only links to it (`url` in `data/projects.js`).

## Deployment

`gospl.io` is on fixed shared hosting with no control over Apache's
DocumentRoot, so the whole site — this Next.js app's build output plus
PLAY's `player/`, `admin/`, and `content/` — is deployed into one
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

`player/`, `admin/`, `icons/`, `tools/` and all tour `content/` live only in
`jwkoenig/PLAY`. This repo used to carry its own copy; it drifted from PLAY
in both directions and was removed. Add tours and player changes in PLAY.

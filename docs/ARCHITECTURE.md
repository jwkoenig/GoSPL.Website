# Architecture

## Two mostly-independent systems, one repo

| | Marketing site | Tour player system |
|---|---|---|
| Folders | `app/`, `components/`, `data/`, `public/` | `player/`, `admin/`, `content/`, `tools/` |
| Stack | Next.js 16 (App Router), React 19, Tailwind 4 | Hand-bundled PlayCanvas + SuperSplat viewer, no build step |
| Ships as | Static export (`output: 'export'`) | Static files, edited in place |
| Docs | This `docs/` folder | `player/README.md`, `admin/README.md`, `handover.md` — see [`TOUR-PLAYER-SYSTEM.md`](./TOUR-PLAYER-SYSTEM.md) |

They meet at exactly one seam: a project in `data/projects.js` has a
`url` that points at a tour served by the player system (e.g.
`https://gospl.io/tours/space_kramer/`), and `components/Detail.js`
embeds that URL in an `<iframe>` plus links to it directly via the "Open
full tour" button. Nothing else couples the two systems — you can work
on either without touching the other.

## Marketing site — pages and routing

Next.js App Router, one folder per route under `app/`:

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.js` | Client component; owns the open/close state for the project `Detail` overlay |
| `/contact/` | `app/contact/page.js` | Renders `ContactForm` |
| `/imprint/`, `/impressum/` | `app/imprint/page.js`, `app/impressum/page.js` | English / German (`lang="de"`) legal pages, cross-linked to each other |
| `/privacy-policy/`, `/datenschutz/` | same pattern | |
| `/accessibility/`, `/barrierefreiheit/` | same pattern | BFSG/EN 301 549 accessibility statement |
| any unmatched path | `app/not-found.js` | |

`app/layout.js` is the shared shell: loads the Inter font, sets the
site-wide `<title>`/description, renders `<Header>`/`<Footer>` around
`{children}`, and adds the accessibility skip-link. Per-page `metadata`
exports override the `<title>` (see any `app/*/page.js`).

There is no server and no API routes — `next.config.mjs` sets
`output: 'export'`, so every route above is pre-rendered to static HTML
at build time. Treat any code that assumes a Node runtime (server
actions, dynamic API routes, `next/image` optimization) as unavailable.

## Data-driven content model

Nothing in `app/` or `components/` hardcodes project copy. Content lives
in `data/`:

- `data/projects.js` — the work grid + detail pages (see [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md))
- `data/stats.js` — the three numbers in the stats band; one is *derived*
  (`PROJECTS.filter(p => p.url).length`), so "tours live" updates itself
  when a project gets or loses a `url`
- `data/process.js` — the four-step "Capture / Reconstruct / Author /
  Deliver" list on the About section

Editing a project, stat, or process step is a `data/` change only — no
JSX or CSS needed for the common case.

## Path handling: `NEXT_PUBLIC_BASEPATH`

The site is deployed under different base paths depending on target
(see [`DEPLOYMENT.md`](./DEPLOYMENT.md)): root (`''`) on production,
`/GoSPL.Website` on the GitHub Pages preview. Any component that builds
an asset URL by hand reads `process.env.NEXT_PUBLIC_BASEPATH` and
prefixes it — search `const BASE = process.env.NEXT_PUBLIC_BASEPATH` for
every place this matters (`Header`, `Hero`, `Footer`, `CtaBand`,
`Detail`, every legal page). **A new component that hardcodes `/assets/...`
or `/contact/` instead of `${BASE}/...` will render fine on production
(where `BASE` is empty) but 404 on the GitHub Pages preview** — this is
the kind of thing that looks fine locally and in prod, then quietly
breaks only on the preview deploy.

## Module aliasing

`jsconfig.json` maps `@/*` to the repo root, so `@/components/Hero` and
`@/data/projects` resolve without relative-path climbing. Use it for any
new file under `app/`, `components/`, or `data/`.

## Tooling

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → $NEXT_DIST_DIR (default ~/Desktop/BUILD, outside the repo)
npm run lint      # eslint.config.mjs (flat config, extends eslint-config-next)
```

No test suite exists for the marketing site. Verifying a change means:
`npm run build` succeeds, `npm run lint` is clean, and a manual check in
the browser at both a desktop and a sub-640px viewport (see
[`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) for why 640px specifically).

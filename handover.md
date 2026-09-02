# GoSPL Portfolio — Handover

Rebuild of the GoSPL portfolio site in `WEBSITE/CODE`, replacing the old prototype at
`Dropbox/GoSPL.BRAND/WEBSITE/PROTOTYPE_OLD/gospl-portfolio`. Same interaction mechanism,
new visual design based on screenshots in `WEBSITE/INPUT COLLECTION`, restyled to match a
provided Figma type scale.

## Stack

- Next.js 16 (App Router), static export (`output: 'export'`)
- Plain JavaScript, no TypeScript
- Tailwind v4 (`@import "tailwindcss"` in `app/globals.css`) + hand-written component classes
- Font: Inter only (`next/font/google`, weights 400/500/600/700)
- `next.config.mjs`: `basePath` is `''` in dev, `'/BETA'` in production build — `npm run dev`
  serves at plain `localhost:3000`, `npm run build` produces an export meant for a `/BETA`
  subfolder on IONOS. `trailingSlash: true` is set (links use `/contact/` style).
- **Gotcha:** `/BETA` basePath is only applied to JS `<img src>` (via `NEXT_PUBLIC_BASEPATH`),
  not to raw CSS `url()` — always reference `public/assets/*` from JS, never from `globals.css`.
- `next.config.mjs` also has `distDir`, overridden to `~/Desktop/BUILD` in production so the
  static export lands outside the Dropbox-synced project folder (avoids Dropbox re-syncing
  thousands of build artifacts on every rebuild). Both `basePath` and `distDir` are now
  overridable via env vars (`NEXT_BASE_PATH`, `NEXT_DIST_DIR`) — see Deployment below for why.

## Deployment (Session 4)

Two independent build targets now read the same `next.config.mjs`, distinguished by env vars:

- **Manual/IONOS** (unchanged): plain `npm run build` → `basePath: /BETA`,
  `distDir: ~/Desktop/BUILD`. Still the default when no env vars are set.
- **GitHub Pages** (new, `.github/workflows/deploy.yml`): triggers on every push to `main`
  (or manual dispatch). Runs `npm ci && npm run build` with `NEXT_BASE_PATH=/GoSPL.Website`
  and `NEXT_DIST_DIR=out`, then `actions/upload-pages-artifact` + `actions/deploy-pages`.
  Live at **https://jwkoenig.github.io/GoSPL.Website/**. Repo Settings → Pages → Source is
  set to "GitHub Actions" (required — the workflow can't deploy otherwise).
  - **Gotcha #1 (hit and fixed this session):** a workflow file only runs for events on the
    branch that has it committed. The workflow lived only on a feature branch for a while —
    zero runs, zero deploys, 404 on the live URL — until it was merged into `main`.
  - **Gotcha #2 (hit and fixed this session):** merging in unrelated work brought the
    `~/Desktop/BUILD` `distDir` override onto `main`. Left unhandled, the CI build would
    silently write output somewhere other than `./out`, and `upload-pages-artifact` would
    have nothing to upload. Fixed by making `distDir` env-overridable (`NEXT_DIST_DIR=out`
    in the workflow) — verify this still resolves correctly if `next.config.mjs` changes.
  - This sandbox's network egress blocks `*.github.io` entirely, so the live URL can't be
    curled/fetched from here — verify deploys via the Actions API
    (`mcp__github__actions_get` / `list_workflow_jobs`) instead, or ask the user to confirm.

## Structure

```
style_overview.html   — repo root, standalone (not part of the Next.js app). Live-rendered
                        catalog of every named text/component style site-wide, in a tabular
                        settings view. Embeds a hand-copied subset of globals.css's rules for
                        pixel-accurate previews — NOT auto-synced, so if a component class in
                        globals.css changes, update the matching rule in this file's <style>
                        block by hand or the preview will silently drift from the real site.
app/
  page.js            — home: Hero, Stats, WorkGrid, AboutTeaser, CtaBand, Detail overlay
  layout.js           — Inter font, <Header/>, <Footer/>
  contact/page.js      — ContactForm.js (components/) below the page headline + big-mail link
  accessibility/, barrierefreiheit/page.js — BFSG/EN 301 549 accessibility statement (DE/EN)
  impressum/, datenschutz/page.js — real German legal copy (Impressum / Datenschutzerklärung),
                        each with an "English version →" link to the /imprint/ /
                        /privacy-policy/ counterpart
  imprint/, privacy-policy/page.js — English translations of the above, with a
                        "Deutsche Version →" link back; International English, not a
                        certified legal translation — German pages remain the controlling text
  not-found.js         — branded 404
  globals.css           — all design tokens + component classes
components/
  Header.js   — fixed topbar, transparent-over-hero → solid-on-scroll, Work/About/Contact links
  Footer.js   — dark footer, Studio/Enquiries/Elsewhere/Legal columns (sentence case, not caps)
  Hero.js     — full-bleed carousel, fixed `height: 800px`. `.hero-stack` (title + subtext +
                CTA + dot-nav) is one centered flex column, `padding: 80px 0`. Dots are
                `<img>`s (`Line 1.png` active / `Line 2.png` inactive — filenames have a
                space, reference as `Line%201.png`/`Line%202.png`). "Take a tour" is a
                white-glass pill (`rgba(255,255,255,.2)` fill, 2px white border,
                `min-width:200px; min-height:48px`) with `icon_arrow_r.png` as its arrow.
  Stats.js    — 3-stat strip, rendered between Hero and WorkGrid
  WorkGrid.js / Tile.js — "Selected work" grid, FLIP → Detail. No logo badge on tiles anymore
                (`.tile-badge` removed entirely, not just hidden — rebuild from scratch if
                it needs to come back).
  Detail.js   — full-screen project overlay (FLIP from tile, dark splash → tour iframe,
                persistent close + Prev/Next bar). Tour iframe pointer-events fixed so its
                own on-screen controls are clickable (`.detail-prevnext-bar` container is
                `pointer-events:none`, only the buttons themselves are `auto`). "Open full
                tour"/"Next project"/"Prev project" all use `icon_arrow_r.png` (Prev = same
                asset, `transform: scaleX(-1)`).
  AboutTeaser.js / ProcessSteps.js — "About GoSPL" + intro paragraph + 01–04 grid. Divider
                lines: connected cross at 4-col desktop and 2-col (≤820px); no lines at all,
                centered text, 48px gap at ≤480px single-column.
  CtaBand.js  — "Have a space to showcase?" + Contact us pill
  ContactForm.js — contact page form (name/email/message + honeypot field); submit/error/
                success states styled via `.form-*` classes in globals.css
data/
  projects.js — 6 projects; only kramer/xoiowwl/moto.jpg are real photos, rest reuse kramer.jpg
  stats.js, process.js
public/assets/
  logo/ — Logo/Symbol Black+White SVGs, sourced from `Dropbox/GoSPL.BRAND/Logo/` root files
          (Black.svg, White.svg, Default.svg=white symbol, Variant2.svg=black symbol — the
          `SS/` subfolder there is a stale older copy, don't pull from it).
  icon_arrow_r.png — white circle+chevron, 38×38px, used on every pill button site-wide.
  Line 1.png / Line 2.png — hero dot-nav graphics, 24×8px, space in filename (see gotcha above).
  projects/ — kramer.jpg, xoiowwl.jpg, moto.jpg
```

## Typography scale (from Figma, verified against computed styles)

| Style | Weight | Desktop | Mobile | Letter-spacing (desktop / mobile) | Line-height |
|---|---|---|---|---|---|
| XXL / "h1" | 700 | 90px | 50px | +1px / −1px | 110% |
| XL / "h2" | 700 | 60px | 32px | −1px / 0 | 110% / normal |
| L | 700 | 32px | 24px | −1px / 0 | 110% / normal |
| PTITLE (work-tile titles) | 700 | 24px flat | — | 0 | 110% |
| Text Large | 400 | 18px | — | 0 | 130% |
| Button | 400 | 16px | — | 0 | normal |
| XS Text (kickers/meta/labels) | 400 | 14px | — | +1px | normal |

Current assignments: Hero title + stat numbers + Detail project title = XXL. "Selected work" /
"Have a space to showcase?" = XL (already matched spec, no change needed). Tile titles =
PTITLE. Process step headings = L. "About GoSPL" heading is its own size ABOVE the XL scale
(`clamp(48px,6vw,72px)`), not shared with `.work-head h2`. Its intro paragraph is
`max-width: 70ch` — hand-tuned by iterating against a reference screenshot until word-wrap
matched exactly line-for-line; re-check if the copy itself ever changes.

## Known-good state / verified

- `out/` is git-ignored and not committed — it's a disposable build artifact, regenerated by
  `npm run build` (manual/IONOS) or by the GitHub Pages workflow on every push to `main` (see
  Deployment above). No need to keep a checked-in copy in sync.
- **Screenshots are not available to Claude in this environment** (`computer{screenshot}`
  errors, tab reports `document.visibilityState: "hidden"` so CSS transitions don't tick
  during automated checks). Verification here is computed-style / `getBoundingClientRect`
  checks via the Browser pane, plus user-supplied screenshots for anything visual.
  **Computed-style checks confirm a rule applied, not that the result looks right** — e.g. a
  divider-line bug (see changelog) had every individual border computed correctly, but a
  grid `column-gap` still broke the line visually. Ask the user for a screenshot when
  something "looks wrong" rather than re-asserting computed values are fine.
- When a "size"/"visibility" change seems to have no effect despite correct computed styles,
  check whether the element is actually the one providing visible pixels (background/border/
  child) before concluding the CSS didn't apply.

## Shelved / explicitly deferred

1. **EN/DE language switcher + bilingual CMS.** MySQL+PHP admin editor discussed (IONOS has
   MySQL, likely PHP). Open questions: PHP available on the plan? Build-time vs runtime
   content fetch? Auth model? Scope (marketing copy only vs project data)? User said
   "shelve for now."
2. **WYSIWYG editing for JS/JSX content.** Either TinaCMS (git-backed inline editing, ~half
   a day) or extend the `data/*.js` pattern (already used for `projects.js`) to cover the
   rest of the site's copy — zero new deps, not yet done.

## Editing legal pages (no tooling yet)

`app/impressum/`, `datenschutz/`, `imprint/`, `privacy-policy/page.js` — edit directly in
source until a CMS exists. The German pages are the source of truth; if their content
changes, the English translations under `imprint/`/`privacy-policy/` need to be updated by
hand to match (no sync mechanism). `.legal-lang` (in `globals.css`) is the small
"English version →" / "Deutsche Version →" link style used on all four pages.

`imprint/`/`impressum/` specifically (Session 4): body content is a `.legal-cols` two-column
CSS grid (`.legal-cols` in `globals.css`, collapses to one column ≤640px) — left column is the
Werbegrafik König address block + Contact/Kontakt email, right column is Responsible for
editorial content / Design + UX / Web Development credits, both `.legal-block`s. VAT ID and
the dispute-resolution notice stay in a separate full-width `.legal-block` below. The
bottom-of-page contact CTA is `.legal-contact` (not `.legal-back` — that class remains in use
on privacy-policy/accessibility/datenschutz/barrierefreiheit/not-found, which still have both
a contact link and a "← Back to home" link; imprint/impressum dropped the "Back to home" link
and restyled their contact link to `.legal-contact`, which intentionally reuses the `.pstep h3`
type scale (24px → 32px bold) so it reads as more prominent than the other legal pages' links).

## Open TODOs / not yet done

- English legal translations (`imprint/`, `privacy-policy/`) haven't had a lawyer's review —
  fine as a courtesy translation, but the German pages should stay the controlling text for
  compliance purposes until reviewed.
- Footer's "Legal" column still only links to `/impressum/` and `/datenschutz/` (German) —
  not updated to also surface the new English pages; left as-is since it wasn't asked for.
- Footer Instagram/LinkedIn links point to generic domains, not real profiles.
- Detail overlay's tour/prev/next pills kept their original smaller/opaque styling when
  their arrows were swapped to `icon_arrow_r.png` — not bumped to the 200×48/white-glass
  treatment used on the hero/CTA-band pills (wasn't asked for). Flag if consistency across
  all pill buttons becomes a goal.
- Everything in "Shelved" above.
- **Email address inconsistency (Session 4):** imprint/impressum's Contact/Kontakt email was
  changed to `studio@gospl.io`; `hannes@gospl.io` is still used everywhere else it appears
  (privacy-policy, datenschutz, accessibility, barrierefreiheit — and as the sample address in
  `style_overview.html`'s big-mail row). Wasn't asked to touch those, but flag if the intent
  was a site-wide switch rather than imprint/impressum specifically.

## Changelog (chronological)

**Session 1**
1. Re-enabled `<Stats />` in `app/page.js`.
2. `.topbar` bottom hairline added (white/12% transparent, black/10% solid state).
3. `.hero-scrim` simplified to a plain top→bottom black gradient.
4. `.tile-badge` background/border removed, then sized up to 65×65px (container AND img).
5. `.about-section h2` broken out to its own larger scale, above the shared XL rule.
6. `.about-section .wrap > p` restyled: darker text, 1.6 line-height, 64ch width.
7. `.detail-tour-frame` made interactive (`pointer-events:all`) — was inert before.
8. `.detail-splash.out` given `visibility:hidden` so it can't intercept clicks once dismissed.
9. Fixed the real Detail prev/next click-through bug (see Detail.js note above).
10. `npm run build` re-run to sync `out/`.

**Session 2**
1. Logo files replaced with updated versions from `GoSPL.BRAND/Logo/`.
2. Hero title bumped to XXL, now identical to `.stat .n`.
3. Hero + CTA-band pills: arrow glyph → `icon_arrow_r.png`, sized `min 200×48px`, `10px/16px`
   padding.
4. Hero dot-nav switched from CSS-only pills to `Line 1/2.png` images.
5. About paragraph tuned to an exact 3-line wrap (70ch); process-step dividers added.
6. Detail overlay's tour/prev/next buttons switched to the arrow-icon treatment.
7. Tile-badge (GoSPL mark on thumbnails) removed entirely.
8. Hero restructured into one `.hero-stack` (80px padding); CTA restyled to white-glass;
   "Selected work" paragraph line-broken before "No App."; footer headings de-capitalized
   (`#979797`/14px) and body text bumped to white/16px.
9. **Bug fix:** process-step top hairline was incorrectly still showing at the 2-col/1-col
   breakpoints — removed there, kept for 4-col desktop only.
10. **Bug fix:** the 2-col "cross" divider wasn't actually connecting — `column-gap:24px` was
    splitting the horizontal line into two segments that only met at one corner instead of
    crossing through the middle. Fixed by setting `gap:0` and moving the 24px spacing into
    `padding` on each column instead, so borders sit flush and touch exactly.
11. ≤480px (single column): all divider lines removed, text centered, 48px gap for rhythm.
12. `.hero` height changed from `100vh` (620–980px clamp) to a flat `800px`.

**Session 3**
1. Translated Impressum → `app/imprint/page.js` and Datenschutzerklärung →
   `app/privacy-policy/page.js` (International English; anchors/ToC ids kept identical to the
   German version's for internal consistency, even though nothing cross-links into them by id).
2. Added reciprocal language-switch links: German pages → "English version →", English pages
   → "Deutsche Version →". New `.legal-lang` class in `globals.css`.
3. Verified all four pages (`/impressum/`, `/datenschutz/`, `/imprint/`, `/privacy-policy/`)
   render correctly via the dev server (Browser pane text-content check; screenshots
   unavailable in this environment, see note above).

**Session 4** (Claude Code on the web / cloud session; this session's PRs merged straight to
`main`, which now auto-deploys — see Deployment above)

1. Merged in `contact-form-and-updates` (PR #1, not authored by this session): adds
   `ContactForm.js` + `app/contact/page.js` content, drops the phone number from contact info,
   fixes imprint markup, updates `data/projects.js`, adds `birfday.jpg`/`solareclipse.jpg`/
   `watch_jlc.jpg` to `public/assets/projects/`.
2. Added `.github/workflows/deploy.yml` (GitHub Pages CI deploy) and made `basePath`/`distDir`
   env-overridable in `next.config.mjs` — see Deployment section above for the two bugs hit
   and fixed (workflow-only-on-feature-branch; `distDir` override breaking the CI build) before
   the first successful deploy.
3. Imprint/Impressum content pass (PR #2, merged to `main`):
   - Dropped the "← Back to home" link; contact-form CTA restyled as `.legal-contact`
     (matches the `.pstep h3`/process-step type scale — 24px → 32px bold).
   - Reordered sections to Contact → Responsible for editorial content → Design + UX →
     Web Development → VAT ID → Consumer dispute resolution (both languages).
   - Added a new "Web Development" / "Web-Entwicklung" credit (Johannes Wolfgang König) below
     Design + UX.
   - Contact email on these two pages only: `hannes@gospl.io` → `studio@gospl.io` (see Open
     TODOs — not changed elsewhere).
   - Added `style_overview.html`, a standalone design-reference page (see Structure above).
4. Follow-up: restructured imprint/impressum's address+credits block into the `.legal-cols`
   two-column grid described under "Editing legal pages" above, pushed directly to `main`.
5. Minor housekeeping: untracked `.claude/scheduled_tasks.lock` (a per-session PID/start-time
   file that was tripping the repo's stop-hook git check with unrelated noise every session)
   and added it to `.gitignore`.

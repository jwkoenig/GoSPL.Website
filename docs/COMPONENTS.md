# Components

All components live in `components/` and are imported into `app/page.js`
(the home page) or individual `app/*/page.js` route files. Every
component below is a client component (`'use client'`) unless noted.

## `Header.js`

Fixed top bar, shared by every page via `app/layout.js`.

- **Transparent-over-hero on the home page, solid everywhere else.**
  `solid = !isHome || scrolled`. On `/`, it starts transparent (over the
  hero image) and becomes solid (`backdrop-filter: blur`) once
  `window.scrollY > 40`. On every other route it's solid from the start —
  there's no hero to sit transparently over.
- Swaps the logo SVG (`logo-black.svg` / `logo-white.svg`) to match,
  since the white logo is unreadable on a solid light bar.
- Mobile nav (`.burger` → `#nav-drawer`) is a controlled `open` boolean,
  not a `<details>`/native disclosure — see the 640px breakpoint note in
  [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md).
- All hrefs are prefixed with `NEXT_PUBLIC_BASEPATH` (`BASE` constant) —
  see [`ARCHITECTURE.md`](./ARCHITECTURE.md#path-handling-next_public_basepath).

## `Hero.js`

Full-bleed image crossfade on the home page only.

- `SLIDES = PROJECTS.slice(0, 4)` — the first four entries in
  `data/projects.js` become hero slides, in array order. Reordering the
  hero means reordering `PROJECTS`, not editing `Hero.js`.
- Auto-advances every 6s via `setInterval`, pauses on hover/focus, and
  never starts if `prefers-reduced-motion: reduce` — see the registry row
  in [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md#responsive--conditional-behavior-registry)
  for why there's no manual pause button.
- Title renders word-by-word with a staggered `animationDelay` (`.word`
  spans), which is also disabled under reduced motion.
- Dot navigation (`.hero-dots`) lets a visitor jump to a specific slide
  directly, independent of autoplay.

## `Stats.js`

Simple map over `data/stats.js` — three `{ value, label }` pairs. No
logic of its own; see [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md) for how
the "tours live" number is derived rather than hardcoded.

## `WorkGrid.js` / `Tile.js`

The project grid on the home page.

- `WorkGrid` sets up an `IntersectionObserver` (threshold 0.15) that adds
  an `.in` class to each tile as it scrolls into view, then
  `unobserve`s it — the fade/slide-up entrance animation is one-shot per
  page load, not re-triggered on scroll-back. Disabled under reduced
  motion (`.tile` transition/opacity forced off in `globals.css`).
- `Tile` is a `<button>`, not a link — clicking it calls `onOpen(project,
  boundingRect)` (passed down from `app/page.js`), which opens `Detail`
  as an overlay rather than navigating. The clicked tile's
  `getBoundingClientRect()` is what lets `Detail` animate outward from
  the tile's exact screen position (see below).

## `Detail.js`

The full-screen project overlay — the most stateful component on the
site. Opened from a `Tile` click, closed via its own close button, `Esc`,
or navigated via the prev/next bar.

**Open/close choreography** (`phase`: `'in' → 'open' → 'closing'`):
1. Mounts pinned to the clicked tile's exact `originRect` (a small
   image clone, `.detail-clone`).
2. ~20ms later, `phase` flips to `'open'` and CSS transitions the clone
   to fill the viewport.
3. `INNER_DELAY_MS` (120ms) after that, `innerOn` flips true, revealing
   the splash text, close button, and prev/next bar (`OPEN_MS` = 700ms
   total budget for the animation, used again on close).
4. Closing reverses this and calls the parent's `onClose` after `OPEN_MS`.

**Focus management**: remembers `document.activeElement` on mount and
restores it on unmount (so closing returns focus to the tile that opened
it), moves focus into the dialog's close button once `innerOn` is true,
and implements a manual Tab-trap in `handleKeyDown` scoped to elements
matching `FOCUSABLE` that are actually visible (`offsetParent !== null`)
— see the last row of the registry table in `DESIGN-SYSTEM.md` for why
that visibility check matters.

**Content branches on `project.url`:**
- Present → renders the tour in an `<iframe>` as the hero background,
  plus the "Open full tour" link/button (hidden on mobile — see
  `DESIGN-SYSTEM.md`).
- Absent → renders `project.img` as a static background, a "Coming soon"
  badge, and "Click to view" instead of the tour button.

**Body copy** supports inline `[text](url)` markdown-style links
(`renderBodyLinks`, matched by `LINK_RE`) — the only markdown-like syntax
supported anywhere in the site's content; see `data/projects.js`'s
`watch` entry for a real example.

## `AboutTeaser.js` / `ProcessSteps.js`

`AboutTeaser` is the static "About GoSPL" copy block plus `ProcessSteps`,
which maps `data/process.js` into the four numbered `.pstep` columns.

## `CtaBand.js`

One static "Have a space to showcase?" band linking to `/contact/`.
No dynamic content.

## `Footer.js`

Site-wide footer (rendered in `app/layout.js`, so on every page). Mostly
static link columns; only `foot-bottom`'s copyright year is computed
(`new Date().getFullYear()`).

## `ContactForm.js`

Client-side form posting directly to [Web3Forms](https://web3forms.com/)
(`api.web3forms.com/submit`) — there is no backend of this site's own,
consistent with the static export. Two independent spam defenses, **both
required, don't remove one thinking the other covers it**:

1. A hidden honeypot checkbox (`botcheck`) — bots that blindly fill every
   field trip it; humans never see it (`.form-honeypot` visually hides
   it, `aria-hidden` keeps screen readers from seeing it, `tabIndex={-1}`
   keeps keyboard users from tabbing into it).
2. A simple generated math captcha (`makeCaptcha`, e.g. "3 + 5 = ?"),
   regenerated on each failed/successful submit so it can't be replayed.

`status` state (`idle | submitting | success | error`) drives which UI
renders; on `success` the whole form is replaced by a thank-you message
rather than reset in place.

The Web3Forms access key is a public client-side key by that service's
design (it identifies the form, not a secret credential) — this is
expected to be visible in the bundled JS.

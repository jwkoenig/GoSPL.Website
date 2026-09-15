# Design system

Source of truth for all of this: `app/globals.css`. This document explains
the *conventions* behind that file so new CSS follows the same patterns
instead of inventing new ones, and — in the last section — tracks every
place where layout or a feature intentionally differs by screen size,
which is exactly the kind of rule that gets silently lost in a future
edit if it isn't written down somewhere other than the CSS itself.

`style_overview.html` at the repo root is a standalone, browser-openable
visual preview of these tokens and text styles, copied verbatim from
`globals.css`. Open it directly in a browser to eyeball type/color
changes without running the Next.js dev server. **Keep it in sync**: if
you change a token or a named text style in `globals.css`, copy the same
change into `style_overview.html`'s `<style>` block (comment at the top
of that block says the same thing).

## Tokens

Defined once in `:root` in `app/globals.css`, also exposed to Tailwind
via `@theme inline` as `bg-paper`, `text-ink`, etc.:

| Token | Value | Use |
|---|---|---|
| `--font-sans` | `'Inter', sans-serif` | The only typeface on the site. Loaded via `next/font/google` in `app/layout.js` (weights 400/500/600/700), so no separate `<link>` needed on marketing-site pages. |
| `--paper` | `#ffffff` | Default page background |
| `--paper-2` | `#f6f6f4` | Slightly-off-white section background (Work section, CTA band) — used to visually separate a section from plain `--paper` sections without a hard border |
| `--ink` | `#0b0b0c` | Primary text / dark UI surfaces |
| `--ink-2` | `#6c6c72` | Secondary text (subheads, muted copy) |
| `--ink-3` | `#74747a` | Tertiary text (labels, numbers, kickers) — very close to `--ink-2`, used where something should read as even quieter |
| `--line` / `--line-soft` | `rgba(12,12,14,0.12)` / `0.07` | Hairline borders/dividers, two opacities for "visible divider" vs "barely-there divider" |
| `--maxw` | `1280px` | Max content width, applied via `.wrap` |
| `--gutter` | `clamp(20px, 5vw, 64px)` | Side padding, applied via `.wrap` — scales with viewport instead of jumping at a breakpoint |

Don't introduce new hex/rgba color literals in component CSS — extend the
token list in `:root` instead so light/dark or rebrand changes stay a
one-file edit.

## Typography pattern

Every large heading in this codebase follows the same two-step rule:
a smaller, tighter mobile size by default, then a `min-width: 641px`
media query that swaps in a `clamp()`-based fluid size with a small
negative letter-spacing. Example (`.hero-title`):

```css
.hero-title { font-size: 50px; letter-spacing: -1px; line-height: 1.1; }
@media (min-width: 641px) {
  .hero-title { font-size: clamp(60px, 6vw, 90px); letter-spacing: 1px; }
}
```

The same shape repeats for `.stat .n`, `.work-head h2`, `.about-section
h2`, `.pstep h3`, `.detail-splash-inner h1`, `.contact-wrap h1`,
`.legal-title`, `.cta-band h2`, `.about-hero h1`. **When adding a new
large heading, copy this pattern rather than picking an arbitrary size** —
it's what keeps the whole site's headings feeling like one type scale
instead of several.

Body/secondary text conventions:

- `.kicker` — 14px, uppercase, 1px letter-spacing, `--ink-2` — the small
  eyebrow label style (used above legal page titles, etc.)
- Lead/intro paragraphs (`.hero-sub`, `.work-head p`, `.detail-splash-lead`)
  sit around 18–19px with a tight 1.3–1.5 line-height and a `ch`-based
  `max-width` to keep measure readable regardless of container width.
- Muted/secondary body copy (`.detail-splash-body`, `.legal-block p`,
  `.pstep p`) uses `--ink-2` (or its white-background equivalent
  `rgba(255,255,255,0.6)`) at 14–16px with a looser 1.6–1.75 line-height.

## Spacing rhythm

Section-level vertical padding is never a fixed pixel value — it's
`clamp(min, Nvh, max)`, e.g. `clamp(64px,10vh,110px)` for `.work-section`,
`.about-section`, `.cta-band`, or `clamp(40px,7vh,72px)` for `.stats`.
This scales padding with viewport height so short/tall viewports both
feel right without a breakpoint jump. Match the existing clamp shape
(roughly `min ≈ 0.6×max`, mid value in `vh`) when adding a new full-width
section rather than hardcoding `padding: 80px 0`.

## Breakpoints

The site has no formal breakpoint scale — media queries are written
per-component at the size where that component's layout actually breaks.
In practice these values recur:

| Breakpoint | Meaning in this codebase |
|---|---|
| `max-width: 480px` | Smallest phones — process steps collapse to 1 column |
| `max-width: 560px` | Work grid collapses to 1 column |
| `max-width: 640px` / `min-width: 641px` | **The primary mobile/desktop split.** Nav collapses to the burger menu, heading sizes step down, the "Open full tour" button hides (see registry below) |
| `max-width: 720px` | Footer columns go from 4 to 2 |
| `max-width: 820px` | Process steps go from 4 to 2 columns; About page grid stacks |
| `max-width: 900px` | Work grid goes from 3 to 2 columns |

**640/641px is the closest thing this site has to a "mobile" boundary.**
When a request says "desktop only" or "hide on mobile" with no other
qualifier, `@media (max-width: 640px)` is the existing convention to
reach for — not a JS user-agent/device check. This matters because a
width-based rule and a device-based rule disagree on e.g. a phone in
landscape (>640px wide) or a narrowed desktop browser window (<640px
wide); this codebase has consistently chosen width.

## Reduced motion

`app/globals.css` has one `@media (prefers-reduced-motion: reduce)` block
near the top that disables the tile fade-in, hero slide crossfade, hero
title word-by-word animation, and the detail-overlay transitions.
**Any new CSS `transition`/`animation` added to those same components (or
a new animated component) should get a corresponding override added to
that block** — it's a single shared block precisely so this is one place
to check, not a hunt through the whole file.

## Responsive & conditional-behavior registry

Every row below is a deliberate decision, not an accident of the
breakpoint it happens to land on. **Before changing a media query, a
component's mount logic, or a CSS rule referenced here, re-read the
"why" column** — and if you add a new device- or state-conditional
behavior, add a row for it in the same commit. This table (plus
[`FEATURE-REGISTRY.md`](./FEATURE-REGISTRY.md), which covers
non-responsive fragile behaviors) is what stops a future refactor from
quietly undoing something like the item directly below.

| Behavior | Rule | Why | How to verify |
|---|---|---|---|
| **"Open full tour" button hidden below 640px** | `app/globals.css`: `@media (max-width: 640px) { .detail-tour-btn { display: none; } }` (component: `components/Detail.js`, `.detail-tour-btn` link) | On mobile the button visually misaligned with the other buttons in the splash, and opening the tour in a new tab made navigating back to the site confusing. Desktop keeps it (commit `3b88ba2`, "Hide 'Open full tour' button on mobile project subpages"). | Open a project's detail overlay in a browser resized to <640px wide — the "Open full tour" pill must **not** appear (the `.detail-splash-hint` "Click to view" text, or nothing, shows instead for projects without a `url`). At ≥641px it must appear. If it shows on both, check (a) this media query wasn't deleted/edited, and (b) — very likely, since the CSS has been seen correct in source before — whether the deployed production build is actually current; see [`DEPLOYMENT.md`](./DEPLOYMENT.md#why-a-fix-can-look-reverted-when-the-code-is-fine). |
| Nav collapses to burger menu | `app/globals.css` `@media (max-width: 640px)`: `.burger { display: flex } .nav { display: none }` (component: `components/Header.js`) | Full nav doesn't fit narrow viewports | Resize below 640px — inline nav links disappear, hamburger icon appears and opens `#nav-drawer` |
| Work grid: 3 → 2 → 1 columns | `app/globals.css`: `max-width: 900px` → 2 cols, `max-width: 560px` → 1 col (component: `components/WorkGrid.js` `.grid-work`) | Tile aspect ratio (4/3) needs room; 3-up only fits desktop widths | Resize the window through 900px and 560px and watch column count drop |
| Process steps: 4 → 2 → 1 columns, dividers change | `app/globals.css`: `max-width: 820px` and `max-width: 480px` (component: `components/ProcessSteps.js`) | 4 columns of body copy is unreadable below ~820px; dividers are redrawn (left-border grid → top-border rows → none) rather than just reflowed, so check both column count *and* border placement when testing | Resize through 820px and 480px |
| Footer: 4 → 2 columns | `app/globals.css`: `max-width: 720px` (component: `components/Footer.js`) | 4 columns of link lists don't fit narrow viewports | Resize below 720px |
| Hero autoplay pauses on hover/focus, not manually | `components/Hero.js` (`onMouseEnter`/`onFocus` → `hovered` → `paused`) | The standalone pause **button** was intentionally removed (commit `97eef32`, "Remove hero pause button..."); hover-to-pause is the sole remaining pause mechanism. If a future change removes the hover/focus handlers thinking they're dead code, autoplay becomes permanently un-pausable by non-mouse users. | Hover the hero on desktop — slide rotation stops; tab into it via keyboard — same. Also respects `prefers-reduced-motion` (rotation never starts at all). |
| Detail-overlay focus trap only applies inside the open dialog | `components/Detail.js` `handleKeyDown`, gated on `rootRef` and a `FOCUSABLE` selector that excludes `offsetParent === null` (hidden) elements | Prevents Tab from escaping the modal, but must keep excluding hidden elements — e.g. the tour button hidden by the rule above — or Tab can land on an invisible focus target | Open a project detail on mobile (<640px, tour button hidden) and Tab through it — focus should never land on an invisible element |

If you're fixing a regression in one of the rows above, fix it in the
CSS/component cited, then also update that row (or add a new one) rather
than only fixing the symptom — the next person who "cleans up" that
selector needs the same context you just used.

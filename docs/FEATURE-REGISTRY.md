# Feature registry — behaviors that look accidental but aren't

Some behavior in this codebase is easy to mistake for a bug, a leftover,
or dead code — and "fixing" it would actually undo a deliberate decision.
This file exists so that doesn't happen again the way it did with the
"Open full tour" button (implemented, then appeared reverted on the live
site ~10 days later — root-caused in [`DEPLOYMENT.md`](./DEPLOYMENT.md#why-a-fix-can-look-reverted-when-the-code-is-fine),
tracked structurally in [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md#responsive--conditional-behavior-registry)).

**Before removing, "simplifying," or refactoring anything that looks
unnecessary — check this list first.** If you make a deliberate,
non-obvious decision that a future editor (human or agent) could plausibly
undo by accident, add a row here in the same commit.

## Marketing site

| Behavior | Where | Why it's deliberate | If you're "fixing" this, stop and check |
|---|---|---|---|
| "Open full tour" button hidden below 640px width | `app/globals.css` `.detail-tour-btn` media query | Misaligned with other buttons on mobile; new-tab navigation is confusing to return from on a phone. Desktop keeps it. | This is a **width** rule, not a device check — see `DESIGN-SYSTEM.md` for why that's intentional. Full detail row lives there. |
| Hero has no manual pause button, only pause-on-hover/focus | `components/Hero.js` | Pause button was removed on purpose (commit `97eef32`) to simplify the hero UI; hover/focus is the only remaining way to stop autoplay, and matters for keyboard users tabbing through | Don't delete the `onMouseEnter`/`onFocus` handlers as "unused" — they're the entire pause mechanism now |
| Project detail switches between "live tour" and "coming soon" purely based on whether `project.url` is set | `components/Detail.js`, `data/projects.js` | One field, two rendered states — no separate "status" enum | Don't add a redundant `status: 'comingSoon'` field; just omit/add `url` |
| Contact form has both a honeypot *and* a math captcha | `components/ContactForm.js` | Two independent, cheap spam defenses; neither alone is as effective | Don't remove either thinking the other "already covers it" |
| `reduced-motion` overrides are centralized in one media-query block in `globals.css` | `app/globals.css`, near the top | Single place to update when adding new animated components, instead of scattering `@media (prefers-reduced-motion)` per-component | Adding a new `transition`/`animation`? Add its selector to that existing block, don't create a new one elsewhere |
| Detail overlay's Tab-trap only considers *visible* focusable elements (`offsetParent !== null`) | `components/Detail.js` `handleKeyDown` | Without this check, Tab can land on the "Open full tour" button even while it's `display: none` on mobile | Any new focusable element added inside the detail overlay needs to be legitimately hideable via normal CSS `display`, not `visibility`/`opacity` tricks that `offsetParent` wouldn't catch |
| Asset/internal links go through a `BASE` constant instead of a literal `/path` | Every component that renders `href`/`src` | `NEXT_PUBLIC_BASEPATH` differs between production (`''`) and the GitHub Pages preview (`/GoSPL.Website`) — see `ARCHITECTURE.md` and `DEPLOYMENT.md` | A hardcoded path works on production and silently 404s only on the preview deploy — easy to miss if you only ever test against production |
| Production deploy is manual; GitHub Pages preview is automatic | Repo-wide | See `DEPLOYMENT.md` in full | A merged fix isn't "live" until someone runs the manual production deploy — don't report a fix as shipped-to-users without checking which target you mean |

## Tour player system

The player's own docs (`handover.md`, `player/README.md`,
`admin/README.md` — see [`TOUR-PLAYER-SYSTEM.md`](./TOUR-PLAYER-SYSTEM.md))
already track this kind of thing in depth for that codebase. Two are
worth surfacing here because they're the *same pattern* as this file's
namesake bug — a device/mode gate that was narrowed or widened on
purpose and could easily be "fixed" back to the wrong state:

- **`chrome-hidden` applies on *every* device by default, not just
  mobile.** An earlier version only hid the stock viewer UI on mobile
  (`platform.mobile` gate); that gate was deliberately removed so it's
  device-independent everywhere (`handover.md` §10.4). If stock UI
  chrome ever reappears "only on desktop," this gate is the first place
  to check — don't assume it needs a `platform.mobile` check re-added.
- **Hotspot/infoSpot/GLB-asset coordinates all need the same
  local→world flip** (`worldX=-x, worldY=y, worldZ=-z`, plus a matching
  180° yaw) documented in `handover.md` §2 — every time this was
  re-derived from an entity's live transform instead of applied as fixed
  arithmetic, it produced a visually-plausible-but-wrong result (upside
  down / underground). Don't re-derive it; reuse the documented formula.

## When you find a new one

Add a row to the appropriate table above (or a new table, if it's a
distinct subsystem) in the same commit as the change that makes it
non-obvious. A decision explained only in a commit message or a chat
session is invisible to the next edit; a row here is what that edit
actually has a chance of reading first.

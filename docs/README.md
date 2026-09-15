# GoSPL.Website documentation

This `docs/` folder is the map of the marketing site: what exists, why it
looks the way it does, and — critically — which behaviors are easy to
undo by accident during a future edit. It exists because that has
already happened once: the "Open full tour" button was deliberately
hidden on mobile, then appeared to come back on all devices a week or so
later with no one having touched that CSS rule on purpose. See
[`FEATURE-REGISTRY.md`](./FEATURE-REGISTRY.md) for that specific case and
the pattern behind it.

The **tour player system** (`player/`, `admin/`, `content/`, `tools/`)
has its own, already-thorough documentation — `player/README.md`,
`admin/README.md`, and the repo-root `handover.md` deep-dive. This
`docs/` folder doesn't duplicate that; [`TOUR-PLAYER-SYSTEM.md`](./TOUR-PLAYER-SYSTEM.md)
is a one-page map telling you which of those three files to open for a
given question.

## Read order

| # | File | Read this when you need to... |
|---|---|---|
| 1 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Understand the two-system repo layout, tech stack, and how pages/routing work |
| 2 | [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | Change or add to colors, type, spacing — or check a breakpoint before editing CSS |
| 3 | [`COMPONENTS.md`](./COMPONENTS.md) | Understand what a specific component does and its behavioral quirks |
| 4 | [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md) | Add/edit a project, stat, or process step — no code changes needed |
| 5 | [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Ship a change to the live site, or figure out why a shipped fix "isn't showing" |
| 6 | [`FEATURE-REGISTRY.md`](./FEATURE-REGISTRY.md) | Before/after touching CSS, layout, or animation — check nothing intentional got undone |
| 7 | [`TOUR-PLAYER-SYSTEM.md`](./TOUR-PLAYER-SYSTEM.md) | Work on the gaussian-splat tour player, its admin editor, or a tour's content files |

## Keeping this up to date

These files are only useful if they stay current. The rule of thumb:

- **Added a new component, page, or content field?** Update `ARCHITECTURE.md` and/or `COMPONENTS.md`/`CONTENT-GUIDE.md` in the same commit.
- **Added a new breakpoint, a device-conditional style, or removed one that existed?** Update the breakpoint table in `DESIGN-SYSTEM.md` and the registry in `FEATURE-REGISTRY.md` in the same commit — not "later."
- **Changed the build/deploy process?** Update `DEPLOYMENT.md` in the same commit.

A behavior that only lives in a commit message or an agent's session log is
one PR away from being silently reverted, because nothing before the next
edit tells anyone (human or agent) it was ever a deliberate decision. A
line in one of these files is what future edits actually check against.

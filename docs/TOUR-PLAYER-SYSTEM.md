# Tour player system — where to look

The gaussian-splat tour player (`player/`, `admin/`, `content/`,
`tools/`) lives in the **`jwkoenig/PLAY` repo**, not this one, and has
thorough, actively-maintained documentation of its own there. Every file
named below is in PLAY. This page is just a map so you open the right file instead of
searching three of them — it deliberately doesn't duplicate their
content, since that content is large and would immediately drift out of
sync.

| Question | Read |
|---|---|
| "How do I add a new tour / what files does a tour need?" | `player/README.md` — "Adding a new tour" |
| "How does the public player work day-to-day — URLs, `?debug`, local dev?" | `player/README.md` |
| "How does the password-gated authoring editor work?" | `admin/README.md` |
| "How do I place a hotspot/info spot, capture a camera view, or download a tour?" | `admin/README.md` — "Authoring" |
| "Why does walk mode not have gravity/jumping?" | `handover.md` §4 |
| "How does the hotspot coordinate system / local↔world conversion work?" | `handover.md` §2 (and §10.1, §10.5 for the same conversion applied to background spheres and GLB collision meshes) |
| "A camera bug looks like a clipping/orbit/black-screen issue — what's the actual cause?" | `handover.md` §8 (bad AABB from outlier splats — reads as three unrelated bugs) |
| "I'm about to debug something that feels like it should just work" | `handover.md` §9 — engine quirks collected the hard way (a stock getter bug, event-handler duplication, timing gotchas) |
| "What changed in the two-scene chalet tours / `chrome-hidden` / `moveMode`?" | `handover.md` §10 |
| "Where do I add a new tour?" | PLAY's `content/<slug>/`; its tile goes in this repo's `data/projects.js` |

## The one-sentence version

A tour is a folder of data files under `content/<slug>/`; one shared
`player/` (PlayCanvas + SuperSplat, hand-bundled, no build step) renders
all of them. `admin/` is a byte-identical copy of the engine files plus
an authoring overlay, password-gated via `.htaccess`. Deploying the
player once updates every tour; deploying a new `content/<slug>/` folder
adds a tour without touching the player.

## Deployment note

The player and tours ship together with the marketing site: the
workstation deploy (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)) stages PLAY's
`player/`, `admin/` and `content/` over this repo's build. `.sog` scene
files are gitignored (too large) and travel separately from the code.

# Tour player system — where to look

The gaussian-splat tour player (`player/`, `admin/`, `content/`,
`tools/`) already has thorough, actively-maintained documentation of its
own. This page is just a map so you open the right file instead of
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
| "What's `PLAY` and why shouldn't I deploy from it?" | `README.md` (repo root) and `handover.md` §0 — this repo is now the sole source of truth for `player/`/`admin`/`content`/`tools` |

## The one-sentence version

A tour is a folder of data files under `content/<slug>/`; one shared
`player/` (PlayCanvas + SuperSplat, hand-bundled, no build step) renders
all of them. `admin/` is a byte-identical copy of the engine files plus
an authoring overlay, password-gated via `.htaccess`. Deploying the
player once updates every tour; deploying a new `content/<slug>/` folder
adds a tour without touching the player.

## Deployment note

Like the marketing site (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)), the
tour player system ships to `gospl.io` by manual upload into
`public_html/SITE/` — there's no CI/CD step for it either, and `.sog`
scene files are gitignored (too large) so they're dropped onto the
server by hand, separately from any code deploy. The same "it's fixed in
the repo but not yet on the live server" failure mode applies here too.

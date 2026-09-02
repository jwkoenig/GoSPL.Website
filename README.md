# PC4WEB — Universal Demo Player

A single shared player for gaussian-splat demo tours. The player code is
deployed once; each tour is just a folder of data files. Updating the
player updates every tour immediately — no more copying the whole site
per tour.

The interface is chromeless by default on every tour (see "Interface
visibility" below) — visitors see this project's own tour navigation and
hotspot markers, not the stock SuperSplat toolbar/settings/branding.

## Layout

```
player/            the public player (index.html, index.js, index.css) — update once, applies to all tours
admin/             password-protected copy of player/ + a tour-authoring overlay (editor.js/editor.css)
                    — see admin/README.md. index.js/index.css must stay byte-identical to player/'s
                    (re-copy after every player/ change); index.html has its own small set of
                    manually-mirrored additions on top of player/'s.
content/
  kramer/           one folder per tour, named by its slug
    scene.sog          the gaussian-splat scene (not committed to git, see below)
    settings.json      camera defaults, post-fx, annotations
    tourSOG.json       tour/hotspot definitions (hotspots, infoSpots, optional collisionUrl/backgroundSphere/moveMode)
    scene.voxel.json    voxel collision (optional) — or point tourSOG.json's collisionUrl at a
    scene.voxel.bin      .glb instead for mesh collision (see handover.md §10.5); pick one, not both
    splash.json          optional {"title","body"} for the welcome splash; falls back to generic copy
    poster.jpg            optional poster image, matches ?poster=
    logo.png               loading-screen + splash logo, matches ?logo= (this tour's is committed as kramer.png)
tools/devserver.py    local dev server that mirrors the .htaccess rewrite (clean /tours/<slug>/ URLs)
.htaccess              Apache rewrite: /tours/<slug> -> player/index.html
```

`*.sog` files are large binary splat exports and are gitignored — drop them
into each tour's `content/<slug>/` folder manually (or via whatever export
pipeline produced them) after deploying.

## Adding a new tour

1. Create `content/<slug>/` with the same file names as `content/kramer/`
   (`scene.sog`, `settings.json`, `tourSOG.json`, optionally
   `scene.voxel.json`/`.bin` **or** a collision `.glb`, `splash.json`, and
   `poster.jpg`).
2. Deploy (upload the new folder alongside the existing site — no player
   redeploy needed, and no `.htaccess` change needed, since the rewrite
   rule is slug-generic).
3. Visit `https://<your-domain>/tours/<slug>/`.

## Interface visibility

The stock SuperSplat chrome (toolbar, settings/help panels, joystick,
branding) is hidden by default on every tour, on every device — this
project's own tour navigation pillbox, hotspot markers, and tooltips stay
visible and functional regardless. There is no URL param for this any more
(the old `?noui` was removed — it's now simply always the case). To see the
full stock UI (e.g. for QA), add `?debug` to the URL or press
**Ctrl+Shift+U**.

## Updating the player for all tours

Edit files under `player/` and deploy that folder. Every tour picks up the
change on next load — nothing tour-specific needs to change. If you touched
`player/index.js` or `player/index.css`, also re-copy them into `admin/`
(`cp player/index.js player/index.css admin/`) — `admin/`'s own README
explains why.

## Local development

For clean `/tours/<slug>/` URLs locally (recommended — matches production
routing, including the `/tours/<slug>` → `/tours/<slug>/` redirect):

```bash
python tools/devserver.py 8420
```

then open `http://localhost:8420/tours/kramer/`.

A plain static server (`python -m http.server`, `npx serve`) also works but
knows nothing about the `.htaccess` rewrite, so `/tours/<slug>/` 404s —
open the player directly with explicit query params instead:

```
http://localhost:8000/player/index.html?content=/content/kramer/scene.sog&settings=/content/kramer/settings.json&tour=/content/kramer/tourSOG.json
```

See `handover.md` for implementation notes on the player itself (walk-mode
physics, tour hotspot math, coordinate handling, debug mode, and — in §10 —
background spheres, scene-linking hotspots, the welcome splash, mesh
collision, and locking a tour to fly/walk/orbit via `moveMode`).

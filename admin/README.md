# admin/ — password-protected PLAY mirror with tour editing

`admin/` is a **copy of `player/`** with an authoring overlay added. It sits
beside `player/` and `content/` in the same web root:

```
docroot/
  player/     PLAY — public, no auth
  admin/      PLAY + editor — HTTP basic auth   <- this folder
  content/    the tours (shared by both)
  .htaccess   HTTPS redirect + /tours/<slug> clean URLs
```

Same engine, same rendering, same physics — because it *is* the same engine.
Nothing is reimplemented.

## Why a copy instead of a flag on player/

The editor must not be reachable on the public player, and basic auth is
per-directory on Apache. A separate folder gets password protection for free
via `.htaccess`, with no code branching in the player.

## What differs from player/

| File | Status |
|---|---|
| `index.js` | **byte-identical copy** — never edit |
| `index.css` | **byte-identical copy** — never edit |
| `index.html` | copy + 4 marked `ADMIN ADDITION` blocks |
| `editor.js` | new — the authoring overlay |
| `editor.css` | new — overlay styles |
| `.htaccess` | new — basic auth |

The `ADMIN ADDITION` blocks in `index.html`:
1. `<title>` changed
2. `editor.css` stylesheet link
3. `?slug=` convenience, kramer fallbacks removed, `DEFAULT_SETTINGS`
4. `contents` only fetched when a scene is named
5. settings falls back to `DEFAULT_SETTINGS`; `window.__gosplAdminContext`
6. `admin: true` (forces the hooks on — `player/` leaves it behind `?admin`)
7. `window.__gosplBoot()` + boot deferred until a scene exists
8. `editor.js` script tag before `</body>`

## How the editor works

It drives the read-only hooks PLAY already exposes when `config.admin` is set
(`handover.md` §6a) — it does **not** patch the engine:

- `__playAdmin.getCameraState()` → capture a hotspot from the current view
- `__playAdmin.pickSurface(nx, ny)` → click a splat surface to place an info spot
- `__playAdmin.getTourState()` → the engine's loaded tour
- `__playAdmin.setMoveSpeed(n)` → live preview of the Speed slider

`setMoveSpeed` is the one *writer*, and it exists because `tour.moveSpeed` is
read exactly once, when `CameraManager` builds its controllers — so without it
the slider only takes effect after save + reload. It was added to
`player/index.js` (alongside the other hooks, behind the same `config.admin`
gate) and copied here, so `index.js` stays byte-identical.

**Only walk mode honours `moveSpeed`.** Fly and orbit use their own fixed
speeds, so the slider legitimately does nothing in those modes — in the editor
*and* in the player.

## Panel input isolation

The engine binds pointer events to the canvas, but `keydown`/`keyup` go on
`window` with no target check (`KeyboardMouseSource.attach`), so typing in a
panel field used to drive WASD/arrows/space and walk the camera off. The panel
therefore stops `keydown`/`keyup`/`wheel` from bubbling past itself
(`isolateInput` in `editor.js`). The focused control still receives the key —
propagation is stopped *above* the target, not before it — and navigation from
the canvas is untouched.

Moving the camera needs a *setter*, which `__playAdmin` deliberately doesn't
have. Rather than patch the engine, the boot shim keeps `main()`'s return
value on `window.__gosplViewer`, whose `global.events` is the engine's own
event bus — so flying to a hotspot is just
`events.fire('hotspot.goto', hotspot)`, the same event PLAY's tour navigator
fires. Its handler falls back to raw local `x/y/z` + `hlookat`/`vlookat`, so
it works for hotspots captured seconds ago that the engine has never seen.

Saving is a **download**, not a server write — same model as GoSPL.PC.DEPLOY's
old `?editor`. There is no backend: you download `tourSOG.json` and upload it
to `content/<slug>/`. That is why this whole thing runs on plain static
hosting.

### Coordinate frames

`getCameraState`/`pickSurface` report PLAY's **world** frame; `tourSOG.json`
stores the splat's **local** frame. PLAY's "Convert tour hotspots" step
(`handover.md` §2) maps local → world as:

```
position = [-x, y, -z]
yawDeg   = hlookat * 180/PI + 180
pitchDeg = vlookat * 180/PI
```

`editor.js`'s `toLocalHotspot`/`toLocalPosition` apply the inverse. This was
verified against live data: with the camera parked on kramer's hotspot 1, the
derived values reproduce `hs1` exactly (`-17.6094, 3.304, -7.992`,
`hlookat 4.8`, `vlookat 0.04`).

## Usage

### Opening empty (the default)

```
https://<domain>/admin/
```

Opens with **nothing loaded** — editor panel visible, drop zone waiting.
Nothing auto-loads (unlike `player/`, which falls back to
`../content/kramer/`).

- Drop a **`.sog` / `.ply` / `.splat`** anywhere on the page to load a scene.
- Optionally drop a **`tourSOG.json`** — together with the scene or at any
  point after — to load an existing tour's hotspots and info spots for
  editing.

Capture/place buttons stay disabled until a scene is loaded.

### Opening a deployed tour directly

```
https://<domain>/admin/?slug=kramer
```

`?slug=<slug>` fills in all the content/settings/tour/collision/logo paths
from `../content/<slug>/` and boots straight into it. Any explicit param
(`?content=`, `?tour=`, …) still wins, so every player URL form keeps working
here too.

### Authoring

Fly/walk to a view → **+ Capture current view** → name it. Click
**+ IMG / INFO / LINK** → click a splat surface to place an info spot.
**↓ Download tourSOG.json** → upload to `content/<slug>/tourSOG.json`.

**Double-click a hotspot name to fly there.** Per-row buttons: `✎` rename,
`↑`/`↓` reorder, `⟳` re-capture from the current view, `✕` delete.

The camera **starts on hotspot 1** whenever a tour is loaded — via `?slug=`,
or by dropping the `tourSOG.json` together with the scene. (Drop the JSON
*after* the scene is already running and it jumps to hotspot 1 instead, since
the engine can't be handed a new tour post-boot.)

The **idle camera drift is off**. With no `animTrack` in settings the engine
synthesises one anyway — a slow orbit for object-style scenes, a figure-8
drift from inside a walkthrough — which fights you while framing a shot. The
admin sets `noanim`. Add `?anim` to the URL to see what a visitor gets.

Unrecognised top-level keys in a loaded tour are preserved verbatim on
download, so hand-authored fields aren't silently dropped.

### Why a dropped scene needs a synthetic URL

The engine chooses its parser from the URL's file extension and falls back to
the PLY parser when it doesn't recognise one — a `blob:` URL has no
extension, so a dropped `.sog` failed with *"Invalid ply header"*. Instead the
boot shim passes `contentUrl: './dropped/<real filename>'` plus the file as
`contents`. The loader uses `asset.file.contents` when present and never
fetches the url, so that path doesn't need to exist.

## Enabling the password

Edit `.htaccess` and set `AuthUserFile` to the **absolute server path** of your
`.htpasswd` (not a URL path). Create the file with:

```
htpasswd -c /absolute/path/to/.htpasswd yourusername
```

No shell access? Use any htpasswd generator and upload the file. Keep it
outside the web root if the host allows; if not, the `<Files>` block in
`.htaccess` blocks it from being served.

**`admin/` is not protected until you do this.** Verify by loading
`/admin/` in a private window and confirming you get a password prompt.

## Updating from player/

```
cp player/index.js player/index.css admin/
```

Then re-apply the four `ADMIN ADDITION` blocks if `player/index.html` itself
changed (diff it against `admin/index.html`). `editor.js`/`editor.css` are
independent of the engine build and normally need no change.

## Known gaps

- **Changing scene requires a page reload.** `main()` takes over the canvas
  and can only run once per page, so dropping a second scene tells you to
  reload rather than swapping in place.
- Info-spot content is captured via `prompt()`. Fine for text and URLs; a
  richer inline editor would be nicer.
- Panel is fixed 300px on the right and may overlap the engine's own UI on
  narrow viewports — check at your working window size.

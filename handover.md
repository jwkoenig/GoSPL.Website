# PC4WEB — Handover

Self-hosted PlayCanvas SuperSplat viewer for the Kramer gaussian-splat scene ("GoSPL Viewer"),
extended with SVO voxel collision, a JSON-driven walk-only hotspot tour, clickable info markers,
and a visual/behavioral pass borrowed from a sibling project. This document is a complete record
of what's here, how to run it, and everything changed from the stock SuperSplat viewer template
across this build session — for whoever (human or agent) picks this up next.

**Sections 8 and 9 were added later** (2026-08-31), from a downstream project that built a
multi-scene gallery on a copy of this player. They are not changes to this build: §8 is a
data-shape trap that produced three unrelated-looking camera bugs and is worth reading before
debugging anything camera-related, and §9 collects engine behaviours — including one
stock-bundle getter bug — that cost real time to rediscover. The pre-edit snapshot of this
file is in `backup/20260831_175750/`.

**§10 (2026-09-02)** is a second later addition — it *is* a change to this build, made directly
in `player/index.js`/`index.html`/`index.css` (and mirrored to `admin/`) rather than a report
from a downstream copy. It covers the two-scene "XOIO_WWL" chalet tour
(`rndr_xoiochalet_ext`/`_int`) and several changes that affect every tour: an always-on
`chrome-hidden` default replacing `?noui` entirely, a GLB mesh-collision path now actually used
by real content, a per-tour welcome splash, and an icon-based hotspot that links two tours
together. Read §10 first if you're picking this repo up after that session.

## 0. This repo is now the single source of truth for player/admin/content

A separate repo, `jwkoenig/PLAY`, held its own independently-maintained
copy of `player/`, `admin/`, and `tools/devserver.py` (plus committed
`content/kramer/` and `content/sample/`, which this repo never had). The
two had drifted — `PLAY` was missing this repo's newer bugfixes (GLB
collision, the clean `/tours/<slug>/` rewrite scheme replacing the older
query-string one) while only `PLAY` had the actual tour `content/` data
committed. Deploying from the wrong one silently reverted the other's
changes on the live server.

As of 2026-09-02, `content/kramer/` and `content/sample/` were copied over
from `PLAY` into this repo (scene `.sog` files excluded per `.gitignore`,
as before — drop those in manually). This repo is now the sole source of
truth for the whole player/admin/content/tools system; `PLAY` should not
be deployed from going forward.

## Running it locally

Static site — any file server works, from inside the `PC4WEB` folder:

```bash
python -m http.server 8420
```
or
```bash
npx serve -l 8420
```

Then open `http://localhost:8420`. No build step — `index.js` is a pre-bundled file (PlayCanvas
engine + SuperSplat viewer + this project's extensions), edited directly, not compiled from
source. There is no `package.json`/`node_modules` here — don't go looking for one.

Query params (all optional, override the defaults below): `?content=`, `?settings=`,
`?collision=` (or `?voxel=`), `?tour=`, `?splash=`, `?skybox=`, `?poster=`, `?webgl=`, `?debug=`.

**`?noui` no longer exists** (removed in the §10 chalet-tours session — see there). The stock
SuperSplat chrome (toolbar, settings/help panels, joystick, branding) is hidden by default now,
always, on every tour and every device — not via a URL param, via the `chrome-hidden` body class
(§10.4). **`?debug`** (or Ctrl+Shift+U) is the *only* way to get the full stock UI back.

## Files

| File | Purpose |
|---|---|
| `index.html` | Shell + inline config script (reads query params, sets defaults), page `<title>` |
| `index.js` | Bundled engine + viewer app — **all logic lives here** |
| `index.css` | All styling |
| `settings.json` | Scene camera defaults, post-effects, annotations array |
| `index.sog` | The gaussian-splat scene data (~70MB) |
| `scene.voxel.json` / `scene.voxel.bin` | SVO collision data (from `splat-transform`) — **or** point `tourSOG.json`'s `collisionUrl` at a `.glb` instead (§10.5) |
| `tourSOG.json` | Hotspot tour + info markers (see schema below); optionally `backgroundSphere` (§10.1) and `collisionUrl` (either format) |
| `splash.json` | *(optional, §10.3)* `{"title", "body"}` for the welcome splash; falls back to generic copy when absent |
| `kramer.png` | Splash-screen logo (sourced from GoSPL.PC.DEPLOY's `public/kramer/kramer.png`) |
| `backup/20260806_154508/` | Pre-session snapshot of `index.html`/`.js`/`.css`/`settings.json`, from before any of this work started — restore from here if something needs fully reverting |

## 1. Voxel collision (native, minimal glue)

The viewer already had a full `.voxel.json`/`.voxel.bin` loader (`VoxelCollision`,
`loadVoxelCollision`) — it just had no default URL. Added `collisionUrl` default of
`./scene.voxel.json` in `index.html`. Everything else (walk-mode collision, fly-mode collision,
the voxel debug overlay, the `showCollision` toggle button) was already wired and just needed the
file present.

## 2. Tour hotspots (`tourSOG.json` → camera fly-to, walk-only)

`tourSOG.json` schema:
```jsonc
{
  "scene": "kramerSOG.sog",       // informational only, not used to switch content
  "moveSpeed": 10.5,              // optional — walk speed in world-units/sec, WASD + tap-to-walk.
                                   // Omit to keep WalkController's built-in default (10.5).
  "hotspots": [
    { "id": "hs1", "name": "Entrance", "x": -17.6, "y": 3.5, "z": -7.99,
      "hlookat": 4.8, "vlookat": 0.04, "fov": 75 }
  ],
  "infoSpots": [
    { "id": "is...", "name": "MENU", "x": -2.24, "y": 1.49, "z": -0.89,
      "type": "link", "content": "https://...png", "description": "(english)" }
  ]
}
```
- `moveSpeed` is read once at load (search `controllers.walk.moveGroundSpeed` in `index.js`,
  right next to where `controllers.walk.hotspots` is set) and overrides `WalkController`'s
  `moveGroundSpeed` constant for that session; governs both WASD and tap/double-click-to-walk.
- `hlookat`/`vlookat` are **radians** (confirmed against GoSPL.PC.DEPLOY's own tour player, which
  uses them directly as yaw/pitch).
- **Coordinate fix**: hotspot/infoSpot x/y/z are authored against the raw splat's local frame.
  This build's gsplat entity carries an extra 180° rotation around the vertical (Y) axis
  (`loadGsplat`'s `setLocalEulerAngles(0, 0, 180)`), so every tour position/angle is converted
  with `worldX = -x, worldY = y (unchanged), worldZ = -z`, `worldYaw = hlookat°+180`. Confirmed
  by iterative visual testing (an earlier attempt derived this from the gsplat entity's full
  world-transform matrix instead — that version also incorrectly flipped Y, putting hotspots
  underground; the direct arithmetic version is the one that shipped). This conversion happens
  once, early in `main()` (before `initUI`), search for **"Convert tour hotspots"** in `index.js`.
  If a *different* scene/export ever doesn't need this flip, that's the one place to change.
- Bottom pill nav bar (`#tourNav`) — prev / **play-pause** / next, then a separator and the
  current hotspot's name, styled as a GoSPL-style bottom pill (see "Visual design" below).
  **Always visible** once loaded — intentionally not tied to the inactivity auto-fade the main
  toolbar uses (`state.controlsHidden`), since it's a persistent wayfinding aid, not ephemeral
  chrome.
- Clicking prev/next (or autoplay) fires a `hotspot.goto` event, handled inside `CameraManager`
  (search `events.on('hotspot.goto'`) — teleports the camera to the hotspot's position/angles
  using `controllers[hotspotMode].goto(...)`, where `hotspotMode` is **always `'walk'`** (or
  `'fly'` as a fallback only if the scene has no collision) — **never orbit**. This scene is a
  walkthrough; hotspots are waypoints within walk mode, not a break from it.
- **On load**, the camera starts directly at `hotspots[0]` in walk mode — overrides both the
  `settings.json` default camera and this viewer's built-in idle auto-pan animation (which always
  exists as a fallback when `settings.json` has no `animTracks`, so it was silently auto-playing
  before this fix — `state.hasAnimation` is unconditionally `true` for this scene).
- **Play/pause autoplay**: `TOUR_TWEEN_MS = 3000`, `TOUR_DWELL_MS = 0` (no artificial pause between
  hotspots — see easing note below for why 0 dwell still doesn't feel abrupt). Autoplay is
  interrupted by manual prev/next or any scene interaction (`events.on('inputEvent', 'interrupt')`).
- **Speed/easing**: hotspot transitions run at `transitionSpeed / 3` (~3s) via a per-call override
  on the shared `startTransition(speed, easing)` helper (`currentTransitionSpeed`/`currentEasing`
  in `CameraManager`) — every other transition (Frame, Reset, Pick, annotation click) is
  unaffected, still the default ~1s / `easeOut`. Hotspot transitions additionally use a steeper
  curve, **`easeOutTour`** (exponent doubled: `2^(-20x)` vs `easeOut`'s `2^(-10x)`), defined right
  next to `easeOut` — reaches "essentially arrived" in about half the relative time, so the 3s
  duration reads as a slightly slower *approach* rather than a long dead "settling tail" at the
  end (this is also why `TOUR_DWELL_MS = 0` still feels fine — each leg's own deceleration/
  re-acceleration through the steep curve does the work a dwell pause used to).

## 3. InfoSpots (piggybacked on the existing annotation marker system)

The viewer already had a 3D marker + tooltip system (`class Annotation`/`Annotations`, driven by
`settings.json`'s `annotations` array — `{title, text, position}`). `tourSOG.json`'s `infoSpots`
are converted (same world-space fix as hotspots) and **pushed into `global.settings.annotations`**
— early, before `initUI` (see below for why timing matters here) — so they reuse the existing
marker rendering, prev/next nav (`#annotationNav`), and click tooltip; no new marker system built.

- Extended `Annotation` with `type`/`content`/`description` fields and a new `.pc-annotation-link`
  element in the tooltip (`showTooltip()`): `type: "info"` renders as before (plain title + text);
  `type: "link"` shows `description` as a caption and a clickable "Open ↗" button using `content`
  as the href (opens in a new tab). `type: "img"` (exists in GoSPL's schema, not used in the
  current `tourSOG.json`) is **not** implemented.
- **Markers are always visible** at the container level (`Annotations`' `parentDom.style.display`
  is unconditionally `'block'`) — per-marker occlusion (dimmed/hidden behind splat geometry) and
  frustum culling (hidden behind the camera) are still handled individually by each marker's own
  `_update()`/`_hideElements()`, untouched. This took two passes to get right — see "Debug mode"
  below for the actual root cause of why they weren't showing at all initially.
- **The `#annotationNav` pillbox (top) is hidden in normal use** — infoSpot content is meant to be
  read at the marker itself (the tooltip), not browsed via a prev/next bar. It only shows in
  **debug mode** (see below), as an authoring/QA aid.
- **Timing gotcha**: the hotspot/infoSpot world-space conversion and the `settings.annotations`
  push both happen in `main()` *before* `initUI()` is called, not after the gsplat finishes
  loading. `initAnnotationNav`/`initTourNav` are called synchronously from inside `initUI`, and
  their "do I have ≥2 items" gate runs once, immediately — if the data isn't ready yet at that
  point, the nav permanently no-ops even if the underlying array is populated moments later
  (arrays are captured by reference, but a function that already returned doesn't re-run). This
  bit us once already; if you're adding a third tour-driven UI element, wire its data before
  `initUI()`, not after.

## 4. Walk mode — gravity removed, height driven by hotspots + Q/E

This is a bigger departure from the stock template than anything else here, all in
`WalkController` (search `class WalkController`) and `KeyboardMouseDevice`:

- **No gravity, no ground-spring, no jumping.** `WalkController._step()` used to raycast down for
  ground height and spring-damper the camera toward `floor + eyeHeight`, plus support Space-to-jump.
  All of that is gone. Horizontal (X/Z) movement is a simple velocity-with-damping model; capsule
  collision against walls/ceiling/floor still applies (anti-clipping safety), but nothing actively
  pulls height toward a floor anymore.
- **Height instead comes from two sources**, both in `WalkController._step()`:
  1. **Nearest-hotspot tracking** (default): every frame, if not manually overridden, the
     controller finds the nearest hotspot by X/Z distance (`this.hotspots`, set from
     `CameraManager` as `controllers.walk.hotspots = global.tour?.hotspots`) and glides eye height
     toward *that hotspot's* Y — a plain exponential glide (`heightTrackRate = 0.85`), not a
     spring, so it can't overshoot or bounce. This is why walking from one hotspot's area toward
     another at a different floor level smoothly re-levels instead of snapping.
  2. **Manual override — Q = down, E = up** (`verticalSpeed = 1.5` m/s), reusing the *same* `E`/`Q`
     key axis fly mode already used for vertical (`KeyboardMouseDevice._axis.y`, `E - Q`) rather
     than binding new keys. A manual nudge sets `_yOverride = true`, which suppresses nearest-
     hotspot tracking until the next hotspot teleport (`WalkController.goto()`) resets it — i.e.
     clicking a tour hotspot always wins and resets you to that hotspot's exact authored height,
     but free manual adjustment sticks in between.
- **Double-click-to-walk always stays in walk mode.** The stock template's `NavCursor` double-click
  handler used to swap `walk → fly` on double-click (so you could "fly closer" to inspect
  something) — that read as "it jumps to orbit mode" to the user (fly mode's drag-around-a-point
  behavior looks orbit-like). Fixed so double-click in walk mode does the same thing a single
  click already did (fires `navigateTo`, no mode change). Orbit's and fly's own double-click
  behavior (swap to fly / focus orbit point) is untouched.
- Double-click navigation was *already* X/Z-only under the hood before any of the above —
  `WalkSource.update()` (the auto-walk-toward-a-point driver) only ever reads `target.x`/`target.z`,
  never `target.y` — so the clicked point's height was always irrelevant; height during a
  double-click walk is governed exclusively by the two sources above, same as WASD.
- **Speed**: `moveGroundSpeed = 10.5` (was `7`, ×1.5 per request). This single constant governs
  both WASD and double-click-walk speed, since both funnel through the same `_step()` velocity
  multiplication — no need to tune two places.

## 5. Cursor never hides

`PointerLockManager._activate()` (only ever triggered when a visitor manually enables "Gaming
Controls") is now a no-op — pointer lock is fully disabled, permanently. Mouse-look still works
via the existing drag-based fallback path (`KeyboardMouseDevice`'s non-pointer-locked branch).

## 6a. `?admin` — read-only hook for an embedding host page

Separate from `?debug` (which shows a visible on-screen debug panel), `?admin` exposes
`window.__playAdmin = { getCameraState(), getTourState(), pickSurface(normX, normY) }` with **no
visible UI change** — for a host page that embeds this player in a same-origin `<iframe>` (e.g.
an admin tour-authoring backend) and wants to read live camera state to capture a hotspot from
the current view, read the loaded tour, or click-to-pick a point on the splat surface (e.g. to
place an info spot). `getCameraState()` returns the same world-space shape as the debug panel's
`captureCameraState` (`position`, `angles`, `distance`, `fov`, `mode`); a caller wanting the
tour's local authoring-frame `x/y/z`+`hlookat`/`vlookat` applies the inverse of the "Convert tour
hotspots" transform documented in §2 above.

`pickSurface(normX, normY)` takes screen coordinates as 0..1 fractions of the canvas (same
normalization `NavInteraction._pickSceneTarget` uses internally for click-to-walk/fly — pixel
offset divided by `canvas.clientWidth`/`clientHeight`) and resolves to `{ position: [x, y, z] }`
in the same world-space frame as `getCameraState()`, or `null` if the click missed the splat (or
landed on background). It reuses the Viewer's own `Picker` instance (`this.picker` — the same one
click-to-walk/fly renders a pick pass with), so it's still one full splat render pass per call —
same cost/guidance as any other picker use documented in `CLAUDE.md`'s performance section; only
call it on a discrete click, never per-frame or in a loop. Unlike click-to-walk's
`_pickSceneTarget`, it does **not** consult walk-mode voxel/mesh collision first — it always
returns the rendered-splat pick, which is what an authoring UI placing a marker on visible
geometry wants regardless of whether the tour has collision data.

Search `config.admin` in `index.js` (set right after `this.cameraManager = new CameraManager(...)`,
next to where the debug panel is constructed).

## 6. Debug mode — and the actual "why is nothing showing" root cause

_History below is as of this session; `?noui` itself no longer exists — see §10.4 for the
current chrome-hidden default it was replaced by. `state.debugUi`/Ctrl+Shift+U/`?debug` are
unchanged and remain the one escape hatch to the full stock UI._

Added `state.debugUi` (new field on the observed `state` object), toggled via **Ctrl+Shift+U**
(mirrors the existing Ctrl+Shift+D camera-debug-panel shortcut) or auto-enabled via **`?debug`**.
When on, it forces `#ui` visible (overriding `?noui`) and shows the `#annotationNav` pillbox.

This exists because of a real debugging journey worth recording: the user reported the whole
SuperSplat interface (including Settings) was inaccessible, and separately that infoSpot markers
"only showed when Gaming Controls was on" despite there being no visible toggle for it. Turned out
to be **two unrelated things**, both now resolved:
1. Whatever hid the UI (almost certainly `?noui` in a saved link) hides `#ui` entirely, and
   Settings lives inside `#ui` — hence no way back in. Debug mode is the escape hatch.
2. The "Gaming Controls" row in Settings is **intentionally hidden on desktop** in the stock
   template (`isDesktop` check in `initUI` — it only controls an on-screen joystick for touch
   devices) — so on desktop there was genuinely no way to see or change it, yet both the
   `Annotations` marker container *and* the `#annotationNav`/`#tourNav` pills were gated on
   `(cameraMode === 'walk' || 'fly') && gamingControls` (a stock-template "hide chrome during
   immersive gaming-controls capture" behavior). Since walk is now the default mode, whatever
   `gamingControls` happened to be (e.g. stuck `true` in `localStorage` from earlier testing)
   silently controlled marker visibility with no way to fix it from the UI. **Fixed by removing
   that gating entirely** for both the marker container and both pillboxes — visibility is no
   longer tied to `gamingControls` or `controlsHidden` at all; see sections 2 and 3 above for what
   each is tied to instead.

## 7. Visual design ported from `GoSPL.PC.DEPLOY`

- Base font switched from Arial to GoSPL's mono stack (`--ui-font` custom property in
  `index.css`).
- `#tourNav` and `#annotationNav` (desktop variant) rebuilt to match GoSPL's `TourBar` component:
  dark blurred pill (`rgba(8,8,8,0.82)` + `blur(14px)`), 16px radius, 36px buttons, thin 11px mono
  title text with a separator, simple single-stroke chevron icons (replacing the old
  double-outline ones).
- `#tourNav` additionally got a **play/pause button** between prev/next (GoSPL's TourBar layout:
  prev · play/pause · next · separator · title), with a distinct highlighted background
  (`rgba(255,255,255,0.12)` idle / `0.2` hover) vs. the plain prev/next buttons.
- Annotation tooltip font also switched to the mono stack for consistency.
- **Splash screen** (`#loadingWrap`) rebuilt to match GoSPL's `LoadScreen.tsx`: full-screen
  `#0a0a0a` overlay (was previously a small floating text+bar), centered `kramer.png` logo with a
  3s pulse animation, thin 192px progress bar below it. Unlike GoSPL's fake ~4s eased fill, this
  one tracks *real* download progress (`progress:changed`) — just restyled to match visually. Exit
  choreography matches GoSPL: snap to 100%, hold 150ms, fade out over 900ms, removed from layout
  ~1.1s after load completes. The old "N%" text label is still updated in the DOM but hidden via
  CSS (GoSPL's splash shows no number) — trivial to bring back if wanted.
- **Page `<title>`** changed to "GoSPL Viewer".

## 8. ⚠️ The reported gsplat AABB can be junk — and every symptom looks like something else

_Found while building a multi-scene gallery on this player (see "Downstream users" below).
Not observed on the kramer scene, whose fitted clip planes behave — but it is a property of
the **data**, not of any one build, so any new tour whose `.sog` export carries stray splats
will hit it. Worth checking before assuming a camera bug._

Some `.sog` captures carry a sparse halo of far-flung outlier splats. The AABB the gsplat
component reports (`component.customAabb`) then describes the halo, not the subject.
Measured on a room-sized photobooth scene:

| | reported AABB | reality (percentile-trimmed) |
|---|---|---|
| half-extents | `[305 756, 43 162, 139 055]` | `[21.7, 9.9, 18.2]` |
| bound radius | **353 390** | **~30** |
| bbox centre | `[199 147, −11 416, 26 214]` | near the actual content |

Four orders of magnitude. Three separate, unrelated-looking bugs all traced back to it:

- **Splats sliced away when the camera gets close.** Reads as a broken near-clip plane, and it
  is — but the cause is the bbox. `applyCamera` fits the planes every frame:
  `far = dist + boundRadius` (measured 284 319), and the near plane's own floor is
  `far / (1024 * 16)` = 17.35, which is above the `Math.min(1.0, near)` cap. So `nearClip`
  pinned at exactly **1.0 world unit for every scene, regardless of camera position** —
  everything within a metre of the eye was cut away. It only showed when dollying in, which is
  why it read as "a clipping plane at close range" rather than "the bounds are wrong". The
  1 : 284 319 near/far ratio also wrecks depth precision.
- **An idle camera drift threw the camera kilometres off.** The orbit focal distance came from
  the bbox and was 150 000+; a ±1.5° float around a focal point that far away moves the camera
  by kilometres. Read as a bug in the drift animation.
- **Scenes with no authored camera opened black.** `createFrameCamera(bbox, fov)` stands off by
  `radius / sin(fov/2)`: camera at `[570 013, 174 016, 397 080]`, distance **556 299**, looking
  at nothing. Read as broken content.

**Detecting it.** Compare `component.customAabb.halfExtents` against the size of the thing you
can see. If it is astronomically larger, that is your cause, whatever the symptom looks like.

**The fix** — re-derive the bound from the splat centres rather than trusting the AABB:

- `resource.centers` is a `Float32Array` of xyz per splat (2 M splats → 6 M floats), populated
  as long as `app.scene.gsplatCentersEnabled` is not false.
- Sample with a stride down to ~60 000 centres, sort each axis, discard 5% off each tail.
  **~11 ms measured** — the three sorts are the whole cost.
- Build the box in the gsplat's local frame (centres share `customAabb`'s frame), then
  `setFromTransformedAabb` with the entity world transform. Fall back to `customAabb` when
  centres aren't available.

Percentile is a judgement call; measured radii on one scene: p01 → 70.8, p02 → 46.4,
**p05 → 30.0**, p10 → 20.8. 5% is where the halo is gone but the subject is intact.

Cheap guards worth having regardless of whether you adopt the trimmed bound: clamp any
bbox-derived orbit distance to a sane range, and consider fixed clip planes (0.01 / 2000 works
for room-scale scenes) instead of the fit when you know the bounds are unreliable. **Keep the
fit for well-formed scenes** — it is correct there, and gives far better depth precision than
fixed planes.

## 9. Engine behaviours worth knowing before you debug one

Collected the hard way; none of these are bugs in this build, and two are traps.

- **`.sog` needs no filename patching.** `GSplatHandler` dispatches on extension to
  `SogBundleParser`. (A sibling React build needed a shim for this on an older engine; it is
  obsolete here.)
- **`framerender` fires every tick**, before the `autoRender || renderNextFrame` check — which
  is exactly what makes the camera-change detection driving on-demand rendering work when
  nothing is being drawn. Don't "fix" it.
- **`OrbitController$1.zoomRange`'s getter is wrong.** It returns `this._targetRootPose.zRange`
  (the root pose) instead of the child pose's, so it reads `[-Infinity, Infinity]` no matter
  what you set. The setter is fine. Don't trust that getter when debugging zoom limits.
- **Constructing a second `CameraManager` is a trap.** It registers a fresh set of
  `events.on(...)` handlers each time, so anything that rebuilds one per scene silently stacks
  duplicate handlers. Re-point the existing instance instead.
- **`initUI` reads its data once, synchronously** — the same timing gotcha already recorded in
  §2 and §3 for `initTourNav` / `initAnnotationNav`. It generalises: wire *any* data-driven UI
  before `initUI()`, never after a load resolves.
- **A class on `#controlsWrap` itself gets clobbered** — `showUI()` and the inactivity fade keep
  toggling `.hidden`/`.faded-out` on it, so any "hide the chrome" mechanism needs to target it
  from the *parent* (`body`/`#ui`) with `!important`, not touch `#controlsWrap`'s own classList.
  (This used to be phrased as "`?noui` hides all of `#ui`" — that param is gone; see §10.4 for
  the `chrome-hidden` mechanism that replaced it and follows exactly this rule.)
- **Bursts of synthetic input events lie.** 28 `wheel` events dispatched in one tick accumulate
  into a single frame's delta and flip the orbit camera through its own pivot. A real user
  never does this; it manufactured two false "bugs" during testing. Pace simulated input across
  frames.

## 10. XOIO_WWL chalet tours (`rndr_xoiochalet_ext` / `rndr_xoiochalet_int`) — this session

Built out the two-scene "Winter Chalet" tour (exterior walkthrough ↔ interior walkthrough of the
same building) into a connected experience, and along the way made several changes that affect
every tour, not just these two. `admin/index.js`/`index.css` are byte-identical copies of
`player/`'s (`cp player/index.js player/index.css admin/` after every engine change, per
`admin/README.md`); `admin/index.html` is **not** auto-synced and needs its own markup/config
mirrored by hand for anything touched below that's in `index.html`.

### 10.1 Interior background sphere (`backgroundSphere` in `tourSOG.json`)

New optional tour field, e.g. `content/rndr_xoiochalet_int/tourSOG.json`:
`"backgroundSphere": "360SPHERE.glb"` (resolved relative to `tourSOG.json`, same as
`collisionUrl`). A large textured sphere mesh — the interior splat's own captured geometry runs
out at windows/gaps, so this gives visitors something real to see through them instead of void.

Loaded via `loadBackgroundSphere(app, url)` (mirrors `loadSkybox`'s `Asset('container', ...)`
pattern) → `asset.resource.instantiateRenderEntity()`. **Positioned with the same explicit
local→world formula tour hotspots use (`worldX=-x, worldY=y, worldZ=-z`, plus a matching 180°
yaw for rotation) rather than by parenting to the gsplat entity and trusting its actual applied
transform** — parenting was the first attempt and produced an upside-down sphere. This is the
exact same class of bug §2's hotspot conversion note already warns about (deriving the
conversion from the entity's real world-transform matrix instead of the verified arithmetic
flips Y) — it just took a second entity type running into it to confirm. If you add a third
GLB-authored asset positioned in this tour's local frame, use the arithmetic formula, not
`entity.getWorldTransform()`.

`sceneBound` (used for the camera's near/far clip-plane fit, §8) is grown to include the
sphere's world AABB — but only *after* `CameraManager` is constructed, since its constructor
reads `sceneBound` synchronously to size "Frame Scene"/`isWalkAllowed`. Growing it before that
would make Frame Scene fly the camera out to the sphere's ~80-unit radius instead of framing the
room. Search `sphereWorldBound` in `index.js`.

### 10.2 Interior ↔ exterior hotspot (`infoSpots[].type: "scene"`)

A fourth `infoSpots` type, alongside the existing `info`/`link`/(unimplemented)`img`
(§3/§Not-done): renders as an **icon image** instead of the usual text-label circle, and on
click **navigates the page** to a sibling tour rather than opening a tooltip — this is a full
page reload between two independent tour URLs, not an in-app scene swap (that's a much bigger
change; see `C:\tmp\PLAYMANY`'s gallery mode for what that would actually take).

```jsonc
{ "id": "is1", "name": "ENTER", "type": "scene", "x": -0.19, "y": -0.85, "z": -1.44,
  "content": "link_entr_transp.png",       // icon image, resolved relative to tourSOG.json
  "target": "/tours/rndr_xoiochalet_int/", // where clicking navigates to
  "description": "Enter the chalet" }
```

- **Icon texture**: `Annotation._createIconHotspotTexture(app, image, size)` composites the
  preloaded icon image instead of `_createHotspotTexture`'s drawn text label. Icon images are
  preloaded (`Image.decode()`) in `main()`, before `Annotations` is constructed — same "wire
  data before `initUI`/before it's read" rule as §3/§9, just applied to image data instead of
  JSON. Cache is `global.iconCache`, copied onto `Annotation.iconCache` by `Annotations`'
  constructor.
- **Size**: `type: "scene"` markers render at `Annotation.iconHotspotSize` (100px) instead of
  the default `Annotation.hotspotSize` (25px) — 4× bigger, both the 3D mesh scale
  (`_calculateScreenSpaceScale`) and the DOM click-target (`.icon-hotspot` CSS class). Plain
  numbered/text markers are unaffected.
- **Click behavior**: bypasses `showTooltip()` entirely for this type — goes straight to
  `window.location.href = target`, after **forwarding the current page's query params onto the
  target URL** (so a `?debug` session doesn't silently lose debug state when hopping between
  scenes — this exists because that's exactly what happened during testing).
- **Placement**: `pickSurface` (§6a) is the right tool for finding real coordinates, but
  **`window.__playAdmin.pickSurface` is async — always `await` it**, and always sanity-check the
  result's distance from the current camera position before trusting it. A raycast through
  *glass* (e.g. a door pane) or a *thin/sparse* splat region passes straight through to whatever
  solid geometry is behind it — on the exterior tour this meant an early attempt landed on
  distant outdoor terrain instead of the door, producing a marker that visually floated near the
  roofline. Picking a nearby **opaque, solid** surface (e.g. the floor right where a real object
  sits) and offsetting height from there is more reliable than picking the glass/frame directly.

`Annotations`/`NavCursor` construction in `Viewer`'s constructor used to be skipped entirely
under `?noui` (`if (!config.noui) { this.annotations = new Annotations(...) }`) — with `?noui`
removed (§10.4) that gate is gone too; both always construct now. This matters beyond cosmetics:
before this session, a tour's scene-link icons (and all other markers) **did not exist at all**
on a normal (`?noui`-redirected) production link — not hidden, never created.

### 10.3 Welcome splash (`#introWrap`) — separate from the loading splash

`#loadingWrap` is the pre-existing GoSPL-styled *progress* splash (§7) and is untouched — it
reports real download %, always has, still does. `#introWrap` is new: a welcome/copy overlay
shown once the scene has loaded, dismissed by click/Enter-button/keypress, gated by
`sessionStorage.getItem('gospl.introSeen')` so it shows once per **browser session** (not once
per tour — using the §10.2 scene-link hotspot is a full page reload and deliberately should not
re-trigger it).

- **Content**: optional `content/<slug>/splash.json` — `{"title": "...", "body": "..."}` —
  fetched in parallel with the tour data in `main()` (`splashPromise`, same fire-and-await
  pattern as `tourPromise`), attached as `global.splash`. Falls back to generic built-in copy
  (`"Welcome"` / generic controls blurb) when the file is absent — a 404 here is the **normal**
  case (most tours don't have one) — see `content/rndr_xoiochalet_ext/splash.json` for a
  worked example.
- **Style**: ported from the marketing site's own `globals.css` (`/SITE/app/globals.css` on the
  server) — `--font-sans: 'Inter', sans-serif` (Google Fonts, linked in `<head>`), the same dark
  scrim/pill-button visual language as that site's `.detail-splash`/`.detail-tour-btn`. Content
  is horizontally centered (own request superseded an earlier bottom-left layout copied more
  literally from `.detail-splash`) with a centered `radial-gradient` scrim to match — a
  left-fading gradient under centered text would have looked like a leftover.
- **Interface-wide font**: `--ui-font` (used by `body`, the pillbox title text, tooltips —
  everywhere) now resolves to the same `--font-sans` token, so the pillbox/tooltips/debug panel
  and the intro splash all read as one typographic system, not mono-UI-plus-Inter-splash.
- **Bug found and fixed**: the splash's dismiss-on-keypress listener
  (`document.addEventListener('keydown', dismissIntro, { once: true })`) used to be registered
  immediately in `initUI()`, i.e. well before the scene finishes loading and the splash is ever
  shown. **Any keypress at all during loading** (a visitor tapping WASD while impatient, say)
  silently dismissed it and set `gospl.introSeen` before it had ever appeared — "the splash never
  shows" with no error anywhere. Fixed by moving that `addEventListener` call to inside the
  `loaded:changed` reveal `setTimeout`, so it only starts listening once the splash is actually
  on screen. If you add another global dismiss-on-X listener to this overlay, register it there,
  not at `initUI()` top level.

### 10.4 `chrome-hidden` — replaces `?noui` entirely, applies by default everywhere

`?noui` is gone — not deprecated, **removed**: `.htaccess`'s external-redirect rule that used to
append it to every bare `/tours/<slug>/` link is deleted, `tools/devserver.py` (which mirrors
`.htaccess` for local dev) no longer has the matching redirect, and the now-fully-dead
`noui: url.searchParams.has('noui')` config line is gone from both `player/index.html` and
`admin/index.html`'s bootstrap scripts. A bare tour link now stays exactly that in the address
bar — no query string.

What replaced it: a `body.chrome-hidden` CSS class, applied **unconditionally by default** (both
mobile and desktop — an earlier, narrower version of this only applied on mobile, gated on
`platform.mobile`; that gate is gone, the behavior is now device-independent) and removed only
by debug mode (`state.debugUi`, i.e. `?debug`/Ctrl+Shift+U — unchanged, §6). It hides exactly
five stock-chrome elements with `!important` (`#controlsWrap`, `#settingsPanel`, `#infoPanel`,
`#joystickBase`, `#viewerBranding`) — **not** all of `#ui` the way `?noui` used to. This project's
own UI — `#tourNav`, `#annotations` (markers), `#tooltip`, `#loadingWrap`/`#introWrap` — is
outside that selector list and stays visible/functional always, regardless of debug state.

`#annotationNav` (the infoSpot prev/next pillbox, top of screen) is a separate case, **hidden in
normal use, for now** — reverted back to its original debug-gated behavior (§3) after briefly
being made always-visible earlier this session. `initAnnotationNav`'s `updateMode()` is the one
place this is decided; `initTourNav`'s (`#tourNav`, bottom) is unaffected and stays always-visible
as it always has been.

### 10.5 GLB mesh collision — `MeshCollision`/`fromGlb`, now actually used by a real tour

`MeshCollision`/`MeshCollision.fromGlb` (a BVH-over-triangles collider, fully wired in `main()`'s
collision loader by file extension: `collisionUrl` ending `.glb` → `MeshCollision.fromGlb`,
anything else → `loadVoxelCollision`) existed in the engine before this session but had never
been exercised by any real tour's content — every tour used voxel collision
(`scene.voxel.json`/`.bin`, from `splat-transform`). Both chalet tours now use it instead:
`"collisionUrl": "COLLISION.glb"` in each `tourSOG.json`, `scene.voxel.json`/`.bin` deleted from
both content folders (the two-file voxel format is no longer used by anything in this repo, but
the loader/`VoxelCollision` class is untouched and still there for any tour that wants it).

Motivation: the exterior tour's voxel collision was carving a 5cm-resolution grid
(`voxelResolution: 0.05`) across its entire ~88×28×79-unit outdoor bounding volume — octree
9 levels deep, 6.3MB `.bin`, most of it fine-grained resolution over open walkable space that
didn't need it. A `.glb` mesh collider's cost scales with triangle count instead, and was already
purpose-built (a simplified low-poly proxy, not the render mesh) by whoever exported it.

**Know before reusing this pattern**: `fromGlb` walks **every mesh on every node** in the GLB
with no filtering by name/material — the source GLB must contain *only* collision-relevant
geometry. It doesn't carry per-vertex "voxel resolution" metadata the way `VoxelCollision` does,
so `MeshCollision.isFreeAt` falls back to the same `DEFAULT_VOXEL_RESOLUTION` (0.05) constant
regardless of the mesh's actual scale — fine for these two tours (same resolution the voxel data
already used) but worth checking on a very differently-scaled scene. The `showCollision`
debug-overlay button works for both backends (`VoxelDebugOverlay` vs `MeshDebugOverlay`, chosen
by `collision instanceof`) — toggling it and visually checking the wireframe tracks the visible
geometry is the fastest way to confirm a new `.glb` collider loaded correctly, since
camera-position deltas are unreliable to test against in a sandboxed/headless browser (see "Known
limitation" at the bottom of this doc).

**Bug found and fixed the same day this was first wired up**: the original `fromGlb` read raw
vertex-buffer positions straight off `asset.resource.renders[].resource.meshes[]` with **no
transform applied at all** — not the flip, not even the GLB node's own translation/rotation/scale.
That's a no-op for a single-mesh file whose node happens to be an identity transform, but both
chalet COLLISION.glbs have real node transforms (the interior one alone: translation
`[-4.72, 2.75, -1.35]`, scale `~[1.01, 0.96, 0.98]`) — so the resulting collision geometry landed
nowhere near the visible splat (confirmed visually: the debug wireframe rendered as a small
warped shape floating off to one side of the actual building). Fixed by instantiating the GLB via
`instantiateRenderEntity()` instead (never parented into the scene — just used to read each
mesh's `getWorldTransform()` **within that detached tree**, which correctly composes the node's
own transform without the parenting pitfall §10.1 warns about, since nothing outside the GLB's
own hierarchy is involved), applying that transform per-vertex, then the same local→world flip
every other tour-authored asset needs. If you touch `fromGlb` again: a GLB collision mesh needs
**both** its own node transform **and** the flip — skipping either produces geometry that's
subtly or wildly wrong depending on how far the node's transform is from identity, and it will
not throw or warn, it'll just silently collide in the wrong place.

### 10.6 `moveMode` — locking a tour to fly (or walk/orbit) — already implemented, just undocumented

Not new this session, but worth correcting here: an earlier "Not done / explicitly deferred" note
in this doc claimed `moveMode` was planned but never implemented. That was stale — it's real and
working (`CameraManager`'s constructor, search `modeFromTour`): an optional top-level
`tourSOG.json` field, `"moveMode": "flying"` (or `"walking"` / `"orbit"` — note these are the
JSON *field values*, not the `state.cameraMode` strings the rest of this doc uses; the mapping is
`{ flying: 'fly', walking: 'walk', orbit: 'orbit' }`, so a typo like `"fly"` instead of `"flying"`
silently falls through to auto-detect instead of erroring). Both chalet tours now use
`"moveMode": "flying"`.

Setting it controls **both** the mode the tour starts in and the mode tour hotspots teleport
within (`hotspotMode` — without `moveMode` this defaults to `walk` when collision data allows it,
`fly` otherwise; §2's "always `walk`, never orbit" note is the pre-`moveMode` default, not an
absolute rule). It does *not* hide the other mode-toggle buttons in `#controlsWrap` — nothing
stops a visitor from switching to walk/orbit manually — but since `chrome-hidden` (§10.4) already
hides that toolbar by default on every tour, in practice a `moveMode` tour has no visible way to
leave the chosen mode outside of `?debug`.

**Click-to-navigate ("fly to point" on a single click) needed no extra code for this** — both
`NavInteraction`'s desktop click handler and its mobile-tap handler already branch on
`state.cameraMode === 'fly'` unconditionally (search `_flyToPickedPosition`), the same as they
already did for walk/orbit. Setting `moveMode: "flying"` puts a tour in fly mode from the start,
and every existing fly-mode interaction — including click-to-navigate — just applies, with
nothing tour-specific gating it. Confirmed live: single-clicking on either chalet tour visibly
flew the camera toward the clicked point.

## Downstream users

`C:\tmp\PLAYMANY` — a multi-scene **gallery** built on a copy of this player: one manifest
(`gallery.json`), N standalone `.sog` scenes, paging with wrap-around, ±1 precache, thumbnail
grid, and a `?edit` starting-view editor. It adds a "gallery mode" inside `player/index.js`,
gated on `config.gallery` so the single-scene tour path here is untouched (re-verified against
the kramer tour). §8 and §9 above came out of that work; its own `handover.md` has the fuller
writeup, including the gallery-specific camera-frame conversion and precache design.

## Not done / explicitly deferred

- **`type: "img"` infoSpots** — schema exists (GoSPL), not implemented here (no current data
  needs it). Not the same as §10.2's new `type: "scene"` — that's a different, since-implemented
  type (icon marker + page navigation to a sibling tour), not this one.

## Reference project

`C:\Users\AdminCC\Dropbox\TMP\GoSPL.PC.DEPLOY` — a separate React/PlayCanvas-React viewer for the
same Kramer scene, full source (not bundled), with an author-time `?editor` route for building
tour JSON files interactively (drag in a `.sog`, capture hotspots, place info spots, download
`tour.json` — same schema as `tourSOG.json`). Used here only as a design/behavior/tour-authoring
reference — **not** a shared codebase; nothing in PC4WEB imports from it. Run it with `npm run dev`
from that folder (Vite, `node_modules` already installed) and open `/?editor`.

## Known limitation while testing with Claude Code's browser tool

The sandboxed preview pane used during this session sometimes doesn't composite frames unless
actively displayed, which stalls the app's `state.loaded` flip (gated on a real rendered frame),
blocks screenshots, and means simulated keyboard shortcuts with modifier keys (e.g. Ctrl+Shift+U)
don't reliably reach the page — not bugs in the app itself (confirmed by testing the *pre-existing*
Ctrl+Shift+D debug-panel shortcut, which showed the same symptom). Every feature in this document
that involves real-time interaction or visual feel was ultimately verified live by the user, not
fully confirmable from this sandbox alone — structural checks (console errors, computed styles,
DOM state, `node --check` syntax passes) were used as a first pass, but treat "looks structurally
correct" and "confirmed working" as distinct in the history above. If an agent picks this up
again and hits the same rendering-pane issue, verify via a normal browser tab instead.

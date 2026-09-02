/**
 * GoSPL Admin — tour authoring overlay.
 *
 * This file is the ONLY functional difference between admin/ and player/.
 * The engine (index.js) is a byte-identical copy and is never modified —
 * this overlay drives the read-only hooks it already exposes when
 * config.admin is set (see handover.md §6a):
 *
 *   window.__playAdmin.getCameraState()            -> world-space camera pose
 *   window.__playAdmin.getTourState()              -> the loaded tour
 *   window.__playAdmin.pickSurface(normX, normY)   -> world-space splat hit
 *
 * Authoring model is deliberately the same one GoSPL.PC.DEPLOY's ?editor
 * used: everything is client-side, and saving means downloading a
 * tourSOG.json that you drop into content/<slug>/ on the webspace. There is
 * no server here — admin/ is static files behind HTTP basic auth, exactly
 * like player/ is static files without it.
 *
 * Coordinate frames: getCameraState/pickSurface report PLAY's *world* frame,
 * but tourSOG.json stores the splat's *local* authoring frame. PLAY's own
 * "Convert tour hotspots" step (handover.md §2) maps local -> world as
 *   position = [-x, y, -z],  yawDeg = hlookat*180/PI + 180,  pitchDeg = vlookat*180/PI
 * so writing a tour means applying the inverse of that — see toLocal* below.
 */

const PANEL_ID = 'gosplEditorPanel';

// PLAY's default when a tour omits moveSpeed. Only written to the tour when
// changed, so untouched tours keep the engine default rather than pinning it.
const DEFAULT_MOVE_SPEED = 10.5;

// id for the Speed readout, so a drag can update it without a full re-render
const SPEED_VALUE_ID = 'geSpeedValue';

const INFO_TYPES = ['img', 'info', 'link'];
const TYPE_COLORS = { img: '#78c8ff', info: '#b4ffb4', link: '#ffc878' };

// ── Coordinate transforms (inverse of PLAY's "Convert tour hotspots") ──
function toLocalHotspot(state) {
    const [wx, wy, wz] = state.position;
    const [pitchDeg, yawDeg] = state.angles;
    return {
        x: round(-wx),
        y: round(wy),
        z: round(-wz),
        hlookat: round(((yawDeg - 180) * Math.PI) / 180, 4),
        vlookat: round((pitchDeg * Math.PI) / 180, 4),
        fov: round(state.fov, 1)
    };
}

function toLocalPosition([wx, wy, wz]) {
    return { x: round(-wx), y: round(wy), z: round(-wz) };
}

// Forward direction of the same transform: tour-local -> PLAY world.
// The engine's 'hotspot.goto' handler reads worldPosition/worldYaw/worldPitch
// when present and otherwise falls back to using the raw local x/y/z and
// hlookat AS IF they were world values — which is mirrored in x/z and 180°
// out in yaw. That fallback only exists for the case where the engine's own
// "Convert tour hotspots" pass hasn't run; editor-side hotspots (freshly
// captured, or read straight from tourSOG.json) never have those fields, so
// we must attach them ourselves or every jump lands in the wrong place.
function withWorldFrame(h) {
    const degPerRad = 180 / Math.PI;
    return {
        ...h,
        worldPosition: [-h.x, h.y, -h.z],
        worldYaw: h.hlookat * degPerRad + 180,
        worldPitch: h.vlookat * degPerRad
    };
}

function round(n, dp = 4) {
    const f = 10 ** dp;
    return Math.round(n * f) / f;
}

function uid(prefix) {
    return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

// ── Editor state ──────────────────────────────────────────────────────
const ctx = window.__gosplAdminContext ?? {};
const state = {
    slug: ctx.slug ?? '',
    scene: '',
    logo: '',
    moveMode: 'flying',
    moveSpeed: DEFAULT_MOVE_SPEED,
    collisionUrl: '',
    hotspots: [],
    infoSpots: [],
    // Fields present in the loaded tour that this editor doesn't manage —
    // preserved verbatim on download so hand-authored keys aren't silently
    // dropped just because the UI has no control for them.
    passthrough: {},
    placeMode: null,
    dirty: false,
    // Engine lifecycle. 'empty' = nothing loaded yet, drop zone showing;
    // 'loading' = booting; 'ready' = engine up and hooks available.
    engine: ctx.hasScene ? 'loading' : 'empty',
    hooksReady: false
};

const SCENE_EXT = ['.sog', '.ply', '.splat'];
const isSceneFile = (name) => SCENE_EXT.some(e => name.toLowerCase().endsWith(e));

// ── Boot ──────────────────────────────────────────────────────────────
async function waitForAdminHooks(timeoutMs = 60000) {
    const start = performance.now();
    while (!window.__playAdmin) {
        if (performance.now() - start > timeoutMs) return null;
        await new Promise(r => setTimeout(r, 100));
    }
    return window.__playAdmin;
}

// Apply a parsed tourSOG.json to editor state. Used both for a tour fetched
// from ../content/<slug>/ and for one dropped in as a file.
function applyTour(tour) {
    const { scene, renderer, logo, moveMode, moveSpeed, collisionUrl, hotspots, infoSpots, ...rest } = tour;
    state.scene = scene ?? '';
    state.logo = logo ?? '';
    state.moveMode = moveMode ?? 'flying';
    state.moveSpeed = moveSpeed ?? DEFAULT_MOVE_SPEED;
    state.collisionUrl = collisionUrl ?? '';
    state.hotspots = Array.isArray(hotspots) ? hotspots : [];
    state.infoSpots = Array.isArray(infoSpots) ? infoSpots : [];
    state.passthrough = rest;
}

async function loadExistingTour() {
    if (!ctx.tourUrl) return;
    try {
        const res = await fetch(ctx.tourUrl, { cache: 'no-store' });
        if (!res.ok) return;
        applyTour(await res.json());
    } catch {
        /* no tour at that path yet — start empty */
    }
}

// ── File drop ─────────────────────────────────────────────────────────
// Drop a .sog/.ply/.splat to load a scene, and optionally a .json
// alongside (or later) to edit an existing tour's hotspots/info spots.
async function handleFiles(files) {
    const list = Array.from(files);
    const sceneFile = list.find(f => isSceneFile(f.name));
    const jsonFile = list.find(f => f.name.toLowerCase().endsWith('.json'));

    let droppedTour = null;
    if (jsonFile) {
        try {
            const tour = JSON.parse(await jsonFile.text());
            if (!Array.isArray(tour.hotspots)) throw new Error('no hotspots array');
            applyTour(tour);
            droppedTour = tour;
            state.dirty = true;
            toast(`Loaded ${jsonFile.name} — ${tour.hotspots.length} hotspots`);
        } catch (e) {
            toast(`Invalid tour JSON: ${e.message}`);
        }
    }

    if (sceneFile) {
        // The engine takes over the canvas on first boot and can't be handed
        // a second scene, so swapping scenes means reloading the page. Only
        // the very first drop can boot in place.
        if (state.engine !== 'empty') {
            toast('Reload the page to load a different scene');
            render();
            return;
        }
        state.scene = sceneFile.name;
        state.engine = 'loading';
        render();
        try {
            // Hand the tour to the engine when one came with the scene, so
            // it starts on hotspot 1 the same way a deployed tour does.
            const tourForEngine = droppedTour ?? (state.hotspots.length ? buildTour() : null);
            await window.__gosplBoot(sceneFile, ctx.defaultSettings, tourForEngine);
            await waitForAdminHooks();
            state.engine = 'ready';
            state.hooksReady = !!window.__playAdmin;
            toast(`Loaded ${sceneFile.name}`);
        } catch (e) {
            state.engine = 'empty';
            toast(`Failed to load scene: ${e.message}`);
        }
    } else if (droppedTour && state.engine === 'ready' && state.hotspots.length) {
        // Tour dropped onto an already-running scene: the engine can't be
        // handed a new tour after boot, so at least put the camera on
        // hotspot 1 to match the "starts at the first hotspot" behaviour.
        gotoHotspot(state.hotspots[0]);
    }

    render();
}

function installDropHandlers() {
    // Whole window is the drop target so you can drop anywhere, not just on
    // the panel's dashed box.
    let depth = 0;
    const setHover = (on) => document.body.classList.toggle('ge-drag-over', on);

    window.addEventListener('dragover', (e) => { e.preventDefault(); });
    window.addEventListener('dragenter', (e) => { e.preventDefault(); depth++; setHover(true); });
    window.addEventListener('dragleave', (e) => { e.preventDefault(); if (--depth <= 0) { depth = 0; setHover(false); } });
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        depth = 0;
        setHover(false);
        if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
    });
}

// ── Download ──────────────────────────────────────────────────────────
function buildTour() {
    return {
        scene: state.scene,
        renderer: 'playcanvas',
        ...(state.logo.trim() ? { logo: state.logo.trim() } : {}),
        ...(state.moveMode !== 'flying' ? { moveMode: state.moveMode } : {}),
        ...(state.moveSpeed !== DEFAULT_MOVE_SPEED ? { moveSpeed: state.moveSpeed } : {}),
        ...(state.collisionUrl.trim() ? { collisionUrl: state.collisionUrl.trim() } : {}),
        ...state.passthrough,
        hotspots: state.hotspots,
        ...(state.infoSpots.length ? { infoSpots: state.infoSpots } : {})
    };
}

function download() {
    const blob = new Blob([JSON.stringify(buildTour(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tourSOG.json';
    a.click();
    URL.revokeObjectURL(a.href);
    state.dirty = false;
    render();
    toast(state.slug
        ? `Downloaded — upload to content/${state.slug}/tourSOG.json`
        : 'Downloaded tourSOG.json');
}

// ── Toast ─────────────────────────────────────────────────────────────
let toastTimer = null;
function toast(msg) {
    let el = document.getElementById('gosplEditorToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'gosplEditorToast';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}

// ── Hotspots ──────────────────────────────────────────────────────────
function captureHotspot() {
    const cam = window.__playAdmin?.getCameraState();
    if (!cam) return toast('Camera not ready');
    const name = (prompt('Hotspot name:', `Hotspot ${state.hotspots.length + 1}`) ?? '').trim();
    if (!name) return;
    state.hotspots.push({ id: uid('hs'), name, ...toLocalHotspot(cam) });
    state.dirty = true;
    render();
    toast(`Captured "${name}"`);
}

function recaptureHotspot(id) {
    const cam = window.__playAdmin?.getCameraState();
    if (!cam) return toast('Camera not ready');
    const h = state.hotspots.find(h => h.id === id);
    if (!h) return;
    Object.assign(h, toLocalHotspot(cam));
    state.dirty = true;
    render();
    toast(`Updated "${h.name}" to current view`);
}

// Fly the camera to a hotspot by firing the engine's own 'hotspot.goto'
// event (the same one PLAY's tour navigator uses). Always hand it explicit
// world-frame values — see withWorldFrame for why the engine's own fallback
// can't be relied on here.
function gotoHotspot(h) {
    const events = window.__gosplViewer?.global?.events;
    if (!events) return toast('Engine not ready');
    events.fire('hotspot.goto', withWorldFrame(h));
}

function renameHotspot(id) {
    const h = state.hotspots.find(h => h.id === id);
    if (!h) return;
    const name = (prompt('Hotspot name:', h.name) ?? '').trim();
    if (!name) return;
    h.name = name;
    state.dirty = true;
    render();
}

function deleteHotspot(id) {
    state.hotspots = state.hotspots.filter(h => h.id !== id);
    state.dirty = true;
    render();
}

function moveHotspot(from, to) {
    if (to < 0 || to >= state.hotspots.length) return;
    const [m] = state.hotspots.splice(from, 1);
    state.hotspots.splice(to, 0, m);
    state.dirty = true;
    render();
}

// ── Info spots (click-to-place) ───────────────────────────────────────
function activatePlaceMode(type) {
    state.placeMode = state.placeMode === type ? null : type;
    render();
}

async function handlePlaceClick(e) {
    const canvas = document.getElementById('application-canvas');
    if (!canvas || !state.placeMode) return;

    // pickSurface wants 0..1 fractions of the canvas — same normalization
    // the engine's own click-to-walk uses (offsetX / clientWidth).
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

    const type = state.placeMode;
    const hit = await window.__playAdmin?.pickSurface(nx, ny);
    if (!hit) return toast('Click on a visible splat surface');

    const name = (prompt(`${type.toUpperCase()} spot name:`, `New ${type}`) ?? '').trim();
    if (!name) { state.placeMode = null; render(); return; }
    const content = (prompt('Content (text, image URL, or link URL):', '') ?? '').trim();

    state.infoSpots.push({ id: uid('is'), name, ...toLocalPosition(hit.position), type, content });
    state.placeMode = null;
    state.dirty = true;
    render();
    toast(`Placed "${name}"`);
}

function editInfoSpot(id) {
    const s = state.infoSpots.find(s => s.id === id);
    if (!s) return;
    const name = (prompt('Name:', s.name) ?? '').trim();
    if (!name) return;
    const content = (prompt('Content:', s.content ?? '') ?? '').trim();
    s.name = name;
    s.content = content;
    state.dirty = true;
    render();
}

function deleteInfoSpot(id) {
    state.infoSpots = state.infoSpots.filter(s => s.id !== id);
    state.dirty = true;
    render();
}

// ── Render ────────────────────────────────────────────────────────────
function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === 'class') node.className = v;
        else if (k === 'style') node.setAttribute('style', v);
        else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
        if (c === null || c === undefined || c === false) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
}

function section(label, children) {
    return el('div', { class: 'ge-section' }, [
        el('span', { class: 'ge-section-label' }, label),
        ...[].concat(children)
    ]);
}

// Apply a speed change to both the tour being authored and the running
// engine, so the slider previews immediately instead of only taking effect
// after save + reload. The engine reads tour.moveSpeed once at construction
// (see CameraManager), hence the explicit __playAdmin.setMoveSpeed call.
//
// Only walk mode honours moveSpeed — fly and orbit use their own fixed
// speeds — so in those modes the preview intentionally does nothing, exactly
// as the player behaves when it loads the saved tour.
// `live` is true while the slider is being dragged: update the engine and the
// readout in place, but skip render(). A full render replaces the range input
// mid-drag, which drops pointer capture and stops the drag dead — so the
// re-render is deferred to the change event (drag end).
function setMoveSpeed(speed, live = false) {
    if (!Number.isFinite(speed)) return;
    state.moveSpeed = speed;
    state.dirty = true;
    window.__playAdmin?.setMoveSpeed?.(speed);
    if (live) {
        const out = document.getElementById(SPEED_VALUE_ID);
        if (out) out.textContent = `${speed.toFixed(1)} u/s`;
        return;
    }
    render();
}

// Keep panel interaction out of the camera. The engine binds pointer events
// to the canvas, but keydown/keyup go on `window` with no target check
// (KeyboardMouseSource.attach), so typing in any panel field would otherwise
// drive WASD/arrows/space. Stopping propagation at the panel lets the focused
// control receive the key normally while the event never reaches window.
// Wheel is stopped too so scrolling a long panel can't zoom the scene.
//
// This alone does NOT stop pointer events from leaking through — see
// installNavGuard below for why a plain stopPropagation on the panel isn't
// enough for those.
function isolateInput(panel) {
    for (const type of ['keydown', 'keyup', 'wheel']) {
        panel.addEventListener(type, e => e.stopPropagation());
    }
}

// A click/drag that starts on the canvas (e.g. an orbit-drag begun a pixel
// left of the panel) and ends over a panel control never reaches that
// control: KeyboardMouseSource.setPointerCapture()s the canvas on every
// pointerdown, and per the Pointer Events spec a captured pointer's later
// events — including the pointerup the click/drag ends on — are delivered
// to the capturing element (the canvas) no matter what's visually under the
// cursor. NavInteraction's own pointerup listener then sees a small-movement
// "click" on the canvas and navigates the scene, while the panel button the
// user actually released over never fires. Simple bubbling isolation
// (isolateInput above) can't catch this: the event's target genuinely is the
// canvas, not the panel, so there's nothing to stopPropagation at the panel.
//
// Fix: intercept in the capture phase (runs before the canvas's own bubble
// listeners), and for any pointer event retargeted to the canvas, check
// where the cursor actually is via elementFromPoint. If it's over admin UI,
// swallow the event before NavInteraction/OrbitController/etc. see it, and
// release the capture so the rest of the interaction routes normally.
function installNavGuard() {
    const isOverAdminUi = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return !!el?.closest('#gosplEditorPanel, #gosplPlaceOverlay, #gosplEditorToast');
    };
    const guard = (event) => {
        const canvas = document.getElementById('application-canvas');
        if (!canvas || event.target !== canvas) return;
        if (!isOverAdminUi(event.clientX, event.clientY)) return;
        event.stopImmediatePropagation();
        if (event.type === 'pointerup' && canvas.hasPointerCapture?.(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    };
    window.addEventListener('pointerup', guard, true);
    window.addEventListener('pointermove', guard, true);
}

function render() {
    document.getElementById(PANEL_ID)?.remove();
    document.getElementById('gosplPlaceOverlay')?.remove();

    // Place-mode overlay: a transparent full-screen crosshair layer that
    // swallows the next click. Right-click cancels.
    if (state.placeMode) {
        document.body.appendChild(el('div', {
            id: 'gosplPlaceOverlay',
            onclick: handlePlaceClick,
            oncontextmenu: (e) => { e.preventDefault(); state.placeMode = null; render(); }
        }, [
            el('div', { class: 'ge-place-hint' }, [
                'Click a splat surface to place ',
                el('b', { style: `color:${TYPE_COLORS[state.placeMode]}` }, state.placeMode.toUpperCase()),
                ' · right-click to cancel'
            ])
        ]));
    }

    const panel = el('div', { id: PANEL_ID }, [
        el('div', { class: 'ge-header' }, [
            el('div', { class: 'ge-dot' }),
            el('span', { class: 'ge-title' }, 'Tour Editor'),
            state.dirty ? el('span', { class: 'ge-dirty', title: 'Unsaved changes' }, '●') : null
        ]),

        el('div', { class: 'ge-body' }, [
            section('Scene', [
                state.engine === 'empty'
                    ? el('label', {
                        class: 'ge-drop',
                        title: 'Drop a .sog / .ply / .splat here, or click to browse'
                    }, [
                        el('input', {
                            type: 'file', class: 'ge-file',
                            accept: '.sog,.ply,.splat,.json',
                            multiple: 'multiple',
                            onchange: (e) => { if (e.target.files.length) handleFiles(e.target.files); e.target.value = ''; }
                        }),
                        el('div', { class: 'ge-drop-icon' }, '↓'),
                        el('div', { class: 'ge-drop-main' }, 'Drop .sog / .ply / .splat'),
                        el('div', { class: 'ge-drop-sub' }, '+ optional tourSOG.json to edit an existing tour')
                    ])
                    : el('div', { class: 'ge-scene-row' }, [
                        el('span', {
                            class: 'ge-scene-dot',
                            style: `background:${state.engine === 'ready' ? '#7ee787' : '#ffc878'}`
                        }),
                        el('span', { class: 'ge-name', title: state.scene }, state.scene || '(scene)'),
                        el('span', { class: 'ge-scene-state' }, state.engine === 'ready' ? '' : 'loading…')
                    ]),
                state.engine !== 'empty'
                    ? el('p', { class: 'ge-note' }, 'Drop a tourSOG.json any time to load its hotspots. Reload to change scene.')
                    : null
            ]),

            section('Tour', [
                el('label', { class: 'ge-label' }, 'Slug (content folder)'),
                el('div', { class: 'ge-row' }, [
                    el('input', {
                        class: 'ge-input', type: 'text', value: state.slug, placeholder: 'kramer',
                        onchange: (e) => { state.slug = e.target.value.trim(); }
                    }),
                    el('button', {
                        class: 'ge-btn-sm', title: 'Load this tour',
                        onclick: () => {
                            const s = state.slug.trim();
                            if (!s) return toast('Enter a slug first');
                            if (state.dirty && !confirm('Discard unsaved changes?')) return;
                            location.search = `?slug=${encodeURIComponent(s)}`;
                        }
                    }, 'load')
                ]),

                el('label', { class: 'ge-label' }, 'Scene filename'),
                el('input', {
                    class: 'ge-input', type: 'text', value: state.scene, placeholder: 'scene.sog',
                    onchange: (e) => { state.scene = e.target.value.trim(); state.dirty = true; }
                }),

                el('label', { class: 'ge-label' }, 'Logo filename'),
                el('input', {
                    class: 'ge-input', type: 'text', value: state.logo, placeholder: 'logo.png',
                    onchange: (e) => { state.logo = e.target.value.trim(); state.dirty = true; }
                })
            ]),

            section('Movement', [
                el('div', { class: 'ge-row' }, ['flying', 'walking', 'orbit'].map(m =>
                    el('button', {
                        class: `ge-mode${state.moveMode === m ? ' active' : ''}`,
                        onclick: () => {
                            state.moveMode = m;
                            state.dirty = true;
                            // Actually preview the mode, not just relabel the
                            // button — see __playAdmin.setCameraMode.
                            window.__playAdmin?.setCameraMode?.(m === 'flying' ? 'fly' : m === 'walking' ? 'walk' : 'orbit');
                            render();
                        }
                    }, m[0].toUpperCase() + m.slice(1))
                )),
                el('label', { class: 'ge-label ge-between' }, [
                    el('span', {}, 'Speed'),
                    el('span', { class: 'ge-value', id: SPEED_VALUE_ID }, `${state.moveSpeed.toFixed(1)} u/s`)
                ]),
                el('input', {
                    class: 'ge-range', type: 'range', min: '1', max: '20', step: '0.5',
                    value: String(state.moveSpeed),
                    oninput: (e) => { setMoveSpeed(parseFloat(e.target.value), true); },
                    onchange: (e) => { setMoveSpeed(parseFloat(e.target.value)); }
                }),
                state.moveMode === 'walking' ? el('div', {}, [
                    el('label', { class: 'ge-label' }, 'Collision (voxel)'),
                    el('input', {
                        class: 'ge-input', type: 'text', value: state.collisionUrl,
                        placeholder: 'scene.voxel.json (blank = free-fly)',
                        onchange: (e) => { state.collisionUrl = e.target.value.trim(); state.dirty = true; }
                    })
                ]) : null
            ]),

            section(`Hotspots (${state.hotspots.length})`, [
                el('button', {
                    class: 'ge-btn',
                    disabled: state.engine === 'ready' ? false : 'disabled',
                    title: state.engine === 'ready' ? '' : 'Load a scene first',
                    onclick: captureHotspot
                }, '+ Capture current view'),
                el('div', { class: 'ge-list' }, state.hotspots.map((h, i) =>
                    el('div', { class: 'ge-item' }, [
                        el('span', { class: 'ge-idx' }, String(i + 1)),
                        el('span', {
                            class: 'ge-name ge-goto',
                            title: `${h.name}\nDouble-click to fly here`,
                            ondblclick: () => gotoHotspot(h)
                        }, h.name),
                        el('button', { class: 'ge-mini', title: 'Rename', onclick: () => renameHotspot(h.id) }, '✎'),
                        el('button', { class: 'ge-mini', title: 'Move up', onclick: () => moveHotspot(i, i - 1) }, '↑'),
                        el('button', { class: 'ge-mini', title: 'Move down', onclick: () => moveHotspot(i, i + 1) }, '↓'),
                        el('button', { class: 'ge-mini warn', title: 'Re-capture from current view', onclick: () => recaptureHotspot(h.id) }, '⟳'),
                        el('button', { class: 'ge-mini danger', title: 'Delete', onclick: () => deleteHotspot(h.id) }, '✕')
                    ])
                ))
            ]),

            section(`Info Spots (${state.infoSpots.length})`, [
                el('div', { class: 'ge-row' }, INFO_TYPES.map(t =>
                    el('button', {
                        class: `ge-mode${state.placeMode === t ? ' active' : ''}`,
                        style: state.placeMode === t ? `color:${TYPE_COLORS[t]};border-color:${TYPE_COLORS[t]}55` : '',
                        disabled: state.engine === 'ready' ? false : 'disabled',
                        title: state.engine === 'ready' ? '' : 'Load a scene first',
                        onclick: () => activatePlaceMode(t)
                    }, `+ ${t.toUpperCase()}`)
                )),
                el('div', { class: 'ge-list' }, state.infoSpots.map(s =>
                    el('div', { class: 'ge-item' }, [
                        el('span', { class: 'ge-typedot', style: `background:${TYPE_COLORS[s.type] ?? '#888'}` }),
                        el('span', { class: 'ge-name', title: s.name, ondblclick: () => editInfoSpot(s.id) }, s.name),
                        el('button', { class: 'ge-mini', title: 'Edit', onclick: () => editInfoSpot(s.id) }, '✎'),
                        el('button', { class: 'ge-mini danger', title: 'Delete', onclick: () => deleteInfoSpot(s.id) }, '✕')
                    ])
                ))
            ])
        ]),

        el('div', { class: 'ge-footer' }, [
            el('button', {
                class: 'ge-btn primary',
                disabled: state.hotspots.length === 0 ? 'disabled' : false,
                onclick: download
            }, '↓ Download tourSOG.json'),
            el('p', { class: 'ge-hint' }, state.slug
                ? `Upload to content/${state.slug}/tourSOG.json`
                : 'Upload to content/<slug>/tourSOG.json')
        ])
    ]);

    isolateInput(panel);
    document.body.appendChild(panel);
}

// ── Init ──────────────────────────────────────────────────────────────
(async () => {
    installDropHandlers();
    installNavGuard();
    await loadExistingTour();

    // Fall back to the scene filename the engine was pointed at, so a tour
    // authored from scratch still names the right file.
    if (!state.scene && ctx.contentUrl) state.scene = ctx.contentUrl.split('/').pop() ?? '';
    render();

    // Nothing to wait for until a scene is dropped.
    if (state.engine === 'empty') return;

    const hooks = await waitForAdminHooks();
    state.engine = hooks ? 'ready' : 'empty';
    state.hooksReady = !!hooks;
    render();
    if (!hooks) toast('Engine did not start — check the scene path');
})();

window.addEventListener('beforeunload', (e) => {
    if (!state.dirty) return;
    e.preventDefault();
    e.returnValue = '';
});

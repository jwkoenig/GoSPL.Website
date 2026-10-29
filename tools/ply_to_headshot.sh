#!/usr/bin/env bash
# Convert a gaussian-splat headshot PLY into an orbit-only founder tour scene:
#   recenter on the head (median splat position) -> optional crop sphere ->
#   decimate to ~target splats -> compress to SOG -> content/<slug>/scene.sog
#
# Usage: tools/ply_to_headshot.sh <input.ply> <slug> [target_splats=500000]
#   e.g. tools/ply_to_headshot.sh ~/scans/nik.ply team_nik
#
# Optional environment overrides:
#   SCALE=0.01         uniform scale applied after recentering, so the head ends
#                      up roughly metric (~0.25-0.4 units tall) to match the
#                      tour settings.json framing. Scans exported in cm need 0.01.
#                      Default: 1 (no scaling).
#   CROP_RADIUS=0.35   drop every splat farther than this from the head centre
#                      (world units; applied after recentering and SCALE). Default: no crop.
#   ROTATE=0,180,0     extra Euler rotation (degrees), e.g. if the viewer opens on
#                      the back of the head (the tour camera sits on +Z looking at
#                      the origin) or the head is upside down (try 0,0,180).
#   SH_BANDS=3         spherical-harmonic bands to keep (0-3). Fewer = smaller
#                      file and *much* faster SOG encoding on a CPU-only machine.
#   GPU=cpu            device for decimation / SOG encoding: an adapter index or
#                      'cpu'. Default: auto (needs WebGPU: Metal, D3D12 or Vulkan).
#                      On CPU, full-SH (SH_BANDS=3) SOG encoding of ~500K splats
#                      takes hours; use a GPU machine or SH_BANDS=0/1.
#   SPLAT_TRANSFORM="splat-transform"   command to run (default: pinned npx).
#
# scene.sog is gitignored (*.sog): upload it to the server's content/<slug>/
# by hand after running this.
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
    sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
fi

INPUT=$1
SLUG=$2
TARGET=${3:-500000}

[[ -f "$INPUT" ]] || { echo "error: input not found: $INPUT" >&2; exit 1; }
[[ "$SLUG" =~ ^[a-zA-Z0-9_-]+$ ]] || { echo "error: slug must match [a-zA-Z0-9_-]+" >&2; exit 1; }
[[ "$TARGET" =~ ^[0-9]+$ ]] || { echo "error: target_splats must be an integer" >&2; exit 1; }

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
OUT_DIR="$REPO/content/$SLUG"
OUT="$OUT_DIR/scene.sog"
mkdir -p "$OUT_DIR"

read -r -a ST <<< "${SPLAT_TRANSFORM:-npx -y @playcanvas/splat-transform@3.10.3}"
GPU_ARGS=()
[[ -n "${GPU:-}" ]] && GPU_ARGS=(-g "$GPU")
SH_BANDS=${SH_BANDS:-3}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Print "<count> <medX> <medY> <medZ> <stdX> <stdY> <stdZ>" from --stats json.
stats() {
    "${ST[@]}" -q --no-tty "$1" --stats json null | node -e '
        let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
            const j = JSON.parse(s.slice(s.indexOf("{")));
            const d = j.stats[0].data;
            console.log([j.numGaussians, ...d.median.slice(0, 3), ...d.stdDev.slice(0, 3)].join(" "));
        });'
}

echo "==> Reading $INPUT"
read -r N0 MX MY MZ _ _ _ < <(stats "$INPUT")
echo "    $N0 splats, median position ($MX, $MY, $MZ)"

# splat-transform's -t is applied in the engine's y-up frame (the PLY is
# rotated 180 deg about Z on import), so moving the PLY-space median to the
# origin means translating by (+x, +y, -z) — verified on a synthetic PLY.
TRANSLATE=$(node -e 'const [x,y,z]=process.argv.slice(1).map(Number); console.log([x, y, -z].join(","))' -- "$MX" "$MY" "$MZ")

ACTIONS=(-N -t "$TRANSLATE")
[[ -n "${ROTATE:-}" ]] && ACTIONS+=(-r "$ROTATE")
[[ -n "${SCALE:-}" ]] && ACTIONS+=(-s "$SCALE")
[[ -n "${CROP_RADIUS:-}" ]] && ACTIONS+=(-S "0,0,0,$CROP_RADIUS")
[[ "$SH_BANDS" != 3 ]] && ACTIONS+=(-H "$SH_BANDS")

# Decimation must be the final action and write a .ply, hence two passes.
# The splat count can drop below the target once the NaN filter and the crop
# have run, so the target is checked against the input count only;
# splat-transform leaves a source that is already at or below the target as is.
if (( N0 > TARGET )); then
    ACTIONS+=(-d "$TARGET")
    echo "==> Recentering + decimating to $TARGET splats"
else
    echo "==> Recentering (input already <= $TARGET splats, no decimation)"
fi
"${ST[@]}" --no-tty -w ${GPU_ARGS[@]+"${GPU_ARGS[@]}"} "$INPUT" "${ACTIONS[@]}" "$TMP/headshot.ply"

echo "==> Compressing to SOG (SH bands: $SH_BANDS)"
"${ST[@]}" --no-tty -w ${GPU_ARGS[@]+"${GPU_ARGS[@]}"} "$TMP/headshot.ply" "$OUT"

read -r N1 CX CY CZ SX SY SZ < <(stats "$OUT")
BYTES=$(wc -c < "$OUT" | tr -d ' ')
echo
echo "Wrote $OUT"
echo "  splats:          $N1"
echo "  size:            $(node -e 'console.log((process.argv[1]/1048576).toFixed(2))' "$BYTES") MB ($BYTES bytes)"
echo "  median position: ($CX, $CY, $CZ)   (should be ~0,0,0)"
echo "  position stdDev: ($SX, $SY, $SZ)"
echo "    settings.json assumes metric scale: camera 0.9 units out at fov 30 shows a"
echo "    ~0.48-unit-tall window (stdDev ~0.05-0.1 for a head). If the scan is"
echo "    a different scale, scale settings.json's camera/animTrack positions to match."
echo
echo "Next: upload $OUT to the server at content/$SLUG/scene.sog,"
echo "      then check https://gospl.io/tours/$SLUG/ (add ?debug for the camera panel)."

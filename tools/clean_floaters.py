"""Drop translucent "floater" splats that sit away from a scan's solid surface.

Headshot scans often carry a faint shell of low-opacity splats around the
head (baked-in background). Those can't be cropped by radius (they sit within
a few cm of the head) and a plain opacity cut makes skin blotchy, so this keeps
every splat that is either fairly opaque or close to an opaque one:

  keep = opacity > KEEP_OPACITY  or  within one voxel of a splat with opacity > SOLID_OPACITY

    python3 tools/clean_floaters.py in.ply out.ply [voxel_size]

voxel_size is in the PLY's own units (default 0.4, i.e. 4 mm for a scan in cm;
use 0.004 for a metric scan). Requires numpy. Binary little-endian PLY with
float32 properties only (the standard 3DGS export).
"""

import sys

import numpy as np

KEEP_OPACITY = 0.35
SOLID_OPACITY = 0.5


def read_ply(path):
    with open(path, 'rb') as f:
        header = b''
        while not header.endswith(b'end_header\n'):
            line = f.readline()
            if not line:
                sys.exit(f'error: no end_header in {path}')
            header += line
        lines = header.split(b'\n')
        if b'format binary_little_endian 1.0' not in lines:
            sys.exit('error: only binary_little_endian PLY is supported')
        props = [l.split() for l in lines if l.startswith(b'property')]
        if any(p[1] != b'float' for p in props):
            sys.exit('error: only float32 properties are supported')
        names = [p[-1].decode() for p in props]
        count = int(next(l for l in lines if l.startswith(b'element vertex')).split()[-1])
        data = np.fromfile(f, dtype=np.float32, count=count * len(names)).reshape(count, len(names))
    return header, names, count, data


def near_solid(xyz, solid, voxel):
    idx = np.floor((xyz - xyz.min(0)) / voxel).astype(np.int64) + 1
    occ = np.zeros(idx.max(0) + 2, bool)
    s = idx[solid]
    occ[s[:, 0], s[:, 1], s[:, 2]] = True
    for ax in range(3):  # dilate by one voxel along each axis
        occ = occ | np.roll(occ, 1, ax) | np.roll(occ, -1, ax)
    return occ[idx[:, 0], idx[:, 1], idx[:, 2]]


def main():
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    voxel = float(sys.argv[3]) if len(sys.argv) == 4 else 0.4

    header, names, count, data = read_ply(src)
    col = {n: i for i, n in enumerate(names)}
    opacity = 1 / (1 + np.exp(-data[:, col['opacity']]))
    xyz = data[:, [col['x'], col['y'], col['z']]]

    keep = (opacity > KEEP_OPACITY) | near_solid(xyz, opacity > SOLID_OPACITY, voxel)
    kept = int(keep.sum())

    with open(dst, 'wb') as f:
        f.write(header.replace(f'element vertex {count}'.encode(), f'element vertex {kept}'.encode()))
        data[keep].tofile(f)
    print(f'clean_floaters: kept {kept} of {count} splats ({count - kept} floaters removed)')


if __name__ == '__main__':
    main()

# CLAUDE.md

Background on the player, admin and tours is in `README.md`, `player/README.md` and `handover.md`.

## Adding or changing a project

- Projects live in `data/projects.js`. To take one off the site without deleting it, set `hidden: true`.
- A tour needs `content/<slug>/` (`settings.json`, `tourSOG.json`, optional `splash.json`). The project `url` is then `https://gospl.io/tours/<slug>/`.
- `*.sog` files are gitignored. The user uploads them to the server by hand.
- Tile images go in `public/assets/projects/<slug>.jpg`.
- **Always read the splat count from the SOG yourself**, never ask for it or guess. A `.sog` is a zip archive; its `meta.json` has the count (`count` in SOG v2, or `means.shape[0]` in v1). Write it the way the existing `splats` values are written, e.g. `2M`. If the SOG can't be downloaded (Dropbox or gospl.io blocked by the session's network policy), say so and leave `splats` out rather than inventing a value.
- Leave out spec fields (`splats`, `area`, `capture`) that aren't known. The detail view skips missing ones.

## Building

`npm run build` writes to `~/Desktop/BUILD` by default, which fails outside the user's machine. Verify builds with `NEXT_DIST_DIR=out npm run build`, then delete `out/`.

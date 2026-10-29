# Deployment

There are **two separate deploy targets** for the marketing site, built
from the same repo but shipped by completely different mechanisms. Mixing
them up — or forgetting one exists — is the single most likely reason a
change that's clearly fixed in the repo doesn't look fixed to a visitor.

| | Production (`gospl.io`) | GitHub Pages preview |
|---|---|---|
| Trigger | **Manual** — someone runs a build and uploads it, or starts the workstation workflows (below) | **Automatic** — every push to `main` (`.github/workflows/deploy.yml`) |
| `NEXT_BASE_PATH` | `''` (root) | `/GoSPL.Website` |
| `NEXT_DIST_DIR` | `~/Desktop/BUILD` by default (outside the repo; override with `NEXT_DIST_DIR=build` on Windows, since Turbopack refuses an out-of-project `distDir` there) | `out` |
| Includes `player/`/`admin/`/`content/` | Yes — deployed alongside the Next.js build into one `public_html/SITE/` folder | No — Pages only serves the static Next.js export |
| Covers `.sog` scene files | N/A to this build step — dropped in manually, gitignored | N/A |

## Deploying to production

1. `npm run build` (uses `NODE_ENV=production` implicitly via
   `next build`, so `basePath` resolves to `''` per `next.config.mjs`).
2. The static export lands in `NEXT_DIST_DIR` (default
   `~/Desktop/BUILD`, deliberately outside the repo/Dropbox-synced
   folder — see `next.config.mjs`'s comment).
3. Upload that build's contents into `public_html/SITE/` on the shared
   host, **alongside** — not overwriting — `player/`, `admin/`, and
   `content/`, which are deployed the same way but aren't part of this
   Next.js build (see `player/README.md`).
4. The root `.htaccess` (hand-maintained directly on the server, **not
   tracked in this repo**) rewrites `gospl.io/...` requests into
   `SITE/...` transparently, and does the `/tours/<slug>` → player
   clean-URL rewrite.

This can also be run from GitHub (and so by Claude, including cloud
sessions) through the workstation runner — see the next section. Either
way it only happens when someone starts it. **A commit merged to `main`
does not, by itself, reach `gospl.io`.**

## Deploying through the office workstation (beta → live)

The office workstation (Windows, GPU) runs a GitHub Actions
**self-hosted runner** with the labels `self-hosted, windows, gospl-gpu`.
The runner only makes outbound connections to GitHub, so no ports are
opened. Two manual workflows use it:

| Workflow | What it does |
|---|---|
| `.github/workflows/deploy-beta.yml` | Checks out `ref`, `npm ci`, builds with `NEXT_DIST_DIR=build`, runs the optional GPU step, then the beta upload command → `beta.gospl.io` |
| `.github/workflows/promote-live.yml` | Runs the live command → `gospl.io`. Uses the `production` environment, which **requires a human approval** before it runs |

Start either one from the Actions tab ("Run workflow"), or ask Claude.
Claude starts it with the GitHub tools and reads the logs. Claude can
queue `promote-live` but can't approve it; that click stays with a person.

The commands are **repository variables** (Settings → Secrets and
variables → Actions → Variables), so the workstation's own scripts stay
where they are:

- `DEPLOY_BETA_CMD`: PowerShell command line that uploads to beta, e.g.
  `& C:\gospl\deploy.ps1 -Target beta -Source $env:BUILD_DIR`
  (`BUILD_DIR` points at the fresh build).
- `DEPLOY_LIVE_CMD`: command line that promotes beta to live.
- `GPU_PREP_CMD` (optional): GPU convert/compress step, run after the
  build. The step is skipped when the variable is empty.

Upload credentials stay on the workstation (or in Actions secrets),
never in the repo.

One-time setup:

1. Repo → Settings → Actions → Runners → *New self-hosted runner* →
   Windows. Install it **as a service**, with the extra label `gospl-gpu`.
2. Settings → Environments → create `production` → add yourself under
   *Required reviewers*.
3. Set the variables above.
4. Settings → Actions → General → require approval for workflows from
   outside collaborators. **Never** add `pull_request` triggers to
   workflows that run on this runner: fork PRs would run code on the
   workstation.

## GitHub Pages preview

Fully automatic on every push to `main` — see
`.github/workflows/deploy.yml`. Useful for a quick visual check of a
change without doing the manual production deploy, **but it is not the
production site** and browsing it doesn't confirm production is current.
It also uses a different `basePath` (`/GoSPL.Website`), which is exactly
why every asset/link reference in the codebase goes through the `BASE`
constant instead of a hardcoded root path (see `ARCHITECTURE.md`).

## Why a fix can look reverted when the code is fine

This has already happened once (the "Open full tour" desktop-only
button, tracked in `DESIGN-SYSTEM.md`'s registry) and is worth
checking first whenever a *known-fixed* behavior appears broken again on
the live site:

1. **Confirm the fix is actually still in the repo** — `git log`/`git blame`
   the relevant file/selector. If it's there, the code isn't the problem.
2. **Confirm production was rebuilt and re-uploaded *after* that fix was
   committed.** Because step 1 above is entirely manual, a fix can sit
   correctly in `main` (and even be visibly correct on the GitHub Pages
   preview, which *did* auto-deploy) while `gospl.io` is still serving a
   build from before the fix — indefinitely, until someone runs the
   manual deploy again. This is the default failure mode for this
   project's deploy setup, not an edge case.
3. **Rule out caching last**, not first — browser cache, and any
   CDN/cache layer the host puts in front of `public_html`. Hard-refresh
   or test in a private window before concluding it's a cache issue,
   since a stale-production-build is far more likely given (2).

If you fix something and it's meant to go live, **say so explicitly and
either deploy it or ask the human to** — don't assume a merge to `main`
is enough for the production site.

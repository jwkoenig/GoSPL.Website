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

The production deploy script, `deploy.ps1` with `deploy.config.psd1`,
lives on the office workstation (Windows) in `C:\GOSPL\SERVER_DEPLOY`,
**not in this repo**. `deploy.ps1 beta -Pull` hard-resets its own clones of
PLAY (`master`) and this repo (`main`) to origin, builds the site
(`NEXT_DIST_DIR=build`, root `basePath`), copies PLAY's `player/`,
`admin/`, `content/` etc. over the build into `stage\`, and uploads only
the files whose hash changed over SFTP. `deploy.ps1 live` uploads that
same stage and **refuses unless beta already received exactly it**. Its
state (`repos\`, `stage\`, `.manifest-*.json`, `.state-beta.json`,
encrypted SFTP password) sits next to the script, which is why the
workflows call it in place instead of checking anything out.

The workstation also runs a GitHub Actions **self-hosted runner**
(labels `self-hosted, windows, gospl-gpu`). It only makes outbound
connections to GitHub. Two manual workflows use it:

| Workflow | Runs |
|---|---|
| `.github/workflows/deploy-beta.yml` | `deploy.ps1 beta -Pull` (inputs: `dry_run`, `full`) → `beta.gospl.io` |
| `.github/workflows/promote-live.yml` | `deploy.ps1 live -Yes` (input: `dry_run`) → `gospl.io`, after a **required human approval** on the `production` environment |

Start either one from the Actions tab ("Run workflow"), or ask Claude.
Claude starts it with the GitHub tools and reads the job log. Claude can
queue `promote-live` but can't approve it: that click replaces the
script's "type 'live'" prompt. Watch the log for the script's warning
about the hashed CSS chunk `06k1jxr0bcst_.css`. If it shows, the
`gospl-ui.css` alias in the root `.htaccess` needs updating on beta and
live.

One-time setup:

1. Run `.\deploy.ps1 beta -Pull` once by hand on the workstation if you
   haven't yet, so the encrypted password file and SSH known_hosts exist.
   Unattended runs fail with a clear message instead of prompting.
2. Repo → Settings → Actions → Runners → *New self-hosted runner* →
   Windows. Install it **as a service running under your own Windows
   account** (the installer asks): the DPAPI-encrypted password, git
   credentials for PLAY and known_hosts only work for that user. Add the
   label `gospl-gpu`. `git`, `node`/`npm` and `sftp` must be on that
   user's PATH.
3. Settings → Environments → create `production` → add yourself under
   *Required reviewers*.
4. Optional: if the script moves, set the repository variable
   `DEPLOY_SCRIPT` to its new full path.
5. Settings → Actions → General → require approval for workflows from
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

# P13: Railway-Deployment von Nixpacks auf Dockerfile umstellen

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This
document must be maintained in accordance with `docs/PLANS.md`, which is checked into this
repository at the repository root under `docs/PLANS.md`; read that file before revising this
plan.

## Purpose / Big Picture

Today the production build on Railway (railway.app, the hosting platform this project deploys
to) is driven by Nixpacks, a build tool that reads a file called `nixpacks.toml` at the
repository root and uses it to infer which language runtimes (Python, Node.js) and commands are
needed to produce a container image. Railway now treats Nixpacks as a deprecated builder in favor
of a plain `Dockerfile` (a text file that gives explicit, step-by-step instructions for building a
container image, using the standard Docker image format that any container platform understands).
The purpose of this plan is to replace the Nixpacks-based build with a `Dockerfile` at the
repository root, so that Railway builds and runs the exact same one-service deployment (Flask
serving both the API and the built Angular frontend, backed by Railway's managed PostgreSQL) but
via a build mechanism Railway does not consider deprecated.

After this change, a developer can run `docker build -t lernzeit .` from the repository root and
get a working container image without Nixpacks being installed anywhere, and can run that image
locally against a PostgreSQL database to see the same application that today runs on Railway. On
Railway itself, nothing about the running application changes for an end user: the same routes,
the same single service, the same environment variables. Only the build mechanism changes.

## Progress

- [x] (2026-08-20) ExecPlan written and reviewed against the current Nixpacks setup.
- [x] (2026-08-20) Milestone 1: `Dockerfile` and `.dockerignore` written; `docker build -t
      lernzeit-test .` succeeded (both stages). Commit `Dockerfile fuer Railway-Deployment
      ergaenzt`.
- [x] (2026-08-20) Milestone 2: `start.sh` simplified (venv activation line removed). Commit
      `start.sh: Venv-Aktivierung entfernt (nicht mehr noetig ohne Nixpacks)`.
- [x] (2026-08-20) Milestone 3: `railway.json` now pins `"builder": "DOCKERFILE"` with
      `"dockerfilePath": "Dockerfile"`; `nixpacks.toml` removed. Commit `railway.json:
      Dockerfile-Builder statt Nixpacks, nixpacks.toml entfernt`.
- [x] (2026-08-20) Milestone 4: `README.md` and `docs/MS4_Technische_Dokumentation.md` updated to
      describe the Dockerfile build instead of Nixpacks. Commit `Doku: Dockerfile-Deployment statt
      Nixpacks beschrieben`.
- [x] (2026-08-20) Unplanned Milestone 3.5 (added during Milestone 5 verification, see Surprises
      & Discoveries): added `.gitattributes` forcing `start.sh` to always check out with LF line
      endings, and re-checked-out `start.sh` from `HEAD` to normalize the working tree copy.
      Commit `gitattributes: start.sh immer mit LF auschecken (Docker-Build unter Windows
      scheitert sonst an CRLF)`.
- [x] (2026-08-20) Milestone 5: end-to-end local verification completed — image rebuilt, run
      against the `lernzeit-db` Postgres container on the `projekt-lernzeit_manager_default`
      network, `flask db upgrade` and Gunicorn started cleanly, `GET /api/health` returned HTTP
      200 `{"status":"ok"}`, `GET /` returned HTTP 200 HTML containing `<app-root>`. Verification
      container stopped afterward; the `db` service was left running. All commits for this plan
      are on branch `feature/railway-dockerfile-deployment`; branch not yet pushed, no PR opened
      (awaiting explicit go-ahead per this plan's Validation and Acceptance section).

## Surprises & Discoveries

- Observation: the first end-to-end run of the container (Milestone 5, Step 3) failed instantly
  with `start.sh: 2: set: Illegal option -` and no further log output, even though `docker build`
  had succeeded and `start.sh` looked correct when read in this session.
  Evidence: `docker run --name lernzeit-verify ... lernzeit-test` (without `-d`, to see the error
  directly) printed exactly `start.sh: 2: set: Illegal option -` and then exited. Running
  `xxd start.sh` on the working-tree file showed `0d0a` (CRLF) line terminators throughout,
  e.g. `2321 2f62 696e 2f73 680d 0a73 6574 202d 650d 0a...` — the `\r` before every `\n`. Running
  `git show HEAD:start.sh | xxd` showed the committed blob only has `0a` (LF) — so the file is
  stored correctly in git, but this Windows machine's `core.autocrlf` is `true` (confirmed via
  `git config --get core.autocrlf`), which rewrites every checked-out text file's line endings
  from LF to CRLF. Docker's `COPY` reads whatever is in the working tree, so the image ended up
  with a CRLF `start.sh`, and `/bin/sh` inside the Debian-based container interprets the trailing
  `\r` on the `set -e` line as part of the `-e` option's argument, which it rejects.
  Consequence: this is not a bug that would affect a real Railway deployment (Railway's Linux
  build servers do not have `core.autocrlf=true`, so they would check out `start.sh` with LF and
  never hit this), but it silently breaks `docker build`/`docker run` verification for every team
  member on Windows, which is all three team members per `AGENTS.md`. Fixed by adding
  `.gitattributes` with `start.sh text eol=lf`, which forces LF for that one file on every
  checkout regardless of `core.autocrlf`, then re-checking out the file (`git rm --cached
  start.sh` left the working-tree copy in place as an untracked file, so the working step that
  actually fixed the working-tree copy was `git checkout HEAD -- start.sh` after staging the new
  `.gitattributes`). After that fix, `xxd start.sh` showed only `0a` line terminators and the
  container started cleanly (see Milestone 5 log transcript in Artifacts and Notes).

## Decision Log

- Decision: Use a two-stage Dockerfile (a Node.js stage that builds the Angular frontend, and a
  Python stage that installs the Flask backend and copies in the built frontend), rather than a
  single-stage image that installs both Node.js and Python.
  Rationale: A multi-stage build keeps the final runtime image free of Node.js, npm, and the
  frontend's `node_modules` (which are only needed to produce the static files, not to serve
  them). This mirrors what Nixpacks effectively did in `[phases.build]` (build the frontend, then
  only ship the compiled output), and keeps the image smaller.
  Date/Author: 2026-08-20, Claude (on request of Julian Wagner).

- Decision: Use `node:22-slim` (Debian-based) for the frontend build stage rather than
  `node:22-alpine` (Alpine Linux, musl-libc based).
  Rationale: Angular's build tool (`@angular/build`, which wraps a bundler called esbuild)
  ships pre-compiled native binaries per platform. These binaries are built and tested against
  glibc (the C library Debian/Ubuntu use); Alpine uses a different C library called musl, which
  has caused esbuild install/runtime failures for other projects. `node:22-slim` avoids that class
  of problem entirely and only costs a somewhat larger build-stage image, which is discarded and
  never shipped to Railway (only the final stage's image is deployed).
  Date/Author: 2026-08-20, Claude (on request of Julian Wagner).

- Decision: Do not create a Python virtual environment (venv) inside the final Docker image;
  install `backend/requirements.txt` directly into the image's system Python.
  Rationale: A venv exists to isolate a Python installation's packages from other projects on the
  same machine. A Docker image already is that isolation boundary — nothing else runs inside it —
  so a venv adds an extra directory and an extra "activate" step for no isolation benefit. This
  also lets `start.sh` drop the `. /app/.venv/bin/activate` line it needed under Nixpacks.
  Date/Author: 2026-08-20, Claude (on request of Julian Wagner).

- Decision: Pin `railway.json`'s `build.builder` to `"DOCKERFILE"` with an explicit
  `dockerfilePath` of `"Dockerfile"`, rather than relying on Railway auto-detecting the
  Dockerfile.
  Rationale: This repository was already burned once by builder auto-detection: on 2026-08-12,
  Railway's newer "Railpack" builder ignored `nixpacks.toml` and started the container without
  running the venv/Angular build steps, causing a crash loop (`cannot open
  /app/.venv/bin/activate`), which was fixed by pinning `"builder": "NIXPACKS"` in `railway.json`.
  The same category of surprise is avoided going forward by pinning the builder explicitly again,
  now to `"DOCKERFILE"`.
  Date/Author: 2026-08-20, Claude (on request of Julian Wagner).

- Decision: Add a `.gitattributes` file at the repository root with the single line `start.sh
  text eol=lf`, rather than relying on every contributor's local git configuration.
  Rationale: discovered during Milestone 5 verification (see Surprises & Discoveries) that this
  Windows machine's `core.autocrlf=true` setting silently rewrites `start.sh` to CRLF line
  endings on checkout, which breaks it inside the Linux-based Docker image (`/bin/sh` reads the
  trailing `\r` as part of the `set -e` line and refuses to start). `.gitattributes` fixes this at
  the repository level for every future checkout on every contributor's machine, instead of
  requiring each of the three team members (all on Windows, per `AGENTS.md`) to remember to set
  `core.autocrlf=false` or use `git config core.eol lf` themselves. This was not part of the
  original plan and was added because Milestone 5 could not otherwise be verified as passing.
  Date/Author: 2026-08-20, Claude, during Milestone 5 execution.

- Decision: Also rewrite the Nixpacks description in `docs/MS4_Technische_Dokumentation.md`
  section 5.2 to describe the Dockerfile build, in the same change.
  Rationale: That file is graded technical documentation describing the current production setup;
  leaving it describing a build mechanism that no longer exists would misrepresent the project to
  a reader (e.g. a tutor). The user confirmed this file should be kept in sync as part of this
  plan, in addition to `README.md` (whose accuracy `AGENTS.md` already mandates for every change).
  Date/Author: 2026-08-20, Julian Wagner (confirmed via clarifying question), recorded by Claude.

## Outcomes & Retrospective

All five milestones plus the unplanned `.gitattributes` fix are complete and locally verified.
The repository now builds and runs the exact same application (same routes, same single Railway
service, same environment variables) via `docker build -t lernzeit-test .` and `docker run
lernzeit-test`, with no Nixpacks involved anywhere: `nixpacks.toml` is deleted, `railway.json`
pins `"builder": "DOCKERFILE"`, and both `README.md` and `docs/MS4_Technische_Dokumentation.md`
describe the Dockerfile-based build. `start.sh` was simplified (no venv activation needed in a
container) and, thanks to the `.gitattributes` fix, now reliably checks out with LF line endings
regardless of the contributor's `core.autocrlf` setting.

The one gap against the original Purpose/Big Picture statement is intentional, not an oversight:
this plan verifies the new build and runtime entirely locally (Milestone 5) and explicitly does
not push the branch or trigger a real Railway deployment, because doing so is a visible action on
shared infrastructure that this project's working agreement requires explicit confirmation for
(see Validation and Acceptance). The actual Railway cutover — merging this branch to `main` — still
needs to happen for the deprecated Nixpacks builder to stop being used in production; that is the
next step once the branch is pushed, a PR is opened and reviewed (per `README.md`'s
"Git-Workflow & CI" section, at least one teammate review is required), and CI is green.

Lesson learned, worth remembering for future ExecPlans on this Windows-only team: any shell script
committed to this repository is at risk of being silently corrupted to CRLF on checkout unless
`.gitattributes` pins it to `eol=lf`. This had apparently gone unnoticed since `start.sh` was
first added (per `docs/ExecPlans/active/2026-08-10_MS4-Abschluss.md`) because Nixpacks' build
environment presumably normalized or tolerated it differently, or simply because no one had
previously tried a from-scratch local Docker build of the deployment artifact on Windows to
exercise this path.

## Context and Orientation

This repository is a monorepo (one repository containing both the frontend and backend code)
with three top-level pieces relevant to this plan, all at the repository root
(`G:\Programmieren\__Projekte\Projekt-Lernzeit_Manager` locally, i.e. the directory that contains
`README.md`, `AGENTS.md`, `frontend/`, and `backend/`):

- `frontend/` is an Angular application. Its production build is produced by running
  `npm run build` inside `frontend/`, which (per `frontend/angular.json`) writes static files
  (HTML, CSS, JS) to `frontend/dist/frontend/browser/`, relative to the repository root. This path
  is not configurable by this plan — it comes from Angular's default output layout and is already
  relied upon elsewhere (see next bullet), so it must not change.
- `backend/` is a Flask application (Python). Its production entry point is `backend/wsgi.py`,
  which calls `create_app("production")` from `backend/app/__init__.py`. When the app runs with
  `config_name == "production"`, `backend/app/__init__.py` calls `_register_spa_fallback(app)`,
  which serves every non-API route by looking up the requested path inside a constant
  `_FRONTEND_DIST`, defined at the top of that file as
  `Path(__file__).parent.parent.parent / "frontend" / "dist" / "frontend" / "browser"`. Because
  `__file__` there is `backend/app/__init__.py`, `parent.parent.parent` resolves to the repository
  root, so `_FRONTEND_DIST` is always `<repo-root>/frontend/dist/frontend/browser`. This means:
  wherever this plan's Dockerfile places the compiled frontend, it must land at exactly
  `frontend/dist/frontend/browser/` under the working directory the Flask process runs from, and
  that working directory's parent-of-parent-of-parent-from-`app/__init__.py` layout must be
  preserved (i.e. the container's `backend/` and `frontend/` directories must be siblings, both
  directly under the same working directory, e.g. `/app/backend/` and `/app/frontend/`).
- The repository root currently has three files that together define today's Nixpacks-based
  build and must all be replaced or removed by this plan:
  - `nixpacks.toml` — read by Railway's Nixpacks builder. It currently installs `python3`,
    `python3-pip`, `python3-venv`, `curl`, and `ca-certificates` via `apt`; installs Node.js 22 via
    NodeSource's setup script; creates a Python virtual environment at `/app/.venv`; runs
    `pip install -r backend/requirements.txt` inside that venv; runs `npm --prefix frontend ci`;
    and finally runs `npm --prefix frontend run build`. Its `[start]` section runs `sh start.sh`.
  - `railway.json` — currently `{"$schema": "https://railway.com/railway.schema.json", "build":
    {"builder": "NIXPACKS"}}`. This is what pins Railway to the Nixpacks builder instead of
    letting it auto-detect (see the Decision Log entry above about the 2026-08-12 incident this
    guarded against).
  - `start.sh` at the repository root — the container's startup script, currently:

        #!/bin/sh
        set -e
        . /app/.venv/bin/activate
        cd backend
        FLASK_APP=wsgi flask db upgrade
        exec gunicorn wsgi:application -w 2 -b "0.0.0.0:${PORT:-8000}"

    It activates the venv Nixpacks created, changes into `backend/`, runs the database migrations
    via `flask db upgrade` (idempotent — running it again when already up to date is a no-op), and
    then replaces the shell process with `gunicorn` (a Python production web server) bound to the
    port Railway provides in the `PORT` environment variable (defaulting to 8000 if unset, which
    matters for local testing where `PORT` is not set).
- `backend/requirements.txt` lists the Python packages the backend needs: `Flask`, `Flask-CORS`,
  `Flask-JWT-Extended`, `Flask-Migrate`, `Flask-SQLAlchemy`, `gunicorn`, `psycopg2-binary`, and
  `python-dotenv`. None of these need a C compiler to install on Linux — `psycopg2-binary`
  specifically ships a self-contained wheel (a pre-built Python package format) that bundles the
  PostgreSQL client library, which is exactly why the project chose the `-binary` variant. This
  matters because it means the final Docker image's base (`python:3.12-slim`, a minimal Debian-
  based Python image) does not need `build-essential` or any other compiler toolchain installed —
  a plain `pip install -r backend/requirements.txt` succeeds without extra apt packages.
- `docker compose` is already used in this project, but only for local PostgreSQL
  (`docker-compose.yml` at the repository root, defining a `db` service). That file is unrelated
  to this plan and must not be changed — this plan is only about how the *application* container
  is built and started for Railway, not about local Postgres.
- Docker Desktop is confirmed installed and working in this environment (`docker --version`
  reported `Docker version 29.6.2`), so every verification step in this plan that requires
  `docker build` / `docker run` can actually be executed and its output observed, not merely
  described.

Two files need documentation updates because they currently describe the Nixpacks build in
detail and would otherwise become inaccurate:

- `README.md`, section "Deployment auf Railway" (the paragraph starting "Railway baut aus dem
  GitHub-Repo..."), which currently reads:

        Railway baut aus dem GitHub-Repo und hostet die Anwendung als **einen einzigen Dienst** plus eine
        PostgreSQL-Datenbank – es gibt keinen separaten Frontend-Dienst. `nixpacks.toml` im Repo-Root
        beschreibt den Build: Python-venv und Backend-Abhängigkeiten installieren, das Angular-Frontend mit
        `npm --prefix frontend run build` bauen, danach per `start.sh` zuerst `flask db upgrade` und dann
        Gunicorn starten. Flask liefert die gebauten Angular-Dateien selbst aus
        (`_register_spa_fallback` in `backend/app/__init__.py`) – daher reicht ein Dienst. Der Build läuft
        über den **Nixpacks-Builder**, gepinnt in `railway.json`; der neuere Railpack-Builder ignoriert
        `nixpacks.toml` und lässt den Container ohne venv/Angular-Build starten (abgesichert am
        12.08.2026: Container-Crashloop mit `cannot open /app/.venv/bin/activate`, behoben durch
        `railway.json` mit `"builder": "NIXPACKS"`). Dokumentation: https://docs.railway.app/

- `docs/MS4_Technische_Dokumentation.md`, section "5.2 Produktionsumgebung (Railway)", which
  currently has a subsection literally titled "**Build-Prozess (Nixpacks):**" describing the same
  five Nixpacks steps in list form, followed by a "**Start-Prozess (`start.sh`)**" subsection.

`docs/ExecPlans/active/2026-08-10_MS4-Abschluss.md` also mentions Nixpacks, but it is a historical
record of what MS4 originally shipped with (its Progress checkboxes are already marked done for
the Nixpacks setup); this plan intentionally does not touch it, matching how the completed plans
under `docs/ExecPlans/completed/` are left as historical records of their own milestones.

## Plan of Work

Milestone 1 creates the two new files this plan is centered on: `Dockerfile` and `.dockerignore`,
both at the repository root (next to `nixpacks.toml`, which Milestone 3 deletes). Milestone 2
simplifies `start.sh` to match a Docker runtime instead of a Nixpacks-built venv. Milestone 3
switches Railway's configuration to point at the new Dockerfile and removes the now-unused
Nixpacks files. Milestone 4 updates the two documentation files identified above. Milestone 5 is
purely verification: build the image, run it against a real Postgres container on the same Docker
network, and confirm both the API and the served frontend work, then commit everything together
(this plan's change is small enough to land as very few commits; do not force artificial splits
where a single commit is the natural unit of "this now builds and runs").

## Concrete Steps

All commands below assume the current working directory is the repository root
(`G:\Programmieren\__Projekte\Projekt-Lernzeit_Manager` on this machine; use the equivalent path
on another machine) unless a step says otherwise, and assume Docker Desktop is running (check with
`docker info`; if it prints connection-refused-style errors, start Docker Desktop and wait for its
whale icon in the system tray to stop animating before retrying).

### Milestone 1: `Dockerfile` and `.dockerignore`

- [ ] Step 1: Create `Dockerfile` at the repository root with exactly this content:

        # syntax=docker/dockerfile:1

        # ---- Frontend-Build-Stufe: kompiliert die Angular-App zu statischen Dateien ----
        FROM node:22-slim AS frontend-build
        WORKDIR /app/frontend
        COPY frontend/package.json frontend/package-lock.json ./
        RUN npm ci
        COPY frontend/ ./
        RUN npm run build

        # ---- Laufzeit-Stufe: Flask-Backend + Gunicorn, liefert auch das gebaute Frontend aus ----
        FROM python:3.12-slim AS runtime
        WORKDIR /app

        COPY backend/requirements.txt backend/requirements.txt
        RUN pip install --no-cache-dir -r backend/requirements.txt

        COPY backend/ backend/
        COPY start.sh start.sh
        COPY --from=frontend-build /app/frontend/dist/frontend/browser frontend/dist/frontend/browser

        ENV FLASK_ENV=production
        EXPOSE 8000

        CMD ["sh", "start.sh"]

  Every `COPY <src> <src-relative-path>` above that names a bare directory (e.g. `backend/
  backend/`) copies that directory's contents into a same-named directory in the image, so after
  the `runtime` stage's `COPY` steps, the image's `/app` directory contains `backend/` (the whole
  backend source tree), `frontend/dist/frontend/browser/` (only the compiled static files, not
  the rest of `frontend/`), and `start.sh`. That matches the sibling layout `backend/app/__init__.py`
  requires, as established in Context and Orientation above.

- [ ] Step 2: Create `.dockerignore` at the repository root with exactly this content:

        .git
        .github
        docs
        *.md
        frontend/node_modules
        frontend/dist
        frontend/e2e
        frontend/.angular
        frontend/coverage
        backend/.venv
        backend/instance
        backend/.pytest_cache
        backend/.ruff_cache
        **/__pycache__
        **/*.pyc
        .env
        .vscode

  This keeps things Docker never needs (git history, docs, local virtualenvs, prior build output,
  test caches, editor settings) out of the "build context" (the set of files Docker reads when
  building an image), which makes builds faster and avoids ever accidentally baking a local `.env`
  file's secrets into an image layer.

- [ ] Step 3: Build the image to confirm both stages complete without errors:

  Run (from the repository root): `docker build -t lernzeit-test .`

  Expected: the build prints progress for both stages (`[frontend-build ...]` steps, then
  `[runtime ...]` steps) and ends with a line like `=> => naming to docker.io/library/lernzeit-test`
  and exit code 0. If the `npm ci` step fails with a message about `package-lock.json` being out
  of sync with `package.json`, stop and report this — it means the two files disagree and must be
  reconciled outside this plan's scope (this plan assumes they already agree, since `npm ci` is
  already how CI and local setup install frontend dependencies today, per `README.md`'s "Was du
  installieren musst" section). If the `pip install` step fails, read the printed error; the most
  likely cause is a transient network failure reaching PyPI, in which case simply re-run the
  build.

- [ ] Step 4: Commit.

  Run: `git add Dockerfile .dockerignore`, then
  `git commit -m "Dockerfile fuer Railway-Deployment ergaenzt"`.

### Milestone 2: simplify `start.sh`

- [ ] Step 1: Open `start.sh` at the repository root. It currently reads:

        #!/bin/sh
        set -e
        . /app/.venv/bin/activate
        cd backend
        FLASK_APP=wsgi flask db upgrade
        exec gunicorn wsgi:application -w 2 -b "0.0.0.0:${PORT:-8000}"

  Remove the `. /app/.venv/bin/activate` line (there is no venv in the new Docker image — see the
  Decision Log entry above explaining why one is no longer created), so the file reads:

        #!/bin/sh
        set -e
        cd backend
        FLASK_APP=wsgi flask db upgrade
        exec gunicorn wsgi:application -w 2 -b "0.0.0.0:${PORT:-8000}"

- [ ] Step 2: Commit.

  Run: `git add start.sh`, then
  `git commit -m "start.sh: Venv-Aktivierung entfernt (nicht mehr noetig ohne Nixpacks)"`.

### Milestone 3: point Railway at the Dockerfile, remove Nixpacks files

- [ ] Step 1: Open `railway.json` at the repository root. It currently reads:

        {
          "$schema": "https://railway.com/railway.schema.json",
          "build": {
            "builder": "NIXPACKS"
          }
        }

  Replace its contents with:

        {
          "$schema": "https://railway.com/railway.schema.json",
          "build": {
            "builder": "DOCKERFILE",
            "dockerfilePath": "Dockerfile"
          }
        }

  `dockerfilePath` is given explicitly (even though `Dockerfile` at the repository root is also
  Railway's default lookup location) so that a future reader of this file does not have to know
  Railway's default to understand which file drives the build — see the Decision Log entry above
  about why this project pins builder configuration explicitly rather than relying on
  auto-detection.

- [ ] Step 2: Delete `nixpacks.toml` at the repository root (it is fully superseded by the new
      `Dockerfile`; nothing else in the repository reads it once `railway.json` no longer selects
      the Nixpacks builder).

  Run: `git rm nixpacks.toml`.

- [ ] Step 3: Commit.

  Run: `git add railway.json`, then
  `git commit -m "railway.json: Dockerfile-Builder statt Nixpacks, nixpacks.toml entfernt"`.

  (The `git rm` from Step 2 already staged the deletion, so this commit captures both the
  `railway.json` change and the `nixpacks.toml` removal together — that is intentional: it is one
  logical change, "stop using Nixpacks", and splitting it across commits would leave an
  intermediate commit where `railway.json` points at a builder Railway would then use inconsistent
  input for.)

### Milestone 4: documentation updates

- [ ] Step 1: In `README.md`, find the paragraph in the "Deployment auf Railway" section that
      starts with "Railway baut aus dem GitHub-Repo und hostet die Anwendung als **einen
      einzigen Dienst**" (quoted in full in Context and Orientation above). Replace it with:

        Railway baut aus dem GitHub-Repo und hostet die Anwendung als **einen einzigen Dienst** plus eine
        PostgreSQL-Datenbank – es gibt keinen separaten Frontend-Dienst. Der Build läuft über ein
        `Dockerfile` im Repo-Root (ein zweistufiger Build): Die erste Stufe baut mit `node:22-slim` das
        Angular-Frontend (`npm ci` und `npm run build` in `frontend/`), die zweite Stufe installiert auf
        `python:3.12-slim` die Backend-Abhängigkeiten aus `backend/requirements.txt`, kopiert den
        Backend-Code sowie das aus der ersten Stufe gebaute Frontend nach
        `frontend/dist/frontend/browser` und startet den Container mit `start.sh`, das zuerst
        `flask db upgrade` und danach Gunicorn ausführt. Flask liefert die gebauten Angular-Dateien selbst
        aus (`_register_spa_fallback` in `backend/app/__init__.py`) – daher reicht ein Dienst. Der Build
        läuft über den **Dockerfile-Builder**, gepinnt in `railway.json` (`"builder": "DOCKERFILE"`,
        `"dockerfilePath": "Dockerfile"`), damit Railway die Build-Methode nicht selbst erraten muss. Bis
        zum 20.08.2026 baute das Projekt stattdessen über Nixpacks (`nixpacks.toml`); dieser Ansatz wurde
        verworfen, weil Railway den Nixpacks-Builder inzwischen als veraltet einstuft. Dokumentation:
        https://docs.railway.app/

- [ ] Step 2: In `docs/MS4_Technische_Dokumentation.md`, find section "5.2 Produktionsumgebung
      (Railway)" (quoted in full in Context and Orientation above, spanning from
      "Railway ist eine Plattform-as-a-Service..." through the "**Umgebungsvariablen:**"
      paragraph). Replace the two subsections "**Build-Prozess (Nixpacks):**" and
      "**Start-Prozess (`start.sh`)**" (keep the "Railway ist eine..." intro sentence and the
      "**Statische Dateien:**" / "**Umgebungsvariablen:**" paragraphs that follow unchanged) with:

        **Build-Prozess (Dockerfile):**

        1. Railway liest `Dockerfile` aus dem Repository-Root (gepinnt über `railway.json`,
           `"builder": "DOCKERFILE"`)
        2. Erste Build-Stufe (`node:22-slim`): `npm ci` installiert die Angular-Abhängigkeiten,
           `npm run build` erstellt den Angular-Produktions-Build
           (Output: `frontend/dist/frontend/browser/`)
        3. Zweite Build-Stufe (`python:3.12-slim`): `pip install -r backend/requirements.txt`
           installiert die Backend-Abhängigkeiten; der Backend-Code und das aus der ersten Stufe
           gebaute Frontend werden in das Image kopiert

        **Start-Prozess (`start.sh`):**

        1. `flask db upgrade` spielt ausstehende Datenbankmigrationen ein (idempotent)
        2. `gunicorn wsgi:application -w 2 -b 0.0.0.0:$PORT` startet den Produktionsserver

- [ ] Step 3: Commit.

  Run: `git add README.md docs/MS4_Technische_Dokumentation.md`, then
  `git commit -m "Doku: Dockerfile-Deployment statt Nixpacks beschrieben"`.

### Milestone 5: end-to-end local verification

This milestone proves the new image actually works, not merely that it builds. It runs the image
against a real PostgreSQL database on the same Docker network the project's existing
`docker-compose.yml` already defines, then checks both the API and the served frontend from the
host machine.

- [ ] Step 1: Make sure the project's local database is running (reuses the existing
      `docker-compose.yml`, unrelated to and unmodified by this plan):

  Run: `docker compose up -d`
  Run: `docker compose ps`
  Expected: a line for a service named `db` (container name `lernzeit-db`) with state `running`.

- [ ] Step 2: Find the Docker network `docker compose` created for that service, so the new
      application container can reach it by the service name `db` (Docker's embedded DNS resolves
      service names to container IPs only for containers on the same user-defined network):

  Run: `docker network ls --filter name=lernzeit`
  Expected: a network whose name contains `lernzeit` (Docker Compose names it
  `<project-directory-name>_default` unless overridden; the project directory here is
  `Projekt-Lernzeit_Manager`, so expect something like `projekt-lernzeit_manager_default`). Note
  the exact name printed — call it `<network-name>` in the next step.

- [ ] Step 3: Run the image built in Milestone 1, attached to that network, with the environment
      variables the application requires. `SECRET_KEY` is required (see the `RuntimeError` raised
      in `backend/app/__init__.py` when it is unset in production); use a throwaway local value,
      never a real secret, since this is a disposable local test:

  Run:

        docker run --rm -d --name lernzeit-verify \
          --network <network-name> \
          -e DATABASE_URL=postgresql://lernzeit:lernzeit_dev@db:5432/lernzeit \
          -e SECRET_KEY=lokaler-test-schluessel \
          -e FLASK_ENV=production \
          -p 8000:8000 \
          lernzeit-test

  (On Windows PowerShell, replace the trailing `\` line continuations with a single-line command
  or backticks; the important part is that all five flags — `--rm`, `-d`, `--name`, `--network`,
  the three `-e` flags, `-p`, and the image name — are passed together.)

  Expected: prints a container ID and returns immediately (the `-d` flag runs it in the
  background).

- [ ] Step 4: Confirm the container did not crash on startup (a crash would most likely show up
      as the `flask db upgrade` step failing to reach the database):

  Run: `docker logs lernzeit-verify`
  Expected: log lines from Alembic (the migration tool `flask db upgrade` uses) showing migrations
  being applied or already up to date, followed by Gunicorn startup lines such as
  `Listening at: http://0.0.0.0:8000`. If instead the log shows a Python traceback mentioning
  `could not translate host name "db"`, the container is not on the same network as the `db`
  service — re-check the network name from Step 2 and re-run Step 3 with the corrected name.

- [ ] Step 5: Confirm the API responds:

  Run: `curl -i http://localhost:8000/api/health`
  Expected: `HTTP/1.1 200 OK` followed by a body of `{"status":"ok"}` (or equivalent JSON
  formatting) — this is the same endpoint and expected response described in `README.md`'s
  "Backend starten" step.

- [ ] Step 6: Confirm the frontend is served (proves the multi-stage `COPY` in the `Dockerfile`
      placed the built Angular files where `_register_spa_fallback` looks for them):

  Run: `curl -i http://localhost:8000/`
  Expected: `HTTP/1.1 200 OK` with an HTML body containing `<app-root>` (Angular's root component
  tag, present in the built `index.html`). If instead this returns a 404 or an empty body, the
  frontend files are missing from the image at `frontend/dist/frontend/browser/` — re-check
  Milestone 1 Step 1's `COPY --from=frontend-build` line for a typo in the path.

- [ ] Step 7: Tear down the throwaway container (leave the `db` service from `docker compose up
      -d` running, since other local development in this repository depends on it and this plan
      must not disturb it beyond this verification):

  Run: `docker stop lernzeit-verify`
  Expected: prints `lernzeit-verify`; because the container was started with `--rm`, stopping it
  also removes it, so no manual `docker rm` is needed.

- [ ] Step 8: Record the transcript of Steps 3-6 (or a summary of it) in the Artifacts and Notes
      section below, and fill in Outcomes & Retrospective.

## Validation and Acceptance

This plan is accepted once all of the following hold, all of them already exercised in Milestone
5 above:

1. `docker build -t lernzeit-test .` from the repository root completes with exit code 0.
2. A container started from that image, given a reachable `DATABASE_URL` and a `SECRET_KEY`,
   applies its database migrations and starts Gunicorn without crashing (visible in `docker logs`).
3. `GET /api/health` against that running container returns HTTP 200 with `{"status": "ok"}`.
4. `GET /` against that running container returns HTTP 200 with HTML containing `<app-root>`,
   proving the Angular build was correctly copied into the final image and is being served.
5. `railway.json` no longer names `NIXPACKS` as the builder, and `nixpacks.toml` no longer exists
   in the repository.
6. `README.md` and `docs/MS4_Technische_Dokumentation.md` describe the Dockerfile-based build, not
   Nixpacks.

This plan intentionally does not require an actual push to Railway or a live Railway deployment as
part of its acceptance criteria — pushing to a shared branch and triggering a real cloud deployment
is a visible, hard-to-reverse action on shared infrastructure, and per this project's working
agreement that requires explicit confirmation before proceeding (see the "Executing actions with
care" guidance the assistant follows). Once this plan's local verification (Milestone 5) passes,
the branch this plan creates should be pushed and a pull request opened only after the person
running this plan explicitly confirms they want that to happen; the actual Railway deploy then
happens automatically on merge to `main`, per the existing "Git-Workflow & CI" section of
`README.md`, which this plan does not change.

## Idempotence and Recovery

Every step in this plan is safe to re-run. `docker build` always produces a fresh image from the
current file contents (re-running it after fixing an error simply retries). `git rm nixpacks.toml`
followed by a later re-run would fail with "no such file", which is an obvious, harmless signal
the step already happened. `flask db upgrade` inside `start.sh` is Alembic's idempotent migration
command — running it again against an already-up-to-date database is a no-op. `docker run ...
--name lernzeit-verify` will fail with "the container name is already in use" if Milestone 5 Step 3
is re-run without Step 7 (stop/remove) having happened first; if that occurs, run
`docker stop lernzeit-verify` (or `docker rm -f lernzeit-verify` if it is not running) before
retrying. No step in this plan deletes data — the local Postgres data volume
(`pgdata`, defined in `docker-compose.yml`) is never touched by anything in this plan.

## Artifacts and Notes

`docker build -t lernzeit-test .` (final successful run, tail):

    #21 exporting to image
    #21 exporting layers 0.1s done
    #21 naming to docker.io/library/lernzeit-test:latest done
    #21 unpacking to docker.io/library/lernzeit-test:latest 0.8s done
    #21 DONE 0.9s

Milestone 5 container startup log (`docker logs`, after the `.gitattributes` fix):

    INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
    INFO  [alembic.runtime.migration] Will assume transactional DDL.
    [2026-08-20 09:11:38 +0000] [1] [INFO] Starting gunicorn 23.0.0
    [2026-08-20 09:11:38 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
    [2026-08-20 09:11:38 +0000] [1] [INFO] Using worker: sync
    [2026-08-20 09:11:38 +0000] [8] [INFO] Booting worker with pid: 8
    [2026-08-20 09:11:38 +0000] [9] [INFO] Booting worker with pid: 9

`curl -i http://localhost:8000/api/health`:

    HTTP/1.1 200 OK
    Content-Type: application/json
    Content-Length: 16

    {"status":"ok"}

`curl -i http://localhost:8000/` (truncated to the relevant tag):

    HTTP/1.1 200 OK
    Content-Type: text/html; charset=utf-8
    ...
    <body>
      <app-root></app-root>
    <script src="main-PXIK4ANB.js" type="module"></script></body>
    </html>

Network used for verification: `projekt-lernzeit_manager_default` (created by `docker compose up
-d` from the existing `docker-compose.yml`). The verification container connected to the database
using the Postgres container's `container_name` from `docker-compose.yml`, `lernzeit-db`, as the
hostname (Docker's embedded DNS resolves both the Compose service name `db` and the explicit
`container_name` on a Compose-managed network, so either hostname works; `lernzeit-db` was used in
practice).

## Interfaces and Dependencies

This plan does not introduce any new Python or TypeScript interfaces, functions, or classes — it
only changes how existing, unmodified application code (`backend/wsgi.py`,
`backend/app/__init__.py`, the Angular build output) is packaged and started. The one contract that
must not change is the one already documented in Context and Orientation: `_FRONTEND_DIST` in
`backend/app/__init__.py` resolves to `<parent of parent of parent of that file>/frontend/dist/
frontend/browser`, so the container's working directory must contain sibling `backend/` and
`frontend/` directories with that exact relative layout. Everything this plan's `Dockerfile` does
is built around preserving that one existing contract.

Base images used, both pulled from Docker Hub (no private registry needed, keeping with this
project's "no budget" constraint from `docs/03_Randbedingungen.md`):

- `node:22-slim` — build-stage only, discarded after Milestone 1 Step 1's first `FROM` block
  finishes; never shipped to Railway.
- `python:3.12-slim` — the final runtime image's base, matching the Python 3.12 version already
  pinned in this project's "Was du installieren musst" table in `README.md`.

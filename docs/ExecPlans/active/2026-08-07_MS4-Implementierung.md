# MS4 Implementierung – Lernzeit-Manager (Vollständige App)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.
See [docs/PLANS.md](../../PLANS.md) for the governing specification of this format.

## Purpose / Big Picture

After this milestone a user can open the Lernzeit-Manager in a browser, register an account,
create study goals, make rough and detailed plans, run a study timer, and see their progress
on a dashboard. Every Must-priority functional requirement (FR-1 through FR-7) is met. The Tutor
can access the running application at a Railway URL without installing anything.

## Progress

- [x] (2026-08-07 08:00Z) ExecPlan written
- [x] (2026-08-07 08:05Z) Backend: Flask-JWT-Extended 4.7.4 added to requirements.txt and installed
- [x] (2026-08-07 08:06Z) Backend: models created (User, Goal, PlanSlot, StudySession) in backend/app/models/
- [x] (2026-08-07 08:10Z) Backend: API routes created (auth, goals, plans, sessions, dashboard)
- [x] (2026-08-07 08:12Z) Backend: create_app factory updated; config.py extended with JWT_SECRET_KEY; extensions.py adds JWTManager
- [x] (2026-08-07 08:14Z) Backend: conftest.py updated with db.create_all(); test_auth.py + test_goals.py added; 13/13 tests pass
- [x] (2026-08-07 08:18Z) Frontend: app.config.ts updated (HttpClient, withFetch, withInterceptors)
- [x] (2026-08-07 08:19Z) Frontend: core layer — models/index.ts, 5 services, authGuard, authInterceptor
- [x] (2026-08-07 08:21Z) Frontend: feature components — login, register, goals, planning, timer, dashboard
- [x] (2026-08-07 08:22Z) Frontend: layout (navbar), global styles (styles.scss), index.html title updated
- [x] (2026-08-07 08:22Z) Frontend: routing wired up with lazy-loading + authGuard; app shell cleaned; app.spec.ts updated; 1/1 test passes; ng build succeeds

## Surprises & Discoveries

(none yet)

## Decision Log

- Decision: Use Flask-JWT-Extended for JWT auth instead of rolling our own.
  Rationale: Industry-standard, works natively with Flask, handles token refresh and identity lookup cleanly.
  Date/Author: 2026-08-07 / Assis (Claude)

- Decision: Use werkzeug.security (generate_password_hash / check_password_hash) for bcrypt hashing.
  Rationale: Werkzeug is already a Flask dependency — zero extra packages needed.
  Date/Author: 2026-08-07 / Assis (Claude)

- Decision: No external Angular UI library (no Angular Material, no PrimeNG).
  Rationale: Avoids npm install issues in CI, keeps the bundle small, and a custom CSS design is
  sufficient for the graded prototype.
  Date/Author: 2026-08-07 / Assis (Claude)

- Decision: FR-7 (inactivity reminder) implemented as an in-app dashboard banner.
  Rationale: True push notifications (FCM, email) require third-party setup not feasible in the
  project timeline. The dashboard checks whether the user has plan slots today but no recorded
  study session and displays a warning banner if so. This satisfies "erhält die/der Nutzende eine
  Erinnerung" as specified in FR-7.1.
  Date/Author: 2026-08-07 / Assis (Claude)

- Decision: ECTS-based workload calculation uses 30 hours per ECTS credit (IU standard).
  Rationale: Matches the IU Modulhandbuch convention. 5 ECTS = 150 hours = 9000 minutes total.
  Date/Author: 2026-08-07 / Assis (Claude)

## Outcomes & Retrospective

(to be filled after completion)

---

## Context and Orientation

The repository is a monorepo containing a Flask backend (`backend/`) and an Angular 22 frontend
(`frontend/`). MS1 already established the project skeleton, CI pipeline (GitHub Actions), and
Docker Compose for local PostgreSQL. The backend uses Flask-SQLAlchemy with Flask-Migrate for
database migrations. The frontend is bootstrapped with Angular CLI 22 and uses Vitest as the
test runner (not Karma — important for CI).

Key existing files:
- `backend/app/__init__.py` — Flask application factory (create_app)
- `backend/app/config.py` — Config classes (Development, Production, Testing)
- `backend/app/extensions.py` — db and migrate singletons
- `backend/app/routes/health.py` — existing /api/health route
- `backend/requirements.txt` — Python dependencies
- `frontend/src/app/app.config.ts` — Angular bootstrap config
- `frontend/src/app/app.routes.ts` — route definitions
- `docker-compose.yml` — starts a PostgreSQL 16 container

New vocabulary used in this plan:
- Blueprint: Flask's way of grouping related routes into a sub-module (like a mini-application).
- JWT (JSON Web Token): A signed string the server returns on login; the client sends it back in
  every subsequent request as proof of identity. Stored in localStorage on the client.
- Interceptor (Angular): A piece of code that runs before every HTTP request, used here to attach
  the JWT to the Authorization header automatically.
- Signal: Angular 22's reactive primitive — a variable that automatically updates the UI when its
  value changes.
- Guard: Angular route protection logic that checks if the user is logged in before allowing
  navigation to a protected page.

---

## Plan of Work

### Backend

1. Add `Flask-JWT-Extended>=4.7,<5.0` to `backend/requirements.txt`.

2. Create `backend/app/models/__init__.py` (empty, makes the folder a Python package).

3. Create four model files:
   - `backend/app/models/user.py` — User table (id, email, name, password_hash, created_at)
   - `backend/app/models/goal.py` — Goal table (id, user_id FK, title, target_date, module_name,
     ects int default 5, status string default "open", created_at)
   - `backend/app/models/plan_slot.py` — PlanSlot table (id, user_id FK, goal_id FK, year, month,
     day nullable, planned_time varchar(5) nullable "HH:MM", duration_minutes int default 60, note)
   - `backend/app/models/study_session.py` — StudySession table (id, user_id FK, goal_id FK,
     started_at datetime, paused_at datetime nullable, total_paused_seconds int default 0,
     ended_at datetime nullable, duration_seconds int nullable, status varchar(20) default "active",
     note text nullable)

4. Create route blueprints:
   - `backend/app/routes/auth.py` — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
   - `backend/app/routes/goals.py` — GET/POST /api/goals, GET/PUT/DELETE /api/goals/<id>
   - `backend/app/routes/plans.py` — GET/POST /api/plans, PUT/DELETE /api/plans/<id>
   - `backend/app/routes/sessions.py` — GET /api/sessions, GET /api/sessions/active,
     POST /api/sessions/start, POST /api/sessions/<id>/pause, POST /api/sessions/<id>/resume,
     POST /api/sessions/<id>/stop
   - `backend/app/routes/dashboard.py` — GET /api/dashboard

5. Update `backend/app/__init__.py` to:
   - Import JWTManager from flask_jwt_extended, init it
   - Register all new blueprints
   - Import all models so Flask-Migrate sees them

6. Update `backend/app/config.py` to add JWT_SECRET_KEY from environment.

7. Add `backend/tests/test_auth.py` and `backend/tests/test_goals.py`.

### Frontend

8. Update `frontend/src/app/app.config.ts` to add provideHttpClient with fetch backend and
   withInterceptors pointing at the JWT interceptor.

9. Create `frontend/src/app/core/models/index.ts` with TypeScript interfaces for User, Goal,
   PlanSlot, StudySession, DashboardData.

10. Create services in `frontend/src/app/core/services/`:
    - `auth.service.ts` — login, register, logout, getToken, currentUser signal, isLoggedIn
    - `goal.service.ts` — CRUD for goals
    - `plan.service.ts` — CRUD for plan slots
    - `session.service.ts` — start, pause, resume, stop, getActive, list
    - `dashboard.service.ts` — get dashboard data

11. Create `frontend/src/app/core/guards/auth.guard.ts` — redirects to /login if no token.

12. Create `frontend/src/app/core/interceptors/auth.interceptor.ts` — adds Authorization header.

13. Create feature components:
    - `frontend/src/app/features/auth/login/login.ts` — email + password form, calls auth.service
    - `frontend/src/app/features/auth/register/register.ts` — name + email + password form
    - `frontend/src/app/features/goals/goals.ts` — list all goals, create new goal form, mark
      as achieved
    - `frontend/src/app/features/planning/planning.ts` — select goal + month, list/create plan
      slots
    - `frontend/src/app/features/timer/timer.ts` — select goal, start/pause/resume/stop timer,
      display elapsed time with setInterval
    - `frontend/src/app/features/dashboard/dashboard.ts` — shows planned vs actual minutes,
      progress bars per goal, inactivity warning banner

14. Create `frontend/src/app/layout/navbar/navbar.ts` — navigation links + logout button.

15. Update `frontend/src/app/app.routes.ts` with all routes (login/register unprotected,
    rest behind auth guard).

16. Update `frontend/src/app/app.ts` and `frontend/src/app/app.html` to include navbar and
    router outlet.

17. Replace `frontend/src/styles.css` with global styles (variables, reset, layout, form, button,
    card styles).

18. Update `frontend/src/index.html` title to "Lernzeit-Manager".

19. Update `frontend/src/app/app.spec.ts` to match the new app shell.

---

## Concrete Steps

All commands are run from the repository root unless stated otherwise.

**Set up local dev environment:**

    # Start PostgreSQL (runs Docker Compose in background)
    docker compose up -d

    # Install new Python dependency (run from backend/)
    cd backend && pip install Flask-JWT-Extended

    # Create DB migration after models exist
    cd backend && flask db migrate -m "MS4 initial models" && flask db upgrade

    # Run backend tests
    cd backend && pytest

    # Run frontend tests (from frontend/)
    cd frontend && npm test

    # Start backend dev server
    cd backend && flask run

    # Start frontend dev server (from frontend/)
    cd frontend && npx ng serve

**Expected: backend at http://localhost:5000, frontend at http://localhost:4200**

---

## Validation and Acceptance

Run `cd backend && pytest` — expect all tests to pass (existing health test + new auth/goals tests).

Run `cd frontend && npm test` — expect all tests to pass (updated app spec + component tests).

Manual smoke test:
1. Open http://localhost:4200 — redirected to /login.
2. Click "Registrieren" — fill name/email/password — submit — redirected to dashboard.
3. Click "Lernziele" — create a goal with title "Programmierung 1", module "DLBIPPR01",
   ECTS 5, target_date 6 months from now — appears in list.
4. Click "Planung" — select the goal — create a slot for today with 60 minutes — saved.
5. Click "Timer" — select goal — click Start — counter runs — click Stop — session saved.
6. Click "Dashboard" — see planned minutes vs actual minutes — progress bar for the goal.
7. Reload dashboard on a day with slots but no session — inactivity warning banner visible.
8. Click goal row → mark as "Erreicht" — status updates.

---

## Idempotence and Recovery

Running `flask db migrate` when no model changes exist produces a no-op migration file (safe to
delete). Running `flask db upgrade` multiple times is safe (idempotent). Frontend `npm test` can
be re-run anytime.

---

## Interfaces and Dependencies

Python packages (backend/requirements.txt):
- Flask-JWT-Extended>=4.7,<5.0 (JWT authentication)
- All existing packages remain unchanged

Backend API contract (all protected endpoints require header `Authorization: Bearer <token>`):

    POST /api/auth/register  body: {email, name, password}  → 201 {access_token, user}
    POST /api/auth/login     body: {email, password}         → 200 {access_token, user}
    GET  /api/auth/me                                        → 200 {id, email, name}

    GET    /api/goals                  → 200 [{id, title, module_name, ects, status, target_date, created_at}]
    POST   /api/goals        body: {title, module_name, ects, status, target_date}  → 201 goal
    GET    /api/goals/<id>             → 200 goal
    PUT    /api/goals/<id>   body: partial goal fields       → 200 goal
    DELETE /api/goals/<id>             → 204

    GET    /api/plans        ?goal_id= &year= &month=        → 200 [plan_slot]
    POST   /api/plans        body: {goal_id, year, month, day, planned_time, duration_minutes, note} → 201 slot
    PUT    /api/plans/<id>   body: partial                   → 200 slot
    DELETE /api/plans/<id>             → 204

    GET  /api/sessions       ?goal_id= &limit=               → 200 [session]
    GET  /api/sessions/active                                → 200 session | 204
    POST /api/sessions/start body: {goal_id}                 → 201 session
    POST /api/sessions/<id>/pause                            → 200 session
    POST /api/sessions/<id>/resume                           → 200 session
    POST /api/sessions/<id>/stop   body: {note?}             → 200 session (duration_seconds computed)

    GET  /api/dashboard                                      → 200 DashboardData

    DashboardData shape:
      {
        current_month: {year, month, planned_minutes, actual_minutes},
        goals: [{id, title, module_name, status, ects, total_actual_minutes, planned_ects_minutes}],
        inactivity_warning: bool,
        active_session: {id, goal_id, goal_title, started_at, status} | null
      }

TypeScript interfaces (frontend/src/app/core/models/index.ts):

    export interface User { id: number; email: string; name: string; }
    export interface Goal { id: number; title: string; module_name: string; ects: number;
      status: 'open'|'in_progress'|'achieved'; target_date: string; created_at: string; }
    export interface PlanSlot { id: number; goal_id: number; year: number; month: number;
      day: number|null; planned_time: string|null; duration_minutes: number; note: string|null; }
    export interface StudySession { id: number; goal_id: number; started_at: string;
      paused_at: string|null; ended_at: string|null; duration_seconds: number|null;
      status: 'active'|'paused'|'completed'; note: string|null; }
    export interface DashboardData { current_month: CurrentMonth; goals: GoalStats[];
      inactivity_warning: boolean; active_session: ActiveSession|null; }

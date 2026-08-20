# AGENTS.md

Cross-tool context file. Any AI coding/writing agent working in this vault (Claude Code, Copilot,
Cursor, ChatGPT, etc.) should read this first — the team is free to use any tools, so this file is
the shared baseline everyone gets regardless of which agent they run.

## What this vault is

An Obsidian vault for the IU Fernstudium course "Projekt Software Engineering" (ISEF01). It tracks
a graded team project (3-5 students) through its full lifecycle: requirements, design,
implementation, testing, and the final written report. The chosen topic is "Lernzeit-Manager", a
study-time planning and tracking app (see `Projektbericht_Themen_ISEF01.md`, section A).

## Current phase

Per `docs/06_Zeitplanung_Projektablauf.md`, the project moves through milestones MS0-MS6. As of
this writing the application is functionally complete for MS4: it has user accounts (registration
and login via a JWT access token, `flask-jwt-extended`), four database tables (`users`, `goals`,
`plan_slots`, `study_sessions`), and seven application screens (login, registration, dashboard,
goals, planning, timer, calendar). Every endpoint except `/api/health`, `/api/auth/register`, and
`/api/auth/login` requires the token. Implemented so far: goals (create, edit, delete, optional
priority, grade and result note), coarse and detailed time planning, a timer with start/pause/
resume/stop and an optional session note, a dashboard with progress, and a reminder for missed
study time (FR-7.1). See `README.md` for the authoritative, up-to-date status.

The tech stack is decided (Angular, Flask, PostgreSQL, Docker, Railway, GitHub Actions; pytest and
vitest for tests). Authentication is implemented — see `README.md` for details.

**Read `README.md` before making any change**, and update it in the same change whenever something
you do makes a statement in it wrong or incomplete. The README is the description of the current
state of the project; keeping it accurate is part of every task, not a follow-up.

## Key files

- `Aufgabenstellung_Projektbericht_ISEF01.md` — the graded assignment brief from IU. Defines the
  required milestones and deliverables. This is the university's task description: treat it as
  authoritative, do not edit it.
- `README.md` — the current state of the project: stack, setup, daily workflow, CI, deployment.
  Read this first.
- `docs/` — the project's own requirements documents (functional requirements, quality
  requirements, constraints, tech stack, schedule).
- `Projektbericht_Themen_ISEF01.md` — the full list of topics the team could have chosen; only
  section A (Lernzeit-Manager) applies to this project.
- `docs/golden-principles.md` — behavioral principles that apply to every task in this vault.
- `docs/PLANS.md` — the ExecPlan specification. Required reading before writing a plan for any
  larger change.
- `docs/ExecPlans/active/` — plans currently being worked on; `docs/ExecPlans/completed/` — finished
  plans.
- `docs/design-reference/html` — UI mockups for all six planned screens, each as `.html`.
  Authoritative for fields, labels, and ordering. The team decision of 2026-08-04 to defer the
  visual layer (colors, fonts, nav bar) until the features work was lifted on 2026-08-19 after
  user test feedback, once all Must/Should requirements stood (Plan P12): layout, spacing, cards,
  and typography now also follow the mockups' structure — the app's existing colors stay, not the
  mockups' colors. The mockups also show the finished product: progress bars, ECTS workload, and
  grades belong to FR-2, FR-5, and FR-6, not FR-1.

## System of record

Redmine (redmine-se.iubh.de) is the IU-mandated project-management system for graded milestones.
This vault supports drafting and agent-assisted work; it does not replace Redmine. Do not treat a
task as officially delivered just because it's marked done here — the Redmine ticket is what counts.

## Conventions for any agent working here

- Read `README.md` first, and keep it accurate as part of every change.
- Always apply `docs/golden-principles.md`.
- For any change larger than a small, self-contained edit, write an ExecPlan per `docs/PLANS.md`
  before implementing.
- This is a team project. Check whether content already exists (and who it's attributed to) before
  overwriting it — don't assume you're the only author.

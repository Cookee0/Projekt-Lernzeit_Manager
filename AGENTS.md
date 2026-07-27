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

Planning phase. Per `Aufgabenstellung_Projektbericht_ISEF01.md`, the project moves through
milestones MS0-MS6; MS0 (milestone plan) and MS1 (project configuration) are the immediate next
deliverables. No code exists yet. The programming language/framework, frontend/backend split, and
testing tools are explicitly still open — see `Lernzeit-Manager/04_Tech-Stack_und_Tools.md` for
what's already decided versus what's pending a team kickoff decision.

## Key files

- `Aufgabenstellung_Projektbericht_ISEF01.md` — the graded assignment brief from IU. Defines the
  required milestones and deliverables. This is the university's task description: treat it as
  authoritative, do not edit it.
- `Lernzeit-Manager/` — the project's own requirements documents (functional requirements, quality
  requirements, constraints, tech stack).
- `Projektbericht_Themen_ISEF01.md` — the full list of topics the team could have chosen; only
  section A (Lernzeit-Manager) applies to this project.
- `LLM/golden-principles.md` — behavioral principles that apply to every task in this vault.
- `LLM/PLANS.md` — the ExecPlan specification. Required reading before writing a plan for any
  larger change.

## System of record

Redmine (redmine-se.iubh.de) is the IU-mandated project-management system for graded milestones.
This vault supports drafting and agent-assisted work; it does not replace Redmine. Do not treat a
task as officially delivered just because it's marked done here — the Redmine ticket is what counts.

## Conventions for any agent working here

- Always apply `LLM/golden-principles.md`.
- For any change larger than a small, self-contained edit, write an ExecPlan per `LLM/PLANS.md`
  before implementing.
- This is a team project. Check whether content already exists (and who it's attributed to) before
  overwriting it — don't assume you're the only author.

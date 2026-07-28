# MS1 – Repository Bootstrap: Backend-Skeleton, Docker, CI

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This document must be maintained in accordance with `docs/PLANS.md`.

## Purpose / Big Picture

After completing this plan, every team member can clone the repository, run three commands (`Copy-Item .env.example .env`, `docker compose up -d`, `cd backend; python -m venv .venv; pip install -r requirements-dev.txt; flask --app app run --debug`), and reach a running Flask API at `http://localhost:5000/api/health`. The Angular frontend is scaffolded as a placeholder directory so CI can lint and test it. A GitHub Actions pipeline runs on every push and blocks merges to main until backend linting (ruff), backend tests (pytest), frontend linting (ng lint), and frontend tests (ng test) all pass green.

This is the foundation all feature work builds on. No application logic lives here — only the project skeleton, the database container, and the quality gate.

## Progress

- [x] (2026-07-28 12:00Z) ExecPlan geschrieben und abgelegt unter `docs/ExecPlans/active/2026-07-28_MS1-Repository-Bootstrap.md`.
- [x] (2026-07-28 12:00Z) `.env.example` erstellt.
- [x] (2026-07-28 12:00Z) `docker-compose.yml` erstellt.
- [x] (2026-07-28 12:00Z) `.gitignore` um Python/Flask/pytest-Einträge erweitert.
- [x] (2026-07-28 12:00Z) Flask-Backend-Skeleton erstellt (`backend/app/`, Health-Endpoint, application factory).
- [x] (2026-07-28 12:00Z) `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/pyproject.toml` (ruff) erstellt.
- [x] (2026-07-28 12:00Z) Backend-Tests erstellt (`tests/conftest.py`, `tests/test_health.py`).
- [x] (2026-07-28 12:00Z) `.github/workflows/ci.yml` erstellt.
- [ ] Frontend-Skeleton anlegen: ein Teammitglied mit Node.js 22 und Angular CLI 20 führt `ng new frontend --routing --style=scss --skip-git` im Repo-Root aus. Danach `git add frontend/ && git commit -m "Frontend: Angular-Skeleton"`.
- [ ] Flask-Migrate initialisieren: nach erstem `flask --app app run` einmalig `flask --app app db init` ausführen. Die generierte `backend/migrations/`-Mappe committen.
- [ ] CI auf `main` grün beobachten (erster Push nach vollständigem Bootstrap).

## Surprises & Discoveries

Noch keine.

## Decision Log

- Decision: Flask-JWT-Extended wird für Auth verwendet (nicht Flask-Login).
  Rationale: Das Frontend ist eine Angular-SPA, die API-Calls mit Bearer-Token macht. Session-basierte Auth (Flask-Login) erfordert Cookie-Handling über CORS-Grenzen hinweg und ist für SPA-Architekturen ungeeignet. JWT-Token sind stateless, können im Angular-HTTP-Interceptor transparent hinzugefügt werden und unterstützen das geplante Railway-Deployment ohne Session-Affinität.
  Date/Author: 2026-07-28 / Claude Code (AI)
  Note: Entscheidung war im Team noch offen. Falls das Team beim nächsten Meeting anders entscheidet, muss nur `requirements.txt` angepasst werden — der aktuelle Bootstrap installiert Flask-JWT-Extended noch nicht, da Auth kein Teil dieses Meilensteins ist. Die Entscheidung wird hier für den Decision Log vorweggenommen.

- Decision: Ruff als einziges Python-Linting-Tool.
  Rationale: Ruff ersetzt flake8, isort und teils pylint in einem einzigen schnellen Binary. Wird bereits im README erwähnt (`ruff check .`). Kein weiteres Tool nötig.
  Date/Author: 2026-07-28 / Claude Code (AI)

- Decision: pytest mit pytest-flask für Backend-Tests.
  Rationale: pytest ist de-facto-Standard für Python-Projekte. pytest-flask liefert die `app`- und `client`-Fixtures ohne Boilerplate. Team hat keinen gegenteiligen Beschluss.
  Date/Author: 2026-07-28 / Claude Code (AI)

- Decision: Angular CLI-Standard (Karma/Jasmine) für Frontend-Tests.
  Rationale: `ng new` generiert Karma/Jasmine out-of-the-box. Migration zu Jest ist jederzeit möglich, aber kein MS1-Thema. CI nutzt `ng test --watch=false --browsers=ChromeHeadless`.
  Date/Author: 2026-07-28 / Claude Code (AI)

- Decision: SQLite in-memory für pytest, PostgreSQL für dev/prod.
  Rationale: Pytest braucht keine laufende Datenbank. SQLite im Speicher ist schnell, braucht keine Infrastruktur und deckt die Logik-Tests ab. Integrations-/E2E-Tests (spätere Milestones) nutzen PostgreSQL.
  Date/Author: 2026-07-28 / Claude Code (AI)

## Outcomes & Retrospective

Noch nicht ausgefüllt (wird nach Abschluss aller Schritte ergänzt).

## Context and Orientation

Das Repo `Projekt-Lernzeit_Manager` ist ein Monorepo für ein Studienprojekt (IU ISEF01). Vor diesem Plan enthält das Repo ausschließlich Dokumentation (`docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`). Kein Anwendungscode existiert.

Die geplante Verzeichnisstruktur nach diesem Plan:

    Projekt-Lernzeit_Manager/
    ├── .env.example          ← Vorlage; Entwickler kopieren zu .env (nicht committen)
    ├── .gitignore            ← Ergänzt um Python/pytest-Einträge
    ├── docker-compose.yml    ← PostgreSQL 16 lokal
    ├── backend/
    │   ├── app/
    │   │   ├── __init__.py       ← Application factory (create_app)
    │   │   ├── config.py         ← Konfigurationsklassen (dev/prod/test)
    │   │   ├── extensions.py     ← SQLAlchemy + Flask-Migrate Instanzen
    │   │   └── routes/
    │   │       ├── __init__.py
    │   │       └── health.py     ← GET /api/health → {"status": "ok"}
    │   ├── tests/
    │   │   ├── __init__.py
    │   │   ├── conftest.py       ← pytest-Fixtures (app, client)
    │   │   └── test_health.py    ← Smoke-Test für Health-Endpoint
    │   ├── .flaskenv             ← FLASK_APP=run.py
    │   ├── pyproject.toml        ← ruff-Konfiguration
    │   ├── requirements.txt      ← Produktions-Abhängigkeiten
    │   ├── requirements-dev.txt  ← Dev/Test-Abhängigkeiten
    │   └── run.py                ← Einstiegspunkt für `flask --app app run`
    ├── frontend/                 ← Wird durch `ng new` angelegt (manueller Schritt)
    └── .github/
        └── workflows/
            └── ci.yml            ← GitHub Actions: ruff + pytest + ng lint + ng test

**Definitionen für Neulinge:**

- Application factory (`create_app`): Eine Funktion in `backend/app/__init__.py`, die die Flask-App erzeugt und zurückgibt. Sie registriert Erweiterungen (Datenbank, CORS) und Blueprints (Routen-Module). Dies ermöglicht das Erstellen separater App-Instanzen für Tests.
- Blueprint: Ein Flask-Konzept zum Gruppieren verwandter Routen. `health_bp` in `backend/app/routes/health.py` ist ein Blueprint, der unter `/api/health` erreichbar ist.
- Flask-Migrate: Eine Erweiterung, die Alembic (ein Datenbank-Migrationstool) in Flask integriert. Datenbankschema-Änderungen werden als Migrationsdateien versioniert und können mit `flask db upgrade` angewendet werden.
- ruff: Ein extrem schneller Python-Linter und Formatter, der flake8, isort und pylint ersetzt. `ruff check .` prüft den Code im aktuellen Verzeichnis.
- pytest-flask: Ein pytest-Plugin, das Fixtures für Flask-Apps bereitstellt (`app`, `client`, `live_server`). Es integriert sich automatisch mit dem Standard-pytest-Aufruf (`pytest`).

## Plan of Work

Der Plan besteht aus fünf Schritten, die sequentiell abgearbeitet werden.

**Schritt 1 – Umgebung und Docker:** `.env.example` legt die lokalen Entwicklungsvariablen als Vorlage ab (Datenbankname, Passwort, PORT, Flask-Secret). `docker-compose.yml` startet PostgreSQL 16 in einem Container mit persistentem Volume `pgdata`. Die `.gitignore` wird um Python-spezifische Einträge ergänzt (`.venv/`, `__pycache__/`, `*.pyc`, `instance/`, `.pytest_cache/`).

**Schritt 2 – Flask-Backend-Skeleton:** `backend/app/__init__.py` enthält die `create_app`-Funktion, die Flask, Flask-CORS, SQLAlchemy und Flask-Migrate initialisiert. `backend/app/config.py` definiert drei Konfigurationsklassen: `DevelopmentConfig` (SQLite or PostgreSQL via `DATABASE_URL`), `ProductionConfig` (nur `DATABASE_URL`), `TestingConfig` (SQLite in-memory, `TESTING=True`). `backend/app/extensions.py` deklariert die globalen `db`- und `migrate`-Objekte, die dann in `create_app` per `init_app` an die App gebunden werden — das verhindert zirkuläre Imports. Die Route `GET /api/health` in `backend/app/routes/health.py` gibt `{"status": "ok"}` mit HTTP 200 zurück. `backend/run.py` ruft `create_app` auf und gibt die App-Instanz zurück; `backend/.flaskenv` setzt `FLASK_APP=run.py`.

**Schritt 3 – Abhängigkeiten und Linting-Konfiguration:** `backend/requirements.txt` enthält die Produktions-Pakete (Flask, Flask-CORS, Flask-Migrate, Flask-SQLAlchemy, psycopg2-binary, python-dotenv). `backend/requirements-dev.txt` fügt pytest, pytest-flask und ruff hinzu. `backend/pyproject.toml` konfiguriert ruff mit `target-version = "py312"` und aktiviert die Regelgruppen E (pycodestyle), F (pyflakes), I (isort).

**Schritt 4 – Tests:** `backend/tests/conftest.py` definiert zwei pytest-Fixtures: `app()` erstellt eine App-Instanz mit `TestingConfig`, `client(app)` gibt einen Flask-Testclient zurück. `backend/tests/test_health.py` enthält einen einzigen Test, der `GET /api/health` aufruft und HTTP 200 sowie `{"status": "ok"}` erwartet.

**Schritt 5 – GitHub Actions CI:** `.github/workflows/ci.yml` definiert zwei Jobs. `backend` läuft auf `ubuntu-latest`, setzt Python 3.12, installiert `requirements-dev.txt`, führt `ruff check .` und anschließend `pytest` aus. `frontend` läuft ebenfalls auf `ubuntu-latest`, setzt Node.js 22, führt `npm ci`, `npx ng lint` und `npx ng test --watch=false --browsers=ChromeHeadless` aus. Der Frontend-Job setzt `continue-on-error: false` — er schlägt fehl, bis das Angular-Skeleton durch `ng new` angelegt wurde.

**Schritt 6 – Manuell (Frontend):** Ein Teammitglied mit Node.js 22 und Angular CLI 20 führt aus dem Repo-Root `ng new frontend --routing --style=scss --skip-git` aus, committet das Ergebnis und pusht. Ab dann ist der Frontend-CI-Job ebenfalls grün.

**Schritt 7 – Manuell (Flask-Migrate):** Nach dem ersten Backend-Start wird einmalig `flask --app app db init` ausgeführt. Das generierte Verzeichnis `backend/migrations/` wird committet.

## Concrete Steps

Alle Befehle werden im Repo-Root ausgeführt, sofern kein anderes Verzeichnis angegeben ist.

**Dateien schreiben (von Claude Code):** Die Dateien in Schritten 1–5 werden direkt erstellt. Kein Befehl nötig.

**Backend lokal verifizieren (von Entwickler):**

    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements-dev.txt
    ruff check .
    pytest
    flask --app app run --debug

Erwartete Ausgabe von `pytest`:

    collected 1 item
    tests/test_health.py .                     [100%]
    1 passed in 0.12s

Erwartete Ausgabe nach `flask --app app run --debug` und `curl http://localhost:5000/api/health`:

    {"status": "ok"}

(Docker muss für den vollen Dev-Lauf gestartet sein; für `pytest` genügt SQLite in-memory.)

**Frontend-Skeleton anlegen (manuell, einmalig):**

    # Repo-Root, Node.js 22 + Angular CLI 20 muss installiert sein
    ng new frontend --routing --style=scss --skip-git
    git add frontend/
    git commit -m "Frontend: Angular-Skeleton via ng new (MS1)"

**Flask-Migrate initialisieren (manuell, einmalig):**

    cd backend
    .\.venv\Scripts\Activate.ps1
    flask --app app db init
    git add migrations/
    git commit -m "Backend: Flask-Migrate initialisiert (MS1)"

## Validation and Acceptance

Der Bootstrap gilt als vollständig akzeptiert, wenn alle folgenden Bedingungen erfüllt sind:

1. `pytest` im `backend/`-Verzeichnis (mit aktiviertem venv) gibt `1 passed` aus.
2. `ruff check .` im `backend/`-Verzeichnis gibt keine Fehler aus.
3. `GET http://localhost:5000/api/health` liefert HTTP 200 und `{"status": "ok"}` (Flask-Server läuft, Docker-DB muss nicht laufen).
4. `docker compose up -d && docker compose ps` zeigt Status `running` für den `db`-Service.
5. Der GitHub Actions-Workflow auf einem Feature-Branch zeigt beide Jobs grün (setzt voraus, dass das Frontend-Skeleton via `ng new` committed ist).

Einzelne Validierung ohne Docker: `pytest` genügt, weil die Testkonfiguration SQLite in-memory nutzt.

## Idempotence and Recovery

Alle Dateien können ohne Seiteneffekte neu geschrieben werden — es gibt keinen Datenbankzustand und keine laufenden Prozesse, die durch das Überschreiben beschädigt werden könnten. Falls `flask db init` bereits ausgeführt wurde, bricht es mit `Directory migrations already exists` ab — das ist kein Fehler, sondern ein Hinweis, dass der Schritt übersprungen werden kann.

Falls `ng new` fehlschlägt (z. B. wegen eines Versionskonflikts), kann `frontend/` gelöscht und der Befehl wiederholt werden, da die Dateien im Verzeichnis noch nicht committed sind.

## Artifacts and Notes

Alle Dateien sind nachfolgend beschrieben. Die tatsächlichen Inhalte befinden sich in den erstellten Dateien im Repository.

Verzeichnisstruktur nach vollständigem Bootstrap:

    backend/
      app/__init__.py
      app/config.py
      app/extensions.py
      app/routes/__init__.py
      app/routes/health.py
      tests/__init__.py
      tests/conftest.py
      tests/test_health.py
      .flaskenv
      pyproject.toml
      requirements.txt
      requirements-dev.txt
      run.py
    frontend/               ← via ng new
    .env.example
    docker-compose.yml
    .github/workflows/ci.yml

## Interfaces and Dependencies

In `backend/app/__init__.py`, define:

    def create_app(config_name: str = "development") -> Flask

In `backend/app/routes/health.py`, the endpoint contract is:

    GET /api/health
    Response: 200 OK
    Body: {"status": "ok"}

In `backend/tests/conftest.py`, pytest-fixtures:

    @pytest.fixture
    def app() -> Flask  # Testing-Konfiguration, SQLite in-memory

    @pytest.fixture
    def client(app: Flask) -> FlaskClient

Python-Abhängigkeiten (Produktions-Kern):

    Flask >= 3.1, < 4.0
    Flask-CORS >= 5.0, < 6.0
    Flask-Migrate >= 4.0, < 5.0
    Flask-SQLAlchemy >= 3.1, < 4.0
    psycopg2-binary >= 2.9, < 3.0
    python-dotenv >= 1.0, < 2.0

Dev/Test-Zusätze:

    pytest >= 8.0, < 9.0
    pytest-flask >= 1.3, < 2.0
    ruff >= 0.9, < 1.0

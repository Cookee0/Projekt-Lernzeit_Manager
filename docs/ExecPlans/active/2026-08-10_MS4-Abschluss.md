# MS4-Abschluss: Railway-Deployment, Playwright E2E-Tests, MS4-Dokumentation

Dieses ExecPlan-Dokument wird gemäß docs/PLANS.md geführt. Es ist ein lebendes Dokument;
alle Abschnitte werden während der Umsetzung aktuell gehalten.

## Purpose / Big Picture

Nach diesem Plan ist der Lernzeit-Manager vollständig abgabebereit für MS4. Konkret bedeutet das:
der Tutor kann die App über eine Railway-URL im Browser öffnen, sich registrieren, Lernziele
anlegen, Lernzeiten planen, den Timer bedienen und das Dashboard einsehen — ohne etwas zu
installieren. Zusätzlich existieren fünf MS4-Pflichtdokumente (Benutzerhandbuch, Fachliche
Dokumentation, Technische Dokumentation, Betriebsdokumentation, Testabschlussbericht) und
automatisierbare Playwright E2E-Tests, die die Must-Anforderungen durchspielen.

Der Startpunkt ist der MS4-Implementierungs-ExecPlan vom 2026-08-07; die gesamte Anwendung
(Backend Flask + Frontend Angular) ist fertig codiert und getestet. Was fehlt:
- Railway-Deployment-Konfiguration (nixpacks.toml, wsgi.py, start.sh)
- Flask muss im Produktionsmodus den Angular-Build als statische Dateien ausliefern
- Playwright E2E-Tests für alle Must-Features
- 5 MS4-Pflichtdokumente auf Deutsch

## Progress

- [x] (2026-08-10) ExecPlan geschrieben
- [x] (2026-08-10) backend/wsgi.py erstellt (WSGI-Einstiegspunkt + Auto-Migration)
- [x] (2026-08-10) gunicorn zu backend/requirements.txt hinzugefügt
- [x] (2026-08-10) backend/app/__init__.py: Angular-Static-Serving für Produktion
- [x] (2026-08-10) nixpacks.toml an Repo-Wurzel erstellt
- [x] (2026-08-10) start.sh an Repo-Wurzel erstellt
- [x] (2026-08-10) frontend/playwright.config.ts erstellt
- [x] (2026-08-10) Playwright E2E-Tests erstellt (auth, goals, planning, timer)
- [x] (2026-08-10) @playwright/test zu frontend/package.json hinzugefügt
- [x] (2026-08-10) docs/MS4_Benutzerhandbuch.md erstellt
- [x] (2026-08-10) docs/MS4_Fachliche_Dokumentation.md erstellt
- [x] (2026-08-10) docs/MS4_Technische_Dokumentation.md erstellt
- [x] (2026-08-10) docs/MS4_Betriebsdokumentation.md erstellt
- [x] (2026-08-10) docs/MS4_Testabschlussbericht.md erstellt
- [ ] Railway-Deployment live (Julian): neues Projekt anlegen, Umgebungsvariablen setzen, deployen
- [ ] Railway-URL in Betriebsdokumentation eintragen
- [ ] Playwright-Tests lokal ausführen und Protokoll in Testabschlussbericht ergänzen
- [ ] Alle 5 Dokumente als PDF nach Redmine hochladen

## Surprises & Discoveries

- Angular 22 ohne expliziten outputPath in angular.json erzeugt den Build nach
  `frontend/dist/frontend/browser/` (relativ zum Repo-Wurzelverzeichnis).
- Nixpacks erkennt bei einem Python+Node-Monorepo nicht automatisch beide Sprachen; ein
  explizites nixpacks.toml ist nötig, um python312 und nodejs_22 gemeinsam bereitzustellen.
- Flask-CORS mit leerer origins-Liste blockiert keine Same-Origin-Requests; der Browser sendet
  bei Same-Origin keine CORS-Preflight-Anfragen, daher ist die leere Liste in Produktion
  unproblematisch, solange Flask auch die Angular-Dateien ausliefert.
- JWT_ACCESS_TOKEN_EXPIRES war nicht konfiguriert; MS3 fordert explizit begrenzte Token-Laufzeit.
  Wurde auf 8 Stunden gesetzt (config.py).

## Decision Log

- Decision: Flask liefert den Angular-Build als statische Dateien in Produktion aus (Single-Service
  auf Railway statt zwei separater Services).
  Rationale: Einfachstes Setup, keine CORS-Konfiguration in Produktion nötig, ein Railway-Service
  statt zwei, kostenloser Tier reicht aus.
  Date/Author: 2026-08-10 / Assis (via Claude Code)

- Decision: Migrations werden automatisch beim Start via `flask db upgrade` in start.sh ausgeführt.
  Rationale: Verhindert, dass Railway den Start-Befehl und die Migration manuell koordiniert
  werden müssen; bei einem Neustart laufen Migrations automatisch (idempotent).
  Date/Author: 2026-08-10 / Assis (via Claude Code)

- Decision: Playwright E2E-Tests laufen nicht in CI (kein automatischer Start in GitHub Actions).
  Rationale: MS3 deklariert Playwright als "manuell vor MS4-Abgabe". Playwright benötigt
  laufende Backend- und Frontend-Server; das ist in CI ohne erheblichen Mehraufwand nicht
  sauber lösbar. Die Tests werden lokal vom Team ausgeführt.
  Date/Author: 2026-08-10 / Assis (via Claude Code)

## Outcomes & Retrospective

Noch offen — wird nach Railway-Go-Live ausgefüllt.

## Context and Orientation

Das Repository hat folgende Struktur:
  backend/            Flask-API (Python 3.12)
  backend/app/        Application-Factory (create_app), Models, Routes, Extensions
  backend/migrations/ Alembic-Migrationsdateien (werden per flask db upgrade eingespielt)
  backend/requirements.txt
  frontend/           Angular 22 SPA (TypeScript)
  frontend/src/app/   Komponenten, Services, Models, Interceptor, Guard
  frontend/e2e/       Playwright E2E-Tests (neu)
  docs/               Projektdokumentation
  .github/workflows/  CI (Backend: ruff + pytest; Frontend: ng lint + ng test)

Railway (railway.app) ist das Hosting-System. Es baut das Projekt via Nixpacks (ein
Build-Tool das Python und Node.js aus einer Konfigurationsdatei installiert) und startet
dann die Anwendung mit Gunicorn (einem Python-Webserver für Produktionsumgebungen).

Gunicorn (sprich: Green Unicorn) ist ein WSGI-Server — WSGI ist die Python-Standardschnittstelle
zwischen Webserver und Flask-Anwendung. Für die lokale Entwicklung reicht Flasks eingebauter
Server; in Produktion ist Gunicorn stabiler und performanter.

Nixpacks ist das Build-System von Railway. Es liest `nixpacks.toml` aus dem Repo-Root und
installiert daraufhin die gewünschten Sprachen und Pakete. Ohne nixpacks.toml würde Railway
entweder Python oder Node erkennen, aber nicht beides.

## Plan of Work

### 1. Backend — WSGI-Einstiegspunkt und Gunicorn

Neue Datei `backend/wsgi.py` erstellen. Sie importiert `create_app` und erzeugt die Flask-Instanz
unter dem Namen `application` (den Gunicorn sucht). `FLASK_ENV` aus der Umgebung steuert, ob
Development- oder Production-Config genutzt wird.

In `backend/requirements.txt` wird `gunicorn>=21.2,<24.0` ergänzt.

### 2. Flask als SPA-Host in Produktion

In `backend/app/__init__.py` wird eine interne Hilfsfunktion `_register_spa_fallback` ergänzt.
Sie registriert eine Catch-all-Route (`/<path:path>`), die Angular-Dateien aus
`frontend/dist/frontend/browser/` ausliefert. Existiert die Datei, wird sie direkt gesendet;
andernfalls wird `index.html` zurückgegeben (damit Angular-Routing im Browser funktioniert).
Diese Route wird nur in Produktion registriert.

Flask-API-Routen unter `/api/...` sind spezifischer als `/<path:path>` und werden immer
zuerst gematcht — das SPA-Fallback greift nie für API-Requests.

### 3. Nixpacks und Start-Skript

`nixpacks.toml` an der Repo-Wurzel konfiguriert Nixpacks so, dass Python 3.12 und Node.js 22
installiert werden, `npm ci` und `ng build` für das Frontend laufen und danach
`pip install -r backend/requirements.txt` für das Backend.

`start.sh` wechselt in `backend/`, führt `flask db upgrade` aus (Migrationen idempotent) und
startet dann Gunicorn auf dem Port, den Railway via `$PORT` vorgibt.

### 4. Playwright E2E-Tests

`frontend/playwright.config.ts` konfiguriert Playwright: Basis-URL `http://localhost:4200`,
Chromium als Browser, kein automatischer Dev-Server-Start (wird vom Team manuell gestartet).

Vier Test-Dateien unter `frontend/e2e/`:
- `auth.spec.ts`: Registrierung + Login + Abmeldung
- `goals.spec.ts`: Lernziel anlegen, Status ändern, löschen
- `planning.spec.ts`: Lernzeit einplanen, in Liste prüfen, löschen
- `timer.spec.ts`: Session starten, pausieren, fortsetzen, stoppen

### 5. MS4-Dokumente

Fünf Markdown-Dateien unter `docs/`:
- `MS4_Benutzerhandbuch.md` (Nutzerperspektive, alle Funktionen erklärt)
- `MS4_Fachliche_Dokumentation.md` (Prozesse, Geschäftsregeln, Konzepte)
- `MS4_Technische_Dokumentation.md` (Architektur, API, Datenbankschema, Deployment)
- `MS4_Betriebsdokumentation.md` (Installation lokal und Railway, Umgebungsvariablen)
- `MS4_Testabschlussbericht.md` (alle Testfälle + Protokoll)

## Concrete Steps

Alle Schritte laufen aus dem Repo-Wurzelverzeichnis, sofern nicht anders angegeben.

Deployment lokal testen:

    # 1. Postgres starten (falls nicht läuft):
    docker compose up -d

    # 2. Migrationen (einmalig oder nach Änderungen):
    cd backend
    flask db migrate -m "MS4 Tabellen"
    flask db upgrade
    cd ..

    # 3. Flask starten (Development):
    cd backend && flask run
    # im zweiten Terminal:
    cd frontend && ng serve

    # 4. Playwright-Tests ausführen (beide Server müssen laufen):
    cd frontend
    npx playwright install chromium
    npx playwright test

Railway-Deployment (einmalig, nach diesem ExecPlan):

    # Railway CLI installieren falls nötig:
    npm install -g @railway/cli

    # Login + Projekt anlegen:
    railway login
    railway init

    # Umgebungsvariablen setzen (in Railway Dashboard oder CLI):
    # DATABASE_URL  → PostgreSQL-URL aus Railway Add-on
    # JWT_SECRET_KEY → langer zufälliger String (min. 32 Zeichen)
    # FLASK_ENV     → production
    # CORS_ORIGINS  → https://<deine-railway-url>.up.railway.app

    # Deployen:
    railway up

## Validation and Acceptance

Lokal: Beide Server laufen, http://localhost:4200 öffnen, registrieren, alle Features durchklicken.
Playwright-Tests laufen durch ohne Fehler (`npx playwright test` im frontend/-Ordner).
pytest im backend/-Ordner: alle 13 Tests bestanden.

Produktion: Railway-URL im Browser öffnen, mit Tutor-Test-Account (s. Betriebsdokumentation)
einloggen, alle Must-Features prüfen. GET /api/health gibt `{"status": "ok"}` zurück.

## Idempotence and Recovery

`flask db upgrade` ist von Alembic garantiert idempotent — bereits eingespielten Migrationen
werden übersprungen. Gunicorn-Neustart ist jederzeit sicher.

Playwright-Tests können beliebig oft ausgeführt werden; sie erstellen neue Test-Nutzer mit
Timestamps im Namen, sodass Duplikate kein Problem sind.

## Interfaces and Dependencies

Neue Abhängigkeit: `gunicorn>=21.2,<24.0` in backend/requirements.txt.
Neue Dev-Abhängigkeit: `@playwright/test: ^1.49.0` in frontend/package.json.

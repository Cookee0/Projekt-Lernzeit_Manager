# Projekt Lernzeit-Manager

Studienprojekt im Modul **ISEF01 "Projekt Software Engineering"** (IU Fernstudium).
Der Lernzeit-Manager ist eine Web-Anwendung, mit der Studierende Lernziele über einen
6-Monats-Horizont planen, ihre Lernzeit per Timer erfassen und ihren Fortschritt auswerten können.

Team: Elias (Product Owner), Assis (Developer, Schwerpunkt Coding), Julian (Developer, Schwerpunkt
Infrastruktur/Deployment/Testing).
Abgabeziel: **31.08.2026**.

> **Status: Planungsphase.** Es existiert noch kein Anwendungscode. Dieses README beschreibt den
> Ziel-Setup, damit alle drei Entwickler mit identischer Umgebung starten können. Abschnitte, die
> noch nicht im Repo existieren, sind mit *(noch anzulegen)* markiert.

---

## Inhalt

1. [Dokumentation im Repo](#dokumentation-im-repo)
2. [Tech-Stack](#tech-stack)
3. [Was du installieren musst](#was-du-installieren-musst)
4. [Erstes Setup – Schritt für Schritt](#erstes-setup--schritt-für-schritt)
5. [Täglicher Entwicklungs-Workflow](#täglicher-entwicklungs-workflow)
6. [Datenbank & pgAdmin 4](#datenbank--pgadmin-4)
7. [Git-Workflow & CI](#git-workflow--ci)
8. [Deployment auf Railway](#deployment-auf-railway)
9. [Troubleshooting](#troubleshooting)
10. [Mit KI in diesem Repo entwickeln](#mit-ki-in-diesem-repo-entwickeln)

---

## Dokumentation im Repo

| Datei | Inhalt |
|---|---|
| [`docs/01_Funktionale_Anforderungen.md`](docs/01_Funktionale_Anforderungen.md) | Alle FR-Anforderungen mit Priorität (Must/Should/Could) |
| [`docs/02_Qualitaetsanforderungen.md`](docs/02_Qualitaetsanforderungen.md) | Nicht-funktionale Anforderungen (Usability, Security, Performance) |
| [`docs/03_Randbedingungen.md`](docs/03_Randbedingungen.md) | Organisatorische & technische Rahmenbedingungen, Rollen, Termine |
| [`docs/04_Tech-Stack_und_Tools.md`](docs/04_Tech-Stack_und_Tools.md) | Entschiedener Tech-Stack + offene Punkte |
| [`docs/PLANS.md`](docs/PLANS.md) | Spezifikation für ExecPlans (Pflichtlektüre vor größeren Änderungen) |
| [`docs/golden-principles.md`](docs/golden-principles.md) | Verhaltensregeln für Code-Änderungen (Mensch **und** KI) |
| [`AGENTS.md`](AGENTS.md) | Gemeinsamer Kontext für alle KI-Tools |
| [`docs/ExecPlans/`](docs/ExecPlans/) | `active/` = laufende Pläne, `completed/` = abgeschlossene |

**System of Record bleibt Redmine** (https://redmine-se.iubh.de/). Eine Aufgabe gilt erst als
geliefert, wenn das Redmine-Ticket steht – nicht, weil hier etwas gemerged wurde. GitHub Projects
ist nur das ergänzende technische Board.

---

## Tech-Stack

| Bereich | Technologie | Warum |
|---|---|---|
| Frontend | [Angular](https://angular.dev/) (TypeScript) | Kickoff-Beschluss; SPA, responsives Layout |
| Backend | [Flask](https://flask.palletsprojects.com/) (Python) | Kickoff-Beschluss; REST-API |
| Datenbank | [PostgreSQL](https://www.postgresql.org/) 16 | Relationale Daten (Ziele, Sessions, User) |
| Lokale DB/Umgebung | [Docker Desktop](https://www.docker.com/products/docker-desktop/) + Docker Compose | Identische DB für alle drei Entwickler |
| DB-Verwaltung | [pgAdmin 4](https://www.pgadmin.org/) | GUI zum Reinschauen, SQL ausführen, Daten prüfen |
| Hosting | [Railway](https://railway.app/) | Team hat Erfahrung, kostenloses Kontingent |
| CI | [GitHub Actions](https://docs.github.com/en/actions) | Tests + Linting bei jedem Push |
| Diagramme | [draw.io](https://app.diagrams.net/) | Architektur-/UML-Diagramme für den Bericht |

**Noch offen** (siehe [`docs/04_Tech-Stack_und_Tools.md`](docs/04_Tech-Stack_und_Tools.md)) – bitte
nicht eigenmächtig festlegen, sondern im Mittwochs-Meeting entscheiden:

- Auth-Bibliothek für Flask (Recherche offen – Kandidaten: `Flask-Login` + `Werkzeug`-Hashing für
  Session-Auth, oder `Flask-JWT-Extended` für Token-Auth, was besser zu einer Angular-SPA passt)
- Testing-Frameworks (muss **spätestens zu MS3** stehen). Naheliegend: `pytest` (Backend),
  Karma/Jasmine oder Jest (Frontend), optional Playwright/Cypress für E2E.

**Bereits entschieden:** Monorepo. Frontend und Backend liegen in diesem Repo (`frontend/`,
`backend/`), weil bei drei Personen zwei Repos mehr Overhead als Nutzen bringen.

---

## Was du installieren musst

Alles kostenlos (harte Vorgabe aus [`docs/03_Randbedingungen.md`](docs/03_Randbedingungen.md):
Studierendenprojekt ohne Budget).

| Tool | Version | Download | Wofür |
|---|---|---|---|
| Git | aktuell | https://git-scm.com/downloads | Versionierung |
| Docker Desktop | aktuell | https://www.docker.com/products/docker-desktop/ | PostgreSQL lokal |
| Node.js | **LTS 22.x** | https://nodejs.org/ | Angular-Toolchain |
| Angular CLI | 20.x | `npm install -g @angular/cli` | `ng serve`, `ng test` |
| Python | **3.12** | https://www.python.org/downloads/ | Flask-Backend |
| pgAdmin 4 | aktuell | https://www.pgadmin.org/download/ | Datenbank-GUI |
| VS Code | aktuell | https://code.visualstudio.com/ | Empfohlene IDE |
| Railway CLI | aktuell | https://docs.railway.app/guides/cli | Deployment & Logs |

**Windows-Hinweise:**

- Docker Desktop braucht WSL 2. Falls die Installation meckert:
  [WSL-Setup-Anleitung](https://learn.microsoft.com/de-de/windows/wsl/install) (`wsl --install` in
  einer Admin-PowerShell, danach Neustart).
- Bei der Python-Installation **"Add python.exe to PATH"** anhaken.
- Prüfe nach der Installation in einer *neuen* Shell:

  ```powershell
  git --version
  docker --version
  docker compose version
  node --version      # v22.x
  npm --version
  python --version    # 3.12.x
  ```

**Empfohlene VS-Code-Extensions:** Angular Language Service, Python, Pylance, Ruff, Docker,
ESLint, Prettier, GitLens.

---

## Erstes Setup – Schritt für Schritt

### 1. Repo klonen

```powershell
git clone https://github.com/<org>/Projekt-Lernzeit_Manager.git
cd Projekt-Lernzeit_Manager
```

### 2. Umgebungsvariablen anlegen

Es gibt eine `.env.example` *(noch anzulegen)* als Vorlage. Kopiere sie:

```powershell
Copy-Item .env.example .env
```

Die `.env` ist per `.gitignore` ausgeschlossen und darf **niemals** committet werden. Inhalt für
die lokale Entwicklung:

```dotenv
# PostgreSQL (lokal via Docker)
POSTGRES_USER=lernzeit
POSTGRES_PASSWORD=lernzeit_dev
POSTGRES_DB=lernzeit
POSTGRES_PORT=5432

# Flask
DATABASE_URL=postgresql://lernzeit:lernzeit_dev@localhost:5432/lernzeit
FLASK_ENV=development
SECRET_KEY=nur-fuer-lokal-bitte-aendern
```

### 3. Datenbank per Docker starten

`docker-compose.yml` im Repo-Root *(noch anzulegen)*:

```yaml
services:
  db:
    image: postgres:16
    container_name: lernzeit-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Starten (Docker Desktop muss laufen):

```powershell
docker compose up -d
docker compose ps        # Status "running" erwartet
```

Der Container behält seine Daten im Volume `pgdata` – ein `docker compose down` löscht sie
**nicht**. Nur `docker compose down -v` setzt die Datenbank komplett zurück.

### 4. Backend starten

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1     # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

Erwartung: `Running on http://127.0.0.1:5000`. Zur Prüfung
http://localhost:5000/api/health aufrufen – erwartet wird HTTP 200 mit `{"status": "ok"}`
*(Health-Endpoint noch anzulegen)*.

Falls PowerShell die Aktivierung blockiert
(`… kann nicht geladen werden, da die Ausführung von Skripts …`):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 5. Frontend starten

Zweites Terminal:

```powershell
cd frontend
npm install
ng serve
```

Erwartung: `Application bundle generation complete` und die App unter http://localhost:4200.

### 6. Ergebnis prüfen

Wenn alle drei Teile laufen, hast du:

- http://localhost:4200 → Angular-Frontend
- http://localhost:5000 → Flask-API
- `localhost:5432` → PostgreSQL im Container

---

## Täglicher Entwicklungs-Workflow

```powershell
docker compose up -d                       # DB hochfahren
cd backend; .\.venv\Scripts\Activate.ps1   # Backend
flask --app app run --debug
cd frontend; ng serve                      # Frontend (zweites Terminal)
```

Nützliche Befehle:

| Befehl | Zweck |
|---|---|
| `docker compose logs -f db` | DB-Logs live mitlesen |
| `docker compose down` | Container stoppen (Daten bleiben) |
| `docker compose down -v` | Container **und** Daten löschen (Reset) |
| `pytest` (in `backend/`) | Backend-Tests |
| `ruff check .` (in `backend/`) | Python-Linting |
| `ng test` (in `frontend/`) | Frontend-Tests |
| `ng lint` (in `frontend/`) | Frontend-Linting |
| `ng build --configuration production` | Produktions-Build |

Vor jedem Push lokal grün machen: Tests + Linting. Die CI prüft dasselbe, und rote Pipelines
kosten alle Zeit (Qualitätsziel aus
[`docs/02_Qualitaetsanforderungen.md`](docs/02_Qualitaetsanforderungen.md): "Alle automatisierten
Tests sind erfüllt").

---

## Datenbank & pgAdmin 4

pgAdmin 4 ist die GUI, mit der du in die laufende Postgres-Instanz schaust – Tabellen ansehen,
SQL ausführen, Testdaten prüfen.

**Server einmalig einrichten:**

1. pgAdmin 4 öffnen. Beim ersten Start ein **Master-Passwort** setzen (schützt nur die lokal
   gespeicherten Verbindungen, frei wählbar).
2. Links auf *Servers* → Rechtsklick → *Register* → *Server…*
3. Tab **General**: Name = `Lernzeit lokal`
4. Tab **Connection**:
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `lernzeit`
   - Username: `lernzeit`
   - Password: `lernzeit_dev` → *Save password* anhaken
5. *Save*. Der Server erscheint links; unter
   `Lernzeit lokal → Databases → lernzeit → Schemas → public → Tables` liegen die Tabellen.

**SQL ausführen:** Rechtsklick auf die Datenbank → *Query Tool*. Beispiel:

```sql
SELECT * FROM users;
```

**Wichtig:** Docker muss laufen, sonst schlägt die Verbindung mit
`could not connect to server: Connection refused` fehl. Erst `docker compose up -d`, dann pgAdmin.

**Migrationen:** Schema-Änderungen laufen über
[Flask-Migrate/Alembic](https://flask-migrate.readthedocs.io/) *(Setup noch anzulegen)*:

```powershell
flask --app app db migrate -m "beschreibung"   # Migration erzeugen
flask --app app db upgrade                     # Migration anwenden
```

Migrationsdateien werden **immer committet**. Nach `git pull` immer `flask db upgrade` laufen
lassen, sonst passen Code und lokales Schema nicht mehr zusammen.

---

## Git-Workflow & CI

- `main` ist geschützt und immer deploybar. Kein direkter Push auf `main`.
- Feature-Branches: `feature/<kurzbeschreibung>`, `fix/<kurzbeschreibung>`,
  `docs/<kurzbeschreibung>`.
- Wenn möglich Bezug zur Anforderung im Branch-/Commit-Namen (z. B. `feature/fr-4.1-timer`),
  damit der Projektbericht später nachvollziehbar bleibt.
- Pull Request mit mindestens einem Review durch ein anderes Teammitglied.
- Commit-Messages auf Deutsch oder Englisch, aber im Imperativ und aussagekräftig
  ("Timer-Pause-Logik ergänzt" statt "fix").

```powershell
git checkout main
git pull
git checkout -b feature/fr-4.1-timer
# … arbeiten …
git add .
git commit -m "Timer: Start/Pause/Stop implementiert (FR-4.1)"
git push -u origin feature/fr-4.1-timer
```

Danach PR auf GitHub öffnen. **GitHub Actions** *(Workflow noch anzulegen unter
`.github/workflows/ci.yml`)* führt bei jedem Push aus: Backend-Tests (`pytest`), Backend-Linting
(`ruff`), Frontend-Tests (`ng test --watch=false`), Frontend-Linting (`ng lint`). Merge erst bei
grüner Pipeline.

---

## Deployment auf Railway

Railway baut aus dem GitHub-Repo und hostet Backend, Frontend und PostgreSQL. Dokumentation:
https://docs.railway.app/

**Einmalige Einrichtung (macht Julian, Infrastruktur-Rolle):**

1. Auf https://railway.app/ mit GitHub-Account anmelden.
2. *New Project* → *Deploy from GitHub repo* → dieses Repo wählen.
3. *New* → *Database* → *Add PostgreSQL*. Railway legt automatisch die Variable `DATABASE_URL` an.
4. Für den Backend-Service unter *Variables* referenzieren:
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`, dazu `SECRET_KEY` (neuer, zufälliger Wert – **nicht**
   der aus der lokalen `.env`) und `FLASK_ENV=production`.
5. Frontend als zweiten Service anlegen (Root-Verzeichnis `frontend/`), Backend-URL als
   Environment-Variable eintragen.
6. Unter *Settings → Networking* → *Generate Domain* für die öffentliche URL.

**Wichtig für MS4:** Die Anwendung muss vom Tutor **ohne Installation im Browser** nutzbar sein.
Die Railway-URL plus die Liste der Testzugänge gehört in die Redmine-Abgabe. Testzugänge dürfen
laut [`docs/02_Qualitaetsanforderungen.md`](docs/02_Qualitaetsanforderungen.md) **keine echten
Daten** enthalten.

**Alltag mit der CLI:**

```powershell
railway login
railway link          # Repo mit Railway-Projekt verknüpfen
railway logs          # Live-Logs des Services
railway run <befehl>  # Befehl lokal mit Railway-Env-Variablen ausführen
```

Deployment passiert automatisch bei jedem Push auf `main`. Geht ein Deploy schief: `railway logs`
lesen, Fix auf einem Branch, PR, merge – kein Hotfix direkt auf `main`.

**Secrets gehören ausschließlich in Railway-Variablen oder die lokale `.env`** – nie ins Repo.
Wenn doch mal ein Secret committet wurde: sofort im Team melden und den Wert rotieren, nicht nur
den Commit löschen.

---

## Troubleshooting

| Problem | Ursache / Lösung |
|---|---|
| `docker: error during connect` | Docker Desktop läuft nicht. Starten und warten, bis das Wal-Symbol stillsteht. |
| `port 5432 is already allocated` | Lokale Postgres-Installation belegt den Port. Entweder den Windows-Dienst `postgresql-x64-16` stoppen oder in `.env` `POSTGRES_PORT=5433` setzen (dann auch `DATABASE_URL` anpassen). |
| pgAdmin: `Connection refused` | Container läuft nicht → `docker compose ps` prüfen, ggf. `docker compose up -d`. |
| `ng: command not found` | Angular CLI fehlt: `npm install -g @angular/cli`, dann neue Shell öffnen. |
| `.venv\Scripts\Activate.ps1 kann nicht geladen werden` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Frontend-Requests scheitern mit CORS-Fehler | Im Flask-Backend `flask-cors` für `http://localhost:4200` konfigurieren. |
| `relation "…" does not exist` | Migration fehlt: `flask --app app db upgrade`. |
| Node-Module kaputt nach Branch-Wechsel | `Remove-Item -Recurse -Force node_modules; npm install` |

---

## Mit KI in diesem Repo entwickeln

Wir nutzen KI-Assistenten (Claude Code, Copilot, Cursor, ChatGPT – jeder darf sein Werkzeug
wählen). Damit die Ergebnisse zusammenpassen, gelten für alle die gleichen Regeln.

### Die drei Dateien, die jeder Agent kennen muss

| Datei | Rolle |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Gemeinsame Basis für **alle** Tools: was das Projekt ist, welche Phase, welche Dateien wichtig sind. |
| [`CLAUDE.md`](CLAUDE.md) | Einstiegspunkt für Claude Code; lädt `AGENTS.md` und die Golden Principles. |
| [`docs/golden-principles.md`](docs/golden-principles.md) | Verhaltensregeln für jede Änderung – gelten auch für uns Menschen. |

Arbeitest du mit einem Tool, das `AGENTS.md` nicht automatisch liest (ChatGPT im Browser,
Copilot Chat), dann füge den Inhalt am Anfang der Session selbst in den Kontext ein. Ohne diesen
Kontext erfindet das Modell einen anderen Tech-Stack.

### Die Golden Principles in einem Satz pro Punkt

1. **Think Before Coding** – Annahmen aussprechen, bei Unklarheit nachfragen statt raten.
2. **Simplicity First** – nur was gefordert war, keine spekulativen Abstraktionen.
3. **Surgical Changes** – nur anfassen, was nötig ist; keine "Verbesserungen" nebenbei.
4. **Goal-Driven Execution** – Erfolgskriterium vorher definieren ("Test X ist grün"), dann
   loopen bis erfüllt.

Praktisch heißt das: Ein Prompt wie "bau mal den Timer" ist zu schwach. Besser:
"Implementiere FR-4.1 (Timer start/pause/stop) im Flask-Backend. Erfolgskriterium: `pytest
backend/tests/test_timer.py` ist grün und der Endpoint `POST /api/sessions/start` liefert 201."

### ExecPlans – ab wann Pflicht

Für **alles außer kleinen, in sich geschlossenen Änderungen** wird zuerst ein ExecPlan
geschrieben, erst dann implementiert. Spezifikation:
[`docs/PLANS.md`](docs/PLANS.md) – vor dem Schreiben eines Plans **vollständig lesen**, nicht aus
der Erinnerung arbeiten.

| Kein ExecPlan nötig | ExecPlan Pflicht |
|---|---|
| Tippfehler, Doku-Satz, ein Feld an ein Formular | Neues Feature (jede FR-Gruppe aus `01_Funktionale_Anforderungen.md`) |
| Ein fehlender Test, ein Ein-Zeilen-Bugfix | Datenmodell-/Migrations-Änderungen |
| Abhängigkeit auf Patch-Version heben | Auth-Einführung, CI-Pipeline, Railway-Setup |

**Was einen ExecPlan ausmacht** (die harten Regeln aus `docs/PLANS.md`):

- **Selbsterklärend.** Der Plan muss so vollständig sein, dass jemand ohne Vorwissen – ein neuer
  Agent oder ein Teammitglied, das das Repo nie gesehen hat – ihn allein mit dem aktuellen
  Arbeitsverzeichnis von oben nach unten abarbeiten kann. Keine Verweise auf "wie im letzten
  Plan besprochen", keine Links auf externe Blogs: nötiges Wissen wird in den Plan hineinkopiert.
- **Beobachtbares Ergebnis.** Akzeptanz wird als Verhalten formuliert ("nach `flask run` liefert
  `GET /api/goals` HTTP 200 mit einer JSON-Liste"), nicht als Struktur ("Klasse `GoalService`
  angelegt").
- **Lebendes Dokument.** Vier Abschnitte sind Pflicht und werden laufend gepflegt: `Progress`
  (Checkboxen mit Zeitstempel), `Surprises & Discoveries`, `Decision Log`, `Outcomes &
  Retrospective`.
- **Fließtext statt Stichpunktlisten** – außer im `Progress`-Abschnitt, wo Checkboxen Pflicht sind.
- **Formatierung:** Liegt der ExecPlan als eigene `.md`-Datei vor (unser Normalfall), wird er ohne
  umschließende Code-Fence geschrieben. Das Skelett steht am Ende von `docs/PLANS.md`.

**Ablage:** Laufende Pläne in `docs/ExecPlans/active/`, nach Abschluss (inkl. ausgefülltem
`Outcomes & Retrospective`) verschieben nach `docs/ExecPlans/completed/`. Dateiname:
`YYYY-MM-DD_kurzbeschreibung.md`.

Der Decision Log ist übrigens Gold wert für den Projektbericht: "Warum habt ihr X so gebaut?" ist
eine typische Tutor-Frage, und die Antwort steht dann schon geschrieben da.

### Empfohlener Ablauf mit einem KI-Assistenten

1. **Aufgabe holen** – aus Redmine (und GitHub Projects), mit Bezug auf die FR-Nummer.
2. **Kontext geben** – die relevante Anforderung aus `docs/01_…` und die betroffenen Dateien
   nennen. Nicht "lies das ganze Repo", sondern gezielt.
3. **Plan verlangen, nicht Code** – bei größeren Änderungen zuerst den ExecPlan schreiben lassen,
   ihn selbst lesen und im Team gegenlesen. Ein Plan, den du nicht verstehst, ist kein fertiger
   Plan.
4. **In Milestones implementieren lassen** – jeder Milestone einzeln verifizierbar, häufig
   committen.
5. **Selbst verifizieren** – Tests laufen lassen und die Ausgabe *ansehen*. Ein "ist erledigt"
   vom Modell ohne Terminal-Output ist kein Nachweis.
6. **Review durch einen Menschen** – KI-generierter Code geht durch denselben PR-Review wie jeder
   andere Code.

### Grenzen und Verantwortung

- **Du unterschreibst den Code.** Die Bewertung des Moduls trifft uns, nicht das Modell. Was du
  nicht erklären kannst, darf nicht in den PR.
- **Nichts an `Aufgabenstellung_Projektbericht_ISEF01.md` ändern lassen** – das ist die
  Aufgabenstellung der IU und autoritativ.
- **Teamprojekt beachten.** Vor dem Überschreiben prüfen, ob und von wem ein Inhalt schon
  existiert (`git log <datei>`). Agenten kennen unsere Absprachen aus dem Mittwochs-Meeting nicht.
- **Keine echten personenbezogenen Daten** in Prompts oder Testdaten (DSGVO-Anforderung aus
  `docs/02_Qualitaetsanforderungen.md`).
- **Keine Secrets in Prompts.** Weder `.env`-Inhalte noch Railway-Tokens.
- **Der Projektbericht muss unsere eigene Leistung sein.** KI beim Coden ist in Ordnung und wird
  im Bericht als Werkzeug transparent gemacht; der Bericht selbst wird über Turnitin geprüft.

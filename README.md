# Projekt Lernzeit-Manager

Studienprojekt im Modul **ISEF01 "Projekt Software Engineering"** (IU Fernstudium).
Der Lernzeit-Manager ist eine Web-Anwendung, mit der Studierende Lernziele über einen
6-Monats-Horizont planen, ihre Lernzeit per Timer erfassen und ihren Fortschritt auswerten können.

Team: Elias (Product Owner), Assis (Developer, Schwerpunkt Coding), Julian (Developer, Schwerpunkt
Infrastruktur/Deployment/Testing).
Abgabeziel: **31.08.2026**.

> **Status: Die Anwendung hat Nutzerkonten und ist funktional vollständig für MS4.** Registrierung
> und Anmeldung laufen über ein JWT-Zugriffstoken (`flask-jwt-extended`), das im Browser unter dem
> Schlüssel `lm_token` gespeichert wird und acht Stunden gültig ist; die Anmeldung übersteht einen
> Seiten-Reload, weil der Token beim Start der Anwendung über `GET /api/auth/me` geprüft wird und
> nur bei einer ausdrücklichen Ablehnung mit HTTP 401 oder 403 abgemeldet wird. Alle Endpunkte
> außer `/api/health`, `/api/auth/register` und `/api/auth/login` sind geschützt. Umgesetzt sind
> Lernziele (anlegen, **vollständig bearbeiten** — Titel, Modul, ECTS, optionaler manueller
> Lernaufwand in Stunden, Zieldatum, Status, optionale Priorität —, löschen), Grob- und
> Detailplanung von Lernzeiten, ein Timer mit Start, Pause, Fortsetzen und Stopp (der beim
> Stoppen eine optionale Notiz aufnimmt), eine
> Übersichtsseite mit Fortschritt sowie eine Erinnerung bei versäumter Lernzeit (FR-7.1) mit zwei
> Auslösern: heute geplant und noch nicht gelernt, oder seit mindestens drei Tagen keine Session
> trotz Planung für den laufenden Monat. Zu einem Lernziel lassen sich außerdem eine Note und eine
> Ergebnis-Notiz hinterlegen. Auf der Planungsseite lassen sich pro Monat außerdem **Zwischenziele**
> festlegen (FR-3.2) — kurze Arbeitspakete wie „Kapitel 3 abschließen", optional mit einem Tag im
> Monat und optional einem Lernziel zugeordnet, abhakbar und löschbar; ein Zähler der Form „1 / 4"
> erscheint sowohl auf der Planungsseite als auch als Kachel auf dem Dashboard. Seit Plan P7 ist
> außerdem die **Grobplanung** vollständig (FR-2.1, FR-2.2, FR-3.3): Die Planungsseite zeigt je
> Lernziel ein aus dem ECTS-Workload (30 Stunden je ECTS-Punkt) abgeleitetes Wochenbudget, einen
> automatischen Monatsvorschlag (Restaufwand gleichmäßig auf die Monate bis zum Zieldatum
> verteilt, Endpunkt `GET /api/plans/proposal`) und die Abweichung zur bereits geplanten Zeit des
> gewählten Monats; Slots legt der Vorschlag bewusst nicht selbst an. Seit Plan P14 lässt sich
> dieser automatisch berechnete Lernaufwand je Lernziel im Formular überschreiben (Feld
> „Lernaufwand in Stunden (optional)"), z. B. wenn ein Modul erfahrungsgemäß weniger oder mehr
> Zeit braucht als die Formel annimmt; ohne Angabe gilt weiterhin exakt ECTS × 30 Stunden, und der
> Override wirkt sich auf Wochenbudget, Dashboard-Fortschritt und Auswertung gleichermaßen aus.
> Seit Plan P9 lassen sich Lernzeiten auf der Planungsseite außerdem als Serientermine anlegen
> (Endpunkt `POST /api/plans/series`) — über ein Tages-Raster mit Mehrfachauswahl und Schnellwahl für
> Werktage oder einzelne Wochentage eines Monats, z. B. „jeden Mittwoch" —, und die Liste
> „Geplante Lernzeiten" erscheint je Lernziel gruppiert mit Titel, Modul und der insgesamt für
> dieses Ziel geplanten Zeit. Das Dashboard weist die
> Pausenzeit des Monats als eigene Kennzahl aus (FR-4.3 — die gezählte Lernzeit ist immer schon
> die ungestörte Zeit ohne Pausen) und zeigt ein Balkendiagramm der Lernzeit der letzten acht
> Kalenderwochen (FR-6.3, als eigenes SVG ohne Diagrammbibliothek). Seit Plan P10 gibt es außerdem einen
> fünften Tab **„Kalender"** (FR-3, FR-6): ein monatliches Raster, das je Tag die geplanten
> Lernzeiten (mit Uhrzeit, sofern gesetzt), Zwischenziele mit gesetztem Fälligkeitstag und die
> Zieldaten der Lernziele anzeigt, den heutigen Tag hervorhebt, erreichte Lernziele gedämpft und
> durchgestrichen darstellt und unter rund 800 px Fensterbreite auf eine gescrollte Liste der Tage
> mit Einträgen umschaltet; Lernzeiten ohne festen Tag erscheinen gesondert unter „Ohne festen
> Tag". Seit Plan P11 gibt es einen sechsten Tab **„Auswertung"** (Route `/stats`, FR-6.4,
> FR-5.3): eine Kennzahlenreihe (geplant, ungestört gelernt, Pausen, Erfüllungsgrad des laufenden
> Monats), das aus dem Dashboard bekannte Wochendiagramm (jetzt als geteilte
> `WeekChartComponent`), eine Tabelle „Plan vs. Ist je Modul" mit Ampelstatus, eine Aufstellung
> „Plan vs. Ist je Monat" über die letzten sechs Kalendermonate (Endpunkt `GET /api/stats`, setzt
> FR-6.4 um), die Liste der erreichten Ziele mit Noten (setzt FR-5.3 um) und eine Auswertung
> „Wann lernst du?" nach Tageszeit. Die bisherigen Erinnerungs-Balken (FR-7.1 „heute geplant und
> nicht gelernt" oder „drei Tage ohne Session", FR-7.2 „Slot beginnt in der nächsten Stunde",
> FR-7.3 „Zieldatum in ≤ 14 Tagen, Fortschritt < 50 %") erscheinen seit Plan P11 nicht mehr auf
> dem Dashboard, sondern in einem Glocken-Symbol-Dropdown neben dem Nutzernamen in der
> Navigationsleiste (ein Zähler-Badge zeigt die Anzahl aktiver Erinnerungen); das Dropdown schließt
> sich seit Plan P14 automatisch, sobald zwischen den Reitern gewechselt wird oder außerhalb davon
> geklickt wird. Der Hinweis auf eine laufende Session bleibt auf dem Dashboard. Seit Plan P12
> zeigt das Dashboard ab etwa 1000 px Fensterbreite ein Zwei-Spalten-Layout (Kennzahlen,
> Monatsfortschritt und Wochendiagramm links,
> die Lernziel-Karten rechts, sodass mindestens die erste Zielkarte ohne Scrollen sichtbar ist;
> unterhalb der Breite bleibt es einspaltig), und die Lernziele-Seite stellt die Zielliste in die
> Hauptspalte und das Anlege-Formular als schmale Seitenleiste daneben; die geteilten CSS-Klassen
> dafür (`layout-two-col`, `layout-main`, `layout-side`, `form-stacked`) liegen in
> `frontend/src/styles.scss`. Die Eingaben
> (E-Mail, ECTS, Datum, Tag, Dauer, Uhrzeit, Priorität, Note, Notizen, Zwischenziel-Titel) werden
> serverseitig geprüft und im Formular direkt unter dem betroffenen Feld angezeigt; siehe den
> Abschnitt „Geltende Wertebereiche der API" weiter unten. Alle ausgelieferten Zeitstempel sind als
> UTC gekennzeichnet (angehängtes `Z`), damit der Browser sie nicht fälschlich als Ortszeit deutet.
> Die Datenbank enthält die Tabellen `users`, `goals`, `plan_slots`, `study_sessions` und
> `milestones`, angelegt durch die Migrationen `backend/migrations/versions/0001_ms4_initial_schema.py`,
> `backend/migrations/versions/0002_goal_prioritaet_ergebnis.py`,
> `backend/migrations/versions/0003_milestones.py` und
> `backend/migrations/versions/0004_goal_workload_hours.py`; nach jedem `git pull` ist in `backend/`
> bei aktivierter venv `flask db upgrade` auszuführen. Abgeschlossene ExecPlans liegen in
> [`docs/ExecPlans/completed/`](docs/ExecPlans/completed/).

> **Dieses README ist die verbindliche Beschreibung des Ist-Zustands.** Wer etwas ändert, das eine
> Aussage hier falsch macht (neuer Befehl, neues Setup, neue Abhängigkeit, neues Feature),
> aktualisiert das README im selben Commit. Ein veraltetes README ist ein Fehler, kein Restposten.

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
| [`docs/05_Datenmodell.md`](docs/05_Datenmodell.md) | Konzept der Datenbankstruktur für FR-1 bis FR-7 (Zielbild, noch nicht umgesetzt) |
| [`docs/PLANS.md`](docs/PLANS.md) | Spezifikation für ExecPlans (Pflichtlektüre vor größeren Änderungen) |
| [`docs/golden-principles.md`](docs/golden-principles.md) | Verhaltensregeln für Code-Änderungen (Mensch **und** KI) |
| [`AGENTS.md`](AGENTS.md) | Gemeinsamer Kontext für alle KI-Tools |
| [`docs/ExecPlans/`](docs/ExecPlans/) | `active/` = laufende Pläne, `completed/` = abgeschlossene |
| [`docs/design-reference/`](docs/design-reference/) | Gestaltungsentwürfe aller sechs Bildschirme (je `.html` + `.png`) |
| [`docs/Anforderungsabgleich_Mockups.md`](docs/Anforderungsabgleich_Mockups.md) | Abgleich der Gestaltungsentwürfe mit Anforderungen und Umsetzung; was fehlt und warum |

**Zu den Gestaltungsentwürfen:** `docs/design-reference/` enthält Entwürfe für Übersicht,
Lernziele, Grobplanung, Detailplanung, Auswertung und Erinnerungen. Sie sind **verbindlich für
Felder, Beschriftungen und Reihenfolge**. Der Teambeschluss vom 04.08.2026, die visuelle Umsetzung
(Farben, Schriften, Navigationsleiste) bis zum Stehen der Funktionen zurückzustellen, wurde am
2026-08-19 nach Nutzer-Testfeedback aufgehoben (Plan P12): Layout, Abstände, Karten und Typografie
richten sich seither ebenfalls nach den Entwürfen — die Farben bleiben aber die der Anwendung, nicht
die der Entwürfe. Die Entwürfe zeigen außerdem den Endausbau: Fortschrittsbalken, ECTS-Workload und
Noten gehören zu FR-2, FR-5 und FR-6, nicht zu FR-1. Welches Entwurfselement bereits umgesetzt
ist, welches einer noch offenen Anforderung entspricht und welches nie Anforderung war, steht in
[`docs/Anforderungsabgleich_Mockups.md`](docs/Anforderungsabgleich_Mockups.md).

**System of Record bleibt Redmine** (https://redmine-se.iubh.de/). Eine Aufgabe gilt erst als
geliefert, wenn das Redmine-Ticket steht – nicht, weil hier etwas gemerged wurde. GitHub Projects
ist nur das ergänzende technische Board.

### Geltende Wertebereiche der API

Seit Plan P1 prüft das Backend jede eingehende Eingabe und lehnt Verstöße mit HTTP 400 und
`{"error": "..."}` ab. Es gelten folgende Grenzen: Die E-Mail-Adresse muss der Form
`name@domain.de` entsprechen; das Passwort ist 6 bis 128 Zeichen lang; Titel und Modul/Kurs eines
Lernziels sind 1 bis 255 Zeichen lang; ECTS-Punkte liegen zwischen 1 und 30; der optionale manuelle
Lernaufwand in Stunden liegt, sofern angegeben, zwischen 1 und 1000; das Zieldatum liegt
heute oder in der Zukunft, höchstens zehn Jahre voraus — außer es bleibt beim Bearbeiten
unverändert, dann bleibt auch ein bereits verstrichenes Datum gültig; die Priorität eines
Lernziels ist `high`, `medium`, `low` oder leer; die Note ist höchstens 10 Zeichen lang; die
Ergebnis-Notiz eines Lernziels und die Notiz einer Lernsession sind höchstens 500 Zeichen lang;
das Jahr einer Planung liegt zwischen 2020 und 2100, der Monat zwischen 1 und 12, der Tag muss zur
Länge des gewählten Monats passen; die Dauer liegt zwischen 5 und 480 Minuten; die Uhrzeit folgt
dem Format `HH:MM`; eine Notiz ist höchstens 500 Zeichen lang. Der Titel eines Zwischenziels ist 1
bis 200 Zeichen lang; sein optionaler Tag muss zur Länge des gewählten Monats passen, geprüft mit
derselben Regel wie bei der Planung. Der Endpunkt `POST /api/plans/series` erwartet zusätzlich das
Feld `days` — eine Liste mit 1 bis 31 eindeutigen Tagen, geprüft mit derselben Tages-Regel wie bei
der bestehenden Planung. Abfrageparameter von `/api/plans`, `/api/plans/proposal`,
`/api/sessions` und `/api/milestones` (`goal_id`, `year`, `month`, `limit`) werden ebenso geprüft
— bei `/api/plans/proposal` müssen `year` und `month` zusammen angegeben werden oder beide
fehlen (dann gilt der laufende Monat) — und mit HTTP 400
abgelehnt, wenn sie keine Zahl im erlaubten Bereich sind. Das Frontend spiegelt dieselben Regeln in
`frontend/src/app/core/validation.ts` und zeigt Verstöße direkt unter dem betroffenen Feld an.

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

**Testing steht** (seit dem Repository-Bootstrap): `pytest` im Backend, `vitest` im Frontend.
Vitest ist seit Angular 22 der Standard-Test-Runner der Angular CLI – `ng test` startet ihn, ein
Browser wird nicht benötigt. Karma/Jasmine kommt hier **nicht** zum Einsatz. Zusätzlich existieren
13 Playwright-E2E-Tests unter `frontend/e2e/`; sie laufen **nicht** in der CI, sondern werden
manuell gegen eine laufende Umgebung ausgeführt (`cd frontend && npx playwright test`).

**Bereits entschieden:** Monorepo. Frontend und Backend liegen in diesem Repo (`frontend/`,
`backend/`), weil bei drei Personen zwei Repos mehr Overhead als Nutzen bringen. Als Auth-Bibliothek
für Flask ist `Flask-JWT-Extended` (Token-Auth) im Einsatz, eingetragen in
`backend/requirements.txt`; Nutzerkonten und geschützte Endpunkte sind damit umgesetzt (siehe
Statusabsatz oben).

---

## Was du installieren musst

Alles kostenlos (harte Vorgabe aus [`docs/03_Randbedingungen.md`](docs/03_Randbedingungen.md):
Studierendenprojekt ohne Budget).

| Tool | Version | Download | Wofür |
|---|---|---|---|
| Git | aktuell | https://git-scm.com/downloads | Versionierung |
| Docker Desktop | aktuell | https://www.docker.com/products/docker-desktop/ | PostgreSQL lokal |
| Node.js | **≥ 22.22.3** (LTS 22.x) | https://nodejs.org/ | Angular-Toolchain |
| Angular CLI | 22.x | `npm install -g @angular/cli` | `ng serve`, `ng test` |
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

Es gibt eine `.env.example` als Vorlage. Kopiere sie:

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

`docker-compose.yml` liegt im Repo-Root und sieht so aus:

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
      - "${POSTGRES_PORT:-5432}:5432"
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
pip install -r requirements-dev.txt
flask run --debug
```

`requirements-dev.txt` enthält `requirements.txt` plus `pytest` und `ruff` – zum Entwickeln also
immer die dev-Variante installieren. Dass `flask run` ohne `--app` funktioniert, liegt an
`backend/.flaskenv`, wo `FLASK_APP=run.py` gesetzt ist.

Erwartung: `Running on http://127.0.0.1:5000`. Zur Prüfung
http://localhost:5000/api/health aufrufen – erwartet wird HTTP 200 mit `{"status": "ok"}`.

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
flask run --debug
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
[Flask-Migrate/Alembic](https://flask-migrate.readthedocs.io/). Das aktuelle Schema entsteht durch
drei Migrationen: `backend/migrations/versions/0001_ms4_initial_schema.py` legt die ersten vier
Tabellen (`users`, `goals`, `plan_slots`, `study_sessions`) mit den Spalten an, die die Modelle
unter `backend/app/models/` beschreiben; `backend/migrations/versions/0002_goal_prioritaet_ergebnis.py`
ergänzt `goals` um die optionalen Spalten `priority`, `grade` und `result_note`;
`backend/migrations/versions/0003_milestones.py` legt die Tabelle `milestones` für die monatlichen
Zwischenziele (FR-3.2) an. Nach jedem `git pull` unbedingt in `backend/` bei aktivierter venv
`flask db upgrade` ausführen, sonst passen Code und lokales Schema nicht mehr zusammen. Für ein
neues Modell oder eine Schemaänderung:

```powershell
flask db migrate -m "beschreibung"   # Migration erzeugen (in backend/, venv aktiv)
flask db upgrade                     # Migration anwenden
```

Für beide Befehle muss der Docker-Container laufen, sonst bricht Alembic mit
`could not connect to server` ab.

Migrationsdateien werden **immer committet**. Nach `git pull` immer `flask db upgrade` laufen
lassen, sonst passen Code und lokales Schema nicht mehr zusammen.

**Zeitzonen:** Alle Zeitpunkte werden in der Datenbank in koordinierter Weltzeit (UTC) gespeichert
und von der API mit angehängtem `Z` ausgeliefert (Beispiel `2026-08-11T21:08:09Z`); die Umrechnung
in die Ortszeit übernimmt der Browser. Wer eine neue Zeitspalte ausliefert, benutzt dafür `iso_utc`
aus `backend/app/time_utils.py` und **nicht** `datetime.isoformat()`.

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

Danach PR auf GitHub öffnen. **GitHub Actions** (`.github/workflows/ci.yml`) führt bei jedem Push
auf `main`, `feature/**`, `fix/**`, `docs/**`, `FR-**` sowie bei jedem PR gegen `main` zwei Jobs aus:
Backend (`ruff check .`, `pytest`) und Frontend (`npx ng lint`, `npx ng test --watch=false`).
Merge erst bei grüner Pipeline.

---

## Deployment auf Railway

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

**Einmalige Einrichtung (macht Julian, Infrastruktur-Rolle):**

1. Auf https://railway.app/ mit GitHub-Account anmelden.
2. *New Project* → *Deploy from GitHub repo* → dieses Repo wählen (Root-Verzeichnis bleibt der
   Repo-Root, **nicht** `backend/` oder `frontend/`).
3. *New* → *Database* → *Add PostgreSQL*.
4. Für den einen Dienst unter *Variables* setzen: `DATABASE_URL=${{Postgres.DATABASE_URL}}`,
   `SECRET_KEY` (neuer, zufälliger Wert – **nicht** der aus der lokalen `.env`) und
   `FLASK_ENV=production`. Optional `JWT_SECRET_KEY` und `CORS_ORIGINS`, siehe `.env.example`.
5. Unter *Settings → Networking* → *Generate Domain* für die öffentliche URL.

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
| `relation "…" does not exist` | Migration fehlt: `flask db upgrade` in `backend/`. |
| Node-Module kaputt nach Branch-Wechsel | `Remove-Item -Recurse -Force node_modules; npm install` |
| `ng lint`/`ng test`/`ng serve` brechen sofort mit „The Angular CLI requires a minimum Node.js version …" ab (Exit-Code 3) | Installiertes Node.js ist älter als von `@angular/cli` (aktuell `^22.0.8`) verlangt. Mit `node --version` prüfen; nötig ist mindestens v22.22.3. Node über https://nodejs.org/ aktualisieren (LTS-Zweig), dann neue Shell öffnen. |

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

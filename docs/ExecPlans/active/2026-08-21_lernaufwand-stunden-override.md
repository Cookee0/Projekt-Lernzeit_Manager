# Lernaufwand in Stunden pro Lernziel überschreibbar machen

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This document must be maintained in accordance with `docs/PLANS.md` (read that file in full before touching this plan).

## Purpose / Big Picture

Heute rechnet die Anwendung den Lernaufwand jedes Lernziels immer als `ECTS-Punkte × 30 Stunden` (Kickoff-Beschluss, bestätigt am 2026-08-17, siehe Kommentar am Kopf von `backend/app/workload.py`). Diese Zahl steuert das Wochenbudget auf der Planungsseite, den Fortschrittsbalken auf dem Dashboard und die Auswertungsseite. Für die meisten Module passt die Formel (IU-Rechnung "5 ECTS = 150 Stunden"), aber nicht für alle: ein Nutzer kann aus eigener Erfahrung wissen, dass ein bestimmtes 5-ECTS-Modul nur 50 Stunden statt 150 Stunden braucht. Ohne eine Möglichkeit, das zu korrigieren, sind Wochenbudget und Fortschrittsanzeige für dieses Modul dauerhaft falsch, und der Nutzer erreicht seine App-eigenen Ziele nicht, obwohl er inhaltlich fertig ist.

Nach dieser Änderung kann jeder Nutzer beim Anlegen oder Bearbeiten eines Lernziels optional einen eigenen Lernaufwand in Stunden eintragen. Ist das Feld gesetzt, ersetzt es die Formel überall dort, wo der Lernaufwand des Ziels verwendet wird (Wochenbudget, Fortschrittsbalken, Auswertung). Ist das Feld leer, gilt weiterhin exakt die bisherige Formel `ECTS × 30 Stunden` – das bestehende Verhalten bleibt für jedes Lernziel ohne Override unverändert.

Sichtbar wird das so: Auf `/goals` zeigt das Formular "Neues Lernziel" (und das Bearbeiten-Formular jedes bestehenden Ziels) unterhalb des ECTS-Feldes ein neues, optionales Feld "Lernaufwand in Stunden (optional)". Lässt man es leer, steht auf der Zielkarte weiterhin z. B. "🎓 5 ECTS (150h)". Trägt man z. B. 50 ein, steht dort "🎓 5 ECTS (50h, manuell)" und das Wochenbudget auf `/planning` sowie der Fortschrittsbalken auf dem Dashboard rechnen ab sofort mit 50 Stunden statt 150.

## Progress

- [x] (2026-08-21) Plan geschrieben, Branch `feature/p14-po-feedback-fixes` von `origin/feature/railway-dockerfile-deployment` erstellt (dieser Branch enthält den tatsächlich auf Railway deployten Stand; `main` ist zum Planzeitpunkt 9 Tage älter und hat den Erinnerungs-Hub sowie das aktuelle Lernziel-Formular noch nicht).
- [x] (2026-08-21) Milestone 1 (Backend): Modell, Migration, Validierung, Workload-Rechnung, Routen, Tests umgesetzt. `pytest` in `backend/`: 138 von 138 Tests grün (vier davon neu). `ruff check .` fehlerfrei.
- [x] (2026-08-21) Milestone 2 (Frontend): Formularfeld (Neu- und Bearbeiten-Formular), Anzeige auf der Zielkarte, Validierung, Test umgesetzt. `npx ng test --watch=false` in `frontend/`: 43 von 43 Tests grün (einer davon neu), Build ohne TypeScript-Fehler. `npx ng lint` fehlerfrei.
- [x] (2026-08-21) Zweiter, unabhängiger Fix im selben Branch: Erinnerungs-Dropdown der Navbar schließt automatisch bei Routenwechsel und bei Klick außerhalb (`frontend/src/app/layout/navbar/navbar.ts`, kein eigener ExecPlan nötig, siehe Decision Log).
- [ ] Manuelle Browser-Kontrolle laut "Validation and Acceptance" (Docker-Postgres + `flask run` + `ng serve`) konnte in dieser Sitzung nicht durchgeführt werden, weil `docker` in der verfügbaren Werkzeugumgebung nicht aufrufbar war (siehe Surprises). Noch offen: von einem Entwickler mit lokalem Docker-Zugriff nachholen, bevor der Branch als fertig gilt.
- [ ] Commit(s), Push, PR gegen `main` (nach Rücksprache mit dem Nutzer, da `main` und der Ziel-Branch stark auseinanderlaufen).

## Surprises & Discoveries

- Beobachtung: `main` ist zum Zeitpunkt dieses Plans 9 Tage älter als `origin/feature/railway-dockerfile-deployment` und enthält weder den Erinnerungs-Hub (Navbar-Glocke) noch das erweiterte Lernziel-Formular (Priorität, Note, Bearbeiten). Alle Milestones P7 bis P13 liegen ausschließlich auf dem Feature-Branch.
  Beleg: `git log --oneline main..origin/feature/railway-dockerfile-deployment` listet u. a. die Commits "Erinnerungs-Hub mit Glocke und Dropdown in der Navbar ergaenzt" und "P12: Progress, Surprises und Outcomes ausgefuellt, Plan nach completed/ verschoben"; `git log -1 --format=%ci` zeigt `main` auf 2026-08-11, den Feature-Branch auf 2026-08-20.
- Beobachtung: Die 30h/ECTS-Formel ist keine willkürliche Implementierungsentscheidung, sondern eine datierte, dokumentierte Teamentscheidung.
  Beleg: Docstring-Kopf von `backend/app/workload.py`: "ein ECTS-Punkt entspricht 30 Stunden (Teamentscheidung vom 2026-08-17, IU-Rechnung '5 ECTS = 150 Stunden')."
- Beobachtung: `ruff check .` verlangt in diesem Repo maximal 100 Zeichen je Zeile. Die ursprünglich im Plan skizzierten einzeiligen Aufrufe von `weekly_budget_minutes(goal.effective_workload_minutes(), ...)` in `backend/app/routes/dashboard.py` und `backend/app/routes/plans.py` waren zu lang (112 bzw. 107 Zeichen) und mussten auf mehrere Zeilen umgebrochen werden.
  Beleg: `ruff check .` meldete zunächst zwei `E501 Line too long`-Fehler; nach dem Umbruch auf je eine Zeile pro Argument meldete `ruff check .` "All checks passed!".
- Beobachtung: Zwei bestehende Vitest-Spec-Dateien (`frontend/src/app/features/calendar/calendar.spec.ts` und `frontend/src/app/core/services/reminder.service.spec.ts`) bauen `Goal`-/`GoalStats`-Objekte als Literal auf und mussten um `workload_hours: null` ergänzt werden, sonst hätte der TypeScript-Compiler das neue Pflichtfeld im `Goal`-Interface bemängelt.
  Beleg: `npx ng test --watch=false` baute nach der Ergänzung fehlerfrei; vorher wäre ein Kompilierfehler zu erwarten gewesen (nicht separat verifiziert, da die Ergänzung vor dem ersten Testlauf vorgenommen wurde).
- Beobachtung: In der in dieser Werkzeugumgebung verfügbaren Bash- und PowerShell-Umgebung ist `docker` nicht installiert bzw. nicht im PATH, ebenso wenig `gh` (GitHub CLI). Die manuelle Browser-Kontrolle aus "Validation and Acceptance" und ein `gh pr`-Abgleich (offene PRs, Zielbranch) konnten deshalb in dieser Sitzung nicht durchgeführt werden.
  Beleg: `docker compose ps` lieferte in Bash "docker: command not found" und in PowerShell "Die Benennung 'docker' wurde nicht als Name eines Cmdlet ... erkannt"; `gh pr list` lieferte dieselbe Art Fehlermeldung für `gh`.

## Decision Log

- Decision: Das neue Feld heißt `workload_hours` (nullable Integer, Einheit Stunden) an `Goal`, nicht `workload_minutes`.
  Rationale: Die Nutzeroberfläche und die Nutzerin sprechen in Stunden ("50 Stunden reichen"); eine Speicherung in Minuten würde nur unnötige Umrechnung beim Lesen des Codes erzeugen. Intern wird trotzdem in Minuten weitergerechnet (wie bisher bei `MINUTES_PER_ECTS`), aber die Umrechnung `workload_hours * 60` passiert an genau einer Stelle.
  Date/Author: 2026-08-21, Plan-Autor.
- Decision: `remaining_minutes` und `weekly_budget_minutes` in `backend/app/workload.py` bekommen ihren ersten Parameter umbenannt und umgedeutet: statt `ects: int` (die Funktion multiplizierte bisher intern mit `MINUTES_PER_ECTS`) nehmen sie direkt `workload_minutes: int` entgegen. Die Multiplikation mit `MINUTES_PER_ECTS` wandert in eine neue Methode `Goal.effective_workload_minutes()`.
  Rationale: Ohne diese Änderung müsste an jeder der vier Aufrufstellen (`backend/app/routes/dashboard.py` zweimal, `backend/app/routes/stats.py` einmal, `backend/app/routes/plans.py` zweimal) dieselbe Fallunterscheidung "hat das Ziel `workload_hours` gesetzt, sonst ECTS × 30h" dupliziert werden. Eine einzige Methode auf `Goal` ist die einzige Quelle der Wahrheit und lässt sich nicht vergessen.
  Date/Author: 2026-08-21, Plan-Autor.
- Decision: Der bestehende, generische Validator `optional_int_arg(value, field_label, minimum, maximum)` aus `backend/app/validation.py` wird unverändert auch für das neue JSON-Body-Feld `workload_hours` wiederverwendet, obwohl sein Docstring von einem "Abfrageparameter der Adresszeile" spricht.
  Rationale: Die Funktion prüft nur "fehlt der Wert, sonst ganze Zahl im Bereich" – das ist unabhängig davon, ob der Wert aus der Query-String oder aus dem JSON-Body kommt. `backend/app/validation.py` selbst muss für dieses Feature nicht geändert werden (Golden Principle "Surgical Changes").
  Date/Author: 2026-08-21, Plan-Autor.
- Decision: Erlaubter Bereich für `workload_hours` ist 1 bis 1000 Stunden, serverseitig und im Frontend gleich.
  Rationale: 1000 Stunden ist ein großzügiger, aber endlicher Puffer (mehr als das 6-fache des Maximalwerts der bestehenden Formel bei 30 ECTS × 30h = 900h) und verhindert Tippfehler wie sechsstellige Zahlen, ohne reale Anwendungsfälle einzuschränken.
  Date/Author: 2026-08-21, Plan-Autor.
- Decision: Beide vom Nutzer gemeldeten Punkte (Erinnerungs-Dropdown schließt nicht, ECTS-Stunden nicht änderbar) werden im selben Branch `feature/p14-po-feedback-fixes` umgesetzt, das dieser Plan aber nur für den ECTS/Stunden-Teil gilt.
  Rationale: Der Dropdown-Fix ist eine kleine, in sich geschlossene UI-Änderung (eine Datei, keine Migration, kein Datenmodell) und fällt laut der Tabelle in `AGENTS.md` ("Kein ExecPlan nötig" für "Ein fehlender Test, ein Ein-Zeilen-Bugfix"-artige Änderungen) nicht unter die ExecPlan-Pflicht. Der ECTS/Stunden-Teil ändert das Datenmodell (neue Spalte) und fällt laut derselben Tabelle ausdrücklich unter "ExecPlan Pflicht".
  Date/Author: 2026-08-21, Plan-Autor.

## Outcomes & Retrospective

Beide Milestones sind inhaltlich abgeschlossen: die REST-API akzeptiert, validiert und liefert `workload_hours`; alle vier Berechnungsstellen (Dashboard-Fortschritt, Dashboard-FR-7.3-Warnung, Auswertungsseite, Grobplanungs-Vorschlag inkl. Wochenbudget) verwenden `Goal.effective_workload_minutes()` und respektieren damit den Override. Das Frontend-Formular (Neu- und Bearbeiten-Ansicht auf `/goals`) erlaubt das Setzen und Löschen des Overrides, die Zielkarte zeigt den wirksamen Wert inklusive eines "manuell"-Hinweises. Alle automatisierten Tests (138 Backend, 43 Frontend) sind grün, Linting ist in beiden Projekten fehlerfrei. Der ursprüngliche Zweck ist damit erreicht: ein Nutzer kann ein 5-ECTS-Modul mit z. B. 50 Stunden statt automatisch angenommenen 150 Stunden anlegen, und diese Zahl wirkt sich sofort auf Wochenbudget, Fortschrittsbalken und Auswertung aus, während alle Lernziele ohne gesetzten Override unverändert der bisherigen Formel folgen (durch die neuen Tests `test_goal_without_workload_hours_keeps_ects_formula` und die Bestandstests in `test_workload.py` belegt).

Offen bleibt die in "Progress" vermerkte manuelle Browser-Kontrolle mit echtem Postgres über Docker Compose, weil `docker` in dieser Werkzeugumgebung nicht verfügbar war – die automatisierten Tests decken die REST-Schicht und die Formularlogik aber bereits Ende-zu-Ende ab (die neuen Backend-Tests rufen `POST /api/goals` und `GET /api/dashboard` über den echten Flask-Testclient auf, nicht nur die reine Rechenfunktion). Ebenfalls offen: Commit, Push und die Entscheidung, gegen welchen Branch (`main` oder `feature/railway-dockerfile-deployment`) ein Pull Request geöffnet werden soll – das hängt von einer Team-Entscheidung zum stark veralteten `main`-Branch ab, die außerhalb des Umfangs dieses Plans liegt (siehe Surprises-Eintrag zu `main` vs. `feature/railway-dockerfile-deployment`).

## Context and Orientation

Das Repository ist ein Monorepo mit `backend/` (Flask/Python, REST-API, PostgreSQL in Produktion, SQLite im Testlauf) und `frontend/` (Angular 22, TypeScript, Standalone Components, Vitest für Tests). Alle Angaben unten beziehen sich auf den Stand des Branches `feature/railway-dockerfile-deployment` (Basis dieses Feature-Branches), nicht auf `main`.

Das Datenmodell für ein Lernziel liegt in `backend/app/models/goal.py`. Die Klasse `Goal` hat unter anderem die Spalten `ects` (Integer, Pflichtfeld, Standard 5) und bereits `priority`, `grade`, `result_note` (alle nullable, optional). Die Methode `to_dict()` wandelt ein `Goal`-Objekt in das JSON um, das die REST-API zurückgibt.

Die Umrechnung von ECTS-Punkten in Lernminuten liegt zentral in `backend/app/workload.py`. Die Konstante `MINUTES_PER_ECTS = 30 * 60` (1800 Minuten = 30 Stunden) wird an vier Stellen im Code verwendet:

1. `backend/app/routes/dashboard.py`, Zeile 109: `"planned_ects_minutes": goal.ects * MINUTES_PER_ECTS` – der Gesamtworkload eines Ziels für den Fortschrittsbalken auf dem Dashboard.
2. `backend/app/routes/dashboard.py`, Zeile 110-112: Aufruf von `weekly_budget_minutes(goal.ects, actual_goal_minutes, goal.target_date, today, goal.status)` – das Wochenbudget je Ziel.
3. `backend/app/routes/dashboard.py`, Zeile 119: `workload = goal.ects * MINUTES_PER_ECTS` – für die FR-7.3-Warnung bei nahendem Zieltermin ohne Fortschritt.
4. `backend/app/routes/stats.py`, Zeile 72: `planned_ects_minutes = goal.ects * MINUTES_PER_ECTS` – derselbe Gesamtworkload für die Auswertungsseite.
5. `backend/app/routes/plans.py`, Zeile 87 und Zeile 99-101: Aufrufe von `remaining_minutes(goal.ects, actual_minutes)` und `weekly_budget_minutes(goal.ects, actual_minutes, goal.target_date, today, goal.status)` – der Grobplanungs-Vorschlag.

`backend/app/workload.py` definiert außerdem `remaining_minutes(ects: int, actual_minutes: int) -> int` (multipliziert intern `ects * MINUTES_PER_ECTS` und zieht `actual_minutes` ab, nie negativ) und `weekly_budget_minutes(ects: int, actual_minutes: int, target: date, today: date, status: str) -> int` (ruft intern `remaining_minutes` auf und teilt durch die Anzahl verbleibender Wochen).

Die REST-Routen für Lernziele liegen in `backend/app/routes/goals.py`: `create_goal()` liest Felder aus dem JSON-Body mit Hilfsfunktionen aus `backend/app/validation.py` (z. B. `require_text`, `require_int_in_range`, `optional_text`) und legt ein `Goal`-Objekt an; `update_goal()` übernimmt nur die Felder, die im JSON-Body tatsächlich enthalten sind (`if "priority" in data: ...`-Muster). Die Datei `backend/app/validation.py` enthält bereits `optional_int_arg(value, field_label, minimum, maximum) -> int | None`, die `None` liefert, wenn der Wert fehlt (oder eine leere Zeichenkette ist), und sonst eine ganze Zahl im angegebenen Bereich verlangt (sonst wirft sie `ValidationError`, die zentral in `backend/app/__init__.py` in HTTP 400 übersetzt wird). Diese Funktion wird aktuell nur für Query-Parameter (`request.args.get(...)`) verwendet, ist aber inhaltlich unabhängig von der Herkunft des Wertes.

Datenbank-Schemaänderungen laufen über Flask-Migrate/Alembic. Migrationsdateien liegen in `backend/migrations/versions/`, aktuell `0001_ms4_initial_schema.py`, `0002_goal_prioritaet_ergebnis.py` (fügt `priority`, `grade`, `result_note` als nullable Spalten hinzu – die Vorlage für diese Änderung) und `0003_milestones.py`. Jede Migration hat `revision` (ihre eigene ID als String) und `down_revision` (die ID der vorherigen Migration); die neue Migration muss `down_revision = "0003_milestones"` setzen. Wichtig: die Spalte `alembic_version.version_num` ist `varchar(32)` – die Revision-ID darf höchstens 32 Zeichen lang sein (siehe Kommentar in `0002_goal_prioritaet_ergebnis.py`, dort brach `flask db upgrade` bei einer zu langen ID mit `StringDataRightTruncation` ab).

Backend-Tests liegen in `backend/tests/`, laufen mit `pytest` (Kommando: im Verzeichnis `backend/`, bei aktivierter virtueller Umgebung, `pytest`). Die Fixture `client` in `backend/tests/conftest.py` erzeugt für jeden Test eine frische SQLite-Datenbank über `db.create_all()` – das liest das aktuelle `Goal`-Modell direkt, eine Migration ist für Tests nicht nötig (nur für echte Postgres-Datenbanken über `flask db upgrade`). `backend/tests/test_workload.py` testet `remaining_minutes` und `weekly_budget_minutes` direkt mit ECTS-Werten wie `remaining_minutes(5, 600)`. `backend/tests/test_goals.py` testet die REST-Routen für Lernziele.

Auf der Frontend-Seite zeigt `frontend/src/app/features/goals/goals.ts` (Standalone-Angular-Component, Route `/goals`, siehe `frontend/src/app/app.routes.ts`) zwei Formulare mit demselben Feldsatz: "Neues Lernziel" (Felder `title`, `module_name`, `ects`, `target_date`, `priority`) und ein Bearbeiten-Formular pro Zielkarte (zusätzlich `status`, `grade`, `result_note`). Beide benutzen `[(ngModel)]` (Angular `FormsModule`) auf ein Objekt (`form` bzw. `editForm`), zeigen Feldfehler über ein `fieldErrors`-Signal (`Record<string, string>`) an und validieren vor dem Absenden mit Funktionen aus `frontend/src/app/core/validation.ts` (z. B. `validateEcts(value: number | null): string | null`, die dieselbe Regel wie der Server client-seitig vorab prüft, damit der Nutzer sofort eine Fehlermeldung sieht, bevor die Anfrage überhaupt an den Server geht). Die Zielkarte zeigt aktuell `<span title="1 ECTS entspricht ca. 30 Stunden Lernaufwand">🎓 {{ goal.ects }} ECTS ({{ goal.ects * 30 }}h)</span>` – die Formel ist hier im Frontend hartcodiert dupliziert (nur für die Anzeige, nicht für Berechnungen; alle Berechnungen wie Wochenbudget kommen bereits vom Server).

Das TypeScript-Interface `Goal` liegt in `frontend/src/app/core/models/index.ts` und beschreibt die Form der JSON-Antwort der API. `frontend/src/app/core/services/goal.service.ts` schickt `Partial<Goal>` als Payload für `create()` und `update()` – jedes neue Feld im `Goal`-Interface ist damit automatisch im erlaubten Payload enthalten, ohne den Service selbst zu ändern.

## Plan of Work

**Milestone 1 (Backend).** Ziel: die REST-API akzeptiert und liefert `workload_hours`, und alle vier Berechnungsstellen benutzen den Override, sobald er gesetzt ist.

In `backend/app/models/goal.py`: Import ergänzen (`from ..workload import MINUTES_PER_ECTS`), neue Spalte `workload_hours = db.Column(db.Integer, nullable=True)` direkt unter der Zeile `ects = db.Column(db.Integer, default=5)` einfügen, `"workload_hours": self.workload_hours,` in `to_dict()` direkt nach `"ects": self.ects,` ergänzen, und eine neue Methode `effective_workload_minutes(self) -> int` auf der Klasse ergänzen, die `self.workload_hours * 60` zurückgibt, falls `self.workload_hours is not None`, sonst `self.ects * MINUTES_PER_ECTS`.

In `backend/app/workload.py`: den Modul-Docstring am Kopf der Datei um einen Satz ergänzen, der erklärt, dass die Formel seit dieser Änderung pro Lernziel über `Goal.workload_hours` überschrieben werden kann (Details unten in "Concrete Steps"). Die Funktionssignaturen von `remaining_minutes` und `weekly_budget_minutes` ändern sich: ihr erster Parameter heißt neu `workload_minutes: int` statt `ects: int`, und sie multiplizieren nicht mehr selbst mit `MINUTES_PER_ECTS` – dieser Wert kommt jetzt fertig berechnet vom Aufrufer (über `Goal.effective_workload_minutes()`).

In `backend/app/routes/dashboard.py`: den Import auf Zeile 13 von `from ..workload import MINUTES_PER_ECTS, weekly_budget_minutes` zu `from ..workload import weekly_budget_minutes` ändern (die Konstante wird in dieser Datei nach der Änderung nirgends mehr direkt gebraucht). Die drei Verwendungsstellen (Zeilen 109, 110-112, 119) auf `goal.effective_workload_minutes()` umstellen.

In `backend/app/routes/stats.py`: die Importzeile `from ..workload import MINUTES_PER_ECTS` komplett entfernen (nach der Änderung ungenutzt) und Zeile 72 auf `goal.effective_workload_minutes()` umstellen.

In `backend/app/routes/plans.py`: die beiden Aufrufe (Zeile 87 und 99-101) von `goal.ects` auf `goal.effective_workload_minutes()` umstellen; der Import auf Zeile 19 bleibt unverändert (er importiert keine `MINUTES_PER_ECTS`-Konstante).

In `backend/app/routes/goals.py`: Import von `optional_int_arg` zur bestehenden Importzeile aus `..validation` ergänzen. In `create_goal()` nach der Zeile mit `ects = require_int_in_range(...)` ergänzen: `workload_hours = optional_int_arg(data.get("workload_hours"), "Lernaufwand in Stunden", 1, 1000)`, und beim Anlegen von `Goal(...)` das Feld `workload_hours=workload_hours` ergänzen. In `update_goal()` nach dem bestehenden `if "ects" in data: ...`-Block ergänzen: `if "workload_hours" in data: goal.workload_hours = optional_int_arg(data["workload_hours"], "Lernaufwand in Stunden", 1, 1000)`.

Eine neue Migration `backend/migrations/versions/0004_goal_workload_hours.py` nach dem Muster von `0002_goal_prioritaet_ergebnis.py` anlegen, die die nullable Spalte `workload_hours` (Integer) zur Tabelle `goals` hinzufügt, mit `down_revision = "0003_milestones"`.

Neue und angepasste Tests: `backend/tests/test_workload.py` auf die neue Signatur umstellen (siehe "Concrete Steps" für den exakten Diff) und `backend/tests/test_goals.py` um zwei neue Tests ergänzen, die belegen, dass `workload_hours` beim Anlegen gespeichert wird und dass ein Wert außerhalb 1-1000 mit HTTP 400 abgelehnt wird.

**Milestone 2 (Frontend).** Ziel: Nutzer können das neue Feld in beiden Formularen auf `/goals` setzen, sehen den Effekt sofort auf der Zielkarte, und eine ungültige Eingabe zeigt eine Fehlermeldung, bevor überhaupt eine Anfrage an den Server geht.

In `frontend/src/app/core/models/index.ts`: `workload_hours: number | null;` zum `Goal`-Interface ergänzen (direkt nach `ects: number;`).

In `frontend/src/app/core/validation.ts`: neue Funktion `validateWorkloadHours(value: number | null): string | null` ergänzen, die `null` zurückgibt, wenn der Wert leer ist (das Feld ist optional), und sonst dieselbe Regel wie der Server prüft (ganze Zahl zwischen 1 und 1000).

In `frontend/src/app/features/goals/goals.ts`: In beiden Formular-Objekten (`form` und `editForm`) das Feld `workload_hours: null as number | null` ergänzen. In beiden Templates (Neu-Formular und Bearbeiten-Formular) ein neues `form-group` mit einem Zahlenfeld für `workload_hours` ergänzen, mit Label "Lernaufwand in Stunden (optional)" und einem erklärenden `title`-Attribut. In `create()` und `saveEdit()` die Validierung über `validateWorkloadHours` ergänzen und das Feld an die Server-Anfrage übergeben (bei `create()` ist es durch das Spreaden von `...this.form` bereits automatisch enthalten). Beim Zurücksetzen des Formulars nach erfolgreichem Anlegen (`this.form = {...}`) das neue Feld auf `null` zurücksetzen. In `startEdit()` das Feld aus dem geladenen `Goal`-Objekt in `editForm` übernehmen. Die Anzeige auf der Zielkarte anpassen, damit sie den tatsächlich wirksamen Wert zeigt (Override, falls gesetzt, sonst die Formel), über eine neue Methode `effectiveHours(goal: Goal): number`.

Ein neuer Vitest-Test `frontend/src/app/features/goals/goals.spec.ts` (existiert noch nicht) prüft `validateWorkloadHours` indirekt nicht nötig (das ist bereits reine Funktion, siehe unten) – stattdessen wird direkt `frontend/src/app/core/validation.spec.ts` um Testfälle für `validateWorkloadHours` ergänzt, nach demselben Muster wie die bestehenden Tests für `validateEcts` in derselben Datei.

## Concrete Steps

Alle Backend-Befehle laufen im Verzeichnis `backend/` mit aktivierter virtueller Umgebung (`.\.venv\Scripts\Activate.ps1` unter Windows PowerShell). Alle Frontend-Befehle laufen im Verzeichnis `frontend/`.

Schritt 1 — `backend/app/models/goal.py` ändern. Die Datei beginnt aktuell mit:

    from datetime import datetime, timezone

    from ..extensions import db
    from ..time_utils import iso_utc

Das wird zu:

    from datetime import datetime, timezone

    from ..extensions import db
    from ..time_utils import iso_utc
    from ..workload import MINUTES_PER_ECTS

Die Zeile `ects = db.Column(db.Integer, default=5)` wird zu:

    ects = db.Column(db.Integer, default=5)
    workload_hours = db.Column(db.Integer, nullable=True)

In `to_dict()` wird `"ects": self.ects,` zu:

    "ects": self.ects,
    "workload_hours": self.workload_hours,

Nach dem Ende von `to_dict()` (nach der schließenden `}` und vor dem Ende der Klasse) eine neue Methode ergänzen:

    def effective_workload_minutes(self) -> int:
        """Lernaufwand des Ziels in Minuten.

        Ist `workload_hours` gesetzt, ueberschreibt dieser manuell erfasste
        Wert die Standardformel - z. B. weil ein Modul laut Erfahrung
        weniger oder mehr Zeit braucht als die Team-Formel annimmt. Ohne
        gesetzten Override gilt weiterhin exakt `ects * MINUTES_PER_ECTS`.
        """
        if self.workload_hours is not None:
            return self.workload_hours * 60
        return self.ects * MINUTES_PER_ECTS

Schritt 2 — `backend/app/workload.py` ändern. Der Docstring-Kopf der Datei lautet aktuell:

    """Workload-Rechnung fuer die Grobplanung (FR-2.1, FR-2.2, FR-3.3).

    Der Lernaufwand eines Moduls leitet sich aus seinen ECTS-Punkten ab
    (Kickoff-Beschluss); ein ECTS-Punkt entspricht 30 Stunden (Teamentscheidung
    vom 2026-08-17, IU-Rechnung "5 ECTS = 150 Stunden").
    """

Das wird zu:

    """Workload-Rechnung fuer die Grobplanung (FR-2.1, FR-2.2, FR-3.3).

    Der Lernaufwand eines Moduls leitet sich aus seinen ECTS-Punkten ab
    (Kickoff-Beschluss); ein ECTS-Punkt entspricht 30 Stunden (Teamentscheidung
    vom 2026-08-17, IU-Rechnung "5 ECTS = 150 Stunden"). Seit 2026-08-21 kann
    dieser Automatikwert pro Lernziel ueberschrieben werden (Goal.workload_hours,
    Migration 0004) - z. B. wenn ein Modul laut Erfahrung weniger oder mehr Zeit
    braucht als die Formel annimmt. Die Funktionen hier rechnen deshalb nicht
    mehr selbst von ECTS in Minuten um; sie nehmen den fertigen Minutenwert
    entgegen (siehe Goal.effective_workload_minutes in backend/app/models/goal.py).
    Ohne gesetzten Override liefert diese Methode exakt denselben Wert wie zuvor.
    """

Die Funktion `remaining_minutes` lautet aktuell:

    def remaining_minutes(ects: int, actual_minutes: int) -> int:
        """Restaufwand eines Ziels: Gesamtworkload minus bereits gelernte Zeit."""
        return max(0, ects * MINUTES_PER_ECTS - actual_minutes)

Das wird zu:

    def remaining_minutes(workload_minutes: int, actual_minutes: int) -> int:
        """Restaufwand eines Ziels: Gesamtworkload minus bereits gelernte Zeit."""
        return max(0, workload_minutes - actual_minutes)

Die Funktion `weekly_budget_minutes` lautet aktuell:

    def weekly_budget_minutes(
        ects: int, actual_minutes: int, target: date, today: date, status: str
    ) -> int:
        """Wochenbudget je Modul (FR-2.1): Restaufwand pro verbleibender Woche.

        Erreichte Ziele und Ziele ohne Restaufwand haben Budget 0.
        """
        if status == "achieved":
            return 0
        rest = remaining_minutes(ects, actual_minutes)
        if rest == 0:
            return 0
        return round(rest / weeks_until(target, today))

Das wird zu:

    def weekly_budget_minutes(
        workload_minutes: int, actual_minutes: int, target: date, today: date, status: str
    ) -> int:
        """Wochenbudget je Modul (FR-2.1): Restaufwand pro verbleibender Woche.

        Erreichte Ziele und Ziele ohne Restaufwand haben Budget 0.
        """
        if status == "achieved":
            return 0
        rest = remaining_minutes(workload_minutes, actual_minutes)
        if rest == 0:
            return 0
        return round(rest / weeks_until(target, today))

Schritt 3 — `backend/app/routes/dashboard.py` ändern. Zeile 13 aktuell:

    from ..workload import MINUTES_PER_ECTS, weekly_budget_minutes

wird zu:

    from ..workload import weekly_budget_minutes

Die Zeilen 105-115 lauten aktuell:

    goals_data.append(
        {
            **goal.to_dict(),
            "total_actual_minutes": actual_goal_minutes,
            "planned_ects_minutes": goal.ects * MINUTES_PER_ECTS,
            "weekly_budget_minutes": weekly_budget_minutes(
                goal.ects, actual_goal_minutes, goal.target_date, today, goal.status
            ),
            "milestones": milestones_by_goal.get(goal.id, []),
        }
    )

werden zu:

    goals_data.append(
        {
            **goal.to_dict(),
            "total_actual_minutes": actual_goal_minutes,
            "planned_ects_minutes": goal.effective_workload_minutes(),
            "weekly_budget_minutes": weekly_budget_minutes(
                goal.effective_workload_minutes(),
                actual_goal_minutes,
                goal.target_date,
                today,
                goal.status,
            ),
            "milestones": milestones_by_goal.get(goal.id, []),
        }
    )

(Hinweis: `ruff check .` verlangt maximal 100 Zeichen je Zeile; der Aufruf von
`weekly_budget_minutes` muss deshalb wie oben auf mehrere Zeilen umgebrochen
werden, sonst meldet `ruff check .` einen E501-Fehler.)

Zeile 119 aktuell:

    workload = goal.ects * MINUTES_PER_ECTS

wird zu:

    workload = goal.effective_workload_minutes()

Schritt 4 — `backend/app/routes/stats.py` ändern. Zeile 18 (`from ..workload import MINUTES_PER_ECTS`) komplett löschen. Zeile 72 aktuell:

    planned_ects_minutes = goal.ects * MINUTES_PER_ECTS

wird zu:

    planned_ects_minutes = goal.effective_workload_minutes()

Schritt 5 — `backend/app/routes/plans.py` ändern. Zeile 87 aktuell:

    rest = remaining_minutes(goal.ects, actual_minutes)

wird zu:

    rest = remaining_minutes(goal.effective_workload_minutes(), actual_minutes)

Die Zeilen 99-101 aktuell:

    "weekly_budget_minutes": weekly_budget_minutes(
        goal.ects, actual_minutes, goal.target_date, today, goal.status
    ),

werden zu:

    "weekly_budget_minutes": weekly_budget_minutes(
        goal.effective_workload_minutes(),
        actual_minutes,
        goal.target_date,
        today,
        goal.status,
    ),

Schritt 6 — `backend/app/routes/goals.py` ändern. Die Importzeile lautet aktuell:

    from ..validation import (
        optional_text,
        require_future_date,
        require_int_in_range,
        require_text,
    )

wird zu:

    from ..validation import (
        optional_int_arg,
        optional_text,
        require_future_date,
        require_int_in_range,
        require_text,
    )

In `create_goal()` steht aktuell:

    ects = require_int_in_range(data.get("ects"), "ECTS-Punkte", 1, 30, default=5)
    status = data.get("status") or "open"

wird zu:

    ects = require_int_in_range(data.get("ects"), "ECTS-Punkte", 1, 30, default=5)
    workload_hours = optional_int_arg(data.get("workload_hours"), "Lernaufwand in Stunden", 1, 1000)
    status = data.get("status") or "open"

Weiter unten in `create_goal()` steht aktuell:

    goal = Goal(
        user_id=_current_user_id(),
        title=title,
        module_name=module_name,
        target_date=target_date,
        ects=ects,
        status=status,
        priority=priority,
        grade=grade,
        result_note=result_note,
    )

wird zu:

    goal = Goal(
        user_id=_current_user_id(),
        title=title,
        module_name=module_name,
        target_date=target_date,
        ects=ects,
        workload_hours=workload_hours,
        status=status,
        priority=priority,
        grade=grade,
        result_note=result_note,
    )

In `update_goal()` steht aktuell:

    if "ects" in data:
        goal.ects = require_int_in_range(data["ects"], "ECTS-Punkte", 1, 30)
    if "status" in data:

wird zu:

    if "ects" in data:
        goal.ects = require_int_in_range(data["ects"], "ECTS-Punkte", 1, 30)
    if "workload_hours" in data:
        goal.workload_hours = optional_int_arg(
            data["workload_hours"], "Lernaufwand in Stunden", 1, 1000
        )
    if "status" in data:

Schritt 7 — Migration anlegen. Neue Datei `backend/migrations/versions/0004_goal_workload_hours.py` mit exakt diesem Inhalt:

    """Lernziel um manuellen Lernaufwand in Stunden erweitern

    Revision ID: 0004_goal_workload_hours
    Revises: 0003_milestones
    Create Date: 2026-08-21

    workload_hours ueberschreibt, falls gesetzt, die Standardformel
    ects * 30 Stunden (siehe backend/app/workload.py). Die Spalte ist
    nullable, damit bestehende Lernziele unveraendert bei der Formel
    bleiben.
    """

    import sqlalchemy as sa
    from alembic import op

    revision = "0004_goal_workload_hours"
    down_revision = "0003_milestones"
    branch_labels = None
    depends_on = None


    def upgrade():
        op.add_column("goals", sa.Column("workload_hours", sa.Integer(), nullable=True))


    def downgrade():
        op.drop_column("goals", "workload_hours")

Schritt 8 — `backend/tests/test_workload.py` an die neue Signatur anpassen. Die Datei importiert `MINUTES_PER_ECTS` bereits (Zeile 6), das bleibt unverändert. Jeder Aufruf von `remaining_minutes(N, ...)` oder `weekly_budget_minutes(N, ...)`, bei dem `N` bisher eine ECTS-Zahl war, wird zu `N * MINUTES_PER_ECTS`. Konkret:

    def test_remaining_minutes_subtracts_actual():
        assert remaining_minutes(5 * MINUTES_PER_ECTS, 600) == 5 * MINUTES_PER_ECTS - 600


    def test_remaining_minutes_never_negative():
        assert remaining_minutes(1 * MINUTES_PER_ECTS, 999_999) == 0

    ...

    def test_weekly_budget_spreads_remaining_over_weeks():
        # 5 ECTS = 9000 min Restaufwand, Ziel in 10 Wochen -> 900 min/Woche
        target = TODAY + timedelta(days=70)
        assert weekly_budget_minutes(5 * MINUTES_PER_ECTS, 0, target, TODAY, "open") == 900


    def test_weekly_budget_zero_for_achieved_goal():
        target = TODAY + timedelta(days=70)
        assert weekly_budget_minutes(5 * MINUTES_PER_ECTS, 0, target, TODAY, "achieved") == 0


    def test_weekly_budget_zero_without_remaining_workload():
        target = TODAY + timedelta(days=70)
        assert weekly_budget_minutes(1 * MINUTES_PER_ECTS, MINUTES_PER_ECTS, target, TODAY, "open") == 0


    def test_weekly_budget_past_target_uses_single_week():
        # Zieldatum verstrichen: der ganze Restaufwand faellt in eine Woche.
        target = TODAY - timedelta(days=5)
        assert weekly_budget_minutes(1 * MINUTES_PER_ECTS, 0, target, TODAY, "open") == MINUTES_PER_ECTS

Die letzte Funktion in der Datei, `test_dashboard_delivers_weekly_budget`, ruft keine der beiden Funktionen direkt auf (sie prüft die HTTP-Antwort von `/api/dashboard`) und bleibt unverändert. Zusätzlich zwei neue Tests ans Ende der Datei anhängen, die den Override end-to-end über die echten Routen belegen:

    def test_weekly_budget_uses_workload_hours_override(client, auth_header):
        resp = client.post(
            "/api/goals",
            json={
                "title": "Override-Ziel",
                "module_name": "X",
                "target_date": (TODAY + timedelta(days=70)).isoformat(),
                "ects": 5,
                "workload_hours": 50,
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        goal = resp.get_json()
        assert goal["workload_hours"] == 50

        dash = client.get("/api/dashboard", headers=auth_header)
        goal_data = next(g for g in dash.get_json()["goals"] if g["id"] == goal["id"])
        # 50 Stunden = 3000 Minuten statt 5 * 1800 = 9000 Minuten aus der Formel.
        assert goal_data["planned_ects_minutes"] == 50 * 60


    def test_goal_without_workload_hours_keeps_ects_formula(client, auth_header):
        resp = client.post(
            "/api/goals",
            json={
                "title": "Formel-Ziel",
                "module_name": "X",
                "target_date": (TODAY + timedelta(days=70)).isoformat(),
                "ects": 5,
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        goal = resp.get_json()
        assert goal["workload_hours"] is None

        dash = client.get("/api/dashboard", headers=auth_header)
        goal_data = next(g for g in dash.get_json()["goals"] if g["id"] == goal["id"])
        assert goal_data["planned_ects_minutes"] == 5 * MINUTES_PER_ECTS

Diese beiden neuen Tests brauchen `from datetime import timedelta` (bereits importiert, siehe Zeile 3 der Datei) und die Fixtures `client` und `auth_header` aus `backend/tests/conftest.py` (werden von pytest automatisch injiziert, kein zusätzlicher Import nötig).

Schritt 9 — `backend/tests/test_goals.py` um zwei Tests ergänzen (ans Ende der Datei anhängen):

    def test_create_goal_rejects_workload_hours_out_of_range(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={
                "title": "Zu viele Stunden",
                "module_name": "X",
                "target_date": FUTURE_DATE,
                "workload_hours": 1001,
            },
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_update_goal_clears_workload_hours_with_empty_string(client, auth_header):
        create_resp = client.post(
            GOALS_URL,
            json={**_GOAL_PAYLOAD, "workload_hours": 50},
            headers=auth_header,
        )
        goal_id = create_resp.get_json()["id"]
        assert create_resp.get_json()["workload_hours"] == 50

        resp = client.put(
            f"{GOALS_URL}/{goal_id}", json={"workload_hours": ""}, headers=auth_header
        )
        assert resp.status_code == 200
        assert resp.get_json()["workload_hours"] is None

Schritt 10 — Backend-Tests ausführen. Im Verzeichnis `backend/`, bei aktivierter virtueller Umgebung:

    pytest

Erwartet: alle Tests grün, insgesamt mehr als die vorher vorhandene Anzahl (vier neue Tests kommen hinzu: zwei in `test_workload.py`, zwei in `test_goals.py`). Kein Test darf fehlschlagen oder übersprungen werden. Schlägt ein Test in `test_workload.py`, `test_dashboard_fields.py`, `test_plan_proposal.py` oder `test_stats.py` fehl, liegt es vermutlich an einer vergessenen Umstellung von `goal.ects` auf `goal.effective_workload_minutes()` an einer der vier Aufrufstellen aus Schritt 3-5 – die Fehlermeldung zeigt die betroffene Datei und Zeile.

Schritt 11 — `frontend/src/app/core/models/index.ts` ändern. Das `Goal`-Interface lautet aktuell:

    export interface Goal {
      id: number;
      user_id: number;
      title: string;
      module_name: string;
      ects: number;
      status: 'open' | 'in_progress' | 'achieved';
      priority: 'high' | 'medium' | 'low' | null;
      grade: string | null;
      result_note: string | null;
      target_date: string;
      created_at: string;
    }

wird zu:

    export interface Goal {
      id: number;
      user_id: number;
      title: string;
      module_name: string;
      ects: number;
      workload_hours: number | null;
      status: 'open' | 'in_progress' | 'achieved';
      priority: 'high' | 'medium' | 'low' | null;
      grade: string | null;
      result_note: string | null;
      target_date: string;
      created_at: string;
    }

Schritt 12 — `frontend/src/app/core/validation.ts` ändern. Nach der Funktion `validateEcts` (endet mit der Zeile `}` nach `return null;`) eine neue Funktion einfügen:

    export function validateWorkloadHours(value: number | null): string | null {
      if (value === null || value === undefined || (value as unknown as string) === '') return null;
      const hours = Number(value);
      if (!Number.isInteger(hours)) return 'Lernaufwand muss eine ganze Zahl sein';
      if (hours < 1 || hours > 1000) return 'Lernaufwand muss zwischen 1 und 1000 Stunden liegen';
      return null;
    }

Schritt 13 — `frontend/src/app/core/validation.spec.ts` lesen (Datei existiert bereits und testet u. a. `validateEcts`) und nach demselben Muster Testfälle für `validateWorkloadHours` ergänzen: ein leerer Wert (`null`) ist gültig, `0` und `1001` sind ungültig, `50` ist gültig. Den genauen `describe`/`it`-Block an die bestehende Struktur der Datei anpassen (die Datei vorher lesen, um Import-Zeile und Stil zu treffen).

Schritt 14 — `frontend/src/app/features/goals/goals.ts` ändern. Den Import um `validateWorkloadHours` ergänzen; die bestehende Importzeile lautet:

    import { validateEcts, validateRequiredText, validateTargetDate } from '../../core/validation';

wird zu:

    import { validateEcts, validateRequiredText, validateTargetDate, validateWorkloadHours } from '../../core/validation';

Im Template des Bearbeiten-Formulars steht aktuell der Block für das ECTS-Feld:

    <div class="form-group">
      <label for="edit-ects" title="1 ECTS = ca. 30 Stunden Lernaufwand">ECTS-Punkte des Moduls</label>
      <input id="edit-ects" type="number" [(ngModel)]="editForm.ects" name="edit_ects"
        (ngModelChange)="clearFieldError('ects')"
        [class.input-error]="fieldErrors()['ects']" />
      @if (fieldErrors()['ects']) {
        <p class="field-error">{{ fieldErrors()['ects'] }}</p>
      }
    </div>

Direkt danach (innerhalb desselben `form-row`, als drittes Element, oder als eigener `form-row` direkt nach diesem `form-row` – letzteres ist einfacher und wird hier verwendet) einen neuen Block einfügen. Der bestehende `form-row` für ECTS und Zieldatum endet mit `</div>` gefolgt vom nächsten `form-row` (Status/Priorität/Note). Zwischen diese beiden `form-row`-Blöcke einen neuen `form-row` mit einem einzelnen `form-group` einfügen:

    <div class="form-row">
      <div class="form-group">
        <label for="edit-workload-hours" title="Leer lassen, damit ECTS x 30 Stunden gilt">Lernaufwand in Stunden (optional)</label>
        <input id="edit-workload-hours" type="number" [(ngModel)]="editForm.workload_hours" name="edit_workload_hours"
          (ngModelChange)="clearFieldError('workload_hours')"
          [class.input-error]="fieldErrors()['workload_hours']" placeholder="z.B. 50" />
        @if (fieldErrors()['workload_hours']) {
          <p class="field-error">{{ fieldErrors()['workload_hours'] }}</p>
        }
      </div>
    </div>

Im Template des Neu-Formulars ("Neues Lernziel") gilt dieselbe Regel: nach dem `form-row` mit `goal-ects` und `goal-target-date` (endet vor dem `form-group` für `goal-priority`) einen entsprechenden Block einfügen:

    <div class="form-row form-stacked">
      <div class="form-group">
        <label for="goal-workload-hours" title="Leer lassen, damit ECTS x 30 Stunden gilt">Lernaufwand in Stunden (optional)</label>
        <input id="goal-workload-hours" type="number" [(ngModel)]="form.workload_hours" name="workload_hours"
          (ngModelChange)="clearFieldError('workload_hours')"
          [class.input-error]="fieldErrors()['workload_hours']" placeholder="z.B. 50" />
        @if (fieldErrors()['workload_hours']) {
          <p class="field-error">{{ fieldErrors()['workload_hours'] }}</p>
        }
      </div>
    </div>

Die Zielkarten-Anzeige lautet aktuell:

    <span title="1 ECTS entspricht ca. 30 Stunden Lernaufwand">🎓 {{ goal.ects }} ECTS ({{ goal.ects * 30 }}h)</span>

wird zu:

    <span [title]="goal.workload_hours ? 'Manuell festgelegter Lernaufwand' : '1 ECTS entspricht ca. 30 Stunden Lernaufwand'">🎓 {{ goal.ects }} ECTS ({{ effectiveHours(goal) }}h{{ goal.workload_hours ? ', manuell' : '' }})</span>

Im TypeScript-Teil der Klasse `GoalsComponent`: das Objekt `editForm` lautet aktuell (Auszug):

    editForm = {
      title: '',
      module_name: '',
      ects: 5,
      target_date: '',
      status: 'open' as Goal['status'],
      priority: '' as '' | 'high' | 'medium' | 'low',
      grade: '',
      result_note: '',
    };

wird zu:

    editForm = {
      title: '',
      module_name: '',
      ects: 5,
      workload_hours: null as number | null,
      target_date: '',
      status: 'open' as Goal['status'],
      priority: '' as '' | 'high' | 'medium' | 'low',
      grade: '',
      result_note: '',
    };

Das Objekt `form` lautet aktuell:

    form = {
      title: '',
      module_name: '',
      ects: 5,
      target_date: defaultTargetDate(),
      priority: '' as '' | 'high' | 'medium' | 'low',
    };

wird zu:

    form = {
      title: '',
      module_name: '',
      ects: 5,
      workload_hours: null as number | null,
      target_date: defaultTargetDate(),
      priority: '' as '' | 'high' | 'medium' | 'low',
    };

In `create()` steht aktuell:

    const ectsError = validateEcts(this.form.ects);
    const dateError = validateTargetDate(this.form.target_date);
    if (titleError) errors['title'] = titleError;
    if (moduleError) errors['module_name'] = moduleError;
    if (ectsError) errors['ects'] = ectsError;
    if (dateError) errors['target_date'] = dateError;

wird zu:

    const ectsError = validateEcts(this.form.ects);
    const workloadError = validateWorkloadHours(this.form.workload_hours);
    const dateError = validateTargetDate(this.form.target_date);
    if (titleError) errors['title'] = titleError;
    if (moduleError) errors['module_name'] = moduleError;
    if (ectsError) errors['ects'] = ectsError;
    if (workloadError) errors['workload_hours'] = workloadError;
    if (dateError) errors['target_date'] = dateError;

Weiter unten in `create()` steht nach erfolgreichem Speichern:

    this.form = { title: '', module_name: '', ects: 5, target_date: defaultTargetDate(), priority: '' };

wird zu:

    this.form = {
      title: '',
      module_name: '',
      ects: 5,
      workload_hours: null,
      target_date: defaultTargetDate(),
      priority: '',
    };

In `startEdit(goal: Goal)` steht aktuell:

    this.editForm = {
      title: goal.title,
      module_name: goal.module_name,
      ects: goal.ects,
      target_date: goal.target_date,
      status: goal.status,
      priority: goal.priority ?? '',
      grade: goal.grade ?? '',
      result_note: goal.result_note ?? '',
    };

wird zu:

    this.editForm = {
      title: goal.title,
      module_name: goal.module_name,
      ects: goal.ects,
      workload_hours: goal.workload_hours,
      target_date: goal.target_date,
      status: goal.status,
      priority: goal.priority ?? '',
      grade: goal.grade ?? '',
      result_note: goal.result_note ?? '',
    };

In `saveEdit()` steht aktuell:

    const ectsError = validateEcts(this.editForm.ects);
    const dateError = validateTargetDate(this.editForm.target_date, this.editOriginalDate);
    if (titleError) errors['title'] = titleError;
    if (moduleError) errors['module_name'] = moduleError;
    if (ectsError) errors['ects'] = ectsError;
    if (dateError) errors['target_date'] = dateError;

wird zu:

    const ectsError = validateEcts(this.editForm.ects);
    const workloadError = validateWorkloadHours(this.editForm.workload_hours);
    const dateError = validateTargetDate(this.editForm.target_date, this.editOriginalDate);
    if (titleError) errors['title'] = titleError;
    if (moduleError) errors['module_name'] = moduleError;
    if (ectsError) errors['ects'] = ectsError;
    if (workloadError) errors['workload_hours'] = workloadError;
    if (dateError) errors['target_date'] = dateError;

Weiter unten in `saveEdit()` steht beim Aufruf von `this.goalService.update(...)`:

    const updated = await this.goalService.update(id, {
      title: this.editForm.title,
      module_name: this.editForm.module_name,
      ects: Number(this.editForm.ects),
      target_date: this.editForm.target_date,
      status: this.editForm.status,
      priority: this.editForm.priority || null,
      grade: this.editForm.grade || null,
      result_note: this.editForm.result_note || null,
    });

wird zu:

    const updated = await this.goalService.update(id, {
      title: this.editForm.title,
      module_name: this.editForm.module_name,
      ects: Number(this.editForm.ects),
      workload_hours: this.editForm.workload_hours,
      target_date: this.editForm.target_date,
      status: this.editForm.status,
      priority: this.editForm.priority || null,
      grade: this.editForm.grade || null,
      result_note: this.editForm.result_note || null,
    });

Am Ende der Klasse (nach `priorityLabel`) eine neue Methode ergänzen:

    effectiveHours(goal: Goal): number {
      return goal.workload_hours ?? goal.ects * 30;
    }

Schritt 15 — Frontend-Tests ausführen. Im Verzeichnis `frontend/`:

    npx ng test --watch=false

Erwartet: alle Tests grün, inklusive der neuen Fälle in `validation.spec.ts`. Kein Test darf fehlschlagen.

Schritt 16 — Manuelle Kontrolle im Browser (siehe "Validation and Acceptance" unten für den genauen Ablauf).

## Validation and Acceptance

Automatisiert: `pytest` im Verzeichnis `backend/` liefert ausschließlich bestandene Tests (Exit-Code 0), ebenso `npx ng test --watch=false` im Verzeichnis `frontend/`.

Manuell (Docker-Datenbank muss laufen, siehe `README.md` Abschnitt "Täglicher Entwicklungs-Workflow"; vor dem ersten Start nach dieser Änderung im Verzeichnis `backend/` bei aktivierter venv `flask db upgrade` ausführen, sonst schlägt `/api/goals` mit `column goals.workload_hours does not exist` fehl): Backend mit `flask run --debug`, Frontend mit `ng serve` starten, im Browser auf `http://localhost:4200/goals` einloggen (oder registrieren) und ein neues Lernziel mit 5 ECTS und im neuen Feld "Lernaufwand in Stunden (optional)" dem Wert 50 anlegen. Erwartung: die neue Zielkarte zeigt "🎓 5 ECTS (50h, manuell)" statt "🎓 5 ECTS (150h)". Auf `http://localhost:4200/planning` das Wochenbudget für dieses Ziel ansehen: es muss sich aus 50 Stunden Restaufwand ableiten, nicht aus 150. Anschließend ein zweites Lernziel ohne Angabe im neuen Feld anlegen: die Karte muss weiterhin "🎓 5 ECTS (150h)" ohne den Zusatz ", manuell" zeigen, und dessen Wochenbudget muss sich unverändert aus 150 Stunden ableiten – das belegt, dass das bestehende Verhalten für alle Lernziele ohne Override unangetastet bleibt.

## Idempotence and Recovery

Alle Schritte sind Textänderungen an bestehenden Dateien oder das Anlegen neuer Dateien; sie können gefahrlos wiederholt angewendet werden (ein zweiter Versuch überschreibt denselben Zielzustand). Die Migration ist additiv (`add_column` mit `nullable=True`) und hat eine funktionierende `downgrade()`-Funktion (`drop_column`), falls sie zurückgerollt werden muss: `flask db downgrade` im Verzeichnis `backend/`. Kein Schritt löscht Daten oder bestehende Spalten.

## Artifacts and Notes

Keine über die oben eingebetteten Diffs hinausgehenden Artefakte.

## Interfaces and Dependencies

`backend/app/models/goal.py` definiert nach dieser Änderung `Goal.effective_workload_minutes(self) -> int` als die einzige Stelle, die weiß, ob ein Override gilt. `backend/app/workload.py` definiert `remaining_minutes(workload_minutes: int, actual_minutes: int) -> int` und `weekly_budget_minutes(workload_minutes: int, actual_minutes: int, target: date, today: date, status: str) -> int` – beide erwarten ab jetzt einen fertigen Minutenwert, keinen ECTS-Wert mehr. `frontend/src/app/core/validation.ts` definiert `validateWorkloadHours(value: number | null): string | null` nach demselben Muster wie die bestehenden `validate*`-Funktionen in derselben Datei.

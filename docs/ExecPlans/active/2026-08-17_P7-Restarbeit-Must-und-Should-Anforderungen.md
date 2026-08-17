# P7: Restarbeit — alle offenen Must- und Should-Anforderungen umsetzen

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.
It is maintained in accordance with `docs/PLANS.md` (repository root: this file lives in
`docs/ExecPlans/active/`).

## Purpose / Big Picture

`docs/Anforderungsabgleich_Mockups.md` (Plan P6) hat den Stand der Anwendung gegen die
Gestaltungsentwürfe und die Anforderungsliste `docs/01_Funktionale_Anforderungen.md` abgeglichen.
Ergebnis: Eine Must-Anforderung ist noch offen (FR-2.1, Wochenbudget je Modul), dazu sechs
Should-Punkte (FR-2.2 automatische Aufteilung, FR-3.3 Abweichungsanzeige, FR-4.3 Darstellung der
ungestörten Zeit, FR-6.3 Diagramm über den Zeitverlauf, FR-7.2 Erinnerung vor geplantem Slot,
FR-7.3 Erinnerung bei nahendem Zieltermin ohne Fortschritt). Die Could-Anforderungen (FR-2.3,
FR-4.4, FR-5.3, FR-6.4, FR-7.4) bleiben laut dem Abgleichdokument **bewusst offen** und sind nicht
Teil dieses Plans.

Nach diesem Plan kann eine Nutzerin: auf der Planungsseite je Lernziel ein aus den ECTS-Punkten
abgeleitetes Wochenbudget und eine automatische Monatsaufteilung sehen (FR-2.1, FR-2.2) sowie die
Abweichung zwischen empfohlener und bereits geplanter Zeit im gewählten Monat (FR-3.3); auf dem
Dashboard die Pausenzeit als eigene Kennzahl (FR-4.3), ein Balkendiagramm der Lernzeit der letzten
acht Wochen (FR-6.3), eine Warnung zu Lernzielen mit nahem Zieldatum und wenig Fortschritt
(FR-7.3) und einen Hinweis, wenn heute in der nächsten Stunde ein geplanter Lernzeit-Slot beginnt
(FR-7.2). Es ist **keine Datenbankmigration** nötig — alle Daten liegen bereits in den Tabellen
`plan_slots`, `study_sessions` und `goals`.

## Progress

- [x] (2026-08-17 12:20Z) Plan geschrieben.
- [ ] M1: `backend/app/workload.py` + Wochenbudget im Dashboard + Tests.
- [ ] M2: `GET /api/plans/proposal` (FR-2.2/FR-3.3-Daten) + Tests.
- [ ] M3: Dashboard-Felder `paused_minutes`, `weekly_history`, `deadline_warnings` + Tests.
- [ ] M4: Frontend Planungsseite — Grobplanung/Abweichung.
- [ ] M5: Frontend Dashboard — Kennzahl Pausen, Wochenbudget je Ziel, SVG-Diagramm, Terminwarnungen, Slot-Erinnerung + Vitest-Spec.
- [ ] M6: README und Abgleichdokument aktualisiert, alle Tests und Linter grün, Plan nach completed verschoben.

## Surprises & Discoveries

- Observation: `StudySession.duration_seconds` wird beim Stoppen als Gesamtzeit minus
  `total_paused_seconds` berechnet (`backend/app/routes/sessions.py`, Funktion `stop_session`).
  Die überall angezeigte „gelernte Zeit" ist also bereits die ungestörte Zeit. FR-4.3 verlangt
  darstellungsseitig deshalb nur noch, die Pausenzeit als eigene Kennzahl sichtbar zu machen.
  Evidence: `session.duration_seconds = max(0, total_elapsed - (session.total_paused_seconds or 0))`.

## Decision Log

- Decision: Umfang = FR-2.1 plus alle Should-Punkte aus der Tabelle „Was noch fehlt" des
  Abgleichdokuments; Could bleibt offen.
  Rationale: Das Abgleichdokument erklärt die Could-Punkte ausdrücklich für zurückgestellt; alles
  andere ist die dort beschriebene Restarbeit.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: FR-2.2 wird als **berechneter Vorschlag** umgesetzt (Tabelle „Automatische Aufteilung"
  auf der Planungsseite), nicht als automatisches Anlegen von `plan_slots`.
  Rationale: Die Anforderung verlangt einen „Vorschlag", der „manuell anpassbar" bleibt. Ein
  automatisch angelegter Monats-Slot würde zudem an der Dauer-Obergrenze von 480 Minuten je Slot
  scheitern (ein Monatsbudget von z. B. 25 Stunden passt in keinen einzelnen Slot). Die Nutzerin
  sieht den Vorschlag und plant die Slots wie bisher selbst — das ist die manuelle Anpassbarkeit.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: FR-7.2 (Erinnerung vor bevorstehendem Slot) wird **im Frontend** berechnet, nicht im
  Backend.
  Rationale: `plan_slots.planned_time` ist eine Ortszeit-Angabe der Nutzerin („HH:MM"), Sessions
  und Serverzeit laufen in UTC. Der Server (Railway) steht in einer anderen Zeitzone als die
  Nutzerin; nur der Browser kennt die lokale Uhrzeit, gegen die „X Minuten vorher" verglichen
  werden muss. Die Logik liegt als reine Funktion in `frontend/src/app/core/upcoming-slot.ts` und
  ist per Vitest getestet.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: Das Diagramm für FR-6.3 wird als eigenes SVG in der Angular-Komponente gerendert,
  ohne Diagrammbibliothek.
  Rationale: Simplicity First (`docs/golden-principles.md`): acht Balken mit Beschriftung brauchen
  keine Abhängigkeit; eine Bibliothek wäre ein neuer Baustein in CI, Bundle und Lizenzprüfung.
  Das Abgleichdokument hatte eine Bibliothek nur vermutet, nicht gefordert.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: Wochenbudget je Ziel = verbleibender Workload geteilt durch verbleibende Wochen bis
  zum Zieldatum (verbleibend = `ects * 30 h` minus bereits ungestört gelernte Zeit; mindestens
  eine Woche; erreichte Ziele und Ziele ohne Restaufwand haben Budget 0).
  Rationale: FR-2.1 bindet das Budget an den ECTS-Workload (Kickoff-Beschluss). Bereits gelernte
  Zeit abzuziehen macht das Budget zu einer handlungsleitenden Zahl („so viel pro Woche musst du
  noch") statt einer statischen; genau so nutzt es FR-3.3 als Sollwert.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: Schwellen für FR-7.3: Zieldatum in höchstens 14 Tagen, Status nicht `achieved`,
  Fortschritt unter 50 % des ECTS-Workloads. Für FR-7.2: Hinweis ab 60 Minuten vor Slot-Beginn
  bis zum Beginn selbst.
  Rationale: Beide Anforderungen nennen bewusst keine Zahlen („z. B. X Minuten vorher"). 14 Tage
  und 50 % markieren die Lage „Klausur steht an, Hälfte fehlt"; 60 Minuten ist der übliche
  Vorlauf einer Kalendererinnerung. Konstanten liegen benannt im Code und sind leicht änderbar.
  Date/Author: 2026-08-17 / Claude (P7).
- Decision: Kein neuer Branch, kein Worktree; gearbeitet wird auf dem ausgecheckten Branch
  `docs/p6-abgleich-entwuerfe-anforderungen`.
  Rationale: Ausdrückliche Regel in `docs/PLANS.md`.
  Date/Author: 2026-08-17 / Claude (P7).

## Outcomes & Retrospective

Noch offen — wird beim Abschluss des Plans ausgefüllt.

## Context and Orientation

Die Anwendung ist ein Monorepo: `backend/` ist eine Flask-REST-API (Python 3.12, SQLAlchemy,
JWT-Auth über `flask-jwt-extended`), `frontend/` eine Angular-SPA (Standalone-Komponenten,
Signals, Templates inline in den `.ts`-Dateien). Tests: `pytest` in `backend/`, Vitest über
`ng test` in `frontend/`. Linting: `ruff check .` bzw. `ng lint`.

Relevante Dateien:

- `backend/app/routes/dashboard.py` — `GET /api/dashboard`. Liefert heute: Plan-/Ist-Minuten des
  laufenden Monats (`current_month`), je Lernziel `total_actual_minutes` und
  `planned_ects_minutes` (= `ects * MINUTES_PER_ECTS`, mit `MINUTES_PER_ECTS = 30 * 60`),
  Zwischenziel-Zähler, die FR-7.1-Erinnerung (`reminder_text`, `inactivity_warning`) und die
  aktive Session. Zeitstempel in der DB sind naive UTC-`datetime`s.
- `backend/app/routes/plans.py` — CRUD für `plan_slots` (Jahr, Monat, optional Tag, optionale
  Uhrzeit „HH:MM", Dauer 5–480 Minuten). Validierungshelfer in `backend/app/validation.py`
  werfen bei Verstößen eine Ausnahme, die als HTTP 400 mit `{"error": "..."}` endet.
- `backend/app/models/goal.py` — Lernziel mit `ects`, `target_date` (Date), `status`
  (`open`/`in_progress`/`achieved`).
- `backend/app/routes/sessions.py` — Timer. Beim Stoppen gilt
  `duration_seconds = Gesamtzeit - total_paused_seconds`: die gezählte Lernzeit ist also bereits
  die ungestörte Zeit.
- `backend/tests/` — pytest; `conftest.py` stellt `client`, `auth_header` (registriert einen
  frischen Benutzer je Test) und `goal_id` bereit. Tests, die Vergangenheits-Zeitpunkte brauchen,
  schreiben direkt in die DB (Muster: `backend/tests/test_reminders.py`).
- `frontend/src/app/features/dashboard/dashboard.ts` — Dashboard-Komponente (Kennzahlkacheln,
  Fortschrittsbalken, Erinnerung).
- `frontend/src/app/features/planning/planning.ts` — Planungsseite (Filter, Slot-Formular,
  Slot-Liste, Zwischenziele).
- `frontend/src/app/core/models/index.ts` — TypeScript-Interfaces der API-Antworten.
- `frontend/src/app/core/services/` — dünne HTTP-Services (`firstValueFrom` über `HttpClient`).

Begriffe: „Workload" = Lernaufwand eines Moduls in Minuten, hier `ects * 30 * 60` (Teamentscheidung
2026-08-17: 30 Stunden je ECTS). „Grobplanung" = Budget je Woche/Monat über den 6-Monats-Horizont;
„Detailplanung" = konkrete Slots im Monat. Beide teilen sich die Seite `/planning`.

## Plan of Work

**Milestone 1 — Workload-Helfer und Wochenbudget (FR-2.1, Backend).** Neue Datei
`backend/app/workload.py` mit der Konstante `MINUTES_PER_ECTS = 30 * 60` (zieht von
`dashboard.py` hierher um; `dashboard.py` importiert sie fortan) und drei reinen Funktionen:

    def remaining_minutes(ects: int, actual_minutes: int) -> int
        # max(0, ects * MINUTES_PER_ECTS - actual_minutes)

    def weeks_until(target: date, today: date) -> int
        # Anzahl angebrochener Wochen bis zum Zieldatum, mindestens 1:
        # max(1, ceil(max(0, (target - today).days) / 7))

    def weekly_budget_minutes(ects: int, actual_minutes: int, target: date,
                              today: date, status: str) -> int
        # 0 fuer status == "achieved" oder Restaufwand 0,
        # sonst round(remaining / weeks_until(...))

In `dashboard.py` bekommt jedes Element von `goals_data` zusätzlich das Feld
`"weekly_budget_minutes"`. Tests in neuer Datei `backend/tests/test_workload.py` (reine
Funktionen: Restaufwand, Mindestwoche, erreichtes Ziel → 0, überschrittenes Zieldatum → ganze
Rest-Minuten in 1 Woche) und eine Erweiterung in `backend/tests/test_plans.py` oder neuer
API-Test, der prüft, dass `/api/dashboard` das Feld liefert (Ziel mit 5 ECTS, keinem Ist:
`weekly_budget_minutes > 0`).

**Milestone 2 — Vorschlags-Endpunkt (FR-2.2, FR-3.3, Backend).** In `backend/app/routes/plans.py`
neuer Endpunkt `GET /api/plans/proposal` mit optionalen Abfrageparametern `year` (2020–2100) und
`month` (1–12; beide zusammen oder beide weglassen, sonst HTTP 400 „Jahr und Monat gehören
zusammen"); ohne Parameter gilt der laufende Monat (Serverdatum). Antwort HTTP 200:

    {
      "year": 2026, "month": 8,
      "goals": [
        {
          "goal_id": 1, "title": "...", "module_name": "...",
          "weekly_budget_minutes": 450,
          "suggested_month_minutes": 1800,
          "planned_minutes": 600,
          "deviation_minutes": -1200
        }
      ]
    }

Aufgenommen werden alle Ziele der Nutzerin, die nicht `achieved` sind und deren `target_date`
am oder nach dem Monatsersten des angefragten Monats liegt. `suggested_month_minutes` =
Restaufwand geteilt durch die Zahl der Kalendermonate vom angefragten Monat bis zum Monat des
Zieldatums (einschließlich, mindestens 1), gerundet. `planned_minutes` = Summe der
`duration_minutes` aller Slots des Ziels in dem Monat. `deviation_minutes` = `planned_minutes -
suggested_month_minutes` (negativ = zu wenig geplant). Die Monatslogik kommt als vierte Funktion
`months_until(target: date, year: int, month: int) -> int` nach `backend/app/workload.py`.
Tests in neuer Datei `backend/tests/test_plan_proposal.py`: leere Zielliste; Ziel mit Slots →
korrekte Summen und Abweichung; erreichtes Ziel fehlt; abgelaufenes Ziel fehlt; ungültiger
Monat → 400; nur `year` ohne `month` → 400; Endpunkt ohne Token → 401.

**Milestone 3 — Dashboard-Felder (FR-4.3, FR-6.3, FR-7.3, Backend).** In
`backend/app/routes/dashboard.py`:

1. `current_month` erhält `"paused_minutes"`: Summe `total_paused_seconds` der im Monat
   gestarteten abgeschlossenen Sessions, ganzzahlig durch 60.
2. Neues Top-Level-Feld `"weekly_history"`: Liste von acht Einträgen, älteste zuerst, je
   `{"week_start": "YYYY-MM-DD", "minutes": <int>}`. `week_start` ist der Montag der Woche in
   UTC; die aktuelle Woche ist der letzte Eintrag. Berechnung: alle abgeschlossenen Sessions mit
   `started_at >=` Montag vor sieben Wochen laden und in Python nach Wochenmontag gruppieren
   (die Datenmenge ist klein; kein SQL-Gruppierungsdialekt nötig, der Test läuft auf SQLite).
3. Neues Top-Level-Feld `"deadline_warnings"`: Liste über Ziele mit Status ungleich `achieved`,
   `0 <= (target_date - today).days <= 14` und Fortschritt `total_actual_minutes /
   planned_ects_minutes < 0.5`; je Eintrag `{"goal_id", "title", "target_date" (ISO),
   "days_left", "progress_pct"}` (Prozent gerundet). Konstanten `DEADLINE_WARNING_DAYS = 14`
   und `DEADLINE_WARNING_PROGRESS = 0.5` mit Kommentar oben im Modul neben `INACTIVITY_DAYS`.

Tests: `backend/tests/test_dashboard_fields.py` (neu) — Pausenminuten erscheinen; Session vor
zwei Wochen landet im richtigen `weekly_history`-Eintrag und die Liste hat genau acht Einträge;
Ziel mit Zieldatum in 5 Tagen ohne Fortschritt erzeugt eine Warnung, dasselbe Ziel mit
ausreichend Ist-Zeit (direkt in die DB geschriebene Session) nicht, ein erreichtes Ziel nie.

**Milestone 4 — Planungsseite (FR-2.1, FR-2.2, FR-3.3, Frontend).** In
`frontend/src/app/core/models/index.ts` neue Interfaces `PlanProposalGoal` und `PlanProposal`
passend zur M2-Antwort. In `frontend/src/app/core/services/plan.service.ts` Methode
`proposal(year?, month?)`. In `frontend/src/app/features/planning/planning.ts` eine neue Karte
„Grobplanung: Budget & Vorschlag" oberhalb der Slot-Liste: eine Tabelle mit einer Zeile je Ziel
und den Spalten Modul/Ziel, „Budget/Woche", „Vorschlag {{Monat}}", „Geplant {{Monat}}",
„Abweichung" (negativ rot mit „fehlen", ausgeglichen/positiv grün). Die Karte lädt bei
`ngOnInit` und bei jedem Monatswechsel des Filters (`loadSlots`) den Vorschlag für den aktiven
Monat (Filter „Alle Monate" → Monat des Anlegeformulars, wie bei den Zwischenzielen). Leerer
Zustand: „Kein aktives Lernziel mit Zieldatum in diesem Monat oder später."

**Milestone 5 — Dashboard-Seite (FR-4.3, FR-6.3, FR-7.2, FR-7.3, Frontend).** In
`frontend/src/app/core/models/index.ts`: `CurrentMonth` um `paused_minutes`, `GoalStats` um
`weekly_budget_minutes`, `DashboardData` um `weekly_history: WeekPoint[]` und
`deadline_warnings: DeadlineWarning[]` erweitern (neue Interfaces `WeekPoint`,
`DeadlineWarning`). In `frontend/src/app/features/dashboard/dashboard.ts`:

1. Kachel „Gelernt {{Monat}}" umbenennen in „Ungestört gelernt {{Monat}}" (Wert unverändert —
   die API zählt Pausen nie mit) und neue Kachel „Pausen {{Monat}}" mit
   `formatMinutes(paused_minutes)`.
2. Je Lernziel-Karte hinter dem Fortschritt eine Zeile „Budget: X/Woche"
   (`formatMinutes(weekly_budget_minutes)`), nur wenn > 0.
3. Neue Karte „Lernzeit der letzten 8 Wochen": Balkendiagramm als Inline-SVG aus
   `weekly_history` (vor dem Schreiben des Diagramm-Codes die dataviz-Skill laden). Leerer
   Zustand, wenn alle Werte 0 sind.
4. Über den Kacheln je `deadline_warnings`-Eintrag ein `alert alert-warning`:
   „⏰ ‚{{title}}' hat Zieldatum in {{days_left}} Tagen, Fortschritt erst {{progress_pct}} %."
5. FR-7.2: neue Datei `frontend/src/app/core/upcoming-slot.ts` mit reiner Funktion
   `upcomingSlotReminder(slots: PlanSlot[], goals: {id,title}[] | Map, now: Date): string | null`
   — findet den nächsten Slot von heute (`slot.day === now.getDate()` im aktuellen
   Jahr/Monat) mit `planned_time`, dessen Beginn zwischen jetzt und jetzt+60 Minuten liegt, und
   liefert z. B. „Um 14:00 ist Lernzeit geplant (Mathe II, 90 min)." Die Dashboard-Komponente
   lädt dazu zusätzlich die Slots des laufenden Monats über den bestehenden `PlanService` und
   zeigt das Ergebnis als `alert alert-info`. Vitest-Spec
   `frontend/src/app/core/upcoming-slot.spec.ts`: Slot in 30 min → Text; Slot in 2 h → null;
   Slot vergangen → null; Slot ohne Uhrzeit → null; anderer Tag → null.

**Milestone 6 — Dokumentation und Abschluss.** `README.md`: Statusabsatz und
API-Wertebereichs-Abschnitt um den neuen Endpunkt und die neuen Felder ergänzen.
`docs/Anforderungsabgleich_Mockups.md`: die jetzt umgesetzten Zeilen auf „Ja" drehen
(mit „Seit Plan P7"), die Tabelle „Was noch fehlt" auf die Could-Punkte reduzieren, die
„Empfehlung für die Restarbeit" als erledigt umformulieren. Alle Tests und Linter laufen lassen,
committen, diesen Plan mit ausgefülltem `Outcomes & Retrospective` nach
`docs/ExecPlans/completed/` verschieben.

## Concrete Steps

Backend (Arbeitsverzeichnis `backend/`, venv aktiv, Docker-DB wird für Tests nicht gebraucht —
die Tests laufen auf SQLite über `create_app("testing")`):

    pytest            # erwartet: alle Tests bestanden, 0 failed
    ruff check .      # erwartet: "All checks passed!"

Frontend (Arbeitsverzeichnis `frontend/`):

    npx ng test --watch=false   # erwartet: alle Specs bestanden
    npx ng lint                 # erwartet: "All files pass linting."

Commits nach jedem Milestone auf dem aktuellen Branch, Nachricht im Imperativ mit FR-Bezug,
z. B. „Wochenbudget je Modul aus ECTS-Workload (P7 M1, FR-2.1)".

## Validation and Acceptance

Beobachtbares Verhalten nach Abschluss (lokal: DB per `docker compose up -d`, Backend
`flask run --debug` in `backend/`, Frontend `ng serve` in `frontend/`, Anmeldung im Browser
unter `http://localhost:4200`):

- `GET /api/dashboard` (mit Token) enthält `current_month.paused_minutes`, je Ziel
  `weekly_budget_minutes`, genau acht `weekly_history`-Einträge und (bei passender Datenlage)
  `deadline_warnings`.
- `GET /api/plans/proposal` (mit Token, ohne Parameter) liefert HTTP 200 mit dem laufenden
  Monat; `?year=2026` allein liefert HTTP 400.
- Auf `/planning` erscheint die Karte „Grobplanung: Budget & Vorschlag" mit Budget/Woche,
  Monatsvorschlag, geplanter Zeit und Abweichung je Ziel; Monatswechsel im Filter ändert die
  Zahlen.
- Auf dem Dashboard: Kachel „Pausen …", Diagrammkarte mit acht Balken, bei einem Ziel mit
  Zieldatum in ≤ 14 Tagen und < 50 % Fortschritt eine Warnung, und bei einem heute in der
  nächsten Stunde beginnenden Slot ein Hinweis mit Uhrzeit.
- `pytest` in `backend/` grün (die neuen Testdateien `test_workload.py`,
  `test_plan_proposal.py`, `test_dashboard_fields.py` schlagen vor der Implementierung fehl und
  bestehen danach); `ruff check .` sauber; `npx ng test --watch=false` und `npx ng lint` in
  `frontend/` sauber.

## Idempotence and Recovery

Alle Schritte sind additiv (neue Dateien, neue Felder in JSON-Antworten, neue UI-Karten); kein
Schritt löscht Daten, es gibt keine Migration. Jeder Milestone ist einzeln committbar; bei einem
Fehlschlag genügt `git checkout -- <datei>` für die betroffene Datei. Die Umbenennung der
Konstante `MINUTES_PER_ECTS` ist ein Umzug nach `backend/app/workload.py`; `dashboard.py` und
die Frontend-Konstante in `frontend/src/app/features/goals/goals.ts` (dort nur als Zahl 30)
bleiben inhaltlich unverändert bei 30 Stunden je ECTS.

## Artifacts and Notes

Erwartete Antwortform von `GET /api/plans/proposal` siehe Milestone 2. Wichtigster Nachweis am
Ende: pytest- und Vitest-Läufe mit 0 Fehlern sowie die im Abschnitt Validation beschriebenen
Screens im Browser. Die tatsächlichen Testzahlen werden hier nach jedem Milestone eingetragen.

## Interfaces and Dependencies

Keine neuen Abhängigkeiten. Neu entstehende öffentliche Schnittstellen:

In `backend/app/workload.py`:

    MINUTES_PER_ECTS: int = 1800
    def remaining_minutes(ects: int, actual_minutes: int) -> int
    def weeks_until(target: date, today: date) -> int
    def months_until(target: date, year: int, month: int) -> int
    def weekly_budget_minutes(ects: int, actual_minutes: int, target: date, today: date, status: str) -> int

In `backend/app/routes/plans.py`: `GET /api/plans/proposal` (JWT-geschützt, Antwort siehe M2).

In `frontend/src/app/core/upcoming-slot.ts`:

    export function upcomingSlotReminder(slots: PlanSlot[], goalTitles: ReadonlyMap<number, string>, now: Date): string | null


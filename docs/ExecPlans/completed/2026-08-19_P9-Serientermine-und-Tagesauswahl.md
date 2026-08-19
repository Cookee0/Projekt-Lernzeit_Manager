# P9: Serientermine, Mehrfach-Tagesauswahl und Ziel-Gruppierung in der Planung

Dieses ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` müssen während der Arbeit laufend gepflegt werden.
Dieses Dokument folgt der Spezifikation in `docs/PLANS.md` (vom Repository-Root aus) und muss in
Übereinstimmung mit ihr geführt werden.

Herkunft: Nutzer-Testdurchlauf vom 2026-08-19. Kritikpunkte: Lernzeiten lassen sich nur für
einen einzelnen Tag anlegen; gewünscht sind Serientermine („an jedem Werktag …", „jeden
Mittwoch …") und eine Mehrfachauswahl von Tagen über eine DatePicker-artige Oberfläche.
Außerdem wirken die geplanten Lernzeiten auf der Planungsseite visuell losgelöst von ihren
Lernzielen; sie sollen unter ihren Lernzielen gruppiert erscheinen.


## Purpose / Big Picture

Wer heute „jeden Mittwoch im September 90 Minuten Mathe" plant, muss fünf Mal dasselbe Formular
ausfüllen. Nach diesem Plan wählt man im Formular „Lernzeit einplanen" die Tage des Monats in
einem kleinen Monatsraster per Klick aus — einen, mehrere oder per Schnellwahl „Werktage" bzw.
einen Wochentag („Mo" bis „So") — und speichert alles mit einem Klick als mehrere Slots.
Zusätzlich zeigt die Liste „Geplante Lernzeiten" die Slots nicht mehr als flache Liste, sondern
gruppiert unter einer Überschrift je Lernziel mit Minutensumme, sodass sichtbar ist, welche
Lernzeit zu welchem Ziel gehört. Sichtbar wird das so: Auf http://localhost:4200/planning wählt
man im Raster drei Tage an, speichert, und die Liste zeigt drei neue Slots unter der
Überschrift des gewählten Ziels.


## Progress

- [x] Milestone 1: Backend-Endpunkt `POST /api/plans/series` legt mehrere Slots in einer
      Transaktion an; Tests in `backend/tests/test_plans.py` grün. (done 2026-08-19)
- [x] Milestone 2: Tages-Raster (`DayPickerComponent`) mit Mehrfachauswahl und Schnellwahl
      ersetzt das Zahlenfeld „Tag des Monats"; Anlegen einzeln und als Serie funktioniert.
      (done 2026-08-19)
- [x] Milestone 3: Liste „Geplante Lernzeiten" nach Lernziel gruppiert mit Minutensumme.
      (done 2026-08-19)
- [x] README im selben Zug aktualisiert (Serientermine, Wertebereiche, Gruppierung).
      (done 2026-08-19)


## Surprises & Discoveries

Beim Umsetzen von Milestone 1 (Schritt 2) zeigte sich, dass `require_day_of_month`s
„fehlender Wert"-Semantik (`None` wird wie beim einzelnen Slot durchgelassen, weil Tag dort
optional ist) im neuen Serien-Endpunkt nicht ausreicht: Ein `None`- oder leerer-String-Eintrag
in `days` lief unbehandelt durch und führte zu einem 500er statt einer 400er-Fehlermeldung,
weil `require_day_of_month` einen fehlenden Tag als „kein Tag angegeben" statt als
Validierungsfehler behandelt. Das fiel erst bei der Testdurchsicht der Task auf, nicht schon
bei der ersten Implementierung — Commit 610b6d5 ergänzt eine explizite Vorab-Prüfung
(„jeder Eintrag in `days` darf nicht `None`/leer sein, sonst 400"), bevor die Einträge an
`require_day_of_month` gehen.

Im abschließenden Review des gesamten Branches (dieser Fix-Durchlauf) kam außerdem eine
FR-Tag-Kollision ans Licht: Die vier neuen Code-Stellen für Serientermine/Tages-Raster
(Backend-Endpunkt, `PlanService.createSeries`, `DayPickerComponent`, die zugehörigen Styles)
waren mit „(FR-3.3)" beschriftet — das ist aber die bereits vergebene Anforderungsnummer für
die Grobplanungs-Abweichungsanzeige (Plan P7, `plans.py:50` und `planning.ts:470`), nicht für
die Serienplanung. Die vier Stellen (plus ein Testkommentar in `test_plans.py`) wurden auf
FR-3.1 („konkrete Lernzeit-Slots planen") korrigiert; die echten FR-3.3-Stellen blieben
unangetastet.


## Decision Log

- Decision: Serientermine werden beim Speichern in einzelne `plan_slots`-Zeilen ausmultipliziert;
  es gibt keine Wiederholungsregel in der Datenbank und keine neue Tabelle oder Migration.
  Rationale: Alle bestehenden Auswertungen (Dashboard-Summen, Grobplanungs-Abweichung, FR-7.2)
  rechnen über einzelne Slots. Eine gespeicherte Regel („jeden Mittwoch") müsste überall
  expandiert werden und wirft Folgefragen auf (Serie ändern/löschen). Einzelne Slots bleiben
  einzeln löschbar — genau das erwartet der Tester („mehrere Daten auswählbar").
  Date/Author: 2026-08-19 / Claude.
- Decision: Neuer Endpunkt `POST /api/plans/series` statt einer Erweiterung von
  `POST /api/plans` um ein `days`-Array.
  Rationale: `POST /api/plans` antwortet mit einem einzelnen Slot-Objekt; je nach Eingabe mal
  ein Objekt, mal eine Liste zurückzugeben wäre eine Falle für jeden Client. Ein eigener
  Endpunkt mit Listenantwort ist eindeutig.
  Date/Author: 2026-08-19 / Claude.
- Decision: Der DayPicker ist ein selbstgebautes Monatsraster (eigene Angular-Komponente),
  keine Bibliothek.
  Rationale: Native `input type="date"` kann keine Mehrfachauswahl; eine Datepicker-Bibliothek
  (z. B. Angular Material) brächte ein ganzes Design-System mit — das Projekt hat bewusst keine
  UI-Bibliothek. Das Raster ist überschaubar (sieben Spalten, max. sechs Zeilen) und wird vom
  Kalender-Tab (Plan P10) als Vorbild wiederverwendet.
  Date/Author: 2026-08-19 / Claude.
- Decision: Keine Auswahl (null Tage) bleibt erlaubt und bedeutet wie bisher einen
  Monats-Slot ohne festen Tag (Grobplanung, `day = NULL`).
  Rationale: Bestehendes, dokumentiertes Verhalten (FR-2.1) darf nicht verschwinden.
  Date/Author: 2026-08-19 / Claude.


## Outcomes & Retrospective

Umgesetzt wie geplant: Der Endpunkt `POST /api/plans/series` legt mehrere `plan_slots`-Zeilen
in einer Transaktion an (kein neues Datenbankschema, keine Migration), mit Tests für den
Erfolgsfall sowie leere Liste, doppelte Tage, ungültigen Tag und fremdes Ziel. Auf der
Planungsseite ersetzt die neue `DayPickerComponent` (`frontend/src/app/features/planning/day-picker.ts`)
das bisherige Zahlenfeld „Tag des Monats" durch ein anklickbares Monatsraster mit
Wochentags-Schnellwahl und „Werktage"/„Auswahl leeren"; `planning.ts` unterscheidet beim
Speichern zwischen keinem, einem und mehreren gewählten Tagen und ruft je nachdem
`PlanService.create` oder die neue `PlanService.createSeries` auf. Die Liste „Geplante
Lernzeiten" ist nun über `groupedSlots()` nach Lernziel gruppiert, mit Titel, Modul und
Zeitsumme je Gruppe. Im abschließenden Review dieses Branches wurden zwei Nacharbeiten
gemacht: die FR-Tag-Kollision mit FR-3.3 wurde auf FR-3.1 korrigiert (siehe Surprises), und
die zu `formatMinutes()` redundante `formatTotalMinutes()`-Methode wurde entfernt zugunsten
der bestehenden Funktion, damit Zeitangaben auf der Planungsseite überall gleich formatiert
sind. Endzustand, verifiziert in diesem Fix-Durchlauf: `pytest` (129 Tests) und
`ruff check .` grün im Backend; `ng lint` und `ng test` (6 Dateien, 25 Tests) grün im
Frontend. Ein manueller Durchlauf im laufenden System (Schritt 7) war in dieser Umgebung
nicht möglich, siehe „Artifacts and Notes".


## Context and Orientation

Monorepo: `backend/` Flask-API (Python 3.12), `frontend/` Angular (Standalone-Komponenten,
Signals, Inline-Templates). Start: `docker compose up -d` (Repo-Root), `flask run --debug` in
`backend/` (venv aktiv), `ng serve` in `frontend/`. Tests/Lint: `pytest` und `ruff check .` in
`backend/`, `ng test` und `ng lint` in `frontend/`.

Ein „Slot" ist eine Zeile der Tabelle `plan_slots`: `user_id`, `goal_id`, `year`, `month`,
`day` (nullable), `planned_time` (nullable, „HH:MM"), `duration_minutes` (5–480), `note`
(nullable). Modell: `backend/app/models/plan_slot.py`. Endpunkte in
`backend/app/routes/plans.py`: `GET /api/plans` (Filter `goal_id`, `year`, `month`),
`POST /api/plans` (ein Slot), `PUT/DELETE /api/plans/<id>`, außerdem `GET /api/plans/proposal`
(Grobplanungs-Vorschlag). Validierungshelfer in `backend/app/validation.py`
(`require_int_in_range`, `require_day_of_month`, `optional_clock_time`, `optional_text`);
`require_day_of_month(day, year, month)` akzeptiert `None` und prüft sonst gegen die
Monatslänge.

Frontend: `frontend/src/app/features/planning/planning.ts` enthält das Formular „Lernzeit
einplanen" (`newSlot` mit `goal_id`, `day`, `planned_time`, `duration_minutes`, `note`;
`newSlotMonth` als „YYYY-MM"-Text) und die Liste „Geplante Lernzeiten" (flache Schleife über
`slots()`, je Slot eine `slot-card` mit `goalName(slot.goal_id)`).
`frontend/src/app/core/services/plan.service.ts` kapselt die HTTP-Aufrufe;
`frontend/src/app/core/validation.ts` enthält `validateDayOfMonth(value, year, month)`.
Globale Styles liegen in `frontend/src/styles.css`.


## Plan of Work

Milestone 1 (Backend): In `backend/app/routes/plans.py` einen Endpunkt `POST /api/plans/series`
ergänzen. Erwarteter Body: `goal_id`, `year`, `month`, `days` (nicht-leere Liste ganzer Zahlen),
optional `planned_time`, `duration_minutes` (Default 60), `note` — Uhrzeit, Dauer und Notiz
gelten für alle Tage der Serie gleich. Prüfregeln: `days` muss eine Liste mit 1 bis 31
Einträgen sein, sonst HTTP 400 mit `{"error": "…"}` im Stil der übrigen Meldungen („Tage
müssen eine Liste mit 1 bis 31 Einträgen sein"); jeder Eintrag läuft durch
`require_day_of_month`; doppelte Tage werden mit 400 abgelehnt („Tage dürfen sich nicht
wiederholen"). Das Ziel wird wie in `create_plan` mit
`Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()` geprüft. Alle Slots entstehen in
einer Transaktion (erst alle `db.session.add`, dann ein `db.session.commit`); Antwort ist
HTTP 201 mit der JSON-Liste der angelegten Slots (aufsteigend nach Tag sortiert).

Milestone 2 (DayPicker): Neue Komponente
`frontend/src/app/features/planning/day-picker.ts` (`DayPickerComponent`,
Selector `app-day-picker`) mit Inputs `year: number`, `month: number` (1–12),
`selected: number[]` und Output `selectedChange: EventEmitter<number[]>` — nutzbar mit
Banana-in-a-Box (`[(selected)]`). Darstellung: Kopfzeile „Mo Di Mi Do Fr Sa So" als
klickbare Wochentagsknöpfe (Klick wählt alle entsprechenden Tage des Monats an bzw. wieder ab),
darunter das Monatsraster (erste Zelle unter dem Wochentag des Monatsersten; Montag ist die
erste Spalte, Berechnung `(new Date(year, month - 1, 1).getDay() + 6) % 7`), jede Tageszelle
ein Button, der den Tag an-/abwählt (`aria-pressed` entsprechend). Darüber zwei
Schnellwahl-Knöpfe „Werktage" (alle Mo–Fr des Monats an-/abwählen) und „Auswahl leeren".
Wechselt der Monat im Formular, wird die Auswahl geleert (im `planning.ts` beim
`(ngModelChange)` von `newSlotMonth`). In `planning.ts` ersetzt der DayPicker das Zahlenfeld
„Tag des Monats"; `newSlot.day` entfällt zugunsten `newSlotDays: number[]`. `createSlot()`
unterscheidet: null Tage → wie bisher `planService.create` ohne `day`; ein Tag →
`planService.create` mit `day`; mehrere Tage → neue Methode `planService.createSeries(...)`.
Für den Dienst: in `plan.service.ts` Methode `createSeries(data: {goal_id, year, month,
days: number[], planned_time?, duration_minutes, note?}): Promise<PlanSlot[]>` gegen
`POST /api/plans/series`. Ein Hinweistext unter dem Raster nennt die Anzahl („3 Tage
ausgewählt — es werden 3 Einträge angelegt"). Styles für das Raster in
`frontend/src/styles.css` (Klassen `day-picker`, `day-picker-grid`, `day-cell`,
`day-cell-selected`), sieben Spalten per CSS-Grid.

Milestone 3 (Gruppierung): Die Liste „Geplante Lernzeiten" in `planning.ts` wird zu einer
äußeren Schleife über die Ziele, die Slots besitzen (Hilfsmethode `groupedSlots(): {goal_id:
number; title: string; totalMinutes: number; slots: PlanSlot[]}[]`, aus `slots()` und `goals()`
berechnet, Reihenfolge nach Zieltitel; Slots innerhalb der Gruppe wie bisher nach Datum). Jede
Gruppe bekommt eine Kopfzeile mit Zieltitel, Modul-Tag und Summe („insgesamt 4h 30min
geplant"); darunter die bekannten `slot-card`-Einträge ohne die bisherige Ziel-Nennung je Karte.


## Concrete Steps

Backend-Schritte in `backend/` (venv aktiv, Docker läuft), Frontend-Schritte in `frontend/`.

1. Test zuerst: In `backend/tests/test_plans.py` Tests für die Serie ergänzen — (a) gültige
   Serie: `POST /api/plans/series` mit `days=[3, 10, 17]` liefert 201 und drei Slots mit
   gleichem `goal_id`/`planned_time`/`duration_minutes` und den Tagen 3, 10, 17; anschließendes
   `GET /api/plans?year=…&month=…` enthält alle drei; (b) leere Liste → 400; (c) doppelter Tag
   `[5, 5]` → 400; (d) Tag 31 im April → 400 (Meldung aus `require_day_of_month`); (e) fremdes
   `goal_id` → 404; kein Slot entsteht. `pytest tests/test_plans.py` schlägt zunächst mit 404
   auf den neuen Pfad fehl.
2. Endpunkt implementieren wie im Plan of Work; Kern:

       @plans_bp.post("/api/plans/series")
       @jwt_required()
       def create_plan_series():
           uid = _current_user_id()
           data = request.get_json(silent=True) or {}
           goal_id = require_int_in_range(data.get("goal_id"), "Lernziel", 1, 2_147_483_647)
           year = require_int_in_range(data.get("year"), "Jahr", 2020, 2100)
           month = require_int_in_range(data.get("month"), "Monat", 1, 12)
           days = data.get("days")
           if not isinstance(days, list) or not 1 <= len(days) <= 31:
               raise ValidationError("Tage müssen eine Liste mit 1 bis 31 Einträgen sein")
           checked = [require_day_of_month(d, year, month) for d in days]
           if len(set(checked)) != len(checked):
               raise ValidationError("Tage dürfen sich nicht wiederholen")
           ...

   danach Dauer/Uhrzeit/Notiz wie in `create_plan` prüfen, Ziel laden, Slots anlegen,
   `db.session.commit()`, `jsonify([s.to_dict() for s in slots]), 201`. Achtung:
   `require_day_of_month` lässt `None` durch — deshalb vor dem Aufruf sicherstellen, dass kein
   Eintrag `None` ist (sonst entstünde ein Slot ohne Tag in der Serie): `if d is None` → 400.
   `pytest` und `ruff check .` grün. Commit.
3. `plan.service.ts`: `createSeries` ergänzen (gleiches Muster wie `create`, Rückgabetyp
   `Promise<PlanSlot[]>`).
4. `day-picker.ts` anlegen (Komponente wie im Plan of Work; reine Präsentationslogik, keine
   HTTP-Aufrufe). Dazu Vitest-Spec `day-picker.spec.ts` mit mindestens: „Werktage wählt alle
   Mo–Fr des Monats", „Klick auf gewählten Tag wählt ab", „Wochentagsknopf Mi wählt alle
   Mittwoche". `ng test` zunächst rot, nach Implementierung grün.
5. `planning.ts` umbauen: DayPicker einbinden, `newSlotDays`, Fallunterscheidung in
   `createSlot()` (Validierung: jeder gewählte Tag durch `validateDayOfMonth`; Fehlermeldung am
   Raster anzeigen), nach Erfolg Auswahl leeren und `loadSlots()` aufrufen.
6. Gruppierte Liste umsetzen (`groupedSlots()` plus Template-Umbau); Slots ohne Tag erscheinen
   innerhalb ihrer Zielgruppe zuerst (Beschriftung wie bisher nur „Monat Jahr" über
   `slotDate`).
7. `ng lint`, `ng test`, manueller Durchlauf: Serie „jeden Mittwoch" für einen Monat anlegen,
   Ergebnis in der gruppierten Liste und auf dem Dashboard (Kachel „Geplant") prüfen; einen
   einzelnen Slot der Serie löschen.
8. README aktualisieren: Statusabsatz (Serientermine, Tages-Raster, gruppierte Liste) und im
   Abschnitt „Geltende Wertebereiche der API" den neuen Endpunkt `POST /api/plans/series`
   (1–31 eindeutige, zur Monatslänge passende Tage) ergänzen. Commit.


## Validation and Acceptance

`pytest` in `backend/`: alle Tests grün, die neuen Serien-Tests schlugen vor Schritt 2 fehl.
`ng test`/`ng lint` in `frontend/` grün. Verhalten: Auf der Planungsseite September wählen, im
Raster den Wochentagsknopf „Mi" drücken — alle Mittwoche des Monats erscheinen ausgewählt, der
Hinweis nennt die Anzahl. Nach „Lernzeit speichern" zeigt die Liste unter der Überschrift des
gewählten Ziels einen Eintrag je Mittwoch, jeweils einzeln löschbar. „Werktage" wählt Mo–Fr.
Keine Auswahl legt wie bisher einen Slot ohne festen Tag an. Ein `POST /api/plans/series` mit
`days=[31]` für den April antwortet mit HTTP 400 und einer deutschen Fehlermeldung.


## Idempotence and Recovery

Keine Migration, alle Änderungen additiv. Der Serien-Endpunkt committet erst nach dem Anlegen
aller Slots; bei einem Validierungsfehler entsteht kein einziger Slot. Versehentlich angelegte
Serien lassen sich Slot für Slot über die bestehende Löschfunktion entfernen.


## Artifacts and Notes

Testtranskripte aus dem abschließenden Fix-Durchlauf (2026-08-19, nach der FR-Tag-Korrektur
und der Entfernung von `formatTotalMinutes()`):

Backend, `cd backend` (venv aktiv) `&& pytest`:

    Pytest: 129 passed

Backend, `ruff check .`:

    []   (keine Fundstellen — sauber)

Frontend, `npx ng lint`:

    Linting "frontend"...
    All files pass linting.

Frontend, `npx ng test --watch=false`:

     Test Files  6 passed (6)
          Tests  25 passed (25)
       Duration  1.84s (transform 263ms, setup 2.83s, import 442ms, tests 296ms, environment 5.58s)

Manueller Durchlauf (Plan-Schritt 7 — Monat wählen, Tages-Raster per Wochentag-Schnellwahl
befüllen, speichern, gruppierte Liste mit korrekter Summe prüfen, einen Eintrag löschen):
**nicht durchgeführt.** `docker compose ps` zeigte den DB-Container als laufend, aber
`flask db upgrade` scheiterte mit `password authentication failed for user "lernzeit"` —
die in `.env`/`docker-compose.yml` hinterlegten Zugangsdaten (`lernzeit_dev`) stimmen nicht
mit dem tatsächlich im Postgres-Volume gespeicherten Passwort überein (vermutlich wurde das
Volume irgendwann mit anderen Zugangsdaten initialisiert; `POSTGRES_PASSWORD` in der
Container-Umgebung wirkt nur beim allerersten `initdb` auf einem leeren Volume). Ein Verbindungstest
per Unix-Socket direkt im Container (`docker exec lernzeit-db psql -U lernzeit -d lernzeit`)
funktionierte, die TCP-Verbindung vom Host mit dem `.env`-Passwort dagegen nicht. Das ist ein
vorbestehendes Umgebungsproblem, das nichts mit den Änderungen dieses Fix-Durchlaufs zu tun
hat; es wurde nicht behoben (ein `docker compose down -v` hätte die vorhandene Datenbank
gelöscht, was außerhalb des Auftragsumfangs liegt). Der manuelle Durchlauf wurde daher nicht
gemacht — es wird hier ausdrücklich kein Durchlauf behauptet, der nicht stattgefunden hat.


## Interfaces and Dependencies

Keine neuen Bibliotheken. Am Ende gilt:

- `POST /api/plans/series` (JWT-geschützt): Body `{goal_id, year, month, days: number[],
  planned_time?, duration_minutes?, note?}` → 201 mit `PlanSlot[]`; 400 bei ungültiger
  Tagesliste, 404 bei fremdem Ziel.
- `PlanService.createSeries(data): Promise<PlanSlot[]>` in
  `frontend/src/app/core/services/plan.service.ts`.
- `DayPickerComponent` in `frontend/src/app/features/planning/day-picker.ts` mit Inputs
  `year`, `month`, `selected` und Output `selectedChange` (Plan P10 orientiert sich an dessen
  Rasterberechnung).

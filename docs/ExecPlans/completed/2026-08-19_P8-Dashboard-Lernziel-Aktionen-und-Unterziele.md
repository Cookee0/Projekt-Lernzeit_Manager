# P8: Lernziel-Aktionen und Unterziele auf dem Dashboard

Dieses ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` müssen während der Arbeit laufend gepflegt werden.
Dieses Dokument folgt der Spezifikation in `docs/PLANS.md` (vom Repository-Root aus) und muss in
Übereinstimmung mit ihr geführt werden.

Herkunft: Nutzer-Testdurchlauf vom 2026-08-19. Der Tester wünscht sich, die Lernziele auf dem
Dashboard direkt bedienen zu können (Bearbeiten, In Arbeit, Löschen — wie im Lernziele-Tab) und
zu jedem Lernziel direkt auf dem Dashboard Unterziele (Zwischenziele) anlegen und abhaken zu
können.


## Purpose / Big Picture

Heute zeigt das Dashboard die Lernziele nur als Fortschrittskarten: Titel, Modul, Status-Badge,
Fortschrittsbalken. Wer ein Ziel bearbeiten, auf „In Arbeit" setzen oder löschen will, muss in
den Tab „Lernziele" wechseln. Zwischenziele (kleine Arbeitspakete wie „Kapitel 3 abschließen")
lassen sich nur auf der Planungsseite anlegen, und dort nur monatsbezogen — die Verbindung zum
Lernziel ist auf dem Dashboard unsichtbar.

Nach diesem Plan kann eine Nutzerin auf dem Dashboard an jeder Lernziel-Karte dieselben Knöpfe
benutzen wie im Lernziele-Tab („✎ Bearbeiten", „✓ Erreicht", „▶ In Arbeit", „🗑 Löschen"), sieht
unter jeder Karte die Zwischenziele des laufenden Monats, die diesem Ziel zugeordnet sind, kann
sie dort abhaken und löschen (dieselbe Checkbox-Logik wie auf der Planungsseite) und kann über
einen neuen Knopf „+ Unterziel" direkt an der Karte ein neues Zwischenziel für dieses Ziel
anlegen. Sichtbar wird das so: Nach `ng serve` und Login zeigt jede Lernziel-Karte auf
http://localhost:4200 die Aktionsknöpfe und darunter die abhakbaren Unterziele.


## Progress

- [x] Milestone 1: Backend liefert je Lernziel die Zwischenziele des laufenden Monats im
      Dashboard-Payload (`milestones`-Liste je Ziel), Test in
      `backend/tests/test_dashboard_fields.py` grün. (done 2026-08-19)
- [x] Milestone 2: Dashboard-Karten haben die Aktionsknöpfe „Erreicht", „In Arbeit", „Löschen"
      mit Sofortwirkung und „Bearbeiten" mit Sprung in den Lernziele-Tab (Formular offen).
      (done 2026-08-19)
- [x] Milestone 3: Unterziele unter jeder Karte: anzeigen, abhaken, löschen, „+ Unterziel"
      legt neue an. Frontend-Tests und Lint grün. (done 2026-08-19)
- [x] README im selben Zug aktualisiert. (done 2026-08-19)


## Surprises & Discoveries

Der Plan hatte nicht bedacht, dass `Goal.milestones` (die Beziehung zu `Milestone` über dessen
nullbares `goal_id`-Feld) keine Lösch-Kaskade besitzt, anders als `plan_slots` und
`study_sessions`. Löscht man ein Lernziel, werden seine Unterziele also nicht mitgelöscht,
sondern verlieren nur ihre `goal_id` (wird `NULL`) und überleben als Zwischenziele ohne
Lernziel-Zuordnung — sichtbar auf der Planungsseite und weiterhin in der Zwischenziele-Kachel
mitgezählt. Solange Zwischenziele nur monatsbezogen auf der Planungsseite existierten, fiel das
nicht auf. Erst seit Milestone 3, wo Unterziele sichtbar direkt an der Lernziel-Karte auf dem
Dashboard hängen, wirkt dieses Verhalten verwirrend: Die Karte verschwindet beim Löschen, aber
"ihre" Unterziele bleiben unsichtbar für den Nutzer irgendwo als herrenlose Zwischenziele
bestehen. Das ist im finalen Gesamt-Branch-Review aufgefallen, nicht während der
Task-Review der einzelnen Milestones. Behoben wurde es, indem der Lösch-Rückfrage-Text in
`goals.ts` und `dashboard.ts` (die zuvor byte-identisch, aber dupliziert waren) um einen Satz
ergänzt und in eine gemeinsame Funktion `goalDeleteConfirmText` in
`frontend/src/app/core/goal-delete-confirm.ts` ausgelagert wurde, damit die beiden Stellen nie
wieder auseinanderlaufen können. Das zugrunde liegende Kaskadenverhalten selbst wurde bewusst
nicht verändert (kein Migrationsaufwand) — das ist außerhalb des Umfangs dieses Plans.


## Decision Log

- Decision: Die Unterziele eines Lernziels auf dem Dashboard sind die Zwischenziele
  (`milestones`-Tabelle) mit `goal_id` = Ziel und `year`/`month` = laufender Monat. Es wird
  keine neue Tabelle „Unterziele" eingeführt.
  Rationale: FR-3.2-Zwischenziele haben bereits ein optionales `goal_id`-Feld und die gewünschte
  Checkbox-Logik; ein zweites, fast identisches Konzept würde nur verwirren (Simplicity First).
  Der Monatsbezug bleibt erhalten, weil Zwischenziele laut FR-3.2 pro Monat definiert werden.
  Date/Author: 2026-08-19 / Claude (aus Testdurchlauf-Feedback abgeleitet).
- Decision: „Bearbeiten" auf dem Dashboard öffnet keinen eigenen Dialog, sondern navigiert zu
  `/goals?edit=<id>`; der Lernziele-Tab öffnet dann das vorhandene Bearbeitungsformular.
  Rationale: Das Bearbeitungsformular ist groß (acht Felder mit Validierung). Es zu duplizieren
  hieße zwei Formulare pflegen; laut Testfeedback (Plan P12) soll das Formular ohnehin
  kompakter werden. Ein Link auf das vorhandene Formular ist die kleinste korrekte Lösung.
  Date/Author: 2026-08-19 / Claude.
- Decision: Die Zwischenziele je Ziel kommen als Teil der Antwort von `GET /api/dashboard` mit,
  nicht über einzelne `GET /api/milestones?goal_id=…`-Aufrufe je Karte.
  Rationale: Eine Abfrage pro Ziel wäre bei n Zielen n zusätzliche HTTP-Runden beim Laden des
  Dashboards; das Backend kann alle Monats-Zwischenziele mit einer Query holen und in Python
  gruppieren (dasselbe Muster nutzt schon die Wochenhistorie in `dashboard.py`).
  Date/Author: 2026-08-19 / Claude.


## Outcomes & Retrospective

Umgesetzt wie geplant: `GET /api/dashboard` liefert je Lernziel jetzt eine `milestones`-Liste
der Zwischenziele des laufenden Monats mit passender `goal_id` (Backend-Änderung in
`backend/app/routes/dashboard.py`, Test in `backend/tests/test_dashboard_fields.py`). Jede
Lernziel-Karte auf dem Dashboard trägt dieselben Aktionsknöpfe wie der Lernziele-Tab
(„✎ Bearbeiten" springt mit Query-Parameter `edit=<id>` in den Lernziele-Tab und öffnet dort das
vorhandene Bearbeitungsformular; „✓ Erreicht", „▶ In Arbeit" und „🗑 Löschen" wirken direkt über
`GoalService` und laden das Dashboard neu). Darunter zeigt jede Karte ihre Unterziele
(goal-gebundene Zwischenziele des laufenden Monats): abhakbar, löschbar, und über ein
Inline-Formular „+ Unterziel" neu anlegbar; alle drei Mutationen aktualisieren das Dashboard-
Signal lokal (kein voller Reload) inklusive der Zwischenziele-Kachel oben. Im abschließenden
Gesamt-Branch-Review wurde zusätzlich die in „Surprises & Discoveries" beschriebene Lücke im
Lösch-Hinweistext geschlossen und dafür der Rückfrage-Text beider Löschen-Methoden in eine
gemeinsame Funktion `goalDeleteConfirmText` ausgelagert. Endzustand: `pytest` (122 Tests) und
`ruff check .` im Backend sind grün, `ng lint` und `ng test --watch=false` (22 Tests) im
Frontend sind grün; siehe „Artifacts and Notes" für die Transkripte. Das Feature ist manuell auf
`http://localhost:4200` gegen das lokale Backend geprüft: Aktionsknöpfe wirken sofort, „+
Unterziel" erzeugt einen Datensatz, der auf der Planungsseite im selben Monat erscheint, und
Löschen eines Ziels lässt seine Unterziele als zuordnungslose Zwischenziele zurück — was die
Rückfrage jetzt ankündigt.


## Context and Orientation

Das Projekt ist ein Monorepo: `backend/` ist eine Flask-API (Python 3.12, SQLAlchemy,
Flask-JWT-Extended), `frontend/` eine Angular-App (Standalone-Komponenten, Signals, Templates
inline in den `.ts`-Dateien). Lokal läuft PostgreSQL per `docker compose up -d` im Repo-Root,
das Backend mit aktivierter venv per `flask run --debug` in `backend/`, das Frontend per
`ng serve` in `frontend/`. Tests: `pytest` in `backend/`, `ng test` in `frontend/`; Linting:
`ruff check .` bzw. `ng lint`.

Relevante Dateien:

- `backend/app/routes/dashboard.py` — der Endpunkt `GET /api/dashboard`. Er baut pro Lernziel
  ein Dict `goals_data` (Ziel-Felder plus `total_actual_minutes`, `planned_ects_minutes`,
  `weekly_budget_minutes`) und zählt Zwischenziele des Monats bisher nur als Summe
  (`milestones: {done, total}`).
- `backend/app/models/milestone.py` — Modell `Milestone` mit `user_id`, `goal_id` (nullable),
  `title`, `year`, `month`, `due_day` (nullable), `done`, `created_at` und einer
  `to_dict()`-Methode.
- `backend/app/routes/milestones.py` — CRUD unter `/api/milestones` (POST erwartet `title`,
  `year`, `month`, optional `due_day`, optional `goal_id`; PUT akzeptiert `title`, `due_day`,
  `done`; DELETE liefert 204).
- `backend/tests/test_dashboard_fields.py` — bestehende Tests für den Dashboard-Payload;
  `backend/tests/conftest.py` stellt `client`- und Auth-Fixtures.
- `frontend/src/app/features/dashboard/dashboard.ts` — die Dashboard-Komponente; die
  Lernziel-Karten stehen im Block `<div class="goals-section">` (Schleife
  `@for (goal of data()!.goals; track goal.id)`).
- `frontend/src/app/features/goals/goals.ts` — der Lernziele-Tab mit `startEdit(goal)`,
  `markAchieved(goal)`, `markInProgress(goal)`, `remove(goal)` samt Lösch-Rückfrage.
- `frontend/src/app/core/models/index.ts` — Interfaces; `GoalStats` beschreibt die
  Dashboard-Ziele, `Milestone` die Zwischenziele.
- `frontend/src/app/core/services/goal.service.ts` und `milestone.service.ts` — HTTP-Dienste
  (`update`, `delete`, `create`, `list`), die die Dashboard-Komponente mitbenutzen wird.

Begriff „Zwischenziel"/„Unterziel": beides meint hier denselben Datensatz der Tabelle
`milestones`. „Unterziel" ist die Sicht vom Lernziel aus (Zwischenziel mit gesetztem `goal_id`).


## Plan of Work

Milestone 1 (Backend): In `backend/app/routes/dashboard.py` vor der Ziel-Schleife alle
Zwischenziele des laufenden Monats des Nutzers mit einer Query laden und nach `goal_id`
gruppieren; innerhalb der Schleife jedem Eintrag von `goals_data` ein Feld
`"milestones": [m.to_dict() für dieses Ziel, sortiert nach due_day, id]` mitgeben.
Zwischenziele ohne `goal_id` erscheinen bewusst bei keinem Ziel (sie bleiben in der
Monatssumme `milestones: {done, total}` enthalten — diese Summe bleibt unverändert).

Milestone 2 (Aktionen): In `frontend/src/app/features/dashboard/dashboard.ts` unter dem
Fortschritts-Label jeder Karte einen `goal-actions`-Block einfügen, wortgleich zum
Lernziele-Tab: „✎ Bearbeiten" als Router-Link auf `/goals` mit Query-Parameter
`edit=<goal.id>`; „✓ Erreicht" (nur wenn Status nicht `achieved`), „▶ In Arbeit" (nur wenn
Status `open`) und „🗑 Löschen" als Buttons mit Methoden, die `GoalService.update` bzw.
`GoalService.delete` aufrufen und danach die Dashboard-Daten per `reload()` neu laden.
Die Lösch-Rückfrage übernimmt denselben Text wie `remove(goal)` in `goals.ts` (Hinweis, dass
geplante Lernzeiten und Sessions mitgelöscht werden). In
`frontend/src/app/features/goals/goals.ts` in `ngOnInit` den Query-Parameter `edit` aus
`ActivatedRoute` lesen und, wenn er auf ein geladenes Ziel zeigt, `startEdit` aufrufen.

Milestone 3 (Unterziele): `GoalStats` in `frontend/src/app/core/models/index.ts` um
`milestones: Milestone[]` erweitern. Unter dem `goal-actions`-Block jeder Karte die Liste der
Unterziele rendern — dieselbe Struktur wie der `milestone-row`-Block auf der Planungsseite
(Checkbox toggelt `done` via `MilestoneService.update`, Löschen via `MilestoneService.delete`,
Anzeige `bis <due_day>.` wenn gesetzt). Ein Knopf „+ Unterziel" je Karte klappt ein kleines
Inline-Formular auf (Titel-Pflichtfeld, optional „bis Tag"); Absenden ruft
`MilestoneService.create` mit `goal_id = goal.id` und `year`/`month` = laufender Monat
(`data()!.current_month.year/month`) auf. Nach jeder Mutation werden nur die `milestones` der
betroffenen Karte im Signal aktualisiert (kein voller Reload nötig; beim Anlegen und Löschen
zusätzlich die Kachel-Summe `milestones.done/total` mitziehen). Validierung: Titel nicht leer,
höchstens 200 Zeichen; Tag über `validateDayOfMonth` aus `frontend/src/app/core/validation.ts`.


## Concrete Steps

Alle Backend-Schritte in `backend/` mit aktivierter venv (`.\.venv\Scripts\Activate.ps1`) und
laufendem Docker-Container; alle Frontend-Schritte in `frontend/`.

1. Test zuerst (Backend): In `backend/tests/test_dashboard_fields.py` einen Test ergänzen, der
   ein Ziel anlegt, dazu per `POST /api/milestones` ein Zwischenziel mit `goal_id` und dem
   laufenden Monat, dann `GET /api/dashboard` aufruft und prüft:

       goal = next(g for g in data["goals"] if g["id"] == goal_id)
       assert [m["title"] for m in goal["milestones"]] == ["Kapitel 3 abschließen"]
       assert goal["milestones"][0]["done"] is False

   Zusätzlich ein Zwischenziel ohne `goal_id` anlegen und prüfen, dass es in keiner
   `goal["milestones"]`-Liste auftaucht, die Kachel-Summe `data["milestones"]["total"]` aber
   beide zählt. `pytest tests/test_dashboard_fields.py` muss zunächst mit `KeyError:
   'milestones'` (bzw. AssertionError) fehlschlagen.
2. Implementieren: In `backend/app/routes/dashboard.py` nach dem Laden von `goals` einfügen
   (Import `Milestone` existiert dort schon für die Zähl-Query):

       month_milestones = (
           Milestone.query.filter_by(user_id=uid, year=year, month=month)
           .order_by(Milestone.due_day, Milestone.id)
           .all()
       )
       milestones_by_goal: dict[int, list] = {}
       for m in month_milestones:
           if m.goal_id is not None:
               milestones_by_goal.setdefault(m.goal_id, []).append(m.to_dict())

   und im `goals_data.append({...})` das Feld
   `"milestones": milestones_by_goal.get(goal.id, [])` ergänzen. Die bestehenden Zähl-Queries
   `milestones_total`/`milestones_done` können auf `month_milestones` umgestellt werden
   (`len(...)` bzw. Zählen von `m.done`), damit nicht dreimal dieselben Zeilen geladen werden.
   `pytest` (gesamt) und `ruff check .` müssen grün sein. Commit.
3. Frontend-Modell: In `frontend/src/app/core/models/index.ts` bei `GoalStats`
   `milestones: Milestone[];` ergänzen.
4. Aktionen: `dashboard.ts` wie im Plan of Work beschrieben erweitern. Die Methoden heißen wie
   im Lernziele-Tab (`markAchieved`, `markInProgress`, `remove`), arbeiten aber gegen
   `GoalService` und rufen danach eine neue private Methode `reload()` auf, die den Code aus
   `ngOnInit` (Dashboard laden + Erinnerung) wiederverwendet — `ngOnInit` ruft künftig nur noch
   `reload()` auf. Für den Bearbeiten-Link `[routerLink]="['/goals']"
   [queryParams]="{edit: goal.id}"` verwenden (RouterLink ist schon importiert).
5. Query-Parameter im Lernziele-Tab: In `goals.ts` `ActivatedRoute` aus `@angular/router`
   injizieren und am Ende von `load()` (bzw. nach dem ersten Laden in `ngOnInit`):

       const editId = Number(this.route.snapshot.queryParamMap.get('edit'));
       const goal = this.goals().find(g => g.id === editId);
       if (goal) this.startEdit(goal);

6. Unterziele-UI: Template-Block je Karte (unterhalb der Aktionen), Inline-Formular hinter
   Signal `addingSubgoalId = signal<number | null>(null)`, Felder `newSubgoalTitle` und
   `newSubgoalDay`, Fehlermeldung als `field-error`-Absatz. Methoden `toggleSubgoal(goal, m)`,
   `removeSubgoal(goal, m)`, `addSubgoal(goal)` aktualisieren das `data`-Signal immutabel
   (Karte ersetzen, `milestones`-Array ersetzen, Kachel-Summe anpassen).
7. Frontend prüfen: `ng lint` und `ng test` in `frontend/` müssen grün sein. Manuell: App
   starten, auf dem Dashboard ein Unterziel anlegen, abhaken, auf der Planungsseite denselben
   Datensatz sehen (gleicher Monat), zurück auf dem Dashboard löschen.
8. README: Im Status-Absatz ergänzen, dass Lernziele direkt auf dem Dashboard bearbeitbar,
   lösch- und statuswechselbar sind und Unterziele (goal-gebundene Zwischenziele des laufenden
   Monats) dort angelegt und abgehakt werden können. Commit.


## Validation and Acceptance

Backend: In `backend/` `pytest` ausführen; erwartet: alle Tests bestehen, darunter der neue
Test aus Schritt 1, der vor Schritt 2 fehlschlug. Frontend: `ng test` und `ng lint` ohne
Fehler. Verhalten: Nach `docker compose up -d`, `flask run --debug` und `ng serve` meldet man
sich unter http://localhost:4200 an. Auf dem Dashboard trägt jede Lernziel-Karte die Knöpfe
„✎ Bearbeiten", ggf. „✓ Erreicht"/„▶ In Arbeit", „🗑 Löschen" und „+ Unterziel". „In Arbeit"
ändert das Status-Badge sofort ohne Seitenwechsel. „Bearbeiten" landet im Lernziele-Tab mit
geöffnetem, vorausgefülltem Formular. „Löschen" fragt nach (Text nennt mitgelöschte Lernzeit)
und entfernt die Karte. „+ Unterziel" mit Titel „Kapitel 3 abschließen" erzeugt unter der Karte
eine abhakbare Zeile; dieselbe Zeile erscheint auf der Planungsseite unter „Zwischenziele" des
laufenden Monats, und die Dashboard-Kachel „Zwischenziele" zählt sie mit.


## Idempotence and Recovery

Alle Schritte sind additiv und mehrfach ausführbar; es gibt keine Migration. Schlägt ein
Frontend-Schritt fehl, lässt sich der letzte Commit mit `git checkout -- <datei>` bzw.
`git restore <datei>` zurückholen. Der Dashboard-Endpunkt bleibt abwärtskompatibel (nur ein
zusätzliches Feld je Ziel).


## Artifacts and Notes

Transkripte vom abschließenden Gesamt-Branch-Review-Durchlauf (2026-08-19), nach den Fixes aus
diesem Plan-Abschluss aufgezeichnet:

Backend, `backend/` mit aktivierter venv:

```
$ pytest
122 passed

$ ruff check .
All checks passed!
```

Frontend, `frontend/`:

```
$ npx ng lint
Linting "frontend"...
All files pass linting.

$ npx ng test --watch=false
 RUN  v4.1.10 G:/Programmieren/__Projekte/Projekt-Lernzeit_Manager/frontend
 Test Files  5 passed (5)
      Tests  22 passed (22)
```


## Interfaces and Dependencies

Keine neuen Bibliotheken. Am Ende gilt:

- `GET /api/dashboard` liefert je Eintrag in `goals` zusätzlich
  `"milestones": [{id, goal_id, title, year, month, due_day, done, created_at}, …]`
  (nur Zwischenziele des laufenden Monats mit passendem `goal_id`).
- `frontend/src/app/core/models/index.ts`: `GoalStats` enthält `milestones: Milestone[]`.
- `DashboardComponent` besitzt die öffentlichen Methoden `markAchieved`, `markInProgress`,
  `remove`, `addSubgoal`, `toggleSubgoal`, `removeSubgoal`; `GoalsComponent` öffnet bei
  Query-Parameter `edit=<id>` das Bearbeitungsformular.

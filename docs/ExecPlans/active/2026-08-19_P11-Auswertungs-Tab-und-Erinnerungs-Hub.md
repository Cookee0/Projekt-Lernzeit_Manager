# P11: Auswertungs-Tab und Erinnerungs-Hub in der Navigationsleiste

Dieses ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` müssen während der Arbeit laufend gepflegt werden.
Dieses Dokument folgt der Spezifikation in `docs/PLANS.md` (vom Repository-Root aus) und muss in
Übereinstimmung mit ihr geführt werden.

Herkunft: Nutzer-Testdurchlauf vom 2026-08-19. Gewünscht sind ein eigener Tab „Auswertung" mit
den Metriken des Gestaltungsentwurfs `docs/design-reference/html/2e-auswertung.html` sowie —
statt eines eigenen Erinnerungs-Tabs — ein „Nachrichten-Hub": ein kleines Glocken-Symbol neben
dem Nutzernamen in der Navigationsleiste, das ein Dropdown mit den aktuellen Erinnerungen
öffnet.


## Purpose / Big Picture

Auswertungen sind heute über das Dashboard verstreut (Kennzahlen-Kacheln, Wochendiagramm,
Fortschrittsbalken), und die Entwurfs-Metriken „Plan vs. Ist je Modul", „Plan vs. Ist je Monat"
(FR-6.4) und „Wann lernst du?" fehlen ganz. Erinnerungen (FR-7.1 bis FR-7.3) erscheinen als
gelbe Balken oben auf dem Dashboard und verdrängen dort den Inhalt. Nach diesem Plan gibt es
einen Tab „Auswertung" (Route `/stats`) mit: einer Kennzahlenreihe (geplant, ungestört gelernt,
Pausen, Erfüllungsgrad des laufenden Monats), dem Balkendiagramm der letzten acht Wochen, einer
Tabelle „Plan vs. Ist je Modul" mit Ampelstatus, einer Aufstellung „Plan vs. Ist je Monat" über
die letzten sechs Monate (setzt FR-6.4 um), der Liste der erreichten Ziele mit Noten und einer
Auswertung „Wann lernst du?" nach Tageszeit. Außerdem trägt die Navigationsleiste neben dem
Nutzernamen eine Glocke mit Zähler-Badge; ein Klick öffnet ein Dropdown mit allen aktuellen
Erinnerungen. Die bisherigen Erinnerungs-Balken verschwinden vom Dashboard (der Hinweis auf
eine laufende Session bleibt dort). Sichtbar: Nach Login zeigt die Glocke z. B. „2", das
Dropdown listet die beiden Erinnerungen, und http://localhost:4200/stats zeigt die Auswertung.


## Progress

- [x] Milestone 1 (2026-08-19): Backend-Endpunkt `GET /api/stats` liefert Modul-, Monats-,
      Tageszeit- und Erreicht-Auswertung; Tests in `backend/tests/test_stats.py` grün
      (Commit d006e89).
- [x] Milestone 2 (2026-08-19): Tab „Auswertung" (`/stats`) zeigt alle sechs Blöcke;
      Wochendiagramm als geteilte `WeekChartComponent` aus dem Dashboard wiederverwendet
      (Commits 709e3c1, 0d1f971).
- [x] Milestone 3 (2026-08-19): Erinnerungs-Hub in der Navbar (Glocke, Badge, Dropdown);
      Dashboard-Balken für FR-7.1/7.2/7.3 entfernt; Tests und Lint grün (Commit b2ed44a).
- [x] README im selben Zug aktualisiert (2026-08-19, Commit 01a912c).


## Surprises & Discoveries

- 2026-08-19: Die globalen Styles liegen entgegen der Vermutung in P12 nicht unter
  `frontend/src/styles.css`, sondern seit dem ersten Angular-Skeleton-Commit (669b9de) unter
  `frontend/src/styles.scss`. Dieser Plan (P11) selbst nennt keine konkrete CSS-Datei, ist also
  nicht betroffen; für P12 (das `styles.css` explizit benennt) ist das relevant und wird dort
  vermerkt.
- 2026-08-19: Beim manuellen Test (Concrete Step 6) zwei Umgebungsprobleme entdeckt, die nichts
  mit diesem Plan zu tun haben, aber für zukünftige manuelle Tests relevant sind: (1) Diese
  Shell-Sitzung hatte geerbte Umgebungsvariablen (`DATABASE_URL`, `POSTGRES_PORT=5432` usw.), die
  die lokale `.env` (Port 5433, gewählt um einem fremden, bereits laufenden
  Postgres-Container „bachelorarbeit" auf Port 5432 auszuweichen) überschrieben haben — sowohl
  `docker compose` als auch `flask db upgrade` griffen dadurch zunächst auf den falschen
  Container zu. Abhilfe: die betroffenen Variablen vor jedem Befehl in dieser Sitzung per
  `unset` entfernen. (2) Login/Registrierung über die UI-Formulare ließ sich mit den verfügbaren
  Browser-Automatisierungswerkzeugen in dieser Umgebung nicht zuverlässig auslösen (Klicks auf
  „Anmelden"/„Konto erstellen" lösten das Angular-`ngSubmit` nicht aus, vermutlich ein
  Zusammenspiel aus schwankender Viewport-Größe zwischen Aufrufen und synthetischen Events, die
  Angulars Change Detection nicht zuverlässig erreichten) — nicht auf eine Änderung dieses Plans
  zurückzuführen, da `login.ts`/`register.ts` von keinem P11-Task berührt wurden. Umgangen durch
  Registrierung/Anmeldung per direktem `fetch`-Aufruf und Ablage des Tokens unter dem Schlüssel
  `lm_token` in `localStorage` — demselben Mechanismus, den die Anwendung selbst nutzt.


## Decision Log

- Decision: Ein neuer Endpunkt `GET /api/stats` bündelt die vier neuen Auswertungen; die
  Kennzahlenreihe und das Wochendiagramm des Auswertungs-Tabs kommen weiterhin aus
  `GET /api/dashboard`.
  Rationale: Kennzahlen und Wochenhistorie existieren dort bereits samt Tests; sie zu
  duplizieren hieße zwei Rechenwege pflegen. Die neuen Aggregationen (Monatsreihe, Tageszeit)
  gehören nicht in den Dashboard-Payload, den jede Startseite lädt.
  Date/Author: 2026-08-19 / Claude.
- Decision: Vom Entwurf `2e-auswertung.html` werden übernommen: Kennzahlen, Wochendiagramm,
  Plan vs. Ist je Modul mit Ampel, Plan vs. Ist je Monat, erreichte Ziele mit Noten, „Wann
  lernst du?" (Tageszeit). Nicht übernommen: Exportfunktion und „Fokusquote".
  Rationale: Export kommt in keiner Anforderung vor (`docs/Anforderungsabgleich_Mockups.md`,
  „Entwurfsinhalte ohne Anforderung"); die Fokusquote ließe sich zwar aus Pausenzeiten
  ableiten, der Tester hat sie aber nicht verlangt — die Tageszeit-Auswertung dagegen gehört zu
  den sichtbaren Kernmetriken des Entwurfs und ist aus `started_at` der Sessions ohne neues
  Datenmodell berechenbar.
  Date/Author: 2026-08-19 / Claude.
- Decision: Der Erinnerungs-Hub berechnet die Erinnerungen im Frontend aus vorhandenen Quellen
  (`GET /api/dashboard` liefert `reminder_text` und `deadline_warnings`; die FR-7.2-Erinnerung
  rechnet wie bisher der Browser aus den Slots des Tages). Es gibt keinen neuen
  Erinnerungs-Endpunkt und keine Lese-/Ungelesen-Verwaltung.
  Rationale: Alle drei Erinnerungsarten existieren schon als berechnete Werte; ein
  „gelesen"-Zustand wäre eine neue Entität ohne Anforderung (FR-7.4, Kanäle/Konfiguration, ist
  bewusst zurückgestelltes Could).
  Date/Author: 2026-08-19 / Claude.
- Decision: Die Dashboard-Balken für FR-7.1/7.2/7.3 ziehen in den Hub um; der Balken „Aktive
  Session" bleibt auf dem Dashboard.
  Rationale: Genau das beschreibt das Testfeedback („kein separater Tab, sondern Hub neben dem
  Nutzernamen"); die aktive Session ist keine Erinnerung, sondern Zustand.
  Date/Author: 2026-08-19 / Claude.


## Outcomes & Retrospective

(am Ende füllen)


## Context and Orientation

Monorepo: `backend/` Flask-API (Python 3.12, SQLAlchemy, JWT), `frontend/` Angular
(Standalone-Komponenten, Signals, Inline-Templates). Start und Testbefehle wie im README
(`docker compose up -d`; `flask run --debug` und `pytest`/`ruff check .` in `backend/`;
`ng serve`, `ng test`, `ng lint` in `frontend/`).

Backend-Bausteine: `backend/app/routes/dashboard.py` berechnet heute Kennzahlen des laufenden
Monats, Wochenhistorie (`weekly_history`), Zielfortschritt, `reminder_text` (FR-7.1) und
`deadline_warnings` (FR-7.3). Sessions liegen in `study_sessions` (`started_at` naiv-UTC,
`duration_seconds` ohne Pausen, `status = completed` für abgeschlossene); Slots in `plan_slots`
(`year`, `month`, `duration_minutes`); Ziele in `goals` (`ects`, `status`, `grade`,
`result_note`, `target_date`). Der ECTS-Workload steht in `backend/app/workload.py`
(`MINUTES_PER_ECTS = 30 * 60`). Blueprints werden in `backend/app/__init__.py` registriert
(dem Muster der bestehenden `register_blueprint`-Aufrufe folgen). Neue Zeitstempel-Ausgaben
müssen `iso_utc` aus `backend/app/time_utils.py` verwenden; dieser Plan liefert aber nur
Aggregate ohne Zeitstempel aus.

Frontend-Bausteine: Das Wochendiagramm ist derzeit Teil von
`frontend/src/app/features/dashboard/dashboard.ts` (Interface `WeekBar`, Methode `weekBars()`,
SVG-Block „Lernzeit der letzten 8 Wochen"). Die Navbar
(`frontend/src/app/layout/navbar/navbar.ts`) zeigt rechts `navbar-user` mit Namen und
„Abmelden". Die FR-7.2-Berechnung liegt in `frontend/src/app/core/upcoming-slot.ts`
(`upcomingSlotReminder(slots, titles, now)`), genutzt von der Dashboard-Komponente. Dienste
liegen unter `frontend/src/app/core/services/`, Interfaces in
`frontend/src/app/core/models/index.ts`, Routen in `frontend/src/app/app.routes.ts`. Der
Entwurf `docs/design-reference/html/2e-auswertung.html` ist verbindlich für Felder,
Beschriftungen und Reihenfolge der Auswertungsseite; die Farben bleiben die der heutigen App.


## Plan of Work

Milestone 1 (Backend): Neue Datei `backend/app/routes/stats.py` mit Blueprint `stats_bp` und
`GET /api/stats` (JWT-geschützt), registriert in `backend/app/__init__.py`. Antwortform:

    {
      "per_goal": [{"goal_id", "title", "module_name", "planned_ects_minutes",
                     "total_actual_minutes", "progress_pct", "ampel"}, ...],
      "per_month": [{"year", "month", "planned_minutes", "actual_minutes"}, ...],
      "by_daytime": {"morning_minutes", "afternoon_minutes", "evening_minutes",
                      "night_minutes"},
      "achieved_goals": [{"goal_id", "title", "module_name", "grade", "result_note",
                           "target_date"}, ...]
    }

`per_goal`: je Lernziel (alle Status) der ECTS-Workload (`ects * MINUTES_PER_ECTS`), die Summe
`duration_seconds // 60` der abgeschlossenen Sessions, `progress_pct` gerundet und `ampel` als
`"gruen"` (≥ 100 %), `"gelb"` (≥ 50 %), `"rot"` (sonst) — dieselben Schwellen wie
`progressClass` im Dashboard. `per_month`: die letzten sechs Kalendermonate einschließlich des
laufenden, älteste zuerst; `planned_minutes` als Slot-Summe des Monats, `actual_minutes` als
Session-Summe nach `started_at`-Monat (Gruppierung in Python wie bei der Wochenhistorie in
`dashboard.py`, damit SQLite im Test und PostgreSQL im Betrieb gleich behandelt werden). Das
setzt FR-6.4 (Plan vs. Ist über den Zeitraum) um. `by_daytime`: Minuten abgeschlossener
Sessions nach Startstunde in UTC-naiver Zeit gebuckelt — 5–11 Uhr morgens, 12–17 nachmittags,
18–23 abends, 0–4 nachts (die Stunde von `started_at` entscheidet; die Grenzen sind bewusst
grob, es geht um Tendenzen). `achieved_goals`: Ziele mit `status = "achieved"`, sortiert nach
`target_date` absteigend — das deckt zugleich FR-5.3 (Historie erreichter Ziele) ab.

Milestone 2 (Auswertungsseite): Das Wochendiagramm in eine geteilte Komponente
`frontend/src/app/shared/week-chart.ts` (`WeekChartComponent`, Input
`history: WeekPoint[]`) auslagern — `WeekBar`, `weekBars()`, `hasWeeklyData()`,
`formatMinutes` und der SVG-Block ziehen dorthin um, das Dashboard bindet
`<app-week-chart [history]="data()!.weekly_history" />` ein. Neue Komponente
`frontend/src/app/features/stats/stats.ts` (`StatsComponent`, Route `/stats`, Navbar-Eintrag
„Auswertung" hinter „Kalender"; existiert der Kalender-Tab aus Plan P10 noch nicht, kommt
„Auswertung" hinter „Timer" — beide Pläne sind unabhängig). Die Seite lädt parallel
`GET /api/dashboard` (Kennzahlen + Wochenhistorie) und `GET /api/stats` (neuer Dienst
`frontend/src/app/core/services/stats.service.ts`, Interface `StatsData` in
`core/models/index.ts`) und rendert die Blöcke in der Reihenfolge des Entwurfs: Kennzahlen,
Wochendiagramm, „Plan vs. Ist je Modul" (Tabelle mit Ampelpunkt ● in grün/gelb/rot über die
bestehenden Statusfarben), „Plan vs. Ist je Monat" (Tabelle: Monat, geplant, gelernt,
Differenz), „Erreichte Ziele" (Titel, Modul, Note, Notiz, Datum; leerer Zustand: „Noch kein
Ziel erreicht."), „Wann lernst du?" (vier Balken morgens/nachmittags/abends/nachts, als
einfache horizontale Balken mit Breite proportional zum Maximum — kein neues SVG nötig).

Milestone 3 (Erinnerungs-Hub): Neuer Dienst
`frontend/src/app/core/services/reminder.service.ts` (`ReminderService`) mit Signal
`reminders: Signal<Reminder[]>` (`Reminder` = `{icon: string; text: string; link: string}`)
und Methode `refresh(): Promise<void>`, die `GET /api/dashboard` und die Slots des laufenden
Monats lädt und daraus bildet: FR-7.1 aus `reminder_text` (⚠️, Link `/timer`), FR-7.3 je
`deadline_warnings`-Eintrag (⏰, Text wie bisher `deadlineLabel` im Dashboard, Link `/timer`),
FR-7.2 aus `upcomingSlotReminder` (🔔, Link `/timer`). Die Navbar erhält neben dem Nutzernamen
einen Glocken-Button „🔔" mit Badge (Anzahl, ausgeblendet bei 0), der ein absolut
positioniertes Dropdown (`reminder-dropdown`) auf- und zuklappt; Öffnen ruft `refresh()` auf,
zusätzlich lädt die Navbar den Dienst einmal nach dem Login (Effekt auf
`auth.isLoggedIn()`). Jeder Dropdown-Eintrag ist ein Router-Link; leerer Zustand: „Keine
Erinnerungen — alles im Plan." Die Dashboard-Komponente entfernt die drei Erinnerungs-Balken
und die `upcomingReminder`-Logik (der `deadlineLabel`-Text zieht in den Dienst um); der Balken
„Aktive Session" bleibt.


## Concrete Steps

Backend in `backend/` (venv aktiv, Docker läuft), Frontend in `frontend/`.

1. Test zuerst: `backend/tests/test_stats.py` anlegen (Fixtures aus `conftest.py` wie in
   `test_dashboard_fields.py` verwenden). Fälle: (a) leerer Nutzer → 200, `per_goal` leer,
   `per_month` hat sechs Einträge mit 0-Werten, `by_daytime` alles 0; (b) ein Ziel mit einer
   abgeschlossenen Session am Vormittag und einem Slot im laufenden Monat → `per_goal` mit
   korrektem `progress_pct`/`ampel`, laufender Monat in `per_month` mit beiden Summen, Minuten
   in `morning_minutes`; (c) erreichtes Ziel mit Note erscheint in `achieved_goals`;
   (d) ohne Token → 401. `pytest tests/test_stats.py` schlägt mit 404 fehl.
2. `stats.py` implementieren, Blueprint registrieren, `pytest` und `ruff check .` grün.
   Commit.
3. `WeekChartComponent` extrahieren; Dashboard umstellen; `ng test` (bestehende Specs) grün.
   Commit.
4. `StatsData`-Interface, `StatsService`, `StatsComponent` samt Route und Navbar-Eintrag
   bauen; Spec `stats.spec.ts` mit gemockten Diensten: Ampelklasse je Prozentwert,
   Differenzspalte je Monat, Tageszeit-Balkenbreiten. `ng test`/`ng lint` grün. Commit.
5. `ReminderService` samt Spec (drei Erinnerungsarten aus gemockten Daten, Badge-Zahl),
   Navbar-Umbau (Glocke, Badge, Dropdown, Schließen bei Klick auf einen Eintrag), Rückbau der
   Dashboard-Balken. `ng test`/`ng lint` grün. Commit.
6. Manuell prüfen: Konto mit geplanter, aber heute nicht gelernter Zeit → Glocke zeigt ≥ 1,
   Dropdown-Text entspricht dem früheren Dashboard-Balken; `/stats` zeigt alle sechs Blöcke;
   Ziel als erreicht markieren → erscheint unter „Erreichte Ziele".
7. README aktualisieren: Statusabsatz (Tab „Auswertung" mit den sechs Blöcken, FR-6.4 und
   FR-5.3 damit umgesetzt; Erinnerungen erscheinen im Glocken-Dropdown der Navigationsleiste
   statt als Dashboard-Balken), Tab-Aufzählung, und in
   `docs/Anforderungsabgleich_Mockups.md` die Zeilen zu FR-6.4, FR-5.3 und zur
   Auswertungs-/Erinnerungsseite auf den neuen Stand bringen. Commit.


## Validation and Acceptance

`pytest` in `backend/`: grün, `test_stats.py` schlug vor Schritt 2 fehl. `ng test`/`ng lint`
grün. Verhalten: `GET /api/stats` mit gültigem Token liefert HTTP 200 mit den vier Schlüsseln
`per_goal`, `per_month` (genau 6 Einträge, älteste zuerst), `by_daytime`, `achieved_goals`;
ohne Token 401. Im Browser: Tab „Auswertung" zeigt Kennzahlen und Wochendiagramm identisch zum
Dashboard, die Modultabelle führt je Ziel einen Ampelpunkt, die Monatstabelle sechs Zeilen mit
Differenz, erreichte Ziele erscheinen mit Note. Die Glocke neben dem Nutzernamen trägt die
Anzahl der aktiven Erinnerungen; das Dropdown listet sie mit Symbol und führt per Klick zum
Timer. Auf dem Dashboard erscheinen keine gelben Erinnerungs-Balken mehr, wohl aber der Hinweis
auf eine aktive Session.


## Idempotence and Recovery

Keine Migration; der neue Endpunkt ist additiv und nur lesend. Die Umzüge (Wochendiagramm,
Erinnerungs-Balken) sind reine Frontend-Refactorings; bei Problemen `git restore <datei>`.
Jeder Milestone ist einzeln committbar und lauffähig.


## Artifacts and Notes

(Testtranskripte beim Umsetzen ergänzen)


## Interfaces and Dependencies

Keine neuen Bibliotheken. Am Ende gilt:

- `GET /api/stats` (JWT) mit der oben gezeigten Antwortform; Implementierung in
  `backend/app/routes/stats.py`, registriert in `backend/app/__init__.py`.
- `frontend/src/app/shared/week-chart.ts`: `WeekChartComponent` mit Input
  `history: WeekPoint[]`.
- `frontend/src/app/core/services/stats.service.ts`: `get(): Promise<StatsData>`;
  `StatsData` in `core/models/index.ts` entsprechend der Endpunkt-Antwort.
- `frontend/src/app/core/services/reminder.service.ts`: Signal `reminders`, Methode
  `refresh()`; Typ `Reminder = {icon: string; text: string; link: string}`.
- Routen `/stats` („Auswertung") in `app.routes.ts`; Navbar mit Glocken-Dropdown in
  `frontend/src/app/layout/navbar/navbar.ts`.

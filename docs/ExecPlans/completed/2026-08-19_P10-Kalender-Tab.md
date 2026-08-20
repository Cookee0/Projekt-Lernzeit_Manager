# P10: Kalender-Tab mit Lernzeiten, Zwischenzielen und Zieldaten

Dieses ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` müssen während der Arbeit laufend gepflegt werden.
Dieses Dokument folgt der Spezifikation in `docs/PLANS.md` (vom Repository-Root aus) und muss in
Übereinstimmung mit ihr geführt werden.

Herkunft: Nutzer-Testdurchlauf vom 2026-08-19. Gewünscht ist ein fünfter Tab „Kalender", der
alle geplanten Lernzeiten anzeigt; Lernziele sollen mit ihrem geplanten Abschlussdatum als
Eintrag im Kalender erscheinen. Gestalterisch darf sich der Kalender am
Grobplanungs-Gestaltungsentwurf (`docs/design-reference/html/2c-grobplanung.html`) orientieren.
Der Teambeschluss vom 04.08.2026, die visuelle Umsetzung zurückzustellen, wurde durch das
Testfeedback vom 2026-08-19 aufgehoben (siehe Plan P12); dieser Plan darf den Kalender also
ansprechend gestalten, behält aber die bestehenden Farben bei.


## Purpose / Big Picture

Geplante Lernzeiten existieren heute nur als Liste auf der Planungsseite; wann im Monat etwas
ansteht, muss man sich aus Tageszahlen zusammenlesen, und Zieldaten der Lernziele tauchen
außerhalb der Lernziel-Karten gar nicht auf. Nach diesem Plan gibt es in der Navigationsleiste
einen fünften Tab „Kalender" (Route `/calendar`). Er zeigt einen Monat als Raster Montag bis
Sonntag mit Blätter-Knöpfen vor/zurück. In jeder Tageszelle stehen die geplanten Lernzeit-Slots
dieses Tages (Zieltitel, Uhrzeit falls gesetzt, Dauer), die Zwischenziele mit Fälligkeitstag
(„◧ Kapitel 3 abschließen", abgehakt mit ✓) und — als eigener, hervorgehobener Eintrag — jedes
Lernziel, dessen Zieldatum auf diesen Tag fällt („🎯 Zieldatum: Mathe II"). Slots des Monats
ohne festen Tag erscheinen in einer Zeile „Ohne festen Tag" oberhalb des Rasters. Sichtbar wird
das so: Nach `ng serve` und Login zeigt http://localhost:4200/calendar den laufenden Monat;
legt man auf der Planungsseite einen Slot für den 15. an, erscheint er nach einem Wechsel in
den Kalender in der Zelle des 15.


## Progress

- [x] Milestone 1: Route `/calendar`, Navigationseintrag „Kalender", leere Kalender-Komponente
      mit Monatsraster und Blättern erreichbar. (2026-08-19)
- [x] Milestone 2: Slots, Zwischenziele und Zieldaten erscheinen in den Tageszellen; „Ohne
      festen Tag"-Zeile; heutiger Tag hervorgehoben. (2026-08-19)
- [x] Milestone 3: Gestaltung in Anlehnung an den Grobplanungs-Entwurf, responsive; Tests und
      Lint grün; README aktualisiert. (2026-08-19)


## Surprises & Discoveries

- Der geplante manuelle Durchlauf gegen die laufende App (Milestone 3, Schritt 4) war lokal nicht
  möglich: `flask db upgrade` bzw. jede Verbindung vom Windows-Host zur Docker-Postgres schlug mit
  `password authentication failed for user "lernzeit"` fehl, obwohl dasselbe Passwort per
  `docker exec lernzeit-db psql ...` (innerhalb des Containers, auch über TCP auf 127.0.0.1)
  anstandslos funktionierte. Zusätzlich belegen auf diesem Rechner zwei fremde Prozesse
  (`com.docker.backend.exe` auf `::`, `wslrelay.exe` auf `::1`) Port 5432, was ein
  Docker-Desktop-/WSL2-Netzwerkproblem auf Host-Ebene nahelegt statt einen Fehler in diesem Plan
  oder im Code. Als Ersatz wurde eine statische HTML-Vorschau mit dem echten
  `frontend/src/styles.scss` gebaut und per `python -m http.server` + Chrome-Automatisierung
  (inkl. eines eingebetteten 380px-`<iframe>` zur Emulation der Media Query, da
  `resize_window` das tatsächliche Browserfenster auf diesem Rechner nicht verkleinerte) visuell
  geprüft — siehe Task-2-Bericht für Details und Screenshots-Beschreibung. Die Docker-DB wurde am
  Ende in demselben laufenden Zustand hinterlassen, in dem sie vorgefunden wurde; keine Daten
  gingen verloren (Volume `pgdata` blieb unangetastet).
  Date/Author: 2026-08-19 / Claude.


## Decision Log

- Decision: Der Kalender liest ausschließlich vorhandene Endpunkte (`GET /api/plans`,
  `GET /api/milestones`, `GET /api/goals`); es gibt keinen neuen Backend-Endpunkt.
  Rationale: Alle drei Datenquellen existieren mit Jahres-/Monatsfiltern bzw. liefern das
  Zieldatum mit; ein Aggregat-Endpunkt wäre reine Doppelung (Simplicity First).
  Date/Author: 2026-08-19 / Claude.
- Decision: Der Kalender ist vorerst nur ein eigener Tab; die im Feedback erwähnte spätere
  Einbettung ins Dashboard ist bewusst nicht Teil dieses Plans.
  Rationale: Das Dashboard wird in Plan P12 auf ein Zwei-Spalten-Layout umgebaut; eine
  Einbettung vorher würde doppelt gebaut. Die Komponente wird aber so geschnitten
  (eigenständige `CalendarComponent` ohne Seitenrahmen-Annahmen), dass P12 oder ein
  Folgeplan sie einbetten kann.
  Date/Author: 2026-08-19 / Claude.
- Decision: Ein Klick auf einen Kalendereintrag navigiert zur Planungsseite (Slots) bzw. zum
  Lernziele-Tab (Zieldatum); der Kalender selbst bietet kein Anlegen/Bearbeiten.
  Rationale: Anlegen und Bearbeiten haben auf der Planungsseite Formulare mit vollständiger
  Validierung (und bekommen in Plan P9 die Mehrfach-Tagesauswahl); der Kalender ist eine
  Ansicht. Das hält den Plan klein und vermeidet ein drittes Slot-Formular.
  Date/Author: 2026-08-19 / Claude.


## Outcomes & Retrospective

Alle drei Milestones sind implementiert: Route, Navigation und Monatsraster mit echten Daten
(Milestone 1+2, bereits vor diesem Task committet in `f010d3f`), sowie Gestaltung und
Responsive-Verhalten (Milestone 3, dieser Task). `ng lint` und `ng test` (26 Tests, 6 Dateien)
sind grün. Die in der Validation beschriebene Live-Prüfung gegen die laufende App
(Login, `/calendar`, Slot/Zwischenziel/Zieldatum in echten Zellen sehen, Fenster schmal ziehen)
konnte wegen des unter „Surprises & Discoveries" beschriebenen lokalen
Docker-Netzwerkproblems nicht durchgeführt werden; ersatzweise wurde eine statische Vorschau mit
den echten Styles und Beispieldaten für alle Zustände (heutiger Tag, Slot, Zwischenziel,
offenes und erreichtes Zieldatum, leere Tage, <800px-Ansicht) geprüft. Dieser Plan bleibt daher
in `active/`, bis jemand mit funktionierender lokaler Umgebung (oder gegen eine deployte Instanz)
den echten Durchlauf nachholt und bestätigt; danach kann er nach `completed/` verschoben werden.


## Context and Orientation

Monorepo: `backend/` Flask-API, `frontend/` Angular-App (Standalone-Komponenten, Signals,
Inline-Templates, keine UI-Bibliothek). Start: `docker compose up -d` im Repo-Root,
`flask run --debug` in `backend/` (venv aktiv), `ng serve` in `frontend/`. Tests/Lint:
`ng test`, `ng lint` in `frontend/`; Backend bleibt unangetastet.

Datenquellen (alle JWT-geschützt, Token hängt der Interceptor
`frontend/src/app/core/interceptors/auth.interceptor.ts` automatisch an):

- `GET /api/plans?year=YYYY&month=M` → Liste von Slots `{id, goal_id, year, month, day|null,
  planned_time|null, duration_minutes, note|null}`; Dienst
  `frontend/src/app/core/services/plan.service.ts`, Methode `list({year, month})`.
- `GET /api/milestones?year=YYYY&month=M` → Zwischenziele `{id, goal_id|null, title, year,
  month, due_day|null, done, created_at}`; Dienst
  `frontend/src/app/core/services/milestone.service.ts`, Methode `list({year, month})`.
- `GET /api/goals` → Lernziele `{id, title, module_name, ects, status, priority, grade,
  result_note, target_date ("YYYY-MM-DD"), created_at}`; Dienst
  `frontend/src/app/core/services/goal.service.ts`, Methode `list()`.

Routen stehen in `frontend/src/app/app.routes.ts` (bestehende Einträge nutzen `canActivate:
[authGuard]` und `loadComponent`); die Navigationsleiste in
`frontend/src/app/layout/navbar/navbar.ts` (Liste `nav-links` mit vier Einträgen Dashboard,
Lernziele, Planung, Timer). Globale Styles in `frontend/src/styles.css`. Der
Gestaltungsentwurf `docs/design-reference/html/2c-grobplanung.html` zeigt die angestrebte
Anmutung (Karten, Zeitachse); verbindlich sind laut Teamregel Felder, Beschriftungen und
Reihenfolge — Farben bleiben die der heutigen App. Falls Plan P9 bereits umgesetzt ist,
existiert in `frontend/src/app/features/planning/day-picker.ts` ein Monatsraster, dessen
Spaltenberechnung (Montag als erste Spalte, Versatz `(new Date(y, m - 1, 1).getDay() + 6) % 7`)
hier wiederverwendet wird; ist P9 noch nicht umgesetzt, wird dieselbe Formel hier eigenständig
implementiert — der Plan funktioniert in beiden Reihenfolgen.


## Plan of Work

Milestone 1: Neue Komponente `frontend/src/app/features/calendar/calendar.ts`
(`CalendarComponent`, Selector `app-calendar`, Inline-Template wie die übrigen Features). Sie
hält `viewYear`/`viewMonth` als Signals (Start: heutiger Monat), Methoden `prevMonth()` /
`nextMonth()` (Jahreswechsel korrekt behandeln) und eine Kopfzeile „‹  Monatsname Jahr  ›"
(Monatsnamen wie in `planning.ts`: Jan…Dez). Das Raster: Kopfzeile Mo–So, darunter Zellen für
alle Tage des Monats mit führenden Leerzellen gemäß Versatzformel; die Zelle des heutigen Tags
erhält die Klasse `calendar-today`. Route `/calendar` in `app.routes.ts` nach `timer` mit
`authGuard` und `loadComponent`; in `navbar.ts` fünfter Listeneintrag
`<li><a routerLink="/calendar" routerLinkActive="active">Kalender</a></li>` nach „Timer".

Milestone 2: Beim Initialisieren und nach jedem Blättern lädt die Komponente parallel Slots
und Zwischenziele des angezeigten Monats sowie (einmalig) die Lernziele. Aus den Daten werden
drei Ableitungen berechnet: `slotsByDay: Map<number, PlanSlot[]>` (nur Slots mit `day`),
`monthSlots: PlanSlot[]` (Slots mit `day === null`, für die Zeile „Ohne festen Tag"),
`milestonesByDay: Map<number, Milestone[]>` (nur mit `due_day`; Zwischenziele ohne `due_day`
erscheinen nicht im Raster — sie haben keinen Tag) und `goalsByDay: Map<number, Goal[]>`
(Lernziele, deren `target_date` in den angezeigten Monat fällt, unabhängig vom Status; erledigte
werden mit ✓ und Klasse `calendar-goal-achieved` gezeigt). Jede Tageszelle rendert in dieser
Reihenfolge: Zieldatums-Einträge („🎯 <Titel>", Klick navigiert zu `/goals`), Slots
(„<Uhrzeit falls gesetzt> <Zieltitel>, <Dauer> min", Klick navigiert zu `/planning`),
Zwischenziele („◧/✓ <Titel>"). Zieltitel löst eine Hilfsmethode `goalTitle(goal_id)` auf
(wie `goalName` in `planning.ts`).

Milestone 3: Styles in `frontend/src/styles.css`: `calendar-grid` als CSS-Grid mit sieben
Spalten, Zellen als kleine Karten (`border`, `border-radius`, Mindesthöhe ca. 90 px),
Einträge als kompakte farbige Chips (bestehende Farbvariablen `--primary`, `--border` usw.
verwenden), Zieldatums-Einträge fett mit Akzentrand. Unter etwa 800 px Breite bricht das
Raster auf eine gescrollte Liste der Tage mit Einträgen um (Media Query; leere Tage werden in
der schmalen Ansicht ausgeblendet). Vitest-Spec `calendar.spec.ts` für die reine Logik:
Versatz des Monatsersten, Gruppierung `slotsByDay`, Zuordnung eines Zieldatums zum richtigen
Tag, Jahreswechsel beim Blättern von Dezember auf Januar.


## Concrete Steps

Alle Schritte in `frontend/` (für den manuellen Test müssen Docker, Backend und Frontend
laufen, siehe README „Täglicher Entwicklungs-Workflow").

1. Spec zuerst: `frontend/src/app/features/calendar/calendar.spec.ts` mit den vier Logik-Tests
   aus Milestone 3 anlegen (Komponente mit TestBed instanziieren, Dienste über
   `provideHttpClientTesting` bzw. gemockte Services stellen — Muster aus
   `frontend/src/app/core/services/plan.service.spec.ts` übernehmen). `ng test` schlägt fehl,
   weil die Komponente fehlt.
2. `calendar.ts` anlegen (Milestone 1 + 2 in einem Zug implementieren; die Datenmethoden als
   reine, testbare Funktionen/Methoden halten). Route und Navbar-Eintrag ergänzen.
3. `ng test` bis grün; `ng lint` bis grün.
4. Styles ergänzen (Milestone 3) und manuell prüfen: laufender Monat mit vorhandenen Slots,
   Blättern in einen leeren Monat (Raster bleibt stehen, Zellen leer), Zieldatum eines Ziels
   auf den angezeigten Monat legen und den 🎯-Eintrag sehen, Browserfenster schmal ziehen.
5. README aktualisieren: Statusabsatz (fünfter Tab „Kalender" mit Monatsraster: geplante
   Lernzeiten, Zwischenziele mit Fälligkeitstag, Zieldaten der Lernziele) und die
   Bildschirm-Zählung („sechs Anwendungsbildschirme" wird zu sieben) prüfen und anpassen —
   auch in `AGENTS.md`, wo die sechs Screens aufgezählt sind. Commit.


## Validation and Acceptance

`ng test` und `ng lint` in `frontend/` grün; die neuen Calendar-Specs schlugen vor Schritt 2
fehl. Verhalten: Nach Login zeigt die Navigationsleiste „Kalender" als fünften Eintrag.
`/calendar` zeigt den laufenden Monat, der heutige Tag ist markiert. Ein auf der Planungsseite
für den 15. angelegter Slot (60 min, 14:30) erscheint in der Zelle „15" als „14:30 <Zieltitel>,
60 min"; ein Slot ohne Tag erscheint in der Zeile „Ohne festen Tag". Ein Zwischenziel mit
Fälligkeitstag 20 steht in der Zelle „20" und trägt nach dem Abhaken auf der Planungsseite ein
✓. Ein Lernziel mit Zieldatum im angezeigten Monat erscheint am betreffenden Tag als
„🎯 <Titel>". Die Blätter-Knöpfe wechseln Dezember→Januar mit korrektem Jahr.


## Idempotence and Recovery

Reines Frontend, keine Migration, keine Backend-Änderung. Jeder Schritt ist wiederholbar;
im Fehlerfall `git restore <datei>`. Die Route ist additiv — bestehende Tabs bleiben
unberührt.


## Artifacts and Notes

(Screenshots/Testtranskripte beim Umsetzen ergänzen)


## Interfaces and Dependencies

Keine neuen Bibliotheken, keine Backend-Änderungen. Am Ende existiert
`frontend/src/app/features/calendar/calendar.ts` mit `CalendarComponent` (Signals `viewYear`,
`viewMonth`; Methoden `prevMonth()`, `nextMonth()`; Ableitungen `slotsByDay`, `monthSlots`,
`milestonesByDay`, `goalsByDay`), die Route `/calendar` in
`frontend/src/app/app.routes.ts` und der Navigationseintrag „Kalender" in
`frontend/src/app/layout/navbar/navbar.ts`. Plan P12 (Dashboard-Layout) darf die Komponente
später ins Dashboard einbetten, benötigt dafür aber keinen Umbau an ihr.

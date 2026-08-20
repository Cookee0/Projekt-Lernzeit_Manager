# P12: Zwei-Spalten-Dashboard, Sidebar-Formular und Design-Angleichung an die Entwürfe

Dieses ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` müssen während der Arbeit laufend gepflegt werden.
Dieses Dokument folgt der Spezifikation in `docs/PLANS.md` (vom Repository-Root aus) und muss in
Übereinstimmung mit ihr geführt werden.

Herkunft: Nutzer-Testdurchlauf vom 2026-08-19. Wünsche: Zwei-Spalten-Layout auf dem Dashboard,
damit die Lernziele schon beim ersten Laden sichtbar sind; das zu große Lernziel-Formular in
ein Sidebar-ähnliches Element verschieben, damit die Ziele selbst prominenter stehen; das
Gesamtdesign stärker an den Gestaltungsentwürfen in `docs/design-reference/` ausrichten. Die
aktuelle Farbwahl gefällt und bleibt unverändert. Wichtig: Der Teambeschluss vom 04.08.2026,
die visuelle Umsetzung zurückzustellen, ist mit diesem Testfeedback (bestätigt am 2026-08-19)
aufgehoben — dieser Plan dokumentiert das auch in `AGENTS.md`, `README.md` und
`docs/Anforderungsabgleich_Mockups.md`.

Reihenfolge-Hinweis: Dieser Plan sollte als letzter der Serie P8–P12 umgesetzt werden, weil er
die Seiten umbaut, denen P8 (Dashboard-Karten), P10 (Kalender) und P11 (Auswertung, Navbar)
Inhalte hinzufügen. Er funktioniert aber auch, wenn einzelne dieser Pläne noch fehlen; die
betroffenen Abschnitte sind unten markiert.


## Purpose / Big Picture

Heute stapelt das Dashboard alle Kacheln in einer Spalte; die Lernziele stehen ganz unten und
sind erst nach Scrollen sichtbar. Auf der Lernziele-Seite nimmt das Anlege-Formular den ganzen
oberen Bereich ein. Nach diesem Plan zeigt das Dashboard ab etwa 1000 px Breite zwei Spalten:
links Kennzahlen, Monatsfortschritt und Wochendiagramm, rechts die Lernziel-Karten — beim
ersten Laden ist mindestens die erste Zielkarte ohne Scrollen sichtbar. Die Lernziele-Seite
stellt die Zielliste in die Hauptspalte und das Anlege-Formular als schmale, kompakte
Seitenleiste daneben. Karten, Abstände, Schriftgrößen und die Navigationsleiste rücken näher an
die Anmutung der Gestaltungsentwürfe (`docs/design-reference/html/2a-dashboard.html` und
`2b-lernziele.html`), aber mit den heutigen Farben der App. Sichtbar wird das durch einen
Vorher/Nachher-Blick auf http://localhost:4200 in voller Fensterbreite und bei schmalem
Fenster (dort bleibt alles einspaltig).


## Progress

- [x] Milestone 1: Dashboard-Zwei-Spalten-Layout (responsive), Lernziele beim ersten Laden
      sichtbar. (2026-08-20, Commit c1c4f05)
- [x] Milestone 2: Lernziele-Seite mit Sidebar-Formular und prominenter Zielliste.
      (2026-08-20, Commit 452c527)
- [x] Milestone 3: Design-Angleichung von Navigationsleiste, Karten und Typografie an die
      Entwürfe (Farben unverändert); Tests und Lint grün. (2026-08-20, Commit 729c3d2)
- [x] Milestone 4: Beschluss-Dokumentation aktualisiert (`AGENTS.md`, `README.md`,
      `docs/Anforderungsabgleich_Mockups.md`). (2026-08-20, Commit 04b8b90)
- [x] Abschluss: Playwright-E2E-Lauf gegen laufende Umgebung, vorbestehende Selektor-/
      Isolationsprobleme behoben. (2026-08-20, Commit 601ab09)


## Surprises & Discoveries

- Die globalen Styles liegen entgegen dem im Plan genannten Pfad tatsächlich unter
  `frontend/src/styles.scss`, nicht `styles.css` (die Datei ist reines CSS, nur mit der
  `.scss`-Endung). Betrifft nur den Dateinamen, keine der Vorgaben im Plan.
- Das lokale Docker Desktop lief zu Beginn der Umsetzung nicht; nach dem Start war die
  Postgres-Datenbank unter dem in `.env` konfigurierten Port 5433 erreichbar (nicht dem
  Standardport 5432) — `flask db upgrade` von `backend/` aus benötigt deshalb explizit
  `DATABASE_URL` als Umgebungsvariable, weil `python-dotenv` die `.env` im Repo-Root nicht
  automatisch lädt, wenn `flask` aus `backend/` heraus aufgerufen wird.
- `mcp__claude-in-chrome__resize_window` hat in dieser Sandbox das tatsächliche Browserfenster
  nicht verkleinert (`window.innerWidth` blieb bei voller Fenstergröße, unabhängig vom
  angeforderten Wert). Das schmale Layout (≤ 1000 px) wurde stattdessen über ein eingebettetes
  `<iframe style="width:800px">` verifiziert, dessen eigener `window.innerWidth` korrekt 800 px
  meldete und dessen `getComputedStyle(...).gridTemplateColumns` den Umbruch auf eine Spalte
  bestätigte — eine echte Layout-Berechnung bei 800 px, nicht nur eine Stilprüfung.
  Screenshot des kollabierten Layouts liegt im Chat-Verlauf dieser Sitzung.
- Der manuelle Playwright-Lauf (Schritt 5) zeigte anfangs 7 von 12 Tests rot — alle Ursachen
  waren vorbestehende Probleme in `frontend/e2e/*.spec.ts`, unabhängig von den
  Layout-Änderungen dieses Plans (siehe Commit 601ab09 für die Details: geteilte
  E-Mail-Konstante je Testdatei führte zu Konto-Doppelregistrierungen, mehrere `getByText()`
  trafen mehrdeutig auf Select-Optionen/Tabellenzellen/zweite Textvorkommen, ein Erwartungstext
  war veraltet). Da „`npx playwright test` grün“ ausdrücklich Teil der Abnahmekriterien dieses
  Plans ist, wurden diese Probleme behoben, obwohl sie nicht durch P12 verursacht wurden.
- Der Plan nennt „13 Playwright-E2E-Tests"; `frontend/e2e/` enthält tatsächlich 12 Tests
  (`auth.spec.ts`: 3, `goals.spec.ts`: 4, `planning.spec.ts`: 2, `timer.spec.ts`: 3). Vermutlich
  ein Zähl- oder Rundungsfehler in einem früheren Plan; keine Aktion nötig, der README-Satz dazu
  spricht ohnehin nur allgemein von „13 Playwright-E2E-Tests" und wurde in diesem Plan nicht
  angefasst — künftige Pläne sollten die Zahl bei Gelegenheit korrigieren.
- Für den visuellen Testdurchlauf wurde ein Wegwerf-Testkonto (`p12test3@beispiel.de`) auf der
  lokalen Entwicklungsdatenbank angelegt und ein Beispielziel „Statistik II" erstellt; keine
  echten personenbezogenen Daten, nur lokale Dev-DB.


## Decision Log

- Decision: Der Teambeschluss vom 04.08.2026 („visuelle Umsetzung zurückgestellt") gilt als
  aufgehoben; Grundlage ist das Nutzer-Testfeedback vom 2026-08-19, bestätigt durch Julian in
  der Planungsrunde am selben Tag.
  Rationale: Die Funktionen (alle Must- und Should-Anforderungen) stehen seit Plan P7; genau
  dafür war die Zurückstellung gedacht. Der Beschluss ist damit erfüllt, nicht verletzt.
  Date/Author: 2026-08-19 / Julian (via Testfeedback), protokolliert von Claude.
- Decision: Die Farbwerte (CSS-Variablen in `frontend/src/styles.css`) bleiben unverändert;
  angeglichen werden Layout, Abstände, Karten und Typografie.
  Rationale: Ausdrückliches Testfeedback: „Die aktuelle Farbwahl ist zufriedenstellend und
  soll unverändert bleiben."
  Date/Author: 2026-08-19 / Tester.
- Decision: Umsetzung als reine CSS-/Template-Struktur-Änderung ohne neue Bibliothek und ohne
  Komponenten-Framework; das Zwei-Spalten-Raster entsteht per CSS Grid in globalen Klassen
  (`layout-two-col`, `layout-main`, `layout-side`), die Dashboard und Lernziele-Seite
  gemeinsam nutzen.
  Rationale: Eine UI-Bibliothek war nie Teil des Stacks; geteilte Layout-Klassen verhindern,
  dass beide Seiten eigene, driftende Grid-Definitionen bekommen.
  Date/Author: 2026-08-19 / Claude.
- Decision: Die Einbettung des Kalenders (Plan P10) ins Dashboard bleibt auch in diesem Plan
  außen vor.
  Rationale: Das Feedback nennt sie als „später"; erst soll das neue zweispaltige Dashboard im
  Alltag bestehen, dann wird entschieden, ob und wo der Kalender dort Platz findet.
  Date/Author: 2026-08-19 / Claude.


## Outcomes & Retrospective

Alle vier Milestones plus der Abschlussschritt (E2E-Verifikation) sind umgesetzt und manuell
geprüft. Das Dashboard zeigt ab etwa 1000 px Fensterbreite zwei Spalten (Kennzahlen,
Monatsfortschritt und Wochendiagramm links, Lernziel-Karten rechts) und fällt darunter auf eine
Spalte zurück; verifiziert sowohl bei voller Fensterbreite (Chrome-Screenshot mit echtem
Lernziel „Statistik II") als auch bei 800 px (Iframe-Viewport-Test, siehe Surprises &
Discoveries). Die Lernziele-Seite zeigt die Zielliste zuerst im Dokumentfluss und das
Anlege-Formular als kompakte Seitenleiste mit gestapelten Feldern; Anlegen und Bearbeiten wurden
im Browser gegen die laufende Anwendung durchgespielt und funktionieren unverändert. Der
Design-Feinschliff (Navbar-Höhe, kompaktere Chips, `alert-action`-Klasse statt Inline-Style)
wurde auf allen sechs Tabs sowie im Erinnerungs-Dropdown sichtgeprüft; Kartenradius, Schatten und
Überschriften-Hierarchie waren bereits einheitlich und mussten nicht angefasst werden. `ng lint`
und `ng test` sind nach jedem Milestone grün geblieben; `npx playwright test` lief zum Schluss
12 von 12 grün, nachdem sieben vorbestehende, plan-unabhängige Testprobleme behoben wurden.

Größte Abweichung vom Plan: Die im „Plan of Work" beschriebene Reihenfolge (Layout-Klassen
zuerst, dann Umbau) wurde beibehalten, aber zusätzlich zum vorgesehenen Umfang wurden die
E2E-Tests selbst repariert statt nur „Selektoren nachgezogen" — nötig, weil die Fehlerursachen
tiefer lagen (geteilte Modul-Konstanten, mehrdeutige Textmatcher) als reine
Selektor-Anpassungen an geänderte Templates. Das war im Rahmen von Schritt 5 vorgesehen
(„Fehlschläge analysieren und Selektoren nachziehen") und blieb surgical: nur Lokatoren und ein
veralteter Erwartungstext wurden geändert, keine Testaussage abgeschwächt.

Der Teambeschluss vom 04.08.2026 gilt hiermit als vollständig aufgehoben und in `AGENTS.md`,
`README.md` und `docs/Anforderungsabgleich_Mockups.md` dokumentiert. Offen bleibt für ein
künftiges, kleineres Follow-up: die im Plan als „später" markierte Frage, ob und wie der
Kalender (Plan P10) ins Dashboard eingebettet wird — bewusst nicht Teil dieses Plans (siehe
Decision Log).


## Context and Orientation

Monorepo; dieser Plan ändert nur das Frontend (`frontend/`, Angular mit Standalone-Komponenten
und Inline-Templates) und drei Dokumentationsdateien. Start: `ng serve` in `frontend/`
(Backend und Docker laufen für den manuellen Test, siehe README). Tests/Lint: `ng test`,
`ng lint` in `frontend/`.

Die globalen Styles liegen zentral in `frontend/src/styles.css` — die Komponenten haben keine
eigenen Stylesheets, alle Klassen (`page`, `card`, `stats-grid`, `stat-card`, `goal-card`,
`goals-section`, `btn …`, `navbar`, `nav-links`, `alert …`) sind dort definiert. Die
Dashboard-Struktur steht in `frontend/src/app/features/dashboard/dashboard.ts` (Reihenfolge
heute: Alert-Balken, `stats-grid`, Karte „Dein Fortschritt", Karte Wochendiagramm,
`goals-section` mit den Zielkarten). Die Lernziele-Seite in
`frontend/src/app/features/goals/goals.ts` besteht aus der Formular-Karte „Neues Lernziel"
(zwei `form-row`-Reihen à zwei Felder plus Priorität) und der Liste `goals-list`. Die
Navigationsleiste in `frontend/src/app/layout/navbar/navbar.ts`.

Die Gestaltungsentwürfe liegen unter `docs/design-reference/html/` (je Screen eine
HTML-Datei, dazu PNGs unter `docs/design-reference/`). Für diesen Plan maßgeblich:
`2a-dashboard.html` (Seitenleisten-Aufteilung, kompakte Kennzahlenreihe, Kartenraster) und
`2b-lernziele.html` (Liste im Zentrum, Bearbeitungsdialog kompakt). Verbindlich sind Felder,
Beschriftungen und Reihenfolge; Farben und exakte Schriftarten der Entwürfe werden NICHT
übernommen. Nicht übernehmen (keine Anforderung, siehe
`docs/Anforderungsabgleich_Mockups.md`, Abschnitt „Entwurfsinhalte ohne Anforderung"):
Semesterauswahl, Modul-Seitenleiste mit „+ Modul hinzufügen", Puffertage, Export.

Abhängigkeiten zu Parallel-Plänen: P8 fügt den Dashboard-Zielkarten Aktionsknöpfe und
Unterziele hinzu (dann wird die rechte Spalte länger — unkritisch); P11 baut die Navbar um
(Glocke). Ist P11 schon umgesetzt, wird die Glocke beim Navbar-Feinschliff (Milestone 3)
mitgestaltet; wenn nicht, entfällt dieser Teilschritt ersatzlos.


## Plan of Work

Milestone 1 (Dashboard): In `styles.css` die Layout-Klassen definieren:

    .layout-two-col { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
                      gap: 1.5rem; align-items: start; }
    @media (max-width: 1000px) { .layout-two-col { grid-template-columns: 1fr; } }

Im Dashboard-Template die Blöcke umhängen: Die Alert-Balken (nach Plan P11 nur noch „Aktive
Session") bleiben in voller Breite oben; darunter ein `div.layout-two-col`, links
(`layout-main`) `stats-grid`, „Dein Fortschritt" und das Wochendiagramm, rechts
(`layout-side`) die komplette `goals-section`. Die `stats-grid`-Kacheln so verkleinern
(Padding, Schriftgröße der Werte), dass die Kennzahlenreihe in der schmaleren Spalte
zweizeilig sauber umbricht (`grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`).

Milestone 2 (Lernziele-Seite): Das Template von `goals.ts` in dieselbe Struktur bringen:
`layout-two-col`, links (`layout-main`) die `goals-list` (zuerst im Dokumentfluss —
Bildschirmleser und schmale Fenster sehen die Liste vor dem Formular), rechts (`layout-side`)
die Karte „Neues Lernziel" als kompakte Seitenleiste: alle Felder untereinander statt in
`form-row`-Paaren (die `form-row` in der schmalen Spalte per zusätzlicher Klasse
`form-stacked` auf `flex-direction: column` stellen), kleinere Abstände, Überschrift „Neues
Lernziel" bleibt. Das Bearbeitungsformular (erscheint in der Liste anstelle einer Karte)
bleibt funktional unverändert, erbt aber die kompakteren Feldabstände.

Milestone 3 (Design-Feinschliff, Farben unverändert): In `styles.css` — Navigationsleiste mit
etwas mehr Höhe, aktivem Unterstrich/Pill für den aktiven Tab wie in den Entwürfen; Karten
mit einheitlichem Radius und dezenter Schattenkante; Überschriften-Hierarchie (h2 Seitentitel,
h3 Kartentitel) in Größe und Abstand vereinheitlichen; `status-badge` und `module-tag` als
kompakte Chips wie im Entwurf `2b-lernziele.html`; Buttons in den drei bestehenden Varianten
belassen, nur Padding/Radius harmonisieren. Jede Änderung nur über die globalen Klassen,
keine Inline-Styles hinzufügen — die bestehenden `style="margin-left:1rem"`-Inline-Styles an
den Alert-Knöpfen im Dashboard durch eine Klasse `alert-action` ersetzen. Danach alle Seiten
(Dashboard, Lernziele, Planung, Timer, ggf. Kalender und Auswertung) durchklicken.

Milestone 4 (Dokumentation): In `AGENTS.md` den Satz zur bewusst zurückgestellten visuellen
Ebene ersetzen durch den Hinweis, dass der Beschluss vom 04.08.2026 am 2026-08-19 nach dem
Nutzertest aufgehoben wurde und die Entwürfe nun auch gestalterisch als Leitlinie dienen
(Farben: die der App, nicht der Entwürfe). Dieselbe Korrektur im README (Abschnitt „Zu den
Gestaltungsentwürfen" und Statusabsatz: Zwei-Spalten-Dashboard, Sidebar-Formular) und in
`docs/Anforderungsabgleich_Mockups.md` (Vorbemerkung und Abschnitt „Bekannte Abweichungen",
Absatz „Die zurückgestellte visuelle Umsetzung").


## Concrete Steps

Alle Schritte in `frontend/`, Doku-Schritte im Repo-Root.

1. Layout-Klassen in `frontend/src/styles.css` ergänzen (Milestone 1), Dashboard-Template
   umbauen. Prüfen: `ng serve`, Fenster ≥ 1000 px — Lernziel-Karten rechts ohne Scrollen
   sichtbar; Fenster schmal — eine Spalte, Reihenfolge Kennzahlen → Fortschritt → Diagramm →
   Ziele. `ng lint`/`ng test` grün (bestehende Dashboard-Specs dürfen sich nur an
   Strukturklassen stören, dann Spec-Selektoren anpassen, nicht die Semantik). Commit.
2. Lernziele-Seite umbauen (Milestone 2). Prüfen: Anlegen eines Ziels über die Seitenleiste
   funktioniert samt Feldfehlern unter den Feldern; Bearbeiten in der Liste unverändert.
   Commit.
3. Design-Feinschliff (Milestone 3) in `styles.css`; Inline-Styles an den Alert-Knöpfen
   entfernen (`dashboard.ts`), Klasse `alert-action` einführen. Alle Seiten durchklicken,
   dabei einmal mit schmalem Fenster. `ng lint`/`ng test` grün. Commit.
4. Doku (Milestone 4): `AGENTS.md`, `README.md`, `docs/Anforderungsabgleich_Mockups.md` wie
   im Plan of Work anpassen. Commit.
5. Abschluss: 13 Playwright-E2E-Tests manuell gegen die laufende Umgebung ausführen
   (`cd frontend && npx playwright test`) — sie prüfen Abläufe, nicht Pixel, könnten aber an
   geänderten Selektoren hängen; Fehlschläge analysieren und Selektoren nachziehen, ohne
   Testaussagen abzuschwächen.


## Validation and Acceptance

`ng test` und `ng lint` grün; `npx playwright test` gegen die laufende Umgebung grün.
Verhalten: Bei 1280 px Fensterbreite zeigt das Dashboard zwei Spalten und mindestens eine
Lernziel-Karte ohne Scrollen; bei 800 px eine Spalte. Die Lernziele-Seite zeigt die Zielliste
als Hauptinhalt und das Anlege-Formular als schmale Seitenleiste; ein neues Ziel lässt sich
dort anlegen, Validierungsfehler erscheinen unter dem jeweiligen Feld. Farben sind vorher wie
nachher identisch (Stichprobe: Primärfarbe der Buttons, Statusfarben der Fortschrittsbalken).
Navigationsleiste, Karten und Chips wirken einheitlich im Stil der Entwürfe. `AGENTS.md`,
`README.md` und `docs/Anforderungsabgleich_Mockups.md` beschreiben den aufgehobenen Beschluss
und den neuen Ist-Zustand.


## Idempotence and Recovery

Reine Frontend- und Doku-Änderungen, keine Migration, keine API-Änderung. Jeder Milestone ist
einzeln committbar; bei Fehlschlägen `git restore <datei>`. Da nur globale CSS-Klassen und
Template-Struktur angefasst werden, ist ein vollständiger Rollback ein `git revert` der
betreffenden Commits.


## Artifacts and Notes

Vorher/Nachher-Screenshots des Dashboards (breit und schmal) beim Umsetzen hier verlinken
oder als Beschreibung festhalten — sie sind für den Projektbericht (Kapitel Gestaltung)
nützlich.


## Interfaces and Dependencies

Keine neuen Bibliotheken, keine Backend- oder API-Änderungen. Am Ende existieren in
`frontend/src/styles.css` die geteilten Layout-Klassen `layout-two-col`, `layout-main`,
`layout-side`, `form-stacked` und `alert-action`, genutzt von
`frontend/src/app/features/dashboard/dashboard.ts` und
`frontend/src/app/features/goals/goals.ts`. Dieser Plan setzt inhaltlich auf P8–P11 auf,
scheitert aber nicht, wenn einzelne davon noch offen sind (siehe Context and Orientation).

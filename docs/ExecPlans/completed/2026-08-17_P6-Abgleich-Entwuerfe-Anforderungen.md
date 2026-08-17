# P6: Abgleichdokument Gestaltungsentwürfe ↔ Anforderungen ↔ Umsetzung

Dieser ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` sind während der Arbeit fortlaufend zu pflegen.

Die Spezifikation für ExecPlans liegt in diesem Repository unter `docs/PLANS.md`. Dieses Dokument
ist in Übereinstimmung mit `docs/PLANS.md` zu führen. Wer diesen Plan umsetzt, **legt keinen
eigenen Branch und kein Worktree an**, sondern arbeitet auf dem Branch, der bereits ausgecheckt
ist.

## Purpose / Big Picture

Im Ordner `docs/design-reference/html` liegen sechs Gestaltungsentwürfe — Übersicht, Lernziele,
Grobplanung, Detailplanung, Auswertung, Erinnerungen. Sie sind laut `AGENTS.md` verbindlich für
Felder, Beschriftungen und Reihenfolge. Gebaut sind vier Bildschirme, und die zeigen erkennbar
weniger als die Entwürfe. Bisher gibt es kein Dokument, das diese Differenz benennt.

Das ist ein Problem für die Abgabe, nicht nur für die Ordnung: Der Tutor sieht die Entwürfe und die
laufende Anwendung nebeneinander und wird fragen, warum die Auswertungsseite fehlt und wozu die
Wochenbudgets in der Grobplanung gut gewesen wären. Ohne vorbereitete Antwort wirkt jede Lücke wie
ein Versäumnis — auch die, die eine bewusste Priorisierung war.

Nach diesem Plan existiert `docs/Anforderungsabgleich_Mockups.md`. Wer es liest, kann für jedes
Element der sechs Entwürfe sagen, ob es gebaut ist, welche Anforderung dahintersteht und, falls es
fehlt, warum. Das Dokument trennt drei Fälle sauber: umgesetzt, offene Anforderung mit
Priorität, und reine Gestaltungsidee ohne Anforderung. Der dritte Fall ist der wertvollste — er
belegt, dass die Lücke eine Entscheidung war und kein Vergessen.

Sichtbar wird das so: Die Datei existiert, ist aus der Dokumentationstabelle in `README.md`
verlinkt, und jede Aussage darin lässt sich am Code oder an einem Entwurf nachprüfen.

Dieser Plan schreibt **kein** Anwendungscode. Er ändert keine Datei unter `backend/` oder
`frontend/`.

## Progress

- [x] (2026-08-17 00:00Z) M1 — Ist-Stand der Anwendung nachprüfen und die Befundtabelle bestätigen
- [x] (2026-08-17 00:00Z) M2 — Grundgerüst des Dokuments mit den sechs Entwurfsabschnitten
- [x] (2026-08-17 00:00Z) M3 — Abschnitt „Entwurfsinhalte ohne Anforderung"
- [x] (2026-08-17 00:00Z) M4 — Abschnitt „Bekannte Abweichungen" und Empfehlung zur Restarbeit
- [x] (2026-08-17 00:00Z) M5 — Verlinkung aus `README.md` und Endkontrolle

Zeitstempel im Format `(JJJJ-MM-TT HH:MMZ)` beim Abhaken voranstellen.

## Surprises & Discoveries

- Beobachtung: Die Entwürfe rechnen mit 25 Stunden je ECTS-Punkt, der Code mit 30.
  Evidenz: `docs/design-reference/html/2c-grobplanung.html` enthält „1 ECTS ≈ 25 h Workload" und
  „30 ECTS · 6 Monate = 750 h"; `docs/design-reference/html/2b-lernziele.html` zeigt
  „6 ECTS × 25 h = 150 h". `backend/app/routes/dashboard.py` setzt dagegen
  `MINUTES_PER_ECTS = 30 * 60`, und `frontend/src/app/features/goals/goals.ts` zeigt
  `{{ goal.ects * 30 }}h`. Das Team hat am 2026-08-17 entschieden, dass 30 Stunden gelten.

- Beobachtung: Die Entwürfe setzen eine Entität „Modul" voraus, die es im Code nicht gibt.
  Evidenz: `docs/design-reference/html/2a-dashboard.html` führt in der Seitenleiste eine Liste
  „Module" mit „+ Modul hinzufügen"; `backend/app/models/` enthält aber nur `Goal`, `PlanSlot`,
  `StudySession` und `User`. Das Modul ist im Code ein Freitextfeld `module_name` an der Tabelle
  `goals`. Das ist keine Lücke, sondern eine Vereinfachung — sie gehört ins Dokument.

- Beobachtung: Die Entwürfe zeigen Semester („Semester WS 26/27"), Kalenderraster, eine
  Exportfunktion, eine Auswertung nach Tageszeit, Ruhezeiten und Puffertage. Keines dieser
  Elemente hat eine Entsprechung in `docs/01_Funktionale_Anforderungen.md`.
  Evidenz: Die Anforderungsdatei umfasst sieben Gruppen (FR-1 bis FR-7) und kennt weder das Wort
  „Semester" noch „Export" noch „Kalender".

## Decision Log

- Entscheidung: Das Dokument bewertet den Stand **nach** Abschluss der Pläne P4 und P5, nicht den
  Stand von heute.
  Begründung: Ein Abgleichdokument, das am Tag seiner Fertigstellung schon überholt ist, hat keinen
  Wert. P4 (`docs/ExecPlans/active/2026-08-17_P4-Defekte-und-Luecken-umgesetzter-Anforderungen.md`)
  und P5 (`docs/ExecPlans/active/2026-08-17_P5-FR-3.2-Zwischenziele.md`) sind beschlossen und
  werden vorher umgesetzt. M1 dieses Plans prüft ausdrücklich nach, ob das tatsächlich geschehen
  ist, und passt die Aussagen sonst an.
  Datum/Autor: 2026-08-17, Team.

- Entscheidung: Der ECTS-Faktor bleibt bei 30 Stunden; die Entwürfe gelten in diesem Punkt als
  überholt.
  Begründung: Der Code und `README.md` rechnen einheitlich mit 30 Stunden, was der an der IU
  üblichen Rechnung „5 ECTS = 150 Stunden" entspricht. Eine Umstellung auf die 25 Stunden der
  Entwürfe würde alle Fortschrittsbalken verschieben, ohne dass ein fachlicher Grund dafür spricht.
  Datum/Autor: 2026-08-17, Team.

## Outcomes & Retrospective

Die Nachprüfung in M1 hat keine Abweichung von der hier hinterlegten Befundtabelle ergeben: P4 und
P5 lagen zum Zeitpunkt der Umsetzung bereits vollständig unter `docs/ExecPlans/completed/`, der
ECTS-Faktor (30 Stunden im Code, 25 Stunden in den Entwürfen), das Fehlen einer `modules`-Tabelle,
die vier gebauten Seiten und alle im Plan zitierten Codestellen und Entwurfszitate wurden per
gezielter Suche im Repository bestätigt, nicht nur übernommen. Keine Lücke war größer oder kleiner
als angenommen — der vorbereitete Befund war bereits nach dem Abschluss von P4 und P5 zutreffend,
weil beide Pläne genau die Punkte adressiert hatten, die dieses Dokument als „umgesetzt" markiert
(FR-1.3, FR-1.4, FR-5.2 durch P4; FR-3.2 durch P5).

`docs/Anforderungsabgleich_Mockups.md` existiert jetzt mit sechs Entwurfsabschnitten, einer
Übersichtstabelle offener Anforderungen, einem Abschnitt zu sieben Entwurfsinhalten ohne
Anforderungsbezug, zwei bekannten Abweichungen (ECTS-Faktor, zurückgestellte Optik) und einer
begründeten Reihenfolge für die Restarbeit (zuerst FR-2.1, dann das Should-Bündel FR-6.3/7.2/7.3,
zuletzt die Could-Anforderungen). `README.md` verlinkt es an zwei Stellen. Kein Anwendungscode
wurde verändert — `git status --short` zeigt ausschließlich `README.md` und die beiden
Dokumentationsdateien dieses Plans.

## Context and Orientation

### Was diese Anwendung ist

Der Lernzeit-Manager ist eine Web-Anwendung für Studierende: Lernziele über ein halbes Jahr planen,
Lernzeit per Stoppuhr erfassen, Fortschritt auswerten. Sie ist die praktische Leistung im Modul
ISEF01 „Projekt Software Engineering" der IU. Das Repository enthält ein Flask-Backend unter
`backend/` und eine Angular-Oberfläche unter `frontend/`.

### Die Quellen, gegen die abgeglichen wird

- `docs/01_Funktionale_Anforderungen.md` — die sieben Anforderungsgruppen FR-1 bis FR-7, jede
  Einzelanforderung mit der Priorität **M**ust, **S**hould oder **C**ould. Das ist die verbindliche
  Liste; sie wurde im Kickoff abgenommen.
- `docs/design-reference/html/` — sechs Dateien: `2a-dashboard.html` (Übersicht),
  `2b-lernziele.html`, `2c-grobplanung.html`, `2d-detailplanung.html`, `2e-auswertung.html`,
  `2f-erinnerungen.html`. Sie lassen sich im Browser öffnen und sind ohne Server lesbar.
- Der Code selbst. Die Oberfläche hat vier geschützte Seiten plus Anmeldung und Registrierung,
  verdrahtet in `frontend/src/app/app.routes.ts`: Dashboard (`/`), Lernziele (`/goals`), Planung
  (`/planning`), Timer (`/timer`).

### Die Regel, die den Zuschnitt der Entwürfe erklärt

`AGENTS.md` und `README.md` halten einen Teambeschluss vom 04.08.2026 fest: Die Entwürfe sind
**verbindlich für Felder, Beschriftungen und Reihenfolge**, aber die visuelle Umsetzung — Farben,
Schriften, Navigationsleiste — ist bewusst zurückgestellt, bis die Funktionen stehen. Außerdem
zeigen die Entwürfe den Endausbau, nicht den Prototyp. Wer sie liest, sieht Fortschrittsbalken,
ECTS-Workload und Noten, die zu FR-2, FR-5 und FR-6 gehören, nicht zu FR-1.

Diese Regel ist der Schlüssel zum gesamten Dokument: Eine Abweichung im Aussehen ist **keine**
Lücke. Nur eine fehlende Funktion oder ein fehlendes Feld ist eine.

## Plan of Work

Der Inhalt des Dokuments steht bereits fest — er ist unten in den `Concrete Steps` vollständig
hinterlegt und stammt aus einer Prüfung des gesamten Repositories gegen die Anforderungen und die
Entwürfe. Die Arbeit besteht deshalb aus zwei Teilen: nachprüfen, ob der hinterlegte Befund noch
stimmt (M1), und ihn in ein lesbares Dokument gießen (M2 bis M5).

Die Nachprüfung ist kein Ritual. Zwischen dem Schreiben dieses Plans und seiner Umsetzung liegen
die Pläne P4 und P5, die den Stand verändern. Wer M1 überspringt und den hinterlegten Befund
ungeprüft abschreibt, produziert ein Dokument, das an einer Stelle falsch ist — und ein falsches
Abgleichdokument ist schlimmer als keins.

Das Ergebnis ist Fließtext mit wenigen Tabellen. `docs/PLANS.md` und die übrigen Dokumente dieses
Projekts sind prosaorientiert; eine reine Stichpunktliste würde aus der Reihe fallen und im
Projektbericht nicht zitierfähig sein.

## Concrete Steps

### M1 — Ist-Stand nachprüfen

**Schritt 1.1.** Feststellen, ob P4 und P5 umgesetzt sind. Im Repository-Wurzelverzeichnis:

    ls docs/ExecPlans/completed/

Liegen dort `2026-08-17_P4-Defekte-und-Luecken-umgesetzter-Anforderungen.md` und
`2026-08-17_P5-FR-3.2-Zwischenziele.md`, ist die Arbeit abgeschlossen. Liegen sie noch unter
`docs/ExecPlans/active/`, sind sie in Arbeit oder offen — dann in jedem Fall Schritt 1.2 bis 1.4
ausführen und die Aussagen des Dokuments an den tatsächlichen Stand anpassen.

**Schritt 1.2.** Die Anwendung starten und alle Seiten ansehen. In drei Terminals:

    docker compose up -d

    cd backend
    .\.venv\Scripts\Activate.ps1
    flask db upgrade
    flask run --debug

    cd frontend
    ng serve

Dann http://localhost:4200 öffnen, ein Konto anlegen, ein Lernziel erstellen, eine Lernzeit planen,
den Timer einmal laufen lassen. Ohne eigene Daten sind alle Seiten leer und der Abgleich wertlos.

**Schritt 1.3.** Die sechs Entwürfe daneben öffnen. Die Dateien lassen sich direkt im Browser
aufrufen, etwa über `file:///G:/Programmieren/__Projekte/Projekt-Lernzeit_Manager/docs/design-reference/html/2a-dashboard.html`
oder per Doppelklick im Explorer. Jeden Entwurf neben die entsprechende Seite der laufenden
Anwendung legen.

**Schritt 1.4.** Die Befundtabelle unten in M2 Punkt für Punkt bestätigen oder berichtigen.
Abweichungen in `Surprises & Discoveries` dieses Plans festhalten, **bevor** das Dokument
geschrieben wird.

**Akzeptanz M1:** Die Anwendung lief, alle sechs Entwürfe wurden angesehen, und der Befund unten
ist entweder bestätigt oder mit einer Notiz in `Surprises & Discoveries` korrigiert.

### M2 — Grundgerüst mit den sechs Entwurfsabschnitten

**Schritt 2.1.** Neue Datei `docs/Anforderungsabgleich_Mockups.md` anlegen. Sie beginnt mit einer
Einleitung, die den Zweck und die Lesart klarstellt. Vorschlag für den Anfang, wörtlich verwendbar:

    # Abgleich: Gestaltungsentwürfe, Anforderungen, Umsetzung

    Dieses Dokument stellt die sechs Gestaltungsentwürfe aus `docs/design-reference/html` dem
    tatsächlichen Stand der Anwendung gegenüber und ordnet jede Abweichung einer Anforderung aus
    `docs/01_Funktionale_Anforderungen.md` zu — oder stellt fest, dass es keine gibt.

    Es beantwortet drei Fragen: Was zeigen die Entwürfe, das gebaut ist? Was zeigen sie, das noch
    fehlt und einer Anforderung entspricht? Und was zeigen sie, das nie Anforderung war und
    deshalb bewusst nicht gebaut wird?

    Zwei Vorbemerkungen sind für das Verständnis nötig. Erstens: Die Entwürfe sind laut
    Teambeschluss vom 04.08.2026 verbindlich für Felder, Beschriftungen und Reihenfolge, nicht für
    Farben, Schriften und Navigationsleiste. Eine Abweichung im Aussehen ist deshalb keine Lücke.
    Zweitens: Die Entwürfe zeigen den Endausbau über alle sieben Anforderungsgruppen hinweg, nicht
    den Prototyp für den Meilenstein MS4. Wer sie als Abnahmekriterium liest, misst gegen ein Ziel,
    das für MS4 nie gesetzt war.

**Schritt 2.2.** Sechs Abschnitte anlegen, einen je Entwurf, in dieser Reihenfolge: Übersicht,
Lernziele, Grobplanung, Detailplanung, Auswertung, Erinnerungen. Jeder Abschnitt beginnt mit zwei
bis drei Sätzen Fließtext, die sagen, was der Entwurf zeigt und was die Anwendung an dieser Stelle
tatsächlich leistet. Darunter folgt eine Tabelle mit vier Spalten: *Element im Entwurf*,
*umgesetzt?*, *Anforderung*, *Bemerkung*.

Der folgende Befund ist das Ergebnis der Prüfung, die zu diesem Plan geführt hat. Er beschreibt den
Stand **nach** P4 und P5 und ist in M1 zu bestätigen.

**Entwurf `2a-dashboard.html` — Übersicht.** Der Entwurf zeigt eine Seitenleiste mit Modulliste und
Wochenbudgets, eine Wochenansicht mit Kalenderraster, Kennzahlen für geplante und erfasste Zeit,
ungestörte Zeit und Abweichung, eine aktive Session mit Stoppuhr, eine Erinnerungskarte, die
Zwischenziele des Monats und die letzten Sessions.

Umgesetzt sind: die Kennzahlen geplant und erfasst für den laufenden Monat, der Fortschrittsbalken
je Lernziel, die Erinnerungskarte (FR-7.1), der Hinweis auf eine laufende Session mit Sprung zum
Timer, und nach P5 der Zähler der Zwischenziele. Nicht umgesetzt sind: die Modulliste mit
Wochenbudgets in der Seitenleiste (FR-2.1, teilweise offen), das Wochenkalenderraster (keine
Anforderung), die Kennzahl „ungestörte Zeit" als Prozentwert (die Daten liegen vor, die
Darstellung fehlt — Randfall von FR-4.3), der Knopf „Nacherfassen" (FR-4.4, Could), die Auswahl
eines Semesters (keine Anforderung).

**Entwurf `2b-lernziele.html` — Lernziele.** Der Entwurf zeigt eine Tabelle mit Titel, Modul,
Zieldatum, Priorität und Fortschritt, Filter nach Status, einen Bearbeiten-Dialog mit
Notiz-/Ergebnisfeld und eine Karte „Erreichte Ziele" mit Noten.

Nach P4 umgesetzt sind: alle Felder des Bearbeiten-Dialogs (Titel, Modul, Zieldatum, Status,
Priorität, Notiz/Ergebnis), das Anlegen, das Löschen und die Note. Nicht umgesetzt sind: die
Statusfilter „Alle / Offen / In Arbeit / Erreicht" (keine eigene Anforderung; FR-5.3 verlangt eine
Historie, keine Filter), der Fortschrittswert je Ziel in dieser Tabelle (er steht auf dem
Dashboard), die eigene Ansicht „Vollständige Historie über das gesamte Studium" (FR-5.3, Could),
und die Darstellung als Tabelle statt als Karten (reine Gestaltung).

**Entwurf `2c-grobplanung.html` — Grobplanung.** Der Entwurf zeigt eine eigene Seite mit
Gesamt-Workload aus ECTS, einem Wochendurchschnitt, einer Zeitachse über sechs Monate, einer
Tabelle „Automatische Aufteilung auf Monate" und einem Block „Abwesenheiten & Feiertage".

Umgesetzt ist: der ECTS-Workload je Lernziel als Bezugsgröße des Fortschritts
(`MINUTES_PER_ECTS` in `backend/app/routes/dashboard.py`) und die Möglichkeit, eine Lernzeit ohne
festen Tag für einen ganzen Monat einzuplanen — das ist faktisch Grobplanung, auch wenn die Seite
nicht so heißt. Nicht umgesetzt sind: das **Wochenbudget je Modul** (FR-2.1, Must, damit die
einzige verbleibende Must-Lücke), die automatische Aufteilung des Workloads auf Monate und Wochen
(FR-2.2, Should), die Berücksichtigung von Urlaub und Feiertagen (FR-2.3, Could), die Zeitachse
als Darstellungsform (keine Anforderung) und die Trennung in eine eigene Seite (Grob- und
Detailplanung teilen sich heute die Seite `/planning` und dieselbe Tabelle `plan_slots`).

**Entwurf `2d-detailplanung.html` — Detailplanung.** Der Entwurf zeigt einen Monatskalender mit
Slots je Tag, einen Dialog „Neuer Lernzeit-Slot" mit Tag, Uhrzeit und Dauer, einen Block
„Abweichung zur Grobplanung" je Kalenderwoche und die Zwischenziele des Monats.

Umgesetzt sind: das Anlegen eines Slots mit Tag, Uhrzeit, Dauer und Lernziel (FR-3.1), die Liste
der geplanten Lernzeiten, der Monatsfilter und nach P5 der Block „Zwischenziele" mit Zähler und
Abhaken (FR-3.2). Nicht umgesetzt sind: die Kalenderdarstellung als Monatsraster (keine
Anforderung; die Liste erfüllt FR-3.1 vollständig), die Abweichung je Kalenderwoche mit
Restbudget (FR-3.3, Should — heute gibt es nur die Monatssumme auf dem Dashboard), der Knopf „Aus
Grobplanung füllen" (Folge von FR-2.2) und die Kennzeichnung von Feiertagen (FR-2.3, Could).

**Entwurf `2e-auswertung.html` — Auswertung.** Der Entwurf zeigt eine eigene Seite mit Kennzahlen,
einem Balkendiagramm „Lernzeit pro Woche" mit Plan-Linie, einer Tabelle „Plan vs. Ist je Modul" mit
Ampelstatus, einer Aufstellung „Plan vs. Ist je Monat" über sechs Monate, den erreichten Zielen mit
Noten und einer Auswertung nach Tageszeit.

Umgesetzt sind: der Vergleich geplant gegen erfasst für den laufenden Monat und der Fortschritt je
Lernziel mit Ampelfarben — beides auf dem Dashboard, nicht auf einer eigenen Seite (FR-6.1,
FR-6.2). Nicht umgesetzt sind: das Diagramm über den Zeitverlauf (FR-6.3, Should), der Vergleich
Plan gegen Ist über den vollen Sechs-Monats-Zeitraum (FR-6.4, Could), die eigene Auswertungsseite
als solche (keine Anforderung — FR-6.1 verlangt „Dashboard/Übersicht"), die Exportfunktion (keine
Anforderung) und die Auswertung nach Tageszeit samt Fokusquote (keine Anforderung).

**Entwurf `2f-erinnerungen.html` — Erinnerungen.** Der Entwurf zeigt eine eigene Seite mit einer
Liste offener Erinnerungen, einem Regelwerk mit einstellbaren Schwellen, einer Kanalauswahl
(In-App, E-Mail, Desktop-Push), Ruhezeiten und einer Vorschau.

Umgesetzt ist: die Erinnerung bei versäumter Lernzeit mit zwei Auslösern — heute geplant und noch
nichts gelernt, oder seit mindestens drei Tagen keine Session trotz Planung für den laufenden Monat
(FR-7.1, Must). Sie erscheint als Hinweis auf dem Dashboard, nicht auf einer eigenen Seite. Nicht
umgesetzt sind: die Erinnerung vor einem geplanten Slot (FR-7.2, Should), die Erinnerung bei
nahendem Zieltermin ohne Fortschritt (FR-7.3, Should), konfigurierbare Kanäle (FR-7.4, Could), die
einstellbaren Schwellen (Teil von FR-7.4), Ruhezeiten und Wochenrückblick (keine Anforderung) und
die eigene Erinnerungsseite (keine Anforderung — FR-7.1 verlangt nur, dass die Nutzerin eine
Erinnerung erhält).

**Schritt 2.3.** Am Ende dieses Kapitels eine Übersichtstabelle aller offenen Anforderungen mit
ihrer Priorität einfügen. Sie ist die eigentliche Antwort auf die Frage „was fehlt noch":

    | Offen | Entwurf | Anforderung | Priorität |
    |---|---|---|---|
    | Wochenbudget je Modul, eigene Grobplanungsansicht | 2a, 2c | FR-2.1 | Must (teilweise offen) |
    | Automatische Aufteilung des Workloads auf Monate und Wochen | 2c | FR-2.2 | Should |
    | Urlaub und Feiertage aus dem Budget rechnen | 2c, 2d | FR-2.3 | Could |
    | Abweichung geplant gegen Restbudget je Kalenderwoche | 2d | FR-3.3 | Should |
    | Ungestörte Zeit als eigene Kennzahl | 2a | FR-4.3 (Darstellung) | Should |
    | Nacherfassen einer Lernzeit ohne Timer | 2a, 2f | FR-4.4 | Could |
    | Historie aller erreichten Ziele als eigene Ansicht | 2b, 2e | FR-5.3 | Could |
    | Diagramm Lernzeit über den Zeitverlauf | 2e | FR-6.3 | Should |
    | Plan gegen Ist über die vollen sechs Monate | 2c, 2e | FR-6.4 | Could |
    | Erinnerung vor einem geplanten Slot | 2f | FR-7.2 | Should |
    | Erinnerung bei nahendem Zieltermin ohne Fortschritt | 2f | FR-7.3 | Should |
    | Konfigurierbare Kanäle und Schwellen | 2f | FR-7.4 | Could |

**Akzeptanz M2:** Die Datei enthält sechs Abschnitte, jeder mit einleitendem Fließtext und einer
Tabelle, gefolgt von der Übersichtstabelle der offenen Anforderungen.

### M3 — Abschnitt „Entwurfsinhalte ohne Anforderung"

Dieser Abschnitt ist der wertvollste des Dokuments, weil er die häufigste Tutorfrage vorwegnimmt:
„Warum haben Sie das nicht gebaut?" Die Antwort lautet in diesen Fällen nicht „keine Zeit", sondern
„war nie gefordert" — und das lässt sich belegen, weil
`docs/01_Funktionale_Anforderungen.md` diese Punkte schlicht nicht enthält.

**Schritt 3.1.** Einen Abschnitt anlegen, der in Fließtext erklärt, dass die Entwürfe früh
entstanden sind und dabei Ideen aufgenommen haben, die nie in die abgenommene Anforderungsliste
eingegangen sind. Danach die Punkte einzeln benennen, jeweils mit einem Satz, warum sie draußen
bleiben:

- **Semesterauswahl** („Semester WS 26/27" in der Kopfzeile aller sechs Entwürfe). Der
  Sechs-Monats-Horizont aus FR-1.1 und FR-2.1 ist an Datumsangaben gebunden, nicht an Semester.
  Eine Semesterverwaltung wäre eine zusätzliche Entität ohne Anforderung.
- **Modul als eigene Entität** (Seitenleiste „Module" mit „+ Modul hinzufügen" in
  `2a-dashboard.html`). Im Code trägt das Lernziel den Modulnamen als Freitext
  (`module_name` in `backend/app/models/goal.py`). FR-1.2 verlangt „zugeordnetes Modul/Kurs" — ein
  Textfeld erfüllt das. Eine eigene Tabelle hätte eine Verwaltungsoberfläche gebraucht, für die
  keine Anforderung existiert. Hinweis: `docs/05_Datenmodell.md` beschreibt noch eine Tabelle
  `modules`; das ist Zielbild, nicht Ist-Stand.
- **Kalenderraster** (Wochenraster in `2a-dashboard.html`, Monatsraster in `2d-detailplanung.html`).
  FR-3.1 verlangt, dass sich Slots mit Tag, Uhrzeit, Dauer und Modul planen lassen — nicht, in
  welcher Form sie angezeigt werden. Die Liste erfüllt die Anforderung.
- **Exportfunktion** („Export" in `2e-auswertung.html`). Kommt in keiner Anforderung vor. Die
  offene Frage am Ende von `docs/01_Funktionale_Anforderungen.md` nach einer Kalenderkopplung
  (iCal) ist bis heute unbeantwortet und wurde nicht zur Anforderung erhoben.
- **Auswertung nach Tageszeit und Fokusquote** („Wann lernst du?", „93 % Fokusquote" in
  `2e-auswertung.html`). FR-6.3 verlangt eine Auswertung über den Zeitverlauf, um Trends zu
  erkennen — eine Aufschlüsselung nach Tageszeit ist etwas anderes und nicht gefordert.
- **Ruhezeiten, Wochenrückblick, Urlaubsaussetzung** (`2f-erinnerungen.html`). FR-7.4 nennt
  ausschließlich konfigurierbare **Kanäle** (In-App, E-Mail) und hat die Priorität Could.
- **Puffertage** („Puffertag" im Wochenkalender von `2a-dashboard.html`). Keine Anforderung.

**Akzeptanz M3:** Für jeden dieser sieben Punkte steht im Dokument, was der Entwurf zeigt und
welche Anforderung ihn **nicht** deckt.

### M4 — Bekannte Abweichungen und Empfehlung zur Restarbeit

**Schritt 4.1.** Einen Abschnitt „Bekannte Abweichungen" anlegen mit genau zwei Punkten:

Der **ECTS-Faktor**: Die Entwürfe rechnen mit 25 Stunden je ECTS-Punkt
(`2c-grobplanung.html`: „1 ECTS ≈ 25 h Workload", „30 ECTS · 6 Monate" für 750 Stunden;
`2b-lernziele.html`: „6 ECTS × 25 h" für 150 Stunden). Die Anwendung rechnet mit 30 Stunden
(`MINUTES_PER_ECTS = 30 * 60` in `backend/app/routes/dashboard.py`, dieselbe Zahl in
`frontend/src/app/features/goals/goals.ts` und in `README.md`). Es gilt der Code: 30 Stunden
entsprechen der an der IU üblichen Rechnung „5 ECTS = 150 Stunden". Teamentscheidung vom
2026-08-17.

Die **zurückgestellte visuelle Umsetzung**: Farben, Schriften und die Navigationsleiste der
Entwürfe sind bewusst nicht übernommen. Teambeschluss vom 04.08.2026, festgehalten in `AGENTS.md`
und `README.md`. Die Entwürfe bleiben verbindlich für Felder, Beschriftungen und Reihenfolge.

**Schritt 4.2.** Einen Abschnitt „Empfehlung für die Restarbeit" anlegen. Er ordnet die offenen
Punkte aus M2 in eine begründete Reihenfolge:

Zuerst **FR-2.1 vollständig machen**, also das Wochenbudget je Modul aus dem ECTS-Workload
ableiten und anzeigen. Es ist die einzige verbleibende Must-Anforderung und zugleich die
Voraussetzung für zwei weitere: FR-2.2 (automatische Aufteilung) braucht ein Budget, das sich
aufteilen lässt, und FR-3.3 (Abweichung je Woche) braucht einen Sollwert, gegen den es vergleichen
kann. Ohne FR-2.1 hängen beide in der Luft.

Danach das **Should-Bündel FR-6.3, FR-7.2 und FR-7.3**. Alle drei kommen mit Daten aus, die bereits
in der Datenbank stehen — erfasste Sessions, geplante Slots, Zieldaten der Lernziele — und brauchen
keine neue Tabelle und keine Migration. FR-6.3 (Diagramm über den Zeitverlauf) ist dabei der
größte Posten, weil eine Diagrammbibliothek hinzukommt; FR-7.2 und FR-7.3 sind Erweiterungen der
Erinnerungslogik, die in `backend/app/routes/dashboard.py` bereits existiert und dort nur um zwei
weitere Auslöser ergänzt werden müsste.

Die **Could-Anforderungen** FR-2.3, FR-4.4, FR-5.3, FR-6.4 und FR-7.4 bleiben offen. Sie sind
laut der im Kickoff abgenommenen Priorisierung nicht abgabekritisch. Im Projektbericht werden sie
als bewusst zurückgestellt begründet, nicht als vergessen.

**Akzeptanz M4:** Das Dokument nennt beide bekannten Abweichungen mit Belegstelle und enthält eine
begründete Reihenfolge für die Restarbeit.

### M5 — Verlinkung und Endkontrolle

**Schritt 5.1.** In `README.md` in der Tabelle im Abschnitt „Dokumentation im Repo" eine Zeile
ergänzen:

    | [`docs/Anforderungsabgleich_Mockups.md`](docs/Anforderungsabgleich_Mockups.md) | Abgleich der Gestaltungsentwürfe mit Anforderungen und Umsetzung; was fehlt und warum |

**Schritt 5.2.** Im Absatz „Zu den Gestaltungsentwürfen" desselben Dokuments einen Satz ergänzen,
der auf das neue Dokument verweist — dort sucht ein Leser den Zusammenhang zuerst.

**Schritt 5.3.** Endkontrolle. Jede Aussage im neuen Dokument muss belegt sein. Stichproben:

- Jede genannte Anforderungsnummer in `docs/01_Funktionale_Anforderungen.md` nachschlagen und
  Priorität und Wortlaut prüfen.
- Jede genannte Codestelle öffnen und prüfen, ob sie noch existiert und das tut, was behauptet
  wird. Besonders `backend/app/routes/dashboard.py` (ECTS-Faktor, Erinnerungslogik) und
  `frontend/src/app/app.routes.ts` (welche Seiten es gibt).
- Jede genannte Entwurfsdatei öffnen und prüfen, ob das zitierte Element wirklich darin vorkommt.

**Schritt 5.4.** Prüfen, dass nichts am Code angefasst wurde:

    git status --short

Erwartet: Es erscheinen ausschließlich `docs/Anforderungsabgleich_Mockups.md`, `README.md` und
dieser ExecPlan. Taucht eine Datei unter `backend/` oder `frontend/` auf, wurde versehentlich mehr
geändert als vorgesehen — dann prüfen und zurücknehmen.

**Akzeptanz M5:** `README.md` verlinkt das neue Dokument; `git status --short` zeigt nur
Dokumentationsdateien.

## Validation and Acceptance

Dieser Plan liefert ein Dokument, keinen Code. Die Abnahme ist deshalb eine Lesekontrolle, kein
Testlauf. Sie gilt als bestanden, wenn eine Person, die dieses Projekt nicht kennt, das Dokument
liest und danach diese vier Fragen beantworten kann:

1. Welche Bildschirme zeigen die Entwürfe, und welche davon gibt es in der Anwendung?
2. Welche Anforderung ist noch offen und hat die Priorität Must? (Erwartete Antwort: FR-2.1,
   teilweise — das Wochenbudget je Modul fehlt.)
3. Warum gibt es keine Semesterauswahl? (Erwartete Antwort: weil sie in keiner Anforderung
   vorkommt.)
4. Rechnet die Anwendung mit 25 oder mit 30 Stunden je ECTS-Punkt, und warum weicht der Entwurf
   davon ab? (Erwartete Antwort: 30 Stunden, Teamentscheidung vom 2026-08-17; die Entwürfe sind in
   diesem Punkt überholt.)

Zusätzlich formal:

    git status --short

Erwartet: nur Dateien unter `docs/` und `README.md`.

Ein Merge nach `main` erfolgt erst nach Review durch ein anderes Teammitglied. Für ein reines
Dokumentations-Änderungspaket führt die GitHub-Actions-Pipeline zwar dieselben Jobs aus, es ändert
sich aber nichts an ihrem Ergebnis — sie muss trotzdem grün sein.

## Idempotence and Recovery

Alle Schritte sind gefahrlos wiederholbar. Es wird eine neue Datei angelegt und eine Zeile in
`README.md` ergänzt; beides ist über Git jederzeit zurücknehmbar
(`git checkout -- README.md`, `rm docs/Anforderungsabgleich_Mockups.md`).

Ein Risiko besteht nur darin, das Dokument auf einem veralteten Stand zu schreiben. Dagegen hilft
M1: Wer die Anwendung nicht gestartet und die Entwürfe nicht angesehen hat, hat den ersten
Meilenstein nicht erfüllt, unabhängig davon, wie fertig das Dokument aussieht.

## Artifacts and Notes

Hier gehören die Belege hinein, sobald die Arbeit läuft. Nützlich sind:

- Bildschirmfotos der vier gebauten Seiten neben den zugehörigen Entwürfen. Sie sind im
  Projektbericht direkt verwendbar und machen die Abgleichtabellen für Außenstehende überprüfbar.
- Die Ausgabe von `ls docs/ExecPlans/completed/` als Beleg, auf welchem Stand der Pläne P4 und P5
  das Dokument beruht.
- Die Ausgabe von `git status --short` am Ende, als Beleg, dass kein Anwendungscode verändert wurde.

## Interfaces and Dependencies

Dieser Plan führt keine Bibliothek ein, ändert keine Schnittstelle und fasst keine Datei unter
`backend/` oder `frontend/` an.

Neue Datei: `docs/Anforderungsabgleich_Mockups.md`.

Geänderte Datei: `README.md` (zwei Ergänzungen im Abschnitt „Dokumentation im Repo").

Gelesen, aber nicht verändert werden: `docs/01_Funktionale_Anforderungen.md`, die sechs Dateien in
`docs/design-reference/html/`, `AGENTS.md`, `backend/app/routes/dashboard.py`,
`frontend/src/app/app.routes.ts` und `docs/05_Datenmodell.md`.

Nicht angefasst wird `Aufgabenstellung_Projektbericht_ISEF01.md`. Das ist die Aufgabenstellung der
IU und autoritativ.

## Änderungsnotizen

- 2026-08-17: Plan angelegt. Anlass ist eine Prüfung des Repositories gegen
  `docs/01_Funktionale_Anforderungen.md` und die sechs Gestaltungsentwürfe, die ergeben hat, dass
  die Differenz zwischen Entwurf und Umsetzung nirgends dokumentiert ist. Der vollständige Befund
  ist in `Concrete Steps`, M2 hinterlegt, damit dieser Plan auch dann ausführbar bleibt, wenn die
  ursprüngliche Analyse nicht mehr vorliegt; M1 verlangt trotzdem eine eigene Nachprüfung. Zwei
  verwandte Arbeiten liegen in eigenen Plänen:
  `2026-08-17_P4-Defekte-und-Luecken-umgesetzter-Anforderungen.md` behebt Defekte in umgesetzten
  Anforderungen, `2026-08-17_P5-FR-3.2-Zwischenziele.md` setzt die letzte offene
  Must-Anforderung um. Beide sind vor diesem Plan umzusetzen, weil dieses Dokument den Stand
  **nach** ihnen beschreibt.

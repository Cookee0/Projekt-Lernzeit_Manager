# Abgleich: Gestaltungsentwürfe, Anforderungen, Umsetzung

Dieses Dokument stellt die sechs Gestaltungsentwürfe aus `docs/design-reference/html` dem
tatsächlichen Stand der Anwendung gegenüber und ordnet jede Abweichung einer Anforderung aus
`docs/01_Funktionale_Anforderungen.md` zu — oder stellt fest, dass es keine gibt.

Es beantwortet drei Fragen: Was zeigen die Entwürfe, das gebaut ist? Was zeigen sie, das noch
fehlt und einer Anforderung entspricht? Und was zeigen sie, das nie Anforderung war und deshalb
bewusst nicht gebaut wird?

Zwei Vorbemerkungen sind für das Verständnis nötig. Erstens: Die Entwürfe sind laut Teambeschluss
vom 04.08.2026 verbindlich für Felder, Beschriftungen und Reihenfolge, nicht für Farben, Schriften
und Navigationsleiste. Eine Abweichung im Aussehen ist deshalb keine Lücke. Zweitens: Die Entwürfe
zeigen den Endausbau über alle sieben Anforderungsgruppen hinweg, nicht den Prototyp für den
Meilenstein MS4. Wer sie als Abnahmekriterium liest, misst gegen ein Ziel, das für MS4 nie gesetzt
war.

Der Stand, gegen den hier abgeglichen wird, ist der Stand **nach** Abschluss der Pläne
[`P4`](ExecPlans/completed/2026-08-17_P4-Defekte-und-Luecken-umgesetzter-Anforderungen.md),
[`P5`](ExecPlans/completed/2026-08-17_P5-FR-3.2-Zwischenziele.md) und
[`P7`](ExecPlans/completed/2026-08-17_P7-Restarbeit-Must-und-Should-Anforderungen.md); Plan P7
hat die in der Erstfassung dieses Dokuments benannte Restarbeit (FR-2.1 sowie alle offenen
Should-Punkte) umgesetzt. Offen sind seither nur noch die bewusst zurückgestellten
Could-Anforderungen.

## Übersicht (`2a-dashboard.html`)

Der Entwurf zeigt eine Seitenleiste mit Modulliste und Wochenbudgets, eine Wochenansicht mit
Kalenderraster, Kennzahlen für geplante und erfasste Zeit, ungestörte Zeit und Abweichung, eine
aktive Session mit Stoppuhr, eine Erinnerungskarte, die Zwischenziele des Monats und die letzten
Sessions.

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| Kennzahlen geplant/erfasst für den laufenden Monat | Ja | FR-6.1 | `GET /api/dashboard`, `current_month` |
| Fortschrittsbalken je Lernziel | Ja | FR-6.2 | Ampelfarben je nach Prozentwert |
| Erinnerungskarte | Ja | FR-7.1 | Zwei Auslöser: heute geplant/nicht gelernt, 3 Tage Inaktivität |
| Hinweis auf laufende Session mit Sprung zum Timer | Ja | FR-4.1 | `active_session` im Dashboard-Antwort |
| Zähler Zwischenziele des Monats | Ja | FR-3.2 | Seit Plan P5, Kachel „Zwischenziele \<Monat\>" |
| Wochenbudgets je Modul | Ja | FR-2.1 | Seit Plan P7: „Budget: X/Woche" auf den Lernziel-Karten und in der Grobplanungstabelle der Planungsseite; die Seitenleisten-Form des Entwurfs ist reine Darstellung |
| Wochenkalenderraster | Nein | — | Keine Anforderung, reine Darstellungsform |
| „Ungestörte Zeit" als eigene Kennzahl | Ja | FR-4.3 (Darstellung) | Seit Plan P7: Kacheln „Ungestört gelernt" und „Pausen"; die gezählte Lernzeit war schon immer die Zeit ohne Pausen |
| Knopf „Nacherfassen" | Nein | FR-4.4 (Could) | Nicht implementiert |
| Semesterauswahl | Nein | — | Keine Anforderung, siehe Abschnitt „Entwurfsinhalte ohne Anforderung" |

## Lernziele (`2b-lernziele.html`)

Der Entwurf zeigt eine Tabelle mit Titel, Modul, Zieldatum, Priorität und Fortschritt, Filter nach
Status, einen Bearbeiten-Dialog mit Notiz-/Ergebnisfeld und eine Karte „Erreichte Ziele" mit Noten.

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| Anlegen eines Lernziels | Ja | FR-1.1 | |
| Titel, Zieldatum, Modul, Status | Ja | FR-1.2 | |
| Bearbeiten (Titel, Modul, ECTS, Zieldatum, Status, Priorität) | Ja | FR-1.3 | Seit Plan P4 |
| Priorität | Ja | FR-1.4 | |
| Löschen | Ja | FR-1.3 | Dialog nennt seit P4 die mitgelöschte Lernzeit |
| Note und Ergebnis-Notiz | Ja | FR-5.2 | Seit Plan P4 |
| Statusfilter „Alle / Offen / In Arbeit / Erreicht" | Nein | — | Keine eigene Anforderung; FR-5.3 verlangt eine Historie, keine Filter |
| Fortschrittswert je Ziel in dieser Tabelle | Nein | — | Steht bereits auf dem Dashboard (FR-6.2) |
| Eigene Ansicht „Vollständige Historie über das gesamte Studium" | Nein | FR-5.3 (Could) | Nicht implementiert |
| Darstellung als Tabelle statt als Karten | Nein | — | Reine Gestaltung, zurückgestellt laut Teambeschluss |

## Grobplanung (`2c-grobplanung.html`)

Der Entwurf zeigt eine eigene Seite mit Gesamt-Workload aus ECTS, einem Wochendurchschnitt, einer
Zeitachse über sechs Monate, einer Tabelle „Automatische Aufteilung auf Monate" und einem Block
„Abwesenheiten & Feiertage".

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| ECTS-Workload je Lernziel als Bezugsgröße | Ja | FR-2.1 | `MINUTES_PER_ECTS` in `backend/app/workload.py` (seit Plan P7 dort) |
| Lernzeit ohne festen Tag für einen ganzen Monat einplanen | Ja | FR-2.1 (faktisch) | `plan_slots.day = NULL`; Seite heißt nicht „Grobplanung", leistet es aber |
| Wochenbudget je Modul | Ja | FR-2.1 (Must) | Seit Plan P7: Restaufwand (ECTS-Workload minus gelernte Zeit) je verbleibender Woche bis zum Zieldatum |
| Automatische Aufteilung des Workloads auf Monate/Wochen | Ja | FR-2.2 (Should) | Seit Plan P7 als berechneter Vorschlag (`GET /api/plans/proposal`); Slots legt er bewusst nicht an — der Vorschlag bleibt manuell anpassbar |
| Berücksichtigung von Urlaub und Feiertagen | Nein | FR-2.3 (Could) | Nicht implementiert |
| Zeitachse als Darstellungsform | Nein | — | Keine Anforderung |
| Eigene Seite für Grobplanung | Nein | — | Grob- und Detailplanung teilen sich `/planning` und die Tabelle `plan_slots` |

## Detailplanung (`2d-detailplanung.html`)

Der Entwurf zeigt einen Monatskalender mit Slots je Tag, einen Dialog „Neuer Lernzeit-Slot" mit
Tag, Uhrzeit und Dauer, einen Block „Abweichung zur Grobplanung" je Kalenderwoche und die
Zwischenziele des Monats.

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| Slot anlegen mit Tag, Uhrzeit, Dauer, Lernziel | Ja | FR-3.1 | |
| Liste der geplanten Lernzeiten | Ja | FR-3.1 | |
| Monatsfilter | Ja | FR-3.1 | |
| Block „Zwischenziele" mit Zähler und Abhaken | Ja | FR-3.2 | Seit Plan P5 |
| Kalenderdarstellung als Monatsraster | Nein | — | Keine Anforderung; die Liste erfüllt FR-3.1 vollständig |
| Abweichung zur Grobplanung | Ja | FR-3.3 (Should) | Seit Plan P7: Abweichung geplant gegen Monatsvorschlag je Ziel auf der Planungsseite; die Aufschlüsselung je Kalenderwoche des Entwurfs ist Darstellungsform |
| Knopf „Aus Grobplanung füllen" | Nein | — | Folge von FR-2.2, nicht implementiert |
| Kennzeichnung von Feiertagen | Nein | FR-2.3 (Could) | Nicht implementiert |

## Auswertung (`2e-auswertung.html`)

Der Entwurf zeigt eine eigene Seite mit Kennzahlen, einem Balkendiagramm „Lernzeit pro Woche" mit
Plan-Linie, einer Tabelle „Plan vs. Ist je Modul" mit Ampelstatus, einer Aufstellung „Plan vs. Ist
je Monat" über sechs Monate, den erreichten Zielen mit Noten und einer Auswertung nach Tageszeit.

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| Vergleich geplant gegen erfasst (laufender Monat) | Ja | FR-6.1 | Auf dem Dashboard, nicht auf eigener Seite |
| Fortschritt je Lernziel mit Ampelfarben | Ja | FR-6.2 | Auf dem Dashboard |
| Diagramm über den Zeitverlauf | Ja | FR-6.3 (Should) | Seit Plan P7: Balkendiagramm „Lernzeit der letzten 8 Wochen" auf dem Dashboard, eigenes SVG ohne Diagrammbibliothek |
| Vergleich Plan gegen Ist über volle sechs Monate | Nein | FR-6.4 (Could) | Nicht implementiert |
| Eigene Auswertungsseite | Nein | — | Keine Anforderung — FR-6.1 verlangt „Dashboard/Übersicht" |
| Exportfunktion | Nein | — | Keine Anforderung |
| Auswertung nach Tageszeit / Fokusquote | Nein | — | Keine Anforderung |

## Erinnerungen (`2f-erinnerungen.html`)

Der Entwurf zeigt eine eigene Seite mit einer Liste offener Erinnerungen, einem Regelwerk mit
einstellbaren Schwellen, einer Kanalauswahl (In-App, E-Mail, Desktop-Push), Ruhezeiten und einer
Vorschau.

| Element im Entwurf | umgesetzt? | Anforderung | Bemerkung |
|---|---|---|---|
| Erinnerung bei versäumter Lernzeit | Ja | FR-7.1 (Must) | Zwei Auslöser: heute geplant/nicht gelernt, 3 Tage Inaktivität; als Hinweis auf dem Dashboard |
| Erinnerung vor einem geplanten Slot | Ja | FR-7.2 (Should) | Seit Plan P7: Hinweis auf dem Dashboard ab 60 Minuten vor Beginn; im Browser berechnet, weil die Slot-Uhrzeit Ortszeit ist |
| Erinnerung bei nahendem Zieltermin ohne Fortschritt | Ja | FR-7.3 (Should) | Seit Plan P7: Warnung bei Zieldatum in ≤ 14 Tagen und Fortschritt < 50 % |
| Konfigurierbare Kanäle | Nein | FR-7.4 (Could) | Nicht implementiert |
| Einstellbare Schwellen | Nein | FR-7.4 (Could) | Nicht implementiert |
| Ruhezeiten und Wochenrückblick | Nein | — | Keine Anforderung |
| Eigene Erinnerungsseite | Nein | — | Keine Anforderung — FR-7.1 verlangt nur, dass die Nutzerin eine Erinnerung erhält |

## Übersicht: Was noch fehlt

Seit Plan P7 sind alle Must- und Should-Anforderungen umgesetzt. Offen sind nur noch die
Could-Anforderungen — bewusst zurückgestellt, nicht vergessen:

| Offen | Entwurf | Anforderung | Priorität |
|---|---|---|---|
| Urlaub und Feiertage aus dem Budget rechnen | 2c, 2d | FR-2.3 | Could |
| Nacherfassen einer Lernzeit ohne Timer | 2a, 2f | FR-4.4 | Could |
| Historie aller erreichten Ziele als eigene Ansicht | 2b, 2e | FR-5.3 | Could |
| Plan gegen Ist über die vollen sechs Monate | 2c, 2e | FR-6.4 | Could |
| Konfigurierbare Kanäle und Schwellen | 2f | FR-7.4 | Could |

## Entwurfsinhalte ohne Anforderung

Die Entwürfe sind früh entstanden und haben dabei Ideen aufgenommen, die nie in die im Kickoff
abgenommene Anforderungsliste eingegangen sind. Für jeden der folgenden Punkte gilt: Er fehlt
nicht aus Zeitmangel, sondern weil `docs/01_Funktionale_Anforderungen.md` ihn schlicht nicht
verlangt — das lässt sich an der Anforderungsdatei selbst nachprüfen.

- **Semesterauswahl** („Semester WS 26/27" in der Kopfzeile aller sechs Entwürfe). Der
  Sechs-Monats-Horizont aus FR-1.1 und FR-2.1 ist an Datumsangaben gebunden, nicht an Semester.
  Eine Semesterverwaltung wäre eine zusätzliche Entität ohne Anforderung.
- **Modul als eigene Entität** (Seitenleiste „Module" mit „+ Modul hinzufügen" in
  `2a-dashboard.html`). Im Code trägt das Lernziel den Modulnamen als Freitext (`module_name` in
  `backend/app/models/goal.py`). FR-1.2 verlangt „zugeordnetes Modul/Kurs" — ein Textfeld erfüllt
  das. Eine eigene Tabelle hätte eine Verwaltungsoberfläche gebraucht, für die keine Anforderung
  existiert. Hinweis: `docs/05_Datenmodell.md` beschreibt noch eine Tabelle `modules`; das ist
  Zielbild, nicht Ist-Stand.
- **Kalenderraster** (Wochenraster in `2a-dashboard.html`, Monatsraster in
  `2d-detailplanung.html`). FR-3.1 verlangt, dass sich Slots mit Tag, Uhrzeit, Dauer und Modul
  planen lassen — nicht, in welcher Form sie angezeigt werden. Die Liste erfüllt die Anforderung.
- **Exportfunktion** („Export" in `2e-auswertung.html`). Kommt in keiner Anforderung vor. Die
  offene Frage am Ende von `docs/01_Funktionale_Anforderungen.md` nach einer Kalenderkopplung
  (iCal) ist bis heute unbeantwortet und wurde nicht zur Anforderung erhoben.
- **Auswertung nach Tageszeit und Fokusquote** („Wann lernst du?", „93 % Fokusquote" in
  `2e-auswertung.html`). FR-6.3 verlangt eine Auswertung über den Zeitverlauf, um Trends zu
  erkennen — eine Aufschlüsselung nach Tageszeit ist etwas anderes und nicht gefordert.
- **Ruhezeiten, Wochenrückblick, Urlaubsaussetzung** (`2f-erinnerungen.html`). FR-7.4 nennt
  ausschließlich konfigurierbare **Kanäle** (In-App, E-Mail) und hat die Priorität Could.
- **Puffertage** („Puffertag" im Wochenkalender von `2a-dashboard.html`). Keine Anforderung.

## Bekannte Abweichungen

**Der ECTS-Faktor.** Die Entwürfe rechnen mit 25 Stunden je ECTS-Punkt (`2c-grobplanung.html`:
„1 ECTS ≈ 25 h Workload", „30 ECTS · 6 Monate" für 750 Stunden; `2b-lernziele.html`:
„6 ECTS × 25 h" für 150 Stunden). Die Anwendung rechnet mit 30 Stunden
(`MINUTES_PER_ECTS = 30 * 60` in `backend/app/workload.py`, dieselbe Zahl in
`frontend/src/app/features/goals/goals.ts` und in `README.md`). Es gilt der Code: 30 Stunden
entsprechen der an der IU üblichen Rechnung „5 ECTS = 150 Stunden". Teamentscheidung vom
2026-08-17.

**Die zurückgestellte visuelle Umsetzung.** Farben, Schriften und die Navigationsleiste der
Entwürfe sind bewusst nicht übernommen. Teambeschluss vom 04.08.2026, festgehalten in `AGENTS.md`
und `README.md`. Die Entwürfe bleiben verbindlich für Felder, Beschriftungen und Reihenfolge.

## Empfehlung für die Restarbeit

Die in der Erstfassung dieses Dokuments empfohlene Restarbeit ist mit Plan P7 (2026-08-17)
erledigt: FR-2.1 (Wochenbudget je Modul) zuerst, darauf aufbauend FR-2.2 und FR-3.3, dazu die
Should-Punkte FR-4.3 (Darstellung), FR-6.3, FR-7.2 und FR-7.3. Wie erwartet kamen alle Punkte
ohne neue Tabelle und ohne Migration aus; das Diagramm für FR-6.3 brauchte entgegen der
ursprünglichen Vermutung keine Diagrammbibliothek, sondern ist ein eigenes SVG (Begründung im
Decision Log von `ExecPlans/completed/2026-08-17_P7-Restarbeit-Must-und-Should-Anforderungen.md`).

Die **Could-Anforderungen** FR-2.3, FR-4.4, FR-5.3, FR-6.4 und FR-7.4 bleiben offen. Sie sind laut
der im Kickoff abgenommenen Priorisierung nicht abgabekritisch. Im Projektbericht werden sie als
bewusst zurückgestellt begründet, nicht als vergessen.

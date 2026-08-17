# Datenmodell-Konzept – Lernzeit-Manager

Konzeptioneller Entwurf der Datenbankstruktur für den vollen Funktionsumfang aus
[`01_Funktionale_Anforderungen.md`](01_Funktionale_Anforderungen.md). Grundlage sind die
Anforderungen FR-1 bis FR-7 und die Gestaltungsentwürfe in
[`design-reference/html/`](design-reference/html/), die für Felder, Beschriftungen und Reihenfolge
verbindlich sind.

**Status: Konzept, nicht umgesetzt.** Implementiert ist bisher ausschließlich die Tabelle `goals`
in ihrer FR-1-Form (`backend/app/models/goal.py`). Dieses Dokument beschreibt das Zielbild und den
Weg dorthin; es ist kein ExecPlan. Jede tatsächliche Schema-Änderung braucht weiterhin einen
eigenen ExecPlan nach [`PLANS.md`](PLANS.md) und eine Alembic-Migration.

Sprachkonvention wie im bestehenden Code: **Bezeichner (Tabellen, Spalten, Statuswerte) englisch,
Fließtext und Oberfläche deutsch.** Die vorhandene Tabelle `goals` mit den Spalten `title`,
`module`, `target_date`, `status` folgt dieser Konvention bereits.

---

## 1. Leitentscheidungen

Diese elf Entscheidungen prägen das gesamte Modell.

**1. `module` wird eine eigene Tabelle, kein Freitextfeld.** Heute steht das Modul als Zeichenkette
am Lernziel. Die Entwürfe behandeln ein Modul aber als eigenständiges Objekt: Es hat ECTS-Punkte,
daraus abgeleiteten Workload, erscheint als Auswahlliste im Zielformular, als Liste mit
„+ Modul hinzufügen" im Dashboard und als Zeile in Grobplanung und Auswertung. Ohne eigene Tabelle
gibt es keinen Ort für die ECTS – und damit keine Grundlage für FR-2.1. Das ist die zentrale
Änderung gegenüber dem Ist-Zustand.

**2. Kein Nutzerbezug in dieser Ausbaustufe.** Die Authentifizierung ist laut
[`04_Tech-Stack_und_Tools.md`](04_Tech-Stack_und_Tools.md) noch offen; die Anwendung ist bis auf
Weiteres einbenutzerfähig. Deshalb enthält keine Tabelle eine Spalte `user_id`. Der Nachrüstweg ist
bewusst offengehalten: Wenn Auth kommt, erhält jede Tabelle eine Spalte `user_id` als
Fremdschlüssel auf `users`, die Migration füllt sie bei bestehenden Zeilen mit der ID des ersten
angelegten Kontos und setzt sie danach auf `NOT NULL`. Alle Unique-Bedingungen dieses Dokuments
müssen dann um `user_id` erweitert werden – die betroffenen Stellen sind unten jeweils vermerkt.

**3. Lernziele haben keine Unterziele.** Ein Modul hat Lernziele, und unter einem Lernziel liegt
keine weitere Ebene. Die Zerlegung eines großen Vorhabens in kleine Arbeitspakete leistet FR-3.2
mit den Zwischenzielen („Kapitel 3 abschließen"), die an Modul und Monat hängen. Eine zusätzliche
Selbstreferenz in `goals` wäre eine dritte Ebene für dieselbe Aufgabe: Keine der Anforderungen
FR-1.1 bis FR-1.4 nennt Unterziele, und kein Gestaltungsentwurf zeigt sie – die Zieltabelle in
`design-reference/html/2b-lernziele.html` enthält ausschließlich Zeilen derselben Ebene. Mit dieser
Entscheidung entfällt außerdem eine Regel, die die Datenbank ohnehin nicht durchsetzen könnte
(„ein Unterziel darf keine eigenen Unterziele haben"), und die Fortschrittsrechnung braucht nur
einen statt zwei Fälle.

**4. Eine Lernsession verweist auf Modul *und* Ziel.** `module_id` ist Pflicht, `goal_id` optional.
FR-4.2 lässt beides zu („einem Lernziel/Modul zugeordnet"); die Auswertung nach Modul (FR-6.1) darf
keine Lücken haben, während nicht jede Lernzeit sich sinnvoll einem bestimmten Ziel zuordnen lässt.
Ist `goal_id` gesetzt, muss das Ziel zum selben Modul gehören – das prüft die Anwendungsschicht.

**5. Semester ist eine echte Entität.** Die Kopfzeile aller Entwürfe zeigt einen Umschalter
„Semester WS 26/27", und die Grobplanung spannt genau einen Zeitraum („Aug 2026 – Jan 2027") auf.
Der Sechs-Monats-Horizont aus FR-1.1 und FR-2.1 ist damit kein rollierendes Fenster, sondern ein
benanntes Semester mit Start- und Enddatum. Module hängen an einem Semester. Am Semester hängt
außerdem die selbst angegebene Wochenkapazität, gegen die der „Kapazitätscheck" der Grobplanung
rechnet („Verfügbar (eigene Angabe) 35,0 h · 6,2 h Puffer pro Woche") – sie ist eine Aussage über
ein bestimmtes Halbjahr, nicht über die Person im Allgemeinen.

**6. Workload = ECTS × 25 Stunden, überschreibbar.** Der Kickoff-Beschluss zu FR-2.1 legt die
ECTS-Punkte als Grundlage fest, die Grobplanung nennt „1 ECTS ≈ 25 h · manuell überschreibbar".
Gespeichert wird deshalb `ects`; die Stundenzahl wird berechnet. Die Spalte `workload_hours` ist
optional und übersteuert die Rechnung, wenn sie gesetzt ist. Der Faktor 25 ist eine Konstante im
Backend, keine Konfigurationstabelle – er ist die IU-weite Regel und ändert sich nicht pro Nutzer.

**7. Nichts wird gespeichert, was sich berechnen lässt.** Für die Auswertung (FR-6) gibt es keine
eigene Tabelle. Erfasste Stunden, Planerfüllung, Fortschrittsprozente und Ampelstatus sind
Aggregate über `sessions` und `plan_entries` und werden bei der Abfrage berechnet. Gespeicherte
Fortschrittswerte würden bei jeder nachträglichen Korrektur einer Session veralten. Aus demselben
Grund gibt es keinen Slot-Status „verfallen": Dass ein geplanter Slot verstrichen ist, ohne dass
Lernzeit darauf erfasst wurde, ergibt sich aus dem Slot-Datum und dem Fehlen einer Session und
müsste sonst von einem Hintergrundprozess nachgetragen werden, den es nicht gibt.

**8. Die Grobplanung wird in Kalenderwochen gespeichert, Monate werden daraus berechnet.** Die
Entwürfe zeigen in der Grobplanung einen Umschalter „Monate / Wochen" über *einem* Budget, nicht
zwei getrennte Datenbestände: Die Monatstabelle summiert sich auf dieselben 750 Stunden, die die
Zeitachse als Wochenbudgets ausweist. Würde man beide Granularitäten nebeneinander speichern,
wären dieselben Stunden doppelt in der Datenbank, und es bliebe offen, was mit einer von Hand
geänderten Monatszelle geschieht, sobald jemand auf „Wochen" umschaltet und „Neu berechnen"
drückt. Die Woche ist dabei die operative Einheit – FR-2.1 nennt ausdrücklich das „Wochenbudget
pro Modul", das Dashboard zeigt Wochenbudgets, die Detailplanung vergleicht Kalenderwochen –,
während der Monat nur Überblick ist. Damit eine Woche, die zwei Monate berührt, nicht aufgeteilt
werden muss, gilt die Regel: **Eine Kalenderwoche zählt zu dem Monat, in dem ihr Montag liegt.**

**9. Zeitstempel in UTC, eine hinterlegte Zeitzone, Beträge als `numeric`.** Alle Zeitstempel sind
`timestamptz` und werden in UTC gespeichert, alle reinen Datumsangaben `date`, geplante Uhrzeiten
`time` als lokale Wanduhrzeit. Session-Dauern werden nicht gespeichert, sondern aus `started_at`
und `ended_at` berechnet. Damit UTC-Zeitstempel und lokale Planungszeiten überhaupt vergleichbar
sind, hinterlegt die Anwendung genau eine Zeitzone in der Einstellungstabelle, Vorgabe
`Europe/Berlin`. Ohne sie ließe sich weder „Nächster Slot in 15 Minuten" zuverlässig auslösen noch
die Auswertung „Wann lernst du? Morgen / Mittag / Abend / Nacht" bilden, und die Umstellung auf
Winterzeit Ende Oktober – mitten im Beispielsemester der Entwürfe – würde jede Slot-Erinnerung um
eine Stunde verschieben. Stundenbeträge werden als `numeric` gespeichert. `numeric` ist ein exakter
Dezimaltyp, kein Fließkommatyp; 2,2 h sind darin exakt 2,2 h, sodass sich Wochenbudgets
verlustfrei zu Monats- und Semestersummen addieren.

**10. Erinnerungen werden beim Abruf ausgewertet, nicht von einem Hintergrundprozess erzeugt.**
Die Bedingungen aus FR-7.1 („keine erfasste Lernzeit trotz Planung") und FR-7.3 („nahender
Zieltermin ohne Fortschritt") sind reine Abfragen über `study_slots`, `sessions` und `goals`. Ruft
das Frontend die Erinnerungen ab, prüft das Backend die aktiven Regeln und legt fehlende Hinweise
in `notifications` an; eine Spalte `dedupe_key` verhindert, dass dabei bei jedem Abruf dieselbe
Erinnerung erneut entsteht. Damit braucht der Must-Umfang weder einen Scheduler noch einen
Versanddienst. Der Preis ist bewusst in Kauf genommen: Eine reine In-App-Erinnerung erreicht nur,
wer die Anwendung öffnet, was bei einer Inaktivitätswarnung ein wenig widersinnig ist. FR-7.1
verlangt keinen bestimmten Kanal, und der Entwurf `2a-dashboard.html` zeigt den Hinweis genau so –
als Kachel im Dashboard. E-Mail und Desktop-Push gehören zu FR-7.4 (Could) und ziehen zusätzliche
Infrastruktur nach sich; siehe Abschnitt 7.

**11. Statuswerte als `varchar` mit `CHECK`, nicht als PostgreSQL-`ENUM`.** Grund: Ein `ENUM` um
einen Wert zu erweitern, ist in Alembic deutlich umständlicher als eine geänderte
`CHECK`-Bedingung.

Zusicherungen, die sich nicht als Spaltentyp ausdrücken lassen – „genau ein Semester ist aktiv",
„höchstens eine Session läuft" –, werden als partieller Unique-Index in der Datenbank
festgeschrieben und nicht der Anwendungsschicht überlassen. Ein partieller Index ist ein Index, der
nur für die Zeilen gilt, die eine `WHERE`-Bedingung erfüllen; PostgreSQL kann darüber eine
Eindeutigkeit erzwingen, die für den Rest der Tabelle nicht gilt. Die betroffenen Stellen nennen
den Index jeweils.

---

## 2. Überblick

Zwölf Tabellen, davon elf für Must/Should und eine für die Could-Anforderung FR-2.3.

    settings ── genau eine Zeile, ohne Bezug zu anderen Tabellen

    semesters ──< modules ──< goals
                     ├──< plan_entries
                     ├──< milestones
                     ├──< study_slots
                     └──< sessions ──< session_pauses

    sessions ──> goals (optional)          sessions ──> study_slots (optional)

    reminder_rules ── eine Zeile je Regeltyp
    notifications ──> study_slots (optional), notifications ──> goals (optional)

    Could: absences

Gelesen als Beziehungen:

- Ein Semester hat mehrere Module; ein Modul gehört zu genau einem Semester.
- Ein Modul hat mehrere Lernziele, Wochenbudgets, Lernzeit-Slots, Zwischenziele und Sessions.
- Eine Session gehört zu einem Modul, optional zu einem Ziel und optional zu einem geplanten Slot.
- Eine Session hat beliebig viele Pausen.
- Eine Erinnerung entsteht aus einer Regel und verweist optional auf den Slot oder das Ziel, um das
  es geht.

---

## 3. Entitäten im Detail

### 3.1 `semesters` – Planungszeitraum

Klammert den Sechs-Monats-Horizont, speist den Umschalter in der Kopfzeile und hält die verfügbare
Wochenkapazität für den Kapazitätscheck der Grobplanung (FR-1.1, FR-2.1).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `label` | varchar(50) | nein | Anzeigename, z. B. `WS 26/27` |
| `start_date` | date | nein | erster Tag des Planungszeitraums |
| `end_date` | date | nein | letzter Tag; muss nach `start_date` liegen |
| `weekly_capacity_hours` | numeric(4,1) | ja | selbst angegebene verfügbare Lernzeit pro Woche |
| `is_active` | boolean | nein | genau ein Semester ist aktiv, Vorgabe für neue Ansichten |
| `created_at` | timestamptz | nein | |

Dass höchstens ein Semester aktiv ist, erzwingt ein partieller Unique-Index:
`CREATE UNIQUE INDEX ON semesters ((is_active)) WHERE is_active`. Ist `weekly_capacity_hours` nicht
gesetzt, zeigt die Grobplanung den Kapazitätscheck nicht an, statt mit einem geratenen Wert zu
rechnen.

Nachrüstung Auth: `label` wird zusammen mit `user_id` eindeutig, und der partielle Index gilt dann
je `user_id`.

### 3.2 `modules` – Kurs mit Workload

Trägt die ECTS und ist Bezugspunkt fast aller Auswertungen (FR-2.1, FR-6.1).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `semester_id` | integer FK → `semesters.id` | nein | `ON DELETE RESTRICT` |
| `name` | varchar(100) | nein | z. B. `Datenbanken` |
| `ects` | integer | nein | > 0; Grundlage des Workloads |
| `workload_hours` | numeric(6,2) | ja | manuelle Übersteuerung von `ects × 25` |
| `color` | varchar(20) | ja | Farbmarker in Kalender und Diagrammen |
| `archived` | boolean | nein | abgeschlossene Module ausblenden, ohne Historie zu verlieren |
| `created_at` | timestamptz | nein | |

`name` ist je Semester eindeutig. Löschen eines Moduls mit erfassten Sessions wird nicht erlaubt
(`RESTRICT`) – erfasste Lernzeit ist Historie im Sinne von FR-5.3; stattdessen `archived` setzen.

### 3.3 `goals` – Lernziele

Erweiterung der bestehenden Tabelle um Modulbezug, Priorität und Ergebnisfelder (FR-1.1 bis FR-1.4,
FR-5.1 bis FR-5.3).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | ersetzt das heutige Freitextfeld `module` |
| `title` | varchar(200) | nein | unverändert |
| `target_date` | date | nein | Zieltermin; „Verschieben" (FR-1.3) ändert nur diesen Wert |
| `status` | varchar(20) | nein | `offen`, `in_arbeit`, `erreicht`; Vorgabe `offen` |
| `priority` | varchar(10) | nein | `hoch`, `mittel`, `niedrig`; Vorgabe `mittel` (FR-1.4) |
| `achieved_at` | date | ja | gesetzt beim Wechsel auf `erreicht` (FR-5.1) |
| `grade` | numeric(2,1) | ja | Note, z. B. `1.7` (FR-5.2) |
| `note` | text | ja | Notiz/Ergebnis (FR-5.2) |
| `created_at` | timestamptz | nein | unverändert |

Der Fortschritt eines Lernziels wird nicht gespeichert, sondern bei der Abfrage berechnet: Er ist
das Verhältnis der auf das Modul erfassten ungestörten Lernzeit zum Workload des Moduls. Der
Entwurf `2b-lernziele.html` zeigt genau diese Rechnung („In Arbeit · 55 / 125 h" ergibt 44 %).
Damit ist der Fortschritt eine Kennzahl des **Moduls**, die an jedem seiner Lernziele angezeigt
wird: Hat ein Modul zwei Lernziele, weisen beide denselben Prozentwert aus. Das ist bewusst so.
Eine ziel-eigene Rechnung bräuchte eine Aufteilung des Modul-Workloads auf die einzelnen Ziele, die
keine Anforderung verlangt und die Nutzende von Hand pflegen müssten. Wer sie später doch will,
ergänzt eine Spalte `workload_share` an `goals` und rechnet damit; das Modell muss dafür nicht
umgebaut werden.

Die Historie (FR-5.3) braucht keine eigene Tabelle – sie ist die Abfrage aller Ziele mit
`status = 'erreicht'` über alle Semester, sortiert nach `achieved_at`. Damit sie über das gesamte
Studium reicht, müssen auch abgeschlossene Semester samt ihrer Module in der Datenbank stehen; das
ist gewollt und der Grund, warum `modules` nicht gelöscht, sondern archiviert werden.

### 3.4 `plan_entries` – Grobplanung

Ein Wochenbudget je Modul und Kalenderwoche (FR-2.1, FR-2.2).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE CASCADE` |
| `week_start` | date | nein | Montag der Kalenderwoche |
| `planned_hours` | numeric(6,2) | nein | ≥ 0 |
| `source` | varchar(10) | nein | `auto` = aus ECTS verteilt, `manual` = überschrieben |
| `updated_at` | timestamptz | nein | |

Eindeutig über (`module_id`, `week_start`); dass `week_start` wirklich ein Montag ist, sichert
`CHECK (EXTRACT(ISODOW FROM week_start) = 1)`. Die Monatsansicht der Grobplanung ist eine Summe
über die Wochen, deren Montag in den jeweiligen Monat fällt (Leitentscheidung 8); sie wird nicht
gespeichert. Wird eine Monatszelle von Hand geändert, verteilt die Anwendung die Differenz auf die
Wochen dieses Monats und setzt deren `source` auf `manual`. Eine Neuberechnung („Neu berechnen")
darf Zeilen mit `source = 'manual'` nicht überschreiben.

### 3.5 `study_slots` – Detailplanung

Geplante Lernzeit-Blöcke des laufenden Monats (FR-3.1).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE CASCADE` |
| `slot_date` | date | nein | Tag |
| `start_time` | time | nein | lokale Wanduhrzeit, ausgelegt mit `settings.timezone` |
| `duration_minutes` | integer | nein | > 0 |
| `status` | varchar(15) | nein | `geplant`, `erledigt`; Vorgabe `geplant` |
| `created_at` | timestamptz | nein | |

Der Entwurf `2d-detailplanung.html` zeigt im Slot-Dialog genau Tag, Uhrzeit, Dauer und Modul; mehr
verlangt FR-3.1 nicht, und eine Kopplung an ein Zwischenziel ist deshalb nicht vorgesehen. Der
Status kennt nur `geplant` und `erledigt`: Ein verstrichener Slot ohne Session ist kein
gespeicherter Zustand, sondern das Abfrageergebnis „`slot_date` liegt in der Vergangenheit und es
gibt keine Session mit diesem `slot_id`" (Leitentscheidung 7). Genau darauf setzt die
Inaktivitätserinnerung aus FR-7.1 auf. `erledigt` bleibt eigenständig, damit man einen Slot auch
abhaken kann, ohne den Timer benutzt zu haben.

### 3.6 `milestones` – Zwischenziele

Monatsbezogene Zwischenziele (FR-3.2).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | ja | Entwürfe zeigen auch modulunabhängige Einträge |
| `title` | varchar(200) | nein | z. B. `Kapitel 3 abschließen` |
| `month` | date | nein | Monatserster als Gruppierungsschlüssel |
| `due_date` | date | ja | optionaler Termin innerhalb des Monats |
| `done` | boolean | nein | Vorgabe `false` |
| `created_at` | timestamptz | nein | |

`month` ist der Gruppierungsschlüssel der Monatsansicht und deshalb Pflicht, `due_date` der
optionale Feintermin, den der Entwurf an einzelnen Einträgen zeigt („Datenmodell Projekt fertig ·
15.08."). Damit beide nicht auseinanderlaufen können, gilt
`CHECK (due_date IS NULL OR date_trunc('month', due_date) = month)`.

Abgegrenzt zu `goals`: Zwischenziele sind kurzfristige Arbeitspakete eines Monats ohne Note, ohne
Priorität und ohne Fortschrittsrechnung. Lernziele spannen den Sechs-Monats-Horizont, tragen Note
und Priorität und erscheinen in der Historie. Die beiden nicht zu verschmelzen ist bewusst: FR-3.2
und FR-1.x sind getrennte Anforderungen mit getrennten Oberflächen. Zusammen bilden sie die einzige
Zerlegungshierarchie des Modells – Modul, Lernziel, Zwischenziel (Leitentscheidung 3).

**Abweichung der tatsächlichen Umsetzung (Plan P5, 2026-08-17):** Die Tabelle `modules` aus diesem
Zielbild wurde nie gebaut; `goals` trägt das Modul stattdessen als Freitext in der Spalte
`module_name`. Die umgesetzte Tabelle `milestones` verweist deshalb nicht auf `module_id`, sondern
optional auf `goal_id` (FK → `goals.id`, `ON DELETE SET NULL`) — das Lernziel ist die
nächstliegende vorhandene Entsprechung und bereits auf dieselbe Weise mit `plan_slots` und
`study_sessions` verknüpft; optional bleibt die Verknüpfung, weil die Entwürfe auch
modulunabhängige Einträge zeigen. Statt eines einzelnen `month`-Datums speichert die Tabelle `year`
und `month` als zwei ganze Zahlen, wie es `plan_slots` bereits tut, und statt eines vollen
`due_date` nur den Tag im Monat (`due_day`), der gegen die Länge genau dieses Monats geprüft wird
und deshalb gar nicht aus dem Monat herausfallen kann — inhaltlich dieselbe Garantie wie der oben
beschriebene `CHECK`. Details und Begründung stehen im Decision Log von
`docs/ExecPlans/completed/2026-08-17_P5-FR-3.2-Zwischenziele.md`.

### 3.7 `sessions` – erfasste Lernzeit

Ergebnis der Stoppuhr (FR-4.1, FR-4.2, FR-4.4).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE RESTRICT` |
| `goal_id` | integer FK → `goals.id` | ja | `ON DELETE SET NULL` |
| `slot_id` | integer FK → `study_slots.id` | ja | `ON DELETE SET NULL` |
| `started_at` | timestamptz | nein | Beginn der Lernzeit |
| `ended_at` | timestamptz | ja | `NULL` = Session läuft gerade |
| `note` | varchar(200) | ja | z. B. `Kapitel 3 wiederholen` |
| `source` | varchar(10) | nein | `timer` oder `manual` (FR-4.4) |
| `created_at` | timestamptz | nein | Zeitpunkt der Erfassung |

`created_at` ist nicht redundant zu `started_at`: Bei `source = 'manual'` liegt die nacherfasste
Lernzeit in der Vergangenheit, und nur die beiden Werte zusammen zeigen, dass ein Eintrag
nachträglich entstanden ist.

Eine laufende Session ist genau die Zeile mit `ended_at IS NULL`; davon darf es höchstens eine
geben, erzwungen durch `CREATE UNIQUE INDEX ON sessions ((true)) WHERE ended_at IS NULL`. Die
Bruttodauer ist `ended_at − started_at`, die für die Auswertung maßgebliche ungestörte Dauer die
Bruttodauer abzüglich aller Pausen. Beides wird berechnet, nicht gespeichert.

### 3.8 `session_pauses` – Unterbrechungen

FR-4.3 verlangt, Unterbrechungen **separat** zu erfassen, damit nur ungestörte Lernzeit zählt; das
Dashboard weist eine Fokusquote („87 % ungestört") aus.

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `session_id` | integer FK → `sessions.id` | nein | `ON DELETE CASCADE` |
| `started_at` | timestamptz | nein | |
| `ended_at` | timestamptz | ja | `NULL` = Pause läuft gerade |

Je Session darf höchstens eine Pause offen sein:
`CREATE UNIQUE INDEX ON session_pauses (session_id) WHERE ended_at IS NULL`.

Eine eigene Tabelle statt einer Spalte `pause_seconds`: Nur so bleibt nachvollziehbar, wann und wie
oft unterbrochen wurde – Voraussetzung für die Fokusquote und für spätere Auswertungen.

### 3.9 `settings` – Einstellungen der Anwendung

Genau eine Zeile mit allem, was für die ganze Anwendung gilt und nirgends sonst hingehört: die
Zeitzone (Leitentscheidung 9), die Ruhezeiten und Kanäle der Erinnerungen aus
`2f-erinnerungen.html` und das Bundesland für automatische Feiertage.

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | immer `1`, erzwungen durch `CHECK (id = 1)` |
| `timezone` | varchar(50) | nein | IANA-Name, Vorgabe `Europe/Berlin` |
| `quiet_hours_start` | time | ja | Beginn der Ruhezeit, z. B. `22:00` |
| `quiet_hours_end` | time | ja | Ende der Ruhezeit, z. B. `07:00` |
| `mute_during_session` | boolean | nein | keine Hinweise während laufender Session; Vorgabe `true` |
| `mute_during_absence` | boolean | nein | Hinweise an Urlaubstagen aussetzen; wirkt erst mit FR-2.3 |
| `channel_in_app` | boolean | nein | Vorgabe `true`; einziger Kanal des Must-Umfangs |
| `channel_email` | boolean | nein | Vorgabe `false` (FR-7.4) |
| `channel_push` | boolean | nein | Vorgabe `false` (FR-7.4) |
| `email` | varchar(255) | ja | Zieladresse für den E-Mail-Kanal (FR-7.4) |
| `holiday_region` | varchar(10) | ja | z. B. `DE-NW` für „Feiertage NRW" (FR-2.3) |
| `updated_at` | timestamptz | nein | |

Ein einzeiliger Datensatz statt einer Schlüssel-Wert-Tabelle: Die Werte haben unterschiedliche
Typen, und eine Tabelle aus Zeichenketten würde jede Prüfung in die Anwendung verschieben. Die
Zeile wird von der Migration angelegt, die die Tabelle erzeugt, damit es keinen Zustand „noch keine
Einstellungen" gibt.

Nachrüstung Auth: Aus der einen Zeile wird eine Zeile je Nutzer, `CHECK (id = 1)` entfällt zugunsten
eines Unique-Index auf `user_id`.

### 3.10 `reminder_rules` – wann die Anwendung sich meldet

FR-7.1 ist eine Must-, FR-7.2 und FR-7.3 sind Should-Anforderungen; diese Tabelle gehört deshalb
zum Kernmodell und nicht in die Could-Ausbaustufe. Der Entwurf `2f-erinnerungen.html` zeigt vier
Regeln mit je einem einstellbaren Schwellenwert.

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `type` | varchar(20) | nein | `inaktivitaet`, `vor_slot`, `zieltermin`, `wochenrueckblick` |
| `threshold_value` | numeric(6,2) | ja | `2` Tage, `15` Minuten, `10` Prozent |
| `threshold_unit` | varchar(10) | ja | `tage`, `minuten`, `prozent` |
| `weekday` | smallint | ja | 1 = Montag … 7 = Sonntag; nur für `wochenrueckblick` |
| `time_of_day` | time | ja | Uhrzeit; nur für `wochenrueckblick` |
| `enabled` | boolean | nein | Vorgabe `true` |
| `updated_at` | timestamptz | nein | |

Die vier Regeln werden von der Migration mit den Vorgabewerten des Entwurfs angelegt (2 Tage,
15 Minuten, 10 Prozent, sonntags 18:00). Bewusst *kein* Unique-Index auf `type`: Der Entwurf zeigt
eine Schaltfläche „+ Eigene Regel", und mehrere Zeilen desselben Typs bleiben so später ohne
Migration möglich. Im Must-Umfang existiert je Typ genau eine Zeile.

### 3.11 `notifications` – erzeugte Hinweise

Hält die tatsächlich entstandenen Erinnerungen samt ihrem Bearbeitungszustand. Ohne diese Tabelle
ließe sich nicht unterscheiden, ob ein Hinweis schon gesehen oder weggeklickt wurde – der Entwurf
bietet an jeder Erinnerung „Erledigt" und „Später" an.

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `rule_type` | varchar(20) | nein | wie `reminder_rules.type` |
| `message` | varchar(300) | nein | fertig formulierter Text |
| `state` | varchar(10) | nein | `neu`, `erledigt`, `spaeter`; Vorgabe `neu` |
| `snooze_until` | timestamptz | ja | gesetzt bei `spaeter`; vorher nicht wieder anzeigen |
| `slot_id` | integer FK → `study_slots.id` | ja | `ON DELETE CASCADE` |
| `goal_id` | integer FK → `goals.id` | ja | `ON DELETE CASCADE` |
| `dedupe_key` | varchar(120) | nein | eindeutig; verhindert Doppelanlage |
| `created_at` | timestamptz | nein | |

`dedupe_key` ist der Schlüssel zu Leitentscheidung 10. Weil die Regeln bei jedem Abruf ausgewertet
werden, muss die Anwendung erkennen, dass ein Hinweis bereits existiert. Der Schlüssel wird aus
Regeltyp, Bezugsobjekt und Bezugstag gebildet, etwa `inaktivitaet:module:3:2026-08-05`; ein
Unique-Index darauf lässt den zweiten Einfügeversuch scheitern, statt eine zweite Kachel zu
erzeugen.

---

## 4. Abgeleitete Größen (keine Tabellen)

Die gesamte Auswertung (FR-6) und alle Fortschrittsanzeigen entstehen aus den obigen Tabellen:

Erfasste Zeit je Modul und Zeitraum ist die Summe der ungestörten Session-Dauern. Planerfüllung ist
diese Summe im Verhältnis zur Summe der `plan_entries` desselben Zeitraums, wobei ein Monat die
Summe der Wochen ist, deren Montag in ihn fällt. Der Ampelstatus („im Plan", „knapp", „Rückstand")
ist eine Schwellenwertregel auf dieser Quote und gehört in die Anwendungslogik, nicht in die
Datenbank; Module ohne Plan im betrachteten Zeitraum bekommen keinen Ampelwert, sondern den Hinweis
„startet <Monat>". Der Zielfortschritt folgt der Regel aus 3.3. Ob ein geplanter Slot verfallen ist,
folgt der Regel aus 3.5. Die Wochenansicht des Dashboards ist eine Abfrage über `study_slots` und
`sessions` eines Datumsbereichs, der Puffer im Kapazitätscheck die Differenz aus
`semesters.weekly_capacity_hours` und der Summe der Wochenbudgets. Die Tageszeit-Auswertung („Wann
lernst du?") rechnet `sessions.started_at` mit `settings.timezone` in Ortszeit um und gruppiert
danach.

---

## 5. Ausbaustufe „Could"

`absences` (FR-2.3) hält Urlaub und Feiertage mit `label`, `start_date`, `end_date` und `type`
(`urlaub`, `feiertag`, `sonstiges`). Die Grobplanung rechnet diese Tage aus dem verfügbaren Budget
heraus; gespeichert wird nur der Zeitraum, der Abzug wird berechnet. Automatisch eingetragene
Feiertage stützen sich auf `settings.holiday_region`. Die Tabelle wird erst angelegt, wenn FR-2.3
tatsächlich umgesetzt wird; das Kernmodell nimmt sie ohne Umbau auf, weil außer der
Budget-Berechnung nichts auf sie verweist.

---

## 6. Weg vom Ist-Zustand

Heute existiert nur `goals` mit `id`, `title`, `module` (Freitext), `target_date`, `status` und
`created_at`. Der Übergang erfolgt in Schritten, jeder mit eigener Alembic-Migration und eigenem
ExecPlan.

Der erste Schritt ist zugleich der einzige heikle: `semesters`, `modules` und `settings` anlegen und
`goals.module` durch `module_id` ersetzen (FR-2.1). Diese Migration muss ein Standard-Semester
erzeugen, aus den vorhandenen Freitext-Modulnamen je einen `modules`-Eintrag mit vorläufig 5 ECTS
erstellen, `module_id` daraus befüllen und erst danach die alte Spalte entfernen. Dabei entsteht
auch aus dem Vorgabewert `Nicht zugeordnet`, den die FR-1.2-Migration bestehenden Zeilen gegeben
hat, ein Modul dieses Namens. Es ist nach der Migration von Hand umzubenennen oder zu löschen, und
die ECTS-Werte aller so entstandenen Module sind zu korrigieren; beides gehört in die Release-Notiz
des zugehörigen Plans.

Danach folgen `plan_entries` (FR-2.1/2.2), dann `milestones` und `study_slots` (FR-3), dann
`sessions` und `session_pauses` (FR-4), dann `achieved_at`, `grade` und `note` an `goals` (FR-5).
Für FR-6 ist keine Migration nötig. Dann `reminder_rules` und `notifications` (FR-7.1 bis FR-7.3).
Die Spalte `priority` (FR-1.4) ist rein additiv und passt an jede Stelle dieser Reihe, sinnvoll
aber erst nach dem Modul-Umbau, damit `goals` nicht zweimal kurz hintereinander migriert wird –
FR-1.4 ist ohnehin eine Could-Anforderung und damit nachrangig gegenüber den Must-Anforderungen aus
FR-2 bis FR-7. Die Could-Tabelle `absences` aus Abschnitt 5 kommt zuletzt.

---

## 7. Offene Punkte

Die Auth-Einführung ist der größte offene Posten; der Nachrüstweg steht in Leitentscheidung 2, die
Entscheidung selbst gehört ins Mittwochs-Meeting.

Der zweite offene Posten sind die Benachrichtigungskanäle. Der Must-Umfang kommt mit In-App-Hinweisen
aus und braucht dafür weder Scheduler noch Versanddienst (Leitentscheidung 10). Alles darüber hinaus
gehört zu FR-7.4 und kostet zusätzliche Infrastruktur, die im Tech-Stack noch nicht entschieden ist:
E-Mail braucht einen Versanddienst und ein Secret in Railway; eine Desktop-Benachrichtigung bei
geöffneter Anwendung ist mit der Notification-Schnittstelle des Browsers dagegen fast kostenlos zu
haben, während eine Benachrichtigung bei *geschlossener* Anwendung einen Service Worker samt
Web-Push-Schlüsseln verlangt und damit aufwendiger ist als E-Mail. Zeitgesteuerte Erinnerungen vor
einem Slot (FR-7.2) funktionieren bei geöffneter Anwendung im Frontend; bei geschlossener bräuchten
sie einen periodischen Auftrag, für den Railway Cron-Zeitpläne anbietet.

Ob Module über Semestergrenzen hinweg fortgeführt werden können (ein Modul, das sich über zwei
Semester zieht), ist ungeklärt – das Modell ordnet ein Modul aktuell genau einem Semester zu. Ein
Kalender-Export (iCal) ist laut Teamabsprache vom 05.08.2026 nicht vorgesehen; käme er später,
bräuchte `study_slots` eine stabile externe Kennung.

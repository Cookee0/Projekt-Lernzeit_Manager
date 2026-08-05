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

Diese acht Entscheidungen prägen das gesamte Modell.

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

**3. Lernziele sind zweistufig: Hauptziel und Teilziele.** Ein Kurs-Ziel („Klausur Datenbanken
bestehen") kann in Teilziele zerlegt werden („4 Übungsblätter"). Der Fortschritt eines Hauptziels
mit Teilzielen ergibt sich aus dem Anteil erreichter Teilziele – vier Teilziele bedeuten 25 Prozent
je erledigtem Teilziel. Umgesetzt wird das über eine Selbstreferenz `parent_goal_id` in `goals`.
Bewusst nur **zwei Ebenen**: Ein Teilziel darf keine eigenen Teilziele haben. Beliebig tiefe Bäume
würden die Fortschrittsberechnung und die Oberfläche verkomplizieren, ohne dass eine Anforderung
das verlangt.

**4. Eine Lernsession verweist auf Modul *und* Ziel.** `module_id` ist Pflicht, `goal_id` optional.
FR-4.2 lässt beides zu („einem Lernziel/Modul zugeordnet"); die Auswertung nach Modul (FR-6.1) darf
keine Lücken haben, während nicht jede Lernzeit sich sinnvoll einem bestimmten Ziel zuordnen lässt.
Ist `goal_id` gesetzt, muss das Ziel zum selben Modul gehören – das prüft die Anwendungsschicht.

**5. Semester ist eine echte Entität.** Die Kopfzeile aller Entwürfe zeigt einen Umschalter
„Semester WS 26/27", und die Grobplanung spannt genau einen Zeitraum („Aug 2026 – Jan 2027") auf.
Der Sechs-Monats-Horizont aus FR-1.1 und FR-2.1 ist damit kein rollierendes Fenster, sondern ein
benanntes Semester mit Start- und Enddatum. Module hängen an einem Semester.

**6. Workload = ECTS × 25 Stunden, überschreibbar.** Der Kickoff-Beschluss zu FR-2.1 legt die
ECTS-Punkte als Grundlage fest, die Grobplanung nennt „1 ECTS ≈ 25 h · manuell überschreibbar".
Gespeichert wird deshalb `ects`; die Stundenzahl wird berechnet. Die Spalte `workload_hours` ist
optional und übersteuert die Rechnung, wenn sie gesetzt ist. Der Faktor 25 ist eine Konstante im
Backend, keine Konfigurationstabelle – er ist die IU-weite Regel und ändert sich nicht pro Nutzer.

**7. Nichts wird gespeichert, was sich berechnen lässt.** Für die Auswertung (FR-6) gibt es keine
eigene Tabelle. Erfasste Stunden, Planerfüllung, Fortschrittsprozente und Ampelstatus sind
Aggregate über `sessions` und `plan_entries` und werden bei der Abfrage berechnet. Gespeicherte
Fortschrittswerte würden bei jeder nachträglichen Korrektur einer Session veralten.

**8. Zeiten als ganze Zahlen, Stunden nur zur Anzeige.** Session-Dauern werden in Sekunden
gespeichert (die Stoppuhr misst sekundengenau), geplante Slot-Dauern und Budgets in Minuten
beziehungsweise als `numeric`. Fließkommastunden in einer Prozentrechnung erzeugen Rundungsfehler,
die in der Auswertung sichtbar werden. Alle Zeitstempel sind `timestamptz` in UTC, alle reinen
Datumsangaben `date`.

Statuswerte werden wie bisher als `varchar` mit `CHECK`-Bedingung modelliert, nicht als
PostgreSQL-`ENUM`. Grund: Ein `ENUM` um einen Wert zu erweitern, ist in Alembic deutlich
umständlicher als eine geänderte `CHECK`-Bedingung.

---

## 2. Überblick

Elf Tabellen, davon acht für Must/Should und drei für die Could-Anforderungen.

    semesters ──< modules ──< goals ──< goals (Teilziele, parent_goal_id)
                     │          │
                     │          └──< sessions >── study_slots
                     ├──< plan_entries          │
                     ├──< study_slots ──────────┘
                     └──< milestones
                                sessions ──< session_pauses

    Could: absences, reminder_rules, notifications

Gelesen als Beziehungen:

- Ein Semester hat mehrere Module; ein Modul gehört zu genau einem Semester.
- Ein Modul hat mehrere Lernziele, Wochen-/Monatsbudgets, Lernzeit-Slots und Zwischenziele.
- Ein Lernziel kann Teilziele haben (eine Ebene tief).
- Eine Session gehört zu einem Modul, optional zu einem Ziel und optional zu einem geplanten Slot.
- Eine Session hat beliebig viele Pausen.

---

## 3. Entitäten im Detail

### 3.1 `semesters` – Planungszeitraum

Klammert den Sechs-Monats-Horizont und speist den Umschalter in der Kopfzeile (FR-1.1, FR-2.1).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `label` | varchar(50) | nein | Anzeigename, z. B. `WS 26/27` |
| `start_date` | date | nein | erster Tag des Planungszeitraums |
| `end_date` | date | nein | letzter Tag; muss nach `start_date` liegen |
| `is_active` | boolean | nein | genau ein Semester ist aktiv, Vorgabe für neue Ansichten |
| `created_at` | timestamptz | nein | |

Nachrüstung Auth: `label` wird zusammen mit `user_id` eindeutig.

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

### 3.3 `goals` – Lernziele und Teilziele

Erweiterung der bestehenden Tabelle um Modulbezug, Hierarchie, Priorität und Ergebnisfelder
(FR-1.1 bis FR-1.4, FR-5.1 bis FR-5.3).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | ersetzt das heutige Freitextfeld `module` |
| `parent_goal_id` | integer FK → `goals.id` | ja | gesetzt = Teilziel; `ON DELETE CASCADE` |
| `title` | varchar(200) | nein | unverändert |
| `target_date` | date | nein | Zieltermin; „Verschieben" (FR-1.3) ändert nur diesen Wert |
| `status` | varchar(20) | nein | `offen`, `in_arbeit`, `erreicht`; Vorgabe `offen` |
| `priority` | varchar(10) | nein | `hoch`, `mittel`, `niedrig`; Vorgabe `mittel` (FR-1.4) |
| `achieved_at` | date | ja | gesetzt beim Wechsel auf `erreicht` (FR-5.1) |
| `grade` | numeric(2,1) | ja | Note, z. B. `1.7` (FR-5.2) |
| `note` | text | ja | Notiz/Ergebnis (FR-5.2) |
| `created_at` | timestamptz | nein | unverändert |

Ein Teilziel erbt `module_id` vom Hauptziel und darf selbst kein `parent_goal_id` bei einem Ziel
setzen, das bereits eines hat – diese Regel prüft die Anwendungsschicht, nicht die Datenbank.
Der angezeigte Fortschritt ist abgeleitet: Hat ein Ziel Teilziele, ist er der Anteil der Teilziele
mit Status `erreicht`; hat es keine, ist er das Verhältnis erfasster zu geplanten Stunden des
Moduls. Die Historie (FR-5.3) braucht keine eigene Tabelle – sie ist die Abfrage aller Ziele mit
`status = 'erreicht'` über alle Semester, sortiert nach `achieved_at`.

### 3.4 `plan_entries` – Grobplanung

Ein Budget je Modul und Zeitabschnitt (FR-2.1, FR-2.2).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE CASCADE` |
| `period_type` | varchar(10) | nein | `month` oder `week` |
| `period_start` | date | nein | Monatserster bzw. Montag der Kalenderwoche |
| `planned_hours` | numeric(6,2) | nein | ≥ 0 |
| `source` | varchar(10) | nein | `auto` = aus ECTS verteilt, `manual` = überschrieben |
| `updated_at` | timestamptz | nein | |

Eindeutig über (`module_id`, `period_type`, `period_start`). Die Entwürfe zeigen in der Grobplanung
einen Umschalter „Monate / Wochen" und erlauben, jede Zelle einzeln anzupassen; genau dafür stehen
`period_type` und `source`. Eine Neuberechnung („Neu berechnen") darf Zeilen mit `source = 'manual'`
nicht überschreiben.

### 3.5 `study_slots` – Detailplanung

Geplante Lernzeit-Blöcke des laufenden Monats (FR-3.1).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE CASCADE` |
| `milestone_id` | integer FK → `milestones.id` | ja | optionale Kopplung an ein Zwischenziel |
| `slot_date` | date | nein | Tag |
| `start_time` | time | nein | Uhrzeit ohne Zeitzone (lokale Planung) |
| `duration_minutes` | integer | nein | > 0 |
| `status` | varchar(15) | nein | `geplant`, `erledigt`, `verfallen` |
| `created_at` | timestamptz | nein | |

Ob ein Slot erledigt ist, ergibt sich zwar auch aus der verknüpften Session; `status` bleibt
trotzdem eigenständig, weil ein Slot auch ohne Session als verfallen markiert werden können muss –
genau darauf setzt die Inaktivitätserinnerung aus FR-7.1 auf.

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

Abgegrenzt zu `goals`: Zwischenziele sind kurzfristige Arbeitspakete eines Monats ohne Note, ohne
Priorität und ohne Fortschrittsrechnung. Teilziele nach 3.3 gehören dagegen zu einem Lernziel und
zahlen auf dessen Prozentwert ein. Die beiden nicht zu verschmelzen ist bewusst: FR-3.2 und FR-1.x
sind getrennte Anforderungen mit getrennten Oberflächen.

### 3.7 `sessions` – erfasste Lernzeit

Ergebnis der Stoppuhr (FR-4.1, FR-4.2, FR-4.4).

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `module_id` | integer FK → `modules.id` | nein | `ON DELETE RESTRICT` |
| `goal_id` | integer FK → `goals.id` | ja | `ON DELETE SET NULL` |
| `slot_id` | integer FK → `study_slots.id` | ja | `ON DELETE SET NULL` |
| `started_at` | timestamptz | nein | |
| `ended_at` | timestamptz | ja | `NULL` = Session läuft gerade |
| `note` | varchar(200) | ja | z. B. `Kapitel 3 wiederholen` |
| `source` | varchar(10) | nein | `timer` oder `manual` (FR-4.4) |

Eine laufende Session ist genau die Zeile mit `ended_at IS NULL`; davon darf es höchstens eine
geben. Die Bruttodauer ist `ended_at − started_at`, die für die Auswertung maßgebliche ungestörte
Dauer die Bruttodauer abzüglich aller Pausen. Beides wird berechnet, nicht gespeichert.

### 3.8 `session_pauses` – Unterbrechungen

FR-4.3 verlangt, Unterbrechungen **separat** zu erfassen, damit nur ungestörte Lernzeit zählt; das
Dashboard weist eine Fokusquote („87 % ungestört") aus.

| Spalte | Typ | Null | Bedeutung |
|---|---|---|---|
| `id` | integer PK | nein | |
| `session_id` | integer FK → `sessions.id` | nein | `ON DELETE CASCADE` |
| `started_at` | timestamptz | nein | |
| `ended_at` | timestamptz | ja | `NULL` = Pause läuft gerade |

Eine eigene Tabelle statt einer Spalte `pause_seconds`: Nur so bleibt nachvollziehbar, wann und wie
oft unterbrochen wurde – Voraussetzung für die Fokusquote und für spätere Auswertungen.

---

## 4. Abgeleitete Größen (keine Tabellen)

Die gesamte Auswertung (FR-6) und alle Fortschrittsanzeigen entstehen aus den obigen Tabellen:

Erfasste Zeit je Modul und Zeitraum ist die Summe der ungestörten Session-Dauern. Planerfüllung ist
diese Summe im Verhältnis zur Summe der `plan_entries` desselben Zeitraums. Der Ampelstatus („im
Plan", „knapp", „Rückstand") ist eine Schwellenwertregel auf dieser Quote und gehört in die
Anwendungslogik, nicht in die Datenbank. Der Zielfortschritt folgt der Regel aus 3.3. Die
Wochenansicht des Dashboards ist eine Abfrage über `study_slots` und `sessions` eines
Datumsbereichs.

---

## 5. Ausbaustufe „Could"

Diese drei Tabellen werden erst angelegt, wenn die zugehörigen Could-Anforderungen tatsächlich
umgesetzt werden. Sie sind hier skizziert, damit das Kernmodell sie später ohne Umbau aufnehmen
kann.

`absences` (FR-2.3) hält Urlaub und Feiertage mit `label`, `start_date`, `end_date` und `type`
(`urlaub`, `feiertag`, `sonstiges`). Die Grobplanung rechnet diese Tage aus dem verfügbaren Budget
heraus; gespeichert wird nur der Zeitraum, der Abzug wird berechnet.

`reminder_rules` (FR-7.1 bis FR-7.4) speichert je Regel `type` (`inaktivitaet`, `vor_slot`,
`zieltermin`, `wochenrueckblick`), einen Schwellenwert `threshold_value` samt `threshold_unit`
(Tage, Minuten, Prozent), `enabled` und die aktiven Kanäle. Kanäle, Ruhezeiten und E-Mail-Adresse
gehören in eine einzeilige Einstellungstabelle, nicht an jede Regel.

`notifications` hält die tatsächlich erzeugten Hinweise mit `rule_type`, `message`, `created_at`,
`state` (`neu`, `erledigt`, `spaeter`) und einer optionalen Referenz auf Slot oder Ziel. Ohne diese
Tabelle ließe sich nicht unterscheiden, ob eine Erinnerung schon gesehen wurde.

---

## 6. Weg vom Ist-Zustand

Heute existiert nur `goals` mit `id`, `title`, `module` (Freitext), `target_date`, `status` und
`created_at`. Der Übergang erfolgt in Schritten entlang der FR-Reihenfolge, jeder mit eigener
Alembic-Migration und eigenem ExecPlan:

Zuerst `priority` an `goals` ergänzen (FR-1.4) – additiv, keine Datenumstellung. Dann `semesters`
und `modules` anlegen und `goals.module` durch `module_id` ersetzen (FR-2.1). Diese Migration ist
die einzige heikle: Sie muss ein Standard-Semester erzeugen, aus den vorhandenen
Freitext-Modulnamen je einen `modules`-Eintrag mit vorläufig 5 ECTS erstellen, `module_id` daraus
befüllen und erst danach die alte Spalte entfernen. Der ECTS-Wert muss anschließend von Hand
korrigiert werden; das gehört in die Release-Notiz des zugehörigen Plans. Anschließend folgen
`plan_entries` (FR-2.1/2.2), dann `milestones` und `study_slots` (FR-3), dann `sessions` und
`session_pauses` (FR-4), dann `parent_goal_id`, `achieved_at`, `grade` und `note` an `goals`
(FR-5). Für FR-6 ist keine Migration nötig. Die Could-Tabellen aus Abschnitt 5 kommen zuletzt.

---

## 7. Offene Punkte

Die Auth-Einführung ist der größte offene Posten; der Nachrüstweg steht in Leitentscheidung 2, die
Entscheidung selbst gehört ins Mittwochs-Meeting. Ob Module über Semestergrenzen hinweg fortgeführt
werden können (ein Modul, das sich über zwei Semester zieht), ist ungeklärt – das Modell ordnet ein
Modul aktuell genau einem Semester zu. Ein Kalender-Export (iCal) ist laut Teamabsprache vom
05.08.2026 nicht vorgesehen; käme er später, bräuchte `study_slots` eine stabile externe Kennung.
Ein ER-Diagramm für den Projektbericht wird bewusst noch nicht gezeichnet, weil sich das Modell
mit jeder FR-Umsetzung noch verschiebt.

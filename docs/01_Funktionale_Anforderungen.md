# Funktionale Anforderungen – Lernzeit-Manager

Im Kickoff so abgenommen (siehe [[99_Kickoff-Beschlüsse]]). Damit ist dies der finale Anforderungsstand für die Projektkonfiguration ([[07_MS1]]) sowie der Ausgangspunkt für das Product Backlog (MS3 ff.).

Legende Priorität: **M**ust (Kern für MS4-Prototyp) / **S**hould / **C**ould

## 1. Lernziele festlegen (6-Monats-Horizont) - 2 Tage
- **FR-1.1 (M)** Nutzende können Lernziele für einen Zeitraum von mindestens sechs Monaten anlegen (z. B. Modulabschluss, Klausur, Projektbericht-Abgabe).
- **FR-1.2 (M)** Jedes Lernziel hat mindestens: Titel, Zieldatum, zugeordnetes Modul/Kurs, Status (offen/in Arbeit/erreicht).
- **FR-1.3 (S)** Lernziele können bearbeitet, verschoben oder gelöscht werden.
- **FR-1.4 (C)** Lernziele können priorisiert werden (z. B. hoch/mittel/niedrig).

## 2. Grobplanung von Lernzeiten (6-Monats-Horizont) - 2 Tage
- **FR-2.1 (M)** Nutzende können auf Basis des im Modulhandbuch angegebenen Workloads eine grobe Zeitplanung über mindestens sechs Monate erstellen (z. B. Wochenbudget pro Modul). Kickoff-Beschluss: Der Workload wird anhand der ECTS-Punkte des jeweiligen Moduls festgelegt.
- **FR-2.2 (S)** Die Grobplanung wird automatisch auf die einzelnen Monate/Wochen heruntergebrochen (Vorschlag), bleibt aber manuell anpassbar.
- **FR-2.3 (C)** Feiertage/bekannte Abwesenheiten (Urlaub) können bei der Grobplanung berücksichtigt werden.

## 3. Detailplanung von Lernzeiten und Zwischenzielen (1-Monats-Horizont) - 3 Tage
- **FR-3.1 (M)** Nutzende können für den laufenden Monat konkrete Lernzeit-Slots (Tag, Uhrzeit, Dauer, Modul) planen.
- **FR-3.2 (M)** Zu jedem Monat können Zwischenziele definiert werden (z. B. "Kapitel 3 abschließen").
- **FR-3.3 (S)** Die Detailplanung orientiert sich an der Grobplanung und zeigt Abweichungen an (z. B. geplantes vs. verbleibendes Wochenbudget).

## 4. Nachverfolgung der Lernzeit (Stoppuhr) - 3 Tage
- **FR-4.1 (M)** Nutzende können eine Lernsession per Stoppuhr/Timer starten, pausieren und beenden.
- **FR-4.2 (M)** Jede erfasste Session wird einem Lernziel/Modul zugeordnet und persistiert (Datum, Dauer, Modul).
- **FR-4.3 (S)** Unterbrechungen (Pause) werden separat erfasst, sodass nur "ungestörte" Lernzeit gezählt wird.
- **FR-4.4 (C)** Manuelle Nacherfassung von Lernzeit (falls Timer vergessen wurde).

## 5. Nachverfolgung erreichter Lernziele - 2 Tage
- **FR-5.1 (M)** Nutzende können Lernziele als erreicht markieren (z. B. Modul abgeschlossen, Klausur bestanden, Projektbericht eingereicht).
- **FR-5.2 (S)** Zu einem erreichten Ziel können optionale Notizen/Ergebnisse hinterlegt werden (z. B. Note).
- **FR-5.3 (C)** Historie aller erreichten Ziele ist einsehbar (Verlauf über das gesamte Studium).

## 6. Veranschaulichung der Zielerreichung - 3 Tage
- **FR-6.1 (M)** Dashboard/Übersicht zeigt eingesetzte Lernzeit im Verhältnis zu geplanter Zeit (z. B. pro Woche/Monat/Modul).
- **FR-6.2 (M)** Fortschritt zu Lernzielen wird visuell dargestellt (z. B. Fortschrittsbalken, Ampel-Status).
- **FR-6.3 (S)** Auswertung über Zeitverlauf (z. B. Liniendiagramm Lernzeit pro Woche) zur Erkennung von Trends.
- **FR-6.4 (C)** Vergleich Plan vs. Ist über den gesamten 6-Monats-Zeitraum.

## 7. Automatische Erinnerungen - 2 Tage
- **FR-7.1 (M)** Bei ungeplanter Inaktivität (keine erfasste Lernzeit trotz Planung) erhält die/der Nutzende eine Erinnerung.
- **FR-7.2 (S)** Erinnerung an bevorstehende geplante Lernzeit-Slots (z. B. X Minuten vorher).
- **FR-7.3 (S)** Erinnerung an nahende Zieltermine ohne entsprechenden Fortschritt.
- **FR-7.4 (C)** Konfigurierbare Benachrichtigungskanäle (In-App, E-Mail).

## Offene Fragen
- Soll es eine Kopplung an reale Kalender geben (z. B. iCal-Export/Import), oder bleibt der Kalender anwendungsintern?

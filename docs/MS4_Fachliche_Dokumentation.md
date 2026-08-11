# Fachliche Dokumentation — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Datum:** August 2026

---

## 1. Überblick

Dieses Dokument beschreibt die fachlichen Konzepte, Prozesse und Geschäftsregeln des
Lernzeit-Managers. Es richtet sich an Personen, die die Logik der Anwendung verstehen
möchten — unabhängig von technischen Implementierungsdetails.

Der Lernzeit-Manager basiert auf drei zentralen Konzepten: **Lernziele**, **Lernplanung** und
**Lernsessions**. Diese drei Konzepte bilden eine Ebene von grob nach fein ab: von "Was will
ich in den nächsten Monaten erreichen?" bis hin zu "Wie lange habe ich heute gelernt?".

---

## 2. Konzept: Lernziel

### 2.1 Definition

Ein Lernziel ist das übergeordnete Vorhaben eines Nutzers: das Bestehen eines Moduls, die
Vorbereitung auf eine Klausur oder die Fertigstellung eines Projektberichts. Jedes Lernziel
hat einen Planungshorizont von mindestens sechs Monaten (Anforderung FR-1.1).

### 2.2 Attribute eines Lernziels

| Attribut | Bedeutung |
|---|---|
| Titel | Kurzer, verständlicher Name des Ziels |
| Modul / Kurs | Identifikation des zugehörigen Kurses (z. B. IU-Modulkürzel) |
| ECTS-Punkte | Workload aus dem Modulhandbuch; bestimmt den Gesamtlernaufwand |
| Zieldatum | Angestrebter Abschlusstermin |
| Status | Aktueller Bearbeitungsstand (siehe Lebenszyklus) |

### 2.3 Lebenszyklus eines Lernziels

Ein Lernziel durchläuft drei Zustände:

    offen → in Arbeit → erreicht

- **Offen:** Standardzustand beim Anlegen. Das Ziel ist erfasst, aber noch nicht aktiv.
- **In Arbeit:** Der Nutzer hat begonnen, an diesem Ziel zu lernen.
- **Erreicht:** Das Ziel ist abgeschlossen (Klausur bestanden, Modul abgegeben o. Ä.).

Übergänge sind nur in eine Richtung möglich. Ein als "Erreicht" markiertes Ziel kann nicht
auf "In Arbeit" oder "Offen" zurückgesetzt werden.

### 2.4 ECTS-basierter Workload

Die Europäischen Kreditpunkte (ECTS) geben an, wie viel Studienaufwand ein Modul erfordert.
Laut Konvention gilt: **1 ECTS = 30 Stunden = 1.800 Minuten.**

Der Lernzeit-Manager berechnet daraus den Gesamtlernaufwand eines Ziels:

    Gesamtaufwand (Minuten) = ECTS × 1.800

**Beispiel:** Ein Modul mit 5 ECTS erfordert 9.000 Minuten = 150 Stunden Lernaufwand.

Dieser Wert dient als Nenner für den Fortschrittsbalken im Dashboard: er zeigt, wie viel
Prozent des gesamten Lernaufwands der Nutzer bereits absolviert hat.

---

## 3. Konzept: Lernplanung

### 3.1 Definition

Die Lernplanung ermöglicht es dem Nutzer, im Voraus festzulegen, wann und wie lange er für
ein bestimmtes Lernziel lernen möchte. Jeder Eintrag in der Planung heißt intern "PlanSlot".
Aus Nutzerperspektive handelt es sich schlicht um "geplante Lernzeiten".

### 3.2 Attribute einer geplanten Lernzeit

| Attribut | Bedeutung |
|---|---|
| Lernziel | Welchem Ziel diese Einheit zugeordnet ist |
| Jahr, Monat | Der Planungsmonat |
| Tag (optional) | Konkreter Tag des Monats (1–31) |
| Uhrzeit (optional) | Geplante Startzeit im Format HH:MM |
| Dauer | Geplante Lernzeit in Minuten |
| Notiz (optional) | Freier Text (z. B. "Kapitel 4 lesen") |

### 3.3 Funktion in der Inaktivitäts-Erkennung

Geplante Lernzeiten dienen auch als Grundlage für die automatische Erinnerungsfunktion
(FR-7.1). Die Anwendung prüft täglich beim Laden des Dashboards:

    Hat der Nutzer für heute (Jahr, Monat, Tag) mindestens einen Planungseintrag?
    UND hat der Nutzer heute noch keine Lernsession gestartet oder beendet?

Wenn beide Bedingungen erfüllt sind, erscheint auf dem Dashboard eine Warnung.

---

## 4. Konzept: Lernsession

### 4.1 Definition

Eine Lernsession ist eine einzelne, zeitlich begrenzte Lerneinheit, die der Nutzer per Timer
aufzeichnet. Sie ist einem Lernziel zugeordnet und speichert Startzeit, Pausen und Endzeit.

### 4.2 Zustände einer Lernsession

    aktiv → pausiert → abgeschlossen
          ↑____________↑

- **Aktiv:** Timer läuft, Nutzer lernt gerade.
- **Pausiert:** Timer wurde gestoppt; die aktuelle Pausendauer läuft an. Die Session ist noch
  offen und kann fortgesetzt werden.
- **Abgeschlossen:** Session wurde beendet; Dauer ist berechnet und gespeichert.

Es kann zu jedem Zeitpunkt nur eine aktive oder pausierte Session pro Nutzer geben.

### 4.3 Dauerberechnung

Die aufgezeichnete Lernzeit berücksichtigt nur die Zeit, in der der Nutzer tatsächlich gelernt
hat — Pausen werden abgezogen:

    Reine Lernzeit = (Endzeit − Startzeit) − Gesamte Pausendauer

Die gesamte Pausendauer ist die Summe aller Pausenintervalle (bei mehrfachem Pause/Weiter).

**Beispiel:**
- Session gestartet: 14:00 Uhr
- Pause: 14:30–14:45 Uhr (15 Minuten)
- Session beendet: 15:00 Uhr
- Gesamtdauer: 60 Minuten − 15 Minuten Pause = **45 Minuten reine Lernzeit**

### 4.4 Timer-Anzeige im Browser

Der Browser-Timer zeigt die verstrichene Zeit seit dem Start, abzüglich bereits aufgelaufener
Pausenzeiten. Die Berechnung erfolgt clientseitig jede Sekunde:

    Angezeigte Zeit = (aktuelle Zeit − Startzeit) − bereits aufgelaufene Pausensekunden

Beim Fortsetzen nach einer Pause übergibt der Server dem Browser die bis dahin
angesammelten Pausensekunden, sodass der Timer korrekt weiterläuft — unabhängig davon,
wie lange der Browser-Tab geschlossen war.

---

## 5. Geschäftsregeln

| Regel | Beschreibung |
|---|---|
| GR-1 | Es kann immer nur eine aktive oder pausierte Session gleichzeitig existieren. Ein erneuter Start-Versuch wird mit einem Fehler abgelehnt (HTTP 409). |
| GR-2 | Ein Lernziel kann nur gelöscht werden, solange keine aktive Session auf dieses Ziel läuft. Alle zugehörigen Sessions und Planungseinträge werden beim Löschen automatisch entfernt (Cascade Delete). |
| GR-3 | Das Zieldatum eines Lernziels muss in der Zukunft liegen (Validierung im Frontend). |
| GR-4 | Passwörter werden serverseitig mit bcrypt gehasht und nie im Klartext gespeichert. |
| GR-5 | Alle Endpunkte außer Registrierung und Login erfordern einen gültigen JWT-Token. Abgelaufene oder fehlende Token werden mit HTTP 401 abgelehnt. Token haben eine Laufzeit von 8 Stunden. |
| GR-6 | Nutzer sehen ausschließlich ihre eigenen Daten. Zugriffe auf fremde Ressourcen werden mit HTTP 404 abgelehnt (Existenz wird nicht verraten). |

---

## 6. Abgrenzung: Was die Anwendung nicht kann

Die folgende Tabelle listet Anforderungen, die bewusst nicht umgesetzt wurden (Priorität
"Should" oder "Could" gemäß Anforderungsdokument), um den MS4-Scope zu halten:

| Anforderung | Priorität | Begründung der Nicht-Umsetzung |
|---|---|---|
| FR-2.2: Automatische Herunterrechnung der Grobplanung auf Wochen | Should | Aufwand übersteigt MS4-Zeitbudget; manuelle Planung pro Monat reicht für Kern-Usecase |
| FR-3.2: Zwischenziele pro Monat | Must* | *In Notiz-Feld von PlanSlot abbildbar; eigenständige Entität nicht implementiert |
| FR-4.3: Pausenzeit separat erfassen | Should | Implementiert: Pausen werden abgezogen, aber nicht separat angezeigt |
| FR-4.4: Manuelle Nacherfassung | Could | Nicht implementiert |
| FR-5.2: Notizen zu erreichten Zielen | Should | Nicht implementiert |
| FR-7.2: Erinnerung vor geplanter Lernzeit | Should | Nicht implementiert |

*FR-3.2 wird als abgedeckt betrachtet, da das Notiz-Feld eines Planungseintrags für Zwischenziele
genutzt werden kann.

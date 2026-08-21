# Fachliche Dokumentation — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Stand:** 2026-08-21 (nachgeführt nach Plan P14; ursprüngliche MS4-Auslieferung: August 2026)

---

## 1. Überblick

Dieses Dokument beschreibt die fachlichen Konzepte, Prozesse und Geschäftsregeln des
Lernzeit-Managers. Es richtet sich an Personen, die die Logik der Anwendung verstehen
möchten — unabhängig von technischen Implementierungsdetails.

Der Lernzeit-Manager basiert auf vier zentralen Konzepten: **Lernziele**, **Lernplanung**,
**Zwischenziele** und **Lernsessions**. Diese Konzepte bilden eine Ebene von grob nach fein ab:
von "Was will ich in den nächsten Monaten erreichen?" über "Wann will ich dafür lernen?" und
"Welches kleine Arbeitspaket schaffe ich diesen Monat?" bis hin zu "Wie lange habe ich heute
gelernt?". Zwei weitere Bausteine werten diese Daten aus, ohne selbst neue Konzepte zu sein:
die **Grobplanung** (automatische Budget- und Vorschlagsrechnung) und die **Erinnerungen**
(proaktive Hinweise auf Basis der drei anderen Konzepte).

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
| ECTS-Punkte | Workload aus dem Modulhandbuch; bestimmt den Gesamtlernaufwand (siehe 2.4) |
| Lernaufwand in Stunden (optional) | Überschreibt, falls gesetzt, den aus den ECTS-Punkten berechneten Aufwand (siehe 2.4) |
| Zieldatum | Angestrebter Abschlusstermin |
| Status | Aktueller Bearbeitungsstand (siehe Lebenszyklus) |
| Priorität (optional) | Hoch / mittel / niedrig — rein informativ, beeinflusst keine Berechnung |
| Note (optional) | Erzieltes Ergebnis, frei eintragbar (z. B. "1,7") |
| Ergebnis-Notiz (optional) | Freier Text, z. B. Feedback oder Lessons Learned |

Alle Attribute außer Titel, Modul, ECTS und Zieldatum sind optional und lassen sich jederzeit
nachträglich über das Bearbeiten-Formular ergänzen oder wieder leeren.

### 2.3 Lebenszyklus eines Lernziels

Ein Lernziel durchläuft drei Zustände:

    offen → in Arbeit → erreicht

- **Offen:** Standardzustand beim Anlegen. Das Ziel ist erfasst, aber noch nicht aktiv.
- **In Arbeit:** Der Nutzer hat begonnen, an diesem Ziel zu lernen.
- **Erreicht:** Das Ziel ist abgeschlossen (Klausur bestanden, Modul abgegeben o. Ä.).

Der Übergang nach "Erreicht" ist über die Buttons der Anwendung nur in eine Richtung möglich.
Über das Bearbeiten-Formular lässt sich der Status jedes Feldes einschließlich des Status frei
setzen — technisch ist ein Zurücksetzen von "Erreicht" also möglich, fachlich aber nicht
vorgesehen und wird von der Anwendung nicht aktiv verhindert.

### 2.4 ECTS-basierter Workload und manueller Override

Die Europäischen Kreditpunkte (ECTS) geben an, wie viel Studienaufwand ein Modul erfordert.
Laut Kickoff-Beschluss und Teamentscheidung vom 2026-08-17 gilt als Standardformel:
**1 ECTS = 30 Stunden = 1.800 Minuten** (IU-Rechnung "5 ECTS = 150 Stunden").

    Gesamtaufwand (Minuten) = ECTS × 1.800

**Beispiel:** Ein Modul mit 5 ECTS erfordert standardmäßig 9.000 Minuten = 150 Stunden Lernaufwand.

Seit Plan P14 (2026-08-21) lässt sich dieser automatisch berechnete Wert pro Lernziel
überschreiben: Trägt der Nutzer im Feld "Lernaufwand in Stunden" einen eigenen Wert ein (1 bis
1000 Stunden), gilt ab sofort dieser Wert überall dort, wo der Gesamtaufwand des Ziels
verwendet wird — anstelle von ECTS × 30 Stunden. Grund für diesen Override: Die
Standardformel ist eine grobe Schätzung aus dem Modulhandbuch; ein Nutzer, der aus Erfahrung
weiß, dass ein bestimmtes 5-ECTS-Modul realistisch nur 50 Stunden statt 150 Stunden braucht,
würde mit der starren Formel sein persönliches Lernziel nie "vollständig" erreichen, obwohl er
inhaltlich fertig ist. Bleibt das Feld leer, ändert sich nichts am bisherigen Verhalten.

Der wirksame Gesamtaufwand (Override, falls gesetzt, sonst die Formel) fließt in vier Stellen
ein:

- den Fortschrittsbalken je Lernziel auf dem Dashboard,
- das Wochenbudget und den Monatsvorschlag der Grobplanung (siehe Abschnitt 3.4),
- die Fortschritts- und Ampelanzeige je Modul auf der Auswertungsseite,
- die FR-7.3-Erinnerung bei nahendem Zieldatum ohne ausreichenden Fortschritt.

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
| Dauer | Geplante Lernzeit in Minuten (5–480) |
| Notiz (optional) | Freier Text (z. B. "Kapitel 4 lesen") |

### 3.3 Serientermine

Seit Plan P9 lassen sich mehrere Einträge in einem Arbeitsschritt anlegen ("Serientermine"):
Der Nutzer wählt aus einem Tages-Raster des gewählten Monats mehrere Tage aus — entweder
einzeln oder per Schnellwahl (alle Werktage, oder alle Vorkommen eines bestimmten Wochentags,
z. B. "jeden Mittwoch") — und legt für alle gewählten Tage in einer Transaktion je einen
PlanSlot mit denselben Uhrzeit-, Dauer- und Notiz-Angaben an. Fachlich ist ein Serientermin
keine eigene Entität; er erzeugt ausschließlich normale, einzeln bearbeit- und löschbare
PlanSlots.

### 3.4 Grobplanung: Wochenbudget und Monatsvorschlag (FR-2.1, FR-2.2, FR-3.3)

Die Grobplanung leitet aus dem Gesamtaufwand eines Lernziels (Abschnitt 2.4) ab, wie viel der
Nutzer aktuell noch lernen muss, und verteilt diesen Restaufwand automatisch:

**Restaufwand** = Gesamtaufwand − bereits aufgezeichnete Lernzeit (nie negativ; ist das Ziel
bereits erreicht oder übertroffen, ist der Restaufwand 0).

**Wochenbudget** = Restaufwand ÷ Anzahl der bis zum Zieldatum verbleibenden, angebrochenen
Wochen (mindestens eine Woche; ein bereits verstrichenes Zieldatum zählt wie eine Woche, damit
nicht durch Null geteilt wird). Das Wochenbudget beantwortet die Frage "Wie viel müsste ich ab
jetzt pro Woche lernen, um rechtzeitig fertig zu werden?".

**Monatsvorschlag** = Restaufwand ÷ Anzahl der bis zum Zieldatum verbleibenden Kalendermonate
(einschließlich des laufenden und des Zielmonats, mindestens ein Monat). Der Vorschlag legt
selbst keine PlanSlots an — er ist eine Empfehlung, wie viel Zeit im gewählten Monat sinnvoll
wäre; die tatsächliche Planung bleibt manuell (FR-2.2: "automatischer Vorschlag, bleibt aber
manuell anpassbar").

**Abweichung** = bereits für den gewählten Monat geplante Zeit − Monatsvorschlag. Eine positive
Abweichung bedeutet: mehr geplant als vorgeschlagen; eine negative bedeutet: weniger geplant
als vorgeschlagen (FR-3.3: die Detailplanung zeigt die Abweichung zur Grobplanung an).

### 3.5 Funktion in der Erinnerungsfunktion

Geplante Lernzeiten sind eine von drei Grundlagen der automatischen Erinnerungsfunktion, siehe
Abschnitt 6.

---

## 4. Konzept: Zwischenziel (FR-3.2)

### 4.1 Definition

Ein Zwischenziel ist ein kurzfristiges Arbeitspaket innerhalb eines Kalendermonats — z. B.
"Kapitel 3 abschließen" — und damit fachlich klar vom Lernziel abgegrenzt: Das Lernziel spannt
den Sechs-Monats-Horizont, das Zwischenziel den laufenden Monat. Ein Zwischenziel hat weder
Note noch Priorität noch eine eigene Fortschrittsrechnung; es kennt nur einen Erledigt-Zustand.

### 4.2 Attribute eines Zwischenziels

| Attribut | Bedeutung |
|---|---|
| Titel | Kurze Beschreibung des Arbeitspakets (1–200 Zeichen) |
| Jahr, Monat | Der Monat, dem das Zwischenziel zugeordnet ist |
| Fälligkeitstag (optional) | Konkreter Tag im Monat |
| Lernziel (optional) | Kann, muss aber nicht einem Lernziel zugeordnet sein |
| Erledigt | Boolescher Zustand, per Checkbox umschaltbar |

### 4.3 Zähler und Sichtbarkeit

Auf der Planungsseite und als Kachel auf dem Dashboard erscheint je Lernziel bzw. für den
laufenden Monat ein Zähler der Form "1 / 4" (erledigte von insgesamt fälligen Zwischenzielen
des Monats). Ein Zwischenziel mit gesetztem Fälligkeitstag erscheint zusätzlich im Kalender-Tab
am entsprechenden Tag.

---

## 5. Konzept: Lernsession

### 5.1 Definition

Eine Lernsession ist eine einzelne, zeitlich begrenzte Lerneinheit, die der Nutzer per Timer
aufzeichnet. Sie ist einem Lernziel zugeordnet und speichert Startzeit, Pausen und Endzeit.

### 5.2 Zustände einer Lernsession

    aktiv → pausiert → abgeschlossen
          ↑____________↑

- **Aktiv:** Timer läuft, Nutzer lernt gerade.
- **Pausiert:** Timer wurde gestoppt; die aktuelle Pausendauer läuft an. Die Session ist noch
  offen und kann fortgesetzt werden.
- **Abgeschlossen:** Session wurde beendet; Dauer ist berechnet und gespeichert. Beim Stoppen
  kann optional eine Notiz (bis 500 Zeichen) hinterlegt werden.

Es kann zu jedem Zeitpunkt nur eine aktive oder pausierte Session pro Nutzer geben.

### 5.3 Dauerberechnung

Die aufgezeichnete Lernzeit berücksichtigt nur die Zeit, in der der Nutzer tatsächlich gelernt
hat — Pausen werden abgezogen:

    Reine Lernzeit = (Endzeit − Startzeit) − Gesamte Pausendauer

Die gesamte Pausendauer ist die Summe aller Pausenintervalle (bei mehrfachem Pause/Weiter).

**Beispiel:**
- Session gestartet: 14:00 Uhr
- Pause: 14:30–14:45 Uhr (15 Minuten)
- Session beendet: 15:00 Uhr
- Gesamtdauer: 60 Minuten − 15 Minuten Pause = **45 Minuten reine Lernzeit**

Die Pausenzeit eines Kalendermonats wird zusätzlich als eigene Kennzahl auf dem Dashboard und
in der Auswertung ausgewiesen (FR-4.3): Da die gezählte Lernzeit ohnehin nie Pausen enthält,
zeigt diese Kennzahl separat, wie viel Pausenzeit insgesamt angefallen ist.

### 5.4 Timer-Anzeige im Browser

Der Browser-Timer zeigt die verstrichene Zeit seit dem Start, abzüglich bereits aufgelaufener
Pausenzeiten. Die Berechnung erfolgt clientseitig jede Sekunde:

    Angezeigte Zeit = (aktuelle Zeit − Startzeit) − bereits aufgelaufene Pausensekunden

Beim Fortsetzen nach einer Pause übergibt der Server dem Browser die bis dahin
angesammelten Pausensekunden, sodass der Timer korrekt weiterläuft — unabhängig davon,
wie lange der Browser-Tab geschlossen war.

---

## 6. Konzept: Erinnerungen (FR-7.1, FR-7.2, FR-7.3)

Seit Plan P11 sind alle drei automatischen Erinnerungsarten in einem Glocken-Symbol-Dropdown in
der Navigationsleiste gebündelt (zuvor standen sie als Balken auf dem Dashboard). Ein
Zähler-Badge an der Glocke zeigt die Anzahl aktuell aktiver Erinnerungen; das Dropdown lädt
seinen Inhalt bei jedem Öffnen neu und schließt sich seit Plan P14 automatisch, sobald der
Nutzer zwischen den Reitern wechselt oder außerhalb des Dropdowns klickt.

| Erinnerung | Auslöser |
|---|---|
| FR-7.1: Inaktivität | Für heute ist Lernzeit geplant, aber noch keine Session gestartet — oder: für den laufenden Monat ist Lernzeit geplant, aber seit mindestens drei Tagen wurde keine Session abgeschlossen. |
| FR-7.2: Bevorstehender Termin | Ein geplanter Slot mit gesetzter Uhrzeit beginnt innerhalb der nächsten Stunde. |
| FR-7.3: Nahendes Zieldatum | Das Zieldatum eines noch nicht erreichten Lernziels liegt in höchstens 14 Tagen, und der Fortschritt (aufgezeichnete Zeit ÷ Gesamtaufwand, siehe Abschnitt 2.4) liegt unter 50 %. |

Alle drei Erinnerungen erscheinen ausschließlich in der Anwendung selbst; es wird keine E-Mail
verschickt (FR-7.4, konfigurierbare Benachrichtigungskanäle, ist als "Could"-Anforderung bewusst
nicht umgesetzt, siehe Abschnitt 8). Ein Klick auf eine Erinnerung führt zur Timer-Seite.

---

## 7. Geschäftsregeln

| Regel | Beschreibung |
|---|---|
| GR-1 | Es kann immer nur eine aktive oder pausierte Session gleichzeitig existieren. Ein erneuter Start-Versuch wird mit einem Fehler abgelehnt (HTTP 409). |
| GR-2 | Beim Löschen eines Lernziels werden alle zugehörigen Planungseinträge, Lernsessions und Zwischenziele automatisch mitgelöscht (Cascade Delete). Eine laufende Session blockiert das Löschen nicht. Das Löschen-Formular weist explizit darauf hin, wenn dem Ziel noch Zwischenziele zugeordnet sind. |
| GR-3 | Das Zieldatum eines Lernziels muss beim Anlegen und bei jeder echten Änderung heute oder in der Zukunft liegen (höchstens zehn Jahre voraus). Bleibt das Datum bei einer Bearbeitung unverändert, gilt diese Prüfung nicht — sonst ließe sich ein Lernziel mit bereits verstrichenem Termin nicht mehr umbenennen. |
| GR-4 | Passwörter werden serverseitig gehasht (Werkzeug `generate_password_hash`) und nie im Klartext gespeichert. |
| GR-5 | Alle Endpunkte außer Registrierung, Login und Health-Check erfordern einen gültigen JWT-Token. Abgelaufene oder fehlende Token werden mit HTTP 401 abgelehnt. Token haben eine Laufzeit von 8 Stunden. |
| GR-6 | Nutzer sehen ausschließlich ihre eigenen Daten. Zugriffe auf fremde Ressourcen werden mit HTTP 404 abgelehnt (Existenz wird nicht verraten, kein HTTP 403). |
| GR-7 | Der manuelle Lernaufwand-Override (`workload_hours`, Abschnitt 2.4) überschreibt die ECTS-Formel vollständig, sobald er gesetzt ist — es gibt keine Mischrechnung. Ein leeres Feld (oder das explizite Löschen des Wertes) stellt die Formel wieder her. |

---

## 8. Abgrenzung: Was die Anwendung nicht kann

Von den 24 funktionalen Anforderungen sind alle 8 Must- und alle 8 Should-Anforderungen
vollständig umgesetzt. Offen sind ausschließlich die folgenden drei Could-Anforderungen —
bewusst zurückgestellt, weil sie laut Anforderungsdokument die niedrigste Priorität tragen und
für den Kern-Usecase nicht notwendig sind:

| Anforderung | Priorität | Begründung der Nicht-Umsetzung |
|---|---|---|
| FR-2.3: Feiertage/Urlaub in der Grobplanung berücksichtigen | Could | Die Grobplanung verteilt den Restaufwand gleichmäßig auf Wochen/Monate; eine Aussparung einzelner Tage würde die Rechenlogik deutlich verkomplizieren, ohne für den Kern-Usecase (Lernzeit grob verteilen) nötig zu sein. |
| FR-4.4: Manuelle Nacherfassung von Lernzeit | Could | Der Timer deckt den Hauptfall ab; eine rückwirkende Erfassung ohne Timer ist als Komfortfunktion zurückgestellt. |
| FR-7.4: Konfigurierbare Benachrichtigungskanäle (E-Mail) | Could | Erfordert einen Mailversand-Dienst und Konfigurationsoberfläche; der In-App-Erinnerungs-Hub (Abschnitt 6) deckt den Kern-Usecase bereits ab. |

Die "Offene Frage" aus dem Anforderungsdokument (Kopplung an reale Kalender, z. B. iCal-Export)
ist unverändert offen und keiner Anforderung fest zugeordnet; der Kalender-Tab (seit Plan P10)
ist rein anwendungsintern.

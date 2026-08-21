# Benutzerhandbuch — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Stand:** 2026-08-21 (nachgeführt nach Plan P14; ursprüngliche MS4-Auslieferung: August 2026)

---

## 1. Einführung

Der Lernzeit-Manager ist eine Web-Anwendung, die dir dabei hilft, dein Studium besser zu
organisieren. Du kannst Lernziele anlegen, deine Lernzeit grob und im Detail planen, deine
tatsächlich investierte Zeit per Timer aufzeichnen und deinen Fortschritt auf Dashboard,
Kalender und Auswertung im Blick behalten.

Die Anwendung läuft komplett im Browser — du musst nichts installieren. Deine Daten werden
sicher auf einem Server gespeichert und sind nach dem Login von überall abrufbar.

Die Navigationsleiste am oberen Rand hat sechs Reiter: **Dashboard**, **Lernziele**,
**Planung**, **Timer**, **Kalender** und **Auswertung**. Daneben zeigt ein Glocken-Symbol
deine aktuellen Erinnerungen (siehe Abschnitt 8).

---

## 2. Erste Schritte

### 2.1 Konto erstellen

Beim ersten Besuch der App wirst du automatisch zur Anmeldeseite weitergeleitet.
Klicke unten auf den Link **"Noch kein Konto? Registrieren"**, um ein neues Konto anzulegen.

Fülle das Formular aus:

| Feld | Beschreibung |
|---|---|
| Name | Dein Anzeigename (z. B. "Max Mustermann") |
| E-Mail-Adresse | Deine E-Mail-Adresse — wird zum Einloggen verwendet |
| Passwort | Mindestens 6 Zeichen |

Klicke auf **"Konto erstellen"**. Du wirst direkt zum Dashboard weitergeleitet.

### 2.2 Einloggen

Öffne die App und gib deine E-Mail-Adresse und dein Passwort ein. Klicke auf **"Anmelden"**.

Nach dem Login bleibst du automatisch eingeloggt, bis du dich aktiv abmeldest, dein Token nach
8 Stunden abläuft, oder ein neues Gerät verwendet wird. Ein versehentlicher Seiten-Reload
meldet dich **nicht** ab.

### 2.3 Abmelden

Klicke oben rechts in der Navigationsleiste auf **"Abmelden"**. Du wirst zur Anmeldeseite
weitergeleitet und deine Sitzung wird beendet.

---

## 3. Lernziele verwalten

Die Seite **"Lernziele"** erreichst du über die obere Navigationsleiste. Die Zielliste steht
in der Hauptspalte, das Formular zum Anlegen eines neuen Ziels als schmale Seitenleiste daneben
(ab einer Fensterbreite von etwa 1000 px; darunter erscheint das Formular unterhalb der Liste).

### 3.1 Neues Lernziel anlegen

Fülle das Formular in der Seitenleiste aus:

| Feld | Beschreibung | Pflichtfeld |
|---|---|---|
| Titel | Kurzer, beschreibender Name (z. B. "Statistik Klausur") | Ja |
| Modul / Kurs | Modulkürzel oder Kursname (z. B. "DLBSTAT01") | Ja |
| ECTS-Punkte des Moduls | Anzahl der ECTS-Punkte laut Modulhandbuch (1–30) | Ja |
| Lernaufwand in Stunden (optional) | Überschreibt den aus den ECTS-Punkten berechneten Aufwand | Nein |
| Wann willst du fertig sein? | Dein Zieldatum (heute oder später, höchstens 10 Jahre voraus) | Ja |
| Priorität (optional) | Hoch / mittel / niedrig | Nein |

**Hinweis zu ECTS:** Die App nutzt standardmäßig die ECTS-Punktzahl, um den gesamten
Lernaufwand zu berechnen. Ein ECTS entspricht ca. 30 Stunden Lernaufwand; ein 5-ECTS-Modul
bedeutet also 150 Stunden. Diesen Wert siehst du im Dashboard als Fortschrittsbalken und auf
der Planungsseite als Wochenbudget.

**Hinweis zum Lernaufwand in Stunden:** Weißt du aus Erfahrung, dass ein Modul in Wirklichkeit
weniger oder mehr Zeit braucht als die ECTS-Formel annimmt (z. B. ein 5-ECTS-Modul mit
tatsächlich nur 50 statt 150 Stunden), trage die reale Stundenzahl hier ein. Sie ersetzt dann
überall — Dashboard, Planung, Auswertung — den automatisch berechneten Wert. Lässt du das Feld
leer, ändert sich nichts: Es gilt weiterhin ECTS × 30 Stunden.

Klicke auf **"Ziel hinzufügen"**. Das Ziel erscheint sofort in der Liste. Eingabefehler
erscheinen direkt unter dem betroffenen Feld, ohne dass die Seite neu lädt.

### 3.2 Lernziel bearbeiten

Klicke bei einem Lernziel auf **"✎ Bearbeiten"**. Die Karte verwandelt sich in ein Formular mit
allen Feldern aus 3.1, zusätzlich:

| Feld | Beschreibung |
|---|---|
| Status | Offen / in Arbeit / erreicht |
| Note (optional) | Dein Ergebnis, frei eintragbar (z. B. "1,7") |
| Notiz / Ergebnis (optional) | Freier Text, z. B. Feedback oder Lessons Learned |

Klicke auf **"Speichern"**, um die Änderungen zu übernehmen, oder auf **"Abbrechen"**, um sie
zu verwerfen. Ein Aufruf der Lernziele-Seite mit einem Link aus dem Dashboard (z. B. über einen
Zwischenziel-Eintrag) öffnet das Bearbeiten-Formular des betroffenen Ziels automatisch.

### 3.3 Status eines Lernziels ändern

Auf der (nicht im Bearbeiten-Modus befindlichen) Zielkarte:

- Klicke **"▶ In Arbeit"**, um ein offenes Ziel zu starten.
- Klicke **"✓ Erreicht"**, um ein Ziel als abgeschlossen zu markieren.

### 3.4 Lernziel löschen

Klicke auf **"🗑 Löschen"** beim jeweiligen Lernziel. Eine Sicherheitsabfrage erscheint —
bestätige mit "OK", um das Ziel endgültig zu entfernen. Sind dem Ziel noch offene Zwischenziele
zugeordnet, weist die Abfrage explizit darauf hin.

**Achtung:** Beim Löschen werden auch alle zugehörigen Lernzeiten, Planungseinträge und
Zwischenziele gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.

---

## 4. Lernzeit planen

Die Seite **"Planung"** erreichst du über die obere Navigationsleiste.

### 4.1 Grobplanung: Wochenbudget und Monatsvorschlag

Für jedes Lernziel zeigt die Planungsseite:

- **Wochenbudget:** Wie viele Minuten du ab jetzt pro Woche lernen müsstest, um dein Zieldatum
  einzuhalten (Restaufwand ÷ verbleibende Wochen).
- **Monatsvorschlag:** Ein Vorschlag, wie viel Zeit im gewählten Monat sinnvoll wäre
  (Restaufwand gleichmäßig auf die Monate bis zum Zieldatum verteilt). Der Vorschlag legt
  selbst **keine** Lernzeiten an — du planst weiterhin selbst.
- **Abweichung:** Vergleich zwischen bereits geplanter Zeit im gewählten Monat und dem
  Monatsvorschlag.

### 4.2 Lernzeit einplanen

Im Bereich **"Lernzeit einplanen"** kannst du eine einzelne konkrete Lerneinheit vorausplanen.

| Feld | Beschreibung | Pflichtfeld |
|---|---|---|
| Lernziel | Das Modul/Ziel, für das du planst | Ja |
| Tag des Monats | Optionaler Tag (z. B. 15 für den 15. des Monats) | Nein |
| Uhrzeit | Optionale Uhrzeit (z. B. 18:00) | Nein |
| Wie lange? (Minuten) | Geplante Lernzeit in Minuten (5–480) | Ja (Standard: 60) |
| Notiz | Optionaler Hinweis (z. B. "Kapitel 3 lesen") | Nein |

Klicke auf **"Lernzeit speichern"**.

### 4.3 Serientermine anlegen

Statt einzelner Termine kannst du über ein Tages-Raster des gewählten Monats mehrere Tage auf
einmal auswählen und mit denselben Uhrzeit-, Dauer- und Notiz-Angaben anlegen. Schnellwahl-
Buttons markieren automatisch alle Werktage oder alle Vorkommen eines bestimmten Wochentags
(z. B. "jeden Mittwoch"). Ein Klick auf **"Lernzeit speichern"** legt dann für jeden markierten
Tag einen eigenen, später einzeln bearbeit- und löschbaren Eintrag an.

### 4.4 Zwischenziele festlegen

Für den ausgewählten Monat kannst du kurze Arbeitspakete festhalten, z. B. "Kapitel 3
abschließen":

| Feld | Beschreibung | Pflichtfeld |
|---|---|---|
| Titel | Kurze Beschreibung | Ja |
| Fälligkeitstag | Optionaler Tag im Monat | Nein |
| Lernziel | Optional einem Lernziel zuordnen | Nein |

Ein Häkchen markiert ein Zwischenziel als erledigt. Ein Zähler ("1 / 4") zeigt, wie viele der
Zwischenziele des Monats bereits erledigt sind — sowohl auf dieser Seite als auch als Kachel
auf dem Dashboard.

### 4.5 Planung filtern

Über die Filter oben kannst du die Ansicht einschränken:

- **Lernziel:** Zeige nur Einträge für ein bestimmtes Ziel.
- **Monat:** Wechsle zwischen Monaten (ein Monat vor bis sieben Monate nach dem aktuellen
  Monat).

Die geplanten Lernzeiten erscheinen je Lernziel gruppiert, mit Titel, Modul und der insgesamt
für dieses Ziel geplanten Zeit.

### 4.6 Eintrag löschen

Klicke beim jeweiligen Eintrag (Lernzeit oder Zwischenziel) auf **"Löschen"** bzw. das
Papierkorb-Symbol.

---

## 5. Timer bedienen

Die Seite **"Timer"** erreichst du über die obere Navigationsleiste.

### 5.1 Lernsession starten

Wähle im Dropdown **"Lernziel auswählen"** das Ziel aus, an dem du gerade arbeitest.
Klicke dann auf **"▶ Start"**.

Der Timer startet sofort und zeigt die vergangene Zeit im Format HH:MM:SS an.
Du kannst jetzt mit dem Lernen beginnen — der Timer läuft auch dann weiter, wenn du
in einen anderen Browser-Tab wechselst oder den Browser schließt.

**Hinweis:** Es kann immer nur eine Session gleichzeitig laufen. Wenn du eine neue Session
starten möchtest, beende zuerst die aktive.

### 5.2 Session pausieren

Klicke auf **"⏸ Pause"**, wenn du eine Unterbrechung machst (z. B. eine kurze Kaffeepause).

Die Pausenzeit wird nicht als Lernzeit gezählt. Wenn du fortfährst, klicke auf
**"▶ Weiter"** — der Timer läuft wieder, aber die Pausendauer wurde bereits abgezogen.

### 5.3 Session beenden

Klicke auf **"⏹ Stopp"**, wenn du fertig bist. Du kannst optional eine Notiz eintragen
(z. B. "Kapitel 5 durchgearbeitet"). Die Session wird gespeichert und erscheint sofort in der
Liste **"Zuletzt gelernt"** unterhalb des Timers.

Die gespeicherte Dauer ist die reine Lernzeit (Gesamtzeit minus alle Pausen).

### 5.4 Verlauf der Lernsessions

Im Bereich **"Zuletzt gelernt"** siehst du deine letzten 10 Sessions mit Lernziel, Dauer und
Datum.

---

## 6. Dashboard

Das **Dashboard** ist die Startseite nach dem Login. Ab einer Fensterbreite von etwa 1000 px
zeigt es ein Zwei-Spalten-Layout: Kennzahlen, Monatsfortschritt und Wochendiagramm links, die
Lernziel-Karten rechts (darunter bleibt es einspaltig).

### 6.1 Monatsstatistiken

Kacheln zeigen dir:

| Kachel | Bedeutung |
|---|---|
| Geplant [Monat] | Summe aller geplanten Lernminuten im laufenden Monat |
| Gelernt [Monat] | Summe aller tatsächlich aufgezeichneten (ungestörten) Lernzeiten |
| Pausen [Monat] | Summe aller Pausenzeiten des Monats |
| Geschafft | Prozentualer Anteil: Gelernt ÷ Geplant × 100 |
| Zwischenziele | Zähler "erledigt / gesamt" für den laufenden Monat |

### 6.2 Fortschrittsbalken und Wochendiagramm

Der Fortschrittsbalken im Bereich **"Dein Fortschritt im [Monat]"** zeigt, wie viel du von
deinem Monatsziel bereits erreicht hast. Darunter ein Balkendiagramm der Lernzeit der letzten
acht Kalenderwochen.

### 6.3 Lernziele-Übersicht

Jedes deiner Lernziele wird mit einem eigenen Fortschrittsbalken angezeigt. Der Balken
vergleicht deine gesamte aufgezeichnete Lernzeit mit dem gesamten Lernaufwand (ECTS-Formel
oder dein manueller Override, siehe 3.1). Er wechselt die Farbe je nach Fortschritt: Rot unter
50 %, Orange 50–99 %, Grün ab 100 %. Fällige Zwischenziele des Ziels erscheinen direkt unter
der Karte und lassen sich von hier aus abhaken.

### 6.4 Aktive Session im Dashboard

Wenn du gerade eine Lernsession laufen hast, zeigt das Dashboard einen blauen Hinweis:

> "▶ Aktive Session: [Zielname] läuft gerade."

Mit **"Zum Timer"** wechselst du direkt zur Timer-Seite.

---

## 7. Kalender

Die Seite **"Kalender"** zeigt ein monatliches Raster. Je Tag erscheinen die geplanten
Lernzeiten (mit Uhrzeit, sofern gesetzt), fällige Zwischenziele und die Zieldaten deiner
Lernziele. Der heutige Tag ist hervorgehoben; bereits erreichte Lernziele erscheinen gedämpft
und durchgestrichen. Lernzeiten ohne festen Tag stehen gesondert unter "Ohne festen Tag".
Unter rund 800 px Fensterbreite schaltet die Ansicht auf eine gescrollte Liste der Tage mit
Einträgen um.

---

## 8. Auswertung

Die Seite **"Auswertung"** fasst deinen Fortschritt über den gesamten Zeitraum zusammen:

- Eine Kennzahlenreihe: geplant, ungestört gelernt, Pausen und Erfüllungsgrad des laufenden
  Monats.
- Das aus dem Dashboard bekannte Wochendiagramm.
- Eine Tabelle **"Plan vs. Ist je Modul"** mit Ampelstatus (grün ab 100 % Fortschritt, gelb ab
  50 %, sonst rot).
- Eine Aufstellung **"Plan vs. Ist je Monat"** über die letzten sechs Kalendermonate.
- Die Liste der erreichten Ziele mit Noten und Ergebnis-Notizen.
- Eine Auswertung **"Wann lernst du?"** nach Tageszeit (morgens/nachmittags/abends/nachts).

---

## 9. Erinnerungen

Erinnerungen erscheinen **nicht** auf dem Dashboard, sondern in einem Glocken-Symbol-Dropdown
neben deinem Namen in der Navigationsleiste. Ein Zähler-Badge an der Glocke zeigt, wie viele
Erinnerungen gerade aktiv sind. Klicke auf die Glocke, um sie zu öffnen; ein Klick auf eine
Erinnerung bringt dich direkt zur Timer-Seite. Das Dropdown schließt sich automatisch, sobald
du in einen anderen Reiter wechselst oder irgendwo außerhalb des Dropdowns klickst.

Drei Arten von Erinnerungen sind möglich:

1. **Inaktivität:**

   > "⚠️ Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?"

   oder, wenn seit mindestens drei Tagen trotz Planung für den laufenden Monat keine Session
   abgeschlossen wurde:

   > "⚠️ Seit 4 Tagen hast du keine Lernzeit erfasst, obwohl für diesen Monat Lernzeit geplant
   > ist."

2. **Bevorstehender Termin:** Ein geplanter Slot mit Uhrzeit beginnt innerhalb der nächsten
   Stunde.

3. **Nahendes Zieldatum:** Das Zieldatum eines Lernziels liegt in höchstens 14 Tagen und der
   Fortschritt liegt unter 50 %.

Erinnerungen erscheinen ausschließlich in der Anwendung selbst — es wird **keine E-Mail**
verschickt. Eine E-Mail-Benachrichtigung ist als eigene Anforderung (FR-7.4, Priorität
„Could") vorgesehen, aber bewusst noch nicht umgesetzt.

---

## 10. Häufige Fragen

**Ich habe mein Passwort vergessen. Was nun?**  
Aktuell gibt es keine automatische Passwort-Zurücksetzen-Funktion. Kontaktiere einen der
Entwickler, um deinen Account zu bereinigen.

**Kann ich meine Daten exportieren?**  
Ein Export-Feature ist nicht vorhanden. Alle Daten bleiben auf dem Server.

**Was passiert, wenn ich den Browser schließe, während der Timer läuft?**  
Der Timer läuft auf dem Server weiter. Wenn du die App erneut öffnest, siehst du die aktive
Session mit der tatsächlich vergangenen Zeit — inklusive der Zeit, in der der Browser
geschlossen war.

**Kann ich Lernzeiten manuell eintragen, falls ich den Timer vergessen habe?**  
Eine manuelle Erfassung (FR-4.4 "Could") ist in der aktuellen Version nicht implementiert.

**Ich weiß, dass ein Modul weniger Zeit braucht als die 30-Stunden-Formel annimmt. Was tun?**  
Trage beim Anlegen oder Bearbeiten des Lernziels im Feld "Lernaufwand in Stunden (optional)"
deine eigene Schätzung ein (siehe Abschnitt 3.1). Sie ersetzt dann überall in der Anwendung den
automatisch berechneten Wert.

**Bekomme ich eine E-Mail, wenn ich eine Erinnerung habe?**  
Nein. Erinnerungen erscheinen ausschließlich im Glocken-Symbol-Dropdown in der Anwendung
(siehe Abschnitt 9).

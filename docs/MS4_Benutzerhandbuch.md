# Benutzerhandbuch — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Datum:** August 2026

---

## 1. Einführung

Der Lernzeit-Manager ist eine Web-Anwendung, die dir dabei hilft, dein Studium besser zu
organisieren. Du kannst Lernziele anlegen, konkrete Lernzeiten einplanen, deine tatsächlich
investierte Zeit per Timer aufzeichnen und auf einem Dashboard deinen Fortschritt im Blick
behalten.

Die Anwendung läuft komplett im Browser — du musst nichts installieren. Deine Daten werden
sicher auf einem Server gespeichert und sind nach dem Login von überall abrufbar.

**Was du mit dem Lernzeit-Manager machen kannst:**

- Lernziele für Module und Kurse anlegen (z. B. "Programmierung I bestehen bis März")
- Konkrete Lernzeiten in einem Kalender einplanen
- Eine Stoppuhr starten, wenn du anfängst zu lernen — inklusive Pausen
- Auf dem Dashboard sehen, wie viel du gelernt hast vs. wie viel du geplant hast
- Eine Erinnerung erhalten, wenn du heute Lernen geplant hast aber noch keine Session gestartet hast

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

Nach dem Login bleibst du automatisch eingeloggt, bis du dich aktiv abmeldest oder ein neues
Gerät verwendest.

### 2.3 Abmelden

Klicke oben rechts in der Navigationsleiste auf **"Abmelden"**. Du wirst zur Anmeldeseite
weitergeleitet und deine Sitzung wird beendet.

---

## 3. Lernziele verwalten

Die Seite **"Lernziele"** erreichst du über die obere Navigationsleiste.

### 3.1 Neues Lernziel anlegen

Fülle das Formular oben auf der Seite aus:

| Feld | Beschreibung | Pflichtfeld |
|---|---|---|
| Titel | Kurzer, beschreibender Name (z. B. "Statistik Klausur") | Ja |
| Modul / Kurs | Modulkürzel oder Kursname (z. B. "DLBSTAT01") | Ja |
| ECTS-Punkte des Moduls | Anzahl der ECTS-Punkte laut Modulhandbuch | Ja |
| Wann willst du fertig sein? | Dein Zieldatum | Ja |

**Hinweis zu ECTS:** Die App nutzt die ECTS-Punktzahl, um den gesamten Lernaufwand zu
berechnen. Ein ECTS entspricht ca. 30 Stunden Lernaufwand. Ein 5-ECTS-Modul bedeutet
also 150 Stunden — das siehst du im Dashboard als Fortschrittsbalken.

Klicke auf **"Ziel hinzufügen"**. Das Ziel erscheint sofort in der Liste darunter.

### 3.2 Status eines Lernziels ändern

Jedes Lernziel hat einen Status, der deinen Fortschritt widerspiegelt:

| Status | Bedeutung |
|---|---|
| Offen | Du hast noch nicht angefangen |
| In Arbeit | Du lernst aktiv an diesem Ziel |
| Erreicht | Du hast das Modul/den Kurs abgeschlossen |

**So änderst du den Status:**

- Klicke **"▶ In Arbeit"**, um ein Ziel zu starten
- Klicke **"✓ Erreicht"**, um ein Ziel als abgeschlossen zu markieren
- Einmal auf "Erreicht" gesetzte Ziele können nicht mehr zurückgesetzt werden

### 3.3 Lernziel löschen

Klicke auf **"🗑 Löschen"** beim jeweiligen Lernziel. Eine Sicherheitsabfrage erscheint —
bestätige mit "OK", um das Ziel endgültig zu entfernen.

**Achtung:** Beim Löschen werden auch alle zugehörigen Lernzeiten und Planungseinträge gelöscht.
Dieser Vorgang kann nicht rückgängig gemacht werden.

---

## 4. Lernzeit planen

Die Seite **"Planung"** erreichst du über die obere Navigationsleiste.

### 4.1 Lernzeit einplanen

Im Bereich **"Lernzeit einplanen"** kannst du konkrete Lerneinheiten für einen bestimmten Monat
vorausplanen.

| Feld | Beschreibung | Pflichtfeld |
|---|---|---|
| Lernziel | Das Modul/Ziel, für das du planst | Ja |
| Tag des Monats | Optionaler Tag (z. B. 15 für den 15. des Monats) | Nein |
| Uhrzeit | Optionale Uhrzeit (z. B. 18:00) | Nein |
| Wie lange? (Minuten) | Geplante Lernzeit in Minuten | Ja (Standard: 60) |
| Notiz | Optionaler Hinweis (z. B. "Kapitel 3 lesen") | Nein |

Klicke auf **"Lernzeit speichern"**. Der neue Eintrag erscheint in der Liste darunter.

### 4.2 Planung filtern

Über die Filter oben kannst du die Ansicht einschränken:

- **Lernziel:** Zeige nur Einträge für ein bestimmtes Ziel
- **Monat:** Wechsle zwischen Monaten (es stehen Monate von einem Monat vor bis sieben
  Monate nach dem aktuellen Monat zur Verfügung)

Die Filterauswahl wird sofort angewendet.

### 4.3 Geplante Lernzeit löschen

Klicke beim jeweiligen Eintrag auf **"Löschen"**. Der Eintrag wird sofort aus der Liste entfernt.

---

## 5. Timer bedienen

Die Seite **"Timer"** erreichst du über die obere Navigationsleiste.

### 5.1 Lernsession starten

Wähle im Dropdown **"Lernziel auswählen"** das Ziel aus, an dem du gerade arbeitest.
Klicke dann auf **"▶ Start"**.

Der Timer startet sofort und zeigt die vergangene Zeit im Format HH:MM:SS an.
Du kannst jetzt mit dem Lernen beginnen — der Timer läuft auch dann weiter, wenn du
in einen anderen Browser-Tab wechselst.

**Hinweis:** Es kann immer nur eine Session gleichzeitig laufen. Wenn du eine neue Session
starten möchtest, beende zuerst die aktive.

### 5.2 Session pausieren

Klicke auf **"⏸ Pause"**, wenn du eine Unterbrechung machst (z. B. eine kurze Kaffeepause).

Die Pausenzeit wird nicht als Lernzeit gezählt. Wenn du fortfährst, klicke auf
**"▶ Weiter"** — der Timer läuft wieder, aber die Pausendauer wurde bereits abgezogen.

### 5.3 Session beenden

Klicke auf **"⏹ Stopp"**, wenn du fertig bist. Die Session wird gespeichert und erscheint
sofort in der Liste **"Zuletzt gelernt"** unterhalb des Timers.

Die gespeicherte Dauer ist die reine Lernzeit (Gesamtzeit minus alle Pausen).

### 5.4 Verlauf der Lernsessions

Im Bereich **"Zuletzt gelernt"** siehst du deine letzten 10 Sessions mit:
- Lernziel
- Dauer (aufgezeichnete Lernzeit)
- Datum

---

## 6. Dashboard

Das **Dashboard** ist die Startseite nach dem Login. Hier siehst du auf einen Blick, wie dein
Monat läuft.

### 6.1 Monatsstatistiken

Drei Kacheln zeigen dir:

| Kachel | Bedeutung |
|---|---|
| Geplant [Monat] | Summe aller geplanten Lernminuten im laufenden Monat |
| Gelernt [Monat] | Summe aller tatsächlich aufgezeichneten Lernzeiten im laufenden Monat |
| Geschafft | Prozentualer Anteil: Gelernt ÷ Geplant × 100 |

### 6.2 Fortschrittsbalken

Der Fortschrittsbalken im Bereich **"Dein Fortschritt im [Monat]"** zeigt, wie viel du von
deinem Monatsziel bereits erreicht hast. Darunter steht zum Beispiel:
> "2h 30min gelernt von 5h geplant"

Der prozentuale Anteil ist als separate Kachel **"Geschafft"** im Statistikbereich darüber sichtbar.

Wenn du noch keine Lernzeiten für diesen Monat geplant hast, erscheint ein Link zur
Planungsseite.

### 6.3 Lernziele-Übersicht

Jedes deiner Lernziele wird mit einem eigenen Fortschrittsbalken angezeigt. Der Balken
vergleicht deine gesamte aufgezeichnete Lernzeit mit dem gesamten Lernaufwand aus den ECTS-Punkten.

Der Balken wechselt die Farbe je nach Fortschritt:
- Rot: weniger als 50 % des Ziels erreicht
- Orange: 50–99 %
- Grün: 100 % oder mehr

### 6.4 Erinnerungen

Der Lernzeit-Manager erinnert dich oben auf dem Dashboard, wenn Lernzeit geplant ist, aber nicht
gelernt wurde. Das geschieht in zwei Fällen:

1. **Für heute ist Lernzeit eingeplant, aber noch keine Session gestartet:**

   > "⚠️ Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?"

2. **Für den laufenden Monat ist Lernzeit geplant, aber seit mindestens drei Tagen wurde keine
   Session abgeschlossen:**

   > "⚠️ Seit 4 Tagen hast du keine Lernzeit erfasst, obwohl für diesen Monat Lernzeit geplant
   > ist."

Ein Klick auf **"Timer starten"** bringt dich in beiden Fällen direkt zur Timer-Seite. Die
Erinnerung erscheint ausschließlich in der Anwendung selbst – es wird **keine E-Mail** verschickt.
Eine E-Mail-Benachrichtigung ist als eigene Anforderung (FR-7.4, Priorität „Could") vorgesehen,
aber bewusst noch nicht umgesetzt.

### 6.5 Aktive Session im Dashboard

Wenn du gerade eine Lernsession laufen hast, zeigt das Dashboard einen blauen Hinweis:

> "▶ Aktive Session: [Zielname] läuft gerade."

Mit **"Zum Timer"** wechselst du direkt zur Timer-Seite.

---

## 7. Häufige Fragen

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

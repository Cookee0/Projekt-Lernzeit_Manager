# Testing-Protokoll – Lernzeit-Manager

## Testumfang

Getestet wurden die Bereiche:

- Registrierung
- Login und Session-Verhalten
- Navigation und Kopfzeile
- Lernziele
- Lernplanung
- Timer
- Dashboard und Darstellung gespeicherter Daten
- Eingabefelder und Validierung

---

## Zusammenfassung

Die zentralen Funktionen zum Registrieren, Einloggen, Anlegen und Verwalten von Lernzielen sowie zum Planen und Stoppen von Lernzeiten sind grundsätzlich vorhanden und funktionsfähig. Es bestehen jedoch mehrere wesentliche Mängel bei der Eingabevalidierung, dem Session-Handling, der initialen Darstellung der Navigation sowie der Filterlogik in der Planung.

Besonders kritisch ist, dass Nutzende nach einem Seiten-Reload ausgeloggt werden. Außerdem fehlen Validierungen für E-Mail-Adressen, ECTS-Werte sowie Datums- und Zeitangaben.

## Testergebnisse

| Bereich | Testfall / Beobachtung | Ergebnis | Priorität |
|---|---|---:|---:|
| Registrierung | Registrierung mit ungültiger E-Mail-Adresse ohne Domain | Funktioniert fälschlicherweise | Hoch |
| Registrierung | E-Mail-Adresse mit Sonderzeichen und Zahlen | Akzeptiert | Niedrig |
| Registrierung | Passwort mit nur zwei Buchstaben | Wird abgelehnt | Erfüllt |
| Registrierung | Passwort mit mindestens sechs Zeichen | Wird akzeptiert | Erfüllt |
| Registrierung | Passwort mit Sonderzeichen | Funktioniert | Erfüllt |
| Registrierung | Validierung des E-Mail-Formats | Nicht vorhanden | Hoch |
| Registrierung | Zurücksetzen der Eingabefeld-Umrandung nach Fehlern | Unklar bzw. möglicherweise nicht möglich | Mittel |
| Startseite | Kopfzeilen-Buttons beim ersten Laden vorhanden | Nicht vorhanden | Hoch |
| Startseite | Kopfzeile erscheint nach Klick auf einen Navigationslink | Funktioniert | Workaround |
| Startseite | Abmelden direkt nach erstem Laden möglich | Nicht möglich, da Navigation fehlt | Hoch |
| Navigation | Links zu Dashboard, Lernziele, Planung und Timer | Funktionieren | Erfüllt |
| Navigation | Kopfzeile nach erneutem Login | Wird angezeigt | Erfüllt, Fehler nur beim initialen Laden |
| Login | Login ohne Passwort | Wird verhindert | Erfüllt |
| Login | Login ohne E-Mail-Adresse | Wird verhindert | Erfüllt |
| Login | Regulärer Login mit gültigen Daten | Funktioniert | Erfüllt |
| Session | Session nach Seiten-Reload erhalten | Nicht erfüllt; Nutzer wird ausgeloggt | Kritisch |
| Lernziele | Lernziel anlegen | Funktioniert | Erfüllt |
| Lernziele | Lernziel auf „In Arbeit“ setzen | Funktioniert | Erfüllt |
| Lernziele | Lernziel auf „Erreicht“ setzen | Funktioniert | Erfüllt |
| Lernziele | Lernziel löschen | Funktioniert | Erfüllt |
| Lernziele | Validierung des Titels | Nicht vorhanden bzw. unklar | Mittel |
| Lernziele | Validierung von Modul und Kurs | Nicht vorhanden | Mittel |
| Lernziele | Eingabe negativer ECTS-Werte | Möglich | Hoch |
| Lernziele | Anlegen von Kursen in der Vergangenheit | Möglich | Mittel |
| Planung | Auswahl eines Lernziels | Funktioniert | Erfüllt |
| Planung | Zuweisung eines Monats | Funktioniert grundsätzlich | Erfüllt |
| Planung | Negative Monatswerte eingeben | Möglich | Hoch |
| Planung | Negativen Tag des Monats eingeben | Möglich | Hoch |
| Planung | Negative Minutenwerte eingeben | Möglich | Hoch |
| Planung | Uhrzeit im europäischen 24-Stunden-Format | Nicht erfüllt; Anzeige in AM/PM | Niedrig |
| Planung | Filter nur mit Lernziel verwenden | Nicht möglich bzw. keine Anzeige | Mittel |
| Planung | Filter nur mit Monat verwenden | Nicht möglich bzw. keine Anzeige | Mittel |
| Planung | Filter mit Lernziel und Monat | Funktioniert | Erfüllt |
| Timer | Startanzeige des Timers | Startet visuell bei 2:00 Stunden | Mittel |
| Timer | Timer pausieren | Funktioniert | Erfüllt |
| Timer | Timer fortsetzen | Funktioniert | Erfüllt |
| Timer | Nachlaufende Zeitberechnung | Funktioniert | Erfüllt |
| Dashboard | Darstellung des Dashboards allgemein | Positiv | Erfüllt |
| Dashboard | Lernziel direkt vom Dashboard erstellen | Nicht vorhanden | Niedrig |
| Dashboard | Anzeige „Zuletzt gelernt“ | Darstellung abhängig von Lernziel-Länge | Mittel |
| Dashboard | Lernzeiten untereinander darstellen | Nicht erfüllt | Mittel |
| Speicherung | Geplante bzw. angezeigte Zeiten speichern | Unklar bzw. Anzeige fällt auf `00:00` zurück | Hoch |
| Erinnerungen | Erinnerung bei Nichteinhaltung geplanter Lernzeiten | Nicht verifizierbar | Hoch |
| Zeitzonen | Umgang mit Zeitzonen | Unklar, weiterer Test erforderlich | Mittel |

## Festgestellte Fehler

### Kritisch

1. **Session geht bei Seiten-Reload verloren**
   - Nach einem Reload wird der Nutzer ausgeloggt.
   - Dies beeinträchtigt die Nutzbarkeit der Anwendung erheblich.
   - Erwartetes Verhalten: Der Login-Status bleibt mindestens für die definierte Session-Dauer erhalten.

### Hoch

1. **Keine E-Mail-Validierung**
   - E-Mail-Adressen ohne Domain, beispielsweise `test`, werden akzeptiert.
   - Erwartetes Verhalten: Prüfung auf ein gültiges E-Mail-Format, z. B. `name@domain.de`.

2. **Kopfzeile fehlt beim ersten Laden**
   - Beim ersten Aufruf der Startseite sind die Navigations- und Logout-Buttons nicht sichtbar.
   - Die Kopfzeile erscheint erst nach Navigation auf eine andere Seite.
   - Dadurch ist ein direktes Abmelden nicht möglich.

3. **Ungültige numerische Werte in der Planung möglich**
   - Negative Monatswerte, Tage und Minuten können eingetragen werden.
   - Erwartetes Verhalten: Wertebereiche begrenzen, z. B. Monat `1–12`, Tag abhängig vom Monat und Minuten `0–59`.

4. **Negative ECTS-Werte möglich**
   - Für Lernziele bzw. Kurse können negative ECTS eingegeben werden.
   - Erwartetes Verhalten: Nur positive numerische Werte zulassen, beispielsweise größer als `0`.

5. **Speicherung beziehungsweise Anzeige geplanter Zeiten fehlerhaft**
   - Die Anzeige scheint auf `00:00` zurückzufallen.
   - Es muss geprüft werden, ob die Daten nicht gespeichert oder nur fehlerhaft dargestellt werden.

6. **Erinnerungsfunktion nicht verifizierbar**
   - Die Must-Anforderung „Erinnerung bei nicht eingehaltenen Lernzeiten“ konnte nicht bestätigt werden.
   - Es ist zu prüfen, ob Erinnerungen implementiert sind und über welchen Kanal sie erfolgen.

## Verbesserungsvorschläge

### Eingabevalidierung

- E-Mail-Adressen mit einer client- und serverseitigen Formatprüfung absichern.
- Passwörter weiterhin auf mindestens sechs Zeichen prüfen; optional um weitere Passwortregeln erweitern.
- ECTS-Werte auf positive Werte beschränken.
- Titel, Modul und Kurs mindestens auf leere Eingaben prüfen.
- Datumseingaben auf gültige Werte begrenzen.
- Negative Zeitangaben verhindern.
- Fehlermarkierungen nach einer gültigen Korrektur wieder zurücksetzen.

### Benutzerführung

- Kopfzeile beim ersten Rendern der Anwendung anzeigen.
- Einen klar sichtbaren Button „Neues Lernziel erstellen“ auf dem Dashboard ergänzen.
- Die Uhrzeit im deutschen bzw. europäischen 24-Stunden-Format darstellen.
- Die Anzeige „Zuletzt gelernt“ als Liste von Sessions untereinander ausgeben, unabhängig von der Länge eines Lernziels.

### Planung und Filter

Die Filterlogik sollte folgende Fälle unterstützen:

| Auswahl | Erwartete Anzeige |
|---|---|
| Nur Lernziel ausgewählt | Alle Planungen des ausgewählten Lernziels |
| Nur Monat ausgewählt | Alle Planungen im ausgewählten Monat |
| Lernziel und Monat ausgewählt | Planungen, die beide Kriterien erfüllen |
| Keine Auswahl | Alle Planungen oder ein klarer Hinweis zur Nutzung des Filters |

### Session und Datenhaltung

- Login-Status nach einem Seiten-Reload persistieren, beispielsweise über einen sicheren Token, Cookie oder eine serverseitige Session.
- Prüfen, ob Zeitdaten korrekt gespeichert werden.
- Zeitzonen einheitlich behandeln, idealerweise Speicherung in UTC und Umrechnung für die Anzeige in lokaler Zeitzone.

## Offene Prüfpunkte

- Werden Erinnerungen bei nicht eingehaltenen Lernzeiten ausgelöst?
- Über welchen Kanal erfolgen Erinnerungen, z. B. In-App, E-Mail oder Browser-Benachrichtigung?
- Werden Planungs- und Timer-Daten tatsächlich persistiert?
- Wie werden Zeitzonen bei Planung, Timer und Anzeige verarbeitet?
- Gibt es eine Validierung oder Zeichenbegrenzung für Titel, Modul und Kurs?
- Ist das Zurücksetzen der Fehlermarkierung eines Eingabefelds nach Korrektur implementiert?

## Abgleich mit Must-Anforderungen

Den vollständigen Abgleich kann ich erst zuverlässig erstellen, wenn der Inhalt von `01_funktionale Anforderungen.md` bereitgestellt wird.

Nach Bereitstellung des Dokuments kann der Abgleich in folgendem Format ergänzt werden:

| Must-ID | Must-Anforderung | Beobachtete Umsetzung | Status | Bemerkung |
|---|---|---|---|---|
| MUS-01 | Beispielanforderung | Teilweise umgesetzt | Teilweise erfüllt | Konkreter Nachbesserungsbedarf |

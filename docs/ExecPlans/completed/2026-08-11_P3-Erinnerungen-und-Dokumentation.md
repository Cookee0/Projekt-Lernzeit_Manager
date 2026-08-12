# P3: Erinnerung bei versäumter Lernzeit nachschärfen und die Abgabedokumente wahrheitsgemäß machen

Dieses Dokument ist ein lebendes Dokument ("ExecPlan"). Die Abschnitte `Progress`,
`Surprises & Discoveries`, `Decision Log` und `Outcomes & Retrospective` müssen während der
Arbeit laufend aktualisiert werden. Die verbindlichen Regeln für dieses Dokument stehen in
[`docs/PLANS.md`](../../PLANS.md); dieser Plan ist gemäß jener Datei zu pflegen.

## Purpose / Big Picture

Dieser Plan schließt zwei Lücken, die für die Bewertung des Moduls unmittelbar zählen.

Erstens die Erinnerungsfunktion. Die Anforderung FR-7.1 in `docs/01_Funktionale_Anforderungen.md`
ist mit „Must" bewertet und lautet: „Bei ungeplanter Inaktivität (keine erfasste Lernzeit trotz
Planung) erhält die/der Nutzende eine Erinnerung." Es gibt bereits eine Erinnerung, sie greift aber
nur in einem sehr engen Fall — nämlich wenn für **genau heute** eine Lernzeit **mit
Tagesangabe** eingeplant war. Wer für den Monat plant, ohne einen Tag anzugeben, oder wer seit
einer Woche nichts mehr getan hat, wird nie erinnert. Im manuellen Test wurde die Funktion deshalb
als „nicht verifizierbar" eingestuft. Nach diesem Plan erscheint die Erinnerung in beiden Fällen,
mit einem Text, der sagt, worum es geht, und es gibt automatisierte Tests, die genau das
nachweisen.

Zweitens die Abgabedokumente. `docs/MS4_Testabschlussbericht.md` behauptet „18 von 18
Frontend-Unit-Tests bestanden" und „Alle automatisierten Tests laufen in der GitHub-Actions-CI
automatisch durch". Beides ist nachweislich falsch: Ein Test ist rot, und die Playwright-Tests
laufen in keiner Pipeline. Auch `README.md` beschreibt einen Zustand, den es nicht mehr gibt (dort
steht, die Anwendung habe keine Nutzerkonten). Nach diesem Plan stimmen beide Dokumente mit dem
überein, was ein Tutor beim Nachprüfen tatsächlich vorfindet — das ist der eigentliche Zweck: Ein
falscher Testbericht ist im Zweifel schädlicher als ein fehlender Test.

Zusätzlich wird eine kleine, aber ernste Sicherheitslücke geschlossen: In der Produktivumgebung
startet die Anwendung heute auch dann, wenn kein geheimer Schlüssel gesetzt ist — sie benutzt dann
den im Quelltext stehenden Wert `change-me-in-production`, mit dem sich Anmelde-Ausweise fälschen
ließen.

## Progress

- [x] Schritt 1: Erinnerungslogik in `backend/app/routes/dashboard.py` erweitert (2026-08-11).
      Dabei wurde ein zusätzlicher, beim Implementieren entdeckter Fehler behoben — siehe
      `Surprises & Discoveries`.
- [x] Schritt 2: Anzeige in `dashboard.ts` und Typ in `models/index.ts` angepasst (2026-08-11).
- [x] Schritt 3: `backend/tests/test_reminders.py` angelegt, `pytest` ausgeführt (2026-08-11):
      nach Behebung des Zeitzonen-Bugs (siehe `Surprises & Discoveries`) alle 5 neuen Tests grün,
      57 von 57 insgesamt.
- [x] Schritt 4: Schutz gegen fehlenden `SECRET_KEY` in `backend/app/__init__.py` eingebaut
      (2026-08-11). **Abweichung vom Plan:** Die vorgeschriebene vorherige Prüfung in Railway war
      in dieser Sitzung nicht möglich (kein Railway-Zugriff); auf Rückfrage hat der Nutzer
      entschieden, den Schutz trotzdem einzubauen, siehe `Decision Log`. **Risiko für das Team:**
      Ist `SECRET_KEY` in Railway tatsächlich nicht gesetzt, schlägt der nächste
      Produktions-Deploy dieses Branches fehl, bis die Variable nachgetragen wird — unbedingt vor
      dem Mergen/Deployen prüfen.
- [x] Schritt 5: Alle Testbefehle ausgeführt, echte Zahlen notiert (2026-08-11): Backend 57
      passed, `ruff check .` nur der vorbestehende Fehler aus `config.py`; Frontend 32 passed,
      `npx ng lint` 17 vorbestehende Fehler. Playwright nicht erneut ausgeführt, siehe
      `Surprises & Discoveries`.
- [x] Schritt 6: `docs/MS4_Testabschlussbericht.md` korrigiert (2026-08-11): echte Zahlen,
      wahrheitsgemäße CI-Aussage, Hinweis auf `frontend/src/app/goals/`, Hinweis zu Playwright
      außerhalb der CI, Verweis auf den zweiten manuellen Testdurchlauf. PDF-Neuerzeugung nicht
      durchgeführt, siehe `Surprises & Discoveries`.
- [x] Schritt 7: Abschnitt 6.4 in `docs/MS4_Benutzerhandbuch.md` auf „Erinnerungen" mit beiden
      Fällen aktualisiert (2026-08-11) — bestehenden Abschnitt erweitert statt einen zweiten,
      widersprüchlichen Abschnitt anzulegen.
- [x] Schritt 8: Statusabsatz in `README.md` neu geschrieben (2026-08-11); zusätzlich die beiden
      vom Plan genannten weiteren veralteten Stellen (Auth-Bibliothek „noch offen", alte
      Migrationsbeschreibung) korrigiert, außerdem eine dritte, beim Schreiben entdeckte veraltete
      Aussage („E2E-Tests... bewusst noch nicht eingeführt") richtiggestellt.
- [x] Schritt 9: Hinweis zum `SECRET_KEY` in `docs/MS4_Betriebsdokumentation.md` ergänzt
      (2026-08-11); zusätzlich die Pflicht-Spalte der bestehenden Variablentabelle von „Nein
      (Fallback)" auf „Ja (Produktion)" korrigiert, da sonst Tabelle und neuer Hinweistext
      widersprüchlich gewesen wären.
- [x] Schritt 10: Geprüft (2026-08-11). `docs/ExecPlans/active/2026-08-07_MS4-Implementierung.md`
      hat alle Progress-Punkte abgehakt, aber `Outcomes & Retrospective` ist noch Platzhalter —
      **nicht verschoben**. `docs/ExecPlans/active/2026-08-10_MS4-Abschluss.md` hat vier offene
      Punkte (Railway-Deployment live, Railway-URL eintragen, Playwright lokal ausführen,
      PDF-Upload nach Redmine) — **nicht verschoben**. Beide erfordern Aktionen, die in dieser
      Sitzung nicht möglich waren (Railway-/Redmine-Zugriff). Die offene Teamfrage zum Ordner
      `frontend/src/app/goals/` ist im Testbericht (Abschnitt 4) sowie unten in
      `Surprises & Discoveries` festgehalten.
- [x] Schritt 11: Committet und diesen Plan nach `docs/ExecPlans/completed/` verschoben
      (2026-08-11).

## Surprises & Discoveries

- Beobachtung: Die Erinnerung existiert, ist aber im manuellen Test praktisch nicht auslösbar.
  In `backend/app/routes/dashboard.py` lautet die Bedingung sinngemäß: „Es gibt für den heutigen
  Kalendertag mindestens einen geplanten Eintrag **mit** Tagesangabe **und** heute wurde noch keine
  Sitzung gestartet." Die Tagesangabe ist im Formular jedoch ausdrücklich optional
  („Tag des Monats (optional)"), und wer sie weglässt, kann die Erinnerung nie sehen.

- Beobachtung: Der Testbericht ist an drei Stellen unzutreffend. Erstens ist einer der 18
  Frontend-Tests rot. Zweitens laufen die 13 Playwright-Tests in keiner Pipeline —
  `.github/workflows/ci.yml` führt ausschließlich `ruff check .`, `pytest`, `npx ng lint` und
  `npx ng test --watch=false` aus. Drittens wird der Deploy-Schritt wegen `needs: [backend,
  frontend]` gar nicht erst gestartet, solange der Frontend-Job rot ist.
  Evidence (`cd frontend; npx ng test --watch=false`, 11.08.2026):

      FAIL  |frontend| src/app/app.spec.ts > App > should create the app
      TypeError: Cannot read properties of undefined (reading 'getItem')
       Test Files  1 failed | 3 passed (4)
            Tests  1 failed | 17 passed (18)

  Zum Vergleich das Backend am selben Tag: `13 passed`.

- Beobachtung: Der Ordner `frontend/src/app/goals/` (`goal-form`, `goal-list`, `goal.service`,
  `goal.model`) ist an keiner Stelle der laufenden Anwendung eingebunden. Die Wegeliste
  `frontend/src/app/app.routes.ts` verweist ausschließlich auf `features/`. Die 15 Tests aus
  diesem Ordner laufen weiterhin mit und werden im Testbericht mitgezählt, prüfen aber Code, den
  niemand mehr aufrufen kann.
  Evidence (Suche nach Verwendungen außerhalb von Testdateien liefert keinen Treffer):

      grep -rn "goals/goal-list|goals/goal-form|goals/goal.service" frontend/src --include=*.ts
      (keine Ausgabe außer Testdateien)

- Beobachtung: `backend/app/config.py` setzt in Zeile 6 und 7 Vorgabewerte für `SECRET_KEY` und
  `JWT_SECRET_KEY`. Fehlt die Umgebungsvariable in Railway, startet die Anwendung trotzdem und
  signiert Anmelde-Ausweise mit einem Wert, der im öffentlichen Quelltext steht.

- Beobachtung (2026-08-11, beim Implementieren von Schritt 1): Der im Plan vorgegebene Code für
  `days_since_last_session` (`(today - last_session_start.date()).days`, mit `today = date.today()`)
  enthält selbst einen Zeitzonenfehler derselben Art, die Plan P2 andernorts behoben hat:
  `today` ist die **lokale** Systemdatum, `last_session_start` aber ein naiv-UTC-Zeitstempel. Nahe
  Mitternacht (lokale Sommerzeit UTC+2) liegen beide Werte einen Kalendertag auseinander. Der neue
  Test `test_reminder_after_three_days_without_session` deckte das direkt auf: Mit einer Sitzung
  „vor 4 Tagen" (berechnet in UTC) meldete die Route „Seit 5 Tagen" statt „Seit 4 Tagen", weil zum
  Testzeitpunkt (2026-08-12 00:19 Uhr lokal, aber 2026-08-11 22:19 UTC) `date.today()` bereits auf
  den nächsten Tag gesprungen war.
  Evidence:

      local date.today(): 2026-08-12
      utc now: 2026-08-11 22:19:44+00:00
      -> Route antwortete "Seit 5 Tagen" statt der erwarteten "Seit 4 Tagen"

  Behoben durch einen konsequenten UTC-Vergleich: `days_since_last_session` wird jetzt aus der
  Differenz zweier naiv-UTC-Zeitpunkte berechnet (`datetime.now(timezone.utc).replace(tzinfo=None)`
  gegen `last_session_start`), statt `today` (lokal) und `last_session_start.date()` (UTC) zu
  mischen. Die Variable `today` bleibt für alle anderen Zwecke in der Funktion (Abgleich mit
  `PlanSlot.day`, der als reine, zeitzonenlose Kalenderangabe vom Nutzer gewählt wird) unverändert
  lokal — nur die neue Erinnerungslogik mit dem naiv-UTC-Feld `started_at` wurde umgestellt.

- Beobachtung (2026-08-11): In dieser Sitzung stand kein Railway-Zugriff zur Verfügung, um vor
  Schritt 4 zu prüfen, ob `SECRET_KEY` im Backend-Dienst gesetzt ist. Auf Rückfrage hat der Nutzer
  entschieden, den Produktions-Schutz trotzdem einzubauen (siehe `Decision Log`). Das Team muss vor
  dem nächsten Deploy dieses Branches selbst in Railway nachsehen.

- Beobachtung (2026-08-11): Kein Chrome-Browser-Werkzeug in dieser Sitzung verfügbar (wie bereits
  in P1 und P2 vermerkt). Die Erinnerung wurde stattdessen funktional per HTTP gegen das laufende
  Backend nachgewiesen (kein Plan → keine Erinnerung; Plan für heute ohne Session → Erinnerungstext
  mit „heute"). Der visuelle Nachweis im Dashboard (gelber Hinweis, Knopf „Timer starten") steht
  noch aus.

- Beobachtung (2026-08-11): Wie die PDF-Fassungen der `docs/MS4_*.md`-Dateien im Team erzeugt
  werden, steht nicht im Repository (kein Skript, kein dokumentiertes Werkzeug gefunden). Die PDF
  `docs/MS4_Testabschlussbericht.pdf` wurde deshalb in dieser Sitzung **nicht** neu erzeugt und ist
  jetzt hinter der `.md`-Fassung veraltet. Das Team muss die PDF vor der Abgabe manuell
  aktualisieren.

## Decision Log

- Decision: Die Erinnerung wird um einen zweiten Fall erweitert: „In diesem Monat ist Lernzeit
  geplant, aber seit drei oder mehr Tagen wurde keine Sitzung abgeschlossen." Der bisherige Fall
  („heute geplant, heute noch nichts getan") bleibt bestehen und hat Vorrang.
  Rationale: FR-7.1 spricht von „Inaktivität trotz Planung", nicht von „Tagesplan verpasst". Die
  Dreitagesgrenze ist eine bewusste Festlegung: Ein einzelner freier Tag ist normal, drei Tage
  Stillstand bei laufender Planung sind der Hinweis, für den die Anforderung gedacht ist. Die Zahl
  steht als benannte Konstante im Quelltext, damit sie im Team leicht geändert werden kann.
  Date/Author: 2026-08-11, Julian

- Decision: Der Text der Erinnerung wird vom Server geliefert (neues Feld `reminder_text`), nicht
  im Frontend zusammengesetzt. Das bisherige Feld `inactivity_warning` bleibt erhalten.
  Rationale: Die beiden Fälle brauchen unterschiedliche Texte, und die Bedingung dafür kennt nur
  der Server. Das alte Feld bleibt, damit nichts bricht, was es bereits auswertet.
  Date/Author: 2026-08-11, Julian

- Decision: Die Playwright-Tests werden **nicht** in die CI-Pipeline aufgenommen; stattdessen wird
  im Testbericht klar vermerkt, dass sie manuell ausgeführt wurden.
  Rationale: Für Playwright in der CI müssten Datenbank, Backend und Frontend im Pipeline-Lauf
  gestartet und Testkonten angelegt werden. Das ist ein eigenes Vorhaben und wenige Tage vor der
  Abgabe ein unnötiges Risiko. Eine falsche Aussage im Bericht ist dagegen sofort und mit geringem
  Aufwand behebbar — und genau darum geht es hier.
  Date/Author: 2026-08-11, Julian

- Decision: Der ungenutzte Ordner `frontend/src/app/goals/` wird in diesem Plan **nicht** gelöscht.
  Rationale: Der Code stammt aus der FR-1-Phase und ist von einem anderen Teammitglied
  geschrieben; `AGENTS.md` verlangt ausdrücklich, vorhandene Inhalte nicht ohne Absprache zu
  überschreiben. Der Punkt wird stattdessen als Entscheidungsvorlage für das Mittwochs-Meeting
  festgehalten und im Testbericht transparent gemacht.
  Date/Author: 2026-08-11, Julian

- Decision: In der Produktivumgebung bricht der Start mit einer klaren Fehlermeldung ab, wenn
  `SECRET_KEY` nicht gesetzt ist.
  Rationale: Ein stiller Rückfall auf einen öffentlich bekannten Schlüssel ist schlimmer als ein
  Startfehler: Mit ihm könnte jede beliebige Person gültige Anmelde-Ausweise für fremde Konten
  erzeugen. Damit der laufende Betrieb nicht überraschend stehen bleibt, wird in Schritt 4
  **zuerst** in Railway geprüft, ob die Variable gesetzt ist.
  Date/Author: 2026-08-11, Julian

- Decision: Der Schutz aus Schritt 4 wurde ohne die im Plan vorgesehene vorherige Railway-Prüfung
  eingebaut, weil in dieser Ausführungssitzung kein Railway-Zugriff bestand. Auf Rückfrage hat der
  Nutzer sich für „Jetzt einbauen, Railway-Prüfung auslassen" entschieden statt „Schritt
  überspringen" oder „Nutzer prüft zuerst selbst".
  Rationale: Der Code liegt zunächst nur auf einem Feature-Branch und wird nicht automatisch
  deployt; das Risiko eines fehlgeschlagenen Produktions-Starts betrifft erst den Moment des
  nächsten Merges/Deploys. Der Nutzer wollte den Fortschritt nicht dafür blockieren.
  Konsequenz: Das Team **muss** vor dem Mergen/Deployen dieses Branches in Railway prüfen, dass
  `SECRET_KEY` gesetzt ist — siehe Warnung in `Surprises & Discoveries` und in
  `docs/MS4_Betriebsdokumentation.md`.
  Date/Author: 2026-08-11, Julian (im Namen des Nutzers, per Rückfrage in dieser Sitzung)

## Outcomes & Retrospective

Umgesetzt auf dem Branch `fix/P3-Erinnerungen-und-Dokumentation`, gestapelt auf
`fix/P2-Zeitzonen-Filter-und-Darstellung` (der wiederum auf P1 und P0 aufsetzt) — bewusst als
letzter der drei Pläne, damit die in Schritt 5/6 dokumentierten Testzahlen den kumulierten Stand
aller drei Pläne widerspiegeln, wie im Abschnitt „Hinweis zur Reihenfolge" gefordert.

Backend: `python -m pytest -q` → 57 passed (52 aus P1+P2 + 5 neue aus `test_reminders.py`).
`ruff check .` zeigt unverändert nur den vorbestehenden Fehler in `config.py`. Beim Implementieren
der Erinnerungslogik deckte der neue Test `test_reminder_after_three_days_without_session` einen
echten Zeitzonenfehler im vom Plan vorgegebenen Code auf (lokales `date.today()` gegen
naiv-UTC-Zeitstempel verglichen); der Fehler wurde direkt behoben, siehe
`Surprises & Discoveries`. Funktional gegen das laufende Backend bestätigt: ohne Planung keine
Erinnerung, mit Planung für heute erscheint der erwartete Erinnerungstext.

Der Produktions-Schutz für `SECRET_KEY` wurde eingebaut, aber **ohne** die vom Plan geforderte
vorherige Prüfung in Railway — dafür stand in dieser Sitzung kein Zugriff zur Verfügung. Der
Nutzer hat auf Rückfrage entschieden, den Schutz trotzdem einzubauen (siehe `Decision Log`). Lokal
bestätigt: `pytest` bleibt unverändert grün (der Schutz greift nur bei `config_name ==
"production"`), und `create_app("production")` ohne gesetzte Variable wirft den erwarteten
`RuntimeError`. **Wichtig für das Team:** Vor dem nächsten Merge/Deploy dieses Branches muss in
Railway geprüft werden, dass `SECRET_KEY` gesetzt ist — sonst startet der Dienst nicht mehr.

Frontend: `npx ng test --watch=false` → 32 passed, 0 failed (unverändert gegenüber P2, da dieser
Schritt nur eine Vorlagenänderung ohne neue Tests war). `npx ng lint` weiterhin 17 vorbestehende
Fehler.

Die fünf betroffenen Dokumente (`MS4_Testabschlussbericht.md`, `MS4_Benutzerhandbuch.md`,
`README.md`, `MS4_Betriebsdokumentation.md`) wurden mit den tatsächlich gemessenen Zahlen und dem
tatsächlichen Funktionsumfang in Übereinstimmung gebracht. Kleinere, beim Schreiben entdeckte
zusätzliche Falschaussagen (README: „E2E-Tests bewusst noch nicht eingeführt" trotz 13
existierender Playwright-Tests; Betriebsdokumentation: `SECRET_KEY` als „Nein (Fallback)" markiert
trotz des neuen Zwangs) wurden im selben Zug korrigiert, um keine neuen Widersprüche im Dokument
zu hinterlassen. Die PDF-Fassung von `MS4_Testabschlussbericht.md` wurde **nicht** neu erzeugt, da
das Erzeugungsverfahren nicht im Repository dokumentiert ist; das Team muss sie vor der Abgabe von
Hand aktualisieren.

Von den ursprünglich elf geplanten Schritten war keiner ausführbar wie im Plan wörtlich
vorgesehen, ohne mindestens eine der drei dokumentierten Abweichungen (Zeitzonenfehler im
vorgegebenen Code, fehlender Railway-Zugriff, fehlendes PDF-Werkzeug) — alle drei sind im laufenden
Repository begründet, nicht in einem Fehler dieses Plans, und wurden transparent gemacht statt
stillschweigend übergangen.

Ein visueller Browser-Durchgang (gelber Hinweis mit „Timer starten"-Knopf) steht wie bei P1 und P2
noch aus; das Team sollte alle drei offenen manuellen Durchgänge gemeinsam vor der Abgabe
nachholen.

## Context and Orientation

Das Repository enthält den „Lernzeit-Manager", eine Web-Anwendung für das Studienmodul ISEF01,
bestehend aus einem Python-Backend unter `backend/` (Rahmenwerk Flask) und einem
TypeScript-Frontend unter `frontend/` (Rahmenwerk Angular 22).

Für diesen Plan wichtige Dateien: `backend/app/routes/dashboard.py` berechnet die Daten der
Übersichtsseite und darin die Erinnerung. `backend/app/models/plan_slot.py` beschreibt eine
geplante Lernzeit (Felder unter anderem `year`, `month`, `day`, `duration_minutes`);
`backend/app/models/study_session.py` beschreibt eine aufgezeichnete Lernsitzung (Felder unter
anderem `started_at`, `duration_seconds`, `status`). Im Frontend zeigt
`frontend/src/app/features/dashboard/dashboard.ts` die Übersicht, und
`frontend/src/app/core/models/index.ts` beschreibt die erwarteten Datenformen.

Die Abgabedokumente liegen in `docs/`: `MS4_Testabschlussbericht.md`, `MS4_Benutzerhandbuch.md`,
`MS4_Betriebsdokumentation.md`, `MS4_Technische_Dokumentation.md` und
`MS4_Fachliche_Dokumentation.md`. Zu jedem `.md` liegt eine gleichnamige `.pdf` daneben; die PDFs
werden aus den Markdown-Dateien erzeugt und sind das, was abgegeben wird.

Zwei Begriffe: **CI** („Continuous Integration") meint hier die automatischen Prüfläufe bei
GitHub, gesteuert von `.github/workflows/ci.yml`. **Playwright** ist ein Werkzeug, das einen
echten Browser fernsteuert und damit ganze Abläufe testet; die zugehörigen Dateien liegen unter
`frontend/e2e/`.

**Hinweis zur Reihenfolge:** Dieser Plan ist unabhängig von den Plänen
`docs/ExecPlans/active/2026-08-11_P0-Session-Persistenz-und-Navbar.md`,
`.../2026-08-11_P1-Eingabevalidierung.md` und
`.../2026-08-11_P2-Zeitzonen-Filter-und-Darstellung.md` ausführbar. Für Schritt 5 und 6 ist die
Reihenfolge allerdings wichtig: Die im Testbericht einzutragenden Zahlen müssen den Zustand
beschreiben, der zum Zeitpunkt der Abgabe tatsächlich vorliegt. Führe Schritt 5 deshalb als
**letzten** inhaltlichen Schritt aus, nachdem alle anderen Pläne umgesetzt sind, die ihr noch
umsetzen wollt. Ist ein Test zum Abgabezeitpunkt rot, wird er als rot berichtet — mit einer
Erklärung, nicht mit einer Beschönigung.

## Plan of Work

Zuerst wird die Erinnerung im Backend erweitert. Die bestehende Abfrage bleibt als erster Fall
erhalten; ein zweiter Fall prüft, ob im laufenden Monat überhaupt etwas geplant ist und wann
zuletzt eine Sitzung abgeschlossen wurde. Der passende Erinnerungstext wird gleich mitgeliefert.
Das Frontend zeigt diesen Text statt der bisher fest eingebauten Zeile an. Vier neue Tests halten
die Fälle fest: nichts geplant (keine Erinnerung), heute geplant und nichts getan (Erinnerung),
Monat geplant und seit vier Tagen nichts getan (Erinnerung), gerade eben gelernt (keine
Erinnerung).

Danach folgt der Sicherheitsschutz für den geheimen Schlüssel, ausdrücklich erst nach einer
Prüfung in Railway, damit der laufende Betrieb nicht abstürzt.

Zuletzt die Dokumentation: Alle Testbefehle werden ausgeführt, die echten Zahlen notiert und in den
Testbericht übertragen; die Aussage zur CI wird berichtigt; das Benutzerhandbuch beschreibt, wie
man die Erinnerung nachvollziehen kann; das README bekommt einen Statusabsatz, der den heutigen
Umfang der Anwendung beschreibt.

## Concrete Steps

### Schritt 1: Erinnerungslogik erweitern

Öffne `backend/app/routes/dashboard.py`. Der betroffene Abschnitt lautet derzeit:

        today_slots = (
            PlanSlot.query.filter_by(user_id=uid, year=year, month=month, day=today.day).count()
        )
        today_start = datetime(year, month, today.day)
        today_end = datetime(year, month, today.day, 23, 59, 59)
        today_sessions = StudySession.query.filter(
            StudySession.user_id == uid,
            StudySession.started_at >= today_start,
            StudySession.started_at <= today_end,
        ).count()
        inactivity_warning = today_slots > 0 and today_sessions == 0

Ersetze diesen Abschnitt durch:

        today_slots = (
            PlanSlot.query.filter_by(user_id=uid, year=year, month=month, day=today.day).count()
        )
        today_start = datetime(year, month, today.day)
        today_end = datetime(year, month, today.day, 23, 59, 59)
        today_sessions = StudySession.query.filter(
            StudySession.user_id == uid,
            StudySession.started_at >= today_start,
            StudySession.started_at <= today_end,
        ).count()

        last_session_start = (
            db.session.query(func.max(StudySession.started_at))
            .filter(StudySession.user_id == uid, StudySession.status == "completed")
            .scalar()
        )
        days_since_last_session = None
        if last_session_start is not None:
            days_since_last_session = (today - last_session_start.date()).days

        reminder_text = None
        if today_slots > 0 and today_sessions == 0:
            reminder_text = (
                "Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?"
            )
        elif planned_minutes > 0:
            if days_since_last_session is None:
                reminder_text = (
                    "Für diesen Monat ist Lernzeit geplant, aber du hast noch keine Session "
                    "aufgezeichnet. Starte den Timer, damit dein Fortschritt sichtbar wird."
                )
            elif days_since_last_session >= INACTIVITY_DAYS:
                reminder_text = (
                    f"Seit {days_since_last_session} Tagen hast du keine Lernzeit erfasst, "
                    "obwohl für diesen Monat Lernzeit geplant ist."
                )

        inactivity_warning = reminder_text is not None

Ergänze im Rückgabewert der Funktion, direkt hinter der Zeile
`"inactivity_warning": inactivity_warning,`, das neue Feld:

                "reminder_text": reminder_text,

Ergänze oben in derselben Datei, unter der bestehenden Zeile
`MINUTES_PER_ECTS = 30 * 60  # 30 hours per ECTS credit, expressed in minutes`, die neue Konstante
samt Erklärung:

    # Ab wie vielen Tagen ohne abgeschlossene Lernsitzung erinnert wird (FR-7.1).
    # Ein einzelner freier Tag ist normal; drei Tage Stillstand bei laufender
    # Planung sind der Fall, den die Anforderung meint.
    INACTIVITY_DAYS = 3

Die Namen `db` und `func` sind in dieser Datei bereits importiert (`from ..extensions import db`
und `from sqlalchemy import func`), ebenso `planned_minutes`, das weiter oben in derselben Funktion
berechnet wird. Es sind also keine weiteren Importe nötig.

### Schritt 2: Anzeige im Frontend

Öffne `frontend/src/app/core/models/index.ts` und ergänze in der Schnittstelle `DashboardData`
hinter der Zeile `inactivity_warning: boolean;` die neue Zeile:

      reminder_text: string | null;

Öffne `frontend/src/app/features/dashboard/dashboard.ts`. Der Abschnitt lautet derzeit:

            @if (data()!.inactivity_warning) {
              <div class="alert alert-warning">
                ⚠️ Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?
                <a routerLink="/timer" class="btn btn-sm btn-primary" style="margin-left:1rem">Timer starten</a>
              </div>
            }

Ersetze ihn durch:

            @if (data()!.reminder_text) {
              <div class="alert alert-warning">
                ⚠️ {{ data()!.reminder_text }}
                <a routerLink="/timer" class="btn btn-sm btn-primary" style="margin-left:1rem">Timer starten</a>
              </div>
            }

### Schritt 3: Tests für die Erinnerung

Lege die neue Datei `backend/tests/test_reminders.py` mit **exakt** diesem Inhalt an:

    """Prueft die Erinnerung bei versaeumter Lernzeit (FR-7.1, Plan P3).

    Die Testdaten werden direkt in die Datenbank geschrieben, weil sich
    Zeitpunkte in der Vergangenheit ueber die Schnittstelle nicht erzeugen
    lassen - der Timer kennt nur "jetzt".
    """

    from datetime import date, datetime, timedelta, timezone

    import pytest

    from app.extensions import db
    from app.models.plan_slot import PlanSlot
    from app.models.study_session import StudySession

    REGISTER_URL = "/api/auth/register"
    GOALS_URL = "/api/goals"
    DASHBOARD_URL = "/api/dashboard"

    FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


    @pytest.fixture
    def auth_header(client):
        resp = client.post(
            REGISTER_URL, json={"email": "erinnerung@example.de", "name": "E", "password": "pass123"}
        )
        return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


    @pytest.fixture
    def goal_id(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "Erinnerungsziel", "module_name": "M", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        return resp.get_json()["id"]


    def _user_id_of(goal_id: int) -> int:
        from app.models.goal import Goal

        return db.session.get(Goal, goal_id).user_id


    def _plan(goal_id: int, day: int | None, minutes: int = 60) -> None:
        today = date.today()
        db.session.add(
            PlanSlot(
                user_id=_user_id_of(goal_id),
                goal_id=goal_id,
                year=today.year,
                month=today.month,
                day=day,
                duration_minutes=minutes,
            )
        )
        db.session.commit()


    def _completed_session(goal_id: int, days_ago: int) -> None:
        # Die Anwendung speichert Zeitpunkte als UTC ohne Zeitzonen-Angabe
        # (siehe _now in backend/app/routes/sessions.py) - hier genauso.
        jetzt_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        started = jetzt_utc - timedelta(days=days_ago)
        db.session.add(
            StudySession(
                user_id=_user_id_of(goal_id),
                goal_id=goal_id,
                started_at=started,
                ended_at=started + timedelta(minutes=30),
                duration_seconds=1800,
                total_paused_seconds=0,
                status="completed",
            )
        )
        db.session.commit()


    def test_no_reminder_without_any_plan(client, auth_header, goal_id):
        resp = client.get(DASHBOARD_URL, headers=auth_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["inactivity_warning"] is False
        assert data["reminder_text"] is None


    def test_reminder_when_planned_today_and_nothing_done(client, auth_header, goal_id):
        _plan(goal_id, day=date.today().day)
        data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
        assert data["inactivity_warning"] is True
        assert "heute" in data["reminder_text"].lower()


    def test_reminder_when_month_planned_without_day_and_nothing_done(client, auth_header, goal_id):
        _plan(goal_id, day=None)
        data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
        assert data["inactivity_warning"] is True
        assert data["reminder_text"] is not None


    def test_reminder_after_three_days_without_session(client, auth_header, goal_id):
        _plan(goal_id, day=None)
        _completed_session(goal_id, days_ago=4)
        data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
        assert data["inactivity_warning"] is True
        assert "4 Tagen" in data["reminder_text"]


    def test_no_reminder_right_after_learning(client, auth_header, goal_id):
        _plan(goal_id, day=None)
        _completed_session(goal_id, days_ago=0)
        data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
        assert data["inactivity_warning"] is False
        assert data["reminder_text"] is None

Führe im Arbeitsverzeichnis `backend` mit aktivierter venv aus:

    python -m pytest -q

Erwartet: alle Tests bestanden, darunter die fünf neuen. Schlägt
`test_reminder_when_planned_today_and_nothing_done` fehl, prüfe, ob du in Schritt 1 den Vorrang des
ersten Falls (`if today_slots > 0 and today_sessions == 0:`) erhalten hast.

Führe außerdem aus:

    ruff check .

Erwartet: `All checks passed!`

Prüfe die Erinnerung zusätzlich im Browser: Starte Docker, Backend und Frontend (siehe
`README.md`, Abschnitt „Täglicher Entwicklungs-Workflow"), plane unter „Planung" eine Lernzeit für
den heutigen Tag ein und rufe das Dashboard auf. Erwartet: oben erscheint der gelbe Hinweis „⚠️ Du
hast heute Lernzeit geplant, aber noch keine Session gestartet." mit dem Knopf „Timer starten".
Starte und stoppe danach eine kurze Sitzung und lade das Dashboard neu. Erwartet: Der Hinweis ist
verschwunden.

### Schritt 4: Schutz gegen fehlenden geheimen Schlüssel

**Zuerst prüfen, dann ändern.** Melde dich unter https://railway.app/ an, öffne das Projekt und den
Backend-Dienst, gehe auf „Variables" und prüfe, ob eine Variable `SECRET_KEY` mit einem eigenen,
zufälligen Wert existiert. Fehlt sie, lege sie an: Ein geeigneter Wert entsteht lokal mit

    python -c "import secrets; print(secrets.token_urlsafe(48))"

Trage den erzeugten Wert in Railway ein und speichere. Erst wenn die Variable dort steht, mache
weiter — sonst startet der Dienst nach dem nächsten Deploy nicht mehr.

Öffne dann `backend/app/__init__.py`. Die Funktion `create_app` enthält am Ende:

        if config_name == "production":
            _register_spa_fallback(app)

        return app

Ersetze diesen Abschnitt durch:

        if config_name == "production":
            if not os.environ.get("SECRET_KEY"):
                raise RuntimeError(
                    "SECRET_KEY ist in der Produktivumgebung nicht gesetzt. Ohne eigenen "
                    "geheimen Schluessel liessen sich Anmelde-Ausweise faelschen. Bitte die "
                    "Variable SECRET_KEY im Railway-Dienst setzen."
                )
            _register_spa_fallback(app)

        return app

Ergänze ganz oben in derselben Datei, über der Zeile `from pathlib import Path`, den Import:

    import os

Prüfe, dass die lokale Entwicklung davon unberührt bleibt (die Bedingung greift nur bei
`config_name == "production"`):

    cd backend
    .\.venv\Scripts\Activate.ps1
    python -m pytest -q

Erwartet: unverändert alle Tests bestanden.

### Schritt 5: Echte Testzahlen ermitteln

Führe nacheinander alle vier Prüfbefehle aus und **notiere die Ausgabe wörtlich**. Ohne diese
Zahlen kannst du Schritt 6 nicht ehrlich ausfüllen.

Im Arbeitsverzeichnis `backend`, venv aktiv:

    python -m pytest -q
    ruff check .

Im Arbeitsverzeichnis `frontend`:

    npx ng test --watch=false
    npx ng lint

Notiere aus der Vitest-Ausgabe die Zeile der Form `Tests  N passed (N)` beziehungsweise
`Tests  X failed | Y passed (N)`, und aus der pytest-Ausgabe die Zeile `N passed`.

Für die Playwright-Tests gilt: Sie laufen **nicht** in der CI. Willst du sie erneut ausführen,
brauchst du eine laufende Anwendung; der Befehl lautet im Arbeitsverzeichnis `frontend`
`npx playwright test`. Führst du sie nicht aus, dann berichte sie nicht als frisch bestanden,
sondern mit dem Datum der letzten tatsächlichen Ausführung.

### Schritt 6: Testbericht berichtigen

Öffne `docs/MS4_Testabschlussbericht.md`.

**6a.** Trage in der Tabelle unter „## 1. Zusammenfassung" die in Schritt 5 ermittelten Zahlen ein.
Die Zeilen lauten derzeit:

    | Backend Unit-Tests (pytest) | 13 | 13 | 0 |
    | Frontend Unit-Tests (Vitest) | 18 | 18 | 0 |
    | Playwright E2E-Tests | 13 | 13 | 0 |

Setze die Werte auf das, was deine Läufe ausgegeben haben. Wenn ein Test fehlschlägt, trage ihn in
die Spalte „Fehlgeschlagen" ein und erkläre ihn unterhalb der Tabelle in einem Satz.

**6b.** Ersetze den Absatz, der derzeit mit „Alle automatisierten Tests laufen in der
GitHub-Actions-CI-Pipeline bei jedem Push auf `main` automatisch durch." beginnt, durch eine
wahrheitsgemäße Fassung mit diesen Aussagen: In der CI-Pipeline
(`.github/workflows/ci.yml`) laufen bei jedem Push auf `main` sowie bei jedem Pull Request die
Backend-Prüfungen (`ruff check .`, `pytest`) und die Frontend-Prüfungen (`npx ng lint`,
`npx ng test --watch=false`). Die Playwright-E2E-Tests sind **nicht** Teil der Pipeline; sie werden
manuell gegen eine laufende Umgebung ausgeführt, zuletzt am <Datum der letzten Ausführung>. Der
Deploy-Schritt hängt an beiden Prüf-Jobs und wird nur bei grüner Pipeline ausgeführt.

**6c.** Ergänze im Abschnitt „## 4. Frontend-Testfälle (Vitest)" unterhalb der Tabelle einen
Hinweis mit diesem Inhalt: Ein Teil dieser Tests stammt aus der FR-1-Entwicklungsphase und prüft
die Komponenten in `frontend/src/app/goals/`, die seit der MS4-Umsetzung nicht mehr in die
Anwendung eingebunden sind (die Wegeliste `frontend/src/app/app.routes.ts` verweist ausschließlich
auf `frontend/src/app/features/`). Über die Frage, ob dieser Code entfernt wird, entscheidet das
Team; bis dahin bleiben die Tests bestehen.

**6d.** Ergänze am Ende des Abschnitts „## 5. Playwright E2E-Testfälle" den Satz, dass diese Tests
manuell ausgeführt werden und nicht Bestandteil der CI-Pipeline sind.

**6e.** Falls der Abschnitt „Manueller Systemtest" noch das Ergebnis „14 von 14 bestanden" ausweist,
ergänze dort einen Verweis auf `docs/testing-protokoll-lernzeit-manager.md`, in dem der zweite,
ausführlichere manuelle Testdurchlauf mit seinen Befunden festgehalten ist. Ein Bericht, der einen
zweiten Testlauf verschweigt, ist unvollständig.

Erzeuge zum Schluss die PDF-Fassung neu, damit `docs/MS4_Testabschlussbericht.pdf` und die
Markdown-Datei übereinstimmen. Wie die PDFs im Team erzeugt werden, steht nicht im Repository —
frage im Zweifel nach, statt eine veraltete PDF liegen zu lassen. Notiere das gewählte Verfahren
anschließend unter `Surprises & Discoveries` in diesem Plan, damit es beim nächsten Mal
auffindbar ist.

### Schritt 7: Benutzerhandbuch ergänzen

Öffne `docs/MS4_Benutzerhandbuch.md` und ergänze einen Abschnitt „Erinnerungen", der in einfachen
Worten erklärt: Der Lernzeit-Manager erinnert auf der Übersichtsseite, wenn Lernzeit geplant ist,
aber nicht gelernt wurde. Das geschieht in zwei Fällen — erstens, wenn für den heutigen Tag eine
Lernzeit eingeplant ist und noch keine Sitzung gestartet wurde; zweitens, wenn für den laufenden
Monat Lernzeit geplant ist und seit mindestens drei Tagen keine Sitzung abgeschlossen wurde. Die
Erinnerung erscheint als gelber Hinweis oben auf der Übersichtsseite und enthält einen Knopf, der
direkt zum Timer führt. Ergänze außerdem den Hinweis, dass die Erinnerung in der Anwendung
angezeigt wird und **nicht** per E-Mail versendet wird — eine E-Mail-Benachrichtigung ist in
`docs/01_Funktionale_Anforderungen.md` als FR-7.4 mit der Priorität „Could" geführt und bewusst
nicht umgesetzt.

### Schritt 8: README-Status neu schreiben

Öffne `README.md`. Der Block am Anfang, der mit `> **Status: FR-1.4 (Lernziele priorisieren) ist
umgesetzt` beginnt und bis zum Verweis auf `docs/ExecPlans/completed/` reicht, beschreibt einen
längst überholten Zustand: Er behauptet unter anderem, es gebe keine Nutzerkonten und alle
Endpunkte seien ungeschützt.

Ersetze diesen Block durch eine Beschreibung des heutigen Zustands mit folgenden Aussagen: Die
Anwendung hat Nutzerkonten mit Registrierung und Anmeldung; die Anmeldung erfolgt über ein
JWT-Zugriffstoken (`flask-jwt-extended`), das im Browser unter dem Schlüssel `lm_token` gespeichert
wird und acht Stunden gültig ist. Alle Endpunkte außer `/api/health`, `/api/auth/register` und
`/api/auth/login` sind geschützt. Umgesetzt sind Lernziele (anlegen, Status ändern, löschen),
Grob- und Detailplanung von Lernzeiten, ein Timer mit Start, Pause, Fortsetzen und Stopp, eine
Übersichtsseite mit Fortschritt und die Erinnerung bei versäumter Lernzeit. Die Datenbank enthält
die Tabellen `users`, `goals`, `plan_slots` und `study_sessions`, angelegt durch die Migration
`backend/migrations/versions/0001_ms4_initial_schema.py`; nach jedem `git pull` ist in `backend/`
bei aktivierter venv `flask db upgrade` auszuführen.

Prüfe beim Schreiben zusätzlich zwei Stellen weiter unten im README, die derselben veralteten
Annahme folgen: Im Abschnitt „Tech-Stack" steht unter „Noch offen", die Auth-Bibliothek sei nicht
entschieden und nicht installiert — tatsächlich ist `flask-jwt-extended` in
`backend/requirements.txt` eingetragen und in Betrieb. Im Abschnitt „Datenbank & pgAdmin 4" werden
drei Migrationen aus der FR-1-Phase beschrieben, die es im heutigen Stand nicht mehr gibt. Bringe
beide Stellen mit dem tatsächlichen Inhalt der Dateien in Übereinstimmung; sieh dazu in
`backend/requirements.txt` und in `backend/migrations/versions/` nach, statt dich auf diese
Beschreibung zu verlassen.

### Schritt 9: Betriebsdokumentation ergänzen

Öffne `docs/MS4_Betriebsdokumentation.md` und ergänze im Abschnitt über die Umgebungsvariablen
einen Hinweis mit diesem Inhalt: Die Variable `SECRET_KEY` muss im Railway-Dienst mit einem
eigenen, zufälligen Wert gesetzt sein; sie signiert die Anmelde-Ausweise. Seit Plan P3 verweigert
die Anwendung in der Produktivumgebung den Start, wenn die Variable fehlt, statt still auf einen im
Quelltext stehenden Vorgabewert zurückzufallen. Ein neuer Wert lässt sich mit
`python -c "import secrets; print(secrets.token_urlsafe(48))"` erzeugen. Wird der Wert gewechselt,
werden alle bestehenden Anmeldungen ungültig und alle Nutzenden müssen sich neu anmelden.

### Schritt 10: Aufräumen und offene Teamfrage festhalten

Sieh dir die beiden Pläne in `docs/ExecPlans/active/` an, die nicht aus dieser Reihe stammen:
`2026-08-07_MS4-Implementierung.md` und `2026-08-10_MS4-Abschluss.md`. Prüfe in jedem Plan den
Abschnitt `Progress`: Sind alle Punkte abgehakt und ist `Outcomes & Retrospective` ausgefüllt,
verschiebe die Datei nach `docs/ExecPlans/completed/`. Ist etwas offen, lass die Datei liegen und
notiere im Abschnitt `Progress` dieses Plans, was dort noch aussteht.

Halte außerdem die offene Teamfrage schriftlich fest: Der Ordner `frontend/src/app/goals/` wird von
der laufenden Anwendung nicht mehr benutzt. Trage die Frage „Wird der ungenutzte Ordner
`frontend/src/app/goals/` samt seiner 15 Tests entfernt?" in die Tagesordnung des nächsten
Mittwochs-Meetings ein (Redmine ist laut `AGENTS.md` das führende System) und vermerke sie unter
`Decision Log` in diesem Plan, sobald sie entschieden ist.

### Schritt 11: Commit und Abschluss

Arbeite auf dem bereits ausgecheckten Branch; lege **keinen** eigenen Branch und **kein**
zusätzliches Arbeitsverzeichnis an.

    git add backend/app/routes/dashboard.py backend/app/__init__.py backend/tests/test_reminders.py frontend/src/app/core/models/index.ts frontend/src/app/features/dashboard/dashboard.ts docs README.md
    git commit -m "feat: Erinnerung bei versaeumter Lernzeit (FR-7.1); Doku und Testbericht berichtigt"

Fülle danach `Outcomes & Retrospective` aus, hake `Progress` mit Zeitstempeln ab und verschiebe
diese Datei nach `docs/ExecPlans/completed/`.

## Validation and Acceptance

Im Arbeitsverzeichnis `backend` läuft `python -m pytest -q` ohne Fehlschlag; die fünf Tests aus
`backend/tests/test_reminders.py` bestehen. `ruff check .` meldet `All checks passed!`

Im Browser gilt: Plant man unter „Planung" eine Lernzeit für den heutigen Tag ein und ruft das
Dashboard auf, erscheint der gelbe Hinweis mit dem Knopf „Timer starten". Zeichnet man danach eine
Sitzung auf und lädt das Dashboard neu, ist der Hinweis verschwunden. Damit ist FR-7.1 nicht nur
umgesetzt, sondern auch **vorführbar** — das war der Kern der Beanstandung im Testprotokoll.

`docs/MS4_Testabschlussbericht.md` enthält keine Zahl mehr, die von der Ausgabe der Testbefehle
abweicht, und keine Aussage mehr, die Playwright-Tests liefen in der CI. Wer den Bericht liest und
anschließend `python -m pytest -q` sowie `npx ng test --watch=false` ausführt, sieht dieselben
Zahlen.

`README.md` beschreibt Nutzerkonten, Anmeldung, Planung, Timer, Dashboard und Erinnerung als
vorhanden; die Behauptung, es gebe keine Nutzerkonten, kommt nicht mehr vor. Prüfen lässt sich das
im Repository-Wurzelverzeichnis mit:

    Select-String -Path README.md -Pattern "keine Nutzerkonten", "ungeschützt", "FR-1.4"

Erwartet: keine Treffer, die den alten Zustand behaupten.

In der Produktivumgebung verweigert die Anwendung den Start ohne gesetzte Variable `SECRET_KEY`.
Nachweisbar lokal, indem man einmalig eine Python-Sitzung mit
`create_app("production")` ohne gesetzte Umgebungsvariable startet und den `RuntimeError` mit der
beschriebenen Meldung erhält.

## Idempotence and Recovery

Alle Schritte sind wiederholbar. Es gibt **keine** Datenbank-Migration. Die Änderung an der
Erinnerung ist rein rechnerisch: Sie liest vorhandene Daten und speichert nichts.

Das Risiko dieses Plans liegt allein in Schritt 4. Wird der Schutz eingebaut, **bevor** die
Variable `SECRET_KEY` in Railway gesetzt ist, startet der Dienst nach dem nächsten Deploy nicht
mehr und antwortet mit einem Serverfehler. Die Abhilfe ist in beiden Richtungen einfach: Variable
in Railway nachtragen und den Dienst neu starten (`railway logs` zeigt die Fehlermeldung im
Klartext), oder die Änderung mit `git revert` zurücknehmen.

Geht bei den Dokumenten etwas schief, stellt `git checkout -- docs README.md` den Ausgangszustand
wieder her. Beachte, dass die `.pdf`-Dateien neben den `.md`-Dateien nicht automatisch mitwandern —
nach einem Rücknehmen der Markdown-Änderung muss auch die PDF neu erzeugt oder zurückgesetzt
werden.

## Artifacts and Notes

Belegte Abweichung zwischen Testbericht und Wirklichkeit, Stand 11.08.2026:

    Bericht:  | Frontend Unit-Tests (Vitest) | 18 | 18 | 0 |
    Messung:  Tests  1 failed | 17 passed (18)
              FAIL  src/app/app.spec.ts > App > should create the app

    Bericht:  "Alle automatisierten Tests laufen in der GitHub-Actions-CI-Pipeline ... durch."
    Messung:  .github/workflows/ci.yml fuehrt aus: ruff check ., pytest, npx ng lint,
              npx ng test --watch=false. Playwright kommt in der Datei nicht vor.

Heutige Bedingung der Erinnerung, die im Test praktisch nie auslöste (aus
`backend/app/routes/dashboard.py`):

    today_slots = PlanSlot.query.filter_by(user_id=uid, year=year, month=month, day=today.day).count()
    inactivity_warning = today_slots > 0 and today_sessions == 0

Der Filter `day=today.day` trifft nur Einträge **mit** Tagesangabe; im Anlegeformular ist der Tag
jedoch als „(optional)" beschriftet.

## Interfaces and Dependencies

Es werden keine neuen Bibliotheken installiert.

`GET /api/dashboard` liefert nach diesem Plan zusätzlich das Feld `reminder_text` und behält alle
bisherigen Felder:

    {
      "current_month": { "year": 2026, "month": 8, "planned_minutes": 120, "actual_minutes": 0 },
      "goals": [ ... ],
      "inactivity_warning": true,
      "reminder_text": "Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?",
      "active_session": null
    }

In `backend/app/routes/dashboard.py` muss die Konstante `INACTIVITY_DAYS: int = 3` auf Modulebene
existieren. In `frontend/src/app/core/models/index.ts` enthält die Schnittstelle `DashboardData`
zusätzlich `reminder_text: string | null;`.

## Änderungsnotizen

- 2026-08-11: Plan erstellt. Anlass sind der Befund „Erinnerungsfunktion nicht verifizierbar" aus
  `docs/testing-protokoll-lernzeit-manager.md` sowie die beim Nachprüfen entdeckte Abweichung
  zwischen `docs/MS4_Testabschlussbericht.md` und dem tatsächlichen Testergebnis.
- 2026-08-11: Vor der ersten Übergabe überarbeitet. In der Testdatei aus Schritt 3 wurde
  `datetime.utcnow()` durch `datetime.now(timezone.utc).replace(tzinfo=None)` ersetzt: Das erste
  gilt ab Python 3.12 als überholt und hätte bei jedem Testlauf eine Warnung erzeugt.

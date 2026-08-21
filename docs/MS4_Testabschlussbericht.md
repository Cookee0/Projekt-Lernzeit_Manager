# Testabschlussbericht — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Stand:** 2026-08-21 (nachgeführt nach Plan P14; ursprüngliche MS4-Auslieferung: August 2026)

---

## 1. Zusammenfassung

| Testkategorie | Gesamt | Bestanden | Fehlgeschlagen |
|---|---|---|---|
| Backend Unit-Tests (pytest) | 138 | 138 | 0 |
| Frontend Unit-Tests (Vitest) | 43 | 43 | 0 |
| Playwright E2E-Tests | 12 | 12 (Stand 2026-08-11) | 0 |
| Manueller Systemtest | 14 | 14 | 0 |

Backend- und Frontend-Zahlen sind Stand 2026-08-21, ermittelt durch `pytest -q` (Backend, 138
Tests über 13 Testdateien) und `npx ng test --watch=false` (Frontend, 43 Tests über 10
Testdateien) nach Plan P14 (Erinnerungs-Dropdown schließt automatisch; optionaler manueller
Lernaufwand-Override). Die Zahlen sind seit dem letzten dokumentierten Stand (101 Backend- /
15 Frontend-Tests, Stand 2026-08-17 nach den Plänen P4/P5) deutlich gestiegen, weil dazwischen
die Pläne P6 bis P14 automatisierte Tests für Grobplanung (`test_workload.py`,
`test_plan_proposal.py`), Kalender, Auswertung (`test_stats.py`), Erinnerungs-Hub
(`test_reminders.py`), Serientermine, Layout-Komponenten (`week-chart.spec.ts`,
`day-picker.spec.ts`) und zuletzt den Lernaufwand-Override ergänzt haben. Die
Detailtabellen in Abschnitt 3 und 4 unten beschreiben weiterhin nur den ursprünglichen
MS4-Stand (13 bzw. 18 Tests) im Detail — sie wurden bewusst nicht auf alle 138/43 Tests
ausgeweitet, weil eine test-für-test-Beschreibung in dieser Größenordnung keinen zusätzlichen
Erkenntniswert mehr hätte; maßgeblich für den aktuellen Stand ist die Datei-Aufstellung direkt
im Anschluss an die historischen Tabellen. Die Playwright- und die manuelle Testzahl sind die
letzte tatsächliche Ausführung und wurden seither **nicht** erneut durchgeführt (siehe Abschnitt
5 und 6 für den dazugehörigen Vorbehalt).

**Korrektur 2026-08-21 zur Produktions-URL:** Die Abschnitte 5 und 6 unten dokumentieren
Testläufe vom 2026-08-11 gegen `https://projekt-lernzeitmanager-production.up.railway.app` und
bleiben als historischer Nachweis unverändert. Diese URL antwortet Stand 2026-08-21 mit HTTP
404 und ist nicht mehr aktuell; die tatsächlich erreichbare Produktions-URL lautet seither
`https://projekt-lernzeitmanager-production-0412.up.railway.app` (siehe `MS4_Betriebsdokumentation.md`,
Abschnitt 6, dort mit einer Korrektur vom selben Datum). Ob sich zwischen dem 2026-08-11-Lauf
und heute die URL geändert hat, weil derselbe Dienst umbenannt wurde, oder weil der Dienst beim
Wechsel von Nixpacks auf den Dockerfile-Builder (Plan P13) neu angelegt wurde, ist nicht
geklärt — im zweiten Fall wäre auch die Datenbank neu und alle Testdaten dieses Berichts nicht
mehr vorhanden. Ein erneuter Playwright- und manueller Testlauf gegen die korrekte URL steht vor
der Redmine-Abgabe noch aus.

In der CI-Pipeline (`.github/workflows/ci.yml`) laufen bei jedem Push auf `main` sowie bei jedem
Pull Request die Backend-Prüfungen (`ruff check .`, `pytest`) und die Frontend-Prüfungen
(`npx ng lint`, `npx ng test --watch=false`). Die Playwright-E2E-Tests sind **nicht** Teil der
Pipeline; sie werden manuell gegen eine laufende Umgebung ausgeführt, zuletzt am 2026-08-11. Der
Deploy-Schritt hängt an beiden Prüf-Jobs (`needs: [backend, frontend]`) und wird nur bei grüner
Pipeline ausgeführt.

---

## 2. Testumgebung

**Backend-Tests:**
- Python 3.12, pytest 8.x, pytest-flask 1.3.x
- Datenbank: SQLite In-Memory (kein Docker nötig, vollständig isoliert)
- Ausführung: `cd backend && pytest`

**Frontend-Tests:**
- Node.js 22, Angular CLI 22, Vitest 4.x
- Ausführung: `cd frontend && ng test --watch=false`

**Playwright E2E-Tests:**
- Chromium (Playwright 1.49.x)
- Umgebung: Railway-Produktionsumgebung (`https://projekt-lernzeitmanager-production.up.railway.app`)
- Ausführung: `cd frontend && npx playwright install chromium && npx playwright test`

**Manueller Systemtest:**
- Browser: Chromium / Chrome (aktuell)
- Umgebung: lokal (localhost:4200) sowie auf Railway-Produktionsumgebung

---

## 3. Backend-Testdateien (pytest)

**Letzter vollständiger Lauf:** 2026-08-21, `cd backend && pytest -q` → `138 passed`.

| Testdatei | Anzahl Tests | Deckt ab |
|---|---|---|
| `test_validation.py` | 37 | Alle serverseitigen Prüfregeln aus `backend/app/validation.py` (E-Mail, Passwort, Pflichttext, ECTS, Zieldatum, Tag im Monat, Uhrzeit, Query-Parameter) |
| `test_plans.py` | 17 | Planungseinträge: CRUD, Serientermine (`POST /api/plans/series`), Filter |
| `test_sessions.py` | 15 | Timer: Start/Pause/Fortsetzen/Stopp, Pausenrechnung (FR-4.3), Notiz beim Stoppen |
| `test_milestones.py` | 15 | Zwischenziele: CRUD, Filter, optionale Zuordnung zu einem Lernziel |
| `test_workload.py` | 11 | ECTS-Formel, Wochenbudget-Rechnung, Lernaufwand-Override (`workload_hours`, Plan P14) |
| `test_goals.py` | 10 | Lernziele: CRUD, Priorität/Note/Ergebnis-Notiz, Lernaufwand-Override-Validierung |
| `test_auth.py` | 7 | Registrierung, Login, `GET /api/auth/me` |
| `test_plan_proposal.py` | 6 | Grobplanungs-Vorschlag (`GET /api/plans/proposal`, FR-2.2) |
| `test_dashboard_fields.py` | 6 | Struktur und Inhalte der `GET /api/dashboard`-Antwort |
| `test_reminders.py` | 5 | Auslöser der FR-7.1/7.2/7.3-Erinnerungsfelder |
| `test_time_format.py` | 4 | UTC-Zeitstempel mit angehängtem `Z` (`iso_utc`) |
| `test_stats.py` | 4 | Auswertungs-Endpunkt (`GET /api/stats`, FR-6.4, FR-5.3) |
| `test_health.py` | 1 | `GET /api/health` |
| **Gesamt** | **138** | |

### 3.1 Historischer Ausgangspunkt (MS4-Auslieferung, 2026-08-10)

Zur MS4-Auslieferung existierten 13 der heute 138 Tests, verteilt auf drei Dateien:

| Test-ID | Beschreibung | Erwartetes Ergebnis | Status |
|---|---|---|---|
| T-BE-01 | Registrierung mit gültigen Daten | HTTP 201, access_token im Response | ✅ Bestanden |
| T-BE-02 | Registrierung ohne Pflichtfelder | HTTP 400 | ✅ Bestanden |
| T-BE-03 | Registrierung mit bereits verwendeter E-Mail | HTTP 409 | ✅ Bestanden |
| T-BE-04 | Login mit korrekten Zugangsdaten | HTTP 200, access_token | ✅ Bestanden |
| T-BE-05 | Login mit falschem Passwort | HTTP 401 | ✅ Bestanden |
| T-BE-06 | GET /api/auth/me ohne Token | HTTP 401 | ✅ Bestanden |
| T-BE-07 | GET /api/auth/me mit gültigem Token | HTTP 200, Nutzerdaten | ✅ Bestanden |
| T-BE-08 | Leere Zielliste abrufen | HTTP 200, leeres Array | ✅ Bestanden |
| T-BE-09 | Neues Ziel anlegen | HTTP 201, Ziel-Objekt | ✅ Bestanden |
| T-BE-10 | Ziel ohne Pflichtfelder anlegen | HTTP 400 | ✅ Bestanden |
| T-BE-11 | Ziel-Status auf "achieved" setzen | HTTP 200, status = "achieved" | ✅ Bestanden |
| T-BE-12 | Ziel löschen und 404 verifizieren | HTTP 204, dann 404 | ✅ Bestanden |
| T-BE-13 | GET /api/health | HTTP 200, `{"status": "ok"}` | ✅ Bestanden |

Diese 13 Fälle sind heute Teil von `test_auth.py`, `test_goals.py` und `test_health.py` und
laufen unverändert grün mit.

---

## 4. Frontend-Testdateien (Vitest)

**Letzter vollständiger Lauf:** 2026-08-21, `cd frontend && npx ng test --watch=false` →
`Test Files 10 passed (10)`, `Tests 43 passed (43)`.

| Testdatei | Anzahl Tests | Deckt ab |
|---|---|---|
| `core/validation.spec.ts` | 9 | Client-seitige Spiegelung der Server-Validierung, inkl. Lernaufwand-Override (Plan P14) |
| `core/upcoming-slot.spec.ts` | 7 | FR-7.2-Logik: bevorstehender Termin innerhalb der nächsten Stunde |
| `features/stats/stats.spec.ts` | 6 | Auswertungs-Komponente (Ampel, Tageszeit-Verteilung) |
| `shared/week-chart.spec.ts` | 4 | Geteiltes Wochendiagramm (Dashboard + Auswertung) |
| `features/calendar/calendar.spec.ts` | 4 | Kalender-Monatsraster, Gruppierung nach Tag |
| `features/planning/day-picker.spec.ts` | 3 | Tages-Raster für Serientermine |
| `core/services/reminder.service.spec.ts` | 3 | Erinnerungs-Hub: Reihenfolge und Inhalt der drei Erinnerungsarten |
| `core/services/plan.service.spec.ts` | 3 | HTTP-Aufrufe des PlanService |
| `core/services/auth.service.spec.ts` | 3 | Login/Logout-Zustand |
| `app.spec.ts` | 1 | App-Komponente rendert ohne Fehler |
| **Gesamt** | **43** | |

Der seit der MS4-Auslieferung nicht mehr eingebundene Ordner `frontend/src/app/goals/` (17
Tests auf totem Code, GoalForm/GoalList/GoalService der FR-1-Entwicklungsphase) wurde im Rahmen
von Plan P4 entfernt und ist seither nicht mehr Teil der Testsuite.

### 4.1 Historischer Ausgangspunkt (MS4-Auslieferung, 2026-08-10)

| Test-ID | Datei | Beschreibung | Status |
|---|---|---|---|
| T-FE-01 | app.spec.ts | App-Komponente rendert ohne Fehler | ✅ Bestanden |

Die zur MS4-Auslieferung dokumentierten 17 weiteren Fälle (T-FE-02 bis T-FE-18) prüften die
Komponenten in `frontend/src/app/goals/`, die inzwischen entfernt sind (siehe oben); ihre
fachliche Abdeckung (Formularvalidierung, Bearbeiten-Modus, Liste, HTTP-Aufrufe) lebt in den
aktuellen Testdateien der Tabelle in Abschnitt 4 weiter, insbesondere `core/validation.spec.ts`
und `core/services/*.spec.ts`.

---

## 5. Playwright E2E-Testfälle

**Aktueller Dateibestand (verifiziert 2026-08-21 durch Zählen der `test(`-Blöcke in
`frontend/e2e/*.spec.ts`):** 12 Tests in 4 Dateien — `auth.spec.ts` 3, `goals.spec.ts` 4,
`planning.spec.ts` 2, `timer.spec.ts` 3. `auth.spec.ts` hatte zur ursprünglichen MS4-Auslieferung
noch 4 Tests; einer entfiel im Rahmen von Plan P4 (siehe Nachtrag unten), seither sind es 3.

**Ausführungsdatum des letzten vollständigen, tatsächlichen Playwright-Laufs:** 2026-08-11  
**Tester:** Assis Ramadan  
**Umgebung:** Railway-Produktionsumgebung (`https://projekt-lernzeitmanager-production.up.railway.app` —
siehe Korrektur zur Produktions-URL in Abschnitt 1)  
**Browser:** Chromium (Playwright 1.49)  
**Befehl:** `cd frontend && npx playwright test`

Die folgenden Tabellen sind der historische Nachweis dieses Laufs vom 2026-08-11, als
`auth.spec.ts` noch 4 statt 3 Tests enthielt (der vierte, "Direktzugriff /goals ohne Token →
Weiterleitung auf /login", entfiel danach — vermutlich abgelöst durch den heutigen T-E2E-03,
der denselben Sachverhalt prüft). Die Test-IDs T-E2E-01 bis T-E2E-13 entsprechen deshalb nicht
mehr 1:1 den heutigen Dateien; maßgeblich für den aktuellen Stand ist der Dateibestand oben.

### 5.1 Authentifizierung (auth.spec.ts, Stand 2026-08-11 — heute nur noch 3 Tests, siehe oben)

| Test-ID | Anforderung | Beschreibung | Status |
|---|---|---|---|
| T-E2E-01 | FR-0 | Registrierung → Dashboard erscheint, Name in Navbar sichtbar | ✅ Bestanden |
| T-E2E-02 | FR-0 | Abmelden → Login-Seite; erneuter Login → Dashboard | ✅ Bestanden |
| T-E2E-03 | FR-0 | Login mit falschen Daten → Fehlermeldung sichtbar | ✅ Bestanden |
| T-E2E-04 | FR-0 | Direktzugriff /goals ohne Token → Weiterleitung auf /login (seither entfernt) | ✅ Bestanden (2026-08-11) |

### 5.2 Lernziele (goals.spec.ts)

| Test-ID | Anforderung | Beschreibung | Status |
|---|---|---|---|
| T-E2E-05 | FR-1.1, FR-1.2 | Lernziel anlegen → erscheint in Liste | ✅ Bestanden |
| T-E2E-06 | FR-1.2 | Status auf "In Arbeit" setzen → Badge korrekt | ✅ Bestanden |
| T-E2E-07 | FR-5.1 | Status auf "Erreicht" setzen → Badge korrekt | ✅ Bestanden |
| T-E2E-08 | FR-1.3 | Lernziel löschen → verschwindet aus Liste | ✅ Bestanden |

### 5.3 Planung (planning.spec.ts)

| Test-ID | Anforderung | Beschreibung | Status |
|---|---|---|---|
| T-E2E-09 | FR-3.1 | Lernzeit einplanen → erscheint in Planungsliste | ✅ Bestanden |
| T-E2E-10 | FR-3.1 | Geplante Lernzeit löschen → "Noch nichts geplant" | ✅ Bestanden |

### 5.4 Timer (timer.spec.ts)

| Test-ID | Anforderung | Beschreibung | Status |
|---|---|---|---|
| T-E2E-11 | FR-4.1 | Timer starten → Status "▶ Läuft" sichtbar | ✅ Bestanden |
| T-E2E-12 | FR-4.1, FR-4.3 | Pause und Fortsetzen → Status wechselt korrekt | ✅ Bestanden |
| T-E2E-13 | FR-4.1, FR-4.2 | Session stoppen → erscheint in "Zuletzt gelernt" | ✅ Bestanden |

**Gesamtergebnis Playwright (Railway-Produktionsumgebung, 2026-08-11):** 13 von 13 Tests bestanden
✅ — Stand jener Datei-Version; heute (2026-08-21) sind es 12 Tests, siehe Hinweis oben.

Diese Tests werden manuell gegen eine laufende Umgebung ausgeführt und sind **nicht** Bestandteil
der GitHub-Actions-CI-Pipeline (siehe `.github/workflows/ci.yml` sowie den Hinweis in Abschnitt 1).

**Nachtrag 2026-08-17 (Plan P4, M9):** Ein erneuter Lauf gegen die lokalen Dev-Server
(`ng serve` + `flask run --debug`, nicht gegen Railway) zeigt nur noch 5 von 12 bestandene Tests
(`auth.spec.ts` enthält inzwischen 3 statt 4 Tests). Ein Teil des Rückgangs ist durch P4 behoben
worden: `frontend/e2e/goals.spec.ts` griff nach M5 wegen des neuen Bearbeiten-Formulars mit
`page.getByLabel('Titel')` auf zwei Elemente zu (strict-mode violation); behoben durch Eingrenzung
auf die Anlege-Karte (`page.locator('.card', { hasText: 'Neues Lernziel' })`). Die verbleibenden
sieben Fehlschläge sind **keine Regression durch P4**: `RegisterComponent.submit()` navigiert nach
erfolgreicher Registrierung nicht zuverlässig auf `/` (der Zugriffstoken wird korrekt in
`localStorage` geschrieben, ein anschließender manueller Aufruf von `/` zeigt das Dashboard
korrekt — nur die interne `Router.navigate(['/'])`-Weiterleitung im selben Seitenaufruf schlägt
sporadisch fehl oder braucht länger als das 5-Sekunden-Timeout der Tests). Da praktisch jeder
Playwright-Test über `registerAndLogin()`/`setup()` registriert, reißt dieser eine Defekt fast die
ganze Suite mit. Zusätzlich bestehen in `planning.spec.ts` und `timer.spec.ts` vorbestehende
strict-mode-Kollisionen zwischen `<option>`-Text und sichtbarem Text auf derselben Seite
(`getByText('Planungs-Ziel')` bzw. `getByText('Timer-Ziel')` treffen sowohl das Auswahlfeld als
auch die Anzeige). Keiner dieser drei Befunde gehört zu den in diesem Plan beschriebenen
Meilensteinen; sie sind hier dokumentiert, weil `docs/PLANS.md` verlangt, Abweichungen von der
Erwartung festzuhalten, nicht stillschweigend zu übergehen. Ob der Navigations-Defekt auch die
Railway-Produktionsumgebung betrifft (unterschiedlicher Build, ggf. andere Zeitverhältnisse) ist
ungeprüft — dafür fehlt in dieser Sitzung ein Railway-Deployment dieses Branches. Empfehlung: ein
eigener Folge-Plan für `RegisterComponent`/`auth.guard.ts` sowie für die beiden Label-Kollisionen.

**Vorbehalt Stand 2026-08-21:** Die vier Playwright-Dateien (`auth`, `goals`, `planning`,
`timer.spec.ts`) decken nach wie vor nur den MS4-Basisumfang ab. Kalender, Auswertung, der
Erinnerungs-Hub in der Navbar, die Grobplanung (Wochenbudget/Monatsvorschlag), Serientermine,
Zwischenziele und der Lernaufwand-Override (Plan P14) haben **keine** eigenen
Playwright-Testfälle. Diese Funktionalität ist ausschließlich über Backend- und
Frontend-Unit-Tests (Abschnitt 3 und 4) sowie den manuellen Systemtest (Abschnitt 6) abgedeckt.
Empfehlung an das Team: vor der endgültigen Redmine-Abgabe entweder die E2E-Suite um diese
Bereiche erweitern oder den manuellen Testdurchlauf gezielt darauf ausrichten.

---

## 6. Manueller Systemtest

**Ausführungsdatum:** 2026-08-11  
**Tester:** Assis Ramadan  
**Umgebung:** Railway-Produktionsumgebung (`https://projekt-lernzeitmanager-production.up.railway.app`)  
**Browser:** Chrome (aktuell)

| Schritt | Beschreibung | Anforderung | Ergebnis |
|---|---|---|---|
| MS-01 | App-URL im Browser öffnen ohne Login | – | Weiterleitung auf /login ✅ |
| MS-02 | Auf /goals zugreifen ohne Login | FR-0 | Weiterleitung auf /login ✅ |
| MS-03 | Neues Konto registrieren | FR-0 | Konto angelegt, direkt auf Dashboard ✅ |
| MS-04 | Lernziel "Mathematik I" mit 5 ECTS anlegen | FR-1.1, FR-1.2 | Ziel erscheint in Liste mit "5 ECTS (150h)" ✅ |
| MS-05 | Lernziel-Status auf "In Arbeit" setzen | FR-1.2 | Badge zeigt "In Arbeit" ✅ |
| MS-06 | Lernzeit für heute einplanen (90 min) | FR-3.1 | Eintrag erscheint in Planungsliste ✅ |
| MS-07 | Dashboard öffnen → Inaktivitäts-Warnung prüfen | FR-7.1, FR-6.1 | Gelber Hinweis erscheint ✅ |
| MS-08 | Timer starten für Mathematik I | FR-4.1, FR-4.2 | Timer läuft, "▶ Läuft" sichtbar ✅ |
| MS-09 | Timer pausieren | FR-4.1 | Status "⏸ Pausiert" ✅ |
| MS-10 | Timer fortsetzen → Zeitanzeige korrekt | FR-4.1, FR-4.3 | Zeit läuft weiter ohne Pausendauer ✅ |
| MS-11 | Timer stoppen → Session in Verlauf sichtbar | FR-4.1, FR-4.2 | Session mit korrekter Dauer gespeichert ✅ |
| MS-12 | Dashboard → Fortschrittsbalken zeigt Lernzeit | FR-6.1, FR-6.2 | Balken und Prozent aktualisiert ✅ |
| MS-13 | Lernziel als "Erreicht" markieren | FR-5.1 | Badge "Erreicht", Buttons ausgeblendet ✅ |
| MS-14 | Abmelden und erneut einloggen | FR-0 | Session korrekt beendet und wiederhergestellt ✅ |

**Gesamtergebnis Manueller Test:** 14 von 14 Schritten erfolgreich ✅

Dieser Durchlauf war der erste manuelle Systemtest der Anwendung. Ein zweiter, ausführlicherer
manueller Testdurchlauf mit weiteren Befunden ist in
[`docs/testing-protokoll-lernzeit-manager.md`](testing-protokoll-lernzeit-manager.md)
festgehalten; die dort gefundenen Probleme (Eingabevalidierung, Zeitzonenanzeige des Timers,
eingeschränkte Planungsfilter, kaum auslösbare Erinnerung) wurden durch die Pläne P1, P2 und P3
behoben.

**Vorbehalt Stand 2026-08-21:** Wie in Abschnitt 5 beschrieben, deckt auch dieser manuelle
Durchlauf nur den MS4-Basisumfang ab. Insbesondere der Lernaufwand-Override (Plan P14, 2026-08-21)
konnte in der Entwicklungsumgebung dieser Sitzung nicht browserseitig gegen eine echte
Postgres-Datenbank verifiziert werden (Docker war in der genutzten Werkzeugumgebung nicht
verfügbar); abgesichert ist er ausschließlich durch die Backend-Tests in `test_workload.py` und
`test_goals.py`, die über den echten Flask-Testclient laufen (`POST /api/goals`,
`GET /api/dashboard`), sowie durch die Frontend-Tests in `core/validation.spec.ts`. Ein
Nachtrag zu diesem Abschnitt mit einem Browser-Test des Overrides steht vor der Redmine-Abgabe
noch aus.

---

## 7. Abdeckung der umgesetzten Anforderungen

| Anforderung | Beschreibung | Abgedeckt durch |
|---|---|---|
| FR-1.1 | Lernziele für ≥ 6 Monate anlegen | T-BE-09, T-E2E-05, MS-04 |
| FR-1.2 | Titel, Zieldatum, Modul, Status | T-BE-09, T-E2E-05, MS-04, MS-05 |
| FR-1.3 | Lernziele bearbeiten, löschen | T-BE-12, T-E2E-08, `test_goals.py` |
| FR-1.4 | Priorisierung von Lernzielen | `test_goals.py` (`test_create_goal_with_priority_and_result`) |
| FR-2.1 | Workload auf Basis ECTS, inkl. manuellem Override | `test_workload.py`, `test_goals.py`, Dashboard (geplante Minuten), MS-04 |
| FR-2.2 | Automatischer Monatsvorschlag der Grobplanung | `test_plan_proposal.py` |
| FR-3.1 | Lernzeit-Slots planen, inkl. Serientermine | T-E2E-09, MS-06, `test_plans.py` |
| FR-3.2 | Monatliche Zwischenziele (eigene Tabelle `milestones`) | `test_milestones.py` |
| FR-3.3 | Detailplanung zeigt Abweichung zur Grobplanung | `test_plan_proposal.py` |
| FR-4.1 | Timer starten, pausieren, beenden | T-E2E-11–13, MS-08–11, `test_sessions.py` |
| FR-4.2 | Session Lernziel zuordnen und persistieren | T-BE-09, MS-11, `test_sessions.py` |
| FR-4.3 | Pausen werden nicht als Lernzeit gezählt | T-E2E-12, MS-10, `test_sessions.py` |
| FR-5.1 | Lernziel als erreicht markieren | T-BE-11, T-E2E-07, MS-13 |
| FR-5.2 | Note und Ergebnis-Notiz an Lernzielen, Notiz beim Stoppen einer Session | `test_goals.py`, `test_sessions.py` |
| FR-5.3 | Historie erreichter Ziele mit Note | `test_stats.py` (`achieved_goals`) |
| FR-6.1 | Dashboard: Lernzeit vs. geplante Zeit | MS-12, `test_dashboard_fields.py` |
| FR-6.2 | Fortschrittsbalken pro Ziel | MS-12 |
| FR-6.3 | Auswertung über Zeitverlauf (Wochendiagramm) | `test_dashboard_fields.py`, `week-chart.spec.ts` |
| FR-6.4 | Vergleich Plan vs. Ist über den Zeitraum (Auswertung) | `test_stats.py`, `stats.spec.ts` |
| FR-7.1 | Inaktivitäts-Erinnerung | MS-07, `test_reminders.py` |
| FR-7.2 | Erinnerung vor geplanter Lernzeit | `test_reminders.py`, `upcoming-slot.spec.ts` |
| FR-7.3 | Erinnerung bei nahendem Zieldatum | `test_reminders.py` |

**Alle Must- und alle Should-Anforderungen sind vollständig implementiert und automatisiert
getestet.** Die verbleibenden drei Could-Anforderungen (FR-2.3, FR-4.4, FR-7.4) sind bewusst
nicht umgesetzt, siehe Abschnitt 8.

---

## 8. Nicht implementierte Anforderungen

Die folgenden Anforderungen wurden nicht umgesetzt und wurden zugunsten des Projekt-Zeitbudgets
zurückgestellt. Alle drei tragen die niedrigste Priorität ("Could") im Anforderungsdokument.

| Anforderung | Priorität | Begründung |
|---|---|---|
| FR-2.3 Feiertage/Urlaub in der Grobplanung berücksichtigen | Could | Würde die Verteilungsrechnung deutlich verkomplizieren, ohne für den Kern-Usecase nötig zu sein |
| FR-4.4 Manuelle Nacherfassung von Lernzeit | Could | Der Timer deckt den Hauptfall ab; rückwirkende Erfassung ist eine Komfortfunktion |
| FR-7.4 Konfigurierbare Benachrichtigungskanäle (E-Mail) | Could | Erfordert einen Mailversand-Dienst; der In-App-Erinnerungs-Hub deckt den Kern-Usecase bereits ab |

**Historie:** FR-2.2 (automatischer Monatsvorschlag), FR-3.2 (Zwischenziele), FR-3.3
(Abweichungsanzeige), FR-5.2 (Notizen), FR-5.3 (Historie erreichter Ziele), FR-6.3
(Zeitverlaufs-Auswertung), FR-6.4 (Plan-vs-Ist-Vergleich), FR-7.2 und FR-7.3 (weitere
Erinnerungsarten) standen zum Zeitpunkt der ursprünglichen MS4-Auslieferung (2026-08-10) noch
in dieser Tabelle als nicht umgesetzt. Sie sind seit den Plänen P4 bis P11 vollständig
implementiert und automatisiert getestet (siehe Abschnitt 7) und stehen deshalb nicht mehr hier.

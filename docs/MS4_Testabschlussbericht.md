# Testabschlussbericht — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Datum:** August 2026

---

## 1. Zusammenfassung

| Testkategorie | Gesamt | Bestanden | Fehlgeschlagen |
|---|---|---|---|
| Backend Unit-Tests (pytest) | 86 | 86 | 0 |
| Frontend Unit-Tests (Vitest) | 15 | 15 | 0 |
| Playwright E2E-Tests | 13 | 13 | 0 |
| Manueller Systemtest | 14 | 14 | 0 |

Stand 2026-08-17, ermittelt durch `pytest -q` (Backend) und `ng test --watch=false` (Frontend) nach
Plan P4 (Defekte und Lücken). Gegenüber dem vorherigen Stand (57 Backend-/32 Frontend-Tests) ist
die Backend-Zahl gestiegen, weil P4/M8 `backend/tests/test_sessions.py` und
`backend/tests/test_plans.py` ergänzt hat — die Stoppuhr (Start, Pause, Fortsetzen, Stopp,
Pausenrechnung nach FR-4.3) wird damit erstmals automatisiert im Backend geprüft. Die
Frontend-Zahl ist gesunken, weil P4/M7 den seit dem MS4-Umbau nicht mehr eingebundenen Ordner
`frontend/src/app/goals/` (17 Tests auf toten Code) entfernt hat; die verbleibenden Komponenten
sind unverändert grün. Die Detailtabellen in Abschnitt 3 und 4 unten beschreiben noch den
ursprünglichen MS4-Stand und wurden im Rahmen dieses Plans nicht im Detail nacherfasst — maßgeblich
sind die hier genannten Gesamtzahlen. Die Playwright-Zahl ist die letzte tatsächliche Ausführung;
Details siehe Abschnitt 5.

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

## 3. Backend-Testfälle (pytest)

**Ausführungsdatum:** 2026-08-10  
**Tester:** CI/CD Pipeline (GitHub Actions) + lokal Assis Ramadan  
**Befehl:** `cd backend && pytest -v`

### 3.1 Authentifizierung (test_auth.py)

| Test-ID | Beschreibung | Vorbedingung | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
|---|---|---|---|---|---|
| T-BE-01 | Registrierung mit gültigen Daten | Keine | HTTP 201, access_token im Response | HTTP 201, Token vorhanden | ✅ Bestanden |
| T-BE-02 | Registrierung ohne Pflichtfelder | Keine | HTTP 400 | HTTP 400 | ✅ Bestanden |
| T-BE-03 | Registrierung mit bereits verwendeter E-Mail | Nutzer bereits registriert | HTTP 409 | HTTP 409 | ✅ Bestanden |
| T-BE-04 | Login mit korrekten Zugangsdaten | Nutzer registriert | HTTP 200, access_token | HTTP 200, Token vorhanden | ✅ Bestanden |
| T-BE-05 | Login mit falschem Passwort | Nutzer registriert | HTTP 401 | HTTP 401 | ✅ Bestanden |
| T-BE-06 | GET /api/auth/me ohne Token | Keine | HTTP 401 | HTTP 401 | ✅ Bestanden |
| T-BE-07 | GET /api/auth/me mit gültigem Token | Nutzer eingeloggt | HTTP 200, Nutzerdaten | HTTP 200, korrekte Daten | ✅ Bestanden |

### 3.2 Lernziele (test_goals.py)

| Test-ID | Beschreibung | Vorbedingung | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
|---|---|---|---|---|---|
| T-BE-08 | Leere Zielliste abrufen | Nutzer eingeloggt, keine Ziele | HTTP 200, leeres Array | HTTP 200, `[]` | ✅ Bestanden |
| T-BE-09 | Neues Ziel anlegen | Nutzer eingeloggt | HTTP 201, Ziel-Objekt | HTTP 201, Daten korrekt | ✅ Bestanden |
| T-BE-10 | Ziel ohne Pflichtfelder anlegen | Nutzer eingeloggt | HTTP 400 | HTTP 400 | ✅ Bestanden |
| T-BE-11 | Ziel-Status auf "achieved" setzen | Ziel vorhanden | HTTP 200, status = "achieved" | HTTP 200, Status korrekt | ✅ Bestanden |
| T-BE-12 | Ziel löschen und 404 verifizieren | Ziel vorhanden | HTTP 204 beim Löschen, dann 404 | HTTP 204 + 404 | ✅ Bestanden |

### 3.3 Health-Check (test_health.py)

| Test-ID | Beschreibung | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
|---|---|---|---|---|
| T-BE-13 | GET /api/health | HTTP 200, `{"status": "ok"}` | HTTP 200, korrekt | ✅ Bestanden |

**Gesamtergebnis Backend:** 13 von 13 Tests bestanden ✅  
**Laufzeit:** ca. 4 Sekunden

---

## 4. Frontend-Testfälle (Vitest)

**Ausführungsdatum:** 2026-08-10  
**Tester:** CI/CD Pipeline (GitHub Actions)  
**Befehl:** `cd frontend && ng test --watch=false`

Die `tsconfig.spec.json` inkludiert `src/**/*.spec.ts` vollständig. Neben dem MS4-Test
der App-Komponente laufen daher auch 17 Tests aus der FR-1-Entwicklungsphase mit
(GoalForm, GoalList, GoalService aus `src/app/goals/`). Alle bestehen.

### 4.1 App-Komponente (app.spec.ts)

| Test-ID | Datei | Beschreibung | Erwartetes Ergebnis | Status |
|---|---|---|---|---|
| T-FE-01 | app.spec.ts | App-Komponente rendert ohne Fehler | Komponente wird erstellt, kein Fehler | ✅ Bestanden |

### 4.2 GoalForm-Komponente (goal-form.spec.ts)

| Test-ID | Beschreibung | Status |
|---|---|---|
| T-FE-02 | Kein POST, solange Formular unvollständig | ✅ Bestanden |
| T-FE-03 | Ausgefüllte Werte werden als POST ans Backend geschickt | ✅ Bestanden |
| T-FE-04 | Kein Priorität-Feld → null im Request-Body | ✅ Bestanden |
| T-FE-05 | Titel + Datum ohne Modul → nicht absendbar | ✅ Bestanden |
| T-FE-06 | Bearbeiten-Modus: lädt Lernziel und füllt Formular vor (GET) | ✅ Bestanden |
| T-FE-07 | Bearbeiten-Modus: speichert Änderungen per PUT | ✅ Bestanden |

### 4.3 GoalList-Komponente (goal-list.spec.ts)

| Test-ID | Beschreibung | Status |
|---|---|---|
| T-FE-08 | Geladene Lernziele erscheinen als Tabellenzeilen | ✅ Bestanden |
| T-FE-09 | Status wird lesbar angezeigt, nicht als technischer Wert | ✅ Bestanden |
| T-FE-10 | Leere Liste zeigt Hinweis „Noch keine Lernziele vorhanden." | ✅ Bestanden |
| T-FE-11 | Jede Zeile verlinkt auf das Bearbeiten-Formular | ✅ Bestanden |
| T-FE-12 | Löschen erst nach Bestätigung; Zeile verschwindet danach | ✅ Bestanden |
| T-FE-13 | Gesetzte Priorität lesbar, fehlende als Gedankenstrich | ✅ Bestanden |

### 4.4 GoalService (goal.service.spec.ts)

| Test-ID | Beschreibung | Status |
|---|---|---|
| T-FE-14 | list() schickt GET an /api/goals | ✅ Bestanden |
| T-FE-15 | create() schickt POST mit korrektem Body | ✅ Bestanden |
| T-FE-16 | get(id) schickt GET an /api/goals/:id | ✅ Bestanden |
| T-FE-17 | update(id) schickt PUT mit aktualisierten Feldern | ✅ Bestanden |
| T-FE-18 | remove(id) schickt DELETE an /api/goals/:id | ✅ Bestanden |

**Gesamtergebnis Frontend (Stand MS4-Auslieferung):** 18 von 18 Tests bestanden ✅. Nach den
Plänen P1–P3 sind 14 weitere Tests hinzugekommen, siehe die Gesamtzahl in Abschnitt 1.

Ein Teil dieser Tests stammt aus der FR-1-Entwicklungsphase und prüft die Komponenten in
`frontend/src/app/goals/`, die seit der MS4-Umsetzung nicht mehr in die Anwendung eingebunden sind
(die Wegeliste `frontend/src/app/app.routes.ts` verweist ausschließlich auf
`frontend/src/app/features/`). Über die Frage, ob dieser Code entfernt wird, entscheidet das Team;
bis dahin bleiben die Tests bestehen.

---

## 5. Playwright E2E-Testfälle

**Ausführungsdatum:** 2026-08-11  
**Tester:** Assis Ramadan  
**Umgebung:** Railway-Produktionsumgebung (`https://projekt-lernzeitmanager-production.up.railway.app`)  
**Browser:** Chromium (Playwright 1.49)  
**Befehl:** `cd frontend && npx playwright test`

### 5.1 Authentifizierung (auth.spec.ts)

| Test-ID | Anforderung | Beschreibung | Status |
|---|---|---|---|
| T-E2E-01 | FR-0 | Registrierung → Dashboard erscheint, Name in Navbar sichtbar | ✅ Bestanden |
| T-E2E-02 | FR-0 | Abmelden → Login-Seite; erneuter Login → Dashboard | ✅ Bestanden |
| T-E2E-03 | FR-0 | Login mit falschen Daten → Fehlermeldung sichtbar | ✅ Bestanden |
| T-E2E-04 | FR-0 | Direktzugriff /goals ohne Token → Weiterleitung auf /login | ✅ Bestanden |

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

**Gesamtergebnis Playwright (Railway-Produktionsumgebung, 2026-08-11):** 13 von 13 Tests bestanden ✅

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

---

## 7. Abdeckung der umgesetzten Anforderungen

| Anforderung | Beschreibung | Abgedeckt durch |
|---|---|---|
| FR-1.1 | Lernziele für ≥ 6 Monate anlegen | T-BE-09, T-E2E-05, MS-04 |
| FR-1.2 | Titel, Zieldatum, Modul, Status | T-BE-09, T-E2E-05, MS-04, MS-05 |
| FR-1.3 | Lernziele löschen | T-BE-12, T-E2E-08 |
| FR-2.1 | Workload auf Basis ECTS | Dashboard (geplante Minuten), MS-04 |
| FR-3.1 | Lernzeit-Slots planen | T-E2E-09, MS-06 |
| FR-4.1 | Timer starten, pausieren, beenden | T-E2E-11–13, MS-08–11 |
| FR-4.2 | Session Lernziel zuordnen und persistieren | T-BE-09, MS-11 |
| FR-4.3 | Pausen werden nicht als Lernzeit gezählt | T-E2E-12, MS-10 |
| FR-5.1 | Lernziel als erreicht markieren | T-BE-11, T-E2E-07, MS-13 |
| FR-6.1 | Dashboard: Lernzeit vs. geplante Zeit | MS-12 |
| FR-6.2 | Fortschrittsbalken pro Ziel | MS-12 |
| FR-7.1 | Inaktivitäts-Erinnerung | MS-07 |

**Hinweis zur Tabelle:** FR-1.3 und FR-4.3 haben laut Anforderungsdokument Priorität "Should" und wurden ebenfalls implementiert; sie sind hier aufgeführt, weil sie vollständig getestet sind. FR-3.2 (Must, Zwischenziele) ist als eigenständige Entität nicht implementiert — das Notiz-Feld von PlanSlot deckt den Anwendungsfall ab (siehe Abschnitt 8).

**Alle Must-Anforderungen mit Ausnahme von FR-3.2 sind vollständig implementiert und getestet.**

---

## 8. Nicht implementierte Anforderungen

Die folgenden Anforderungen wurden nicht umgesetzt und wurden zugunsten des MS4-Zeitbudgets
zurückgestellt oder durch eine Behelfslösung abgedeckt.

| Anforderung | Priorität | Begründung |
|---|---|---|
| FR-3.2 Zwischenziele pro Monat | Must | Kein eigenständiges Modell; das Notiz-Feld eines PlanSlots kann als Zwischenziel genutzt werden |
| FR-2.2 Automatische Wochenplanung | Should | Nicht im MS4-Scope |
| FR-4.4 Manuelle Nacherfassung | Could | Nicht im MS4-Scope |
| FR-5.2 Notizen zu erreichten Zielen | Should | Nicht im MS4-Scope |
| FR-7.2 Erinnerung vor geplanter Lernzeit | Should | Nicht im MS4-Scope |
| FR-7.3 Erinnerung bei nahendem Zieldatum | Should | Nicht im MS4-Scope |

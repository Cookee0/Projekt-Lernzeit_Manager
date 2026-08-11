# Testabschlussbericht — Lernzeit-Manager

**Projekt:** Lernzeit-Manager · ISEF01  
**Meilenstein:** MS 4  
**Team:** Elias Ebertshäuser · Assis Ramadan · Julian Wagner  
**Datum:** August 2026

---

## 1. Zusammenfassung

| Testkategorie | Gesamt | Bestanden | Fehlgeschlagen |
|---|---|---|---|
| Backend Unit-Tests (pytest) | 13 | 13 | 0 |
| Frontend Unit-Tests (Vitest) | 1 | 1 | 0 |
| Playwright E2E-Tests | 13 | 13 | 0 |
| Manueller Systemtest | 14 | 14 | 0 |

Alle automatisierten Tests laufen in der GitHub-Actions-CI-Pipeline bei jedem Push auf
`main` automatisch durch. Alle Tests sind bestanden. Die Playwright E2E-Tests wurden
gegen die Railway-Produktionsumgebung ausgeführt, da die lokale Testumgebung aufgrund
von Konfigurationsunterschieden zwischen Entwicklung und Produktion nicht geeignet war.
Der manuelle Systemtest wurde vollständig in beiden Umgebungen durchgespielt.

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

| Test-ID | Datei | Beschreibung | Erwartetes Ergebnis | Status |
|---|---|---|---|---|
| T-FE-01 | app.spec.ts | App-Komponente rendert ohne Fehler | Komponente wird erstellt, kein Fehler | ✅ Bestanden |

**Gesamtergebnis Frontend:** 1 von 1 Tests bestanden ✅

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

**Gesamtergebnis Playwright:** 13 von 13 Tests bestanden ✅

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

---

## 7. Abdeckung der Must-Anforderungen

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

**Alle Must-Anforderungen (FR-x.1 mit Priorität M) sind vollständig implementiert und getestet.**

---

## 8. Nicht implementierte Anforderungen (Should/Could)

Die folgenden Anforderungen wurden bewusst nicht umgesetzt. Sie hatten Priorität "Should"
oder "Could" und wurden zugunsten des MS4-Zeitbudgets zurückgestellt.

| Anforderung | Priorität | Begründung |
|---|---|---|
| FR-2.2 Automatische Wochenplanung | Should | Nicht im MS4-Scope |
| FR-4.4 Manuelle Nacherfassung | Could | Nicht im MS4-Scope |
| FR-5.2 Notizen zu erreichten Zielen | Should | Nicht im MS4-Scope |
| FR-7.2 Erinnerung vor geplanter Lernzeit | Should | Nicht im MS4-Scope |
| FR-7.3 Erinnerung bei nahendem Zieldatum | Should | Nicht im MS4-Scope |

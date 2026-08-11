# P0: Eingeloggt bleiben nach Seiten-Reload und Navigationsleiste zuverlässig anzeigen

Dieses Dokument ist ein lebendes Dokument ("ExecPlan"). Die Abschnitte `Progress`,
`Surprises & Discoveries`, `Decision Log` und `Outcomes & Retrospective` müssen während der
Arbeit laufend aktualisiert werden. Die verbindlichen Regeln für dieses Dokument stehen in
[`docs/PLANS.md`](../../PLANS.md) im Repository-Wurzelverzeichnis; dieser Plan ist gemäß jener
Datei zu pflegen.

## Purpose / Big Picture

Heute wird jede Nutzerin und jeder Nutzer der Anwendung bei **jedem** Seiten-Reload (Taste F5)
ausgeloggt und landet wieder auf der Anmeldeseite. Zusätzlich ist die dunkle Navigationsleiste am
oberen Bildschirmrand nach dem Anmelden nicht verlässlich sichtbar, sodass man sich nicht abmelden
und nicht zwischen Dashboard, Lernzielen, Planung und Timer wechseln kann.

Nach Abschluss dieses Plans gilt: Wer sich anmeldet und danach F5 drückt, bleibt angemeldet und
sieht dieselbe Seite wie vorher. Die Navigationsleiste mit den vier Links und dem Knopf „Abmelden"
erscheint unmittelbar nach dem Anmelden und nach jedem Reload. Beweisbar ist das durch drei neue
automatisierte Tests, die vor der Änderung fehlschlagen und danach durchlaufen, sowie durch einen
manuellen Durchlauf im Browser, der am Ende dieses Plans Schritt für Schritt beschrieben ist.

Zusätzlich wird ein bereits vorhandener, roter Test (`frontend/src/app/app.spec.ts`) wieder grün.
Dieser Test ist aktuell auf dem Branch `main` rot, wodurch die GitHub-Actions-Pipeline scheitert
und der darin konfigurierte Railway-Deploy-Schritt gar nicht erst startet.

## Progress

- [ ] Schritt 1: Umgebung starten und den Ist-Zustand mit `npx ng test --watch=false` reproduzieren
      (erwartet: 17 von 18 Tests bestanden, `app.spec.ts` rot).
- [ ] Schritt 2: Neue Testdatei `frontend/src/app/core/services/auth.service.spec.ts` anlegen und
      beobachten, dass zwei der drei neuen Tests fehlschlagen (Reproduktion des Fehlers).
- [ ] Schritt 3: Neue Datei `frontend/src/app/core/token-storage.ts` anlegen.
- [ ] Schritt 4: `frontend/src/app/core/interceptors/auth.interceptor.ts` auf `token-storage`
      umstellen (beseitigt den Ringschluss in der Abhängigkeitsauflösung).
- [ ] Schritt 5: `frontend/src/app/core/services/auth.service.ts` auf Signale und
      `token-storage` umstellen.
- [ ] Schritt 6: `frontend/src/app/layout/navbar/navbar.ts` unverändert prüfen (die Reaktivität
      kommt aus dem Service) und die Tests erneut ausführen (erwartet: 21 von 21 bestanden).
- [ ] Schritt 7: Anwendung lokal starten und den manuellen F5-Test durchführen.
- [ ] Schritt 8: `README.md` im Abschnitt „Status" um den korrigierten Anmelde-Ablauf ergänzen.
- [ ] Schritt 9: Änderungen committen und diesen Plan nach
      `docs/ExecPlans/completed/` verschieben.

## Surprises & Discoveries

- Beobachtung: Der Session-Verlust ist **kein** Problem des Tokens, seiner Laufzeit oder des
  Speicherorts. Der Token liegt korrekt im `localStorage` des Browsers und wäre acht Stunden
  gültig (`backend/app/config.py`, Zeile 8: `JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)`).
  Ursache ist ein Ringschluss in Angulars Abhängigkeitsauflösung: Der Konstruktor von
  `AuthService` startet sofort eine HTTP-Anfrage; der dazwischengeschaltete `authInterceptor`
  fordert währenddessen genau denselben, noch nicht fertig gebauten `AuthService` an.
  Evidence (Ausgabe eines temporären Diagnose-Logs im `catch`-Zweig des Konstruktors, ausgeführt
  am 11.08.2026 mit `npx ng test --watch=false`):

      >>> BOOTSTRAP-FEHLER: NG0200: Circular dependency detected for `_AuthService`.
      >>> TOKEN NACH BOOTSTRAP: null
      >>> ANZAHL /api/auth/me REQUESTS: 0
      >>> isLoggedIn: false

  Bemerkenswert ist die Zahl `0`: Es wurde nie eine Anfrage an den Server gesendet. Der Fehler
  entsteht also vollständig im Browser, unabhängig von Backend, Datenbank und Netzwerk.

- Beobachtung: Der bestehende Test `frontend/src/app/app.spec.ts` ist auf `main` rot, und zwar aus
  derselben Wurzel — der `AuthService`-Konstruktor greift ungeschützt auf `localStorage` zu, das es
  in der Testumgebung (Node.js ohne Browser) nicht gibt.
  Evidence (`cd frontend; npx ng test --watch=false`, 11.08.2026):

      FAIL  |frontend| src/app/app.spec.ts > App > should create the app
      TypeError: Cannot read properties of undefined (reading 'getItem')
       ❯ _AuthService.getToken src/app/core/services/auth.service.ts:27:25
       ❯ new _AuthService src/app/core/services/auth.service.ts:16:24
      Tests  1 failed | 17 passed (18)

- Beobachtung: Das Projekt läuft ohne `zone.js`. In `frontend/angular.json` ist unter dem
  Build-Ziel kein Eintrag `polyfills` gesetzt, und `zone.js` steht nicht in
  `frontend/package.json`. Angular 22 arbeitet dann im sogenannten zonenlosen Modus: Die Oberfläche
  wird nur dann neu berechnet, wenn ein Signal (ein spezieller, beobachtbarer Wert von Angular)
  sich ändert oder ein Ereignis ausdrücklich eine Neuberechnung anstößt. Eine gewöhnliche Methode
  wie das heutige `isLoggedIn()` in `frontend/src/app/layout/navbar/navbar.ts` löst keine
  Neuberechnung aus. Deshalb ist die Navigationsleiste unzuverlässig — sie erscheint nur, wenn
  zufällig aus anderem Grund neu gezeichnet wird.

## Decision Log

- Decision: Der `authInterceptor` fragt den Token künftig nicht mehr beim `AuthService` an,
  sondern liest ihn über eine kleine, eigenständige Funktion aus einer neuen Datei
  `frontend/src/app/core/token-storage.ts`.
  Rationale: Damit ist der Ringschluss strukturell unmöglich statt nur zeitlich vermieden. Eine
  Alternative wäre gewesen, den Aufruf im Konstruktor mit `setTimeout` oder
  `Promise.resolve().then(...)` zu verzögern; das hätte den Ringschluss nur so lange verdeckt, bis
  jemand später wieder synchron aufruft. Die gewählte Lösung behebt außerdem in einem Zug den roten
  Test `app.spec.ts`, weil der Zugriff auf `localStorage` in derselben Datei abgesichert wird.
  Date/Author: 2026-08-11, Julian (Vorbereitung durch Code-Analyse)

- Decision: `AuthService.isLoggedIn` wird von einer Methode zu einem berechneten Signal
  (`computed`), gespeist aus einem Signal `token`.
  Rationale: Nur so wird die Navigationsleiste im zonenlosen Modus zuverlässig neu gezeichnet. Der
  Aufrufstil bleibt identisch (`auth.isLoggedIn()`), deshalb müssen weder
  `frontend/src/app/core/guards/auth.guard.ts` noch die Vorlage der Navigationsleiste angepasst
  werden.
  Date/Author: 2026-08-11, Julian

- Decision: Beim Start der Anwendung wird der Token nur noch dann verworfen, wenn der Server
  ausdrücklich mit dem Status 401 (nicht angemeldet) oder 403 (verboten) antwortet — nicht mehr
  bei jedem beliebigen Fehler.
  Rationale: Bisher führte jeder Fehler zum Abmelden, auch ein kurzer Netzwerkausfall oder ein
  gerade neu startender Server. Das ist aus Nutzersicht das schlechteste mögliche Verhalten. Ein
  abgelaufener oder gefälschter Token liefert vom Backend zuverlässig 401, sodass die eigentliche
  Schutzfunktion erhalten bleibt.
  Date/Author: 2026-08-11, Julian

## Outcomes & Retrospective

(Wird bei Abschluss dieses Plans ausgefüllt: Was wurde erreicht, was blieb offen, was war die
Lehre? Vor dem Verschieben nach `docs/ExecPlans/completed/` muss hier ein Eintrag stehen.)

## Context and Orientation

Dieses Repository enthält den „Lernzeit-Manager", eine Web-Anwendung für das Studienmodul ISEF01.
Sie besteht aus zwei Teilen im selben Repository (einem sogenannten Monorepo):

Das **Backend** liegt unter `backend/` und ist in Python mit dem Web-Rahmenwerk Flask geschrieben.
Es stellt eine sogenannte REST-Schnittstelle bereit, also Adressen wie `/api/auth/login`, die
JSON-Daten entgegennehmen und zurückliefern. Für dieses Vorhaben ist nur relevant, dass
`backend/app/routes/auth.py` drei Adressen anbietet: `POST /api/auth/register` (Konto anlegen),
`POST /api/auth/login` (anmelden) und `GET /api/auth/me` (Angaben zum angemeldeten Konto abrufen).
Die ersten beiden liefern ein sogenanntes JWT zurück — eine signierte Zeichenkette, die als
Ausweis dient und bei jeder weiteren Anfrage im Kopfzeilenfeld `Authorization: Bearer <Zeichen>`
mitgeschickt werden muss. Am Backend wird in diesem Plan **nichts** geändert.

Das **Frontend** liegt unter `frontend/` und ist in TypeScript mit dem Rahmenwerk Angular
(Version 22) geschrieben. Für diesen Plan sind fünf Dateien wichtig:

`frontend/src/app/core/services/auth.service.ts` verwaltet den Anmeldezustand. Er speichert den
Ausweis (Token) unter dem Schlüssel `lm_token` im `localStorage` des Browsers — das ist ein vom
Browser bereitgestellter Speicher, der einen Reload und sogar das Schließen des Fensters übersteht.

`frontend/src/app/core/interceptors/auth.interceptor.ts` ist ein sogenannter Interceptor
(„Abfangjäger"): eine Funktion, die Angular vor **jeder** ausgehenden HTTP-Anfrage aufruft, damit
sie die Anfrage verändern kann. Hier hängt sie das Feld `Authorization` an.

`frontend/src/app/core/guards/auth.guard.ts` ist ein sogenannter Guard („Wächter"): eine Funktion,
die der Router vor dem Anzeigen einer geschützten Seite aufruft. Liefert sie `true`, wird die Seite
angezeigt; sonst wird auf `/login` umgeleitet.

`frontend/src/app/layout/navbar/navbar.ts` ist die Navigationsleiste am oberen Rand. Sie zeigt die
Links und den Abmelde-Knopf nur, wenn `auth.isLoggedIn()` wahr ist.

`frontend/src/app/app.ts` ist die Wurzelkomponente; sie stellt die Navigationsleiste über den
Seiteninhalt.

Zwei Begriffe, die im weiteren Verlauf gebraucht werden:

Ein **Signal** ist in Angular ein Wert, der weiß, wer ihn liest. Ändert man ihn mit `.set(...)`,
zeichnet Angular automatisch alle Vorlagen neu, die ihn gelesen haben. Gelesen wird ein Signal
durch Aufruf, also `meinSignal()`. Ein **computed** ist ein abgeleitetes Signal, das sich aus
anderen Signalen berechnet und sich selbstständig aktualisiert.

**Ringschluss in der Abhängigkeitsauflösung** (englisch „circular dependency", Angular-Fehlercode
NG0200) bedeutet: Angular baut gerade Objekt A, und währenddessen verlangt jemand erneut genau
Objekt A. Angular kann diesen Wunsch nicht erfüllen und wirft einen Fehler. Genau das passiert
heute: `AuthService` (A) wird gebaut, sein Konstruktor löst eine HTTP-Anfrage aus, der
Interceptor verlangt `AuthService` (A) — Fehler.

## Plan of Work

Die Arbeit hat drei inhaltliche Teile, die nacheinander erledigt werden.

Zuerst wird der Fehler in einem automatisierten Test festgehalten, **bevor** er behoben wird. Das
ist wichtig, weil ein Test, den man nie hat scheitern sehen, nichts beweist. Der Test baut den
`AuthService` unter denselben Bedingungen wie beim Seitenstart auf: ein Token liegt im Speicher,
und der Interceptor ist aktiv.

Danach wird der Ringschluss aufgelöst. Der Zugriff auf den Browser-Speicher zieht in eine eigene,
winzige Datei um, die von niemandem abhängt. Interceptor und `AuthService` benutzen beide diese
Datei. Weil die Datei keinen Angular-Dienst mehr anfordert, kann kein Ringschluss mehr entstehen.
In derselben Datei wird der Zugriff auf `localStorage` gegen die Testumgebung abgesichert, in der
es kein `localStorage` gibt.

Zuletzt wird der Anmeldezustand reaktiv gemacht, damit die Navigationsleiste zuverlässig erscheint.
Der Token wird in einem Signal gehalten, `isLoggedIn` wird daraus berechnet. Anmelden, Registrieren
und Abmelden setzen dieses Signal.

## Concrete Steps

### Schritt 1: Umgebung prüfen und Ist-Zustand reproduzieren

Öffne eine PowerShell im Repository-Wurzelverzeichnis
`D:\Programmieren\Projects\Projekt-Lernzeit_Manager`. Für die Tests dieses Plans werden **weder
Docker noch das Backend** benötigt; die Frontend-Tests laufen eigenständig.

Prüfe zuerst, dass die Abhängigkeiten installiert sind:

    cd frontend
    npm install

Führe dann die Tests aus:

    npx ng test --watch=false

Erwartete Ausgabe am Ende (die Reihenfolge der Zeilen kann abweichen):

    FAIL  |frontend| src/app/app.spec.ts > App > should create the app
    TypeError: Cannot read properties of undefined (reading 'getItem')
     Test Files  1 failed | 3 passed (4)
          Tests  1 failed | 17 passed (18)

Siehst du stattdessen 18 bestandene Tests, ist der Fehler bereits behoben; prüfe dann mit
`git log --oneline -5`, ob jemand anderes diesen Plan schon umgesetzt hat, und stimme dich im Team
ab, bevor du weitermachst.

Bricht der Befehl sofort mit „The Angular CLI requires a minimum Node.js version" ab, ist deine
Node.js-Version zu alt. Prüfe mit `node --version`; nötig ist mindestens v22.22.3. Installiere in
dem Fall Node.js 22 LTS von https://nodejs.org/ und öffne danach eine neue PowerShell.

### Schritt 2: Den Fehler in einem Test festhalten

Lege die neue Datei `frontend/src/app/core/services/auth.service.spec.ts` mit **exakt** diesem
Inhalt an:

    import { provideHttpClient, withInterceptors } from '@angular/common/http';
    import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
    import { TestBed } from '@angular/core/testing';
    import { authInterceptor } from '../interceptors/auth.interceptor';
    import { AuthService } from './auth.service';

    // Die Tests laufen in Node.js ohne Browser. Dort gibt es kein localStorage,
    // deshalb wird hier ein einfacher Ersatz mit derselben Schnittstelle eingesetzt.
    function installLocalStorageStub(): void {
      const store = new Map<string, string>();
      (globalThis as unknown as { localStorage: unknown }).localStorage = {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
        clear: () => store.clear(),
      };
    }

    // Gibt der Ereignisschleife die Gelegenheit, angestossene Promises abzuarbeiten.
    // Ohne diese Pause waeren die Zusicherungen manchmal schneller als der Code,
    // der auf die Antwort des Servers reagiert.
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

    function configure(): { auth: AuthService; httpMock: HttpTestingController } {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([authInterceptor])),
          provideHttpClientTesting(),
        ],
      });
      return {
        auth: TestBed.inject(AuthService),
        httpMock: TestBed.inject(HttpTestingController),
      };
    }

    describe('AuthService', () => {
      beforeEach(() => {
        installLocalStorageStub();
        TestBed.resetTestingModule();
      });

      it('behaelt den Token beim Start und fragt genau einmal /api/auth/me ab', async () => {
        localStorage.setItem('lm_token', 'dummy-token');

        const { auth, httpMock } = configure();
        await tick();

        const requests = httpMock.match('/api/auth/me');
        expect(requests.length).toBe(1);
        expect(requests[0].request.headers.get('Authorization')).toBe('Bearer dummy-token');
        expect(localStorage.getItem('lm_token')).toBe('dummy-token');
        expect(auth.isLoggedIn()).toBe(true);

        requests[0].flush({ id: 1, email: 'a@b.de', name: 'A' });
        await tick();
        expect(auth.currentUser()?.name).toBe('A');
      });

      it('meldet ab, wenn der Server den Token mit 401 ablehnt', async () => {
        localStorage.setItem('lm_token', 'abgelaufener-token');

        const { auth, httpMock } = configure();
        await tick();

        const requests = httpMock.match('/api/auth/me');
        expect(requests.length).toBe(1);
        requests[0].flush({ error: 'nope' }, { status: 401, statusText: 'Unauthorized' });
        await tick();

        expect(localStorage.getItem('lm_token')).toBeNull();
        expect(auth.isLoggedIn()).toBe(false);
      });

      it('setzt den Anmeldezustand beim Abmelden zurueck', async () => {
        localStorage.setItem('lm_token', 'dummy-token');

        const { auth, httpMock } = configure();
        await tick();
        httpMock.match('/api/auth/me').forEach((r) => r.flush({ id: 1, email: 'a@b.de', name: 'A' }));
        await tick();

        auth.logout();

        expect(auth.isLoggedIn()).toBe(false);
        expect(auth.currentUser()).toBeNull();
        expect(localStorage.getItem('lm_token')).toBeNull();
      });
    });

Führe die Tests erneut aus (Arbeitsverzeichnis `frontend`):

    npx ng test --watch=false

Erwartet wird jetzt, dass die ersten beiden neuen Tests **fehlschlagen**, mit einer Meldung dieser
Art:

    AssertionError: expected +0 to be 1 // Object.is equality

Das ist der gesuchte Beweis: Es wird keine einzige Anfrage abgesetzt, weil der Ringschluss die
Anfrage verhindert. Der dritte Test („setzt den Anmeldezustand beim Abmelden zurueck") kann bereits
jetzt bestehen — das ist in Ordnung.

### Schritt 3: Datei `frontend/src/app/core/token-storage.ts` anlegen

Lege die neue Datei mit **exakt** diesem Inhalt an:

    /**
     * Zugriff auf den im Browser gespeicherten Anmelde-Ausweis (Token).
     *
     * Diese Datei haengt bewusst von nichts ab - insbesondere nicht vom AuthService.
     * Grund: Der HTTP-Interceptor braucht den Token vor jeder Anfrage. Wuerde er ihn
     * beim AuthService erfragen, entstuende beim Start der Anwendung ein Ringschluss
     * (Angular-Fehler NG0200), weil der AuthService seinerseits beim Bauen bereits
     * eine HTTP-Anfrage ausloest.
     *
     * Der Zugriff ist zusaetzlich abgesichert, weil die Unit-Tests in Node.js ohne
     * Browser laufen und dort kein localStorage existiert.
     */
    const TOKEN_KEY = 'lm_token';

    function storage(): Storage | null {
      try {
        if (typeof localStorage === 'undefined' || localStorage === null) {
          return null;
        }
        return localStorage;
      } catch {
        // Manche Browser werfen bei blockierten Cookies/Speicher eine Ausnahme.
        return null;
      }
    }

    export function readToken(): string | null {
      return storage()?.getItem(TOKEN_KEY) ?? null;
    }

    export function writeToken(token: string): void {
      storage()?.setItem(TOKEN_KEY, token);
    }

    export function clearToken(): void {
      storage()?.removeItem(TOKEN_KEY);
    }

### Schritt 4: Den Interceptor umstellen

Die Datei `frontend/src/app/core/interceptors/auth.interceptor.ts` sieht derzeit so aus:

    import { HttpInterceptorFn } from '@angular/common/http';
    import { inject } from '@angular/core';
    import { AuthService } from '../services/auth.service';

    export const authInterceptor: HttpInterceptorFn = (req, next) => {
      const token = inject(AuthService).getToken();
      if (token) {
        const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        return next(cloned);
      }
      return next(req);
    };

Ersetze den gesamten Inhalt durch:

    import { HttpInterceptorFn } from '@angular/common/http';
    import { readToken } from '../token-storage';

    export const authInterceptor: HttpInterceptorFn = (req, next) => {
      const token = readToken();
      if (token) {
        const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        return next(cloned);
      }
      return next(req);
    };

Beachte, dass `inject` und der Import von `AuthService` vollständig verschwinden — genau das
beseitigt den Ringschluss.

### Schritt 5: Den AuthService umstellen

Ersetze den **gesamten** Inhalt von `frontend/src/app/core/services/auth.service.ts` durch:

    import { HttpClient } from '@angular/common/http';
    import { Injectable, computed, inject, signal } from '@angular/core';
    import { firstValueFrom } from 'rxjs';
    import { User } from '../models';
    import { clearToken, readToken, writeToken } from '../token-storage';

    const API = '/api';

    @Injectable({ providedIn: 'root' })
    export class AuthService {
      private http = inject(HttpClient);

      /** Der Ausweis als Signal, damit Vorlagen auf Aenderungen reagieren. */
      private token = signal<string | null>(readToken());

      currentUser = signal<User | null>(null);

      /** Wird von der Navigationsleiste und vom Router-Waechter gelesen. */
      isLoggedIn = computed(() => this.token() !== null);

      constructor() {
        if (this.token()) {
          void this.loadCurrentUser();
        }
      }

      getToken(): string | null {
        return this.token();
      }

      async register(email: string, name: string, password: string): Promise<void> {
        const res = await firstValueFrom(
          this.http.post<{ access_token: string; user: User }>(`${API}/auth/register`, { email, name, password })
        );
        this.setSession(res.access_token, res.user);
      }

      async login(email: string, password: string): Promise<void> {
        const res = await firstValueFrom(
          this.http.post<{ access_token: string; user: User }>(`${API}/auth/login`, { email, password })
        );
        this.setSession(res.access_token, res.user);
      }

      logout(): void {
        clearToken();
        this.token.set(null);
        this.currentUser.set(null);
      }

      private setSession(token: string, user: User): void {
        writeToken(token);
        this.token.set(token);
        this.currentUser.set(user);
      }

      /**
       * Laedt beim Start das Konto zum gespeicherten Token nach.
       * Abgemeldet wird nur bei 401/403 - also wenn der Server den Token
       * ausdruecklich ablehnt. Ein Netzwerkfehler darf die Sitzung nicht zerstoeren.
       */
      private async loadCurrentUser(): Promise<void> {
        try {
          const user = await firstValueFrom(this.http.get<User>(`${API}/auth/me`));
          this.currentUser.set(user);
        } catch (err: unknown) {
          const status = (err as { status?: number }).status;
          if (status === 401 || status === 403) {
            this.logout();
          }
        }
      }
    }

### Schritt 6: Tests erneut ausführen

Im Arbeitsverzeichnis `frontend`:

    npx ng test --watch=false

Erwartete Ausgabe am Ende:

    Test Files  5 passed (5)
         Tests  21 passed (21)

Die Zahl 21 ergibt sich aus 18 bisherigen Tests plus drei neuen. Ist `app.spec.ts` weiterhin rot,
hast du vermutlich Schritt 3 ausgelassen oder in `auth.service.ts` noch einen direkten Zugriff auf
`localStorage` stehen — suche mit `Select-String -Path src\app\core\services\auth.service.ts
-Pattern localStorage`; die Suche darf nichts finden.

Prüfe zusätzlich die statische Code-Prüfung:

    npx ng lint

Erwartet: `All files pass linting.`

An `frontend/src/app/layout/navbar/navbar.ts` und `frontend/src/app/core/guards/auth.guard.ts` ist
**keine** Änderung nötig: Beide rufen `auth.isLoggedIn()` auf, und dieser Aufruf funktioniert für
ein berechnetes Signal genauso wie zuvor für eine Methode — nur eben reaktiv.

### Schritt 7: Manueller Nachweis im Browser

Für diesen Nachweis werden alle drei Teile der Anwendung gebraucht. Starte Docker Desktop und warte,
bis das Wal-Symbol still steht.

Erstes PowerShell-Fenster, im Repository-Wurzelverzeichnis:

    docker compose up -d
    docker compose ps

Erwartet: eine Zeile für `lernzeit-db` mit Status `running`.

Zweites Fenster:

    cd backend
    .\.venv\Scripts\Activate.ps1
    flask db upgrade
    flask run --debug

Erwartet: `Running on http://127.0.0.1:5000`. Scheitert `Activate.ps1` mit einer Meldung über
nicht erlaubte Skripte, führe einmalig `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` aus.
Existiert der Ordner `backend\.venv` nicht, lege ihn mit `python -m venv .venv` an, aktiviere ihn
und installiere die Abhängigkeiten mit `pip install -r requirements-dev.txt`.

Drittes Fenster:

    cd frontend
    ng serve

Erwartet: `Application bundle generation complete` und die Anwendung unter http://localhost:4200.

Führe nun im Browser genau diese Schritte aus:

1. Rufe http://localhost:4200 auf. Erwartet: die Anmeldeseite.
2. Lege über „Registrieren" ein Testkonto an, zum Beispiel `test1@example.de`, Name `Test Eins`,
   Passwort `geheim123`. Erwartet: Du landest auf dem Dashboard, und **oben ist die dunkle
   Navigationsleiste mit den Links Dashboard, Lernziele, Planung, Timer sowie dem Knopf „Abmelden"
   sichtbar**.
3. Drücke F5. Erwartet: Du bleibst auf dem Dashboard und bleibst angemeldet. Die Navigationsleiste
   ist weiterhin sichtbar. **Genau das war vorher kaputt.**
4. Wechsle auf „Lernziele" und drücke dort erneut F5. Erwartet: Die Lernziel-Seite bleibt stehen.
5. Öffne die Entwicklerwerkzeuge des Browsers mit F12, Reiter „Console". Erwartet: **keine**
   Meldung mit `NG0200`.
6. Klicke auf „Abmelden". Erwartet: Du landest auf der Anmeldeseite, und die Navigationslinks
   verschwinden sofort.
7. Drücke auf der Anmeldeseite F5. Erwartet: Du bleibst abgemeldet und wirst nicht auf das
   Dashboard geworfen.

### Schritt 8: README aktualisieren

Das README ist laut `CLAUDE.md` und `AGENTS.md` die verbindliche Beschreibung des Ist-Zustands und
muss im selben Commit mitgepflegt werden. Öffne `README.md` und ergänze im Status-Absatz am Anfang
(dem Block, der mit `> **Status:` beginnt) einen Satz mit dieser Aussage: Die Anmeldung überlebt
einen Seiten-Reload, weil der Ausweis im `localStorage` unter `lm_token` liegt und beim Start über
`GET /api/auth/me` geprüft wird; abgemeldet wird nur, wenn der Server den Ausweis mit 401 ablehnt.

Eine vollständige Neufassung des veralteten Status-Absatzes ist **nicht** Aufgabe dieses Plans —
das erledigt der Plan `docs/ExecPlans/active/2026-08-11_P3-Erinnerungen-und-Dokumentation.md`.

### Schritt 9: Commit und Abschluss

Arbeite auf dem Branch, den du bereits ausgecheckt hast. Lege **keinen** eigenen Branch und
**kein** zusätzliches Arbeitsverzeichnis an; falls das Team einen Feature-Branch verlangt, frage
vorher nach.

    git add frontend/src/app/core/token-storage.ts frontend/src/app/core/services/auth.service.ts frontend/src/app/core/services/auth.service.spec.ts frontend/src/app/core/interceptors/auth.interceptor.ts README.md
    git commit -m "fix: Anmeldung ueberlebt Seiten-Reload, Navigationsleiste reaktiv (NG0200 behoben)"

Trage anschließend in diesem Plan den Abschnitt `Outcomes & Retrospective` aus, hake alle Punkte
unter `Progress` mit Zeitstempel ab und verschiebe die Datei nach
`docs/ExecPlans/completed/2026-08-11_P0-Session-Persistenz-und-Navbar.md`.

## Validation and Acceptance

Der Plan gilt als erfüllt, wenn alle folgenden Beobachtungen zutreffen.

Im Arbeitsverzeichnis `frontend` liefert `npx ng test --watch=false` die Zeile
`Tests  21 passed (21)`. Insbesondere besteht `src/app/app.spec.ts`, das vorher rot war, und die
beiden neuen Tests „behaelt den Token beim Start …" und „meldet ab, wenn der Server den Token mit
401 ablehnt" bestehen, nachdem sie vor der Änderung nachweislich fehlgeschlagen sind.

`npx ng lint` meldet `All files pass linting.`

Im Browser bleibt eine angemeldete Person nach F5 angemeldet, sowohl auf dem Dashboard als auch auf
`/goals`, und die Navigationsleiste ist unmittelbar nach dem Anmelden sichtbar. In der Konsole der
Entwicklerwerkzeuge erscheint kein `NG0200`.

Nach „Abmelden" verschwinden die Navigationslinks sofort, und ein Reload führt nicht zurück ins
Dashboard.

## Idempotence and Recovery

Alle Schritte sind wiederholbar. Die Testbefehle verändern nichts am Repository. Die Änderungen
betreffen vier Dateien im Frontend und eine Zeile im README; keine Datenbank-Migration, keine
Änderung am Backend, kein Eingriff in gespeicherte Daten.

Geht etwas schief, stellt `git checkout -- frontend/src/app/core` den Ausgangszustand der
geänderten Dateien wieder her; die neu angelegten Dateien `token-storage.ts` und
`auth.service.spec.ts` müssen dann von Hand gelöscht werden (`git status` zeigt sie als
„untracked").

Bleibt nach der Umstellung eine Person unerwartet abgemeldet, prüfe im Browser unter F12 →
„Application" → „Local Storage" → `http://localhost:4200`, ob der Schlüssel `lm_token` existiert.
Fehlt er, wurde er gelöscht; sieh dann im Reiter „Network" nach, mit welchem Status
`/api/auth/me` geantwortet hat. Ein 401 bedeutet, dass der Ausweis tatsächlich ungültig ist (etwa
weil die Datenbank mit `docker compose down -v` zurückgesetzt wurde) — dann ist erneutes Anmelden
das korrekte Verhalten.

## Artifacts and Notes

Beweis für die Ursache, erhoben am 11.08.2026 mit einer temporären Protokollzeile im
`catch`-Zweig des `AuthService`-Konstruktors (die Zeile wurde danach wieder entfernt):

    >>> BOOTSTRAP-FEHLER: NG0200: Circular dependency detected for `_AuthService`.
    >>> TOKEN NACH BOOTSTRAP: null
    >>> ANZAHL /api/auth/me REQUESTS: 0
    >>> isLoggedIn: false

Ist-Zustand der Testausführung vor der Änderung:

    Test Files  1 failed | 3 passed (4)
         Tests  1 failed | 17 passed (18)

Zum Vergleich der Backend-Zustand, der von diesem Plan unberührt bleibt (Arbeitsverzeichnis
`backend`, aktivierte venv, `python -m pytest -q`):

    13 passed, 16 warnings in 4.90s

## Interfaces and Dependencies

Es werden keine neuen Bibliotheken installiert. Am Ende dieses Plans müssen folgende Schnittstellen
existieren.

In `frontend/src/app/core/token-storage.ts`:

    export function readToken(): string | null;
    export function writeToken(token: string): void;
    export function clearToken(): void;

In `frontend/src/app/core/services/auth.service.ts` als Mitglieder der Klasse `AuthService`:

    currentUser: WritableSignal<User | null>;
    isLoggedIn: Signal<boolean>;      // berechnet aus dem privaten Token-Signal
    getToken(): string | null;
    register(email: string, name: string, password: string): Promise<void>;
    login(email: string, password: string): Promise<void>;
    logout(): void;

`frontend/src/app/core/interceptors/auth.interceptor.ts` exportiert unverändert
`authInterceptor: HttpInterceptorFn`, darf aber keinen Angular-Dienst mehr per `inject` anfordern.

## Änderungsnotizen

- 2026-08-11: Plan erstellt. Grundlage ist die Auswertung des manuellen Testdurchlaufs in
  `docs/testing-protokoll-lernzeit-manager.md`, ergänzt um eine Nachprüfung im Quelltext und einen
  Reproduktionstest, der die Ursache NG0200 belegt hat.
- 2026-08-11: Vor der ersten Übergabe überarbeitet. In der Testdatei aus Schritt 2 wurde
  `await Promise.resolve()` durch die Hilfsfunktion `tick()` ersetzt, weil ein einzelner
  Mikrotask nicht sicher ausreicht, bis die Antwort des Servers verarbeitet ist; ohne diese
  Änderung könnte der Test sporadisch fehlschlagen und einen behobenen Fehler vortäuschen.

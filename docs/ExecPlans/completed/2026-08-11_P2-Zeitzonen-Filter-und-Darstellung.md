# P2: Timer zeigt die richtige Zeit, Planungsfilter funktioniert in allen Kombinationen

Dieses Dokument ist ein lebendes Dokument ("ExecPlan"). Die Abschnitte `Progress`,
`Surprises & Discoveries`, `Decision Log` und `Outcomes & Retrospective` müssen während der
Arbeit laufend aktualisiert werden. Die verbindlichen Regeln für dieses Dokument stehen in
[`docs/PLANS.md`](../../PLANS.md); dieser Plan ist gemäß jener Datei zu pflegen.

## Purpose / Big Picture

Dieser Plan behebt drei sichtbare Fehler, die im manuellen Test aufgefallen sind.

Erstens springt der Timer beim Start sofort auf **2:00:00 Stunden**, obwohl gerade erst gestartet
wurde. Ursache ist eine Zeitzonenverwechslung zwischen Server und Browser; in Deutschland sind das
im Sommer genau zwei Stunden, im Winter eine. Nach diesem Plan startet die Anzeige bei `00:00:00`
und zählt sekundenweise hoch.

Zweitens lässt sich in der Planung nicht nach einem Lernziel allein filtern: Der Monat wird immer
mitgeschickt, und eine Auswahl „Alle Monate" gibt es nicht. Nach diesem Plan funktionieren alle
vier Kombinationen — nur Lernziel, nur Monat, beides, keines von beidem.

Drittens fehlt auf dem Dashboard ein Weg, direkt ein neues Lernziel anzulegen, und die Liste
„Zuletzt gelernt" verrutscht, sobald ein Lernziel einen langen Titel hat. Beides wird behoben.

Sichtbarer Nachweis am Ende: Ein frisch gestarteter Timer zeigt `00:00:03` statt `02:00:03`, die
Planungsseite zeigt bei Auswahl „Alle Monate" plus einem Lernziel dessen sämtliche Einträge, und auf
dem Dashboard führt ein Knopf „Neues Lernziel erstellen" direkt zur Lernziel-Seite.

## Progress

- [x] Schritt 1: Zeitzonenfehler funktional bestätigt (2026-08-11) — vor der Änderung lieferte
      `started_at` keine Zeitzonen-Kennzeichnung (siehe `Surprises & Discoveries` im
      Originalplan); ein manueller Browser-Durchgang war mangels Chrome-Werkzeug in dieser
      Sitzung nicht möglich, siehe Anmerkung unten bei Schritt 10.
- [x] Schritt 2: `backend/app/time_utils.py` angelegt (2026-08-11).
- [x] Schritt 3: `backend/app/models/study_session.py` und `backend/app/models/goal.py` auf
      `iso_utc` umgestellt (2026-08-11).
- [x] Schritt 4: `backend/app/routes/dashboard.py` auf `iso_utc` umgestellt (2026-08-11).
- [x] Schritt 5: `backend/tests/test_time_format.py` angelegt, `pytest` ausgeführt (2026-08-11):
      52 passed (48 aus P1 + 4 neue), wie erwartet.
- [x] Schritt 6: Filter und Anlegeformular in `planning.ts` entkoppelt (2026-08-11) — inklusive
      der bereits aus P1 vorhandenen Fehleranzeige, die dabei erhalten blieb.
- [x] Schritt 7: `frontend/src/app/core/services/plan.service.spec.ts` angelegt (2026-08-11).
- [x] Schritt 8: Knopf „+ Neues Lernziel erstellen" in `dashboard.ts` ergänzt (2026-08-11).
- [x] Schritt 9: Umbruch der Liste „Zuletzt gelernt" in `styles.scss` korrigiert (2026-08-11).
- [x] Schritt 10: Tests und Linting ausgeführt (2026-08-11): Backend 52 passed, `ruff check .`
      zeigt nur den vorbestehenden, plan-unabhängigen Fehler aus `config.py` (siehe P1). Frontend
      `npx ng test --watch=false` → 32 von 32 bestanden (29 aus P1 + 3 neue). `npx ng lint` zeigt
      unverändert 17 vorbestehende Fehler. Statt eines manuellen Browser-Durchgangs (kein
      Chrome-Werkzeug in dieser Sitzung verfügbar) wurden Timer-Start, Zeitstempel-Format,
      Planungsfilter (nur Lernziel, ohne Monat) und der fehlende `.isoformat()`-Aufruf funktional
      per HTTP bzw. Quelltextsuche nachgewiesen — siehe `Surprises & Discoveries`.
- [x] Schritt 11: `README.md` um die Zeitzonen-Regel ergänzt (2026-08-11).
- [x] Schritt 12: Committet und Plan nach `docs/ExecPlans/completed/` verschoben (2026-08-11).

## Surprises & Discoveries

- Beobachtung: Der Timer rechnet **richtig**, er zeigt nur falsch an. Der Server speichert
  Zeitstempel in koordinierter Weltzeit (UTC) ohne Zeitzonen-Kennzeichnung
  (`backend/app/routes/sessions.py`, Funktion `_now`:
  `datetime.now(timezone.utc).replace(tzinfo=None)`) und liefert sie als
  `"2026-08-11T21:08:09"` aus. JavaScript deutet eine solche Zeichenkette **ohne** Kennzeichnung
  als Ortszeit. In Deutschland (Sommerzeit UTC+2) hält der Browser den Startzeitpunkt damit für
  zwei Stunden zurückliegend.
  Evidence (Ausgabe der API am 11.08.2026 um 23:08 Ortszeit):

      started_at wie an das Frontend geliefert  ->  2026-08-11T21:08:09.151057

  Die gespeicherte Dauer ist davon nicht betroffen: `stop_session` rechnet auf dem Server
  UTC gegen UTC. Es müssen also **keine** Altdaten korrigiert werden.

- Beobachtung: Die Filterung in der Planung ist im Frontend eingeschränkt, nicht im Backend. Die
  API kann sehr wohl nur nach Lernziel filtern.
  Evidence:

      GET /api/plans?goal_id=5   ->  HTTP 200  [{...}]

  In `frontend/src/app/features/planning/planning.ts`, Methode `loadSlots`, werden Jahr und Monat
  jedoch immer gesetzt, weil `selectedMonth` mit dem laufenden Monat vorbelegt ist und keine
  Auswahl „Alle Monate" existiert.

- Beobachtung: Dasselbe Feld `selectedMonth` steuert zugleich den Filter **und** in welchen Monat
  ein neuer Eintrag gespeichert wird (`createSlot` liest ebenfalls `this.selectedMonth`). Eine
  Auswahl „Alle Monate" wäre deshalb ohne weitere Änderung mehrdeutig: In welchen Monat soll dann
  gespeichert werden? Beide Belange müssen getrennt werden.

## Decision Log

- Decision: Zeitstempel werden künftig mit angehängtem `Z` ausgeliefert (Beispiel:
  `2026-08-11T21:08:09Z`), erzeugt von einer gemeinsamen Hilfsfunktion `iso_utc`.
  Rationale: Das `Z` ist die international genormte Kennzeichnung für „koordinierte Weltzeit" und
  wird von JavaScript zuverlässig verstanden. Die Alternative — im Browser eine Zeichenkette
  zusammenzusetzen — müsste an jeder Anzeigestelle wiederholt werden und ginge früher oder später
  irgendwo schief. Die Speicherung in der Datenbank bleibt unverändert, es ist keine Migration
  nötig.
  Date/Author: 2026-08-11, Julian

- Decision: Filter und Anlegeformular der Planungsseite bekommen getrennte Monatsauswahlen. Der
  Filter erhält zusätzlich den Eintrag „Alle Monate" (leerer Wert), das Anlegeformular behält eine
  Pflichtauswahl mit dem laufenden Monat als Vorgabe.
  Rationale: Nur so ist „Alle Monate" eindeutig. Der zusätzliche Auswahlkasten im Anlegeformular
  macht außerdem sichtbar, wofür der Eintrag gespeichert wird — bisher musste man wissen, dass der
  Filter oben das Ziel bestimmt.
  Date/Author: 2026-08-11, Julian

- Decision: Nach dem Speichern eines Eintrags wird die Liste neu vom Server geladen, statt den
  neuen Eintrag lokal anzuhängen.
  Rationale: Beim Anhängen erschien ein Eintrag auch dann in der Liste, wenn er wegen des Filters
  gar nicht dorthin gehörte (etwa Eintrag für September, während Juli gefiltert ist). Ein
  Neuladen ist eine zusätzliche Anfrage, dafür ist die Anzeige immer stimmig.
  Date/Author: 2026-08-11, Julian

- Decision: Die Uhrzeit-Eingabe bleibt ein `<input type="time">`; die im Testprotokoll bemängelte
  AM/PM-Darstellung wird **nicht** geändert.
  Rationale: Wie ein solches Feld dargestellt wird, entscheidet der Browser anhand der
  Spracheinstellung des Betriebssystems, nicht die Anwendung. Der gespeicherte und in der Liste
  angezeigte Wert ist ohnehin 24-stündig („14:30"). Eine Eigenbau-Uhrzeitauswahl wäre viel Aufwand
  für einen rein kosmetischen Effekt auf englisch eingestellten Rechnern. Dieser Punkt wird im
  Testbericht als bewusst akzeptiert vermerkt.
  Date/Author: 2026-08-11, Julian

## Outcomes & Retrospective

Umgesetzt wie geplant, auf dem Branch `fix/P2-Zeitzonen-Filter-und-Darstellung`, gestapelt auf
`fix/P1-Eingabevalidierung` (der wiederum auf `fix/P0-Session-Persistenz-und-Navbar` aufsetzt) —
so bleibt die von der P1-Fehleranzeige benutzte Feldstruktur in `planning.ts` erhalten, während P2
die Filter-/Speicherlogik daneben umbaut.

Backend: `python -m pytest -q` → 52 passed (48 aus P1 + 4 neue), `ruff check .` unverändert nur
der vorbestehende Fehler in `config.py`. Funktional bestätigt gegen das laufende Backend: ein neu
gestarteter Timer liefert `started_at` mit angehängtem `Z` (z. B.
`2026-08-11T22:16:34.908220Z`), ebenso `created_at` eines Lernziels und `active_session.started_at`
im Dashboard. Eine Quelltextsuche bestätigt, dass außer `target_date.isoformat()` kein direkter
`.isoformat()`-Aufruf mehr in `app/models/*.py` oder `app/routes/*.py` vorkommt. Der Filter
`GET /api/plans?goal_id=<id>` (ohne `year`/`month`) lieferte wie erwartet eine Liste ohne Fehler.

Frontend: `npx ng test --watch=false` → 32 passed, 0 failed (29 aus P1 + 3 neue aus
`plan.service.spec.ts`). `npx ng lint` zeigt weiterhin genau 17 vorbestehende Fehler, keine neuen
— die zusätzliche `<label>` für die neue Monatsauswahl im Anlegeformular folgt demselben bereits
vorhandenen Muster fehlender `for`/`id`-Zuordnung wie die übrigen Formularfelder.

Ein visueller Browser-Durchgang (Timer-Anzeige bei 00:00:00 statt 02:00:00, alle vier
Filterkombinationen, Dashboard-Knopf, Zeilenumbruch bei langem Titel) konnte mangels
Chrome-Werkzeugs in dieser Sitzung nicht durchgeführt werden. Empfehlung: Team sollte das vor der
Abgabe kurz nachholen, gemeinsam mit dem in P1 offen gelassenen Durchgang.

Der Plan war ohne Abweichungen vom vorgegebenen Code umsetzbar; einzige Anpassung war, die aus P1
bereits vorhandene Fehleranzeige (`fieldErrors`, `clearFieldError`) in `planning.ts` bei den
Logikänderungen unangetastet zu lassen, da P1 auf demselben Branch bereits vorausgegangen war.

## Context and Orientation

Das Repository enthält den „Lernzeit-Manager", eine Web-Anwendung aus einem Python-Backend unter
`backend/` (Rahmenwerk Flask) und einem TypeScript-Frontend unter `frontend/` (Rahmenwerk Angular
22). Beide liegen im selben Repository.

Für diesen Plan sind folgende Dateien wichtig. Im Backend beschreibt
`backend/app/models/study_session.py` die Tabelle der Lernsitzungen; die Methode `to_dict` legt
fest, wie ein Datensatz als JSON an den Browser geht. `backend/app/routes/sessions.py` bedient
Start, Pause, Fortsetzen und Stopp des Timers. `backend/app/routes/dashboard.py` liefert die Daten
der Übersichtsseite. Im Frontend zeigt `frontend/src/app/features/timer/timer.ts` den Timer,
`frontend/src/app/features/planning/planning.ts` die Planungsseite und
`frontend/src/app/features/dashboard/dashboard.ts` die Übersicht. Das gemeinsame Aussehen steht in
`frontend/src/styles.scss`.

Begriffe, die unten gebraucht werden:

**UTC** ist die koordinierte Weltzeit, eine Zeit ohne Sommerzeit und ohne Ortsbezug. Deutschland
liegt im Sommer zwei, im Winter eine Stunde davor. Server speichern Zeitpunkte üblicherweise in
UTC, damit sie unabhängig vom Standort vergleichbar bleiben.

**ISO-8601** ist das genormte Textformat für Zeitpunkte, zum Beispiel `2026-08-11T21:08:09`. Hängt
man ein `Z` an, bedeutet das ausdrücklich „dieser Zeitpunkt ist in UTC angegeben". Fehlt jede
Kennzeichnung, deutet JavaScript den Wert als Ortszeit des Browsers — genau daraus entsteht der
Zwei-Stunden-Fehler.

Ein **Signal** ist in Angular ein Wert, der weiß, wer ihn liest; ändert man ihn mit `.set(...)`,
zeichnet Angular die Anzeige neu. Gelesen wird er durch Aufruf: `meinSignal()`.

**Hinweis zur Reihenfolge:** Dieser Plan ist unabhängig von den Plänen
`docs/ExecPlans/active/2026-08-11_P0-Session-Persistenz-und-Navbar.md` und
`docs/ExecPlans/active/2026-08-11_P1-Eingabevalidierung.md` ausführbar. Ist P0 noch offen, wirst du
beim manuellen Test nach jedem Reload abgemeldet — melde dich dann erneut an. Ist P1 noch offen,
nimmt die Planungsseite weiterhin unsinnige Zahlen an; das ist hier nicht Gegenstand. Die unten
genannten Gesamtzahlen der Tests gehen vom Stand **ohne** P0 und P1 aus; sind diese Pläne bereits
umgesetzt, addieren sich deren Tests hinzu.

## Plan of Work

Im Backend entsteht eine kleine Hilfsfunktion, die einen gespeicherten Zeitpunkt als
UTC-gekennzeichnete Zeichenkette ausgibt. Sie wird überall dort eingesetzt, wo heute
`.isoformat()` steht: in der Lernsitzung, im Lernziel und in der Übersichtsroute. Ein neuer Test
hält fest, dass jeder ausgelieferte Zeitpunkt auf `Z` endet.

Im Frontend braucht der Timer danach **keine** Änderung: Er berechnet die verstrichene Zeit mit
`new Date(startedAt).getTime()`, und diese Zeile liefert mit dem `Z` automatisch das richtige
Ergebnis.

Anschließend wird die Planungsseite umgebaut: Der Filter bekommt „Alle Monate", das Anlegeformular
bekommt eine eigene Monatsauswahl, und die Liste wird nach dem Speichern neu geladen. Damit auch
bei „Alle Monate" erkennbar bleibt, wofür ein Eintrag gilt, zeigt jede Karte künftig Tag, Monat und
Jahr an.

Zum Schluss zwei kleine Verbesserungen an der Oberfläche: ein Knopf auf dem Dashboard und eine
CSS-Regel, die lange Titel umbrechen lässt.

## Concrete Steps

### Schritt 1: Fehler reproduzieren

Starte alle drei Teile der Anwendung. Erstes Fenster im Repository-Wurzelverzeichnis
`D:\Programmieren\Projects\Projekt-Lernzeit_Manager` (Docker Desktop muss laufen):

    docker compose up -d

Zweites Fenster:

    cd backend
    .\.venv\Scripts\Activate.ps1
    flask db upgrade
    flask run --debug

Drittes Fenster:

    cd frontend
    ng serve

Melde dich unter http://localhost:4200 an (oder lege ein Testkonto an), lege unter „Lernziele" ein
Ziel an, gehe auf „Timer", wähle das Ziel und drücke „▶ Start".

Erwartete Beobachtung **vor** der Änderung: Die große Zeitanzeige springt sofort auf etwa
`02:00:01` und zählt von dort weiter. Genau das ist der Fehler. In der Winterzeit wäre es
`01:00:01`.

### Schritt 2: `backend/app/time_utils.py` anlegen

Lege die neue Datei mit **exakt** diesem Inhalt an:

    """Einheitliche Ausgabe von Zeitpunkten an die Schnittstelle.

    Die Datenbank speichert Zeitpunkte in koordinierter Weltzeit (UTC), aber ohne
    Zeitzonen-Kennzeichnung. Gibt man sie unveraendert aus, deutet JavaScript im
    Browser sie als Ortszeit und rechnet um zwei Stunden daneben (Sommerzeit in
    Deutschland). Das angehaengte 'Z' kennzeichnet den Wert ausdruecklich als UTC.
    """

    from datetime import datetime, timezone


    def iso_utc(value: datetime | None) -> str | None:
        """Gibt einen Zeitpunkt als '2026-08-11T21:08:09+00:00' in der Kurzform mit 'Z' aus.

        Zeitpunkte ohne Zeitzonen-Angabe werden als UTC verstanden, weil die
        Anwendung ausschliesslich UTC speichert (siehe _now in
        backend/app/routes/sessions.py). Bereits gekennzeichnete Zeitpunkte werden
        nach UTC umgerechnet.
        """
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")

### Schritt 3: Modelle umstellen

Öffne `backend/app/models/study_session.py`. Die Methode `to_dict` sieht derzeit so aus:

        def to_dict(self) -> dict:
            return {
                "id": self.id,
                "user_id": self.user_id,
                "goal_id": self.goal_id,
                "started_at": self.started_at.isoformat(),
                "paused_at": self.paused_at.isoformat() if self.paused_at else None,
                "total_paused_seconds": self.total_paused_seconds,
                "ended_at": self.ended_at.isoformat() if self.ended_at else None,
                "duration_seconds": self.duration_seconds,
                "status": self.status,
                "note": self.note,
            }

Ersetze die drei Zeitzeilen, sodass sie so lauten:

                "started_at": iso_utc(self.started_at),
                "paused_at": iso_utc(self.paused_at),
                "ended_at": iso_utc(self.ended_at),

Ergänze am Dateianfang, unter der vorhandenen Zeile `from ..extensions import db`:

    from ..time_utils import iso_utc

Öffne `backend/app/models/goal.py` und ersetze in `to_dict` die Zeile

                "created_at": self.created_at.isoformat(),

durch

                "created_at": iso_utc(self.created_at),

sowie ergänze denselben Import. Der Import `from datetime import datetime, timezone` bleibt dort
stehen, weil er für den Standardwert der Spalte `created_at` gebraucht wird.

### Schritt 4: Übersichtsroute umstellen

Öffne `backend/app/routes/dashboard.py`. Im unteren Teil der Funktion `dashboard` steht:

            active_data = {
                "id": active.id,
                "goal_id": active.goal_id,
                "goal_title": active.goal.title,
                "started_at": active.started_at.isoformat(),
                "status": active.status,
            }

Ersetze die Zeitzeile durch:

                "started_at": iso_utc(active.started_at),

und ergänze den Import unter den vorhandenen Importen:

    from ..time_utils import iso_utc

### Schritt 5: Backend-Test anlegen und ausführen

Lege die neue Datei `backend/tests/test_time_format.py` mit **exakt** diesem Inhalt an:

    """Stellt sicher, dass Zeitpunkte als UTC gekennzeichnet ausgeliefert werden (Plan P2).

    Ohne die Kennzeichnung deutet der Browser die Werte als Ortszeit; der Timer
    zeigte dadurch beim Start sofort zwei Stunden an.
    """

    from datetime import datetime, timezone

    import pytest

    REGISTER_URL = "/api/auth/register"
    GOALS_URL = "/api/goals"
    SESSIONS_URL = "/api/sessions"


    @pytest.fixture
    def auth_header(client):
        resp = client.post(
            REGISTER_URL, json={"email": "zeit@example.de", "name": "Z", "password": "pass123"}
        )
        return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


    @pytest.fixture
    def goal_id(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "Zeitziel", "module_name": "M", "target_date": "2027-06-01"},
            headers=auth_header,
        )
        return resp.get_json()["id"]


    def test_started_at_is_marked_as_utc(client, auth_header, goal_id):
        resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        assert resp.status_code == 201
        started_at = resp.get_json()["started_at"]
        assert started_at.endswith("Z"), f"Zeitstempel ohne UTC-Kennzeichnung: {started_at}"


    def test_started_at_matches_current_utc_time(client, auth_header, goal_id):
        """Der ausgelieferte Startzeitpunkt darf hoechstens Sekunden von 'jetzt in UTC' abweichen."""
        resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        started_at = resp.get_json()["started_at"]
        parsed = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        abweichung = abs((datetime.now(timezone.utc) - parsed).total_seconds())
        assert abweichung < 60, f"Abweichung von {abweichung} Sekunden deutet auf Zeitzonenfehler hin"


    def test_goal_created_at_is_marked_as_utc(client, auth_header, goal_id):
        resp = client.get(f"{GOALS_URL}/{goal_id}", headers=auth_header)
        assert resp.get_json()["created_at"].endswith("Z")


    def test_dashboard_active_session_is_marked_as_utc(client, auth_header, goal_id):
        client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        resp = client.get("/api/dashboard", headers=auth_header)
        assert resp.status_code == 200
        assert resp.get_json()["active_session"]["started_at"].endswith("Z")

Führe im Arbeitsverzeichnis `backend` mit aktivierter venv aus:

    python -m pytest -q

Erwartet: `17 passed` (13 bisherige plus 4 neue). Prüfe auch:

    ruff check .

Erwartet: `All checks passed!`

Zur Gegenprobe kannst du in `backend/app/time_utils.py` die letzte Zeile kurzzeitig auf
`return value.isoformat()` ändern; dann müssen die Tests `..._is_marked_as_utc` fehlschlagen.
Mache die Änderung danach unbedingt rückgängig.

### Schritt 6: Planungsseite umbauen

Öffne `frontend/src/app/features/planning/planning.ts`.

**6a — Filter um „Alle Monate" erweitern.** Ersetze in der Anzeigevorlage den Auswahlkasten des
Filters. Aus

              <div class="form-group">
                <label>Monat</label>
                <select [(ngModel)]="selectedMonth" name="month" (change)="loadSlots()">
                  @for (m of availableMonths(); track m.key) {
                    <option [value]="m.key">{{ m.label }}</option>
                  }
                </select>
              </div>

wird

              <div class="form-group">
                <label>Monat</label>
                <select [(ngModel)]="selectedMonth" name="month" (change)="loadSlots()">
                  <option [value]="''">Alle Monate</option>
                  @for (m of availableMonths(); track m.key) {
                    <option [value]="m.key">{{ m.label }}</option>
                  }
                </select>
              </div>

**6b — Eigene Monatsauswahl im Anlegeformular.** Ergänze im Bereich „Lernzeit einplanen" in der
ersten `form-row`, direkt hinter der Feldgruppe „Lernziel *", diese neue Feldgruppe:

                <div class="form-group">
                  <label>Monat *</label>
                  <select [(ngModel)]="newSlotMonth" name="slot_month" required>
                    @for (m of availableMonths(); track m.key) {
                      <option [value]="m.key">{{ m.label }}</option>
                    }
                  </select>
                </div>

**6c — Datum auf der Karte anzeigen.** Ersetze in der Liste „Geplante Lernzeiten" die Zeile

                  @if (slot.day) { <span>📆 Am {{ slot.day }}.</span> }

durch

                  <span>📆 {{ slotDate(slot) }}</span>

**6d — Leermeldung anpassen.** Ersetze

                <p class="empty">Für diesen Monat noch nichts geplant.</p>

durch

                <p class="empty">Für diese Auswahl ist noch nichts geplant.</p>

**6e — Logik anpassen.** Ersetze im Klassenrumpf den Abschnitt von `selectedGoalId = 0;` bis zum
Ende des Konstruktors, der derzeit so aussieht

      selectedGoalId = 0;
      selectedMonth: string;

      newSlot = {
        goal_id: 0,
        day: null as number | null,
        planned_time: '',
        duration_minutes: 60,
        note: '',
      };

      constructor() {
        const now = new Date();
        this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }

durch

      selectedGoalId = 0;
      /** Leerer Text bedeutet: Filter "Alle Monate". */
      selectedMonth = '';
      /** Monat, in den ein neuer Eintrag gespeichert wird - unabhaengig vom Filter. */
      newSlotMonth: string;

      newSlot = {
        goal_id: 0,
        day: null as number | null,
        planned_time: '',
        duration_minutes: 60,
        note: '',
      };

      constructor() {
        const now = new Date();
        this.newSlotMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        this.selectedMonth = this.newSlotMonth;
      }

Die Vorbelegung des Filters mit dem laufenden Monat bleibt damit erhalten; neu ist nur, dass man
sie auf „Alle Monate" stellen **kann**.

Ersetze `loadSlots` durch:

      async loadSlots(): Promise<void> {
        this.loading.set(true);
        try {
          const filters: { goal_id?: number; year?: number; month?: number } = {};
          if (this.selectedGoalId) {
            filters.goal_id = Number(this.selectedGoalId);
          }
          if (this.selectedMonth) {
            const [year, month] = this.selectedMonth.split('-').map(Number);
            filters.year = year;
            filters.month = month;
          }
          this.slots.set(await this.planService.list(filters));
        } finally {
          this.loading.set(false);
        }
      }

Ersetze in `createSlot` den Block innerhalb von `try` durch:

          const [year, month] = this.newSlotMonth.split('-').map(Number);
          await this.planService.create({
            goal_id: Number(this.newSlot.goal_id),
            year,
            month,
            day: this.newSlot.day || undefined,
            planned_time: this.newSlot.planned_time || undefined,
            duration_minutes: this.newSlot.duration_minutes,
            note: this.newSlot.note || undefined,
          });
          this.newSlot = { goal_id: 0, day: null, planned_time: '', duration_minutes: 60, note: '' };
          await this.loadSlots();

Beachte: Die Zuweisung `this.slots.update(ss => [...ss, slot])` entfällt ersatzlos, und die
Variable `slot` wird nicht mehr gebraucht — sonst meldet `npx ng lint` eine unbenutzte Variable.
`Number(...)` um `goal_id` steht dort, weil ein HTML-Auswahlkasten seinen Wert immer als Text
liefert; ohne die Umwandlung schickt das Frontend `"3"` statt `3`.

Ergänze schließlich am Ende der Klasse, hinter `goalName`, diese Methode:

      /** Beschriftung fuer eine geplante Lernzeit, z. B. "15. Aug 2026" oder "Aug 2026". */
      slotDate(slot: PlanSlot): string {
        const monat = MONTH_NAMES[slot.month - 1] ?? String(slot.month);
        return slot.day ? `${slot.day}. ${monat} ${slot.year}` : `${monat} ${slot.year}`;
      }

Die Konstante `MONTH_NAMES` steht bereits am Anfang derselben Datei, ebenso ist der Typ `PlanSlot`
bereits importiert.

### Schritt 7: Test für den Filter

Lege die neue Datei `frontend/src/app/core/services/plan.service.spec.ts` mit **exakt** diesem
Inhalt an:

    import { provideHttpClient } from '@angular/common/http';
    import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
    import { TestBed } from '@angular/core/testing';
    import { PlanService } from './plan.service';

    describe('PlanService.list', () => {
      let service: PlanService;
      let httpMock: HttpTestingController;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(PlanService);
        httpMock = TestBed.inject(HttpTestingController);
      });

      afterEach(() => {
        httpMock.verify();
      });

      it('filtert nur nach Lernziel, wenn kein Monat gewaehlt ist', () => {
        void service.list({ goal_id: 7 });
        const req = httpMock.expectOne((r) => r.url === '/api/plans');
        expect(req.request.params.get('goal_id')).toBe('7');
        expect(req.request.params.get('month')).toBeNull();
        expect(req.request.params.get('year')).toBeNull();
        req.flush([]);
      });

      it('filtert nur nach Monat, wenn kein Lernziel gewaehlt ist', () => {
        void service.list({ year: 2026, month: 8 });
        const req = httpMock.expectOne((r) => r.url === '/api/plans');
        expect(req.request.params.get('goal_id')).toBeNull();
        expect(req.request.params.get('year')).toBe('2026');
        expect(req.request.params.get('month')).toBe('8');
        req.flush([]);
      });

      it('fragt ohne Filter alle Planungen ab', () => {
        void service.list({});
        const req = httpMock.expectOne((r) => r.url === '/api/plans');
        expect(req.request.params.keys().length).toBe(0);
        req.flush([]);
      });
    });

### Schritt 8: Knopf auf dem Dashboard

Öffne `frontend/src/app/features/dashboard/dashboard.ts`. Der Abschnitt der Lernziele beginnt
derzeit so:

            <div class="goals-section">
              <h3>Lernziele</h3>

Ersetze diese beiden Zeilen durch:

            <div class="goals-section">
              <div class="section-header">
                <h3>Lernziele</h3>
                <a routerLink="/goals" class="btn btn-sm btn-primary">+ Neues Lernziel erstellen</a>
              </div>

Die Anweisung `RouterLink` ist in dieser Komponente bereits importiert (siehe `imports: [RouterLink]`
im Komponentenkopf), es ist also keine weitere Änderung nötig.

Ergänze in `frontend/src/styles.scss` im Abschnitt `/* ===== Dashboard ===== */` diese Regel:

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

### Schritt 9: Umbruch der Liste „Zuletzt gelernt"

Öffne `frontend/src/styles.scss` und suche die Regel `.session-row`. Sie lautet derzeit:

    .session-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }

Ersetze sie durch:

    .session-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }
    .session-row > span:first-child {
      flex: 1 1 12rem;
      min-width: 0;
      overflow-wrap: anywhere;
    }

Damit bricht ein langer Zieltitel um, statt Dauer und Datum aus der Zeile zu drängen. Die Einträge
stehen weiterhin untereinander, weil jede Sitzung ihre eigene `.session-row` hat.

### Schritt 10: Alles prüfen

Backend (Arbeitsverzeichnis `backend`, venv aktiv):

    python -m pytest -q
    ruff check .

Erwartet: `17 passed` und `All checks passed!`

Frontend (Arbeitsverzeichnis `frontend`):

    npx ng test --watch=false
    npx ng lint

Erwartet: drei zusätzliche Tests aus `plan.service.spec.ts` bestehen; `All files pass linting.`
(Zur Erinnerung: Ohne den Plan P0 bleibt `app.spec.ts` aus einem anderen Grund rot — das gehört
nicht zu diesem Plan.)

Manueller Durchgang im Browser, mit laufender Anwendung wie in Schritt 1:

1. Timer starten. Erwartet: Die Anzeige beginnt bei `00:00:00` und zählt sekundenweise hoch. Der
   Sprung auf zwei Stunden tritt nicht mehr auf.
2. Timer pausieren, kurz warten, fortsetzen. Erwartet: Die Anzeige läuft dort weiter, wo sie
   angehalten wurde, ohne die Pausenzeit mitzuzählen.
3. Timer stoppen. Erwartet: Der Eintrag erscheint unter „Zuletzt gelernt" mit einer Dauer, die zur
   tatsächlich gelaufenen Zeit passt, und mit dem heutigen Datum.
4. Auf `/planning` zwei Einträge anlegen: einen für den laufenden Monat, einen für den Folgemonat
   (über die neue Auswahl „Monat *" im Anlegeformular).
5. Filter auf „Alle Monate" und ein bestimmtes Lernziel stellen. Erwartet: **beide** Einträge sind
   sichtbar, jeweils mit Monat und Jahr auf der Karte.
6. Filter auf „Alle Ziele" und einen bestimmten Monat stellen. Erwartet: nur die Einträge dieses
   Monats.
7. Filter auf „Alle Ziele" und „Alle Monate" stellen. Erwartet: alle Einträge.
8. Auf dem Dashboard den Knopf „+ Neues Lernziel erstellen" anklicken. Erwartet: Wechsel auf die
   Lernziel-Seite.
9. Ein Lernziel mit sehr langem Titel anlegen (etwa 80 Zeichen), damit eine Sitzung aufzeichnen und
   das Dashboard beziehungsweise „Zuletzt gelernt" ansehen. Erwartet: Der Titel bricht um, Dauer
   und Datum bleiben lesbar.

### Schritt 11: README aktualisieren

Ergänze in `README.md` im Abschnitt „Datenbank & pgAdmin 4" nach dem Migrations-Absatz einen kurzen
Absatz mit folgender Aussage in eigenen Worten: Alle Zeitpunkte werden in der Datenbank in
koordinierter Weltzeit (UTC) gespeichert und von der API mit angehängtem `Z` ausgeliefert (Beispiel
`2026-08-11T21:08:09Z`); die Umrechnung in die Ortszeit übernimmt der Browser. Wer eine neue
Zeitspalte ausliefert, benutzt dafür `iso_utc` aus `backend/app/time_utils.py` und **nicht**
`datetime.isoformat()`.

### Schritt 12: Commit und Abschluss

Arbeite auf dem bereits ausgecheckten Branch; lege **keinen** eigenen Branch und **kein**
zusätzliches Arbeitsverzeichnis an.

    git add backend/app/time_utils.py backend/app/models backend/app/routes/dashboard.py backend/tests/test_time_format.py frontend/src/app/features frontend/src/app/core/services/plan.service.spec.ts frontend/src/styles.scss README.md
    git commit -m "fix: Zeitstempel als UTC kennzeichnen, Planungsfilter entkoppelt, Dashboard-Knopf"

Fülle danach `Outcomes & Retrospective` aus, hake `Progress` mit Zeitstempeln ab und verschiebe
diese Datei nach `docs/ExecPlans/completed/`.

## Validation and Acceptance

Im Arbeitsverzeichnis `backend` meldet `python -m pytest -q` 17 bestandene Tests, darunter
`test_started_at_is_marked_as_utc` und `test_started_at_matches_current_utc_time`. Der zweite Test
schlägt vor der Änderung fehl, weil die Abweichung dort rund 7200 Sekunden beträgt.

Im Arbeitsverzeichnis `frontend` bestehen die drei Tests aus `plan.service.spec.ts`; `npx ng lint`
meldet `All files pass linting.`

Im Browser zeigt ein frisch gestarteter Timer `00:00:0x` statt `02:00:0x`. Auf der Planungsseite
liefern alle vier Filterkombinationen das erwartete Ergebnis: nur Lernziel (alle Monate dieses
Ziels), nur Monat (alle Ziele in diesem Monat), beides (Schnittmenge), keines (alle Einträge). Auf
dem Dashboard führt „+ Neues Lernziel erstellen" auf `/goals`, und ein 80 Zeichen langer Zieltitel
sprengt die Zeile unter „Zuletzt gelernt" nicht mehr.

## Idempotence and Recovery

Alle Schritte sind wiederholbar. Es gibt **keine** Datenbank-Migration; die gespeicherten Daten
bleiben unverändert, es ändert sich nur ihre Darstellung nach außen. Bereits aufgezeichnete
Lernsitzungen behalten ihre korrekten Dauern.

Geht etwas schief, stellt `git checkout -- backend/app frontend/src` die geänderten Dateien wieder
her; neu angelegte Dateien (`time_utils.py`, `test_time_format.py`, `plan.service.spec.ts`) müssen
von Hand gelöscht werden.

Zeigt der Timer nach der Änderung eine **negative** oder stark abweichende Zeit, prüfe zuerst die
Systemuhr des Rechners: Server und Browser laufen hier auf demselben Gerät, weichen die Uhren
auseinander (etwa in einer virtuellen Maschine), entsteht ein ähnlicher Effekt. Öffne im Browser
F12 → „Network" → Anfrage `sessions/start` → „Response" und prüfe, ob der Wert `started_at` auf `Z`
endet.

## Artifacts and Notes

Ausgangslage, gemessen am 11.08.2026 um 23:08 Ortszeit (Sommerzeit, UTC+2):

    started_at wie an das Frontend geliefert  ->  2026-08-11T21:08:09.151057
    (kein 'Z'/Offset => JS interpretiert den Wert als LOKALZEIT => Anzeige startet bei 02:00)

Sollzustand nach der Änderung, sichtbar in der Antwort von `POST /api/sessions/start`:

    "started_at": "2026-08-11T21:08:09.151057Z"

Nachweis, dass die API bereits heute nach Lernziel allein filtern kann — die Einschränkung liegt
also allein im Frontend:

    GET /api/plans?goal_id=5   ->  HTTP 200  [{'day': None, 'duration_minutes': 60, ...}]

## Interfaces and Dependencies

Es werden keine neuen Bibliotheken installiert.

In `backend/app/time_utils.py` muss existieren:

    def iso_utc(value: datetime | None) -> str | None

Nach diesem Plan enthält keine der Dateien `backend/app/models/study_session.py`,
`backend/app/models/goal.py` und `backend/app/routes/dashboard.py` noch einen direkten Aufruf von
`.isoformat()` auf einem `datetime`. Prüfen lässt sich das im Arbeitsverzeichnis `backend` mit:

    Select-String -Path app\models\*.py, app\routes\*.py -Pattern "isoformat"

Erwartet wird genau ein Treffer, nämlich `target_date.isoformat()` in
`backend/app/models/goal.py` — das ist ein reines Datum ohne Uhrzeit und damit ohne Zeitzonenbezug;
es bleibt bewusst unverändert.

In `frontend/src/app/features/planning/planning.ts` müssen am Ende existieren:

    selectedMonth: string;      // '' bedeutet "Alle Monate"
    newSlotMonth: string;       // Monat fuer neue Eintraege, Vorgabe: laufender Monat
    slotDate(slot: PlanSlot): string;

## Änderungsnotizen

- 2026-08-11: Plan erstellt. Grundlage sind die Befunde „Timer startet bei 2:00 Stunden" und
  „Filter nur mit Lernziel nicht möglich" aus `docs/testing-protokoll-lernzeit-manager.md`, deren
  Ursachen im Quelltext nachgewiesen wurden.

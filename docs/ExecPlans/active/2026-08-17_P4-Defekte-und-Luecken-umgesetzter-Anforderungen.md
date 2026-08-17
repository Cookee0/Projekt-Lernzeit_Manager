# P4: Defekte beheben und Lücken in bereits umgesetzten Anforderungen schließen

Dieser ExecPlan ist ein lebendes Dokument. Die Abschnitte `Progress`, `Surprises & Discoveries`,
`Decision Log` und `Outcomes & Retrospective` sind während der Arbeit fortlaufend zu pflegen.

Die Spezifikation für ExecPlans liegt in diesem Repository unter `docs/PLANS.md`. Dieses Dokument
ist in Übereinstimmung mit `docs/PLANS.md` zu führen. Wer diesen Plan umsetzt, **legt keinen
eigenen Branch und kein Worktree an**, sondern arbeitet auf dem Branch, der bereits ausgecheckt
ist — so verlangt es `docs/PLANS.md`, weil sonst fertige Arbeit in einem versteckten Verzeichnis
landet, das niemand findet.

## Purpose / Big Picture

Der Lernzeit-Manager gilt laut `README.md` als funktional vollständig für den Meilenstein MS4.
Eine Prüfung des Codes gegen `docs/01_Funktionale_Anforderungen.md` hat aber gezeigt, dass mehrere
Anforderungen, die als erledigt gelten, in der Oberfläche gar nicht erreichbar sind oder im
Fehlerfall die Anwendung abstürzen lassen.

Nach diesem Plan kann eine Studentin, die die Anwendung im Browser benutzt, drei Dinge, die vorher
nicht gingen: Sie kann ein bereits angelegtes Lernziel **bearbeiten** — Titel, Modul, ECTS,
Zieldatum und Priorität ändern, nicht nur den Status umschalten (FR-1.3, FR-1.4). Sie kann zu
einem erreichten Ziel eine **Note und eine Notiz** hinterlegen und beim Stoppen des Timers eine
Notiz zur Lernsession mitgeben (FR-5.2). Und sie bekommt bei einer fehlerhaften Anfrage eine
verständliche deutsche Fehlermeldung statt eines Serverfehlers.

Sichtbar wird das so: Nach `flask run --debug` und `ng serve` erscheint auf
http://localhost:4200/goals an jeder Zielkarte ein Knopf „Bearbeiten". Er öffnet ein Formular, in
dem sich alle Felder ändern lassen; nach dem Speichern und einem Neuladen der Seite mit `F5` steht
der neue Wert da. Ein Aufruf von http://localhost:5000/api/plans?year=abc liefert HTTP 400 mit
einer deutschen Meldung statt HTTP 500.

Unsichtbar, aber genauso wichtig: Die Pausenrechnung des Timers (FR-4.3) wird zum ersten Mal durch
automatisierte Tests abgesichert. Bisher existiert im gesamten Backend **kein einziger Test**, der
`/api/sessions/<id>/pause`, `/resume` oder `/stop` aufruft — obwohl
`docs/MS4_Testabschlussbericht.md` diese Anforderung als geprüft ausweist.

## Progress

- [x] (2026-08-17 00:00Z) M1 — Ungültige Abfrageparameter liefern HTTP 400 statt HTTP 500
- [x] (2026-08-17 00:00Z) M2 — Ein Lernziel mit verstrichenem Zieldatum lässt sich bearbeiten
- [x] (2026-08-17 00:00Z) M3 — Migration 0002: Spalten `priority`, `grade`, `result_note` an `goals`
- [ ] M4 — Backend akzeptiert und liefert Priorität, Note und Ergebnis-Notiz
- [ ] M5 — Bearbeiten-Formular für Lernziele in der Oberfläche (FR-1.3, FR-1.4, FR-5.2)
- [ ] M6 — Notiz beim Stoppen einer Lernsession (FR-5.2, zweiter Teil)
- [ ] M7 — Stillgelegten Ordner `frontend/src/app/goals/` entfernen
- [ ] M8 — Backend-Tests für `/api/sessions` und `/api/plans`
- [ ] M9 — Ehrlicher Löschhinweis und Aktualisierung der Dokumentation

Zeitstempel im Format `(JJJJ-MM-TT HH:MMZ)` beim Abhaken voranstellen, damit sich das
Arbeitstempo später im Projektbericht belegen lässt. Beispiel für einen abgehakten Eintrag:

    - [x] (2026-08-17 14:20Z) M1 — Ungültige Abfrageparameter liefern HTTP 400 statt HTTP 500

Wird ein Meilenstein nur teilweise fertig, den Eintrag aufteilen statt ihn halb abzuhaken, etwa
„M8 (erledigt: test_sessions.py; offen: test_plans.py)".

## Surprises & Discoveries

Die folgenden Beobachtungen stammen aus der Analyse, die zu diesem Plan geführt hat. Sie sind der
Ausgangsbefund; alles, was während der Umsetzung dazukommt, wird hier ergänzt.

- Beobachtung: `frontend/src/app/goals/` ist seit dem MS4-Umbau von keiner Route mehr erreichbar,
  enthält aber die einzige Umsetzung von FR-1.4 (Priorität). Die drei Spec-Dateien darin laufen
  weiter in `ng test` und täuschen dort Testabdeckung für Code vor, den niemand ausliefert.
  Evidenz: `frontend/src/app/app.routes.ts` lädt für `/goals` ausschließlich
  `./features/goals/goals`. Eine Suche nach `app/goals` in `frontend/src` findet außerhalb dieses
  Ordners keinen Verweis.

- Beobachtung: Die Spalte `priority` existiert weder im Modell noch in der Migration, obwohl der
  Git-Verlauf drei Commits zu FR-1.4 enthält. Die Arbeit ging beim MS4-Umbau verloren.
  Evidenz: `backend/app/models/goal.py` und
  `backend/migrations/versions/0001_ms4_initial_schema.py` kennen nur
  `id, user_id, title, target_date, module_name, ects, status, created_at`.

- Beobachtung: Für die Pausenrechnung des Timers existiert kein Backend-Test.
  Evidenz: Von den sieben Dateien in `backend/tests/` ruft nur `test_time_format.py` überhaupt
  `/api/sessions/start` auf, und zwar um das Zeitformat zu prüfen. `pause`, `resume` und `stop`
  kommen in keiner Testdatei vor.

- Beobachtung: Die im Plan vorgeschlagene Revision-ID `0002_goal_prioritaet_und_ergebnis` ist mit
  33 Zeichen einen zu lang für die Standardspalte `alembic_version.version_num`
  (`varchar(32)`); `flask db upgrade` brach mit `StringDataRightTruncation` ab (Transaktion rollte
  sauber zurück, keine Daten betroffen). Behoben durch Kürzung auf `0002_goal_prioritaet_ergebnis`
  (29 Zeichen), Datei entsprechend umbenannt.

- Beobachtung: Lokal belegt bereits ein anderes Projekt (`bachelorarbeit`) Port 5432 mit einem
  eigenen Postgres-Container. Die Migration wurde daher mit `POSTGRES_PORT=5433` (nur als
  Umgebungsvariable, nicht in `.env` persistiert) gegen den `lernzeit-db`-Container auf Port 5433
  gefahren.

- Beobachtung: Die Tests laufen gegen SQLite im Arbeitsspeicher, nicht gegen PostgreSQL, und
  erzeugen das Schema mit `db.create_all()` statt über die Migrationen.
  Evidenz: `backend/app/config.py` setzt in `TestingConfig`
  `SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"`; `backend/tests/conftest.py` ruft
  `_db.create_all()`. **Folge für diesen Plan: Ein grüner `pytest`-Lauf beweist nicht, dass die
  neue Migration funktioniert.** Die Migration muss zusätzlich von Hand gegen die
  PostgreSQL-Datenbank im Docker-Container geprüft werden (siehe M3).

## Decision Log

- Entscheidung: Der Umrechnungsfaktor bleibt bei 30 Stunden je ECTS-Punkt.
  Begründung: Der Code (`backend/app/routes/dashboard.py`, Konstante `MINUTES_PER_ECTS = 30 * 60`),
  die Anzeige in `frontend/src/app/features/goals/goals.ts` und `README.md` rechnen einheitlich mit
  30 Stunden; das entspricht der an der IU üblichen Rechnung „5 ECTS = 150 Stunden". Die
  Gestaltungsentwürfe in `docs/design-reference/html` rechnen abweichend mit 25 Stunden
  („1 ECTS ≈ 25 h", „6 ECTS × 25 h = 150 h"). Die Entwürfe gelten in diesem Punkt als überholt.
  Es wird deshalb **kein Code geändert**; die Abweichung wird im Abgleichdokument festgehalten,
  das ein eigener Plan liefert.
  Datum/Autor: 2026-08-17, Team.

- Entscheidung: FR-1.4 (Priorität) wird reaktiviert statt gelöscht.
  Begründung: Die Anforderung ist zwar nur „Could", die Arbeit ist aber bereits einmal geleistet
  worden und die Entwürfe zeigen die Priorität prominent in der Lernziel-Tabelle
  (`docs/design-reference/html/2b-lernziele.html`). Der stillgelegte Ordner wird nach der
  Reaktivierung entfernt, damit es nicht zwei Umsetzungen derselben Sache gibt.
  Datum/Autor: 2026-08-17, Team.

- Entscheidung: Die Note wird als Text gespeichert, nicht als Zahl.
  Begründung: Deutsche Noten werden mit Komma geschrieben („1,7"). Eine Fließkommazahl würde beim
  Weg durch JSON und Browser als „1.7" wieder herauskommen und müsste an mehreren Stellen
  zurückformatiert werden. Die Note wird nirgends gerechnet, nur angezeigt — ein kurzes Textfeld
  ist der einfachere und ehrlichere Typ.
  Datum/Autor: 2026-08-17, Team.

- Entscheidung: Das Löschen eines Lernziels löscht weiterhin dessen erfasste Lernzeit mit; der
  Bestätigungstext sagt das künftig aber deutlich.
  Begründung: FR-1.3 erlaubt das Löschen ausdrücklich, und die Datenbank hängt Sessions und
  Planungen über `cascade="all, delete-orphan"` am Ziel (`backend/app/models/goal.py`). Das
  Verhalten zu ändern (etwa auf ein Archivieren) wäre eine neue Anforderung. Was fehlt, ist nur
  die Ehrlichkeit im Dialog: Bisher erwähnt er die mitgelöschte Lernzeit nicht, obwohl sich die
  Zahlen im Dashboard danach rückwirkend ändern.
  Datum/Autor: 2026-08-17, Team.

## Outcomes & Retrospective

Noch nicht ausgefüllt — wird bei Abschluss des Plans geschrieben. Zu beantworten sind: Was ist
jetzt möglich, was vorher nicht ging? Welche Anforderungen aus `docs/01_Funktionale_Anforderungen.md`
gelten danach als vollständig umgesetzt? Was ist offen geblieben und warum? Welche Annahme dieses
Plans hat sich als falsch erwiesen?

## Context and Orientation

### Was diese Anwendung ist

Der Lernzeit-Manager ist eine Web-Anwendung für Studierende: Lernziele über ein halbes Jahr planen,
Lernzeit per Stoppuhr erfassen, Fortschritt auswerten. Sie besteht aus zwei Teilen in einem
gemeinsamen Repository (einem sogenannten Monorepo, also einem Repository, das mehrere Programme
enthält statt nur eines):

- `backend/` — ein Server in Python mit dem Web-Rahmenwerk **Flask**. Er stellt eine REST-Schnittstelle
  unter `/api/...` bereit und spricht über die Bibliothek **SQLAlchemy** mit einer
  PostgreSQL-Datenbank. „REST-Schnittstelle" heißt hier schlicht: Adressen, die JSON entgegennehmen
  und JSON zurückgeben.
- `frontend/` — eine Einzelseiten-Anwendung in TypeScript mit dem Rahmenwerk **Angular**
  (Version 22). „Einzelseiten-Anwendung" heißt: Der Browser lädt die Seite einmal, danach tauscht
  Angular nur noch Ausschnitte aus, ohne neu zu laden.

Die Datenbank läuft lokal in einem Docker-Container. Schema-Änderungen laufen über **Alembic**
(eingebunden als Flask-Migrate): Jede Änderung ist eine nummerierte Python-Datei unter
`backend/migrations/versions/`, die per `flask db upgrade` angewendet wird.

### Die Dateien, die dieser Plan anfasst

Im Backend:

- `backend/app/validation.py` — sammelt alle Prüfungen eingehender Daten. Jede Funktion prüft genau
  eine Sache, liefert bei Erfolg den bereinigten Wert und wirft sonst `ValidationError`. Diese
  Ausnahme wird in `backend/app/__init__.py` zentral in eine Antwort mit Status 400 und dem Rumpf
  `{"error": "..."}` übersetzt. Das ist der einzige Weg, auf dem eine Eingabeprüfung fehlschlagen
  soll.
- `backend/app/routes/goals.py` — die Adressen `/api/goals` (Liste, Anlegen) und
  `/api/goals/<id>` (Einzelabruf, Ändern per PUT, Löschen).
- `backend/app/routes/plans.py` — `/api/plans`, die geplanten Lernzeiten.
- `backend/app/routes/sessions.py` — `/api/sessions` und die Timer-Aktionen `start`, `pause`,
  `resume`, `stop`.
- `backend/app/models/goal.py` — die Tabelle `goals` als Python-Klasse.
- `backend/migrations/versions/` — enthält heute genau eine Datei, `0001_ms4_initial_schema.py`.
- `backend/tests/` — sieben Dateien, zusammen 37 Tests, ausgeführt mit `pytest`.

Im Frontend:

- `frontend/src/app/features/goals/goals.ts` — die Seite „Lernziele". Enthält Vorlage (das
  HTML-Gerüst im `template`-Feld) und Logik in einer Datei; das ist in diesem Projekt die
  übliche Bauform für die Feature-Seiten.
- `frontend/src/app/features/timer/timer.ts` — die Timer-Seite.
- `frontend/src/app/core/services/goal.service.ts` und `session.service.ts` — die dünnen
  Zugriffsschichten auf die Schnittstelle. Beide können bereits alles, was dieser Plan braucht;
  `GoalService.update(id, payload)` schickt ein PUT, `SessionService.stop(id, note?)` nimmt schon
  eine Notiz entgegen.
- `frontend/src/app/core/models/index.ts` — die TypeScript-Beschreibungen der Datenobjekte.
- `frontend/src/app/core/validation.ts` — die Prüfregeln der Formulare, absichtlich ein Spiegel von
  `backend/app/validation.py`. Der Server bleibt die verbindliche Instanz; diese Prüfung dient nur
  der schnellen Rückmeldung.
- `frontend/src/app/goals/` — **der stillgelegte Ordner**, der in M7 entfernt wird.

### Zwei Eigenheiten, die man nicht am Code sieht

Erstens: Angular hängt jedem Formular, das mit `ngModel` arbeitet, automatisch das Attribut
`novalidate` an. Deshalb wirken die HTML-Attribute `min`, `max` und `type="email"` in diesen
Formularen **nicht**, und jede Prüfung muss ausdrücklich in TypeScript stehen. Der Hinweis steht
auch im Kopfkommentar von `frontend/src/app/core/validation.ts`.

Zweitens: Die Anwendung speichert alle Zeitpunkte in koordinierter Weltzeit (UTC) ohne
Zeitzonenkennzeichnung und hängt beim Ausliefern ein `Z` an, damit der Browser sie nicht als
Ortszeit missversteht. Zuständig ist `iso_utc` aus `backend/app/time_utils.py`. Wer eine neue
Zeitspalte ausliefert, benutzt diese Funktion und nicht `datetime.isoformat()`.

### Umgebung hochfahren

Alle Befehle in diesem Plan setzen voraus, dass die Datenbank läuft und die virtuelle
Python-Umgebung aktiv ist. Aus dem Repository-Wurzelverzeichnis, in PowerShell:

    docker compose up -d
    cd backend
    .\.venv\Scripts\Activate.ps1

Erwartete Ausgabe von `docker compose up -d`: eine Zeile, die auf `Started` oder
`Running` endet. Schlägt es mit `error during connect` fehl, läuft Docker Desktop nicht — starten
und warten, bis das Wal-Symbol stillsteht. Blockiert PowerShell die Aktivierung mit
„… kann nicht geladen werden, da die Ausführung von Skripts …", einmalig
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ausführen.

Existiert `.venv` noch nicht:

    cd backend
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements-dev.txt

`requirements-dev.txt` enthält `requirements.txt` plus `pytest` und `ruff`.

## Plan of Work

Die Arbeit läuft in neun Meilensteinen, geordnet so, dass nichts auf etwas aufbaut, das noch nicht
existiert. M1 und M2 sind reine Backend-Korrekturen und unabhängig voneinander. M3 legt die
Datenbankspalten an, die M4 im Backend und M5 in der Oberfläche benutzen. M6 ergänzt die
Session-Notiz. M7 entfernt den stillgelegten Ordner erst, nachdem M5 die Priorität an der neuen
Stelle bereitstellt — vorher wäre die einzige Umsetzung von FR-1.4 verschwunden. M8 zieht die
Tests nach, M9 räumt Dialogtext und Dokumentation auf.

Zwei Meilensteine hängen sachlich zusammen und dürfen nicht getrennt werden: M2 muss **vor** M5
fertig sein. Sobald das Bearbeiten-Formular existiert, schickt es bei jedem Speichern auch das
Zieldatum mit. Ohne M2 würde der Server das Speichern eines Ziels ablehnen, dessen Termin bereits
verstrichen ist — die Nutzerin käme an ihre eigenen Altdaten nicht mehr heran.

Nach jedem Meilenstein wird committet. Die Commit-Nachricht steht im Imperativ und nennt die
Anforderung, etwa „Lernziele im Browser bearbeitbar machen (FR-1.3)".

## Concrete Steps

### M1 — Ungültige Abfrageparameter liefern HTTP 400 statt HTTP 500

**Was heute passiert.** `backend/app/routes/plans.py` liest die Filter direkt aus der Adresszeile
und schickt sie ungeprüft durch `int()`:

    if goal_id := request.args.get("goal_id"):
        q = q.filter_by(goal_id=int(goal_id))
    if year := request.args.get("year"):
        q = q.filter_by(year=int(year))
    if month := request.args.get("month"):
        q = q.filter_by(month=int(month))

Ruft jemand `/api/plans?year=abc` auf, wirft `int("abc")` einen `ValueError`. Flask fängt ihn nicht
ab und antwortet mit HTTP 500 „Internal Server Error". Für die Nutzerin sieht das aus wie ein
Absturz, obwohl nur die Eingabe falsch war. Dasselbe Muster steht in
`backend/app/routes/sessions.py` bei `goal_id` und `limit` sowie beim `goal_id` aus dem Rumpf von
`/api/sessions/start`.

**Schritt 1.1.** In `backend/app/validation.py` ganz unten anfügen:

    def optional_int_arg(value, field_label: str, minimum: int, maximum: int) -> int | None:
        """Ganze Zahl aus einem Abfrageparameter der Adresszeile.

        Fehlt der Parameter, liefert die Funktion None; der Aufrufer filtert
        dann nicht danach. Ein vorhandener, aber unsinniger Wert wie "abc"
        fuehrt zu ValidationError und damit zu HTTP 400 statt zu einem
        Serverfehler.
        """
        if _is_missing(value):
            return None
        return require_int_in_range(value, field_label, minimum, maximum)

`_is_missing` und `require_int_in_range` stehen bereits in derselben Datei und werden hier nur
wiederverwendet.

**Schritt 1.2.** In `backend/app/routes/plans.py` den Import erweitern. Aus:

    from ..validation import (
        optional_clock_time,
        optional_text,
        require_day_of_month,
        require_int_in_range,
    )

wird:

    from ..validation import (
        optional_clock_time,
        optional_int_arg,
        optional_text,
        require_day_of_month,
        require_int_in_range,
    )

Und `list_plans` bekommt diesen Rumpf:

    @plans_bp.get("/api/plans")
    @jwt_required()
    def list_plans():
        uid = _current_user_id()
        goal_id = optional_int_arg(request.args.get("goal_id"), "Lernziel", 1, 2_147_483_647)
        year = optional_int_arg(request.args.get("year"), "Jahr", 2020, 2100)
        month = optional_int_arg(request.args.get("month"), "Monat", 1, 12)

        q = PlanSlot.query.filter_by(user_id=uid)
        if goal_id is not None:
            q = q.filter_by(goal_id=goal_id)
        if year is not None:
            q = q.filter_by(year=year)
        if month is not None:
            q = q.filter_by(month=month)
        slots = q.order_by(PlanSlot.year, PlanSlot.month, PlanSlot.day).all()
        return jsonify([s.to_dict() for s in slots]), 200

Die Obergrenze `2_147_483_647` ist der größte Wert einer 32-Bit-Ganzzahl und damit das, was die
Spalte `id` in PostgreSQL fasst. Derselbe Wert steht bereits in `create_plan` in dieser Datei.

Wichtig ist die Prüfung auf `is not None` statt auf Wahrheitswert: Ein Filter mit dem Wert `0`
wäre sonst stillschweigend wirkungslos. Bei Jahren und Monaten kann das durch die Bereichsprüfung
nicht vorkommen, aber das Muster soll einheitlich sein.

**Schritt 1.3.** In `backend/app/routes/sessions.py` den Import ergänzen — die Datei importiert
bisher gar nichts aus `validation`:

    from ..validation import optional_int_arg, optional_text, require_int_in_range

Direkt unter `sessions_bp = Blueprint("sessions", __name__)` eine Konstante einfügen:

    # Obergrenze fuer /api/sessions?limit=... - ohne sie koennte ein einzelner
    # Aufruf die gesamte Sitzungshistorie in eine Antwort laden.
    MAX_SESSION_LIMIT = 200
    DEFAULT_SESSION_LIMIT = 50

`list_sessions` wird zu:

    @sessions_bp.get("/api/sessions")
    @jwt_required()
    def list_sessions():
        uid = _current_user_id()
        goal_id = optional_int_arg(request.args.get("goal_id"), "Lernziel", 1, 2_147_483_647)
        limit = optional_int_arg(request.args.get("limit"), "Anzahl", 1, MAX_SESSION_LIMIT)
        if limit is None:
            limit = DEFAULT_SESSION_LIMIT

        q = StudySession.query.filter_by(user_id=uid)
        if goal_id is not None:
            q = q.filter_by(goal_id=goal_id)
        sessions = q.order_by(StudySession.started_at.desc()).limit(limit).all()
        return jsonify([s.to_dict() for s in sessions]), 200

**Schritt 1.4.** In derselben Datei in `start_session` die handgeschriebene Prüfung ersetzen. Aus:

    goal_id = data.get("goal_id")
    if not goal_id:
        return jsonify({"error": "goal_id ist Pflichtfeld"}), 400

    Goal.query.filter_by(id=int(goal_id), user_id=uid).first_or_404()

wird:

    goal_id = require_int_in_range(data.get("goal_id"), "Lernziel", 1, 2_147_483_647)

    Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()

Weiter unten im selben Funktionsrumpf `goal_id=int(goal_id)` durch `goal_id=goal_id` ersetzen.

Achtung: Die Fehlermeldung ändert sich damit von „goal_id ist Pflichtfeld" zu „Lernziel ist ein
Pflichtfeld". Kein bestehender Test und kein Playwright-Test prüft diesen Text — überprüft mit
einer Suche nach `goal_id ist Pflichtfeld` im gesamten Repository. Die neue Meldung ist die
bessere, weil sie deutsch ist und den Feldnamen der Oberfläche benutzt.

**Schritt 1.5.** Prüfen. In `backend/` bei aktiver virtueller Umgebung:

    ruff check .
    pytest

Erwartet: `All checks passed!` und `37 passed`. Die Tests dieses Meilensteins entstehen in M8; hier
geht es zunächst nur darum, nichts kaputtgemacht zu haben.

Danach von Hand gegen den laufenden Server. In einem Terminal `flask run --debug`, dann im Browser
http://localhost:5000/api/plans?year=abc aufrufen. Ohne Anmeldung antwortet die Adresse mit
HTTP 401 — das ist erwartet und beweist noch nichts. Der belastbare Nachweis erfolgt in M8 durch
einen Test, der sich vorher anmeldet.

**Akzeptanz M1:** `ruff check .` und `pytest` sind grün; in `plans.py` und `sessions.py` steht kein
nacktes `int(...)` mehr auf einem Wert aus `request.args`.

### M2 — Ein Lernziel mit verstrichenem Zieldatum lässt sich bearbeiten

**Was heute passiert.** `update_goal` in `backend/app/routes/goals.py` schickt jedes gesendete
Zieldatum durch `require_future_date`:

    if "target_date" in data:
        goal.target_date = require_future_date(data["target_date"], "Zieldatum")

`require_future_date` lehnt jedes Datum ab, das vor heute liegt. Solange die Oberfläche beim
Statuswechsel nur `{"status": "achieved"}` schickt, fällt das nicht auf. Sobald M5 ein
Bearbeiten-Formular liefert, das alle Felder mitschickt, lässt sich ein Ziel, dessen Termin
verstrichen ist, nicht mehr umbenennen — und genau solche Ziele will man rückblickend mit Note und
Notiz versehen.

**Schritt 2.1.** In `backend/app/validation.py` `require_future_date` um einen Vergleichswert
erweitern. Die Funktion lautet heute:

    def require_future_date(value, field_label: str) -> date:
        """ISO-Datum (JJJJ-MM-TT), heute oder spaeter, hoechstens 10 Jahre voraus."""
        if _is_missing(value):
            raise ValidationError(f"{field_label} ist ein Pflichtfeld")
        try:
            parsed = date.fromisoformat(str(value))
        except ValueError:
            raise ValidationError(
                f"{field_label} muss im Format JJJJ-MM-TT angegeben werden"
            ) from None
        today = date.today()
        if parsed < today:
            raise ValidationError(f"{field_label} darf nicht in der Vergangenheit liegen")
        if parsed.year > today.year + MAX_FUTURE_YEARS:
            raise ValidationError(
                f"{field_label} darf hoechstens {MAX_FUTURE_YEARS} Jahre in der Zukunft liegen"
            )
        return parsed

Danach:

    def require_future_date(value, field_label: str, current: date | None = None) -> date:
        """ISO-Datum (JJJJ-MM-TT), heute oder spaeter, hoechstens 10 Jahre voraus.

        `current` ist der bereits gespeicherte Wert. Stimmt die Eingabe damit
        ueberein, entfaellt die Pruefung auf Vergangenheit: Ein Lernziel, dessen
        Termin verstrichen ist, muss sich weiterhin umbenennen lassen, ohne dass
        die Nutzerin gezwungen waere, das Datum zu faelschen. Jede echte
        Aenderung des Datums muss dagegen heute oder spaeter liegen.
        """
        if _is_missing(value):
            raise ValidationError(f"{field_label} ist ein Pflichtfeld")
        try:
            parsed = date.fromisoformat(str(value))
        except ValueError:
            raise ValidationError(
                f"{field_label} muss im Format JJJJ-MM-TT angegeben werden"
            ) from None
        today = date.today()
        if parsed.year > today.year + MAX_FUTURE_YEARS:
            raise ValidationError(
                f"{field_label} darf hoechstens {MAX_FUTURE_YEARS} Jahre in der Zukunft liegen"
            )
        if parsed == current:
            return parsed
        if parsed < today:
            raise ValidationError(f"{field_label} darf nicht in der Vergangenheit liegen")
        return parsed

Die Prüfung auf die Obergrenze wandert dabei nach vorn, damit sie auch für einen unveränderten
Wert gilt — ein gespeichertes Datum im Jahr 2400 soll nicht durch die Hintertür bestätigt werden.

**Schritt 2.2.** In `backend/app/routes/goals.py` in `update_goal` den Aufruf ergänzen:

    if "target_date" in data:
        goal.target_date = require_future_date(
            data["target_date"], "Zieldatum", current=goal.target_date
        )

`create_goal` bleibt unverändert: Ein neues Ziel mit verstrichenem Termin ergibt keinen Sinn.

**Schritt 2.3.** Dasselbe im Frontend, sonst blockiert die Formularprüfung vor dem Server. In
`frontend/src/app/core/validation.ts` `validateTargetDate` erweitern:

    export function validateTargetDate(value: string, current?: string): string | null {
      if (!value) return 'Zieldatum ist ein Pflichtfeld';
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return 'Zieldatum muss ein gültiges Datum sein';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed.getFullYear() > today.getFullYear() + 10) return 'Zieldatum liegt zu weit in der Zukunft';
      // Ein unveraendertes Datum bleibt zulaessig, auch wenn es verstrichen ist -
      // sonst liesse sich ein altes Lernziel nicht mehr bearbeiten.
      if (current && value === current) return null;
      if (parsed < today) return 'Zieldatum darf nicht in der Vergangenheit liegen';
      return null;
    }

Der zweite Parameter ist optional; der bestehende Aufruf im Anlegeformular bleibt unverändert
gültig.

**Schritt 2.4.** Einen Test ergänzen, der vorher fehlschlägt. In `backend/tests/test_validation.py`
ans Ende anfügen:

    def test_update_goal_keeps_past_target_date(client, auth_header, goal_id):
        """Ein Ziel mit verstrichenem Termin muss umbenennbar bleiben (FR-1.3)."""
        from datetime import date, timedelta

        from app.extensions import db
        from app.models.goal import Goal

        gestern = date.today() - timedelta(days=1)
        ziel = db.session.get(Goal, goal_id)
        ziel.target_date = gestern
        db.session.commit()

        resp = client.put(
            f"{GOALS_URL}/{goal_id}",
            json={"title": "Neuer Titel", "target_date": gestern.isoformat()},
            headers=auth_header,
        )
        assert resp.status_code == 200
        assert resp.get_json()["title"] == "Neuer Titel"

    def test_update_goal_rejects_moving_into_the_past(client, auth_header, goal_id):
        """Ein echtes Verschieben in die Vergangenheit bleibt verboten."""
        from datetime import date, timedelta

        vorgestern = (date.today() - timedelta(days=2)).isoformat()
        resp = client.put(
            f"{GOALS_URL}/{goal_id}",
            json={"target_date": vorgestern},
            headers=auth_header,
        )
        assert resp.status_code == 400

Die Fixtures `auth_header` und `goal_id` sind in dieser Datei bereits vorhanden.

**Schritt 2.5.** Prüfen:

    pytest backend/tests/test_validation.py -q

Erwartet: `19 passed`. Der erste der beiden neuen Tests schlägt fehl, wenn Schritt 2.1 und 2.2
vergessen wurden — mit `assert 400 == 200`.

**Akzeptanz M2:** `pytest` ist grün; ein Ziel mit gestrigem Zieldatum lässt sich per PUT
umbenennen, das Verschieben auf ein anderes vergangenes Datum liefert weiterhin HTTP 400.

### M3 — Migration 0002: Spalten `priority`, `grade`, `result_note` an `goals`

Drei Spalten kommen in einer einzigen Migration dazu, weil sie zusammen dieselbe Tabelle betreffen
und gemeinsam ausgeliefert werden. `priority` bedient FR-1.4 (Priorisierung), `grade` und
`result_note` bedienen FR-5.2 (Notizen und Ergebnisse zu einem erreichten Ziel).

**Schritt 3.1.** Neue Datei `backend/migrations/versions/0002_goal_prioritaet_und_ergebnis.py` mit
genau diesem Inhalt:

    """Lernziel um Prioritaet, Note und Ergebnis-Notiz erweitern

    Revision ID: 0002_goal_prioritaet_und_ergebnis
    Revises: 0001_ms4_initial_schema
    Create Date: 2026-08-17

    priority bedient FR-1.4, grade und result_note bedienen FR-5.2.
    Alle drei Spalten sind optional (nullable), damit bestehende Lernziele
    unveraendert gueltig bleiben.
    """

    import sqlalchemy as sa
    from alembic import op

    revision = "0002_goal_prioritaet_und_ergebnis"
    down_revision = "0001_ms4_initial_schema"
    branch_labels = None
    depends_on = None


    def upgrade():
        op.add_column("goals", sa.Column("priority", sa.String(length=10), nullable=True))
        op.add_column("goals", sa.Column("grade", sa.String(length=10), nullable=True))
        op.add_column("goals", sa.Column("result_note", sa.String(length=500), nullable=True))


    def downgrade():
        op.drop_column("goals", "result_note")
        op.drop_column("goals", "grade")
        op.drop_column("goals", "priority")

Der Wert von `down_revision` muss buchstabengetreu `"0001_ms4_initial_schema"` lauten — das ist die
`revision` der bestehenden Datei `0001_ms4_initial_schema.py`. Stimmt er nicht, bricht Alembic mit
`Can't locate revision identified by ...` ab.

Die Migration wird von Hand geschrieben und **nicht** mit `flask db migrate` erzeugt, weil der
automatische Vergleich in diesem Projekt gern zusätzliche, unerwünschte Änderungen einsammelt.

**Schritt 3.2.** Anwenden. In `backend/`, virtuelle Umgebung aktiv, Docker-Container läuft:

    flask db upgrade

Erwartete Ausgabe, sinngemäß:

    INFO  [alembic.runtime.migration] Running upgrade 0001_ms4_initial_schema -> 0002_goal_prioritaet_und_ergebnis

Bricht der Befehl mit `could not connect to server` ab, läuft der Docker-Container nicht:
`docker compose up -d` im Repository-Wurzelverzeichnis nachholen.

**Schritt 3.3.** Nachweis, dass die Spalten wirklich existieren — das ist der Punkt, den `pytest`
nicht leisten kann, weil die Tests gegen SQLite laufen und das Schema mit `db.create_all()`
erzeugen. In pgAdmin 4 die Datenbank `lernzeit` öffnen, Rechtsklick, *Query Tool*, und ausführen:

    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'goals'
    ORDER BY ordinal_position;

Erwartet: elf Zeilen, darunter `priority`, `grade` und `result_note`, alle mit
`character varying` und `is_nullable = YES`.

**Schritt 3.4.** Die Rückwärts-Richtung einmal ausprobieren, damit ein Fehlschlag nicht erst im
Ernstfall auffällt:

    flask db downgrade
    flask db upgrade

Der erste Befehl muss die drei Spalten entfernen, der zweite sie wieder anlegen. Beides ohne
Fehlermeldung. Danach steht die Datenbank wieder auf `0002`.

**Akzeptanz M3:** `flask db upgrade` läuft durch; die SQL-Abfrage aus Schritt 3.3 zeigt die drei
neuen Spalten; `flask db downgrade` gefolgt von `flask db upgrade` läuft fehlerfrei.

### M4 — Backend akzeptiert und liefert Priorität, Note und Ergebnis-Notiz

**Schritt 4.1.** In `backend/app/models/goal.py` neben die vorhandene Zeile

    VALID_STATUSES = ("open", "in_progress", "achieved")

diese ergänzen:

    VALID_PRIORITIES = ("high", "medium", "low")

Die englischen Schlüssel sind bewusst gewählt: `VALID_STATUSES` benutzt sie bereits, und die
Oberfläche übersetzt sie ohnehin für die Anzeige („hoch", „mittel", „niedrig").

In der Klasse `Goal` nach `status` die drei Spalten anfügen:

    status = db.Column(db.String(50), default="open")
    priority = db.Column(db.String(10), nullable=True)
    grade = db.Column(db.String(10), nullable=True)
    result_note = db.Column(db.String(500), nullable=True)

Und in `to_dict()` nach `"status": self.status,` einfügen:

    "priority": self.priority,
    "grade": self.grade,
    "result_note": self.result_note,

**Schritt 4.2.** In `backend/app/routes/goals.py` den Import erweitern. Aus:

    from ..models.goal import VALID_STATUSES, Goal
    from ..validation import require_future_date, require_int_in_range, require_text

wird:

    from ..models.goal import VALID_PRIORITIES, VALID_STATUSES, Goal
    from ..validation import (
        optional_text,
        require_future_date,
        require_int_in_range,
        require_text,
    )

In `create_goal` nach der Statusprüfung ergänzen:

    priority = data.get("priority") or None
    if priority is not None and priority not in VALID_PRIORITIES:
        return jsonify({"error": f"priority muss einer von {VALID_PRIORITIES} sein"}), 400

    grade = optional_text(data.get("grade"), "Note", 10)
    result_note = optional_text(data.get("result_note"), "Notiz", 500)

und die drei Werte an den Aufruf `Goal(...)` anhängen:

    goal = Goal(
        user_id=_current_user_id(),
        title=title,
        module_name=module_name,
        target_date=target_date,
        ects=ects,
        status=status,
        priority=priority,
        grade=grade,
        result_note=result_note,
    )

In `update_goal` nach dem Block für `status` ergänzen:

    if "priority" in data:
        priority = data["priority"] or None
        if priority is not None and priority not in VALID_PRIORITIES:
            return jsonify({"error": f"priority muss einer von {VALID_PRIORITIES} sein"}), 400
        goal.priority = priority
    if "grade" in data:
        goal.grade = optional_text(data["grade"], "Note", 10)
    if "result_note" in data:
        goal.result_note = optional_text(data["result_note"], "Notiz", 500)

Der Ausdruck `data["priority"] or None` sorgt dafür, dass eine leere Zeichenkette aus einem
Auswahlfeld („keine Priorität") als „nicht gesetzt" ankommt und nicht als ungültiger Wert
abgelehnt wird.

**Schritt 4.3.** Tests ergänzen. In `backend/tests/test_goals.py` ans Ende:

    def test_create_goal_with_priority_and_result(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={
                "title": "Klausur Statistik",
                "module_name": "STAT01",
                "target_date": FUTURE_DATE,
                "priority": "high",
                "grade": "1,7",
                "result_note": "Altklausuren waren entscheidend.",
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["priority"] == "high"
        assert body["grade"] == "1,7"
        assert body["result_note"] == "Altklausuren waren entscheidend."


    def test_create_goal_rejects_unknown_priority(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={
                "title": "Falsche Prioritaet",
                "module_name": "X",
                "target_date": FUTURE_DATE,
                "priority": "dringend",
            },
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_goal_without_priority_stays_valid(client, auth_header):
        """FR-1.4 ist "Could" - die Prioritaet bleibt optional."""
        resp = client.post(
            GOALS_URL,
            json={"title": "Ohne Prio", "module_name": "X", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        assert resp.status_code == 201
        assert resp.get_json()["priority"] is None

Falls `FUTURE_DATE` in `test_goals.py` noch nicht existiert, oben in der Datei ergänzen, wie es
`test_reminders.py` bereits vormacht:

    from datetime import date, timedelta

    FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()

**Schritt 4.4.** Prüfen:

    ruff check .
    pytest

Erwartet: `All checks passed!` und `42 passed` (37 vorher, plus zwei aus M2, plus drei hier).

**Akzeptanz M4:** Ein `POST /api/goals` mit `"priority": "high"`, `"grade": "1,7"` und
`"result_note": "..."` liefert HTTP 201, und die Antwort enthält alle drei Werte; `"priority":
"dringend"` liefert HTTP 400.

### M5 — Bearbeiten-Formular für Lernziele in der Oberfläche

Das ist der Meilenstein, der FR-1.3 („Lernziele können bearbeitet, verschoben oder gelöscht
werden") in der Oberfläche überhaupt erst erfüllbar macht. Die Schnittstelle kann es längst,
`GoalService.update` in `frontend/src/app/core/services/goal.service.ts` schickt bereits ein PUT —
es fehlt allein die Bedienung.

Die Beschriftungen stammen aus dem Gestaltungsentwurf
`docs/design-reference/html/2b-lernziele.html`, Abschnitt „Lernziel bearbeiten": Titel, Modul,
Zieldatum, Status, Priorität, „Notiz / Ergebnis". **Die Optik wird nicht übernommen.** Farben,
Schriften und Navigationsleiste sind laut Teambeschluss vom 04.08.2026 zurückgestellt, bis die
Funktionen stehen. Der Entwurf ist verbindlich für Felder, Beschriftungen und Reihenfolge — nicht
für das Aussehen.

Der Entwurf zeigt außerdem einen Knopf „Verschieben" neben „Speichern". Ein eigener Knopf ist
nicht nötig: „Verschieben" bedeutet hier, das Zieldatum zu ändern, und das geschieht im selben
Formular. Diese Auslegung gehört in den Decision Log, damit sie im Projektbericht erklärbar ist.

**Schritt 5.1.** In `frontend/src/app/core/models/index.ts` die Schnittstelle `Goal` erweitern:

    export interface Goal {
      id: number;
      user_id: number;
      title: string;
      module_name: string;
      ects: number;
      status: 'open' | 'in_progress' | 'achieved';
      priority: 'high' | 'medium' | 'low' | null;
      grade: string | null;
      result_note: string | null;
      target_date: string;
      created_at: string;
    }

`GoalStats` erbt von `Goal` und bekommt die Felder damit automatisch mit.

**Schritt 5.2.** In `frontend/src/app/features/goals/goals.ts` den Import der Prüfregeln
unverändert lassen und die Klasse um den Bearbeiten-Zustand erweitern. Nach der Zeile

    fieldErrors = signal<Record<string, string>>({});

einfügen:

      /** id des Ziels, das gerade bearbeitet wird; null heisst: keins. */
      editingId = signal<number | null>(null);
      editForm = {
        title: '',
        module_name: '',
        ects: 5,
        target_date: '',
        status: 'open' as Goal['status'],
        priority: '' as '' | 'high' | 'medium' | 'low',
        grade: '',
        result_note: '',
      };
      /** Zieldatum, wie es beim Oeffnen des Formulars war - erlaubt das
       *  Speichern eines Ziels, dessen Termin bereits verstrichen ist. */
      private editOriginalDate = '';
      editError = signal('');

Und am Ende der Klasse diese Methoden:

      startEdit(goal: Goal): void {
        this.editError.set('');
        this.fieldErrors.set({});
        this.editOriginalDate = goal.target_date;
        this.editForm = {
          title: goal.title,
          module_name: goal.module_name,
          ects: goal.ects,
          target_date: goal.target_date,
          status: goal.status,
          priority: goal.priority ?? '',
          grade: goal.grade ?? '',
          result_note: goal.result_note ?? '',
        };
        this.editingId.set(goal.id);
      }

      cancelEdit(): void {
        this.editingId.set(null);
        this.editError.set('');
        this.fieldErrors.set({});
      }

      async saveEdit(): Promise<void> {
        const id = this.editingId();
        if (id === null) return;
        this.editError.set('');

        const errors: Record<string, string> = {};
        const titleError = validateRequiredText(this.editForm.title, 'Titel');
        const moduleError = validateRequiredText(this.editForm.module_name, 'Modul/Kurs');
        const ectsError = validateEcts(this.editForm.ects);
        const dateError = validateTargetDate(this.editForm.target_date, this.editOriginalDate);
        if (titleError) errors['title'] = titleError;
        if (moduleError) errors['module_name'] = moduleError;
        if (ectsError) errors['ects'] = ectsError;
        if (dateError) errors['target_date'] = dateError;
        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) return;

        this.saving.set(true);
        try {
          const updated = await this.goalService.update(id, {
            title: this.editForm.title,
            module_name: this.editForm.module_name,
            ects: Number(this.editForm.ects),
            target_date: this.editForm.target_date,
            status: this.editForm.status,
            priority: this.editForm.priority || null,
            grade: this.editForm.grade || null,
            result_note: this.editForm.result_note || null,
          });
          this.goals.update(gs => gs.map(g => (g.id === id ? updated : g)));
          this.editingId.set(null);
        } catch (err) {
          const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
          this.editError.set(msg ?? 'Fehler beim Speichern.');
        } finally {
          this.saving.set(false);
        }
      }

      priorityLabel(priority: string | null): string {
        if (!priority) return '';
        return { high: 'hoch', medium: 'mittel', low: 'niedrig' }[priority] ?? priority;
      }

`validateTargetDate` bekommt hier den zweiten Parameter aus M2 — ohne M2 lehnt das Formular das
Speichern eines alten Ziels ab, bevor die Anfrage überhaupt losgeht.

**Schritt 5.3.** Die Vorlage anpassen. In der Zielliste steht heute pro Ziel dieser Block:

    @for (goal of goals(); track goal.id) {
      <div class="card goal-card" [class.achieved]="goal.status === 'achieved'">
        <div class="goal-header">
          ...
        </div>
        <div class="goal-meta">
          ...
        </div>
        <div class="goal-actions">
          ...
        </div>
      </div>
    }

Daraus wird eine Verzweigung: Wird das Ziel gerade bearbeitet, erscheint das Formular, sonst die
Karte wie bisher. Der neue Block, vollständig:

    @for (goal of goals(); track goal.id) {
      @if (editingId() === goal.id) {
        <div class="card goal-card">
          <h3>Lernziel bearbeiten</h3>
          @if (editError()) {
            <div class="alert alert-error">{{ editError() }}</div>
          }
          <div class="form-row">
            <div class="form-group">
              <label for="edit-title">Titel</label>
              <input id="edit-title" [(ngModel)]="editForm.title" name="edit_title"
                (ngModelChange)="clearFieldError('title')"
                [class.input-error]="fieldErrors()['title']" />
              @if (fieldErrors()['title']) {
                <p class="field-error">{{ fieldErrors()['title'] }}</p>
              }
            </div>
            <div class="form-group">
              <label for="edit-module">Modul / Kurs</label>
              <input id="edit-module" [(ngModel)]="editForm.module_name" name="edit_module"
                (ngModelChange)="clearFieldError('module_name')"
                [class.input-error]="fieldErrors()['module_name']" />
              @if (fieldErrors()['module_name']) {
                <p class="field-error">{{ fieldErrors()['module_name'] }}</p>
              }
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-ects" title="1 ECTS = ca. 30 Stunden Lernaufwand">ECTS-Punkte des Moduls</label>
              <input id="edit-ects" type="number" [(ngModel)]="editForm.ects" name="edit_ects"
                (ngModelChange)="clearFieldError('ects')"
                [class.input-error]="fieldErrors()['ects']" />
              @if (fieldErrors()['ects']) {
                <p class="field-error">{{ fieldErrors()['ects'] }}</p>
              }
            </div>
            <div class="form-group">
              <label for="edit-date">Zieldatum</label>
              <input id="edit-date" type="date" [(ngModel)]="editForm.target_date" name="edit_date"
                (ngModelChange)="clearFieldError('target_date')"
                [class.input-error]="fieldErrors()['target_date']" />
              @if (fieldErrors()['target_date']) {
                <p class="field-error">{{ fieldErrors()['target_date'] }}</p>
              }
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="edit-status">Status</label>
              <select id="edit-status" [(ngModel)]="editForm.status" name="edit_status">
                <option value="open">offen</option>
                <option value="in_progress">in Arbeit</option>
                <option value="achieved">erreicht</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-priority">Priorität</label>
              <select id="edit-priority" [(ngModel)]="editForm.priority" name="edit_priority">
                <option value="">keine</option>
                <option value="high">hoch</option>
                <option value="medium">mittel</option>
                <option value="low">niedrig</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-grade">Note (optional)</label>
              <input id="edit-grade" [(ngModel)]="editForm.grade" name="edit_grade" placeholder="z.B. 1,7" />
            </div>
          </div>
          <div class="form-group">
            <label for="edit-note">Notiz / Ergebnis (optional)</label>
            <input id="edit-note" [(ngModel)]="editForm.result_note" name="edit_note"
              placeholder="z. B. Note, Feedback, Lessons Learned …" />
          </div>
          <div class="goal-actions">
            <button class="btn btn-primary" (click)="saveEdit()" [disabled]="saving()">
              {{ saving() ? 'Speichern…' : 'Speichern' }}
            </button>
            <button class="btn btn-secondary" (click)="cancelEdit()">Abbrechen</button>
          </div>
        </div>
      } @else {
        <div class="card goal-card" [class.achieved]="goal.status === 'achieved'">
          <div class="goal-header">
            <div>
              <strong>{{ goal.title }}</strong>
              <span class="module-tag">{{ goal.module_name }}</span>
            </div>
            <span class="status-badge" [class]="'status-' + goal.status">{{ statusLabel(goal.status) }}</span>
          </div>
          <div class="goal-meta">
            <span>📅 Ziel: {{ formatDate(goal.target_date) }}</span>
            <span title="1 ECTS entspricht ca. 30 Stunden Lernaufwand">🎓 {{ goal.ects }} ECTS ({{ goal.ects * 30 }}h)</span>
            @if (goal.priority) { <span>⚑ Priorität: {{ priorityLabel(goal.priority) }}</span> }
            @if (goal.grade) { <span>🏅 Note: {{ goal.grade }}</span> }
          </div>
          @if (goal.result_note) {
            <p class="goal-note">📝 {{ goal.result_note }}</p>
          }
          <div class="goal-actions">
            <button class="btn btn-sm btn-secondary" (click)="startEdit(goal)">✎ Bearbeiten</button>
            @if (goal.status !== 'achieved') {
              <button class="btn btn-sm btn-success" (click)="markAchieved(goal)">✓ Erreicht</button>
              @if (goal.status === 'open') {
                <button class="btn btn-sm btn-secondary" (click)="markInProgress(goal)">▶ In Arbeit</button>
              }
            }
            <button class="btn btn-sm btn-danger" (click)="remove(goal)">🗑 Löschen</button>
          </div>
        </div>
      }
    }

**Schritt 5.4.** Das Anlegeformular bekommt ebenfalls ein Auswahlfeld für die Priorität, damit
FR-1.4 nicht nur nachträglich erreichbar ist. Im vorhandenen Formular nach der Zeile mit dem
Zieldatum eine weitere `form-group` einfügen:

    <div class="form-group">
      <label for="goal-priority">Priorität (optional)</label>
      <select id="goal-priority" [(ngModel)]="form.priority" name="priority">
        <option value="">keine</option>
        <option value="high">hoch</option>
        <option value="medium">mittel</option>
        <option value="low">niedrig</option>
      </select>
    </div>

Und das Objekt `form` in der Klasse sowie das Zurücksetzen in `create()` um `priority: ''`
erweitern. In `create()` beim Aufruf `this.goalService.create({ ...this.form, status: 'open' })`
sorgt der Ausbreitungsoperator dafür, dass die Priorität automatisch mitgeht; eine leere
Zeichenkette wird vom Backend nach M4 als „nicht gesetzt" verstanden.

**Schritt 5.5.** Ein `.goal-note` fehlt noch im Stil. In `frontend/src/styles.scss` neben die
vorhandene Regel `.goal-form .btn { margin-top: 0.5rem; }` anfügen:

    .goal-note { margin: 0.5rem 0 0; font-size: 0.9rem; color: #555; }

**Schritt 5.6.** Prüfen. In `frontend/`:

    ng lint
    ng test --watch=false

Erwartet: beides grün. Häufigster Fehler an dieser Stelle ist eine Lint-Meldung `label-for`: Jedes
`<label for="...">` braucht ein Eingabefeld mit genau dieser `id`. Die oben angegebenen Paare
stimmen überein; wer Bezeichner ändert, muss beide Seiten ändern.

**Schritt 5.7.** Von Hand prüfen. Backend und Frontend starten, anmelden, ein Ziel anlegen, auf
„✎ Bearbeiten" klicken, Titel ändern, „Speichern", dann `F5` drücken. Der neue Titel muss stehen
bleiben.

**Akzeptanz M5:** Auf http://localhost:4200/goals lassen sich Titel, Modul, ECTS, Zieldatum,
Status, Priorität, Note und Notiz eines bestehenden Ziels ändern; nach `F5` sind die Werte noch da;
`ng lint` und `ng test --watch=false` sind grün.

### M6 — Notiz beim Stoppen einer Lernsession

`StudySession` hat seit MS4 eine Spalte `note`, und `stop_session` in
`backend/app/routes/sessions.py` nimmt sie entgegen. Vom Browser aus war sie bisher **nicht
erreichbar** — es gibt kein Eingabefeld. Damit ist die Spalte totes Gewicht, und der zweite Teil
von FR-5.2 („optionale Notizen/Ergebnisse") liegt brach.

**Schritt 6.1.** Im Backend die Notiz prüfen statt sie ungeprüft zu übernehmen. In
`stop_session` aus:

    if data.get("note"):
        session.note = data["note"]

wird:

    if "note" in data:
        session.note = optional_text(data["note"], "Notiz", 500)

Der Import von `optional_text` ist in M1, Schritt 1.3 bereits erfolgt.

Der Unterschied ist wichtig: Vorher konnte eine Notiz beliebiger Länge in die Datenbank laufen und
dort an der Spaltenbreite scheitern (mit einem Serverfehler); jetzt gibt es HTTP 400 mit einer
verständlichen Meldung. Außerdem lässt sich eine Notiz jetzt bewusst wieder leeren.

**Schritt 6.2.** Im Timer ein Eingabefeld anbieten. In
`frontend/src/app/features/timer/timer.ts` in der Klasse ergänzen:

      sessionNote = '';

In der Vorlage im Block `timer-running`, direkt vor `<div class="timer-buttons">`:

    <div class="form-group">
      <label for="session-note">Notiz zur Session (optional)</label>
      <input id="session-note" [(ngModel)]="sessionNote" name="session_note"
        placeholder="z.B. Kapitel 3 wiederholt" />
    </div>

Und `stop()` erweitert den Aufruf und leert das Feld danach:

      async stop(): Promise<void> {
        const s = this.activeSession();
        if (!s) return;
        this.loading.set(true);
        try {
          await this.sessionService.stop(s.id, this.sessionNote || undefined);
          this.clearInterval();
          this.activeSession.set(null);
          this.displayTime.set('00:00:00');
          this.sessionNote = '';
          await this.loadSessions();
        } finally {
          this.loading.set(false);
        }
      }

`SessionService.stop(id, note?)` in `frontend/src/app/core/services/session.service.ts` nimmt den
zweiten Parameter bereits entgegen und schickt ihn als `{ note: note ?? null }` — hier ist nichts
zu ändern.

**Schritt 6.3.** Die Notiz im Verlauf anzeigen. In der Liste „Zuletzt gelernt" den Eintrag
erweitern:

    @for (s of sessions(); track s.id) {
      <div class="session-row">
        <span>{{ goalName(s.goal_id) }}</span>
        <span>{{ formatDuration(s.duration_seconds) }}</span>
        <span class="session-date">{{ formatDate(s.started_at) }}</span>
      </div>
      @if (s.note) {
        <p class="goal-note">📝 {{ s.note }}</p>
      }
    }

**Schritt 6.4.** Prüfen: `ng lint` und `ng test --watch=false` in `frontend/`, dann von Hand:
Timer starten, ein paar Sekunden laufen lassen, Notiz eintippen, „⏹ Stopp". Die Notiz muss unter
dem neuen Eintrag in „Zuletzt gelernt" erscheinen und einen Reload überstehen.

**Akzeptanz M6:** Eine gestoppte Session speichert ihre Notiz; nach `F5` steht sie noch im
Verlauf; eine Notiz mit mehr als 500 Zeichen wird mit HTTP 400 abgelehnt.

### M7 — Stillgelegten Ordner `frontend/src/app/goals/` entfernen

Erst jetzt, nachdem M5 die Priorität an der richtigen Stelle bereitstellt, darf der alte Ordner
weg. Vorher wäre die einzige Umsetzung von FR-1.4 verschwunden.

**Schritt 7.1.** Erst nachsehen, dann löschen. Dies ist ein Teamprojekt; der Code stammt aus der
FR-1-Phase und hat einen Autor:

    git log --oneline -- frontend/src/app/goals/

Den Befund im Pull Request nennen, damit niemand den Eindruck bekommt, hier werde fremde Arbeit
kommentarlos entsorgt. Die Arbeit ist nicht verloren: Sie lebt inhaltlich in
`frontend/src/app/features/goals/goals.ts` weiter, und der Git-Verlauf behält sie ohnehin.

**Schritt 7.2.** Nachweisen, dass wirklich niemand den Ordner benutzt:

    cd frontend
    npx rg "app/goals|goal-list|goal-form" src/

Erwartet: Treffer ausschließlich **innerhalb** von `src/app/goals/` selbst sowie eine Zeile in
`src/styles.scss` (`.goal-form .btn`, ein Stilname, kein Import) und der Verweis auf
`./features/goals/goals` in `src/app/app.routes.ts`. Gibt es einen Treffer außerhalb, **nicht
löschen**, sondern erst klären, wer den Code benutzt.

Steht `rg` nicht zur Verfügung, tut es auch die Suche der IDE über `frontend/src`.

**Schritt 7.3.** Löschen. Im Repository-Wurzelverzeichnis:

    git rm -r frontend/src/app/goals

Damit verschwinden `goal.model.ts`, `goal.service.ts`, `goal.service.spec.ts`, `goal-form/`
(drei Dateien) und `goal-list/` (vier Dateien).

**Schritt 7.4.** Prüfen:

    cd frontend
    ng lint
    ng test --watch=false

Erwartet: beides grün, und die Zahl der Tests sinkt sichtbar — die Specs des gelöschten Ordners
prüften Code, den die Anwendung nicht auslieferte. Die vorherige und die neue Zahl in
`Progress` notieren; sie gehört später in den Testabschlussbericht.

**Akzeptanz M7:** Der Ordner existiert nicht mehr, `ng lint` und `ng test --watch=false` sind grün,
und die Anwendung verhält sich im Browser unverändert.

### M8 — Backend-Tests für `/api/sessions` und `/api/plans`

Das ist der Meilenstein mit dem größten Wert für den Projektbericht: Er schließt die Lücke
zwischen dem, was `docs/MS4_Testabschlussbericht.md` behauptet, und dem, was tatsächlich geprüft
wird.

**Schritt 8.1.** Die doppelten Fixtures zusammenführen. „Fixture" heißt in pytest ein Stück
Vorbereitungscode, das ein Test per Parameter anfordert. `auth_header` (meldet einen Benutzer an
und liefert den Kopfzeileneintrag mit dem Zugriffstoken) und `goal_id` (legt ein Lernziel an)
stehen heute doppelt in `backend/tests/test_reminders.py` und `backend/tests/test_goals.py`.

In `backend/tests/conftest.py` unter die bestehenden Fixtures anfügen:

    from datetime import date, timedelta

    FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


    @pytest.fixture
    def auth_header(client):
        """Meldet einen frischen Benutzer an und liefert die Authorization-Kopfzeile.

        Jeder Test bekommt eine eigene Datenbank (siehe app-Fixture), deshalb
        genuegt eine feste E-Mail-Adresse.
        """
        resp = client.post(
            "/api/auth/register",
            json={"email": "test@example.de", "name": "Testperson", "password": "pass123"},
        )
        assert resp.status_code == 201, resp.get_json()
        return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


    @pytest.fixture
    def goal_id(client, auth_header):
        """Legt ein Lernziel an und liefert dessen id."""
        resp = client.post(
            "/api/goals",
            json={"title": "Testziel", "module_name": "TEST01", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        assert resp.status_code == 201, resp.get_json()
        return resp.get_json()["id"]

Die feste E-Mail-Adresse ist unbedenklich, weil die `app`-Fixture in derselben Datei für **jeden**
Test `_db.create_all()` und danach `_db.drop_all()` ausführt — jeder Test startet mit leerer
Datenbank.

Danach die nun überflüssigen Definitionen aus `test_reminders.py` und `test_goals.py` entfernen.
Achtung: `test_reminders.py` benutzt in seiner Fixture die Adresse `erinnerung@example.de`; nach
dem Umzug gilt überall `test@example.de`. Kein Test prüft die Adresse, geprüft mit einer Suche nach
`erinnerung@example.de`.

**Schritt 8.2.** Neue Datei `backend/tests/test_sessions.py`:

    """Prueft die Stoppuhr: Start, Pause, Fortsetzen, Stopp (FR-4.1 bis FR-4.3).

    Der Kern ist die Pausenrechnung: Nur ungestoerte Lernzeit soll zaehlen.
    Weil sich Zeitpunkte in der Vergangenheit ueber die Schnittstelle nicht
    erzeugen lassen - der Timer kennt nur "jetzt" - schreiben die Tests, die
    eine Dauer brauchen, direkt in die Datenbank. Dasselbe Verfahren benutzt
    bereits backend/tests/test_reminders.py.
    """

    from datetime import datetime, timedelta, timezone

    from app.extensions import db
    from app.models.study_session import StudySession

    SESSIONS_URL = "/api/sessions"


    def _now_utc() -> datetime:
        """Naives UTC - genau das Format, in dem die Anwendung speichert."""
        return datetime.now(timezone.utc).replace(tzinfo=None)


    def test_start_returns_201_and_active_status(client, auth_header, goal_id):
        resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "active"


    def test_start_twice_returns_409(client, auth_header, goal_id):
        client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        assert resp.status_code == 409
        assert "session" in resp.get_json()


    def test_start_with_unknown_goal_returns_404(client, auth_header):
        resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": 999999}, headers=auth_header)
        assert resp.status_code == 404


    def test_start_without_goal_returns_400(client, auth_header):
        resp = client.post(f"{SESSIONS_URL}/start", json={}, headers=auth_header)
        assert resp.status_code == 400


    def test_pause_sets_status_and_resume_clears_it(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]

        pause = client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)
        assert pause.status_code == 200
        assert pause.get_json()["status"] == "paused"
        assert pause.get_json()["paused_at"] is not None

        resume = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
        assert resume.status_code == 200
        assert resume.get_json()["status"] == "active"
        assert resume.get_json()["paused_at"] is None


    def test_pause_of_paused_session_returns_409(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]
        client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

        resp = client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)
        assert resp.status_code == 409


    def test_resume_of_running_session_returns_409(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]

        resp = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
        assert resp.status_code == 409


    def test_resume_adds_paused_time(client, auth_header, goal_id):
        """Die Pausendauer wird beim Fortsetzen aufaddiert (FR-4.3)."""
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]
        client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

        # Die Pause 120 Sekunden zurueckdatieren, statt zwei Minuten zu warten.
        session = db.session.get(StudySession, sid)
        session.paused_at = _now_utc() - timedelta(seconds=120)
        db.session.commit()

        resp = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
        assert resp.status_code == 200
        assert resp.get_json()["total_paused_seconds"] >= 120


    def test_stop_subtracts_paused_time_from_duration(client, auth_header, goal_id):
        """Der Kern von FR-4.3: Nur ungestoerte Zeit zaehlt als Lernzeit."""
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]

        # Start 10 Minuten zurueckdatieren, davon 4 Minuten Pause.
        session = db.session.get(StudySession, sid)
        session.started_at = _now_utc() - timedelta(minutes=10)
        session.total_paused_seconds = 240
        db.session.commit()

        resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["status"] == "completed"
        # 600 Sekunden brutto minus 240 Sekunden Pause = 360 Sekunden netto.
        assert 355 <= body["duration_seconds"] <= 365


    def test_stop_while_paused_counts_the_open_pause(client, auth_header, goal_id):
        """Wird waehrend einer Pause gestoppt, zaehlt auch diese Pause nicht mit."""
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]
        client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

        session = db.session.get(StudySession, sid)
        session.started_at = _now_utc() - timedelta(minutes=10)
        session.paused_at = _now_utc() - timedelta(minutes=4)
        db.session.commit()

        resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
        assert resp.status_code == 200
        assert 355 <= resp.get_json()["duration_seconds"] <= 365


    def test_stop_twice_returns_409(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]
        client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)

        resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
        assert resp.status_code == 409


    def test_stop_stores_note(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]

        resp = client.post(
            f"{SESSIONS_URL}/{sid}/stop", json={"note": "Kapitel 3 wiederholt"}, headers=auth_header
        )
        assert resp.status_code == 200
        assert resp.get_json()["note"] == "Kapitel 3 wiederholt"


    def test_stop_rejects_overlong_note(client, auth_header, goal_id):
        start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
        sid = start.get_json()["id"]

        resp = client.post(
            f"{SESSIONS_URL}/{sid}/stop", json={"note": "x" * 501}, headers=auth_header
        )
        assert resp.status_code == 400


    def test_active_returns_204_when_nothing_runs(client, auth_header):
        resp = client.get(f"{SESSIONS_URL}/active", headers=auth_header)
        assert resp.status_code == 204


    def test_list_rejects_invalid_limit(client, auth_header):
        """Ein unsinniger Abfrageparameter darf keinen Serverfehler ausloesen (M1)."""
        resp = client.get(f"{SESSIONS_URL}?limit=abc", headers=auth_header)
        assert resp.status_code == 400
        assert "error" in resp.get_json()

**Schritt 8.3.** Neue Datei `backend/tests/test_plans.py`:

    """Prueft die geplanten Lernzeiten (FR-2.1, FR-3.1).

    Ein Planungseintrag ohne Tag ist eine Monatsplanung (Grobplanung), einer mit
    Tag eine konkrete Detailplanung. Beides teilt sich dieselbe Tabelle.
    """

    from datetime import date

    PLANS_URL = "/api/plans"

    HEUTE = date.today()


    def _slot(goal_id: int, **overrides) -> dict:
        payload = {
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "day": 15,
            "duration_minutes": 90,
        }
        payload.update(overrides)
        return payload


    def test_create_and_list(client, auth_header, goal_id):
        resp = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
        assert resp.status_code == 201
        assert resp.get_json()["duration_minutes"] == 90

        liste = client.get(PLANS_URL, headers=auth_header)
        assert liste.status_code == 200
        assert len(liste.get_json()) == 1


    def test_create_without_day_is_a_month_plan(client, auth_header, goal_id):
        """Grobplanung: ein Eintrag fuer den ganzen Monat, ohne festen Tag."""
        resp = client.post(PLANS_URL, json=_slot(goal_id, day=None), headers=auth_header)
        assert resp.status_code == 201
        assert resp.get_json()["day"] is None


    def test_create_with_unknown_goal_returns_404(client, auth_header):
        resp = client.post(PLANS_URL, json=_slot(999999), headers=auth_header)
        assert resp.status_code == 404


    def test_filter_by_month(client, auth_header, goal_id):
        client.post(PLANS_URL, json=_slot(goal_id, year=2026, month=8), headers=auth_header)
        client.post(PLANS_URL, json=_slot(goal_id, year=2026, month=9), headers=auth_header)

        resp = client.get(f"{PLANS_URL}?year=2026&month=9", headers=auth_header)
        assert resp.status_code == 200
        assert len(resp.get_json()) == 1
        assert resp.get_json()[0]["month"] == 9


    def test_filter_by_goal(client, auth_header, goal_id):
        client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)

        resp = client.get(f"{PLANS_URL}?goal_id={goal_id}", headers=auth_header)
        assert len(resp.get_json()) == 1

        leer = client.get(f"{PLANS_URL}?goal_id={goal_id + 999}", headers=auth_header)
        assert leer.get_json() == []


    def test_invalid_query_parameter_returns_400(client, auth_header):
        """Frueher HTTP 500 - siehe Meilenstein M1 dieses Plans."""
        for adresse in (f"{PLANS_URL}?year=abc", f"{PLANS_URL}?month=13", f"{PLANS_URL}?goal_id=x"):
            resp = client.get(adresse, headers=auth_header)
            assert resp.status_code == 400, adresse
            assert "error" in resp.get_json()


    def test_update_changes_duration_and_note(client, auth_header, goal_id):
        angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
        sid = angelegt.get_json()["id"]

        resp = client.put(
            f"{PLANS_URL}/{sid}",
            json={"duration_minutes": 120, "note": "Kapitel 3 lesen"},
            headers=auth_header,
        )
        assert resp.status_code == 200
        assert resp.get_json()["duration_minutes"] == 120
        assert resp.get_json()["note"] == "Kapitel 3 lesen"


    def test_delete_removes_the_slot(client, auth_header, goal_id):
        angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
        sid = angelegt.get_json()["id"]

        resp = client.delete(f"{PLANS_URL}/{sid}", headers=auth_header)
        assert resp.status_code == 204
        assert client.get(PLANS_URL, headers=auth_header).get_json() == []


    def test_foreign_slot_is_not_reachable(client, auth_header, goal_id):
        """Fremde Datensaetze liefern 404, nicht 403 - die Existenz wird nicht verraten."""
        angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
        sid = angelegt.get_json()["id"]

        zweiter = client.post(
            "/api/auth/register",
            json={"email": "fremd@example.de", "name": "Fremd", "password": "pass123"},
        )
        fremd_header = {"Authorization": f"Bearer {zweiter.get_json()['access_token']}"}

        assert client.put(f"{PLANS_URL}/{sid}", json={"duration_minutes": 60},
                          headers=fremd_header).status_code == 404
        assert client.delete(f"{PLANS_URL}/{sid}", headers=fremd_header).status_code == 404

**Schritt 8.4.** Ausführen:

    cd backend
    ruff check .
    pytest -q

Erwartet: `All checks passed!` und etwa `66 passed` (42 nach M4, plus 15 in `test_sessions.py`,
plus 9 in `test_plans.py`). Die genaue Zahl in `Progress` festhalten.

**Der wichtigste Nachweis dieses Meilensteins:** `test_stop_subtracts_paused_time_from_duration`
und `test_invalid_query_parameter_returns_400` schlagen fehl, wenn man M1 zurückdreht bzw. wenn
die Pausenrechnung falsch wäre. Wer das belegen will, kommentiert testweise in
`backend/app/routes/sessions.py` die Zeile

    session.duration_seconds = max(0, total_elapsed - (session.total_paused_seconds or 0))

zu `session.duration_seconds = total_elapsed` um und lässt `pytest -q` laufen: Der Test muss rot
werden. Danach die Änderung rückgängig machen. Diese Gegenprobe ist der Beleg dafür, dass der Test
wirklich etwas prüft — sie gehört als Ausgabe in `Artifacts and Notes`.

**Akzeptanz M8:** `pytest` ist grün; `backend/tests/test_sessions.py` enthält einen Test, der
belegt, dass pausierte Zeit nicht als Lernzeit gezählt wird, und dieser Test wird rot, wenn man
den Abzug im Code entfernt.

### M9 — Ehrlicher Löschhinweis und Dokumentation

**Schritt 9.1.** In `frontend/src/app/features/goals/goals.ts` in `remove()` den Text erweitern:

      async remove(goal: Goal): Promise<void> {
        const frage =
          `Lernziel "${goal.title}" wirklich löschen?\n\n` +
          'Damit werden auch alle geplanten Lernzeiten und alle bereits erfassten ' +
          'Lernsessions dieses Ziels gelöscht. Die erfasste Lernzeit verschwindet ' +
          'dadurch rückwirkend aus dem Dashboard.';
        if (!confirm(frage)) return;
        await this.goalService.delete(goal.id);
        this.goals.update(gs => gs.filter(g => g.id !== goal.id));
      }

Der Hinweis ist nicht kosmetisch: `backend/app/models/goal.py` verknüpft `plan_slots` und
`study_sessions` mit `cascade="all, delete-orphan"`. Beim Löschen eines Ziels verschwindet damit
die gesamte dafür erfasste Lernzeit, und die Zahlen im Dashboard ändern sich rückwirkend.

**Schritt 9.2.** `README.md` aktualisieren — das ist laut `CLAUDE.md` Pflicht im selben Commit, in
dem die Aussage falsch wird, nicht später:

- Im Statusabsatz ergänzen, dass Lernziele vollständig bearbeitbar sind, eine optionale Priorität
  tragen und zu einem erreichten Ziel Note und Notiz gespeichert werden können, und dass eine
  Lernsession beim Stoppen eine Notiz aufnehmen kann.
- Im Abschnitt „Geltende Wertebereiche der API" die neuen Grenzen nachtragen: Priorität ist
  `high`, `medium` oder `low` oder leer; die Note ist höchstens 10 Zeichen lang; die Ergebnis-Notiz
  und die Session-Notiz sind höchstens 500 Zeichen lang; Abfrageparameter von `/api/plans` und
  `/api/sessions` werden geprüft und mit HTTP 400 abgelehnt, wenn sie keine Zahl im erlaubten
  Bereich sind.
- Im Abschnitt „Migrationen" ergänzen, dass es jetzt zwei Migrationen gibt, `0001_ms4_initial_schema.py`
  und `0002_goal_prioritaet_und_ergebnis.py`, und dass nach jedem `git pull` weiterhin
  `flask db upgrade` fällig ist.

**Schritt 9.3.** `AGENTS.md` berichtigen. Der Abschnitt „Current phase" behauptet dort noch
„No feature code exists yet — there are no database tables and no application screens" und
„Authentication is still open". Beides ist seit MS4 falsch und führt jedes KI-Werkzeug in die Irre,
das die Datei als Einstieg liest. Den Absatz durch eine Beschreibung des tatsächlichen Standes
ersetzen: vier Tabellen, Anmeldung über ein JWT-Zugriffstoken, sechs Bildschirme
(Anmeldung, Registrierung, Dashboard, Lernziele, Planung, Timer).

**Schritt 9.4.** `docs/MS4_Testabschlussbericht.md` berichtigen: Die Angabe zur Zahl der Tests
stimmt nach M7 und M8 nicht mehr. Die neuen Zahlen aus den Läufen von `pytest` und
`ng test --watch=false` eintragen und in einem Satz vermerken, dass die Stoppuhr jetzt auch im
Backend automatisiert geprüft wird.

**Schritt 9.5.** Die Playwright-Tests von Hand grün machen. Sie laufen **nicht** in der CI und
brechen voraussichtlich, weil `frontend/e2e/goals.spec.ts` mit `page.getByLabel('Titel')` arbeitet
und es nach M5 zwei Felder mit dieser Beschriftung geben kann, sobald ein Ziel bearbeitet wird —
Playwright meldet das als „strict mode violation: resolved to 2 elements".

Absichern lässt sich das, indem der Zugriff auf die Anlegekarte eingegrenzt wird:

    const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
    await anlegen.getByLabel('Titel').fill('Mathematik I');

Ausführen bei laufender Anwendung (Backend und Frontend gestartet):

    cd frontend
    npx playwright test

Erwartet: `13 passed`. Ein Testlauf, der die Anwendung nicht erreicht, endet mit
`net::ERR_CONNECTION_REFUSED` — dann läuft `ng serve` oder `flask run` nicht.

**Akzeptanz M9:** Der Löschdialog nennt die mitgelöschte Lernzeit; `README.md`, `AGENTS.md` und
`docs/MS4_Testabschlussbericht.md` beschreiben den tatsächlichen Stand; `npx playwright test` ist
grün.

## Validation and Acceptance

Nach Abschluss aller Meilensteine, der Reihe nach. Im Repository-Wurzelverzeichnis:

    docker compose up -d
    cd backend
    .\.venv\Scripts\Activate.ps1
    flask db upgrade
    ruff check .
    pytest

Erwartet: `All checks passed!` und ein grüner Testlauf mit deutlich mehr als den 37 Tests, mit
denen dieser Plan begonnen hat.

    cd ..\frontend
    ng lint
    ng test --watch=false

Erwartet: beides grün.

Danach die Anwendung starten (`flask run --debug` in `backend/`, `ng serve` in `frontend/`) und
diese sieben Punkte von Hand durchgehen. Ein grüner Testlauf ist kein Nachweis für die Oberfläche.

1. Registrieren, anmelden, ein Lernziel „Statistik II" mit Priorität „hoch" anlegen. Erwartung:
   Das Ziel erscheint in der Liste, das Kennzeichen „⚑ Priorität: hoch" ist sichtbar, und nach `F5`
   steht beides noch da.
2. Auf „✎ Bearbeiten" klicken, den Titel auf „Statistik II — Klausur" ändern und das Zieldatum um
   einen Monat verschieben, speichern. Erwartung: Die Karte zeigt beide neuen Werte; nach `F5`
   ebenfalls.
3. Dasselbe Ziel auf „erreicht" setzen, Note „1,7" und die Notiz „Altklausuren waren entscheidend."
   eintragen, speichern. Erwartung: „🏅 Note: 1,7" und die Notizzeile erscheinen auf der Karte.
4. Ein zweites Ziel anlegen, dessen Zieldatum von Hand in pgAdmin auf gestern setzen
   (`UPDATE goals SET target_date = CURRENT_DATE - 1 WHERE title = '...';`), dann im Browser
   bearbeiten und nur den Titel ändern. Erwartung: Speichern gelingt, HTTP 200. Vor diesem Plan
   scheiterte derselbe Vorgang mit HTTP 400.
5. Auf `/timer` eine Session starten, pausieren, etwa 20 Sekunden warten, fortsetzen, weitere
   10 Sekunden laufen lassen, Notiz „Kapitel 3" eintragen, stoppen. Erwartung: Die im Verlauf
   angezeigte Dauer liegt bei etwa 10 Sekunden, nicht bei 30 — die Pause zählt nicht mit. Die
   Notiz steht unter dem Eintrag.
6. Im Browser http://localhost:5000/api/plans?year=abc aufrufen, während man angemeldet ist
   (einfacher: den Test `test_invalid_query_parameter_returns_400` als Beleg nehmen). Erwartung:
   HTTP 400 mit deutscher Meldung, kein Serverfehler.
7. Ein Ziel löschen. Erwartung: Der Bestätigungsdialog nennt ausdrücklich die mitgelöschten
   Planungen und Lernsessions.

Zum Schluss:

    cd frontend
    npx playwright test

Erwartet: `13 passed`.

Ein Merge nach `main` erfolgt erst, wenn die GitHub-Actions-Pipeline grün ist und ein anderes
Teammitglied den Pull Request geprüft hat. Redmine (https://redmine-se.iubh.de/) bleibt das
maßgebliche System: Eine Anforderung gilt erst als geliefert, wenn das Ticket dort steht.

## Idempotence and Recovery

Alle Schritte sind mehrfach ausführbar. `flask db upgrade` erkennt an der Tabelle `alembic_version`,
welche Migrationen bereits gelaufen sind, und tut beim zweiten Aufruf nichts. `docker compose up -d`
ist ebenfalls wiederholbar.

Die einzige nicht selbstheilende Stelle ist die Migration in M3. Geht dort etwas schief:

    flask db downgrade
    flask db upgrade

Hilft das nicht, ist die lokale Datenbank vollständig zurücksetzbar — sie enthält nur Testdaten:

    docker compose down -v
    docker compose up -d
    cd backend
    flask db upgrade

`docker compose down -v` löscht das Datenvolumen `pgdata` und damit alle lokalen Daten. Das ist im
Entwicklungsbetrieb unbedenklich, auf Railway aber niemals anzuwenden.

Die Löschung in M7 ist über Git rückholbar (`git checkout HEAD~1 -- frontend/src/app/goals`),
solange der Commit nicht verworfen wurde.

Nach Abschluss bleibt die Umgebung sauber: keine temporären Dateien, keine geänderten
Konfigurationen, keine zusätzlichen Abhängigkeiten. `backend/requirements.txt` und
`frontend/package.json` werden von diesem Plan **nicht** angefasst.

## Artifacts and Notes

Hier gehören die Belege hinein, sobald die Arbeit läuft. Mindestens erwartet werden:

- Die Ausgabe von `pytest -q` vor dem ersten und nach dem letzten Meilenstein, damit die Zunahme
  der Testzahl belegt ist.
- Die Ausgabe von `flask db upgrade` aus M3.
- Das Ergebnis der SQL-Abfrage aus Schritt 3.3, das die drei neuen Spalten zeigt.
- Die Gegenprobe aus M8: die rote Testausgabe, nachdem der Pausenabzug versuchsweise entfernt
  wurde. Sie ist der eigentliche Beweis, dass der neue Test etwas prüft. Erwartete Form:

      FAILED tests/test_sessions.py::test_stop_subtracts_paused_time_from_duration
      assert 355 <= 600 <= 365

- Die Zahl der Frontend-Tests vor und nach M7.

## Interfaces and Dependencies

Dieser Plan führt **keine** neue Bibliothek ein. Alles Nötige ist vorhanden: Flask, Flask-SQLAlchemy,
Flask-Migrate, Flask-JWT-Extended und Flask-CORS im Backend (`backend/requirements.txt`), Angular
mit `FormsModule` und `HttpClient` im Frontend, `pytest` und `ruff` als Entwicklungswerkzeuge
(`backend/requirements-dev.txt`), `vitest` als Testläufer des Frontends (gestartet über `ng test`).

Am Ende dieses Plans müssen die folgenden Schnittstellen existieren.

In `backend/app/validation.py`:

    def optional_int_arg(value, field_label: str, minimum: int, maximum: int) -> int | None: ...
    def require_future_date(value, field_label: str, current: date | None = None) -> date: ...

In `backend/app/models/goal.py`:

    VALID_PRIORITIES = ("high", "medium", "low")

    class Goal(db.Model):
        priority: str | None      # db.String(10), nullable
        grade: str | None         # db.String(10), nullable
        result_note: str | None   # db.String(500), nullable

`Goal.to_dict()` liefert zusätzlich die Schlüssel `priority`, `grade` und `result_note`.

In `frontend/src/app/core/models/index.ts` trägt `Goal` die Felder
`priority: 'high' | 'medium' | 'low' | null`, `grade: string | null` und
`result_note: string | null`.

In `frontend/src/app/core/validation.ts`:

    export function validateTargetDate(value: string, current?: string): string | null

In `frontend/src/app/features/goals/goals.ts` besitzt `GoalsComponent` die öffentlichen Methoden
`startEdit(goal: Goal): void`, `cancelEdit(): void`, `saveEdit(): Promise<void>` und
`priorityLabel(priority: string | null): string`.

Neue Dateien: `backend/migrations/versions/0002_goal_prioritaet_und_ergebnis.py`,
`backend/tests/test_sessions.py`, `backend/tests/test_plans.py`.

Entfernte Dateien: der gesamte Ordner `frontend/src/app/goals/`.

Unverändert bleiben: `backend/app/routes/dashboard.py` (der ECTS-Faktor bleibt bei 30 Stunden,
siehe Decision Log), `backend/app/routes/auth.py`, `backend/app/time_utils.py`,
`docker-compose.yml`, `nixpacks.toml`, `railway.json` und `.github/workflows/ci.yml`.

## Änderungsnotizen

- 2026-08-17: Plan angelegt. Grundlage ist eine Prüfung des gesamten Repositories gegen
  `docs/01_Funktionale_Anforderungen.md` und die Entwürfe in `docs/design-reference/html`. Der
  Zuschnitt (Defekte **und** Oberflächenlücken, Priorität reaktivieren statt löschen, ECTS-Faktor
  unverändert bei 30 Stunden) beruht auf den vier Teamentscheidungen, die im `Decision Log`
  festgehalten sind. Zwei verwandte Arbeiten sind bewusst in eigene Pläne ausgelagert:
  `2026-08-17_P5-FR-3.2-Zwischenziele.md` setzt die letzte offene Must-Anforderung um,
  `2026-08-17_P6-Abgleich-Entwuerfe-Anforderungen.md` liefert die Aufstellung, was gegenüber den
  Gestaltungsentwürfen noch fehlt.

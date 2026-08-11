# P1: Eingaben prüfen statt Unsinn speichern (E-Mail, ECTS, Datum, Zeitangaben)

Dieses Dokument ist ein lebendes Dokument ("ExecPlan"). Die Abschnitte `Progress`,
`Surprises & Discoveries`, `Decision Log` und `Outcomes & Retrospective` müssen während der
Arbeit laufend aktualisiert werden. Die verbindlichen Regeln für dieses Dokument stehen in
[`docs/PLANS.md`](../../PLANS.md); dieser Plan ist gemäß jener Datei zu pflegen.

## Purpose / Big Picture

Die Anwendung nimmt derzeit fast jede Eingabe an. Man kann sich mit der „E-Mail-Adresse" `test`
registrieren, ein Lernziel mit **minus fünf** ECTS-Punkten anlegen, eine Lernzeit am **45. Tag**
eines Monats für **minus 120 Minuten** einplanen und als Uhrzeit den Text `abc` speichern. Bei
einem Lernziel-Titel mit mehr als 255 Zeichen stürzt die Anwendung in der Produktivumgebung sogar
ab, weil die Datenbankspalte kürzer ist als die Eingabe.

Nach Abschluss dieses Plans lehnt der Server jede dieser Eingaben mit dem Status 400 und einer
verständlichen deutschen Meldung ab, und das Formular im Browser zeigt die Meldung direkt unter dem
betroffenen Feld an, mit rotem Rahmen. Sobald man den Wert korrigiert, verschwindet die Markierung
wieder — das war ein offener Punkt aus dem Testprotokoll.

Der Nachweis erfolgt über neue automatisierte Tests (Backend: `pytest`, Frontend: `ng test`), die
vor der Änderung fehlschlagen und danach durchlaufen, sowie über einen manuellen Durchgang im
Browser, der unten Schritt für Schritt beschrieben ist.

## Progress

- [ ] Schritt 1: Ist-Zustand mit dem Prüfskript aus dem Abschnitt `Artifacts and Notes`
      reproduzieren (erwartet: lauter HTTP 201, wo 400 stehen müsste).
- [ ] Schritt 2: Neue Datei `backend/app/validation.py` anlegen.
- [ ] Schritt 3: Fehlerbehandlung für `ValidationError` in `backend/app/__init__.py` registrieren.
- [ ] Schritt 4: `backend/app/routes/auth.py` auf die Prüfungen umstellen.
- [ ] Schritt 5: `backend/app/routes/goals.py` auf die Prüfungen umstellen.
- [ ] Schritt 6: `backend/app/routes/plans.py` auf die Prüfungen umstellen.
- [ ] Schritt 7: Neue Testdatei `backend/tests/test_validation.py` anlegen und `pytest` ausführen
      (erwartet: 13 alte plus 35 neue Testfälle bestanden, zusammen 48).
- [ ] Schritt 8: Neue Datei `frontend/src/app/core/validation.ts` samt Testdatei anlegen.
- [ ] Schritt 9: Fehleranzeige in `register.ts`, `goals.ts` und `planning.ts` einbauen.
- [ ] Schritt 10: Zwei CSS-Regeln in `frontend/src/styles.scss` ergänzen.
- [ ] Schritt 11: Frontend-Tests und Linting ausführen, manuellen Browser-Durchgang machen.
- [ ] Schritt 12: `README.md` um die geltenden Wertebereiche ergänzen.
- [ ] Schritt 13: Committen und diesen Plan nach `docs/ExecPlans/completed/` verschieben.

## Surprises & Discoveries

- Beobachtung: Die HTML-Attribute `min`, `max`, `minlength` und `type="email"` in den Formularen
  sind wirkungslos. Angular hängt an jedes Formular mit `ngModel` automatisch das Attribut
  `novalidate`, wodurch der Browser seine eingebaute Prüfung abschaltet. Die Attribute stehen
  bereits im Code (zum Beispiel `min="1" max="31"` in
  `frontend/src/app/features/planning/planning.ts`, Zeile 57) und wiegen in falscher Sicherheit.
  Die Prüfung muss deshalb ausdrücklich in TypeScript geschrieben werden.

- Beobachtung: `ects: 0` wird stillschweigend zu `5`. Ursache ist Zeile 30 in
  `backend/app/routes/goals.py`: `int(data.get("ects") or 5)`. In Python gilt die Zahl `0` als
  „unwahr", weshalb der Ausdruck `0 or 5` den Wert `5` liefert. Wer also 0 ECTS einträgt, bekommt
  ohne Hinweis ein Ziel mit 5 ECTS.
  Evidence (Aufruf gegen die laufende Testkonfiguration, 11.08.2026):

      ECTS = 0   -> HTTP 201  {'ects': 5, ...}

- Beobachtung: Ein zu langer Titel fällt in den Tests **nicht** auf, weil `pytest` gegen SQLite
  läuft (`backend/app/config.py`, `TestingConfig`, `sqlite:///:memory:`) und SQLite Längen von
  `VARCHAR` nicht durchsetzt. PostgreSQL tut das sehr wohl und antwortet mit einem Serverfehler
  (HTTP 500). Die Prüfung muss deshalb in der Anwendung stattfinden, nicht in der Datenbank.
  Evidence:

      Titel 5000 Zeichen (Spalte = 255)   -> HTTP 201   (SQLite; unter PostgreSQL: 500)

- Beobachtung: Die API akzeptiert `planned_time: "abc"`, obwohl die Spalte `planned_time` in
  `backend/app/models/plan_slot.py` als `String(5)` deklariert ist und ein Format „HH:MM" erwartet.

## Decision Log

- Decision: Die Prüfungen werden in einer eigenen Datei `backend/app/validation.py` gebündelt und
  werfen eine eigene Ausnahme `ValidationError`, die zentral in `create_app` zu einer Antwort mit
  Status 400 umgewandelt wird.
  Rationale: Ohne zentrale Behandlung müsste jede einzelne Route dieselben `if`-Blöcke und
  `jsonify`-Aufrufe wiederholen. Der zentrale Weg hält die Routen lesbar und stellt sicher, dass
  jede Verletzung dasselbe Antwortformat `{"error": "..."}` erzeugt, das das Frontend bereits
  auswertet (siehe `err?.error?.error` in den Komponenten).
  Date/Author: 2026-08-11, Julian

- Decision: Ein Zieldatum in der Vergangenheit wird abgelehnt (400), ein Datum weiter als zehn
  Jahre in der Zukunft ebenfalls.
  Rationale: FR-1.1 in `docs/01_Funktionale_Anforderungen.md` beschreibt Lernziele als
  vorausschauende Planung über mindestens sechs Monate; ein Ziel in der Vergangenheit kann
  definitionsgemäß nicht mehr geplant werden. Die Zehnjahresgrenze fängt Tippfehler wie „2260" ab.
  Wichtig: Beim Ändern eines bestehenden Ziels wird das Datum nur geprüft, wenn es überhaupt
  mitgeschickt wird — sonst könnte man den Status eines alten Ziels nicht mehr auf „erreicht"
  setzen.
  Date/Author: 2026-08-11, Julian

- Decision: Beim Anmelden (`POST /api/auth/login`) wird das E-Mail-Format **nicht** geprüft.
  Rationale: Beim Anmelden ist jede falsche Eingabe gleich zu behandeln, damit von außen nicht
  erkennbar ist, ob eine Adresse registriert ist. Die Antwort bleibt in allen Fällen 401.
  Date/Author: 2026-08-11, Julian

- Decision: Die Formulare bleiben sogenannte vorlagengesteuerte Formulare (`ngModel`); es wird
  nicht auf „Reactive Forms" umgestellt.
  Rationale: Die Umstellung wäre eine große Änderung an drei Komponenten mit hohem Risiko kurz vor
  der Abgabe. Der gewählte Weg — eine Sammlung reiner Prüffunktionen plus ein Fehler-Wörterbuch je
  Komponente — erreicht dasselbe sichtbare Ergebnis und ist zudem ohne Browser testbar.
  Date/Author: 2026-08-11, Julian

## Outcomes & Retrospective

(Wird bei Abschluss ausgefüllt.)

## Context and Orientation

Das Repository enthält den „Lernzeit-Manager", eine Web-Anwendung aus zwei Teilen im selben
Repository.

Das **Backend** unter `backend/` ist in Python mit dem Rahmenwerk Flask geschrieben. Eine „Route"
ist dort eine Funktion, die eine Adresse bedient, zum Beispiel `POST /api/goals`. Die Routen liegen
in `backend/app/routes/`: `auth.py` (Registrieren, Anmelden), `goals.py` (Lernziele), `plans.py`
(geplante Lernzeiten), `sessions.py` (Timer) und `dashboard.py` (Übersicht). Die Datenmodelle, also
die Beschreibung der Datenbanktabellen, liegen in `backend/app/models/`. Zusammengebaut wird die
Anwendung in `backend/app/__init__.py` in der Funktion `create_app`.

Das **Frontend** unter `frontend/` ist in TypeScript mit Angular 22 geschrieben. Eine „Komponente"
ist eine Bildschirmseite oder ein Baustein daraus, bestehend aus Anzeigevorlage und Logik in einer
Datei. Für diesen Plan sind drei Komponenten betroffen:
`frontend/src/app/features/auth/register/register.ts` (Registrierung),
`frontend/src/app/features/goals/goals.ts` (Lernziele anlegen) und
`frontend/src/app/features/planning/planning.ts` (Lernzeit einplanen).

Ein **Signal** ist in Angular ein Wert, der weiß, wer ihn liest; ändert man ihn mit `.set(...)`,
zeichnet Angular die Anzeige neu. Gelesen wird er durch Aufruf: `meinSignal()`. Die drei
Komponenten benutzen dieses Mittel bereits, zum Beispiel `createError = signal('')`.

**Wichtiger Hinweis zur Reihenfolge:** Dieser Plan setzt nicht voraus, dass der Plan
`docs/ExecPlans/active/2026-08-11_P0-Session-Persistenz-und-Navbar.md` bereits umgesetzt ist. Ist
P0 noch offen, wirst du beim manuellen Browser-Test nach jedem Reload abgemeldet; melde dich dann
einfach erneut an. Die erwartete Gesamtzahl der Frontend-Tests unterscheidet sich je nachdem: ohne
P0 sind es 18 Tests, von denen einer (`app.spec.ts`) aus einem anderen Grund rot ist, mit P0 sind
es 21 grüne. Rechne die in diesem Plan neu hinzukommenden Tests auf den jeweiligen Stand auf.

## Plan of Work

Zuerst entsteht im Backend eine Datei mit kleinen Prüffunktionen. Jede Funktion prüft genau eine
Sache, gibt bei Erfolg den bereinigten Wert zurück und wirft sonst eine `ValidationError` mit
einer deutschen Meldung. In `create_app` wird einmalig festgelegt, dass eine solche Ausnahme zu
einer Antwort mit Status 400 wird. Danach werden die drei betroffenen Routendateien auf diese
Funktionen umgestellt; dabei verschwinden die bisherigen, unvollständigen `if`-Prüfungen.

Anschließend entsteht im Frontend eine Datei mit denselben Regeln in TypeScript. Diese Funktionen
sind rein, das heißt: Sie bekommen einen Wert und geben eine Fehlermeldung oder `null` zurück, ohne
irgendetwas anderes anzufassen. Genau deshalb lassen sie sich ohne Browser testen. Die drei
Komponenten bekommen ein Fehler-Wörterbuch als Signal, füllen es beim Absenden und leeren den
jeweiligen Eintrag, sobald der Wert wieder geändert wird.

Zum Schluss werden zwei CSS-Regeln ergänzt, damit ein fehlerhaftes Feld einen roten Rahmen und eine
rote Meldung darunter bekommt.

## Concrete Steps

### Schritt 1: Ist-Zustand reproduzieren

Öffne eine PowerShell im Repository-Wurzelverzeichnis
`D:\Programmieren\Projects\Projekt-Lernzeit_Manager`. Für diesen Schritt wird **kein** Docker
gebraucht, weil das Prüfskript die Testkonfiguration mit einer Datenbank im Arbeitsspeicher
benutzt.

Lege die Datei `backend/tools/pruefe_validierung.py` mit dem Inhalt an, der unten im Abschnitt
`Artifacts and Notes` vollständig abgedruckt ist. Der Ordner `backend/tools` existiert noch nicht;
lege ihn mit an. Führe dann aus:

    cd backend
    .\.venv\Scripts\Activate.ps1
    $env:PYTHONPATH = "D:\Programmieren\Projects\Projekt-Lernzeit_Manager\backend"
    python tools\pruefe_validierung.py

Existiert `backend\.venv` nicht, lege sie zuerst an: `python -m venv .venv`, dann
`.\.venv\Scripts\Activate.ps1`, dann `pip install -r requirements-dev.txt`.

Erwartete Ausgabe **vor** der Änderung (gekürzt) — überall dort, wo „SOLL 400" steht, kommt heute
fälschlich 201:

    E-Mail ohne Domain ('test')          SOLL 400 -> IST 201  FEHLT
    ECTS negativ (-5)                    SOLL 400 -> IST 201  FEHLT
    ECTS = 0                             SOLL 400 -> IST 201  FEHLT
    Zieldatum in der Vergangenheit       SOLL 400 -> IST 201  FEHLT
    Titel 5000 Zeichen                   SOLL 400 -> IST 201  FEHLT
    Monat = 99                           SOLL 400 -> IST 201  FEHLT
    Tag = 45                             SOLL 400 -> IST 201  FEHLT
    Dauer = -120 Minuten                 SOLL 400 -> IST 201  FEHLT
    Uhrzeit = 'abc'                      SOLL 400 -> IST 201  FEHLT

Dieses Skript ist ein Hilfsmittel für den Fortschritt; am Ende von Schritt 7 wird es gelöscht, weil
dieselben Fälle dann als dauerhafte `pytest`-Tests vorliegen.

### Schritt 2: `backend/app/validation.py` anlegen

Lege die neue Datei mit **exakt** diesem Inhalt an:

    """Gemeinsame Pruefungen fuer eingehende Daten der REST-Schnittstelle.

    Jede Funktion prueft genau eine Sache. Bei Erfolg liefert sie den bereinigten
    Wert zurueck, sonst wirft sie ValidationError. Die Ausnahme wird in
    backend/app/__init__.py zentral in eine Antwort mit Status 400 uebersetzt.
    """

    import re
    from calendar import monthrange
    from datetime import date

    EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
    TIME_PATTERN = re.compile(r"^([01][0-9]|2[0-3]):[0-5][0-9]$")

    MAX_FUTURE_YEARS = 10


    class ValidationError(Exception):
        """Eine Eingabe verletzt eine fachliche Regel."""

        def __init__(self, message: str) -> None:
            super().__init__(message)
            self.message = message


    def _is_missing(value) -> bool:
        return value is None or (isinstance(value, str) and value.strip() == "")


    def require_text(value, field_label: str, max_length: int) -> str:
        """Pflichttext: nicht leer, nicht laenger als die Datenbankspalte."""
        if _is_missing(value):
            raise ValidationError(f"{field_label} darf nicht leer sein")
        text = str(value).strip()
        if len(text) > max_length:
            raise ValidationError(f"{field_label} darf hoechstens {max_length} Zeichen lang sein")
        return text


    def optional_text(value, field_label: str, max_length: int) -> str | None:
        if _is_missing(value):
            return None
        return require_text(value, field_label, max_length)


    def require_email(value) -> str:
        email = require_text(value, "E-Mail-Adresse", 255).lower()
        if not EMAIL_PATTERN.match(email):
            raise ValidationError("E-Mail-Adresse muss die Form name@domain.de haben")
        return email


    def require_password(value) -> str:
        if _is_missing(value):
            raise ValidationError("Passwort darf nicht leer sein")
        password = str(value)
        if len(password) < 6:
            raise ValidationError("Passwort muss mindestens 6 Zeichen haben")
        if len(password) > 128:
            raise ValidationError("Passwort darf hoechstens 128 Zeichen haben")
        return password


    def require_int_in_range(
        value, field_label: str, minimum: int, maximum: int, default: int | None = None
    ) -> int:
        """Ganze Zahl im erlaubten Bereich.

        Fehlt der Wert und ist ein Standardwert angegeben, wird dieser benutzt.
        Die Zahl 0 gilt ausdruecklich als vorhandener Wert - sie darf nicht
        stillschweigend durch den Standardwert ersetzt werden.
        """
        if _is_missing(value):
            if default is not None:
                return default
            raise ValidationError(f"{field_label} ist ein Pflichtfeld")
        try:
            number = int(value)
        except (TypeError, ValueError):
            raise ValidationError(f"{field_label} muss eine ganze Zahl sein") from None
        if number < minimum or number > maximum:
            raise ValidationError(
                f"{field_label} muss zwischen {minimum} und {maximum} liegen"
            )
        return number


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


    def require_day_of_month(value, year: int, month: int) -> int | None:
        """Tag im Monat, passend zur Laenge des Monats (Schaltjahre eingeschlossen)."""
        if _is_missing(value):
            return None
        last_day = monthrange(year, month)[1]
        return require_int_in_range(value, "Tag des Monats", 1, last_day)


    def optional_clock_time(value) -> str | None:
        """Uhrzeit im 24-Stunden-Format HH:MM, zum Beispiel 14:30."""
        if _is_missing(value):
            return None
        text = str(value).strip()
        if not TIME_PATTERN.match(text):
            raise ValidationError("Uhrzeit muss im Format HH:MM angegeben werden, zum Beispiel 14:30")
        return text

### Schritt 3: Fehlerbehandlung registrieren

Öffne `backend/app/__init__.py`. Die Funktion `create_app` beginnt derzeit so:

    def create_app(config_name: str = "development") -> Flask:
        app = Flask(__name__)
        app.config.from_object(config_by_name[config_name])

        CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:4200"]))

Ergänze in der Importzeile am Dateianfang die neue Ausnahme. Aus

    from .config import config_by_name
    from .extensions import db, jwt, migrate

wird

    from .config import config_by_name
    from .extensions import db, jwt, migrate
    from .validation import ValidationError

Füge danach direkt hinter dem `CORS(...)`-Aufruf diesen Block ein:

        @app.errorhandler(ValidationError)
        def _handle_validation_error(err: ValidationError):
            return jsonify({"error": err.message}), 400

Damit `jsonify` verfügbar ist, erweitere die vorhandene Zeile

    from flask import Flask, send_from_directory

zu

    from flask import Flask, jsonify, send_from_directory

### Schritt 4: `backend/app/routes/auth.py` umstellen

Die Funktion `register` sieht derzeit ab Zeile 10 so aus:

    @auth_bp.post("/api/auth/register")
    def register():
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()
        name = (data.get("name") or "").strip()
        password = data.get("password") or ""

        if not email or not name or not password:
            return jsonify({"error": "email, name und password sind Pflichtfelder"}), 400
        if len(password) < 6:
            return jsonify({"error": "Passwort muss mindestens 6 Zeichen haben"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "E-Mail bereits registriert"}), 409

Ersetze den Bereich von `email = ...` bis einschließlich der Zeile mit `len(password) < 6` durch:

        email = require_email(data.get("email"))
        name = require_text(data.get("name"), "Name", 255)
        password = require_password(data.get("password"))

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "E-Mail bereits registriert"}), 409

Ergänze oben den Import:

    from ..validation import require_email, require_password, require_text

Die Funktionen `login` und `me` bleiben unverändert. Insbesondere wird beim Anmelden bewusst nicht
auf das E-Mail-Format geprüft (siehe `Decision Log`).

### Schritt 5: `backend/app/routes/goals.py` umstellen

Ersetze in `create_goal` den Block von `title = ...` bis einschließlich des `try/except` um
`date.fromisoformat` durch:

        title = require_text(data.get("title"), "Titel", 255)
        module_name = require_text(data.get("module_name"), "Modul/Kurs", 255)
        target_date = require_future_date(data.get("target_date"), "Zieldatum")
        ects = require_int_in_range(data.get("ects"), "ECTS-Punkte", 1, 30, default=5)
        status = data.get("status") or "open"

        if status not in VALID_STATUSES:
            return jsonify({"error": f"status muss einer von {VALID_STATUSES} sein"}), 400

Ersetze in `update_goal` den Block der einzelnen Feldzuweisungen durch:

        if "title" in data:
            goal.title = require_text(data["title"], "Titel", 255)
        if "module_name" in data:
            goal.module_name = require_text(data["module_name"], "Modul/Kurs", 255)
        if "target_date" in data:
            goal.target_date = require_future_date(data["target_date"], "Zieldatum")
        if "ects" in data:
            goal.ects = require_int_in_range(data["ects"], "ECTS-Punkte", 1, 30)
        if "status" in data:
            if data["status"] not in VALID_STATUSES:
                return jsonify({"error": f"status muss einer von {VALID_STATUSES} sein"}), 400
            goal.status = data["status"]

Beachte den Unterschied zu vorher: Ein leerer Titel wurde bisher stillschweigend ignoriert
(`or goal.title`), jetzt führt er zu einer klaren Fehlermeldung.

Passe die Importe am Dateianfang an. Aus

    from datetime import date

    from flask import Blueprint, jsonify, request
    from flask_jwt_extended import get_jwt_identity, jwt_required

    from ..extensions import db
    from ..models.goal import VALID_STATUSES, Goal

wird

    from flask import Blueprint, jsonify, request
    from flask_jwt_extended import get_jwt_identity, jwt_required

    from ..extensions import db
    from ..models.goal import VALID_STATUSES, Goal
    from ..validation import require_future_date, require_int_in_range, require_text

Der Import `from datetime import date` entfällt, weil `date` nicht mehr direkt benutzt wird. Bleibt
er stehen, meldet die Code-Prüfung `ruff check .` einen unbenutzten Import (`F401`).

### Schritt 6: `backend/app/routes/plans.py` umstellen

Ersetze in `create_plan` den Block von `goal_id = data.get("goal_id")` bis einschließlich des
`db.session.add(slot)` durch:

        goal_id = require_int_in_range(data.get("goal_id"), "Lernziel", 1, 2_147_483_647)
        year = require_int_in_range(data.get("year"), "Jahr", 2020, 2100)
        month = require_int_in_range(data.get("month"), "Monat", 1, 12)
        day = require_day_of_month(data.get("day"), year, month)
        duration_minutes = require_int_in_range(
            data.get("duration_minutes"), "Dauer in Minuten", 5, 480, default=60
        )
        planned_time = optional_clock_time(data.get("planned_time"))
        note = optional_text(data.get("note"), "Notiz", 500)

        Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()

        slot = PlanSlot(
            user_id=uid,
            goal_id=goal_id,
            year=year,
            month=month,
            day=day,
            planned_time=planned_time,
            duration_minutes=duration_minutes,
            note=note,
        )
        db.session.add(slot)

Ersetze in `update_plan` den Block der Feldzuweisungen durch:

        if "day" in data:
            slot.day = require_day_of_month(data["day"], slot.year, slot.month)
        if "planned_time" in data:
            slot.planned_time = optional_clock_time(data["planned_time"])
        if "duration_minutes" in data:
            slot.duration_minutes = require_int_in_range(
                data["duration_minutes"], "Dauer in Minuten", 5, 480
            )
        if "note" in data:
            slot.note = optional_text(data["note"], "Notiz", 500)

Ergänze oben den Import:

    from ..validation import (
        optional_clock_time,
        optional_text,
        require_day_of_month,
        require_int_in_range,
    )

Beachte: Die Filter in `list_plans` (`request.args.get("goal_id")` und so weiter) bleiben
unverändert. Sie sind Suchparameter, keine gespeicherten Daten; ein unsinniger Filterwert liefert
schlicht eine leere Liste.

### Schritt 7: Backend-Tests schreiben und ausführen

Lege die neue Datei `backend/tests/test_validation.py` mit **exakt** diesem Inhalt an:

    """Prueft die Wertebereiche der Schnittstelle (Plan P1)."""

    from datetime import date, timedelta

    import pytest

    REGISTER_URL = "/api/auth/register"
    LOGIN_URL = "/api/auth/login"
    GOALS_URL = "/api/goals"
    PLANS_URL = "/api/plans"

    FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()
    PAST_DATE = (date.today() - timedelta(days=1)).isoformat()


    @pytest.fixture
    def auth_header(client):
        payload = {"email": "val@example.com", "name": "Val", "password": "pass123"}
        client.post(REGISTER_URL, json=payload)
        resp = client.post(LOGIN_URL, json={"email": "val@example.com", "password": "pass123"})
        return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


    @pytest.fixture
    def goal_id(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "Basis", "module_name": "M", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        return resp.get_json()["id"]


    # --- Registrierung -------------------------------------------------------

    @pytest.mark.parametrize("email", ["test", "@@@", "ohne-at.de", "a@b", "a b@c.de"])
    def test_register_rejects_invalid_email(client, email):
        resp = client.post(REGISTER_URL, json={"email": email, "name": "N", "password": "pass123"})
        assert resp.status_code == 400
        assert "E-Mail" in resp.get_json()["error"]


    def test_register_accepts_valid_email(client):
        resp = client.post(
            REGISTER_URL, json={"email": "gut@example.de", "name": "N", "password": "pass123"}
        )
        assert resp.status_code == 201


    def test_register_rejects_empty_name(client):
        resp = client.post(
            REGISTER_URL, json={"email": "a@b.de", "name": "   ", "password": "pass123"}
        )
        assert resp.status_code == 400


    # --- Lernziele -----------------------------------------------------------

    @pytest.mark.parametrize("ects", [-5, 0, 31, "abc"])
    def test_create_goal_rejects_invalid_ects(client, auth_header, ects):
        resp = client.post(
            GOALS_URL,
            json={"title": "T", "module_name": "M", "target_date": FUTURE_DATE, "ects": ects},
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_create_goal_uses_default_ects_when_absent(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "T", "module_name": "M", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        assert resp.status_code == 201
        assert resp.get_json()["ects"] == 5


    def test_create_goal_rejects_past_target_date(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "T", "module_name": "M", "target_date": PAST_DATE},
            headers=auth_header,
        )
        assert resp.status_code == 400
        assert "Vergangenheit" in resp.get_json()["error"]


    def test_create_goal_rejects_too_long_title(client, auth_header):
        resp = client.post(
            GOALS_URL,
            json={"title": "a" * 256, "module_name": "M", "target_date": FUTURE_DATE},
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_update_goal_rejects_empty_title(client, auth_header, goal_id):
        resp = client.put(f"{GOALS_URL}/{goal_id}", json={"title": "  "}, headers=auth_header)
        assert resp.status_code == 400


    def test_update_goal_status_without_date_still_works(client, auth_header, goal_id):
        resp = client.put(f"{GOALS_URL}/{goal_id}", json={"status": "achieved"}, headers=auth_header)
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "achieved"


    # --- Planung -------------------------------------------------------------

    @pytest.mark.parametrize("month", [-3, 0, 13, 99])
    def test_create_plan_rejects_invalid_month(client, auth_header, goal_id, month):
        resp = client.post(
            PLANS_URL, json={"goal_id": goal_id, "year": 2026, "month": month}, headers=auth_header
        )
        assert resp.status_code == 400


    @pytest.mark.parametrize("day", [-10, 0, 32, 45])
    def test_create_plan_rejects_invalid_day(client, auth_header, goal_id, day):
        resp = client.post(
            PLANS_URL,
            json={"goal_id": goal_id, "year": 2026, "month": 8, "day": day},
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_create_plan_rejects_31_february(client, auth_header, goal_id):
        resp = client.post(
            PLANS_URL,
            json={"goal_id": goal_id, "year": 2026, "month": 2, "day": 31},
            headers=auth_header,
        )
        assert resp.status_code == 400


    @pytest.mark.parametrize("duration", [-120, 0, 4, 481])
    def test_create_plan_rejects_invalid_duration(client, auth_header, goal_id, duration):
        resp = client.post(
            PLANS_URL,
            json={
                "goal_id": goal_id,
                "year": 2026,
                "month": 8,
                "duration_minutes": duration,
            },
            headers=auth_header,
        )
        assert resp.status_code == 400


    @pytest.mark.parametrize("clock", ["abc", "25:00", "12:60", "1230", "12:3"])
    def test_create_plan_rejects_invalid_time(client, auth_header, goal_id, clock):
        resp = client.post(
            PLANS_URL,
            json={"goal_id": goal_id, "year": 2026, "month": 8, "planned_time": clock},
            headers=auth_header,
        )
        assert resp.status_code == 400


    def test_create_plan_accepts_valid_values(client, auth_header, goal_id):
        resp = client.post(
            PLANS_URL,
            json={
                "goal_id": goal_id,
                "year": 2026,
                "month": 8,
                "day": 15,
                "planned_time": "14:30",
                "duration_minutes": 90,
                "note": "Kapitel 3",
            },
            headers=auth_header,
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["planned_time"] == "14:30"
        assert data["duration_minutes"] == 90

Führe die Backend-Tests aus (Arbeitsverzeichnis `backend`, aktivierte venv):

    python -m pytest -q

Erwartete Ausgabe:

    ................................................                         [100%]
    48 passed, ... warnings in ...s

Die 48 setzen sich aus den 13 bisherigen und 35 neuen Testfällen zusammen. Die neue Datei enthält
nur 15 Testfunktionen, aber mehrere davon sind mit `@pytest.mark.parametrize` mehrfach besetzt —
`pytest` zählt jede Wertkombination als eigenen Testfall. Weicht die Zahl geringfügig ab, ist das
kein Grund zur Sorge; entscheidend ist, dass **kein** Test fehlschlägt.

Prüfe außerdem die Code-Prüfung:

    ruff check .

Erwartet: `All checks passed!`. Meldet Ruff `F401 imported but unused`, hast du in Schritt 5 den
Import `from datetime import date` stehen lassen.

Lösche jetzt das Hilfsskript aus Schritt 1 wieder, damit es nicht im Repository landet:

    Remove-Item -Recurse -Force tools

### Schritt 8: Prüffunktionen im Frontend

Lege die neue Datei `frontend/src/app/core/validation.ts` mit **exakt** diesem Inhalt an:

    /**
     * Pruefregeln fuer Formulare. Jede Funktion liefert eine deutsche
     * Fehlermeldung oder null, wenn der Wert in Ordnung ist.
     *
     * Diese Regeln spiegeln bewusst die Pruefungen des Servers in
     * backend/app/validation.py. Der Server bleibt die verbindliche Instanz;
     * die Pruefung hier dient nur der schnellen Rueckmeldung im Browser.
     *
     * Hinweis: Die HTML-Attribute min/max/type="email" wirken in diesen
     * Formularen NICHT, weil Angular jedem ngModel-Formular das Attribut
     * novalidate hinzufuegt. Deshalb wird hier ausdruecklich geprueft.
     */
    const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
    const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

    export function validateEmail(value: string): string | null {
      const email = (value ?? '').trim();
      if (!email) return 'E-Mail-Adresse darf nicht leer sein';
      if (email.length > 255) return 'E-Mail-Adresse ist zu lang';
      if (!EMAIL_PATTERN.test(email)) return 'Bitte eine gültige Adresse angeben, z. B. name@domain.de';
      return null;
    }

    export function validatePassword(value: string): string | null {
      const password = value ?? '';
      if (password.length < 6) return 'Passwort muss mindestens 6 Zeichen haben';
      if (password.length > 128) return 'Passwort darf höchstens 128 Zeichen haben';
      return null;
    }

    export function validateRequiredText(value: string, label: string, maxLength = 255): string | null {
      const text = (value ?? '').trim();
      if (!text) return `${label} darf nicht leer sein`;
      if (text.length > maxLength) return `${label} darf höchstens ${maxLength} Zeichen lang sein`;
      return null;
    }

    export function validateEcts(value: number | null): string | null {
      if (value === null || value === undefined || Number.isNaN(value)) return 'ECTS-Punkte sind ein Pflichtfeld';
      if (!Number.isInteger(Number(value))) return 'ECTS-Punkte müssen eine ganze Zahl sein';
      if (Number(value) < 1 || Number(value) > 30) return 'ECTS-Punkte müssen zwischen 1 und 30 liegen';
      return null;
    }

    export function validateTargetDate(value: string): string | null {
      if (!value) return 'Zieldatum ist ein Pflichtfeld';
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return 'Zieldatum muss ein gültiges Datum sein';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed < today) return 'Zieldatum darf nicht in der Vergangenheit liegen';
      if (parsed.getFullYear() > today.getFullYear() + 10) return 'Zieldatum liegt zu weit in der Zukunft';
      return null;
    }

    /** Tag im Monat; beruecksichtigt die Laenge des gewaehlten Monats. */
    export function validateDayOfMonth(value: number | null, year: number, month: number): string | null {
      if (value === null || value === undefined || (value as unknown as string) === '') return null;
      const day = Number(value);
      if (!Number.isInteger(day)) return 'Tag muss eine ganze Zahl sein';
      const lastDay = new Date(year, month, 0).getDate();
      if (day < 1 || day > lastDay) return `Tag muss zwischen 1 und ${lastDay} liegen`;
      return null;
    }

    export function validateDuration(value: number | null): string | null {
      if (value === null || value === undefined || Number.isNaN(value)) return 'Dauer ist ein Pflichtfeld';
      const minutes = Number(value);
      if (!Number.isInteger(minutes)) return 'Dauer muss eine ganze Zahl sein';
      if (minutes < 5 || minutes > 480) return 'Dauer muss zwischen 5 und 480 Minuten liegen';
      return null;
    }

    export function validateClockTime(value: string): string | null {
      const text = (value ?? '').trim();
      if (!text) return null;
      if (!TIME_PATTERN.test(text)) return 'Uhrzeit muss im Format HH:MM angegeben werden, z. B. 14:30';
      return null;
    }

Lege dazu die Testdatei `frontend/src/app/core/validation.spec.ts` an:

    import {
      validateClockTime,
      validateDayOfMonth,
      validateDuration,
      validateEcts,
      validateEmail,
      validateRequiredText,
      validateTargetDate,
    } from './validation';

    describe('validation', () => {
      it('lehnt E-Mail-Adressen ohne Domain ab', () => {
        expect(validateEmail('test')).not.toBeNull();
        expect(validateEmail('@@@')).not.toBeNull();
        expect(validateEmail('a@b')).not.toBeNull();
      });

      it('akzeptiert gueltige E-Mail-Adressen', () => {
        expect(validateEmail('name@domain.de')).toBeNull();
        expect(validateEmail('vor.nach+tag@sub.domain.org')).toBeNull();
      });

      it('lehnt ECTS ausserhalb 1..30 ab, auch die Null', () => {
        expect(validateEcts(-5)).not.toBeNull();
        expect(validateEcts(0)).not.toBeNull();
        expect(validateEcts(31)).not.toBeNull();
        expect(validateEcts(5)).toBeNull();
      });

      it('lehnt Zieldaten in der Vergangenheit ab', () => {
        const gestern = new Date();
        gestern.setDate(gestern.getDate() - 1);
        expect(validateTargetDate(gestern.toISOString().slice(0, 10))).not.toBeNull();

        const naechstesJahr = new Date();
        naechstesJahr.setFullYear(naechstesJahr.getFullYear() + 1);
        expect(validateTargetDate(naechstesJahr.toISOString().slice(0, 10))).toBeNull();
      });

      it('kennt die Laenge des Monats', () => {
        expect(validateDayOfMonth(31, 2026, 2)).not.toBeNull();
        expect(validateDayOfMonth(28, 2026, 2)).toBeNull();
        expect(validateDayOfMonth(-10, 2026, 8)).not.toBeNull();
        expect(validateDayOfMonth(null, 2026, 8)).toBeNull();
      });

      it('lehnt negative und uebergrosse Dauern ab', () => {
        expect(validateDuration(-120)).not.toBeNull();
        expect(validateDuration(0)).not.toBeNull();
        expect(validateDuration(481)).not.toBeNull();
        expect(validateDuration(90)).toBeNull();
      });

      it('prueft das Uhrzeitformat', () => {
        expect(validateClockTime('abc')).not.toBeNull();
        expect(validateClockTime('25:00')).not.toBeNull();
        expect(validateClockTime('14:30')).toBeNull();
        expect(validateClockTime('')).toBeNull();
      });

      it('prueft Pflichttexte und Laengen', () => {
        expect(validateRequiredText('   ', 'Titel')).not.toBeNull();
        expect(validateRequiredText('a'.repeat(256), 'Titel')).not.toBeNull();
        expect(validateRequiredText('Prog 1', 'Titel')).toBeNull();
      });
    });

### Schritt 9: Fehleranzeige in die Formulare einbauen

Das Muster ist in allen drei Komponenten gleich und wird hier einmal vollständig am Beispiel der
Registrierung gezeigt; für die beiden anderen Komponenten folgen die Abweichungen.

In `frontend/src/app/features/auth/register/register.ts` ergänze zuerst den Import:

    import { validateEmail, validatePassword, validateRequiredText } from '../../../core/validation';

Ergänze in der Klasse `RegisterComponent` unterhalb von `loading = signal(false);`:

      fieldErrors = signal<Record<string, string>>({});

      /** Loescht die Fehlermeldung eines Feldes, sobald der Wert geaendert wird. */
      clearFieldError(field: string): void {
        this.fieldErrors.update((errors) => {
          if (!errors[field]) return errors;
          const rest = { ...errors };
          delete rest[field];
          return rest;
        });
      }

Ersetze die Methode `submit` durch:

      async submit(): Promise<void> {
        this.error.set('');

        const errors: Record<string, string> = {};
        const nameError = validateRequiredText(this.name, 'Name');
        const emailError = validateEmail(this.email);
        const passwordError = validatePassword(this.password);
        if (nameError) errors['name'] = nameError;
        if (emailError) errors['email'] = emailError;
        if (passwordError) errors['password'] = passwordError;
        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) return;

        this.loading.set(true);
        try {
          await this.auth.register(this.email, this.name, this.password);
          this.router.navigate(['/']);
        } catch (err: any) {
          const msg = err?.error?.error ?? 'Registrierung fehlgeschlagen.';
          this.error.set(msg);
        } finally {
          this.loading.set(false);
        }
      }

Ändere in der Anzeigevorlage jede der drei Feldgruppen nach diesem Muster. Aus

              <div class="form-group">
                <label for="email">E-Mail</label>
                <input id="email" type="email" [(ngModel)]="email" name="email" required placeholder="name@beispiel.de" />
              </div>

wird

              <div class="form-group">
                <label for="email">E-Mail</label>
                <input id="email" type="email" [(ngModel)]="email" name="email"
                  (ngModelChange)="clearFieldError('email')"
                  [class.input-error]="fieldErrors()['email']" placeholder="name@beispiel.de" />
                @if (fieldErrors()['email']) {
                  <p class="field-error">{{ fieldErrors()['email'] }}</p>
                }
              </div>

Wichtig: Das Attribut `required` entfällt, weil die Prüfung jetzt in TypeScript stattfindet und
`required` in Verbindung mit `novalidate` ohnehin wirkungslos war. Verfahre für die Felder `name`
(Schlüssel `'name'`) und `password` (Schlüssel `'password'`) genauso.

In `frontend/src/app/features/goals/goals.ts` gilt dasselbe Muster mit dem Import

    import { validateEcts, validateRequiredText, validateTargetDate } from '../../core/validation';

und dieser Prüfung am Anfang von `create()`, direkt nach `this.createError.set('');`:

        const errors: Record<string, string> = {};
        const titleError = validateRequiredText(this.form.title, 'Titel');
        const moduleError = validateRequiredText(this.form.module_name, 'Modul/Kurs');
        const ectsError = validateEcts(this.form.ects);
        const dateError = validateTargetDate(this.form.target_date);
        if (titleError) errors['title'] = titleError;
        if (moduleError) errors['module_name'] = moduleError;
        if (ectsError) errors['ects'] = ectsError;
        if (dateError) errors['target_date'] = dateError;
        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) return;

Die vier Eingabefelder in der Vorlage (`title`, `module_name`, `ects`, `target_date`) bekommen
jeweils `(ngModelChange)="clearFieldError('<schluessel>')"`, `[class.input-error]="fieldErrors()['<schluessel>']"`
und den `@if`-Block mit der Meldung, genau wie oben.

In `frontend/src/app/features/planning/planning.ts` mit dem Import

    import { validateClockTime, validateDayOfMonth, validateDuration } from '../../core/validation';

und dieser Prüfung in `createSlot()`, direkt nach der bestehenden Abfrage auf ein gewähltes
Lernziel:

        const [jahr, monat] = this.selectedMonth.split('-').map(Number);
        const errors: Record<string, string> = {};
        const dayError = validateDayOfMonth(this.newSlot.day, jahr, monat);
        const durationError = validateDuration(this.newSlot.duration_minutes);
        const timeError = validateClockTime(this.newSlot.planned_time);
        if (dayError) errors['day'] = dayError;
        if (durationError) errors['duration'] = durationError;
        if (timeError) errors['time'] = timeError;
        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) return;

Auch hier bekommen die Felder `day`, `duration` und `time` die drei Ergänzungen in der Vorlage.
Beachte, dass `validateDayOfMonth` das Jahr und den Monat aus der Auswahl oben im Formular braucht;
deshalb wird die Zeile mit `split('-')` vor die Prüfung gezogen. Die bereits vorhandene Zeile
`const [year, month] = this.selectedMonth.split('-').map(Number);` weiter unten in derselben
Methode bleibt bestehen — sie steht in einem eigenen `try`-Block.

### Schritt 10: CSS ergänzen

Öffne `frontend/src/styles.scss`. Suche den Abschnitt, der mit dem Kommentar
`/* ===== Forms ===== */` beginnt, und füge unmittelbar vor der Zeile

    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }

diese beiden Regeln ein:

    .form-group input.input-error,
    .form-group select.input-error {
      border-color: var(--danger);
      background: #fef2f2;
    }
    .field-error {
      color: var(--danger);
      font-size: 0.78rem;
      margin-top: 0.1rem;
    }

Die Variable `--danger` ist im Kopf derselben Datei bereits definiert und wird schon von
`.btn-danger` benutzt.

### Schritt 11: Alles prüfen

Frontend (Arbeitsverzeichnis `frontend`):

    npx ng test --watch=false
    npx ng lint

Erwartet: Die neue Datei `validation.spec.ts` steuert sieben Tests bei. Ist der Plan P0 bereits
umgesetzt, bestehen damit 28 von 28 Tests. Ist P0 noch offen, sind es 25 Tests, von denen
`app.spec.ts` aus einem anderen Grund rot bleibt — dieser Fehler wird von P0 behoben und gehört
nicht zu diesem Plan; alle übrigen 24 müssen bestehen. `npx ng lint` meldet
`All files pass linting.`

Manueller Durchgang im Browser: Starte Docker (`docker compose up -d`), das Backend
(`cd backend`, `.\.venv\Scripts\Activate.ps1`, `flask run --debug`) und das Frontend
(`cd frontend`, `ng serve`). Prüfe dann der Reihe nach:

1. Auf `/register` als E-Mail `test` eingeben und absenden. Erwartet: rote Meldung „Bitte eine
   gültige Adresse angeben, z. B. name@domain.de" direkt unter dem Feld, roter Rahmen, **kein**
   Konto wird angelegt.
2. Die Adresse zu `test@example.de` korrigieren. Erwartet: Rahmen und Meldung verschwinden, sobald
   du tippst. Genau das war der offene Punkt „Zurücksetzen der Eingabefeld-Umrandung".
3. Registrieren, dann auf `/goals` ein Lernziel mit `-5` ECTS anlegen. Erwartet: „ECTS-Punkte
   müssen zwischen 1 und 30 liegen".
4. Ein Lernziel mit einem Zieldatum von gestern anlegen. Erwartet: „Zieldatum darf nicht in der
   Vergangenheit liegen".
5. Auf `/planning` als Tag `45` und als Dauer `-120` eingeben. Erwartet: zwei Meldungen, nichts
   wird gespeichert.
6. Danach Tag `15`, Uhrzeit `14:30`, Dauer `90` eintragen. Erwartet: Der Eintrag erscheint in der
   Liste „Geplante Lernzeiten".

### Schritt 12: README aktualisieren

Ergänze in `README.md` im Abschnitt „Dokumentation im Repo" **nach** der Tabelle einen kurzen
Absatz mit der Überschrift `### Geltende Wertebereiche der API` und diesem Inhalt in eigenen
Worten: E-Mail muss der Form `name@domain.de` entsprechen; Passwort 6 bis 128 Zeichen; Titel und
Modul/Kurs 1 bis 255 Zeichen; ECTS 1 bis 30; Zieldatum heute oder später und höchstens zehn Jahre
voraus; Jahr 2020 bis 2100; Monat 1 bis 12; Tag passend zur Monatslänge; Dauer 5 bis 480 Minuten;
Uhrzeit im Format HH:MM; Notiz höchstens 500 Zeichen. Verstöße beantwortet die API mit HTTP 400 und
`{"error": "..."}`.

### Schritt 13: Commit und Abschluss

Arbeite auf dem bereits ausgecheckten Branch; lege **keinen** eigenen Branch und **kein**
zusätzliches Arbeitsverzeichnis an.

    git add backend/app/validation.py backend/app/__init__.py backend/app/routes backend/tests/test_validation.py frontend/src/app/core/validation.ts frontend/src/app/core/validation.spec.ts frontend/src/app/features frontend/src/styles.scss README.md
    git commit -m "fix: Eingabevalidierung fuer E-Mail, ECTS, Datum, Tag, Dauer und Uhrzeit"

Prüfe mit `git status`, dass der Ordner `backend/tools` nicht mehr existiert. Fülle danach
`Outcomes & Retrospective` aus, hake `Progress` mit Zeitstempeln ab und verschiebe diese Datei nach
`docs/ExecPlans/completed/`.

## Validation and Acceptance

Im Arbeitsverzeichnis `backend` läuft `python -m pytest -q` ohne Fehlschlag durch und meldet 48
bestandene Testfälle; `ruff check .` meldet `All checks passed!`.

Im Arbeitsverzeichnis `frontend` läuft `npx ng test --watch=false` durch; die sieben Tests aus
`src/app/core/validation.spec.ts` bestehen. `npx ng lint` meldet `All files pass linting.`

Gegen die laufende API gilt: `POST /api/auth/register` mit `{"email": "test", ...}` antwortet mit
400 und einer Meldung, die das Wort „E-Mail" enthält. `POST /api/goals` mit `ects: -5` oder
`ects: 0` antwortet mit 400. `POST /api/plans` mit `day: 45`, `month: 99`,
`duration_minutes: -120` oder `planned_time: "abc"` antwortet jeweils mit 400.

Im Browser erscheint bei jedem dieser Fälle eine rote Meldung unter dem betroffenen Feld, und diese
Meldung verschwindet, sobald der Wert geändert wird.

## Idempotence and Recovery

Alle Schritte sind wiederholbar. Es gibt **keine** Datenbank-Migration und keine Änderung an
bestehenden Daten. Bereits gespeicherte Datensätze, die den neuen Regeln widersprechen (etwa ein
altes Lernziel mit Zieldatum in der Vergangenheit), bleiben erhalten und lassen sich weiterhin
anzeigen, ändern und löschen — geprüft wird nur, was neu hereinkommt beziehungsweise ausdrücklich
mitgeschickt wird.

Geht etwas schief, macht `git checkout -- backend/app backend/tests frontend/src` die Änderungen an
den bestehenden Dateien rückgängig; die neu angelegten Dateien müssen von Hand gelöscht werden.

Sollte sich nach der Umstellung ein bestehender automatisierter Test unerwartet rot färben, prüfe
zuerst, ob er ein fest verdrahtetes Datum in der Vergangenheit benutzt. Die vorhandenen Tests in
`backend/tests/test_goals.py` verwenden `2027-01-01` und `2027-02-28` und sind damit bis Ende 2026
unbedenklich; danach müssen sie auf ein berechnetes Datum umgestellt werden (Muster:
`(date.today() + timedelta(days=200)).isoformat()`).

## Artifacts and Notes

Inhalt des Hilfsskripts `backend/tools/pruefe_validierung.py` aus Schritt 1. Es baut die Anwendung
mit der Testkonfiguration (Datenbank im Arbeitsspeicher) und ruft die Schnittstelle direkt auf,
ohne Server und ohne Docker:

    """Zeigt, welche unsinnigen Eingaben die API heute noch annimmt (Plan P1)."""
    from datetime import date, timedelta

    from app import create_app
    from app.extensions import db

    app = create_app("testing")
    with app.app_context():
        db.create_all()
    client = app.test_client()

    future = (date.today() + timedelta(days=200)).isoformat()
    past = (date.today() - timedelta(days=1)).isoformat()

    ergebnisse = []

    def pruefe(label, soll, resp):
        ist = resp.status_code
        marke = "OK  " if ist == soll else "FEHLT"
        ergebnisse.append(f"{label:38} SOLL {soll} -> IST {ist}  {marke}")

    pruefe("E-Mail ohne Domain ('test')", 400,
           client.post("/api/auth/register", json={"email": "test", "name": "T", "password": "geheim1"}))

    reg = client.post("/api/auth/register",
                      json={"email": "pruef@example.de", "name": "P", "password": "geheim1"})
    kopf = {"Authorization": f"Bearer {reg.get_json()['access_token']}"}

    pruefe("ECTS negativ (-5)", 400, client.post("/api/goals",
           json={"title": "X", "module_name": "M", "target_date": future, "ects": -5}, headers=kopf))
    pruefe("ECTS = 0", 400, client.post("/api/goals",
           json={"title": "Y", "module_name": "M", "target_date": future, "ects": 0}, headers=kopf))
    pruefe("Zieldatum in der Vergangenheit", 400, client.post("/api/goals",
           json={"title": "Z", "module_name": "M", "target_date": past}, headers=kopf))
    pruefe("Titel 5000 Zeichen", 400, client.post("/api/goals",
           json={"title": "a" * 5000, "module_name": "M", "target_date": future}, headers=kopf))

    ziel = client.post("/api/goals",
                       json={"title": "Basis", "module_name": "M", "target_date": future},
                       headers=kopf).get_json()["id"]

    pruefe("Monat = 99", 400, client.post("/api/plans",
           json={"goal_id": ziel, "year": 2026, "month": 99}, headers=kopf))
    pruefe("Tag = 45", 400, client.post("/api/plans",
           json={"goal_id": ziel, "year": 2026, "month": 8, "day": 45}, headers=kopf))
    pruefe("Dauer = -120 Minuten", 400, client.post("/api/plans",
           json={"goal_id": ziel, "year": 2026, "month": 8, "duration_minutes": -120}, headers=kopf))
    pruefe("Uhrzeit = 'abc'", 400, client.post("/api/plans",
           json={"goal_id": ziel, "year": 2026, "month": 8, "planned_time": "abc"}, headers=kopf))

    print("\n".join(ergebnisse))

Nach vollständiger Umsetzung dieses Plans meldet dasselbe Skript in jeder Zeile `OK`. Genau das ist
der kürzeste Beweis, dass die Arbeit wirkt — bevor du es in Schritt 7 löschst, lass es ein letztes
Mal laufen und hänge die Ausgabe unter `Outcomes & Retrospective` an.

## Interfaces and Dependencies

Es werden keine neuen Bibliotheken installiert; `re`, `calendar` und `datetime` gehören zur
Python-Standardbibliothek.

In `backend/app/validation.py` müssen am Ende existieren:

    class ValidationError(Exception)                    # Attribut .message: str
    def require_text(value, field_label: str, max_length: int) -> str
    def optional_text(value, field_label: str, max_length: int) -> str | None
    def require_email(value) -> str
    def require_password(value) -> str
    def require_int_in_range(value, field_label: str, minimum: int, maximum: int,
                             default: int | None = None) -> int
    def require_future_date(value, field_label: str) -> date
    def require_day_of_month(value, year: int, month: int) -> int | None
    def optional_clock_time(value) -> str | None

In `frontend/src/app/core/validation.ts`:

    export function validateEmail(value: string): string | null
    export function validatePassword(value: string): string | null
    export function validateRequiredText(value: string, label: string, maxLength?: number): string | null
    export function validateEcts(value: number | null): string | null
    export function validateTargetDate(value: string): string | null
    export function validateDayOfMonth(value: number | null, year: number, month: number): string | null
    export function validateDuration(value: number | null): string | null
    export function validateClockTime(value: string): string | null

Jede der drei Komponenten `RegisterComponent`, `GoalsComponent` und `PlanningComponent` besitzt
danach ein Signal `fieldErrors` vom Typ `Signal<Record<string, string>>` und eine Methode
`clearFieldError(field: string): void`.

## Änderungsnotizen

- 2026-08-11: Plan erstellt. Grundlage sind die Befunde aus
  `docs/testing-protokoll-lernzeit-manager.md`, nachgeprüft durch direkte Aufrufe der API, die
  jeden genannten Fall bestätigt haben.
- 2026-08-11: Vor der ersten Übergabe überarbeitet. Die erwarteten Testzahlen waren zu niedrig
  angesetzt: Durch `@pytest.mark.parametrize` entstehen aus 15 Testfunktionen 35 Testfälle, zusammen
  mit den 13 vorhandenen also 48 statt der zuerst genannten 35. Ebenso wurde die erwartete
  Frontend-Zahl nach Umsetzung von P0 auf 28 berichtigt.

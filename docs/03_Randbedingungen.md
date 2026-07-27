# Randbedingungen – Lernzeit-Manager

## Organisatorisch
- Team: 3 Personen (Elias, Julian, Assis).
- Rollen (Kickoff-Beschluss): Product Owner Elias; Developer Assis (Schwerpunkt Coding) und Julian (Schwerpunkt Infrastruktur, Versionierung, Deployment, Testing, teilweise Coding) – Details siehe [[07_MS1]].
- Projektabschluss angestrebt bis **31.08.2026** (inkl. Projektbericht).
- Themenwahl und Teamzusammensetzung müssen vor Projektstart final mit dem Tutor abgestimmt werden (E-Mail durch Projektleitung, CC an alle Mitglieder).
- Abgabe aller Liefergegenstände über Redmine (https://redmine-se.iubh.de/), Projektbericht final über Turnitin.
- Zusätzlich zu Redmine: GitHub Projects als ergänzendes Kanban-/Aufgabenboard für die technische Umsetzung.

## Kommunikation
- Kickoff-Entscheidung: Team bleibt bei MS Teams, **kein** Umzug auf Discord (siehe [[99_Kickoff-Beschlüsse]]).
- Wöchentliche Regelmeetings: Mittwoch nachmittag, ca. 15:30–16:00 Uhr, max. 30 Minuten.
- Sonstige Kommunikation ebenfalls über Teams.

## Annahmen und Beschränkungen (Kickoff)
- Ausschließlich kostenlose Tools/Services, da Studierendenprojekt ohne Budget.
- Eine Userverwaltung sowie ein Backend werden benötigt, da eine Datenbank erforderlich ist – rein über das Frontend nicht lösbar.
- Weitere Annahmen/Beschränkungen werden im Projektverlauf ergänzt.

## Technisch
- Code-Repository: GitHub (privates Repo).
- Qualitätssicherung/CI: GitHub Actions (automatisierte Tests, Linting) direkt im GitHub-Workflow.
- Containerisierung: Docker (lokale Entwicklungsumgebung + Deployment-Image).
- Hosting: Railway (Team hat bereits Erfahrung damit).
- Programmiersprache/Framework im Kickoff festgelegt: Frontend Angular, Backend Flask, Datenbank PostgreSQL (Details siehe [[04_Tech-Stack_und_Tools]]).
- Knowledge Base: OneDrive (ergänzend zu Redmine/GitHub Projects).
- Anwendung muss laut Aufgabenstellung ohne Installation im Browser durch den Tutor nutzbar sein → spricht für eine Web-Anwendung (kein Desktop-/Mobile-only-Client).

## Inhaltlich (aus Themenbeschreibung Thema A)
- Zeitliche Horizonte aus der Themenbeschreibung: Grobplanung/Ziele über mindestens 6 Monate, Detailplanung über 1 Monat – das Datenmodell muss diese zwei Ebenen sauber abbilden. Die 6 Monate sind ein Vorschlag aus der Themenbeschreibung für das Feature (Mindest-Planungshorizont der Anwendung) und stehen nicht im Zusammenhang mit der Projekt-Deadline vom 31.08.2026.
- Bezug zum Modulhandbuch/Workload ist thematisch vorgesehen, aber keine Pflicht zur echten Anbindung an ein IU-System (keine offizielle API bekannt) – ggf. manuelle Eingabe des Workloads.

## Bericht-formal (laut Aufgabenstellung)
- Seitenumfang bei 3er-Gruppe: 21–30 Seiten Textteil, mit klar zugeordneten Abschnitten pro Person (je 7–10 Seiten).
- Titelblatt mit Angaben aller Mitglieder (Name, Matrikelnummer, Studiengang, Seitenbereich).

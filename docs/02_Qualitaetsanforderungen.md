# Qualitätsanforderungen – Lernzeit-Manager

Skizze der Qualitätsanforderungen (Non-Functional Requirements), orientiert an gängigen Qualitätsmerkmalen (angelehnt an ISO 25010). Im Kickoff priorisiert (siehe [[99_Kickoff-Beschlüsse]]); wird in MS3 ("Konfiguration der Softwareentwicklung und Qualitätsplanung") konkret mit Prüfmethoden hinterlegt.

## Qualitätsziele (Kickoff-Beschluss)
- Alle automatisierten Tests sind erfüllt (grün in der CI-Pipeline).
- Die Anwendung ist aus Nutzersicht bedienbar – User kann die Kernfunktionen nutzen.
- Die technische Umsetzung ist sauber und funktionsfähig.

## Benutzbarkeit (Usability)
- Die Anwendung muss ohne Installation im Browser nutzbar sein (Pflichtvorgabe MS4).
- Kernabläufe (Lernziel anlegen, Timer starten, Fortschritt einsehen) sollen ohne Anleitung intuitiv bedienbar sein (max. wenige Klicks).
- Responsives Layout, damit die Anwendung auch auf Tablet/Smartphone nutzbar ist (Lernzeit wird oft unterwegs erfasst).

## Zuverlässigkeit (Reliability)
- Laufende Timer-Sessions dürfen bei Verbindungsabbruch/Neuladen der Seite nicht verloren gehen.
- Erinnerungen müssen zuverlässig zum geplanten Zeitpunkt ausgelöst werden.

## Performance-Effizienz
- Dashboard/Auswertungen sollen auch bei mehreren Monaten Datenhistorie ohne merkliche Verzögerung (< 2 Sek.) laden.

## Sicherheit / Datenschutz
- Da personenbezogene Daten (Namen, Lernverhalten, ggf. Noten) verarbeitet werden, ist DSGVO-Konformität zu berücksichtigen (Datensparsamkeit, Zweckbindung).
- Zugangsdaten der geplanten Userverwaltung (siehe [[03_Randbedingungen]]) dürfen nicht im Klartext gespeichert werden (Hashing) – Flask Authentication wird dazu recherchiert.
- Testzugänge für den Tutor (siehe MS4-Vorgabe "Liste mit Test-Accounts") dürfen keine echten Daten enthalten.

## Wartbarkeit
- Code folgt einheitlichem Styleguide/Linting (automatisiert via CI-Pipeline in GitHub Actions geprüft – im Kickoff verbindlich festgelegt).
- Ausreichende Testabdeckung für Kernlogik (z. B. Zeitberechnung, Fortschrittsauswertung).

## Portabilität
- Anwendung soll containerisiert (Docker) lauffähig sein, sowohl lokal als auch auf Railway.

## Testbarkeit
- Kernfunktionen (Zielverwaltung, Zeiterfassung, Erinnerungslogik) sollen automatisiert testbar sein (Unit-/Integrationstests), um den Testabschlussbericht (MS4) fundiert erstellen zu können.

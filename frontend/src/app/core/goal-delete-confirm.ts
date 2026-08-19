/**
 * Rueckfrage-Text beim Loeschen eines Lernziels, gemeinsam genutzt von der
 * Lernziele-Seite und den Aktionsknoepfen auf dem Dashboard (Plan P8), damit
 * beide Stellen nie auseinanderlaufen.
 *
 * Zwischenziele (Milestones) dieses Ziels haben keine Loesch-Kaskade: Beim
 * Loeschen des Lernziels wird nur ihr `goal_id` auf null gesetzt, sie bleiben
 * als monatliche Zwischenziele ohne Lernziel-Zuordnung bestehen (sichtbar auf
 * der Planungsseite und weiterhin in der Zwischenziele-Kachel gezaehlt).
 */
export function goalDeleteConfirmText(title: string): string {
  return (
    `Lernziel "${title}" wirklich löschen?\n\n` +
    'Damit werden auch alle geplanten Lernzeiten und alle bereits erfassten ' +
    'Lernsessions dieses Ziels gelöscht. Die erfasste Lernzeit verschwindet ' +
    'dadurch rückwirkend aus dem Dashboard. Zwischenziele dieses Lernziels ' +
    'werden dabei NICHT gelöscht - sie bleiben als Zwischenziele ohne ' +
    'Lernziel-Zuordnung erhalten.'
  );
}

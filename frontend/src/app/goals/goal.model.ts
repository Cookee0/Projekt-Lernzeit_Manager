/** Die drei erlaubten Zustaende eines Lernziels (FR-1.2). */
export type GoalStatus = 'offen' | 'in_arbeit' | 'erreicht';

/**
 * Beschriftungen fuer die Oberflaeche. Gespeichert werden die technischen
 * Werte oben; angezeigt wird, was hier steht. Einzige Stelle im Frontend,
 * an der Statustexte definiert sind.
 */
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  offen: 'Offen',
  in_arbeit: 'In Arbeit',
  erreicht: 'Erreicht',
};

/** Ein Lernziel, so wie es die API liefert. */
export interface Goal {
  id: number;
  /** Titel des Lernziels, z. B. "Modul ISEF01 abschließen". */
  title: string;
  /** Modul oder Kurs als Freitext, z. B. "Projekt Software Engineering (ISEF01)". */
  module: string;
  /** Zieldatum als ISO-Datum, z. B. "2027-02-28". */
  target_date: string;
  status: GoalStatus;
  /** Anlagezeitpunkt als ISO-Zeitstempel. */
  created_at: string;
}

/** Die Felder, die beim Anlegen eines Lernziels geschickt werden. */
export interface NewGoal {
  title: string;
  module: string;
  target_date: string;
  status: GoalStatus;
}

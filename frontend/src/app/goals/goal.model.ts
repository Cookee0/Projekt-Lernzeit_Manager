/** Die drei erlaubten Zustaende eines Lernziels (FR-1.2). */
export type GoalStatus = 'offen' | 'in_arbeit' | 'erreicht';

/** Die drei erlaubten Prioritaetsstufen eines Lernziels (FR-1.4). */
export type GoalPriority = 'hoch' | 'mittel' | 'niedrig';

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

/** Beschriftungen der Prioritaetsstufen. Siehe GOAL_STATUS_LABELS. */
export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
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
  /** Optionale Prioritaet. null bedeutet: keine gesetzt. */
  priority: GoalPriority | null;
  /** Anlagezeitpunkt als ISO-Zeitstempel. */
  created_at: string;
}

/** Die Felder, die beim Anlegen oder Aendern eines Lernziels geschickt werden. */
export interface NewGoal {
  title: string;
  module: string;
  target_date: string;
  status: GoalStatus;
  priority: GoalPriority | null;
}

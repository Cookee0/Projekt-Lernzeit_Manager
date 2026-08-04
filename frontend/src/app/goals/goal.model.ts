/** Ein Lernziel, so wie es die API liefert. */
export interface Goal {
  id: number;
  /** Titel des Lernziels, z. B. "Modul ISEF01 abschließen". */
  title: string;
  /** Zieldatum als ISO-Datum, z. B. "2027-02-28". */
  target_date: string;
  /** Anlagezeitpunkt als ISO-Zeitstempel. */
  created_at: string;
}

/** Die Felder, die beim Anlegen eines Lernziels geschickt werden. */
export interface NewGoal {
  title: string;
  target_date: string;
}

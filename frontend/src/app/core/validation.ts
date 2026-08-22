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

export function validateWorkloadHours(value: number | null): string | null {
  if (value === null || value === undefined || (value as unknown as string) === '') return null;
  const hours = Number(value);
  if (!Number.isInteger(hours)) return 'Lernaufwand muss eine ganze Zahl sein';
  if (hours < 1 || hours > 1000) return 'Lernaufwand muss zwischen 1 und 1000 Stunden liegen';
  return null;
}

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

import {
  validateClockTime,
  validateDayOfMonth,
  validateDuration,
  validateEcts,
  validateEmail,
  validateRequiredText,
  validateTargetDate,
  validateWorkloadHours,
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

  it('laesst den Lernaufwand leer, lehnt aber 0 und ueber 1000 ab', () => {
    expect(validateWorkloadHours(null)).toBeNull();
    expect(validateWorkloadHours(0)).not.toBeNull();
    expect(validateWorkloadHours(1001)).not.toBeNull();
    expect(validateWorkloadHours(50)).toBeNull();
  });

  it('prueft Pflichttexte und Laengen', () => {
    expect(validateRequiredText('   ', 'Titel')).not.toBeNull();
    expect(validateRequiredText('a'.repeat(256), 'Titel')).not.toBeNull();
    expect(validateRequiredText('Prog 1', 'Titel')).toBeNull();
  });
});

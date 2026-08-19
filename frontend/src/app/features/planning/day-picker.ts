import { Component, EventEmitter, Input, Output } from '@angular/core';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
/** Letzter Index (0-basiert, Montag = 0), der noch zu den Werktagen zaehlt. */
const LAST_WORKDAY_INDEX = 4;

/**
 * Anklickbares Monatsraster zur Mehrfachauswahl von Tagen (FR-3.3).
 * Reine Praesentationskomponente: haelt keinen eigenen Auswahlzustand,
 * sondern spiegelt `selected` und meldet Aenderungen ueber `selectedChange`.
 */
@Component({
  selector: 'app-day-picker',
  template: `
    <div class="day-picker">
      <div class="day-picker-quick">
        <button type="button" class="btn btn-sm btn-secondary" (click)="toggleWorkdays()">Werktage</button>
        <button type="button" class="btn btn-sm btn-secondary" (click)="clearSelection()">Auswahl leeren</button>
      </div>
      <div class="day-picker-grid">
        @for (label of weekdayLabels; track $index) {
          <button type="button" class="day-picker-weekday" (click)="toggleWeekday($index)">{{ label }}</button>
        }
        @for (empty of emptyCells(); track $index) {
          <span class="day-cell-empty"></span>
        }
        @for (day of dayCells(); track day) {
          <button type="button" class="day-cell" [class.day-cell-selected]="isSelected(day)"
            [attr.aria-pressed]="isSelected(day)" (click)="toggleDay(day)">{{ day }}</button>
        }
      </div>
    </div>
  `,
})
export class DayPickerComponent {
  @Input() year!: number;
  /** 1-12 */
  @Input() month!: number;
  @Input() selected: number[] = [];
  @Output() selectedChange = new EventEmitter<number[]>();

  weekdayLabels = WEEKDAY_LABELS;

  /** Anzahl leerer Zellen vor dem 1. des Monats (Montag = erste Spalte). */
  emptyCells(): number[] {
    const offset = (new Date(this.year, this.month - 1, 1).getDay() + 6) % 7;
    return Array.from({ length: offset }, (_, i) => i);
  }

  dayCells(): number[] {
    const lastDay = new Date(this.year, this.month, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }

  isSelected(day: number): boolean {
    return this.selected.includes(day);
  }

  /** Wochentag eines Tages, Montag = 0 ... Sonntag = 6. */
  private weekdayOf(day: number): number {
    return (new Date(this.year, this.month - 1, day).getDay() + 6) % 7;
  }

  private daysForWeekday(weekday: number): number[] {
    return this.dayCells().filter((d) => this.weekdayOf(d) === weekday);
  }

  toggleDay(day: number): void {
    const next = this.isSelected(day)
      ? this.selected.filter((d) => d !== day)
      : [...this.selected, day];
    this.emitSorted(next);
  }

  /** Waehlt alle Tage eines Wochentags an, bzw. wieder ab, falls schon alle gewaehlt sind. */
  toggleWeekday(weekdayIndex: number): void {
    this.applyToggle(this.daysForWeekday(weekdayIndex));
  }

  /** Waehlt alle Werktage (Mo-Fr) des Monats an, bzw. wieder ab, falls schon alle gewaehlt sind. */
  toggleWorkdays(): void {
    const workdays = this.dayCells().filter((d) => this.weekdayOf(d) <= LAST_WORKDAY_INDEX);
    this.applyToggle(workdays);
  }

  clearSelection(): void {
    this.emitSorted([]);
  }

  private applyToggle(days: number[]): void {
    const allSelected = days.every((d) => this.isSelected(d));
    const next = allSelected
      ? this.selected.filter((d) => !days.includes(d))
      : [...new Set([...this.selected, ...days])];
    this.emitSorted(next);
  }

  private emitSorted(days: number[]): void {
    this.selectedChange.emit([...days].sort((a, b) => a - b));
  }
}

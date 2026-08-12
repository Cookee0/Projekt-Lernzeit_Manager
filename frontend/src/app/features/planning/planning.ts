import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Goal, PlanSlot } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { PlanService } from '../../core/services/plan.service';
import { validateClockTime, validateDayOfMonth, validateDuration } from '../../core/validation';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

@Component({
  selector: 'app-planning',
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2>Planung</h2>

      <div class="card">
        <h3>Filter</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="filter-goal">Lernziel</label>
            <select id="filter-goal" [(ngModel)]="selectedGoalId" name="goal" (change)="loadSlots()">
              <option [value]="0">Alle Ziele</option>
              @for (goal of goals(); track goal.id) {
                <option [value]="goal.id">{{ goal.title }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="filter-month">Monat</label>
            <select id="filter-month" [(ngModel)]="selectedMonth" name="month" (change)="loadSlots()">
              <option [value]="''">Alle Monate</option>
              @for (m of availableMonths(); track m.key) {
                <option [value]="m.key">{{ m.label }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Lernzeit einplanen</h3>
        @if (createError()) {
          <div class="alert alert-error">{{ createError() }}</div>
        }
        <form (ngSubmit)="createSlot()" class="goal-form">
          <div class="form-row">
            <div class="form-group">
              <label for="slot-goal">Lernziel *</label>
              <select id="slot-goal" [(ngModel)]="newSlot.goal_id" name="slot_goal" required>
                <option [value]="0" disabled>Ziel wählen</option>
                @for (goal of goals(); track goal.id) {
                  <option [value]="goal.id">{{ goal.title }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="slot-month">Monat *</label>
              <select id="slot-month" [(ngModel)]="newSlotMonth" name="slot_month" required>
                @for (m of availableMonths(); track m.key) {
                  <option [value]="m.key">{{ m.label }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="slot-day">Tag des Monats (optional)</label>
              <input id="slot-day" type="number" [(ngModel)]="newSlot.day" name="day" min="1" max="31"
                (ngModelChange)="clearFieldError('day')"
                [class.input-error]="fieldErrors()['day']" placeholder="z.B. 15" />
              @if (fieldErrors()['day']) {
                <p class="field-error">{{ fieldErrors()['day'] }}</p>
              }
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="slot-time">Uhrzeit (optional)</label>
              <input id="slot-time" type="time" [(ngModel)]="newSlot.planned_time" name="time"
                (ngModelChange)="clearFieldError('time')"
                [class.input-error]="fieldErrors()['time']" />
              @if (fieldErrors()['time']) {
                <p class="field-error">{{ fieldErrors()['time'] }}</p>
              }
            </div>
            <div class="form-group">
              <label for="slot-duration">Wie lange? (Minuten)</label>
              <input id="slot-duration" type="number" [(ngModel)]="newSlot.duration_minutes" name="duration" min="5" max="480"
                (ngModelChange)="clearFieldError('duration')"
                [class.input-error]="fieldErrors()['duration']" />
              @if (fieldErrors()['duration']) {
                <p class="field-error">{{ fieldErrors()['duration'] }}</p>
              }
            </div>
          </div>
          <div class="form-group">
            <label for="slot-note">Notiz (optional)</label>
            <input id="slot-note" [(ngModel)]="newSlot.note" name="note" placeholder="z.B. Kapitel 3 lesen" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Speichern…' : 'Lernzeit speichern' }}
          </button>
        </form>
      </div>

      <div class="slots-list">
        <h3>Geplante Lernzeiten</h3>
        @if (loading()) {
          <p class="loading">Lädt…</p>
        } @else if (slots().length === 0) {
          <p class="empty">Für diese Auswahl ist noch nichts geplant.</p>
        } @else {
          @for (slot of slots(); track slot.id) {
            <div class="card slot-card">
              <div class="slot-header">
                <span>{{ goalName(slot.goal_id) }}</span>
                <span class="slot-duration">{{ slot.duration_minutes }} min</span>
              </div>
              <div class="slot-meta">
                <span>📆 {{ slotDate(slot) }}</span>
                @if (slot.planned_time) { <span>🕐 {{ slot.planned_time }}</span> }
                @if (slot.note) { <span>📝 {{ slot.note }}</span> }
              </div>
              <button class="btn btn-sm btn-danger" (click)="removeSlot(slot)">Löschen</button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class PlanningComponent implements OnInit {
  private goalService = inject(GoalService);
  private planService = inject(PlanService);

  goals = signal<Goal[]>([]);
  slots = signal<PlanSlot[]>([]);
  loading = signal(false);
  saving = signal(false);
  createError = signal('');
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

  selectedGoalId = 0;
  /** Leerer Text bedeutet: Filter "Alle Monate". */
  selectedMonth = '';
  /** Monat, in den ein neuer Eintrag gespeichert wird - unabhaengig vom Filter. */
  newSlotMonth: string;

  newSlot = {
    goal_id: 0,
    day: null as number | null,
    planned_time: '',
    duration_minutes: 60,
    note: '',
  };

  constructor() {
    const now = new Date();
    this.newSlotMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonth = this.newSlotMonth;
  }

  availableMonths() {
    const months = [];
    const now = new Date();
    for (let i = -1; i <= 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return months;
  }

  async ngOnInit(): Promise<void> {
    this.goals.set(await this.goalService.list());
    await this.loadSlots();
  }

  async loadSlots(): Promise<void> {
    this.loading.set(true);
    try {
      const filters: { goal_id?: number; year?: number; month?: number } = {};
      if (this.selectedGoalId) {
        filters.goal_id = Number(this.selectedGoalId);
      }
      if (this.selectedMonth) {
        const [year, month] = this.selectedMonth.split('-').map(Number);
        filters.year = year;
        filters.month = month;
      }
      this.slots.set(await this.planService.list(filters));
    } finally {
      this.loading.set(false);
    }
  }

  async createSlot(): Promise<void> {
    this.createError.set('');
    if (!this.newSlot.goal_id) {
      this.createError.set('Bitte ein Lernziel wählen.');
      return;
    }

    const [jahr, monat] = this.newSlotMonth.split('-').map(Number);
    const errors: Record<string, string> = {};
    const dayError = validateDayOfMonth(this.newSlot.day, jahr, monat);
    const durationError = validateDuration(this.newSlot.duration_minutes);
    const timeError = validateClockTime(this.newSlot.planned_time);
    if (dayError) errors['day'] = dayError;
    if (durationError) errors['duration'] = durationError;
    if (timeError) errors['time'] = timeError;
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

    this.saving.set(true);
    try {
      const [year, month] = this.newSlotMonth.split('-').map(Number);
      await this.planService.create({
        goal_id: Number(this.newSlot.goal_id),
        year,
        month,
        day: this.newSlot.day || undefined,
        planned_time: this.newSlot.planned_time || undefined,
        duration_minutes: this.newSlot.duration_minutes,
        note: this.newSlot.note || undefined,
      });
      this.newSlot = { goal_id: 0, day: null, planned_time: '', duration_minutes: 60, note: '' };
      await this.loadSlots();
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
      this.createError.set(msg ?? 'Fehler beim Speichern.');
    } finally {
      this.saving.set(false);
    }
  }

  async removeSlot(slot: PlanSlot): Promise<void> {
    await this.planService.delete(slot.id);
    this.slots.update(ss => ss.filter(s => s.id !== slot.id));
  }

  goalName(id: number): string {
    return this.goals().find(g => g.id === id)?.title ?? `Ziel ${id}`;
  }

  /** Beschriftung fuer eine geplante Lernzeit, z. B. "15. Aug 2026" oder "Aug 2026". */
  slotDate(slot: PlanSlot): string {
    const monat = MONTH_NAMES[slot.month - 1] ?? String(slot.month);
    return slot.day ? `${slot.day}. ${monat} ${slot.year}` : `${monat} ${slot.year}`;
  }
}

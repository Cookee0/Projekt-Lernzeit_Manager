import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Goal, Milestone, PlanProposalGoal, PlanSlot } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { PlanService } from '../../core/services/plan.service';
import { validateClockTime, validateDayOfMonth, validateDuration } from '../../core/validation';
import { DayPickerComponent } from './day-picker';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

@Component({
  selector: 'app-planning',
  imports: [FormsModule, DayPickerComponent],
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
              <select id="slot-month" [ngModel]="newSlotMonth" (ngModelChange)="onSlotMonthChange($event)"
                name="slot_month" required>
                @for (m of availableMonths(); track m.key) {
                  <option [value]="m.key">{{ m.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="form-group">
            <span class="form-label" id="slot-days-label">Tage auswählen (optional)</span>
            <app-day-picker [year]="newSlotYear" [month]="newSlotMonthNum" [selected]="newSlotDays"
              (selectedChange)="onDaysChange($event)" aria-labelledby="slot-days-label"></app-day-picker>
            @if (fieldErrors()['days']) {
              <p class="field-error">{{ fieldErrors()['days'] }}</p>
            }
            <p class="hint">{{ daySelectionHint() }}</p>
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

      <div class="card">
        <h3>Grobplanung: Budget &amp; Vorschlag {{ milestoneMonthLabel() }}</h3>
        <p class="hint">Wochenbudget aus dem ECTS-Workload (30 h je ECTS), Restaufwand
          gleichmäßig auf die Monate bis zum Zieldatum verteilt.</p>
        @if (proposalGoals().length === 0) {
          <p class="empty">Kein aktives Lernziel mit Zieldatum in diesem Monat oder später.</p>
        } @else {
          <table class="proposal-table">
            <thead>
              <tr>
                <th>Modul / Ziel</th>
                <th>Budget/Woche</th>
                <th>Vorschlag {{ milestoneMonthLabel() }}</th>
                <th>Geplant {{ milestoneMonthLabel() }}</th>
                <th>Abweichung</th>
              </tr>
            </thead>
            <tbody>
              @for (p of proposalGoals(); track p.goal_id) {
                <tr>
                  <td>{{ p.title }} <span class="module-tag">{{ p.module_name }}</span></td>
                  <td>{{ formatMinutes(p.weekly_budget_minutes) }}</td>
                  <td>{{ formatMinutes(p.suggested_month_minutes) }}</td>
                  <td>{{ formatMinutes(p.planned_minutes) }}</td>
                  <td [class.deviation-negative]="p.deviation_minutes < 0"
                      [class.deviation-ok]="p.deviation_minutes >= 0">
                    {{ deviationLabel(p) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="slots-list">
        <h3>Geplante Lernzeiten</h3>
        @if (loading()) {
          <p class="loading">Lädt…</p>
        } @else if (slots().length === 0) {
          <p class="empty">Für diese Auswahl ist noch nichts geplant.</p>
        } @else {
          @for (group of groupedSlots(); track group.goal_id) {
            <div class="slot-group">
              <div class="slot-group-header goal-header">
                <div>
                  <strong>{{ group.title }}</strong>
                  <span class="module-tag">{{ group.module_name }}</span>
                </div>
                <span class="slot-duration">insgesamt {{ formatMinutes(group.totalMinutes) }} geplant</span>
              </div>
              @for (slot of group.slots; track slot.id) {
                <div class="card slot-card">
                  <div class="slot-header">
                    <span>📆 {{ slotDate(slot) }}</span>
                    <span class="slot-duration">{{ slot.duration_minutes }} min</span>
                  </div>
                  <div class="slot-meta">
                    @if (slot.planned_time) { <span>🕐 {{ slot.planned_time }}</span> }
                    @if (slot.note) { <span>📝 {{ slot.note }}</span> }
                  </div>
                  <button class="btn btn-sm btn-danger" (click)="removeSlot(slot)">Löschen</button>
                </div>
              }
            </div>
          }
        }
      </div>

      <div class="card">
        <div class="section-header">
          <h3>Zwischenziele {{ milestoneMonthLabel() }}</h3>
          <span>{{ doneCount() }} / {{ milestones().length }}</span>
        </div>

        @if (milestoneError()) {
          <div class="alert alert-error">{{ milestoneError() }}</div>
        }

        @if (milestones().length === 0) {
          <p class="empty">Für diesen Monat ist noch kein Zwischenziel festgelegt.</p>
        } @else {
          @for (m of milestones(); track m.id) {
            <div class="milestone-row">
              <label class="milestone-check">
                <input type="checkbox" [checked]="m.done" (change)="toggleMilestone(m)" />
                <span [class.milestone-done]="m.done">{{ m.title }}</span>
              </label>
              @if (m.due_day) {
                <span class="milestone-due">bis {{ m.due_day }}.</span>
              }
              <button class="btn btn-sm btn-danger" (click)="removeMilestone(m)">Löschen</button>
            </div>
          }
        }

        <div class="form-row">
          <div class="form-group">
            <label for="milestone-title">Neues Zwischenziel</label>
            <input id="milestone-title" [(ngModel)]="newMilestoneTitle" name="milestone_title"
              placeholder="z.B. Kapitel 3 abschließen" />
          </div>
          <div class="form-group">
            <label for="milestone-day">Bis Tag (optional)</label>
            <input id="milestone-day" type="number" [(ngModel)]="newMilestoneDay" name="milestone_day"
              min="1" max="31" placeholder="z.B. 15" />
          </div>
        </div>
        <button class="btn btn-primary" (click)="addMilestone()">+ Zwischenziel</button>
      </div>
    </div>
  `,
})
export class PlanningComponent implements OnInit {
  private goalService = inject(GoalService);
  private planService = inject(PlanService);
  private milestoneService = inject(MilestoneService);

  goals = signal<Goal[]>([]);
  slots = signal<PlanSlot[]>([]);
  loading = signal(false);
  saving = signal(false);
  createError = signal('');
  fieldErrors = signal<Record<string, string>>({});

  proposalGoals = signal<PlanProposalGoal[]>([]);

  milestones = signal<Milestone[]>([]);
  newMilestoneTitle = '';
  newMilestoneDay: number | null = null;
  milestoneError = signal('');

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
    planned_time: '',
    duration_minutes: 60,
    note: '',
  };
  /** Im Raster gewaehlte Tage des newSlotMonth; leer heisst Monats-Slot ohne festen Tag. */
  newSlotDays: number[] = [];

  constructor() {
    const now = new Date();
    this.newSlotMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonth = this.newSlotMonth;
  }

  /** Jahr des im Formular gewaehlten Monats, fuer das DayPicker-Raster. */
  get newSlotYear(): number {
    return Number(this.newSlotMonth.split('-')[0]);
  }

  /** Monat (1-12) des im Formular gewaehlten Monats, fuer das DayPicker-Raster. */
  get newSlotMonthNum(): number {
    return Number(this.newSlotMonth.split('-')[1]);
  }

  /** Wechselt der Formular-Monat, verliert eine bisherige Tagesauswahl ihre Gueltigkeit. */
  onSlotMonthChange(value: string): void {
    this.newSlotMonth = value;
    this.newSlotDays = [];
  }

  onDaysChange(days: number[]): void {
    this.newSlotDays = days;
    this.clearFieldError('days');
  }

  /** Hinweistext unter dem Raster, der die Anzahl gewaehlter Tage nennt (Singular/Plural). */
  daySelectionHint(): string {
    const n = this.newSlotDays.length;
    if (n === 0) return 'Kein fester Tag ausgewählt — es wird ein Monats-Slot ohne festen Tag angelegt.';
    if (n === 1) return '1 Tag ausgewählt — es wird 1 Eintrag angelegt.';
    return `${n} Tage ausgewählt — es werden ${n} Einträge angelegt.`;
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
    await this.loadMilestones();
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
      await this.loadMilestones();
      await this.loadProposal();
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
    const dayErrors = this.newSlotDays
      .map((d) => validateDayOfMonth(d, jahr, monat))
      .filter((e): e is string => e !== null);
    const durationError = validateDuration(this.newSlot.duration_minutes);
    const timeError = validateClockTime(this.newSlot.planned_time);
    if (dayErrors.length > 0) errors['days'] = dayErrors[0];
    if (durationError) errors['duration'] = durationError;
    if (timeError) errors['time'] = timeError;
    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

    this.saving.set(true);
    try {
      const [year, month] = this.newSlotMonth.split('-').map(Number);
      if (this.newSlotDays.length > 1) {
        await this.planService.createSeries({
          goal_id: Number(this.newSlot.goal_id),
          year,
          month,
          days: this.newSlotDays,
          planned_time: this.newSlot.planned_time || undefined,
          duration_minutes: this.newSlot.duration_minutes,
          note: this.newSlot.note || undefined,
        });
      } else {
        await this.planService.create({
          goal_id: Number(this.newSlot.goal_id),
          year,
          month,
          day: this.newSlotDays[0] ?? undefined,
          planned_time: this.newSlot.planned_time || undefined,
          duration_minutes: this.newSlot.duration_minutes,
          note: this.newSlot.note || undefined,
        });
      }
      this.newSlot = { goal_id: 0, planned_time: '', duration_minutes: 60, note: '' };
      this.newSlotDays = [];
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
    await this.loadProposal();
  }

  /** Gruppiert die geladenen Slots nach Lernziel, aufsteigend nach Zieltitel sortiert;
   *  innerhalb einer Gruppe bleibt die von der API gelieferte Datumsreihenfolge erhalten. */
  groupedSlots(): { goal_id: number; title: string; module_name: string; totalMinutes: number; slots: PlanSlot[] }[] {
    const byGoal = new Map<number, PlanSlot[]>();
    for (const slot of this.slots()) {
      const list = byGoal.get(slot.goal_id);
      if (list) {
        list.push(slot);
      } else {
        byGoal.set(slot.goal_id, [slot]);
      }
    }
    const groups = Array.from(byGoal.entries()).map(([goalId, slotsForGoal]) => {
      const goal = this.goals().find(g => g.id === goalId);
      return {
        goal_id: goalId,
        title: goal?.title ?? `Ziel ${goalId}`,
        module_name: goal?.module_name ?? '',
        totalMinutes: slotsForGoal.reduce((sum, s) => sum + s.duration_minutes, 0),
        slots: slotsForGoal,
      };
    });
    return groups.sort((a, b) => a.title.localeCompare(b.title, 'de'));
  }

  /** Beschriftung fuer eine geplante Lernzeit, z. B. "15. Aug 2026" oder "Aug 2026". */
  slotDate(slot: PlanSlot): string {
    const monat = MONTH_NAMES[slot.month - 1] ?? String(slot.month);
    return slot.day ? `${slot.day}. ${monat} ${slot.year}` : `${monat} ${slot.year}`;
  }

  /** Der Monat, fuer den Zwischenziele angezeigt und angelegt werden.
   *  Steht der Filter auf "Alle Monate", gilt der Monat des Anlegeformulars. */
  private activeYearMonth(): { year: number; month: number } {
    const key = this.selectedMonth || this.newSlotMonth;
    const [year, month] = key.split('-').map(Number);
    return { year, month };
  }

  milestoneMonthLabel(): string {
    const { year, month } = this.activeYearMonth();
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  doneCount(): number {
    return this.milestones().filter(m => m.done).length;
  }

  /** Laedt den Grobplanungs-Vorschlag fuer den aktiven Monat (FR-2.1, FR-2.2, FR-3.3). */
  async loadProposal(): Promise<void> {
    const { year, month } = this.activeYearMonth();
    const proposal = await this.planService.proposal(year, month);
    this.proposalGoals.set(proposal.goals);
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  /** Abweichung geplant gegen Vorschlag, als lesbarer Text (FR-3.3). */
  deviationLabel(p: PlanProposalGoal): string {
    if (p.deviation_minutes < 0) return `${this.formatMinutes(-p.deviation_minutes)} fehlen`;
    if (p.deviation_minutes === 0) return 'passt genau';
    return `${this.formatMinutes(p.deviation_minutes)} mehr geplant`;
  }

  async loadMilestones(): Promise<void> {
    const { year, month } = this.activeYearMonth();
    this.milestones.set(await this.milestoneService.list({ year, month }));
  }

  async addMilestone(): Promise<void> {
    this.milestoneError.set('');
    const title = this.newMilestoneTitle.trim();
    if (!title) {
      this.milestoneError.set('Bitte einen Titel angeben.');
      return;
    }
    if (title.length > 200) {
      this.milestoneError.set('Titel darf höchstens 200 Zeichen lang sein.');
      return;
    }
    const { year, month } = this.activeYearMonth();
    const dayError = validateDayOfMonth(this.newMilestoneDay, year, month);
    if (dayError) {
      this.milestoneError.set(dayError);
      return;
    }
    try {
      const created = await this.milestoneService.create({
        title,
        year,
        month,
        due_day: this.newMilestoneDay ?? null,
      });
      this.milestones.update(ms => [...ms, created]);
      this.newMilestoneTitle = '';
      this.newMilestoneDay = null;
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
      this.milestoneError.set(msg ?? 'Fehler beim Speichern.');
    }
  }

  async toggleMilestone(milestone: Milestone): Promise<void> {
    const updated = await this.milestoneService.update(milestone.id, { done: !milestone.done });
    this.milestones.update(ms => ms.map(m => (m.id === milestone.id ? updated : m)));
  }

  async removeMilestone(milestone: Milestone): Promise<void> {
    await this.milestoneService.delete(milestone.id);
    this.milestones.update(ms => ms.filter(m => m.id !== milestone.id));
  }
}

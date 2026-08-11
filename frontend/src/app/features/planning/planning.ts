import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Goal, PlanSlot } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { PlanService } from '../../core/services/plan.service';

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
            <label>Lernziel</label>
            <select [(ngModel)]="selectedGoalId" name="goal" (change)="loadSlots()">
              <option [value]="0">Alle Ziele</option>
              @for (goal of goals(); track goal.id) {
                <option [value]="goal.id">{{ goal.title }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Monat</label>
            <select [(ngModel)]="selectedMonth" name="month" (change)="loadSlots()">
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
              <label>Lernziel *</label>
              <select [(ngModel)]="newSlot.goal_id" name="slot_goal" required>
                <option [value]="0" disabled>Ziel wählen</option>
                @for (goal of goals(); track goal.id) {
                  <option [value]="goal.id">{{ goal.title }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Tag des Monats (optional)</label>
              <input type="number" [(ngModel)]="newSlot.day" name="day" min="1" max="31" placeholder="z.B. 15" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Uhrzeit (optional)</label>
              <input type="time" [(ngModel)]="newSlot.planned_time" name="time" />
            </div>
            <div class="form-group">
              <label>Wie lange? (Minuten)</label>
              <input type="number" [(ngModel)]="newSlot.duration_minutes" name="duration" min="5" max="480" />
            </div>
          </div>
          <div class="form-group">
            <label>Notiz (optional)</label>
            <input [(ngModel)]="newSlot.note" name="note" placeholder="z.B. Kapitel 3 lesen" />
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
          <p class="empty">Für diesen Monat noch nichts geplant.</p>
        } @else {
          @for (slot of slots(); track slot.id) {
            <div class="card slot-card">
              <div class="slot-header">
                <span>{{ goalName(slot.goal_id) }}</span>
                <span class="slot-duration">{{ slot.duration_minutes }} min</span>
              </div>
              <div class="slot-meta">
                @if (slot.day) { <span>📆 Am {{ slot.day }}.</span> }
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

  selectedGoalId = 0;
  selectedMonth: string;

  newSlot = {
    goal_id: 0,
    day: null as number | null,
    planned_time: '',
    duration_minutes: 60,
    note: '',
  };

  constructor() {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const filters: any = { year, month };
      if (this.selectedGoalId) filters.goal_id = this.selectedGoalId;
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
    this.saving.set(true);
    try {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const slot = await this.planService.create({
        goal_id: this.newSlot.goal_id,
        year,
        month,
        day: this.newSlot.day || undefined,
        planned_time: this.newSlot.planned_time || undefined,
        duration_minutes: this.newSlot.duration_minutes,
        note: this.newSlot.note || undefined,
      });
      this.slots.update(ss => [...ss, slot]);
      this.newSlot = { goal_id: 0, day: null, planned_time: '', duration_minutes: 60, note: '' };
    } catch (err: any) {
      this.createError.set(err?.error?.error ?? 'Fehler beim Speichern.');
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
}

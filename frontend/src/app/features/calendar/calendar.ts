import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Goal, Milestone, PlanSlot } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { PlanService } from '../../core/services/plan.service';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WEEKDAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

@Component({
  selector: 'app-calendar',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h2>Kalender</h2>

      <div class="calendar-header">
        <button type="button" class="btn btn-sm btn-secondary" (click)="prevMonth()" aria-label="Vorheriger Monat">‹</button>
        <h3 class="calendar-title">{{ monthLabel() }}</h3>
        <button type="button" class="btn btn-sm btn-secondary" (click)="nextMonth()" aria-label="Nächster Monat">›</button>
      </div>

      @if (loading()) {
        <p class="loading">Lädt…</p>
      }

      <div class="card calendar-unscheduled">
        <h3>Ohne festen Tag</h3>
        @if (monthSlots().length === 0) {
          <p class="empty">Alle Lernzeiten dieses Monats haben einen festen Tag.</p>
        } @else {
          @for (slot of monthSlots(); track slot.id) {
            <a routerLink="/planning" class="calendar-entry calendar-entry-slot">
              {{ goalTitle(slot.goal_id) }}, {{ slot.duration_minutes }} min
            </a>
          }
        }
      </div>

      <div class="calendar-grid">
        <div class="calendar-weekdays">
          @for (name of weekdayNames; track name) {
            <div class="calendar-weekday">{{ name }}</div>
          }
        </div>
        <div class="calendar-days">
          @for (i of leadingCells(); track i) {
            <div class="calendar-cell calendar-cell-empty"></div>
          }
          @for (day of days(); track day) {
            <div class="calendar-cell" [class.calendar-today]="isToday(day)">
              <div class="calendar-day-number">{{ day }}</div>

              @for (goal of goalsByDay().get(day) ?? []; track goal.id) {
                <a routerLink="/goals" class="calendar-entry calendar-entry-goal"
                  [class.calendar-goal-achieved]="goal.status === 'achieved'">
                  🎯 {{ goal.title }}
                  @if (goal.status === 'achieved') { ✓ }
                </a>
              }

              @for (slot of slotsByDay().get(day) ?? []; track slot.id) {
                <a routerLink="/planning" class="calendar-entry calendar-entry-slot">
                  @if (slot.planned_time) { {{ slot.planned_time }} }
                  {{ goalTitle(slot.goal_id) }}, {{ slot.duration_minutes }} min
                </a>
              }

              @for (milestone of milestonesByDay().get(day) ?? []; track milestone.id) {
                <div class="calendar-entry calendar-entry-milestone">
                  {{ milestone.done ? '✓' : '◧' }} {{ milestone.title }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private planService = inject(PlanService);
  private milestoneService = inject(MilestoneService);
  private goalService = inject(GoalService);

  weekdayNames = WEEKDAY_NAMES;

  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth() + 1);

  slots = signal<PlanSlot[]>([]);
  milestones = signal<Milestone[]>([]);
  goals = signal<Goal[]>([]);
  loading = signal(false);

  monthLabel = computed(() => `${MONTH_NAMES[this.viewMonth() - 1]} ${this.viewYear()}`);

  /** Anzahl fuehrender Leerzellen vor dem 1. des Monats; Montag ist die erste Spalte. */
  leadingBlanks = computed(() => (new Date(this.viewYear(), this.viewMonth() - 1, 1).getDay() + 6) % 7);
  leadingCells = computed(() => Array.from({ length: this.leadingBlanks() }, (_, i) => i));

  daysInMonth = computed(() => new Date(this.viewYear(), this.viewMonth(), 0).getDate());
  days = computed(() => Array.from({ length: this.daysInMonth() }, (_, i) => i + 1));

  /** Slots mit gesetztem Tag, gruppiert nach Tag des angezeigten Monats. */
  slotsByDay = computed(() => {
    const map = new Map<number, PlanSlot[]>();
    for (const slot of this.slots()) {
      if (slot.day === null) continue;
      const list = map.get(slot.day) ?? [];
      list.push(slot);
      map.set(slot.day, list);
    }
    return map;
  });

  /** Slots des Monats ohne festen Tag ("Ohne festen Tag"-Zeile). */
  monthSlots = computed(() => this.slots().filter((slot) => slot.day === null));

  /** Zwischenziele mit gesetztem Faelligkeitstag, gruppiert nach Tag. */
  milestonesByDay = computed(() => {
    const map = new Map<number, Milestone[]>();
    for (const milestone of this.milestones()) {
      if (milestone.due_day === null) continue;
      const list = map.get(milestone.due_day) ?? [];
      list.push(milestone);
      map.set(milestone.due_day, list);
    }
    return map;
  });

  /** Lernziele, deren Zieldatum in den angezeigten Monat faellt, gruppiert nach Tag. */
  goalsByDay = computed(() => {
    const map = new Map<number, Goal[]>();
    for (const goal of this.goals()) {
      const [year, month, day] = goal.target_date.split('-').map(Number);
      if (year !== this.viewYear() || month !== this.viewMonth()) continue;
      const list = map.get(day) ?? [];
      list.push(goal);
      map.set(day, list);
    }
    return map;
  });

  async ngOnInit(): Promise<void> {
    this.goals.set(await this.goalService.list());
    await this.loadMonth();
  }

  /** Laedt Slots und Zwischenziele des angezeigten Monats parallel neu. */
  async loadMonth(): Promise<void> {
    this.loading.set(true);
    try {
      const [slots, milestones] = await Promise.all([
        this.planService.list({ year: this.viewYear(), month: this.viewMonth() }),
        this.milestoneService.list({ year: this.viewYear(), month: this.viewMonth() }),
      ]);
      this.slots.set(slots);
      this.milestones.set(milestones);
    } finally {
      this.loading.set(false);
    }
  }

  async prevMonth(): Promise<void> {
    if (this.viewMonth() === 1) {
      this.viewMonth.set(12);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
    await this.loadMonth();
  }

  async nextMonth(): Promise<void> {
    if (this.viewMonth() === 12) {
      this.viewMonth.set(1);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
    await this.loadMonth();
  }

  isToday(day: number): boolean {
    const now = new Date();
    return (
      now.getFullYear() === this.viewYear() &&
      now.getMonth() + 1 === this.viewMonth() &&
      now.getDate() === day
    );
  }

  /** Loest den Zieltitel eines Slots auf (wie goalName in planning.ts). */
  goalTitle(goalId: number): string {
    return this.goals().find((g) => g.id === goalId)?.title ?? `Ziel ${goalId}`;
  }
}
